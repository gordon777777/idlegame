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
    let progressDetails = [];

    if (researchProgress.active) {
      const { technology, totalProgress, successRate, attempts } = researchProgress;

      // 主进度文本
      progressText = this.scene.add.text(0, -220, `正在研究: ${technology.name} (${Math.floor(totalProgress * 100)}%)`, {
        fontSize: '16px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0);

      // 成功率文本
      const successRateText = this.scene.add.text(0, -200, `成功率: ${Math.floor(successRate * 100)}% (尝试次数: ${attempts})`, {
        fontSize: '12px',
        fill: '#aaffaa'
      }).setOrigin(0.5, 0);
      progressDetails.push(successRateText);

      // 研究点数进度
      if (researchProgress.researchPointsProgress.required > 0) {
        const rpProgress = researchProgress.researchPointsProgress;
        const rpText = this.scene.add.text(0, -185, `研究点数: ${Math.floor(rpProgress.current)}/${rpProgress.required} (${Math.floor(rpProgress.percent * 100)}%)`, {
          fontSize: '12px',
          fill: '#ccccff'
        }).setOrigin(0.5, 0);
        progressDetails.push(rpText);
      }

      // 时间进度
      if (researchProgress.timeProgress.required > 0) {
        const timeProgress = researchProgress.timeProgress;
        const timeText = this.scene.add.text(0, -170, `时间: ${timeProgress.current.toFixed(1)}/${timeProgress.required} 天 (${Math.floor(timeProgress.percent * 100)}%)`, {
          fontSize: '12px',
          fill: '#ccccff'
        }).setOrigin(0.5, 0);
        progressDetails.push(timeText);
      }

      // 建筑工时进度
      let yOffset = -155;
      if (researchProgress.buildingWorkHoursProgress && Object.keys(researchProgress.buildingWorkHoursProgress).length > 0) {
        Object.entries(researchProgress.buildingWorkHoursProgress).forEach(([buildingType, progress]) => {
          const buildingText = this.scene.add.text(0, yOffset, `${buildingType} 工时: ${Math.floor(progress.current)}/${progress.required} 小时 (${Math.floor(progress.percent * 100)}%)`, {
            fontSize: '12px',
            fill: '#ccccff'
          }).setOrigin(0.5, 0);
          progressDetails.push(buildingText);
          yOffset += 15;
        });
      }
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
      // 计算按钮颜色
      let backgroundColor = 0x4a6a4a; // 默认颜色
      if (tech.failed) {
        backgroundColor = 0x8a3a3a; // 失败的研究显示红色
      }

      // 创建研究按钮
      const researchBtn = new Button(this.scene, -200, yPos, tech.name, {
        width: 200,
        height: 30,
        backgroundColor: backgroundColor,
        fontSize: '14px',
        textColor: '#ffffff',
        onClick: () => this.startResearch(tech.id)
      });

      // 创建研究描述
      const description = this.scene.add.text(-90, yPos - 10, tech.description || '', {
        fontSize: '12px',
        fill: '#cccccc',
        wordWrap: { width: 200 }
      }).setOrigin(0, 0.5);

      // 收集所有需求文本
      const requirementTexts = [];
      let reqYOffset = 5;

      // 研究点数需求
      if (tech.requirements && tech.requirements.researchPoints) {
        const rpText = this.scene.add.text(-90, yPos + reqYOffset, `研究点: ${tech.requirements.researchPoints}`, {
          fontSize: '10px',
          fill: '#aaaaaa'
        }).setOrigin(0, 0.5);
        requirementTexts.push(rpText);
        reqYOffset += 12;
      }

      // 资源需求
      if (tech.requirements && tech.requirements.resources) {
        Object.entries(tech.requirements.resources).forEach(([resource, amount]) => {
          const resourceText = this.scene.add.text(-90, yPos + reqYOffset, `${resource}: ${amount}`, {
            fontSize: '10px',
            fill: '#aaaaaa'
          }).setOrigin(0, 0.5);
          requirementTexts.push(resourceText);
          reqYOffset += 12;
        });
      }

      // 金币需求
      if (tech.requirements && tech.requirements.gold) {
        const goldText = this.scene.add.text(-90, yPos + reqYOffset, `金币: ${tech.requirements.gold}`, {
          fontSize: '10px',
          fill: '#aaaaaa'
        }).setOrigin(0, 0.5);
        requirementTexts.push(goldText);
        reqYOffset += 12;
      }

      // 时间需求
      if (tech.requirements && tech.requirements.time) {
        const timeText = this.scene.add.text(-90, yPos + reqYOffset, `时间: ${tech.requirements.time} 天`, {
          fontSize: '10px',
          fill: '#aaaaaa'
        }).setOrigin(0, 0.5);
        requirementTexts.push(timeText);
        reqYOffset += 12;
      }

      // 成功率
      const successRateText = this.scene.add.text(0, yPos + reqYOffset, `成功率: ${Math.floor(tech.successRate * 100)}%`, {
        fontSize: '10px',
        fill: tech.failed ? '#ff8888' : '#88ff88'
      }).setOrigin(0, 0.5);
      requirementTexts.push(successRateText);

      // 尝试次数
      if (tech.attempts > 0) {
        const attemptsText = this.scene.add.text(80, yPos + reqYOffset, `尝试: ${tech.attempts}`, {
          fontSize: '10px',
          fill: '#aaaaaa'
        }).setOrigin(0, 0.5);
        requirementTexts.push(attemptsText);
      }

      researchButtons.push(...researchBtn.getElements(), description, ...requirementTexts);
      yPos += 80; // 增加间距以容纳更多信息
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
    this.add([progressText, ...progressDetails, availableTitle, completedTitle, ...researchButtons, ...completedResearchTexts]);
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
    const result = researchSystem.startResearch(techId);

    // 更新面板
    this.update();

    // 显示消息
    const backgroundColor = result.success ? '#3a8c3a' : '#8c3a3a';
    const notification = this.scene.add.text(this.scene.scale.width / 2, 100, result.message, {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: backgroundColor,
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5, 0.5).setDepth(100);

    // 3秒后自动消失
    this.scene.time.delayedCall(3000, () => {
      notification.destroy();
    });

    // 记录日志
    console.log(result.message);
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
