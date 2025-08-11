import { IEntityState, StateDeps } from '../../components/StateComponent';

export class CrouchWalkingState implements IEntityState {
  constructor(private deps: StateDeps, private goto: (key: string) => void) {}

  enter(): void {
    this.deps.sprite.play('player_crouch_walk');
  }

  update(): void {
    const keys = this.deps.input.getKeys();
    const onGround = this.deps.movement.isOnGround();

    if (!onGround) { this.goto('jumping'); return; }

    // If crouch released, switch to run/idle based on movement
    if (!keys.crouch?.isDown) {
      if (keys.left?.isDown || keys.right?.isDown) { this.goto('sprinting'); return; }
      this.goto('idle'); return;
    }

    // Move while crouching
    let moving = false;
    if (keys.left?.isDown) { this.deps.movement.moveLeft(); this.deps.sprite.flipX(true); moving = true; }
    else if (keys.right?.isDown) { this.deps.movement.moveRight(); this.deps.sprite.flipX(false); moving = true; }

    if (moving) this.deps.sprite.play('player_crouch_walk');
    else { this.goto('crouching'); return; }

    if (keys.dash?.isDown) { this.goto('dashing'); return; }

    const inputs = this.deps.input.capture();
    if (inputs?.lightAttack) { this.goto('attackingLight'); return; }
    if (inputs?.heavyAttack) { this.goto('attackingHeavy'); return; }
  }

  exit(): void {}
}