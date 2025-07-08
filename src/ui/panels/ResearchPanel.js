import BasePanel from './BasePanel.js';
import Button from '../Button.js';

/**
 * 研究面板
 * 显示和管理研究技术
 */
export default class ResearchPanel extends BasePanel {
  /**
   * 创建研究面板
   * @param {Phaser.Scene} scene - 场景对象
   * @param {Object} config - 配置对象
   */
  constructor(scene, config = {}) {
    // 调用父类构造函数
    super(scene, config.x || 400, config.y || 300, {
      width: 800,
      height: 600,
      title: '研究技术树',
      onClose: () => this.hide(),
      autoLayout: false // ResearchPanel有复杂的树状布局
    });

    // 保存配置
    this.config = config;

    // 樹狀結構相關屬性
    this.techNodes = new Map(); // 存儲技術節點
    this.connections = []; // 存儲連接線
    this.nodeWidth = 120;
    this.nodeHeight = 60;
    this.levelSpacing = 150; // 層級間距
    this.nodeSpacing = 80; // 同層節點間距

    // UI狀態管理
    this.currentDialog = null; // 當前打開的對話框元素
    this.tooltip = null; // 當前顯示的提示框

    // 创建面板内容
    this.createContent();
  }

  /**
   * 切换研究面板显示/隐藏
   * @param {Phaser.Scene} scene - 场景对象
   * @returns {ResearchPanel|null} - 面板实例或null
   */
  static togglePanel(scene) {
    // 如果面板已存在且可见，则隐藏
    if (scene.uiManager.researchPanel && scene.uiManager.researchPanel.container.visible) {
      scene.uiManager.researchPanel.hide();
      return null;
    } else {
      // 否则创建新面板
      // 如果已存在，先销毁
      if (scene.uiManager.researchPanel) {
        scene.uiManager.researchPanel.destroy();
      }

      // 创建新面板
      const panel = new ResearchPanel(scene);

      // 显示面板
      panel.show();

      // 保存引用
      scene.uiManager.researchPanel = panel;

      return panel;
    }
  }

  /**
   * 创建面板内容
   */
  createContent() {
    // 获取研究系统
    const researchSystem = this.scene.researchSystem;
    if (!researchSystem) {
      console.error('研究系统未初始化');
      return;
    }

    // 清除現有內容
    this.clearContent();

    // 獲取所有技術數據
    const allTechnologies = this.getAllTechnologies(researchSystem);

    // 計算樹狀結構佈局
    const treeLayout = this.calculateTreeLayout(allTechnologies);

    // 創建連接線
    this.createConnections(treeLayout, allTechnologies);

    // 創建技術節點
    this.createTechNodes(treeLayout, researchSystem);

    // 添加研究進度顯示
    this.createProgressDisplay(researchSystem);
  }

  /**
   * 清除現有內容
   */
  clearContent() {
    // 清除技術節點
    this.techNodes.forEach(node => {
      if (node.container) node.container.destroy();
    });
    this.techNodes.clear();

    // 清除連接線
    this.connections.forEach(line => {
      if (line.destroy) line.destroy();
    });
    this.connections = [];

    // 清除提示框
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }

    // 清除當前對話框
    this.closeCurrentDialog();
  }

  /**
   * 獲取所有技術數據
   */
  getAllTechnologies(researchSystem) {
    const technologies = {};

    // 從研究系統獲取所有技術
    Object.keys(researchSystem.technologies).forEach(techId => {
      const tech = researchSystem.getTechnology(techId);
      if (tech) {
        technologies[techId] = tech;
      }
    });

    return technologies;
  }

  /**
   * 計算樹狀結構佈局
   */
  calculateTreeLayout(technologies) {
    const layout = {};
    const levels = {};
    const visited = new Set();

    // 計算每個技術的層級
    const calculateLevel = (techId, level = 0) => {
      if (visited.has(techId)) return levels[techId] || 0;

      visited.add(techId);
      const tech = technologies[techId];
      if (!tech) return level;

      let maxPrereqLevel = -1;
      if (tech.prerequisites && tech.prerequisites.length > 0) {
        tech.prerequisites.forEach(prereqId => {
          const prereqLevel = calculateLevel(prereqId, level);
          maxPrereqLevel = Math.max(maxPrereqLevel, prereqLevel);
        });
        level = maxPrereqLevel + 1;
      }

      levels[techId] = level;
      return level;
    };

    // 計算所有技術的層級
    Object.keys(technologies).forEach(techId => {
      calculateLevel(techId);
    });

    // 按層級組織技術
    const levelGroups = {};
    Object.entries(levels).forEach(([techId, level]) => {
      if (!levelGroups[level]) levelGroups[level] = [];
      levelGroups[level].push(techId);
    });

    // 計算每個技術的位置
    Object.entries(levelGroups).forEach(([level, techIds]) => {
      const levelNum = parseInt(level);
      const x = -this.width/2 + 100 + levelNum * this.levelSpacing;

      techIds.forEach((techId, index) => {
        const totalNodes = techIds.length;
        const startY = -(totalNodes - 1) * this.nodeSpacing / 2;
        const y = startY + index * this.nodeSpacing;

        layout[techId] = { x, y, level: levelNum };
      });
    });

    return layout;
  }

  /**
   * 創建連接線
   */
  createConnections(layout, technologies) {
    Object.entries(technologies).forEach(([techId, tech]) => {
      if (tech.prerequisites && tech.prerequisites.length > 0) {
        const toPos = layout[techId];
        if (!toPos) return;

        tech.prerequisites.forEach(prereqId => {
          const fromPos = layout[prereqId];
          if (!fromPos) return;

          // 創建連接線
          const line = this.scene.add.graphics();
          line.lineStyle(2, 0x666666);
          line.beginPath();
          line.moveTo(fromPos.x + this.nodeWidth/2, fromPos.y);
          line.lineTo(toPos.x - this.nodeWidth/2, toPos.y);
          line.strokePath();

          this.connections.push(line);
          this.add(line);
        });
      }
    });
  }

  /**
   * 創建技術節點
   */
  createTechNodes(layout, researchSystem) {
    Object.entries(layout).forEach(([techId, position]) => {
      const tech = researchSystem.getTechnology(techId);
      if (!tech) return;

      // 創建節點容器
      const nodeContainer = this.scene.add.container(position.x, position.y);

      // 確定節點顏色
      let nodeColor = 0x333333; // 默認顏色
      let borderColor = 0x666666;
      let textColor = '#cccccc';

      if (tech.completed) {
        nodeColor = 0x2a5a2a; // 已完成 - 綠色
        borderColor = 0x4a8a4a;
        textColor = '#aaffaa';
      } else if (researchSystem.activeResearch === techId) {
        nodeColor = 0x5a5a2a; // 正在研究 - 黃色
        borderColor = 0x8a8a4a;
        textColor = '#ffffaa';
      } else if (researchSystem.getAvailableTechnologies().some(t => t.id === techId)) {
        nodeColor = 0x2a2a5a; // 可研究 - 藍色
        borderColor = 0x4a4a8a;
        textColor = '#aaaaff';
      } else if (tech.failed) {
        nodeColor = 0x5a2a2a; // 失敗 - 紅色
        borderColor = 0x8a4a4a;
        textColor = '#ffaaaa';
      }

      // 創建節點背景
      const nodeBackground = this.scene.add.rectangle(0, 0, this.nodeWidth, this.nodeHeight, nodeColor)
        .setStrokeStyle(2, borderColor);

      // 創建節點文字
      const nodeText = this.scene.add.text(0, -8, tech.name, {
        fontSize: '12px',
        fill: textColor,
        align: 'center',
        wordWrap: { width: this.nodeWidth - 10 }
      }).setOrigin(0.5, 0.5);

      // 添加成功率顯示
      if (!tech.completed) {
        const successRate = tech.successRate || 1.0;
        const failures = tech.failures || 0;

        // 顯示調整後的成功率
        let successRateText = `${Math.floor(successRate * 100)}%`;
        if (failures > 0) {
          successRateText += ` (+${failures * 5}%)`;
        }

        const successText = this.scene.add.text(0, 12, successRateText, {
          fontSize: '10px',
          fill: failures > 0 ? '#ffaa88' : '#888888'
        }).setOrigin(0.5, 0.5);
        nodeContainer.add(successText);
      }

      // 設置節點交互
      nodeBackground.setInteractive()
        .on('pointerdown', () => this.onNodeClick(techId))
        .on('pointerover', () => this.onNodeHover(techId, nodeContainer))
        .on('pointerout', () => this.onNodeOut(techId, nodeContainer));

      nodeContainer.add([nodeBackground, nodeText]);
      this.add(nodeContainer);

      // 存儲節點引用
      this.techNodes.set(techId, {
        container: nodeContainer,
        background: nodeBackground,
        text: nodeText,
        tech: tech
      });
    });
  }

  /**
   * 創建研究進度顯示
   */
  createProgressDisplay(researchSystem) {
    const researchProgress = researchSystem.getResearchProgress();
    let yOffset = -this.height/2 + 40;

    if (researchProgress.active) {
      const { technology, totalProgress, successRate, attempts } = researchProgress;

      // 主進度文字
      const progressText = this.scene.add.text(0, yOffset,
        `正在研究: ${technology.name} (${Math.floor(totalProgress * 100)}%)`, {
        fontSize: '14px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);

      yOffset += 20;

      // 成功率文字
      const { baseSuccessRate, failures } = researchProgress;
      const successText = this.scene.add.text(0, yOffset,
        `成功率: ${Math.floor(successRate * 100)}% (基礎: ${Math.floor(baseSuccessRate * 100)}%)`, {
        fontSize: '12px',
        fill: '#aaffaa'
      }).setOrigin(0.5, 0.5);

      yOffset += 15;

      // 失敗次數文字
      const failureText = this.scene.add.text(0, yOffset,
        `失敗次數: ${failures} (每次失敗+5%成功率)`, {
        fontSize: '11px',
        fill: failures > 0 ? '#ffaa88' : '#888888'
      }).setOrigin(0.5, 0.5);

      yOffset += 20;

      // 顯示學院能力進度
      const progressElements = [progressText, successText, failureText];
      if (researchProgress.resourceValueProgress && Object.keys(researchProgress.resourceValueProgress).length > 0) {
        Object.entries(researchProgress.resourceValueProgress).forEach(([valueType, progress]) => {
          const remaining = progress.required - progress.current;
          const resourceValue = this.scene.resourceSystem?.dataManager?.resourceValues?.get(valueType);
          const currentAvailable = resourceValue?.currentValue || 0;

          const valueText = this.scene.add.text(0, yOffset,
            `${this.getResourceValueDisplayName(valueType)}: ${Math.floor(progress.current)}/${progress.required} (還需: ${Math.floor(remaining)})`, {
            fontSize: '11px',
            fill: '#ccccff'
          }).setOrigin(0.5, 0.5);

          yOffset += 15;

          // 顯示當前可用量
          const availableText = this.scene.add.text(0, yOffset,
            `目前可用: ${Math.floor(currentAvailable)}`, {
            fontSize: '10px',
            fill: currentAvailable > 0 ? '#aaffaa' : '#ffaaaa'
          }).setOrigin(0.5, 0.5);

          progressElements.push(valueText, availableText);
          yOffset += 15;
        });
      }

      this.add(progressElements);
      yOffset += 15;
    }

    // 顯示研究隊列
    this.updateQueueDisplay(yOffset);
  }

  /**
   * 更新隊列顯示
   */
  updateQueueDisplay(startY = -this.height/2 + 100) {
    // 清除現有隊列顯示
    if (this.queueElements) {
      this.queueElements.forEach(element => {
        if (element.destroy) element.destroy();
      });
    }

    this.queueElements = [];
    const researchSystem = this.scene.researchSystem;
    const queue = researchSystem.getResearchQueue();

    if (queue.length > 0) {
      // 隊列標題
      const queueTitle = this.scene.add.text(0, startY, `研究隊列 (${queue.length})`, {
        fontSize: '14px',
        fill: '#ffff88',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);

      this.queueElements.push(queueTitle);
      let yPos = startY + 25;

      // 顯示隊列中的技術
      queue.forEach((techId, index) => {
        const tech = researchSystem.getTechnology(techId);
        if (!tech) return;

        const queueText = this.scene.add.text(0, yPos, `${index + 1}. ${tech.name}`, {
          fontSize: '12px',
          fill: '#ccccff'
        }).setOrigin(0.5, 0.5);

        // 添加移除按鈕
        const removeBtn = this.scene.add.text(150, yPos, '✕', {
          fontSize: '12px',
          fill: '#ff6666'
        }).setOrigin(0.5, 0.5)
        .setInteractive()
        .on('pointerdown', () => this.removeFromQueue(techId));

        this.queueElements.push(queueText, removeBtn);
        yPos += 20;
      });

      this.add(this.queueElements);
    }
  }

  /**
   * 從隊列中移除技術
   */
  removeFromQueue(techId) {
    const researchSystem = this.scene.researchSystem;
    if (!researchSystem) return;

    const result = researchSystem.removeFromQueue(techId);
    const color = result.success ? '#66ff66' : '#ff6666';
    this.showMessage(result.message, color);

    if (result.success) {
      this.updateQueueDisplay();
    }
  }

  /**
   * 節點點擊事件
   */
  onNodeClick(techId) {
    const researchSystem = this.scene.researchSystem;
    if (!researchSystem) return;

    // 如果有正在進行的研究，顯示選項對話框
    if (researchSystem.activeResearch) {
      this.showResearchOptions(techId);
    } else {
      this.startResearch(techId);
    }
  }

  /**
   * 節點懸停事件
   */
  onNodeHover(techId, nodeContainer) {
    // 放大效果
    nodeContainer.setScale(1.1);

    // 清除舊的提示框
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }

    // 顯示詳細需求信息
    this.showTechTooltip(techId, nodeContainer);
  }

  /**
   * 顯示技術詳細信息提示框
   */
  showTechTooltip(techId, nodeContainer) {
    const researchSystem = this.scene.researchSystem;
    const tech = researchSystem.getTechnology(techId);
    if (!tech) return;

    const requirements = tech.requirements || {};
    let tooltipText = `${tech.name}\n${tech.description}\n\n需求:`;

    // 添加資源需求
    if (requirements.resources) {
      tooltipText += '\n資源:';
      Object.entries(requirements.resources).forEach(([resourceType, amount]) => {
        const available = this.scene.resourceSystem?.resources[resourceType]?.value || 0;
        tooltipText += `\n  ${resourceType}: ${amount} (有: ${available})`;
      });
    }

    // 添加金錢需求
    if (requirements.gold) {
      const available = this.scene.gameState?.playerGold || 0;
      tooltipText += `\n金幣: ${requirements.gold} (有: ${available})`;
    }

    // 添加學院能力需求
    if (requirements.resourceValues) {
      tooltipText += '\n學院能力 (每日消耗):';
      Object.entries(requirements.resourceValues).forEach(([valueType, amount]) => {
        const displayName = this.getResourceValueDisplayName(valueType);
        tooltipText += `\n  ${displayName}: ${amount}`;
      });
    }

    // 添加時間需求
    if (requirements.time) {
      tooltipText += `\n時間: ${requirements.time} 天`;
    }

    // 添加成功率信息
    tooltipText += `\n\n成功率: ${Math.floor(tech.successRate * 100)}%`;
    if (tech.failures > 0) {
      tooltipText += ` (基礎: ${Math.floor(tech.baseSuccessRate * 100)}%, +${tech.failures * 5}%)`;
    }

    // 創建提示框
    this.tooltip = this.scene.add.text(nodeContainer.x + 80, nodeContainer.y - 50, tooltipText, {
      fontSize: '10px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 6 },
      wordWrap: { width: 200 }
    }).setOrigin(0, 0.5).setDepth(2000);

    this.add(this.tooltip);
  }

  /**
   * 節點離開事件
   */
  onNodeOut(techId, nodeContainer) {
    // 恢復原始大小
    nodeContainer.setScale(1.0);

    // 清除提示框
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
  }

  /**
   * 顯示研究選項對話框
   */
  showResearchOptions(techId) {
    const researchSystem = this.scene.researchSystem;
    const tech = researchSystem.getTechnology(techId);
    if (!tech) return;

    // 關閉現有的對話框
    this.closeCurrentDialog();

    // 檢查是否可以研究
    const canResearch = researchSystem.getAvailableTechnologies().some(t => t.id === techId);
    if (!canResearch) {
      this.showMessage('該技術目前無法研究', '#ff6666');
      return;
    }

    // 計算對話框高度（根據需求內容調整）
    const requirements = tech.requirements || {};
    let dialogHeight = 200;
    let requirementCount = 0;

    if (requirements.resources) requirementCount += Object.keys(requirements.resources).length;
    if (requirements.gold) requirementCount++;
    if (requirements.resourceValues) requirementCount += Object.keys(requirements.resourceValues).length;

    dialogHeight += requirementCount * 15;

    // 創建全屏背景遮罩（點擊關閉對話框）
    const overlay = this.scene.add.rectangle(0, 0, this.scene.scale.width * 2, this.scene.scale.height * 2, 0x000000, 0.3)
      .setDepth(999)
      .setInteractive()
      .on('pointerdown', () => {
        this.closeCurrentDialog();
      });

    // 創建對話框背景
    const dialogBg = this.scene.add.rectangle(0, 0, 350, dialogHeight, 0x000000, 0.8)
      .setStrokeStyle(2, 0x666666)
      .setDepth(1000)
      .setInteractive(); // 讓背景可交互，防止點擊穿透

    // 創建對話框標題
    const dialogTitle = this.scene.add.text(0, -dialogHeight/2 + 20, `研究: ${tech.name}`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(1001);

    // 創建說明文字
    const dialogText = this.scene.add.text(0, -dialogHeight/2 + 45, '目前有研究正在進行中', {
      fontSize: '12px',
      fill: '#cccccc'
    }).setOrigin(0.5, 0.5).setDepth(1001);

    // 顯示研究需求
    const requirementElements = [];
    let yPos = -dialogHeight/2 + 70;

    // 顯示需求標題
    const reqTitle = this.scene.add.text(0, yPos, '研究需求:', {
      fontSize: '13px',
      fill: '#ffff88',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(1001);
    requirementElements.push(reqTitle);
    yPos += 20;

    // 顯示資源需求
    if (requirements.resources) {
      Object.entries(requirements.resources).forEach(([resourceType, amount]) => {
        const available = this.scene.resourceSystem?.resources[resourceType]?.value || 0;
        const color = available >= amount ? '#aaffaa' : '#ffaaaa';
        const reqText = this.scene.add.text(0, yPos, `${resourceType}: ${amount} (有: ${available})`, {
          fontSize: '11px',
          fill: color
        }).setOrigin(0.5, 0.5).setDepth(1001);
        requirementElements.push(reqText);
        yPos += 15;
      });
    }

    // 顯示金錢需求
    if (requirements.gold) {
      const available = this.scene.gameState?.playerGold || 0;
      const color = available >= requirements.gold ? '#aaffaa' : '#ffaaaa';
      const goldText = this.scene.add.text(0, yPos, `金幣: ${requirements.gold} (有: ${available})`, {
        fontSize: '11px',
        fill: color
      }).setOrigin(0.5, 0.5).setDepth(1001);
      requirementElements.push(goldText);
      yPos += 15;
    }

    // 顯示學院能力需求
    if (requirements.resourceValues) {
      Object.entries(requirements.resourceValues).forEach(([valueType, amount]) => {
        const resourceValue = this.scene.resourceSystem?.dataManager?.resourceValues?.get(valueType);
        const available = resourceValue?.currentValue || 0;
        const displayName = this.getResourceValueDisplayName(valueType);
        const rvText = this.scene.add.text(0, yPos, `${displayName}: ${amount} (每日消耗)`, {
          fontSize: '11px',
          fill: '#ccccff'
        }).setOrigin(0.5, 0.5).setDepth(1001);
        requirementElements.push(rvText);
        yPos += 15;
      });
    }

    // 創建立即開始按鈕
    const btnY = dialogHeight/2 - 50;
    const startNowBtn = this.scene.add.rectangle(-70, btnY, 120, 30, 0x4a6a4a)
      .setStrokeStyle(1, 0x6a8a6a)
      .setInteractive()
      .setDepth(1001);

    const startNowText = this.scene.add.text(-70, btnY, '立即開始', {
      fontSize: '12px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5).setDepth(1002);

    // 創建加入隊列按鈕
    const queueBtn = this.scene.add.rectangle(70, btnY, 120, 30, 0x4a4a6a)
      .setStrokeStyle(1, 0x6a6a8a)
      .setInteractive()
      .setDepth(1001);

    const queueText = this.scene.add.text(70, btnY, '加入隊列', {
      fontSize: '12px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5).setDepth(1002);

    // 創建取消按鈕
    const cancelY = dialogHeight/2 - 15;
    const cancelBtn = this.scene.add.rectangle(0, cancelY, 80, 25, 0x6a4a4a)
      .setStrokeStyle(1, 0x8a6a6a)
      .setInteractive()
      .setDepth(1001);

    const cancelText = this.scene.add.text(0, cancelY, '取消', {
      fontSize: '12px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5).setDepth(1002);

    // 存儲對話框元素
    const dialogElements = [overlay, dialogBg, dialogTitle, dialogText, ...requirementElements, startNowBtn, startNowText, queueBtn, queueText, cancelBtn, cancelText];

    // 保存當前對話框引用
    this.currentDialog = dialogElements;

    // 設置按鈕事件
    startNowBtn.on('pointerdown', () => {
      this.closeCurrentDialog();
      this.startResearch(techId);
    });

    queueBtn.on('pointerdown', () => {
      this.closeCurrentDialog();
      this.addToQueue(techId);
    });

    cancelBtn.on('pointerdown', () => {
      this.closeCurrentDialog();
    });

    // 添加到場景
    this.add(dialogElements);
  }

  /**
   * 關閉當前對話框
   */
  closeCurrentDialog() {
    if (this.currentDialog) {
      this.currentDialog.forEach(element => {
        if (element && element.destroy) element.destroy();
      });
      this.currentDialog = null;
    }
  }

  /**
   * 關閉對話框（向後兼容）
   */
  closeDialog(elements) {
    elements.forEach(element => {
      if (element && element.destroy) element.destroy();
    });
  }

  /**
   * 添加到研究隊列
   */
  addToQueue(techId) {
    const researchSystem = this.scene.researchSystem;
    if (!researchSystem) return;

    const result = researchSystem.addToQueue(techId);
    const color = result.success ? '#66ff66' : '#ff6666';
    this.showMessage(result.message, color);

    if (result.success) {
      this.updateQueueDisplay();
    }
  }

  /**
   * 顯示消息
   */
  showMessage(message, color = '#ffffff') {
    const notification = this.scene.add.text(this.scene.scale.width / 2, 100, message, {
      fontSize: '16px',
      fill: color,
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5, 0.5).setDepth(100);

    // 3秒後自動消失
    this.scene.time.delayedCall(3000, () => {
      notification.destroy();
    });
  }

  /**
   * 獲取學院能力顯示名稱
   */
  getResourceValueDisplayName(valueType) {
    const displayNames = {
      happiness: '快樂度',
      transport: '運力',
      security: '安保力',
      health: '健康度'
    };
    return displayNames[valueType] || valueType;
  }

  /**
   * 开始研究
   * @param {string} techId - 技术ID
   */
  startResearch(techId) {
    console.log(`Starting research: ${techId}`);

    // 获取研究系统
    const researchSystem = this.scene.researchSystem;
    if (!researchSystem) return;

    // 开始研究
    const result = researchSystem.startResearch(techId);

    // 更新面板
    this.update();

    // 显示消息
    const backgroundColor = result.success ? '#3a8c3a' : '#8c3a3a';
    const notification = this.scene.add.text(this.scene.scale.width / 2, 100, result.message, {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: backgroundColor,
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5, 0.5).setDepth(100);

    // 3秒后自动消失
    this.scene.time.delayedCall(3000, () => {
      notification.destroy();
    });

    // 记录日志
    console.log(result.message);
  }

  /**
   * 更新面板内容
   */
  update() {
    // 销毁当前面板
    this.destroy();

    // 创建新的面板
    const panel = new ResearchPanel(this.scene, {
      x: this.x,
      y: this.y
    });

    // 显示面板
    panel.show();

    // 更新UIManager中的引用
    this.scene.uiManager.researchPanel = panel;
  }

  /**
   * 隱藏面板時的清理工作
   */
  hide() {
    // 關閉當前對話框
    this.closeCurrentDialog();

    // 清除提示框
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }

    // 調用父類的hide方法
    super.hide();
  }

}
