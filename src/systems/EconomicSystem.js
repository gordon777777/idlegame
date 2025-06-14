/**
 * 经济系统 - 管理新的中世纪经济模型
 */
class EconomicSystem {
  constructor(resourceSystem, populationSystem, marketSystem) {
    this.resourceSystem = resourceSystem;
    this.populationSystem = populationSystem;
    this.marketSystem = marketSystem;
    
    // 货币系统
    this.currency = {
      copper: 1000,  // 铜币
      silver: 10,    // 银币 (1银币 = 100铜币)
      gold: 1        // 金币 (1金币 = 100银币 = 10000铜币)
    };
    
    // 基准价格 (以铜币为单位)
    this.basePrices = {
      wheat: 1,
      bread: 5,
      iron_ore: 2,
      iron_pickaxe: 20,
      wood: 1,
      axe: 15,
      meat: 4,
      fish: 3,
      flour: 2,
      plow: 50
    };
    
    // 供需系统
    this.supplyDemand = {};
    this.initializeSupplyDemand();
    
    // 税收系统
    this.taxRates = {
      land: 0.1,      // 土地税 10%
      trade: 0.05,    // 商业税 5%
      head: 2         // 人头税 2铜币/人
    };
    
    // 天气和灾害系统
    this.weather = {
      current: 'normal',
      effects: {
        normal: { productionModifier: 1.0 },
        rain: { productionModifier: 0.7 },
        drought: { productionModifier: 0.5 }
      }
    };
    
    // 人口满意度系统
    this.satisfaction = {
      overall: 60,
      factors: {
        food: 0,
        housing: 0,
        employment: 0,
        taxes: 0,
        health: 0
      }
    };
    
    // 移民吸引力
    this.immigrationAttraction = 0;
    
    // 事件系统
    this.events = [];
    this.eventTimer = 0;
    
    // 工人职业系统
    this.professions = {
      farmer: { 
        dailyWage: 3, 
        survivalNeed: 1, 
        productivity: 100,
        description: "农民：种植小麦，基础生产力"
      },
      miner: { 
        dailyWage: 4, 
        survivalNeed: 1, 
        productivity: 20,
        description: "矿工：开采铁矿，需要工具"
      },
      lumberjack: { 
        dailyWage: 3.5, 
        survivalNeed: 1, 
        productivity: 50,
        description: "伐木工：砍伐木材，需要斧头"
      },
      hunter: { 
        dailyWage: 4, 
        survivalNeed: 1, 
        productivity: 5,
        description: "猎人：狩猎肉类，需要猎犬"
      },
      fisherman: { 
        dailyWage: 3.5, 
        survivalNeed: 1, 
        productivity: 15,
        description: "渔民：捕捞鱼类，需要渔船"
      },
      worker: { 
        dailyWage: 3.5, 
        survivalNeed: 1, 
        productivity: 1,
        description: "普通工人：通用劳动力"
      },
      baker: { 
        dailyWage: 4, 
        survivalNeed: 1, 
        productivity: 2,
        description: "面包师：制作面包"
      },
      blacksmith: { 
        dailyWage: 5, 
        survivalNeed: 1, 
        productivity: 1,
        description: "铁匠：制作工具和武器"
      },
      carpenter: { 
        dailyWage: 4, 
        survivalNeed: 1, 
        productivity: 1,
        description: "木匠：制作木制品"
      }
    };
  }
  
  /**
   * 初始化供需系统
   */
  initializeSupplyDemand() {
    Object.keys(this.basePrices).forEach(resource => {
      this.supplyDemand[resource] = {
        supply: 100,
        demand: 100,
        currentPrice: this.basePrices[resource],
        priceHistory: []
      };
    });
  }
  
  /**
   * 更新经济系统
   */
  update(time, delta) {
    // 更新供需价格
    this.updatePrices();
    
    // 更新人口满意度
    this.updateSatisfaction();
    
    // 更新移民吸引力
    this.updateImmigrationAttraction();
    
    // 处理随机事件
    this.handleRandomEvents(time, delta);
    
    // 收取税收
    this.collectTaxes();
    
    // 支付工人薪酬
    this.payWorkerWages();
  }
  
  /**
   * 更新价格系统
   */
  updatePrices() {
    Object.keys(this.supplyDemand).forEach(resource => {
      const data = this.supplyDemand[resource];
      const resourceObj = this.resourceSystem.resources[resource];
      
      if (resourceObj) {
        // 计算供需比例
        const supply = resourceObj.value;
        const demand = this.calculateDemand(resource);
        
        // 价格 = 基准价 × (1 + 供需差率)
        const supplyDemandRatio = (demand - supply) / Math.max(supply, 1);
        const priceModifier = Math.max(0.5, Math.min(2.0, 1 + supplyDemandRatio * 0.5));
        
        data.currentPrice = Math.ceil(this.basePrices[resource] * priceModifier);
        data.priceHistory.push(data.currentPrice);
        
        // 保持价格历史记录在合理范围内
        if (data.priceHistory.length > 100) {
          data.priceHistory.shift();
        }
      }
    });
  }
  
  /**
   * 计算资源需求
   */
  calculateDemand(resource) {
    // 基础需求基于人口数量
    const population = this.populationSystem.totalPopulation;
    let demand = 0;
    
    switch(resource) {
      case 'wheat':
      case 'bread':
        demand = population * 1.5; // 每人每天需要1.5份食物
        break;
      case 'iron_ore':
      case 'wood':
        demand = population * 0.1; // 建设需求
        break;
      default:
        demand = population * 0.05;
    }
    
    return demand;
  }
  
  /**
   * 更新人口满意度
   */
  updateSatisfaction() {
    const factors = this.satisfaction.factors;
    
    // 食物满意度
    const foodSupply = this.resourceSystem.resources.wheat?.value || 0;
    const foodDemand = this.populationSystem.totalPopulation * 1.5;
    factors.food = Math.min(100, (foodSupply / foodDemand) * 50);
    
    // 就业满意度
    const unemploymentRate = this.populationSystem.getUnemploymentRate();
    factors.employment = Math.max(0, 100 - unemploymentRate * 2);
    
    // 税收满意度 (税收越高满意度越低)
    factors.taxes = Math.max(0, 100 - this.getTotalTaxBurden() * 100);
    
    // 健康满意度
    factors.health = this.populationSystem.healthLevel || 70;
    
    // 计算总体满意度
    this.satisfaction.overall = Object.values(factors).reduce((sum, val) => sum + val, 0) / Object.keys(factors).length;
  }
  
  /**
   * 更新移民吸引力
   */
  updateImmigrationAttraction() {
    let attraction = 0;
    
    // 基于满意度
    if (this.satisfaction.overall > 80) {
      attraction += 20;
    } else if (this.satisfaction.overall > 60) {
      attraction += 15;
    }
    
    // 基于就业机会
    const unemploymentRate = this.populationSystem.getUnemploymentRate();
    if (unemploymentRate < 10) {
      attraction += 30; // 工作职位比人口多
    } else if (unemploymentRate > 30) {
      attraction -= 60; // 失业率过高
    }
    
    this.immigrationAttraction = Math.max(-60, Math.min(30, attraction));
  }
  
  /**
   * 处理随机事件
   */
  handleRandomEvents(time, delta) {
    this.eventTimer += delta;
    
    // 每30秒检查一次随机事件
    if (this.eventTimer >= 30000) {
      this.eventTimer = 0;
      
      if (Math.random() < 0.1) { // 10%概率发生事件
        this.triggerRandomEvent();
      }
    }
  }
  
  /**
   * 触发随机事件
   */
  triggerRandomEvent() {
    const events = [
      {
        type: 'weather',
        name: '雨季',
        description: '雨季来临，农作物减产30%',
        effect: () => {
          this.weather.current = 'rain';
          setTimeout(() => { this.weather.current = 'normal'; }, 60000); // 1分钟后恢复
        }
      },
      {
        type: 'weather',
        name: '旱灾',
        description: '干旱来临，农作物减产50%',
        effect: () => {
          this.weather.current = 'drought';
          setTimeout(() => { this.weather.current = 'normal'; }, 90000); // 1.5分钟后恢复
        }
      },
      {
        type: 'economic',
        name: '商路阻断',
        description: '商路被阻断，奢侈品价格上涨300%',
        effect: () => {
          ['wine', 'spice', 'salt'].forEach(resource => {
            if (this.supplyDemand[resource]) {
              this.supplyDemand[resource].currentPrice *= 4;
            }
          });
        }
      }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    
    // 通知UI系统
    if (window.game && window.game.scene.scenes.length > 0) {
      const gameScene = window.game.scene.scenes.find(scene => scene.key === 'GameScene');
      if (gameScene) {
        gameScene.events.emit('randomEvent', event);
      }
    }
  }
  
  /**
   * 收取税收
   */
  collectTaxes() {
    // 这里可以实现税收收取逻辑
    const population = this.populationSystem.totalPopulation;
    const headTax = population * this.taxRates.head;
    
    this.currency.copper += headTax;
  }
  
  /**
   * 支付工人薪酬
   */
  payWorkerWages() {
    // 这里可以实现工人薪酬支付逻辑
    // 需要与建筑系统集成
  }
  
  /**
   * 获取总税收负担
   */
  getTotalTaxBurden() {
    return this.taxRates.land + this.taxRates.trade + (this.taxRates.head / 100);
  }
  
  /**
   * 获取当前价格
   */
  getPrice(resource) {
    return this.supplyDemand[resource]?.currentPrice || this.basePrices[resource] || 1;
  }
  
  /**
   * 获取天气效果
   */
  getWeatherEffect() {
    return this.weather.effects[this.weather.current];
  }
  
  /**
   * 获取人口满意度
   */
  getSatisfaction() {
    return this.satisfaction.overall;
  }
  
  /**
   * 获取移民吸引力
   */
  getImmigrationAttraction() {
    return this.immigrationAttraction;
  }
}

export default EconomicSystem;
