import { GameEntity } from '../core/GameEntity';
import { EntityComponent } from './EntityComponent';

type AnimConfig = { texture: string; data: string; legacy: string };

export class SpriteComponent implements EntityComponent {
  private entity: GameEntity;

  // Minimal animation mapping (migrated from old manager)
  private static readonly MAP: Record<string, AnimConfig> = {
    player_idle: { texture: '_Idle', data: '_Idle_1', legacy: '_Idle' },
    player_run: { texture: '_Run', data: '_Run_1', legacy: '_Run' },
    player_jump: { texture: '_Jump', data: '_Jump_1', legacy: '_Jump' },
    player_dash: { texture: '_Dash', data: '_Dash_1', legacy: '_Dash' },
    player_fall: { texture: '_Fall', data: '_Fall_1', legacy: '_Fall' },
    player_attack_light: { texture: '_Attack', data: '_Attack_1', legacy: '_Attack' },
    player_attack_heavy: { texture: '_Attack2', data: '_Attack_2', legacy: '_Attack2' },
    player_crouch_idle: { texture: '_CrouchFull', data: '_CrouchFull_1', legacy: '_CrouchFull' },
    player_crouch_walk: { texture: '_CrouchWalk', data: '_CrouchWalk_1', legacy: '_CrouchWalk' },
    player_hit: { texture: '_Hit', data: '_Hit_1', legacy: '_Hit' },
    player_death_static: { texture: '_DeathNoMovement', data: '_DeathNoMovement_1', legacy: '_DeathNoMovement' },
  };

  constructor(entity: GameEntity) {
    this.entity = entity;
    this.ensureAnimations();
    this.entity.sprite.setData('currentState', 'idle');
  }

  private ensureAnimations(): void {
    const scene = this.entity.scene;
    Object.entries(SpriteComponent.MAP).forEach(([key, cfg]) => {
      if (!scene.anims.exists(key)) {
        const data = scene.cache.json.get(cfg.data);
        if (!data) return;
        const frames = data.anims[0].frames.length;
        const repeat0 = (key.includes('attack') || key.includes('hit') || key.includes('death')) ? 0 : (data.anims[0].repeat || 0);
        try {
          scene.anims.create({
            key,
            frames: scene.anims.generateFrameNumbers(cfg.texture, { start: 0, end: frames - 1 }),
            frameRate: data.anims[0].frameRate || 10,
            repeat: repeat0,
          });
        } catch {}
      }
      // legacy alias
      if (SpriteComponent.MAP[key].legacy !== key && !scene.anims.exists(SpriteComponent.MAP[key].legacy)) {
        const data = scene.cache.json.get(SpriteComponent.MAP[key].data);
        if (!data) return;
        const frames = data.anims[0].frames.length;
        const repeat0 = (key.includes('attack') || key.includes('hit') || key.includes('death')) ? 0 : (data.anims[0].repeat || 0);
        try {
          scene.anims.create({
            key: SpriteComponent.MAP[key].legacy,
            frames: scene.anims.generateFrameNumbers(SpriteComponent.MAP[key].texture, { start: 0, end: frames - 1 }),
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
    s.setScale(3);
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
    if (opts?.stopCurrent && s.anims.currentAnim) {
      s.anims.stop();
      s.off('animationcomplete');
      this.entity.scene.time.delayedCall(10, () => s.anims.play(key));
    } else {
      s.anims.play(key, true);
    }
  }

  flipX(flip: boolean): void { this.entity.sprite.setFlipX(flip); }
  setState(state: string): void { this.entity.sprite.setData('currentState', state); }
  getState(): string { return this.entity.sprite.getData('currentState') || 'idle'; }

  update(): void {}
  destroy(): void {}
}