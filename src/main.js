import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: '#1a1a1a'
};

// 創建遊戲實例並將其賦值給全局變量，方便調試和測試
const game = new Phaser.Game(config);
window.game = game;

console.log('🎮 遊戲已啟動，可通過 window.game 訪問');