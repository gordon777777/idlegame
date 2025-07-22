/**
 * 冒險者AI管理系統
 * 自動管理冒險者團隊的招募、任務分配等操作
 */
export default class AdventurerAI {
  /**
   * 創建冒險者AI系統
   * @param {AdventurerSystem} adventurerSystem - 冒險者系統引用
   */
  constructor(adventurerSystem) {
    this.adventurerSystem = adventurerSystem;
    this.isEnabled = false;
    
    // AI配置
    this.config = {
      minTeams: 3,           // 最少團隊數量
      maxTeams: 8,           // 最多團隊數量
      minMembersPerTeam: 2,  // 每個團隊最少成員數
      maxMembersPerTeam: 4,  // 每個團隊最多成員數
      recruitInterval: 30000, // 招募檢查間隔（毫秒）
      questAssignInterval: 15000, // 任務分配檢查間隔（毫秒）
      memberRecruitInterval: 45000, // 成員招募檢查間隔（毫秒）
      autoSupplyTeams: true, // 自動補充物資
      autoRecruitMembers: true, // 自動招募成員
      autoAssignQuests: true, // 自動分配任務
      autoRecruitTeams: true, // 自動招募團隊
    };
    
    // 時間追蹤
    this.lastRecruitCheck = 0;
    this.lastQuestAssignCheck = 0;
    this.lastMemberRecruitCheck = 0;
    
    // 統計數據
    this.stats = {
      teamsRecruited: 0,
      membersRecruited: 0,
      questsAssigned: 0,
      suppliesProvided: 0
    };
  }

  /**
   * 啟用/禁用AI
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`冒險者AI ${enabled ? '已啟用' : '已禁用'}`);
  }

  /**
   * 更新AI系統
   */
  update(deltaTime) {
    if (!this.isEnabled || !this.adventurerSystem.isActive) {
      return;
    }

    const currentTime = Date.now();

    // 自動招募團隊
    if (this.config.autoRecruitTeams && 
        currentTime - this.lastRecruitCheck > this.config.recruitInterval) {
      this.autoRecruitTeams();
      this.lastRecruitCheck = currentTime;
    }

    // 自動招募成員
    if (this.config.autoRecruitMembers && 
        currentTime - this.lastMemberRecruitCheck > this.config.memberRecruitInterval) {
      this.autoRecruitMembers();
      this.lastMemberRecruitCheck = currentTime;
    }

    // 自動分配任務
    if (this.config.autoAssignQuests && 
        currentTime - this.lastQuestAssignCheck > this.config.questAssignInterval) {
      this.autoAssignQuests();
      this.lastQuestAssignCheck = currentTime;
    }

    // 自動補充物資
    if (this.config.autoSupplyTeams) {
      this.autoSupplyTeams();
    }
  }

  /**
   * 自動招募團隊
   */
  autoRecruitTeams() {
    const currentTeamCount = this.adventurerSystem.teams.size;
    
    if (currentTeamCount < this.config.minTeams) {
      const teamsToRecruit = this.config.minTeams - currentTeamCount;
      
      for (let i = 0; i < teamsToRecruit; i++) {
        const result = this.adventurerSystem.recruitTeam();
        if (result.success) {
          this.stats.teamsRecruited++;
          console.log(`AI招募了新團隊: ${result.team.name}`);
        } else {
          console.log(`AI招募團隊失敗: ${result.message}`);
          break; // 如果失敗就停止招募
        }
      }
    }
  }

  /**
   * 自動為團隊招募成員
   */
  autoRecruitMembers() {
    // 檢查是否有酒館可用
    if (!this.adventurerSystem.availableServices.has('tavern')) {
      return;
    }

    const teams = Array.from(this.adventurerSystem.teams.values());
    
    for (const team of teams) {
      // 只為成員不足的團隊招募
      if (team.members.length < this.config.minMembersPerTeam) {
        const result = this.adventurerSystem.recruitMemberAtTavern(team.id);
        if (result.success) {
          this.stats.membersRecruited++;
          console.log(`AI為團隊 ${team.name} 招募了新成員: ${result.newMember.name}`);
        }
      }
      
      // 隨機為表現好的團隊增加成員
      if (team.members.length < this.config.maxMembersPerTeam && 
          team.rank !== 'F' && team.rank !== 'E' && 
          Math.random() < 0.1) { // 10%機率
        const result = this.adventurerSystem.recruitMemberAtTavern(team.id);
        if (result.success) {
          this.stats.membersRecruited++;
          console.log(`AI為優秀團隊 ${team.name} 招募了額外成員: ${result.newMember.name}`);
        }
      }
    }
  }

  /**
   * 自動分配任務
   */
  autoAssignQuests() {
    const availableQuests = Array.from(this.adventurerSystem.availableQuests.values());
    const idleTeams = Array.from(this.adventurerSystem.teams.values())
      .filter(team => !team.currentQuest && team.members.length >= this.config.minMembersPerTeam);

    if (availableQuests.length === 0 || idleTeams.length === 0) {
      return;
    }

    // 為每個空閒團隊分配合適的任務
    for (const team of idleTeams) {
      const suitableQuest = this.findSuitableQuest(team, availableQuests);
      
      if (suitableQuest) {
        const result = this.adventurerSystem.assignQuestToTeam(suitableQuest.id, team.id);
        if (result.success) {
          this.stats.questsAssigned++;
          console.log(`AI為團隊 ${team.name} 分配了任務: ${suitableQuest.name}`);
          
          // 從可用任務列表中移除已分配的任務
          const questIndex = availableQuests.findIndex(q => q.id === suitableQuest.id);
          if (questIndex !== -1) {
            availableQuests.splice(questIndex, 1);
          }
        }
      }
    }
  }

  /**
   * 為團隊找到合適的任務
   */
  findSuitableQuest(team, availableQuests) {
    // 根據團隊等級和戰鬥力篩選合適的任務
    const teamPower = team.getTotalCombatPower();
    const teamRankValue = this.getRankValue(team.rank);
    
    const suitableQuests = availableQuests.filter(quest => {
      const questRankValue = this.getRankValue(quest.requiredRank || 'F');
      const powerDifference = Math.abs(teamPower - (quest.difficulty || 100));
      
      // 團隊等級應該接近或高於任務要求
      return teamRankValue >= questRankValue - 1 && powerDifference <= teamPower * 0.5;
    });

    if (suitableQuests.length === 0) {
      return null;
    }

    // 優先選擇獎勵豐厚的任務
    return suitableQuests.sort((a, b) => {
      const aReward = (a.rewards && a.rewards.gold) || 0;
      const bReward = (b.rewards && b.rewards.gold) || 0;
      return bReward - aReward;
    })[0];
  }

  /**
   * 獲取等級數值
   */
  getRankValue(rank) {
    const rankValues = {
      'F': 0, 'E': 1, 'D': 2, 'C': 3, 'B': 4, 'A': 5, 'S': 6, 'SS': 7, 'SSS': 8
    };
    return rankValues[rank] || 0;
  }

  /**
   * 自動補充團隊物資
   */
  autoSupplyTeams() {
    const teams = Array.from(this.adventurerSystem.teams.values());
    
    for (const team of teams) {
      // 如果物資不足3天，自動補充
      if (team.suppliesDaysRemaining < 3) {
        // 這裡可以實現自動購買物資的邏輯
        // 暫時簡單地增加物資天數
        team.suppliesDaysRemaining += 7;
        team.addSupplies({
          '乾糧': 10,
          '藥水': 5,
          '繩索': 2
        }, 7);
        
        this.stats.suppliesProvided++;
        console.log(`AI為團隊 ${team.name} 補充了物資`);
      }
    }
  }

  /**
   * 獲取AI配置
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 更新AI配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 獲取AI統計數據
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 重置統計數據
   */
  resetStats() {
    this.stats = {
      teamsRecruited: 0,
      membersRecruited: 0,
      questsAssigned: 0,
      suppliesProvided: 0
    };
  }

  /**
   * 獲取AI狀態信息
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      config: this.getConfig(),
      stats: this.getStats(),
      currentTeamCount: this.adventurerSystem.teams.size,
      availableQuestCount: this.adventurerSystem.availableQuests.size
    };
  }

  /**
   * 加載預設配置
   */
  loadPreset(presetName) {
    const presets = {
      conservative: {
        minTeams: 2, maxTeams: 5, minMembersPerTeam: 2, maxMembersPerTeam: 3,
        recruitInterval: 45000, questAssignInterval: 20000, memberRecruitInterval: 60000,
        autoSupplyTeams: true, autoRecruitMembers: true, autoAssignQuests: true, autoRecruitTeams: true
      },
      balanced: {
        minTeams: 3, maxTeams: 8, minMembersPerTeam: 2, maxMembersPerTeam: 4,
        recruitInterval: 30000, questAssignInterval: 15000, memberRecruitInterval: 45000,
        autoSupplyTeams: true, autoRecruitMembers: true, autoAssignQuests: true, autoRecruitTeams: true
      },
      aggressive: {
        minTeams: 5, maxTeams: 12, minMembersPerTeam: 3, maxMembersPerTeam: 6,
        recruitInterval: 20000, questAssignInterval: 10000, memberRecruitInterval: 30000,
        autoSupplyTeams: true, autoRecruitMembers: true, autoAssignQuests: true, autoRecruitTeams: true
      },
      minimal: {
        minTeams: 1, maxTeams: 3, minMembersPerTeam: 2, maxMembersPerTeam: 3,
        recruitInterval: 60000, questAssignInterval: 30000, memberRecruitInterval: 90000,
        autoSupplyTeams: true, autoRecruitMembers: false, autoAssignQuests: true, autoRecruitTeams: false
      },
      quest_focused: {
        minTeams: 4, maxTeams: 10, minMembersPerTeam: 3, maxMembersPerTeam: 5,
        recruitInterval: 25000, questAssignInterval: 8000, memberRecruitInterval: 40000,
        autoSupplyTeams: true, autoRecruitMembers: true, autoAssignQuests: true, autoRecruitTeams: true
      },
      manual_control: {
        minTeams: 1, maxTeams: 20, minMembersPerTeam: 1, maxMembersPerTeam: 8,
        recruitInterval: 120000, questAssignInterval: 120000, memberRecruitInterval: 120000,
        autoSupplyTeams: true, autoRecruitMembers: false, autoAssignQuests: false, autoRecruitTeams: false
      }
    };

    if (presets[presetName]) {
      this.updateConfig(presets[presetName]);
      console.log(`AI配置已切換到 ${presetName} 模式`);
      return { success: true, message: `已切換到 ${presetName} 模式` };
    } else {
      console.error(`未找到預設配置: ${presetName}`);
      return { success: false, message: `未找到預設配置: ${presetName}` };
    }
  }

  /**
   * 獲取可用的預設配置列表
   */
  getAvailablePresets() {
    return [
      { key: 'conservative', name: '保守模式', description: '較少的團隊，謹慎的資源管理' },
      { key: 'balanced', name: '平衡模式', description: '適中的團隊數量和資源管理' },
      { key: 'aggressive', name: '積極模式', description: '大量團隊，快速擴張' },
      { key: 'minimal', name: '最小模式', description: '僅維持基本團隊運作' },
      { key: 'quest_focused', name: '任務導向', description: '專注於任務執行，快速分配' },
      { key: 'manual_control', name: '手動控制', description: '關閉大部分自動功能，僅補充物資' }
    ];
  }
}
