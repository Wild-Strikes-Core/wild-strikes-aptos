import { GameEntity } from '../core/GameEntity';
import { EntityComponent } from './EntityComponent';
import { CHARACTER_MAPS, CharacterMap, AnimConfig, DEFAULT_MAP } from '../player/playerSpriteMaps';

export class SpriteComponent implements EntityComponent {
  private entity: GameEntity;
  private map: CharacterMap;
  private animPrefix: string;
  private animKeyMap: Record<string, string> = {};
  private static readonly TARGET_DISPLAY_HEIGHT = 240; // px on-screen

  // Minimal animation mapping (migrated from old manager)
  private static readonly MAP: Record<string, AnimConfig> = DEFAULT_MAP;

  constructor(entity: GameEntity, opts?: { characterKey?: string; mapOverride?: CharacterMap }) {
    this.entity = entity;
    const byKey = opts?.characterKey ? CHARACTER_MAPS[opts.characterKey] : undefined;
    this.map = opts?.mapOverride || byKey || SpriteComponent.MAP;
    this.animPrefix = opts?.characterKey ? `${opts.characterKey}_` : '';
    this.ensureAnimations();
    this.entity.sprite.setData('currentState', 'idle');
  }

  private ensureAnimations(): void {
    const scene = this.entity.scene;
    const map = this.map || SpriteComponent.MAP;
    Object.entries(map).forEach(([key, cfg]) => {
      const createdKey = `${this.animPrefix}${key}`;
      this.animKeyMap[key] = createdKey;
      if (!scene.anims.exists(createdKey)) {
        const data = scene.cache.json.get(cfg.data);
        if (!data || !data.anims || !data.anims[0] || !Array.isArray(data.anims[0].frames)) return;
        // Prefer JSON-declared frame count; fallback to spritesheet frame count if JSON has zero
        let jsonFrames = data.anims[0].frames.length || 0;
        let sheetFrames = 0;
        try {
          const tex = scene.textures.get(cfg.texture);
          sheetFrames = tex?.frameTotal ?? 0;
        } catch {}
        const frames = Math.max(jsonFrames, sheetFrames);
        if (frames <= 0) return; // skip invalid animations to avoid Phaser's duration error
        const repeat0 = (key.includes('attack') || key.includes('hit') || key.includes('death')) ? 0 : (data.anims[0].repeat || 0);
        try {
          scene.anims.create({
            key: createdKey,
            frames: scene.anims.generateFrameNumbers(cfg.texture, { start: 0, end: frames - 1 }),
            frameRate: data.anims[0].frameRate || 10,
            repeat: repeat0,
          });
        } catch {}
      }

    });
  }

  setDefaults(): void {
    const s = this.entity.sprite;
    s.setDepth(1);
    s.setInteractive({ hitArea: new Phaser.Geom.Rectangle(0, 0, 120, 80), hitAreaCallback: Phaser.Geom.Rectangle.Contains });

    // Normalize visual size across characters regardless of spritesheet pixel dims
    const frameHeight = s.height || s.displayHeight || 80;
    const normalizedScale = SpriteComponent.TARGET_DISPLAY_HEIGHT / frameHeight;
    s.setScale(normalizedScale);
    s.setOrigin(0.5, 1);
    if (s.body) {
      const b = s.body as Phaser.Physics.Arcade.Body;
      // Set strong downward gravity for fast, responsive jumps and falls
      b.setGravityY(8000);

      // Set the collision box size for the player sprite (width: 30, height: 40)
      b.setSize(30, 40);

      // Offset the collision box to align with the sprite's feet and body
      b.setOffset(45, 40);

      // Prevent the player from leaving the world bounds
      b.setCollideWorldBounds(true);

      // Add a small bounce when landing on the ground
      b.setBounce(0.1);

      // Apply horizontal drag to slow down movement when not pressing a direction
      b.setDragX(200);

      // --- Other useful Arcade Physics body properties you could add: ---

      // b.setFriction(x, y); // Set friction for ground and wall sliding
      // b.setMaxVelocity(1000, 2000); // Limit max horizontal and vertical speed
      // b.setAllowGravity(true); // Enable/disable gravity for special states
      // b.setImmovable(false); // Make the body immovable (for platforms, etc)
      // b.setVelocity(0, 0); // Directly set velocity (for knockback, etc)
      // b.setMass(1); // Set mass for physics calculations
      // b.setDamping(true); // Enable damping for smoother stop
      // b.setAngularVelocity(0); // For rotation, if needed
    }
    this.play('player_idle');
  }

  play(key: string, opts?: { frameRate?: number; repeat?: number; stopCurrent?: boolean }): void {
    const s = this.entity.sprite;
    if (!s || !s.active) return;
    const actualKey = this.animKeyMap[key] || key;
    if (opts?.stopCurrent && s.anims.currentAnim) {
      s.anims.stop();
      s.off('animationcomplete');
      this.entity.scene.time.delayedCall(10, () => s.anims.play(actualKey));
    } else {
      s.anims.play(actualKey, true);
    }
  }

  flipX(flip: boolean): void { this.entity.sprite.setFlipX(flip); }
  setState(state: string): void { this.entity.sprite.setData('currentState', state); }
  getState(): string { return this.entity.sprite.getData('currentState') || 'idle'; }

  update(): void {}
  destroy(): void {}
}