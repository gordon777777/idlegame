import Phaser from 'phaser';
import ResourceSystem from '../systems/ResourceSystem';
import UIManager from '../systems/UIManager';
import BuildingSystem from '../systems/BuildingSystem';
import PopulationSystem from '../systems/PopulationSystem';
import MarketSystem from '../systems/MarketSystem';
import TimeSystem from '../systems/TimeSystem';
import ResearchSystem from '../systems/ResearchSystem';
import DataManager from '../systems/DataManager';
import DebugUtils from '../utils/DebugUtils';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.dataManager = null; // Will be initialized in preload()
    this.resources = null; // Will be initialized in create()
    this.populationSystem = new PopulationSystem();
    this.timeSystem = new TimeSystem();
    this.uiManager = new UIManager(this);
    this.buildingSystem = null; // Will be initialized in create()
    this.playerGold = 1000; // 初始金幣
  }

  preload() {
    // Initialize DataManager
    this.dataManager = new DataManager(this);

    // Preload JSON data
    this.dataManager.preloadData();

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

    // Load data from JSON files
    if (this.dataManager.loadData()) {
      console.log('JSON data loaded successfully');

      // Initialize systems with JSON data
      this.resources = new ResourceSystem(this.dataManager.getResourceSettings());
      this.buildingSystem = new BuildingSystem(
        this,
        this.resources,
        this.populationSystem,
        this.dataManager.getBuildingTypes()
      );

      // Initialize research system with JSON data
      this.researchSystem = new ResearchSystem(
        this.resources,
        this.dataManager.getTechnologies(),
        this, // 传入 GameScene 作为 gameState
        this.buildingSystem
      );
    } else {
      console.warn('Failed to load JSON data, using default values');
      this.resources = new ResourceSystem();
      this.buildingSystem = new BuildingSystem(this, this.resources, this.populationSystem);
      this.researchSystem = new ResearchSystem(
        this.resources,
        null,
        this, // 传入 GameScene 作为 gameState
        this.buildingSystem
      );
    }

    // 初始化市場系統
    this.marketSystem = new MarketSystem();

    // 創建金幣顯示
    this.goldText = this.add.text(this.scale.width - 20, 20, `金幣: ${this.playerGold}`, {
      fontSize: '18px',
      fill: '#ffdd00',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(100);

    // 創建時間顯示
    this.timeText = this.add.text(100, 120, '', { // 向下移動100px，從20到120
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#333333',
      padding: { x: 10, y: 5 }
    }).setDepth(100);

    // 設置時間顯示
    this.timeSystem.setTimeDisplay(this.timeText);

    // 創建時間控制按鈕
    this.createTimeControls();

    // 設置時間系統事件監聽器
    this.setupTimeEvents();

    // 監聽資源出售事件
    this.events.on('resourceSold', (profit) => {
      this.playerGold += profit;
      this.updateGoldDisplay();
    });

    // 監聽稅收事件
    this.events.on('taxCollected', (taxAmount, revenue) => {
      this.playerGold += taxAmount;
      this.updateGoldDisplay();

      // 顯示稅收通知
      this.showTaxNotification(taxAmount, revenue);
    });

    // 創建調試按鈕
    this.createDebugButton();

    // 初始化地图和基础建築
    this.createTerrain();
    this.createInitialBuildings();

    // 检查建筑系统是否正确初始化
    if (!this.buildingSystem) {
      console.error('GameScene: Building system not initialized');
    } else {
      console.log('GameScene: Building system initialized with types:', Object.keys(this.buildingSystem.buildingTypes).length);

      // 打印所有建筑类型，用于调试
      console.log('GameScene: Available building types:', Object.keys(this.buildingSystem.buildingTypes));
    }

    // 初始化UI系统
    this.uiManager.createResourcePanel({
      position: { x: this.scale.width / 2, y: 70 }, // X轴居中，向下移动50px（从20到70）
      resources: [
        // 第一行资源
        'magic_ore', 'enchanted_wood', 'arcane_crystal', 'mana', 'arcane_essence',
        // 第二行资源
        'mystic_planks', 'refined_crystal', 'magical_potion', 'enchanted_artifact', 'magical_construct'
      ],
      layout: { rows: 2, columns: 5 } // 指定2行5列的布局
    });

    // 創建人口面板 - 調整位置以避免與資源面板重疊
    this.uiManager.createPopulationPanel({
      position: { x: 50, y: 350 }
    });

    // 創建統一的建築選單
    this.uiManager.createBuildingMenu({
      position: { x: this.scale.width - 320, y: 320 } // 向下移动50px
    });

    // 确保建筑菜单面板可见
    if (this.uiManager.buildingMenuPanel) {
      this.uiManager.buildingMenuPanel.show();
      console.log('GameScene: Building menu panel shown');
    } else {
      console.error('GameScene: Building menu panel not created');
    }

    // 創建研究按鈕
    const researchButton = this.add.rectangle(this.scale.width - 300, 20, 60, 30, 0x3a6a8c)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.uiManager.toggleResearchPanel();
      });

    const researchText = this.add.text(this.scale.width - 300, 20, '研究', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

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

    // 更新研究系統
    if (this.researchSystem) {
      this.researchSystem.update(delta);
    }

    // 更新時間系統
    if (this.timeSystem) {
      this.timeSystem.update(time, delta);

      // 更新時間顯示
      this.timeSystem.updateTimeDisplay();
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

      // 更新金幣顯示
      this.updateGoldDisplay();
    }
  }

  /**
   * 更新金幣顯示
   */
  updateGoldDisplay() {
    if (this.goldText) {
      this.goldText.setText(`金幣: ${Math.floor(this.playerGold)}`);
    }
  }

  /**
   * 顯示稅收通知
   * @param {number} taxAmount - 稅收金額
   * @param {number} revenue - 營業額
   */
  showTaxNotification(taxAmount, revenue) {
    // 創建通知背景
    const notification = this.add.container(this.scale.width / 2, 100);

    const background = this.add.rectangle(0, 0, 400, 100, 0x1a1a1a, 0.9)
      .setStrokeStyle(2, 0xffdd00);

    // 添加標題
    const title = this.add.text(0, -30, '月度稅收已發放', {
      fontSize: '20px',
      fill: '#ffdd00',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    // 添加內容
    const content = this.add.text(0, 5, `本月營業額: ${revenue} 金幣\n稅收 (5%): +${taxAmount} 金幣`, {
      fontSize: '16px',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    notification.add([background, title, content]);

    // 設置消失動畫
    notification.alpha = 0;
    notification.y = 50;

    // 添加動畫
    this.tweens.add({
      targets: notification,
      alpha: 1,
      y: 100,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        // 延遲後消失
        this.time.delayedCall(5000, () => {
          this.tweens.add({
            targets: notification,
            alpha: 0,
            y: 50,
            duration: 500,
            ease: 'Power2',
            onComplete: () => notification.destroy()
          });
        });
      }
    });
  }

  /**
   * 創建時間控制按鈕
   */
  createTimeControls() {
    const buttonY = 130; // 向下移動100px，從30到130
    const buttonSpacing = 40;
    const buttonSize = 30;
    const startX = 200; // 調整起始X座標，使按鈕更靠右

    // 暂停/繼續按鈕
    const pauseButton = this.add.rectangle(startX + buttonSize/2, buttonY, buttonSize, buttonSize, 0x333333)
      .setInteractive()
      .on('pointerdown', () => {
        const isPaused = this.timeSystem.togglePaused();
        pauseText.setText(isPaused ? '▶' : '❚❚');
      });

    const pauseText = this.add.text(startX + buttonSize/2, buttonY, '❚❚', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 慢速按鈕
    const slowButton = this.add.rectangle(startX + buttonSize/2 + buttonSpacing, buttonY, buttonSize, buttonSize, 0x333333)
      .setInteractive()
      .on('pointerdown', () => {
        this.timeSystem.setTimeScale(0.5);
        this.updateTimeScaleButtons(0.5);
      });

    const slowText = this.add.text(startX + buttonSize/2 + buttonSpacing, buttonY, '◄', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 正常速度按鈕
    const normalButton = this.add.rectangle(startX + buttonSize/2 + buttonSpacing*2, buttonY, buttonSize, buttonSize, 0x555555)
      .setInteractive()
      .on('pointerdown', () => {
        this.timeSystem.setTimeScale(1.0);
        this.updateTimeScaleButtons(1.0);
      });

    const normalText = this.add.text(startX + buttonSize/2 + buttonSpacing*2, buttonY, '1x', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 快速按鈕
    const fastButton = this.add.rectangle(startX + buttonSize/2 + buttonSpacing*3, buttonY, buttonSize, buttonSize, 0x333333)
      .setInteractive()
      .on('pointerdown', () => {
        this.timeSystem.setTimeScale(2.0);
        this.updateTimeScaleButtons(2.0);
      });

    const fastText = this.add.text(startX + buttonSize/2 + buttonSpacing*3, buttonY, '►', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 超快速按鈕
    const superFastButton = this.add.rectangle(startX + buttonSize/2 + buttonSpacing*4, buttonY, buttonSize, buttonSize, 0x333333)
      .setInteractive()
      .on('pointerdown', () => {
        this.timeSystem.setTimeScale(4.0);
        this.updateTimeScaleButtons(4.0);
      });

    const superFastText = this.add.text(startX + buttonSize/2 + buttonSpacing*4, buttonY, '►►', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 存儲按鈕引用
    this.timeButtons = {
      pause: { button: pauseButton, text: pauseText },
      slow: { button: slowButton, text: slowText },
      normal: { button: normalButton, text: normalText },
      fast: { button: fastButton, text: fastText },
      superFast: { button: superFastButton, text: superFastText }
    };

    // 預設選擇正常速度
    this.updateTimeScaleButtons(1.0);
  }

  /**
   * 更新時間速度按鈕外觀
   * @param {number} activeScale - 當前時間速度
   */
  updateTimeScaleButtons(activeScale) {
    // 重置所有按鈕為非活躍狀態
    this.timeButtons.slow.button.fillColor = 0x333333;
    this.timeButtons.normal.button.fillColor = 0x333333;
    this.timeButtons.fast.button.fillColor = 0x333333;
    this.timeButtons.superFast.button.fillColor = 0x333333;

    // 設置活躍按鈕
    if (activeScale === 0.5) {
      this.timeButtons.slow.button.fillColor = 0x555555;
    } else if (activeScale === 1.0) {
      this.timeButtons.normal.button.fillColor = 0x555555;
    } else if (activeScale === 2.0) {
      this.timeButtons.fast.button.fillColor = 0x555555;
    } else if (activeScale === 4.0) {
      this.timeButtons.superFast.button.fillColor = 0x555555;
    }
  }

  /**
   * 設置時間系統事件監聽器
   */
  setupTimeEvents() {
    // 監聽日期變化事件
    this.timeSystem.on('onDayChange', (data) => {
      if (DebugUtils && DebugUtils.log) {
        DebugUtils.log(`日期變化: ${data.year}年${data.month}月${data.day}日`, 'TIME');
      }
    });

    // 監聽月份變化事件
    this.timeSystem.on('onMonthChange', (data) => {
      if (DebugUtils && DebugUtils.log) {
        DebugUtils.log(`月份變化: ${data.year}年${data.month}月`, 'TIME');
      }
    });

    // 監聽季節變化事件
    this.timeSystem.on('onSeasonChange', (data) => {
      if (DebugUtils && DebugUtils.log) {
        DebugUtils.log(`季節變化: ${data.season}季`, 'TIME');
      }
    });

    // 監聽年份變化事件
    this.timeSystem.on('onYearChange', (data) => {
      if (DebugUtils && DebugUtils.log) {
        DebugUtils.log(`年份變化: ${data.year}年`, 'TIME');
      }
    });
  }

  /**
   * 創建調試按鈕
   */
  createDebugButton() {
    // 創建調試按鈕
    const debugButton = this.add.rectangle(this.scale.width - 100, this.scale.height - 30, 80, 30, 0x990000)
      .setInteractive()
      .on('pointerdown', () => {
        const isDebugMode = DebugUtils.toggleDebugMode();
        debugText.setText(isDebugMode ? 'DEBUG: ON' : 'DEBUG: OFF');
      });

    const debugText = this.add.text(this.scale.width - 100, this.scale.height - 30, 'DEBUG: OFF', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 創建匯出數據按鈕
    const exportButton = this.add.rectangle(this.scale.width - 200, this.scale.height - 30, 80, 30, 0x006699)
      .setInteractive()
      .on('pointerdown', () => {
        this.exportGameData();
      });

    const exportText = this.add.text(this.scale.width - 200, this.scale.height - 30, 'EXPORT', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);
  }

  /**
   * 匯出遊戲數據到JSON文件
   */
  exportGameData() {
    if (this.dataManager) {
      this.dataManager.exportGameData(
        this.buildingSystem,
        this.researchSystem,
        this.resources
      );
      console.log('Game data exported to JSON files');

      // 顯示匯出成功通知
      const notification = this.add.text(this.scale.width / 2, 100, '遊戲數據已匯出到JSON文件', {
        fontSize: '18px',
        fill: '#ffffff',
        backgroundColor: '#006699',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5, 0.5).setDepth(100);

      // 3秒後自動消失
      this.time.delayedCall(3000, () => {
        notification.destroy();
      });
    } else {
      console.error('DataManager not initialized');
    }
  }
}