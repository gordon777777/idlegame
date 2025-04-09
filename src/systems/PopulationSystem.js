/**
 * 人口系統 - 管理城市的居民和工人
 */
export default class PopulationSystem {
  /**
   * @param {Object} config - 系統配置
   */
  constructor(config = {}) {
    // 總人口
    this.totalPopulation = config.initialPopulation || 10;
    this.housingCapacity = config.initialHousingCapacity || 20;
    this.growthRate = config.growthRate || 0.001; // 每秒增長率
    this.happinessLevel = config.initialHappiness || 50; // 0-100

    // 幸福度系統 - 按階層分別計算
    this.classHappiness = {
      lower: {
        value: 50, // 當前幸福度值
        factors: {
          housing: { value: 0, weight: 0.3 }, // 住房影響
          market: { value: 0, weight: 0.5 },  // 市場影響
          base: { value: 50, weight: 0.2 }    // 基礎幸福度
        },
        demands: {} // 存儲各種需求的滿足情況
      },
      middle: {
        value: 50,
        factors: {
          housing: { value: 0, weight: 0.25 },
          market: { value: 0, weight: 0.55 },
          base: { value: 50, weight: 0.2 }
        },
        demands: {}
      },
      upper: {
        value: 50,
        factors: {
          housing: { value: 0, weight: 0.2 },
          market: { value: 0, weight: 0.6 },
          base: { value: 50, weight: 0.2 }
        },
        demands: {}
      }
    };

    // 總體幸福度
    this.happinessLevel = 50;

    // 人口移動計時器
    this.migrationTimer = 0;
    this.migrationInterval = 60000; // 每分鐘檢查一次人口移動

    // 人口階層定義
    this.socialClasses = {
      lower: {
        name: '底層',
        description: '社會底層，主要從事基礎勞動工作',
        workerTypes: ['peasant']
      },
      middle: {
        name: '中層',
        description: '自由民，擁有一定技能的工人和匠人',
        workerTypes: ['miner', 'woodcutter', 'craftsman']
      },
      upper: {
        name: '上層',
        description: '社會精英，包括魔法師和大商人',
        workerTypes: ['scholar', 'wizard_apprentice', 'wizard', 'merchant']
      }
    };

    // 階層轉化條件
    this.classPromotionRequirements = {
      // 底層到中層
      peasant_to_miner: {
        experience: 10, // 工作經驗
        resources: { magic_ore: 10, enchanted_wood: 5 },
        happiness: 60 // 最低幸福度要求
      },
      peasant_to_woodcutter: {
        experience: 10,
        resources: { magic_ore: 5, enchanted_wood: 10 },
        happiness: 60
      },
      // 中層到上層
      craftsman_to_scholar: {
        experience: 30,
        resources: { refined_crystal: 10, arcane_essence: 15, knowledge: 5 },
        happiness: 75
      },
      craftsman_to_wizard_apprentice: {
        experience: 40,
        resources: { magical_potion: 5, refined_crystal: 15, knowledge: 10 },
        happiness: 80
      },
      // 上層內部晉升
      scholar_to_wizard: {
        experience: 50,
        resources: { enchanted_artifact: 2, magical_potion: 10, knowledge: 20 },
        happiness: 85
      },
      wizard_apprentice_to_wizard: {
        experience: 60,
        resources: { enchanted_artifact: 3, magical_construct: 1, knowledge: 25 },
        happiness: 90
      }
    };

    // 階層退化條件
    this.classDemotionConditions = {
      happiness: 30, // 幸福度低於此值時有機會退化
      foodShortage: true, // 食物短缺時
      housingOvercrowded: true // 住房過度擁擠時
    };

    // 不同類型的工人
    this.workerTypes = {
      peasant: {
        count: 10,
        assigned: 0,
        displayName: '農民',
        description: '基礎工人，可以在簡單的建築中工作',
        productionMultiplier: 1.0,
        socialClass: 'lower',
        experience: 0,
        promotionChance: 0.01 // 每次檢查時的晉升機率
      },
      miner: {
        count: 0,
        assigned: 0,
        displayName: '礦工',
        description: '專門開採礦石和水晶的工人',
        productionMultiplier: 1.2,
        requiredResources: { magic_ore: 5, enchanted_wood: 5 },
        socialClass: 'middle',
        experience: 0,
        promotionChance: 0.005,
        demotionChance: 0.002 // 每次檢查時的退化機率
      },
      woodcutter: {
        count: 0,
        assigned: 0,
        displayName: '伐木工',
        description: '專門收集和處理木材的工人',
        productionMultiplier: 1.2,
        requiredResources: { magic_ore: 5, enchanted_wood: 5 },
        socialClass: 'middle',
        experience: 0,
        promotionChance: 0.005,
        demotionChance: 0.002
      },
      craftsman: {
        count: 0,
        assigned: 0,
        displayName: '工匠',
        description: '能夠製作複雜物品的熟練工人',
        productionMultiplier: 1.5,
        requiredResources: { arcane_essence: 5, mystic_planks: 5 },
        socialClass: 'middle',
        experience: 0,
        promotionChance: 0.003,
        demotionChance: 0.001
      },
      scholar: {
        count: 0,
        assigned: 0,
        displayName: '學者',
        description: '研究魔法和知識的專家',
        productionMultiplier: 1.8,
        requiredResources: { refined_crystal: 5, knowledge: 2 },
        socialClass: 'upper',
        experience: 0,
        promotionChance: 0.002,
        demotionChance: 0.001
      },
      wizard_apprentice: {
        count: 0,
        assigned: 0,
        displayName: '法師學徒',
        description: '正在學習魔法的學徒',
        productionMultiplier: 2.0,
        requiredResources: { magical_potion: 2, knowledge: 5 },
        socialClass: 'upper',
        experience: 0,
        promotionChance: 0.002,
        demotionChance: 0.001
      },
      wizard: {
        count: 0,
        assigned: 0,
        displayName: '法師',
        description: '掌握魔法的專家',
        productionMultiplier: 3.0,
        requiredResources: { enchanted_artifact: 1, knowledge: 10 },
        socialClass: 'upper',
        experience: 0,
        demotionChance: 0.0005
      },
      merchant: {
        count: 0,
        assigned: 0,
        displayName: '大商人',
        description: '富有的商人，能夠提高城市的經濟效率',
        productionMultiplier: 2.5,
        requiredResources: { arcane_essence: 10, mystic_planks: 10, refined_crystal: 5 },
        socialClass: 'upper',
        experience: 0,
        demotionChance: 0.0005
      }
    };

    // 工人分配 - 存儲每個建築分配的工人
    this.workerAssignments = new Map();

    // 工作經驗累積計時器
    this.experienceTimer = 0;
    this.experienceInterval = 10000; // 每10秒累積一次經驗

    // 階層檢查計時器
    this.classCheckTimer = 0;
    this.classCheckInterval = 30000; // 每30秒檢查一次階層變化

    // 工人需求 - 每種建築類型需要的工人類型和數量
    this.buildingWorkerRequirements = {
      // 資源收集器
      magic_mine: {
        workers: { peasant: 1, miner: 1 },
        description: '需要1名農民和1名礦工'
      },
      enchanted_forest: {
        workers: { peasant: 1, woodcutter: 1 },
        description: '需要1名農民和1名伐木工'
      },
      crystal_mine: {
        workers: { miner: 2 },
        description: '需要2名礦工'
      },
      mana_well: {
        workers: { peasant: 1 },
        description: '需要1名農民'
      },
      mystic_garden: {
        workers: { woodcutter: 2 },
        description: '需要2名伐木工'
      },
      crystal_garden: {
        workers: { craftsman: 1 },
        description: '需要1名工匠'
      },

      // 生產建築
      magic_forge: {
        workers: { craftsman: 1, peasant: 1 },
        description: '需要1名工匠和1名農民'
      },
      wood_enchanter: {
        workers: { woodcutter: 1, wizard_apprentice: 1 },
        description: '需要1名伐木工和1名法師學徒'
      },
      crystal_refinery: {
        workers: { miner: 1, craftsman: 1 },
        description: '需要1名礦工和1名工匠'
      },

      // 高級建築
      alchemy_lab: {
        workers: { craftsman: 1, wizard_apprentice: 1 },
        description: '需要1名工匠和1名法師學徒'
      },
      enchanting_tower: {
        workers: { wizard_apprentice: 2 },
        description: '需要2名法師學徒'
      },
      arcane_workshop: {
        workers: { craftsman: 1, wizard: 1 },
        description: '需要1名工匠和1名法師'
      },

      // 特殊建築
      wizard_tower: {
        workers: { wizard: 1, scholar: 1 },
        description: '需要1名法師和1名學者'
      },
      arcane_library: {
        workers: { scholar: 2 },
        description: '需要2名學者'
      },
      mana_fountain: {
        workers: { wizard: 1 },
        description: '需要1名法師'
      },

      // 高級建築
      magic_academy: {
        workers: { scholar: 2, wizard: 1 },
        description: '需要2名學者和1名法師'
      },
      research_lab: {
        workers: { scholar: 3 },
        description: '需要3名學者'
      },

      // 住房建築
      housing_district: {
        workers: { peasant: 0 }, // 住房不需要工人
        description: '提供居民住所'
      },
      wizard_quarters: {
        workers: { peasant: 0 }, // 住房不需要工人
        description: '為法師提供住所'
      }
    };
  }

  /**
   * 更新人口系統
   * @param {number} time - 當前遊戲時間
   * @param {number} delta - 自上次更新以來的時間（毫秒）
   */
  update(time, delta) {
    // 更新幸福度（這裡可以添加更多影響因素）
    this.updateHappiness();

    // 計算人口增長（受幸福度影響）
    const happinessMultiplier = this.happinessLevel / 50; // 50是基準幸福度
    const growth = this.totalPopulation * this.growthRate * (delta / 1000) * happinessMultiplier;

    // 確保不超過住房容量
    if (this.totalPopulation + growth <= this.housingCapacity) {
      this.totalPopulation += growth;
      // 將新增人口添加為農民
      this.workerTypes.peasant.count += growth;
    }

    // 更新工作經驗累積
    this.experienceTimer += delta;
    if (this.experienceTimer >= this.experienceInterval) {
      this.experienceTimer = 0;
      this.accumulateExperience();
    }

    // 階層轉化檢查
    this.classCheckTimer += delta;
    if (this.classCheckTimer >= this.classCheckInterval) {
      this.classCheckTimer = 0;
      this.checkClassTransitions();
    }

    // 人口移動檢查
    this.migrationTimer += delta;
    if (this.migrationTimer >= this.migrationInterval) {
      this.migrationTimer = 0;
      this.checkMigration();
    }
  }

  /**
   * 檢查人口移動
   */
  checkMigration() {
    // 幸福度高時吸引外來人口
    if (this.happinessLevel > 70 && this.totalPopulation < this.housingCapacity * 0.9) {
      const immigrationChance = (this.happinessLevel - 70) / 100;

      if (Math.random() < immigrationChance) {
        // 移入一定比例的人口，最多3%
        const immigrationRatio = Math.min(0.03, immigrationChance / 2);
        const immigrationAmount = Math.ceil(this.totalPopulation * immigrationRatio);

        if (immigrationAmount > 0) {
          // 確保不超過住房容量
          const availableSpace = this.housingCapacity - this.totalPopulation;
          const actualImmigration = Math.min(immigrationAmount, availableSpace);

          if (actualImmigration > 0) {
            this.totalPopulation += actualImmigration;

            // 新移入的人口大部分是農民，但也有一些是中層和上層
            const lowerClassRatio = 0.7;
            const middleClassRatio = 0.25;
            const upperClassRatio = 0.05;

            // 添加底層人口
            const lowerClassAmount = Math.floor(actualImmigration * lowerClassRatio);
            this.workerTypes.peasant.count += lowerClassAmount;

            // 添加中層人口
            const middleClassAmount = Math.floor(actualImmigration * middleClassRatio);
            const middleClassWorkers = this.socialClasses.middle.workerTypes;
            if (middleClassWorkers.length > 0) {
              const perWorkerAmount = Math.floor(middleClassAmount / middleClassWorkers.length);
              for (const workerType of middleClassWorkers) {
                this.workerTypes[workerType].count += perWorkerAmount;
              }
            }

            // 添加上層人口
            const upperClassAmount = Math.floor(actualImmigration * upperClassRatio);
            const upperClassWorkers = this.socialClasses.upper.workerTypes;
            if (upperClassWorkers.length > 0) {
              const perWorkerAmount = Math.floor(upperClassAmount / upperClassWorkers.length);
              for (const workerType of upperClassWorkers) {
                this.workerTypes[workerType].count += perWorkerAmount;
              }
            }

            console.log(`由於幸福度高 (${this.happinessLevel.toFixed(1)}), 吸引了 ${actualImmigration} 新移民`);
          }
        }
      }
    }
  }

  /**
   * 累積工作經驗
   */
  accumulateExperience() {
    // 為所有已分配的工人累積經驗
    for (const [buildingId, assignment] of this.workerAssignments.entries()) {
      for (const [workerType, count] of Object.entries(assignment)) {
        // 每個工人累積1點經驗
        this.workerTypes[workerType].experience += count;
      }
    }
  }

  /**
   * 檢查階層轉化
   */
  checkClassTransitions() {
    // 檢查晉升條件
    this.checkPromotions();

    // 檢查退化條件
    this.checkDemotions();
  }

  /**
   * 檢查工人晉升條件
   */
  checkPromotions() {
    // 檢查農民升級為礦工或伐木工
    if (this.workerTypes.peasant.count >= 1) {
      // 檢查升級為礦工
      this.checkSpecificPromotion('peasant', 'miner', 'peasant_to_miner');

      // 檢查升級為伐木工
      this.checkSpecificPromotion('peasant', 'woodcutter', 'peasant_to_woodcutter');
    }

    // 檢查工匠升級為學者或法師學徒
    if (this.workerTypes.craftsman.count >= 1) {
      // 檢查升級為學者
      this.checkSpecificPromotion('craftsman', 'scholar', 'craftsman_to_scholar');

      // 檢查升級為法師學徒
      this.checkSpecificPromotion('craftsman', 'wizard_apprentice', 'craftsman_to_wizard_apprentice');
    }

    // 檢查學者升級為法師
    if (this.workerTypes.scholar.count >= 1) {
      this.checkSpecificPromotion('scholar', 'wizard', 'scholar_to_wizard');
    }

    // 檢查法師學徒升級為法師
    if (this.workerTypes.wizard_apprentice.count >= 1) {
      this.checkSpecificPromotion('wizard_apprentice', 'wizard', 'wizard_apprentice_to_wizard');
    }
  }

  /**
   * 檢查特定工人的晉升
   * @param {string} fromType - 原工人類型
   * @param {string} toType - 目標工人類型
   * @param {string} requirementKey - 要求配置鍵值
   */
  checkSpecificPromotion(fromType, toType, requirementKey) {
    const fromWorker = this.workerTypes[fromType];
    const requirements = this.classPromotionRequirements[requirementKey];

    // 檢查經驗與幸福度要求
    if (fromWorker.experience >= requirements.experience &&
        this.happinessLevel >= requirements.happiness) {

      // 檢查資源要求
      const resources = this.getAvailableResources();
      let hasResources = true;

      if (requirements.resources) {
        for (const [resource, amount] of Object.entries(requirements.resources)) {
          if (!resources[resource] || resources[resource].value < amount) {
            hasResources = false;
            break;
          }
        }
      }

      // 檢查晉升機率
      const promotionRoll = Math.random();
      if (hasResources && promotionRoll <= fromWorker.promotionChance) {
        // 消耗資源
        if (requirements.resources) {
          for (const [resource, amount] of Object.entries(requirements.resources)) {
            resources[resource].value -= amount;
          }
        }

        // 升級工人
        fromWorker.count--;
        this.workerTypes[toType].count++;

        // 重置經驗
        fromWorker.experience = 0;

        console.log(`工人晉升: ${fromWorker.displayName} -> ${this.workerTypes[toType].displayName}`);
        return true;
      }
    }

    return false;
  }

  /**
   * 檢查工人退化條件
   */
  checkDemotions() {
    // 如果幸福度低於退化閾值，檢查所有非農民工人
    if (this.happinessLevel < this.classDemotionConditions.happiness) {
      // 檢查中層工人退化
      this.checkClassDemotion('middle');

      // 檢查上層工人退化
      this.checkClassDemotion('upper');
    }

    // 檢查住房擁擠導致的退化
    if (this.classDemotionConditions.housingOvercrowded &&
        this.totalPopulation / this.housingCapacity > 0.9) {
      // 住房擁擠時，上層退化機率增加
      this.checkClassDemotion('upper', 0.01);
    }
  }

  /**
   * 檢查特定階層的退化
   * @param {string} socialClass - 階層
   * @param {number} additionalChance - 額外的退化機率
   */
  checkClassDemotion(socialClass, additionalChance = 0) {
    // 獲取該階層的所有工人類型
    const workerTypesInClass = this.socialClasses[socialClass].workerTypes;

    for (const workerType of workerTypesInClass) {
      const worker = this.workerTypes[workerType];

      // 跳過沒有工人的類型
      if (worker.count <= 0) continue;

      // 檢查退化機率
      const demotionChance = (worker.demotionChance || 0) + additionalChance;
      const demotionRoll = Math.random();

      if (demotionRoll <= demotionChance) {
        // 確定退化目標
        let targetType = 'peasant'; // 預設退化為農民

        if (socialClass === 'upper') {
          // 上層退化到中層，隨機選擇一種中層工人
          const middleClassWorkers = this.socialClasses.middle.workerTypes;
          targetType = middleClassWorkers[Math.floor(Math.random() * middleClassWorkers.length)];
        }

        // 退化工人
        worker.count--;
        this.workerTypes[targetType].count++;

        console.log(`工人退化: ${worker.displayName} -> ${this.workerTypes[targetType].displayName}`);
      }
    }
  }

  /**
   * 獲取可用資源
   * @returns {Object} 可用資源
   */
  getAvailableResources() {
    // 預設從遊戲場景獲取資源
    if (this.scene && this.scene.resources) {
      return this.scene.resources.resources;
    }

    // 如果沒有場景引用，返回空對象
    return {};
  }

  /**
   * 更新居民幸福度
   */
  updateHappiness() {
    // 計算人口密度因素 - 接近容量上限時幸福度下降
    const densityFactor = 1 - (this.totalPopulation / this.housingCapacity);

    // 更新每個階層的住房幸福度因素
    for (const className of Object.keys(this.classHappiness)) {
      // 不同階層對住房密度的敏感度不同
      let housingImpact = 50 + (densityFactor * 50); // 0-100

      // 上層對住房密度更敏感
      if (className === 'upper') {
        housingImpact = 50 + (densityFactor * 70);
        if (densityFactor < 0.3) housingImpact *= 0.7; // 上層對擁擠反應更強烈
      }
      // 中層對住房密度的敏感度適中
      else if (className === 'middle') {
        housingImpact = 50 + (densityFactor * 60);
      }

      // 更新住房因素
      this.classHappiness[className].factors.housing.value = housingImpact;

      // 計算這個階層的統合幸福度
      let classNewHappiness = 0;
      for (const factor of Object.values(this.classHappiness[className].factors)) {
        classNewHappiness += factor.value * factor.weight;
      }

      // 確保在0-100範圍內
      this.classHappiness[className].value = Math.max(0, Math.min(100, classNewHappiness));
    }

    // 計算統合幸福度 - 根據人口比例加權平均
    const stats = this.getPopulationStats();
    let totalWeightedHappiness = 0;
    let totalPopulation = 0;

    for (const [className, classData] of Object.entries(stats.socialClasses)) {
      if (classData.count > 0) {
        totalWeightedHappiness += this.classHappiness[className].value * classData.count;
        totalPopulation += classData.count;
      }
    }

    // 計算加權平均幸福度
    if (totalPopulation > 0) {
      this.happinessLevel = totalWeightedHappiness / totalPopulation;
    } else {
      this.happinessLevel = 50; // 預設值
    }

    // 如果幸福度非常低，觸發人口流失
    this.checkUnhappyEffects();
  }

  /**
   * 應用各階層的市場幸福度影響
   * @param {Object} classHappinessImpacts - 各階層的幸福度影響
   */
  applyClassHappinessEffects(classHappinessImpacts) {
    // 處理每個階層的幸福度影響
    for (const [className, impactData] of Object.entries(classHappinessImpacts)) {
      if (!this.classHappiness[className]) continue;

      // 更新市場因素值
      const currentValue = this.classHappiness[className].factors.market.value;
      const newValue = currentValue + impactData.totalImpact;

      // 確保在0-100範圍內
      this.classHappiness[className].factors.market.value = Math.max(0, Math.min(100, newValue));

      // 存儲需求滿足情況
      this.classHappiness[className].demands = impactData.demandImpacts;

      console.log(`${className} 階層市場幸福度影響: ${impactData.totalImpact.toFixed(2)}, 新市場因素值: ${this.classHappiness[className].factors.market.value.toFixed(2)}`);
    }

    // 重新計算統合幸福度
    this.updateHappiness();
  }

  /**
   * 檢查不幸福的影響
   */
  checkUnhappyEffects() {
    // 檢查每個階層的幸福度
    for (const [className, classHappiness] of Object.entries(this.classHappiness)) {
      // 如果幸福度非常低，觸發人口流失
      if (classHappiness.value < 20) {
        this.triggerClassPopulationLoss(className);
      }
      // 如果幸福度低，觸發階層退化
      else if (classHappiness.value < 35 && className !== 'lower') {
        this.triggerClassDemotion(className);
      }
    }
  }

  /**
   * 觸發特定階層的人口流失
   * @param {string} className - 階層名稱
   */
  triggerClassPopulationLoss(className) {
    // 幸福度低時，有一定機率失去人口
    const classHappiness = this.classHappiness[className].value;
    const lossChance = Math.max(0, (30 - classHappiness) / 100);

    if (Math.random() < lossChance) {
      // 獲取這個階層的總人口
      const stats = this.getPopulationStats();
      const classPopulation = stats.socialClasses[className]?.count || 0;

      if (classPopulation > 0) {
        // 流失一定比例的人口，最多8%
        const lossRatio = Math.min(0.08, lossChance / 1.5);
        const lossAmount = Math.ceil(classPopulation * lossRatio);

        if (lossAmount > 0) {
          // 移除人口
          this.removePopulationFromClass(className, lossAmount);
          this.totalPopulation -= lossAmount;

          console.log(`由於 ${className} 階層幸福度低 (${classHappiness.toFixed(1)}), 流失了 ${lossAmount} 人口`);
        }
      }
    }
  }

  /**
   * 觸發階層退化
   * @param {string} className - 階層名稱
   */
  triggerClassDemotion(className) {
    // 幸福度低時，有一定機率退化到下一個階層
    const classHappiness = this.classHappiness[className].value;
    const demotionChance = Math.max(0, (40 - classHappiness) / 200);

    if (Math.random() < demotionChance) {
      // 獲取這個階層的總人口
      const stats = this.getPopulationStats();
      const classPopulation = stats.socialClasses[className]?.count || 0;

      if (classPopulation > 0) {
        // 退化一定比例的人口，最多5%
        const demotionRatio = Math.min(0.05, demotionChance);
        const demotionAmount = Math.ceil(classPopulation * demotionRatio);

        if (demotionAmount > 0) {
          // 確定目標階層
          const targetClass = className === 'upper' ? 'middle' : 'lower';

          // 從高階層移除人口
          this.removePopulationFromClass(className, demotionAmount);

          // 將人口添加到低階層
          this.addPopulationToClass(targetClass, demotionAmount);

          console.log(`由於 ${className} 階層幸福度低 (${classHappiness.toFixed(1)}), ${demotionAmount} 人口退化到 ${targetClass} 階層`);
        }
      }
    }
  }

  /**
   * 觸發人口流失
   */
  triggerPopulationLoss() {
    // 幸福度低時，有一定機率失去人口
    const lossChance = Math.max(0, (30 - this.happinessLevel) / 100);

    if (Math.random() < lossChance) {
      // 流失一定比例的人口，最多5%
      const lossRatio = Math.min(0.05, lossChance / 2);
      const lossAmount = Math.ceil(this.totalPopulation * lossRatio);

      if (lossAmount > 0) {
        this.totalPopulation -= lossAmount;

        // 先從上層開始流失
        this.removePopulationFromClass('upper', lossAmount);

        console.log(`由於幸福度低 (${this.happinessLevel.toFixed(1)}), 流失了 ${lossAmount} 人口`);
      }
    }
  }

  /**
   * 從指定階層移除人口
   * @param {string} socialClass - 階層
   * @param {number} amount - 移除數量
   * @returns {number} - 實際移除數量
   */
  removePopulationFromClass(socialClass, amount) {
    let remainingToRemove = amount;

    // 獲取該階層的工人類型
    const workerTypes = this.socialClasses[socialClass]?.workerTypes || [];

    // 如果指定階層沒有足夠的人口，則從下一個階層移除
    if (workerTypes.length === 0) {
      if (socialClass === 'upper') {
        return this.removePopulationFromClass('middle', amount);
      } else if (socialClass === 'middle') {
        return this.removePopulationFromClass('lower', amount);
      } else {
        return 0; // 沒有更低的階層了
      }
    }

    // 從每種工人類型中按比例移除人口
    for (const workerType of workerTypes) {
      if (remainingToRemove <= 0) break;

      const worker = this.workerTypes[workerType];
      if (!worker || worker.count <= 0) continue;

      // 計算要移除的數量
      const removeFromThisType = Math.min(remainingToRemove, Math.floor(worker.count));

      if (removeFromThisType > 0) {
        worker.count -= removeFromThisType;
        remainingToRemove -= removeFromThisType;

        console.log(`從 ${worker.displayName} 移除了 ${removeFromThisType} 人口`);
      }
    }

    // 如果還有剩餘要移除的人口，則從下一個階層移除
    if (remainingToRemove > 0) {
      if (socialClass === 'upper') {
        return amount - remainingToRemove + this.removePopulationFromClass('middle', remainingToRemove);
      } else if (socialClass === 'middle') {
        return amount - remainingToRemove + this.removePopulationFromClass('lower', remainingToRemove);
      }
    }

    return amount - remainingToRemove;
  }

  /**
   * 將人口添加到指定階層
   * @param {string} socialClass - 階層
   * @param {number} amount - 添加數量
   */
  addPopulationToClass(socialClass, amount) {
    if (amount <= 0) return;

    // 獲取該階層的工人類型
    const workerTypes = this.socialClasses[socialClass]?.workerTypes || [];

    if (workerTypes.length === 0) {
      // 如果沒有工人類型，預設添加到農民
      this.workerTypes.peasant.count += amount;
      console.log(`添加 ${amount} 人口到農民`);
      return;
    }

    // 平均分配到每種工人類型
    const perTypeAmount = Math.floor(amount / workerTypes.length);
    let remaining = amount;

    for (const workerType of workerTypes) {
      const worker = this.workerTypes[workerType];
      if (!worker) continue;

      // 添加人口
      const addToThisType = Math.min(perTypeAmount, remaining);
      worker.count += addToThisType;
      remaining -= addToThisType;

      console.log(`添加 ${addToThisType} 人口到 ${worker.displayName}`);

      if (remaining <= 0) break;
    }

    // 如果還有剩餘，添加到第一種工人類型
    if (remaining > 0 && workerTypes.length > 0) {
      const firstWorkerType = this.workerTypes[workerTypes[0]];
      if (firstWorkerType) {
        firstWorkerType.count += remaining;
        console.log(`添加剩餘 ${remaining} 人口到 ${firstWorkerType.displayName}`);
      }
    }
  }

  /**
   * 增加住房容量
   * @param {number} amount - 增加的容量
   */
  increaseHousingCapacity(amount) {
    this.housingCapacity += amount;
  }

  /**
   * 訓練特定類型的工人
   * @param {string} workerType - 工人類型
   * @param {number} count - 訓練數量
   * @param {Object} resources - 可用資源
   * @returns {boolean} - 是否成功訓練
   */
  trainWorkers(workerType, count, resources) {
    // 檢查是否有足夠的閒置農民
    if (this.getAvailableWorkers('peasant') < count) {
      return false;
    }

    // 檢查是否有所需資源
    const requiredResources = this.workerTypes[workerType].requiredResources;
    if (requiredResources) {
      for (const [resource, amount] of Object.entries(requiredResources)) {
        if (!resources[resource] || resources[resource].value < amount * count) {
          return false;
        }
      }

      // 消耗資源
      for (const [resource, amount] of Object.entries(requiredResources)) {
        resources[resource].value -= amount * count;
      }
    }

    // 減少農民數量，增加特定工人數量
    this.workerTypes.peasant.count -= count;
    this.workerTypes[workerType].count += count;

    return true;
  }

  /**
   * 獲取可用（未分配）的工人數量
   * @param {string} workerType - 工人類型
   * @returns {number} - 可用工人數量
   */
  getAvailableWorkers(workerType) {
    return this.workerTypes[workerType].count - this.workerTypes[workerType].assigned;
  }

  /**
   * 分配工人到建築
   * @param {string} buildingId - 建築ID
   * @param {string} buildingType - 建築類型
   * @returns {boolean} - 是否成功分配
   */
  assignWorkersToBulding(buildingId, buildingType) {
    // 檢查建築是否需要工人
    const requirements = this.buildingWorkerRequirements[buildingType];
    if (!requirements) return true; // 如果沒有要求，視為成功

    // 檢查是否有足夠的工人
    for (const [workerType, count] of Object.entries(requirements.workers)) {
      if (this.getAvailableWorkers(workerType) < count) {
        return false;
      }
    }

    // 分配工人
    const assignment = {};
    for (const [workerType, count] of Object.entries(requirements.workers)) {
      assignment[workerType] = count;
      this.workerTypes[workerType].assigned += count;
    }

    this.workerAssignments.set(buildingId, assignment);
    return true;
  }

  /**
   * 從建築中移除工人
   * @param {string} buildingId - 建築ID
   */
  removeWorkersFromBuilding(buildingId) {
    const assignment = this.workerAssignments.get(buildingId);
    if (!assignment) return;

    // 釋放工人
    for (const [workerType, count] of Object.entries(assignment)) {
      this.workerTypes[workerType].assigned -= count;
    }

    this.workerAssignments.delete(buildingId);
  }

  /**
   * 檢查建築是否有足夠的工人
   * @param {string} buildingId - 建築ID
   * @returns {boolean} - 是否有足夠工人
   */
  hasSufficientWorkers(buildingId) {
    return this.workerAssignments.has(buildingId);
  }

  /**
   * 獲取建築的效率乘數（基於分配的工人）
   * @param {string} buildingId - 建築ID
   * @returns {number} - 效率乘數
   */
  getBuildingEfficiencyMultiplier(buildingId) {
    const assignment = this.workerAssignments.get(buildingId);
    if (!assignment) return 0; // 沒有工人，效率為0

    // 計算平均效率乘數
    let totalMultiplier = 0;
    let workerCount = 0;

    for (const [workerType, count] of Object.entries(assignment)) {
      totalMultiplier += this.workerTypes[workerType].productionMultiplier * count;
      workerCount += count;
    }

    return workerCount > 0 ? totalMultiplier / workerCount : 0;
  }

  /**
   * 獲取建築所需的工人描述
   * @param {string} buildingType - 建築類型
   * @returns {string} - 工人需求描述
   */
  getBuildingWorkerRequirementDescription(buildingType) {
    const requirements = this.buildingWorkerRequirements[buildingType];
    return requirements ? requirements.description : '不需要工人';
  }

  /**
   * 獲取人口統計信息
   * @returns {Object} - 人口統計
   */
  getPopulationStats() {
    const stats = {
      total: Math.floor(this.totalPopulation),
      capacity: this.housingCapacity,
      happiness: Math.floor(this.happinessLevel),
      workers: {},
      socialClasses: {}
    };

    // 計算每個階層的人口
    const classCounts = {
      lower: 0,
      middle: 0,
      upper: 0
    };

    // 填充工人統計信息
    for (const [type, data] of Object.entries(this.workerTypes)) {
      const socialClass = data.socialClass || 'lower';
      const count = Math.floor(data.count);

      stats.workers[type] = {
        count: count,
        assigned: data.assigned,
        available: count - data.assigned,
        displayName: data.displayName,
        description: data.description,
        socialClass: socialClass,
        experience: Math.floor(data.experience || 0),
        canPromote: this.canPromoteWorker(type)
      };

      // 累計階層人口
      classCounts[socialClass] += count;
    }

    // 填充階層統計信息
    for (const [className, classData] of Object.entries(this.socialClasses)) {
      // 獲取這個階層的幸福度信息
      const classHappiness = this.classHappiness[className] || { value: 50, factors: {}, demands: {} };

      stats.socialClasses[className] = {
        name: classData.name,
        description: classData.description,
        count: classCounts[className],
        percentage: (classCounts[className] / stats.total * 100).toFixed(1) + '%',
        happiness: Math.floor(classHappiness.value),
        factors: {}
      };

      // 添加幸福度因素信息
      for (const [factorName, factor] of Object.entries(classHappiness.factors)) {
        stats.socialClasses[className].factors[factorName] = {
          value: Math.floor(factor.value),
          weight: factor.weight
        };
      }

      // 添加需求滿足情況
      stats.socialClasses[className].demands = {};
      for (const [demandType, demandInfo] of Object.entries(classHappiness.demands)) {
        stats.socialClasses[className].demands[demandType] = {
          satisfaction: demandInfo.satisfactionRate ? (demandInfo.satisfactionRate * 100).toFixed(0) + '%' : '0%',
          priceScore: demandInfo.priceAppropriatenessScore ? (demandInfo.priceAppropriatenessScore * 100).toFixed(0) + '%' : '0%',
          impact: demandInfo.impact ? Math.floor(demandInfo.impact) : 0,
          displayName: demandInfo.displayName || demandType
        };
      }
    }

    return stats;
  }

  /**
   * 檢查工人是否可以晉升
   * @param {string} workerType - 工人類型
   * @returns {boolean} - 是否可以晉升
   */
  canPromoteWorker(workerType) {
    const worker = this.workerTypes[workerType];
    if (!worker) return false;

    // 檢查是否有可用的晉升路徑
    switch (workerType) {
      case 'peasant':
        // 農民可以升級為礦工或伐木工
        return worker.experience >= 5;

      case 'miner':
      case 'woodcutter':
        // 礦工和伐木工可以升級為工匠
        return worker.experience >= 15;

      case 'craftsman':
        // 工匠可以升級為學者或法師學徒
        return worker.experience >= 25;

      case 'scholar':
        // 學者可以升級為法師
        return worker.experience >= 40;

      case 'wizard_apprentice':
        // 法師學徒可以升級為法師
        return worker.experience >= 50;

      default:
        return false;
    }
  }

  /**
   * 手動晉升工人
   * @param {string} fromType - 原工人類型
   * @param {string} toType - 目標工人類型
   * @param {Object} resources - 可用資源
   * @returns {boolean} - 是否成功晉升
   */
  promoteWorker(fromType, toType, resources) {
    // 檢查是否有有效的晉升路徑
    let requirementKey = null;

    // 確定晉升路徑
    if (fromType === 'peasant' && toType === 'miner') {
      requirementKey = 'peasant_to_miner';
    } else if (fromType === 'peasant' && toType === 'woodcutter') {
      requirementKey = 'peasant_to_woodcutter';
    } else if (fromType === 'craftsman' && toType === 'scholar') {
      requirementKey = 'craftsman_to_scholar';
    } else if (fromType === 'craftsman' && toType === 'wizard_apprentice') {
      requirementKey = 'craftsman_to_wizard_apprentice';
    } else if (fromType === 'scholar' && toType === 'wizard') {
      requirementKey = 'scholar_to_wizard';
    } else if (fromType === 'wizard_apprentice' && toType === 'wizard') {
      requirementKey = 'wizard_apprentice_to_wizard';
    } else {
      // 無效的晉升路徑
      return false;
    }

    // 檢查是否有足夠的工人
    if (this.workerTypes[fromType].count < 1) {
      return false;
    }

    // 檢查資源要求
    const requirements = this.classPromotionRequirements[requirementKey];
    if (requirements.resources) {
      for (const [resource, amount] of Object.entries(requirements.resources)) {
        if (!resources[resource] || resources[resource].value < amount) {
          return false;
        }
      }

      // 消耗資源
      for (const [resource, amount] of Object.entries(requirements.resources)) {
        resources[resource].value -= amount;
      }
    }

    // 晉升工人
    this.workerTypes[fromType].count--;
    this.workerTypes[toType].count++;

    console.log(`手動晉升工人: ${this.workerTypes[fromType].displayName} -> ${this.workerTypes[toType].displayName}`);
    return true;
  }
}
