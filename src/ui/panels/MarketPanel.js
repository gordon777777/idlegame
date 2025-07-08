import BasePanel from './BasePanel.js';
import Button from '../Button.js';
import MarketResourcePanel from './MarketResourcePanel.js';

/**
 * 市场面板
 * 显示市场统计和交易入口
 */
export default class MarketPanel extends BasePanel {
  /**
   * 创建市场面板
   * @param {Phaser.Scene} scene - 场景对象
   * @param {Object} config - 配置对象
   */
  constructor(scene, config = {}) {
    // 调用父类构造函数
    super(scene, config.x || 400, config.y || 300, {
      width: 750,
      height: 550,
      title: '市场统计',
      onClose: () => this.hide(),
      autoLayout: false // MarketPanel有复杂的多列布局
    });

    // 保存配置
    this.config = config;

    // 分頁相關屬性
    this.currentPage = 0;
    this.itemsPerPage = 30; // 每頁顯示30個項目（2列 × 15行）
    this.totalPages = 0;

    // 创建面板内容
    this.createContent();
  }

  /**
   * 创建面板内容
   */
  createContent() {
    // 清除現有內容
    if (this.priceElements) {
      this.priceElements.forEach(element => {
        if (element.destroy) element.destroy();
      });
    }

    // 获取市场统计
    const marketStats = this.scene.marketSystem.getMarketStats();

    // 獲取所有資源價格並計算總頁數
    const allPrices = Object.entries(marketStats.prices);
    this.totalPages = Math.ceil(allPrices.length / this.itemsPerPage);

    // 確保當前頁數在有效範圍內
    if (this.currentPage >= this.totalPages) {
      this.currentPage = Math.max(0, this.totalPages - 1);
    }

    // 添加资源价格列表
    this.priceElements = [];
    let yPos = -180;
    let xPos = -350;
    let itemCount = 0;
    const maxItemsPerColumn = 15; // 每列項目數量
    const columnWidth = 180; // 列寬

    // 添加市场价格标题
    const priceTitle = this.scene.add.text(-350, -210, `资源价格 (第${this.currentPage + 1}/${this.totalPages}页)`, {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.priceElements.push(priceTitle);

    // 計算當前頁要顯示的資源
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, allPrices.length);
    const currentPagePrices = allPrices.slice(startIndex, endIndex);

    for (const [resourceType, price] of currentPagePrices) {
      // 获取资源数据
      const resourceData = this.scene.resources.resources[resourceType] || {};
      const displayName = resourceData.displayName || resourceType;

      // 创建资源价格文本
      const priceText = this.scene.add.text(xPos, yPos, `${displayName}: ${price.currentPrice.toFixed(2)} 金币`, {
        fontSize: '14px',
        fill: '#cccccc'
      }).setOrigin(0, 0.5);

      this.priceElements.push(priceText);
      yPos += 25;
      itemCount++;

      // 每列最多显示15个资源，然后换列
      if (itemCount >= maxItemsPerColumn) {
        yPos = -180;
        xPos += columnWidth;
        itemCount = 0;
      }
    }

    // 添加分頁按鈕
    this.createPaginationButtons();

    // 计算交易统计区域的X位置（在价格列表右侧）
    const statsXPos = Math.max(xPos + 80, 150); // 确保在价格列表右侧至少80像素，但不超过面板边界

    // 添加交易统计标题
    const transactionTitle = this.scene.add.text(statsXPos, -210, '交易统计', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // 添加交易资源按钮（合并买卖功能）
    const tradeBtn = new Button(this.scene, statsXPos + 80, -160, '交易资源', {
      width: 100,
      height: 30,
      backgroundColor: 0x4a6a6a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.showMarketResourcePanel()
    });

    this.priceElements.push(transactionTitle, ...tradeBtn.getElements());

    // 添加交易统计信息
    const totalTransactions = marketStats.totalTransactions || 0;
    const totalVolume = marketStats.totalVolume || 0;
    const playerTax = marketStats.playerTax || 0;

    const statsTexts = [
      `总交易次数: ${totalTransactions}`,
      `总交易量: ${totalVolume}`,
      `本月税收: ${playerTax.toFixed(2)} 金币`
    ];

    let statsYPos = -120;
    statsTexts.forEach(text => {
      const statsText = this.scene.add.text(statsXPos, statsYPos, text, {
        fontSize: '14px',
        fill: '#cccccc'
      }).setOrigin(0, 0.5);

      this.priceElements.push(statsText);
      statsYPos += 30;
    });

    // 添加所有元素到面板
    this.add(this.priceElements);
  }

  /**
   * 創建分頁按鈕
   */
  createPaginationButtons() {
    // 清除現有的分頁按鈕
    if (this.paginationButtons) {
      this.paginationButtons.forEach(button => {
        if (button.destroy) button.destroy();
      });
    }

    this.paginationButtons = [];

    // 上一頁按鈕
    const prevBtn = new Button(this.scene, -100, 200, '上一頁', {
      width: 80,
      height: 30,
      backgroundColor: this.currentPage > 0 ? 0x4a6a4a : 0x666666,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.previousPage()
    });

    // 下一頁按鈕
    const nextBtn = new Button(this.scene, 20, 200, '下一頁', {
      width: 80,
      height: 30,
      backgroundColor: this.currentPage < this.totalPages - 1 ? 0x4a6a4a : 0x666666,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.nextPage()
    });

    // 頁數顯示
    const pageInfo = this.scene.add.text(0, 170, `第 ${this.currentPage + 1} / ${this.totalPages} 頁`, {
      fontSize: '14px',
      fill: '#cccccc'
    }).setOrigin(0.5, 0.5);

    this.paginationButtons.push(...prevBtn.getElements(), ...nextBtn.getElements(), pageInfo);
    this.add(this.paginationButtons);
  }

  /**
   * 上一頁
   */
  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.createContent();
    }
  }

  /**
   * 下一頁
   */
  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.createContent();
    }
  }

  /**
   * 显示市场资源交易面板
   */
  showMarketResourcePanel() {
    // 创建市场资源交易面板
    new MarketResourcePanel(this.scene).show();
  }

  /**
   * 更新面板内容
   */
  update() {
    // 销毁旧面板并创建新面板
    this.destroy();

    // 重新创建面板
    const panel = new MarketPanel(this.scene, {
      x: this.x,
      y: this.y
    });

    // 显示面板
    panel.show();

    // 返回新面板
    return panel;
  }
}
