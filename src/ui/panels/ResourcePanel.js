import BasePanel from './BasePanel.js';
import Phaser from 'phaser';

/**
 * 资源面板
 * 显示玩家拥有的资源
 */
export default class ResourcePanel extends BasePanel {
  /**
   * 创建资源面板
   * @param {Phaser.Scene} scene - 场景对象
   * @param {Object} config - 配置对象
   * @param {Object} config.position - 面板位置
   * @param {Array} config.resources - 要显示的资源列表
   */
  constructor(scene, config = {}) {
    // 调用父类构造函数
    super(scene, config.position?.x || 20, config.position?.y || 20, {
      width: config.resources?.length * 120 + 20 || 500, // 120 pixels per resource + padding
      height: 100,
      title: '资源',
      onClose: () => this.hide()
    });

    // 保存配置
    this.config = config;
    this.resources = config.resources || [];

    // 创建面板内容
    this.createContent();
  }

  /**
   * 创建资源面板的静态方法
   * @param {Phaser.Scene} scene - 场景对象
   * @param {Object} config - 面板配置
   * @returns {ResourcePanel} - 创建的面板实例
   */
  static createPanel(scene, config) {
    // 如果已存在，先销毁
    if (scene.uiManager.resourcePanel) {
      scene.uiManager.resourcePanel.destroy();
    }

    // 创建新的资源面板
    const panel = new ResourcePanel(scene, config);
    panel.show();

    // 保存引用
    scene.uiManager.resourcePanel = panel;

    return panel;
  }

  /**
   * 创建面板内容
   */
  createContent() {
    // 获取资源数据
    const resourcesData = this.scene.resources.resources;

    // 创建资源图标和文本
    this.resourceTexts = {};

    this.resources.forEach((resource, index) => {
      // 计算位置
      const x = -this.width/2 + 80 + index * 120;
      const y = 0;

      // 创建资源图标背景
      const iconBg = this.scene.add.rectangle(x, y - 15, 50, 50, 0x333333)
        .setStrokeStyle(1, 0x555555);

      // 创建资源名称
      const displayName = this.getResourceDisplayName(resource);
      const nameText = this.scene.add.text(x, y - 30, displayName, {
        fontSize: '12px',
        fill: '#ffffff'
      }).setOrigin(0.5, 0.5);

      // 创建资源数量文本
      const valueText = this.scene.add.text(x, y + 10, '0', {
        fontSize: '16px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
      valueText.name = resource; // 设置名称以便更新时识别

      // 保存引用以便更新
      this.resourceTexts[resource] = valueText;

      // 添加元素到面板
      this.add([iconBg, nameText, valueText]);
    });
  }

  /**
   * 更新资源显示
   * @param {Object} resources - 资源数据
   */
  updateResources(resources) {
    this.container.each((child) => {
      if (child instanceof Phaser.GameObjects.Text && child.name && resources[child.name]) {
        const resourceType = child.name;
        // Format the number with commas for thousands
        const formattedValue = Math.floor(resources[resourceType].value).toLocaleString();
        child.setText(formattedValue);

        // Add a production rate indicator if production is non-zero
        if (resources[resourceType].production > 0) {
          const productionRate = resources[resourceType].production.toFixed(1);
          child.setText(`${formattedValue}\n+${productionRate}/s`);
        }
      }
    });
  }

  /**
   * 更新资源显示（兼容旧方法）
   */
  update() {
    // 获取最新的资源数据
    const resourcesData = this.scene.resources.resources;
    this.updateResources(resourcesData);
  }

  /**
   * 获取资源颜色
   * @param {string} resourceType - 资源类型
   * @returns {number} - 十六进制颜色值
   */
  getColorForResource(resourceType) {
    const colorMap = {
      'magic_ore': 0x9966CC,      // Purple for magic
      'enchanted_wood': 0x7CFC00, // Green for wood
      'arcane_crystal': 0x00BFFF, // Blue for crystal
      'arcane_essence': 0xAA66FF, // Bright purple for arcane essence
      'mystic_planks': 0x99FF66, // Bright green for mystic planks
      'refined_crystal': 0x66FFFF, // Bright blue for refined crystal
      'magical_potion': 0xFF66FF, // Pink for magical potion
      'enchanted_artifact': 0xFFFF66, // Yellow for enchanted artifact
      'magical_construct': 0xFF9966, // Orange for magical construct
    };

    return colorMap[resourceType] || 0xCCCCCC; // Default to gray if not found
  }

  /**
   * 获取资源显示名称
   * @param {string} resourceType - 资源类型
   * @returns {string} - 格式化的显示名称
   */
  getResourceDisplayName(resourceType) {
    const nameMap = {
      'magic_ore': 'Magic',
      'enchanted_wood': 'Wood',
      'arcane_crystal': 'Crystal',
      'mana': 'Mana',
      'arcane_essence': 'Essence',
      'mystic_planks': 'Planks',
      'refined_crystal': 'Refined',
      'magical_potion': 'Potion',
      'enchanted_artifact': 'Artifact',
      'magical_construct': 'Construct',
    };

    return nameMap[resourceType] || resourceType.replace('_', ' ');
  }
}
