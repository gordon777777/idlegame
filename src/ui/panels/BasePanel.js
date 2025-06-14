/**
 * 基础面板类
 * 提供所有面板共有的功能，如拖拽、关闭等
 */
export default class BasePanel {
  /**
   * 创建一个基础面板
   * @param {Phaser.Scene} scene - 场景对象
   * @param {number} x - 面板x坐标
   * @param {number} y - 面板y坐标
   * @param {Object} config - 配置对象
   * @param {number} config.width - 面板宽度
   * @param {number} config.height - 面板高度
   * @param {string} config.title - 面板标题
   * @param {Function} config.onClose - 关闭回调函数
   */
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = config.width || 400;
    this.height = config.height || 300;
    this.title = config.title || '面板';
    this.onClose = config.onClose || (() => this.hide());

    // 自动排列配置
    this.autoLayout = config.autoLayout !== false; // 默认启用自动排列
    this.layoutConfig = {
      direction: config.layoutDirection || 'vertical', // 'vertical' 或 'horizontal'
      alignment: config.layoutAlignment || 'left', // 'left', 'center', 'right'
      spacing: config.layoutSpacing || 10, // 元素间距
      padding: config.layoutPadding || { top: 60, left: 20, right: 20, bottom: 20 }, // 内边距
      startY: config.layoutStartY || null // 自定义起始Y位置
    };

    // 存储需要自动排列的元素
    this.autoLayoutElements = [];

    // 拖拽相关变量
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragPointerStartX = 0;
    this.dragPointerStartY = 0;

    // 创建面板容器
    this.container = this.scene.add.container(this.x, this.y);
    this.container.visible = false;

    // 创建基础UI元素
    this.createBaseUI();
  }

  /**
   * 创建基础UI元素
   * @private
   */
  createBaseUI() {
    // 创建背景
    this.background = this.scene.add.rectangle(0, 0, this.width, this.height, 0x1a1a1a, 0.9)
      .setStrokeStyle(1, 0x4a4a4a);

    // 创建标题栏背景 - 用作拖拉区域
    this.titleBar = this.scene.add.rectangle(0, -this.height/2 + 20, this.width, 40, 0x333333)
      .setStrokeStyle(1, 0x555555);

    // 设置标题栏为可互动元素，使其可拖拉
    this.titleBar.setInteractive()
      .on('pointerdown', (pointer) => {
        // 记录拖拉开始时的面板位置和滑鼠偏移量
        this.isDragging = true;
        this.dragStartX = this.container.x;
        this.dragStartY = this.container.y;
        this.dragPointerStartX = pointer.x;
        this.dragPointerStartY = pointer.y;

        // 设置滑鼠移动事件
        this.scene.input.on('pointermove', this.handleDrag, this);
      });

    // 添加滑鼠释放事件
    this.scene.input.on('pointerup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.scene.input.off('pointermove', this.handleDrag, this);
      }
    });

    // 添加标题
    this.titleText = this.scene.add.text(0, -this.height/2 + 20, this.title, {
      fontSize: '22px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    // 添加关闭按钮
    this.closeButton = this.scene.add.rectangle(this.width/2 - 20, -this.height/2 + 20, 30, 30, 0x4a4a4a)
      .setInteractive()
      .on('pointerdown', () => this.onClose());

    this.closeButtonText = this.scene.add.text(this.width/2 - 20, -this.height/2 + 20, 'X', {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 添加基础元素到容器
    this.container.add([this.background, this.titleBar, this.titleText, this.closeButton, this.closeButtonText]);
  }

  /**
   * 处理面板拖拽
   * @param {Phaser.Input.Pointer} pointer - 滑鼠指针
   */
  handleDrag(pointer) {
    if (this.isDragging) {
      // 计算滑鼠移动的距离
      const dx = pointer.x - this.dragPointerStartX;
      const dy = pointer.y - this.dragPointerStartY;

      // 更新面板位置，保持滑鼠和面板的相对位置
      this.container.x = this.dragStartX + dx;
      this.container.y = this.dragStartY + dy;
    }
  }

  /**
   * 显示面板
   */
  show() {
    this.container.visible = true;
    return this;
  }

  /**
   * 隐藏面板
   */
  hide() {
    this.container.visible = false;
    // 清理事件监听器
    if (this.isDragging) {
      this.isDragging = false;
      this.scene.input.off('pointermove', this.handleDrag, this);
    }
    return this;
  }

  /**
   * 切换面板显示/隐藏
   */
  toggle() {
    if (this.container.visible) {
      this.hide();
    } else {
      this.show();
    }
    return this;
  }

  /**
   * 销毁面板
   */
  destroy() {
    // 清理事件监听器
    if (this.isDragging) {
      this.isDragging = false;
      this.scene.input.off('pointermove', this.handleDrag, this);
    }

    // 销毁容器及其所有子元素
    this.container.destroy();
  }

  /**
   * 设置面板位置
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  setPosition(x, y) {
    this.container.x = x;
    this.container.y = y;
    return this;
  }

  /**
   * 设置面板标题
   * @param {string} title - 标题文本
   */
  setTitle(title) {
    this.title = title;
    this.titleText.setText(title);
    return this;
  }

  /**
   * 添加元素到面板
   * @param {Array|Phaser.GameObjects.GameObject} elements - 要添加的元素
   * @param {boolean} autoLayout - 是否参与自动排列，默认为true
   */
  add(elements, autoLayout = true) {
    this.container.add(elements);

    // 如果启用自动排列，将元素添加到自动排列列表
    if (this.autoLayout && autoLayout) {
      if (Array.isArray(elements)) {
        this.autoLayoutElements.push(...elements);
      } else {
        this.autoLayoutElements.push(elements);
      }

      // 执行自动排列
      this.performAutoLayout();
    }

    return this;
  }

  /**
   * 移除元素
   * @param {Array|Phaser.GameObjects.GameObject} elements - 要移除的元素
   * @param {boolean} destroyChild - 是否销毁子元素
   */
  remove(elements, destroyChild = false) {
    this.container.remove(elements, destroyChild);

    // 从自动排列列表中移除元素
    if (Array.isArray(elements)) {
      elements.forEach(element => {
        const index = this.autoLayoutElements.indexOf(element);
        if (index > -1) {
          this.autoLayoutElements.splice(index, 1);
        }
      });
    } else {
      const index = this.autoLayoutElements.indexOf(elements);
      if (index > -1) {
        this.autoLayoutElements.splice(index, 1);
      }
    }

    // 重新执行自动排列
    if (this.autoLayout) {
      this.performAutoLayout();
    }

    return this;
  }

  /**
   * 执行自动排列
   */
  performAutoLayout() {
    if (!this.autoLayout || this.autoLayoutElements.length === 0) {
      return;
    }

    const config = this.layoutConfig;
    const padding = config.padding;

    // 计算起始位置
    let startX, startY;

    if (config.direction === 'vertical') {
      // 垂直排列
      startY = config.startY !== null ? config.startY : (-this.height/2 + padding.top);

      switch (config.alignment) {
        case 'center':
          startX = 0;
          break;
        case 'right':
          startX = this.width/2 - padding.right;
          break;
        case 'left':
        default:
          startX = -this.width/2 + padding.left;
          break;
      }

      // 计算总高度和间距
      const availableHeight = this.height - padding.top - padding.bottom;
      const totalSpacing = (this.autoLayoutElements.length - 1) * config.spacing;

      // 排列元素
      let currentY = startY;
      this.autoLayoutElements.forEach((element, index) => {
        const elementHeight = this.getElementHeight(element);

        if (element && element.setPosition) {
          element.setPosition(startX, currentY);
        } else if (element && element.x !== undefined && element.y !== undefined) {
          element.x = startX;
          element.y = currentY;
        }

        // 移动到下一个位置
        currentY += elementHeight + config.spacing;

        // 调试信息（可选）
        if (window.DEBUG_LAYOUT) {
          console.log(`Element ${index}: height=${elementHeight}, y=${currentY - elementHeight - config.spacing}`);
        }
      });

    } else if (config.direction === 'horizontal') {
      // 水平排列
      startX = -this.width/2 + padding.left;
      startY = config.startY !== null ? config.startY : (-this.height/2 + padding.top);

      // 排列元素
      let currentX = startX;
      this.autoLayoutElements.forEach((element, index) => {
        if (element && element.setPosition) {
          element.setPosition(currentX, startY);
          currentX += this.getElementWidth(element) + config.spacing;
        } else if (element && element.x !== undefined && element.y !== undefined) {
          element.x = currentX;
          element.y = startY;
          currentX += this.getElementWidth(element) + config.spacing;
        }
      });
    }
  }

  /**
   * 获取元素高度
   * @param {Phaser.GameObjects.GameObject} element - 游戏对象
   * @returns {number} - 元素高度
   */
  getElementHeight(element) {
    if (element.height !== undefined) {
      return element.height;
    } else if (element.displayHeight !== undefined) {
      return element.displayHeight;
    } else if (element.getBounds) {
      return element.getBounds().height;
    } else if (element.style && element.style.fontSize) {
      // 对于文本对象，根据字体大小估算高度
      const fontSize = parseInt(element.style.fontSize) || 16;
      const lines = element.text ? element.text.split('\n').length : 1;
      return fontSize * lines * 1.4; // 增加行高系数到1.4，给多行文本更多空间
    }
    return 30; // 默认高度
  }

  /**
   * 获取元素宽度
   * @param {Phaser.GameObjects.GameObject} element - 游戏对象
   * @returns {number} - 元素宽度
   */
  getElementWidth(element) {
    if (element.width !== undefined) {
      return element.width;
    } else if (element.displayWidth !== undefined) {
      return element.displayWidth;
    } else if (element.getBounds) {
      return element.getBounds().width;
    }
    return 100; // 默认宽度
  }

  /**
   * 设置自动排列配置
   * @param {Object} config - 排列配置
   */
  setLayoutConfig(config) {
    Object.assign(this.layoutConfig, config);
    if (this.autoLayout) {
      this.performAutoLayout();
    }
    return this;
  }

  /**
   * 启用/禁用自动排列
   * @param {boolean} enabled - 是否启用
   */
  setAutoLayout(enabled) {
    this.autoLayout = enabled;
    if (enabled) {
      this.performAutoLayout();
    }
    return this;
  }

  /**
   * 手动触发重新排列
   */
  relayout() {
    if (this.autoLayout) {
      this.performAutoLayout();
    }
    return this;
  }

  /**
   * 清空自动排列元素列表
   */
  clearAutoLayoutElements() {
    this.autoLayoutElements = [];
    return this;
  }
}
