/**
 * System for managing research and technology progression
 */
export default class ResearchSystem {
  /**
   * @param {ResourceSystem} resourceSystem - Reference to the resource system
   * @param {Object} technologies - Optional technologies data from DataManager
   */
  constructor(resourceSystem, technologies = null) {
    this.resourceSystem = resourceSystem;
    this.technologies = technologies || this.defineTechnologies();
    this.researchPoints = 0;
    this.researchRate = 0.1; // Research points per second
    this.completedResearch = new Set();
    this.activeResearch = null;
    this.researchProgress = 0;
  }

  /**
   * Define all available technologies
   * @returns {Object} - Map of technology definitions
   */
  defineTechnologies() {
    return {
      // Basic resource technologies
      improved_mining: {
        name: 'Improved Mining',
        description: 'Increases magic ore production by 20%',
        cost: 10,
        requirements: [],
        effects: {
          productionMultiplier: { resource: 'magic_ore', value: 1.2 }
        }
      },

      efficient_forestry: {
        name: 'Efficient Forestry',
        description: 'Increases enchanted wood production by 20%',
        cost: 10,
        requirements: [],
        effects: {
          productionMultiplier: { resource: 'enchanted_wood', value: 1.2 }
        }
      },

      crystal_resonance: {
        name: 'Crystal Resonance',
        description: 'Increases arcane crystal production by 20%',
        cost: 10,
        requirements: [],
        effects: {
          productionMultiplier: { resource: 'arcane_crystal', value: 1.2 }
        }
      },

      // Intermediate technologies
      arcane_metallurgy: {
        name: 'Arcane Metallurgy',
        description: 'Improves Magic Forge efficiency by 25%',
        cost: 20,
        requirements: ['improved_mining'],
        effects: {
          buildingEfficiency: { building: 'magic_forge', value: 1.25 }
        }
      },

      mystic_carpentry: {
        name: 'Mystic Carpentry',
        description: 'Improves Wood Enchanter efficiency by 25%',
        cost: 20,
        requirements: ['efficient_forestry'],
        effects: {
          buildingEfficiency: { building: 'wood_enchanter', value: 1.25 }
        }
      },

      crystal_harmonics: {
        name: 'Crystal Harmonics',
        description: 'Improves Crystal Refinery efficiency by 25%',
        cost: 20,
        requirements: ['crystal_resonance'],
        effects: {
          buildingEfficiency: { building: 'crystal_refinery', value: 1.25 }
        }
      },

      // Advanced technologies
      alchemical_mastery: {
        name: 'Alchemical Mastery',
        description: 'Improves Alchemy Lab efficiency by 30%',
        cost: 30,
        requirements: ['arcane_metallurgy', 'crystal_harmonics'],
        effects: {
          buildingEfficiency: { building: 'alchemy_lab', value: 1.3 }
        }
      },

      enchantment_mastery: {
        name: 'Enchantment Mastery',
        description: 'Improves Enchanting Tower efficiency by 30%',
        cost: 30,
        requirements: ['mystic_carpentry', 'crystal_harmonics'],
        effects: {
          buildingEfficiency: { building: 'enchanting_tower', value: 1.3 }
        }
      },

      // Storage technologies
      expanded_warehouses: {
        name: 'Expanded Warehouses',
        description: 'Increases storage capacity of all resources by 20%',
        cost: 15,
        requirements: [],
        effects: {
          storageCap: { multiplier: 1.2 }
        }
      },

      magical_containers: {
        name: 'Magical Containers',
        description: 'Increases storage capacity of all resources by 30%',
        cost: 25,
        requirements: ['expanded_warehouses'],
        effects: {
          storageCap: { multiplier: 1.3 }
        }
      },

      // Efficiency technologies
      resource_optimization: {
        name: 'Resource Optimization',
        description: 'Reduces resource consumption by 10%',
        cost: 20,
        requirements: [],
        effects: {
          resourceConsumption: { multiplier: 0.9 }
        }
      },

      magical_efficiency: {
        name: 'Magical Efficiency',
        description: 'All buildings work 15% faster',
        cost: 35,
        requirements: ['resource_optimization'],
        effects: {
          productionSpeed: { multiplier: 0.85 } // Reduces time needed
        }
      },

      // End-game technologies
      arcane_mastery: {
        name: 'Arcane Mastery',
        description: 'Improves Arcane Workshop efficiency by 50%',
        cost: 50,
        requirements: ['alchemical_mastery', 'enchantment_mastery'],
        effects: {
          buildingEfficiency: { building: 'arcane_workshop', value: 1.5 }
        }
      }
    };
  }

  /**
   * Update research progress
   * @param {number} delta - Time since last update in ms
   */
  update(delta) {
    if (!this.activeResearch) return;

    // Convert delta from ms to seconds
    const deltaSeconds = delta / 1000;

    // Add research points based on time
    this.researchProgress += this.researchRate * deltaSeconds;

    // Check if research is complete
    if (this.researchProgress >= this.technologies[this.activeResearch].cost) {
      this.completeResearch(this.activeResearch);
    }
  }

  /**
   * Start researching a technology
   * @param {string} techId - Technology ID to research
   * @returns {boolean} - Whether research was started successfully
   */
  startResearch(techId) {
    const tech = this.technologies[techId];

    if (!tech || this.completedResearch.has(techId) || this.activeResearch) {
      return false;
    }

    // Check if all requirements are met
    const requirementsMet = tech.requirements.every(req =>
      this.completedResearch.has(req)
    );

    if (!requirementsMet) {
      return false;
    }

    this.activeResearch = techId;
    this.researchProgress = 0;

    return true;
  }

  /**
   * Complete the current research
   * @param {string} techId - Technology ID that was completed
   */
  completeResearch(techId) {
    if (!this.technologies[techId]) return;

    // Mark as completed
    this.completedResearch.add(techId);

    // Apply effects
    this.applyResearchEffects(techId);

    // Reset active research
    this.activeResearch = null;
    this.researchProgress = 0;
  }

  /**
   * Apply the effects of a completed research
   * @param {string} techId - Technology ID to apply effects for
   */
  applyResearchEffects(techId) {
    const tech = this.technologies[techId];
    if (!tech || !tech.effects) return;

    // Handle different effect types
    Object.entries(tech.effects).forEach(([effectType, effect]) => {
      switch (effectType) {
        case 'productionMultiplier':
          // Handled by the resource system when calculating production
          break;

        case 'buildingEfficiency':
          // Will be applied when buildings check for efficiency
          break;

        case 'storageCap':
          // Increase storage caps for all resources
          Object.keys(this.resourceSystem.resourceCaps).forEach(resource => {
            this.resourceSystem.increaseResourceCap(
              resource,
              this.resourceSystem.resourceCaps[resource] * (effect.multiplier - 1)
            );
          });
          break;

        case 'resourceConsumption':
          // Will be applied when resources are consumed
          break;

        case 'productionSpeed':
          // Will be applied to building production intervals
          break;
      }
    });
  }

  /**
   * Get the effect value for a specific effect type and target
   * @param {string} effectType - Type of effect to look for
   * @param {string} target - Target resource or building
   * @returns {number} - Combined effect value (multiplicative)
   */
  getEffectValue(effectType, target) {
    let result = 1.0; // Default multiplier (no effect)

    // Check all completed research for matching effects
    this.completedResearch.forEach(techId => {
      const tech = this.technologies[techId];
      if (!tech || !tech.effects || !tech.effects[effectType]) return;

      const effect = tech.effects[effectType];

      // Check if this effect applies to our target
      if (
        (effect.resource && effect.resource === target) ||
        (effect.building && effect.building === target) ||
        (!effect.resource && !effect.building) // Global effect
      ) {
        // Multiply the result by the effect value
        result *= effect.value || effect.multiplier || 1.0;
      }
    });

    return result;
  }

  /**
   * Get all available (researchable) technologies
   * @returns {Array} - Array of available technology IDs
   */
  getAvailableTechnologies() {
    return Object.keys(this.technologies).filter(techId => {
      const tech = this.technologies[techId];

      // Skip if already researched
      if (this.completedResearch.has(techId)) return false;

      // Check if all requirements are met
      return tech.requirements.every(req => this.completedResearch.has(req));
    });
  }

  /**
   * Get research progress information
   * @returns {Object} - Research progress info
   */
  getResearchProgress() {
    if (!this.activeResearch) {
      return { active: false };
    }

    const tech = this.technologies[this.activeResearch];
    return {
      active: true,
      id: this.activeResearch,
      name: tech.name,
      progress: this.researchProgress,
      total: tech.cost,
      percent: (this.researchProgress / tech.cost) * 100
    };
  }
}
