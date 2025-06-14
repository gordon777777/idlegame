import BasePanel from './BasePanel.js';
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
      onClose: () => this.hide(),
      autoLayout: false // BuildingMenuPanel有复杂的滚动布局和筛选功能
    });

    // 保存配置
    this.config = config;
    this.allBuildings = config.buildings || {};
    this.currentFilter = 'all';
    this.buildingButtons = [];

    // 可视区域高度
    this.viewportHeight = 400;

    // 滚动面板相关属性
    this.scrollablePanel = null;
    this.contentContainer = null;

    // 创建面板内容
    this.createContent();

    console.log('BuildingMenuPanel: 构造函数完成');
  }

  /**
   * 创建面板内容
   */
  createContent() {
    console.log('BuildingMenuPanel: Creating content');

    // 检查buildingSystem是否存在
    if (!this.scene.buildingSystem) {
      console.error('BuildingMenuPanel: Building system not found in scene');
    } else {
      console.log('BuildingMenuPanel: Building system found, types:', Object.keys(this.scene.buildingSystem.buildingTypes).length);
    }

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

    // 创建一个简单的容器来显示建筑按钮
    // 将内容容器的初始位置设置在面板顶部
    this.contentContainer = this.scene.add.container(0, -170);

    // 创建背景以便于查看内容区域
    const contentBg = this.scene.add.rectangle(
      0,
      0,
      this.width - 20,
      350,
      0x222222,
      0.5
    ).setOrigin(0.5, 0.5);

    this.contentContainer.add(contentBg);

    // 创建滚动条
    this.scrollBar = this.scene.add.rectangle(
      this.width/2 - 15,
      -150, // 将滚动条初始位置设置在顶部
      20,
      80,
      0x4a9eff,
      0.8
    ).setOrigin(0.5, 0.5)
      .setInteractive({ draggable: true });

    // 默认隐藏滚动条，只有在内容超出面板大小时才显示
    this.scrollBar.visible = false;

    // 添加滚动条拖动事件
    this.scrollBar.on('drag', (_pointer, _dragX, dragY) => {
      // 限制滚动条在垂直方向的移动
      dragY = Phaser.Math.Clamp(dragY, -150, 150);
      this.scrollBar.y = dragY;

      // 计算内容容器的位置
      const scrollRange = 300; // 可滚动的范围
      const contentY = -170 - (dragY / -150) * scrollRange; // 修改计算方式，使滚动条在顶部时内容也在顶部
      this.contentContainer.y = contentY;
    });

    // 添加鼠标滚轮事件
    this.scene.input.on('wheel', (pointer, _gameObjects, _deltaX, deltaY, _deltaZ) => {
      if (this.container.visible && this.isPointerOverContent(pointer) && this.scrollBar.visible) {
        // 更新内容容器位置
        const newY = this.contentContainer.y - deltaY * 0.5;
        this.contentContainer.y = Phaser.Math.Clamp(newY, -470, -170);

        // 更新滚动条位置
        const scrollBarY = -150 + ((this.contentContainer.y + 170) / -300) * 300; // 修改计算方式，使滚动条位置与内容位置对应
        this.scrollBar.y = scrollBarY;
      }
    });

    // 添加内容容器和滚动条到面板
    this.add([this.contentContainer, this.scrollBar]);

    // 辅助方法：检查指针是否在内容区域上方
    this.isPointerOverContent = (pointer) => {
      const bounds = new Phaser.Geom.Rectangle(
        this.container.x - this.width/2 + 10,
        this.container.y - 150,
        this.width - 20,
        350
      );
      return bounds.contains(pointer.x, pointer.y);
    };

    // 初始显示所有建筑
    this.filterBuildings('all');

    console.log('BuildingMenuPanel: Content created');
  }

  // 不再需要这些方法，由ScrollablePanel处理

  /**
   * 根据类型筛选建筑
   * @param {string} filterType - 筛选类型
   */
  filterBuildings(filterType) {
    console.log(`Filtering buildings by type: ${filterType}`);
    this.currentFilter = filterType;

    // 清除当前所有建筑按钮
    this.clearBuildingButtons();

    // 检查buildingSystem是否存在
    if (!this.scene.buildingSystem || !this.scene.buildingSystem.buildingTypes) {
      console.error('Building system or building types not found');

      // 显示错误信息
      const errorText = this.scene.add.text(0, 0, '建筑系统未初始化', {
        fontSize: '16px',
        fill: '#ff0000',
        backgroundColor: '#333333',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5);

      this.contentContainer.add(errorText);

      // 尝试直接创建一些测试建筑按钮
      this.createBuildingButtons(['测试建筑1', '测试建筑2', '测试建筑3']);
      return;
    }

    // 打印所有可用的建筑类型，用于调试
    console.log('Available building types:', Object.keys(this.scene.buildingSystem.buildingTypes));

    // 检查buildingTypes是否为空对象
    if (Object.keys(this.scene.buildingSystem.buildingTypes).length === 0) {
      console.error('Building types object is empty');

      const errorText = this.scene.add.text(0, 0, '没有可用的建筑类型', {
        fontSize: '16px',
        fill: '#ff0000',
        backgroundColor: '#333333',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5);

      this.contentContainer.add(errorText);
      return;
    }

    // 获取筛选后的建筑列表
    let filteredBuildings = [];

    try {
      if (filterType === 'all') {
        // 显示所有建筑
        Object.keys(this.scene.buildingSystem.buildingTypes).forEach(key => {
          const buildingType = this.scene.buildingSystem.buildingTypes[key];
          if (buildingType && buildingType.name) {
            console.log(`Adding building: ${key} -> ${buildingType.name}`);
            filteredBuildings.push(buildingType.name);
          } else {
            console.warn(`Building ${key} has no name property`);
          }
        });
      } else {
        // 根据类型筛选
        filteredBuildings = Object.keys(this.scene.buildingSystem.buildingTypes)
          .filter(key => {
            const type = this.scene.buildingSystem.buildingTypes[key].type;
            console.log(`Building ${key} has type: ${type}`);
            return type === filterType;
          })
          .map(key => this.scene.buildingSystem.buildingTypes[key].name)
          .filter(name => name); // 过滤掉undefined或null
      }
    } catch (error) {
      console.error('Error filtering buildings:', error);

      const errorText = this.scene.add.text(0, 0, '筛选建筑时出错', {
        fontSize: '16px',
        fill: '#ff0000',
        backgroundColor: '#333333',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5);

      this.contentContainer.add(errorText);
      return;
    }

    console.log(`Found ${filteredBuildings.length} buildings after filtering:`, filteredBuildings);

    // 如果没有找到建筑，显示一个测试建筑
    if (filteredBuildings.length === 0) {
      console.warn('No buildings found after filtering, adding test buildings');
      filteredBuildings = ['测试建筑1', '测试建筑2', '测试建筑3'];
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
    // 打印建筑列表，用于调试
    console.log('Creating buttons for buildings:', buildings);

    // 清除之前的按钮
    this.buildingButtons.forEach(button => {
      if (button && button.destroy) {
        button.destroy();
      }
    });
    this.buildingButtons = [];

    // 清空内容容器，但保留背景
    const background = this.contentContainer.getAt(0);
    this.contentContainer.removeAll(true);
    if (background) {
      this.contentContainer.add(background);
    }

    // 如果没有建筑，显示提示信息
    if (!buildings || buildings.length === 0) {
      const noBuildings = this.scene.add.text(0, 120, '没有可用的建筑', {
        fontSize: '16px',
        fill: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5);

      this.contentContainer.add(noBuildings);
      return;
    }

    // 创建建筑按钮
    buildings.forEach((building, index) => {
      // 打印当前正在创建的建筑按钮
      console.log(`Creating button for building ${index}:`, building);

      try {
        // 创建一个简单的按钮 - 从面板内部顶部开始添加按钮
        const buttonBg = this.scene.add.rectangle(
          0,
          60 + index * 60, // 调整起始位置，每个按钮间隔60像素
          160,
          50,
          0x2d2d2d
        ).setInteractive();

        const buttonText = this.scene.add.text(
          0,
          60 + index * 60, // 保持与按钮背景相同的位置
          building,
          {
            fontSize: '16px',
            fill: '#e0e0e0'
          }
        ).setOrigin(0.5);

        // 添加点击事件
        buttonBg.on('pointerdown', () => this.handleBuildingSelect(building));

        // 添加悬停效果
        buttonBg.on('pointerover', () => {
          buttonBg.setFillStyle(0x3d3d3d);
        });

        buttonBg.on('pointerout', () => {
          buttonBg.setFillStyle(0x2d2d2d);
        });

        // 将按钮添加到内容容器
        this.contentContainer.add([buttonBg, buttonText]);

        // 保存按钮引用
        this.buildingButtons.push({
          bg: buttonBg,
          text: buttonText,
          destroy: function() {
            buttonBg.destroy();
            buttonText.destroy();
          }
        });
      } catch (error) {
        console.error(`Error creating button for building ${index}:`, error);
      }
    });

    // 重置滚动位置
    this.contentContainer.y = -170;

    // 检查是否需要显示滚动条
    // 如果按钮总高度超过可视区域，则显示滚动条
    const totalContentHeight = buildings.length * 60;
    const visibleHeight = 300; // 内容区域的可视高度，调小一些以避免按钮超出面板底部

    if (totalContentHeight > visibleHeight) {
      this.scrollBar.visible = true;
      // 重置滚动条位置到顶部
      this.scrollBar.y = -150;
    } else {
      this.scrollBar.visible = false;
    }

    // 打印内容容器中的子元素数量，用于调试
    console.log(`Content container has ${this.contentContainer.length} children`);
  }

  /**
   * 处理建筑选择
   * @param {string} buildingType - 建筑类型
   */
  handleBuildingSelect(buildingType) {
    console.log('Selected building type for placement:', buildingType);

    // 检查buildingSystem是否存在
    if (!this.scene.buildingSystem) {
      console.error('BuildingMenuPanel: Building system not found when selecting building');
      return;
    }

    // 打印所有建筑类型，用于调试
    console.log('Available building types:', Object.keys(this.scene.buildingSystem.buildingTypes));

    // 启动建筑放置模式
    const buildingKey = Object.keys(this.scene.buildingSystem.buildingTypes)
      .find(key => this.scene.buildingSystem.buildingTypes[key].name === buildingType);

    console.log('Found building key:', buildingKey);

    if (buildingKey) {
      this.scene.buildingSystem.enterPlacementMode(buildingKey);
    } else {
      console.error(`BuildingMenuPanel: Could not find building key for ${buildingType}`);
    }
  }

  /**
   * 销毁面板
   */
  destroy() {
    // 移除滚轮事件监听
    this.scene.input.off('wheel');

    // 销毁建筑按钮
    this.buildingButtons.forEach(button => {
      if (button && button.destroy) {
        button.destroy();
      }
    });

    // 销毁筛选下拉列表
    if (this.filterDropdown) {
      this.filterDropdown.destroy();
    }

    // 调用父类销毁方法
    super.destroy();

    console.log('BuildingMenuPanel: 已销毁');
  }
}
