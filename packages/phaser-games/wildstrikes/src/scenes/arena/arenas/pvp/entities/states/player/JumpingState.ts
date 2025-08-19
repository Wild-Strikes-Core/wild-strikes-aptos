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
    const input = this.deps.input as any;
    const left = input.getActionState ? input.getActionState('left') : null;
    const right = input.getActionState ? input.getActionState('right') : null;
    const crouch = input.getActionState ? input.getActionState('crouch') : null;
    const jump = input.getActionState ? input.getActionState('jump') : null;
    const dash = input.getActionState ? input.getActionState('dash') : null;
    const light = input.getActionState ? input.getActionState('lightAttack') : null;
    const heavy = input.getActionState ? input.getActionState('heavyAttack') : null;

    if (this.deps.inputEnabled) {
      if (left?.pressed) { this.deps.movement.moveLeft(); this.deps.sprite.flipX(true); }
      else if (right?.pressed) { this.deps.movement.moveRight(); this.deps.sprite.flipX(false); }
    }

    const body = this.deps.entity.sprite.body as Phaser.Physics.Arcade.Body;
    if (body?.velocity.y < 0) this.deps.sprite.play('player_jump'); else this.deps.sprite.play('player_fall');

    const onGround = this.deps.movement.isOnGround();
    if (onGround) {
      this.jumpCount = 0; // reset on landing
      if (crouch?.pressed) this.goto('crouching');
      else if (left?.pressed || right?.pressed) this.goto('sprinting');
      else this.goto('idle');
      return;
    }

    if (this.deps.inputEnabled && dash?.justPressed) { this.goto('dashing'); return; }

    // Allow mid-air double jump on just-pressed jump input
    if (this.deps.inputEnabled && (jump?.justPressed ?? false) && this.jumpCount < this.jumpLimit) {
      this.deps.movement.jump();
      this.jumpCount++;
      this.deps.sprite.play('player_jump');
      return;
    }
    if (light?.justPressed) { this.goto('attackingLight'); return; }
    if (heavy?.justPressed) { this.goto('attackingHeavy'); return; }
  }
  exit(): void {}
}