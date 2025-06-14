# BasePanel 自动排列功能文档

## 概述
BasePanel现在支持自动排列功能，可以自动按照指定的方向和对齐方式排列容器中的元素，无需手动设置每个元素的位置。

## 功能特性

### 🔧 自动排列配置
- **方向**: 支持垂直(vertical)和水平(horizontal)排列
- **对齐**: 支持左对齐(left)、居中(center)、右对齐(right)
- **间距**: 可自定义元素之间的间距
- **内边距**: 可设置面板内容区域的内边距
- **起始位置**: 可自定义排列的起始Y位置

### 📐 默认配置
```javascript
{
  autoLayout: true,                    // 启用自动排列
  layoutDirection: 'vertical',         // 垂直排列
  layoutAlignment: 'left',             // 左对齐
  layoutSpacing: 10,                   // 元素间距10px
  layoutPadding: {                     // 内边距
    top: 60,    // 顶部60px (为标题栏留空间)
    left: 20,   // 左边20px
    right: 20,  // 右边20px
    bottom: 20  // 底部20px
  },
  layoutStartY: null                   // 自动计算起始Y位置
}
```

## 使用方法

### 1. 在构造函数中配置
```javascript
class MyPanel extends BasePanel {
  constructor(scene, x, y) {
    super(scene, x, y, {
      width: 400,
      height: 500,
      title: '我的面板',
      autoLayout: true,
      layoutDirection: 'vertical',
      layoutAlignment: 'left',
      layoutSpacing: 15,
      layoutPadding: { top: 60, left: 20, right: 20, bottom: 20 }
    });
  }
}
```

### 2. 添加元素到自动排列
```javascript
// 创建元素时不需要设置具体位置
const text1 = this.scene.add.text(0, 0, '第一行文本', { fontSize: '16px' });
const text2 = this.scene.add.text(0, 0, '第二行文本', { fontSize: '16px' });
const button = new Button(this.scene, 0, 0, '按钮');

// 添加到面板，自动参与排列
this.add([text1, text2, ...button.getElements()]);

// 或者单独添加
this.add(text1);  // 自动排列
this.add(text2);  // 自动排列
```

### 3. 排除某些元素的自动排列
```javascript
// 第二个参数为false，不参与自动排列
this.add(backgroundElement, false);
```

## API 方法

### setLayoutConfig(config)
动态修改排列配置
```javascript
this.setLayoutConfig({
  layoutDirection: 'horizontal',
  layoutSpacing: 20,
  layoutAlignment: 'center'
});
```

### setAutoLayout(enabled)
启用或禁用自动排列
```javascript
this.setAutoLayout(false);  // 禁用自动排列
this.setAutoLayout(true);   // 启用自动排列
```

### relayout()
手动触发重新排列
```javascript
this.relayout();  // 重新计算并排列所有元素
```

### clearAutoLayoutElements()
清空自动排列元素列表
```javascript
this.clearAutoLayoutElements();  // 清空列表，但不移除元素
```

## 排列方向

### 垂直排列 (vertical)
```
┌─────────────────┐
│     标题栏      │
├─────────────────┤
│ 元素1           │
│ 元素2           │
│ 元素3           │
│ 元素4           │
└─────────────────┘
```

### 水平排列 (horizontal)
```
┌─────────────────┐
│     标题栏      │
├─────────────────┤
│ 元素1 元素2 元素3 │
└─────────────────┘
```

## 对齐方式

### 左对齐 (left)
```
┌─────────────────┐
│ 元素1           │
│ 元素2           │
│ 元素3           │
└─────────────────┘
```

### 居中对齐 (center)
```
┌─────────────────┐
│     元素1       │
│     元素2       │
│     元素3       │
└─────────────────┘
```

### 右对齐 (right)
```
┌─────────────────┐
│           元素1 │
│           元素2 │
│           元素3 │
└─────────────────┘
```

## 实际应用示例

### EconomicPanel 使用示例
```javascript
class EconomicPanel extends BasePanel {
  constructor(scene, x, y) {
    super(scene, x, y, {
      width: 400,
      height: 400,
      title: '经济系统',
      autoLayout: true,
      layoutDirection: 'vertical',
      layoutAlignment: 'left',
      layoutSpacing: 15,
      layoutPadding: { top: 60, left: 20, right: 20, bottom: 20 }
    });
    
    this.createContent();
  }
  
  createContent() {
    // 创建元素时不需要设置位置
    const currencyText = this.scene.add.text(0, 0, '货币信息', { fontSize: '16px' });
    const priceHint = this.scene.add.text(0, 0, '价格提示', { fontSize: '14px' });
    const satisfactionText = this.scene.add.text(0, 0, '满意度', { fontSize: '14px' });
    
    // 自动排列
    this.add([currencyText, priceHint, satisfactionText]);
  }
}
```

## 注意事项

### 1. 元素尺寸检测
自动排列会尝试检测元素的尺寸：
- 优先使用 `height`/`width` 属性
- 其次使用 `displayHeight`/`displayWidth` 属性
- 最后使用 `getBounds()` 方法
- 如果都无法获取，使用默认值 (高度30px，宽度100px)

### 2. 元素位置设置
自动排列会尝试设置元素位置：
- 优先使用 `setPosition(x, y)` 方法
- 其次直接设置 `x` 和 `y` 属性

### 3. 动态添加/移除
- 添加元素时会自动重新排列
- 移除元素时也会自动重新排列
- 确保UI始终保持整齐

### 4. 性能考虑
- 每次添加/移除元素都会触发重新排列
- 如果需要批量操作，可以临时禁用自动排列：
```javascript
this.setAutoLayout(false);
// 批量添加元素
this.add(element1, false);
this.add(element2, false);
this.add(element3, false);
// 重新启用并排列
this.setAutoLayout(true);
```

## 兼容性

### 向后兼容
- 现有的面板代码无需修改即可工作
- 默认启用自动排列，但不会影响手动设置位置的元素
- 可以通过 `autoLayout: false` 完全禁用自动排列

### 混合使用
```javascript
// 可以混合使用自动排列和手动定位
this.add(autoLayoutElement);        // 参与自动排列
this.add(manualElement, false);     // 不参与自动排列，手动定位
```

这个自动排列功能大大简化了面板布局的工作，让开发者可以专注于内容而不是位置计算！
