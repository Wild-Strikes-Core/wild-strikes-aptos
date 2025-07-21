import * as Phaser from 'phaser';
import bgClouds from '../components/bg-clouds';
import { BaseScene } from './BaseScene';
import { Animations } from '../effects/Animations';

export class StartScene extends BaseScene {
  private PLAY_BUTTON!: Phaser.GameObjects.Image;
  private MAIN_LOGO!: Phaser.GameObjects.Image;

  constructor() {
    super('Start');
  }

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

    // --- Background ---
    this.createStandardBackground();

    // --- Decorative Parallax Clouds ---
    if (this.textures.exists('2G_bgClouds_2')) {
      CLOUD_POSITIONS.forEach((cfg, i) => {
        const cloud = new bgClouds(this, cfg.x, cfg.y).setDepth(CLOUD_DEPTHS[i]);
        cloud.speed = cfg.speed;
        this.add.existing(cloud);
      });
    }

    // --- UI Elements ---
    this.PLAY_BUTTON = this.add.image(centerX, centerY + 200, 'Purple_Green_Pixel_Illustration_Game_Presentation-removebg-preview').setScale(0.86);
    this.MAIN_LOGO = this.add.image(centerX, centerY - 120, 'newLogo').setScale(1.74);

    this.events.emit('scene-awake');
    this.cameras.main.fadeIn(180, 0, 0, 0);

    // --- Idle Animations ---
    Animations.floatyIdle(this, this.PLAY_BUTTON, 15);
    this.applyLogoPulse(this.MAIN_LOGO);

    // --- Button Interactivity ---
    this.PLAY_BUTTON.setInteractive({ cursor: 'pointer' });

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
