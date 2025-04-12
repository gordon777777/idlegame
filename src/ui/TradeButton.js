/**
 * 交易按鈕類 - 用於創建資源交易按鈕
 */
export default class TradeButton {
  /**
   * 創建一個交易按鈕
   * @param {Phaser.Scene} scene - 場景
   * @param {number} x - x座標
   * @param {number} y - y座標
   * @param {string} text - 按鈕文字
   * @param {Object} config - 配置選項
   * @param {string} config.resourceType - 資源類型
   * @param {string} config.tradeMode - 交易模式 (buy/sell)
   * @param {number} config.width - 按鈕寬度
   * @param {number} config.height - 按鈕高度
   * @param {number} config.backgroundColor - 按鈕背景顏色
   * @param {number} config.selectedColor - 選中時的顏色
   * @param {Function} config.onClick - 點擊回調函數
   */
  constructor(scene, x, y, text, config) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.text = text;
    this.resourceType = config.resourceType;
    this.tradeMode = config.tradeMode;
    
    // 設置默認配置
    this.config = {
      width: config.width || 60,
      height: config.height || 20,
      backgroundColor: config.backgroundColor || (this.tradeMode === 'buy' ? 0x4a6a6a : 0x6a4a4a),
      selectedColor: config.selectedColor || (this.tradeMode === 'buy' ? 0x6a8a6a : 0x8a4a4a),
      fontSize: config.fontSize || '12px',
      textColor: config.textColor || '#ffffff',
      onClick: config.onClick || (() => {})
    };
    
    this.isSelected = false;
    
    // 創建按鈕元素
    this.create();
  }
  
  /**
   * 創建按鈕元素
   * @private
   */
  create() {
    // 創建矩形背景
    this.rectangle = this.scene.add.rectangle(
      this.x, 
      this.y, 
      this.config.width, 
      this.config.height, 
      this.config.backgroundColor
    ).setInteractive();
    
    // 添加資源類型和交易模式屬性
    this.rectangle.resourceType = this.resourceType;
    this.rectangle.tradeMode = this.tradeMode;
    
    // 創建文字
    this.textObject = this.scene.add.text(
      this.x, 
      this.y, 
      this.text, 
      {
        fontSize: this.config.fontSize,
        fill: this.config.textColor
      }
    ).setOrigin(0.5, 0.5);
    
    // 添加點擊事件
    this.rectangle.on('pointerdown', () => {
      this.config.onClick(this.resourceType, this.tradeMode);
    });
  }
  
  /**
   * 設置按鈕是否為選中狀態
   * @param {boolean} isSelected - 是否選中
   */
  setSelected(isSelected) {
    this.isSelected = isSelected;
    this.rectangle.fillColor = isSelected ? this.config.selectedColor : this.config.backgroundColor;
  }
  
  /**
   * 獲取按鈕元素
   * @returns {Array} - 返回按鈕的矩形和文字對象
   */
  getElements() {
    return [this.rectangle, this.textObject];
  }
  
  /**
   * 獲取按鈕的矩形對象
   * @returns {Phaser.GameObjects.Rectangle} - 返回按鈕的矩形對象
   */
  getRectangle() {
    return this.rectangle;
  }
  
  /**
   * 銷毀按鈕
   */
  destroy() {
    this.rectangle.destroy();
    this.textObject.destroy();
  }
}
