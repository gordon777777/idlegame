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
    // 获取布局配置
    const layout = config.layout || { rows: 1, columns: config.resources?.length || 4 };

    // 计算面板宽度和高度
    const panelWidth = layout.columns * 120 + 20; // 120 pixels per resource + padding
    const panelHeight = layout.rows * 80 + 40; // 80 pixels per row + padding

    // 调用父类构造函数
    super(scene, config.position?.x || 20, config.position?.y || 20, {
      width: panelWidth,
      height: panelHeight,
      title: '资源',
      onClose: () => this.hide()
    });

    // 保存布局配置
    this.layout = layout;

    // 如果使用了屏幕中心位置，调整面板位置使其居中
    if (config.position?.x === scene.scale.width / 2) {
      this.container.x = config.position.x;
      this.background.x = 0;
      this.titleText.x = 0;
      this.closeButton.x = this.width / 2 - 15;
    }

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
    // 创建资源图标和文本
    this.resourceTexts = {};
    this.resourceSlots = []; // 存储资源槽位信息

    this.resources.forEach((resource, index) => {
      // 计算行和列
      const row = Math.floor(index / this.layout.columns);
      const col = index % this.layout.columns;

      // 计算位置
      const x = -this.width/2 + 80 + col * 120;
      const y = -10 + row * 80; // 每行高度80像素，从-40开始（留出标题空间）

      // 创建资源图标背景
      const iconBg = this.scene.add.rectangle(x, y - 15, 50, 50, 0x333333)
        .setStrokeStyle(1, 0x555555)
        .setInteractive(); // 使图标背景可交互

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

      // 存储槽位信息
      this.resourceSlots.push({
        index,
        resource,
        iconBg,
        nameText,
        valueText,
        x,
        y
      });

      // 添加点击事件
      iconBg.on('pointerdown', () => {
        this.showResourceSelectionMenu(index, x, y);
      });

      // 添加元素到面板
      this.add([iconBg, nameText, valueText]);
    });
  }

  /**
   * 显示资源选择菜单
   * @param {number} slotIndex - 槽位索引
   * @param {number} x - 菜单x坐标
   * @param {number} y - 菜单y坐标
   */
  showResourceSelectionMenu(slotIndex, x, y) {
    // 如果已经有菜单打开，先关闭它
    if (this.resourceMenu) {
      this.resourceMenu.destroy();
      this.resourceMenu = null;
    }

    // 创建菜单容器
    this.resourceMenu = this.scene.add.container(x, y);
    this.add(this.resourceMenu);

    // 获取所有资源
    const allResources = this.scene.resources.resources;

    // 创建菜单背景
    const menuWidth = 200;
    const menuHeight = Math.min(350, Object.keys(allResources).length * 30 + 50);
    const menuBg = this.scene.add.rectangle(0, 0, menuWidth, menuHeight, 0x222222, 0.9)
      .setStrokeStyle(1, 0x444444);

    // 创建菜单标题
    const menuTitle = this.scene.add.text(0, -menuHeight/2 + 15, '选择资源', {
      fontSize: '14px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    // 创建关闭按钮
    const closeButton = this.scene.add.text(menuWidth/2 - 15, -menuHeight/2 + 15, 'X', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.resourceMenu.destroy();
        this.resourceMenu = null;
      });

    // 添加背景和标题到菜单
    this.resourceMenu.add([menuBg, menuTitle, closeButton]);

    // 创建资源列表
    const resourceList = this.scene.add.container(0, 0);
    this.resourceMenu.add(resourceList);

    // 按资源层级分组
    const resourcesByTier = {};
    Object.entries(allResources).forEach(([key, data]) => {
      const tier = data.tier || 1;
      if (!resourcesByTier[tier]) {
        resourcesByTier[tier] = [];
      }
      resourcesByTier[tier].push({
        key,
        displayName: data.displayName || this.getResourceDisplayName(key)
      });
    });

    // 创建分层标签
    let yOffset = -menuHeight/2 + 40;
    Object.keys(resourcesByTier).sort().forEach(tier => {
      // 添加层级标题
      const tierTitle = this.scene.add.text(-menuWidth/2 + 15, yOffset, `第${tier}级资源`, {
        fontSize: '12px',
        fill: '#aaaaaa'
      }).setOrigin(0, 0.5);
      resourceList.add(tierTitle);
      yOffset += 20;

      // 添加该层级的资源
      resourcesByTier[tier].forEach(resource => {
        const resourceItem = this.scene.add.text(-menuWidth/2 + 25, yOffset, resource.displayName, {
          fontSize: '12px',
          fill: '#ffffff'
        }).setOrigin(0, 0.5)
          .setInteractive()
          .on('pointerover', () => resourceItem.setFill('#ffff00'))
          .on('pointerout', () => resourceItem.setFill('#ffffff'))
          .on('pointerdown', () => {
            this.replaceResource(slotIndex, resource.key);
            this.resourceMenu.destroy();
            this.resourceMenu = null;
          });

        resourceList.add(resourceItem);
        yOffset += 20;
      });

      yOffset += 5; // 层级之间的间隔
    });

    // 调整菜单位置，确保不超出屏幕
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    const menuX = this.container.x + x;
    const menuY = this.container.y + y;

    if (menuX + menuWidth/2 > screenWidth) {
      this.resourceMenu.x -= (menuX + menuWidth/2) - screenWidth + 10;
    }
    if (menuX - menuWidth/2 < 0) {
      this.resourceMenu.x -= (menuX - menuWidth/2) - 10;
    }
    if (menuY + menuHeight/2 > screenHeight) {
      this.resourceMenu.y -= (menuY + menuHeight/2) - screenHeight + 10;
    }
    if (menuY - menuHeight/2 < 0) {
      this.resourceMenu.y -= (menuY - menuHeight/2) - 10;
    }
  }

  /**
   * 替换资源槽位中的资源
   * @param {number} slotIndex - 槽位索引
   * @param {string} newResource - 新资源类型
   */
  replaceResource(slotIndex, newResource) {
    // 获取槽位信息
    const slot = this.resourceSlots[slotIndex];
    if (!slot) return;

    // 更新资源引用
    const oldResource = slot.resource;
    this.resources[slotIndex] = newResource;
    slot.resource = newResource;

    // 更新资源文本
    const displayName = this.getResourceDisplayName(newResource);
    slot.nameText.setText(displayName);

    // 更新数值文本的名称属性
    slot.valueText.name = newResource;

    // 更新资源文本引用
    delete this.resourceTexts[oldResource];
    this.resourceTexts[newResource] = slot.valueText;

    // 立即更新资源显示
    this.update();
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

        // 获取资源变化趋势
        let trend = 'stable';
        if (this.scene.resources && this.scene.resources.getResourceTrend) {
          trend = this.scene.resources.getResourceTrend(resourceType);
        }

        // 根据趋势设置颜色
        let textColor = '#ffffff'; // 默认白色
        if (trend === 'increase') {
          textColor = '#66ff66'; // 增加显示绿色
        } else if (trend === 'decrease') {
          textColor = '#ff6666'; // 减少显示红色
        } else {
          textColor = '#cccccc'; // 不变显示灰色
        }

        // 设置文本颜色
        child.setFill(textColor);

        // 设置文本内容
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
