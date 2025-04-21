import BasePanel from './BasePanel.js';
import Button from '../Button.js';
import BuildingFilterDropdown from '../BuildingFilterDropdown.js';

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
      height: 500, // 增加高度以容纳更多建筑
      title: '建筑选单',
      onClose: () => this.hide()
    });

    // 保存配置
    this.config = config;
    this.allBuildings = config.buildings || {};
    this.currentFilter = 'all';
    this.buildingButtons = [];
    this.contentContainer = null;

    // 创建面板内容
    this.createContent();
  }

  /**
   * 创建面板内容
   */
  createContent() {
    // 创建建筑筛选下拉列表
    this.filterDropdown = new BuildingFilterDropdown(
      this.scene,
      this.container,
      -80,
      -180,
      (filterType) => this.filterBuildings(filterType)
    );

    // 添加下拉列表到面板
    this.add(this.filterDropdown.getElements());

    // 创建内容容器
    this.contentContainer = this.scene.add.container(0, -120);
    this.add([this.contentContainer]);

    // 初始显示所有建筑
    this.filterBuildings('all');
  }

  /**
   * 根据类型筛选建筑
   * @param {string} filterType - 筛选类型
   */
  filterBuildings(filterType) {
    this.currentFilter = filterType;

    // 清除当前所有建筑按钮
    this.clearBuildingButtons();

    // 获取筛选后的建筑列表
    let filteredBuildings = [];

    if (filterType === 'all') {
      // 显示所有建筑
      Object.keys(this.scene.buildingSystem.buildingTypes).forEach(key => {
        filteredBuildings.push(this.scene.buildingSystem.buildingTypes[key].name);
      });
    } else {
      // 根据类型筛选
      filteredBuildings = Object.keys(this.scene.buildingSystem.buildingTypes)
        .filter(key => this.scene.buildingSystem.buildingTypes[key].type === filterType)
        .map(key => this.scene.buildingSystem.buildingTypes[key].name);
    }

    // 按字母排序
    filteredBuildings.sort();

    // 创建筛选后的建筑按钮
    this.createBuildingButtons(filteredBuildings);
  }

  /**
   * 清除所有建筑按钮
   */
  clearBuildingButtons() {
    // 销毁所有当前的建筑按钮
    this.buildingButtons.forEach(button => {
      if (button && button.destroy) {
        button.destroy();
      }
    });

    // 清空内容容器
    if (this.contentContainer) {
      this.contentContainer.removeAll(true);
    }

    this.buildingButtons = [];
  }

  /**
   * 创建建筑按钮
   * @param {Array} buildings - 建筑列表
   */
  createBuildingButtons(buildings) {
    // 创建建筑按钮
    buildings.forEach((building, index) => {
      const buildingBtn = new Button(this.scene, 0, index * 60, building, {
        width: 160,
        height: 50,
        backgroundColor: 0x2d2d2d,
        fontSize: '16px',
        textColor: '#e0e0e0',
        onClick: () => this.handleBuildingSelect(building)
      });

      // 将按钮元素添加到内容容器
      this.contentContainer.add(buildingBtn.getElements());

      // 保存按钮引用
      this.buildingButtons.push(buildingBtn);
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
