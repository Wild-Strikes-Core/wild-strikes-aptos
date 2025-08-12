import { IEntityState, StateDeps } from '../../components/StateComponent';

export class IdleState implements IEntityState {
  constructor(private deps: StateDeps, private goto: (key: string) => void) {}
  enter(): void {
    this.deps.movement.stopHorizontal();
    this.deps.sprite.play('player_idle');
  }
  update(): void {
    if (!this.deps.inputEnabled) return;
    const keys = this.deps.input.getKeys();
    const onGround = this.deps.movement.isOnGround();

    if (keys.left?.isDown || keys.right?.isDown) {
      this.goto(keys.crouch?.isDown && onGround ? 'crouchWalking' : 'sprinting'); return;
    }
    if (keys.crouch?.isDown && onGround) { this.goto('crouching'); return; }
    if (keys.jump?.isDown && onGround) { this.goto('jumping'); return; }
    if (keys.dash?.isDown) { this.goto('dashing'); return; }

    const inputs = this.deps.input.capture();
    if (inputs?.lightAttack) { this.goto('attackingLight'); return; }
    if (inputs?.heavyAttack) { this.goto('attackingHeavy'); return; }
  }
  exit(): void {}
}