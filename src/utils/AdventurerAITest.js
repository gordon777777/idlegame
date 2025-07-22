/**
 * 冒險者AI系統測試工具
 */
export default class AdventurerAITest {
  /**
   * 測試AI系統基本功能
   */
  static testAISystem(scene) {
    console.log('=== 冒險者AI系統測試開始 ===');
    
    const adventurerSystem = scene.adventurerSystem;
    if (!adventurerSystem) {
      console.error('冒險者系統未初始化');
      return false;
    }

    const ai = adventurerSystem.ai;
    if (!ai) {
      console.error('AI系統未初始化');
      return false;
    }

    // 測試1: AI狀態檢查
    console.log('測試1: AI狀態檢查');
    const status = ai.getStatus();
    console.log('AI狀態:', status);
    
    // 測試2: 啟用AI
    console.log('測試2: 啟用AI');
    ai.setEnabled(true);
    console.log('AI已啟用:', ai.isEnabled);
    
    // 測試3: 配置檢查
    console.log('測試3: AI配置檢查');
    const config = ai.getConfig();
    console.log('AI配置:', config);
    
    // 測試4: 統計數據檢查
    console.log('測試4: 統計數據檢查');
    const stats = ai.getStats();
    console.log('AI統計:', stats);
    
    // 測試5: 手動觸發AI操作
    console.log('測試5: 手動觸發AI操作');
    if (adventurerSystem.isActive) {
      console.log('冒險者系統已啟動，測試AI操作...');
      
      // 測試自動招募團隊
      const teamCountBefore = adventurerSystem.teams.size;
      ai.autoRecruitTeams();
      const teamCountAfter = adventurerSystem.teams.size;
      console.log(`團隊招募測試: ${teamCountBefore} -> ${teamCountAfter}`);
      
      // 測試自動分配任務
      ai.autoAssignQuests();
      console.log('任務分配測試完成');
      
      // 測試自動補充物資
      ai.autoSupplyTeams();
      console.log('物資補充測試完成');
      
    } else {
      console.log('冒險者系統未啟動，跳過操作測試');
    }
    
    console.log('=== 冒險者AI系統測試完成 ===');
    return true;
  }

  /**
   * 測試AI配置更新
   */
  static testAIConfig(scene) {
    console.log('=== AI配置測試開始 ===');
    
    const adventurerSystem = scene.adventurerSystem;
    const ai = adventurerSystem?.ai;
    
    if (!ai) {
      console.error('AI系統未初始化');
      return false;
    }

    // 保存原始配置
    const originalConfig = ai.getConfig();
    console.log('原始配置:', originalConfig);
    
    // 測試配置更新
    const testConfig = {
      minTeams: 5,
      maxTeams: 10,
      minMembersPerTeam: 3
    };
    
    ai.updateConfig(testConfig);
    const updatedConfig = ai.getConfig();
    console.log('更新後配置:', updatedConfig);
    
    // 驗證配置是否正確更新
    const isConfigUpdated = 
      updatedConfig.minTeams === testConfig.minTeams &&
      updatedConfig.maxTeams === testConfig.maxTeams &&
      updatedConfig.minMembersPerTeam === testConfig.minMembersPerTeam;
    
    console.log('配置更新測試:', isConfigUpdated ? '通過' : '失敗');
    
    // 恢復原始配置
    ai.updateConfig(originalConfig);
    console.log('已恢復原始配置');
    
    console.log('=== AI配置測試完成 ===');
    return isConfigUpdated;
  }

  /**
   * 測試AI決策邏輯
   */
  static testAIDecisionMaking(scene) {
    console.log('=== AI決策邏輯測試開始 ===');
    
    const adventurerSystem = scene.adventurerSystem;
    const ai = adventurerSystem?.ai;
    
    if (!ai || !adventurerSystem.isActive) {
      console.log('AI系統或冒險者系統未準備就緒');
      return false;
    }

    // 測試任務匹配邏輯
    const teams = Array.from(adventurerSystem.teams.values());
    const quests = Array.from(adventurerSystem.availableQuests.values());
    
    console.log(`當前團隊數: ${teams.length}`);
    console.log(`可用任務數: ${quests.length}`);
    
    if (teams.length > 0 && quests.length > 0) {
      const testTeam = teams[0];
      console.log(`測試團隊: ${testTeam.name} (等級: ${testTeam.rank}, 戰鬥力: ${testTeam.getTotalCombatPower()})`);
      
      const suitableQuest = ai.findSuitableQuest(testTeam, quests);
      if (suitableQuest) {
        console.log(`找到合適任務: ${suitableQuest.name} (難度: ${suitableQuest.difficulty})`);
      } else {
        console.log('未找到合適的任務');
      }
    }
    
    console.log('=== AI決策邏輯測試完成 ===');
    return true;
  }

  /**
   * 運行完整測試套件
   */
  static runFullTest(scene) {
    console.log('🤖 開始運行冒險者AI完整測試套件...');
    
    const results = {
      basicTest: this.testAISystem(scene),
      configTest: this.testAIConfig(scene),
      decisionTest: this.testAIDecisionMaking(scene)
    };
    
    const allPassed = Object.values(results).every(result => result);
    
    console.log('📊 測試結果總結:');
    console.log(`  基本功能測試: ${results.basicTest ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`  配置測試: ${results.configTest ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`  決策邏輯測試: ${results.decisionTest ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`  整體結果: ${allPassed ? '✅ 全部通過' : '❌ 部分失敗'}`);
    
    return results;
  }

  /**
   * 在控制台中添加測試命令
   */
  static addTestCommands(scene) {
    try {
      // 將測試函數添加到全局作用域，方便在控制台中調用
      window.testAdventurerAI = () => this.runFullTest(scene);
      window.testAIBasic = () => this.testAISystem(scene);
      window.testAIConfig = () => this.testAIConfig(scene);
      window.testAIDecision = () => this.testAIDecisionMaking(scene);

      // 添加快速AI測試命令
      window.quickAITest = () => {
        console.log('🚀 快速AI測試');
        const adventurerSystem = scene.adventurerSystem;
        if (adventurerSystem && adventurerSystem.ai) {
          console.log('AI狀態:', adventurerSystem.ai.getStatus());
          return adventurerSystem.ai.getStatus();
        } else {
          console.error('冒險者系統或AI未初始化');
          return null;
        }
      };

      // 添加AI控制命令
      window.enableAI = () => {
        const adventurerSystem = scene.adventurerSystem;
        if (adventurerSystem) {
          const result = adventurerSystem.setAIEnabled(true);
          console.log(result.message);
          return result;
        }
      };

      window.disableAI = () => {
        const adventurerSystem = scene.adventurerSystem;
        if (adventurerSystem) {
          const result = adventurerSystem.setAIEnabled(false);
          console.log(result.message);
          return result;
        }
      };

      console.log('🎮 冒險者AI測試命令已添加到控制台:');
      console.log('  testAdventurerAI() - 運行完整測試');
      console.log('  testAIBasic() - 基本功能測試');
      console.log('  testAIConfig() - 配置測試');
      console.log('  testAIDecision() - 決策邏輯測試');
      console.log('  quickAITest() - 快速AI狀態檢查');
      console.log('  enableAI() - 啟用AI');
      console.log('  disableAI() - 禁用AI');

    } catch (error) {
      console.error('添加測試命令時發生錯誤:', error);
    }
  }
}
