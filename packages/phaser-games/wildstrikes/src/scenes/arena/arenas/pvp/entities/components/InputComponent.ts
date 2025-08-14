import { GameEntity } from '../core/GameEntity';
import { EntityComponent } from './EntityComponent';

export type CapturedInputs = {
  left: boolean; right: boolean; jump: boolean; crouch: boolean; dash: boolean;
  lightAttack: boolean; heavyAttack: boolean;
};

export class InputComponent implements EntityComponent {
  private entity: GameEntity;
  private enabled = true;
  private keyObjects: { [key: string]: Phaser.Input.Keyboard.Key } = {};
  private mouseButtons = { left: false, right: false };
  private mouseButtonsJustPressed = { left: false, right: false };
  private jumpJustPressed = false;

  constructor(entity: GameEntity, enabled = true) {
    this.entity = entity;
    this.enabled = enabled;
    if (enabled) this.setup();
  }

  private setup(): void {
    const scene = this.entity.scene;
    this.keyObjects = scene.input.keyboard.addKeys({
      left: 'A', right: 'D', up: 'W', jump: 'SPACE', dash: 'Q', crouch: 'CTRL'
    }) as any;

    // Ensure browser defaults for keys we use are prevented while still letting Phaser handle them
    scene.input.keyboard.addCapture(['SPACE', 'D']);

    scene.input.keyboard.on('keydown', (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) this.jumpJustPressed = true;
    });
    scene.input.keyboard.on('keyup', (e: KeyboardEvent) => {
      if (e.code === 'Space') this.jumpJustPressed = false;
    });

    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.button === 0) { this.mouseButtons.left = true; this.mouseButtonsJustPressed.left = true; }
      if (p.button === 2) { this.mouseButtons.right = true; this.mouseButtonsJustPressed.right = true; p.event.preventDefault(); }
    });
    scene.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.button === 0) this.mouseButtons.left = false;
      if (p.button === 2) this.mouseButtons.right = false;
    });

    scene.input.mouse?.disableContextMenu();
  }

  capture(): CapturedInputs | null {
    if (!this.enabled) return null;
    return {
      left: this.keyObjects.left?.isDown || false,
      right: this.keyObjects.right?.isDown || false,
      jump: this.jumpJustPressed,
      crouch: this.keyObjects.crouch?.isDown || false,
      dash: this.keyObjects.dash?.isDown || false,
      lightAttack: this.mouseButtonsJustPressed.left,
      heavyAttack: this.mouseButtonsJustPressed.right,
    };
  }

  resetJustPressed(): void {
    this.mouseButtonsJustPressed.left = false;
    this.mouseButtonsJustPressed.right = false;
    this.jumpJustPressed = false;
  }

  getKeys(): any { return this.keyObjects; }
  isEnabled(): boolean { return this.enabled; }
  setEnabled(v: boolean) { this.enabled = v; }

  update(): void {}
  destroy(): void {}
}