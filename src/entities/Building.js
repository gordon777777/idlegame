/**
 * Building class for the medieval magic city-building game
 * Represents a production building that can be placed in the game world
 */
export default class Building {
  /**
   * @param {Object} config - Building configuration
   * @param {string} config.id - Unique identifier for the building
   * @param {string} config.name - Display name of the building
   * @param {string} config.type - Building type (production, storage, etc.)
   * @param {string} config.sprite - Sprite key for the building
   * @param {Object} config.recipe - Production recipe (input/output resources)
   * @param {number} config.productionInterval - Time in ms to produce one batch
   * @param {Object} config.cost - Resources required to build
   * @param {number} config.level - Current building level
   * @param {Object} config.position - {x, y} position in the game world
   * @param {Phaser.Scene} scene - The scene this building belongs to
   */
  constructor(config, scene) {
    this.id = config.id || `building_${Date.now()}`;
    this.name = config.name;
    this.type = config.type;
    this.spriteKey = config.sprite;
    this.recipe = config.recipe || { input: {}, output: {} };
    this.productionInterval = config.productionInterval || 5000; // Default 5 seconds
    this.cost = config.cost || {};
    this.level = config.level || 1;
    this.position = config.position || { x: 0, y: 0 };
    this.scene = scene;
    this.sprite = null;
    this.productionProgress = 0;
    this.isProducing = false;
    this.isActive = true; // Whether the building has workers and can operate
    this.lastProductionTime = 0;
    this.efficiency = 1.0; // Production efficiency multiplier
    this.workerEfficiency = 1.0; // Efficiency multiplier from workers
    this.storage = {}; // Internal storage for resources
    this.statusText = null; // Text to show building status (active/inactive)

    this.createSprite();
  }

  /**
   * Create the sprite for this building
   */
  createSprite() {
    this.sprite = this.scene.add.sprite(this.position.x, this.position.y, this.spriteKey)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.selectBuilding(this.id);
      });

    // Add a progress bar for production
    this.progressBar = this.scene.add.rectangle(
      this.position.x,
      this.position.y + 40,
      0, 5, 0x00ff00
    );

    // Add level indicator
    this.levelText = this.scene.add.text(
      this.position.x - 15,
      this.position.y - 40,
      `Lv.${this.level}`,
      { fontSize: '12px', fill: '#ffffff' }
    );

    // Add status indicator
    this.statusText = this.scene.add.text(
      this.position.x,
      this.position.y - 60,
      this.isActive ? '' : '缺少工人',
      { fontSize: '10px', fill: '#ff0000', backgroundColor: '#000000' }
    ).setOrigin(0.5, 0);

    // If inactive, tint the sprite
    if (!this.isActive) {
      this.sprite.setTint(0x888888);
    }
  }

  /**
   * Start production if resources are available
   * @param {Object} availableResources - Resources available in the global pool
   * @returns {boolean} - Whether production started
   */
  startProduction(availableResources) {
    if (this.isProducing) return true;

    // Check if we have all required input resources
    const canProduce = Object.entries(this.recipe.input).every(
      ([resource, amount]) => availableResources[resource]?.value >= amount
    );

    if (canProduce) {
      this.isProducing = true;
      this.productionProgress = 0;
      return true;
    }

    return false;
  }

  /**
   * Update production progress
   * @param {number} time - Current game time
   * @param {number} delta - Time since last update
   * @param {Object} resourceSystem - Reference to the resource system
   * @returns {Object|null} - Produced resources or null if not complete
   */
  updateProduction(time, delta, resourceSystem) {
    // 如果建築不活動（沒有工人）或不在生產中，則返回空
    if (!this.isActive || !this.isProducing) return null;

    // 計算進度 - 結合建築效率和工人效率
    const totalEfficiency = this.efficiency * this.workerEfficiency;
    this.productionProgress += (delta * totalEfficiency);
    const progressPercent = Math.min(1, this.productionProgress / this.productionInterval);

    // 更新進度條
    this.progressBar.width = 60 * progressPercent;

    // 檢查生產是否完成
    if (this.productionProgress >= this.productionInterval) {
      this.isProducing = false;
      this.productionProgress = 0;
      this.progressBar.width = 0;
      this.lastProductionTime = time;

      // 消耗輸入資源
      resourceSystem.consumeResources(this.recipe.input);

      // 返回輸出資源
      return this.recipe.output;
    }

    return null;
  }

  /**
   * Upgrade the building to the next level
   * @param {Object} availableResources - Resources available in the global pool
   * @param {Object} upgradeCost - Cost to upgrade
   * @returns {boolean} - Whether upgrade was successful
   */
  upgrade(availableResources, upgradeCost) {
    // Check if we have enough resources for the upgrade
    const canUpgrade = Object.entries(upgradeCost).every(
      ([resource, amount]) => availableResources[resource]?.value >= amount
    );

    if (canUpgrade) {
      // Consume upgrade resources
      Object.entries(upgradeCost).forEach(([resource, amount]) => {
        availableResources[resource].value -= amount;
      });

      // Increase level
      this.level++;
      this.levelText.setText(`Lv.${this.level}`);

      // Improve production efficiency
      this.efficiency += 0.2;

      // Increase output by 20%
      Object.keys(this.recipe.output).forEach(resource => {
        this.recipe.output[resource] = Math.ceil(this.recipe.output[resource] * 1.2);
      });

      return true;
    }

    return false;
  }

  /**
   * Get information about this building for display
   * @returns {Object} - Building information
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      level: this.level,
      type: this.type,
      efficiency: this.efficiency,
      workerEfficiency: this.workerEfficiency,
      totalEfficiency: this.efficiency * this.workerEfficiency,
      recipe: this.recipe,
      productionInterval: this.productionInterval,
      isProducing: this.isProducing,
      isActive: this.isActive,
      productionTimeLeft: this.isProducing ?
        this.productionInterval - this.productionProgress : 0
    };
  }

  /**
   * 設置建築的活動狀態
   * @param {boolean} active - 是否活動
   * @param {number} workerEfficiency - 工人提供的效率乘數
   */
  setActive(active, workerEfficiency = 1.0) {
    this.isActive = active;
    this.workerEfficiency = workerEfficiency;

    // 更新視覺效果
    if (this.sprite) {
      if (!active) {
        this.sprite.setTint(0x888888);
        if (this.statusText) {
          this.statusText.setText('缺少工人');
        }
      } else {
        this.sprite.clearTint();
        if (this.statusText) {
          this.statusText.setText('');
        }
      }
    }
  }

  /**
   * Clean up resources when building is destroyed
   */
  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.progressBar) this.progressBar.destroy();
    if (this.levelText) this.levelText.destroy();
    if (this.statusText) this.statusText.destroy();
  }
}
