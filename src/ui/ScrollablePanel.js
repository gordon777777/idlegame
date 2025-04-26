/**
 * 可滚动面板类
 * 基于Phaser 3的原生功能实现滚动
 */
export default class ScrollablePanel {
  /**
   * 创建一个可滚动面板
   * @param {Phaser.Scene} scene - 场景对象
   * @param {number} x - 面板x坐标
   * @param {number} y - 面板y坐标
   * @param {number} width - 面板宽度
   * @param {number} height - 面板高度
   * @param {Object} config - 配置选项
   */
  constructor(scene, x, y, width, height, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    // 内容区域的边界
    this.bounds = config.bounds || {
      x: 0,
      y: 0,
      width: width * 2, // 默认内容区域宽度为面板宽度的2倍
      height: height * 10 // 默认内容区域高度为面板高度的10倍
    };

    // 滚动条颜色
    this.scrollBarColor = config.scrollBarColor || 0x666666;
    this.scrollBarAlpha = config.scrollBarAlpha || 0.8;

    // 创建面板
    this.create();
  }

  /**
   * 创建面板元素
   */
  create() {
    // 创建容器来保存滚动条和其他装饰
    this.container = this.scene.add.container(this.x, this.y);

    // 创建摄像机作为视口，它将显示内容
    this.camera = this.scene.cameras.add(this.x, this.y, this.width, this.height)
      .setBounds(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height)
      .setName('scrollablePanelCamera');

    // 确保摄像机不渲染容器
    this.camera.ignore(this.container);

    // 创建内容容器
    this.content = this.scene.add.container(0, 0);

    // 确保内容容器被添加到场景中
    this.scene.add.existing(this.content);

    // 创建水平滚动条
    const scrollBarXWidth = Math.max(16, Phaser.Math.Clamp(
      (this.width * this.width) / this.bounds.width,
      16,
      this.width
    ));

    this.scrollBarX = this.scene.add.rectangle(
      0,
      this.height,
      scrollBarXWidth,
      16,
      this.scrollBarColor,
      this.scrollBarAlpha
    )
      .setOrigin(0, 0)
      .setName('scrollBarX')
      .setInteractive({ draggable: true })
      .on('drag', this.onDragScrollX, this);

    // 创建垂直滚动条
    const scrollBarYHeight = Math.max(16, Phaser.Math.Clamp(
      (this.height * this.height) / this.bounds.height,
      16,
      this.height
    ));

    this.scrollBarY = this.scene.add.rectangle(
      this.width,
      0,
      16,
      scrollBarYHeight,
      this.scrollBarColor,
      this.scrollBarAlpha
    )
      .setOrigin(0, 0)
      .setName('scrollBarY')
      .setInteractive({ draggable: true })
      .on('drag', this.onDragScrollY, this);

    // 添加滚动条到容器
    this.container.add([this.scrollBarX, this.scrollBarY]);

    // 添加鼠标滚轮事件
    this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      if (this.isPointerOver(pointer)) {
        // 更新垂直滚动位置
        const newScrollY = this.camera.scrollY + deltaY * 0.5;
        this.setScrollY(newScrollY);
      }
    });

    // 设置面板可交互，允许拖动
    this.container.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, this.width, this.height),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      draggable: true,
      useHandCursor: false
    });

    // 添加背景以便于交互
    this.background = this.scene.add.rectangle(
      0,
      0,
      this.width,
      this.height,
      0x000000,
      0.01
    ).setOrigin(0, 0);

    this.container.add(this.background);

    // 将背景放在最底层
    this.background.setDepth(-1);

    // 更新滚动条位置
    this.updateScrollBarPositions();
  }

  /**
   * 处理水平滚动条拖动
   * @param {Phaser.Input.Pointer} pointer - 指针对象
   * @param {number} dragX - 拖动的X坐标
   * @param {number} dragY - 拖动的Y坐标
   */
  onDragScrollX(pointer, dragX, dragY) {
    dragX = Phaser.Math.Clamp(dragX, 0, this.width - this.scrollBarX.width);
    this.scrollBarX.x = dragX;

    const scrollX = (dragX * (this.bounds.width - this.width)) / (this.width - this.scrollBarX.width);
    this.camera.scrollX = scrollX;
  }

  /**
   * 处理垂直滚动条拖动
   * @param {Phaser.Input.Pointer} pointer - 指针对象
   * @param {number} dragX - 拖动的X坐标
   * @param {number} dragY - 拖动的Y坐标
   */
  onDragScrollY(pointer, dragX, dragY) {
    dragY = Phaser.Math.Clamp(dragY, 0, this.height - this.scrollBarY.height);
    this.scrollBarY.y = dragY;

    const scrollY = (dragY * (this.bounds.height - this.height)) / (this.height - this.scrollBarY.height);
    this.camera.scrollY = scrollY;
  }

  /**
   * 更新滚动条位置
   */
  updateScrollBarPositions() {
    // 更新水平滚动条位置
    const scrollXRatio = this.camera.scrollX / (this.bounds.width - this.width);
    const scrollBarXPosition = scrollXRatio * (this.width - this.scrollBarX.width);
    this.scrollBarX.x = scrollBarXPosition;

    // 更新垂直滚动条位置
    const scrollYRatio = this.camera.scrollY / (this.bounds.height - this.height);
    const scrollBarYPosition = scrollYRatio * (this.height - this.scrollBarY.height);
    this.scrollBarY.y = scrollBarYPosition;
  }

  /**
   * 设置垂直滚动位置
   * @param {number} scrollY - 垂直滚动位置
   */
  setScrollY(scrollY) {
    // 限制滚动范围
    scrollY = Phaser.Math.Clamp(scrollY, 0, this.bounds.height - this.height);
    this.camera.scrollY = scrollY;

    // 更新滚动条位置
    this.updateScrollBarPositions();
  }

  /**
   * 设置水平滚动位置
   * @param {number} scrollX - 水平滚动位置
   */
  setScrollX(scrollX) {
    // 限制滚动范围
    scrollX = Phaser.Math.Clamp(scrollX, 0, this.bounds.width - this.width);
    this.camera.scrollX = scrollX;

    // 更新滚动条位置
    this.updateScrollBarPositions();
  }

  /**
   * 添加内容到面板
   * @param {Phaser.GameObjects.GameObject|Phaser.GameObjects.GameObject[]} gameObjects - 要添加的游戏对象
   */
  add(gameObjects) {
    console.log('ScrollablePanel: Adding content', gameObjects);

    try {
      if (Array.isArray(gameObjects)) {
        gameObjects.forEach(obj => {
          if (obj) {
            this.content.add(obj);
            console.log('ScrollablePanel: Added array item to content');
          }
        });
      } else if (gameObjects) {
        this.content.add(gameObjects);
        console.log('ScrollablePanel: Added single item to content');
      }

      // 更新内容边界
      this.updateContentBounds();

      console.log('ScrollablePanel: Content now has', this.content.length, 'children');
    } catch (error) {
      console.error('ScrollablePanel: Error adding content', error);
    }

    return this;
  }

  /**
   * 更新内容边界
   */
  updateContentBounds() {
    // 计算内容的实际高度
    let maxHeight = 0;

    this.content.each(child => {
      const childBottom = child.y + (child.height || 0);
      maxHeight = Math.max(maxHeight, childBottom);
    });

    // 更新边界
    this.bounds.height = Math.max(this.height, maxHeight + 100); // 添加一些额外空间

    // 更新摄像机边界
    this.camera.setBounds(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);

    // 更新滚动条大小
    const scrollBarYHeight = Math.max(16, Phaser.Math.Clamp(
      (this.height * this.height) / this.bounds.height,
      16,
      this.height
    ));

    this.scrollBarY.height = scrollBarYHeight;

    // 更新滚动条位置
    this.updateScrollBarPositions();
  }

  /**
   * 清除所有内容
   */
  clear() {
    this.content.removeAll(true);

    // 重置边界
    this.bounds.height = this.height;
    this.camera.setBounds(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);

    // 重置滚动位置
    this.camera.scrollX = 0;
    this.camera.scrollY = 0;

    // 更新滚动条
    this.updateScrollBarPositions();

    return this;
  }

  /**
   * 检查指针是否在面板上方
   * @param {Phaser.Input.Pointer} pointer - 指针对象
   * @returns {boolean} - 是否在面板上方
   */
  isPointerOver(pointer) {
    const bounds = new Phaser.Geom.Rectangle(
      this.x,
      this.y,
      this.width,
      this.height
    );

    return bounds.contains(pointer.x, pointer.y);
  }

  /**
   * 设置面板位置
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;

    this.container.setPosition(x, y);
    this.camera.setPosition(x, y);

    return this;
  }

  /**
   * 设置面板大小
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;

    // 更新摄像机大小
    this.camera.setSize(width, height);

    // 更新背景大小
    this.background.setSize(width, height);

    // 更新滚动条位置
    this.scrollBarX.y = height;
    this.scrollBarY.x = width;

    // 更新内容边界
    this.updateContentBounds();

    return this;
  }

  /**
   * 设置面板可见性
   * @param {boolean} visible - 是否可见
   */
  setVisible(visible) {
    this.container.setVisible(visible);
    this.camera.setVisible(visible);

    return this;
  }

  /**
   * 销毁面板
   */
  destroy() {
    // 移除事件监听
    this.scene.input.off('wheel');

    // 销毁摄像机
    this.camera.destroy();

    // 销毁容器及其内容
    this.container.destroy();
    this.content.destroy();
  }
}
