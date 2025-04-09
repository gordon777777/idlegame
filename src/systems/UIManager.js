import Phaser from 'phaser';

export default class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.resourcePanel = null;
    this.buildingMenu = null;
    this.infoPanel = null;
    this.populationPanel = null;
    this.workerPanel = null;
    this.marketPanel = null;
    this.promotionPanel = null;
  }

  createResourcePanel(config) {
    const { position, resources } = config;

    this.resourcePanel = this.scene.add.container(position.x, position.y);
    // Make the panel wider and taller to accommodate the new icons
    const panelWidth = resources.length * 120 + 20; // 120 pixels per resource + padding
    const panelHeight = 100; // Increased height to prevent text overlap
    const background = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a1a, 0.8)
      .setStrokeStyle(1, 0x4a4a4a);
    background.setPosition(panelWidth / 2 - position.x, 0); // Center the background

    resources.forEach((resource, index) => {
      let icon;
      const iconKey = `${resource}_icon`;
      const frameKey = `${resource}_icon`;

      // Try to use the materials sprite sheet first
      if (this.scene.textures.exists('materials')) {
        // Check if the frame exists in the materials atlas
        if (this.scene.textures.get('materials').has(frameKey)) {
          icon = this.scene.add.image(60 + (index * 120), 30, 'materials', frameKey)
            .setScale(0.5); // Scale down as these are 64x64 icons
          console.log(`Using sprite sheet icon for ${resource}`);
        } else {
          // Fall back to individual texture if it exists
          if (this.scene.textures.exists(iconKey)) {
            icon = this.scene.add.image(60 + (index * 120), 30, iconKey).setScale(0.8);
            console.log(`Using individual icon for ${resource}`);
          } else {
            // Create a colored rectangle as a last resort
            icon = this.scene.add.rectangle(60 + (index * 120), 30, 30, 30, this.getColorForResource(resource));
            console.log(`Using placeholder for ${resource}`);
          }
        }
      } else {
        // Fall back to individual texture if it exists
        if (this.scene.textures.exists(iconKey)) {
          icon = this.scene.add.image(50 + (index * 100), 20, iconKey).setScale(0.8);
          console.log(`Using individual icon for ${resource}`);
        } else {
          // Create a colored rectangle as a last resort
          icon = this.scene.add.rectangle(60 + (index * 120), 30, 30, 30, this.getColorForResource(resource));
          console.log(`Using placeholder for ${resource}`);
        }
      }

      // Add resource value text below the icon
      const text = this.scene.add.text(icon.x, icon.y + 25, '0', {
        fontSize: '18px',
        fill: '#e0e0e0',
        align: 'center'
      }).setOrigin(0.5, 0);

      // Add resource name text with word wrap to prevent overlap
      const nameText = this.scene.add.text(icon.x, icon.y - 35, this.getResourceDisplayName(resource), {
        fontSize: '14px',
        fill: '#a0a0a0',
        align: 'center',
        wordWrap: { width: 110 }
      }).setOrigin(0.5, 0);

      // Set the name property for the text to identify it later
      text.name = resource;

      this.resourcePanel.add([icon, text, nameText]);

      // Add the background only once (for the first resource)
      if (index === 0) {
        this.resourcePanel.add(background);
        // Send the background to the back
        background.setDepth(-1);
      }
    });
  }

  createBuildingMenu(config) {
    const { position, buildings } = config;

    this.buildingMenu = this.scene.add.container(position.x, position.y);
    const background = this.scene.add.rectangle(0, 0, 200, 400, 0x1a1a1a, 0.8)
      .setStrokeStyle(1, 0x4a4a4a);

    // Add the background only once
    this.buildingMenu.add(background);

    // Add a title
    const title = this.scene.add.text(0, -180, '建築選單', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    this.buildingMenu.add(title);

    buildings.forEach((building, index) => {
      const button = this.scene.add.rectangle(0, -130 + (index * 60), 160, 50, 0x2d2d2d)
        .setInteractive()
        .on('pointerdown', () => this.handleBuildingSelect(building));

      const text = this.scene.add.text(0, -130 + (index * 60), building, {
        fontSize: '16px',
        fill: '#e0e0e0'
      }).setOrigin(0.5, 0.5);

      this.buildingMenu.add([button, text]);
    });
  }

  showBuildingInfo(buildingInfo) {
    if (this.infoPanel) this.infoPanel.destroy();

    this.infoPanel = this.scene.add.container(400, 100);
    const background = this.scene.add.rectangle(0, 0, 300, 200, 0x1a1a1a, 0.9)
      .setStrokeStyle(1, 0x4a4a4a);

    // Add title
    const title = this.scene.add.text(0, -80, buildingInfo.name, {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // Add close button
    const closeButton = this.scene.add.rectangle(140, -80, 30, 30, 0x4a4a4a)
      .setInteractive()
      .on('pointerdown', () => this.closeBuildingInfo());

    const closeText = this.scene.add.text(140, -80, 'X', {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // Add level
    const levelText = this.scene.add.text(0, -50, `等級: ${buildingInfo.level}`, {
      fontSize: '16px',
      fill: '#e0e0e0'
    }).setOrigin(0.5, 0);

    // Add efficiency
    const efficiencyText = this.scene.add.text(0, -30, `效率: ${(buildingInfo.efficiency * 100).toFixed(0)}%`, {
      fontSize: '16px',
      fill: '#e0e0e0'
    }).setOrigin(0.5, 0);

    // Add recipe info
    let recipeText = '';

    if (Object.keys(buildingInfo.recipe.input).length > 0) {
      recipeText += '消耗: ';
      Object.entries(buildingInfo.recipe.input).forEach(([resource, amount]) => {
        recipeText += `${this.getResourceDisplayName(resource)} x${amount} `;
      });
    }

    recipeText += '\n產出: ';
    Object.entries(buildingInfo.recipe.output).forEach(([resource, amount]) => {
      recipeText += `${this.getResourceDisplayName(resource)} x${amount} `;
    });

    const recipe = this.scene.add.text(0, -10, recipeText, {
      fontSize: '14px',
      fill: '#e0e0e0',
      align: 'center'
    }).setOrigin(0.5, 0);

    // Add production time
    const productionTime = (buildingInfo.productionInterval / 1000).toFixed(1);
    const timeText = this.scene.add.text(0, 30, `生產時間: ${productionTime} 秒`, {
      fontSize: '14px',
      fill: '#e0e0e0'
    }).setOrigin(0.5, 0);

    // Add upgrade button
    const upgradeButton = this.scene.add.rectangle(0, 70, 120, 30, 0x4a4a4a)
      .setInteractive()
      .on('pointerdown', () => this.handleBuildingUpgrade(buildingInfo.id));

    const upgradeText = this.scene.add.text(0, 70, '升級', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    this.infoPanel.add([background, title, closeButton, closeText, levelText, efficiencyText, recipe, timeText, upgradeButton, upgradeText]);
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
   * 關閉建築信息面板
   */
  closeBuildingInfo() {
    if (this.infoPanel) {
      this.infoPanel.destroy();
      this.infoPanel = null;

      // 清除建築系統中的選中建築
      if (this.scene.buildingSystem) {
        this.scene.buildingSystem.selectedBuilding = null;
      }
    }
  }

  updateResources(resources) {
    this.resourcePanel.each((child) => {
      if (child instanceof Phaser.GameObjects.Text && child.name && resources[child.name]) {
        const resourceType = child.name;
        // Format the number with commas for thousands
        const formattedValue = Math.floor(resources[resourceType].value).toLocaleString();
        child.setText(formattedValue);

        // Add a production rate indicator if production is non-zero
        if (resources[resourceType].production > 0) {
          const productionRate = resources[resourceType].production.toFixed(1);
          child.setText(`${formattedValue}\n+${productionRate}/s`);
        }
      }
    });
  }

  /**
   * 創建人口面板
   * @param {Object} config - 面板配置
   */
  createPopulationPanel(config) {
    const { position } = config;

    // 如果已存在，先移除
    if (this.populationPanel) {
      this.populationPanel.destroy();
    }

    this.populationPanel = this.scene.add.container(position.x, position.y);

    // 創建背景 - 增加面板高度以防止文本被覆蓋
    const background = this.scene.add.rectangle(0, 0, 200, 150, 0x1a1a1a, 0.8)
      .setStrokeStyle(1, 0x4a4a4a);
    background.setPosition(100, 0); // Center the background

    // 添加標題
    const title = this.scene.add.text(100, 10, '人口統計', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 初始化人口文本 - 調整位置以避免重疊
    const populationText = this.scene.add.text(100, 40, '總人口: 0', {
      fontSize: '14px',
      fill: '#e0e0e0'
    }).setOrigin(0.5, 0);

    const housingText = this.scene.add.text(100, 65, '住房容量: 0', {
      fontSize: '14px',
      fill: '#e0e0e0'
    }).setOrigin(0.5, 0);

    const happinessText = this.scene.add.text(100, 90, '幸福度: 0%', {
      fontSize: '14px',
      fill: '#e0e0e0'
    }).setOrigin(0.5, 0);

    // 添加查看工人按鈕 - 向下移動以留出更多空間
    const viewWorkersButton = this.scene.add.rectangle(60, 120, 80, 30, 0x4a4a4a)
      .setInteractive()
      .on('pointerdown', () => this.toggleWorkerPanel());

    const buttonText = this.scene.add.text(60, 120, '管理工人', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 添加市場按鈕
    const marketButton = this.scene.add.rectangle(150, 120, 80, 30, 0x4a6a4a)
      .setInteractive()
      .on('pointerdown', () => this.toggleMarketPanel());

    const marketButtonText = this.scene.add.text(150, 120, '查看市場', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 將元素添加到容器中
    this.populationPanel.add([background, title, populationText, housingText, happinessText, viewWorkersButton, buttonText, marketButton, marketButtonText]);

    // 存儲引用以便更新
    this.populationPanel.populationText = populationText;
    this.populationPanel.housingText = housingText;
    this.populationPanel.happinessText = happinessText;
  }

  /**
   * 更新人口面板
   * @param {Object} stats - 人口統計信息
   */
  updatePopulationPanel(stats) {
    if (!this.populationPanel) return;

    this.populationPanel.populationText.setText(`總人口: ${stats.total}`);
    this.populationPanel.housingText.setText(`住房容量: ${stats.capacity}`);

    // 更新總體幸福度
    const happinessColor = this.getHappinessColor(stats.happiness);
    this.populationPanel.happinessText.setText(`幸福度: ${stats.happiness}%`).setFill(happinessColor);
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
    if (this.workerPanel && this.workerPanel.visible) {
      this.workerPanel.visible = false;
    } else {
      this.createWorkerPanel();
    }
  }

  /**
   * 創建工人管理面板
   */
  createWorkerPanel() {
    // 如果已存在，先移除
    if (this.workerPanel) {
      this.workerPanel.destroy();
    }

    // 獲取人口統計
    const stats = this.scene.populationSystem.getPopulationStats();

    // 創建面板
    this.workerPanel = this.scene.add.container(400, 300);

    // 創建背景
    const background = this.scene.add.rectangle(0, 0, 600, 500, 0x1a1a1a, 0.9)
      .setStrokeStyle(1, 0x4a4a4a);

    // 添加標題
    const title = this.scene.add.text(0, -230, '工人管理', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 添加關閉按鈕
    const closeButton = this.scene.add.rectangle(280, -230, 30, 30, 0x4a4a4a)
      .setInteractive()
      .on('pointerdown', () => this.toggleWorkerPanel());

    const closeText = this.scene.add.text(280, -230, 'X', {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 添加階層信息
    const classElements = [];
    const classTitle = this.scene.add.text(-280, -200, '人口階層', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    classElements.push(classTitle);

    // 添加每個階層的信息
    let classYPos = -170;
    for (const [className, classData] of Object.entries(stats.socialClasses)) {
      // 階層名稱
      const classNameText = this.scene.add.text(-280, classYPos, `${classData.name}:`, {
        fontSize: '16px',
        fill: '#e0e0e0',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      // 人口數量
      const classCountText = this.scene.add.text(-200, classYPos, `${classData.count} (${classData.percentage})`, {
        fontSize: '16px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 幸福度
      const happinessColor = this.getHappinessColor(classData.happiness || 50);
      const happinessText = this.scene.add.text(-50, classYPos, `幸福度: ${classData.happiness || 50}%`, {
        fontSize: '16px',
        fill: happinessColor
      }).setOrigin(0, 0.5);

      // 階層描述
      const classDescText = this.scene.add.text(80, classYPos, classData.description, {
        fontSize: '14px',
        fill: '#cccccc',
        wordWrap: { width: 200 }
      }).setOrigin(0, 0.5);

      classElements.push(classNameText, classCountText, happinessText, classDescText);

      // 如果有需求信息，顯示需求滿足情況
      if (classData.demands && Object.keys(classData.demands).length > 0) {
        classYPos += 25;

        // 需求標題
        const demandsTitle = this.scene.add.text(-260, classYPos, '需求滿足情況:', {
          fontSize: '14px',
          fill: '#cccccc',
          fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        classElements.push(demandsTitle);
        classYPos += 20;

        // 顯示每種需求的滿足情況
        for (const [demandType, demandInfo] of Object.entries(classData.demands)) {
          const demandNameText = this.scene.add.text(-240, classYPos, demandInfo.displayName, {
            fontSize: '12px',
            fill: '#e0e0e0'
          }).setOrigin(0, 0.5);

          // 滿足率
          const satisfactionColor = this.getSatisfactionColor(demandInfo.satisfaction);
          const satisfactionText = this.scene.add.text(-120, classYPos, `滿足: ${demandInfo.satisfaction}`, {
            fontSize: '12px',
            fill: satisfactionColor
          }).setOrigin(0, 0.5);

          // 價格適宜度
          const priceColor = this.getSatisfactionColor(demandInfo.priceScore);
          const priceText = this.scene.add.text(-20, classYPos, `價格: ${demandInfo.priceScore}`, {
            fontSize: '12px',
            fill: priceColor
          }).setOrigin(0, 0.5);

          // 影響
          const impactColor = demandInfo.impact >= 0 ? '#99ff99' : '#ff9999';
          const impactText = this.scene.add.text(80, classYPos, `影響: ${demandInfo.impact > 0 ? '+' : ''}${demandInfo.impact}`, {
            fontSize: '12px',
            fill: impactColor
          }).setOrigin(0, 0.5);

          classElements.push(demandNameText, satisfactionText, priceText, impactText);
          classYPos += 15;
        }
      }

      classYPos += 30;
    }

    // 添加工人類型列表標題
    const workersTitle = this.scene.add.text(-280, -80, '工人類型', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    classElements.push(workersTitle);

    // 添加工人類型列表
    const workerTypes = Object.entries(stats.workers);
    const workerElements = [];

    workerTypes.forEach(([type, data], index) => {
      const yPos = -40 + (index * 60);

      // 工人名稱和階層
      const nameText = this.scene.add.text(-280, yPos, data.displayName, {
        fontSize: '16px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      // 階層標識
      const classLabel = this.scene.add.text(-200, yPos, `[${stats.socialClasses[data.socialClass].name}]`, {
        fontSize: '14px',
        fill: this.getClassColor(data.socialClass)
      }).setOrigin(0, 0.5);

      // 工人數量
      const countText = this.scene.add.text(-280, yPos + 20, `數量: ${data.count} (可用: ${data.available})`, {
        fontSize: '14px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 經驗值
      const expText = this.scene.add.text(-120, yPos + 20, `經驗: ${data.experience}`, {
        fontSize: '14px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 工人描述
      const descText = this.scene.add.text(-20, yPos, data.description, {
        fontSize: '14px',
        fill: '#cccccc',
        wordWrap: { width: 250 }
      }).setOrigin(0, 0.5);

      // 訓練按鈕
      if (type !== 'peasant') { // 農民不需要訓練
        const trainButton = this.scene.add.rectangle(230, yPos, 80, 30, 0x4a4a4a)
          .setInteractive()
          .on('pointerdown', () => this.trainWorker(type));

        const trainText = this.scene.add.text(230, yPos, '訓練', {
          fontSize: '14px',
          fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        workerElements.push(trainButton, trainText);
      }

      // 晉升按鈕
      if (data.canPromote) {
        const promoteButton = this.scene.add.rectangle(230, yPos + 20, 80, 20, 0x2d6a4a)
          .setInteractive()
          .on('pointerdown', () => this.showPromotionOptions(type));

        const promoteText = this.scene.add.text(230, yPos + 20, '晉升', {
          fontSize: '12px',
          fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        workerElements.push(promoteButton, promoteText);
      }

      workerElements.push(nameText, classLabel, countText, expText, descText);
    });

    // 添加所有元素到面板
    this.workerPanel.add([background, title, closeButton, closeText, ...classElements, ...workerElements]);
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
    const closeButton = this.scene.add.rectangle(180, -130, 30, 30, 0x4a4a4a)
      .setInteractive()
      .on('pointerdown', () => {
        this.promotionPanel.destroy();
        this.promotionPanel = null;
      });

    const closeText = this.scene.add.text(180, -130, 'X', {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

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
      const confirmButton = this.scene.add.rectangle(120, yPos, 100, 40, 0x2d6a4a)
        .setInteractive()
        .on('pointerdown', () => this.promoteWorker(workerType, option.type));

      const confirmText = this.scene.add.text(120, yPos, '確認晉升', {
        fontSize: '14px',
        fill: '#ffffff'
      }).setOrigin(0.5, 0.5);

      optionElements.push(nameText, reqText, confirmButton, confirmText);
    });

    // 添加所有元素到面板
    this.promotionPanel.add([background, title, closeButton, closeText, ...optionElements]);
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
      case 'peasant':
        // 農民可以升級為礦工或伐木工
        options.push({
          type: 'miner',
          displayName: this.scene.populationSystem.workerTypes.miner.displayName,
          resources: classPromotionRequirements.peasant_to_miner.resources
        });

        options.push({
          type: 'woodcutter',
          displayName: this.scene.populationSystem.workerTypes.woodcutter.displayName,
          resources: classPromotionRequirements.peasant_to_woodcutter.resources
        });
        break;

      case 'craftsman':
        // 工匠可以升級為學者或法師學徒
        options.push({
          type: 'scholar',
          displayName: this.scene.populationSystem.workerTypes.scholar.displayName,
          resources: classPromotionRequirements.craftsman_to_scholar.resources
        });

        options.push({
          type: 'wizard_apprentice',
          displayName: this.scene.populationSystem.workerTypes.wizard_apprentice.displayName,
          resources: classPromotionRequirements.craftsman_to_wizard_apprentice.resources
        });
        break;

      case 'scholar':
        // 學者可以升級為法師
        options.push({
          type: 'wizard',
          displayName: this.scene.populationSystem.workerTypes.wizard.displayName,
          resources: classPromotionRequirements.scholar_to_wizard.resources
        });
        break;

      case 'wizard_apprentice':
        // 法師學徒可以升級為法師
        options.push({
          type: 'wizard',
          displayName: this.scene.populationSystem.workerTypes.wizard.displayName,
          resources: classPromotionRequirements.wizard_apprentice_to_wizard.resources
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
      const errorText = this.scene.add.text(400, 200, '資源不足或沒有足夠的農民', {
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
   * Get a color for a resource type to use as placeholder
   * @param {string} resourceType - The type of resource
   * @returns {number} - Hexadecimal color value
   */
  getColorForResource(resourceType) {
    const colorMap = {
      'magic_ore': 0x9966CC,      // Purple for magic
      'enchanted_wood': 0x7CFC00, // Green for wood
      'arcane_crystal': 0x00BFFF, // Blue for crystal
      'arcane_essence': 0xAA66FF, // Bright purple for arcane essence
      'mystic_planks': 0x99FF66, // Bright green for mystic planks
      'refined_crystal': 0x66FFFF, // Bright blue for refined crystal
      'magical_potion': 0xFF66FF, // Pink for magical potion
      'enchanted_artifact': 0xFFFF66, // Yellow for enchanted artifact
      'magical_construct': 0xFF9966, // Orange for magical construct
    };

    return colorMap[resourceType] || 0xCCCCCC; // Default to gray if not found
  }

  /**
   * Get a display name for a resource type
   * @param {string} resourceType - The type of resource
   * @returns {string} - Formatted display name
   */
  getResourceDisplayName(resourceType) {
    const nameMap = {
      'magic_ore': 'Magic',
      'enchanted_wood': 'Wood',
      'arcane_crystal': 'Crystal',
      'mana': 'Mana',
      'arcane_essence': 'Essence',
      'mystic_planks': 'Planks',
      'refined_crystal': 'Refined',
      'magical_potion': 'Potion',
      'enchanted_artifact': 'Artifact',
      'magical_construct': 'Construct',
    };

    return nameMap[resourceType] || resourceType.replace('_', ' ');
  }

  /**
   * 創建市場面板
   */
  createMarketPanel() {
    // 如果已存在，先移除
    if (this.marketPanel) {
      this.marketPanel.destroy();
    }

    // 獲取市場統計
    const marketStats = this.scene.marketSystem.getMarketStats();

    // 創建面板
    this.marketPanel = this.scene.add.container(400, 300);

    // 創建背景 - 增加面板高度以容納更多內容
    const background = this.scene.add.rectangle(0, 0, 700, 550, 0x1a1a1a, 0.9)
      .setStrokeStyle(1, 0x4a4a4a);

    // 添加標題
    const title = this.scene.add.text(0, -250, '市場統計', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 添加關閉按鈕
    const closeButton = this.scene.add.rectangle(330, -250, 30, 30, 0x4a4a4a)
      .setInteractive()
      .on('pointerdown', () => this.toggleMarketPanel());

    const closeText = this.scene.add.text(330, -250, 'X', {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 添加市場價格標題
    const priceTitle = this.scene.add.text(-330, -210, '資源價格', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // 添加資源價格列表
    const priceElements = [];
    let yPos = -180;

    // 按照資源層級分組顯示價格
    const resourcesByTier = {};

    for (const [resource, priceInfo] of Object.entries(marketStats.prices)) {
      const resourceObj = this.scene.resources.resources[resource];
      if (!resourceObj) continue;

      const tier = resourceObj.tier || 1;
      if (!resourcesByTier[tier]) resourcesByTier[tier] = [];

      resourcesByTier[tier].push({ resource, priceInfo });
    }

    // 按層級顯示資源價格
    for (let tier = 1; tier <= 4; tier++) {
      if (!resourcesByTier[tier] || resourcesByTier[tier].length === 0) continue;

      // 添加層級標題
      const tierTitle = this.scene.add.text(-330, yPos, `第 ${tier} 層資源`, {
        fontSize: '16px',
        fill: '#cccccc',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      priceElements.push(tierTitle);
      yPos += 25;

      // 添加該層級的資源價格
      for (const { resource, priceInfo } of resourcesByTier[tier]) {
        // 資源名稱
        const nameText = this.scene.add.text(-330, yPos, this.getResourceDisplayName(resource), {
          fontSize: '14px',
          fill: '#e0e0e0',
          fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        // 當前價格
        const priceColor = priceInfo.priceRatio > 1.1 ? '#ff6666' : (priceInfo.priceRatio < 0.9 ? '#66ff66' : '#ffffff');
        const priceText = this.scene.add.text(-200, yPos, `價格: ${priceInfo.currentPrice}`, {
          fontSize: '14px',
          fill: priceColor
        }).setOrigin(0, 0.5);

        // 價格變化
        const changeText = this.scene.add.text(-100, yPos, `(${(priceInfo.priceRatio * 100 - 100).toFixed(0)}%)`, {
          fontSize: '14px',
          fill: priceColor
        }).setOrigin(0, 0.5);

        // 供應狀況
        const supplyText = this.scene.add.text(0, yPos, `供應: ${(priceInfo.supply * 100).toFixed(0)}%`, {
          fontSize: '14px',
          fill: '#e0e0e0'
        }).setOrigin(0, 0.5);

        priceElements.push(nameText, priceText, changeText, supplyText);
        yPos += 25; // 增加行間距
      }

      yPos += 15; // 層級之間的額外空間
    }

    // 添加需求信息標題
    const demandTitle = this.scene.add.text(-330, yPos, '人口需求', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    priceElements.push(demandTitle);
    yPos += 30;

    // 添加每個階層的需求信息
    for (const [className, demands] of Object.entries(marketStats.demands)) {
      // 階層名稱
      const classNameText = this.scene.add.text(-330, yPos, this.getClassDisplayName(className), {
        fontSize: '16px',
        fill: this.getClassColor(className)
      }).setOrigin(0, 0.5);

      priceElements.push(classNameText);
      yPos += 20;

      // 添加該階層的需求列表
      for (const [goodType, demandInfo] of Object.entries(demands)) {
        // 商品名稱
        const goodNameText = this.scene.add.text(-310, yPos, demandInfo.displayName || this.getGoodDisplayName(goodType), {
          fontSize: '14px',
          fill: '#e0e0e0',
          fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        // 需求量
        const demandText = this.scene.add.text(-180, yPos, `需求: ${demandInfo.demand.toFixed(1)}`, {
          fontSize: '14px',
          fill: '#e0e0e0'
        }).setOrigin(0, 0.5);

        // 基準價格
        const priceText = this.scene.add.text(-80, yPos, `基準價: ${demandInfo.basePrice}`, {
          fontSize: '14px',
          fill: '#e0e0e0'
        }).setOrigin(0, 0.5);

        // 重要性
        const importanceText = this.scene.add.text(20, yPos, `重要性: ${(demandInfo.importance || 0.2).toFixed(2)}`, {
          fontSize: '14px',
          fill: '#e0e0e0'
        }).setOrigin(0, 0.5);

        priceElements.push(goodNameText, demandText, priceText, importanceText);

        // 添加資源對應關係
        const resourceTypes = this.scene.marketSystem.goodsToResources[goodType] || [];
        if (resourceTypes.length > 0) {
          yPos += 20;
          // 限制資源名稱的長度，避免文字溢出
          const resourceNames = resourceTypes.map(r => this.getResourceDisplayName(r));
          const resourcesText = this.scene.add.text(-290, yPos, `所需資源: ${resourceNames.join(', ')}`, {
            fontSize: '12px',
            fill: '#cccccc',
            wordWrap: { width: 350 } // 添加文字換行
          }).setOrigin(0, 0.5);

          priceElements.push(resourcesText);
        }

        yPos += 30; // 增加行間距
      }

      yPos += 15; // 階層之間的額外空間
    }

    // 添加最近交易標題
    const transactionTitle = this.scene.add.text(200, -210, '最近交易', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    priceElements.push(transactionTitle);

    // 添加最近交易列表
    let transactionYPos = -180;
    for (const transaction of marketStats.recentTransactions.slice(-5)) {
      const resourceName = this.getResourceDisplayName(transaction.resourceType);
      const amount = Math.abs(transaction.amount).toFixed(1);
      const direction = transaction.amount < 0 ? '消耗' : '購買';

      // 分兩行顯示交易信息，避免文字重疊
      const transactionText = this.scene.add.text(200, transactionYPos,
        `${resourceName}: ${direction} ${amount}`, {
        fontSize: '14px',
        fill: '#e0e0e0',
        align: 'center'
      }).setOrigin(0.5, 0.5);

      const priceText = this.scene.add.text(200, transactionYPos + 15,
        `@ ${transaction.price}`, {
        fontSize: '14px',
        fill: '#e0e0e0',
        align: 'center'
      }).setOrigin(0.5, 0.5);

      priceElements.push(transactionText, priceText);
      transactionYPos += 35; // 增加行間距
    }

    // 添加所有元素到面板
    this.marketPanel.add([background, title, closeButton, closeText, ...priceElements]);
  }

  /**
   * 切換市場面板顯示/隱藏
   */
  toggleMarketPanel() {
    if (this.marketPanel && this.marketPanel.visible) {
      this.marketPanel.visible = false;
    } else {
      this.createMarketPanel();
    }
  }

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
}