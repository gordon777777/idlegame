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
      width: 700,
      height: 550,
      title: '市场统计',
      onClose: () => this.hide(),
      autoLayout: false // MarketPanel有复杂的多列布局
    });

    // 保存配置
    this.config = config;

    // 创建面板内容
    this.createContent();
  }

  /**
   * 创建面板内容
   */
  createContent() {
    // 获取市场统计
    const marketStats = this.scene.marketSystem.getMarketStats();

    // 添加资源价格列表
    const priceElements = [];
    let yPos = -180;

    // 添加市场价格标题
    const priceTitle = this.scene.add.text(-330, -210, '资源价格', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    priceElements.push(priceTitle);

    // 添加资源价格列表
    for (const [resourceType, price] of Object.entries(marketStats.prices)) {
      // 获取资源数据
      const resourceData = this.scene.resources.resources[resourceType] || {};
      const displayName = resourceData.displayName || resourceType;

      // 创建资源价格文本
      const priceText = this.scene.add.text(-330, yPos, `${displayName}: ${price.currentPrice.toFixed(2)} 金币`, {
        fontSize: '14px',
        fill: '#cccccc'
      }).setOrigin(0, 0.5);

      priceElements.push(priceText);
      yPos += 25;

      // 每列最多显示10个资源，然后换列
      if (priceElements.length % 11 === 0) {
        yPos = -180;
      }
    }

    // 添加交易统计标题
    const transactionTitle = this.scene.add.text(50, -210, '交易统计', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // 添加交易资源按钮（合并买卖功能）
    const tradeBtn = new Button(this.scene, 200, -160, '交易资源', {
      width: 120,
      height: 30,
      backgroundColor: 0x4a6a6a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.showMarketResourcePanel()
    });

    priceElements.push(transactionTitle, ...tradeBtn.getElements());

    // 添加交易统计信息
    const totalTransactions = marketStats.totalTransactions || 0;
    const totalVolume = marketStats.totalVolume || 0;
    const playerTax = marketStats.playerTax || 0;

    const statsTexts = [
      `总交易次数: ${totalTransactions}`,
      `总交易量: ${totalVolume}`,
      `本月税收: ${playerTax.toFixed(2)} 金币`
    ];

    yPos = -120;
    statsTexts.forEach(text => {
      const statsText = this.scene.add.text(50, yPos, text, {
        fontSize: '14px',
        fill: '#cccccc'
      }).setOrigin(0, 0.5);

      priceElements.push(statsText);
      yPos += 30;
    });

    // 添加所有元素到面板
    this.add(priceElements);
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
