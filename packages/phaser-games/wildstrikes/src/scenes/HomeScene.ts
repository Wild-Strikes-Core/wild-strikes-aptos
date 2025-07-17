import * as Phaser from 'phaser';
import bgClouds from '../components/bg-clouds';

export class HomeScene extends Phaser.Scene {
  private BG_CLOUDS!: Phaser.GameObjects.Layer;
  private MENU_BUTTONS!: Phaser.GameObjects.Layer;
  private LEADERBOARDS!: Phaser.GameObjects.Image;
  private BUTTON_ARENA!: Phaser.GameObjects.Image;
  private BUTTON_ABOUT!: Phaser.GameObjects.Image;
  private BUTTON_WARRIORS!: Phaser.GameObjects.Image;
  private NAME_CONTAINER!: Phaser.GameObjects.Image;
  private PLAYER_NAME!: Phaser.GameObjects.Text;

  constructor() {
    super('Home');
  }

  private editorCreate(): void {
    const background = this.add.image(0, 0, '2G_bg');
    background.setOrigin(0, 0);
    background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    background.depth = -1000;

    this.BG_CLOUDS = this.add.layer();
    this.MENU_BUTTONS = this.add.layer();

    this.LEADERBOARDS = this.add.image(464, 544, '2G_btnsBackground');
    this.LEADERBOARDS.setScale(2.28);
    this.MENU_BUTTONS.add(this.LEADERBOARDS);

    this.BUTTON_ARENA = this.add.image(1392, 592, '2G_btnArena');
    this.BUTTON_ARENA.setScale(1.435);
    this.MENU_BUTTONS.add(this.BUTTON_ARENA);

    this.BUTTON_ABOUT = this.add.image(1536, 960, '2G_btnAbout');
    this.BUTTON_WARRIORS = this.add.image(1232, 960, '2G_btnWarriors');

    this.NAME_CONTAINER = this.add.image(464, 208, '2G_Player_Name_Card');
    this.NAME_CONTAINER.setScale(0.858);

    this.PLAYER_NAME = this.add.text(272, 176, 'Connect Wallet', {
      fontFamily: 'Arial',
      fontSize: '64px',
      fontStyle: 'bold',
      align: 'center',
    });

    this.events.emit('scene-awake');
  }

  create(): void {
    this.editorCreate();

    // Background music
    this.startBackgroundMusic();
    this.events.on('shutdown', this.onShutdown, this);

    const buttons = [this.BUTTON_ARENA, this.BUTTON_ABOUT, this.BUTTON_WARRIORS];

    // Initial states
    buttons.forEach((button, idx) => {
      // @ts-ignore
      button.originalY = button.y;
      // @ts-ignore
      button.originalX = button.x;
      const dir = idx % 2 === 0 ? 1 : -1;
      button.x += 50 * dir;
      button.y += 200;
      button.setAlpha(0);
      button.setScale(button.scaleX * 0.7);
    });

    // Player card initial state
    // @ts-ignore
    this.NAME_CONTAINER.originalY = this.NAME_CONTAINER.y;
    this.NAME_CONTAINER.setAlpha(0.5);
    this.NAME_CONTAINER.setScale(this.NAME_CONTAINER.scaleX * 0.5);
    // @ts-ignore
    this.PLAYER_NAME.originalY = this.PLAYER_NAME.y;
    this.PLAYER_NAME.setAlpha(0);

    // Leaderboards initial
    // @ts-ignore
    this.LEADERBOARDS.originalX = this.LEADERBOARDS.x;
    this.LEADERBOARDS.setAlpha(0.3);
    this.LEADERBOARDS.rotation = -0.05;
    this.LEADERBOARDS.setScale(this.LEADERBOARDS.scaleX * 0.8);

    // Entrance animations
    this.cameras.main.fadeIn(250, 0, 0, 0);

    this.tweens.add({
      targets: this.NAME_CONTAINER,
      scaleX: this.NAME_CONTAINER.scaleX / 0.5,
      scaleY: this.NAME_CONTAINER.scaleY / 0.5,
      alpha: 1,
      duration: 300,
      ease: 'Back.out',
      onComplete: () => {
        this.tweens.add({
          targets: this.PLAYER_NAME,
          alpha: 1,
          duration: 200,
          ease: 'Sine.easeOut',
        });
      },
    });

    this.time.delayedCall(100, () => {
      this.tweens.add({
        targets: this.LEADERBOARDS,
        scaleX: this.LEADERBOARDS.scaleX / 0.8,
        scaleY: this.LEADERBOARDS.scaleY / 0.8,
        rotation: 0,
        alpha: 1,
        duration: 350,
        ease: 'Back.out',
      });
    });

    this.time.delayedCall(150, () => {
      buttons.forEach((btn, index) => {
        this.tweens.add({
          targets: btn,
          // @ts-ignore
          x: btn.originalX,
          // @ts-ignore
          y: btn.originalY,
          scaleX: btn.scaleX / 0.7,
          scaleY: btn.scaleY / 0.7,
          alpha: 1,
          delay: index * 60,
          duration: 350,
          ease: 'Back.out',
          onComplete: () => {
            this.tweens.add({
              targets: btn,
              // @ts-ignore
              y: btn.originalY - 5,
              duration: 1200,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });
          },
        });
      });
    });

    // Setup individual interactions
    this.setupArenaButton();
    this.setupSecondaryButton(this.BUTTON_ABOUT, 'GM_About');
    this.setupSecondaryButton(this.BUTTON_WARRIORS, 'GM_Warriors');

    // Decorative clouds
    if (this.textures.exists('2G_bgClouds_2')) {
      const mc2 = new bgClouds(this, 1200, 450);
      mc2.speed = 30;
      this.add.existing(mc2);
      const mc3 = new bgClouds(this, 900, 200);
      mc3.speed = 40;
      this.add.existing(mc3);
    }
  }

  private setupBaseButton(button: Phaser.GameObjects.Image): void {
    button
      .setInteractive({ cursor: 'pointer' })
      .on('pointerover', () => {
        button.setTint(0xffff66);
        this.tweens.add({ targets: button, scaleX: button.scaleX * 1.1, scaleY: button.scaleY * 1.1, duration: 100 });
      })
      .on('pointerout', () => {
        button.clearTint();
        this.tweens.add({ targets: button, scaleX: button.scaleX / 1.1, scaleY: button.scaleY / 1.1, duration: 100 });
      });
  }

  private setupArenaButton(): void {
    this.setupBaseButton(this.BUTTON_ARENA);
    const allButtons = [this.BUTTON_ARENA, this.BUTTON_ABOUT, this.BUTTON_WARRIORS];

    this.BUTTON_ARENA.on('pointerdown', () => {
      this.playClickSound();
      this.stopBackgroundMusic();

      allButtons.forEach(b => b.disableInteractive());
      this.tweens.add({
        targets: this.BUTTON_ARENA,
        alpha: { from: 1, to: 0.3 },
        yoyo: true,
        duration: 80,
        repeat: 1,
        onComplete: () => {
          this.tweens.add({
            targets: this.BUTTON_ARENA,
            scaleX: this.BUTTON_ARENA.scaleX * 1.3,
            scaleY: this.BUTTON_ARENA.scaleY * 1.3,
            alpha: 0,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => {
              const flash = this.add.rectangle(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                this.cameras.main.width * 2,
                this.cameras.main.height * 2,
                0xffffff
              );
              flash.alpha = 0;
              flash.depth = 1000;
              this.cameras.main.shake(200, 0.01);
              this.tweens.add({
                targets: flash,
                alpha: { from: 0, to: 0.8 },
                duration: 100,
                yoyo: true,
                onComplete: () => {
                  const circle = this.add.circle(this.BUTTON_ARENA.x, this.BUTTON_ARENA.y, 50, 0x000000);
                  circle.depth = 999;
                  this.tweens.add({
                    targets: circle,
                    radius: 1500,
                    duration: 600,
                    ease: 'Cubic.easeIn',
                    onComplete: () => {
                      this.time.delayedCall(1000, () => {
                        this.scene.start('Matchmaking');
                      });
                    },
                  });
                },
              });
            },
          });
        },
      });
    });
  }

  private setupSecondaryButton(button: Phaser.GameObjects.Image, targetScene: string): void {
    this.setupBaseButton(button);
    const allButtons = [this.BUTTON_ARENA, this.BUTTON_ABOUT, this.BUTTON_WARRIORS];

    button.on('pointerdown', () => {
      this.playClickSound();
      this.stopBackgroundMusic();
      allButtons.forEach(b => b.disableInteractive());
      this.tweens.add({
        targets: button,
        scale: '*=1.1',
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.tweens.add({ targets: allButtons, y: '+=50', alpha: 0, duration: 400, ease: 'Sine.easeInOut' });
          this.tweens.add({
            targets: this.cameras.main,
            alpha: 0,
            duration: 800,
            ease: 'Sine.easeInOut',
            onComplete: () => this.scene.start(targetScene),
          });
        },
      });
    });
  }

  private startBackgroundMusic(): void {
    this.stopBackgroundMusic();
    this.sound.play('game-menu-music', { loop: true, volume: 0.3 });
  }

  private stopBackgroundMusic(): void {
    this.sound.stopByKey('game-menu-music');
  }

  private playClickSound(): void {
    this.sound.play('click-menu', { volume: 0.5 });
  }

  private onShutdown(): void {
    this.stopBackgroundMusic();
  }
} 