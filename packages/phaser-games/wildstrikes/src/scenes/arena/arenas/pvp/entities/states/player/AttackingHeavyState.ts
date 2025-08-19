import { IEntityState, StateDeps } from '../../components/StateComponent';

export class AttackingHeavyState implements IEntityState {
  private cooldown = 500;
  private last = 0;
  private isCharging = false;
  private executed = false;
  private pausedAtHold = false;
  private updateHandler?: Function;
  private completeHandler?: Function;
  constructor(private deps: StateDeps, private goto: (key: string) => void) {}
  enter(): void {
    const now = this.deps.entity.scene.time.now;
    if (this.deps.inputEnabled && now - this.last < this.cooldown) { this.goto('idle'); return; }
    this.last = now;

    const s = this.deps.entity.sprite;
    this.executed = false;
    this.isCharging = true;
    this.pausedAtHold = false;

    // Start animation and pause at second frame while button is held
    this.deps.sprite.play('player_attack_heavy', { frameRate: 12, repeat: 0, stopCurrent: true } as any);

    // Attach listeners shortly after play() to avoid SpriteComponent's stopCurrent delay
    this.deps.entity.scene.time.delayedCall(20, () => {
      this.updateHandler = (_anim: any, frame: any) => {
        if (!this.isCharging || this.pausedAtHold !== false) return;
        const idx = (frame?.index ?? 0);
        if (idx >= 1) { // second frame (0-based)
          try { s.anims.pause(); } catch {}
          this.pausedAtHold = true;
        }
      };
      try { s.on('animationupdate', this.updateHandler as any); } catch {}

      this.completeHandler = () => { this.onComplete(); };
      try { s.once('animationcomplete', this.completeHandler as any); } catch {}
    });
  }
  private onComplete(): void {
    if (!this.deps.inputEnabled) { this.goto('idle'); return; }
    const input = this.deps.input as any;
    const left = input.getActionState ? input.getActionState('left') : null;
    const right = input.getActionState ? input.getActionState('right') : null;
    const crouch = input.getActionState ? input.getActionState('crouch') : null;
    const onGround = this.deps.movement.isOnGround();
    if (!onGround) this.goto('jumping');
    else if (crouch?.pressed) this.goto((left?.pressed || right?.pressed) ? 'crouchWalking' : 'crouching');
    else if (left?.pressed || right?.pressed) this.goto('sprinting');
    else this.goto('idle');
  }
  update(): void {
    if (!this.deps.inputEnabled) return;
    const input = this.deps.input as any;
    const heavy = input.getActionState ? input.getActionState('heavyAttack') : null;
    const s = this.deps.entity.sprite;

    if (this.isCharging) {
      // Prevent horizontal movement while charging
      try { this.deps.movement.stopHorizontal(); } catch {}
      // Optionally increase friction to lock in place
      try { (s.body as Phaser.Physics.Arcade.Body)?.setDragX(2000); } catch {}
      if (heavy?.pressed) {
        if (this.pausedAtHold) {
          try { s.anims.pause(); } catch {}
        }
        return;
      }
      if (heavy?.justReleased) {
        this.isCharging = false;
        this.executeAttack();
        try { s.anims.resume(); } catch {}
      }
    }
  }
  private executeAttack(): void {
    if (this.executed) return;
    this.executed = true;
    const now = this.deps.entity.scene.time.now;
    const s = this.deps.entity.sprite;
    if (this.deps.inputEnabled) {
      if (this.deps.singlePlayerMode) {
        this.deps.hitbox.createLocal('heavy');
      } else if (this.deps.network) {
        this.deps.network.sendAttack({
          attackType: 'heavy',
          facing: (s.flipX ? 'left' : 'right'),
          damage: 20,
          knockback: { force: 40, angle: s.flipX ? 180 : 0 },
          position: { x: s.x, y: s.y },
          timestamp: now,
        });
      }
    }
  }
  exit(): void {
    const s = this.deps.entity.sprite;
    if (this.updateHandler) { try { s.off('animationupdate', this.updateHandler as any); } catch {} this.updateHandler = undefined; }
    if (this.completeHandler) { try { s.off('animationcomplete', this.completeHandler as any); } catch {} this.completeHandler = undefined; }
    this.isCharging = false;
    this.pausedAtHold = false;
  }
}