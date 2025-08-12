import { GameEntity } from '../core/GameEntity';
import { EntityComponent } from './EntityComponent';

export class MovementComponent implements EntityComponent {
  private entity: GameEntity;
  private runSpeed = 450;
  private dashSpeed = 2400;
  private jumpPower = -1300;

  constructor(entity: GameEntity, opts?: { runSpeed?: number; dashSpeed?: number; jumpPower?: number }) {
    this.entity = entity;
    if (opts?.runSpeed) this.runSpeed = opts.runSpeed;
    if (opts?.dashSpeed) this.dashSpeed = opts.dashSpeed;
    if (opts?.jumpPower) this.jumpPower = opts.jumpPower;
  }

  body(): Phaser.Physics.Arcade.Body | null {
    return (this.entity.sprite.body as Phaser.Physics.Arcade.Body) || null;
  }

  isOnGround(): boolean {
    const b = this.body(); return !!b && !!b.touching.down;
  }

  moveLeft(): void { this.entity.sprite.setVelocityX(-this.runSpeed); }
  moveRight(): void { this.entity.sprite.setVelocityX(this.runSpeed); }
  stopHorizontal(): void { this.entity.sprite.setVelocityX(0); }

  jump(): void { this.entity.sprite.setVelocityY(this.jumpPower); }

  dash(): void {
    const dir = this.entity.sprite.flipX ? -1 : 1;
    this.entity.sprite.setVelocityX(this.dashSpeed * dir);
  }

  setRunSpeed(v: number): void { this.runSpeed = v; }
  setDashSpeed(v: number): void { this.dashSpeed = v; }
  setJumpPower(v: number): void { this.jumpPower = v; }

  update(): void {}
  destroy(): void {}
}