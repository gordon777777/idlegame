import BasePanel from './BasePanel.js';
import Button from '../Button.js';

/**
 * 建筑菜单面板
 * 显示可建造的建筑列表
 */
export default class BuildingMenuPanel extends BasePanel {
  /**
   * 创建建筑菜单面板
   * @param {Phaser.Scene} scene - 场景对象
   * @param {Object} config - 配置对象
   */
  constructor(scene, config = {}) {
    // 调用父类构造函数
    super(scene, config.position?.x || 100, config.position?.y || 300, {
      width: 200,
      height: 400,
      title: '建筑选单',
      onClose: () => this.hide()
    });
    
    // 保存配置
    this.config = config;
    this.buildings = config.buildings || [];
    
    // 创建面板内容
    this.createContent();
  }
  
  /**
   * 创建面板内容
   */
  createContent() {
    // 创建建筑按钮
    this.buildings.forEach((building, index) => {
      const buildingBtn = new Button(this.scene, 0, -130 + (index * 60), building, {
        width: 160,
        height: 50,
        backgroundColor: 0x2d2d2d,
        fontSize: '16px',
        textColor: '#e0e0e0',
        onClick: () => this.handleBuildingSelect(building)
      });
      
      this.add(buildingBtn.getElements());
    });
  }
  
  /**
   * 处理建筑选择
   * @param {string} buildingType - 建筑类型
   */
  handleBuildingSelect(buildingType) {
    console.log('Selected building type for placement:', buildingType);
    
    // 启动建筑放置模式
    const buildingKey = Object.keys(this.scene.buildingSystem.buildingTypes)
      .find(key => this.scene.buildingSystem.buildingTypes[key].name === buildingType);
    
    if (buildingKey) {
      this.scene.buildingSystem.enterPlacementMode(buildingKey);
    }
  }
}
