import { IEntityState, StateDeps } from '../../components/StateComponent';

export class DashingState implements IEntityState {
  private duration = 300;
  private cooldown = 1000; // match old @states behavior
  private isOnCooldown = false;
  private cooldownTimer: Phaser.Time.TimerEvent | null = null;
  constructor(private deps: StateDeps, private goto: (key: string) => void) {}
  enter(): void {
    if (this.deps.inputEnabled && this.isOnCooldown) { this.onFinish(); return; }

    this.deps.movement.dash();
    this.deps.sprite.play('player_dash');
    this.deps.entity.scene.time.delayedCall(this.duration, () => this.onFinish());
  }
  private onFinish(): void {
    // start cooldown only for local players, matching old @states
    if (this.deps.inputEnabled) {
      this.isOnCooldown = true;
      if (this.cooldownTimer) { try { this.cooldownTimer.remove(false as any); } catch {} }
      this.cooldownTimer = this.deps.entity.scene.time.delayedCall(this.cooldown, () => {
        this.isOnCooldown = false;
      });
    }

    const input = this.deps.input as any;
    const left = input.getActionState ? input.getActionState('left') : null;
    const right = input.getActionState ? input.getActionState('right') : null;
    const crouch = input.getActionState ? input.getActionState('crouch') : null;
    const onGround = this.deps.movement.isOnGround();
    if (!this.deps.inputEnabled) { this.goto('idle'); return; }
    if (!onGround) this.goto('jumping');
    else if (crouch?.pressed) this.goto((left?.pressed || right?.pressed) ? 'crouchWalking' : 'crouching');
    else if (left?.pressed || right?.pressed) this.goto('sprinting');
    else this.goto('idle');
  }
  update(): void {}
  exit(): void {}
}