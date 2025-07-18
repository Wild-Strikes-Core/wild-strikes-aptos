import * as Phaser from 'phaser';

export class Animations {
  /**
   * Applies a gentle up-down floating idle effect to the target image.
   */
  static floatyIdle(scene: Phaser.Scene, target: Phaser.GameObjects.Image, amplitude: number = 15) {
    const originalY = target.y;
    scene.tweens.add({
      targets: target,
      y: originalY - amplitude,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Quick pop-in grow + fade animation for UI elements.
   */
  static popIn(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, duration: number = 350) {
    // @ts-ignore – target may contain scale for gameobjects without scale props
    const originalScaleX = target.scaleX || 1;
    // @ts-ignore
    const originalScaleY = target.scaleY || 1;
    // @ts-ignore
    target.scaleX = 0;
    // @ts-ignore
    target.scaleY = 0;
    // @ts-ignore
    target.alpha = 0;

    scene.tweens.add({
      targets: target,
      // @ts-ignore
      scaleX: originalScaleX,
      // @ts-ignore
      scaleY: originalScaleY,
      // @ts-ignore
      alpha: 1,
      duration,
      ease: 'Back.out'
    });
  }

  /**
   * Convenience wrapper for screen flash and gentle shake.
   */
  static flashAndShake(scene: Phaser.Scene, flashColor: number = 0xffffff) {
    scene.cameras.main.flash(300, (flashColor >> 16) & 0xff, (flashColor >> 8) & 0xff, flashColor & 0xff);
    scene.cameras.main.shake(200, 0.01);
  }
} 