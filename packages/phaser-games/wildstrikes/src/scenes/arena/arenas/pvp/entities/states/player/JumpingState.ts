import { IEntityState, StateDeps } from '../../components/StateComponent';

export class JumpingState implements IEntityState {
  private jumpCount = 0;
  private jumpLimit = 2;
  constructor(private deps: StateDeps, private goto: (key: string) => void) {}
  enter(): void {
    const onGround = this.deps.movement.isOnGround();
    if (onGround) this.jumpCount = 0;
    if (onGround && this.jumpCount < this.jumpLimit) {
      this.deps.movement.jump();
      this.jumpCount++;
    }
    this.deps.sprite.play('player_jump');
  }
  update(): void {
    const keys = this.deps.input.getKeys();
    if (this.deps.inputEnabled) {
      if (keys.left?.isDown) { this.deps.movement.moveLeft(); this.deps.sprite.flipX(true); }
      else if (keys.right?.isDown) { this.deps.movement.moveRight(); this.deps.sprite.flipX(false); }
    }

    const body = this.deps.entity.sprite.body as Phaser.Physics.Arcade.Body;
    if (body?.velocity.y < 0) this.deps.sprite.play('player_jump'); else this.deps.sprite.play('player_fall');

    const onGround = this.deps.movement.isOnGround();
    if (onGround) {
      this.jumpCount = 0; // reset on landing
      if (keys.crouch?.isDown) this.goto('crouching');
      else if (keys.left?.isDown || keys.right?.isDown) this.goto('sprinting');
      else this.goto('idle');
      return;
    }

    if (this.deps.inputEnabled && keys.dash?.isDown) { this.goto('dashing'); return; }

    const inputs = this.deps.input.capture();
    // Allow mid-air double jump on just-pressed jump input
    if (this.deps.inputEnabled && inputs?.jump && this.jumpCount < this.jumpLimit) {
      this.deps.movement.jump();
      this.jumpCount++;
      this.deps.sprite.play('player_jump');
      return;
    }
    if (inputs?.lightAttack) { this.goto('attackingLight'); return; }
    if (inputs?.heavyAttack) { this.goto('attackingHeavy'); return; }
  }
  exit(): void {}
}