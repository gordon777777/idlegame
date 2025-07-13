import Adventurer from '../entities/Adventurer.js';
import AdventurerTeam from '../entities/AdventurerTeam.js';

/**
 * 冒險者管理系統
 */
export default class AdventurerSystem {
  /**
   * 創建冒險者管理系統
   * @param {Object} resourceSystem - 資源系統引用
   * @param {Object} buildingSystem - 建築系統引用
   */
  constructor(resourceSystem, buildingSystem) {
    this.resourceSystem = resourceSystem;
    this.buildingSystem = buildingSystem;
    this.isActive = false;
    this.teams = new Map();
    this.availableQuests = new Map();
    this.completedQuests = [];
    this.questIdCounter = 1;
    this.blackMarketQuests = new Map(); // 黑市任務
    this.availableServices = new Map(); // 可用服務

    // 初始化任務類型
    this.initializeQuestTypes();

    // 檢查冒險者公會是否存在
    this.checkAdventurerGuild();

    // 檢查支援建築
    this.checkSupportBuildings();
  }

  /**
   * 檢查冒險者公會建築
   */
  checkAdventurerGuild() {
    if (this.buildingSystem) {
      const guild = this.buildingSystem.getBuildingsByType('adventurer_guild');
      const wasActive = this.isActive;
      this.isActive = guild.length > 0 && guild.some(building => building.isActive);

      // 如果剛剛啟動，初始化系統
      if (!wasActive && this.isActive) {
        this.activate();
      }
    }
  }

  /**
   * 檢查支援建築
   */
  checkSupportBuildings() {
    if (!this.buildingSystem) return;

    const supportBuildings = [
      'inn', 'tavern', 'weapon_shop', 'armor_shop',
      'item_shop', 'church', 'training_camp'
    ];

    this.availableServices.clear();

    supportBuildings.forEach(buildingType => {
      const buildings = this.buildingSystem.getBuildingsByType(buildingType);
      const activeBuildings = buildings.filter(building => building.isActive);

      if (activeBuildings.length > 0) {
        this.availableServices.set(buildingType, {
          count: activeBuildings.length,
          buildings: activeBuildings,
          quality: this.calculateServiceQuality(activeBuildings)
        });
      }
    });
  }

  /**
   * 計算服務品質
   */
  calculateServiceQuality(buildings) {
    let totalQuality = 0;
    buildings.forEach(building => {
      const byproduct = building.selectedByproduct || building.byproductTypes[0];
      if (byproduct.specialEffect) {
        if (byproduct.specialEffect.includes('masterwork') || byproduct.specialEffect.includes('enchanted')) {
          totalQuality += 3;
        } else if (byproduct.specialEffect.includes('luxury') || byproduct.specialEffect.includes('premium')) {
          totalQuality += 2;
        } else {
          totalQuality += 1;
        }
      } else {
        totalQuality += 1;
      }
    });
    return totalQuality / buildings.length;
  }

  /**
   * 初始化任務類型
   */
  initializeQuestTypes() {
    this.questTypes = {
      resource_gathering: {
        name: '資源收集',
        description: '前往指定地點收集特殊資源',
        baseReward: { gold: 100 },
        baseDifficulty: 80,
        estimatedDays: 2
      },
      monster_clearing: {
        name: '魔獸清理',
        description: '清理郊區的危險魔獸',
        baseReward: { gold: 150 },
        baseDifficulty: 120,
        estimatedDays: 3
      },
      escort_mission: {
        name: '護送任務',
        description: '護送商隊或重要人物',
        baseReward: { gold: 80 },
        baseDifficulty: 60,
        estimatedDays: 1
      },
      exploration: {
        name: '探索任務',
        description: '探索未知區域並繪製地圖',
        baseReward: { gold: 200 },
        baseDifficulty: 100,
        estimatedDays: 4
      },
      special_delivery: {
        name: '特殊運送',
        description: '運送重要物品到指定地點',
        baseReward: { gold: 120 },
        baseDifficulty: 70,
        estimatedDays: 2
      }
    };

    // 黑市任務類型
    this.blackMarketQuestTypes = {
      assassination: {
        name: '暗殺任務',
        description: '暗殺指定目標',
        baseReward: { gold: 300 },
        baseDifficulty: 150,
        estimatedDays: 3,
        illegal: true
      },
      caravan_raid: {
        name: '劫掠商隊',
        description: '攔截並搶劫商隊',
        baseReward: { gold: 250 },
        baseDifficulty: 120,
        estimatedDays: 2,
        illegal: true
      },
      smuggling: {
        name: '走私任務',
        description: '運送違禁品到指定地點',
        baseReward: { gold: 200 },
        baseDifficulty: 90,
        estimatedDays: 3,
        illegal: true
      },
      sabotage: {
        name: '破壞任務',
        description: '破壞競爭對手的設施',
        baseReward: { gold: 180 },
        baseDifficulty: 100,
        estimatedDays: 1,
        illegal: true
      }
    };
  }

  /**
   * 啟動系統
   */
  activate() {
    this.isActive = true;
    this.generateInitialTeams();
    this.generateRandomQuests();
  }

  /**
   * 生成初始團隊
   */
  generateInitialTeams() {
    // 生成2-4個初始團隊
    const teamCount = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < teamCount; i++) {
      const team = this.generateRandomTeam();
      this.teams.set(team.id, team);
    }
  }

  /**
   * 生成隨機團隊
   */
  generateRandomTeam() {
    const team = new AdventurerTeam();
    
    // 隨機生成2-4個成員
    const memberCount = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < memberCount; i++) {
      const adventurer = this.generateRandomAdventurer();
      team.addMember(adventurer);
    }
    
    // 設置初始資金和物資
    team.funds = 50 + Math.floor(Math.random() * 100);
    team.addSupplies({
      '乾糧': 10 + Math.floor(Math.random() * 10),
      '藥水': 5 + Math.floor(Math.random() * 5),
      '繩索': 2 + Math.floor(Math.random() * 3)
    }, 3 + Math.floor(Math.random() * 4));
    
    // 30%機率是本地常駐團隊
    team.isLocalResident = Math.random() < 0.3;
    
    return team;
  }

  /**
   * 生成隨機冒險者
   */
  generateRandomAdventurer() {
    const professions = ['warrior', 'mage', 'archer', 'rogue', 'cleric'];
    const profession = professions[Math.floor(Math.random() * professions.length)];
    
    return new Adventurer({
      profession: profession,
      level: 1 + Math.floor(Math.random() * 3)
    });
  }

  /**
   * 生成隨機任務
   */
  generateRandomQuests() {
    // 生成3-6個隨機任務
    const questCount = 3 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < questCount; i++) {
      const quest = this.generateRandomQuest();
      this.availableQuests.set(quest.id, quest);
    }
  }

  /**
   * 生成隨機任務
   */
  generateRandomQuest() {
    const typeKeys = Object.keys(this.questTypes);
    const typeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
    const questType = this.questTypes[typeKey];
    
    const quest = {
      id: this.questIdCounter++,
      type: typeKey,
      name: questType.name,
      description: questType.description,
      difficulty: questType.baseDifficulty + Math.floor(Math.random() * 40) - 20,
      estimatedDays: questType.estimatedDays + Math.floor(Math.random() * 2),
      rewards: this.generateQuestRewards(questType),
      requirements: this.generateQuestRequirements(),
      createdTime: Date.now(),
      expiryTime: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7天後過期
      isCompleted: false
    };
    
    return quest;
  }

  /**
   * 生成黑市任務
   */
  generateBlackMarketQuest() {
    const typeKeys = Object.keys(this.blackMarketQuestTypes);
    const typeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
    const questType = this.blackMarketQuestTypes[typeKey];

    const quest = {
      id: this.questIdCounter++,
      type: typeKey,
      name: questType.name,
      description: questType.description,
      difficulty: questType.baseDifficulty + Math.floor(Math.random() * 40) - 20,
      estimatedDays: questType.estimatedDays + Math.floor(Math.random() * 2),
      rewards: this.generateQuestRewards(questType),
      requirements: this.generateQuestRequirements(),
      createdTime: Date.now(),
      expiryTime: Date.now() + (3 * 24 * 60 * 60 * 1000), // 3天後過期
      isCompleted: false,
      illegal: true,
      isBlackMarket: true
    };

    return quest;
  }

  /**
   * 生成任務獎勵
   */
  generateQuestRewards(questType) {
    const rewards = { ...questType.baseReward };
    
    // 隨機添加資源獎勵
    if (Math.random() < 0.6) {
      const resources = ['magic_ore', 'enchanted_wood', 'arcane_crystal', 'mana'];
      const resource = resources[Math.floor(Math.random() * resources.length)];
      rewards[resource] = 5 + Math.floor(Math.random() * 15);
    }
    
    // 隨機調整金幣獎勵
    rewards.gold = Math.floor(rewards.gold * (0.8 + Math.random() * 0.4));
    
    return rewards;
  }

  /**
   * 生成任務需求
   */
  generateQuestRequirements() {
    return {
      minRank: ['F', 'E', 'D', 'C'][Math.floor(Math.random() * 4)],
      minMembers: 2 + Math.floor(Math.random() * 2),
      minCombatPower: 100 + Math.floor(Math.random() * 200)
    };
  }

  /**
   * 發布任務
   */
  publishQuest(questData) {
    const quest = {
      id: this.questIdCounter++,
      ...questData,
      createdTime: Date.now(),
      expiryTime: Date.now() + (questData.duration || 7) * 24 * 60 * 60 * 1000,
      isCompleted: false
    };
    
    this.availableQuests.set(quest.id, quest);
    
    return { success: true, quest: quest, message: `任務 "${quest.name}" 已發布` };
  }

  /**
   * 分配任務給團隊
   */
  assignQuestToTeam(questId, teamId) {
    const quest = this.availableQuests.get(questId);
    const team = this.teams.get(teamId);
    
    if (!quest) {
      return { success: false, message: '任務不存在' };
    }
    
    if (!team) {
      return { success: false, message: '團隊不存在' };
    }
    
    // 檢查團隊是否符合任務要求
    const meetsRequirements = this.checkTeamRequirements(team, quest);
    if (!meetsRequirements.success) {
      return meetsRequirements;
    }
    
    // 團隊接受任務
    const result = team.acceptQuest(quest);
    if (result.success) {
      this.availableQuests.delete(questId);
    }
    
    return result;
  }

  /**
   * 檢查團隊是否符合任務要求
   */
  checkTeamRequirements(team, quest) {
    const requirements = quest.requirements || {};
    
    // 檢查等級要求
    if (requirements.minRank) {
      const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
      const teamRankIndex = rankOrder.indexOf(team.rank);
      const requiredRankIndex = rankOrder.indexOf(requirements.minRank);
      
      if (teamRankIndex < requiredRankIndex) {
        return { success: false, message: `團隊等級不足，需要 ${requirements.minRank} 級以上` };
      }
    }
    
    // 檢查成員數量
    if (requirements.minMembers && team.members.length < requirements.minMembers) {
      return { success: false, message: `團隊成員不足，需要至少 ${requirements.minMembers} 人` };
    }
    
    // 檢查戰鬥力
    if (requirements.minCombatPower && team.getTotalCombatPower() < requirements.minCombatPower) {
      return { success: false, message: `團隊戰鬥力不足，需要至少 ${requirements.minCombatPower}` };
    }
    
    return { success: true };
  }

  /**
   * 更新系統狀態
   */
  update(deltaTime) {
    if (!this.isActive) {
      this.checkAdventurerGuild();
      return;
    }

    // 檢查支援建築
    this.checkSupportBuildings();

    // 檢查團隊任務完成情況
    this.teams.forEach(team => {
      // 清理過期增益
      if (team.cleanupExpiredBuffs) {
        team.cleanupExpiredBuffs();
      }

      if (team.checkQuestCompletion()) {
        this.completeTeamQuest(team);
      }
    });

    // 清理過期任務
    this.cleanupExpiredQuests();

    // 隨機生成新任務
    if (Math.random() < 0.001) { // 0.1%機率每次更新
      const quest = this.generateRandomQuest();
      this.availableQuests.set(quest.id, quest);
    }

    // 隨機生成黑市任務（如果有酒館）
    if (this.availableServices.has('tavern') && Math.random() < 0.0005) {
      const blackQuest = this.generateBlackMarketQuest();
      this.blackMarketQuests.set(blackQuest.id, blackQuest);
    }
  }

  /**
   * 完成團隊任務
   */
  completeTeamQuest(team) {
    const quest = team.currentQuest;
    if (!quest) return;
    
    // 計算成功率
    const successRate = team.calculateQuestSuccessRate(quest);
    const isSuccess = Math.random() < successRate;
    
    if (isSuccess) {
      // 任務成功
      const result = team.completeQuest();
      if (result.success) {
        // 給予獎勵
        this.giveQuestRewards(quest.rewards);
        this.completedQuests.push({
          ...quest,
          completedTime: Date.now(),
          teamId: team.id,
          teamName: team.name,
          success: true
        });
      }
    } else {
      // 任務失敗
      team.currentQuest = null;
      team.questStartTime = null;
      team.consumeSupplies(quest.estimatedDays);
      
      this.completedQuests.push({
        ...quest,
        completedTime: Date.now(),
        teamId: team.id,
        teamName: team.name,
        success: false
      });
    }
  }

  /**
   * 給予任務獎勵
   */
  giveQuestRewards(rewards) {
    Object.entries(rewards).forEach(([rewardType, amount]) => {
      if (rewardType === 'gold') {
        // 增加金幣
        if (this.resourceSystem.gameState) {
          this.resourceSystem.gameState.playerGold += amount;
        }
      } else {
        // 增加資源
        if (this.resourceSystem.resources[rewardType]) {
          this.resourceSystem.addResources({ [rewardType]: amount });
        }
      }
    });
  }

  /**
   * 清理過期任務
   */
  cleanupExpiredQuests() {
    const now = Date.now();
    this.availableQuests.forEach((quest, questId) => {
      if (quest.expiryTime < now) {
        this.availableQuests.delete(questId);
      }
    });
  }

  /**
   * 獲取系統狀態
   */
  getStatus() {
    return {
      isActive: this.isActive,
      teamCount: this.teams.size,
      teams: Array.from(this.teams.values()).map(team => team.getStatus()),
      availableQuestCount: this.availableQuests.size,
      availableQuests: Array.from(this.availableQuests.values()),
      completedQuestCount: this.completedQuests.length,
      recentCompletedQuests: this.completedQuests.slice(-10)
    };
  }

  /**
   * 獲取團隊列表
   */
  getTeams() {
    return Array.from(this.teams.values());
  }

  /**
   * 獲取可用任務列表
   */
  getAvailableQuests() {
    return Array.from(this.availableQuests.values());
  }

  /**
   * 獲取特定團隊
   */
  getTeam(teamId) {
    return this.teams.get(teamId);
  }

  /**
   * 獲取特定任務
   */
  getQuest(questId) {
    return this.availableQuests.get(questId);
  }

  /**
   * 招募新團隊
   */
  recruitTeam() {
    if (!this.isActive) {
      return { success: false, message: '冒險者公會未啟動' };
    }

    const team = this.generateRandomTeam();
    this.teams.set(team.id, team);

    return { success: true, team: team, message: `新團隊 "${team.name}" 加入了公會` };
  }

  /**
   * 解散團隊
   */
  disbandTeam(teamId) {
    const team = this.teams.get(teamId);
    if (!team) {
      return { success: false, message: '團隊不存在' };
    }

    if (team.currentQuest) {
      return { success: false, message: '團隊正在執行任務，無法解散' };
    }

    this.teams.delete(teamId);
    return { success: true, message: `團隊 "${team.name}" 已解散` };
  }

  /**
   * 為團隊補充物資
   */
  supplyTeam(teamId, supplies, days, cost) {
    const team = this.teams.get(teamId);
    if (!team) {
      return { success: false, message: '團隊不存在' };
    }

    // 檢查金幣是否足夠
    if (this.resourceSystem.gameState && this.resourceSystem.gameState.playerGold < cost) {
      return { success: false, message: '金幣不足' };
    }

    // 扣除金幣
    if (this.resourceSystem.gameState) {
      this.resourceSystem.gameState.playerGold -= cost;
    }

    // 添加物資
    team.addSupplies(supplies, days);

    return { success: true, message: `已為團隊 "${team.name}" 補充物資` };
  }

  /**
   * 旅館治療服務
   */
  healTeamAtInn(teamId, serviceLevel = 'basic') {
    const team = this.teams.get(teamId);
    if (!team) {
      return { success: false, message: '團隊不存在' };
    }

    const innService = this.availableServices.get('inn');
    if (!innService) {
      return { success: false, message: '沒有可用的旅館' };
    }

    // 計算治療費用
    const baseCost = 50;
    const cost = serviceLevel === 'luxury' ? baseCost * 2 : baseCost;

    if (this.resourceSystem.gameState && this.resourceSystem.gameState.playerGold < cost) {
      return { success: false, message: '金幣不足' };
    }

    // 扣除金幣
    if (this.resourceSystem.gameState) {
      this.resourceSystem.gameState.playerGold -= cost;
    }

    // 治療團隊成員
    let healedCount = 0;
    team.members.forEach(member => {
      if (member.hp < member.maxHP) {
        const healAmount = serviceLevel === 'luxury' ? member.maxHP : member.maxHP * 0.8;
        member.heal(healAmount);
        healedCount++;
      }
    });

    // 添加臨時增益
    if (serviceLevel === 'luxury') {
      team.temporaryBuffs = team.temporaryBuffs || {};
      team.temporaryBuffs.luxuryRest = {
        combatPowerBonus: 0.15,
        duration: 7 * 24 * 60 * 60 * 1000, // 7天
        startTime: Date.now()
      };
    }

    return {
      success: true,
      message: `團隊 "${team.name}" 在旅館得到了治療，${healedCount} 名成員恢復了健康`,
      healedCount: healedCount
    };
  }

  /**
   * 酒館情報收集
   */
  gatherIntelligenceAtTavern(teamId) {
    const team = this.teams.get(teamId);
    if (!team) {
      return { success: false, message: '團隊不存在' };
    }

    const tavernService = this.availableServices.get('tavern');
    if (!tavernService) {
      return { success: false, message: '沒有可用的酒館' };
    }

    const cost = 30;
    if (this.resourceSystem.gameState && this.resourceSystem.gameState.playerGold < cost) {
      return { success: false, message: '金幣不足' };
    }

    // 扣除金幣
    if (this.resourceSystem.gameState) {
      this.resourceSystem.gameState.playerGold -= cost;
    }

    // 添加情報加成
    team.temporaryBuffs = team.temporaryBuffs || {};
    team.temporaryBuffs.intelligence = {
      successRateBonus: 0.1 + (tavernService.quality - 1) * 0.05,
      duration: 3 * 24 * 60 * 60 * 1000, // 3天
      startTime: Date.now()
    };

    return {
      success: true,
      message: `團隊 "${team.name}" 在酒館收集了有用的情報，任務成功率提升`,
      bonus: team.temporaryBuffs.intelligence.successRateBonus
    };
  }

  /**
   * 酒館招募成員
   */
  recruitMemberAtTavern(teamId) {
    const team = this.teams.get(teamId);
    if (!team) {
      return { success: false, message: '團隊不存在' };
    }

    if (team.members.length >= team.getMaxMembers()) {
      return { success: false, message: '團隊已滿員' };
    }

    const tavernService = this.availableServices.get('tavern');
    if (!tavernService) {
      return { success: false, message: '沒有可用的酒館' };
    }

    const cost = 100;
    if (this.resourceSystem.gameState && this.resourceSystem.gameState.playerGold < cost) {
      return { success: false, message: '金幣不足' };
    }

    // 扣除金幣
    if (this.resourceSystem.gameState) {
      this.resourceSystem.gameState.playerGold -= cost;
    }

    // 生成新成員
    const newMember = this.generateRandomAdventurer();
    const result = team.addMember(newMember);

    if (result.success) {
      return {
        success: true,
        message: `團隊 "${team.name}" 在酒館招募了新成員 "${newMember.name}"`,
        newMember: newMember.getStatus()
      };
    } else {
      return result;
    }
  }

  /**
   * 教會復活服務
   */
  resurrectAtChurch(teamId, adventurerId) {
    const team = this.teams.get(teamId);
    if (!team) {
      return { success: false, message: '團隊不存在' };
    }

    const member = team.members.find(m => m.id === adventurerId);
    if (!member) {
      return { success: false, message: '找不到該冒險者' };
    }

    if (member.isAlive()) {
      return { success: false, message: '該冒險者還活著，不需要復活' };
    }

    const churchService = this.availableServices.get('church');
    if (!churchService) {
      return { success: false, message: '沒有可用的教會' };
    }

    const cost = 200;
    if (this.resourceSystem.gameState && this.resourceSystem.gameState.playerGold < cost) {
      return { success: false, message: '金幣不足' };
    }

    // 扣除金幣
    if (this.resourceSystem.gameState) {
      this.resourceSystem.gameState.playerGold -= cost;
    }

    // 復活冒險者
    member.hp = Math.floor(member.maxHP * 0.5); // 復活時恢復50%血量

    return {
      success: true,
      message: `${member.name} 在教會的神聖力量下復活了`,
      adventurer: member.getStatus()
    };
  }
}
