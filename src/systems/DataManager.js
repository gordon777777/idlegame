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

    // 获取原始数据
    const rawBuildingTypes = this.cache.json.get('buildings');
    this.technologies = this.cache.json.get('research');
    const rawResourceSettings = this.cache.json.get('resources');

    // 处理资源设置数据，过滤掉以comment开头的键
    this.resourceSettings = this.processResourceSettings(rawResourceSettings);

    // 处理建筑类型数据，确保关键属性存在
    this.buildingTypes = this.processBuildingTypes(rawBuildingTypes);

    this.isDataLoaded = true;

    return true;
  }

  /**
   * Process resource settings data to filter out comment keys
   * @param {Object} rawResourceSettings - Raw resource settings data
   * @returns {Object} - Processed resource settings data
   */
  processResourceSettings(rawResourceSettings) {
    if (!rawResourceSettings || !rawResourceSettings.resources) {
      console.error('Invalid resource settings data');
      return rawResourceSettings;
    }

    // 创建一个新的资源对象，过滤掉以comment开头的键
    const filteredResources = {};
    Object.entries(rawResourceSettings.resources).forEach(([key, value]) => {
      // 如果键不是以comment开头的，则保留该资源
      if (!key.includes('comment')) {
        filteredResources[key] = value;
      }
    });

    // 返回处理后的资源设置
    return {
      resources: filteredResources,
      resourceCaps: rawResourceSettings.resourceCaps
    };
  }

  /**
   * 处理建筑类型数据，确保关键属性存在
   * @param {Object} rawBuildingTypes - 原始建筑类型数据
   * @returns {Object} - 处理后的建筑类型数据
   */
  processBuildingTypes(rawBuildingTypes) {
    const processedBuildingTypes = {};

    // 遍历所有建筑类型
    Object.entries(rawBuildingTypes).forEach(([key, buildingType]) => {
      // 确保关键属性存在
      processedBuildingTypes[key] = {
        ...buildingType,
        byproductTypes: buildingType.byproductTypes || [],
        productionMethods: buildingType.productionMethods || [],
        workModes: buildingType.workModes || []
      };

      // 如果是收集器类型的建筑，但没有副产品类型，添加默认的副产品类型
      if (buildingType.type === 'collector' && !processedBuildingTypes[key].byproductTypes) {
        processedBuildingTypes[key].byproductTypes = [
          {
            id: 'none',
            name: '无副产品',
            description: '不生产副产品，专注于主要产出。',
            resources: {}
          }
        ];
      }

      // 如果是生产类型的建筑，但没有生产方式，添加默认的生产方式
      if ((buildingType.type === 'production' || buildingType.type === 'advanced') && !processedBuildingTypes[key].productionMethods) {
        processedBuildingTypes[key].productionMethods = [
          {
            id: 'standard',
            name: '标准生产',
            description: '标准的生产方式，正常产出。',
            timeModifier: 1.0,
            enableByproducts: true,
            workerRequirement: buildingType.workerRequirement || { count: 5, type: 'worker' }
          }
        ];
      }

      // 如果没有工作模式，添加默认的工作模式
      if (!buildingType.workModes) {
        processedBuildingTypes[key].workModes = [
          {
            id: 'normal',
            name: '正常工作',
            description: '正常工作时间，标准产出。',
            timeModifier: 1.0,
            workerModifier: 1.0
          }
        ];
      }
    });

    console.log('Processed building types:', Object.keys(processedBuildingTypes).length);

    return processedBuildingTypes;
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
//import { ResourceValue } from '../utils/ResourceValue';
// 在loadResources方法中添加
  initResourceValues() {
  this.resourceValues = new Map();
  const valuesConfig = this.game.cache.json.get('resources').resourceValues;
  
  Object.entries(valuesConfig).forEach(([type, config]) => {
    this.resourceValues.set(type, new ResourceValue({
      type,
      ...config
    }));
  });
  }
}
