import BasePanel from './panels/BasePanel.js';

/**
 * 经济面板 - 显示经济系统信息
 */
class EconomicPanel extends BasePanel {
  constructor(scene, x, y) {
    super(scene, x, y, {
      width: 400,
      height: 400,
      title: '经济系统',
      onClose: () => this.hide(),
      autoLayout: true,
      layoutDirection: 'vertical',
      layoutAlignment: 'left',
      layoutSpacing: 35,
      layoutPadding: { top: 60, left: 20, right: 20, bottom: 20 }
    });

    this.economicSystem = scene.economicSystem;
    this.createContent();
  }

  createContent() {
    // 货币显示
    this.currencyText = this.scene.add.text(0, 0, '', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0);

    // 价格信息提示
    this.priceHintText = this.scene.add.text(0, 0, '💰 点击"市场"按钮查看详细价格信息', {
      fontSize: '14px',
      fill: '#ffdd00',
      fontStyle: 'italic'
    }).setOrigin(0);

    // 满意度信息
    this.satisfactionText = this.scene.add.text(0, 0, '', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0);

    // 天气信息
    this.weatherText = this.scene.add.text(0, 0, '', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0);

    // 移民吸引力
    this.immigrationText = this.scene.add.text(0, 0, '', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0);

    // 事件信息
    this.eventText = this.scene.add.text(0, 0, '', {
      fontSize: '14px',
      fill: '#ffff00'
    }).setOrigin(0);

    // 创建分隔符
    const separator1 = this.scene.add.text(0, 0, '', { fontSize: '8px' });
    const separator2 = this.scene.add.text(0, 0, '', { fontSize: '8px' });
    const separator3 = this.scene.add.text(0, 0, '', { fontSize: '8px' });
    const separator4 = this.scene.add.text(0, 0, '', { fontSize: '8px' });
    const separator5 = this.scene.add.text(0, 0, '', { fontSize: '8px' });

    // 使用自动排列添加所有元素，在元素之间添加分隔符
    this.add([
      this.currencyText,
      separator1,
      this.priceHintText,
      separator2,
      this.satisfactionText,
      separator3,
      this.weatherText,
      separator4,
      this.immigrationText,
      separator5,
      this.eventText
    ]);

    // 监听随机事件
    this.scene.events.on('randomEvent', (event) => {
      this.showEvent(event);
    });

    this.updateContent();
  }

  updateContent() {
    if (!this.economicSystem) return;

    // 更新货币显示
    const currency = this.economicSystem.currency;
    this.currencyText.setText(
      `货币系统:\n` +
      `金币: ${currency.gold}\n` +
      `银币: ${currency.silver}\n` +
      `铜币: ${currency.copper}`
    );

    // 价格信息已移除 - 请使用市场面板查看详细价格信息

    // 更新满意度信息
    const satisfaction = this.economicSystem.getSatisfaction();
    const factors = this.economicSystem.satisfaction.factors;
    this.satisfactionText.setText(
      `人口满意度: ${satisfaction.toFixed(1)}%\n` +
      `食物: ${factors.food.toFixed(1)}\n` +
      `就业: ${factors.employment.toFixed(1)}\n` +
      `税收: ${factors.taxes.toFixed(1)}`
    );

    // 更新天气信息
    const weather = this.economicSystem.weather;
    const weatherEffect = this.economicSystem.getWeatherEffect();
    this.weatherText.setText(
      `天气: ${this.getWeatherName(weather.current)}\n` +
      `生产效率: ${(weatherEffect.productionModifier * 100).toFixed(0)}%`
    );

    // 更新移民吸引力
    const attraction = this.economicSystem.getImmigrationAttraction();
    this.immigrationText.setText(
      `移民吸引力: ${attraction > 0 ? '+' : ''}${attraction}%`
    );
  }

  getWeatherName(weather) {
    switch(weather) {
      case 'normal': return '正常';
      case 'rain': return '雨季';
      case 'drought': return '干旱';
      default: return '未知';
    }
  }

  showEvent(event) {
    this.eventText.setText(`事件: ${event.name}\n${event.description}`);

    // 5秒后清除事件显示
    this.scene.time.delayedCall(5000, () => {
      this.eventText.setText('');
    });
  }

  show() {
    super.show();
    this.updateContent();
  }

  update() {
    if (this.container.visible) {
      this.updateContent();
    }
  }
}

export default EconomicPanel;
