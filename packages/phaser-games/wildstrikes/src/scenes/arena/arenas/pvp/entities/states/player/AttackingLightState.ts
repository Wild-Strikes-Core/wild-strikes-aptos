import { IEntityState, StateDeps } from '../../components/StateComponent';

export class AttackingLightState implements IEntityState {
  private cooldown = 300;
  private last = 0;
  constructor(private deps: StateDeps, private goto: (key: string) => void) {}
  enter(): void {
    const now = this.deps.entity.scene.time.now;
    if (this.deps.inputEnabled && now - this.last < this.cooldown) { this.goto('idle'); return; }
    this.last = now;

    const s = this.deps.entity.sprite;
    if (this.deps.inputEnabled) {
      if (this.deps.singlePlayerMode) {
        this.deps.hitbox.createLocal('light');
      } else if (this.deps.network) {
        this.deps.network.sendAttack({
          attackType: 'light',
          facing: (s.flipX ? 'left' : 'right'),
          damage: 10,
          knockback: { force: 5, angle: s.flipX ? 180 : 0 },
          position: { x: s.x, y: s.y },
          timestamp: now,
        });
      }
    }

    this.deps.sprite.play('player_attack_light', { frameRate: 12, repeat: 0, stopCurrent: true } as any);
    this.deps.entity.scene.time.delayedCall(250, () => this.onComplete());
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
  update(): void {}
  exit(): void {}
}