import BasePanel from './BasePanel.js';
import Button from '../Button.js';

/**
 * 冒險者管理面板
 */
export default class AdventurerPanel extends BasePanel {
  /**
   * 創建冒險者管理面板
   * @param {Phaser.Scene} scene - 場景對象
   * @param {Object} config - 配置對象
   */
  constructor(scene, config = {}) {
    super(scene, config.x || 450, config.y || 330, {
      width: 1000,  // 增加寬度以容納4個標籤
      height: 700,
      title: '冒險者公會',
      onClose: () => this.hide(),
      autoLayout: false
    });

    this.config = config;
    this.currentTab = config.currentTab || 'teams'; // teams, quests, history, ai
    this.selectedTeam = null;
    this.selectedQuest = null;

    console.log('AdventurerPanel 構造函數: currentTab =', this.currentTab);
    this.createContent();
  }

  /**
   * 創建面板內容
   */
  createContent() {
    const adventurerSystem = this.scene.adventurerSystem;
    if (!adventurerSystem) {
      console.error('冒險者系統未初始化');
      return;
    }

    if (!adventurerSystem.isActive) {
      this.createInactiveMessage();
      return;
    }

    this.createTabs();
    this.createTabContent();
  }

  /**
   * 創建未啟動消息
   */
  createInactiveMessage() {
    const message = this.scene.add.text(0, 0, '需要建造冒險者公會才能使用此功能', {
      fontSize: '18px',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    this.add(message);
  }

  /**
   * 創建標籤頁
   */
  createTabs() {
    const tabY = -this.height/2 + 50;
    const tabWidth = 90;   // 調整標籤寬度
    const tabHeight = 35;

    // 重新計算標籤位置，確保在1000px寬度內均勻分佈
    const totalWidth = this.width - 100; // 留出邊距
    const spacing = totalWidth / 4; // 4個標籤的間距
    const startX = -totalWidth/2 + spacing/2; // 起始位置

    console.log('AdventurerPanel createTabs: 開始創建標籤');
    console.log('面板寬度:', this.width, '標籤起始位置:', startX, '間距:', spacing);
    console.log('當前標籤:', this.currentTab);

    // 標籤配置
    const tabConfigs = [
      { key: 'teams', label: '團隊', x: startX },
      { key: 'quests', label: '任務', x: startX + spacing },
      { key: 'history', label: '歷史', x: startX + spacing * 2 },
      { key: 'ai', label: 'AI控制', x: startX + spacing * 3 }
    ];

    this.tabs = [];
    let successCount = 0;

    tabConfigs.forEach((config, index) => {
      try {
        const isActive = this.currentTab === config.key;
        console.log(`創建標籤 ${index}: ${config.label} (${config.key})`);
        console.log(`  位置: x=${config.x}, y=${tabY}`);
        console.log(`  激活狀態: ${isActive}`);

        // 檢查Button類是否可用
        if (typeof Button === 'undefined') {
          console.error('Button類未定義');
          return;
        }

        const tab = new Button(this.scene, config.x, tabY, config.label, {
          width: tabWidth,
          height: tabHeight,
          backgroundColor: isActive ? 0x4a6a4a : 0x333333,
          fontSize: '12px',
          textColor: '#ffffff',
          onClick: () => {
            console.log(`點擊標籤: ${config.key}`);
            this.switchTab(config.key);
          }
        });

        if (tab && tab.getElements) {
          this.tabs.push(tab);
          const elements = tab.getElements();
          this.add(elements);
          successCount++;
          console.log(`✅ 標籤 ${config.label} 創建成功 (${successCount}/${tabConfigs.length})`);
        } else {
          console.error(`❌ 標籤 ${config.label} 創建失敗: tab或getElements方法無效`);
        }
      } catch (error) {
        console.error(`❌ 創建標籤 ${config.label} 時發生錯誤:`, error);
      }
    });

    console.log(`AdventurerPanel: 標籤創建完成，成功: ${successCount}/${tabConfigs.length}`);
    console.log('最終標籤數組長度:', this.tabs.length);

    // 如果標籤創建失敗，嘗試備用方法
    if (successCount < 4) {
      console.warn('⚠️ 部分標籤創建失敗，嘗試備用方法...');
      this.createTabsBackup();
    }
  }

  /**
   * 備用標籤創建方法
   */
  createTabsBackup() {
    console.log('使用備用方法創建標籤...');

    const tabY = -this.height/2 + 50;
    const tabConfigs = [
      { key: 'teams', label: '團隊', x: -350 },
      { key: 'quests', label: '任務', x: -150 },
      { key: 'history', label: '歷史', x: 50 },
      { key: 'ai', label: 'AI', x: 250 }
    ];

    // 清空現有標籤
    this.tabs = [];

    tabConfigs.forEach((config, index) => {
      try {
        // 使用簡單的矩形和文字創建標籤
        const isActive = this.currentTab === config.key;
        const bgColor = isActive ? 0x4a6a4a : 0x333333;

        // 創建背景矩形
        const bg = this.scene.add.rectangle(config.x, tabY, 80, 35, bgColor)
          .setInteractive()
          .on('pointerdown', () => {
            console.log(`備用標籤點擊: ${config.key}`);
            this.switchTab(config.key);
          });

        // 創建文字
        const text = this.scene.add.text(config.x, tabY, config.label, {
          fontSize: '12px',
          fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // 添加到面板
        this.add([bg, text]);

        // 保存標籤信息
        this.tabs.push({ bg, text, key: config.key });

        console.log(`✅ 備用標籤 ${config.label} 創建成功`);
      } catch (error) {
        console.error(`❌ 備用標籤 ${config.label} 創建失敗:`, error);
      }
    });

    console.log(`備用方法完成，創建了 ${this.tabs.length} 個標籤`);
  }

  /**
   * 切換標籤頁
   */
  switchTab(tabName) {
    console.log(`切換標籤: ${this.currentTab} -> ${tabName}`);
    this.currentTab = tabName;
    this.update();
  }

  /**
   * 創建標籤頁內容
   */
  createTabContent() {
    const contentY = -this.height/2 + 100;

    switch (this.currentTab) {
      case 'teams':
        this.createTeamsContent(contentY);
        break;
      case 'quests':
        this.createQuestsContent(contentY);
        break;
      case 'history':
        this.createHistoryContent(contentY);
        break;
      case 'ai':
        this.createAIContent(contentY);
        break;
    }
  }

  /**
   * 創建團隊內容
   */
  createTeamsContent(startY) {
    const adventurerSystem = this.scene.adventurerSystem;
    const teams = adventurerSystem.getTeams();

    let yPos = startY;

    // 招募新團隊按鈕
    const recruitBtn = new Button(this.scene, -300, yPos, '招募新團隊', {
      width: 120,
      height: 30,
      backgroundColor: 0x4a6a4a,
      fontSize: '12px',
      textColor: '#ffffff',
      onClick: () => this.recruitTeam()
    });

    this.add(recruitBtn.getElements());
    yPos += 50;

    // 團隊列表
    teams.forEach((team, index) => {
      this.createTeamItem(team, -350, yPos);
      yPos += 120;
    });
  }

  /**
   * 創建團隊項目
   */
  createTeamItem(team, x, y) {
    // 團隊背景
    const teamBg = this.scene.add.rectangle(x + 200, y, 400, 100, 0x2a2a2a, 0.8)
      .setStrokeStyle(2, team.currentQuest ? 0x6a6a2a : 0x4a4a4a);

    // 團隊名稱和等級
    const teamTitle = this.scene.add.text(x + 20, y - 30, `${team.name} [${team.rank}級]`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // 成員信息
    const memberInfo = this.scene.add.text(x + 20, y - 10, 
      `成員: ${team.memberCount}/${team.maxMembers} | 戰鬥力: ${team.totalCombatPower} | 資金: ${team.funds}`, {
      fontSize: '12px',
      fill: '#cccccc'
    }).setOrigin(0, 0.5);

    // 物資信息
    const suppliesInfo = this.scene.add.text(x + 20, y + 10, 
      `物資剩餘: ${team.suppliesDaysRemaining} 天 | ${team.isLocalResident ? '本地常駐' : '外來團隊'}`, {
      fontSize: '12px',
      fill: '#aaaaaa'
    }).setOrigin(0, 0.5);

    // 任務狀態
    let questStatus = '待命中';
    if (team.currentQuest) {
      const progress = team.questProgress;
      questStatus = `執行中: ${team.currentQuest.name} (${Math.floor(progress.progress * 100)}%)`;
    }

    const questInfo = this.scene.add.text(x + 20, y + 30, questStatus, {
      fontSize: '12px',
      fill: team.currentQuest ? '#ffff88' : '#88ff88'
    }).setOrigin(0, 0.5);

    // 操作按鈕
    const viewBtn = new Button(this.scene, x + 320, y - 20, '查看詳情', {
      width: 80,
      height: 25,
      backgroundColor: 0x4a4a6a,
      fontSize: '11px',
      textColor: '#ffffff',
      onClick: () => this.viewTeamDetails(team)
    });

    const supplyBtn = new Button(this.scene, x + 320, y + 10, '補充物資', {
      width: 80,
      height: 25,
      backgroundColor: 0x6a4a4a,
      fontSize: '11px',
      textColor: '#ffffff',
      onClick: () => this.supplyTeam(team)
    });

    // 服務按鈕
    const serviceBtn = new Button(this.scene, x + 320, y + 40, '建築服務', {
      width: 80,
      height: 25,
      backgroundColor: 0x4a6a6a,
      fontSize: '11px',
      textColor: '#ffffff',
      onClick: () => this.showBuildingServices(team)
    });

    this.add([teamBg, teamTitle, memberInfo, suppliesInfo, questInfo, ...viewBtn.getElements(), ...supplyBtn.getElements(), ...serviceBtn.getElements()]);
  }

  /**
   * 創建任務內容
   */
  createQuestsContent(startY) {
    const adventurerSystem = this.scene.adventurerSystem;
    const quests = adventurerSystem.getAvailableQuests();

    let yPos = startY;

    // 發布新任務按鈕
    const publishBtn = new Button(this.scene, -300, yPos, '發布新任務', {
      width: 120,
      height: 30,
      backgroundColor: 0x4a6a4a,
      fontSize: '12px',
      textColor: '#ffffff',
      onClick: () => this.publishQuest()
    });

    this.add(publishBtn.getElements());
    yPos += 50;

    // 任務列表
    quests.forEach((quest, index) => {
      this.createQuestItem(quest, -350, yPos);
      yPos += 100;
    });
  }

  /**
   * 創建任務項目
   */
  createQuestItem(quest, x, y) {
    // 任務背景
    const questBg = this.scene.add.rectangle(x + 200, y, 400, 80, 0x2a2a2a, 0.8)
      .setStrokeStyle(2, 0x4a4a4a);

    // 任務名稱和類型
    const questTitle = this.scene.add.text(x + 20, y - 25, `${quest.name} [${quest.type}]`, {
      fontSize: '14px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // 任務描述
    const questDesc = this.scene.add.text(x + 20, y - 5, quest.description, {
      fontSize: '11px',
      fill: '#cccccc',
      wordWrap: { width: 250 }
    }).setOrigin(0, 0.5);

    // 任務信息
    const questInfo = this.scene.add.text(x + 20, y + 15, 
      `難度: ${quest.difficulty} | 預計: ${quest.estimatedDays}天 | 獎勵: ${quest.rewards.gold || 0}金幣`, {
      fontSize: '11px',
      fill: '#aaaaaa'
    }).setOrigin(0, 0.5);

    // 分配按鈕
    const assignBtn = new Button(this.scene, x + 320, y, '分配團隊', {
      width: 80,
      height: 30,
      backgroundColor: 0x4a6a4a,
      fontSize: '11px',
      textColor: '#ffffff',
      onClick: () => this.assignQuest(quest)
    });

    this.add([questBg, questTitle, questDesc, questInfo, ...assignBtn.getElements()]);
  }

  /**
   * 創建歷史內容
   */
  createHistoryContent(startY) {
    const adventurerSystem = this.scene.adventurerSystem;
    const history = adventurerSystem.getStatus().recentCompletedQuests;

    let yPos = startY;

    if (history.length === 0) {
      const noHistory = this.scene.add.text(0, yPos, '暫無任務歷史記錄', {
        fontSize: '16px',
        fill: '#888888'
      }).setOrigin(0.5, 0.5);

      this.add(noHistory);
      return;
    }

    // 歷史記錄列表
    history.forEach((record, index) => {
      this.createHistoryItem(record, -350, yPos);
      yPos += 80;
    });
  }

  /**
   * 創建歷史記錄項目
   */
  createHistoryItem(record, x, y) {
    const statusColor = record.success ? '#88ff88' : '#ff8888';
    const statusText = record.success ? '成功' : '失敗';

    // 記錄背景
    const recordBg = this.scene.add.rectangle(x + 200, y, 400, 60, 0x2a2a2a, 0.8)
      .setStrokeStyle(2, record.success ? 0x4a6a4a : 0x6a4a4a);

    // 任務信息
    const questInfo = this.scene.add.text(x + 20, y - 15, 
      `${record.name} - ${record.teamName} [${statusText}]`, {
      fontSize: '14px',
      fill: statusColor,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // 完成時間
    const completedTime = new Date(record.completedTime).toLocaleString();
    const timeInfo = this.scene.add.text(x + 20, y + 5, `完成時間: ${completedTime}`, {
      fontSize: '11px',
      fill: '#aaaaaa'
    }).setOrigin(0, 0.5);

    this.add([recordBg, questInfo, timeInfo]);
  }

  /**
   * 招募團隊
   */
  recruitTeam() {
    const adventurerSystem = this.scene.adventurerSystem;
    const result = adventurerSystem.recruitTeam();
    
    this.showMessage(result.message, result.success ? '#88ff88' : '#ff8888');
    
    if (result.success) {
      this.update();
    }
  }

  /**
   * 查看團隊詳情
   */
  viewTeamDetails(team) {
    // 這裡可以打開詳細的團隊信息對話框
    console.log('查看團隊詳情:', team);
  }

  /**
   * 補充物資
   */
  supplyTeam(team) {
    // 這裡可以打開物資補充對話框
    console.log('補充物資:', team);
  }

  /**
   * 顯示文本輸入對話框
   */
  showTextInputDialog(title, currentText, callback) {
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;

    // 創建輸入對話框
    const inputBg = this.scene.add.rectangle(centerX, centerY, 400, 200, 0x1a1a1a, 0.98)
      .setStrokeStyle(2, 0x4a4a4a);

    const inputTitle = this.scene.add.text(centerX, centerY - 70, `輸入${title}`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    // 使用瀏覽器的prompt作為簡單解決方案
    setTimeout(() => {
      const newText = prompt(`請輸入${title}:`, currentText);
      callback(newText);

      // 清理對話框
      inputBg.destroy();
      inputTitle.destroy();
    }, 100);
  }

  /**
   * 顯示任務類型選擇器
   */
  showQuestTypeSelector(questTypes, currentType, callback) {
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;

    // 創建選擇器背景
    const selectorBg = this.scene.add.rectangle(centerX, centerY, 300, 250, 0x2a2a2a, 0.95)
      .setStrokeStyle(2, 0x4a4a4a);

    const selectorTitle = this.scene.add.text(centerX, centerY - 100, '選擇任務類型', {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const elements = [selectorBg, selectorTitle];
    let yPos = centerY - 60;

    questTypes.forEach((type, index) => {
      const typeBtn = new Button(this.scene, centerX, yPos, type.name, {
        width: 200,
        height: 30,
        backgroundColor: type.key === currentType.key ? 0x4a6a4a : 0x4a4a6a,
        fontSize: '12px',
        textColor: '#ffffff',
        onClick: () => {
          callback(type);
          this.closeDialog(elements);
        }
      });

      elements.push(...typeBtn.getElements());
      yPos += 35;
    });

    // 取消按鈕
    const cancelBtn = new Button(this.scene, centerX, yPos + 10, '取消', {
      width: 80,
      height: 25,
      backgroundColor: 0x6a4a4a,
      fontSize: '12px',
      textColor: '#ffffff',
      onClick: () => this.closeDialog(elements)
    });

    elements.push(...cancelBtn.getElements());

    // 添加到場景
    elements.forEach(element => {
      this.scene.add.existing(element);
    });
  }

  /**
   * 截斷文本
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * 創建自定義任務
   */
  createCustomQuest(type, name, description, rewardAmount, estimatedDays) {
    const adventurerSystem = this.scene.adventurerSystem;

    const questData = {
      type: type,
      name: name || `自定義${this.getQuestTypeName(type)}`,
      description: description || `玩家發布的${this.getQuestTypeName(type)}任務`,
      difficulty: 80 + Math.floor(Math.random() * 40),
      estimatedDays: estimatedDays,
      rewards: { gold: rewardAmount },
      requirements: {
        minRank: 'F',
        minMembers: 2,
        minCombatPower: 100
      },
      duration: 7 // 7天後過期
    };

    const result = adventurerSystem.publishQuest(questData);
    if (result.success) {
      this.showMessage(`任務 "${result.quest.name}" 發布成功！`, '#88ff88');
      this.update(); // 刷新面板顯示新任務
    } else {
      this.showMessage(`任務發布失敗: ${result.message}`, '#ff8888');
    }
  }

  /**
   * 獲取任務類型名稱
   */
  getQuestTypeName(type) {
    const typeNames = {
      'resource_gathering': '資源收集',
      'monster_clearing': '魔獸清理',
      'escort_mission': '護送任務',
      'exploration': '探索任務',
      'special_delivery': '特殊運送'
    };
    return typeNames[type] || '未知任務';
  }

  /**
   * 關閉任務對話框
   */
  closeQuestDialog(elements) {
    if (elements) {
      elements.forEach(element => {
        if (element && element.destroy) {
          element.destroy();
        }
      });
    }
    this.questDialog = null;
  }

  /**
   * 分配任務
   */
  assignQuest(quest) {
    // 這裡可以打開團隊選擇對話框
    console.log('分配任務:', quest);
    this.showTeamSelectionDialog(quest);
  }

  /**
   * 顯示團隊選擇對話框
   */
  showTeamSelectionDialog(quest) {
    const adventurerSystem = this.scene.adventurerSystem;
    const teams = adventurerSystem.getTeams().filter(team => !team.currentQuest);

    if (teams.length === 0) {
      this.showMessage('沒有可用的空閒團隊', '#ff8888');
      return;
    }

    // 獲取畫面中心位置
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;

    // 創建簡單的團隊選擇對話框，位置設置為畫面中心
    const dialogBg = this.scene.add.rectangle(centerX, centerY, 400, 300, 0x2a2a2a, 0.95)
      .setStrokeStyle(2, 0x4a4a4a);

    const title = this.scene.add.text(centerX, centerY - 130, `選擇團隊執行任務: ${quest.name}`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const elements = [dialogBg, title];
    let yPos = centerY - 80;

    teams.slice(0, 4).forEach((team, index) => { // 最多顯示4個團隊
      const teamButton = new Button(this.scene, centerX, yPos,
        `${team.name} [${team.rank}級] (${team.members.length}人)`, {
        width: 300,
        height: 30,
        backgroundColor: 0x4a4a6a,
        fontSize: '12px',
        textColor: '#ffffff',
        onClick: () => {
          this.assignQuestToTeam(quest.id, team.id);
          this.closeDialog(elements);
        }
      });

      elements.push(...teamButton.getElements());
      yPos += 40;
    });

    // 取消按鈕
    const cancelButton = new Button(this.scene, centerX, yPos + 20, '取消', {
      width: 100,
      height: 30,
      backgroundColor: 0x6a4a4a,
      fontSize: '12px',
      textColor: '#ffffff',
      onClick: () => this.closeDialog(elements)
    });

    elements.push(...cancelButton.getElements());

    // 添加到場景
    elements.forEach(element => {
      this.scene.add.existing(element);
    });
  }

  /**
   * 分配任務給團隊
   */
  assignQuestToTeam(questId, teamId) {
    const adventurerSystem = this.scene.adventurerSystem;
    const result = adventurerSystem.assignQuestToTeam(questId, teamId);

    if (result.success) {
      this.showMessage('任務分配成功！', '#88ff88');
      this.update();
    } else {
      this.showMessage(`任務分配失敗: ${result.message}`, '#ff8888');
    }
  }

  /**
   * 關閉對話框
   */
  closeDialog(elements) {
    if (elements) {
      elements.forEach(element => {
        if (element && element.destroy) {
          element.destroy();
        }
      });
    }
  }

  /**
   * 發布任務
   */
  publishQuest() {
    console.log('打開任務發布對話框');
    this.showQuestPublishDialog();
  }

  /**
   * 顯示任務發布對話框
   */
  showQuestPublishDialog() {
    // 獲取畫面中心位置
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;

    // 創建對話框背景，位置設置為畫面中心
    const dialogBg = this.scene.add.rectangle(centerX, centerY, 500, 400, 0x2a2a2a, 0.95)
      .setStrokeStyle(2, 0x4a4a4a);

    // 對話框標題
    const title = this.scene.add.text(centerX, centerY - 180, '發布新任務', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    // 任務名稱輸入
    const nameLabel = this.scene.add.text(centerX - 220, centerY - 140, '任務名稱:', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);

    let questName = '自定義任務';
    const nameInput = this.scene.add.rectangle(centerX, centerY - 140, 300, 30, 0x333333)
      .setStrokeStyle(1, 0x666666)
      .setInteractive()
      .on('pointerdown', () => {
        this.showTextInputDialog('任務名稱', questName, (newName) => {
          questName = newName || '自定義任務';
          nameText.setText(questName);
        });
      });

    const nameText = this.scene.add.text(centerX, centerY - 140, questName, {
      fontSize: '12px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 任務描述
    const descLabel = this.scene.add.text(centerX - 220, centerY - 100, '任務描述:', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);

    let questDesc = '玩家自定義的任務';
    const descInput = this.scene.add.rectangle(centerX, centerY - 70, 300, 60, 0x333333)
      .setStrokeStyle(1, 0x666666)
      .setInteractive()
      .on('pointerdown', () => {
        this.showTextInputDialog('任務描述', questDesc, (newDesc) => {
          questDesc = newDesc || '玩家自定義的任務';
          descText.setText(this.truncateText(questDesc, 35));
        });
      });

    const descText = this.scene.add.text(centerX, centerY - 70, this.truncateText(questDesc, 35), {
      fontSize: '12px',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: 280 }
    }).setOrigin(0.5, 0.5);

    // 任務類型選擇
    const typeLabel = this.scene.add.text(centerX - 220, centerY - 20, '任務類型:', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);

    const questTypes = [
      { key: 'resource_gathering', name: '資源收集' },
      { key: 'monster_clearing', name: '魔獸清理' },
      { key: 'escort_mission', name: '護送任務' },
      { key: 'exploration', name: '探索任務' },
      { key: 'special_delivery', name: '特殊運送' }
    ];

    let selectedType = questTypes[0];
    const typeButton = new Button(this.scene, centerX, centerY - 20, selectedType.name, {
      width: 150,
      height: 30,
      backgroundColor: 0x4a4a6a,
      fontSize: '12px',
      textColor: '#ffffff',
      onClick: () => {
        this.showQuestTypeSelector(questTypes, selectedType, (newType) => {
          selectedType = newType;
          // 更新按鈕文字
          typeButton.setText(selectedType.name);
        });
      }
    });

    // 獎勵設置
    const rewardLabel = this.scene.add.text(centerX - 220, centerY + 20, '金幣獎勵:', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);

    let rewardAmount = 100;
    const rewardMinus = new Button(this.scene, centerX - 50, centerY + 20, '-', {
      width: 30,
      height: 25,
      backgroundColor: 0x6a4a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => {
        rewardAmount = Math.max(50, rewardAmount - 50);
        rewardText.setText(rewardAmount.toString());
      }
    });

    const rewardText = this.scene.add.text(centerX, centerY + 20, rewardAmount.toString(), {
      fontSize: '14px',
      fill: '#ffff88',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const rewardPlus = new Button(this.scene, centerX + 50, centerY + 20, '+', {
      width: 30,
      height: 25,
      backgroundColor: 0x4a6a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => {
        rewardAmount = Math.min(1000, rewardAmount + 50);
        rewardText.setText(rewardAmount.toString());
      }
    });

    // 預計天數
    const daysLabel = this.scene.add.text(centerX - 220, centerY + 60, '預計天數:', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);

    let estimatedDays = 3;
    const daysMinus = new Button(this.scene, centerX - 50, centerY + 60, '-', {
      width: 30,
      height: 25,
      backgroundColor: 0x6a4a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => {
        estimatedDays = Math.max(1, estimatedDays - 1);
        daysText.setText(estimatedDays.toString());
      }
    });

    const daysText = this.scene.add.text(centerX, centerY + 60, estimatedDays.toString(), {
      fontSize: '14px',
      fill: '#ffff88',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const daysPlus = new Button(this.scene, centerX + 50, centerY + 60, '+', {
      width: 30,
      height: 25,
      backgroundColor: 0x4a6a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => {
        estimatedDays = Math.min(10, estimatedDays + 1);
        daysText.setText(estimatedDays.toString());
      }
    });

    // 按鈕
    const publishButton = new Button(this.scene, centerX - 80, centerY + 140, '發布任務', {
      width: 100,
      height: 35,
      backgroundColor: 0x4a6a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => {
        this.createCustomQuest(selectedType.key, questName, questDesc, rewardAmount, estimatedDays);
        this.closeQuestDialog(dialogElements);
      }
    });

    const cancelButton = new Button(this.scene, centerX + 80, centerY + 140, '取消', {
      width: 100,
      height: 35,
      backgroundColor: 0x6a4a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.closeQuestDialog(dialogElements)
    });

    // 收集所有對話框元素
    const dialogElements = [
      dialogBg, title, nameLabel, nameInput, nameText,
      descLabel, descInput, descText, typeLabel,
      rewardLabel, rewardText, daysLabel, daysText,
      ...typeButton.getElements(),
      ...rewardMinus.getElements(),
      ...rewardPlus.getElements(),
      ...daysMinus.getElements(),
      ...daysPlus.getElements(),
      ...publishButton.getElements(),
      ...cancelButton.getElements()
    ];

    // 添加到場景
    dialogElements.forEach(element => {
      this.scene.add.existing(element);
    });

    // 保存對話框引用
    this.questDialog = {
      elements: dialogElements,
      selectedType: selectedType,
      rewardAmount: rewardAmount,
      estimatedDays: estimatedDays
    };
  }

  /**
   * 顯示建築服務選項
   */
  showBuildingServices(team) {
    const adventurerSystem = this.scene.adventurerSystem;
    const services = adventurerSystem.availableServices;

    // 創建服務對話框
    const dialogBg = this.scene.add.rectangle(0, 0, 400, 500, 0x000000, 0.9)
      .setStrokeStyle(2, 0x666666)
      .setDepth(1000);

    const dialogTitle = this.scene.add.text(0, -220, `${team.name} - 建築服務`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(1001);

    const serviceElements = [dialogBg, dialogTitle];
    let yPos = -180;

    // 旅館服務
    if (services.has('inn')) {
      const innTitle = this.scene.add.text(0, yPos, '🏨 旅館服務', {
        fontSize: '14px',
        fill: '#ffff88',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(1001);

      const healBtn = new Button(this.scene, -80, yPos + 25, '治療 (50金)', {
        width: 80,
        height: 25,
        backgroundColor: 0x4a6a4a,
        fontSize: '10px',
        textColor: '#ffffff',
        onClick: () => {
          this.closeServiceDialog(serviceElements);
          this.useInnService(team, 'basic');
        }
      });

      const luxuryBtn = new Button(this.scene, 80, yPos + 25, '豪華服務 (100金)', {
        width: 80,
        height: 25,
        backgroundColor: 0x6a4a6a,
        fontSize: '10px',
        textColor: '#ffffff',
        onClick: () => {
          this.closeServiceDialog(serviceElements);
          this.useInnService(team, 'luxury');
        }
      });

      serviceElements.push(innTitle, ...healBtn.getElements(), ...luxuryBtn.getElements());
      yPos += 60;
    }

    // 酒館服務
    if (services.has('tavern')) {
      const tavernTitle = this.scene.add.text(0, yPos, '🍺 酒館服務', {
        fontSize: '14px',
        fill: '#ffff88',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(1001);

      const intelBtn = new Button(this.scene, -80, yPos + 25, '收集情報 (30金)', {
        width: 80,
        height: 25,
        backgroundColor: 0x4a6a4a,
        fontSize: '10px',
        textColor: '#ffffff',
        onClick: () => {
          this.closeServiceDialog(serviceElements);
          this.useTavernIntelligence(team);
        }
      });

      const recruitBtn = new Button(this.scene, 80, yPos + 25, '招募成員 (100金)', {
        width: 80,
        height: 25,
        backgroundColor: 0x6a4a6a,
        fontSize: '10px',
        textColor: '#ffffff',
        onClick: () => {
          this.closeServiceDialog(serviceElements);
          this.useTavernRecruitment(team);
        }
      });

      serviceElements.push(tavernTitle, ...intelBtn.getElements(), ...recruitBtn.getElements());
      yPos += 60;
    }

    // 教會服務
    if (services.has('church')) {
      const churchTitle = this.scene.add.text(0, yPos, '⛪ 教會服務', {
        fontSize: '14px',
        fill: '#ffff88',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(1001);

      const resurrectBtn = new Button(this.scene, 0, yPos + 25, '復活服務 (200金)', {
        width: 120,
        height: 25,
        backgroundColor: 0x4a6a4a,
        fontSize: '10px',
        textColor: '#ffffff',
        onClick: () => {
          this.closeServiceDialog(serviceElements);
          this.showResurrectionOptions(team);
        }
      });

      serviceElements.push(churchTitle, ...resurrectBtn.getElements());
      yPos += 60;
    }

    // 關閉按鈕
    const closeBtn = new Button(this.scene, 0, 200, '關閉', {
      width: 80,
      height: 30,
      backgroundColor: 0x6a4a4a,
      fontSize: '12px',
      textColor: '#ffffff',
      onClick: () => this.closeServiceDialog(serviceElements)
    });

    serviceElements.push(...closeBtn.getElements());
    this.add(serviceElements);
  }

  /**
   * 關閉服務對話框
   */
  closeServiceDialog(elements) {
    elements.forEach(element => {
      if (element && element.destroy) element.destroy();
    });
  }

  /**
   * 使用旅館服務
   */
  useInnService(team, serviceLevel) {
    const adventurerSystem = this.scene.adventurerSystem;
    const result = adventurerSystem.healTeamAtInn(team.id, serviceLevel);

    this.showMessage(result.message, result.success ? '#88ff88' : '#ff8888');

    if (result.success) {
      this.update();
    }
  }

  /**
   * 使用酒館情報服務
   */
  useTavernIntelligence(team) {
    const adventurerSystem = this.scene.adventurerSystem;
    const result = adventurerSystem.gatherIntelligenceAtTavern(team.id);

    this.showMessage(result.message, result.success ? '#88ff88' : '#ff8888');

    if (result.success) {
      this.update();
    }
  }

  /**
   * 使用酒館招募服務
   */
  useTavernRecruitment(team) {
    const adventurerSystem = this.scene.adventurerSystem;
    const result = adventurerSystem.recruitMemberAtTavern(team.id);

    this.showMessage(result.message, result.success ? '#88ff88' : '#ff8888');

    if (result.success) {
      this.update();
    }
  }

  /**
   * 顯示復活選項
   */
  showResurrectionOptions(team) {
    const deadMembers = team.members.filter(member => !member.isAlive());

    if (deadMembers.length === 0) {
      this.showMessage('團隊中沒有需要復活的成員', '#ffff88');
      return;
    }

    // 創建復活選擇對話框
    const dialogBg = this.scene.add.rectangle(0, 0, 300, 200 + deadMembers.length * 40, 0x000000, 0.9)
      .setStrokeStyle(2, 0x666666)
      .setDepth(1000);

    const dialogTitle = this.scene.add.text(0, -80, '選擇要復活的成員', {
      fontSize: '14px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(1001);

    const resElements = [dialogBg, dialogTitle];
    let yPos = -50;

    deadMembers.forEach(member => {
      const memberBtn = new Button(this.scene, 0, yPos, `復活 ${member.name}`, {
        width: 200,
        height: 30,
        backgroundColor: 0x4a6a4a,
        fontSize: '12px',
        textColor: '#ffffff',
        onClick: () => {
          this.closeServiceDialog(resElements);
          this.resurrectMember(team, member.id);
        }
      });

      resElements.push(...memberBtn.getElements());
      yPos += 40;
    });

    // 關閉按鈕
    const closeBtn = new Button(this.scene, 0, yPos + 20, '取消', {
      width: 80,
      height: 25,
      backgroundColor: 0x6a4a4a,
      fontSize: '12px',
      textColor: '#ffffff',
      onClick: () => this.closeServiceDialog(resElements)
    });

    resElements.push(...closeBtn.getElements());
    this.add(resElements);
  }

  /**
   * 復活成員
   */
  resurrectMember(team, adventurerId) {
    const adventurerSystem = this.scene.adventurerSystem;
    const result = adventurerSystem.resurrectAtChurch(team.id, adventurerId);

    this.showMessage(result.message, result.success ? '#88ff88' : '#ff8888');

    if (result.success) {
      this.update();
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

    this.scene.time.delayedCall(3000, () => {
      notification.destroy();
    });
  }

  /**
   * 創建AI控制內容
   */
  createAIContent(startY) {
    console.log('AdventurerPanel: 開始創建AI控制內容');
    let yPos = startY;

    try {
      // AI狀態標題
      const title = this.scene.add.text(0, yPos, 'AI自動管理系統', {
        fontSize: '20px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0);
      this.add(title);
      yPos += 40;

      // 檢查冒險者系統
      const adventurerSystem = this.scene.adventurerSystem;
      if (!adventurerSystem) {
        const errorMsg = this.scene.add.text(0, yPos, '冒險者系統未初始化\n請先建造冒險者公會', {
          fontSize: '16px',
          fill: '#ff8888',
          align: 'center'
        }).setOrigin(0.5, 0);
        this.add(errorMsg);
        return;
      }

      // 檢查AI系統
      const aiStatus = adventurerSystem.getAIStatus();
      console.log('AI狀態:', aiStatus);

      if (!aiStatus) {
        const errorMsg = this.scene.add.text(0, yPos, 'AI系統未初始化\n正在嘗試初始化...', {
          fontSize: '16px',
          fill: '#ffaa88',
          align: 'center'
        }).setOrigin(0.5, 0);
        this.add(errorMsg);

        // 嘗試手動初始化AI
        if (adventurerSystem.ai) {
          yPos += 60;
          const retryMsg = this.scene.add.text(0, yPos, 'AI系統已找到，請刷新面板', {
            fontSize: '14px',
            fill: '#88ff88'
          }).setOrigin(0.5, 0);
          this.add(retryMsg);
        }
        return;
      }

    // AI啟用/禁用按鈕
    const toggleBtn = new Button(this.scene, 0, yPos, aiStatus.isEnabled ? '禁用AI' : '啟用AI', {
      width: 120,
      height: 35,
      backgroundColor: aiStatus.isEnabled ? 0x6a4a4a : 0x4a6a4a,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.toggleAI()
    });
    this.add(toggleBtn.getElements());
    yPos += 50;

    // AI狀態信息
    const statusText = `狀態: ${aiStatus.isEnabled ? '已啟用' : '已禁用'}\n` +
                      `當前團隊數: ${aiStatus.currentTeamCount}\n` +
                      `可用任務數: ${aiStatus.availableQuestCount}`;

    const statusInfo = this.scene.add.text(-400, yPos, statusText, {
      fontSize: '14px',
      fill: '#cccccc',
      lineSpacing: 5
    }).setOrigin(0, 0);
    this.add(statusInfo);

    // AI統計數據
    const stats = aiStatus.stats;
    const statsText = `AI統計數據:\n` +
                     `招募團隊: ${stats.teamsRecruited}\n` +
                     `招募成員: ${stats.membersRecruited}\n` +
                     `分配任務: ${stats.questsAssigned}\n` +
                     `補充物資: ${stats.suppliesProvided}`;

    const statsInfo = this.scene.add.text(100, yPos, statsText, {
      fontSize: '14px',
      fill: '#cccccc',
      lineSpacing: 5
    }).setOrigin(0, 0);
    this.add(statsInfo);
    yPos += 120;

    // AI配置區域
    const configTitle = this.scene.add.text(0, yPos, 'AI配置', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    this.add(configTitle);
    yPos += 30;

    // 配置選項 - 創建可調整的配置界面
    const config = aiStatus.config;

    // 團隊數量配置
    this.createConfigRow('團隊數量', yPos, [
      { label: '最少', value: config.minTeams, key: 'minTeams', min: 1, max: 20 },
      { label: '最多', value: config.maxTeams, key: 'maxTeams', min: 1, max: 20 }
    ]);
    yPos += 35;

    // 成員數量配置
    this.createConfigRow('成員數量', yPos, [
      { label: '最少', value: config.minMembersPerTeam, key: 'minMembersPerTeam', min: 1, max: 8 },
      { label: '最多', value: config.maxMembersPerTeam, key: 'maxMembersPerTeam', min: 1, max: 8 }
    ]);
    yPos += 35;

    // 自動功能開關
    this.createToggleRow('自動功能', yPos, [
      { label: '招募團隊', value: config.autoRecruitTeams, key: 'autoRecruitTeams' },
      { label: '招募成員', value: config.autoRecruitMembers, key: 'autoRecruitMembers' }
    ]);
    yPos += 35;

    this.createToggleRow('', yPos, [
      { label: '分配任務', value: config.autoAssignQuests, key: 'autoAssignQuests' },
      { label: '補充物資', value: config.autoSupplyTeams, key: 'autoSupplyTeams' }
    ]);
    yPos += 50;

    // 預設配置選擇
    const presetTitle = this.scene.add.text(0, yPos, '預設配置', {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    this.add(presetTitle);
    yPos += 30;

    // 預設配置按鈕
    const presets = [
      { key: 'conservative', name: '保守', color: 0x4a6a6a },
      { key: 'balanced', name: '平衡', color: 0x4a6a4a },
      { key: 'aggressive', name: '積極', color: 0x6a4a4a }
    ];

    presets.forEach((preset, index) => {
      const xPos = -120 + (index * 80);
      const presetBtn = new Button(this.scene, xPos, yPos, preset.name, {
        width: 70,
        height: 25,
        backgroundColor: preset.color,
        fontSize: '11px',
        textColor: '#ffffff',
        onClick: () => this.loadAIPreset(preset.key)
      });
      this.add(presetBtn.getElements());
    });
    yPos += 40;

    // 第二行預設配置
    const presets2 = [
      { key: 'minimal', name: '最小', color: 0x6a6a4a },
      { key: 'quest_focused', name: '任務導向', color: 0x4a4a6a },
      { key: 'manual_control', name: '手動', color: 0x6a4a6a }
    ];

    presets2.forEach((preset, index) => {
      const xPos = -120 + (index * 80);
      const presetBtn = new Button(this.scene, xPos, yPos, preset.name, {
        width: 70,
        height: 25,
        backgroundColor: preset.color,
        fontSize: '11px',
        textColor: '#ffffff',
        onClick: () => this.loadAIPreset(preset.key)
      });
      this.add(presetBtn.getElements());
    });
    yPos += 50;

      // 重置統計按鈕
      const resetBtn = new Button(this.scene, 0, yPos, '重置統計', {
        width: 100,
        height: 30,
        backgroundColor: 0x6a6a4a,
        fontSize: '12px',
        textColor: '#ffffff',
        onClick: () => this.resetAIStats()
      });
      this.add(resetBtn.getElements());

    } catch (error) {
      console.error('創建AI控制內容時發生錯誤:', error);

      // 顯示錯誤信息
      const errorMsg = this.scene.add.text(0, yPos, `AI面板創建失敗\n錯誤: ${error.message}`, {
        fontSize: '16px',
        fill: '#ff8888',
        align: 'center'
      }).setOrigin(0.5, 0);
      this.add(errorMsg);
    }
  }

  /**
   * 切換AI啟用狀態
   */
  toggleAI() {
    const adventurerSystem = this.scene.adventurerSystem;
    const aiStatus = adventurerSystem.getAIStatus();

    if (aiStatus) {
      const result = adventurerSystem.setAIEnabled(!aiStatus.isEnabled);
      this.showMessage(result.message, result.success ? '#88ff88' : '#ff8888');

      if (result.success) {
        this.update();
      }
    }
  }

  /**
   * 重置AI統計數據
   */
  resetAIStats() {
    const adventurerSystem = this.scene.adventurerSystem;
    if (adventurerSystem.ai) {
      adventurerSystem.ai.resetStats();
      this.showMessage('AI統計數據已重置', '#88ff88');
      this.update();
    }
  }

  /**
   * 創建配置行（數值調整）
   */
  createConfigRow(title, yPos, configs) {
    if (title) {
      const titleText = this.scene.add.text(-400, yPos, title + ':', {
        fontSize: '14px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      this.add(titleText);
    }

    configs.forEach((config, index) => {
      const xPos = -200 + (index * 200);

      // 標籤
      const label = this.scene.add.text(xPos, yPos, config.label, {
        fontSize: '12px',
        fill: '#cccccc'
      }).setOrigin(0, 0.5);
      this.add(label);

      // 減少按鈕
      const decreaseBtn = new Button(this.scene, xPos + 60, yPos, '-', {
        width: 20,
        height: 20,
        backgroundColor: 0x6a4a4a,
        fontSize: '12px',
        textColor: '#ffffff',
        onClick: () => this.updateAIConfig(config.key, Math.max(config.min, config.value - 1))
      });
      this.add(decreaseBtn.getElements());

      // 數值顯示
      const valueText = this.scene.add.text(xPos + 85, yPos, config.value.toString(), {
        fontSize: '12px',
        fill: '#ffff88',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
      this.add(valueText);

      // 增加按鈕
      const increaseBtn = new Button(this.scene, xPos + 110, yPos, '+', {
        width: 20,
        height: 20,
        backgroundColor: 0x4a6a4a,
        fontSize: '12px',
        textColor: '#ffffff',
        onClick: () => this.updateAIConfig(config.key, Math.min(config.max, config.value + 1))
      });
      this.add(increaseBtn.getElements());
    });
  }

  /**
   * 創建開關行（布爾值切換）
   */
  createToggleRow(title, yPos, toggles) {
    if (title) {
      const titleText = this.scene.add.text(-400, yPos, title + ':', {
        fontSize: '14px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      this.add(titleText);
    }

    toggles.forEach((toggle, index) => {
      const xPos = -200 + (index * 200);

      // 開關按鈕
      const toggleBtn = new Button(this.scene, xPos + 80, yPos, toggle.value ? '✓' : '✗', {
        width: 60,
        height: 25,
        backgroundColor: toggle.value ? 0x4a6a4a : 0x6a4a4a,
        fontSize: '12px',
        textColor: toggle.value ? '#88ff88' : '#ff8888',
        onClick: () => this.updateAIConfig(toggle.key, !toggle.value)
      });
      this.add(toggleBtn.getElements());

      // 標籤
      const label = this.scene.add.text(xPos + 150, yPos, toggle.label, {
        fontSize: '12px',
        fill: '#cccccc'
      }).setOrigin(0, 0.5);
      this.add(label);
    });
  }

  /**
   * 更新AI配置
   */
  updateAIConfig(key, value) {
    const adventurerSystem = this.scene.adventurerSystem;
    if (adventurerSystem.ai) {
      const result = adventurerSystem.updateAIConfig({ [key]: value });
      if (result.success) {
        this.showMessage(`${key} 已更新為 ${value}`, '#88ff88');
        this.update();
      } else {
        this.showMessage(result.message, '#ff8888');
      }
    }
  }

  /**
   * 加載AI預設配置
   */
  loadAIPreset(presetKey) {
    const adventurerSystem = this.scene.adventurerSystem;
    if (adventurerSystem.ai) {
      const result = adventurerSystem.ai.loadPreset(presetKey);
      if (result.success) {
        this.showMessage(result.message, '#88ff88');
        this.update();
      } else {
        this.showMessage(result.message, '#ff8888');
      }
    }
  }

  /**
   * 更新面板內容
   */
  update() {
    console.log('AdventurerPanel update: 當前標籤 =', this.currentTab);
    this.destroy();

    const panel = new AdventurerPanel(this.scene, {
      x: this.x,
      y: this.y,
      currentTab: this.currentTab  // 確保傳遞當前標籤
    });

    panel.show();
    this.scene.uiManager.adventurerPanel = panel;
  }

  /**
   * 切換面板顯示/隱藏
   */
  static togglePanel(scene) {
    if (scene.uiManager.adventurerPanel && scene.uiManager.adventurerPanel.container.visible) {
      scene.uiManager.adventurerPanel.hide();
      return null;
    } else {
      if (scene.uiManager.adventurerPanel) {
        scene.uiManager.adventurerPanel.destroy();
      }

      const panel = new AdventurerPanel(scene, {
        x: 450,
        y: 330
      });
      panel.show();
      scene.uiManager.adventurerPanel = panel;
      return panel;
    }
  }
}
