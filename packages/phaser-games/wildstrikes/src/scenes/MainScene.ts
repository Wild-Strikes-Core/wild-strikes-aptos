import * as Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Welcome to Wildstrikes',
      {
        font: '48px Arial',
        color: '#ffffff',
      }
    ).setOrigin(0.5);
  }
} 