/**
 * System for managing resources and production chains
 */
class ResourceSystem {
  /**
   * @param {Object} resourceSettings - Optional resource settings data from DataManager
   */
  constructor(resourceSettings = null) {
    // Map to store production chains
    this.productionChains = new Map();

    if (resourceSettings) {
      // Use provided resource settings
      this.resources = resourceSettings.resources;
      this.resourceCaps = resourceSettings.resourceCaps;
    } else {
      // Define all resources with their initial values and production rates
      this.resources = {
        // Basic resources (tier 1)
        magic_ore: { value: 200, production: 0, tier: 1, displayName: '魔法礦石' },
        enchanted_wood: { value: 200, production: 0, tier: 1, displayName: '附魔木材' },
        arcane_crystal: { value: 100, production: 0, tier: 1, displayName: '奧術水晶' },
        mana: { value: 100, production: 0, tier: 1, displayName: '魔力' },
        stone: { value: 50, production: 0, tier: 1, displayName: '石頭' },

        // Processed resources (tier 2)
        arcane_essence: { value: 50, production: 0, tier: 2, displayName: '奧術精華' },
        mystic_planks: { value: 50, production: 0, tier: 2, displayName: '神秘木板' },
        refined_crystal: { value: 0, production: 0, tier: 2, displayName: '精煉水晶' },
        research_point: { value: 20, production: 0, tier: 2, displayName: '研究點數' },

        // Advanced resources (tier 3)
        magical_potion: { value: 20, production: 0, tier: 3, displayName: '魔法藥水' },
        enchanted_artifact: { value: 10, production: 0, tier: 3, displayName: '附魔神器' },
        knowledge: { value: 30, production: 0, tier: 3, displayName: '知識' },

        // End products (tier 4)
        magical_construct: { value: 5, production: 0, tier: 4, displayName: '魔法構造體' },
        wizard: { value: 0, production: 0, tier: 4, displayName: '法師' }
      };

      // Resource caps
      this.resourceCaps = {};
      this.initializeResourceCaps();
    }

    // 添加资源历史记录，用于跟踪5天内的变化
    this.resourceHistory = {};
    this.historyDays = 5; // 跟踪5天的历史
    this.dayLength = 5000; // 游戏中1天的长度（毫秒）
    this.lastHistoryUpdate = 0;
    this.initializeResourceHistory();

    // Resource consumption stats
    this.consumptionStats = {};
    this.productionStats = {};
    this.initializeStats();
  }

  /**
   * Initialize resource caps based on tier
   */
  initializeResourceCaps() {
    Object.keys(this.resources).forEach(resource => {
      const tier = this.resources[resource].tier;
      // Higher tier resources have lower caps
      switch(tier) {
        case 1: this.resourceCaps[resource] = 1000; break;
        case 2: this.resourceCaps[resource] = 500; break;
        case 3: this.resourceCaps[resource] = 200; break;
        case 4: this.resourceCaps[resource] = 100; break;
        default: this.resourceCaps[resource] = 100;
      }
    });
  }

  /**
   * Initialize resource statistics
   */
  initializeStats() {
    Object.keys(this.resources).forEach(resource => {
      this.consumptionStats[resource] = 0;
      this.productionStats[resource] = 0;
    });
  }

  /**
   * 初始化资源历史记录
   */
  initializeResourceHistory() {
    Object.keys(this.resources).forEach(resource => {
      // 初始化每种资源的历史记录数组
      this.resourceHistory[resource] = [];

      // 填充初始值
      const currentValue = this.resources[resource].value;
      for (let i = 0; i < this.historyDays; i++) {
        this.resourceHistory[resource].push(currentValue);
      }
    });
  }

  /**
   * 更新资源历史记录
   * @param {number} time - 当前游戏时间
   */
  updateResourceHistory(time) {
    // 每天更新一次历史记录
    if (time - this.lastHistoryUpdate >= this.dayLength) {
      Object.keys(this.resources).forEach(resource => {
        // 移除最早的记录
        if (this.resourceHistory[resource].length >= this.historyDays) {
          this.resourceHistory[resource].shift();
        }

        // 添加新的记录
        this.resourceHistory[resource].push(this.resources[resource].value);
      });

      this.lastHistoryUpdate = time;
    }
  }

  /**
   * 获取资源在过去5天的变化趋势
   * @param {string} resource - 资源类型
   * @returns {string} - 变化趋势: 'increase', 'decrease', 'stable'
   */
  getResourceTrend(resource) {
    if (!this.resourceHistory[resource] || this.resourceHistory[resource].length < 2) {
      return 'stable';
    }

    const history = this.resourceHistory[resource];
    const oldest = history[0];
    const newest = history[history.length - 1];

    // 计算变化百分比
    const changePercent = ((newest - oldest) / Math.max(1, oldest)) * 100;

    if (changePercent > 5) {
      return 'increase';
    } else if (changePercent < -5) {
      return 'decrease';
    } else {
      return 'stable';
    }
  }

  /**
   * Add a production chain to the system
   * @param {Building} building - The building to add
   */
  addProductionChain(building) {
    // 获取当前生产方式的输入和输出资源
    const inputResources = building.getCurrentInputResources ? building.getCurrentInputResources() : building.recipe.input;
    const outputResources = building.getCurrentOutputResources ? building.getCurrentOutputResources() : building.recipe.output;
    const byproductResources = building.getCurrentByproducts ? building.getCurrentByproducts() : {};

    // 获取当前生产方式的时间修正
    const productionMethod = building.getCurrentProductionMethod ? building.getCurrentProductionMethod() : null;
    const timeModifier = productionMethod ? productionMethod.timeModifier : 1.0;
    const adjustedInterval = building.productionInterval * timeModifier;

    this.productionChains.set(building.id, {
      input: inputResources,
      output: outputResources,
      byproducts: byproductResources,
      interval: adjustedInterval,
      baseInterval: building.productionInterval,
      lastProduction: 0,
      efficiency: building.efficiency || 1.0,
      active: true,
      buildingId: building.id
    });
  }

  /**
   * Update all production chains
   * @param {number} time - Current game time
   * @param {number} delta - Time since last update in ms
   */
  update(time, delta) {
    // 更新资源历史记录
    this.updateResourceHistory(time);

    // Reset production rates
    Object.keys(this.resources).forEach(resource => {
      this.resources[resource].production = 0;
    });

    // Process each production chain
    this.productionChains.forEach((chain, id) => {
      if (!chain.active) return;

      if (time - chain.lastProduction > chain.interval) {
        if (this.hasResources(chain.input)) {
          // 检查是否有足够的空间存储输出资源和副产品
          const allOutputs = { ...chain.output };

          // 添加副产品（如果有）
          if (chain.byproducts) {
            Object.entries(chain.byproducts).forEach(([resource, amount]) => {
              // 处理概率性副产品（小于1的值表示概率）
              const actualAmount = amount < 1 ? (Math.random() < amount ? 1 : 0) : amount;
              if (actualAmount > 0) {
                if (allOutputs[resource]) {
                  allOutputs[resource] += actualAmount;
                } else {
                  allOutputs[resource] = actualAmount;
                }
              }
            });
          }

          // 检查是否有足够的空间
          const hasSpace = Object.entries(allOutputs).every(([resource, amount]) => {
            return this.resources[resource].value + amount <= this.resourceCaps[resource];
          });

          if (hasSpace) {
            // Consume input resources
            this.consumeResources(chain.input);

            // Add output resources
            this.addResources(allOutputs);

            // Update stats
            Object.entries(chain.input).forEach(([resource, amount]) => {
              this.consumptionStats[resource] += amount;
            });

            Object.entries(allOutputs).forEach(([resource, amount]) => {
              this.productionStats[resource] += amount;
            });

            // Update production rates (per minute)
            Object.entries(allOutputs).forEach(([resource, amount]) => {
              const perMinute = (amount * 60000) / chain.interval;
              this.resources[resource].production += perMinute * chain.efficiency;
            });

            chain.lastProduction = time;
          }
        }
      }
    });
  }

  /**
   * Check if we have enough of the specified resources
   * @param {Object} resources - Map of resource types to amounts
   * @returns {boolean} - Whether we have enough resources
   */
  hasResources(resources) {
    return Object.entries(resources).every(([type, amount]) =>
      this.resources[type]?.value >= amount
    );
  }

  /**
   * Consume resources from the global pool
   * @param {Object} resources - Map of resource types to amounts
   */
  consumeResources(resources) {
    Object.entries(resources).forEach(([type, amount]) => {
      if (this.resources[type]) {
        this.resources[type].value = Math.max(0, this.resources[type].value - amount);
      }
    });
  }

  /**
   * Add resources to the global pool
   * @param {Object} resources - Map of resource types to amounts
   */
  addResources(resources) {
    Object.entries(resources).forEach(([type, amount]) => {
      if (this.resources[type]) {
        // Add resources up to the cap
        const newValue = this.resources[type].value + amount;
        this.resources[type].value = Math.min(newValue, this.resourceCaps[type] || Infinity);
      }
    });
  }

  /**
   * Get resources by tier
   * @param {number} tier - Resource tier to filter by
   * @returns {Object} - Resources of the specified tier
   */
  getResourcesByTier(tier) {
    const result = {};

    Object.entries(this.resources).forEach(([key, resource]) => {
      if (resource.tier === tier) {
        result[key] = resource;
      }
    });

    return result;
  }

  /**
   * Increase resource cap
   * @param {string} resourceType - Type of resource
   * @param {number} amount - Amount to increase cap by
   */
  increaseResourceCap(resourceType, amount) {
    if (this.resourceCaps[resourceType]) {
      this.resourceCaps[resourceType] += amount;
    }
  }

  /**
   * Get production statistics
   * @returns {Object} - Production statistics
   */
  getProductionStats() {
    return {
      production: this.productionStats,
      consumption: this.consumptionStats
    };
  }

  /**
   * 出售資源到市場
   * @param {string} resourceType - 資源類型
   * @param {number} amount - 出售數量
   * @param {number} price - 出售價格
   * @returns {Object} - 交易結果 {success, profit, message}
   */
  sellResourceToMarket(resourceType, amount, price) {
    // 檢查資源是否存在
    if (!this.resources[resourceType]) {
      return { success: false, profit: 0, message: '資源不存在' };
    }

    // 檢查資源數量是否足夠
    if (this.resources[resourceType].value < amount) {
      return {
        success: false,
        profit: 0,
        message: '資源不足',
        available: this.resources[resourceType].value
      };
    }

    // 計算利潤
    const profit = amount * price;

    // 減少資源
    this.resources[resourceType].value -= amount;

    // 觸發資源出售事件
    if (window.game && window.game.scene.scenes.length > 0) {
      const gameScene = window.game.scene.scenes.find(scene => scene.key === 'GameScene');
      if (gameScene) {
        gameScene.events.emit('resourceSold', profit);
      }
    }

    // 返回交易結果
    return {
      success: true,
      profit: profit,
      message: `成功出售 ${amount} 個 ${this.resources[resourceType].displayName || resourceType}，獲得 ${profit} 金幣`
    };
  }
}

export default ResourceSystem;