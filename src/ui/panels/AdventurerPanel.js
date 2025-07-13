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
    super(scene, config.x || 300, config.y || 200, {
      width: 900,
      height: 700,
      title: '冒險者公會',
      onClose: () => this.hide(),
      autoLayout: false
    });

    this.config = config;
    this.currentTab = 'teams'; // teams, quests, history
    this.selectedTeam = null;
    this.selectedQuest = null;

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
    const tabWidth = 120;
    const tabHeight = 35;

    // 團隊標籤
    const teamsTab = new Button(this.scene, -200, tabY, '冒險者團隊', {
      width: tabWidth,
      height: tabHeight,
      backgroundColor: this.currentTab === 'teams' ? 0x4a6a4a : 0x333333,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.switchTab('teams')
    });

    // 任務標籤
    const questsTab = new Button(this.scene, -70, tabY, '可用任務', {
      width: tabWidth,
      height: tabHeight,
      backgroundColor: this.currentTab === 'quests' ? 0x4a6a4a : 0x333333,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.switchTab('quests')
    });

    // 歷史標籤
    const historyTab = new Button(this.scene, 60, tabY, '任務歷史', {
      width: tabWidth,
      height: tabHeight,
      backgroundColor: this.currentTab === 'history' ? 0x4a6a4a : 0x333333,
      fontSize: '14px',
      textColor: '#ffffff',
      onClick: () => this.switchTab('history')
    });

    this.tabs = [teamsTab, questsTab, historyTab];
    this.tabs.forEach(tab => {
      this.add(tab.getElements());
    });
  }

  /**
   * 切換標籤頁
   */
  switchTab(tabName) {
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
   * 分配任務
   */
  assignQuest(quest) {
    // 這裡可以打開團隊選擇對話框
    console.log('分配任務:', quest);
  }

  /**
   * 發布任務
   */
  publishQuest() {
    // 這裡可以打開任務發布對話框
    console.log('發布新任務');
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
   * 更新面板內容
   */
  update() {
    this.destroy();

    const panel = new AdventurerPanel(this.scene, {
      x: this.x,
      y: this.y
    });

    panel.currentTab = this.currentTab;
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

      const panel = new AdventurerPanel(scene);
      panel.show();
      scene.uiManager.adventurerPanel = panel;
      return panel;
    }
  }
}
