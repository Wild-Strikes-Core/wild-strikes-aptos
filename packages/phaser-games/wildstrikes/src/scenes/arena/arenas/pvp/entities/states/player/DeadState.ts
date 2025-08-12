import { IEntityState, StateDeps } from '../../components/StateComponent';

export class DeadState implements IEntityState {
  constructor(private deps: StateDeps, private goto: (key: string) => void) {}

  enter(): void {
    // Stop movement and play death animation
    try { this.deps.movement.stopHorizontal(); } catch {}
    this.deps.sprite.play('player_death_static', { repeat: 0, stopCurrent: true } as any);

    // Prevent immediate transitions out of dead unless externally commanded
  }

  update(): void {
    // Do nothing while dead; respawn is handled externally by scene logic
  }

  exit(): void {}
}


