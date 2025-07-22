// 調試冒險者面板的腳本
// 在瀏覽器控制台中執行

console.log('🔍 開始調試冒險者面板...');

// 獲取遊戲場景
const scene = window.game?.scene?.scenes?.[0];

if (!scene) {
  console.error('❌ 無法找到遊戲場景');
} else {
  console.log('✅ 找到遊戲場景');
  
  // 檢查冒險者系統
  if (!scene.adventurerSystem) {
    console.error('❌ 冒險者系統未初始化');
  } else {
    console.log('✅ 冒險者系統已初始化');
    console.log('冒險者系統狀態:', scene.adventurerSystem.getStatus());
    
    // 檢查AI系統
    if (!scene.adventurerSystem.ai) {
      console.error('❌ AI系統未初始化');
    } else {
      console.log('✅ AI系統已初始化');
      console.log('AI狀態:', scene.adventurerSystem.ai.getStatus());
    }
  }
  
  // 檢查UI管理器
  if (!scene.uiManager) {
    console.error('❌ UI管理器未初始化');
  } else {
    console.log('✅ UI管理器已初始化');
    
    // 檢查當前的冒險者面板
    if (scene.uiManager.adventurerPanel) {
      console.log('✅ 冒險者面板存在');
      const panel = scene.uiManager.adventurerPanel;
      console.log('面板當前標籤:', panel.currentTab);
      console.log('面板標籤數量:', panel.tabs ? panel.tabs.length : '未定義');
      
      // 嘗試切換到AI標籤
      console.log('🔄 嘗試切換到AI標籤...');
      try {
        panel.switchTab('ai');
        console.log('✅ 成功切換到AI標籤');
      } catch (error) {
        console.error('❌ 切換AI標籤失敗:', error);
      }
    } else {
      console.log('⚠️ 冒險者面板不存在，嘗試創建...');
      
      // 嘗試打開冒險者面板
      try {
        // 導入AdventurerPanel類
        const AdventurerPanel = window.AdventurerPanel || scene.AdventurerPanel;
        if (AdventurerPanel) {
          const panel = AdventurerPanel.togglePanel(scene);
          console.log('✅ 成功創建冒險者面板:', panel);
        } else {
          console.error('❌ 無法找到AdventurerPanel類');
        }
      } catch (error) {
        console.error('❌ 創建冒險者面板失敗:', error);
      }
    }
  }
}

// 添加手動打開面板的函數
window.openAdventurerPanel = function() {
  const scene = window.game?.scene?.scenes?.[0];
  if (scene && scene.uiManager) {
    try {
      // 如果面板已存在，先關閉
      if (scene.uiManager.adventurerPanel) {
        scene.uiManager.adventurerPanel.hide();
        scene.uiManager.adventurerPanel.destroy();
        scene.uiManager.adventurerPanel = null;
      }
      
      // 動態導入並創建面板
      import('./src/ui/panels/AdventurerPanel.js').then(module => {
        const AdventurerPanel = module.default;
        const panel = new AdventurerPanel(scene);
        panel.show();
        scene.uiManager.adventurerPanel = panel;
        console.log('✅ 手動創建冒險者面板成功');
      }).catch(error => {
        console.error('❌ 動態導入失敗:', error);
        
        // 備用方法：直接創建
        try {
          const panel = new scene.AdventurerPanel(scene);
          panel.show();
          scene.uiManager.adventurerPanel = panel;
          console.log('✅ 備用方法創建面板成功');
        } catch (backupError) {
          console.error('❌ 備用方法也失敗:', backupError);
        }
      });
    } catch (error) {
      console.error('❌ 手動打開面板失敗:', error);
    }
  }
};

// 添加切換AI標籤的函數
window.switchToAITab = function() {
  const scene = window.game?.scene?.scenes?.[0];
  const panel = scene?.uiManager?.adventurerPanel;
  
  if (panel) {
    try {
      panel.currentTab = 'ai';
      panel.update();
      console.log('✅ 已切換到AI標籤');
    } catch (error) {
      console.error('❌ 切換AI標籤失敗:', error);
    }
  } else {
    console.error('❌ 冒險者面板不存在');
  }
};

console.log('\n🎮 調試函數已添加:');
console.log('  openAdventurerPanel() - 手動打開冒險者面板');
console.log('  switchToAITab() - 切換到AI標籤');
console.log('\n🔍 調試完成');
