import { IEntityState, StateDeps } from '../../components/StateComponent';

export class HitState implements IEntityState {
  private recovery = 400;
  private timer?: Phaser.Time.TimerEvent;
  private tintTimer?: Phaser.Time.TimerEvent;

  constructor(private deps: StateDeps, private goto: (key: string) => void) {}

  enter(): void {
    this.deps.sprite.play('player_hit', { frameRate: 12, repeat: 0, stopCurrent: true } as any);

    // Shake camera only if this is the local player being hit
    if (this.deps.inputEnabled) {
      try { this.deps.entity.scene.cameras.main.shake(150, 0.01); } catch {}
    }

    // Brief red tint to indicate hit, then clear
    const sprite = this.deps.entity.sprite;
    try { sprite.setTint(0xff0000); } catch {}
    this.tintTimer = this.deps.entity.scene.time.delayedCall(120, () => {
      try { sprite.clearTint(); } catch {}
    });

    this.timer = this.deps.entity.scene.time.delayedCall(this.recovery, () => this.goto('idle'));
    try { this.deps.entity.scene.sound.play('player-hit', { volume: 0.5 }); } catch {}
  }

  update(): void {
    // No inputs while hit; physics continues
  }

  exit(): void {
    if (this.timer) {
      try { this.timer.remove(false as any); } catch {}
      this.timer = undefined;
    }
    if (this.tintTimer) {
      try { this.tintTimer.remove(false as any); } catch {}
      this.tintTimer = undefined;
    }
    try { this.deps.entity.sprite.clearTint(); } catch {}
  }
}