// 手動測試冒險者AI系統的腳本
// 在瀏覽器控制台中複製並執行以下代碼

console.log('🤖 開始手動測試冒險者AI系統...');

// 獲取遊戲場景
const scene = window.game?.scene?.scenes?.[0];

if (!scene) {
  console.error('❌ 無法找到遊戲場景');
} else if (!scene.adventurerSystem) {
  console.error('❌ 冒險者系統未初始化');
} else {
  console.log('✅ 找到冒險者系統');
  
  const adventurerSystem = scene.adventurerSystem;
  
  // 測試1: 檢查系統狀態
  console.log('\n📊 測試1: 系統狀態檢查');
  console.log('冒險者系統狀態:', adventurerSystem.getStatus());
  
  if (adventurerSystem.ai) {
    console.log('AI系統狀態:', adventurerSystem.ai.getStatus());
  } else {
    console.error('❌ AI系統未初始化');
  }
  
  // 測試2: 啟用AI
  console.log('\n🔧 測試2: 啟用AI');
  if (adventurerSystem.ai) {
    const enableResult = adventurerSystem.setAIEnabled(true);
    console.log('啟用AI結果:', enableResult);
  }
  
  // 測試3: 手動觸發AI操作
  console.log('\n⚡ 測試3: 手動觸發AI操作');
  if (adventurerSystem.ai && adventurerSystem.isActive) {
    const ai = adventurerSystem.ai;
    
    console.log('觸發自動招募團隊...');
    ai.autoRecruitTeams();
    
    console.log('觸發自動分配任務...');
    ai.autoAssignQuests();
    
    console.log('觸發自動補充物資...');
    ai.autoSupplyTeams();
    
    console.log('AI操作完成');
  } else {
    console.log('⚠️ AI未啟用或冒險者系統未激活');
  }
  
  // 測試4: 查看結果
  console.log('\n📈 測試4: 查看AI統計');
  if (adventurerSystem.ai) {
    console.log('AI統計數據:', adventurerSystem.ai.getStats());
    console.log('當前團隊數:', adventurerSystem.teams.size);
    console.log('可用任務數:', adventurerSystem.availableQuests.size);
  }
  
  console.log('\n✅ 手動測試完成');
}

// 添加全局測試函數
window.manualAITest = function() {
  const scene = window.game?.scene?.scenes?.[0];
  if (scene && scene.adventurerSystem && scene.adventurerSystem.ai) {
    return scene.adventurerSystem.ai.getStatus();
  }
  return null;
};

window.toggleAI = function() {
  const scene = window.game?.scene?.scenes?.[0];
  if (scene && scene.adventurerSystem) {
    const currentStatus = scene.adventurerSystem.getAIStatus();
    const newState = !currentStatus?.isEnabled;
    return scene.adventurerSystem.setAIEnabled(newState);
  }
  return null;
};

console.log('\n🎮 已添加全局測試函數:');
console.log('  manualAITest() - 獲取AI狀態');
console.log('  toggleAI() - 切換AI啟用狀態');
