/**
 * 調試工具類 - 用於遊戲調試
 */
export default class DebugUtils {
  /**
   * 初始化調試工具
   */
  // 初始化標記
  static initialized = false;

  static init() {
    // 如果已經初始化，則跳過
    if (this.initialized) {
      console.log('調試工具已經初始化');
      return;
    }

    // 調試模式開關
    this.debugMode = false;

    // 調試日誌數組
    this.logs = [];

    // 最大日誌數量
    this.maxLogs = 100;

    // 調試面板
    this.debugPanel = null;

    // 調試文本
    this.debugText = null;

    // 調試場景
    this.scene = null;

    // 設置初始化標記
    this.initialized = true;

    console.log('調試工具初始化完成');
  }

  /**
   * 設置調試場景
   * @param {Phaser.Scene} scene - 遊戲場景
   */
  static setScene(scene) {
    this.scene = scene;
  }

  /**
   * 切換調試模式
   */
  static toggleDebugMode() {
    this.debugMode = !this.debugMode;
    console.log(`調試模式: ${this.debugMode ? '開啟' : '關閉'}`);

    if (this.debugMode) {
      this.createDebugPanel();
    } else if (this.debugPanel) {
      this.destroyDebugPanel();
    }

    return this.debugMode;
  }

  /**
   * 創建調試面板
   */
  static createDebugPanel() {
    if (!this.scene) return;

    // 如果已經存在，先銷毀
    if (this.debugPanel) {
      this.destroyDebugPanel();
    }

    // 創建調試面板
    this.debugPanel = this.scene.add.container(10, 10);

    // 創建背景
    const background = this.scene.add.rectangle(0, 0, 400, 300, 0x000000, 0.7)
      .setOrigin(0, 0);

    // 創建標題
    const title = this.scene.add.text(10, 10, '調試面板', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    });

    // 創建日誌文本
    this.debugText = this.scene.add.text(10, 40, '', {
      fontSize: '12px',
      fill: '#ffffff',
      wordWrap: { width: 380 }
    });

    // 創建關閉按鈕
    const closeButton = this.scene.add.rectangle(380, 10, 20, 20, 0xff0000)
      .setInteractive()
      .on('pointerdown', () => this.toggleDebugMode());

    const closeText = this.scene.add.text(380, 10, 'X', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 添加元素到面板
    this.debugPanel.add([background, title, this.debugText, closeButton, closeText]);

    // 更新日誌顯示
    this.updateDebugText();
  }

  /**
   * 銷毀調試面板
   */
  static destroyDebugPanel() {
    if (this.debugPanel) {
      this.debugPanel.destroy();
      this.debugPanel = null;
      this.debugText = null;
    }
  }

  /**
   * 添加調試日誌
   * @param {string} message - 日誌消息
   * @param {string} category - 日誌類別
   */
  static log(message, category = 'INFO') {
    // 確保已經初始化
    if (!this.initialized) {
      this.init();
    }
    if(category == 'ERROR')
    {
      console.error(message);
    }
    if(category == 'WARNING')
    {
      console.warn(message);
    }
    if(category == 'HAPPINESS')
    {
      return;
    }

    // 創建日誌條目
    const logEntry = {
      time: new Date().toLocaleTimeString(),
      category,
      message
    };

    // 添加到日誌數組
    this.logs.unshift(logEntry);

    // 限制日誌數量
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // 輸出到控制台
    console.log(`[${category}] ${message}`);

    // 如果調試面板存在，更新顯示
    if (this.debugMode && this.debugText) {
      this.updateDebugText();
    }
  }

  /**
   * 更新調試文本
   */
  static updateDebugText() {
    if (!this.debugText) return;

    // 構建日誌文本
    let logText = '';
    for (let i = 0; i < Math.min(20, this.logs.length); i++) {
      const log = this.logs[i];
      logText += `[${log.time}][${log.category}] ${log.message}\n`;
    }

    // 設置文本
    this.debugText.setText(logText);
  }

  /**
   * 清空日誌
   */
  static clearLogs() {
    this.logs = [];

    if (this.debugText) {
      this.debugText.setText('');
    }
  }
}
