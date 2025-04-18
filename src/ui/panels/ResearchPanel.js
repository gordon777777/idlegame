import BasePanel from './BasePanel.js';
import Button from '../Button.js';

/**
 * 研究面板
 * 显示和管理研究技术
 */
export default class ResearchPanel extends BasePanel {
  /**
   * 创建研究面板
   * @param {Phaser.Scene} scene - 场景对象
   * @param {Object} config - 配置对象
   */
  constructor(scene, config = {}) {
    // 调用父类构造函数
    super(scene, config.x || 400, config.y || 300, {
      width: 600,
      height: 500,
      title: '研究技术',
      onClose: () => this.hide()
    });

    // 保存配置
    this.config = config;

    // 拖拉相关变量
    this.isResearchDragging = false;
    this.researchDragStartX = 0;
    this.researchDragStartY = 0;
    this.researchDragPointerStartX = 0;
    this.researchDragPointerStartY = 0;

    // 创建面板内容
    this.createContent();
  }

  /**
   * 切换研究面板显示/隐藏
   * @param {Phaser.Scene} scene - 场景对象
   * @returns {ResearchPanel|null} - 面板实例或null
   */
  static togglePanel(scene) {
    // 如果面板已存在且可见，则隐藏
    if (scene.uiManager.researchPanel && scene.uiManager.researchPanel.container.visible) {
      scene.uiManager.researchPanel.hide();
      return null;
    } else {
      // 否则创建新面板
      // 如果已存在，先销毁
      if (scene.uiManager.researchPanel) {
        scene.uiManager.researchPanel.destroy();
      }

      // 创建新面板
      const panel = new ResearchPanel(scene);

      // 显示面板
      panel.show();

      // 保存引用
      scene.uiManager.researchPanel = panel;

      return panel;
    }
  }

  /**
   * 创建面板内容
   */
  createContent() {
    // 获取研究系统
    const researchSystem = this.scene.researchSystem;
    if (!researchSystem) {
      console.error('研究系统未初始化');
      return;
    }

    // 获取可用的研究项目
    const availableTechnologies = researchSystem.getAvailableTechnologies();
    const completedResearch = researchSystem.completedResearch;
    const researchProgress = researchSystem.getResearchProgress();

    // 添加研究进度文本
    let progressText;
    if (researchProgress) {
      const { technology, progress } = researchProgress;
      progressText = this.scene.add.text(0, -200, `正在研究: ${technology.name} (${Math.floor(progress * 100)}%)`, {
        fontSize: '16px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0);
    } else {
      progressText = this.scene.add.text(0, -200, '没有正在进行的研究', {
        fontSize: '16px',
        fill: '#cccccc'
      }).setOrigin(0.5, 0);
    }

    // 添加可用研究标题
    const availableTitle = this.scene.add.text(-250, -160, '可用研究:', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0);

    // 添加已完成研究标题
    const completedTitle = this.scene.add.text(50, -160, '已完成研究:', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0);

    // 创建可用研究按钮
    const researchButtons = [];
    let yPos = -120;

    availableTechnologies.forEach(tech => {
      // 创建研究按钮
      const researchBtn = new Button(this.scene, -200, yPos, tech.name, {
        width: 200,
        height: 30,
        backgroundColor: 0x4a6a4a,
        fontSize: '14px',
        textColor: '#ffffff',
        onClick: () => this.startResearch(tech.id)
      });

      // 创建研究描述
      const description = this.scene.add.text(-90, yPos, tech.description || '', {
        fontSize: '12px',
        fill: '#cccccc',
        wordWrap: { width: 200 }
      }).setOrigin(0, 0.5);

      researchButtons.push(...researchBtn.getElements(), description);
      yPos += 40;
    });

    // 创建已完成研究文本
    const completedResearchTexts = [];
    yPos = -120;

    completedResearch.forEach(techId => {
      const tech = researchSystem.getTechnology(techId);
      if (!tech) return;

      const techText = this.scene.add.text(50, yPos, tech.name, {
        fontSize: '14px',
        fill: '#00ff00'
      }).setOrigin(0, 0.5);

      completedResearchTexts.push(techText);
      yPos += 30;
    });

    // 添加元素到面板
    this.add([progressText, availableTitle, completedTitle, ...researchButtons, ...completedResearchTexts]);
  }

  /**
   * 开始研究
   * @param {string} techId - 技术ID
   */
  startResearch(techId) {
    console.log(`Starting research: ${techId}`);

    // 获取研究系统
    const researchSystem = this.scene.researchSystem;
    if (!researchSystem) return;

    // 开始研究
    const success = researchSystem.startResearch(techId);

    if (success) {
      // 更新面板
      this.update();

      // 显示成功消息
      const tech = researchSystem.technologies[techId];
      const notification = this.scene.add.text(this.scene.scale.width / 2, 100, `开始研究: ${tech.name}`, {
        fontSize: '18px',
        fill: '#ffffff',
        backgroundColor: '#3a8c3a',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5, 0.5).setDepth(100);

      // 2秒后自动消失
      this.scene.time.delayedCall(2000, () => {
        notification.destroy();
      });
    } else {
      // 显示错误消息
      const notification = this.scene.add.text(this.scene.scale.width / 2, 100, '无法开始研究', {
        fontSize: '18px',
        fill: '#ffffff',
        backgroundColor: '#8c3a3a',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5, 0.5).setDepth(100);

      // 2秒后自动消失
      this.scene.time.delayedCall(2000, () => {
        notification.destroy();
      });

      console.log('无法开始研究，可能资源不足或已有研究正在进行');
    }
  }

  /**
   * 更新面板内容
   */
  update() {
    // 销毁当前面板
    this.destroy();

    // 创建新的面板
    const panel = new ResearchPanel(this.scene, {
      x: this.x,
      y: this.y
    });

    // 显示面板
    panel.show();

    // 更新UIManager中的引用
    this.scene.uiManager.researchPanel = panel;
  }

  /**
   * 处理研究面板拖拉
   * @param {Phaser.Input.Pointer} pointer - 鼠标指针
   */
  handleDrag(pointer) {
    if (this.isResearchDragging) {
      const dx = pointer.x - this.researchDragPointerStartX;
      const dy = pointer.y - this.researchDragPointerStartY;
      this.container.x = this.researchDragStartX + dx;
      this.container.y = this.researchDragStartY + dy;
    }
  }
}
