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
      height: 150,
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
    this.populationText = this.scene.add.text(0, -40, `总人口: ${stats.total || 0}`, {
      fontSize: '14px',
      fill: '#e0e0e0'
    }).setOrigin(0.5, 0);
    
    // 初始化住房容量文本
    this.housingText = this.scene.add.text(0, -15, `住房容量: ${stats.capacity || 0}`, {
      fontSize: '14px',
      fill: '#e0e0e0'
    }).setOrigin(0.5, 0);
    
    // 初始化幸福度文本
    const happinessColor = this.getHappinessColor(stats.happiness || 0);
    this.happinessText = this.scene.add.text(0, 10, `幸福度: ${stats.happiness || 0}%`, {
      fontSize: '14px',
      fill: happinessColor
    }).setOrigin(0.5, 0);
    
    // 添加查看工人按钮
    const viewWorkersBtn = new Button(this.scene, -40, 40, '管理工人', {
      width: 80,
      height: 30,
      backgroundColor: 0x4a4a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.toggleWorkerPanel()
    });
    
    // 添加市场按钮
    const marketBtn = new Button(this.scene, 50, 40, '查看市场', {
      width: 80,
      height: 30,
      backgroundColor: 0x4a6a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.toggleMarketPanel()
    });
    
    // 添加元素到面板
    this.add([this.populationText, this.housingText, this.happinessText, ...viewWorkersBtn.getElements(), ...marketBtn.getElements()]);
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
    this.housingText.setText(`住房容量: ${stats.capacity || 0}`);
    
    // 更新总体幸福度
    const happinessColor = this.getHappinessColor(stats.happiness || 0);
    this.happinessText.setText(`幸福度: ${stats.happiness || 0}%`).setFill(happinessColor);
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
