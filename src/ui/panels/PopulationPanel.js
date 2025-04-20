import BasePanel from './BasePanel.js';
import Button from '../Button.js';

/**
 * 人口面板
 * 显示人口统计信息
 */
export default class PopulationPanel extends BasePanel {
  /**
   * 创建人口面板
   * @param {Phaser.Scene} scene - 场景对象
   * @param {Object} config - 配置对象
   */
  constructor(scene, config = {}) {
    // 调用父类构造函数
    super(scene, config.position?.x || 20, config.position?.y || 150, {
      width: 200,
      height: 280, // 增加面板高度以适应新添加的阶层幸福度文本元素
      title: '人口统计',
      onClose: () => this.hide()
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
    // 获取人口统计
    const stats = this.scene.populationSystem.getPopulationStats();

    // 初始化人口文本
    this.populationText = this.scene.add.text(0, -50, `总人口: ${stats.total || 0}`, {
      fontSize: '14px',
      fill: '#e0e0e0'
    }).setOrigin(0.5, 0);

    // 初始化住房使用情况文本
    this.housingUsageText = this.scene.add.text(0, -25, `住房使用: ${stats.total || 0}/${stats.capacity || 0}`, {
      fontSize: '14px',
      fill: '#e0e0e0'
    }).setOrigin(0.5, 0);

    // 初始化住房剩余文本
    const remainingHousing = (stats.capacity || 0) - (stats.total || 0);
    const remainingColor = remainingHousing > 0 ? '#a0e0a0' : '#e0a0a0';
    this.housingRemainingText = this.scene.add.text(0, 0, `剩余住房: ${remainingHousing}`, {
      fontSize: '14px',
      fill: remainingColor
    }).setOrigin(0.5, 0);

    // 初始化总体幸福度文本
    const happinessColor = this.getHappinessColor(stats.happiness || 0);
    this.happinessText = this.scene.add.text(0, 10, `总体幸福度: ${stats.happiness || 0}%`, {
      fontSize: '14px',
      fill: happinessColor,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 初始化阶层幸福度标题
    this.classHappinessTitle = this.scene.add.text(0, 35, '各阶层幸福度:', {
      fontSize: '14px',
      fill: '#e0e0e0',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 初始化各阶层幸福度文本
    this.classHappinessTexts = {};
    let yPos = 60;

    // 下层幸福度
    const lowerHappiness = stats.socialClasses.lower?.happiness || 0;
    const lowerHappinessColor = this.getHappinessColor(lowerHappiness);
    this.classHappinessTexts.lower = this.scene.add.text(0, yPos, `下层: ${lowerHappiness}%`, {
      fontSize: '14px',
      fill: lowerHappinessColor
    }).setOrigin(0.5, 0);
    yPos += 25;

    // 中层幸福度
    const middleHappiness = stats.socialClasses.middle?.happiness || 0;
    const middleHappinessColor = this.getHappinessColor(middleHappiness);
    this.classHappinessTexts.middle = this.scene.add.text(0, yPos, `中层: ${middleHappiness}%`, {
      fontSize: '14px',
      fill: middleHappinessColor
    }).setOrigin(0.5, 0);
    yPos += 25;

    // 上层幸福度
    const upperHappiness = stats.socialClasses.upper?.happiness || 0;
    const upperHappinessColor = this.getHappinessColor(upperHappiness);
    this.classHappinessTexts.upper = this.scene.add.text(0, yPos, `上层: ${upperHappiness}%`, {
      fontSize: '14px',
      fill: upperHappinessColor
    }).setOrigin(0.5, 0);

    // 添加查看工人按钮
    const viewWorkersBtn = new Button(this.scene, -40, 150, '管理工人', {
      width: 80,
      height: 30,
      backgroundColor: 0x4a4a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.toggleWorkerPanel()
    });

    // 添加市场按钮
    const marketBtn = new Button(this.scene, 50, 150, '查看市场', {
      width: 80,
      height: 30,
      backgroundColor: 0x4a6a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.toggleMarketPanel()
    });

    // 添加元素到面板
    this.add([
      this.populationText,
      this.housingUsageText,
      this.housingRemainingText,
      this.happinessText,
      this.classHappinessTitle,
      this.classHappinessTexts.lower,
      this.classHappinessTexts.middle,
      this.classHappinessTexts.upper,
      ...viewWorkersBtn.getElements(),
      ...marketBtn.getElements()
    ]);
  }

  /**
   * 更新面板内容
   * @param {Object} stats - 人口统计信息
   */
  update(stats) {
    if (!stats) {
      stats = this.scene.populationSystem.getPopulationStats();
    }

    this.populationText.setText(`总人口: ${stats.total || 0}`);
    this.housingUsageText.setText(`住房使用: ${stats.total || 0}/${stats.capacity || 0}`);

    // 更新剩余住房
    const remainingHousing = (stats.capacity || 0) - (stats.total || 0);
    const remainingColor = remainingHousing > 0 ? '#a0e0a0' : '#e0a0a0';
    this.housingRemainingText.setText(`剩余住房: ${remainingHousing}`).setFill(remainingColor);

    // 更新总体幸福度
    const happinessColor = this.getHappinessColor(stats.happiness || 0);
    this.happinessText.setText(`总体幸福度: ${stats.happiness || 0}%`).setFill(happinessColor);

    // 更新各阶层幸福度
    // 下层幸福度
    const lowerHappiness = stats.socialClasses.lower?.happiness || 0;
    const lowerHappinessColor = this.getHappinessColor(lowerHappiness);
    this.classHappinessTexts.lower.setText(`下层: ${lowerHappiness}%`).setFill(lowerHappinessColor);

    // 中层幸福度
    const middleHappiness = stats.socialClasses.middle?.happiness || 0;
    const middleHappinessColor = this.getHappinessColor(middleHappiness);
    this.classHappinessTexts.middle.setText(`中层: ${middleHappiness}%`).setFill(middleHappinessColor);

    // 上层幸福度
    const upperHappiness = stats.socialClasses.upper?.happiness || 0;
    const upperHappinessColor = this.getHappinessColor(upperHappiness);
    this.classHappinessTexts.upper.setText(`上层: ${upperHappiness}%`).setFill(upperHappinessColor);
  }

  /**
   * 切换工人管理面板
   */
  toggleWorkerPanel() {
    // 使用UIManager切换工人面板
    this.scene.uiManager.toggleWorkerPanel();
  }

  /**
   * 切换市场面板
   */
  toggleMarketPanel() {
    // 使用UIManager切换市场面板
    this.scene.uiManager.toggleMarketPanel();
  }

  /**
   * 获取幸福度颜色
   * @param {number} happiness - 幸福度值
   * @returns {string} - 颜色代码
   */
  getHappinessColor(happiness) {
    if (happiness >= 80) return '#00ff00'; // 绿色
    if (happiness >= 60) return '#aaff00'; // 黄绿色
    if (happiness >= 40) return '#ffff00'; // 黄色
    if (happiness >= 20) return '#ffaa00'; // 橙色
    return '#ff0000'; // 红色
  }
}
