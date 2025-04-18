/**
 * DataManager class for handling JSON data loading and saving
 * Used to manage building, research, and resource settings
 */
export default class DataManager {
  /**
   * @param {Phaser.Scene} scene - The scene this manager belongs to
   */
  constructor(scene) {
    this.scene = scene;
    this.cache = scene.cache;
    this.load = scene.load;
    this.isDataLoaded = false;
    this.buildingTypes = null;
    this.technologies = null;
    this.resourceSettings = null;
  }

  /**
   * Preload all JSON data files
   */
  preloadData() {
    this.load.json('buildings', 'assets/data/buildings.json');
    this.load.json('research', 'assets/data/research.json');
    this.load.json('resources', 'assets/data/resources.json');
  }

  /**
   * Load all data from cache
   * @returns {boolean} - Whether data was loaded successfully
   */
  loadData() {
    if (!this.cache.json.exists('buildings') || 
        !this.cache.json.exists('research') || 
        !this.cache.json.exists('resources')) {
      console.error('JSON data not found in cache. Make sure to preload data first.');
      return false;
    }

    this.buildingTypes = this.cache.json.get('buildings');
    this.technologies = this.cache.json.get('research');
    this.resourceSettings = this.cache.json.get('resources');
    this.isDataLoaded = true;
    
    return true;
  }

  /**
   * Get building types data
   * @returns {Object} - Building types data
   */
  getBuildingTypes() {
    return this.buildingTypes;
  }

  /**
   * Get research technologies data
   * @returns {Object} - Research technologies data
   */
  getTechnologies() {
    return this.technologies;
  }

  /**
   * Get resource settings data
   * @returns {Object} - Resource settings data
   */
  getResourceSettings() {
    return this.resourceSettings;
  }

  /**
   * Save building types to JSON file
   * @param {Object} buildingTypes - Building types data to save
   */
  saveBuildingTypes(buildingTypes) {
    if (this.scene.sys.game.device.os.desktop) {
      // Only works on desktop browsers
      this.scene.load.saveJSON(buildingTypes, 'buildings.json');
    } else {
      console.warn('Saving JSON files is only supported on desktop browsers');
    }
  }

  /**
   * Save research technologies to JSON file
   * @param {Object} technologies - Research technologies data to save
   */
  saveTechnologies(technologies) {
    if (this.scene.sys.game.device.os.desktop) {
      // Only works on desktop browsers
      this.scene.load.saveJSON(technologies, 'research.json');
    } else {
      console.warn('Saving JSON files is only supported on desktop browsers');
    }
  }

  /**
   * Save resource settings to JSON file
   * @param {Object} resourceSettings - Resource settings data to save
   */
  saveResourceSettings(resourceSettings) {
    if (this.scene.sys.game.device.os.desktop) {
      // Only works on desktop browsers
      this.scene.load.saveJSON(resourceSettings, 'resources.json');
    } else {
      console.warn('Saving JSON files is only supported on desktop browsers');
    }
  }

  /**
   * Export current game data to JSON files
   * @param {BuildingSystem} buildingSystem - Building system instance
   * @param {ResearchSystem} researchSystem - Research system instance
   * @param {ResourceSystem} resourceSystem - Resource system instance
   */
  exportGameData(buildingSystem, researchSystem, resourceSystem) {
    this.saveBuildingTypes(buildingSystem.buildingTypes);
    this.saveTechnologies(researchSystem.technologies);
    
    const resourceSettings = {
      resources: resourceSystem.resources,
      resourceCaps: resourceSystem.resourceCaps
    };
    this.saveResourceSettings(resourceSettings);
  }
}
