/**
 * 選項卡按鈕類 - 用於創建可切換的選項卡按鈕
 */
export default class TabButton {
  /**
   * 創建一個選項卡按鈕
   * @param {Phaser.Scene} scene - 場景
   * @param {number} x - x座標
   * @param {number} y - y座標
   * @param {string} text - 按鈕文字
   * @param {Object} config - 配置選項
   * @param {string} config.id - 選項卡ID
   * @param {number} config.width - 按鈕寬度
   * @param {number} config.height - 按鈕高度
   * @param {number} config.backgroundColor - 按鈕背景顏色
   * @param {number} config.activeColor - 選中時的顏色
   * @param {boolean} config.isActive - 是否為活動狀態
   * @param {Function} config.onClick - 點擊回調函數
   */
  constructor(scene, x, y, text, config) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.text = text;
    this.id = config.id;
    
    // 設置默認配置
    this.config = {
      width: config.width || 100,
      height: config.height || 36,
      backgroundColor: config.backgroundColor || 0x2d2d2d,
      activeColor: config.activeColor || 0x3a6a8c,
      isActive: config.isActive || false,
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
    // 創建背景框
    this.background = this.scene.add.rectangle(
      this.x, 
      this.y, 
      this.config.width, 
      this.config.height, 
      0x1a1a1a
    ).setStrokeStyle(1, 0x4a4a4a);
    
    // 創建矩形背景
    this.rectangle = this.scene.add.rectangle(
      this.x, 
      this.y, 
      this.config.width - 4, 
      this.config.height - 4, 
      this.config.isActive ? this.config.activeColor : this.config.backgroundColor
    ).setInteractive();
    
    // 創建文字
    this.textObject = this.scene.add.text(
      this.x, 
      this.y, 
      this.text, 
      {
        fontSize: '18px',
        fontStyle: 'bold',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5, 0.5);
    
    // 添加點擊事件
    this.rectangle.on('pointerdown', () => {
      this.config.onClick(this.id);
    });
  }
  
  /**
   * 設置按鈕是否為活動狀態
   * @param {boolean} isActive - 是否為活動狀態
   */
  setActive(isActive) {
    this.config.isActive = isActive;
    this.rectangle.fillColor = isActive ? this.config.activeColor : this.config.backgroundColor;
  }
  
  /**
   * 獲取按鈕元素
   * @returns {Array} - 返回按鈕的所有元素
   */
  getElements() {
    return [this.background, this.rectangle, this.textObject];
  }
  
  /**
   * 獲取按鈕矩形對象
   * @returns {Phaser.GameObjects.Rectangle} - 返回按鈕的矩形對象
   */
  getRectangle() {
    return this.rectangle;
  }
  
  /**
   * 獲取按鈕ID
   * @returns {string} - 返回按鈕的ID
   */
  getId() {
    return this.id;
  }
  
  /**
   * 銷毀按鈕
   */
  destroy() {
    this.background.destroy();
    this.rectangle.destroy();
    this.textObject.destroy();
  }
}
