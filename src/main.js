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

new Phaser.Game(config);