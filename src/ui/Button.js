/**
 * 按鈕類 - 用於創建統一風格的按鈕
 */
export default class Button {
  /**
   * 創建一個按鈕
   * @param {Phaser.Scene} scene - 場景
   * @param {number} x - x座標
   * @param {number} y - y座標
   * @param {string} text - 按鈕文字
   * @param {Object} config - 配置選項
   * @param {number} [config.width=80] - 按鈕寬度
   * @param {number} [config.height=30] - 按鈕高度
   * @param {number} [config.backgroundColor=0x4a6a4a] - 按鈕背景顏色
   * @param {string} [config.textColor='#ffffff'] - 文字顏色
   * @param {string} [config.fontSize='14px'] - 文字大小
   * @param {Function} [config.onClick] - 點擊回調函數
   */
  constructor(scene, x, y, text, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.text = text;

    // 設置默認配置
    this.config = {
      width: config.width || 60,
      height: config.height || 26,
      backgroundColor: config.backgroundColor || 0x4a6a4a,
      textColor: config.textColor || '#ffffff',
      fontSize: config.fontSize || '14px',
      onClick: config.onClick || (() => {})
    };

    // 創建按鈕元素
    this.create();
  }

  /**
   * 創建按鈕元素
   * @private
   */
  create() {
    try {
      // 創建矩形背景
      this.rectangle = this.scene.add.rectangle(
        this.x,
        this.y,
        this.config.width,
        this.config.height,
        this.config.backgroundColor
      ).setInteractive();

      // 創建文字
      this.textObject = this.scene.add.text(
        this.x,
        this.y,
        this.text || 'Button', // 确保文本不为空
        {
          fontSize: this.config.fontSize,
          fill: this.config.textColor
        }
      ).setOrigin(0.5, 0.5);

      console.log(`Button created: ${this.text}, position: ${this.x},${this.y}`);
    } catch (error) {
      console.error('Error creating button:', error);
    }

    // 添加點擊事件
    this.rectangle.on('pointerdown', this.config.onClick);

    // 添加懸停效果
    this.rectangle.on('pointerover', () => {
      this.rectangle.setFillStyle(this.config.backgroundColor, 0.8);
    });

    this.rectangle.on('pointerout', () => {
      this.rectangle.setFillStyle(this.config.backgroundColor, 1);
    });
  }

  /**
   * 設置按鈕是否可見
   * @param {boolean} visible - 是否可見
   * @returns {Button} - 返回按鈕實例，支持鏈式調用
   */
  setVisible(visible) {
    this.rectangle.setVisible(visible);
    this.textObject.setVisible(visible);
    return this;
  }

  /**
   * 設置按鈕是否可交互
   * @param {boolean} interactive - 是否可交互
   * @returns {Button} - 返回按鈕實例，支持鏈式調用
   */
  setInteractive(interactive) {
    if (interactive) {
      this.rectangle.setInteractive();
    } else {
      this.rectangle.disableInteractive();
    }
    return this;
  }

  /**
   * 設置按鈕文字
   * @param {string} text - 新的按鈕文字
   * @returns {Button} - 返回按鈕實例，支持鏈式調用
   */
  setText(text) {
    this.text = text;
    this.textObject.setText(text);
    return this;
  }

  /**
   * 設置按鈕位置
   * @param {number} x - x座標
   * @param {number} y - y座標
   * @returns {Button} - 返回按鈕實例，支持鏈式調用
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.rectangle.setPosition(x, y);
    this.textObject.setPosition(x, y);
    return this;
  }

  /**
   * 設置按鈕背景顏色
   * @param {number} color - 顏色
   * @returns {Button} - 返回按鈕實例，支持鏈式調用
   */
  setBackgroundColor(color) {
    this.config.backgroundColor = color;
    this.rectangle.setFillStyle(color);
    return this;
  }

  /**
   * 設置按鈕文字顏色
   * @param {string} color - 顏色
   * @returns {Button} - 返回按鈕實例，支持鏈式調用
   */
  setTextColor(color) {
    this.config.textColor = color;
    this.textObject.setColor(color);
    return this;
  }

  /**
   * 設置按鈕大小
   * @param {number} width - 寬度
   * @param {number} height - 高度
   * @returns {Button} - 返回按鈕實例，支持鏈式調用
   */
  setSize(width, height) {
    this.config.width = width;
    this.config.height = height;
    this.rectangle.setSize(width, height);
    return this;
  }

  /**
   * 設置點擊回調函數
   * @param {Function} callback - 回調函數
   * @returns {Button} - 返回按鈕實例，支持鏈式調用
   */
  setOnClick(callback) {
    this.rectangle.off('pointerdown');
    this.config.onClick = callback;
    this.rectangle.on('pointerdown', callback);
    return this;
  }

  /**
   * 獲取按鈕元素
   * @returns {Array} - 返回按鈕的矩形和文字對象
   */
  getElements() {
    if (!this.rectangle || !this.textObject) {
      console.error('Button elements not created properly');
      return [];
    }
    return [this.rectangle, this.textObject];
  }

  /**
   * 銷毀按鈕
   */
  destroy() {
    this.rectangle.destroy();
    this.textObject.destroy();
  }
}
