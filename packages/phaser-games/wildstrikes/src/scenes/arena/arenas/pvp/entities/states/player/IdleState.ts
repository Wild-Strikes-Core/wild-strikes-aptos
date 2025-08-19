// IdleState.ts
import { IEntityState, StateDeps } from '../../components/StateComponent';

export class IdleState implements IEntityState {
  constructor(private deps: StateDeps, private goto: (key: string) => void) {}

  enter(): void {
    this.deps.movement.stopHorizontal();
    this.deps.sprite.play('player_idle');
  }

  update(): void {
    if (!this.deps.inputEnabled) return;

    const input = this.deps.input as any; // InputComponent (new API)
    // query action states
    const left  = input.getActionState ? input.getActionState('left') : null;
    const right = input.getActionState ? input.getActionState('right') : null;
    const crouch = input.getActionState ? input.getActionState('crouch') : null;
    const jump = input.getActionState ? input.getActionState('jump') : null;
    const dash = input.getActionState ? input.getActionState('dash') : null;
    const light = input.getActionState ? input.getActionState('lightAttack') : null;
    const heavy = input.getActionState ? input.getActionState('heavyAttack') : null;

    const onGround = this.deps.movement.isOnGround();

    // movement/horizontal (continuous)
    const horizPressed = (left?.pressed ?? false) || (right?.pressed ?? false);
    if (horizPressed) {
      // prefer crouchWalking if crouch held and on ground
      const crouchHeld = (crouch?.pressed ?? false);
      this.goto(crouchHeld && onGround ? 'crouchWalking' : 'sprinting');
      return;
    }

    // crouch (hold)
    if ((crouch?.pressed ?? false) && onGround) {
      this.goto('crouching');
      return;
    }

    // jump (use justPressed)
    if ((jump?.justPressed ?? false) && onGround) {
      this.goto('jumping');
      return;
    }

    // dash (discrete)
    if ((dash?.justPressed ?? false)) {
      this.goto('dashing');
      return;
    }

    // attacks (discrete)
    if ((light?.justPressed ?? false)) {
      this.goto('attackingLight');
      return;
    }
    if ((heavy?.justPressed ?? false)) {
      this.goto('attackingHeavy');
      return;
    }

    // remain idle
  }

  exit(): void {}
}
