/**
 * Building class for the medieval magic city-building game
 * Represents a production building that can be placed in the game world
 */
export default class Building {
  /**
   * @param {Object} config - Building configuration
   * @param {string} config.id - Unique identifier for the building
   * @param {string} config.name - Display name of the building
   * @param {string} config.type - Building type (production, storage, etc.)
   * @param {string} config.sprite - Sprite key for the building
   * @param {Object} config.recipe - Production recipe (input/output resources)
   * @param {Object} config.byproducts - Optional byproducts produced by the building
   * @param {Array} config.productionMethods - Optional production methods available for this building
   * @param {number} config.productionInterval - Time in ms to produce one batch
   * @param {Object} config.cost - Resources required to build
   * @param {number} config.level - Current building level
   * @param {Object} config.position - {x, y} position in the game world
   * @param {Phaser.Scene} scene - The scene this building belongs to
   */
  constructor(config, scene) {
    this.id = config.id || `building_${Date.now()}`;
    this.name = config.name;
    this.type = config.type;
    this.spriteKey = config.sprite;
    this.recipe = config.recipe || { input: {}, output: {} };
    this.byproductTypes = config.byproductTypes || []; // 副产品类型选项
    this.currentByproductType = config.byproductTypes?.length > 0 ? config.byproductTypes[0].id : null; // 当前选择的副产品类型
    this.productionMethods = config.productionMethods || []; // 生产方式选项
    this.currentProductionMethod = config.productionMethods?.length > 0 ? config.productionMethods[0].id : null; // 当前选择的生产方式
    this.workModes = config.workModes || []; // 工作模式选项
    this.currentWorkMode = config.workModes?.length > 0 ? config.workModes[0].id : null; // 当前选择的工作模式
    this.productionInterval = config.productionInterval || 5000; // Default 5 seconds
    this.cost = config.cost || {};
    this.level = config.level || 1;
    this.position = config.position || { x: 0, y: 0 };
    this.scene = scene;
    this.sprite = null;
    this.productionProgress = 0;
    this.isProducing = false;
    this.isActive = true; // Whether the building has workers and can operate
    this.lastProductionTime = 0;
    this.efficiency = 1.0; // Production efficiency multiplier
    this.workerEfficiency = 1.0; // Efficiency multiplier from workers
    this.storage = {}; // Internal storage for resources
    this.statusText = null; // Text to show building status (active/inactive)
    this.workerRequirement = config.workerRequirement || { count: 10, type: 'worker' }; // 默认工人需求
    this.priority = config.priority || 'medium'; // 工人分配优先级: 'high', 'medium', 'low'

    this.createSprite();
  }

  /**
   * Create the sprite for this building
   */
  createSprite() {
    this.sprite = this.scene.add.sprite(this.position.x, this.position.y, this.spriteKey)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.selectBuilding(this.id);
      });

    // 功能性建筑不需要进度条（包括住房、效用建筑等）
    if (this.type !== 'housing' && this.type !== 'utility' && this.type !== 'special') {
      // Add a progress bar for production
      this.progressBar = this.scene.add.rectangle(
        this.position.x,
        this.position.y + 40,
        0, 5, 0x00ff00
      );
    } else {
      // 为功能性建筑创建一个空的进度条（不可见），以避免空引用错误
      this.progressBar = this.scene.add.rectangle(
        this.position.x,
        this.position.y + 40,
        0, 0, 0x00ff00
      ).setVisible(false);
    }

    // Add level indicator
    this.levelText = this.scene.add.text(
      this.position.x - 15,
      this.position.y - 40,
      `Lv.${this.level}`,
      { fontSize: '12px', fill: '#ffffff' }
    );

    // Add status indicator
    this.statusText = this.scene.add.text(
      this.position.x,
      this.position.y - 60,
      this.isActive ? '' : '缺少工人',
      { fontSize: '10px', fill: '#ff0000', backgroundColor: '#000000' }
    ).setOrigin(0.5, 0);

    // If inactive, tint the sprite
    if (!this.isActive) {
      this.sprite.setTint(0x888888);
    }
  }

  /**
   * Start production if resources are available
   * @param {Object} availableResources - Resources available in the global pool
   * @returns {boolean} - Whether production started
   */
  startProduction(availableResources) {
    // 功能性建筑不参与生产（包括住房、效用建筑等）
    if (this.type === 'housing' || this.type === 'utility' || this.type === 'special') return false;

    if (this.isProducing) return true;

    // 获取当前生产方式的输入资源需求
    const inputResources = this.getCurrentInputResources();

    // Check if we have all required input resources
    const canProduce = Object.entries(inputResources).every(
      ([resource, amount]) => availableResources[resource]?.value >= amount
    );

    if (canProduce) {
      this.isProducing = true;
      this.productionProgress = 0;
      return true;
    }

    return false;
  }

  /**
   * Update production progress
   * @param {number} time - Current game time
   * @param {number} delta - Time since last update
   * @param {Object} resourceSystem - Reference to the resource system
   * @returns {Object|null} - Produced resources or null if not complete
   */
  updateProduction(time, delta, resourceSystem) {
    // 功能性建筑不参与生产（包括住房、效用建筑等）
    if (this.type === 'housing' || this.type === 'utility' || this.type === 'special') return null;

    // 如果建築不活動（沒有工人）或不在生產中，則返回空
    if (!this.isActive || !this.isProducing) return null;

    // 获取当前生产时间（已包含所有修正因素）
    const adjustedInterval = this.getCurrentProductionTime();

    // 計算進度 - 結合建築效率和工人效率
    const totalEfficiency = this.efficiency * this.workerEfficiency;
    this.productionProgress += (delta * totalEfficiency);
    const progressPercent = Math.min(1, this.productionProgress / adjustedInterval);

    // 更新進度條
    this.progressBar.width = 60 * progressPercent;

    // 檢查生產是否完成
    if (this.productionProgress >= adjustedInterval) {
      this.isProducing = false;
      this.productionProgress = 0;
      this.progressBar.width = 0;
      this.lastProductionTime = time;

      // 获取当前生产方式的输入和输出资源
      const inputResources = this.getCurrentInputResources();
      const outputResources = this.getCurrentOutputResources();
      const byproductResources = this.getCurrentByproducts();

      // 消耗輸入資源
      resourceSystem.consumeResources(inputResources);

      // 合并输出资源和副产品
      const combinedOutput = { ...outputResources };

      // 添加副产品（如果有）
      if (Object.keys(byproductResources).length > 0) {
        Object.entries(byproductResources).forEach(([resource, amount]) => {
          if (combinedOutput[resource]) {
            combinedOutput[resource] += amount;
          } else {
            combinedOutput[resource] = amount;
          }
        });
      }

      // 返回輸出資源
      return combinedOutput;
    }

    return null;
  }

  /**
   * Upgrade the building to the next level
   * @param {Object} availableResources - Resources available in the global pool
   * @param {Object} upgradeCost - Cost to upgrade
   * @returns {boolean} - Whether upgrade was successful
   */
  upgrade(availableResources, upgradeCost) {
    // Check if we have enough resources for the upgrade
    const canUpgrade = Object.entries(upgradeCost).every(
      ([resource, amount]) => availableResources[resource]?.value >= amount
    );

    if (canUpgrade) {
      // Consume upgrade resources
      Object.entries(upgradeCost).forEach(([resource, amount]) => {
        availableResources[resource].value -= amount;
      });

      // Increase level
      this.level++;
      this.levelText.setText(`Lv.${this.level}`);

      // Improve production efficiency
      this.efficiency += 0.2;

      // Increase output by 20%
      Object.keys(this.recipe.output).forEach(resource => {
        this.recipe.output[resource] = Math.ceil(this.recipe.output[resource] * 1.2);
      });

      return true;
    }

    return false;
  }

  /**
   * Get information about this building for display
   * @returns {Object} - Building information
   */
  getInfo() {
    // 获取当前生产时间（已包含所有修正因素）
    const adjustedInterval = this.getCurrentProductionTime();

    // 获取当前副产品类型
    const byproductType = this.getCurrentByproductType();
    const byproducts = byproductType ? byproductType.resources : {};

    // 获取当前生产方式
    const productionMethod = this.getCurrentProductionMethod();

    // 获取当前工作模式
    const workMode = this.getCurrentWorkMode();

    return {
      id: this.id,
      name: this.name,
      level: this.level,
      type: this.type,
      efficiency: this.efficiency,
      workerEfficiency: this.workerEfficiency,
      totalEfficiency: this.efficiency * this.workerEfficiency,
      recipe: this.recipe,
      byproducts: byproducts,
      byproductTypes: this.byproductTypes,
      currentByproductType: this.currentByproductType,
      productionMethods: this.productionMethods,
      currentProductionMethod: this.currentProductionMethod,
      workModes: this.workModes,
      currentWorkMode: this.currentWorkMode,
      productionInterval: adjustedInterval,
      baseProductionInterval: this.productionInterval,
      isProducing: this.isProducing,
      isActive: this.isActive,
      productionTimeLeft: this.isProducing ?
        adjustedInterval - this.productionProgress : 0,
      workerRequirement: this.getCurrentWorkerRequirement(),
      priority: this.priority,
      inputResources: this.getCurrentInputResources(),
      outputResources: this.getCurrentOutputResources()
    };
  }

  /**
   * 設置建築的活動狀態
   * @param {boolean} active - 是否活動
   * @param {number} workerEfficiency - 工人提供的效率乘數
   */
  setActive(active, workerEfficiency = 1.0) {
    this.isActive = active;
    this.workerEfficiency = workerEfficiency;

    // 更新視覺效果
    if (this.sprite) {
      if (!active) {
        this.sprite.setTint(0x888888);
        if (this.statusText) {
          this.statusText.setText('缺少工人')
                         .setFill('#ff0000')
                         .setBackgroundColor('#000000');
        }
      } else {
        this.sprite.clearTint();
        if (this.statusText) {
          // 显示优先级
          const priorityColors = {
            'high': '#ff0000',   // 高优先级显示为红色
            'medium': '#ffff00', // 中优先级显示为黄色
            'low': '#00ff00'     // 低优先级显示为绿色
          };

          this.statusText.setText(`优先级: ${this.getPriorityDisplayName()}`)
                         .setFill(priorityColors[this.priority] || '#ffff00')
                         .setBackgroundColor('#000000');

          // 如果工人效率低于1.0，显示工人不足的提示
          if (workerEfficiency < 1.0) {
            this.statusText.setText(`优先级: ${this.getPriorityDisplayName()} (工人: ${Math.floor(workerEfficiency * 100)}%)`)
                           .setFill(priorityColors[this.priority] || '#ffff00')
                           .setBackgroundColor('#000000');
          }
        }
      }
    }
  }

  /**
   * Clean up resources when building is destroyed
   */
  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.progressBar) this.progressBar.destroy();
    if (this.levelText) this.levelText.destroy();
    if (this.statusText) this.statusText.destroy();
  }

  /**
   * 设置当前生产方式
   * @param {string} methodId - 生产方式ID
   * @returns {boolean} - 是否成功设置
   */
  setProductionMethod(methodId) {
    // 检查是否有此生产方式
    const methodExists = this.productionMethods.some(method => method.id === methodId);
    if (!methodExists) return false;

    // 设置当前生产方式
    this.currentProductionMethod = methodId;
    return true;
  }

  /**
   * 获取当前生产方式
   * @returns {Object|null} - 当前生产方式对象
   */
  getCurrentProductionMethod() {
    if (!this.currentProductionMethod) return null;
    return this.productionMethods.find(method => method.id === this.currentProductionMethod) || null;
  }

  /**
   * 获取当前生产方式的输入资源
   * @returns {Object} - 输入资源
   */
  getCurrentInputResources() {
    const method = this.getCurrentProductionMethod();
    if (!method) return this.recipe.input;

    // 如果生产方式有自定义输入资源，则使用它
    if (method.input) return method.input;

    // 否则，根据生产方式的输入修正来调整基础输入
    const result = { ...this.recipe.input };
    if (method.inputModifiers) {
      Object.entries(method.inputModifiers).forEach(([resource, modifier]) => {
        if (result[resource]) {
          result[resource] = Math.ceil(result[resource] * modifier);
        } else if (modifier > 0) {
          // 如果基础输入中没有这个资源，但修正值大于0，则添加它
          result[resource] = Math.ceil(modifier);
        }
      });
    }

    return result;
  }

  /**
   * 获取当前生产方式的输出资源
   * @returns {Object} - 输出资源
   */
  getCurrentOutputResources() {
    const method = this.getCurrentProductionMethod();
    if (!method) return this.recipe.output;

    // 如果生产方式有自定义输出资源，则使用它
    if (method.output) return method.output;

    // 否则，根据生产方式的输出修正来调整基础输出
    const result = { ...this.recipe.output };
    if (method.outputModifiers) {
      Object.entries(method.outputModifiers).forEach(([resource, modifier]) => {
        if (result[resource]) {
          result[resource] = Math.ceil(result[resource] * modifier);
        } else if (modifier > 0) {
          // 如果基础输出中没有这个资源，但修正值大于0，则添加它
          result[resource] = Math.ceil(modifier);
        }
      });
    }

    return result;
  }

  /**
   * 设置当前副产品类型
   * @param {string} typeId - 副产品类型ID
   * @returns {boolean} - 是否成功设置
   */
  setByproductType(typeId) {
    // 检查是否有此副产品类型
    const typeExists = this.byproductTypes.some(type => type.id === typeId);
    if (!typeExists) return false;

    // 设置当前副产品类型
    this.currentByproductType = typeId;
    return true;
  }

  /**
   * 获取当前副产品类型
   * @returns {Object|null} - 当前副产品类型对象
   */
  getCurrentByproductType() {
    if (!this.currentByproductType) return null;
    return this.byproductTypes.find(type => type.id === this.currentByproductType) || null;
  }

  /**
   * 获取当前生产方式的副产品
   * @returns {Object} - 副产品
   */
  getCurrentByproducts() {
    const method = this.getCurrentProductionMethod();
    if (!method || !method.enableByproducts) return {};

    // 获取当前副产品类型
    const byproductType = this.getCurrentByproductType();
    if (!byproductType) return {};

    // 返回当前副产品类型的资源
    return byproductType.resources || {};
  }

  /**
   * 获取当前生产方式的工人需求
   * @returns {Object} - 工人需求 {count, type}
   */
  getCurrentWorkerRequirement() {
    // 获取基础工人需求（从生产方式或建筑默认值）
    const method = this.getCurrentProductionMethod();
    let baseRequirement = method && method.workerRequirement ? method.workerRequirement : this.workerRequirement;

    // 获取副产品类型的工人需求修正
    const byproductType = this.getCurrentByproductType();
    if (byproductType && byproductType.workerRequirement) {
      baseRequirement = byproductType.workerRequirement;
    }

    // 获取工作模式的工人需求修正
    const workMode = this.getCurrentWorkMode();
    if (workMode && workMode.workerModifier) {
      // 创建一个新对象，避免修改原始对象
      const result = { ...baseRequirement };
      // 修改工人数量
      if (result.count) {
        result.count = Math.ceil(result.count * workMode.workerModifier);
      } else if (result.workers) {
        // 如果是复杂的工人需求对象，修改每种工人的数量
        const modifiedWorkers = {};
        Object.entries(result.workers).forEach(([type, count]) => {
          modifiedWorkers[type] = Math.ceil(count * workMode.workerModifier);
        });
        result.workers = modifiedWorkers;
      }
      return result;
    }

    return baseRequirement;
  }

  /**
   * 设置建筑优先级
   * @param {string} priority - 优先级 ('high', 'medium', 'low')
   * @returns {boolean} - 是否成功设置
   */
  setPriority(priority) {
    if (!['high', 'medium', 'low'].includes(priority)) return false;

    this.priority = priority;

    // 更新状态文本颜色
    if (this.statusText) {
      const priorityColors = {
        'high': '#ff0000',   // 高优先级显示为红色
        'medium': '#ffff00', // 中优先级显示为黄色
        'low': '#00ff00'     // 低优先级显示为绿色
      };

      // 如果建筑处于活动状态，显示优先级标记
      if (this.isActive) {
        this.statusText.setText(`优先级: ${this.getPriorityDisplayName()}`)
                       .setFill(priorityColors[priority])
                       .setBackgroundColor('#000000');
      }
    }

    return true;
  }

  /**
   * 获取优先级的显示名称
   * @returns {string} - 优先级显示名称
   */
  getPriorityDisplayName() {
    const displayNames = {
      'high': '高',
      'medium': '中',
      'low': '低'
    };

    return displayNames[this.priority] || '中';
  }

  /**
   * 设置当前工作模式
   * @param {string} modeId - 工作模式 ID
   * @returns {boolean} - 是否成功设置
   */
  setWorkMode(modeId) {
    // 检查是否有此工作模式
    const modeExists = this.workModes.some(mode => mode.id === modeId);
    if (!modeExists) return false;

    // 设置当前工作模式
    this.currentWorkMode = modeId;
    return true;
  }

  /**
   * 获取当前工作模式
   * @returns {Object|null} - 当前工作模式对象
   */
  getCurrentWorkMode() {
    if (!this.currentWorkMode) return null;
    return this.workModes.find(mode => mode.id === this.currentWorkMode) || null;
  }

  /**
   * 获取当前生产时间
   * @returns {number} - 生产时间（毫秒）
   */
  getCurrentProductionTime() {
    let time = this.productionInterval;

    // 应用生产方式的时间修正
    const method = this.getCurrentProductionMethod();
    if (method && method.timeModifier) {
      time *= method.timeModifier;
    }

    // 应用副产品类型的时间修正
    const byproductType = this.getCurrentByproductType();
    if (byproductType && byproductType.timeModifier) {
      time *= byproductType.timeModifier;
    }

    // 应用工作模式的时间修正
    const workMode = this.getCurrentWorkMode();
    if (workMode && workMode.timeModifier) {
      time *= workMode.timeModifier;
    }

    return time;
  }
}
