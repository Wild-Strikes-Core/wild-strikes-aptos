import * as Phaser from 'phaser';
import { AssetLoader } from '../AssetLoader';

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

    this.scene.start('Start');
  }
} 