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
      }
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
    
    // 创建标签页容器
    this.tabContainers = {};
    this.activeTab = 'all';
    this.tabButtons = [];
    
    // 创建资源容器
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
      
      // 为每个标签页创建内容容器
      this.tabContainers[tab.id] = this.scene.add.container(0, -80);
      this.tabContainers[tab.id].visible = (tab.id === this.activeTab);
      
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
    const marketStats = this.scene.marketSystem.getMarketStats();
    
    // 清空资源容器
    this.resourceContainer.removeAll();
    
    let yPos = 0;
    let xPos = -250;
    let itemsPerRow = 5;
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
      
      // 计算位置
      if (itemCount > 0 && itemCount % itemsPerRow === 0) {
        yPos += 60;
        xPos = -250;
      }
      
      // 创建资源显示元素
      const resourceUI = this.createResourceListItem(resourceType, resourceData, marketStats, xPos, yPos);
      this.resourceContainer.add(resourceUI);
      
      xPos += 100;
      itemCount++;
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
        // 弹出输入框
        this.scene.input.keyboard.createTextInput({
          onTextChanged: (text) => {
            const amount = parseInt(text);
            if (!isNaN(amount) && amount >= 0) {
              this.selectedAmount = amount;
              this.amountText.setText(amount.toString());
              this.updatePreview();
            }
          }
        });
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
}
