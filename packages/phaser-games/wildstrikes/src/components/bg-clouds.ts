import * as Phaser from 'phaser';

export default class bgClouds extends Phaser.GameObjects.Image {
  public speed: number = 50;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, '2G_bgClouds_1');

    this.setOrigin(0.5, 0.5);
    this.setScale(1);
    this.setAlpha(0.7);

    scene.add.existing(this);
  }

  preUpdate(time: number, delta: number): void {
    this.x -= this.speed * (delta / 1000);

    if (this.x < -this.width) {
      // Reset to right side of the screen once off-screen
      this.x = this.scene.scale.width + this.width;
    }
  }
} 