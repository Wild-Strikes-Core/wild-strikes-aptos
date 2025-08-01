import * as Phaser from 'phaser';

/**
 * BaseScene extends Phaser.Scene to provide helper utilities that are re-used
 * across many of our lightweight menu scenes.  Gameplay-heavy scenes can still
 * extend Phaser.Scene directly if they need full control.
 */
export class BaseScene extends Phaser.Scene {
  /**
   * Adds the standard full-screen 2G background used by almost every menu scene.
   * Depth is set to ‑1000 so that new elements naturally appear above it.
   */
  protected createStandardBackground(): void {
    const bg = this.add.image(0, 0, '2G_bg');
    bg.setOrigin(0, 0);
    bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    bg.setDepth(-1000);
  }

  /**
   * Fades the camera out and switches to another scene once the fade completes.
   * Optionally pass data to the next scene.
   */
  protected transitionToScene(key: string, data?: object): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(key, data);
    });
  }

  /**
   * Convenience wrapper for playing the common UI click sound.
   */
  protected playClickSound(volume: number = 0.5): void {
    this.sound.play('click-menu', { volume });
  }
} 