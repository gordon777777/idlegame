import Adventurer from './Adventurer.js';

/**
 * 冒險者團隊類
 */
export default class AdventurerTeam {
  /**
   * 創建冒險者團隊
   * @param {Object} config - 團隊配置
   */
  constructor(config = {}) {
    this.id = config.id || this.generateId();
    this.name = config.name || this.generateTeamName();
    this.members = config.members || [];
    this.funds = config.funds || 0;
    this.rank = config.rank || 'F'; // F, E, D, C, B, A, S, SS, SSS
    this.isLocalResident = config.isLocalResident || false;
    this.supplies = config.supplies || {};
    this.suppliesDaysRemaining = config.suppliesDaysRemaining || 0;
    this.currentQuest = config.currentQuest || null;
    this.questStartTime = config.questStartTime || null;
    this.reputation = config.reputation || 0;
    this.completedQuests = config.completedQuests || 0;
    this.createdTime = config.createdTime || Date.now();
    this.temporaryBuffs = config.temporaryBuffs || {}; // 臨時增益效果
  }

  /**
   * 生成隨機ID
   */
  generateId() {
    return 'team_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 生成團隊名稱
   */
  generateTeamName() {
    const prefixes = ['烈火', '寒冰', '雷鳴', '暗影', '聖光', '鋼鐵', '疾風', '大地', '星辰', '月光'];
    const suffixes = ['騎士團', '冒險隊', '守護者', '探索者', '獵人', '戰士', '法師團', '遊俠', '傭兵團', '英雄'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix}${suffix}`;
  }

  /**
   * 添加成員
   */
  addMember(adventurer) {
    if (this.members.length >= this.getMaxMembers()) {
      return { success: false, message: '團隊已滿員' };
    }
    
    this.members.push(adventurer);
    this.updateRank();
    
    return { success: true, message: `${adventurer.name} 加入了團隊` };
  }

  /**
   * 移除成員
   */
  removeMember(adventurerId) {
    const index = this.members.findIndex(member => member.id === adventurerId);
    if (index === -1) {
      return { success: false, message: '找不到該成員' };
    }
    
    const removedMember = this.members.splice(index, 1)[0];
    this.updateRank();
    
    return { success: true, message: `${removedMember.name} 離開了團隊` };
  }

  /**
   * 獲取最大成員數
   */
  getMaxMembers() {
    const rankLimits = {
      'F': 3, 'E': 3, 'D': 4, 'C': 4, 'B': 5, 'A': 5, 'S': 6, 'SS': 7, 'SSS': 8
    };
    return rankLimits[this.rank] || 3;
  }

  /**
   * 計算團隊總戰鬥力
   */
  getTotalCombatPower() {
    let basePower = this.members.reduce((total, member) => total + member.getCombatPower(), 0);

    // 應用臨時增益
    const buffMultiplier = this.getActiveBuffMultiplier();

    return Math.floor(basePower * buffMultiplier);
  }

  /**
   * 獲取當前有效的增益倍數
   */
  getActiveBuffMultiplier() {
    let multiplier = 1.0;
    const now = Date.now();

    Object.entries(this.temporaryBuffs).forEach(([buffType, buff]) => {
      if (buff.startTime + buff.duration > now) {
        if (buff.combatPowerBonus) {
          multiplier += buff.combatPowerBonus;
        }
      }
    });

    return multiplier;
  }

  /**
   * 清理過期的增益效果
   */
  cleanupExpiredBuffs() {
    const now = Date.now();
    Object.keys(this.temporaryBuffs).forEach(buffType => {
      const buff = this.temporaryBuffs[buffType];
      if (buff.startTime + buff.duration <= now) {
        delete this.temporaryBuffs[buffType];
      }
    });
  }

  /**
   * 計算團隊平均等級
   */
  getAverageLevel() {
    if (this.members.length === 0) return 0;
    const totalLevel = this.members.reduce((total, member) => total + member.level, 0);
    return Math.floor(totalLevel / this.members.length);
  }

  /**
   * 更新團隊等級
   */
  updateRank() {
    const totalPower = this.getTotalCombatPower();
    const avgLevel = this.getAverageLevel();
    const memberCount = this.members.length;
    
    // 根據總戰鬥力、平均等級和成員數量計算等級
    const score = totalPower + (avgLevel * 50) + (memberCount * 20) + this.reputation;
    
    if (score >= 2000) this.rank = 'SSS';
    else if (score >= 1500) this.rank = 'SS';
    else if (score >= 1200) this.rank = 'S';
    else if (score >= 900) this.rank = 'A';
    else if (score >= 700) this.rank = 'B';
    else if (score >= 500) this.rank = 'C';
    else if (score >= 300) this.rank = 'D';
    else if (score >= 150) this.rank = 'E';
    else this.rank = 'F';
  }

  /**
   * 添加物資
   */
  addSupplies(supplies, days) {
    Object.entries(supplies).forEach(([item, amount]) => {
      if (this.supplies[item]) {
        this.supplies[item] += amount;
      } else {
        this.supplies[item] = amount;
      }
    });
    
    this.suppliesDaysRemaining = Math.max(this.suppliesDaysRemaining, days);
  }

  /**
   * 消耗物資
   */
  consumeSupplies(amount = 1) {
    if (this.suppliesDaysRemaining > 0) {
      this.suppliesDaysRemaining -= amount;
      
      // 物資耗盡時清空物資列表
      if (this.suppliesDaysRemaining <= 0) {
        this.supplies = {};
        this.suppliesDaysRemaining = 0;
      }
    }
  }

  /**
   * 檢查是否有足夠物資
   */
  hasAdequateSupplies(daysNeeded) {
    return this.suppliesDaysRemaining >= daysNeeded;
  }

  /**
   * 接受任務
   */
  acceptQuest(quest) {
    if (this.currentQuest) {
      return { success: false, message: '團隊已有進行中的任務' };
    }
    
    if (!this.hasAdequateSupplies(quest.estimatedDays)) {
      return { success: false, message: '物資不足，無法執行任務' };
    }
    
    this.currentQuest = quest;
    this.questStartTime = Date.now();
    
    return { success: true, message: `接受任務：${quest.name}` };
  }

  /**
   * 完成任務
   */
  completeQuest() {
    if (!this.currentQuest) {
      return { success: false, message: '沒有進行中的任務' };
    }
    
    const quest = this.currentQuest;
    this.currentQuest = null;
    this.questStartTime = null;
    this.completedQuests++;
    this.reputation += quest.reputationReward || 10;
    
    // 消耗物資
    this.consumeSupplies(quest.estimatedDays);
    
    // 更新等級
    this.updateRank();
    
    return { success: true, quest: quest, message: `完成任務：${quest.name}` };
  }

  /**
   * 檢查任務是否完成
   */
  checkQuestCompletion() {
    if (!this.currentQuest || !this.questStartTime) return false;
    
    const elapsedTime = Date.now() - this.questStartTime;
    const requiredTime = this.currentQuest.estimatedDays * 24 * 60 * 60 * 1000; // 轉換為毫秒
    
    return elapsedTime >= requiredTime;
  }

  /**
   * 計算任務成功率
   */
  calculateQuestSuccessRate(quest) {
    // 清理過期增益
    this.cleanupExpiredBuffs();

    const teamPower = this.getTotalCombatPower();
    const questDifficulty = quest.difficulty || 100;
    const suppliesBonus = this.hasAdequateSupplies(quest.estimatedDays) ? 0.1 : -0.2;
    const rankBonus = this.getRankBonus();
    const intelligenceBonus = this.getIntelligenceBonus();

    let successRate = (teamPower / questDifficulty) * 0.8 + suppliesBonus + rankBonus + intelligenceBonus;

    // 限制在0.1到0.95之間
    return Math.max(0.1, Math.min(0.95, successRate));
  }

  /**
   * 獲取情報加成
   */
  getIntelligenceBonus() {
    const now = Date.now();
    const intelligenceBuff = this.temporaryBuffs.intelligence;

    if (intelligenceBuff && intelligenceBuff.startTime + intelligenceBuff.duration > now) {
      return intelligenceBuff.successRateBonus || 0;
    }

    return 0;
  }

  /**
   * 獲取等級加成
   */
  getRankBonus() {
    const rankBonuses = {
      'F': 0, 'E': 0.05, 'D': 0.1, 'C': 0.15, 'B': 0.2, 'A': 0.25, 'S': 0.3, 'SS': 0.35, 'SSS': 0.4
    };
    return rankBonuses[this.rank] || 0;
  }

  /**
   * 獲取團隊狀態
   */
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      memberCount: this.members.length,
      maxMembers: this.getMaxMembers(),
      members: this.members.map(member => member.getStatus()),
      funds: this.funds,
      rank: this.rank,
      isLocalResident: this.isLocalResident,
      supplies: this.supplies,
      suppliesDaysRemaining: this.suppliesDaysRemaining,
      totalCombatPower: this.getTotalCombatPower(),
      averageLevel: this.getAverageLevel(),
      currentQuest: this.currentQuest,
      questProgress: this.getQuestProgress(),
      reputation: this.reputation,
      completedQuests: this.completedQuests
    };
  }

  /**
   * 獲取任務進度
   */
  getQuestProgress() {
    if (!this.currentQuest || !this.questStartTime) return null;
    
    const elapsedTime = Date.now() - this.questStartTime;
    const totalTime = this.currentQuest.estimatedDays * 24 * 60 * 60 * 1000;
    const progress = Math.min(1, elapsedTime / totalTime);
    
    return {
      progress: progress,
      timeRemaining: Math.max(0, totalTime - elapsedTime),
      isComplete: progress >= 1
    };
  }

  /**
   * 序列化為JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      members: this.members.map(member => member.toJSON()),
      funds: this.funds,
      rank: this.rank,
      isLocalResident: this.isLocalResident,
      supplies: this.supplies,
      suppliesDaysRemaining: this.suppliesDaysRemaining,
      currentQuest: this.currentQuest,
      questStartTime: this.questStartTime,
      reputation: this.reputation,
      completedQuests: this.completedQuests,
      createdTime: this.createdTime
    };
  }

  /**
   * 從JSON數據創建團隊
   */
  static fromJSON(data) {
    const team = new AdventurerTeam(data);
    team.members = data.members.map(memberData => Adventurer.fromJSON(memberData));
    return team;
  }
}
