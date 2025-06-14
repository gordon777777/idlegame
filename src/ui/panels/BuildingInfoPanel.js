import BasePanel from './BasePanel.js';
import Button from '../Button.js';
import DropdownList from '../DropdownList.js';

/**
 * 建筑信息面板
 * 显示建筑详细信息和操作选项
 */
export default class BuildingInfoPanel extends BasePanel {
  /**
   * 创建建筑信息面板
   * @param {Phaser.Scene} scene - 场景对象
   * @param {Object} buildingInfo - 建筑信息
   * @param {Object} config - 配置对象
   */
  constructor(scene, buildingInfo, config = {}) {
    // 调用父类构造函数
    super(scene, config.x || 1050, config.y || 500, {
      width: 400,
      height: 580, // 增加面板高度以适应更多的工人信息
      title: buildingInfo.name || '建筑信息',
      onClose: config.onClose || (() => {
        // 如果没有提供onClose回调，则使用默认行为
        this.handleClose();
      }),
      autoLayout: false // BuildingInfoPanel有复杂的自定义布局
    });

    // 保存建筑信息
    this.buildingInfo = buildingInfo;
    this.buildingId = buildingInfo.id;

    // 创建面板内容
    this.createContent();
  }

  /**
   * 创建面板内容
   */
  createContent() {
    // 定义常量以便于调整布局
    const containY = 0; // 内容的基准Y坐标

    // 添加等级信息
    const levelText = this.scene.add.text(0, containY - this.height/2 + 60, `等級: ${this.buildingInfo.level}`, {
      fontSize: '16px',
      fill: '#e0e0e0'
    }).setOrigin(0.5, 0);

    // 添加效率信息
    const efficiency = this.buildingInfo.efficiency || 100;
    const efficiencyColor = efficiency >= 100 ? '#00ff00' : (efficiency >= 50 ? '#ffff00' : '#ff0000');
    const efficiencyText = this.scene.add.text(0, containY - this.height/2 + 85, `效率: ${efficiency}%`, {
      fontSize: '16px',
      fill: efficiencyColor
    }).setOrigin(0.5, 0);

    // 添加工人信息
    let workerText = '';

    // 获取建筑的工人需求
    const workerRequirement = this.buildingInfo.workerRequirement;

    // 获取已分配的工人
    let assignedWorkers = 0;
    let assignedWorkerDetails = '';

    // 从人口系统中获取已分配的工人信息
    if (this.scene.populationSystem && this.buildingId) {
      const assignment = this.scene.populationSystem.workerAssignments.get(this.buildingId);
      if (assignment) {
        // 计算总分配数
        for (const [workerType, count] of Object.entries(assignment)) {
          assignedWorkers += count;
          // 添加工人类型详情
          const displayName = this.getWorkerDisplayName(workerType);
          assignedWorkerDetails += `\n  ${displayName}: ${count}`;
        }
      }
    }

    if (workerRequirement) {
      // 如果有工人需求
      let requiredCount = 0;
      let requiredWorkerDetails = '';

      // 如果是简单的工人需求对象
      if (workerRequirement.count !== undefined && workerRequirement.type !== undefined) {
        requiredCount = workerRequirement.count;
        const displayName = this.getWorkerDisplayName(workerRequirement.type);
        requiredWorkerDetails = `${displayName}`;
      }
      // 如果是复杂的工人需求对象
      else if (workerRequirement.workers) {
        for (const [workerType, count] of Object.entries(workerRequirement.workers)) {
          requiredCount += count;
          const displayName = this.getWorkerDisplayName(workerType);
          requiredWorkerDetails += `\n  ${displayName}: ${count}`;
        }
      }

      // 设置工人文本
      workerText = `工人: ${assignedWorkers}/${requiredCount}`;

      // 添加详细信息
      if (requiredWorkerDetails) {
        workerText += `\n需要:${requiredWorkerDetails}`;
      }

      if (assignedWorkerDetails) {
        workerText += `\n已分配:${assignedWorkerDetails}`;
      }
    } else {
      workerText = '无需工人';
    }

    const workerInfoText = this.scene.add.text(0, containY - this.height/2 + 110, workerText, {
      fontSize: '14px',
      fill: '#e0e0e0',
      align: 'center'
    }).setOrigin(0.5, 0);

    // 添加配方信息
    let recipeText = '配方: ';
    const inputResources = this.buildingInfo.inputResources || {};
    const outputResources = this.buildingInfo.outputResources || {};

    // 获取当前生产方式和副产品类型
    const currentMethod = this.buildingInfo.productionMethods?.find(m => m.id === this.buildingInfo.currentProductionMethod);
    const currentByproductType = this.buildingInfo.byproductTypes?.find(t => t.id === this.buildingInfo.currentByproductType);
    const currentWorkMode = this.buildingInfo.workModes?.find(m => m.id === this.buildingInfo.currentWorkMode);

    // 添加当前生产方式和工作模式的效率信息
    if (currentMethod || currentByproductType || currentWorkMode) {
      recipeText += '\n当前设置: ';
      if (currentMethod) {
        recipeText += `${currentMethod.name} `;
      }
      if (currentByproductType && currentByproductType.id !== 'none') {
        recipeText += `+ ${currentByproductType.name} `;
      }
      if (currentWorkMode) {
        recipeText += `+ ${currentWorkMode.name}`;
      }
    }

    // 添加输入资源
    if (Object.keys(inputResources).length > 0) {
      recipeText += '\n输入: ';
      Object.entries(inputResources).forEach(([resource, amount]) => {
        recipeText += `${this.getResourceDisplayName(resource)} x${amount} `;
      });
    }

    // 添加输出资源
    recipeText += '\n產出: ';
    Object.entries(outputResources).forEach(([resource, amount]) => {
      recipeText += `${this.getResourceDisplayName(resource)} x${amount} `;
    });

    // 添加副产品信息（如果有）
    if (this.buildingInfo.byproducts && Object.keys(this.buildingInfo.byproducts).length > 0 &&
        (!currentMethod || currentMethod.enableByproducts)) {
      recipeText += '\n副产品: ';
      Object.entries(this.buildingInfo.byproducts).forEach(([resource, amount]) => {
        // 处理概率性副产品
        const amountText = amount < 1 ? `${(amount * 100).toFixed(0)}%几率` : `x${amount}`;
        recipeText += `${this.getResourceDisplayName(resource)} ${amountText} `;
      });
    }

    const recipe = this.scene.add.text(0, containY - this.height/2 + 150, recipeText, {
      fontSize: '14px',
      fill: '#e0e0e0',
      align: 'center'
    }).setOrigin(0.5, 0);

    // 添加生产时间信息
    const productionInterval = this.buildingInfo.productionInterval || 0;
    const timeText = this.scene.add.text(0, containY - this.height/2 +200, `生产时间: ${(productionInterval/1000).toFixed(1)}秒`, {
      fontSize: '14px',
      fill: '#e0e0e0'
    }).setOrigin(0.5, 0);

    // 创建UI元素数组
    const uiElements = [];

    // 添加生产方法选择（如果有）
    if (this.buildingInfo.productionMethods && this.buildingInfo.productionMethods.length > 0) {
      // 创建生产方法选项
      const methodOptions = this.buildingInfo.productionMethods.map(method => ({
        id: method.id,
        text: method.name,
        description: method.description || ''
      }));

      // 创建生产方法标签
      const methodLabel = this.scene.add.text(-150, containY - this.height/2 +240, '生产方法:', {
        fontSize: '14px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 创建下拉列表
      const methodDropdown = new DropdownList(
        this.scene,
        this.container,
        -50,
        containY - this.height/2 +240,
        methodOptions,
        {
          width: 180,
          height: 30,
          selectedId: this.buildingInfo.currentProductionMethod || methodOptions[0].id,
          onChange: (methodId) => {
            this.handleProductionMethodSelect(methodId);
          }
        }
      );

      uiElements.push(methodLabel);
      uiElements.push(...methodDropdown.getElements());
    }

    // 添加副产品类型选择（如果有）
    if (this.buildingInfo.byproductTypes && this.buildingInfo.byproductTypes.length > 0) {
      // 创建副产品类型选项
      const byproductOptions = this.buildingInfo.byproductTypes.map(type => ({
        id: type.id,
        text: type.name,
        description: type.description || ''
      }));

      // 创建副产品类型标签
      const byproductLabel = this.scene.add.text(-150, containY - this.height/2 +330, '副产品类型:', {
        fontSize: '14px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 创建下拉列表
      const byproductDropdown = new DropdownList(
        this.scene,
        this.container,
        -50,
        containY - this.height/2 +330,
        byproductOptions,
        {
          width: 180,
          height: 30,
          selectedId: this.buildingInfo.currentByproductType || byproductOptions[0].id,
          onChange: (typeId) => {
            this.handleByproductTypeSelect(typeId);
          }
        }
      );

      uiElements.push(byproductLabel);
      uiElements.push(...byproductDropdown.getElements());
    }

    // 添加工作模式选择（如果有）
    if (this.buildingInfo.workModes && this.buildingInfo.workModes.length > 0) {
      // 创建工作模式选项
      const workModeOptions = this.buildingInfo.workModes.map(mode => ({
        id: mode.id,
        text: mode.name,
        description: mode.description || ''
      }));

      // 创建工作模式标签
      const workModeLabel = this.scene.add.text(-150, containY + 130, '工作模式:', {
        fontSize: '14px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 创建下拉列表
      const workModeDropdown = new DropdownList(
        this.scene,
        this.container,
        -50,
        containY + 130,
        workModeOptions,
        {
          width: 180,
          height: 30,
          selectedId: this.buildingInfo.currentWorkMode || workModeOptions[0].id,
          onChange: (modeId) => {
            this.handleWorkModeSelect(modeId);
          }
        }
      );

      uiElements.push(workModeLabel);
      uiElements.push(...workModeDropdown.getElements());
    }
    let PosY =  this.height/2  -80
    // 添加优先级按钮
    const priorityTitle = this.scene.add.text(-150, PosY -30, '工人分配优先级:', {
      fontSize: '14px',
      fill: '#e0e0e0'
    }).setOrigin(0, 0.5);

    // 当前优先级
    const currentPriority = this.buildingInfo.priority || 'medium';

    // 高优先级按钮
    const highPriorityBtn = new Button(this.scene, -100, PosY , '高', {
      width: 60,
      height: 30,
      backgroundColor: currentPriority === 'high' ? 0x8a3a3a : 0x4a4a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.handlePriorityChange('high')
    });

    // 中优先级按钮
    const mediumPriorityBtn = new Button(this.scene, 0, PosY , '中', {
      width: 60,
      height: 30,
      backgroundColor: currentPriority === 'medium' ? 0x8a8a3a : 0x4a4a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.handlePriorityChange('medium')
    });

    // 低优先级按钮
    const lowPriorityBtn = new Button(this.scene, 100, PosY, '低', {
      width: 60,
      height: 30,
      backgroundColor: currentPriority === 'low' ? 0x3a8a3a : 0x4a4a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.handlePriorityChange('low')
    });

    // 添加优先级说明
    const priorityDesc = this.scene.add.text(0, PosY +40, '高优先级建筑将优先获得工人分配', {
      fontSize: '12px',
      fill: '#cccccc',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    // 添加升级按钮
    const upgradeBtn = new Button(this.scene, 0, PosY +60, '升级', {
      width: 100,
      height: 30,
      backgroundColor: 0x4a6a4a,
      fontSize: '16px',
      textColor: '#ffffff',
      onClick: () => this.handleUpgrade()
    });

    // 添加所有元素到面板
    this.add([
      levelText, efficiencyText, workerInfoText, recipe, timeText,
      ...uiElements,
      priorityTitle, ...highPriorityBtn.getElements(), ...mediumPriorityBtn.getElements(), ...lowPriorityBtn.getElements(), priorityDesc,
      ...upgradeBtn.getElements()
    ]);
  }

  /**
   * 处理生产方法选择
   * @param {string} methodId - 生产方法ID
   */
  handleProductionMethodSelect(methodId) {
    console.log(`Selecting production method ${methodId} for building ${this.buildingId}`);

    // 获取建筑对象
    const building = this.scene.buildingSystem.buildings.get(this.buildingId);
    if (!building) return;

    // 设置生产方法
    const success = building.setProductionMethod(methodId);

    if (success) {
      // 更新生产链（如果resources存在）
      if (this.scene.resources) {
        this.scene.resources.addProductionChain(building);
      }

      // 更新建筑信息
      this.updateBuildingInfo(building.getInfo());
    }
  }

  /**
   * 处理副产品类型选择
   * @param {string} typeId - 副产品类型ID
   */
  handleByproductTypeSelect(typeId) {
    console.log(`Selecting byproduct type ${typeId} for building ${this.buildingId}`);

    // 获取建筑对象
    const building = this.scene.buildingSystem.buildings.get(this.buildingId);
    if (!building) return;

    // 设置副产品类型
    const success = building.setByproductType(typeId);

    if (success) {
      // 更新生产链（如果resources存在）
      if (this.scene.resources) {
        this.scene.resources.addProductionChain(building);
      }

      // 更新建筑信息
      this.updateBuildingInfo(building.getInfo());
    }
  }

  /**
   * 处理工作模式选择
   * @param {string} modeId - 工作模式ID
   */
  handleWorkModeSelect(modeId) {
    console.log(`Selecting work mode ${modeId} for building ${this.buildingId}`);

    // 获取建筑对象
    const building = this.scene.buildingSystem.buildings.get(this.buildingId);
    if (!building) return;

    // 设置工作模式
    const success = building.setWorkMode(modeId);

    if (success) {
      // 重新分配工人（因为工作模式可能会改变工人需求）
      if (this.scene.populationSystem) {
        this.scene.populationSystem.reallocateAllWorkers();
      }

      // 更新生产链（如果resources存在）
      if (this.scene.resources) {
        this.scene.resources.addProductionChain(building);
      }

      // 更新建筑信息
      this.updateBuildingInfo(building.getInfo());
    }
  }

  /**
   * 处理建筑升级
   */
  handleUpgrade() {
    console.log(`Upgrading building ${this.buildingId}`);

    // 获取建筑对象
    const building = this.scene.buildingSystem.buildings.get(this.buildingId);
    if (!building) return;

    // 获取资源系统
    if (!this.scene.resources) {
      console.error('Resource system not found');
      return;
    }

    // 获取升级成本
    const upgradeCost = this.calculateUpgradeCost(building);
    if (!upgradeCost) {
      console.error('Failed to calculate upgrade cost');
      return;
    }

    // 尝试升级建筑
    const success = building.upgrade(this.scene.resources.resources, upgradeCost);

    if (success) {
      // 更新建筑信息
      this.updateBuildingInfo(building.getInfo());
    } else {
      // 显示资源不足的提示
      const notification = this.scene.add.text(this.scene.scale.width / 2, 100, '资源不足，无法升级建筑', {
        fontSize: '18px',
        fill: '#ffffff',
        backgroundColor: '#aa3333',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5, 0.5).setDepth(100);

      // 2秒后自动消失
      this.scene.time.delayedCall(2000, () => {
        notification.destroy();
      });
    }
  }

  /**
   * 计算建筑升级成本
   * @param {Building} building - 建筑对象
   * @returns {Object} - 升级成本
   */
  calculateUpgradeCost(building) {
    // 基础成本是建筑的初始成本
    const baseCost = building.cost || {};

    // 根据当前等级计算升级成本（每级增加50%）
    const upgradeCost = {};
    Object.entries(baseCost).forEach(([resource, amount]) => {
      upgradeCost[resource] = Math.ceil(amount * (1 + building.level * 0.5));
    });

    return upgradeCost;
  }

  /**
   * 处理优先级变更
   * @param {string} priority - 新的优先级 ('high', 'medium', 'low')
   */
  handlePriorityChange(priority) {
    console.log(`Changing priority of building ${this.buildingId} to ${priority}`);

    // 获取建筑对象
    const building = this.scene.buildingSystem.buildings.get(this.buildingId);
    if (!building) return;

    // 设置新的优先级
    const success = building.setPriority(priority);

    if (success) {
      // 重新分配工人
      if (this.scene.populationSystem) {
        this.scene.populationSystem.reallocateAllWorkers();
      }

      // 更新建筑信息
      this.updateBuildingInfo(building.getInfo());

      // 显示成功消息
      const priorityNames = {
        'high': '高',
        'medium': '中',
        'low': '低'
      };

      const notification = this.scene.add.text(this.scene.scale.width / 2, 100, `已将建筑优先级设置为${priorityNames[priority]}`, {
        fontSize: '18px',
        fill: '#ffffff',
        backgroundColor: '#3a8c3a',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5, 0.5).setDepth(100);

      // 2秒后自动消失
      this.scene.time.delayedCall(2000, () => {
        notification.destroy();
      });
    }
  }

  /**
   * 更新建筑信息
   * @param {Object} buildingInfo - 新的建筑信息
   */
  updateBuildingInfo(buildingInfo) {
    // 保存新的建筑信息
    this.buildingInfo = buildingInfo;

    // 销毁当前面板
    this.destroy();

    // 创建新的面板
    const panel = new BuildingInfoPanel(this.scene, buildingInfo, {
      x: this.x,
      y: this.y
    });

    // 显示面板
    panel.show();
  }

  /**
   * 关闭面板
   */
  handleClose() {
    // 清除建筑系统中的选中建筑
    if (this.scene.buildingSystem) {
      this.scene.buildingSystem.selectedBuilding = null;
    }

    // 销毁面板
    this.destroy();

    // 清除UIManager中的引用
    if (this.scene.uiManager) {
      this.scene.uiManager.buildingInfoPanel = null;
    }
  }

  /**
   * 获取资源显示名称
   * @param {string} resourceType - 资源类型
   * @returns {string} - 格式化的显示名称
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
   * 获取工人显示名称
   * @param {string} workerType - 工人类型
   * @returns {string} - 格式化的显示名称
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
