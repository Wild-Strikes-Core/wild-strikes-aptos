import * as Phaser from 'phaser';
import bgClouds from '../../components/bg-clouds';
import { BaseScene } from './BaseScene';
import { Animations } from '../../effects/Animations';

export class StartScene extends BaseScene {
  private PLAY_BUTTON!: Phaser.GameObjects.Image;
  private MAIN_LOGO!: Phaser.GameObjects.Image;

  constructor() {
    super('Start');
  }
  
  private connectingWallet = false;
  private loadingText: Phaser.GameObjects.Text | null = null;

  create(): void {
    const { centerX, centerY, width, height } = this.cameras.main;

    // --- Constants ---
    const BG_DEPTH = -1000;
    const CLOUD_DEPTHS = [-500, -400, -300];
    const CLOUD_POSITIONS = [
      { x: 500, y: 300, speed: 20 },
      { x: 1200, y: 450, speed: 30 },
      { x: 900, y: 200, speed: 40 },
    ];
    
    this.PLAY_BUTTON.on('pointerdown', () => {
      this.tweens.killTweensOf(this.PLAY_BUTTON);
      this.createClickEffect(this.PLAY_BUTTON, () => {
        this.cameras.main.fadeOut(180, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('Home');
        });
      });
    });

    this.PLAY_BUTTON.on('pointerover', () => {
      this.tweens.add({
        targets: this.PLAY_BUTTON,
        scaleX: this.PLAY_BUTTON.scaleX * 1.1,
        scaleY: this.PLAY_BUTTON.scaleY * 1.1,
        duration: 300,
        ease: 'Sine.easeOut',
      });
      this.createShimmerEffect(this.PLAY_BUTTON);
    });

    this.PLAY_BUTTON.on('pointerout', () => {
      this.PLAY_BUTTON.clearTint();
      this.tweens.add({
        targets: this.PLAY_BUTTON,
        scaleX: 0.86,
        scaleY: 0.86,
        duration: 300,
        ease: 'Sine.easeOut',
      });
    });
  }

  // Removed custom floaty idle implementation in favour of Animations.floatyIdle

  private applyLogoPulse(logo: Phaser.GameObjects.Image): void {
    this.tweens.add({
      targets: logo,
      scale: logo.scaleX * 1.02,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createShimmerEffect(button: Phaser.GameObjects.Image): void {
    const colors = [0xffff66, 0xffffff, 0xffe066, 0xffffcc];
    let colorIndex = 0;

    this.time.addEvent({
      delay: 150,
      callback: () => {
        if (!button.active) return;
        button.setTint(colors[colorIndex]);
        colorIndex = (colorIndex + 1) % colors.length;
      },
      repeat: 10,
    });
  }

  private createClickEffect(button: Phaser.GameObjects.Image, callback: () => void): void {
    this.tweens.add({
      targets: button,
      scale: '*=0.85',
      duration: 100,
      ease: 'Bounce.easeIn',
      onComplete: () => {
        this.tweens.add({
          targets: button,
          scale: '*=1.8',
          alpha: 0,
          duration: 400,
          ease: 'Back.easeOut',
          onComplete: callback,
        });
      },
    });
  }
}
