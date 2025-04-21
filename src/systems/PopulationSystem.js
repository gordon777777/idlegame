import DebugUtils from '../utils/DebugUtils';

/**
 * 人口系統 - 管理城市的居民和工人
 */
export default class PopulationSystem {
  /**
   * @param {Object} config - 系統配置
   */
  constructor(config = {}) {
    // 確保 DebugUtils 已經初始化
    if (DebugUtils && !DebugUtils.initialized) {
      DebugUtils.init();
    }

    // 總人口
    this.totalPopulation = config.initialPopulation || 10;
    this.housingCapacity = config.initialHousingCapacity || 20;
    this.growthRate = config.growthRate || 0.001; // 每秒增長率
    this.happinessLevel = config.initialHappiness || 50; // 0-100

    // 存储建筑类型的映射
    this.buildingTypes = new Map(); // 用于存储建筑ID到建筑类型的映射

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
        workerTypes: ['worker', 'technician', 'artisan']
      },
      middle: {
        name: '中層',
        description: '自由民，擁有一定技能的工人和匠人',
        workerTypes: ['technical_staff', 'engineer']
      },
      upper: {
        name: '上層',
        description: '社會精英，包括魔法師和大商人',
        workerTypes: ['boss', 'accountant', 'magic_technician']
      }
    };

    // 階層轉化條件
    this.classPromotionRequirements = {
      // 底層內部晉升
      worker_to_technician: {
        experience: 15, // 工作經驗
        resources: { magic_ore: 5, enchanted_wood: 5 },
        happiness: 50 // 最低幸福度要求
      },
      technician_to_artisan: {
        experience: 30,
        resources: { magic_ore: 10, enchanted_wood: 10, arcane_crystal: 5 },
        happiness: 60
      },
      // 中層內部晉升
      technical_staff_to_engineer: {
        experience: 40,
        resources: { refined_crystal: 10, arcane_essence: 15, knowledge: 5 },
        happiness: 70
      },
      // 上層內部晉升
      accountant_to_boss: {
        experience: 50,
        resources: { refined_crystal: 20, knowledge: 15, magical_potion: 5 },
        happiness: 80
      },
      magic_technician_to_boss: {
        experience: 60,
        resources: { enchanted_artifact: 3, magical_construct: 1, knowledge: 25 },
        happiness: 85
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
      // 底層工人
      worker: {
        count: 10,
        assigned: 0,
        displayName: '工人',
        description: '基礎工人，可以在簡單的建築中工作',
        productionMultiplier: 1.0,
        socialClass: 'lower',
        experience: 0,
        promotionChance: 0.01 // 每次檢查時的晉升機率
      },
      technician: {
        count: 0,
        assigned: 0,
        displayName: '技工',
        description: '有一定技術的工人，可以操作較複雜的機器',
        productionMultiplier: 1.2,
        requiredResources: { magic_ore: 5, enchanted_wood: 5 },
        socialClass: 'lower',
        experience: 0,
        promotionChance: 0.008,
        demotionChance: 0.002 // 每次檢查時的退化機率
      },
      artisan: {
        count: 0,
        assigned: 0,
        displayName: '工匠',
        description: '熟練的底層工人，能夠製作較高質量的產品',
        productionMultiplier: 1.5,
        requiredResources: { magic_ore: 10, enchanted_wood: 10, arcane_crystal: 5 },
        socialClass: 'lower',
        experience: 0,
        promotionChance: 0.005,
        demotionChance: 0.001
      },

      // 中層工人
      technical_staff: {
        count: 0,
        assigned: 0,
        displayName: '技術人員',
        description: '中層技術人員，負責操作複雜設備和系統',
        productionMultiplier: 1.8,
        requiredResources: { refined_crystal: 5, arcane_essence: 5 },
        socialClass: 'middle',
        experience: 0,
        promotionChance: 0.006,
        demotionChance: 0.002
      },
      engineer: {
        count: 0,
        assigned: 0,
        displayName: '工程師',
        description: '高級中層技術人員，能夠設計和改進複雜系統',
        productionMultiplier: 2.2,
        requiredResources: { refined_crystal: 10, knowledge: 5 },
        socialClass: 'middle',
        experience: 0,
        promotionChance: 0.003,
        demotionChance: 0.001
      },

      // 上層工人
      accountant: {
        count: 0,
        assigned: 0,
        displayName: '會計',
        description: '負責管理財務和資源分配的上層人員',
        productionMultiplier: 2.0,
        requiredResources: { knowledge: 10, refined_crystal: 5 },
        socialClass: 'upper',
        experience: 0,
        promotionChance: 0.004,
        demotionChance: 0.001
      },
      magic_technician: {
        count: 0,
        assigned: 0,
        displayName: '魔法技工',
        description: '掌握魔法技術的上層專家',
        productionMultiplier: 2.5,
        requiredResources: { magical_potion: 5, knowledge: 8 },
        socialClass: 'upper',
        experience: 0,
        promotionChance: 0.003,
        demotionChance: 0.001
      },
      boss: {
        count: 0,
        assigned: 0,
        displayName: '老闆',
        description: '高層管理者，能夠提高整個城市的生產效率',
        productionMultiplier: 3.0,
        requiredResources: { gold: 100, knowledge: 15, magical_potion: 5 },
        socialClass: 'upper',
        experience: 0,
        demotionChance: 0.0005
      },
      wizard: {
        count: 0,
        assigned: 0,
        displayName: '法師',
        description: '法師',
        productionMultiplier: 3.0,
        requiredResources: { enchanted_artifact: 1, knowledge: 15, magical_potion: 5 },
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
        workers: { worker: 1, technician: 1 },
        description: '需要1名工人和1名技工'
      },
      enchanted_forest: {
        workers: { worker: 2 },
        description: '需要2名工人'
      },
      crystal_mine: {
        workers: { technician: 2 },
        description: '需要2名技工'
      },
      mana_well: {
        workers: { worker: 1 },
        description: '需要1名工人'
      },
      mystic_garden: {
        workers: { worker: 1, technician: 1 },
        description: '需要1名工人和1名技工'
      },
      crystal_garden: {
        workers: { artisan: 1 },
        description: '需要1名工匠'
      },

      // 生產建築
      magic_forge: {
        workers: { artisan: 1, worker: 1 },
        description: '需要1名工匠和1名工人'
      },
      wood_enchanter: {
        workers: { technician: 1, magic_technician: 1 },
        description: '需要1名技工和1名魔法技工'
      },
      crystal_refinery: {
        workers: { technician: 1, artisan: 1 },
        description: '需要1名技工和1名工匠'
      },

      // 高級建築
      alchemy_lab: {
        workers: { artisan: 1, technical_staff: 1 },
        description: '需要1名工匠和1名技術人員'
      },
      enchanting_tower: {
        workers: { magic_technician: 1, technical_staff: 1 },
        description: '需要1名魔法技工和1名技術人員'
      },
      arcane_workshop: {
        workers: { artisan: 1, magic_technician: 1 },
        description: '需要1名工匠和1名魔法技工'
      },

      // 特殊建築
      wizard_tower: {
        workers: { magic_technician: 1, engineer: 1 },
        description: '需要1名魔法技工和1名工程師'
      },
      arcane_library: {
        workers: { technical_staff: 2 },
        description: '需要2名技術人員'
      },
      mana_fountain: {
        workers: { magic_technician: 1 },
        description: '需要1名魔法技工'
      },

      // 高級建築
      magic_academy: {
        workers: { engineer: 1, magic_technician: 1, accountant: 1 },
        description: '需要1名工程師、1名魔法技工和1名會計'
      },
      research_lab: {
        workers: { engineer: 2, technical_staff: 1 },
        description: '需要2名工程師和1名技術人員'
      },

      // 住房建築
      housing_district: {
        workers: { worker: 0 }, // 住房不需要工人
        description: '提供居民住所'
      },
      wizard_quarters: {
        workers: { worker: 0 }, // 住房不需要工人
        description: '為魔法師提供住所'
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
      // 將新增人口添加為工人
      this.workerTypes.worker.count += growth;
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

    // 定期重新分配工人
    this.workerReallocationTimer = this.workerReallocationTimer || 0;
    this.workerReallocationInterval = this.workerReallocationInterval || 30000; // 30秒重新分配一次

    this.workerReallocationTimer += delta;
    if (this.workerReallocationTimer >= this.workerReallocationInterval) {
      this.workerReallocationTimer = 0;
      this.reallocateAllWorkers();
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

            // 新移入的人口大部分是底層工人，但也有一些是中層和上層
            const lowerClassRatio = 0.7;
            const middleClassRatio = 0.25;
            const upperClassRatio = 0.05;

            // 添加底層人口
            const lowerClassAmount = Math.floor(actualImmigration * lowerClassRatio);
            this.workerTypes.worker.count += lowerClassAmount;

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

    // 檢查幸福度導致的自動階層轉化
    this.checkHappinessClassTransitions();

    // 檢查退化條件
    this.checkDemotions();
  }

  /**
   * 檢查幸福度導致的自動階層轉化
   */
  checkHappinessClassTransitions() {
    // 檢查幸福度高時下層人口自動轉化為上層人口

    // 檢查下層到中層的轉化
    this.checkClassUpgrade('lower', 'middle');

    // 檢查中層到上層的轉化
    this.checkClassUpgrade('middle', 'upper');
  }

  /**
   * 檢查特定階層的升級
   * @param {string} fromClass - 原階層
   * @param {string} toClass - 目標階層
   */
  checkClassUpgrade(fromClass, toClass) {
    // 獲取原階層的幸福度
    const classHappiness = this.classHappiness[fromClass]?.value || 0;

    // 只有在幸福度足夠高時才會轉化
    // 下層到中層需要至少 75 幸福度，中層到上層需要至少 85 幸福度
    const minHappiness = fromClass === 'lower' ? 75 : 85;

    if (classHappiness >= minHappiness) {
      // 計算轉化機率，幸福度越高機率越大
      const baseChance = (classHappiness - minHappiness) / 500; // 基礎機率
      const upgradeChance = Math.min(0.05, baseChance); // 最大 5% 機率

      // 檢查是否觸發轉化
      if (Math.random() < upgradeChance) {
        // 獲取這個階層的總人口
        const stats = this.getPopulationStats();
        const classPopulation = stats.socialClasses[fromClass]?.count || 0;

        if (classPopulation > 0) {
          // 轉化一定比例的人口，最多 3%
          const upgradeRatio = Math.min(0.03, upgradeChance / 2);
          const upgradeAmount = Math.ceil(classPopulation * upgradeRatio);

          if (upgradeAmount > 0) {
            // 從原階層移除人口
            this.removePopulationFromClass(fromClass, upgradeAmount);

            // 將人口添加到目標階層
            this.addPopulationToClass(toClass, upgradeAmount);

            console.log(`由於 ${fromClass} 階層幸福度高 (${classHappiness.toFixed(1)}), ${upgradeAmount} 人口升級到 ${toClass} 階層`);
          }
        }
      }
    }
  }

  /**
   * 檢查工人晉升條件
   */
  checkPromotions() {
    // 檢查底層工人內部晉升
    // 工人升級為技工
    if (this.workerTypes.worker.count >= 1) {
      this.checkSpecificPromotion('worker', 'technician', 'worker_to_technician');
    }

    // 技工升級為工匠
    if (this.workerTypes.technician.count >= 1) {
      this.checkSpecificPromotion('technician', 'artisan', 'technician_to_artisan');
    }

    // 檢查中層工人內部晉升
    // 技術人員升級為工程師
    if (this.workerTypes.technical_staff.count >= 1) {
      this.checkSpecificPromotion('technical_staff', 'engineer', 'technical_staff_to_engineer');
    }

    // 檢查上層工人內部晉升
    // 會計升級為老闆
    if (this.workerTypes.accountant.count >= 1) {
      this.checkSpecificPromotion('accountant', 'boss', 'accountant_to_boss');
    }

    // 魔法技工升級為老闆
    if (this.workerTypes.magic_technician.count >= 1) {
      this.checkSpecificPromotion('magic_technician', 'boss', 'magic_technician_to_boss');
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
        let targetType = 'worker'; // 預設退化為工人

        if (socialClass === 'upper') {
          // 上層退化到中層，隨機選擇一種中層工人
          const middleClassWorkers = this.socialClasses.middle.workerTypes;
          targetType = middleClassWorkers[Math.floor(Math.random() * middleClassWorkers.length)];
        } else if (socialClass === 'middle') {
          // 中層退化到底層，預設為技工
          targetType = 'technician';
        } else if (workerType === 'artisan') {
          // 工匠退化為技工
          targetType = 'technician';
        } else if (workerType === 'technician') {
          // 技工退化為工人
          targetType = 'worker';
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
      classNewHappiness = Math.max(0, Math.min(100, classNewHappiness));

      // 考慮現有幸福度進行平滑過渡
      const currentHappiness = this.classHappiness[className].value;
      const happinessChangeRate = 0.2; // 幸福度變化率，可以調整

      // 幸福度統合計算，結合現有幸福度和新計算的幸福度
      const newHappiness = currentHappiness + (classNewHappiness - currentHappiness) * happinessChangeRate;

      // 更新幸福度值
      this.classHappiness[className].value = newHappiness;

      // 安全地使用 DebugUtils
      if (DebugUtils && DebugUtils.log) {
        DebugUtils.log(`${className} 階層幸福度: ${currentHappiness.toFixed(2)} -> ${newHappiness.toFixed(2)}`, 'HAPPINESS');
      } else {
        console.log(`${className} 階層幸福度: ${currentHappiness.toFixed(2)} -> ${newHappiness.toFixed(2)}`);
      }
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
    let targetHappiness;
    if (totalPopulation > 0) {
      targetHappiness = totalWeightedHappiness / totalPopulation;
    } else {
      targetHappiness = 50; // 預設值
    }

    // 考慮現有總體幸福度進行平滑過渡
    const currentHappiness = this.happinessLevel;
    const overallHappinessChangeRate = 0.15; // 總體幸福度變化率，可以調整

    // 統合計算新的幸福度
    const newHappiness = currentHappiness + (targetHappiness - currentHappiness) * overallHappinessChangeRate;

    // 更新總體幸福度
    this.happinessLevel = newHappiness;

    // 安全地使用 DebugUtils
    if (DebugUtils && DebugUtils.log) {
      DebugUtils.log(`總體幸福度: ${currentHappiness.toFixed(2)} -> ${newHappiness.toFixed(2)}`, 'HAPPINESS');
    } else {
      console.log(`總體幸福度: ${currentHappiness.toFixed(2)} -> ${newHappiness.toFixed(2)}`);
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
      const currentMarketValue = this.classHappiness[className].factors.market.value;

      // 計算新的市場因素值，但考慮平滑過渡
      const marketChangeRate = 0.3; // 市場因素變化率，可以調整
      const targetMarketValue = currentMarketValue + impactData.totalImpact;
      const newMarketValue = currentMarketValue + (targetMarketValue - currentMarketValue) * marketChangeRate;

      // 確保在0-100範圍內
      this.classHappiness[className].factors.market.value = Math.max(0, Math.min(100, newMarketValue));

      // 存儲需求滿足情況
      this.classHappiness[className].demands = impactData.demandImpacts;

      // 安全地使用 DebugUtils
      if (DebugUtils && DebugUtils.log) {
        DebugUtils.log(`${className} 階層市場幸福度: ${currentMarketValue.toFixed(2)} -> ${newMarketValue.toFixed(2)} (影響: ${impactData.totalImpact.toFixed(2)})`, 'HAPPINESS');
      } else {
        console.log(`${className} 階層市場幸福度: ${currentMarketValue.toFixed(2)} -> ${newMarketValue.toFixed(2)} (影響: ${impactData.totalImpact.toFixed(2)})`);
      }
    }

    // 重新計算統合幸福度
    this.updateHappiness();
  }

  /**
   * 檢查不幸福的影響
   */
  checkUnhappyEffects() {
    const stats = this.getPopulationStats();
    // 檢查每個階層的幸福度
    for (const [className, classHappiness] of Object.entries(this.classHappiness)) {
      // 如果幸福度非常低，觸發人口流失
      if (classHappiness.value < 20 && stats.socialClasses[className]?.count>0) {
        this.triggerClassPopulationLoss(className);
      }
      // 如果幸福度低，觸發階層退化
      else if (classHappiness.value < 35 && className !== 'lower' && stats.socialClasses[className]?.count>0) {
        this.triggerClassDemotion(className);
      }
    }
  }

  /**
   * 觸發特定階層的人口流失
   * @param {string} className - 階層名稱
   */
  triggerClassPopulationLoss(className) {
    // 先檢查這個階層的總人口
    const stats = this.getPopulationStats();
    const classPopulation = stats.socialClasses[className]?.count || 0;

    // 確保人口數大於0
    if (classPopulation <= 0) {
      console.log(`警告: 嘗試觸發 ${className} 階層人口流失，但人口數為 ${classPopulation}`, 'WARNING');
      return;
    }

    // 幸福度低時，有一定機率失去人口
    const classHappiness = this.classHappiness[className].value;
    const lossChance = Math.max(0, (30 - classHappiness) / 100);

    if (Math.random() < lossChance) {
      // 流失一定比例的人口，最多8%
      const lossRatio = Math.min(0.08, lossChance / 1.5);
      const lossAmount = Math.ceil(classPopulation * lossRatio);

      if (lossAmount > 0) {
        // 移除人口
        this.removePopulationFromClass(className, lossAmount);
        this.totalPopulation -= lossAmount;

        console.log(`由於 ${className} 階層幸福度低 (${classHappiness.toFixed(1)}), 流失了 ${lossAmount} 人口`, 'POPULATION');
      }
    }
  }

  /**
   * 觸發階層退化
   * @param {string} className - 階層名稱
   */
  triggerClassDemotion(className) {
    // 先檢查這個階層的總人口
    const stats = this.getPopulationStats();
    const classPopulation = stats.socialClasses[className]?.count || 0;

    // 確保人口數大於0
    if (classPopulation <= 0) {
      console.log(`警告: 嘗試觸發 ${className} 階層退化，但人口數為 ${classPopulation}`, 'WARNING');
      return;
    }

    // 幸福度低時，有一定機率退化到下一個階層
    const classHappiness = this.classHappiness[className].value;
    const demotionChance = Math.max(0, (40 - classHappiness) / 200);

    if (Math.random() < demotionChance) {
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

        console.log(`由於 ${className} 階層幸福度低 (${classHappiness.toFixed(1)}), ${demotionAmount} 人口退化到 ${targetClass} 階層`, 'POPULATION');
      }
    }
  }

  /**
   * 觸發人口流失
   */
  triggerPopulationLoss() {
    // 確保總人口數大於0
    if (this.totalPopulation <= 0) {
      console.log(`警告: 嘗試觸發人口流失，但總人口數為 ${this.totalPopulation}`, 'WARNING');
      return;
    }

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

        console.log(`由於幸福度低 (${this.happinessLevel.toFixed(1)}), 流失了 ${lossAmount} 人口`, 'POPULATION');
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
    // 確保移除數量大於0
    if (amount <= 0) {
      console.log(`警告: 嘗試從 ${socialClass} 階層移除非正數人口 (${amount})`, 'WARNING');
      return 0;
    }

    let remainingToRemove = amount;

    // 獲取該階層的工人類型
    const workerTypes = this.socialClasses[socialClass]?.workerTypes || [];

    // 如果指定階層沒有足夠的人口，則從下一個階層移除
    if (workerTypes.length === 0) {
      console.log(`警告: ${socialClass} 階層沒有工人類型，嘗試從下一階層移除`, 'WARNING');
      if (socialClass === 'upper') {
        return this.removePopulationFromClass('middle', amount);
      } else if (socialClass === 'middle') {
        return this.removePopulationFromClass('lower', amount);
      } else {
        console.log(`警告: 已經是最低階層，無法移除人口`, 'WARNING');
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

        console.log(`從 ${worker.displayName} 移除了 ${removeFromThisType} 人口`, 'POPULATION');
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

    if (workerTypes.length != 0) {
      // 如果沒有工人類型，根據階層選擇適當的預設工人類型
      let defaultWorkerType = 'worker'; // 預設為底層工人

      if (socialClass === 'middle') {
        // 中層預設為技術人員
        defaultWorkerType = 'technical_staff';
        if (!this.workerTypes[defaultWorkerType]) {
          console.log(`錯誤: 中層預設工人類型 ${defaultWorkerType} 不存在，嘗試使用工程師`, 'ERROR');
          defaultWorkerType = 'engineer';

          if (!this.workerTypes[defaultWorkerType]) {
            console.log(`錯誤: 中層備用工人類型 ${defaultWorkerType} 也不存在，回退到底層工人`, 'ERROR');
            defaultWorkerType = 'worker';
          }
        }
      } else if (socialClass === 'upper') {
        // 上層預設為會計
        defaultWorkerType = 'accountant';
        if (!this.workerTypes[defaultWorkerType]) {
          console.log(`錯誤: 上層預設工人類型 ${defaultWorkerType} 不存在，嘗試使用魔法技工`, 'ERROR');
          defaultWorkerType = 'magic_technician';

          if (!this.workerTypes[defaultWorkerType]) {
            console.log(`錯誤: 上層備用工人類型 ${defaultWorkerType} 也不存在，嘗試使用老闆`, 'ERROR');
            defaultWorkerType = 'boss';

            if (!this.workerTypes[defaultWorkerType]) {
              console.log(`錯誤: 所有上層工人類型都不存在，回退到底層工人`, 'ERROR');
              defaultWorkerType = 'worker';
            }
          }
        }
      }

      // 確保預設工人類型存在
      if (this.workerTypes[defaultWorkerType]) {
        if (this.workerTypes[defaultWorkerType].count == 0) {
        this.classHappiness[socialClass].value = 80;
        this.workerTypes[defaultWorkerType].count += amount;

        }
        else
        {
          let basehappiness = 50;
          basehappiness = this.classHappiness[socialClass].value*this.workerTypes[defaultWorkerType].count+80*amount/this.workerTypes[defaultWorkerType].count+amount
          this.classHappiness[socialClass].value = basehappiness;
          this.workerTypes[defaultWorkerType].count += amount;
        }
        console.log(`警告: ${socialClass} 階層沒有工人類型，添加 ${amount} 人口到 ${this.workerTypes[defaultWorkerType].displayName}`, 'WARNING');
      } else {
        console.log(`嚴重錯誤: 無法找到任何可用的工人類型，無法添加人口`, 'ERROR');
      }
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
   * 吸引特定階層的移民
   * @param {string} targetClass - 目標階層 ('lower', 'middle' 或 'upper')
   * @param {number} count - 移民數量
   * @param {number} gold - 玩家當前擁有的金幣
   * @returns {Object} - 包含成功与否、消耗金幣和剩餘金幣的結果
   */
  attractImmigrants(targetClass, count, gold) {
    // 檢查目標階層是否有效
    if (targetClass !== 'lower' && targetClass !== 'middle' && targetClass !== 'upper') {
      return { success: false, message: '無效的階層' };
    }

    // 檢查住房容量
    const availableHousing = this.housingCapacity - this.totalPopulation;
    if (availableHousing < count) {
      return { success: false, message: '住房容量不足' };
    }

    // 計算所需金幣
    // 下層移民每人需要 20 金幣，中層移民每人需要 50 金幣，上層移民每人需要 200 金幣
    let goldPerImmigrant;
    if (targetClass === 'lower') {
      goldPerImmigrant = 20;
    } else if (targetClass === 'middle') {
      goldPerImmigrant = 50;
    } else { // upper
      goldPerImmigrant = 200;
    }

    const totalCost = count * goldPerImmigrant;

    // 檢查金幣是否足夠
    if (gold < totalCost) {
      return {
        success: false,
        message: `金幣不足，需要 ${totalCost} 金幣`
      };
    }

    // 添加移民到目標階層
    this.addPopulationToClass(targetClass, count);
    this.totalPopulation += count;

    // 返回結果
    return {
      success: true,
      message: `成功吸引 ${count} 名 ${this.socialClasses[targetClass].name} 移民`,
      goldSpent: totalCost,
      remainingGold: gold - totalCost
    };
  }

  /**
   * 訓練特定階層的工人 (已禁用)
   * @param {string} targetClass - 目標階層 ('middle' 或 'upper')
   * @param {number} count - 訓練數量
   * @param {Object} resources - 可用資源
   * @returns {boolean} - 是否成功訓練
   */
  trainWorkersByClass(targetClass, count, resources) {
    // 中層和高層工人只能通過幸福度自動轉化或花錢吸引移民
    return false;
  }

  /**
   * 訓練特定類型的工人 (已禁用)
   * @param {string} workerType - 工人類型
   * @param {number} count - 訓練數量
   * @param {Object} resources - 可用資源
   * @returns {boolean} - 是否成功訓練
   */
  trainWorkers(workerType, count, resources) {
    // 中層和高層工人只能通過幸福度自動轉化或花錢吸引移民
    return false;
  }

  /**
   * 獲取可用（未分配）的工人數量
   * @param {string} workerType - 工人類型
   * @returns {number} - 可用工人數量
   */
  getAvailableWorkers(workerType) {
    // 確保工人類型存在
    if (!this.workerTypes[workerType]) {
      console.warn(`工人類型 ${workerType} 不存在，返回0`);
      return 0;
    }
    return this.workerTypes[workerType].count - this.workerTypes[workerType].assigned;
  }

  /**
   * 分配工人到建築 (同層職業互通)
   * @param {string} buildingId - 建築ID
   * @param {string} buildingType - 建築類型
   * @param {Object} workerRequirement - 可選的工人需求對象，如果提供則使用它而不是建築預設需求
   * @param {string} priority - 建築优先级 ('high', 'medium', 'low')
   * @returns {boolean} - 是否成功分配
   */
  assignWorkersToBulding(buildingId, buildingType, workerRequirement = null, priority = 'medium') {
    // 存储建筑类型以便于后续使用
    this.buildingTypes.set(buildingId, buildingType);
    // 存储建筑优先级
    this.buildingPriorities = this.buildingPriorities || new Map();
    this.buildingPriorities.set(buildingId, priority);

    // 檢查建築是否需要工人
    let requirements;

    if (workerRequirement) {
      // 使用提供的工人需求（例如來自生產方式的需求）
      requirements = {
        description: `需要 ${workerRequirement.count} 名 ${this.workerTypes[workerRequirement.type]?.displayName || workerRequirement.type}`,
        workers: { [workerRequirement.type]: workerRequirement.count }
      };
    } else {
      // 使用建築預設需求
      requirements = this.buildingWorkerRequirements[buildingType];
      if (!requirements) return true; // 如果沒有要求，視為成功
    }

    // 按階層統計需要的工人數量
    const classRequirements = {
      lower: 0,
      middle: 0,
      upper: 0
    };

    // 統計每個階層需要的工人數量
    for (const [workerType, count] of Object.entries(requirements.workers)) {
      const socialClass = this.workerTypes[workerType]?.socialClass || 'lower';
      classRequirements[socialClass] += count;
    }

    // 檢查每個階層是否有足夠的工人
    for (const [className, requiredCount] of Object.entries(classRequirements)) {
      if (requiredCount <= 0) continue;

      // 計算這個階層的可用工人總數
      let availableWorkers = 0;
      for (const workerType of this.socialClasses[className]?.workerTypes || []) {
        if (this.workerTypes[workerType]) {
          availableWorkers += this.getAvailableWorkers(workerType);
        }
      }

      if (availableWorkers < requiredCount) {
        return false; // 工人不足
      }
    }

    // 分配工人 (同層職業互通)
    const assignment = {};

    // 按階層分配工人
    for (const [className, requiredCount] of Object.entries(classRequirements)) {
      if (requiredCount <= 0) continue;

      // 獲取這個階層的所有工人類型
      const classWorkerTypes = this.socialClasses[className].workerTypes;
      let remainingToAssign = requiredCount;

      // 先分配原本需求的工人類型，如果有的話
      for (const [reqWorkerType, reqCount] of Object.entries(requirements.workers)) {
        // 確保工人類型存在
        if (!this.workerTypes[reqWorkerType]) {
          console.warn(`工人類型 ${reqWorkerType} 不存在，跳過`);
          continue;
        }

        const workerClass = this.workerTypes[reqWorkerType].socialClass;
        if (workerClass !== className) continue;

        // 如果有足夠的這種工人，就分配這種工人
        const available = this.getAvailableWorkers(reqWorkerType);
        const toAssign = Math.min(reqCount, available, remainingToAssign);

        if (toAssign > 0) {
          assignment[reqWorkerType] = toAssign;
          this.workerTypes[reqWorkerType].assigned += toAssign;
          remainingToAssign -= toAssign;
        }
      }

      // 如果還需要更多工人，就從同階層的其他工人中分配
      if (remainingToAssign > 0) {
        // 先按可用數量排序工人類型，優先使用有更多可用工人的類型
        const sortedWorkerTypes = [...classWorkerTypes].sort((a, b) => {
          return this.getAvailableWorkers(b) - this.getAvailableWorkers(a);
        });

        for (const workerType of sortedWorkerTypes) {
          if (remainingToAssign <= 0) break;

          const available = this.getAvailableWorkers(workerType);
          if (available <= 0) continue;

          const toAssign = Math.min(available, remainingToAssign);

          // 如果這種工人已經分配了一些，就增加分配數量
          if (assignment[workerType]) {
            assignment[workerType] += toAssign;
          } else {
            assignment[workerType] = toAssign;
          }

          this.workerTypes[workerType].assigned += toAssign;
          remainingToAssign -= toAssign;
        }
      }

      // 如果還是沒有足夠的工人，就失敗
      if (remainingToAssign > 0) {
        // 回滿已分配的工人
        for (const [workerType, count] of Object.entries(assignment)) {
          this.workerTypes[workerType].assigned -= count;
        }
        return false;
      }
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
   * @param {Object} workerRequirement - 可選的工人需求對象，用于重新分配工人
   * @param {string} [buildingType] - 建築類型，如果提供則使用它
   * @returns {boolean} - 是否有足夠工人
   */
  hasSufficientWorkers(buildingId, workerRequirement = null, buildingType = null) {
    // 如果已經有分配的工人，且沒有新的需求，則返回真
    if (this.workerAssignments.has(buildingId) && !workerRequirement) {
      return true;
    }

    // 如果有新的工人需求，先釋放原來的工人，然後重新分配
    if (workerRequirement) {
      // 釋放原來的工人
      this.removeWorkersFromBuilding(buildingId);

      // 如果沒有提供建築類型，則嘗試從已存在的分配中獲取
      let actualBuildingType = buildingType;

      // 如果沒有提供建築類型，則嘗試從其他來源獲取
      if (!actualBuildingType) {
        // 嘗試從已存在的分配中獲取建築類型
        const existingAssignment = this.buildingTypes.get(buildingId);
        if (existingAssignment) {
          actualBuildingType = existingAssignment;
        }
        // 如果還是沒有，則嘗試從 scene 中獲取
        else if (this.scene && this.scene.buildingSystem) {
          actualBuildingType = this.scene.buildingSystem.buildings.get(buildingId)?.type;
        }
      }

      // 如果仍然無法獲取建築類型，則返回失敗
      if (!actualBuildingType) {
        console.log(`無法獲取建築 ${buildingId} 的類型，工人分配失敗`);
        return false;
      }

      // 获取建筑优先级
      let buildingPriority = 'medium';
      if (this.scene && this.scene.buildingSystem) {
        const building = this.scene.buildingSystem.buildings.get(buildingId);
        if (building) {
          buildingPriority = building.priority || 'medium';
        }
      }

      return this.assignWorkersToBulding(buildingId, actualBuildingType, workerRequirement, buildingPriority);
    }

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
   * 重新分配所有建筑的工人，按优先级顺序
   * @returns {Object} - 分配结果统计
   */
  reallocateAllWorkers() {
    // 先释放所有工人
    for (const buildingId of this.workerAssignments.keys()) {
      this.removeWorkersFromBuilding(buildingId);
    }

    // 按优先级分组建筑
    const highPriorityBuildings = [];
    const mediumPriorityBuildings = [];
    const lowPriorityBuildings = [];

    // 获取所有建筑及其优先级
    for (const [buildingId, buildingType] of this.buildingTypes.entries()) {
      const priority = this.buildingPriorities?.get(buildingId) || 'medium';

      // 获取建筑对象
      let building = null;
      if (this.scene && this.scene.buildingSystem) {
        building = this.scene.buildingSystem.buildings.get(buildingId);
      }

      // 如果建筑不存在，跳过
      if (!building) continue;

      // 如果是住房建筑，跳过
      if (building.type === 'housing') continue;

      // 按优先级分组
      if (priority === 'high') {
        highPriorityBuildings.push({ id: buildingId, type: buildingType, building });
      } else if (priority === 'medium') {
        mediumPriorityBuildings.push({ id: buildingId, type: buildingType, building });
      } else {
        lowPriorityBuildings.push({ id: buildingId, type: buildingType, building });
      }
    }

    // 分配结果统计
    const result = {
      total: highPriorityBuildings.length + mediumPriorityBuildings.length + lowPriorityBuildings.length,
      success: 0,
      partial: 0,
      failed: 0,
      highPriority: { total: highPriorityBuildings.length, success: 0, partial: 0, failed: 0 },
      mediumPriority: { total: mediumPriorityBuildings.length, success: 0, partial: 0, failed: 0 },
      lowPriority: { total: lowPriorityBuildings.length, success: 0, partial: 0, failed: 0 }
    };

    // 先分配高优先级建筑
    for (const buildingData of highPriorityBuildings) {
      const { id, type, building } = buildingData;
      const workerRequirement = building.getCurrentWorkerRequirement();
      const success = this.assignWorkersToBulding(id, type, workerRequirement, 'high');

      if (success) {
        result.success++;
        result.highPriority.success++;
      } else {
        result.failed++;
        result.highPriority.failed++;
      }
    }

    // 然后分配中优先级建筑
    for (const buildingData of mediumPriorityBuildings) {
      const { id, type, building } = buildingData;
      const workerRequirement = building.getCurrentWorkerRequirement();
      const success = this.assignWorkersToBulding(id, type, workerRequirement, 'medium');

      if (success) {
        result.success++;
        result.mediumPriority.success++;
      } else {
        result.failed++;
        result.mediumPriority.failed++;
      }
    }

    // 最后分配低优先级建筑
    for (const buildingData of lowPriorityBuildings) {
      const { id, type, building } = buildingData;
      const workerRequirement = building.getCurrentWorkerRequirement();
      const success = this.assignWorkersToBulding(id, type, workerRequirement, 'low');

      if (success) {
        result.success++;
        result.lowPriority.success++;
      } else {
        result.failed++;
        result.lowPriority.failed++;
      }
    }

    // 如果有失败的建筑，尝试按比例分配工人
    if (result.failed > 0) {
      this.assignWorkersProportionally();
    }

    return result;
  }

  /**
   * 按比例分配工人到失败的建筑
   */
  assignWorkersProportionally() {
    // 按优先级分组建筑
    const highPriorityBuildings = [];
    const mediumPriorityBuildings = [];
    const lowPriorityBuildings = [];

    // 获取所有没有工人的建筑
    for (const [buildingId, buildingType] of this.buildingTypes.entries()) {
      // 如果已经有工人分配，跳过
      if (this.workerAssignments.has(buildingId)) continue;

      const priority = this.buildingPriorities?.get(buildingId) || 'medium';

      // 获取建筑对象
      let building = null;
      if (this.scene && this.scene.buildingSystem) {
        building = this.scene.buildingSystem.buildings.get(buildingId);
      }

      // 如果建筑不存在，跳过
      if (!building) continue;

      // 如果是住房建筑，跳过
      if (building.type === 'housing') continue;

      // 按优先级分组
      if (priority === 'high') {
        highPriorityBuildings.push({ id: buildingId, type: buildingType, building });
      } else if (priority === 'medium') {
        mediumPriorityBuildings.push({ id: buildingId, type: buildingType, building });
      } else {
        lowPriorityBuildings.push({ id: buildingId, type: buildingType, building });
      }
    }

    // 按优先级顺序处理建筑
    this.assignProportionallyByPriority(highPriorityBuildings);
    this.assignProportionallyByPriority(mediumPriorityBuildings);
    this.assignProportionallyByPriority(lowPriorityBuildings);
  }

  /**
   * 按比例分配工人到同一优先级的建筑
   * @param {Array} buildings - 建筑数组
   */
  assignProportionallyByPriority(buildings) {
    if (buildings.length === 0) return;

    // 按階層统计工人需求
    const classRequirements = {
      lower: 0,
      middle: 0,
      upper: 0
    };

    // 每个建筑的工人需求
    const buildingRequirements = [];

    // 统计所有建筑的工人需求
    for (const buildingData of buildings) {
      const { id, type, building } = buildingData;
      const workerRequirement = building.getCurrentWorkerRequirement();

      // 如果没有工人需求，跳过
      if (!workerRequirement) continue;

      // 使用建筑预设需求或生产方式需求
      let requirements;
      if (workerRequirement.type) {
        requirements = {
          workers: { [workerRequirement.type]: workerRequirement.count }
        };
      } else {
        requirements = this.buildingWorkerRequirements[type];
        if (!requirements) continue;
      }

      // 统计每个階层需要的工人数量
      const buildingClassReq = { lower: 0, middle: 0, upper: 0 };

      for (const [workerType, count] of Object.entries(requirements.workers)) {
        const socialClass = this.workerTypes[workerType]?.socialClass || 'lower';
        buildingClassReq[socialClass] += count;
        classRequirements[socialClass] += count;
      }

      buildingRequirements.push({
        id,
        type,
        building,
        requirements,
        classRequirements: buildingClassReq
      });
    }

    // 计算每个階层的可用工人
    const availableWorkers = {
      lower: 0,
      middle: 0,
      upper: 0
    };

    for (const className of Object.keys(availableWorkers)) {
      for (const workerType of this.socialClasses[className]?.workerTypes || []) {
        if (this.workerTypes[workerType]) {
          availableWorkers[className] += this.getAvailableWorkers(workerType);
        }
      }
    }

    // 计算每个階层的分配比例
    const allocationRatio = {
      lower: Math.min(1, availableWorkers.lower / (classRequirements.lower || 1)),
      middle: Math.min(1, availableWorkers.middle / (classRequirements.middle || 1)),
      upper: Math.min(1, availableWorkers.upper / (classRequirements.upper || 1))
    };

    // 按比例分配工人
    for (const buildingData of buildingRequirements) {
      const { id, type, building, requirements } = buildingData;

      // 创建按比例缩减的工人需求
      const scaledRequirements = { ...requirements };
      const scaledWorkers = {};

      for (const [workerType, count] of Object.entries(requirements.workers)) {
        const socialClass = this.workerTypes[workerType]?.socialClass || 'lower';
        const ratio = allocationRatio[socialClass];
        const scaledCount = Math.floor(count * ratio);

        if (scaledCount > 0) {
          scaledWorkers[workerType] = scaledCount;
        }
      }

      scaledRequirements.workers = scaledWorkers;

      // 分配工人
      const priority = this.buildingPriorities?.get(id) || 'medium';

      // 确保有可用的工人类型
      const workerTypes = Object.keys(scaledWorkers);
      if (workerTypes.length > 0) {
        this.assignWorkersToBulding(id, type, { count: 1, type: workerTypes[0] }, priority);
      }

      // 设置建筑效率
      const efficiency = this.getBuildingEfficiencyMultiplier(id);
      building.setActive(true, efficiency);
    }
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
      case 'worker':
        // 工人可以升級為技工
        return worker.experience >= 15;

      case 'technician':
        // 技工可以升級為工匠
        return worker.experience >= 30;

      case 'technical_staff':
        // 技術人員可以升級為工程師
        return worker.experience >= 40;

      case 'accountant':
      case 'magic_technician':
        // 會計和魔法技工可以升級為老闆
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
    if (fromType === 'worker' && toType === 'technician') {
      requirementKey = 'worker_to_technician';
    } else if (fromType === 'technician' && toType === 'artisan') {
      requirementKey = 'technician_to_artisan';
    } else if (fromType === 'technical_staff' && toType === 'engineer') {
      requirementKey = 'technical_staff_to_engineer';
    } else if (fromType === 'accountant' && toType === 'boss') {
      requirementKey = 'accountant_to_boss';
    } else if (fromType === 'magic_technician' && toType === 'boss') {
      requirementKey = 'magic_technician_to_boss';
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
