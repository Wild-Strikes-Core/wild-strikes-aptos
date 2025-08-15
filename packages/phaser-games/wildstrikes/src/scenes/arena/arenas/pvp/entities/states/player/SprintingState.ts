import { IEntityState, StateDeps } from '../../components/StateComponent';

export class SprintingState implements IEntityState {
  constructor(private deps: StateDeps, private goto: (key: string) => void) {}
  enter(): void {
    if (!this.deps.inputEnabled) this.deps.sprite.play('player_run');
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

    const onGround = this.deps.movement.isOnGround();
    let moving = false;

    if (left?.pressed) { this.deps.movement.moveLeft(); this.deps.sprite.flipX(true); moving = true; }
    else if (right?.pressed) { this.deps.movement.moveRight(); this.deps.sprite.flipX(false); moving = true; }

    if (moving) this.deps.sprite.play('player_run');
    else { this.goto('idle'); return; }

    if ((crouch?.pressed ?? false) && onGround) { this.goto('crouchWalking'); return; }
    if ((jump?.justPressed ?? false) && onGround) { this.goto('jumping'); return; }
    if (dash?.justPressed) { this.goto('dashing'); return; }
    if (!onGround) { this.goto('jumping'); return; }

    if (light?.justPressed) { this.goto('attackingLight'); return; }
    if (heavy?.justPressed) { this.goto('attackingHeavy'); return; }
  }
  exit(): void {}
}