# getUnemploymentRate() 方法文档

## 概述
为PopulationSystem添加了`getUnemploymentRate()`方法，用于计算当前的失业率，这是经济系统中的重要指标。

## 方法签名
```javascript
getUnemploymentRate(): number
```

## 返回值
- **类型**: `number`
- **范围**: 0-100
- **单位**: 百分比
- **说明**: 返回当前的失业率百分比

## 计算逻辑

### 1. 统计总工人数量
```javascript
let totalWorkers = 0;
let totalAssigned = 0;

for (const [, data] of Object.entries(this.workerTypes)) {
  totalWorkers += Math.floor(data.count);
  totalAssigned += Math.floor(data.assigned);
}
```

### 2. 计算失业率
```javascript
const unemployed = totalWorkers - totalAssigned;
const unemploymentRate = (unemployed / totalWorkers) * 100;
```

### 3. 边界处理
- 如果没有工人（totalWorkers === 0），返回0
- 确保失业率在0-100之间

## 使用场景

### 1. 经济系统中的应用
在`EconomicSystem.js`中用于：
- 计算人口满意度
- 确定移民吸引力
- 评估经济健康状况

```javascript
// 就业满意度
const unemploymentRate = this.populationSystem.getUnemploymentRate();
factors.employment = Math.max(0, 100 - unemploymentRate * 2);

// 移民吸引力
if (unemploymentRate < 10) {
  attraction += 30; // 工作职位比人口多
} else if (unemploymentRate > 30) {
  attraction -= 60; // 失业率过高
}
```

### 2. UI显示
在`PopulationPanel.js`中显示失业率信息：
- 实时更新失业率数值
- 根据失业率高低显示不同颜色
- 提供直观的经济状况反馈

## 失业率颜色编码

在PopulationPanel中，失业率按以下标准显示颜色：

| 失业率范围 | 颜色 | 状态描述 |
|-----------|------|----------|
| ≤ 5% | 绿色 | 充分就业 |
| 5-10% | 浅绿色 | 良好 |
| 10-20% | 黄色 | 正常 |
| 20-30% | 橙色 | 偏高 |
| > 30% | 红色 | 严重失业 |

## 集成到现有系统

### 1. PopulationSystem.getPopulationStats()
现在包含失业率信息：
```javascript
const stats = {
  total: Math.floor(this.totalPopulation),
  capacity: this.housingCapacity,
  happiness: Math.floor(this.happinessLevel),
  unemploymentRate: this.getUnemploymentRate(), // 新增
  workers: {},
  socialClasses: {}
};
```

### 2. UI面板更新
PopulationPanel现在显示：
- 总人口
- 住房使用情况
- 剩余住房
- **失业率** (新增)
- 总体幸福度
- 各阶层幸福度

## 经济影响

失业率影响以下系统：

### 1. 人口满意度
- 失业率越高，就业满意度越低
- 公式：`employment = Math.max(0, 100 - unemploymentRate * 2)`

### 2. 移民吸引力
- 低失业率（<10%）增加移民吸引力 +30%
- 高失业率（>30%）降低移民吸引力 -60%

### 3. 经济稳定性
- 失业率是衡量经济健康的重要指标
- 影响玩家的城市管理策略

## 使用示例

```javascript
// 获取当前失业率
const unemploymentRate = populationSystem.getUnemploymentRate();

// 根据失业率调整政策
if (unemploymentRate > 20) {
  console.log("失业率过高，需要创造更多就业机会");
} else if (unemploymentRate < 5) {
  console.log("接近充分就业，经济状况良好");
}

// 在UI中显示
const color = getUnemploymentColor(unemploymentRate);
unemploymentText.setText(`失业率: ${unemploymentRate.toFixed(1)}%`)
               .setFill(color);
```

## 注意事项

1. **实时计算**: 每次调用都会重新计算，确保数据准确性
2. **性能考虑**: 计算复杂度为O(n)，其中n为工人类型数量
3. **数据一致性**: 依赖于workerTypes中的count和assigned字段
4. **边界处理**: 处理了除零错误和数值范围限制

## 未来扩展

可以考虑添加：
1. 历史失业率趋势
2. 按职业类型的失业率统计
3. 季节性失业率变化
4. 失业率预测功能
