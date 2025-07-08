import BasePanel from './BasePanel.js';
import Button from '../Button.js';
import TabButton from '../TabButton.js';
import TradeButton from '../TradeButton.js';

/**
 * 市场资源交易面板
 * 用于买卖资源
 */
export default class MarketResourcePanel extends BasePanel {
  /**
   * 创建市场资源交易面板
   * @param {Phaser.Scene} scene - 场景对象
   * @param {Object} config - 配置对象
   */
  constructor(scene, config = {}) {
    // 获取屏幕中心位置
    const centerX = scene.scale.width / 2;
    const centerY = scene.scale.height / 2;

    // 调用父类构造函数
    super(scene, centerX, centerY, {
      width: 600,
      height: 500,
      title: '市场资源交易',
      onClose: () => {
        // 清理事件监听器
        if (this.isResourceDragging) {
          this.isResourceDragging = false;
          this.scene.input.off('pointermove', this.handleResourcePanelDrag, this);
        }
        this.destroy();
      },
      autoLayout: false // MarketResourcePanel有复杂的标签页和网格布局
    });

    // 保存配置
    this.config = config;

    // 交易相关变量
    this.selectedResource = null;
    this.selectedAmount = 0;
    this.tradeMode = null;

    // 创建面板内容
    this.createContent();

    // 设置面板深度，确保在最上层
    this.container.setDepth(100);
  }

  /**
   * 创建面板内容
   */
  createContent() {
    // 获取资源列表和市场统计
    const resources = this.scene.resources.resources;
    const marketStats = this.scene.marketSystem.getMarketStats();
    const playerGold = this.scene.playerGold || 0;

    // 添加说明文字
    const infoText = this.scene.add.text(0, -190, '选择资源并选择买入或卖出操作\n大量交易会影响市场价格', {
      fontSize: '14px',
      fill: '#cccccc',
      align: 'center'
    }).setOrigin(0.5, 0);

    // 添加金币显示
    this.goldText = this.scene.add.text(0, -160, `目前拥有金币: ${Math.floor(playerGold)}`, {
      fontSize: '16px',
      fill: '#ffdd00',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 创建标签页
    this.createTabs();

    // 添加数量输入框
    this.createAmountInput();

    // 添加预览区域
    this.createPreviewArea();

    // 添加确认交易按钮
    this.createTradeButton();

    // 添加元素到面板
    this.add([infoText, this.goldText]);
  }

  /**
   * 创建标签页
   */
  createTabs() {
    // 定义标签页
    const tabHeight = 30;
    const tabWidth = 100;
    const tabY = -120;
    const tabs = [
      { id: 'all', name: '全部', x: -250, color: 0x4a6a4a },
      { id: '1', name: '一级', x: -150, color: 0x6a4a4a },
      { id: '2', name: '二级', x: -50, color: 0x4a6a6a },
      { id: '3', name: '三级', x: 50, color: 0x6a4a8a },
      { id: '4', name: '四级', x: 150, color: 0x8a4a6a }
    ];

    // 创建标签页状态
    this.activeTab = 'all';
    this.tabButtons = [];

    // 创建资源容器 - 使用相对于面板的坐标
    this.resourceContainer = this.scene.add.container(0, -80);
    this.add(this.resourceContainer);

    // 创建标签页按钮
    tabs.forEach(tab => {
      // 创建标签页按钮
      const tabBtn = new TabButton(this.scene, tab.x, tabY, tab.name, {
        id: tab.id,
        width: tabWidth,
        height: tabHeight,
        backgroundColor: 0x2d2d2d,
        activeColor: tab.color,
        isActive: tab.id === this.activeTab,
        onClick: (id) => {
          // 切换标签页
          this.activeTab = id;

          // 更新标签页外观
          this.tabButtons.forEach((btn) => {
            btn.setActive(btn.getId() === this.activeTab);
          });

          // 过滤资源
          this.filterResources(id);
        }
      });

      this.tabButtons.push(tabBtn);

      // 添加按钮元素到面板
      this.add(tabBtn.getElements());
    });

    // 初始显示所有资源
    this.filterResources('all');
  }

  /**
   * 过滤资源
   * @param {string} selectedTier - 选择的资源层级
   */
  filterResources(selectedTier) {
    // 获取资源和市场数据
    const resources = this.scene.resources.resources;
    const marketStats = this.scene.marketSystem.getExtendedMarketStats();

    // 市場資源過濾
    console.log('Filtering market resources - tier:', selectedTier, 'resources:', Object.keys(resources).length, 'prices:', Object.keys(marketStats.prices).length, 'resource values:', Object.keys(marketStats.resourceValuePrices || {}).length);

    // 清空资源容器 - 确保所有子元素都被正确移除
    this.resourceContainer.removeAll(true); // 第二个参数为true表示销毁子元素

    // 计算面板内容区域的边界
    const panelWidth = this.width;
    const panelHeight = this.height;
    const contentStartY = 0; // 相对于resourceContainer的起始Y位置
    const contentMaxHeight = 280; // 最大内容高度，留出底部按钮空间

    // 布局参数
    let yPos = contentStartY;
    let xPos = -panelWidth/2 + 60; // 从面板左边开始，留出边距
    let itemsPerRow = 5;
    let itemWidth = 100;
    let itemHeight = 60;
    let itemCount = 0;

    // 遍历资源并根据选择的层级过滤
    for (const [resourceType, resourceData] of Object.entries(resources)) {
      const tier = resourceData.tier || 1;

      // 如果选择了特定层级且不匹配，则跳过
      if (selectedTier !== 'all' && tier !== parseInt(selectedTier)) {
        continue;
      }

      // 只显示有市场价格的资源
      if (!marketStats.prices[resourceType]) {
        continue;
      }

      // 计算位置 - 确保不超出面板边界
      if (itemCount > 0 && itemCount % itemsPerRow === 0) {
        yPos += itemHeight;
        xPos = -panelWidth/2 + 60;

        // 检查是否超出内容区域高度
        if (yPos > contentMaxHeight) {
          console.warn('Market panel content exceeds maximum height, some items may not be visible');
          break;
        }
      }

      // 创建资源显示元素
      const resourceUI = this.createResourceListItem(resourceType, resourceData, marketStats, xPos, yPos);
      this.resourceContainer.add(resourceUI);

      xPos += itemWidth;
      itemCount++;
    }

    // 添加資源值 (happiness, transport, security, health)
    if (marketStats.resourceValuePrices) {
      for (const [resourceValueType, priceData] of Object.entries(marketStats.resourceValuePrices)) {
        const tier = priceData.tier || 2;

        // 如果选择了特定层级且不匹配，则跳过
        if (selectedTier !== 'all' && tier !== parseInt(selectedTier)) {
          continue;
        }

        // 计算位置 - 确保不超出面板边界
        if (itemCount > 0 && itemCount % itemsPerRow === 0) {
          yPos += itemHeight;
          xPos = -panelWidth/2 + 60;

          // 检查是否超出内容区域高度
          if (yPos > contentMaxHeight) {
            console.warn('Market panel content exceeds maximum height, some items may not be visible');
            break;
          }
        }

        // 创建资源值显示元素
        const resourceValueUI = this.createResourceValueListItem(resourceValueType, priceData, xPos, yPos);
        this.resourceContainer.add(resourceValueUI);

        xPos += itemWidth;
        itemCount++;
      }
    }
  }

  /**
   * 创建资源列表项
   * @param {string} resourceType - 资源类型
   * @param {Object} resourceData - 资源数据
   * @param {Object} marketStats - 市场统计
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @returns {Phaser.GameObjects.Container} - 资源列表项容器
   */
  createResourceListItem(resourceType, resourceData, marketStats, x, y) {
    // 创建资源容器
    const container = this.scene.add.container(x, y);

    // 获取资源名称和价格
    const displayName = resourceData.displayName || resourceType;
    const price = marketStats.prices[resourceType] || 0;
    const playerAmount = Math.floor(resourceData.value || 0);

    // 创建资源图标背景
    const iconBg = this.scene.add.rectangle(0, 0, 80, 50, 0x333333)
      .setStrokeStyle(1, 0x555555);

    // 创建资源名称
    const nameText = this.scene.add.text(0, -15, displayName, {
      fontSize: '12px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 创建资源价格
    const priceText = this.scene.add.text(0, 0, `价格: ${price.currentPrice.toFixed(2)}`, {
      fontSize: '10px',
      fill: '#ffdd00'
    }).setOrigin(0.5, 0.5);

    // 创建玩家拥有量
    const amountText = this.scene.add.text(0, 15, `拥有: ${playerAmount}`, {
      fontSize: '10px',
      fill: '#cccccc'
    }).setOrigin(0.5, 0.5);

    // 创建买入按钮
    const buyBtn = new TradeButton(this.scene, -20, 30, '买', {
      resourceType: resourceType,
      tradeMode: 'buy',
      width: 30,
      height: 20,
      onClick: (type, mode) => this.selectResource(type, mode)
    });

    // 创建卖出按钮
    const sellBtn = new TradeButton(this.scene, 20, 30, '卖', {
      resourceType: resourceType,
      tradeMode: 'sell',
      width: 30,
      height: 20,
      onClick: (type, mode) => this.selectResource(type, mode)
    });

    // 添加元素到容器
    container.add([iconBg, nameText, priceText, amountText, ...buyBtn.getElements(), ...sellBtn.getElements()]);

    // 设置容器为可交互
    iconBg.setInteractive()
      .on('pointerdown', () => {
        this.selectResource(resourceType);
      });

    return container;
  }

  /**
   * 创建数量输入框
   */
  createAmountInput() {
    // 添加数量输入框
    const amountLabel = this.scene.add.text(-100, 120, '交易数量:', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);

    // 创建输入框背景
    const amountInput = this.scene.add.rectangle(0, 120, 120, 30, 0x333333)
      .setStrokeStyle(1, 0x555555)
      .setInteractive()
      .on('pointerdown', () => {
        // 使用浏览器原生的prompt弹出输入框
        const inputValue = prompt('请输入交易数量:', this.selectedAmount.toString());

        // 处理输入结果
        if (inputValue !== null) {
          const amount = parseInt(inputValue);
          if (!isNaN(amount) && amount >= 0) {
            this.selectedAmount = amount;
            this.amountText.setText(amount.toString());
            this.updatePreview();
          }
        }
      });

    // 创建数量文本
    this.amountText = this.scene.add.text(0, 120, '0', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 创建快速选择按钮
    const quickButtons = [];
    const amounts = [10, 50, 100, 'Max'];

    amounts.forEach((amount, index) => {
      const x = 100 + index * 40;
      const btn = new Button(this.scene, x, 120, amount.toString(), {
        width: 35,
        height: 25,
        backgroundColor: 0x4a4a4a,
        fontSize: '12px',
        textColor: '#ffffff',
        onClick: () => {
          if (amount === 'Max') {
            // 设置最大可交易量
            if (this.selectedResource && this.tradeMode) {
              let maxAmount = 0;

              if (this.tradeMode === 'sell') {
                // 最大可卖出量为玩家拥有的资源量
                const resourceData = this.scene.resources.resources[this.selectedResource];
                maxAmount = Math.floor(resourceData.value || 0);
              } else if (this.tradeMode === 'buy') {
                // 最大可买入量基于玩家金币和资源价格
                const price = this.scene.marketSystem.getMarketStats().prices[this.selectedResource] || 0;
                if (price > 0) {
                  maxAmount = Math.floor(this.scene.playerGold / price);
                }
              }

              this.selectedAmount = maxAmount;
              this.amountText.setText(maxAmount.toString());
              this.updatePreview();
            }
          } else {
            // 设置固定数量
            this.selectedAmount = amount;
            this.amountText.setText(amount.toString());
            this.updatePreview();
          }
        }
      });

      quickButtons.push(...btn.getElements());
    });

    // 添加元素到面板
    this.add([amountLabel, amountInput, this.amountText, ...quickButtons]);
  }

  /**
   * 创建预览区域
   */
  createPreviewArea() {
    // 创建预览背景
    const previewBackground = this.scene.add.rectangle(0, 160, 400, 60, 0x333333)
      .setStrokeStyle(1, 0x555555);

    // 创建预览文本
    this.previewText = this.scene.add.text(0, 160, '选择资源和交易模式以查看预览', {
      fontSize: '14px',
      fill: '#cccccc',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    // 添加元素到面板
    this.add([previewBackground, this.previewText]);
  }

  /**
   * 创建交易按钮
   */
  createTradeButton() {
    // 添加确认交易按钮
    const tradeConfirmBtn = new Button(this.scene, 0, 200, '确认交易', {
      width: 120,
      height: 30,
      backgroundColor: 0x6a4a6a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.confirmTrade()
    });

    // 添加按钮到面板
    this.add(tradeConfirmBtn.getElements());
  }

  /**
   * 选择资源
   * @param {string} resourceType - 资源类型
   * @param {string} tradeMode - 交易模式
   */
  selectResource(resourceType, tradeMode) {
    this.selectedResource = resourceType;

    if (tradeMode) {
      this.tradeMode = tradeMode;
    }

    // 更新预览
    this.updatePreview();
  }

  /**
   * 选择资源值
   * @param {string} resourceValueType - 资源值类型
   * @param {string} tradeMode - 交易模式
   */
  selectResourceValue(resourceValueType, tradeMode) {
    this.selectedResource = resourceValueType;

    if (tradeMode) {
      this.tradeMode = tradeMode;
    }

    // 更新预览
    this.updatePreview();
  }

  /**
   * 更新预览
   */
  updatePreview() {
    if (!this.selectedResource || !this.tradeMode || this.selectedAmount <= 0) {
      this.previewText.setText('选择资源和交易模式，并输入有效数量');
      return;
    }

    const resourceData = this.scene.resources.resources[this.selectedResource];
    const marketStats = this.scene.marketSystem.getMarketStats();
    const priceInfo = marketStats.prices[this.selectedResource];

    if (!priceInfo) {
      this.previewText.setText('该资源暂无市场价格');
      return;
    }

    if (this.tradeMode === 'sell') {
      // 计算卖出价格和总收益
      const actualPrice = this.scene.marketSystem.calculateSellPrice(
        this.selectedResource,
        this.selectedAmount,
        priceInfo
      );

      const totalEarnings = Math.floor(actualPrice * this.selectedAmount);

      // 显示预览信息
      this.previewText.setText(
        `卖出 ${this.selectedAmount} 个 ${resourceData.displayName || this.selectedResource}\n` +
        `单价: ${actualPrice.toFixed(2)} (原价: ${priceInfo.toFixed(2)})\n` +
        `预计收益: ${totalEarnings} 金币`
      );
    } else if (this.tradeMode === 'buy') {
      // 计算买入价格和总成本
      const actualPrice = this.scene.marketSystem.calculateBuyPrice(
        this.selectedResource,
        this.selectedAmount,
        priceInfo
      );

      const totalCost = Math.ceil(actualPrice * this.selectedAmount);

      // 显示预览信息
      this.previewText.setText(
        `购买 ${this.selectedAmount} 个 ${resourceData.displayName || this.selectedResource}\n` +
        `单价: ${actualPrice.toFixed(2)} (原价: ${priceInfo.currentPrice.toFixed(2)})\n` +
        `预计成本: ${totalCost} 金币`
      );
    }
  }

  /**
   * 确认交易
   */
  confirmTrade() {
    if (this.selectedResource && this.selectedAmount > 0 && this.tradeMode) {
      let result;

      if (this.tradeMode === 'sell') {
        // 执行出售操作
        result = this.scene.marketSystem.playerSellResource(
          this.selectedResource,
          this.selectedAmount,
          this.scene.resources
        );
      } else if (this.tradeMode === 'buy') {
        // 执行购买操作
        result = this.scene.marketSystem.playerBuyResource(
          this.selectedResource,
          this.selectedAmount,
          this.scene.resources,
          this.scene.playerGold
        );

        // 更新金币显示
        if (result.success) {
          this.scene.playerGold = result.remainingGold;
          this.goldText.setText(`目前拥有金币: ${Math.floor(this.scene.playerGold)}`);
        }
      }

      // 显示结果
      this.previewText.setText(result.message);

      if (result.success) {
        // 重置选择
        this.selectedResource = null;
        this.selectedAmount = 0;
        this.tradeMode = null;
        this.amountText.setText('0');

        // 更新资源显示
        this.scene.uiManager.updateResources(this.scene.resources.resources);

        // 重新渲染资源列表
        setTimeout(() => {
          this.filterResources(this.activeTab);
        }, 500);
      }
    } else {
      this.previewText.setText('请选择资源、交易模式并输入有效数量');
    }
  }

  /**
   * 创建资源值列表项
   * @param {string} resourceValueType - 资源值类型
   * @param {Object} priceData - 价格数据
   * @param {number} xPos - X位置
   * @param {number} yPos - Y位置
   * @returns {Array} - UI元素数组
   */
  createResourceValueListItem(resourceValueType, priceData, x, y) {
    // 创建资源值容器
    const container = this.scene.add.container(x, y);

    // 获取资源值名称
    const displayName = priceData.displayName || resourceValueType;

    // 创建资源值图标背景
    const iconColor = this.getResourceValueColor(resourceValueType);
    const iconBg = this.scene.add.rectangle(0, 0, 80, 50, 0x333333)
      .setStrokeStyle(1, 0x555555);

    // 创建资源值名称
    const nameText = this.scene.add.text(0, -15, displayName, {
      fontSize: '12px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 创建资源值价格
    const priceText = this.scene.add.text(0, 0, `价格: ${priceData.currentPrice.toFixed(2)}`, {
      fontSize: '10px',
      fill: '#ffdd00'
    }).setOrigin(0.5, 0.5);

    // 创建通胀信息
    const inflationRatio = priceData.currentPrice / priceData.inflationAdjustedPrice;
    const inflationColor = inflationRatio > 1.1 ? '#ff6666' : inflationRatio < 0.9 ? '#66ff66' : '#cccccc';
    const inflationText = this.scene.add.text(0, 15, `通胀: ${(inflationRatio * 100).toFixed(0)}%`, {
      fontSize: '10px',
      fill: inflationColor
    }).setOrigin(0.5, 0.5);

    // 创建买入按钮
    const buyBtn = new TradeButton(this.scene, -20, 30, '买', {
      resourceType: resourceValueType,
      tradeMode: 'buy',
      width: 30,
      height: 20,
      onClick: (type, mode) => this.selectResourceValue(type, mode)
    });

    // 创建卖出按钮
    const sellBtn = new TradeButton(this.scene, 20, 30, '卖', {
      resourceType: resourceValueType,
      tradeMode: 'sell',
      width: 30,
      height: 20,
      onClick: (type, mode) => this.selectResourceValue(type, mode)
    });

    // 添加元素到容器
    container.add([iconBg, nameText, priceText, inflationText, ...buyBtn.getElements(), ...sellBtn.getElements()]);

    // 设置容器为可交互
    iconBg.setInteractive()
      .on('pointerdown', () => {
        this.selectResourceValue(resourceValueType);
      });

    return container;
  }

  /**
   * 获取资源值的颜色
   * @param {string} resourceValueType - 资源值类型
   * @returns {number} - 颜色值
   */
  getResourceValueColor(resourceValueType) {
    const colors = {
      happiness: 0xffdd00, // 金色
      transport: 0x00ddff, // 青色
      security: 0xff6666, // 红色
      health: 0x66ff66   // 绿色
    };
    return colors[resourceValueType] || 0xcccccc;
  }

  /**
   * 显示资源值交易对话框
   * @param {string} resourceValueType - 资源值类型
   * @param {Object} priceData - 价格数据
   */
  showResourceValueTradeDialog(resourceValueType, priceData) {
    // 创建交易对话框
    const dialogWidth = 300;
    const dialogHeight = 200;
    const dialogX = this.scene.scale.width / 2 - dialogWidth / 2;
    const dialogY = this.scene.scale.height / 2 - dialogHeight / 2;

    // 背景
    const dialogBg = this.scene.add.rectangle(dialogX, dialogY, dialogWidth, dialogHeight, 0x1a1a1a, 0.95)
      .setOrigin(0, 0)
      .setDepth(1000);

    // 标题
    const title = this.scene.add.text(dialogX + dialogWidth/2, dialogY + 20, `${priceData.displayName}交易`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(1001);

    // 价格信息
    const priceInfo = this.scene.add.text(dialogX + 20, dialogY + 50,
      `当前价格: ${priceData.currentPrice}金币/点\n` +
      `基础价格: ${priceData.basePrice}金币/点\n` +
      `通胀调整: ${priceData.inflationAdjustedPrice.toFixed(1)}金币/点\n` +
      `可用库存: ${priceData.marketInventory}点`, {
      fontSize: '12px',
      fill: '#cccccc'
    }).setOrigin(0, 0).setDepth(1001);

    // 购买按钮
    const buyButton = this.scene.add.rectangle(dialogX + 80, dialogY + 150, 60, 30, 0x4a6a4a)
      .setOrigin(0, 0)
      .setDepth(1001)
      .setInteractive();

    const buyText = this.scene.add.text(dialogX + 110, dialogY + 165, '购买', {
      fontSize: '12px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5).setDepth(1002);

    // 关闭按钮
    const closeButton = this.scene.add.rectangle(dialogX + 160, dialogY + 150, 60, 30, 0x6a4a4a)
      .setOrigin(0, 0)
      .setDepth(1001)
      .setInteractive();

    const closeText = this.scene.add.text(dialogX + 190, dialogY + 165, '关闭', {
      fontSize: '12px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5).setDepth(1002);

    // 购买事件
    buyButton.on('pointerdown', () => {
      this.handleResourceValuePurchase(resourceValueType, 10); // 默认购买10点
      this.closeDialog([dialogBg, title, priceInfo, buyButton, buyText, closeButton, closeText]);
    });

    // 关闭事件
    closeButton.on('pointerdown', () => {
      this.closeDialog([dialogBg, title, priceInfo, buyButton, buyText, closeButton, closeText]);
    });
  }

  /**
   * 处理资源值购买
   * @param {string} resourceValueType - 资源值类型
   * @param {number} amount - 购买数量
   */
  handleResourceValuePurchase(resourceValueType, amount) {
    const result = this.scene.marketSystem.buyResourceValue(resourceValueType, amount, this.scene.playerGold);

    if (result.success) {
      this.scene.playerGold -= result.cost;
      this.scene.updateGoldDisplay();

      // 显示成功消息
      this.showMessage(result.message, '#66ff66');

      // 刷新面板
      this.filterResources(this.currentTier);
    } else {
      // 显示错误消息
      this.showMessage(result.message, '#ff6666');
    }
  }

  /**
   * 关闭对话框
   * @param {Array} elements - 要销毁的元素数组
   */
  closeDialog(elements) {
    elements.forEach(element => element.destroy());
  }

  /**
   * 显示消息
   * @param {string} message - 消息内容
   * @param {string} color - 消息颜色
   */
  showMessage(message, color = '#ffffff') {
    const messageText = this.scene.add.text(this.scene.scale.width / 2, 100, message, {
      fontSize: '14px',
      fill: color,
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5, 0.5).setDepth(2000);

    // 3秒后自动消失
    this.scene.time.delayedCall(3000, () => {
      messageText.destroy();
    });
  }
}
