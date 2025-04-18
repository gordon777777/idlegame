import BasePanel from './BasePanel.js';
import Button from '../Button.js';
import TabButton from '../TabButton.js';

/**
 * 工人管理面板
 * 显示和管理不同阶层的工人
 */
export default class WorkerPanel extends BasePanel {
  /**
   * 创建工人管理面板
   * @param {Phaser.Scene} scene - 场景对象
   * @param {Object} config - 配置对象
   */
  constructor(scene, config = {}) {
    // 调用父类构造函数，使用向右移动300px，向下移动200px的位置
    super(scene, config.x || 300, config.y || 400, {
      width: 500,
      height: 400,
      title: '工人管理',
      onClose: () => this.hide()
    });

    // 保存配置
    this.config = config;

    // 标签页相关变量
    this.tabContainers = {};
    this.activeTab = 'overview';
    this.tabButtons = [];

    // 晶升面板
    this.promotionPanel = null;

    // 创建面板内容
    this.createContent();
  }

  /**
   * 切换工人面板显示/隐藏
   * @param {Phaser.Scene} scene - 场景对象
   * @returns {WorkerPanel|null} - 面板实例或null
   */
  static togglePanel(scene) {
    // 如果面板已存在且可见，则隐藏
    if (scene.uiManager.workerPanel && scene.uiManager.workerPanel.container.visible) {
      scene.uiManager.workerPanel.hide();
      return null;
    } else {
      // 否则创建新面板
      // 如果已存在，先销毁
      if (scene.uiManager.workerPanel) {
        scene.uiManager.workerPanel.destroy();
      }

      // 创建新面板，使用向右移动300px，向下移动200px的位置
      const panel = new WorkerPanel(scene, {
        x: 300,
        y: 400
      });

      // 显示面板
      panel.show();

      // 保存引用
      scene.uiManager.workerPanel = panel;

      return panel;
    }
  }

  /**
   * 创建面板内容
   */
  createContent() {
    // 获取人口统计
    const stats = this.scene.populationSystem.getPopulationStats();

    // 创建标签页
    this.createTabs(stats);
  }

  /**
   * 创建标签页
   * @param {Object} stats - 人口统计信息
   */
  createTabs(stats) {
    // 创建标签页配置
    const tabHeight = 36;
    const tabWidth = 100;
    const tabY = -140;
    const tabs = [
      { id: 'overview', name: '概览', x: -200, color: 0x3a8c3a },
      { id: 'lower', name: '底层', x: -100, color: 0x666666 },
      { id: 'middle', name: '中层', x: 0, color: 0x3a6a8c },
      { id: 'upper', name: '上层', x: 100, color: 0x8c6a3a }
    ];

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

          // 显示/隐藏内容
          Object.keys(this.tabContainers).forEach(id => {
            this.tabContainers[id].visible = (id === this.activeTab);
          });
        }
      });

      this.tabButtons.push(tabBtn);

      // 为每个标签页创建内容容器
      this.tabContainers[tab.id] = this.scene.add.container(0, -80);
      this.tabContainers[tab.id].visible = (tab.id === this.activeTab);

      // 添加按钮元素到面板
      this.add(tabBtn.getElements());
    });

    // 创建各标签页内容
    this.createOverviewTabContent(this.tabContainers['overview'], stats);
    this.createLowerClassTabContent(this.tabContainers['lower'], stats);
    this.createMiddleClassTabContent(this.tabContainers['middle'], stats);
    this.createUpperClassTabContent(this.tabContainers['upper'], stats);

    // 添加标签页容器到面板
    Object.values(this.tabContainers).forEach(container => {
      this.add(container);
    });
  }

  /**
   * 创建概览标签页内容
   * @param {Phaser.GameObjects.Container} container - 容器
   * @param {Object} stats - 人口统计信息
   */
  createOverviewTabContent(container, stats) {
    // 添加总人口信息
    const totalText = this.scene.add.text(0, 0, `总人口: ${stats.total || 0}`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 添加各阶层人口信息
    let yPos = 30;
    const classTexts = [];

    for (const [className, classData] of Object.entries(stats.socialClasses)) {
      const displayName = this.getClassDisplayName(className);
      const classText = this.scene.add.text(-100, yPos, `${displayName}: ${classData.count || 0}`, {
        fontSize: '14px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      classTexts.push(classText);
      yPos += 25;
    }

    // 添加工人类型信息
    yPos = 30;
    const workerTexts = [];

    for (const [workerType, count] of Object.entries(stats.workerTypes || {})) {
      const displayName = this.getWorkerDisplayName(workerType);
      const workerText = this.scene.add.text(50, yPos, `${displayName}: ${count || 0}`, {
        fontSize: '14px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      workerTexts.push(workerText);
      yPos += 25;
    }

    // 添加元素到容器
    container.add([totalText, ...classTexts, ...workerTexts]);
  }

  /**
   * 创建底层阶级标签页内容
   * @param {Phaser.GameObjects.Container} container - 容器
   * @param {Object} stats - 人口统计信息
   */
  createLowerClassTabContent(container, stats) {
    // 获取底层阶级数据
    const lowerClass = stats.socialClasses.lower || { count: 0 };

    // 添加底层阶级信息
    const titleText = this.scene.add.text(0, -30, `底层阶级: ${lowerClass.count || 0}人`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 添加工人类型信息
    const workerTypes = ['worker', 'craftsman', 'technician'];
    let yPos = 10;
    const workerTexts = [];
    const trainButtons = [];

    workerTypes.forEach(workerType => {
      const count = stats.workers[workerType] || 0;
      const displayName = this.getWorkerDisplayName(workerType);

      // 添加工人类型文本
      const workerText = this.scene.add.text(-150, yPos, `${displayName}: ${count}`, {
        fontSize: '14px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 添加训练按钮
      const trainBtn = new Button(this.scene, 0, yPos, '训练', {
        width: 60,
        height: 26,
        backgroundColor: 0x4a6a4a,
        fontSize: '14px',
        textColor: '#ffffff',
        onClick: () => this.trainWorker(workerType)
      });

      workerTexts.push(workerText);
      trainButtons.push(...trainBtn.getElements());

      yPos += 40;
    });

    // 添加晋升按钮
    const promoteBtn = new Button(this.scene, 0, yPos, '晋升到中层', {
      width: 120,
      height: 30,
      backgroundColor: 0x3a6a8c,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.promoteClass('lower', 'middle')
    });

    // 添加元素到容器
    container.add([titleText, ...workerTexts, ...trainButtons, ...promoteBtn.getElements()]);
  }

  /**
   * 创建中层阶级标签页内容
   * @param {Phaser.GameObjects.Container} container - 容器
   * @param {Object} stats - 人口统计信息
   */
  createMiddleClassTabContent(container, stats) {
    // 获取中层阶级数据
    const middleClass = stats.socialClasses.middle || { count: 0 };

    // 添加中层阶级信息
    const titleText = this.scene.add.text(0, -30, `中层阶级: ${middleClass.count || 0}人`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 添加工人类型信息
    const workerTypes = ['technician', 'engineer'];
    let yPos = 10;
    const workerTexts = [];
    const trainButtons = [];

    workerTypes.forEach(workerType => {
      const count = stats.workers[workerType] || 0;
      const displayName = this.getWorkerDisplayName(workerType);

      // 添加工人类型文本
      const workerText = this.scene.add.text(-150, yPos, `${displayName}: ${count}`, {
        fontSize: '14px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 添加训练按钮
      const trainBtn = new Button(this.scene, 0, yPos, '训练', {
        width: 60,
        height: 26,
        backgroundColor: 0x4a6a4a,
        fontSize: '14px',
        textColor: '#ffffff',
        onClick: () => this.trainWorker(workerType)
      });

      workerTexts.push(workerText);
      trainButtons.push(...trainBtn.getElements());

      yPos += 40;
    });

    // 添加晋升按钮
    const promoteBtn = new Button(this.scene, 0, yPos, '晋升到上层', {
      width: 120,
      height: 30,
      backgroundColor: 0x8c6a3a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.promoteClass('middle', 'upper')
    });

    // 添加元素到容器
    container.add([titleText, ...workerTexts, ...trainButtons, ...promoteBtn.getElements()]);
  }

  /**
   * 创建上层阶级标签页内容
   * @param {Phaser.GameObjects.Container} container - 容器
   * @param {Object} stats - 人口统计信息
   */
  createUpperClassTabContent(container, stats) {
    // 获取上层阶级数据
    const upperClass = stats.socialClasses.upper || { count: 0 };

    // 添加上层阶级信息
    const titleText = this.scene.add.text(0, -30, `上层阶级: ${upperClass.count || 0}人`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 添加工人类型信息
    const workerTypes = ['wizard', 'merchant'];
    let yPos = 10;
    const workerTexts = [];
    const trainButtons = [];

    workerTypes.forEach(workerType => {
      const count = stats.workers[workerType] || 0;
      const displayName = this.getWorkerDisplayName(workerType);

      // 添加工人类型文本
      const workerText = this.scene.add.text(-150, yPos, `${displayName}: ${count}`, {
        fontSize: '14px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 添加训练按钮
      const trainBtn = new Button(this.scene, 0, yPos, '训练', {
        width: 60,
        height: 26,
        backgroundColor: 0x4a6a4a,
        fontSize: '14px',
        textColor: '#ffffff',
        onClick: () => this.trainWorker(workerType)
      });

      workerTexts.push(workerText);
      trainButtons.push(...trainBtn.getElements());

      yPos += 40;
    });

    // 添加元素到容器
    container.add([titleText, ...workerTexts, ...trainButtons]);
  }

  /**
   * 训练工人
   * @param {string} workerType - 工人类型
   */
  trainWorker(workerType) {
    console.log(`Training worker of type: ${workerType}`);

    // 检查人口系统是否存在
    if (!this.scene.populationSystem) {
      console.warn('缺少必要的人口系统');
      this.showErrorMessage('系统错误，无法训练工人');
      return;
    }

    try {
      // 调用人口系统训练工人
      const success = this.scene.populationSystem.trainWorker(workerType);

      if (success) {
        // 更新面板
        this.update();
      } else {
        // 显示错误消息
        this.showErrorMessage('资源不足或没有足够的工人');
      }
    } catch (error) {
      console.error('训练工人时发生错误:', error);
      this.showErrorMessage('训练工人时发生错误');
    }
  }

  /**
   * 晋升阶级
   * @param {string} fromClass - 源阶级
   * @param {string} toClass - 目标阶级
   */
  promoteClass(fromClass, toClass) {
    console.log(`Promoting from ${fromClass} to ${toClass}`);

    // 检查人口系统是否存在
    if (!this.scene.populationSystem) {
      console.warn('缺少必要的人口系统');
      this.showErrorMessage('系统错误，无法晋升阶级');
      return;
    }

    try {
      // 调用人口系统晋升阶级
      const success = this.scene.populationSystem.promoteClass(fromClass, toClass);

      if (success) {
        // 更新面板
        this.update();
      } else {
        // 显示错误消息
        this.showErrorMessage('没有足够的人口或资源进行晋升');
      }
    } catch (error) {
      console.error('晋升阶级时发生错误:', error);
      this.showErrorMessage('晋升阶级时发生错误');
    }
  }

  /**
   * 更新面板内容
   */
  update() {
    // 检查人口系统是否存在
    if (!this.scene.populationSystem) {
      console.warn('缺少必要的人口系统，无法更新面板');
      return;
    }

    // 保存当前位置
    const currentX = this.x;
    const currentY = this.y;

    // 销毁当前面板
    this.destroy();

    // 创建新的面板，使用当前位置
    const panel = new WorkerPanel(this.scene, {
      x: currentX,
      y: currentY
    });

    // 显示面板
    panel.show();

    // 更新UIManager中的引用
    this.scene.uiManager.workerPanel = panel;
  }

  /**
   * 显示晶升选项
   * @param {string} workerType - 工人类型
   */
  showPromotionOptions(workerType) {
    // 如果已存在晶升面板，先移除
    if (this.promotionPanel) {
      this.promotionPanel.destroy();
    }

    // 根据工人类型确定可用的晶升选项
    const promotionOptions = this.getPromotionOptions(workerType);

    // 创建晶升面板
    this.promotionPanel = this.scene.add.container(400, 300);

    // 创建背景
    const background = this.scene.add.rectangle(0, 0, 400, 300, 0x1a1a1a, 0.95)
      .setStrokeStyle(1, 0x4a4a4a);

    // 添加标题
    const title = this.scene.add.text(0, -130, '选择晶升路径', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 添加关闭按钮
    const closeBtn = new Button(this.scene, 180, -130, 'X', {
      width: 30,
      height: 30,
      backgroundColor: 0x4a4a4a,
      onClick: () => {
        this.promotionPanel.destroy();
        this.promotionPanel = null;
      }
    });

    // 添加晶升选项
    const optionElements = [];

    promotionOptions.forEach((option, index) => {
      const yPos = -80 + (index * 70);

      // 目标工人名称
      const nameText = this.scene.add.text(-150, yPos, `升级为: ${option.displayName}`, {
        fontSize: '16px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      // 资源需求
      let resourceText = '需要资源: ';
      for (const [resource, amount] of Object.entries(option.resources)) {
        resourceText += `${this.getResourceDisplayName(resource)} x${amount} `;
      }

      const reqText = this.scene.add.text(-150, yPos + 20, resourceText, {
        fontSize: '14px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 确认按钮
      const confirmBtn = new Button(this.scene, 120, yPos, '确认晶升', {
        width: 100,
        height: 40,
        backgroundColor: 0x2d6a4a,
        onClick: () => this.promoteWorker(workerType, option.type)
      });

      optionElements.push(nameText, reqText, ...confirmBtn.getElements());
    });

    // 添加所有元素到面板
    this.promotionPanel.add([background, title, ...closeBtn.getElements(), ...optionElements]);
  }

  /**
   * 获取晶升选项
   * @param {string} workerType - 工人类型
   * @returns {Array} - 晶升选项列表
   */
  getPromotionOptions(workerType) {
    const options = [];
    const populationSystem = this.scene.populationSystem || {};
    const workerTypes = populationSystem.workerTypes || {};
    const classPromotionRequirements = populationSystem.classPromotionRequirements || {};

    // 防止程序崩溃，如果没有必要的数据，直接返回空数组
    if (!workerTypes || !classPromotionRequirements) {
      console.warn('缺少必要的工人类型或晋升要求数据');
      return options;
    }

    // 获取工人类型的显示名称，如果不存在则使用默认名称
    const getWorkerDisplayName = (type) => {
      return (workerTypes[type] && workerTypes[type].displayName) || this.getWorkerDisplayName(type);
    };

    // 获取晋升资源要求，如果不存在则返回空对象
    const getPromotionResources = (key) => {
      return (classPromotionRequirements[key] && classPromotionRequirements[key].resources) || {};
    };

    switch (workerType) {
      case 'worker':
        // 工人可以升级为技工
        options.push({
          type: 'technician',
          displayName: getWorkerDisplayName('technician'),
          resources: getPromotionResources('worker_to_technician')
        });
        break;

      case 'technician':
        // 技工可以升级为工匠
        options.push({
          type: 'artisan',
          displayName: getWorkerDisplayName('artisan'),
          resources: getPromotionResources('technician_to_artisan')
        });
        break;

      case 'technical_staff':
        // 技术人员可以升级为工程师
        options.push({
          type: 'engineer',
          displayName: getWorkerDisplayName('engineer'),
          resources: getPromotionResources('technical_staff_to_engineer')
        });
        break;

      case 'accountant':
        // 会计可以升级为老板
        options.push({
          type: 'boss',
          displayName: getWorkerDisplayName('boss'),
          resources: getPromotionResources('accountant_to_boss')
        });
        break;

      case 'magic_technician':
        // 魔法技工可以升级为老板
        options.push({
          type: 'boss',
          displayName: getWorkerDisplayName('boss'),
          resources: getPromotionResources('magic_technician_to_boss')
        });
        break;
    }

    return options;
  }

  /**
   * 晶升工人
   * @param {string} fromType - 原工人类型
   * @param {string} toType - 目标工人类型
   */
  promoteWorker(fromType, toType) {
    // 检查必要的系统和数据是否存在
    if (!this.scene.populationSystem || !this.scene.resources) {
      console.warn('缺少必要的人口系统或资源系统');
      this.showErrorMessage('系统错误，无法晶升工人');
      return;
    }

    // 获取资源对象，如果不存在则使用空对象
    const resources = this.scene.resources.resources || {};

    try {
      // 尝试晶升工人
      const success = this.scene.populationSystem.promoteWorker(
        fromType,
        toType,
        resources
      );

      if (success) {
        // 关闭晶升面板
        if (this.promotionPanel) {
          this.promotionPanel.destroy();
          this.promotionPanel = null;
        }

        // 更新工人面板
        this.update();
      } else {
        // 显示错误消息
        this.showErrorMessage('资源不足或没有足够的工人');
      }
    } catch (error) {
      console.error('晶升工人时发生错误:', error);
      this.showErrorMessage('晶升工人时发生错误');
    }
  }

  /**
   * 显示错误消息
   * @param {string} message - 错误消息
   */
  showErrorMessage(message) {
    const errorText = this.scene.add.text(400, 200, message, {
      fontSize: '16px',
      fill: '#ff0000',
      backgroundColor: '#000000'
    }).setOrigin(0.5, 0);

    // 2秒后消失
    this.scene.time.delayedCall(2000, () => {
      errorText.destroy();
    });
  }

  /**
   * 获取资源显示名称
   * @param {string} resourceType - 资源类型
   * @returns {string} - 显示名称
   */
  getResourceDisplayName(resourceType) {
    const nameMap = {
      'magic_ore': 'Magic',
      'enchanted_wood': 'Wood',
      'arcane_crystal': 'Crystal',
      'mana': 'Mana',
      'arcane_essence': 'Essence',
      'mystic_planks': 'Planks',
      'refined_crystal': 'Refined',
      'magical_potion': 'Potion',
      'enchanted_artifact': 'Artifact',
      'magical_construct': 'Construct',
    };

    return nameMap[resourceType] || resourceType.replace('_', ' ');
  }

  /**
   * 获取阶级显示名称
   * @param {string} className - 阶级名称
   * @returns {string} - 显示名称
   */
  getClassDisplayName(className) {
    const classNames = {
      'lower': '下层阶级',
      'middle': '中层阶级',
      'upper': '上层阶级'
    };
    return classNames[className] || className;
  }

  /**
   * 获取工人显示名称
   * @param {string} workerType - 工人类型
   * @returns {string} - 显示名称
   */
  getWorkerDisplayName(workerType) {
    const nameMap = {
      'worker': '工人',
      'craftsman': '工匠',
      'technician': '技师',
      'engineer': '工程师',
      'wizard': '法师',
      'merchant': '商人'
    };

    return nameMap[workerType] || workerType;
  }
}
