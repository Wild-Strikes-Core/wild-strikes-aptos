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

    const keys = this.deps.input.getKeys();
    const onGround = this.deps.movement.isOnGround();
    if (!this.deps.inputEnabled) { this.goto('idle'); return; }
    if (!onGround) this.goto('jumping');
    else if (keys.crouch?.isDown) this.goto(keys.left?.isDown || keys.right?.isDown ? 'crouchWalking' : 'crouching');
    else if (keys.left?.isDown || keys.right?.isDown) this.goto('sprinting');
    else this.goto('idle');
  }
  update(): void {}
  exit(): void {}
}