import * as Phaser from 'phaser';

/**
 * UIButton is a reusable image-based button with built-in hover, click and
 * sound feedback.  It relies on BaseScene's playClickSound helper but does not
 * require the scene to extend BaseScene (fallback to direct sound call).
 */
export class UIButton extends Phaser.GameObjects.Image {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    onClick: () => void,
    scale: number = 1
  ) {
    super(scene, x, y, texture);

    this.setScale(scale);
    scene.add.existing(this);

    this.setInteractive({ cursor: 'pointer' })
      .on('pointerover', () => this.onHover())
      .on('pointerout', () => this.onOut())
      .on('pointerdown', () => this.onPress(onClick));
  }

  private onHover() {
    this.scene.tweens.add({
      targets: this,
      scaleX: this.scaleX * 1.1,
      scaleY: this.scaleY * 1.1,
      duration: 120,
      ease: 'Sine.easeOut'
    });
    this.setTint(0xffff66);
  }

  private onOut() {
    this.scene.tweens.add({
      targets: this,
      scaleX: this.scaleX / 1.1,
      scaleY: this.scaleY / 1.1,
      duration: 120,
      ease: 'Sine.easeOut'
    });
    this.clearTint();
  }

  private onPress(callback: () => void) {
    // Use BaseScene helper if available otherwise fallback.
    const sceneAny: any = this.scene;
    if (typeof sceneAny.playClickSound === 'function') {
      sceneAny.playClickSound();
    } else {
      this.scene.sound.play('click-menu', { volume: 0.5 });
    }

    this.scene.tweens.add({
      targets: this,
      scale: '*=0.9',
      duration: 80,
      yoyo: true,
      onComplete: () => callback()
    });
  }
} 