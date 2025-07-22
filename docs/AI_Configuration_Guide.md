# 🤖 冒險者AI配置指南

## 📋 配置方式

### 方法1: 遊戲內UI配置
1. 打開冒險者面板
2. 切換到「AI控制」標籤
3. 使用 +/- 按鈕調整數值
4. 點擊 ✓/✗ 按鈕切換功能開關
5. 選擇預設配置快速應用

### 方法2: 控制台配置
```javascript
// 獲取AI系統
const ai = window.game.scene.scenes[0].adventurerSystem.ai;

// 查看當前配置
console.log(ai.getConfig());

// 更新配置
ai.updateConfig({
  minTeams: 5,
  maxTeams: 10,
  autoRecruitMembers: true
});

// 加載預設配置
ai.loadPreset('aggressive');
```

## 🎛️ 配置參數說明

### 團隊數量控制
- **minTeams** (1-20): 最少維持的團隊數量
- **maxTeams** (1-20): 最多允許的團隊數量

### 成員數量控制
- **minMembersPerTeam** (1-8): 每個團隊最少成員數
- **maxMembersPerTeam** (1-8): 每個團隊最多成員數

### 時間間隔設定
- **recruitInterval**: 團隊招募檢查間隔（毫秒）
- **questAssignInterval**: 任務分配檢查間隔（毫秒）
- **memberRecruitInterval**: 成員招募檢查間隔（毫秒）

### 自動功能開關
- **autoRecruitTeams**: 自動招募新團隊
- **autoRecruitMembers**: 自動招募團隊成員
- **autoAssignQuests**: 自動分配任務給團隊
- **autoSupplyTeams**: 自動補充團隊物資

## 🎯 預設配置方案

### 保守模式 (Conservative)
- **適用場景**: 資源有限，穩健發展
- **特點**: 少量團隊，謹慎管理
- **配置**: 2-5個團隊，2-3人/團隊

### 平衡模式 (Balanced) ⭐ 推薦
- **適用場景**: 一般遊戲進程
- **特點**: 適中的團隊數量和資源消耗
- **配置**: 3-8個團隊，2-4人/團隊

### 積極模式 (Aggressive)
- **適用場景**: 資源充足，快速擴張
- **特點**: 大量團隊，快速任務執行
- **配置**: 5-12個團隊，3-6人/團隊

### 最小模式 (Minimal)
- **適用場景**: 早期遊戲，資源緊張
- **特點**: 僅維持基本運作
- **配置**: 1-3個團隊，關閉部分自動功能

### 任務導向 (Quest Focused)
- **適用場景**: 專注任務收益
- **特點**: 快速任務分配和執行
- **配置**: 4-10個團隊，8秒任務分配間隔

### 手動控制 (Manual Control)
- **適用場景**: 喜歡手動管理
- **特點**: 關閉大部分自動功能
- **配置**: 僅自動補充物資

## ⚙️ 高級配置技巧

### 1. 根據遊戲階段調整
```javascript
// 早期遊戲 - 使用最小模式
ai.loadPreset('minimal');

// 中期遊戲 - 切換到平衡模式
ai.loadPreset('balanced');

// 後期遊戲 - 使用積極模式
ai.loadPreset('aggressive');
```

### 2. 自定義配置組合
```javascript
// 高效任務執行配置
ai.updateConfig({
  minTeams: 6,
  maxTeams: 15,
  questAssignInterval: 5000,  // 5秒檢查一次
  autoAssignQuests: true,
  autoRecruitMembers: true
});
```

### 3. 經濟優化配置
```javascript
// 節約資源配置
ai.updateConfig({
  minTeams: 2,
  maxTeams: 4,
  autoRecruitMembers: false,  // 手動控制成員招募
  memberRecruitInterval: 120000  // 2分鐘檢查一次
});
```

## 📊 配置效果監控

### 查看AI統計
```javascript
const stats = ai.getStats();
console.log('招募團隊數:', stats.teamsRecruited);
console.log('招募成員數:', stats.membersRecruited);
console.log('分配任務數:', stats.questsAssigned);
```

### 監控資源消耗
- 觀察金幣變化速度
- 檢查團隊物資消耗
- 評估任務完成效率

## 🎮 實用配置建議

### 新手推薦
1. 開始使用「平衡模式」
2. 觀察資源消耗情況
3. 根據需要微調參數

### 進階玩家
1. 根據建築完成度選擇模式
2. 定期調整配置適應遊戲進度
3. 使用自定義配置優化效率

### 資源管理
- 資源充足時使用「積極模式」
- 資源緊張時切換「保守模式」
- 專注任務收益時選擇「任務導向」

## 🔧 故障排除

### 配置不生效
1. 確認AI已啟用
2. 檢查冒險者公會是否運作
3. 重新加載配置

### 資源消耗過快
1. 降低團隊數量上限
2. 關閉自動招募成員
3. 增加檢查間隔時間

### 任務執行效率低
1. 增加團隊數量
2. 縮短任務分配間隔
3. 啟用自動招募功能
