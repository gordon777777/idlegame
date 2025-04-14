/**
 * 下拉列表组件
 * 用于在游戏中创建可交互的下拉列表
 */
export default class DropdownList {
  /**
   * 创建一个下拉列表
   * @param {Phaser.Scene} scene - 场景对象
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {Array} options - 选项数组，每个选项应该是 {id: string, text: string, description: string} 格式
   * @param {Object} config - 配置对象
   * @param {number} config.width - 下拉列表宽度
   * @param {number} config.height - 下拉列表高度
   * @param {number} config.backgroundColor - 背景颜色
   * @param {number} config.hoverColor - 悬停颜色
   * @param {string} config.textColor - 文本颜色
   * @param {string} config.fontSize - 字体大小
   * @param {Function} config.onChange - 选项变更时的回调函数
   * @param {string} config.selectedId - 初始选中的选项ID
   */
  constructor(scene, x, y, options, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.options = options;
    this.width = config.width || 200;
    this.height = config.height || 30;
    this.backgroundColor = config.backgroundColor || 0x333333;
    this.hoverColor = config.hoverColor || 0x555555;
    this.textColor = config.textColor || '#ffffff';
    this.fontSize = config.fontSize || '14px';
    this.onChange = config.onChange || (() => {});
    this.selectedId = config.selectedId || (options.length > 0 ? options[0].id : null);
    this.isOpen = false;
    this.elements = [];
    this.optionElements = [];
    this.optionsContainer = null;
    this.closeOverlay = null;

    this.create();
  }

  /**
   * 创建下拉列表UI元素
   */
  create() {
    // 创建主容器
    this.container = this.scene.add.container(this.x, this.y);

    // 创建下拉列表背景
    this.background = this.scene.add.rectangle(0, 0, this.width, this.height, this.backgroundColor)
      .setStrokeStyle(1, 0x666666)
      .setOrigin(0.5, 0.5);

    // 创建当前选中项文本
    const selectedOption = this.options.find(opt => opt.id === this.selectedId) || this.options[0];
    this.selectedText = this.scene.add.text(0, 0, selectedOption ? selectedOption.text : '选择...', {
      fontSize: this.fontSize,
      fill: this.textColor
    }).setOrigin(0.5, 0.5);

    // 创建下拉箭头
    this.arrow = this.scene.add.text(this.width / 2 - 15, 0, '▼', {
      fontSize: this.fontSize,
      fill: this.textColor
    }).setOrigin(0.5, 0.5);

    // 添加交互
    this.background.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.background.fillColor = this.hoverColor;
      })
      .on('pointerout', () => {
        this.background.fillColor = this.backgroundColor;
      })
      .on('pointerdown', () => {
        this.toggleDropdown();
      });

    // 添加元素到容器
    this.container.add([this.background, this.selectedText, this.arrow]);
    this.elements = [this.container];

    // 创建描述文本区域（初始隐藏）
    if (selectedOption && selectedOption.description) {
      this.descriptionText = this.scene.add.text(0, this.height + 5, selectedOption.description, {
        fontSize: parseInt(this.fontSize) - 2 + 'px',
        fill: '#cccccc',
        align: 'center',
        wordWrap: { width: this.width }
      }).setOrigin(0.5, 0);

      this.container.add(this.descriptionText);
    }
  }

  /**
   * 切换下拉列表的展开/收起状态
   */
  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * 打开下拉列表
   */
  openDropdown() {
    // 已经打开则不执行
    if (this.isOpen) return;

    this.isOpen = true;
    this.arrow.setText('▲');

    // 创建选项列表
    this.optionElements = [];

    // 创建选项容器 - 定位在下拉框正下方
    // 使用绝对定位确保选项列表位置正确
    const absoluteX = this.container.x;
    const absoluteY = this.container.y + this.height;
    this.optionsContainer = this.scene.add.container(absoluteX, absoluteY);
    // 将选项容器添加到元素数组中
    this.elements.push(this.optionsContainer);

    // 添加每个选项
    this.options.forEach((option, index) => {
      // 计算选项位置 - 直接使用索引计算
      const yPos = (index + 0.5) * this.height;

      // 选项背景
      const optBg = this.scene.add.rectangle(
        0,
        yPos,
        this.width,
        this.height,
        option.id === this.selectedId ? this.hoverColor : this.backgroundColor
      )
        .setStrokeStyle(1, 0x666666)
        .setOrigin(0.5, 0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          optBg.fillColor = this.hoverColor;
        })
        .on('pointerout', () => {
          optBg.fillColor = option.id === this.selectedId ? this.hoverColor : this.backgroundColor;
        })
        .on('pointerdown', () => {
          this.selectOption(option.id);
        });

      // 选项文本
      const optText = this.scene.add.text(0, yPos, option.text, {
        fontSize: this.fontSize,
        fill: this.textColor
      }).setOrigin(0.5, 0.5);

      this.optionsContainer.add([optBg, optText]);
    });

    // 将选项元素添加到数组中
    this.optionElements.push(this.optionsContainer);

    // 添加点击外部关闭下拉列表的处理
    this.closeOverlay = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x000000,
      0
    ).setInteractive()
      .on('pointerdown', () => {
        this.closeDropdown();
      });

    // 确保下拉列表在覆盖层上方
    this.closeOverlay.depth = -1;
    this.elements.push(this.closeOverlay);

    // 将选项容器置于最上层
    this.scene.children.bringToTop(this.optionsContainer);
  }

  /**
   * 关闭下拉列表
   */
  closeDropdown() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.arrow.setText('▼');

    // 移除选项元素
    this.optionElements.forEach(element => {
      element.destroy();
    });
    this.optionElements = [];

    // 移除选项容器
    if (this.optionsContainer) {
      this.optionsContainer.destroy();
      this.optionsContainer = null;
    }

    // 移除覆盖层
    if (this.closeOverlay) {
      this.closeOverlay.destroy();
      this.closeOverlay = null;
    }
  }

  /**
   * 选择一个选项
   * @param {string} optionId - 选项ID
   */
  selectOption(optionId) {
    if (this.selectedId === optionId) {
      this.closeDropdown();
      return;
    }

    this.selectedId = optionId;
    const selectedOption = this.options.find(opt => opt.id === optionId);

    if (selectedOption) {
      this.selectedText.setText(selectedOption.text);

      // 更新描述文本
      if (this.descriptionText) {
        this.descriptionText.setText(selectedOption.description || '');
      }

      // 调用回调函数
      this.onChange(optionId, selectedOption);
    }

    this.closeDropdown();
  }

  /**
   * 获取所有UI元素
   * @returns {Array} - UI元素数组
   */
  getElements() {
    return this.elements;
  }

  /**
   * 销毁下拉列表
   */
  destroy() {
    this.elements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });

    this.optionElements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });

    this.elements = [];
    this.optionElements = [];
  }
}
