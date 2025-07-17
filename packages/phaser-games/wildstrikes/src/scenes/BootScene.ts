import * as Phaser from 'phaser';

/**
 * BootScene is the first scene to run. It is responsible for
 * loading all game assets and then transitioning to the HomeScene.
 */
export class BootScene extends Phaser.Scene {
  private progressBar?: Phaser.GameObjects.Rectangle;

  constructor() {
    super('Boot');
  }

  /**
   * init is called before preload. We create a simple progress bar here
   * and listen to the loader's progress event to update it.
   */
  init(): void {
    // Create a minimal progress bar so players know something is happening
    // The bar will grow in width as assets load.
    const { width, height } = this.scale;
    this.progressBar = this.add.rectangle(width / 2, height * 0.9, 4, 28, 0xffffff);

    this.load.on('progress', (value: number) => {
      if (this.progressBar) {
        // Bar grows from 4px to 40% of the screen width
        const maxWidth = width * 0.4;
        this.progressBar.width = 4 + maxWidth * value;
      }
    });
  }

  /**
   * preload loads every asset required by the game. Assets are logically
   * grouped by category to keep things organised.
   */
  preload(): void {

    // -------- BOOT ASSETS -------- //
    this.load.pack('boot', 'assets/boot-asset-pack.json');

    // -------- UI ASSETS -------- //
    this.load.pack('gameMenu', 'assets/gameMenu-asset-pack.json');
    this.load.pack('landingPage', 'assets/landingPage-asset-pack.json');
    this.load.pack('settingsMenu', 'assets/settingsMenu-asset-pack.json');

    // Team / Inventory
    this.load.pack('listofteamsMenu', 'assets/listofteamsMenu-asset-pack.json');
    this.load.pack('selectTeam', 'assets/selectTeam-asset-pack.json');
    this.load.pack('invMenu', 'assets/invMenu-asset-pack.json');

    // Result screens
    this.load.pack('victoryPage', 'assets/victoryPage-asset-pack.json');
    this.load.pack('defeatPage', 'assets/defeatPage-asset-pack.json');
    this.load.pack('drawPage', 'assets/drawPage-asset-pack.json');

    // Additional screens
    this.load.pack('aboutMenu', 'assets/aboutMenu-asset-pack.json');
    this.load.pack('leadMENU', 'assets/leadMENU-asset-pack.json');

    // -------- GAMEPLAY ASSETS -------- //
    this.load.pack('matchMaking', 'assets/Match/matchMaking-asset-pack.json');
    this.load.pack('map', 'assets/Match/map-asset-pack.json');
    this.load.pack('tiles', 'assets/Match/02 - Map/tiles-asset-pack.json');
    this.load.pack('matchUI', 'assets/Match/match-skills-assets-pack.json');
    this.load.pack('timerAnim', 'assets/Match/timerAnim.json');

    // -------- CHARACTERS -------- //
    this.load.pack('sprite_heroP1', 'assets/Sprites/Hero_P1-pack.json');
    this.load.pack('placeholderChar', 'assets/Sprites/placeholderCharacter/placeholderCharacter-sprite-asset-pack.json');

    // -------- ENVIRONMENT -------- //
    this.load.image('2G_bgClouds_2', 'assets/01 - Landing Page/Purple_Green_Pixel_Illustration_Game_Presentation__2_-removebg-preview.png');
    this.load.image('2G_bg', 'assets/02 - Game Menu/2G_bg.png');
  }

  /**
   * create runs once all assets are loaded. We can now safely transition
   * to the next scene.
   */
  create(): void {
    console.log('All assets loaded successfully');

    // Destroy the progress bar once loading is complete
    this.progressBar?.destroy();

    // Transition to StartScene which will then navigate to the Home menu
    this.scene.start('Start');
  }
} 