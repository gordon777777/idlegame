import BasePanel from './BasePanel.js';
import Button from '../Button.js';

/**
 * 移民面板
 * 用于招募新的人口
 */
export default class ImmigrantsPanel extends BasePanel {
  /**
   * 创建移民面板
   * @param {Phaser.Scene} scene - 场景对象
   * @param {Object} config - 配置对象
   */
  constructor(scene, config = {}) {
    // 获取屏幕中心位置
    const centerX = scene.scale.width / 2;
    const centerY = scene.scale.height / 2;

    // 调用父类构造函数
    super(scene, config.x || centerX, config.y || centerY, {
      width: 400,
      height: 300,
      title: `招募${config.className ? ImmigrantsPanel.getClassDisplayName(config.className) : ''}移民`,
      onClose: () => this.hide()
    });

    // 保存配置
    this.config = config;
    this.className = config.className || 'lower';

    // 招募数量
    this.recruitAmount = 1;

    // 创建面板内容
    this.createContent();
  }

  /**
   * 显示移民面板
   * @param {Phaser.Scene} scene - 场景对象
   * @param {string} targetClass - 目标阶层 ('lower', 'middle' 或 'upper')
   * @returns {ImmigrantsPanel} - 创建的面板实例
   */
  static showPanel(scene, targetClass) {
    // 如果已存在移民面板，先移除
    if (scene.uiManager.immigrantsPanel) {
      scene.uiManager.immigrantsPanel.destroy();
      scene.uiManager.immigrantsPanel = null;
      return null;
    }

    // 创建新的移民面板
    const panel = new ImmigrantsPanel(scene, { className: targetClass });

    // 显示面板
    panel.show();

    // 保存引用
    scene.uiManager.immigrantsPanel = panel;

    return panel;
  }

  /**
   * 创建面板内容
   */
  createContent() {
    // 获取人口系统
    const populationSystem = this.scene.populationSystem;
    if (!populationSystem) {
      console.error('人口系统未初始化');
      return;
    }

    // 获取招募成本
    const recruitCost = populationSystem.getRecruitCost(this.className, this.recruitAmount);
    const playerGold = this.scene.playerGold || 0;

    // 添加说明文本
    const infoText = this.scene.add.text(0, -100, `招募${this.getClassDisplayName(this.className)}移民\n新移民将增加你的人口，但需要支付金币`, {
      fontSize: '14px',
      fill: '#cccccc',
      align: 'center'
    }).setOrigin(0.5, 0);

    // 添加金币显示
    this.goldText = this.scene.add.text(0, -60, `目前拥有金币: ${Math.floor(playerGold)}`, {
      fontSize: '16px',
      fill: '#ffdd00',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 添加数量选择
    const amountLabel = this.scene.add.text(-100, -20, '招募数量:', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);

    // 创建数量输入框背景
    const amountInput = this.scene.add.rectangle(0, -20, 60, 30, 0x333333)
      .setStrokeStyle(1, 0x555555);

    // 创建数量文本
    this.amountText = this.scene.add.text(0, -20, this.recruitAmount.toString(), {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 创建快速选择按钮
    const quickButtons = [];
    const amounts = [1, 5, 10, 20, 50];
    let xPos = -150;

    amounts.forEach(amount => {
      const quickBtn = this.scene.add.rectangle(xPos, 20, 50, 30, 0x4a4a4a)
        .setInteractive()
        .on('pointerdown', () => {
          this.setRecruitAmount(amount);
        });

      const quickText = this.scene.add.text(xPos, 20, amount.toString(), {
        fontSize: '14px',
        fill: '#ffffff'
      }).setOrigin(0.5, 0.5);

      quickButtons.push(quickBtn, quickText);
      xPos += 60;
    });

    // 创建预览区域
    const previewBackground = this.scene.add.rectangle(0, 60, 300, 60, 0x333333)
      .setStrokeStyle(1, 0x555555);

    // 创建预览文本
    this.previewText = this.scene.add.text(0, 60, `招募 ${this.recruitAmount} 名${this.getClassDisplayName(this.className)}移民\n需要支付: ${recruitCost} 金币`, {
      fontSize: '14px',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    // 创建确认按钮
    const confirmBtn = new Button(this.scene, 0, 110, '确认招募', {
      width: 120,
      height: 30,
      backgroundColor: 0x4a6a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.confirmRecruit()
    });

    // 添加元素到面板
    this.add([
      infoText, this.goldText,
      amountLabel, amountInput, this.amountText,
      ...quickButtons,
      previewBackground, this.previewText,
      ...confirmBtn.getElements()
    ]);
  }

  /**
   * 设置招募数量
   * @param {number} amount - 招募数量
   */
  setRecruitAmount(amount) {
    this.recruitAmount = amount;
    this.amountText.setText(amount.toString());

    // 更新预览
    this.updatePreview();
  }

  /**
   * 更新预览
   */
  updatePreview() {
    // 获取招募成本
    const recruitCost = this.scene.populationSystem.getRecruitCost(this.className, this.recruitAmount);

    // 更新预览文本
    this.previewText.setText(`招募 ${this.recruitAmount} 名${this.getClassDisplayName(this.className)}移民\n需要支付: ${recruitCost} 金币`);
  }

  /**
   * 确认招募
   */
  confirmRecruit() {
    console.log(`Recruiting ${this.recruitAmount} immigrants of class ${this.className}`);

    // 获取人口系统
    const populationSystem = this.scene.populationSystem;
    if (!populationSystem) return;

    // 招募移民
    const success = populationSystem.recruitImmigrants(this.className, this.recruitAmount);

    if (success) {
      // 更新金币显示
      this.goldText.setText(`目前拥有金币: ${Math.floor(this.scene.playerGold)}`);

      // 更新预览
      this.updatePreview();
    } else {
      console.log('无法招募移民，可能金币不足或住房容量不足');
    }
  }

  /**
   * 获取阶级显示名称
   * @param {string} className - 阶级名称
   * @returns {string} - 显示名称
   */
  getClassDisplayName(className) {
    return ImmigrantsPanel.getClassDisplayName(className);
  }

  /**
   * 获取阶级显示名称（静态方法）
   * @param {string} className - 阶级名称
   * @returns {string} - 显示名称
   */
  static getClassDisplayName(className) {
    const classNames = {
      'lower': '下层阶级',
      'middle': '中层阶级',
      'upper': '上层阶级'
    };
    return classNames[className] || className;
  }
}
