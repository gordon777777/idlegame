import Phaser from 'phaser';
import ResourceSystem from '../systems/ResourceSystem';
import UIManager from '../systems/UIManager';
import BuildingSystem from '../systems/BuildingSystem';
import PopulationSystem from '../systems/PopulationSystem';
import MarketSystem from '../systems/MarketSystem';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.resources = new ResourceSystem();
    this.populationSystem = new PopulationSystem();
    this.uiManager = new UIManager(this);
    this.buildingSystem = null; // Will be initialized in create()
  }

  preload() {
    this.load.image('terrain', 'assets/Terrain.png');

    // Add error handling for asset loading
    this.load.on('loaderror', (file) => {
      console.error('Error loading asset:', file.key);
    });

    // Load the materials sprite sheet
    try {
      this.load.atlas(
        'materials',
        'assets/resources/materials_sheet.png',
        'assets/resources/materials_sheet.json'
      );
      console.log('Materials sprite sheet loaded successfully');
    } catch (e) {
      console.warn('Materials sprite sheet could not be loaded:', e);
    }

    // Load the buildings sprite sheet
    try {
      this.load.atlas(
        'buildings',
        'assets/buildings/buildings_sheet.png',
        'assets/buildings/buildings_sheet.json'
      );
      console.log('Buildings sprite sheet loaded successfully');
    } catch (e) {
      console.warn('Buildings sprite sheet could not be loaded:', e);
    }

    // Load individual building images as fallback
    this.load.image('magic_forge', 'assets/buildings/magic_forge.PNG');
  }

  create() {
    console.log('GameScene create method started');

    // 初始化市場系統
    this.marketSystem = new MarketSystem();

    // 初始化建築系統
    this.buildingSystem = new BuildingSystem(this, this.resources, this.populationSystem);

    // 初始化地图和基础建築
    this.createTerrain();
    this.createInitialBuildings();

    // 初始化UI系统
    this.uiManager.createResourcePanel({
      position: { x: 20, y: 20 },
      resources: ['magic_ore', 'enchanted_wood', 'arcane_crystal', 'mana']
    });

    // 創建人口面板 - 調整位置以避免與資源面板重疊
    this.uiManager.createPopulationPanel({
      position: { x: 20, y: 150 }
    });

    // 創建建築選單
    const buildingTypes = Object.keys(this.buildingSystem.buildingTypes)
      .filter(type => this.buildingSystem.buildingTypes[type].type === 'collector')
      .map(type => this.buildingSystem.buildingTypes[type].name);

    this.uiManager.createBuildingMenu({
      position: { x: this.scale.width - 220, y: 20 },
      buildings: buildingTypes
    });

    // 更新資源顯示
    this.uiManager.updateResources(this.resources.resources);

    // 設置滑鼠互動
    this.input.on('pointermove', (pointer) => {
      if (this.buildingSystem.placementMode) {
        this.buildingSystem.updatePlacementGhost(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerdown', (pointer) => {
      if (this.buildingSystem.placementMode) {
        this.buildingSystem.placeBuilding();
      }
    });

    // 設置鍵盤互動
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.buildingSystem.placementMode) {
        this.buildingSystem.exitPlacementMode();
      }
    });

    console.log('GameScene create method completed');
  }

  createTerrain() {
    this.add.tileSprite(0, 0, 2560, 1440, 'terrain').setOrigin(0);
  }

  createInitialBuildings() {
    // 創建初始建築
    const initialBuildings = [
      { type: 'magic_mine', position: { x: 200, y: 300 } },
      { type: 'enchanted_forest', position: { x: 400, y: 300 } },
      { type: 'crystal_mine', position: { x: 600, y: 300 } },
      { type: 'mana_well', position: { x: 800, y: 300 } }
    ];

    initialBuildings.forEach(building => {
      this.buildingSystem.createBuilding(building.type, building.position);
    });
  }

  selectBuilding(buildingId) {
    this.buildingSystem.selectBuilding(buildingId);
  }

  update(time, delta) {
    // 更新建築系統
    if (this.buildingSystem) {
      this.buildingSystem.update(time, delta);
    }

    // 更新資源系統
    if (this.resources) {
      this.resources.update(time, delta);
    }

    // 更新市場系統
    if (this.marketSystem && this.resources && this.populationSystem) {
      this.marketSystem.update(time, delta, this.resources, this.populationSystem);
    }

    // 更新人口系統
    if (this.populationSystem) {
      // 設置場景引用，以便人口系統可以訪問資源
      if (!this.populationSystem.scene) {
        this.populationSystem.scene = this;
      }

      this.populationSystem.update(time, delta);
    }

    // 每秒更新一次UI
    if (time % 1000 < 16) { // Approximately once per second (assuming 60fps)
      this.uiManager.updateResources(this.resources.resources);

      // 更新人口面板
      if (this.populationSystem) {
        const stats = this.populationSystem.getPopulationStats();
        this.uiManager.updatePopulationPanel(stats);
      }

      // 更新市場面板
      if (this.uiManager.marketPanel && this.uiManager.marketPanel.visible) {
        this.uiManager.createMarketPanel();
      }
    }
  }
}