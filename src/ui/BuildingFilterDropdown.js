/**
 * 建筑筛选下拉列表组件
 * 用于在建筑菜单中筛选不同类型的建筑
 */
export default class BuildingFilterDropdown {
  /**
   * 创建一个建筑筛选下拉列表
   * @param {Phaser.Scene} scene - 场景对象
   * @param {Phaser.GameObjects.Container} parent - 父容器
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {Function} onFilter - 筛选回调函数
   */
  constructor(scene, parent, x, y, onFilter) {
    this.scene = scene;
    this.parent = parent;
    this.x = x;
    this.y = y;
    this.onFilter = onFilter;
    this.isOpen = false;
    this.elements = [];
    this.optionElements = [];
    this.selectedType = 'all';
    
    // 筛选选项
    this.filterOptions = [
      { id: 'all', text: '所有建筑', color: 0x4a6a4a },
      { id: 'collector', text: '资源建筑', color: 0x4a4a6a },
      { id: 'production', text: '生产建筑', color: 0x6a4a4a },
      { id: 'housing', text: '住房建筑', color: 0x4a6a6a },
      { id: 'advanced', text: '高级建筑', color: 0x6a6a4a },
      { id: 'special', text: '特殊建筑', color: 0x4a4a4a },
      { id: 'utility', text: '功能建筑', color: 0x6a4a6a }
    ];
    
    this.create();
  }
  
  /**
   * 创建下拉列表UI元素
   */
  create() {
    // 创建标签
    this.label = this.scene.add.text(this.x, this.y - 20, '建筑类型:', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);
    
    // 创建主容器
    this.container = this.scene.add.container(this.x, this.y);
    
    // 创建下拉列表背景
    this.background = this.scene.add.rectangle(0, 0, 160, 30, 0x333333)
      .setStrokeStyle(1, 0x666666)
      .setOrigin(0, 0);
    
    // 创建当前选中项文本
    const selectedOption = this.filterOptions.find(opt => opt.id === this.selectedType);
    this.selectedText = this.scene.add.text(10, 8, selectedOption ? selectedOption.text : '所有建筑', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0, 0);
    
    // 创建下拉箭头
    this.arrow = this.scene.add.text(140, 8, '▼', {
      fontSize: '14px',
      fill: '#ffffff'
    }).setOrigin(0, 0);
    
    // 添加交互
    this.background.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.background.fillColor = 0x444444;
      })
      .on('pointerout', () => {
        this.background.fillColor = 0x333333;
      })
      .on('pointerdown', () => {
        this.toggleDropdown();
      });
    
    // 添加元素到容器
    this.container.add([this.background, this.selectedText, this.arrow]);
    
    // 添加所有元素到数组
    this.elements = [this.label, this.container];
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
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.arrow.setText('▲');
    
    // 创建选项列表容器
    this.optionsContainer = this.scene.add.container(this.x, this.y + 30);
    this.parent.add(this.optionsContainer);
    
    // 添加每个选项
    this.filterOptions.forEach((option, index) => {
      // 选项背景
      const optBg = this.scene.add.rectangle(
        0,
        index * 30,
        160,
        30,
        option.id === this.selectedType ? option.color : 0x333333
      )
        .setStrokeStyle(1, 0x666666)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          optBg.fillColor = 0x444444;
        })
        .on('pointerout', () => {
          optBg.fillColor = option.id === this.selectedType ? option.color : 0x333333;
        })
        .on('pointerdown', () => {
          this.selectOption(option.id);
        });
      
      // 选项文本
      const optText = this.scene.add.text(10, index * 30 + 8, option.text, {
        fontSize: '14px',
        fill: '#ffffff'
      }).setOrigin(0, 0);
      
      // 将选项元素添加到容器
      this.optionsContainer.add([optBg, optText]);
      
      // 将选项元素添加到数组
      this.optionElements.push(optBg, optText);
    });
    
    // 添加点击外部关闭下拉列表的处理
    this.closeOverlay = this.scene.add.rectangle(
      0,
      0,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x000000,
      0
    ).setOrigin(0, 0).setInteractive()
      .on('pointerdown', () => {
        this.closeDropdown();
      });
    
    // 确保下拉列表在覆盖层上方
    this.closeOverlay.depth = -1;
    this.optionsContainer.depth = 100;
    
    // 添加到元素数组
    this.elements.push(this.closeOverlay, this.optionsContainer);
  }
  
  /**
   * 关闭下拉列表
   */
  closeDropdown() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.arrow.setText('▼');
    
    // 移除选项容器
    if (this.optionsContainer) {
      this.optionsContainer.destroy();
      this.optionsContainer = null;
    }
    
    // 清空选项元素数组
    this.optionElements = [];
    
    // 移除覆盖层
    if (this.closeOverlay) {
      this.closeOverlay.destroy();
      this.closeOverlay = null;
    }
    
    // 更新元素数组
    this.elements = this.elements.filter(element => 
      element === this.label || element === this.container
    );
  }
  
  /**
   * 选择一个选项
   * @param {string} optionId - 选项ID
   */
  selectOption(optionId) {
    if (this.selectedType === optionId) {
      this.closeDropdown();
      return;
    }
    
    this.selectedType = optionId;
    const selectedOption = this.filterOptions.find(opt => opt.id === optionId);
    
    if (selectedOption) {
      this.selectedText.setText(selectedOption.text);
      this.background.fillColor = selectedOption.color;
      
      // 调用筛选回调
      if (this.onFilter) {
        this.onFilter(optionId);
      }
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
