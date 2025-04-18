import Phaser from 'phaser';
import Button from '../ui/Button.js';

// 导入面板类
import ResourcePanel from '../ui/panels/ResourcePanel.js';
import BuildingMenuPanel from '../ui/panels/BuildingMenuPanel.js';
import BuildingInfoPanel from '../ui/panels/BuildingInfoPanel.js';
import PopulationPanel from '../ui/panels/PopulationPanel.js';
import WorkerPanel from '../ui/panels/WorkerPanel.js';
import ResearchPanel from '../ui/panels/ResearchPanel.js';
import MarketPanel from '../ui/panels/MarketPanel.js';
import MarketResourcePanel from '../ui/panels/MarketResourcePanel.js';

export default class UIManager {
  constructor(scene) {
    this.scene = scene;

    // 面板实例
    this.resourcePanel = null;
    this.buildingMenuPanel = null;
    this.buildingInfoPanel = null;
    this.populationPanel = null;
    this.workerPanel = null;
    this.researchPanel = null;
    this.immigrantsPanel = null;
    this.marketPanel = null;
  }

  /**
   * 创建资源面板
   * @param {Object} config - 面板配置
   */
  createResourcePanel(config) {
    // 使用ResourcePanel类的静态方法创建面板
    return ResourcePanel.createPanel(this.scene, config);
  }

  /**
   * 创建建筑菜单面板
   * @param {Object} config - 面板配置
   */
  createBuildingMenu(config) {
    // 如果已存在，先销毁
    if (this.buildingMenuPanel) {
      this.buildingMenuPanel.destroy();
    }

    // 创建新的建筑菜单面板
    this.buildingMenuPanel = new BuildingMenuPanel(this.scene, config);
    this.buildingMenuPanel.show();

    return this.buildingMenuPanel;
  }

  /**
   * 显示建筑信息面板
   * @param {Object} buildingInfo - 建筑信息
   */
  showBuildingInfo(buildingInfo) {
    // 如果已存在，先销毁
    if (this.buildingInfoPanel) {
      this.buildingInfoPanel.destroy();
    }

    // 创建新的建筑信息面板
    this.buildingInfoPanel = new BuildingInfoPanel(this.scene, buildingInfo, {
      onClose: () => this.closeBuildingInfo()
    });

    // 显示面板
    this.buildingInfoPanel.show();

    return this.buildingInfoPanel;
  }

  handleBuildingSelect(buildingType) {
    console.log('Selected building type for placement:', buildingType);

    // 啟動建築放置模式
    const buildingKey = Object.keys(this.scene.buildingSystem.buildingTypes)
      .find(key => this.scene.buildingSystem.buildingTypes[key].name === buildingType);

    if (buildingKey) {
      this.scene.buildingSystem.enterPlacementMode(buildingKey);
    }
  }

  /**
   * 處理建築升級
   * @param {string} buildingId - 建築ID
   */
  handleBuildingUpgrade(buildingId) {
    console.log('Upgrading building:', buildingId);
    const success = this.scene.buildingSystem.upgradeSelectedBuilding();

    if (success) {
      // 升級成功，更新建築信息
      const building = this.scene.buildingSystem.selectedBuilding;
      this.showBuildingInfo(building.getInfo());
    } else {
      // 升級失敗，顯示提示
      const errorText = this.scene.add.text(400, 50, '資源不足，無法升級', {
        fontSize: '16px',
        fill: '#ff0000',
        backgroundColor: '#000000'
      }).setOrigin(0.5, 0);

      // 2秒後消失
      this.scene.time.delayedCall(2000, () => {
        errorText.destroy();
      });
    }
  }

  /**
   * 处理生产方式选择
   * @param {string} buildingId - 建筑ID
   * @param {string} methodId - 生产方式ID
   */
  handleProductionMethodSelect(buildingId, methodId) {
    console.log(`Selecting production method ${methodId} for building ${buildingId}`);

    // 获取建筑对象
    const building = this.scene.buildingSystem.buildings.get(buildingId);
    if (!building) return;

    // 设置生产方式
    const success = building.setProductionMethod(methodId);

    if (success) {
      // 更新生产链
      this.scene.resourceSystem.addProductionChain(building);

      // 更新建筑信息显示
      this.showBuildingInfo(building.getInfo());
    }
  }

  /**
   * 处理副产品类型选择
   * @param {string} buildingId - 建筑ID
   * @param {string} typeId - 副产品类型ID
   */
  handleByproductTypeSelect(buildingId, typeId) {
    console.log(`Selecting byproduct type ${typeId} for building ${buildingId}`);

    // 获取建筑对象
    const building = this.scene.buildingSystem.buildings.get(buildingId);
    if (!building) return;

    // 设置副产品类型
    const success = building.setByproductType(typeId);

    if (success) {
      // 更新生产链
      this.scene.resourceSystem.addProductionChain(building);

      // 更新建筑信息显示
      this.showBuildingInfo(building.getInfo());
    }
  }

  /**
   * 關閉建築信息面板
   */
  closeBuildingInfo() {
    if (this.buildingInfoPanel) {
      this.buildingInfoPanel.destroy();
      this.buildingInfoPanel = null;

      // 清除建築系統中的選中建築
      if (this.scene.buildingSystem) {
        this.scene.buildingSystem.selectedBuilding = null;
      }
    }
  }

  /**
   * 更新资源显示
   * @param {Object} resources - 资源数据
   */
  updateResources(resources) {
    if (this.resourcePanel) {
      this.resourcePanel.updateResources(resources);
    }
  }

  /**
   * 創建人口面板
   * @param {Object} config - 面板配置
   */
  createPopulationPanel(config) {
    // 如果已存在，先移除
    if (this.populationPanel) {
      this.populationPanel.destroy();
    }

    // 创建新的人口面板
    this.populationPanel = new PopulationPanel(this.scene, config);
    this.populationPanel.show();

    return this.populationPanel;
  }

  /**
   * 更新人口面板
   * @param {Object} stats - 人口統計信息
   */
  updatePopulationPanel(stats) {
    if (!this.populationPanel) return;

    // 使用面板类的update方法
    this.populationPanel.update(stats);
  }

  /**
   * 獲取幸福度顏色
   * @param {number} happiness - 幸福度值
   * @returns {string} - 顏色代碼
   */
  getHappinessColor(happiness) {
    if (happiness >= 80) return '#66ff66'; // 高幸福度，綠色
    if (happiness >= 60) return '#99ff99'; // 較高幸福度，淺綠色
    if (happiness >= 40) return '#e0e0e0'; // 中等幸福度，白色
    if (happiness >= 20) return '#ffcc66'; // 較低幸福度，橙色
    return '#ff6666'; // 低幸福度，紅色
  }

  /**
   * 獲取滿足度顏色
   * @param {string} satisfaction - 滿足度百分比
   * @returns {string} - 顏色代碼
   */
  getSatisfactionColor(satisfaction) {
    // 將百分比字符串轉換為數字
    const value = parseInt(satisfaction);

    if (value >= 80) return '#66ff66'; // 高滿足度，綠色
    if (value >= 60) return '#99ff99'; // 較高滿足度，淺綠色
    if (value >= 40) return '#e0e0e0'; // 中等滿足度，白色
    if (value >= 20) return '#ffcc66'; // 較低滿足度，橙色
    return '#ff6666'; // 低滿足度，紅色
  }

  /**
   * 切換工人管理面板的顯示/隱藏
   */
  toggleWorkerPanel() {
    // 使用WorkerPanel类的静态方法切换面板
    this.workerPanel = WorkerPanel.togglePanel(this.scene);
  }

  /**
   * 創建工人管理面板
   */
  createWorkerPanel() {
    // 使用WorkerPanel类的静态方法创建面板
    return WorkerPanel.togglePanel(this.scene);
  }

  /**
   * 創建概覽選項卡內容
   * @param {Phaser.GameObjects.Container} container - 選項卡容器
   * @param {Object} stats - 人口統計數據
   */
  createOverviewTabContent(container, stats) {
    const elements = [];

    // 定義內容的Y軸基準位置，方便統一調整
    const containY = 80;

    // 先添加內容背景
    const contentBackground = this.scene.add.rectangle(0, containY+40, 460, 280, 0x1a1a1a, 0.7)
      .setStrokeStyle(1, 0x4a4a4a);
    // 直接添加到容器中，確保它在最底層
    container.add(contentBackground);

    // 添加總人口信息
    const totalPopText = this.scene.add.text(-200, containY - 85, `總人口: ${stats.total}`, {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // 添加住房容量信息
    const housingText = this.scene.add.text(-200, containY - 60, `住房容量: ${stats.capacity}`, {
      fontSize: '16px',
      fill: '#e0e0e0'
    }).setOrigin(0, 0.5);

    // 添加總體幸福度
    const happinessColor = this.getHappinessColor(stats.happiness);
    const happinessText = this.scene.add.text(50, containY - 85, `幸福度: ${stats.happiness}%`, {
      fontSize: '16px',
      fill: happinessColor
    }).setOrigin(0, 0.5);

    // 添加人口分布信息
    const distributionTitle = this.scene.add.text(-200, containY - 20, '人口分布:', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    elements.push(totalPopText, housingText, happinessText, distributionTitle);

    // 顯示各階層人口分布
    let yPos = containY + 10;
    for (const [className, classData] of Object.entries(stats.socialClasses)) {
      // 階層名稱和數量
      const classText = this.scene.add.text(-200, yPos, `${classData.name}: ${classData.count} (${classData.percentage})`, {
        fontSize: '16px',
        fill: this.getClassColor(className)
      }).setOrigin(0, 0.5);

      // 階層幸福度
      const classHappinessColor = this.getHappinessColor(classData.happiness || 50);
      const classHappinessText = this.scene.add.text(50, yPos, `幸福度: ${classData.happiness || 50}%`, {
        fontSize: '14px',
        fill: classHappinessColor
      }).setOrigin(0, 0.5);

      elements.push(classText, classHappinessText);
      yPos += 30;
    }

    // 添加工人總覽標題
    const workersTitle = this.scene.add.text(-200, yPos + 10, '工人總覽:', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    elements.push(workersTitle);
    yPos += 40;

    // 計算總可用工人數量
    let totalAvailableWorkers = 0;
    let totalWorkerCount = 0;

    for (const [_, workerData] of Object.entries(stats.workers)) {
      totalAvailableWorkers += workerData.available;
      totalWorkerCount += workerData.count;
    }

    // 顯示總工人數量
    const totalWorkersText = this.scene.add.text(-200, yPos, `總工人數: ${totalWorkerCount} (可用: ${totalAvailableWorkers})`, {
      fontSize: '16px',
      fill: '#e0e0e0'
    }).setOrigin(0, 0.5);

    elements.push(totalWorkersText);
    yPos += 30;

    // 添加吸引移民按鈕
    const immigrantBtn = new Button(this.scene, -100, yPos + 20, '吸引移民', {
      width: 120,
      height: 30,
      backgroundColor: 0x4a6a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.showAttractImmigrantsPanel('lower')
    });

    elements.push(...immigrantBtn.getElements());

    // 添加所有元素到容器
    container.add(elements);
  }

  /**
   * 獲取階層顏色
   * @param {string} socialClass - 階層
   * @returns {string} - 顏色代碼
   */
  getClassColor(socialClass) {
    const colors = {
      lower: '#a0a0a0', // 灰色
      middle: '#66ccff', // 藍色
      upper: '#ffcc00'  // 金色
    };

    return colors[socialClass] || '#ffffff';
  }

  /**
   * 創建底層選項卡內容
   * @param {Phaser.GameObjects.Container} container - 選項卡容器
   * @param {Object} stats - 人口統計數據
   */
  createLowerClassTabContent(container, stats) {
    const elements = [];
    const className = 'lower';
    const classData = stats.socialClasses[className];

    if (!classData) return;

    // 定義內容的Y軸基準位置，方便統一調整
    const containY = 80;

    // 先添加內容背景 - 調整透明度和位置
    const contentBackground = this.scene.add.rectangle(0, containY+40, 460, 280, 0x1a1a1a, 0.7)
      .setStrokeStyle(1, 0x4a4a4a);
    // 直接添加到容器中，確保它在最底層
    container.add(contentBackground);

    // 添加階層標題 - 調整位置以配合新的背景位置
    const classTitle = this.scene.add.text(-200, containY - 85, classData.name, {
      fontSize: '20px',
      fill: this.getClassColor(className),
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // 添加階層人口信息 - 調整位置
    const classCountText = this.scene.add.text(-200, containY - 60, `人口: ${classData.count} (${classData.percentage})`, {
      fontSize: '16px',
      fill: '#e0e0e0'
    }).setOrigin(0, 0.5);

    // 添加階層幸福度 - 調整位置
    const happinessColor = this.getHappinessColor(classData.happiness || 50);
    const happinessText = this.scene.add.text(-100, containY - 85, `幸福度: ${classData.happiness || 50}%`, {
      fontSize: '16px',
      fill: happinessColor
    }).setOrigin(0, 0.5);

    // 添加階層描述 - 調整位置
    const descText = this.scene.add.text(-200, containY, classData.description, {
      fontSize: '14px',
      fill: '#cccccc',
      wordWrap: { width: 500 }
    }).setOrigin(0, 0.5);

    elements.push(classTitle, classCountText, happinessText, descText);

    // 添加工人類型標題 - 調整位置
    const workersTitle = this.scene.add.text(-200, containY + 40, '工人類型:', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    elements.push(workersTitle);

    // 計算這個階層的可用工人數量
    let availableWorkers = 0;
    let totalWorkers = 0;

    // 統計這個階層的工人類型數據
    for (const workerType of this.scene.populationSystem.socialClasses[className].workerTypes) {
      const workerData = stats.workers[workerType];
      if (workerData) {
        availableWorkers += workerData.available;
        totalWorkers += workerData.count;
      }
    }

    // 顯示可用工人數量 - 調整位置
    const availableText = this.scene.add.text(100, containY + 40, `可用工人: ${availableWorkers}/${totalWorkers}`, {
      fontSize: '16px',
      fill: '#e0e0e0'
    }).setOrigin(0, 0.5);

    elements.push(availableText);

    // 列出這個階層的工人類型 - 調整起始位置
    let yPos = containY + 80;
    const workerTypesInClass = this.scene.populationSystem.socialClasses[className].workerTypes;

    for (const workerType of workerTypesInClass) {
      const data = stats.workers[workerType];
      if (!data) continue;

      // 工人名稱
      const nameText = this.scene.add.text(-250, yPos, data.displayName, {
        fontSize: '16px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 工人數量
      const countText = this.scene.add.text(-100, yPos, `數量: ${data.count} (可用: ${data.available})`, {
        fontSize: '14px',
        fill: '#cccccc'
      }).setOrigin(0, 0.5);

      // 經驗值
      const expText = this.scene.add.text(50, yPos, `經驗: ${data.experience}`, {
        fontSize: '14px',
        fill: '#cccccc'
      }).setOrigin(0, 0.5);

      // 添加訓練按鈕
      const trainBtn = new Button(this.scene, 180, yPos, '訓練', {
        width: 60,
        height: 26,
        backgroundColor: 0x4a6a4a,
        onClick: () => this.trainWorker(workerType)
      });

      // 添加晉升按鈕
      const promoteBtn = new Button(this.scene, 270, yPos, '晉升', {
        width: 60,
        height: 26,
        backgroundColor: 0x6a4a4a,
        onClick: () => this.showPromotionOptions(workerType)
      });

      // 將按鈕元素添加到元素列表
      elements.push(nameText, countText, expText, ...trainBtn.getElements(), ...promoteBtn.getElements());
      yPos += 40;
    }

    // 添加需求信息
    if (classData.demands && Object.keys(classData.demands).length > 0) {
      const demandsTitle = this.scene.add.text(-250, yPos + 20, '需求滿足情況:', {
        fontSize: '18px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      elements.push(demandsTitle);
      yPos += 50;

      // 顯示每種需求的滿足情況
      for (const [_, demandInfo] of Object.entries(classData.demands)) {
        const demandNameText = this.scene.add.text(-250, yPos, demandInfo.displayName, {
          fontSize: '16px',
          fill: '#e0e0e0'
        }).setOrigin(0, 0.5);

        // 滿足率
        const satisfactionColor = this.getSatisfactionColor(demandInfo.satisfaction);
        const satisfactionText = this.scene.add.text(-100, yPos, `滿足: ${demandInfo.satisfaction}`, {
          fontSize: '14px',
          fill: satisfactionColor
        }).setOrigin(0, 0.5);

        // 價格適宜度
        const priceColor = this.getSatisfactionColor(demandInfo.priceScore);
        const priceText = this.scene.add.text(20, yPos, `價格: ${demandInfo.priceScore}`, {
          fontSize: '14px',
          fill: priceColor
        }).setOrigin(0, 0.5);

        // 影響
        const impactColor = demandInfo.impact >= 0 ? '#99ff99' : '#ff9999';
        const impactText = this.scene.add.text(140, yPos, `影響: ${demandInfo.impact > 0 ? '+' : ''}${demandInfo.impact}`, {
          fontSize: '14px',
          fill: impactColor
        }).setOrigin(0, 0.5);

        elements.push(demandNameText, satisfactionText, priceText, impactText);
        yPos += 20;
      }

      yPos += 10;
    }
    // 顯示每個階層的需求滿足情況
    for (const [socialClassName, classData] of Object.entries(stats.socialClasses)) {
      if (classData.demands && Object.keys(classData.demands).length > 0) {
        // 階層標題
        const classTitle = this.scene.add.text(-250, yPos, `${classData.name}需求:`, {
          fontSize: '16px',
          fill: this.getClassColor(socialClassName),
          fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        elements.push(classTitle);
        yPos += 25;

        // 顯示每種需求的滿足情況
        for (const [_, demandInfo] of Object.entries(classData.demands)) {
          const demandNameText = this.scene.add.text(-230, yPos, demandInfo.displayName, {
            fontSize: '14px',
            fill: '#e0e0e0'
          }).setOrigin(0, 0.5);

          // 滿足率
          const satisfactionColor = this.getSatisfactionColor(demandInfo.satisfaction);
          const satisfactionText = this.scene.add.text(-100, yPos, `滿足: ${demandInfo.satisfaction}`, {
            fontSize: '14px',
            fill: satisfactionColor
          }).setOrigin(0, 0.5);

          // 價格適宜度
          const priceColor = this.getSatisfactionColor(demandInfo.priceScore);
          const priceText = this.scene.add.text(20, yPos, `價格: ${demandInfo.priceScore}`, {
            fontSize: '14px',
            fill: priceColor
          }).setOrigin(0, 0.5);

          // 影響
          const impactColor = demandInfo.impact >= 0 ? '#99ff99' : '#ff9999';
          const impactText = this.scene.add.text(140, yPos, `影響: ${demandInfo.impact > 0 ? '+' : ''}${demandInfo.impact}`, {
            fontSize: '14px',
            fill: impactColor
          }).setOrigin(0, 0.5);

          elements.push(demandNameText, satisfactionText, priceText, impactText);
          yPos += 20;
        }

        yPos += 10;
      }
    }

    // 添加所有元素到容器
    container.add(elements);
  }



  /**
   * 顯示晉升選項
   * @param {string} workerType - 工人類型
   */
  showPromotionOptions(workerType) {
    // 如果已存在晉升面板，先移除
    if (this.promotionPanel) {
      this.promotionPanel.destroy();
    }

    // 根據工人類型確定可用的晉升選項
    const promotionOptions = this.getPromotionOptions(workerType);

    // 創建晉升面板
    this.promotionPanel = this.scene.add.container(400, 300);

    // 創建背景
    const background = this.scene.add.rectangle(0, 0, 400, 300, 0x1a1a1a, 0.95)
      .setStrokeStyle(1, 0x4a4a4a);

    // 添加標題
    const title = this.scene.add.text(0, -130, '選擇晉升路徑', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 添加關閉按鈕
    const closeBtn = new Button(this.scene, 180, -130, 'X', {
      width: 30,
      height: 30,
      backgroundColor: 0x4a4a4a,
      onClick: () => {
        this.promotionPanel.destroy();
        this.promotionPanel = null;
      }
    });

    // 添加晉升選項
    const optionElements = [];

    promotionOptions.forEach((option, index) => {
      const yPos = -80 + (index * 70);

      // 目標工人名稱
      const nameText = this.scene.add.text(-150, yPos, `升級為: ${option.displayName}`, {
        fontSize: '16px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      // 資源需求
      let resourceText = '需要資源: ';
      for (const [resource, amount] of Object.entries(option.resources)) {
        resourceText += `${this.getResourceDisplayName(resource)} x${amount} `;
      }

      const reqText = this.scene.add.text(-150, yPos + 20, resourceText, {
        fontSize: '14px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 確認按鈕
      const confirmBtn = new Button(this.scene, 120, yPos, '確認晉升', {
        width: 100,
        height: 40,
        backgroundColor: 0x2d6a4a,
        onClick: () => this.promoteWorker(workerType, option.type)
      });

      optionElements.push(nameText, reqText, ...confirmBtn.getElements());
    });

    // 添加所有元素到面板
    this.promotionPanel.add([background, title, ...closeBtn.getElements(), ...optionElements]);
  }

  /**
   * 獲取晉升選項
   * @param {string} workerType - 工人類型
   * @returns {Array} - 晉升選項列表
   */
  getPromotionOptions(workerType) {
    const options = [];
    const classPromotionRequirements = this.scene.populationSystem.classPromotionRequirements;

    switch (workerType) {
      case 'worker':
        // 工人可以升級為技工
        options.push({
          type: 'technician',
          displayName: this.scene.populationSystem.workerTypes.technician.displayName,
          resources: classPromotionRequirements.worker_to_technician.resources
        });
        break;

      case 'technician':
        // 技工可以升級為工匠
        options.push({
          type: 'artisan',
          displayName: this.scene.populationSystem.workerTypes.artisan.displayName,
          resources: classPromotionRequirements.technician_to_artisan.resources
        });
        break;

      case 'technical_staff':
        // 技術人員可以升級為工程師
        options.push({
          type: 'engineer',
          displayName: this.scene.populationSystem.workerTypes.engineer.displayName,
          resources: classPromotionRequirements.technical_staff_to_engineer.resources
        });
        break;

      case 'accountant':
        // 會計可以升級為老闆
        options.push({
          type: 'boss',
          displayName: this.scene.populationSystem.workerTypes.boss.displayName,
          resources: classPromotionRequirements.accountant_to_boss.resources
        });
        break;

      case 'magic_technician':
        // 魔法技工可以升級為老闆
        options.push({
          type: 'boss',
          displayName: this.scene.populationSystem.workerTypes.boss.displayName,
          resources: classPromotionRequirements.magic_technician_to_boss.resources
        });
        break;
    }

    return options;
  }

  /**
   * 晉升工人
   * @param {string} fromType - 原工人類型
   * @param {string} toType - 目標工人類型
   */
  promoteWorker(fromType, toType) {
    // 嘗試晉升工人
    const success = this.scene.populationSystem.promoteWorker(
      fromType,
      toType,
      this.scene.resources.resources
    );

    if (success) {
      // 關閉晉升面板
      if (this.promotionPanel) {
        this.promotionPanel.destroy();
        this.promotionPanel = null;
      }

      // 更新工人面板
      this.createWorkerPanel();
    } else {
      // 顯示錯誤消息
      const errorText = this.scene.add.text(400, 200, '資源不足或沒有足夠的工人', {
        fontSize: '16px',
        fill: '#ff0000',
        backgroundColor: '#000000'
      }).setOrigin(0.5, 0);

      // 2秒後消失
      this.scene.time.delayedCall(2000, () => {
        errorText.destroy();
      });
    }
  }

  /**
   * 訓練工人
   * @param {string} workerType - 工人類型
   */
  trainWorker(workerType) {
    // 嘗試訓練工人
    const success = this.scene.populationSystem.trainWorkers(workerType, 1, this.scene.resources.resources);

    if (success) {
      // 更新工人面板
      this.createWorkerPanel();
    } else {
      // 顯示錯誤消息
      const errorText = this.scene.add.text(400, 200, '資源不足或沒有足夠的工人', {
        fontSize: '16px',
        fill: '#ff0000',
        backgroundColor: '#000000'
      }).setOrigin(0.5, 0);

      // 2秒後消失
      this.scene.time.delayedCall(2000, () => {
        errorText.destroy();
      });
    }
  }

  /**
   * 顯示吸引移民面板
   * @param {string} targetClass - 目標階層 ('lower', 'middle' 或 'upper')
   */
  showAttractImmigrantsPanel(targetClass) {
    // 如果已存在移民面板，先移除
    if (this.immigrantsPanel) {
      this.immigrantsPanel.destroy();
      this.immigrantsPanel = null;
      return;
    }

    // 創建面板
    this.immigrantsPanel = this.scene.add.container(400, 300);

    // 創建背景
    const background = this.scene.add.rectangle(0, 0, 400, 300, 0x1a1a1a, 0.95)
      .setStrokeStyle(1, 0x4a4a4a);

    // 添加標題
    const title = this.scene.add.text(0, -130, `吸引${this.getClassDisplayName(targetClass)}移民`, {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 添加關閉按鈕
    const closeBtn = new Button(this.scene, 180, -130, 'X', {
      width: 30,
      height: 30,
      backgroundColor: 0x4a4a4a,
      fontSize: '18px',
      onClick: () => {
        this.immigrantsPanel.destroy();
        this.immigrantsPanel = null;
      }
    });

    // 添加說明文字
    // 下層移民每人需要 20 金幣，中層移民每人需要 50 金幣，上層移民每人需要 200 金幣
    let costPerImmigrant;
    if (targetClass === 'lower') {
      costPerImmigrant = 20;
    } else if (targetClass === 'middle') {
      costPerImmigrant = 50;
    } else { // upper
      costPerImmigrant = 200;
    }

    const infoText = this.scene.add.text(0, -90, `吸引${this.getClassDisplayName(targetClass)}移民\n每位移民需要 ${costPerImmigrant} 金幣`, {
      fontSize: '16px',
      fill: '#e0e0e0',
      align: 'center'
    }).setOrigin(0.5, 0);

    // 添加金幣顯示
    const playerGold = this.scene.playerGold || 0;
    const goldText = this.scene.add.text(0, -40, `目前擁有金幣: ${Math.floor(playerGold)}`, {
      fontSize: '16px',
      fill: '#ffdd00',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 添加數量輸入框
    const amountLabel = this.scene.add.text(-100, 0, '移民數量:', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);

    let selectedAmount = 1;

    const amountInput = this.scene.add.rectangle(0, 0, 100, 30, 0x2d2d2d)
      .setInteractive()
      .on('pointerdown', () => {
        // 彈出輸入框
        this.scene.input.keyboard.createTextInput({
          onTextChanged: (text) => {
            // 限制只能輸入數字
            const numericText = text.replace(/[^0-9]/g, '');
            selectedAmount = parseInt(numericText) || 1;
            amountText.setText(selectedAmount.toString());
            updatePreview();
          }
        });
      });

    const amountText = this.scene.add.text(0, 0, '1', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 添加快速選擇按鈕
    const quickButtons = [];
    const quickAmounts = [1, 5, 10, 20];
    let xPos = 50;

    quickAmounts.forEach(amount => {
      const quickButton = this.scene.add.rectangle(xPos, 0, 40, 20, 0x4a4a6a)
        .setInteractive()
        .on('pointerdown', () => {
          selectedAmount = amount;
          amountText.setText(selectedAmount.toString());
          updatePreview();
        });

      const quickText = this.scene.add.text(xPos, 0, amount.toString(), {
        fontSize: '12px',
        fill: '#ffffff'
      }).setOrigin(0.5, 0.5);

      quickButtons.push(quickButton, quickText);
      xPos += 45;
    });

    // 添加預覽區域
    const previewBackground = this.scene.add.rectangle(0, 50, 350, 60, 0x2d2d2d, 0.7);

    const previewText = this.scene.add.text(0, 50, '選擇移民數量以查看預計成本', {
      fontSize: '14px',
      fill: '#cccccc',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    // 更新預覽函數
    const updatePreview = () => {
      const totalCost = selectedAmount * costPerImmigrant;
      const canAfford = playerGold >= totalCost;

      // 檢查住房容量
      const availableHousing = this.scene.populationSystem.housingCapacity - this.scene.populationSystem.totalPopulation;
      const housingLimited = selectedAmount > availableHousing;

      if (housingLimited) {
        previewText.setText(`住房容量不足！最多可吸引 ${availableHousing} 名移民`);
        return;
      }

      if (!canAfford) {
        previewText.setText(`金幣不足！需要 ${totalCost} 金幣\n目前只有 ${Math.floor(playerGold)} 金幣`);
      } else {
        previewText.setText(`吸引 ${selectedAmount} 名 ${this.getClassDisplayName(targetClass)} 移民\n預計成本: ${totalCost} 金幣`);
      }
    };

    // 初始化預覽
    updatePreview();

    // 添加確認按鈕
    const confirmBtn = new Button(this.scene, 0, 100, '確認吸引', {
      width: 120,
      height: 30,
      backgroundColor: 0x4a6a4a,
      onClick: () => {
        // 嘗試吸引移民
        const result = this.scene.populationSystem.attractImmigrants(
          targetClass,
          selectedAmount,
          this.scene.playerGold
        );

        if (result.success) {
          // 更新金幣
          this.scene.playerGold = result.remainingGold;

          // 顯示成功消息
          previewText.setText(result.message);

          // 更新金幣顯示
          goldText.setText(`目前擁有金幣: ${Math.floor(this.scene.playerGold)}`);

          // 更新工人面板
          setTimeout(() => {
            this.createWorkerPanel();
            this.immigrantsPanel.destroy();
            this.immigrantsPanel = null;
          }, 1500);
        } else {
          // 顯示錯誤消息
          previewText.setText(result.message);
        }
      }
    });

    // 添加所有元素到面板
    this.immigrantsPanel.add([
      background, title, ...closeBtn.getElements(), infoText, goldText,
      amountLabel, amountInput, amountText,
      ...quickButtons,
      previewBackground, previewText,
      ...confirmBtn.getElements()
    ]);
  }

  /**
   * 獲取階層的顯示名稱
   * @param {string} className - 階層名稱
   * @returns {string} - 顯示名稱
   */
  getClassDisplayName(className) {
    const classNames = {
      'lower': '下層階級',
      'middle': '中層階級',
      'upper': '上層階級'
    };
    return classNames[className] || className;
  }

  /**
   * 获取资源颜色（使用ResourcePanel类的方法）
   * @param {string} resourceType - 资源类型
   * @returns {number} - 十六进制颜色值
   */
  getColorForResource(resourceType) {
    // 创建一个临时ResourcePanel实例或使用现有实例
    if (this.resourcePanel) {
      return this.resourcePanel.getColorForResource(resourceType);
    }
    // 如果没有现有实例，返回默认颜色
    return 0xCCCCCC;
  }

  /**
   * 获取资源显示名称（使用ResourcePanel类的方法）
   * @param {string} resourceType - 资源类型
   * @returns {string} - 格式化的显示名称
   */
  getResourceDisplayName(resourceType) {
    // 创建一个临时ResourcePanel实例或使用现有实例
    if (this.resourcePanel) {
      return this.resourcePanel.getResourceDisplayName(resourceType);
    }
    // 如果没有现有实例，返回默认名称
    return resourceType.replace('_', ' ');
  }

  /**
   * 創建市場面板
   */
  createMarketPanel() {
    // 使用新的MarketPanel类创建面板
    this.marketPanel = new MarketPanel(this.scene);
    this.marketPanel.show();
  }

  /**
   * 切換市場面板顯示/隱藏
   */
  toggleMarketPanel() {
    if (this.marketPanel && this.marketPanel.container.visible) {
      this.marketPanel.hide();
    } else {
      this.createMarketPanel();
    }
  }

  /**
   * 創建研究面板
   */
  createResearchPanel() {
    // 如果已存在，先移除
    if (this.researchPanel) {
      this.researchPanel.destroy();
    }

    // 創建新的研究面板
    this.researchPanel = new ResearchPanel(this.scene);
    this.researchPanel.show();

    return this.researchPanel;
  }

  // 移除handleResearchPanelDrag方法，因为拖拽功能已经在BasePanel中实现

  /**
   * 切換研究面板顯示/隱藏
   */
  toggleResearchPanel() {
    // 使用ResearchPanel的静态方法切换面板
    this.researchPanel = ResearchPanel.togglePanel(this.scene);
  }

  /**
   * 開始研究
   * @param {string} techId - 技術ID
   */
  startResearch(techId) {
    // 如果研究面板存在，使用其方法開始研究
    if (this.researchPanel) {
      this.researchPanel.startResearch(techId);
    } else {
      // 如果面板不存在，先創建面板
      this.createResearchPanel();
      this.researchPanel.startResearch(techId);
    }
  }

  // 移除handleWorkerPanelDrag方法，因为拖拽功能已经在BasePanel中实现

  // 移除handleMarketPanelDrag方法，因为拖拽功能已经在BasePanel中实现

  // 移除handleResourcePanelDrag方法，因为拖拽功能已经在BasePanel中实现

  /**
   * 獲取階層顯示名稱
   * @param {string} className - 階層代碼
   * @returns {string} - 顯示名稱
   */
  getClassDisplayName(className) {
    const nameMap = {
      'lower': '底層市民',
      'middle': '中層自由民',
      'upper': '上層貴族'
    };

    return nameMap[className] || className;
  }

  /**
   * 獲取商品顯示名稱
   * @param {string} goodType - 商品類型
   * @returns {string} - 顯示名稱
   */
  getGoodDisplayName(goodType) {
    const nameMap = {
      'food': '食物',
      'basic_goods': '基本物資',
      'luxury_goods': '奢侈品',
      'magical_items': '魔法物品'
    };

    return nameMap[goodType] || goodType;
  }

  /**
   * 顯示市場資源交易面板（合併買賣功能）
   */
  showMarketResourcePanel() {
    // 使用新的MarketResourcePanel类创建面板
    new MarketResourcePanel(this.scene).show();
  }

}
