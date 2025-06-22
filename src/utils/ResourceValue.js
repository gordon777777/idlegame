export class ResourceValue {
  constructor(config) {
    this.type = config.type;
    this.currentValue = config.initialValue || 0;
    this.dailyRecovery = config.dailyRecovery;
    this.maxValue = config.maxValue;
    this.dailyConsumed = 0;
    this.consumptionRate = config.consumptionRate; // 人均消耗率
  }

  recover() {
    this.currentValue = Math.min(this.currentValue + this.dailyRecovery, this.maxValue);
  }

  addConsumption(amount) {
    this.dailyConsumed += amount;
    this.currentValue = Math.max(this.currentValue - amount, 0);
  }

  resetDailyConsumption() {
    this.dailyConsumed = 0;
  }

  ensureMaxValue() {
    this.currentValue = Math.min(this.currentValue, this.maxValue);
  }
}