import Building from '../entities/Building';

/**
 * System for managing buildings in the game
 */
export default class BuildingSystem {
  /**
   * @param {Phaser.Scene} scene - The scene this system belongs to
   * @param {ResourceSystem} resourceSystem - Reference to the resource system
   * @param {PopulationSystem} populationSystem - Reference to the population system
   * @param {Object} buildingTypes - Optional building types data from DataManager
   */
  constructor(scene, resourceSystem, populationSystem = null, buildingTypes = null) {
    this.scene = scene;
    this.resourceSystem = resourceSystem;
    this.populationSystem = populationSystem;
    this.buildings = new Map();
    this.buildingTypes = buildingTypes || this.defineBuildingTypes();
    this.selectedBuilding = null;
    this.placementMode = false;
    this.placementGhost = null;
    this.gridSize = 64; // Size of placement grid
  }

  /**
   * Define all available building types
   * @returns {Object} - Map of building types
   */
  defineBuildingTypes() {
    return {
      // Basic resource producers
      magic_forge: {
        name: 'Magic Forge',
        type: 'production',
        sprite: 'magic_forge',
        recipe: {
          input: { magic_ore: 2 },
          output: { arcane_essence: 1 }
        },
        productionInterval: 3000,
        cost: { magic_ore: 20, enchanted_wood: 10 },
        description: '將原始魔法礦石轉化為奧術精華。'
      },

      wood_enchanter: {
        name: 'Wood Enchanter',
        type: 'production',
        sprite: 'wood_enchanter',
        recipe: {
          input: { enchanted_wood: 3 },
          output: { mystic_planks: 1 }
        },
        byproductTypes: [
          {
            id: 'none',
            name: '无副产品',
            description: '不生产副产品，专注于主要产出。',
            resources: {}
          },
          {
            id: 'magic_ore',
            name: '魔法矿石',
            description: '在加工过程中提取魔法矿石。',
            resources: { magic_ore: 1 }
          },
          {
            id: 'wood_chips',
            name: '木屑',
            description: '收集加工过程中产生的木屑，可用于制作低级物品。',
            resources: { wood_chips: 3 }
          }
        ],
        productionInterval: 4000,
        cost: { enchanted_wood: 25, arcane_crystal: 5 },
        description: '將附魔木材加工成神秘木板。',
        workerRequirement: { count: 10, type: 'worker' },
        productionMethods: [
          {
            id: 'manual',
            name: '徒手工作',
            description: '工人徒手加工木材，正常产出。',
            timeModifier: 1.0,
            enableByproducts: false,
            workerRequirement: { count: 10, type: 'worker' }
          },
          {
            id: 'tools',
            name: '工具辅助',
            description: '使用工具加工木材，提高产出但需要额外资源。',
            timeModifier: 0.6,  // 生产时间缩短40%
            inputModifiers: { enchanted_wood: 1.0, magic_ore: 1 },  // 额外需要1个魔法矿石
            outputModifiers: { mystic_planks: 2.5 },  // 产出增加到250%
            enableByproducts: true,  // 启用副产品
            workerRequirement: { count: 4, type: 'worker' }  // 只需要40%的工人
          }
        ]
      },

      crystal_refinery: {
        name: 'Crystal Refinery',
        type: 'production',
        sprite: 'crystal_refinery',
        recipe: {
          input: { arcane_crystal: 2 },
          output: { refined_crystal: 1 }
        },
        byproductTypes: [
          {
            id: 'none',
            name: '无副产品',
            description: '不生产副产品，专注于主要产出。',
            resources: {}
          },
          {
            id: 'magic_ore',
            name: '魔法矿石',
            description: '在提炼过程中提取魔法矿石。',
            resources: { magic_ore: 1 }
          },
          {
            id: 'crystal_dust',
            name: '水晶粉尘',
            description: '收集提炼过程中产生的水晶粉尘，可用于制作魔法物品。',
            resources: { crystal_dust: 2 }
          }
        ],
        productionInterval: 5000,
        cost: { arcane_crystal: 15, magic_ore: 10 },
        description: '將原始奧術水晶提煉成純淨形態。',
        workerRequirement: { count: 8, type: 'worker' },
        productionMethods: [
          {
            id: 'basic',
            name: '基础提炼',
            description: '基础的水晶提炼方法，正常产出。',
            timeModifier: 1.0,
            enableByproducts: false,
            workerRequirement: { count: 8, type: 'worker' }
          },
          {
            id: 'advanced',
            name: '高级提炼',
            description: '使用魔力辅助提炼，提高产出但需要额外资源。',
            timeModifier: 0.7,  // 生产时间缩短30%
            inputModifiers: { arcane_crystal: 1.0, mana: 2 },  // 额外需要2个魔力
            outputModifiers: { refined_crystal: 2.0 },  // 产出增加到200%
            enableByproducts: true,  // 启用副产品
            workerRequirement: { count: 6, type: 'worker' }  // 只需要75%的工人
          }
        ]
      },

      // Intermediate producers
      alchemy_lab: {
        name: 'Alchemy Lab',
        type: 'production',
        sprite: 'alchemy_lab',
        recipe: {
          input: { arcane_essence: 2, refined_crystal: 1 },
          output: { magical_potion: 1 }
        },
        productionInterval: 8000,
        cost: { arcane_essence: 15, refined_crystal: 10, mystic_planks: 5 },
        description: '使用精華和水晶製作魔法藥水。'
      },

      enchanting_tower: {
        name: 'Enchanting Tower',
        type: 'production',
        sprite: 'enchanting_tower',
        recipe: {
          input: { mystic_planks: 2, refined_crystal: 1 },
          output: { enchanted_artifact: 1 }
        },
        productionInterval: 10000,
        cost: { mystic_planks: 20, refined_crystal: 10, arcane_essence: 5 },
        description: '使用神秘材料創造附魔神器。'
      },

      // Advanced producers
      arcane_workshop: {
        name: 'Arcane Workshop',
        type: 'production',
        sprite: 'arcane_workshop',
        recipe: {
          input: { magical_potion: 1, enchanted_artifact: 1 },
          output: { magical_construct: 1 }
        },
        productionInterval: 15000,
        cost: { magical_potion: 10, enchanted_artifact: 10, refined_crystal: 20 },
        description: '使用藥水和神器創造魔法構造體。'
      },

      // Resource collectors
      magic_mine: {
        name: 'Magic Mine',
        type: 'collector',
        sprite: 'magic_mine',
        recipe: {
          input: {},
          output: { magic_ore: 1 }
        },
        byproductTypes: [
          {
            id: 'none',
            name: '无副产品',
            description: '不生产副产品，专注于主要产出。',
            resources: {}
          },
          {
            id: 'arcane_crystal',
            name: '奥术水晶',
            description: '在开采过程中有小概率发现奥术水晶。',
            resources: { arcane_crystal: 0.2 }
          },
          {
            id: 'stone',
            name: '石头',
            description: '开采过程中产生大量的普通石头。',
            resources: { stone: 3 }
          }
        ],
        productionInterval: 2000,
        cost: { enchanted_wood: 15 },
        description: '從地下開採魔法礦石。',
        workerRequirement: { count: 5, type: 'worker' },
        productionMethods: [
          {
            id: 'manual_mining',
            name: '人工开采',
            description: '工人手工开采矿石，正常产出。',
            timeModifier: 1.0,
            enableByproducts: false,
            workerRequirement: { count: 5, type: 'worker' }
          },
          {
            id: 'magic_mining',
            name: '魔力开采',
            description: '使用魔力辅助开采，提高产出并有机会获得副产品。',
            timeModifier: 0.8,  // 生产时间缩短20%
            inputModifiers: { mana: 1 },  // 需要1个魔力
            outputModifiers: { magic_ore: 1.5 },  // 产出增加到150%
            enableByproducts: true,  // 启用副产品
            workerRequirement: { count: 3, type: 'worker' }  // 只需要60%的工人
          }
        ]
      },

      enchanted_forest: {
        name: 'Enchanted Forest',
        type: 'collector',
        sprite: 'enchanted_forest',
        recipe: {
          input: {},
          output: { enchanted_wood: 1 }
        },
        productionInterval: 2000,
        cost: { magic_ore: 15 },
        description: '種植並收穫附魔木材。'
      },

      crystal_mine: {
        name: 'Crystal Mine',
        type: 'collector',
        sprite: 'crystal_mine',
        recipe: {
          input: {},
          output: { arcane_crystal: 1 }
        },
        productionInterval: 3000,
        cost: { magic_ore: 10, enchanted_wood: 10 },
        description: '從深層地下開採奧術水晶。'
      },

      // 新增建築 - 資源收集器
      mana_well: {
        name: 'Mana Well',
        type: 'collector',
        sprite: 'mana_well',
        recipe: {
          input: {},
          output: { mana: 1 }
        },
        productionInterval: 1500,
        cost: { magic_ore: 5, arcane_crystal: 5 },
        description: '從地下抽取魔力能量。'
      },

      mystic_garden: {
        name: 'Mystic Garden',
        type: 'collector',
        sprite: 'mystic_garden',
        recipe: {
          input: { mana: 1 },
          output: { enchanted_wood: 2 }
        },
        productionInterval: 4000,
        cost: { enchanted_wood: 20, mana: 10 },
        description: '使用魔力加速生長附魔植物。'
      },

      crystal_garden: {
        name: 'Crystal Garden',
        type: 'collector',
        sprite: 'crystal_garden',
        recipe: {
          input: { mana: 1 },
          output: { arcane_crystal: 2 }
        },
        productionInterval: 5000,
        cost: { arcane_crystal: 20, mana: 15 },
        description: '使用魔力培養奧術水晶。'
      },

      // 新增建築 - 特殊建築
      wizard_tower: {
        name: 'Wizard Tower',
        type: 'special',
        sprite: 'wizard_tower',
        recipe: {
          input: { mana: 2 },
          output: { research_point: 1 }
        },
        productionInterval: 10000,
        cost: { arcane_essence: 30, refined_crystal: 20, mystic_planks: 25 },
        description: '產生研究點數，用於解鎖新技術。'
      },

      arcane_library: {
        name: 'Arcane Library',
        type: 'special',
        sprite: 'arcane_library',
        recipe: {
          input: { research_point: 1 },
          output: { knowledge: 1 }
        },
        productionInterval: 15000,
        cost: { mystic_planks: 40, enchanted_artifact: 5 },
        description: '將研究點數轉化為知識，提高所有建築效率。'
      },

      mana_fountain: {
        name: 'Mana Fountain',
        type: 'special',
        sprite: 'mana_fountain',
        recipe: {
          input: { arcane_essence: 1, refined_crystal: 1 },
          output: { mana: 5 }
        },
        productionInterval: 6000,
        cost: { arcane_essence: 25, refined_crystal: 25 },
        description: '將奧術精華和精煉水晶轉化為大量魔力。'
      },

      // 新增建築 - 高級建築
      magic_academy: {
        name: 'Magic Academy',
        type: 'advanced',
        sprite: 'magic_academy',
        recipe: {
          input: { knowledge: 1, mana: 5 },
          output: { wizard: 1 }
        },
        productionInterval: 30000,
        cost: { knowledge: 10, magical_potion: 20, enchanted_artifact: 15 },
        description: '訓練法師，提高城市的魔法產出。'
      },

      research_lab: {
        name: 'Research Lab',
        type: 'advanced',
        sprite: 'research_lab',
        recipe: {
          input: { knowledge: 2, magical_potion: 1 },
          output: { research_point: 5 }
        },
        productionInterval: 20000,
        cost: { knowledge: 15, magical_potion: 25, refined_crystal: 30 },
        description: '進行高級魔法研究，產生大量研究點數。'
      },

      storage_vault: {
        name: 'Storage Vault',
        type: 'utility',
        sprite: 'storage_vault',
        recipe: {
          input: {},
          output: {}
        },
        productionInterval: 0,
        cost: { mystic_planks: 30, refined_crystal: 20, arcane_essence: 15 },
        description: '增加資源存儲上限，防止資源浪費。'
      },

      // 住房建築
      housing_district: {
        name: 'Housing District',
        type: 'housing',
        sprite: 'housing_district',
        recipe: {
          input: {},
          output: {}
        },
        productionInterval: 0,
        cost: { enchanted_wood: 20, magic_ore: 10 },
        housingCapacity: 10,
        description: '為普通居民提供住所，增加人口上限。'
      },

      wizard_quarters: {
        name: 'Wizard Quarters',
        type: 'housing',
        sprite: 'wizard_quarters',
        recipe: {
          input: {},
          output: {}
        },
        productionInterval: 0,
        cost: { mystic_planks: 30, refined_crystal: 15, magical_potion: 5 },
        housingCapacity: 5,
        specialHousing: 'wizard',
        description: '為法師提供特別的住所，提高法師的效率。'
      },

      basic_house: {
        name: '平房',
        type: 'housing',
        sprite: 'basic_house',
        recipe: {
          input: {},
          output: {}
        },
        productionInterval: 0,
        cost: { enchanted_wood: 10, stone: 15 },
        housingCapacity: 5,
        description: '簡單的平房，提供基本居住空間。性價比高但佔地較大。'
      }
    };
  }

  /**
   * Create a new building
   * @param {string} type - Building type key
   * @param {Object} position - {x, y} position in the game world
   * @returns {Building|null} - The created building or null if failed
   */
  createBuilding(type, position) {
    const buildingType = this.buildingTypes[type];
    if (!buildingType) return null;

    // Check if we have enough resources to build
    if (!this.resourceSystem.hasResources(buildingType.cost)) {
      console.log('Not enough resources to build', buildingType.name);
      return null;
    }

    // Consume resources
    this.resourceSystem.consumeResources(buildingType.cost);

    // 获取默认定义中的建筑类型数据（如果存在）
    const defaultBuildingType = this.defineBuildingTypes()[type];

    // 合并 JSON 数据和默认数据，确保关键属性存在
    const mergedBuildingType = {
      ...buildingType,
      // 如果 JSON 中没有这些属性，则使用默认定义中的属性
      byproductTypes: buildingType.byproductTypes || (defaultBuildingType?.byproductTypes || []),
      productionMethods: buildingType.productionMethods || (defaultBuildingType?.productionMethods || []),
      workModes: buildingType.workModes || (defaultBuildingType?.workModes || []),
      id: `${type}_${Date.now()}`,
      position
    };

    // 打印调试信息
    console.log(`Creating building ${type} with:`, {
      hasJsonByproducts: !!buildingType.byproductTypes,
      hasJsonProductionMethods: !!buildingType.productionMethods,
      hasJsonWorkModes: !!buildingType.workModes,
      hasDefaultByproducts: !!(defaultBuildingType?.byproductTypes),
      hasDefaultProductionMethods: !!(defaultBuildingType?.productionMethods),
      hasDefaultWorkModes: !!(defaultBuildingType?.workModes),
      finalByproductsCount: mergedBuildingType.byproductTypes.length,
      finalProductionMethodsCount: mergedBuildingType.productionMethods.length,
      finalWorkModesCount: mergedBuildingType.workModes.length
    });

    // Create the building
    const building = new Building(mergedBuildingType, this.scene);

    // Add to building collection
    this.buildings.set(building.id, building);

    // 處理特殊建築類型
    if (buildingType.type === 'housing' && this.populationSystem) {
      // 增加住房容量
      this.populationSystem.increaseHousingCapacity(buildingType.housingCapacity || 0);
      console.log(`Housing building ${buildingType.name} created, added ${buildingType.housingCapacity || 0} housing capacity`);
    } else if (buildingType.type === 'adventurer_guild') {
      // 處理特殊功能建築
      console.log(`adventurer building ${buildingType.name} (${type}) created with special function: ${buildingType.specialFunction || 'none'}`);

      // 處理工人分配
      this.handleSpecialBuildingWorkers(building, buildingType, type);

      // 特殊建築通常不需要註冊生產鏈，除非有特殊產出
      if (buildingType.recipe && (buildingType.recipe.output && Object.keys(buildingType.recipe.output).length > 0)) {
        this.resourceSystem.addProductionChain(building);
        console.log(`Special building ${buildingType.name} registered production chain`);
      }

      // 處理特定特殊建築的邏輯
      this.handleSpecificSpecialBuilding(building, type);
    } else {
      // 處理生產建築
      if (this.populationSystem) {
        const hasWorkers = this.populationSystem.assignWorkersToBulding(building.id, type);
        if (!hasWorkers) {
          // 如果沒有足夠的工人，建築將處於非活動狀態
          building.isActive = false;
          console.log(`Production building ${buildingType.name} created but inactive due to insufficient workers`);
        } else {
          building.isActive = true;
          console.log(`Production building ${buildingType.name} is active with workers assigned`);
        }
      }

      // Register production chain with resource system
      this.resourceSystem.addProductionChain(building);
      console.log(`Production building ${buildingType.name} registered production chain`);
    }

    // 添加建築創建完成的 debug log
    console.log(`Building creation completed: ${buildingType.name} (${type}) at position (${position.x}, ${position.y}), active: ${building.isActive}, ID: ${building.id}`);

    return building;
  }

  /**
   * Enter building placement mode
   * @param {string} type - Building type to place
   */
  enterPlacementMode(type) {
    if (!this.buildingTypes[type]) return;

    this.placementMode = true;
    this.placementBuildingType = type;

    // Create ghost sprite for placement
    const buildingType = this.buildingTypes[type];

    // 如果有 spriteIndex，使用 buildings_spritesheet 精灵图
    if (buildingType.spriteIndex !== undefined) {
      this.placementGhost = this.scene.add.sprite(0, 0, 'buildings_spritesheet', buildingType.spriteIndex)
        .setAlpha(0.5);
    } else {
      // 否则使用单独的图像
      this.placementGhost = this.scene.add.sprite(0, 0, buildingType.sprite)
        .setAlpha(0.5);
    }

    // 检查精灵图尺寸，如果太大则按比例缩小
    this.adjustPlacementGhostScale();

    // Add cost display
    const costText = Object.entries(buildingType.cost)
      .map(([resource, amount]) => `${resource}: ${amount}`)
      .join('\n');

    this.placementCostText = this.scene.add.text(0, 0, costText, {
      fontSize: '12px',
      fill: '#ffffff',
      backgroundColor: '#000000'
    });
  }

  /**
   * Update ghost position during placement
   * @param {number} x - Mouse/pointer x position
   * @param {number} y - Mouse/pointer y position
   */
  updatePlacementGhost(x, y) {
    if (!this.placementMode || !this.placementGhost) return;

    // Snap to grid
    const gridX = Math.floor(x / this.gridSize) * this.gridSize + this.gridSize / 2;
    const gridY = Math.floor(y / this.gridSize) * this.gridSize + this.gridSize / 2;

    this.placementGhost.setPosition(gridX, gridY);
    this.placementCostText.setPosition(gridX - 30, gridY + 30);

    // Check if we can place here (no collision with other buildings)
    const canPlace = this.canPlaceAt(gridX, gridY);

    // Check if we have resources
    const hasResources = this.resourceSystem.hasResources(
      this.buildingTypes[this.placementBuildingType].cost
    );

    // Update ghost appearance
    this.placementGhost.setTint(canPlace && hasResources ? 0xffffff : 0xff0000);
  }

  /**
   * Check if a building can be placed at the given position
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {boolean} - Whether placement is valid
   */
  canPlaceAt(x, y) {
    // Check if position is within map bounds
    if (x < 0 || y < 0 || x > this.scene.scale.width || y > this.scene.scale.height) {
      return false;
    }

    // Check for collision with other buildings
    for (const building of this.buildings.values()) {
      const distance = Phaser.Math.Distance.Between(
        x, y, building.position.x, building.position.y
      );

      if (distance < this.gridSize) {
        return false;
      }
    }

    return true;
  }

  /**
   * Place building at current ghost position
   * @returns {Building|null} - The placed building or null if failed
   */
  placeBuilding() {
    if (!this.placementMode || !this.placementGhost) return null;

    const position = {
      x: this.placementGhost.x,
      y: this.placementGhost.y
    };

    if (!this.canPlaceAt(position.x, position.y)) {
      return null;
    }

    // Create the actual building
    const building = this.createBuilding(this.placementBuildingType, position);

    // Exit placement mode
    this.exitPlacementMode();

    return building;
  }

  /**
   * 检查并调整放置幽灵精灵的缩放比例
   * 如果图像太大，则按比例缩小
   */
  adjustPlacementGhostScale() {
    if (!this.placementGhost) return;

    // 获取精灵的宽度和高度
    const width = this.placementGhost.width;
    const height = this.placementGhost.height;

    // 定义最大尺寸（标准尺寸为64x64）
    const maxSize = 64;

    // 如果宽度或高度超过最大尺寸，则按比例缩小
    if (width > maxSize || height > maxSize) {
      // 计算缩放比例（取宽高比例的最小值，确保完全适应）
      const scale = Math.min(maxSize / width, maxSize / height);

      // 应用缩放
      this.placementGhost.setScale(scale);
    }
  }

  /**
   * Exit building placement mode
   */
  exitPlacementMode() {
    this.placementMode = false;

    if (this.placementGhost) {
      this.placementGhost.destroy();
      this.placementGhost = null;
    }

    if (this.placementCostText) {
      this.placementCostText.destroy();
      this.placementCostText = null;
    }
  }

  /**
   * Select a building by ID
   * @param {string} id - Building ID
   */
  selectBuilding(id) {
    this.selectedBuilding = this.buildings.get(id) || null;

    if (this.selectedBuilding) {
      // Notify UI system about selection
      this.scene.uiManager.showBuildingInfo(this.selectedBuilding.getInfo());
    }
  }

  /**
   * Upgrade the currently selected building
   * @returns {boolean} - Whether upgrade was successful
   */
  upgradeSelectedBuilding() {
    if (!this.selectedBuilding) return false;

    // 创建升级成本对象
    const upgradeCost = {};

    // Calculate upgrade cost based on original cost and level
    Object.entries(this.selectedBuilding.cost).forEach(([resource, amount]) => {
      upgradeCost[resource] = Math.ceil(amount * (1 + this.selectedBuilding.level * 0.5));
    });

    return this.selectedBuilding.upgrade(this.resourceSystem.resources, upgradeCost);
  }

  /**
   * Update all buildings
   * @param {number} time - Current game time
   * @param {number} delta - Time since last update
   */
  update(time, delta) {
    // 更新所有建築
    for (const building of this.buildings.values()) {
      // 如果有人口系統，檢查建築的工人狀態
      if (this.populationSystem) {
        // 如果是生產建築，檢查工人狀態
        if (building.type !== 'housing') {
          // 获取当前生产方式的工人需求
          const workerRequirement = building.getCurrentWorkerRequirement ?
                                   building.getCurrentWorkerRequirement() : null;

          // 检查是否有足够的工人，并传递当前生产方式的工人需求和建筑类型
          const hasSufficientWorkers = this.populationSystem.hasSufficientWorkers(building.id, workerRequirement, building.type);
          const workerEfficiency = this.populationSystem.getBuildingEfficiencyMultiplier(building.id);

          // 更新建築狀態
          building.setActive(hasSufficientWorkers, workerEfficiency);
        }
      }

      // 更新生產
      const output = building.updateProduction(time, delta, this.resourceSystem);

      if (output) {
        // 將生產的資源添加到全局池
        this.resourceSystem.addResources(output);
      }

      // 如果沒有在生產中，則開始生產
      if (!building.isProducing && building.isActive) {
        building.startProduction(this.resourceSystem.resources);
      }
    }
  }

  /**
   * Get all buildings of a specific type
   * @param {string} type - The building type to search for
   * @returns {Array} - Array of buildings matching the type
   */
  getBuildingsByType(type) {
    const matchingBuildings = [];

    for (const building of this.buildings.values()) {
      if (building.type === type) {
        matchingBuildings.push(building);
      }
    }

    return matchingBuildings;
  }

  /**
   * Handle worker assignment for special buildings
   * @param {Building} building - The building instance
   * @param {Object} buildingType - Building type configuration
   * @param {string} type - Building type key
   */
  handleSpecialBuildingWorkers(building, buildingType, type) {
    if (this.populationSystem && buildingType.workerRequirement) {
      console.log(`Special building ${buildingType.name} requires workers:`, buildingType.workerRequirement);
      const hasWorkers = this.populationSystem.assignWorkersToBulding(building.id, type);
      if (!hasWorkers) {
        building.isActive = false;
        console.log(`Special building ${buildingType.name} created but inactive due to insufficient workers`);
        console.log(`  Required:`, buildingType.workerRequirement);
        console.log(`  Available workers in population system:`, this.populationSystem.getAvailableWorkersSummary ? this.populationSystem.getAvailableWorkersSummary() : 'method not available');
      } else {
        building.isActive = true;
        console.log(`Special building ${buildingType.name} is active with workers assigned`);
      }
    } else if (!this.populationSystem) {
      console.log(`Special building ${buildingType.name}: PopulationSystem not available, setting active by default`);
      building.isActive = true;
    } else {
      // 如果沒有工人需求，直接設為活動狀態
      building.isActive = true;
      console.log(`Special building ${buildingType.name} is active (no worker requirement)`);
    }
  }

  /**
   * Handle specific special building logic
   * @param {Building} building - The building instance
   * @param {string} type - Building type key
   */
  handleSpecificSpecialBuilding(building, type) {
    switch (type) {
      case 'adventurer_guild':
        console.log(`Adventurer Guild created! Notifying AdventurerSystem...`);
        // 通知場景中的冒險者系統檢查公會狀態
        if (this.scene.adventurerSystem) {
          // 延遲檢查，確保建築已完全創建
          this.scene.time.delayedCall(100, () => {
            this.scene.adventurerSystem.checkAdventurerGuild();
            console.log(`AdventurerSystem notified of new guild. System active: ${this.scene.adventurerSystem.isActive}`);
          });
        }
        break;

      case 'inn':
        console.log(`Inn created - adventurers can now rest and heal here`);
        break;

      case 'tavern':
        console.log(`Tavern created - adventurers can gather information and access black market`);
        break;

      case 'weapon_shop':
      case 'armor_shop':
      case 'item_shop':
        console.log(`${building.name} created - adventurers can purchase equipment here`);
        break;

      case 'church':
        console.log(`Church created - adventurers can be resurrected here`);
        break;

      case 'training_camp':
        console.log(`Training Camp created - adventurers can improve their abilities here`);
        break;

      default:
        console.log(`Special building ${building.name} (${type}) created with no specific handling`);
    }
  }
}
