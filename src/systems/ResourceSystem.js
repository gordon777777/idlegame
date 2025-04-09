/**
 * System for managing resources and production chains
 */
class ResourceSystem {
  constructor() {
    // Define all resources with their initial values and production rates
    this.resources = {
      // Basic resources (tier 1)
      magic_ore: { value: 200, production: 0, tier: 1, displayName: '魔法礦石' },
      enchanted_wood: { value: 200, production: 0, tier: 1, displayName: '附魔木材' },
      arcane_crystal: { value: 100, production: 0, tier: 1, displayName: '奧術水晶' },
      mana: { value: 100, production: 0, tier: 1, displayName: '魔力' },

      // Processed resources (tier 2)
      arcane_essence: { value: 50, production: 0, tier: 2, displayName: '奧術精華' },
      mystic_planks: { value: 50, production: 0, tier: 2, displayName: '神秘木板' },
      refined_crystal: { value: 0, production: 0, tier: 2, displayName: '精煉水晶' },
      research_point: { value: 20, production: 0, tier: 2, displayName: '研究點數' },

      // Advanced resources (tier 3)
      magical_potion: { value: 20, production: 0, tier: 3, displayName: '魔法藥水' },
      enchanted_artifact: { value: 10, production: 0, tier: 3, displayName: '附魔神器' },
      knowledge: { value: 30, production: 0, tier: 3, displayName: '知識' },

      // End products (tier 4)
      magical_construct: { value: 5, production: 0, tier: 4, displayName: '魔法構造體' },
      wizard: { value: 0, production: 0, tier: 4, displayName: '法師' }
    };

    // Map to store production chains
    this.productionChains = new Map();

    // Resource caps
    this.resourceCaps = {};
    this.initializeResourceCaps();

    // Resource consumption stats
    this.consumptionStats = {};
    this.productionStats = {};
    this.initializeStats();
  }

  /**
   * Initialize resource caps based on tier
   */
  initializeResourceCaps() {
    Object.keys(this.resources).forEach(resource => {
      const tier = this.resources[resource].tier;
      // Higher tier resources have lower caps
      switch(tier) {
        case 1: this.resourceCaps[resource] = 1000; break;
        case 2: this.resourceCaps[resource] = 500; break;
        case 3: this.resourceCaps[resource] = 200; break;
        case 4: this.resourceCaps[resource] = 100; break;
        default: this.resourceCaps[resource] = 100;
      }
    });
  }

  /**
   * Initialize resource statistics
   */
  initializeStats() {
    Object.keys(this.resources).forEach(resource => {
      this.consumptionStats[resource] = 0;
      this.productionStats[resource] = 0;
    });
  }

  /**
   * Add a production chain to the system
   * @param {Building} building - The building to add
   */
  addProductionChain(building) {
    this.productionChains.set(building.id, {
      input: building.recipe.input,
      output: building.recipe.output,
      interval: building.productionInterval,
      lastProduction: 0,
      efficiency: building.efficiency || 1.0,
      active: true
    });
  }

  /**
   * Update all production chains
   * @param {number} time - Current game time
   * @param {number} delta - Time since last update in ms
   */
  update(time, delta) {
    // Reset production rates
    Object.keys(this.resources).forEach(resource => {
      this.resources[resource].production = 0;
    });

    // Process each production chain
    this.productionChains.forEach((chain, id) => {
      if (!chain.active) return;

      if (time - chain.lastProduction > chain.interval) {
        if (this.hasResources(chain.input)) {
          // Check if we have space for the output
          const hasSpace = Object.entries(chain.output).every(([resource, amount]) => {
            return this.resources[resource].value + amount <= this.resourceCaps[resource];
          });

          if (hasSpace) {
            // Consume input resources
            this.consumeResources(chain.input);

            // Add output resources
            this.addResources(chain.output);

            // Update stats
            Object.entries(chain.input).forEach(([resource, amount]) => {
              this.consumptionStats[resource] += amount;
            });

            Object.entries(chain.output).forEach(([resource, amount]) => {
              this.productionStats[resource] += amount;
            });

            // Update production rates (per minute)
            Object.entries(chain.output).forEach(([resource, amount]) => {
              const perMinute = (amount * 60000) / chain.interval;
              this.resources[resource].production += perMinute * chain.efficiency;
            });

            chain.lastProduction = time;
          }
        }
      }
    });
  }

  /**
   * Check if we have enough of the specified resources
   * @param {Object} resources - Map of resource types to amounts
   * @returns {boolean} - Whether we have enough resources
   */
  hasResources(resources) {
    return Object.entries(resources).every(([type, amount]) =>
      this.resources[type]?.value >= amount
    );
  }

  /**
   * Consume resources from the global pool
   * @param {Object} resources - Map of resource types to amounts
   */
  consumeResources(resources) {
    Object.entries(resources).forEach(([type, amount]) => {
      if (this.resources[type]) {
        this.resources[type].value = Math.max(0, this.resources[type].value - amount);
      }
    });
  }

  /**
   * Add resources to the global pool
   * @param {Object} resources - Map of resource types to amounts
   */
  addResources(resources) {
    Object.entries(resources).forEach(([type, amount]) => {
      if (this.resources[type]) {
        // Add resources up to the cap
        const newValue = this.resources[type].value + amount;
        this.resources[type].value = Math.min(newValue, this.resourceCaps[type] || Infinity);
      }
    });
  }

  /**
   * Get resources by tier
   * @param {number} tier - Resource tier to filter by
   * @returns {Object} - Resources of the specified tier
   */
  getResourcesByTier(tier) {
    const result = {};

    Object.entries(this.resources).forEach(([key, resource]) => {
      if (resource.tier === tier) {
        result[key] = resource;
      }
    });

    return result;
  }

  /**
   * Increase resource cap
   * @param {string} resourceType - Type of resource
   * @param {number} amount - Amount to increase cap by
   */
  increaseResourceCap(resourceType, amount) {
    if (this.resourceCaps[resourceType]) {
      this.resourceCaps[resourceType] += amount;
    }
  }

  /**
   * Get production statistics
   * @returns {Object} - Production statistics
   */
  getProductionStats() {
    return {
      production: this.productionStats,
      consumption: this.consumptionStats
    };
  }
}

export default ResourceSystem;