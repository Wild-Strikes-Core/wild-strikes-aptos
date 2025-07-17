import * as Phaser from 'phaser';
import bgClouds from '../components/bg-clouds';

export class StartScene extends Phaser.Scene {
  private BACKGROUND_LAYER!: Phaser.GameObjects.Layer;
  private PLAY_BUTTON!: Phaser.GameObjects.Image;
  private MAIN_LOGO!: Phaser.GameObjects.Image;

  constructor() {
    super('Start');
  }

  private editorCreate(): void {
    // Background layer placeholder (not strictly required but migrated for parity)
    this.BACKGROUND_LAYER = this.add.layer();
    this.BACKGROUND_LAYER.blendMode = Phaser.BlendModes.SKIP_CHECK;

    // Play Button
    this.PLAY_BUTTON = this.add.image(
      960,
      832,
      'Purple_Green_Pixel_Illustration_Game_Presentation-removebg-preview'
    );
    this.PLAY_BUTTON.setScale(0.86);

    // Main Logo
    this.MAIN_LOGO = this.add.image(992, 480, 'newLogo');
    this.MAIN_LOGO.setScale(1.74);

    this.events.emit('scene-awake');
  }

  create(): void {
    // Stretch background image to fill the view
    const bg = this.add.image(0, 0, '2G_bg');
    bg.setOrigin(0, 0);
    bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    bg.setDepth(-1000);

    this.editorCreate();

    this.cameras.main.fadeIn(180, 0, 0, 0);

    // Decorative moving clouds (parallax background)
    if (this.textures.exists('2G_bgClouds_2')) {
      const clouds1 = new bgClouds(this, 500, 300).setDepth(-500);
      const clouds2 = new bgClouds(this, 1200, 450).setDepth(-400);
      clouds2.speed = 30;
      const clouds3 = new bgClouds(this, 900, 200).setDepth(-300);
      clouds3.speed = 40;

      this.add.existing(clouds1);
      this.add.existing(clouds2);
      this.add.existing(clouds3);
    }

    // Interactive play button setup
    this.PLAY_BUTTON.setInteractive({ cursor: 'pointer' });

    // Idle animations (float / pulse)
    this.createPlayButtonIdleAnimation(this.PLAY_BUTTON);
    this.createLogoIdleAnimation(this.MAIN_LOGO);

    // Input handlers
    this.PLAY_BUTTON.on('pointerdown', () => {
      // Stop idle tween for crisp effect
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

  private createPlayButtonIdleAnimation(button: Phaser.GameObjects.Image): void {
    const originalY = button.y;
    this.tweens.add({
      targets: button,
      y: originalY - 15,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: button,
      scaleX: button.scaleX * 1.05,
      scaleY: button.scaleY * 1.05,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 400,
    });
    this.tweens.add({
      targets: button,
      alpha: 0.8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 600,
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

  private createLogoIdleAnimation(logo: Phaser.GameObjects.Image): void {
    this.tweens.add({
      targets: logo,
      scale: logo.scaleX * 1.02,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  update(): void {}
} 