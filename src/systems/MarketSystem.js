/**
 * 市場系統 - 管理資源交易和價格波動
 */
export default class MarketSystem {
  /**
   * @param {Object} config - 系統配置
   */
  constructor(config = {}) {
    // 市場價格
    this.prices = {};

    // 資源值價格 (happiness, transport, security, health)
    this.resourceValuePrices = {};

    // 通脹率系統
    this.inflationRate = 1.0; // 基礎通脹率
    this.inflationHistory = []; // 通脹歷史記錄
    this.lastInflationUpdate = 0;
    this.inflationUpdateInterval = 60000; // 每分鐘更新一次通脹率

    // 本地事件修正系統
    this.localEvents = {
      active: [],
      priceModifiers: {}
    };

    // 價格波動設置
    this.priceFluctuationInterval = config.priceFluctuationInterval || 60000; // 每分鐘波動一次
    this.priceFluctuationTimer = 0;
    this.priceFluctuationRange = config.priceFluctuationRange || 0.1; // 10%波動範圍

    // 交易歷史
    this.transactionHistory = [];

    // 市場庫存 - 記錄市場中的資源庫存
    this.marketInventory = {};

    // 月度稅收計算
    this.monthlyRevenue = 0; // 月度營業額
    this.taxRate = 0.05; // 5%稅率
    this.lastProcessedMonth = 1; // 上次處理稅收的月份

    // 需求系統 - 更詳細的需求分類
    this.demands = {
      lower: { // 底層需求
        basic_food: { basePrice: 5, currentPrice: 5, demand: 1.0, displayName: '基本食材', importance: 0.5 },
        cloth: { basePrice: 8, currentPrice: 8, demand: 0.5, displayName: '布料', importance: 0.3 },
        basic_housing: { basePrice: 10, currentPrice: 10, demand: 0.3, displayName: '居住地方', importance: 0.2 }
      },
      middle: { // 中層需求
        fine_food: { basePrice: 12, currentPrice: 12, demand: 0.8, displayName: '精緻食物', importance: 0.3 },
        wine: { basePrice: 15, currentPrice: 15, demand: 0.5, displayName: '酒', importance: 0.15 },
        clothing: { basePrice: 18, currentPrice: 18, demand: 0.6, displayName: '成衣', importance: 0.2 },
        standard_housing: { basePrice: 25, currentPrice: 25, demand: 0.4, displayName: '一般住所', importance: 0.2 },
        furniture: { basePrice: 20, currentPrice: 20, demand: 0.3, displayName: '家具', importance: 0.15 }
      },
      upper: { // 上層需求
        gourmet_food: { basePrice: 30, currentPrice: 30, demand: 0.6, displayName: '豐盛食物', importance: 0.2 },
        fine_wine: { basePrice: 40, currentPrice: 40, demand: 0.5, displayName: '美酒', importance: 0.15 },
        luxury_clothing: { basePrice: 50, currentPrice: 50, demand: 0.4, displayName: '高級衣物', importance: 0.15 },
        mansion: { basePrice: 100, currentPrice: 100, demand: 0.2, displayName: '豪宅', importance: 0.2 },
        artwork: { basePrice: 80, currentPrice: 80, demand: 0.3, displayName: '藝術品', importance: 0.15 },
        crafts: { basePrice: 60, currentPrice: 60, demand: 0.4, displayName: '工藝品', importance: 0.15 }
      }
    };

    // 商品與資源的對應關係
    this.goodsToResources = {
      // 底層需求對應資源
      basic_food: ['wheat', 'bread', 'simple_meal', 'meat', 'fish'],
      cloth: ['cloth', 'linen', 'animal_hide', 'leather'],
      basic_housing: ['wood', 'wood_plank', 'stone', 'clay'],
      fuel: ['firewood', 'charcoal'],
      tools: ['axe', 'iron_pickaxe', 'plow', 'tool'],

      // 中層需求對應資源
      fine_food: ['bread', 'meat', 'fish', 'flour', 'yeast'],
      wine: ['wine', 'salt', 'spice'],
      clothing: ['cloth', 'leather', 'fine_clothing'],
      standard_housing: ['wood_plank', 'red_brick', 'iron_ingot', 'pottery'],
      furniture: ['furniture', 'wood_plank', 'iron_ingot'],

      // 上層需求對應資源
      gourmet_food: ['wine', 'spice', 'fine_clothing'],
      fine_wine: ['wine', 'spice'],
      luxury_clothing: ['fine_clothing', 'jewelry'],
      mansion: ['red_brick', 'iron_ingot', 'glass', 'furniture'],
      artwork: ['art', 'jewelry', 'glass'],
      crafts: ['pottery', 'glass', 'art'],

      // 原材料和基礎資源
      raw_materials: ['iron_ore', 'wood', 'clay', 'stone'],
      processed_materials: ['iron_ingot', 'wood_plank', 'red_brick', 'glass'],

      // 魔法資源 (保留原有)
      magic_basic: ['magic_ore', 'enchanted_wood', 'arcane_crystal', 'mana'],
      magic_processed: ['arcane_essence', 'mystic_planks', 'refined_crystal'],
      magic_advanced: ['magical_potion', 'enchanted_artifact', 'magical_construct']
    };

    // 消費計時器
    this.consumptionTimer = 0;
    this.consumptionInterval = config.consumptionInterval || 30000; // 每30秒消費一次

    // 初始化市場價格
    this.initializePrices();

    // 初始化資源值價格
    this.initializeResourceValuePrices();
  }

  /**
   * 初始化市場價格和庫存
   */
  initializePrices() {
    // 為每種商品設置初始價格
    for (const [category, goods] of Object.entries(this.goodsToResources)) {
      goods.forEach(resource => {
        this.prices[resource] = {
          basePrice: this.getBasePriceForResource(resource),
          currentPrice: this.getBasePriceForResource(resource),
          demand: 1.0,
          supply: 1.0,
          volatility: this.getVolatilityForResource(resource)
        };

        // 初始化市場庫存
        this.marketInventory[resource] = {
          amount: 100, // 初始庫存
          maxCapacity: 1000, // 最大庫存容量
          lastUpdate: Date.now()
        };
      });
    }
  }

  /**
   * 初始化資源值價格和庫存
   */
  initializeResourceValuePrices() {
    // 資源值的基礎配置
    const resourceValueConfigs = {
      happiness: { basePrice: 15, volatility: 0.12, tier: 2 },
      transport: { basePrice: 25, volatility: 0.15, tier: 2 },
      security: { basePrice: 35, volatility: 0.18, tier: 3 },
      health: { basePrice: 20, volatility: 0.10, tier: 2 }
    };

    // 為每種資源值設置價格
    for (const [resourceValueType, config] of Object.entries(resourceValueConfigs)) {
      this.resourceValuePrices[resourceValueType] = {
        basePrice: config.basePrice,
        currentPrice: config.basePrice,
        inflationAdjustedPrice: config.basePrice,
        demand: 1.0,
        supply: 1.0,
        volatility: config.volatility,
        tier: config.tier,
        lastUpdate: Date.now()
      };

      // 初始化市場庫存 (資源值的"庫存"代表可購買的服務量)
      this.marketInventory[resourceValueType] = {
        amount: 50, // 初始可用服務量
        maxCapacity: 200, // 最大服務容量
        lastUpdate: Date.now()
      };
    }
  }

  /**
   * 獲取資源的基礎價格
   * @param {string} resource - 資源類型
   * @returns {number} - 基礎價格
   */
  getBasePriceForResource(resource) {
    // 根據資源稀有度設置基礎價格
    const rarityMap = {
      // 貨幣系統
      copper_coin: 1,
      silver_coin: 100,
      gold_coin: 1000,

      // 基礎農業資源 (tier 1)
      wheat: 1,
      manure: 2,
      hay: 1,
      dog_food: 2,
      meat: 4,
      fish: 3,
      wild_vegetable: 1,

      // 基礎原材料 (tier 1)
      iron_ore: 2,
      wood: 1,
      clay: 1,
      stone: 1,
      water: 0.5,
      animal_hide: 3,
      firewood: 2,

      // 加工食品 (tier 2)
      yeast: 5,
      flour: 2,
      bread: 5,
      simple_meal: 3,

      // 加工材料 (tier 2)
      iron_ingot: 8,
      wood_plank: 3,
      red_brick: 4,
      charcoal: 4,
      cloth: 6,
      leather: 8,
      linen: 5,
      pottery: 5,
      glass: 12,
      salt: 8,

      // 工具和設備 (tier 2)
      iron_pickaxe: 20,
      axe: 15,
      plow: 50,
      tool: 10,
      ox: 100,
      hunting_dog: 50,
      fishing_boat: 200,

      // 奢侈品 (tier 3)
      wine: 20,
      fine_clothing: 50,
      furniture: 25,
      spice: 30,

      // 高級奢侈品 (tier 4)
      jewelry: 100,
      art: 200,

      // 建築物
      mill: 500,
      bakery_building: 800,
      smithy: 1000,
      carpentry: 600,
      irrigation: 150,
      granary: 300,
      well: 50,
      market_building: 200,
      castle: 1500,
      hospital: 200,

      // 魔法資源 (保留原有)
      magic_ore: 10,
      enchanted_wood: 8,
      arcane_crystal: 12,
      mana: 5,
      arcane_essence: 20,
      mystic_planks: 18,
      refined_crystal: 25,
      magical_potion: 40,
      enchanted_artifact: 60,
      magical_construct: 100
    };

    return rarityMap[resource] || 10; // 默認價格為10
  }

  /**
   * 獲取資源的價格波動性
   * @param {string} resource - 資源類型
   * @returns {number} - 波動性 (0-1)
   */
  getVolatilityForResource(resource) {
    // 高級資源波動性更大
    const volatilityMap = {
      // 貨幣系統 (穩定)
      copper_coin: 0.01,
      silver_coin: 0.02,
      gold_coin: 0.03,

      // 基礎農業資源 (tier 1) - 低波動性
      wheat: 0.05,
      manure: 0.03,
      hay: 0.04,
      meat: 0.08,
      fish: 0.07,
      wild_vegetable: 0.06,

      // 基礎原材料 (tier 1) - 低波動性
      iron_ore: 0.05,
      wood: 0.04,
      clay: 0.03,
      stone: 0.02,
      water: 0.01,
      animal_hide: 0.06,
      firewood: 0.05,

      // 加工食品 (tier 2) - 中等波動性
      yeast: 0.08,
      flour: 0.06,
      bread: 0.07,
      simple_meal: 0.06,

      // 加工材料 (tier 2) - 中等波動性
      iron_ingot: 0.08,
      wood_plank: 0.06,
      red_brick: 0.07,
      charcoal: 0.08,
      cloth: 0.09,
      leather: 0.1,
      linen: 0.08,
      pottery: 0.07,
      glass: 0.12,
      salt: 0.1,

      // 工具和設備 (tier 2) - 中等波動性
      iron_pickaxe: 0.1,
      axe: 0.09,
      plow: 0.12,
      tool: 0.08,
      ox: 0.15,
      hunting_dog: 0.12,
      fishing_boat: 0.18,

      // 奢侈品 (tier 3) - 高波動性
      wine: 0.15,
      fine_clothing: 0.18,
      furniture: 0.14,
      spice: 0.2,

      // 高級奢侈品 (tier 4) - 很高波動性
      jewelry: 0.25,
      art: 0.3,

      // 建築物 - 低波動性
      mill: 0.05,
      bakery_building: 0.06,
      smithy: 0.07,
      carpentry: 0.06,
      irrigation: 0.04,
      granary: 0.05,
      well: 0.03,
      market_building: 0.08,
      castle: 0.1,
      hospital: 0.07,

      // 魔法資源 (保留原有)
      magic_ore: 0.05,
      enchanted_wood: 0.05,
      arcane_crystal: 0.08,
      mana: 0.03,
      arcane_essence: 0.1,
      mystic_planks: 0.1,
      refined_crystal: 0.12,
      magical_potion: 0.15,
      enchanted_artifact: 0.2,
      magical_construct: 0.25
    };

    return volatilityMap[resource] || 0.1; // 默認波動性為0.1
  }

  /**
   * 計算市場通脹率
   * 基於所有商品的平均價格變化
   */
  calculateInflationRate() {
    if (Object.keys(this.prices).length === 0) return 1.0;

    let totalPriceRatio = 0;
    let validPrices = 0;

    // 計算所有商品的價格比率
    for (const [resource, priceInfo] of Object.entries(this.prices)) {
      if (priceInfo.basePrice > 0) {
        totalPriceRatio += priceInfo.currentPrice / priceInfo.basePrice;
        validPrices++;
      }
    }

    // 計算平均通脹率
    const averageInflation = validPrices > 0 ? totalPriceRatio / validPrices : 1.0;

    // 平滑通脹率變化，避免劇烈波動
    this.inflationRate = (this.inflationRate * 0.8) + (averageInflation * 0.2);

    // 記錄通脹歷史
    this.inflationHistory.push({
      timestamp: Date.now(),
      rate: this.inflationRate
    });

    // 只保留最近10次記錄
    if (this.inflationHistory.length > 10) {
      this.inflationHistory.shift();
    }

    return this.inflationRate;
  }

  /**
   * 添加本地事件
   * @param {Object} event - 事件對象
   */
  addLocalEvent(event) {
    this.localEvents.active.push({
      id: event.id || `event_${Date.now()}`,
      name: event.name,
      description: event.description,
      duration: event.duration || 300000, // 默認5分鐘
      startTime: Date.now(),
      priceModifiers: event.priceModifiers || {},
      resourceValueModifiers: event.resourceValueModifiers || {}
    });

    console.log(`本地事件開始: ${event.name}`);
  }

  /**
   * 更新本地事件
   */
  updateLocalEvents() {
    const currentTime = Date.now();

    // 移除過期事件
    this.localEvents.active = this.localEvents.active.filter(event => {
      const isExpired = (currentTime - event.startTime) > event.duration;
      if (isExpired) {
        console.log(`本地事件結束: ${event.name}`);
      }
      return !isExpired;
    });

    // 計算當前活躍事件的價格修正
    this.localEvents.priceModifiers = {};

    for (const event of this.localEvents.active) {
      // 合併商品價格修正
      for (const [resource, modifier] of Object.entries(event.priceModifiers)) {
        if (!this.localEvents.priceModifiers[resource]) {
          this.localEvents.priceModifiers[resource] = 1.0;
        }
        this.localEvents.priceModifiers[resource] *= modifier;
      }

      // 合併資源值價格修正
      for (const [resourceValue, modifier] of Object.entries(event.resourceValueModifiers)) {
        const key = `rv_${resourceValue}`;
        if (!this.localEvents.priceModifiers[key]) {
          this.localEvents.priceModifiers[key] = 1.0;
        }
        this.localEvents.priceModifiers[key] *= modifier;
      }
    }
  }

  /**
   * 更新資源值價格
   * 應用通脹率和本地事件修正
   */
  updateResourceValuePrices() {
    for (const [resourceValueType, priceInfo] of Object.entries(this.resourceValuePrices)) {
      // 應用通脹率
      const inflationAdjustedPrice = priceInfo.basePrice * this.inflationRate;

      // 應用本地事件修正
      const eventModifier = this.localEvents.priceModifiers[`rv_${resourceValueType}`] || 1.0;

      // 應用隨機波動
      const randomFactor = 1 + (Math.random() - 0.5) * priceInfo.volatility;

      // 計算最終價格
      priceInfo.inflationAdjustedPrice = inflationAdjustedPrice;
      priceInfo.currentPrice = Math.max(1, Math.floor(inflationAdjustedPrice * eventModifier * randomFactor));
      priceInfo.lastUpdate = Date.now();
    }
  }

  /**
   * 更新市場系統
   * @param {number} time - 當前遊戲時間
   * @param {number} delta - 自上次更新以來的時間（毫秒）
   * @param {Object} resources - 資源系統引用
   * @param {Object} populationSystem - 人口系統引用
   */
  update(time, delta, resources, populationSystem) {
    // 更新本地事件
    this.updateLocalEvents();

    // 更新通脹率
    if (time - this.lastInflationUpdate >= this.inflationUpdateInterval) {
      this.lastInflationUpdate = time;
      this.calculateInflationRate();
      this.updateResourceValuePrices();
    }

    // 更新價格波動
    this.priceFluctuationTimer += delta;
    if (this.priceFluctuationTimer >= this.priceFluctuationInterval) {
      this.priceFluctuationTimer = 0;
      this.updatePrices(resources);
    }

    // 更新人口消費
    this.consumptionTimer += delta;
    if (this.consumptionTimer >= this.consumptionInterval) {
      this.consumptionTimer = 0;
      this.processPopulationConsumption(resources, populationSystem);
    }

    // 檢查時間系統和月份變化
    if (window.game && window.game.scene.scenes.length > 0) {
      const gameScene = window.game.scene.scenes.find(scene => scene.key === 'GameScene');
      if (gameScene && gameScene.timeSystem) {
        const currentMonth = gameScene.timeSystem.month;

        // 如果月份變化，處理稅收
        if (currentMonth !== this.lastProcessedMonth) {
          this.lastProcessedMonth = currentMonth;
          const taxAmount = this.processMonthlyTax();

          // 將稅收添加到玩家金幣
          if (gameScene && taxAmount > 0) {
            gameScene.playerGold += taxAmount;
            gameScene.updateGoldDisplay();
            gameScene.showTaxNotification(taxAmount, this.monthlyRevenue);
          }
        }
      }
    }
  }

  /**
   * 更新市場價格
   * @param {Object} resources - 資源系統引用
   */
  updatePrices(resources) {
    // 更新每種資源的價格
    for (const [resource, priceInfo] of Object.entries(this.prices)) {
      // 獲取當前資源量與最大容量的比例
      const resourceObj = resources.resources[resource];
      if (!resourceObj) continue;

      const resourceCap = resources.resourceCaps[resource] || 1000;
      const playerSupplyRatio = resourceObj.value / resourceCap;

      // 獲取市場庫存情況
      const marketInventoryInfo = this.marketInventory[resource] || { amount: 100, maxCapacity: 1000 };
      const marketSupplyRatio = marketInventoryInfo.amount / marketInventoryInfo.maxCapacity;

      // 結合玩家資源和市場庫存計算綜合供應比例
      // 市場庫存影響更大 (70%)，玩家資源影響較小 (30%)
      const combinedSupplyRatio = (marketSupplyRatio * 0.7) + (playerSupplyRatio * 0.3);

      // 根據供需關係調整價格
      // 資源越少，價格越高；資源越多，價格越低
      const supplyFactor = 1 - combinedSupplyRatio; // 0-1，資源越少，值越高

      // 加入隨機波動
      const randomFactor = 1 + (Math.random() * 2 - 1) * priceInfo.volatility;

      // 計算新價格
      const newPrice = priceInfo.basePrice * (0.5 + supplyFactor * 1.5) * randomFactor;

      // 更新價格
      priceInfo.currentPrice = Math.max(1, Math.round(newPrice));

      // 更新供應因子
      priceInfo.supply = combinedSupplyRatio;

      // 更新市場庫存信息
      priceInfo.marketInventory = marketInventoryInfo.amount;
      priceInfo.marketCapacity = marketInventoryInfo.maxCapacity;
    }

    console.log('市場價格已更新');
  }

  /**
   * 處理人口消費
   * @param {Object} resources - 資源系統引用
   * @param {Object} populationSystem - 人口系統引用
   */
  processPopulationConsumption(resources, populationSystem) {
    // 獲取人口統計
    const stats = populationSystem.getPopulationStats();
    const classHappinessImpacts = {}; // 存儲每個階層的幸福度影響
    let totalPopulation = stats.total;

    if (totalPopulation <= 0) return;

    // 計算每個階層的消費和幸福度影響
    for (const [className, classData] of Object.entries(stats.socialClasses)) {
      if (classData.count <= 0) continue;

      const classDemands = this.demands[className];
      if (!classDemands) continue;

      // 初始化這個階層的幸福度影響記錄
      classHappinessImpacts[className] = {
        totalImpact: 0,
        demandImpacts: {},
        population: classData.count
      };

      // 處理每種需求
      for (const [goodType, demandInfo] of Object.entries(classDemands)) {
        const resourceTypes = this.goodsToResources[goodType];
        if (!resourceTypes || resourceTypes.length === 0) continue;

        // 計算這個階層對這種商品的總需求量
        const totalDemand = demandInfo.demand * classData.count;

        // 嘗試從每種可用資源中消費
        let totalConsumed = 0;
        let totalCost = 0;

        for (const resourceType of resourceTypes) {
          const resourceObj = resources.resources[resourceType];
          const priceInfo = this.prices[resourceType];

          if (!resourceObj || !priceInfo) continue;

          // 計算可以消費的量
          const demandPerResource = totalDemand / resourceTypes.length;
          const availableAmount = Math.min(demandPerResource, resourceObj.value);

          if (availableAmount > 0) {
            // 消費資源
            resourceObj.value -= availableAmount;
            totalConsumed += availableAmount;

            // 計算成本
            totalCost += availableAmount * priceInfo.currentPrice;

            // 記錄交易
            this.recordTransaction(resourceType, -availableAmount, priceInfo.currentPrice);
          }
        }

        // 計算滿足率
        const satisfactionRate = totalDemand > 0 ? totalConsumed / totalDemand : 0;

        // 計算價格適宜度 (價格越高，適宜度越低)
        const averagePrice = totalConsumed > 0 ? totalCost / totalConsumed : demandInfo.basePrice;
        const priceRatio = demandInfo.basePrice / averagePrice;
        const priceAppropriatenessScore = Math.min(1, Math.max(0, priceRatio));

        // 計算這種商品對幸福度的影響
        // 滿足率高且價格合理，幸福度提高；反之則降低
        // 考慮需求的重要性
        const importanceFactor = demandInfo.importance || 0.2;
        const goodHappinessImpact = ((satisfactionRate * 0.7 + priceAppropriatenessScore * 0.3) * 2 - 1) * 20 * importanceFactor;

        // 記錄這種需求的幸福度影響
        classHappinessImpacts[className].demandImpacts[goodType] = {
          satisfactionRate,
          priceAppropriatenessScore,
          impact: goodHappinessImpact,
          importance: importanceFactor,
          displayName: demandInfo.displayName || goodType
        };

        // 累計階層幸福度影響
        classHappinessImpacts[className].totalImpact += goodHappinessImpact;

        console.log(`${className} 階層消費 ${demandInfo.displayName || goodType}: 滿足率=${satisfactionRate.toFixed(2)}, 價格適宜度=${priceAppropriatenessScore.toFixed(2)}, 重要性=${importanceFactor.toFixed(2)}, 幸福度影響=${goodHappinessImpact.toFixed(2)}`);
      }

      console.log(`${className} 階層總幸福度影響: ${classHappinessImpacts[className].totalImpact.toFixed(2)}`);
    }

    // 將市場消費對幸福度的影響傳遞給人口系統
    populationSystem.applyClassHappinessEffects(classHappinessImpacts);

    console.log(`市場消費處理完成，各階層幸福度影響已更新`);
  }

  /**
   * 記錄交易並更新市場庫存
   * @param {string} resourceType - 資源類型
   * @param {number} amount - 交易數量 (正為買入，負為賣出)
   * @param {number} price - 交易價格
   */
  recordTransaction(resourceType, amount, price) {
    this.transactionHistory.push({
      timestamp: Date.now(),
      resourceType,
      amount,
      price,
      total: Math.abs(amount) * price
    });

    // 限制歷史記錄長度
    if (this.transactionHistory.length > 100) {
      this.transactionHistory.shift();
    }

    // 更新市場庫存
    if (this.marketInventory[resourceType]) {
      // 負數表示消耗，所以市場庫存減少
      // 正數表示玩家出售，市場庫存增加
      this.marketInventory[resourceType].amount += amount;

      // 確保庫存不會超出限制
      this.marketInventory[resourceType].amount = Math.max(0, Math.min(
        this.marketInventory[resourceType].amount,
        this.marketInventory[resourceType].maxCapacity
      ));

      // 更新最後修改時間
      this.marketInventory[resourceType].lastUpdate = Date.now();
    }
  }

  /**
   * 獲取資源當前價格
   * @param {string} resourceType - 資源類型
   * @returns {number} - 當前價格
   */
  getResourcePrice(resourceType) {
    return this.prices[resourceType]?.currentPrice || 0;
  }

  /**
   * 玩家出售資源到市場
   * @param {string} resourceType - 資源類型
   * @param {number} amount - 出售數量
   * @param {Object} resources - 資源系統引用
   * @returns {Object} - 交易結果 {success, profit, message}
   */
  playerSellResource(resourceType, amount, resources) {
    // 檢查市場是否接受這種資源
    if (!this.prices[resourceType]) {
      return { success: false, profit: 0, message: '市場不接受這種資源' };
    }

    // 檢查市場庫存是否足夠
    const marketInventoryInfo = this.marketInventory[resourceType];
    if (!marketInventoryInfo) {
      return { success: false, profit: 0, message: '市場庫存信息不存在' };
    }

    // 檢查市場庫存是否足夠
    const remainingCapacity = marketInventoryInfo.maxCapacity - marketInventoryInfo.amount;
    if (remainingCapacity < amount) {
      return {
        success: false,
        profit: 0,
        message: '市場庫存空間不足',
        maxAmount: remainingCapacity
      };
    }

    // 使用calculateSellPrice方法計算單件價格
    const actualPrice = this.calculateSellPrice(resourceType, amount);

    // 如果價格計算失敗
    if (actualPrice <= 0) {
      return { success: false, profit: 0, message: '無法計算出售價格' };
    }

    // 計算利潤
    const profit = amount * actualPrice;

    // 嘗試從玩家資源中扣除
    const sellResult = resources.sellResourceToMarket(resourceType, amount, actualPrice);

    if (sellResult.success) {
      // 更新市場庫存和交易記錄
      this.recordTransaction(resourceType, amount, actualPrice);

      // 更新價格
      // 大量出售會降低市場價格
      const priceImpact = Math.min(0.2, (amount / marketInventoryInfo.maxCapacity) * 0.5);
      this.prices[resourceType].currentPrice = Math.max(
        1,
        Math.floor(this.prices[resourceType].currentPrice * (1 - priceImpact))
      );

      // 增加月度營業額
      this.monthlyRevenue += profit;

      return sellResult;
    } else {
      return sellResult;
    }
  }

  /**
   * 玩家從市場購買資源
   * @param {string} resourceType - 資源類型
   * @param {number} amount - 購買數量
   * @param {Object} resources - 資源系統引用
   * @param {number} playerGold - 玩家擁有的金幣
   * @returns {Object} - 交易結果 {success, cost, message, remainingGold}
   */
  playerBuyResource(resourceType, amount, resources, playerGold) {
    // 檢查市場是否有這種資源
    if (!this.prices[resourceType]) {
      return { success: false, cost: 0, message: '市場沒有這種資源' };
    }

    // 檢查市場庫存是否足夠
    const marketInventoryInfo = this.marketInventory[resourceType];
    if (!marketInventoryInfo) {
      return { success: false, cost: 0, message: '市場庫存信息不存在' };
    }

    // 檢查市場庫存是否足夠
    if (marketInventoryInfo.amount < amount) {
      return {
        success: false,
        cost: 0,
        message: '市場庫存不足',
        availableAmount: marketInventoryInfo.amount
      };
    }

    // 使用calculateBuyPrice方法計算單件價格
    const actualPrice = this.calculateBuyPrice(resourceType, amount);

    // 如果價格計算失敗
    if (actualPrice <= 0) {
      return { success: false, cost: 0, message: '無法計算購買價格' };
    }

    // 計算總成本
    const totalCost = amount * actualPrice;

    // 檢查玩家金幣是否足夠
    if (playerGold < totalCost) {
      return {
        success: false,
        cost: totalCost,
        message: '金幣不足',
        maxAffordableAmount: Math.floor(playerGold / actualPrice)
      };
    }

    // 檢查玩家資源容量是否足夠
    const resourceCap = resources.resourceCaps[resourceType] || Infinity;
    const currentAmount = resources.resources[resourceType]?.value || 0;
    const remainingCapacity = resourceCap - currentAmount;

    if (remainingCapacity < amount) {
      return {
        success: false,
        cost: 0,
        message: '資源容量不足',
        maxAmount: remainingCapacity
      };
    }

    // 減少市場庫存
    marketInventoryInfo.amount -= amount;

    // 增加玩家資源
    resources.resources[resourceType].value += amount;

    // 記錄交易
    this.recordTransaction(resourceType, -amount, actualPrice);

    // 更新價格
    // 大量購買會提高市場價格
    const priceImpact = Math.min(0.2, (amount / marketInventoryInfo.maxCapacity) * 0.5);
    this.prices[resourceType].currentPrice = Math.max(
      1,
      Math.ceil(this.prices[resourceType].currentPrice * (1 + priceImpact))
    );

    // 增加月度營業額
    this.monthlyRevenue += totalCost;

    // 返回交易結果
    return {
      success: true,
      cost: totalCost,
      message: `成功購買 ${amount} 個 ${resources.resources[resourceType].displayName || resourceType}`,
      remainingGold: playerGold - totalCost
    };
  }

  /**
   * 獲取市場統計信息
   * @returns {Object} - 市場統計
   */
  getMarketStats() {
    const stats = {
      prices: {},
      demands: this.demands,
      recentTransactions: this.transactionHistory.slice(-10),
      inventory: this.marketInventory
    };

    // 整理價格信息
    for (const [resource, priceInfo] of Object.entries(this.prices)) {
      stats.prices[resource] = {
        currentPrice: priceInfo.currentPrice,
        basePrice: priceInfo.basePrice,
        priceRatio: priceInfo.currentPrice / priceInfo.basePrice,
        supply: priceInfo.supply,
        marketInventory: this.marketInventory[resource]?.amount || 0,
        marketCapacity: this.marketInventory[resource]?.maxCapacity || 1000
      };
    }

    return stats;
  }

  /**
   * 獲取特定階層的需求信息
   * @param {string} socialClass - 社會階層
   * @returns {Object} - 需求信息
   */
  getClassDemands(socialClass) {
    return this.demands[socialClass] || {};
  }

  /**
   * 處理月度稅收
   */
  processMonthlyTax() {
    // 計算稅收
    const taxAmount = Math.floor(this.monthlyRevenue * this.taxRate);

    // 重置月度營業額
    const oldRevenue = this.monthlyRevenue;
    this.monthlyRevenue = 0;

    // 觸發稅收事件
    if (window.game && window.game.scene.scenes.length > 0) {
      const gameScene = window.game.scene.scenes.find(scene => scene.key === 'GameScene');
      if (gameScene && taxAmount > 0) {
        gameScene.events.emit('taxCollected', taxAmount, oldRevenue);
      }
    }

    // 記錄稅收信息
    if (taxAmount > 0) {
      console.log(`月度稅收處理完成，營業額: ${oldRevenue}，稅收: ${taxAmount}`);

      // 如果有調試工具，記錄日誌
      if (window.DebugUtils && window.DebugUtils.log) {
        window.DebugUtils.log(`月度稅收: ${taxAmount} 金幣 (營業額: ${oldRevenue})`, 'ECONOMY');
      }
    }

    return taxAmount;
  }

  /**
   * 獲取當前月度稅收信息
   * @returns {Object} - 稅收信息
   */
  getTaxInfo() {
    // 獲取遊戲場景和時間系統
    let daysUntilNextMonth = 30; // 預設值
    let currentMonth = 0;

    if (window.game && window.game.scene.scenes.length > 0) {
      const gameScene = window.game.scene.scenes.find(scene => scene.key === 'GameScene');
      if (gameScene && gameScene.timeSystem) {
        const timeSystem = gameScene.timeSystem;
        currentMonth = timeSystem.month;
        daysUntilNextMonth = timeSystem.daysPerMonth - timeSystem.day + 1;
      }
    }

    return {
      monthlyRevenue: this.monthlyRevenue,
      taxRate: this.taxRate,
      estimatedTax: Math.floor(this.monthlyRevenue * this.taxRate),
      currentMonth: currentMonth,
      daysUntilNextMonth: daysUntilNextMonth
    };
  }

  /**
   * 計算購買資源的總價格
   * @param {string} resourceType - 資源類型
   * @param {number} amount - 購買數量
   * @returns {number} - 單件價格
   */
  calculateBuyPrice(resourceType, amount) {
    // 檢查市場是否有這種資源
    if (!this.prices[resourceType]) {
      return 0;
    }

    // 檢查市場庫存是否足夠
    const marketInventoryInfo = this.marketInventory[resourceType];
    if (!marketInventoryInfo || marketInventoryInfo.amount < amount) {
      return 0;
    }

    // 獲取當前價格
    const currentPrice = this.getResourcePrice(resourceType);

    // 計算實際交易價格 (根據數量調整價格)
    // 大量購買會提高價格
    const priceAdjustment = Math.min(1.3, 1 + (amount / 1000) * 0.3); // 最多提高30%
    const actualPrice = Math.ceil(currentPrice * priceAdjustment);



    return actualPrice;
  }

  /**
   * 計算出售資源的單件價格
   * @param {string} resourceType - 資源類型
   * @param {number} amount - 出售數量
   * @returns {number} - 單件價格
   */
  calculateSellPrice(resourceType, amount) {
    // 檢查市場是否接受這種資源
    if (!this.prices[resourceType]) {
      return 0;
    }

    // 檢查市場庫存是否有足夠空間
    const marketInventoryInfo = this.marketInventory[resourceType];
    if (!marketInventoryInfo) {
      return 0;
    }

    const remainingCapacity = marketInventoryInfo.maxCapacity - marketInventoryInfo.amount;
    if (remainingCapacity < amount) {
      return 0;
    }

    // 獲取當前價格
    const currentPrice = this.getResourcePrice(resourceType);

    // 計算實際交易價格 (根據數量調整價格)
    // 大量出售會降低價格
    const priceAdjustment = Math.max(0.7, 1 - (amount / 1000) * 0.3); // 最多降低30%
    const actualPrice = Math.floor(currentPrice * priceAdjustment);

    return actualPrice;
  }

  /**
   * 購買資源值服務
   * @param {string} resourceValueType - 資源值類型 (happiness, transport, security, health)
   * @param {number} amount - 購買數量
   * @param {number} playerGold - 玩家擁有的金幣
   * @returns {Object} - 交易結果
   */
  buyResourceValue(resourceValueType, amount, playerGold) {
    // 檢查是否為有效的資源值類型
    if (!this.resourceValuePrices[resourceValueType]) {
      return { success: false, cost: 0, message: '無效的資源值類型' };
    }

    // 檢查市場庫存是否足夠
    const marketInventoryInfo = this.marketInventory[resourceValueType];
    if (!marketInventoryInfo || marketInventoryInfo.amount < amount) {
      return {
        success: false,
        cost: 0,
        message: '市場服務容量不足',
        availableAmount: marketInventoryInfo?.amount || 0
      };
    }

    // 計算價格
    const priceInfo = this.resourceValuePrices[resourceValueType];
    const unitPrice = priceInfo.currentPrice;
    const totalCost = amount * unitPrice;

    // 檢查玩家金幣是否足夠
    if (playerGold < totalCost) {
      return {
        success: false,
        cost: totalCost,
        message: '金幣不足',
        maxAffordableAmount: Math.floor(playerGold / unitPrice)
      };
    }

    // 執行交易
    marketInventoryInfo.amount -= amount;
    marketInventoryInfo.lastUpdate = Date.now();

    // 記錄交易
    this.recordTransaction(`rv_${resourceValueType}`, -amount, unitPrice);

    // 更新價格 (購買會提高價格)
    const priceImpact = Math.min(0.15, (amount / marketInventoryInfo.maxCapacity) * 0.3);
    priceInfo.currentPrice = Math.ceil(priceInfo.currentPrice * (1 + priceImpact));

    // 增加月度營業額
    this.monthlyRevenue += totalCost;

    return {
      success: true,
      cost: totalCost,
      unitPrice: unitPrice,
      message: `成功購買 ${amount} 點${this.getResourceValueDisplayName(resourceValueType)}服務`
    };
  }

  /**
   * 出售資源值服務 (通常由玩家的建築提供)
   * @param {string} resourceValueType - 資源值類型
   * @param {number} amount - 出售數量
   * @returns {Object} - 交易結果
   */
  sellResourceValue(resourceValueType, amount) {
    // 檢查是否為有效的資源值類型
    if (!this.resourceValuePrices[resourceValueType]) {
      return { success: false, profit: 0, message: '無效的資源值類型' };
    }

    // 檢查市場庫存空間是否足夠
    const marketInventoryInfo = this.marketInventory[resourceValueType];
    if (!marketInventoryInfo) {
      return { success: false, profit: 0, message: '市場庫存信息不存在' };
    }

    const remainingCapacity = marketInventoryInfo.maxCapacity - marketInventoryInfo.amount;
    if (remainingCapacity < amount) {
      return {
        success: false,
        profit: 0,
        message: '市場容量不足',
        maxAmount: remainingCapacity
      };
    }

    // 計算價格 (出售價格通常低於購買價格)
    const priceInfo = this.resourceValuePrices[resourceValueType];
    const sellPriceModifier = 0.8; // 出售價格為市場價格的80%
    const unitPrice = Math.floor(priceInfo.currentPrice * sellPriceModifier);
    const totalProfit = amount * unitPrice;

    // 執行交易
    marketInventoryInfo.amount += amount;
    marketInventoryInfo.lastUpdate = Date.now();

    // 記錄交易
    this.recordTransaction(`rv_${resourceValueType}`, amount, unitPrice);

    // 更新價格 (出售會降低價格)
    const priceImpact = Math.min(0.1, (amount / marketInventoryInfo.maxCapacity) * 0.2);
    priceInfo.currentPrice = Math.max(1, Math.floor(priceInfo.currentPrice * (1 - priceImpact)));

    return {
      success: true,
      profit: totalProfit,
      unitPrice: unitPrice,
      message: `成功出售 ${amount} 點${this.getResourceValueDisplayName(resourceValueType)}服務，獲得 ${totalProfit} 金幣`
    };
  }

  /**
   * 獲取資源值的顯示名稱
   * @param {string} resourceValueType - 資源值類型
   * @returns {string} - 顯示名稱
   */
  getResourceValueDisplayName(resourceValueType) {
    const displayNames = {
      happiness: '快樂度',
      transport: '運力',
      security: '安保力',
      health: '健康度'
    };
    return displayNames[resourceValueType] || resourceValueType;
  }

  /**
   * 獲取資源值當前價格
   * @param {string} resourceValueType - 資源值類型
   * @returns {number} - 當前價格
   */
  getResourceValuePrice(resourceValueType) {
    return this.resourceValuePrices[resourceValueType]?.currentPrice || 0;
  }

  /**
   * 獲取完整的市場統計信息（包含資源值）
   * @returns {Object} - 擴展的市場統計
   */
  getExtendedMarketStats() {
    const basicStats = this.getMarketStats();

    // 添加資源值價格信息
    basicStats.resourceValuePrices = {};
    for (const [resourceValueType, priceInfo] of Object.entries(this.resourceValuePrices)) {
      basicStats.resourceValuePrices[resourceValueType] = {
        currentPrice: priceInfo.currentPrice,
        basePrice: priceInfo.basePrice,
        inflationAdjustedPrice: priceInfo.inflationAdjustedPrice,
        priceRatio: priceInfo.currentPrice / priceInfo.basePrice,
        marketInventory: this.marketInventory[resourceValueType]?.amount || 0,
        marketCapacity: this.marketInventory[resourceValueType]?.maxCapacity || 200,
        displayName: this.getResourceValueDisplayName(resourceValueType)
      };
    }

    // 添加通脹率信息
    basicStats.inflationRate = this.inflationRate;
    basicStats.inflationHistory = this.inflationHistory;

    // 添加本地事件信息
    basicStats.localEvents = {
      active: this.localEvents.active,
      priceModifiers: this.localEvents.priceModifiers
    };

    return basicStats;
  }
}
