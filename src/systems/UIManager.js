import Phaser from 'phaser';
import Button from '../ui/Button.js';
import TabButton from '../ui/TabButton.js';
import TradeButton from '../ui/TradeButton.js';
import DropdownList from '../ui/DropdownList.js';

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
      const buildingBtn = new Button(this.scene, 0, -130 + (index * 60), building, {
        width: 160,
        height: 50,
        backgroundColor: 0x2d2d2d,
        fontSize: '16px',
        textColor: '#e0e0e0',
        onClick: () => this.handleBuildingSelect(building)
      });

      this.buildingMenu.add(buildingBtn.getElements());
    });
  }

  showBuildingInfo(buildingInfo) {
    if (this.infoPanel) this.infoPanel.destroy();

    this.infoPanel = this.scene.add.container(400, 100);

    // 定义常量以便于调整布局
    const containY = 0; // 内容的基准Y坐标
    const panelWidth = 400;
    const panelHeight = 300; // 进一步减小面板高度

    // 背景矩形
    const background = this.scene.add.rectangle(0, containY, panelWidth, panelHeight, 0x1a1a1a, 0.9)
      .setStrokeStyle(1, 0x4a4a4a);

    // 添加标题栏背景 - 用作拖拉区域
    const titleBar = this.scene.add.rectangle(0, containY - panelHeight/2 + 20, panelWidth, 40, 0x333333)
      .setStrokeStyle(1, 0x555555);

    // 添加拖拽功能
    titleBar.setInteractive({ draggable: true });
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    titleBar.on('dragstart', (pointer) => {
      isDragging = true;
      dragStartX = pointer.x - this.infoPanel.x;
      dragStartY = pointer.y - this.infoPanel.y;
    });

    titleBar.on('drag', (pointer) => {
      if (isDragging) {
        this.infoPanel.x = pointer.x - dragStartX;
        this.infoPanel.y = pointer.y - dragStartY;
      }
    });

    titleBar.on('dragend', () => {
      isDragging = false;
    });

    // Add title
    const title = this.scene.add.text(0, containY - panelHeight/2 + 20, buildingInfo.name, {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    // 直接创建关闭按钮，不使用Button类
    const closeBtnBg = this.scene.add.rectangle(
      panelWidth/2 - 20,
      containY - panelHeight/2 + 20,
      36,
      36,
      0xff4a4a
    ).setStrokeStyle(2, 0xffffff);

    const closeBtnText = this.scene.add.text(
      panelWidth/2 - 20,
      containY - panelHeight/2 + 20,
      'X',
      {
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff'
      }
    ).setOrigin(0.5, 0.5);

    // 添加交互
    closeBtnBg.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.closeBuildingInfo());

    // 创建一个对象来模拟Button类的接口
    const closeBtn = {
      getElements: () => [closeBtnBg, closeBtnText]
    };

    // Add level
    const levelText = this.scene.add.text(0, containY - panelHeight/2 + 60, `等級: ${buildingInfo.level}`, {
      fontSize: '16px',
      fill: '#e0e0e0'
    }).setOrigin(0.5, 0);

    // Add efficiency
    const efficiencyText = this.scene.add.text(0, containY - panelHeight/2 + 80, `效率: ${(buildingInfo.totalEfficiency * 100).toFixed(0)}%`, {
      fontSize: '16px',
      fill: '#e0e0e0'
    }).setOrigin(0.5, 0);

    // 添加工人需求信息
    let workerText = '';
    if (buildingInfo.type !== 'housing' && this.scene.populationSystem) {
      // 获取当前生产方式的工人需求
      const workerReq = buildingInfo.workerRequirement || { count: 0, type: 'worker' };

      // 获取已分配的工人信息
      const assignment = this.scene.populationSystem.workerAssignments.get(buildingInfo.id) || {};

      // 计算已分配的工人总数
      let assignedCount = 0;
      for (const count of Object.values(assignment)) {
        assignedCount += count;
      }

      // 生成工人需求文本
      workerText = '工人需求:\n';
      const workerTypeName = this.scene.populationSystem.workerTypes[workerReq.type]?.displayName || workerReq.type;
      workerText += `${workerTypeName}: ${assignedCount}/${workerReq.count}`;
    }

    const workerInfoText = this.scene.add.text(0, containY - panelHeight/2 + 110, workerText, {
      fontSize: '14px',
      fill: '#e0e0e0',
      align: 'center'
    }).setOrigin(0.5, 0);

    // 获取当前生产方式的输入和输出资源
    const currentMethod = buildingInfo.productionMethods?.find(m => m.id === buildingInfo.currentProductionMethod);
    const inputResources = currentMethod?.input || buildingInfo.recipe.input;
    const outputResources = currentMethod?.output || buildingInfo.recipe.output;

    // Add recipe info
    let recipeText = '';

    if (Object.keys(inputResources).length > 0) {
      recipeText += '消耗: ';
      Object.entries(inputResources).forEach(([resource, amount]) => {
        recipeText += `${this.getResourceDisplayName(resource)} x${amount} `;
      });
    }

    recipeText += '\n產出: ';
    Object.entries(outputResources).forEach(([resource, amount]) => {
      recipeText += `${this.getResourceDisplayName(resource)} x${amount} `;
    });

    // 添加副产品信息（如果有）
    if (buildingInfo.byproducts && Object.keys(buildingInfo.byproducts).length > 0 &&
        (!currentMethod || currentMethod.enableByproducts)) {
      recipeText += '\n副产品: ';
      Object.entries(buildingInfo.byproducts).forEach(([resource, amount]) => {
        // 处理概率性副产品
        const amountText = amount < 1 ? `${(amount * 100).toFixed(0)}%几率` : `x${amount}`;
        recipeText += `${this.getResourceDisplayName(resource)} ${amountText} `;
      });
    }

    const recipe = this.scene.add.text(0, containY - panelHeight/2 + 150, recipeText, {
      fontSize: '14px',
      fill: '#e0e0e0',
      align: 'center'
    }).setOrigin(0.5, 0);

    // Add production time
    const productionTime = (buildingInfo.productionInterval / 1000).toFixed(1);
    const baseTime = (buildingInfo.baseProductionInterval / 1000).toFixed(1);
    let timeText;

    if (productionTime !== baseTime) {
      timeText = this.scene.add.text(0, containY - panelHeight/2 + 200, `生產時間: ${productionTime} 秒 (基础: ${baseTime} 秒)`, {
        fontSize: '14px',
        fill: '#e0e0e0'
      }).setOrigin(0.5, 0);
    } else {
      timeText = this.scene.add.text(0, containY - panelHeight/2 + 200, `生產時間: ${productionTime} 秒`, {
        fontSize: '14px',
        fill: '#e0e0e0'
      }).setOrigin(0.5, 0);
    }

    // 添加生产方式和副产品选择区域
    let uiElements = [];
    let yOffset = containY - panelHeight/2 + 220; // 减小起始位置

    // 生产方式选择
    if (buildingInfo.productionMethods && buildingInfo.productionMethods.length > 0) {
      // 添加生产方式标题
      const methodTitle = this.scene.add.text(0, yOffset, '生产方式:', {
        fontSize: '14px', // 减小字体
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0);

      uiElements.push(methodTitle);
      yOffset += 20; // 减小间距

      // 准备下拉列表选项
      const methodOptions = buildingInfo.productionMethods.map(method => ({
        id: method.id,
        text: method.name,
        description: method.description
      }));

      // 创建下拉列表
      const methodDropdown = new DropdownList(this.scene, 0, yOffset, methodOptions, {
        width: 300,
        height: 25, // 减小高度
        backgroundColor: 0x333333,
        hoverColor: 0x4a6a4a,
        textColor: '#ffffff',
        fontSize: '14px',
        selectedId: buildingInfo.currentProductionMethod,
        onChange: (methodId) => this.handleProductionMethodSelect(buildingInfo.id, methodId)
      });

      uiElements.push(...methodDropdown.getElements());
      yOffset += 40; // 减小间距
    }

    // 副产品类型选择
    if (buildingInfo.byproductTypes && buildingInfo.byproductTypes.length > 0) {
      // 获取当前生产方式
      const currentMethod = buildingInfo.productionMethods?.find(m => m.id === buildingInfo.currentProductionMethod);

      // 只有当生产方式启用副产品时才显示副产品选择
      if (currentMethod && currentMethod.enableByproducts) {
        // 添加副产品标题
        const byproductTitle = this.scene.add.text(0, yOffset, '副产品类型:', {
          fontSize: '14px', // 减小字体
          fill: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        uiElements.push(byproductTitle);
        yOffset += 20; // 减小间距

        // 准备下拉列表选项
        const byproductOptions = buildingInfo.byproductTypes.map(type => ({
          id: type.id,
          text: type.name,
          description: type.description
        }));

        // 创建下拉列表
        const byproductDropdown = new DropdownList(this.scene, 0, yOffset, byproductOptions, {
          width: 300,
          height: 25, // 减小高度
          backgroundColor: 0x333333,
          hoverColor: 0x4a6a4a,
          textColor: '#ffffff',
          fontSize: '14px',
          selectedId: buildingInfo.currentByproductType,
          onChange: (typeId) => this.handleByproductTypeSelect(buildingInfo.id, typeId)
        });

        uiElements.push(...byproductDropdown.getElements());
        yOffset += 40; // 减小间距
      }
    }

    // Add upgrade button
    const upgradeBtn = new Button(this.scene, 0, yOffset + 5, '升級', {
      width: 100, // 减小按钮宽度
      height: 25, // 减小按钮高度
      backgroundColor: 0x4a4a4a,
      fontSize: '14px', // 减小字体
      textColor: '#ffffff',
      onClick: () => this.handleBuildingUpgrade(buildingInfo.id)
    });

    // 添加所有元素到面板
    this.infoPanel.add([background, titleBar, title, ...closeBtn.getElements(),
                        levelText, efficiencyText, workerInfoText, recipe, timeText,
                        ...uiElements, ...upgradeBtn.getElements()]);
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
    const viewWorkersBtn = new Button(this.scene, 60, 120, '管理工人', {
      width: 80,
      height: 30,
      backgroundColor: 0x4a4a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.toggleWorkerPanel()
    });

    // 添加市場按鈕
    const marketBtn = new Button(this.scene, 150, 120, '查看市場', {
      width: 80,
      height: 30,
      backgroundColor: 0x4a6a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.toggleMarketPanel()
    });

    // 將元素添加到容器中
    this.populationPanel.add([background, title, populationText, housingText, happinessText, ...viewWorkersBtn.getElements(), ...marketBtn.getElements()]);

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
      // 清理事件監聽器
      if (this.isDragging) {
        this.isDragging = false;
        this.scene.input.off('pointermove', this.handleWorkerPanelDrag, this);
      }
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

    // 創建面板 - 確保面板在屏幕中央
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    this.workerPanel = this.scene.add.container(centerX, centerY);
    this.workerPanel.setDepth(100); // 確保面板在最上層

    // 創建背景 - 調整大小並增加不透明度使文字更清晰
    const background = this.scene.add.rectangle(0, 0, 500, 400, 0x000000, 0.9)
      .setStrokeStyle(2, 0x4a4a4a);

    // 創建標題欄背景 - 用作拖拉區域
    const titleBar = this.scene.add.rectangle(0, -180, 500, 40, 0x333333)
      .setStrokeStyle(1, 0x555555);

    // 設置標題欄為可互動元素，使其可拖拉
    titleBar.setInteractive()
      .on('pointerdown', (pointer) => {
        // 記錄拖拉開始時的面板位置和滑鼠偏移量
        this.isDragging = true;
        this.dragStartX = this.workerPanel.x;
        this.dragStartY = this.workerPanel.y;
        this.dragPointerStartX = pointer.x;
        this.dragPointerStartY = pointer.y;

        // 設置滑鼠移動事件
        this.scene.input.on('pointermove', this.handleWorkerPanelDrag, this);
      });

    // 添加滑鼠釋放事件
    this.scene.input.on('pointerup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.scene.input.off('pointermove', this.handleWorkerPanelDrag, this);
      }
    });

    // 添加標題 - 調整位置並增加描邊效果提高可讀性
    const title = this.scene.add.text(0, -180, '工人管理', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0.5);

    // 添加關閉按鈕 - 調整位置
    const closeBtn = new Button(this.scene, 230, -180, 'X', {
      width: 30,
      height: 30,
      backgroundColor: 0x4a4a4a,
      fontSize: '18px',
      textColor: '#ffffff',
      onClick: () => this.toggleWorkerPanel()
    });

    // 創建選項卡 - 調整位置和大小並增強視覺效果
    const tabHeight = 36;
    const tabWidth = 100;
    const tabY = -140;
    const tabs = [
      { id: 'overview', name: '概覽', x: -200, color: 0x3a8c3a },
      { id: 'lower', name: '底層', x: -100, color: 0x666666 },
      { id: 'middle', name: '中層', x: 0, color: 0x3a6a8c },
      { id: 'upper', name: '上層', x: 100, color: 0x8c6a3a }
    ];

    // 創建選項卡容器
    const tabContainers = {};
    let activeTab = 'overview';
    const tabButtons = [];

    // 創建選項卡按鈕
    tabs.forEach(tab => {
      // 創建選項卡按鈕
      const tabBtn = new TabButton(this.scene, tab.x, tabY, tab.name, {
        id: tab.id,
        width: tabWidth,
        height: tabHeight,
        backgroundColor: 0x2d2d2d,
        activeColor: tab.color,
        isActive: tab.id === activeTab,
        onClick: (id) => {
          // 切換選項卡
          activeTab = id;

          // 更新選項卡外觀
          tabButtons.forEach((btn) => {
            btn.setActive(btn.getId() === activeTab);
          });

          // 顯示/隱藏內容
          Object.keys(tabContainers).forEach(id => {
            tabContainers[id].visible = (id === activeTab);
          });
        }
      });

      tabButtons.push(tabBtn);

      // 為每個選項卡創建內容容器 - 設置容器位置在選項卡下方
      tabContainers[tab.id] = this.scene.add.container(0, -100);
      tabContainers[tab.id].visible = (tab.id === activeTab);

      // 不在這裡添加容器到工人面板，而是在後面一次性添加所有容器
    });

    // 創建概覽選項卡內容
    this.createOverviewTabContent(tabContainers['overview'], stats);

    // 創建各階層選項卡內容
    this.createLowerClassTabContent(tabContainers['lower'], stats);
    this.createMiddleClassTabContent(tabContainers['middle'], stats);
    this.createUpperClassTabContent(tabContainers['upper'], stats);

    // 首先添加背景和基本UI元素到面板
    const tabElements = [];
    tabButtons.forEach(btn => {
      tabElements.push(...btn.getElements());
    });

    this.workerPanel.add([background, titleBar, title, ...closeBtn.getElements(), ...tabElements]);

    // 確保tabContainers在最上層，不被背景覆蓋
    Object.values(tabContainers).forEach(container => {
      this.workerPanel.add(container);
    });
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
        yPos += 30;
      }
    }

    // 添加所有元素到容器
    container.add(elements);
  }

  /**
   * 創建中層選項卡內容
   * @param {Phaser.GameObjects.Container} container - 選項卡容器
   * @param {Object} stats - 人口統計數據
   */
  createMiddleClassTabContent(container, stats) {
    const elements = [];
    const className = 'middle';
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

    // 添加階層描述 - 調整位置和寬度
    const descText = this.scene.add.text(-200, containY, classData.description, {
      fontSize: '14px',
      fill: '#cccccc',
      wordWrap: { width: 380 }
    }).setOrigin(0, 0.5);

    // 添加吸引移民按鈕 - 調整位置和大小
    const immigrantBtn = new Button(this.scene, 150, containY - 60, `吸引${this.getClassDisplayName(className)}移民`, {
      width: 150,
      height: 26,
      backgroundColor: 0x4a6a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.showAttractImmigrantsPanel(className)
    });

    elements.push(classTitle, classCountText, happinessText, descText, ...immigrantBtn.getElements());

    // 添加工人類型標題 - 調整位置
    const workersTitle = this.scene.add.text(-200, 80, '工人類型:', {
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
    const availableText = this.scene.add.text(100, 80, `可用工人: ${availableWorkers}/${totalWorkers}`, {
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
      let xPos = 140
      // 添加訓練按鈕
      const trainButton = this.scene.add.rectangle(xPos, yPos, 50, 20, 0x4a6a4a)
        .setInteractive()
        .on('pointerdown', () => this.trainWorker(workerType));

      const trainText = this.scene.add.text(xPos, yPos, '訓練', {
        fontSize: '14px',
        fill: '#ffffff'
      }).setOrigin(0.5, 0.5);
      xPos += 60
      // 添加晉升按鈕
      const promoteButton = this.scene.add.rectangle(xPos, yPos, 50, 20, 0x6a4a4a)
        .setInteractive()
        .on('pointerdown', () => this.showPromotionOptions(workerType));

      const promoteText = this.scene.add.text(xPos, yPos, '晉升', {
        fontSize: '14px',
        fill: '#ffffff'
      }).setOrigin(0.5, 0.5);

      elements.push(nameText, countText, expText, trainButton, trainText, promoteButton, promoteText);
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
        yPos += 30;
      }
    }

    // 添加所有元素到容器
    container.add(elements);
  }

  /**
   * 創建上層選項卡內容
   * @param {Phaser.GameObjects.Container} container - 選項卡容器
   * @param {Object} stats - 人口統計數據
   */
  createUpperClassTabContent(container, stats) {
    const elements = [];
    const className = 'upper';
    const classData = stats.socialClasses[className];

    if (!classData) return;

    // 定義內容的Y軸基準位置，方便統一調整
    const containY = 80;

    // 先添加內容背景 - 調整透明度和位置
    const contentBackground = this.scene.add.rectangle(0, containY+40, 460, 280, 0x1a1a1a, 0.7)
      .setStrokeStyle(1, 0x4a4a4a);
    // 將背景放在元素列表的最前面，確保它在最底層
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

    // 添加階層描述 - 調整位置和寬度
    const descText = this.scene.add.text(-200, containY, classData.description, {
      fontSize: '14px',
      fill: '#cccccc',
      wordWrap: { width: 380 }
    }).setOrigin(0, 0.5);

    // 添加吸引移民按鈕 - 調整位置和大小
    const immigrantButton = this.scene.add.rectangle(150, containY - 60, 100, 26, 0x4a6a4a)
      .setInteractive()
      .on('pointerdown', () => this.showAttractImmigrantsPanel(className));

    const immigrantText = this.scene.add.text(150, containY - 60, `吸引${this.getClassDisplayName(className)}移民`, {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    elements.push(classTitle, classCountText, happinessText, descText, immigrantButton, immigrantText);

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
    const availableText = this.scene.add.text(50, containY + 40, `可用工人: ${availableWorkers}/${totalWorkers}`, {
      fontSize: '16px',
      fill: '#e0e0e0'
    }).setOrigin(0, 0.5);

    elements.push(availableText);

    // 列出這個階層的工人類型 - 調整位置和布局
    let yPos = containY + 80;
    const workerTypesInClass = this.scene.populationSystem.socialClasses[className].workerTypes;

    for (const workerType of workerTypesInClass) {
      const data = stats.workers[workerType];
      if (!data) continue;

      // 工人名稱 - 調整位置
      const nameText = this.scene.add.text(-200, yPos, data.displayName, {
        fontSize: '16px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 工人數量 - 調整位置
      const countText = this.scene.add.text(-80, yPos, `數量: ${data.count} (可用: ${data.available})`, {
        fontSize: '14px',
        fill: '#cccccc'
      }).setOrigin(0, 0.5);

      // 經驗值 - 調整位置
      const expText = this.scene.add.text(50, yPos, `經驗: ${data.experience}`, {
        fontSize: '14px',
        fill: '#cccccc'
      }).setOrigin(0, 0.5);
      let xPos = 150;
      // 添加訓練按鈕 - 調整位置和大小
      const trainButton = this.scene.add.rectangle(xPos, yPos, 50, 26, 0x4a6a4a)
        .setInteractive()
        .on('pointerdown', () => this.trainWorker(workerType));

      const trainText = this.scene.add.text(xPos, yPos, '訓練', {
        fontSize: '14px',
        fill: '#ffffff'
      }).setOrigin(0.5, 0.5);
      xPos += 55;

      // 添加晉升按鈕 - 調整位置和大小
      const promoteButton = this.scene.add.rectangle(xPos, yPos, 50, 26, 0x6a4a4a)
        .setInteractive()
        .on('pointerdown', () => this.showPromotionOptions(workerType));

      const promoteText = this.scene.add.text(xPos, yPos, '晉升', {
        fontSize: '14px',
        fill: '#ffffff'
      }).setOrigin(0.5, 0.5);

      elements.push(nameText, countText, expText, trainButton, trainText, promoteButton, promoteText);
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
        yPos += 30;
      }
    }

    // 添加所有元素到容器
    container.add(elements);
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

    // 先添加內容背景 - 調整透明度和位置
    const contentBackground = this.scene.add.rectangle(0, containY+40, 460, 280, 0x1a1a1a, 0.7)
      .setStrokeStyle(1, 0x4a4a4a);
    // 直接添加到容器中，確保它在最底層
    container.add(contentBackground);

    // 添加總人口信息 - 調整位置
    const totalPopText = this.scene.add.text(-200, containY - 85, `總人口: ${stats.total}`, {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // 添加住房容量信息 - 調整位置
    const housingText = this.scene.add.text(-200, containY - 50, `住房容量: ${stats.capacity}`, {
      fontSize: '16px',
      fill: '#e0e0e0'
    }).setOrigin(0, 0.5);

    // 添加總體幸福度 - 調整位置
    const happinessColor = this.getHappinessColor(stats.happiness);
    const happinessText = this.scene.add.text(-200, containY-70, `總體幸福度: ${stats.happiness}%`, {
      fontSize: '16px',
      fill: happinessColor
    }).setOrigin(0, 0.5);

    elements.push(totalPopText, housingText, happinessText);

    // 添加階層分布信息 - 調整位置
    const classDistTitle = this.scene.add.text(-200, containY-20, '階層分布:', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    elements.push(classDistTitle);

    // 顯示每個階層的信息 - 調整位置
    let yPos = containY + 80;
    for (const [className, classData] of Object.entries(stats.socialClasses)) {
      // 階層名稱
      const classNameText = this.scene.add.text(-200, yPos, `${classData.name}:`, {
        fontSize: '16px',
        fill: this.getClassColor(className),
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      // 人口數量
      const classCountText = this.scene.add.text(-120, yPos, `${classData.count} (${classData.percentage})`, {
        fontSize: '16px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 幸福度
      const classHappinessColor = this.getHappinessColor(classData.happiness || 50);
      const classHappinessText = this.scene.add.text(0, yPos, `幸福度: ${classData.happiness || 50}%`, {
        fontSize: '16px',
        fill: classHappinessColor
      }).setOrigin(0, 0.5);

      elements.push(classNameText, classCountText, classHappinessText);

      // 如果是中層或上層，添加吸引移民按鈕
      if (className === 'middle' || className === 'upper') {
        const immigrantBtn = new Button(this.scene, 200, yPos, `吸引${this.getClassDisplayName(className)}移民`, {
          width: 120,
          height: 30,
          backgroundColor: 0x4a6a4a,
          fontSize: '14px',
          textColor: '#ffffff',
          onClick: () => this.showAttractImmigrantsPanel(className)
        });

        elements.push(...immigrantBtn.getElements());
      }

      yPos += 40;
    }

    // 添加需求滿足情況標題
    const demandsTitle = this.scene.add.text(-250, yPos + 20, '需求滿足情況:', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    elements.push(demandsTitle);
    yPos += 60;

    // 顯示每個階層的需求滿足情況
    for (const [className, classData] of Object.entries(stats.socialClasses)) {
      if (classData.demands && Object.keys(classData.demands).length > 0) {
        // 階層標題
        const classTitle = this.scene.add.text(-250, yPos, `${classData.name}需求:`, {
          fontSize: '16px',
          fill: this.getClassColor(className),
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

    // 添加階層標題 - 調整位置
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

    // 添加階層描述 - 調整位置和寬度
    const descText = this.scene.add.text(-200, containY, classData.description, {
      fontSize: '14px',
      fill: '#cccccc',
      wordWrap: { width: 380 }
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
    const availableText = this.scene.add.text(50, 10, `可用工人: ${availableWorkers}/${totalWorkers}`, {
      fontSize: '16px',
      fill: '#e0e0e0'
    }).setOrigin(0, 0.5);

    elements.push(availableText);

    // 列出這個階層的工人類型 - 調整位置和布局
    let yPos = containY + 80;
    const workerTypesInClass = this.scene.populationSystem.socialClasses[className].workerTypes;

    for (const workerType of workerTypesInClass) {
      const data = stats.workers[workerType];
      if (!data) continue;

      // 工人名稱 - 調整位置
      const nameText = this.scene.add.text(-200, yPos, data.displayName, {
        fontSize: '16px',
        fill: '#e0e0e0'
      }).setOrigin(0, 0.5);

      // 工人數量 - 調整位置
      const countText = this.scene.add.text(-80, yPos, `數量: ${data.count} (可用: ${data.available})`, {
        fontSize: '14px',
        fill: '#cccccc'
      }).setOrigin(0, 0.5);

      // 經驗值 - 調整位置
      const expText = this.scene.add.text(50, yPos, `經驗: ${data.experience}`, {
        fontSize: '14px',
        fill: '#cccccc'
      }).setOrigin(0, 0.5);

      // 添加訓練按鈕 - 調整位置和大小
      const trainBtn = new Button(this.scene, 150, yPos, '訓練', {
        width: 60,
        height: 26,
        backgroundColor: 0x4a6a4a,
        onClick: () => this.trainWorker(workerType)
      });

      // 添加晉升按鈕 - 調整位置和大小
      const promoteBtn = new Button(this.scene, 220, yPos, '晉升', {
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
        yPos += 30;
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
   * @param {string} targetClass - 目標階層 ('middle' 或 'upper')
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
    const costPerImmigrant = targetClass === 'middle' ? 50 : 200;
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

    // 創建標題欄背景 - 用作拖拉區域
    const titleBar = this.scene.add.rectangle(0, -250, 700, 40, 0x333333)
      .setStrokeStyle(1, 0x555555);

    // 設置標題欄為可互動元素，使其可拖拉
    titleBar.setInteractive()
      .on('pointerdown', (pointer) => {
        // 記錄拖拉開始時的面板位置和滑鼠偏移量
        this.isMarketDragging = true;
        this.marketDragStartX = this.marketPanel.x;
        this.marketDragStartY = this.marketPanel.y;
        this.marketDragPointerStartX = pointer.x;
        this.marketDragPointerStartY = pointer.y;

        // 設置滑鼠移動事件
        this.scene.input.on('pointermove', this.handleMarketPanelDrag, this);
      });

    // 添加滑鼠釋放事件
    this.scene.input.on('pointerup', () => {
      if (this.isMarketDragging) {
        this.isMarketDragging = false;
        this.scene.input.off('pointermove', this.handleMarketPanelDrag, this);
      }
    });

    // 添加標題
    const title = this.scene.add.text(0, -250, '市場統計', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    // 添加關閉按鈕
    const closeBtn = new Button(this.scene, 330, -250, 'X', {
      width: 30,
      height: 30,
      backgroundColor: 0x4a4a4a,
      fontSize: '18px',
      textColor: '#ffffff',
      onClick: () => this.toggleMarketPanel()
    });

    // 添加資源價格列表
    const priceElements = [];
    let yPos = -180;

    // 添加市場價格標題
    const priceTitle = this.scene.add.text(-330, -210, '資源價格', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    priceElements.push(priceTitle);

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

    // 添加交易資源按鈕（合併買賣功能）
    const tradeBtn = new Button(this.scene, 200, -160, '交易資源', {
      width: 120,
      height: 30,
      backgroundColor: 0x4a6a6a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.showMarketResourcePanel()
    });

    priceElements.push(transactionTitle, ...tradeBtn.getElements());

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
    this.marketPanel.add([background, titleBar, title, ...closeBtn.getElements(), ...priceElements]);
  }

  /**
   * 切換市場面板顯示/隱藏
   */
  toggleMarketPanel() {
    if (this.marketPanel && this.marketPanel.visible) {
      this.marketPanel.visible = false;
      // 清理事件監聽器
      if (this.isMarketDragging) {
        this.isMarketDragging = false;
        this.scene.input.off('pointermove', this.handleMarketPanelDrag, this);
      }
    } else {
      this.createMarketPanel();
    }
  }

  /**
   * 處理工人面板的拖拉
   * @param {Phaser.Input.Pointer} pointer - 滑鼠指针
   */
  handleWorkerPanelDrag(pointer) {
    if (this.isDragging && this.workerPanel) {
      // 計算滑鼠移動的距離
      const dx = pointer.x - this.dragPointerStartX;
      const dy = pointer.y - this.dragPointerStartY;

      // 更新面板位置，保持滑鼠和面板的相對位置
      this.workerPanel.x = this.dragStartX + dx;
      this.workerPanel.y = this.dragStartY + dy;
    }
  }

  /**
   * 處理市場面板的拖拉
   * @param {Phaser.Input.Pointer} pointer - 滑鼠指针
   */
  handleMarketPanelDrag(pointer) {
    if (this.isMarketDragging && this.marketPanel) {
      // 計算滑鼠移動的距離
      const dx = pointer.x - this.marketDragPointerStartX;
      const dy = pointer.y - this.marketDragPointerStartY;

      // 更新面板位置，保持滑鼠和面板的相對位置
      this.marketPanel.x = this.marketDragStartX + dx;
      this.marketPanel.y = this.marketDragStartY + dy;
    }
  }

  /**
   * 處理市場資源交易面板的拖拉
   * @param {Phaser.Input.Pointer} pointer - 滑鼠指针
   */
  handleResourcePanelDrag(pointer) {
    if (this.isResourceDragging && this.marketResourcePanel) {
      // 計算滑鼠移動的距離
      const dx = pointer.x - this.resourceDragPointerStartX;
      const dy = pointer.y - this.resourceDragPointerStartY;

      // 更新面板位置，保持滑鼠和面板的相對位置
      this.marketResourcePanel.x = this.resourceDragStartX + dx;
      this.marketResourcePanel.y = this.resourceDragStartY + dy;
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

  /**
   * 顯示市場資源交易面板（合併買賣功能）
   */
  showMarketResourcePanel() {
    // 如果已存在交易面板，先移除
    if (this.marketResourcePanel) {
      this.marketResourcePanel.destroy();
      this.marketResourcePanel = null;
    }

    // 將面板設為可見
    console.log('創建市場資源交易面板');

    // 如果已存在出售面板，先移除
    if (this.sellResourcePanel) {
      this.sellResourcePanel.destroy();
      this.sellResourcePanel = null;
    }

    // 如果已存在購買面板，先移除
    if (this.buyResourcePanel) {
      this.buyResourcePanel.destroy();
      this.buyResourcePanel = null;
    }

    // 獲取資源列表和市場統計
    const resources = this.scene.resources.resources;
    const marketStats = this.scene.marketSystem.getMarketStats();
    const playerGold = this.scene.playerGold || 0;

    // 創建面板 - 確保它在畫面中央
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    this.marketResourcePanel = this.scene.add.container(centerX, centerY);
    this.marketResourcePanel.setDepth(100); // 確保面板在最上層

    // 創建背景 - 增加面板寬度以容納買賣功能
    const background = this.scene.add.rectangle(0, 0, 600, 500, 0x1a1a1a, 0.95)
      .setStrokeStyle(1, 0x4a4a4a);

    // 創建標題欄背景 - 用作拖拉區域
    const titleBar = this.scene.add.rectangle(0, -230, 600, 40, 0x333333)
      .setStrokeStyle(1, 0x555555);

    // 設置標題欄為可互動元素，使其可拖拉
    titleBar.setInteractive()
      .on('pointerdown', (pointer) => {
        // 記錄拖拉開始時的面板位置和滑鼠偏移量
        this.isResourceDragging = true;
        this.resourceDragStartX = this.marketResourcePanel.x;
        this.resourceDragStartY = this.marketResourcePanel.y;
        this.resourceDragPointerStartX = pointer.x;
        this.resourceDragPointerStartY = pointer.y;

        // 設置滑鼠移動事件
        this.scene.input.on('pointermove', this.handleResourcePanelDrag, this);
      });

    // 添加滑鼠釋放事件
    this.scene.input.on('pointerup', () => {
      if (this.isResourceDragging) {
        this.isResourceDragging = false;
        this.scene.input.off('pointermove', this.handleResourcePanelDrag, this);
      }
    });

    // 添加標題
    const title = this.scene.add.text(0, -230, '市場資源交易', {
      fontSize: '22px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    // 添加關閉按鈕
    const closeBtn = new Button(this.scene, 280, -230, 'X', {
      width: 30,
      height: 30,
      backgroundColor: 0x4a4a4a,
      fontSize: '18px',
      textColor: '#ffffff',
      onClick: () => {
        // 清理事件監聽器
        if (this.isResourceDragging) {
          this.isResourceDragging = false;
          this.scene.input.off('pointermove', this.handleResourcePanelDrag, this);
        }
        this.marketResourcePanel.destroy();
        this.marketResourcePanel = null;
      }
    });

    // 添加說明文字
    const infoText = this.scene.add.text(0, -190, '選擇資源並選擇買入或賣出操作\n大量交易會影響市場價格', {
      fontSize: '14px',
      fill: '#cccccc',
      align: 'center'
    }).setOrigin(0.5, 0);

    // 添加金幣顯示
    const goldText = this.scene.add.text(0, -160, `目前擁有金幣: ${Math.floor(playerGold)}`, {
      fontSize: '16px',
      fill: '#ffdd00',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 添加資源列表
    const resourceElements = [];
    const tradeButtons = [];
    let yPos = -130;
    let selectedResource = null;
    let selectedAmount = 0;
    let tradeMode = null; // 'buy' 或 'sell'

    // 按照資源層級分組顯示
    const resourcesByTier = {};

    // 分類資源
    for (const [resourceType, resourceData] of Object.entries(resources)) {
      const tier = resourceData.tier || 1;
      if (!resourcesByTier[tier]) resourcesByTier[tier] = [];

      // 只顯示有市場價格的資源
      if (marketStats.prices[resourceType]) {
        resourcesByTier[tier].push({ type: resourceType, data: resourceData });
      }
    }

    // 創建資源選擇列表
    for (let tier = 1; tier <= 4; tier++) {
      if (!resourcesByTier[tier] || resourcesByTier[tier].length === 0) continue;

      // 層級標題
      const tierTitle = this.scene.add.text(-280, yPos, `第 ${tier} 層資源`, {
        fontSize: '16px',
        fill: '#cccccc',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      resourceElements.push(tierTitle);
      yPos += 25;

      // 顯示該層級的資源
      for (const { type, data } of resourcesByTier[tier]) {
        // 資源名稱
        const nameText = this.scene.add.text(-280, yPos, this.getResourceDisplayName(type), {
          fontSize: '14px',
          fill: '#e0e0e0'
        }).setOrigin(0, 0.5);

        // 當前擁有數量
        const amountText = this.scene.add.text(-180, yPos, `擁有: ${Math.floor(data.value)}/${resources.resourceCaps[type] || 'N/A'}`, {
          fontSize: '14px',
          fill: '#e0e0e0'
        }).setOrigin(0, 0.5);

        // 當前價格
        const priceInfo = marketStats.prices[type];
        const priceColor = priceInfo.priceRatio > 1.1 ? '#ff6666' : (priceInfo.priceRatio < 0.9 ? '#66ff66' : '#ffffff');
        const priceText = this.scene.add.text(-50, yPos, `價格: ${priceInfo.currentPrice}`, {
          fontSize: '14px',
          fill: priceColor
        }).setOrigin(0, 0.5);

        // 市場庫存
        const inventoryText = this.scene.add.text(70, yPos, `市場: ${priceInfo.marketInventory}/${priceInfo.marketCapacity}`, {
          fontSize: '14px',
          fill: '#e0e0e0'
        }).setOrigin(0, 0.5);

        // 買入和賣出按鈕
        const buyBtn = new TradeButton(this.scene, 180, yPos, '買入', {
          resourceType: type,
          tradeMode: 'buy',
          width: 60,
          height: 20,
          backgroundColor: 0x4a6a6a,
          selectedColor: 0x6a8a6a,
          fontSize: '12px',
          textColor: '#ffffff',
          onClick: (resourceType) => {
            selectedResource = resourceType;
            tradeMode = 'buy';
            // 更新選擇狀態
            tradeButtons.forEach(btn => {
              if (btn.resourceType === resourceType) {
                btn.setSelected(btn.tradeMode === 'buy');
              } else {
                if (btn.tradeMode === 'buy') {
                  btn.setSelected(false);
                }
              }
            });
            // 更新輸入框和預覽
            updateTradePreview();
          }
        });

        const sellBtn = new TradeButton(this.scene, 250, yPos, '賣出', {
          resourceType: type,
          tradeMode: 'sell',
          width: 60,
          height: 20,
          backgroundColor: 0x6a4a4a,
          selectedColor: 0x8a4a4a,
          fontSize: '12px',
          textColor: '#ffffff',
          onClick: (resourceType) => {
            selectedResource = resourceType;
            tradeMode = 'sell';
            // 更新選擇狀態
            tradeButtons.forEach(btn => {
              if (btn.resourceType === resourceType) {
                btn.setSelected(btn.tradeMode === 'sell');
              } else {
                if (btn.tradeMode === 'sell') {
                  btn.setSelected(false);
                }
              }
            });
            // 更新輸入框和預覽
            updateTradePreview();
          }
        });

        tradeButtons.push(buyBtn, sellBtn);

        resourceElements.push(nameText, amountText, priceText, inventoryText, ...buyBtn.getElements(), ...sellBtn.getElements());
        yPos += 25;
      }

      yPos += 10; // 層級之間的額外空間
    }

    // 添加數量輸入框
    const amountLabel = this.scene.add.text(-100, 120, '交易數量:', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);

    const amountInput = this.scene.add.rectangle(0, 120, 100, 30, 0x2d2d2d)
      .setInteractive()
      .on('pointerdown', () => {
        // 彈出輸入框
        this.scene.input.keyboard.createTextInput({
          onTextChanged: (text) => {
            // 限制只能輸入數字
            const numericText = text.replace(/[^0-9]/g, '');
            selectedAmount = parseInt(numericText) || 0;
            updateTradePreview();
          }
        });
      });

    const amountText = this.scene.add.text(0, 120, '0', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 添加快速選擇按鈕
    const quickButtons = [];
    const quickAmounts = [10, 50, 100, 'Max'];
    let xPos = 50;

    quickAmounts.forEach(amount => {
      const quickBtn = new Button(this.scene, xPos, 120, amount.toString(), {
        width: 40,
        height: 20,
        backgroundColor: 0x4a4a6a,
        fontSize: '12px',
        textColor: '#ffffff',
        onClick: () => {
          if (selectedResource) {
            if (amount === 'Max') {
              // 根據交易模式設置最大數量
              if (tradeMode === 'sell') {
                // 出售模式，最大為玩家所有的資源數量
                selectedAmount = Math.floor(resources[selectedResource].value);
              } else if (tradeMode === 'buy') {
                // 購買模式，計算最大可購買數量
                const priceInfo = marketStats.prices[selectedResource];
                const currentPrice = priceInfo.currentPrice;
                const marketInventory = priceInfo.marketInventory;
                const resourceCap = this.scene.resources.resourceCaps[selectedResource] || Infinity;
                const currentAmount = resources[selectedResource].value;
                const remainingCapacity = resourceCap - currentAmount;
                const maxAffordable = Math.floor(playerGold / currentPrice);

                // 取最小值：市場庫存、可購買數量、剩餘容量
                selectedAmount = Math.min(marketInventory, maxAffordable, remainingCapacity);
              }
            } else {
              selectedAmount = amount;
            }
            amountText.setText(selectedAmount.toString());
            updateTradePreview();
          }
        }
      });

      quickButtons.push(...quickBtn.getElements());
      xPos += 45;
    });

    // 添加預覽區域
    const previewBackground = this.scene.add.rectangle(0, 160, 400, 60, 0x2d2d2d, 0.7);

    const previewText = this.scene.add.text(0, 160, '選擇資源、交易模式和數量以查看預覽', {
      fontSize: '14px',
      fill: '#cccccc',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    // 添加確認交易按鈕
    const tradeConfirmBtn = new Button(this.scene, 0, 200, '確認交易', {
      width: 120,
      height: 30,
      backgroundColor: 0x6a4a6a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => {
        if (selectedResource && selectedAmount > 0 && tradeMode) {
          let result;

          if (tradeMode === 'sell') {
            // 執行出售操作
            result = this.scene.marketSystem.playerSellResource(
              selectedResource,
              selectedAmount,
              this.scene.resources
            );
          } else if (tradeMode === 'buy') {
            // 執行購買操作
            result = this.scene.marketSystem.playerBuyResource(
              selectedResource,
              selectedAmount,
              this.scene.resources,
              this.scene.playerGold
            );

            // 更新金幣顯示
            if (result.success) {
              this.scene.playerGold = result.remainingGold;
              goldText.setText(`目前擁有金幣: ${Math.floor(this.scene.playerGold)}`);
            }
          }

          // 顯示結果
          previewText.setText(result.message);

          if (result.success) {
            // 重置選擇
            selectedResource = null;
            selectedAmount = 0;
            tradeMode = null;
            amountText.setText('0');

            // 更新資源顯示
            this.updateResources(this.scene.resources.resources);

            // 重新渲染資源列表
            setTimeout(() => {
              this.marketResourcePanel.destroy();
              this.marketResourcePanel = null;
              this.showMarketResourcePanel();
            }, 1500);
          }
        } else {
          previewText.setText('請選擇資源、交易模式並輸入有效數量');
        }
      }
    });

    // 更新交易預覽函數
    const updateTradePreview = () => {
      if (!selectedResource || !tradeMode) {
        previewText.setText('選擇資源、交易模式和數量以查看預覽');
        return;
      }

      if (selectedAmount <= 0) {
        previewText.setText('請輸入有效的交易數量');
        return;
      }

      const resourceData = resources[selectedResource];
      const priceInfo = marketStats.prices[selectedResource];

      if (!resourceData || !priceInfo) {
        previewText.setText('無法獲取資源信息');
        return;
      }

      if (tradeMode === 'sell') {
        // 出售模式預覽

        // 檢查數量是否足夠
        if (resourceData.value < selectedAmount) {
          previewText.setText(`資源不足！最多可出售 ${Math.floor(resourceData.value)} 個`);
          return;
        }

        // 檢查市場庫存是否足夠
        const marketInventory = priceInfo.marketInventory || 0;
        const marketCapacity = priceInfo.marketCapacity || 1000;
        const remainingCapacity = marketCapacity - marketInventory;

        if (remainingCapacity < selectedAmount) {
          previewText.setText(`市場庫存空間不足！最多可出售 ${remainingCapacity} 個`);
          return;
        }

        // 計算實際交易價格 (根據數量調整價格)
        const priceAdjustment = Math.max(0.7, 1 - (selectedAmount / 1000) * 0.3);
        const actualPrice = Math.floor(priceInfo.currentPrice * priceAdjustment);
        const totalProfit = selectedAmount * actualPrice;

        // 顯示預覽信息
        previewText.setText(
          `出售 ${selectedAmount} 個 ${resourceData.displayName || selectedResource}\n` +
          `單價: ${actualPrice} (原價: ${priceInfo.currentPrice})\n` +
          `預計收益: ${totalProfit} 金幣`
        );
      } else if (tradeMode === 'buy') {
        // 購買模式預覽

        // 檢查市場庫存是否足夠
        const marketInventory = priceInfo.marketInventory || 0;

        if (marketInventory < selectedAmount) {
          previewText.setText(`市場庫存不足！最多可購買 ${marketInventory} 個`);
          return;
        }

        // 檢查資源容量是否足夠
        const resourceCap = this.scene.resources.resourceCaps[selectedResource] || Infinity;
        const currentAmount = resourceData.value;
        const remainingCapacity = resourceCap - currentAmount;

        if (remainingCapacity < selectedAmount) {
          previewText.setText(`資源容量不足！最多可購買 ${Math.floor(remainingCapacity)} 個`);
          return;
        }

        // 計算實際交易價格 (根據數量調整價格)
        const priceAdjustment = Math.min(1.3, 1 + (selectedAmount / 1000) * 0.3);
        const actualPrice = Math.ceil(priceInfo.currentPrice * priceAdjustment);
        const totalCost = selectedAmount * actualPrice;

        // 檢查金幣是否足夠
        if (playerGold < totalCost) {
          const maxAffordable = Math.floor(playerGold / actualPrice);
          previewText.setText(`金幣不足！最多可購買 ${maxAffordable} 個`);
          return;
        }

        // 顯示預覽信息
        previewText.setText(
          `購買 ${selectedAmount} 個 ${resourceData.displayName || selectedResource}\n` +
          `單價: ${actualPrice} (原價: ${priceInfo.currentPrice})\n` +
          `預計成本: ${totalCost} 金幣`
        );
      }
    };

    // 添加所有元素到面板
    this.marketResourcePanel.add([
      background, titleBar, title, ...closeBtn.getElements(), infoText, goldText,
      ...resourceElements,
      amountLabel, amountInput, amountText,
      ...quickButtons,
      previewBackground, previewText,
      ...tradeConfirmBtn.getElements()
    ]);
  }

  /**
   * 顯示購買資源面板
   */
  showBuyResourcePanel() {
    // 如果已存在購買面板，先移除
    if (this.buyResourcePanel) {
      this.buyResourcePanel.destroy();
      this.buyResourcePanel = null;
      return;
    }

    // 如果已存在出售面板，先移除
    if (this.sellResourcePanel) {
      this.sellResourcePanel.destroy();
      this.sellResourcePanel = null;
    }

    // 獲取可購買的資源列表
    const resources = this.scene.resources.resources;
    const marketStats = this.scene.marketSystem.getMarketStats();
    const playerGold = this.scene.playerGold || 0;

    // 創建面板
    this.buyResourcePanel = this.scene.add.container(400, 300);

    // 創建背景
    const background = this.scene.add.rectangle(0, 0, 500, 400, 0x1a1a1a, 0.95)
      .setStrokeStyle(1, 0x4a4a4a);

    // 添加標題
    const title = this.scene.add.text(0, -180, '從市場購買資源', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 添加關閉按鈕
    const closeButton = this.scene.add.rectangle(230, -180, 30, 30, 0x4a4a4a)
      .setInteractive()
      .on('pointerdown', () => {
        this.buyResourcePanel.destroy();
        this.buyResourcePanel = null;
      });

    const closeText = this.scene.add.text(230, -180, 'X', {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 添加說明文字
    const infoText = this.scene.add.text(0, -140, '選擇資源並輸入數量進行購買\n購買大量資源會提高價格', {
      fontSize: '14px',
      fill: '#cccccc',
      align: 'center'
    }).setOrigin(0.5, 0);

    // 添加金幣顯示
    const goldText = this.scene.add.text(0, -110, `目前擁有金幣: ${Math.floor(playerGold)}`, {
      fontSize: '16px',
      fill: '#ffdd00',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 添加資源列表
    const resourceElements = [];
    let yPos = -80;
    let selectedResource = null;
    let selectedAmount = 0;

    // 按照資源層級分組顯示
    const resourcesByTier = {};

    // 分類資源
    for (const [resourceType, resourceData] of Object.entries(resources)) {
      const tier = resourceData.tier || 1;
      if (!resourcesByTier[tier]) resourcesByTier[tier] = [];

      // 只顯示有市場價格的資源
      if (marketStats.prices[resourceType]) {
        resourcesByTier[tier].push({ type: resourceType, data: resourceData });
      }
    }

    // 創建資源選擇列表
    for (let tier = 1; tier <= 4; tier++) {
      if (!resourcesByTier[tier] || resourcesByTier[tier].length === 0) continue;

      // 層級標題
      const tierTitle = this.scene.add.text(-230, yPos, `第 ${tier} 層資源`, {
        fontSize: '16px',
        fill: '#cccccc',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      resourceElements.push(tierTitle);
      yPos += 25;

      // 顯示該層級的資源
      for (const { type, data } of resourcesByTier[tier]) {
        // 資源名稱
        const nameText = this.scene.add.text(-220, yPos, this.getResourceDisplayName(type), {
          fontSize: '14px',
          fill: '#e0e0e0'
        }).setOrigin(0, 0.5);

        // 當前擁有數量
        const amountText = this.scene.add.text(-100, yPos, `擁有: ${Math.floor(data.value)}/${resources.resourceCaps[type] || 'N/A'}`, {
          fontSize: '14px',
          fill: '#e0e0e0'
        }).setOrigin(0, 0.5);

        // 當前價格
        const priceInfo = marketStats.prices[type];
        const priceColor = priceInfo.priceRatio > 1.1 ? '#ff6666' : (priceInfo.priceRatio < 0.9 ? '#66ff66' : '#ffffff');
        const priceText = this.scene.add.text(0, yPos, `價格: ${priceInfo.currentPrice}`, {
          fontSize: '14px',
          fill: priceColor
        }).setOrigin(0, 0.5);

        // 市場庫存
        const inventoryText = this.scene.add.text(100, yPos, `市場: ${priceInfo.marketInventory}/${priceInfo.marketCapacity}`, {
          fontSize: '14px',
          fill: '#e0e0e0'
        }).setOrigin(0, 0.5);

        // 選擇按鈕
        const selectButton = this.scene.add.rectangle(200, yPos, 60, 20, 0x4a4a6a)
          .setInteractive()
          .on('pointerdown', () => {
            selectedResource = type;
            // 更新選擇狀態
            resourceElements.forEach(el => {
              if (el.resourceType === type) {
                el.setFillStyle(0x6a8a6a); // 選中狀態
              } else if (el.resourceType) {
                el.setFillStyle(0x4a4a6a); // 非選中狀態
              }
            });
            // 更新輸入框和預覽
            updateBuyPreview();
          });

        selectButton.resourceType = type; // 添加資源類型屬性

        const selectText = this.scene.add.text(200, yPos, '選擇', {
          fontSize: '12px',
          fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        resourceElements.push(nameText, amountText, priceText, inventoryText, selectButton, selectText);
        yPos += 25;
      }

      yPos += 10; // 層級之間的額外空間
    }

    // 添加數量輸入框
    const amountLabel = this.scene.add.text(-100, 120, '購買數量:', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);

    const amountInput = this.scene.add.rectangle(0, 120, 100, 30, 0x2d2d2d)
      .setInteractive()
      .on('pointerdown', () => {
        // 彈出輸入框
        this.scene.input.keyboard.createTextInput({
          onTextChanged: (text) => {
            // 限制只能輸入數字
            const numericText = text.replace(/[^0-9]/g, '');
            selectedAmount = parseInt(numericText) || 0;
            updateBuyPreview();
          }
        });
      });

    const amountText = this.scene.add.text(0, 120, '0', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 添加快速選擇按鈕
    const quickButtons = [];
    const quickAmounts = [10, 50, 100, 'Max'];
    let xPos = 50;

    quickAmounts.forEach(amount => {
      const quickButton = this.scene.add.rectangle(xPos, 120, 40, 20, 0x4a4a6a)
        .setInteractive()
        .on('pointerdown', () => {
          if (selectedResource) {
            if (amount === 'Max') {
              // 計算最大可購買數量
              const priceInfo = marketStats.prices[selectedResource];
              const currentPrice = priceInfo.currentPrice;
              const marketInventory = priceInfo.marketInventory;
              const resourceCap = this.scene.resources.resourceCaps[selectedResource] || Infinity;
              const currentAmount = this.scene.resources.resources[selectedResource].value;
              const remainingCapacity = resourceCap - currentAmount;

              // 根據金幣、市場庫存和資源容量限制計算最大數量
              const maxByGold = Math.floor(playerGold / currentPrice);
              const maxByInventory = marketInventory;
              const maxByCapacity = remainingCapacity;

              selectedAmount = Math.min(maxByGold, maxByInventory, maxByCapacity);
            } else {
              selectedAmount = amount;
            }
            amountText.setText(selectedAmount.toString());
            updateBuyPreview();
          }
        });

      const quickText = this.scene.add.text(xPos, 120, amount.toString(), {
        fontSize: '12px',
        fill: '#ffffff'
      }).setOrigin(0.5, 0.5);

      quickButtons.push(quickButton, quickText);
      xPos += 45;
    });

    // 添加預覽區域
    const previewBackground = this.scene.add.rectangle(0, 160, 400, 60, 0x2d2d2d, 0.7);

    const previewText = this.scene.add.text(0, 160, '選擇資源和數量以查看預計成本', {
      fontSize: '14px',
      fill: '#cccccc',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    // 添加確認購買按鈕
    const buyConfirmButton = this.scene.add.rectangle(0, 200, 120, 30, 0x6a4a4a)
      .setInteractive()
      .on('pointerdown', () => {
        if (selectedResource && selectedAmount > 0) {
          // 執行購買操作
          const result = this.scene.marketSystem.playerBuyResource(
            selectedResource,
            selectedAmount,
            this.scene.resources,
            this.scene.playerGold
          );

          // 顯示結果
          previewText.setText(result.message);

          if (result.success) {
            // 更新玩家金幣
            this.scene.playerGold = result.remainingGold;
            this.scene.updateGoldDisplay();

            // 重置選擇
            selectedResource = null;
            selectedAmount = 0;
            amountText.setText('0');

            // 更新資源顯示
            this.updateResources(this.scene.resources.resources);

            // 更新金幣顯示
            goldText.setText(`目前擁有金幣: ${Math.floor(this.scene.playerGold)}`);

            // 重新渲染資源列表
            setTimeout(() => {
              this.buyResourcePanel.destroy();
              this.buyResourcePanel = null;
              this.showBuyResourcePanel();
            }, 1500);
          }
        } else {
          previewText.setText('請選擇資源並輸入有效數量');
        }
      });

    const buyConfirmText = this.scene.add.text(0, 200, '確認購買', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 更新預覽函數
    const updateBuyPreview = () => {
      if (selectedResource && selectedAmount > 0) {
        const resourceData = resources[selectedResource];
        const priceInfo = marketStats.prices[selectedResource];

        if (resourceData && priceInfo) {
          // 檢查市場庫存是否足夠
          const marketInventory = priceInfo.marketInventory || 0;
          if (marketInventory < selectedAmount) {
            previewText.setText(`市場庫存不足！最多可購買 ${marketInventory} 個`);
            return;
          }

          // 檢查資源容量是否足夠
          const resourceCap = this.scene.resources.resourceCaps[selectedResource] || Infinity;
          const currentAmount = resourceData.value;
          const remainingCapacity = resourceCap - currentAmount;

          if (remainingCapacity < selectedAmount) {
            previewText.setText(`資源容量不足！最多可購買 ${Math.floor(remainingCapacity)} 個`);
            return;
          }

          // 計算實際交易價格 (根據數量調整價格)
          const priceAdjustment = Math.min(1.3, 1 + (selectedAmount / 1000) * 0.3);
          const actualPrice = Math.ceil(priceInfo.currentPrice * priceAdjustment);
          const totalCost = selectedAmount * actualPrice;

          // 檢查金幣是否足夠
          if (playerGold < totalCost) {
            const maxAffordable = Math.floor(playerGold / actualPrice);
            previewText.setText(`金幣不足！最多可購買 ${maxAffordable} 個`);
            return;
          }

          // 顯示預覽信息
          previewText.setText(
            `購買 ${selectedAmount} 個 ${resourceData.displayName || selectedResource}\n` +
            `單價: ${actualPrice} (原價: ${priceInfo.currentPrice})\n` +
            `預計成本: ${totalCost} 金幣`
          );
        }
      } else {
        previewText.setText('選擇資源和數量以查看預計成本');
      }
    };

    // 添加所有元素到面板
    this.buyResourcePanel.add([
      background, title, closeButton, closeText, infoText, goldText,
      ...resourceElements,
      amountLabel, amountInput, amountText,
      ...quickButtons,
      previewBackground, previewText,
      buyConfirmButton, buyConfirmText
    ]);
  }
}