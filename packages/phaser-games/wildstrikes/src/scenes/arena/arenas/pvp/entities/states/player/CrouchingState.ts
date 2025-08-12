import { IEntityState, StateDeps } from '../../components/StateComponent';

export class CrouchingState implements IEntityState {
  constructor(private deps: StateDeps, private goto: (key: string) => void) {}

  enter(): void {
    this.deps.movement.stopHorizontal();
    this.deps.sprite.play('player_crouch_idle');
  }

  update(): void {
    const keys = this.deps.input.getKeys();
    const onGround = this.deps.movement.isOnGround();

    // Lost ground → jump/fall logic
    if (!onGround) { this.goto('jumping'); return; }

    // While crouching: move to crouch-walk if holding a direction
    if (keys.crouch?.isDown) {
      if (keys.left?.isDown || keys.right?.isDown) { this.goto('crouchWalking'); return; }
      // stay crouching idle animation
      this.deps.sprite.play('player_crouch_idle');
    } else {
      // Released crouch: transition to run if moving, else idle
      if (keys.left?.isDown || keys.right?.isDown) { this.goto('sprinting'); return; }
      this.goto('idle'); return;
    }

    // Optional actions from crouch
    if (keys.dash?.isDown) { this.goto('dashing'); return; }

    // One-shot inputs (mouse/space)
    const inputs = this.deps.input.capture();
    if (inputs?.lightAttack) { this.goto('attackingLight'); return; }
    if (inputs?.heavyAttack) { this.goto('attackingHeavy'); return; }
  }

  exit(): void {}
}