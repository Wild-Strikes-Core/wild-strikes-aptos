import { IEntityState, StateDeps } from '../../components/StateComponent';

export class CrouchWalkingState implements IEntityState {
  constructor(private deps: StateDeps, private goto: (key: string) => void) {}

  enter(): void {
    this.deps.sprite.play('player_crouch_walk');
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

    if (!onGround) { this.goto('jumping'); return; }

    // If crouch released, switch to run/idle based on movement
    if (!crouch?.pressed) {
      if (left?.pressed || right?.pressed) { this.goto('sprinting'); return; }
      this.goto('idle'); return;
    }

    // Move while crouching
    let moving = false;
    if (left?.pressed) { this.deps.movement.moveLeft(); this.deps.sprite.flipX(true); moving = true; }
    else if (right?.pressed) { this.deps.movement.moveRight(); this.deps.sprite.flipX(false); moving = true; }

    if (moving) this.deps.sprite.play('player_crouch_walk');
    else { this.goto('crouching'); return; }

    if (dash?.justPressed) { this.goto('dashing'); return; }

    if (light?.justPressed) { this.goto('attackingLight'); return; }
    if (heavy?.justPressed) { this.goto('attackingHeavy'); return; }
  }

  exit(): void {}
}