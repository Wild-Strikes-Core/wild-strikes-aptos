import { IEntityState, StateDeps } from '../../components/StateComponent';

export class SprintingState implements IEntityState {
  constructor(private deps: StateDeps, private goto: (key: string) => void) {}
  enter(): void {
    if (!this.deps.inputEnabled) this.deps.sprite.play('player_run');
  }
  update(): void {
    const keys = this.deps.input.getKeys();
    const onGround = this.deps.movement.isOnGround();
    let moving = false;

    if (keys.left?.isDown) { this.deps.movement.moveLeft(); this.deps.sprite.flipX(true); moving = true; }
    else if (keys.right?.isDown) { this.deps.movement.moveRight(); this.deps.sprite.flipX(false); moving = true; }

    if (moving) this.deps.sprite.play('player_run');
    else { this.goto('idle'); return; }

    if (keys.crouch?.isDown && onGround) { this.goto('crouchWalking'); return; }
    if (keys.jump?.isDown && onGround) { this.goto('jumping'); return; }
    if (keys.dash?.isDown) { this.goto('dashing'); return; }
    if (!onGround) { this.goto('jumping'); return; }

    const inputs = this.deps.input.capture();
    if (inputs?.lightAttack) { this.goto('attackingLight'); return; }
    if (inputs?.heavyAttack) { this.goto('attackingHeavy'); return; }
  }
  exit(): void {}
}