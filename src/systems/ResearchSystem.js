/**
 * System for managing research and technology progression
 */
export default class ResearchSystem {
  /**
   * @param {ResourceSystem} resourceSystem - Reference to the resource system
   * @param {Object} technologies - Optional technologies data from DataManager
   * @param {Object} gameState - Game state reference for gold and other resources
   * @param {Object} buildingSystem - Reference to the building system
   */
  constructor(resourceSystem, technologies = null, gameState = null, buildingSystem = null) {
    this.resourceSystem = resourceSystem;
    this.gameState = gameState;
    this.buildingSystem = buildingSystem;
    this.technologies = technologies || this.defineTechnologies();
    this.researchPoints = 0;
    this.researchRate = 0.1; // Research points per second
    this.completedResearch = new Set();
    this.activeResearch = null;
    this.researchProgress = 0;
    this.researchTimeProgress = 0; // 研究时间进度（天）
    this.failedResearch = new Set(); // 记录失败的研究
    this.researchAttempts = {}; // 记录每项研究的尝试次数
    this.consumedResources = {}; // 记录已消耗的资源
    this.consumedGold = 0; // 记录已消耗的金币
    this.buildingWorkHoursProgress = {}; // 记录建筑工时进度
  }

  /**
   * Define all available technologies
   * @returns {Object} - Map of technology definitions
   */
  defineTechnologies() {
    return {
      // Basic resource technologies
      improved_mining: {
        name: 'Improved Mining',
        description: 'Increases magic ore production by 20%',
        cost: 10,
        requirements: [],
        effects: {
          productionMultiplier: { resource: 'magic_ore', value: 1.2 }
        }
      },

      efficient_forestry: {
        name: 'Efficient Forestry',
        description: 'Increases enchanted wood production by 20%',
        cost: 10,
        requirements: [],
        effects: {
          productionMultiplier: { resource: 'enchanted_wood', value: 1.2 }
        }
      },

      crystal_resonance: {
        name: 'Crystal Resonance',
        description: 'Increases arcane crystal production by 20%',
        cost: 10,
        requirements: [],
        effects: {
          productionMultiplier: { resource: 'arcane_crystal', value: 1.2 }
        }
      },

      // Intermediate technologies
      arcane_metallurgy: {
        name: 'Arcane Metallurgy',
        description: 'Improves Magic Forge efficiency by 25%',
        cost: 20,
        requirements: ['improved_mining'],
        effects: {
          buildingEfficiency: { building: 'magic_forge', value: 1.25 }
        }
      },

      mystic_carpentry: {
        name: 'Mystic Carpentry',
        description: 'Improves Wood Enchanter efficiency by 25%',
        cost: 20,
        requirements: ['efficient_forestry'],
        effects: {
          buildingEfficiency: { building: 'wood_enchanter', value: 1.25 }
        }
      },

      crystal_harmonics: {
        name: 'Crystal Harmonics',
        description: 'Improves Crystal Refinery efficiency by 25%',
        cost: 20,
        requirements: ['crystal_resonance'],
        effects: {
          buildingEfficiency: { building: 'crystal_refinery', value: 1.25 }
        }
      },

      // Advanced technologies
      alchemical_mastery: {
        name: 'Alchemical Mastery',
        description: 'Improves Alchemy Lab efficiency by 30%',
        cost: 30,
        requirements: ['arcane_metallurgy', 'crystal_harmonics'],
        effects: {
          buildingEfficiency: { building: 'alchemy_lab', value: 1.3 }
        }
      },

      enchantment_mastery: {
        name: 'Enchantment Mastery',
        description: 'Improves Enchanting Tower efficiency by 30%',
        cost: 30,
        requirements: ['mystic_carpentry', 'crystal_harmonics'],
        effects: {
          buildingEfficiency: { building: 'enchanting_tower', value: 1.3 }
        }
      },

      // Storage technologies
      expanded_warehouses: {
        name: 'Expanded Warehouses',
        description: 'Increases storage capacity of all resources by 20%',
        cost: 15,
        requirements: [],
        effects: {
          storageCap: { multiplier: 1.2 }
        }
      },

      magical_containers: {
        name: 'Magical Containers',
        description: 'Increases storage capacity of all resources by 30%',
        cost: 25,
        requirements: ['expanded_warehouses'],
        effects: {
          storageCap: { multiplier: 1.3 }
        }
      },

      // Efficiency technologies
      resource_optimization: {
        name: 'Resource Optimization',
        description: 'Reduces resource consumption by 10%',
        cost: 20,
        requirements: [],
        effects: {
          resourceConsumption: { multiplier: 0.9 }
        }
      },

      magical_efficiency: {
        name: 'Magical Efficiency',
        description: 'All buildings work 15% faster',
        cost: 35,
        requirements: ['resource_optimization'],
        effects: {
          productionSpeed: { multiplier: 0.85 } // Reduces time needed
        }
      },

      // End-game technologies
      arcane_mastery: {
        name: 'Arcane Mastery',
        description: 'Improves Arcane Workshop efficiency by 50%',
        cost: 50,
        requirements: ['alchemical_mastery', 'enchantment_mastery'],
        effects: {
          buildingEfficiency: { building: 'arcane_workshop', value: 1.5 }
        }
      }
    };
  }

  /**
   * Update research progress
   * @param {number} delta - Time since last update in ms
   */
  update(delta) {
    if (!this.activeResearch) return;

    const tech = this.technologies[this.activeResearch];
    if (!tech) return;

    // Convert delta from ms to seconds
    const deltaSeconds = delta / 1000;

    // 每天的秒数 (5秒真实时间 = 1天游戏时间)
    const secondsPerDay = 5;

    // 更新研究时间进度
    this.researchTimeProgress += deltaSeconds / secondsPerDay;

    // 更新研究点数进度
    this.researchProgress += this.researchRate * deltaSeconds;

    // 更新建筑工时进度
    if (tech.requirements && tech.requirements.buildingWorkHours) {
      Object.keys(tech.requirements.buildingWorkHours).forEach(buildingType => {
        // 检查建筑是否存在并正在运行
        const buildings = this.buildingSystem ? this.buildingSystem.getBuildingsByType(buildingType) : [];
        const activeBuildings = buildings.filter(b => b.isActive);

        if (activeBuildings.length > 0) {
          // 每个活跃建筑每秒贡献1小时的工时
          const hoursPerSecond = activeBuildings.length * (1 / 3600);

          // 初始化建筑工时进度
          if (!this.buildingWorkHoursProgress[buildingType]) {
            this.buildingWorkHoursProgress[buildingType] = 0;
          }

          // 更新建筑工时进度
          this.buildingWorkHoursProgress[buildingType] += hoursPerSecond * deltaSeconds;
        }
      });
    }

    // 检查研究是否完成
    const requirements = tech.requirements || {};
    const requiredTime = requirements.time || 0;
    const requiredResearchPoints = requirements.researchPoints || 0;
    const requiredBuildingWorkHours = requirements.buildingWorkHours || {};

    // 检查所有条件是否满足
    let timeComplete = this.researchTimeProgress >= requiredTime;
    let pointsComplete = this.researchProgress >= requiredResearchPoints;
    let buildingWorkHoursComplete = true;

    // 检查建筑工时是否满足
    Object.entries(requiredBuildingWorkHours).forEach(([buildingType, hours]) => {
      const progress = this.buildingWorkHoursProgress[buildingType] || 0;
      if (progress < hours) {
        buildingWorkHoursComplete = false;
      }
    });

    // 如果所有条件都满足，尝试完成研究
    if (timeComplete && pointsComplete && buildingWorkHoursComplete) {
      this.tryCompleteResearch(this.activeResearch);
    }
  }

  /**
   * Start researching a technology
   * @param {string} techId - Technology ID to research
   * @returns {Object} - Result object with success status and message
   */
  startResearch(techId) {
    const tech = this.technologies[techId];

    if (!tech) {
      return { success: false, message: '研究技术不存在' };
    }

    if (this.completedResearch.has(techId)) {
      return { success: false, message: '该技术已经研究完成' };
    }

    if (this.activeResearch) {
      return { success: false, message: '已有正在进行的研究' };
    }

    // 检查前置条件是否满足
    const prerequisitesMet = tech.prerequisites.every(req =>
      this.completedResearch.has(req)
    );

    if (!prerequisitesMet) {
      return { success: false, message: '前置研究条件未满足' };
    }

    // 检查资源需求
    if (tech.requirements && tech.requirements.resources) {
      if (!this.resourceSystem.hasResources(tech.requirements.resources)) {
        return { success: false, message: '资源不足' };
      }
    }

    // 检查金币需求
    if (tech.requirements && tech.requirements.gold) {
      if (!this.gameState || this.gameState.playerGold < tech.requirements.gold) {
        return { success: false, message: '金币不足' };
      }
    }

    // 消耗资源
    if (tech.requirements && tech.requirements.resources) {
      this.resourceSystem.consumeResources(tech.requirements.resources);
      this.consumedResources = { ...tech.requirements.resources };
    }

    // 消耗金币
    if (tech.requirements && tech.requirements.gold && this.gameState) {
      this.gameState.playerGold -= tech.requirements.gold;
      this.consumedGold = tech.requirements.gold;

      // 更新金币显示
      if (typeof this.gameState.updateGoldDisplay === 'function') {
        this.gameState.updateGoldDisplay();
      }
    }

    // 初始化研究状态
    this.activeResearch = techId;
    this.researchProgress = 0;
    this.researchTimeProgress = 0;
    this.buildingWorkHoursProgress = {};

    // 记录尝试次数
    if (!this.researchAttempts[techId]) {
      this.researchAttempts[techId] = 0;
    }
    this.researchAttempts[techId]++;

    return { success: true, message: `开始研究: ${tech.name}` };
  }

  /**
   * 尝试完成研究，考虑成功率
   * @param {string} techId - 技术 ID
   * @returns {Object} - 结果对象，包含成功状态和消息
   */
  tryCompleteResearch(techId) {
    const tech = this.technologies[techId];
    if (!tech) return { success: false, message: '研究技术不存在' };

    // 获取成功率
    const successRate = tech.successRate || 1.0;

    // 每次尝试增加成功率
    const attempts = this.researchAttempts[techId] || 1;
    const adjustedSuccessRate = Math.min(1.0, successRate + (attempts - 1) * 0.1);

    // 随机判定是否成功
    const roll = Math.random();
    const success = roll <= adjustedSuccessRate;

    if (success) {
      // 研究成功
      this.completeResearch(techId);
      return { success: true, message: `研究成功: ${tech.name}` };
    } else {
      // 研究失败
      this.failedResearch.add(techId);

      // 重置研究状态
      this.activeResearch = null;
      this.researchProgress = 0;
      this.researchTimeProgress = 0;
      this.buildingWorkHoursProgress = {};

      return {
        success: false,
        message: `研究失败: ${tech.name}\n成功率: ${Math.floor(adjustedSuccessRate * 100)}%\n尝试次数: ${attempts}`
      };
    }
  }

  /**
   * Complete the current research
   * @param {string} techId - Technology ID that was completed
   */
  completeResearch(techId) {
    if (!this.technologies[techId]) return;

    // Mark as completed
    this.completedResearch.add(techId);

    // Apply effects
    this.applyResearchEffects(techId);

    // Reset active research
    this.activeResearch = null;
    this.researchProgress = 0;
  }

  /**
   * Apply the effects of a completed research
   * @param {string} techId - Technology ID to apply effects for
   */
  applyResearchEffects(techId) {
    const tech = this.technologies[techId];
    if (!tech || !tech.effects) return;

    // Handle different effect types
    Object.entries(tech.effects).forEach(([effectType, effect]) => {
      switch (effectType) {
        case 'productionMultiplier':
          // Handled by the resource system when calculating production
          break;

        case 'buildingEfficiency':
          // Will be applied when buildings check for efficiency
          break;

        case 'storageCap':
          // Increase storage caps for all resources
          Object.keys(this.resourceSystem.resourceCaps).forEach(resource => {
            this.resourceSystem.increaseResourceCap(
              resource,
              this.resourceSystem.resourceCaps[resource] * (effect.multiplier - 1)
            );
          });
          break;

        case 'resourceConsumption':
          // Will be applied when resources are consumed
          break;

        case 'productionSpeed':
          // Will be applied to building production intervals
          break;
      }
    });
  }

  /**
   * Get the effect value for a specific effect type and target
   * @param {string} effectType - Type of effect to look for
   * @param {string} target - Target resource or building
   * @returns {number} - Combined effect value (multiplicative)
   */
  getEffectValue(effectType, target) {
    let result = 1.0; // Default multiplier (no effect)

    // Check all completed research for matching effects
    this.completedResearch.forEach(techId => {
      const tech = this.technologies[techId];
      if (!tech || !tech.effects || !tech.effects[effectType]) return;

      const effect = tech.effects[effectType];

      // Check if this effect applies to our target
      if (
        (effect.resource && effect.resource === target) ||
        (effect.building && effect.building === target) ||
        (!effect.resource && !effect.building) // Global effect
      ) {
        // Multiply the result by the effect value
        result *= effect.value || effect.multiplier || 1.0;
      }
    });

    return result;
  }

  /**
   * Get all available (researchable) technologies
   * @returns {Array} - Array of available technology objects with id, name, description, requirements and effects
   */
  getAvailableTechnologies() {
    return Object.keys(this.technologies)
      .filter(techId => {
        const tech = this.technologies[techId];

        // Skip if already researched
        if (this.completedResearch.has(techId)) return false;

        // Check if all prerequisites are met
        return tech.prerequisites.every(req => this.completedResearch.has(req));
      })
      .map(techId => {
        const tech = this.technologies[techId];
        return {
          id: techId,
          name: tech.name,
          description: tech.description,
          requirements: tech.requirements,
          prerequisites: tech.prerequisites,
          successRate: tech.successRate || 1.0,
          effects: tech.effects,
          attempts: this.researchAttempts[techId] || 0,
          failed: this.failedResearch.has(techId)
        };
      });
  }

  /**
   * Get a specific technology by ID
   * @param {string} techId - Technology ID
   * @returns {Object|null} - Technology object or null if not found
   */
  getTechnology(techId) {
    const tech = this.technologies[techId];
    if (!tech) return null;

    return {
      id: techId,
      name: tech.name,
      description: tech.description,
      requirements: tech.requirements,
      prerequisites: tech.prerequisites,
      successRate: tech.successRate || 1.0,
      effects: tech.effects,
      completed: this.completedResearch.has(techId),
      attempts: this.researchAttempts[techId] || 0,
      failed: this.failedResearch.has(techId)
    };
  }

  /**
   * Get research progress information
   * @returns {Object} - Research progress info
   */
  getResearchProgress() {
    if (!this.activeResearch) {
      return { active: false };
    }

    const tech = this.technologies[this.activeResearch];
    const requirements = tech.requirements || {};

    // 计算各种进度
    const researchPointsProgress = this.researchProgress / (requirements.researchPoints || 1);
    const timeProgress = this.researchTimeProgress / (requirements.time || 1);

    // 计算建筑工时进度
    let buildingWorkHoursProgress = {};
    if (requirements.buildingWorkHours) {
      Object.entries(requirements.buildingWorkHours).forEach(([buildingType, hours]) => {
        const progress = this.buildingWorkHoursProgress[buildingType] || 0;
        buildingWorkHoursProgress[buildingType] = {
          current: progress,
          required: hours,
          percent: Math.min(1, progress / hours)
        };
      });
    }

    // 计算总体进度
    let totalProgressFactors = 1; // 进度因素数量
    let totalProgressSum = researchPointsProgress; // 进度总和

    if (requirements.time) {
      totalProgressFactors++;
      totalProgressSum += timeProgress;
    }

    if (requirements.buildingWorkHours) {
      const buildingTypes = Object.keys(requirements.buildingWorkHours);
      totalProgressFactors += buildingTypes.length;

      buildingTypes.forEach(buildingType => {
        const progress = buildingWorkHoursProgress[buildingType].percent || 0;
        totalProgressSum += progress;
      });
    }

    const totalProgress = totalProgressSum / totalProgressFactors;

    // 计算成功率
    const baseSuccessRate = tech.successRate || 1.0;
    const attempts = this.researchAttempts[this.activeResearch] || 1;
    const adjustedSuccessRate = Math.min(1.0, baseSuccessRate + (attempts - 1) * 0.1);

    return {
      active: true,
      id: this.activeResearch,
      technology: this.getTechnology(this.activeResearch),
      researchPointsProgress: {
        current: this.researchProgress,
        required: requirements.researchPoints || 0,
        percent: researchPointsProgress
      },
      timeProgress: {
        current: this.researchTimeProgress,
        required: requirements.time || 0,
        percent: timeProgress
      },
      buildingWorkHoursProgress,
      consumedResources: this.consumedResources,
      consumedGold: this.consumedGold,
      totalProgress,
      successRate: adjustedSuccessRate,
      attempts
    };
  }
}
