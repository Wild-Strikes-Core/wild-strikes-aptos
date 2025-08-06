import * as Phaser from 'phaser';
import { AssetLoader } from '../../AssetLoader';

/**
 * BootScene is the first scene to run. It is responsible for
 * loading all game assets and then transitioning to the HomeScene.
 */
export class BootScene extends Phaser.Scene {
  private progressBar?: Phaser.GameObjects.Rectangle;

  private platform: string = 'desktop';

  constructor() {
    super('Boot');
  }

  init(): void {

    this.platform = this.sys.game.device.os.desktop ? 'desktop' : 'mobile';
  }

  preload(): void {
    // Centralised asset loading
    const bar = this.add.rectangle(726, 524, 4, 28, 0xffffff);

    // Listen for loading progress updates
    this.load.on("progress", (progress: number) => {
        // Update the progress bar width based on loading percentage
        // The bar grows from 4px to 464px when fully loaded
        bar.width = 4 + 460 * progress;
    });

    const loader = new AssetLoader(this.load);
    // Only load the minimal assets needed to display the splash / loading screen.
    // Additional groups (ui, gameplay, chars, …) can be lazily loaded in their
    // respective scenes.
    loader.loadGroup('boot');
    loader.loadGroup('environment');
    // UI elements (buttons, logos) are needed immediately in StartScene
    loader.loadGroup('ui');
    // Load audio assets separately using proper Phaser loading methods
    loader.loadGroup('ui-audio');
    loader.loadGroup('gameplay-audio');

    
  }


  create(): void {
    console.log('All assets loaded successfully');

    this.scene.start('Matchmaking');
  }
} 