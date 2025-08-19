import { IEntityState, StateDeps } from '../../components/StateComponent';

export class CrouchingState implements IEntityState {
  constructor(private deps: StateDeps, private goto: (key: string) => void) {}

  enter(): void {
    this.deps.movement.stopHorizontal();
    this.deps.sprite.play('player_crouch_idle');
  }

  update(): void {
    const input = this.deps.input as any;
    const left = input.getActionState ? input.getActionState('left') : null;
    const right = input.getActionState ? input.getActionState('right') : null;
    const crouch = input.getActionState ? input.getActionState('crouch') : null;
    const dash = input.getActionState ? input.getActionState('dash') : null;
    const light = input.getActionState ? input.getActionState('lightAttack') : null;
    const heavy = input.getActionState ? input.getActionState('heavyAttack') : null;
    const onGround = this.deps.movement.isOnGround();

    // Lost ground → jump/fall logic
    if (!onGround) { this.goto('jumping'); return; }

    // While crouching: move to crouch-walk if holding a direction
    if (crouch?.pressed) {
      if (left?.pressed || right?.pressed) { this.goto('crouchWalking'); return; }
      // stay crouching idle animation
      this.deps.sprite.play('player_crouch_idle');
    } else {
      // Released crouch: transition to run if moving, else idle
      if (left?.pressed || right?.pressed) { this.goto('sprinting'); return; }
      this.goto('idle'); return;
    }

    // Optional actions from crouch
    if (dash?.justPressed) { this.goto('dashing'); return; }

    // One-shot inputs (mouse/space)
    if (light?.justPressed) { this.goto('attackingLight'); return; }
    if (heavy?.justPressed) { this.goto('attackingHeavy'); return; }
  }

  exit(): void {}
}