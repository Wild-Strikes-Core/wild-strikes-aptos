import * as Phaser from 'phaser';
import bgClouds from '../../components/bg-clouds';
import { BaseScene } from './BaseScene';
import { AssetLoader } from '../../AssetLoader';

export class HomeScene extends BaseScene {
  // UI Layers
  private BG_CLOUDS!: Phaser.GameObjects.Layer;
  private MENU_BUTTONS!: Phaser.GameObjects.Layer;
  private BOTTOM_BUTTONS!: Phaser.GameObjects.Layer;

  // UI Elements
  private LEADERBOARDS!: Phaser.GameObjects.Image;
  private BUTTON_ARENA!: Phaser.GameObjects.Image;
  private PLAYER_NAME!: Phaser.GameObjects.Text;
  private PLAYER_AVATAR!: Phaser.GameObjects.Image; 
  private PLAYER_USERID!: Phaser.GameObjects.Text;
  private BG_HILL!: Phaser.GameObjects.Image;
  private BG_STARS!: Phaser.GameObjects.Image;

  private DAILY_CHEST!: Phaser.GameObjects.Image;
  private BUTTON_LEADERBOARDS!: Phaser.GameObjects.Image;
  private SHOP!: Phaser.GameObjects.Image;
  private EVENTS!: Phaser.GameObjects.Image;
  private INVENTORY!: Phaser.GameObjects.Image;

  constructor() {
    super('Home');
  }

  preload(): void {
    const loader = new AssetLoader(this.load);
    loader.loadGroup('gameplay');
    loader.loadGroup('gameplay-audio');
    this.load.css('VT323', 'https://fonts.googleapis.com/css2?family=VT323&display=swap');
  }

  // --- Scene Lifecycle ---

  create(): void {
    this.createSceneElements();
    this.animateEntrance();
    this.setupButtonInteractions();
    this.addDecorativeClouds();
    this.startBackgroundMusic();
    this.events.on('shutdown', this.onShutdown, this);
  }

  // --- Scene Setup ---

  private createSceneElements(): void {
  this.createBackground();
  this.createLayers();
  this.createMenuButtons();

  const fontsApi = (document as any).fonts;
  if (fontsApi && fontsApi.load) {
    fontsApi.load('50px VT323').then(() => {
      this.createPlayerCard();      
      this.animatePlayerCard();     
    });
  } else {
    this.createPlayerCard();
    this.animatePlayerCard();
  }

  this.createBottomMenuButtons();
  this.events.emit('scene-awake');
}

  private createBackground(): void {
    this.createStandardBackground();
        const { width, height } = this.cameras.main;

        if (this.textures.exists("2g_bgStars")) {
            this.BG_STARS = this.add.image(0, 0, "2g_bgStars");
            this.BG_STARS.setOrigin(0, 0);
            this.BG_STARS.setDisplaySize(width, height);
            this.BG_STARS.setDepth(-900);
            this.tweens.add({
                targets: this.BG_STARS,
                alpha: { from: 0.2, to: 1 },
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            });
        }
        if (this.textures.exists('2G_bgHill')) {
            this.BG_HILL = this.add.image(this.cameras.main.centerX, height, '2G_bgHill').setOrigin(0.5, 1).setDepth(-800); // Place between stars and clouds
        }
  }

  private createLayers(): void {
    this.BG_CLOUDS = this.add.layer();
    this.MENU_BUTTONS = this.add.layer();
    this.BOTTOM_BUTTONS = this.add.layer()
  }

  private createMenuButtons(): void {
    this.LEADERBOARDS = this.add.image(410, this.cameras.main.centerY, '2G_btnsBackground').setScale(2.60);
    this.MENU_BUTTONS.add(this.LEADERBOARDS);

    this.BUTTON_ARENA = this.add.image(1392, this.cameras.main.centerY, '2G_btnArena').setScale(1.2);
    this.MENU_BUTTONS.add(this.BUTTON_ARENA);

  }

private createBottomMenuButtons(): void {
        const { centerX, centerY } = this.cameras.main;
        const cardX = this.LEADERBOARDS.x;
        const cardY = this.LEADERBOARDS.y;
        const spacing = 120;
        const buttonY = cardY + 320;
        const startX = cardX - (2 * spacing);

        this.DAILY_CHEST = this.add.image(startX, buttonY, '2G_btnDaily').setScale(0.7);
        this.BOTTOM_BUTTONS.add(this.DAILY_CHEST);

        this.BUTTON_LEADERBOARDS = this.add.image(startX + spacing, buttonY, '2G_btnLeaderboards').setScale(0.7);
        this.BOTTOM_BUTTONS.add(this.BUTTON_LEADERBOARDS);

        this.SHOP = this.add.image(startX + (2 * spacing), buttonY, '2G_btnShop').setScale(0.7);
        this.BOTTOM_BUTTONS.add(this.SHOP);

        this.EVENTS = this.add.image(startX + (3 * spacing), buttonY, '2G_btnEvents').setScale(0.7);
        this.BOTTOM_BUTTONS.add(this.EVENTS);

        this.INVENTORY = this.add.image(startX + (4 * spacing), buttonY, '2G_btnInventory').setScale(0.7);
        this.BOTTOM_BUTTONS.add(this.INVENTORY);
    }

private createPlayerCard(): void {

   if (this.textures.exists('2g_icoAvatar')) {
      this.PLAYER_AVATAR = this.add.image(200, 158, '2g_icoAvatar')
        .setScale(0.7) 
        .setAlpha(0); 
    }

  this.PLAYER_NAME = this.add.text(364, 138, 'USERNAME', {
    fontFamily: '"VT323", monospace',
    fontSize: '50px',
    align: 'center',
    color: '#000000',
  }).setOrigin(0.5, 0.5);

  this.PLAYER_USERID = this.add.text(394, 168, 'User ID: 123456789', {
    fontFamily: '"VT323", monospace',
    fontSize: '30px', 
    align: 'center',
    color: '#333333', 
  }).setOrigin(0.5, 0.5);


  // @ts-ignore
  this.PLAYER_NAME.originalY = this.PLAYER_NAME.y;
  this.PLAYER_NAME.setAlpha(0);
}
  // --- Animations ---

  private animateEntrance(): void {
     this.setInitialStates();
     this.cameras.main.fadeIn(250, 0, 0, 0);
     this.animatePlayerCard();
     this.animateLeaderboards();
     this.animateMenuButtons();
     this.animateBottomButtons()
  }

  private setInitialStates(): void {
  // Menu buttons
  const menuButtons = this.getMenuButtons();
  menuButtons.forEach((button, idx) => {
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

  // Bottom buttons
  const bottomButtons = this.getBottomButtons();
  bottomButtons.forEach((button) => {
    // @ts-ignore
    button.originalY = button.y;
    button.y += 200;
    button.setAlpha(0);
    button.setScale(button.scaleX * 0.7);
  });

  if (this.PLAYER_NAME) {
    // @ts-ignore
    this.PLAYER_NAME.originalY = this.PLAYER_NAME.y;
    this.PLAYER_NAME.setAlpha(0);
  }

   if (this.PLAYER_USERID) {
    // @ts-ignore
    this.PLAYER_USERID.originalY = this.PLAYER_USERID.y;
    this.PLAYER_USERID.setAlpha(0);
  }

  if (this.PLAYER_AVATAR) {
      this.PLAYER_AVATAR.setAlpha(0);
    }

  // Leaderboards
  // @ts-ignore
  this.LEADERBOARDS.originalX = this.LEADERBOARDS.x;
  this.LEADERBOARDS.setAlpha(0.3);
  this.LEADERBOARDS.rotation = -0.05;
  this.LEADERBOARDS.setScale(this.LEADERBOARDS.scaleX * 0.8);
}

private animatePlayerCard(): void {
  if (!this.PLAYER_NAME) return;

  const targets: Phaser.GameObjects.GameObject[] = [this.PLAYER_NAME];
   if (this.PLAYER_AVATAR) {
     targets.push(this.PLAYER_AVATAR);
     this.tweens.add({
       targets: this.PLAYER_AVATAR,
       angle: 360 * 9, 
       duration: 600,
       ease: 'Cubic.easeInOut',
     });
   }
 

   this.tweens.add({
     targets: targets,
     alpha: 1,
     delay: this.PLAYER_AVATAR ? 100 : 0, 
     duration: 200,
     ease: 'Sine.easeOut',
   });
 }
 

  private animateLeaderboards(): void {
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
  }

  private animateMenuButtons(): void {
    const buttons = this.getMenuButtons();
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
  }

  private animateBottomButtons(): void {
    const buttons = this.getBottomButtons();
    this.time.delayedCall(250, () => { 
        buttons.forEach((btn, index) => {
            this.tweens.add({
                targets: btn,
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
  }

  // --- Button Interactions ---

  private setupButtonInteractions(): void {
    this.setupArenaButton();
    this.setupSecondaryButton(this.DAILY_CHEST, 'DailyScene');
    this.setupSecondaryButton(this.BUTTON_LEADERBOARDS, 'LeaderboardsScene');
    this.setupSecondaryButton(this.SHOP, 'ShopScene');
    this.setupSecondaryButton(this.EVENTS, 'EventsScene');
    this.setupSecondaryButton(this.INVENTORY, 'InventoryScene');    
  }

  private setupBaseButton(button: Phaser.GameObjects.Image): void {
    button
      .setInteractive({ cursor: 'pointer' })
      .on('pointerover', () => {
        this.sound.play('hover-sound', { volume: 1.5 });
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
    const allButtons = [...this.getMenuButtons(), ...this.getBottomButtons()]; 
    this.BUTTON_ARENA.on('pointerdown', () => {
        this.playClickSound();
        this.stopBackgroundMusic();
        allButtons.forEach(b => b.disableInteractive());
        this.animateArenaButtonTransition();
    });
}
  private animateArenaButtonTransition(): void {
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
            this.flashAndTransitionToMatchmaking();
          },
        });
      },
    });
  }

  private flashAndTransitionToMatchmaking(): void {
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
  }

  private setupSecondaryButton(button: Phaser.GameObjects.Image, targetScene: string): void {
    this.setupBaseButton(button);
    const allButtons = [...this.getMenuButtons(), ...this.getBottomButtons()]; 
    button.on('pointerdown', () => {
        this.playClickSound();
        this.stopBackgroundMusic();
        allButtons.forEach(b => b.disableInteractive());
        this.animateSecondaryButtonTransition(button, allButtons, targetScene);
    });
  }

  private animateSecondaryButtonTransition(button: Phaser.GameObjects.Image, allButtons: Phaser.GameObjects.Image[], targetScene: string): void {
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
  }

  private getMenuButtons(): Phaser.GameObjects.Image[] {
    return [this.BUTTON_ARENA];
  }

  private getBottomButtons(): Phaser.GameObjects.Image[] {
        const buttons: Phaser.GameObjects.Image[] = [];
        if (this.DAILY_CHEST) buttons.push(this.DAILY_CHEST);
        if (this.BUTTON_LEADERBOARDS) buttons.push(this.BUTTON_LEADERBOARDS);
        if (this.SHOP) buttons.push(this.SHOP);
        if (this.EVENTS) buttons.push(this.EVENTS);
        if (this.INVENTORY) buttons.push(this.INVENTORY);
        return buttons;
    }

  // --- Decorative Elements ---

  private addDecorativeClouds(): void {
        const CLOUD_DEPTHS = [-700, -600, -500]; 
        const CLOUD_POSITIONS = [ 
            { x: 500, y: 300, speed: 20 },
            { x: 1200, y: 450, speed: 30 },
            { x: 900, y: 200, speed: 40 },
        ];

        if (this.textures.exists('2G_bgClouds_2')) {
            CLOUD_POSITIONS.forEach((cfg, i) => {
                const cloud = new bgClouds(this, cfg.x, cfg.y).setDepth(CLOUD_DEPTHS[i]);
                cloud.speed = cfg.speed;
                cloud.setScale(2.2);
                this.add.existing(cloud);
            });
        }
  }

  // --- Audio ---

  private startBackgroundMusic(): void {
    this.stopBackgroundMusic();
    this.sound.play('home-menu-music', { loop: true, volume: 0.3 });
  }

  private stopBackgroundMusic(): void {
    this.sound.stopByKey('home-menu-music');
  }

  protected playClickSound(): void {
    super.playClickSound();
  }

  // --- Cleanup ---

  private onShutdown(): void {
    this.stopBackgroundMusic();
  }

  private getAllUIElements(): Phaser.GameObjects.GameObject[] {
        const elements: Phaser.GameObjects.GameObject[] = [];
        if (this.BUTTON_ARENA) elements.push(this.BUTTON_ARENA);
        if (this.DAILY_CHEST) elements.push(this.DAILY_CHEST);
        if (this.LEADERBOARDS) elements.push(this.LEADERBOARDS);
        if (this.SHOP) elements.push(this.SHOP);
        if (this.EVENTS) elements.push(this.EVENTS);
        if (this.INVENTORY) elements.push(this.INVENTORY);
        if (this.PLAYER_NAME) elements.push(this.PLAYER_NAME);
        if (this.PLAYER_AVATAR) elements.push(this.PLAYER_AVATAR);
        return elements;
    }
} 