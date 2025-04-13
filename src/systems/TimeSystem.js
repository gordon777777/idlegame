/**
 * 時間系統 - 管理遊戲內的時間流逝
 */
export default class TimeSystem {
  /**
   * @param {Object} config - 系統配置
   */
  constructor(config = {}) {
    // 遊戲內時間
    this.day = config.initialDay || 1;
    this.month = config.initialMonth || 1;
    this.year = config.initialYear || 1;
    
    // 每個月的天數
    this.daysPerMonth = 30;
    
    // 每年的月數
    this.monthsPerYear = 12;
    
    // 時間流逝速度 (5秒 = 1天)
    this.dayDuration = config.dayDuration || 5000; // 毫秒
    
    // 時間累積器
    this.timeAccumulator = 0;
    
    // 時間速度倍率 (1.0 = 正常速度)
    this.timeScale = 1.0;
    
    // 時間暫停標記
    this.paused = false;
    
    // 事件回調
    this.callbacks = {
      onDayChange: [],
      onMonthChange: [],
      onYearChange: [],
      onSeasonChange: []
    };
    
    // 季節
    this.seasons = ['春', '夏', '秋', '冬'];
    this.currentSeason = 0;
    
    // 每個季節的月數
    this.monthsPerSeason = this.monthsPerYear / this.seasons.length;
    
    // 日期格式化選項
    this.dateFormat = config.dateFormat || 'YYYY年MM月DD日';
    
    // 初始化時間顯示
    this.timeDisplay = null;
  }
  
  /**
   * 更新時間系統
   * @param {number} time - 當前遊戲時間
   * @param {number} delta - 自上次更新以來的時間（毫秒）
   */
  update(time, delta) {
    if (this.paused) return;
    
    // 根據時間速度調整增量
    const scaledDelta = delta * this.timeScale;
    
    // 累積時間
    this.timeAccumulator += scaledDelta;
    
    // 檢查是否過了一天
    if (this.timeAccumulator >= this.dayDuration) {
      // 計算經過的天數
      const daysElapsed = Math.floor(this.timeAccumulator / this.dayDuration);
      this.timeAccumulator -= daysElapsed * this.dayDuration;
      
      // 更新日期
      this.advanceDays(daysElapsed);
    }
  }
  
  /**
   * 前進指定天數
   * @param {number} days - 要前進的天數
   */
  advanceDays(days) {
    for (let i = 0; i < days; i++) {
      // 增加一天
      this.day++;
      
      // 觸發日期變更事件
      this.triggerCallbacks('onDayChange', { day: this.day, month: this.month, year: this.year });
      
      // 檢查月份變更
      if (this.day > this.daysPerMonth) {
        this.day = 1;
        this.month++;
        
        // 觸發月份變更事件
        this.triggerCallbacks('onMonthChange', { day: this.day, month: this.month, year: this.year });
        
        // 檢查季節變更
        const newSeason = Math.floor((this.month - 1) / this.monthsPerSeason);
        if (newSeason !== this.currentSeason) {
          this.currentSeason = newSeason;
          
          // 觸發季節變更事件
          this.triggerCallbacks('onSeasonChange', { 
            season: this.seasons[this.currentSeason],
            seasonIndex: this.currentSeason
          });
        }
        
        // 檢查年份變更
        if (this.month > this.monthsPerYear) {
          this.month = 1;
          this.year++;
          
          // 觸發年份變更事件
          this.triggerCallbacks('onYearChange', { day: this.day, month: this.month, year: this.year });
        }
      }
    }
  }
  
  /**
   * 設置時間速度
   * @param {number} scale - 時間速度倍率 (1.0 = 正常速度)
   */
  setTimeScale(scale) {
    this.timeScale = Math.max(0, scale);
    return this.timeScale;
  }
  
  /**
   * 暫停/恢復時間流逝
   * @param {boolean} paused - 是否暫停
   */
  setPaused(paused) {
    this.paused = paused;
    return this.paused;
  }
  
  /**
   * 切換暫停狀態
   * @returns {boolean} - 新的暫停狀態
   */
  togglePaused() {
    this.paused = !this.paused;
    return this.paused;
  }
  
  /**
   * 註冊事件回調
   * @param {string} event - 事件名稱 ('onDayChange', 'onMonthChange', 'onYearChange', 'onSeasonChange')
   * @param {Function} callback - 回調函數
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }
  
  /**
   * 移除事件回調
   * @param {string} event - 事件名稱
   * @param {Function} callback - 回調函數
   */
  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }
  
  /**
   * 觸發事件回調
   * @param {string} event - 事件名稱
   * @param {Object} data - 事件數據
   */
  triggerCallbacks(event, data) {
    if (this.callbacks[event]) {
      for (const callback of this.callbacks[event]) {
        callback(data);
      }
    }
  }
  
  /**
   * 獲取當前季節
   * @returns {string} - 當前季節名稱
   */
  getSeason() {
    return this.seasons[this.currentSeason];
  }
  
  /**
   * 獲取格式化的日期字符串
   * @returns {string} - 格式化的日期
   */
  getFormattedDate() {
    let formatted = this.dateFormat;
    formatted = formatted.replace('YYYY', this.year.toString().padStart(4, '0'));
    formatted = formatted.replace('MM', this.month.toString().padStart(2, '0'));
    formatted = formatted.replace('DD', this.day.toString().padStart(2, '0'));
    return formatted;
  }
  
  /**
   * 設置時間顯示元素
   * @param {Phaser.GameObjects.Text} textObject - Phaser文本對象
   */
  setTimeDisplay(textObject) {
    this.timeDisplay = textObject;
    this.updateTimeDisplay();
  }
  
  /**
   * 更新時間顯示
   */
  updateTimeDisplay() {
    if (this.timeDisplay) {
      const dateStr = this.getFormattedDate();
      const seasonStr = this.getSeason();
      this.timeDisplay.setText(`${dateStr} (${seasonStr}季)`);
    }
  }
}
