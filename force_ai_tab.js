// 強制顯示AI標籤的腳本
// 在瀏覽器控制台中執行

console.log('🔧 強制修復AI標籤顯示問題...');

// 獲取遊戲場景
const scene = window.game?.scene?.scenes?.[0];

if (!scene) {
  console.error('❌ 無法找到遊戲場景');
} else {
  console.log('✅ 找到遊戲場景');
  
  // 檢查並初始化冒險者系統
  if (!scene.adventurerSystem) {
    console.error('❌ 冒險者系統未初始化');
  } else {
    console.log('✅ 冒險者系統已初始化');
    
    // 檢查AI系統
    if (!scene.adventurerSystem.ai) {
      console.log('⚠️ AI系統未初始化，嘗試手動初始化...');
      try {
        // 動態導入AI類
        import('./src/systems/AdventurerAI.js').then(module => {
          const AdventurerAI = module.default;
          scene.adventurerSystem.ai = new AdventurerAI(scene.adventurerSystem);
          console.log('✅ AI系統手動初始化成功');
          
          // 重新創建面板
          recreatePanel();
        }).catch(error => {
          console.error('❌ 動態導入AI失敗:', error);
        });
      } catch (error) {
        console.error('❌ 手動初始化AI失敗:', error);
      }
    } else {
      console.log('✅ AI系統已存在');
      recreatePanel();
    }
  }
}

function recreatePanel() {
  console.log('🔄 重新創建冒險者面板...');
  
  try {
    // 關閉現有面板
    if (scene.uiManager && scene.uiManager.adventurerPanel) {
      scene.uiManager.adventurerPanel.hide();
      scene.uiManager.adventurerPanel.destroy();
      scene.uiManager.adventurerPanel = null;
      console.log('✅ 已關閉舊面板');
    }
    
    // 等待一下再創建新面板
    setTimeout(() => {
      try {
        // 動態導入面板類
        import('./src/ui/panels/AdventurerPanel.js').then(module => {
          const AdventurerPanel = module.default;
          
          // 創建新面板，直接設置為AI標籤
          const panel = new AdventurerPanel(scene, {
            x: 450,
            y: 280,
            currentTab: 'ai'
          });
          
          panel.show();
          scene.uiManager.adventurerPanel = panel;
          
          console.log('✅ 新面板創建成功，當前標籤:', panel.currentTab);
          console.log('✅ 標籤數量:', panel.tabs ? panel.tabs.length : '未定義');
          
        }).catch(error => {
          console.error('❌ 動態導入面板失敗:', error);
          
          // 備用方法：使用現有的togglePanel
          try {
            const panel = scene.AdventurerPanel?.togglePanel?.(scene);
            if (panel) {
              panel.currentTab = 'ai';
              panel.update();
              console.log('✅ 備用方法創建面板成功');
            }
          } catch (backupError) {
            console.error('❌ 備用方法也失敗:', backupError);
          }
        });
        
      } catch (error) {
        console.error('❌ 創建面板失敗:', error);
      }
    }, 100);
    
  } catch (error) {
    console.error('❌ 重新創建面板失敗:', error);
  }
}

// 添加手動切換到AI標籤的函數
window.forceAITab = function() {
  const panel = scene?.uiManager?.adventurerPanel;
  if (panel) {
    console.log('🔄 強制切換到AI標籤...');
    panel.currentTab = 'ai';
    panel.update();
    console.log('✅ 已切換到AI標籤');
  } else {
    console.log('⚠️ 面板不存在，嘗試創建...');
    recreatePanel();
  }
};

// 添加檢查函數
window.checkAITab = function() {
  const panel = scene?.uiManager?.adventurerPanel;
  if (panel) {
    console.log('面板存在');
    console.log('當前標籤:', panel.currentTab);
    console.log('標籤數量:', panel.tabs ? panel.tabs.length : '未定義');
    console.log('AI系統狀態:', scene.adventurerSystem?.ai ? '已初始化' : '未初始化');
    
    if (panel.tabs) {
      panel.tabs.forEach((tab, index) => {
        console.log(`標籤 ${index}:`, tab);
      });
    }
  } else {
    console.log('面板不存在');
  }
};

console.log('\n🎮 修復函數已添加:');
console.log('  forceAITab() - 強制切換到AI標籤');
console.log('  checkAITab() - 檢查面板狀態');
console.log('\n🔧 修復完成，請嘗試打開冒險者面板');
