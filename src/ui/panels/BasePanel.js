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
   */
  add(elements) {
    this.container.add(elements);
    return this;
  }
  
  /**
   * 移除元素
   * @param {Array|Phaser.GameObjects.GameObject} elements - 要移除的元素
   * @param {boolean} destroyChild - 是否销毁子元素
   */
  remove(elements, destroyChild = false) {
    this.container.remove(elements, destroyChild);
    return this;
  }
}
