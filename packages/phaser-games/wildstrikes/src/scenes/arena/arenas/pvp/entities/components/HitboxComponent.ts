import { GameEntity } from '../core/GameEntity';
import { EntityComponent } from './EntityComponent';
import { AttackHitboxManager } from './AttackHitboxManager';

export class HitboxComponent implements EntityComponent {
  private mgr: AttackHitboxManager;
  constructor(private entity: GameEntity, singlePlayerMode = false) {
    this.mgr = new AttackHitboxManager(entity.scene, entity.sprite, singlePlayerMode);
  }
  setOpponent(opponent: Phaser.Physics.Arcade.Sprite) { this.mgr.setOpponentPlayer(opponent); }
  createLocal(type: 'light' | 'heavy') { this.mgr.createLocalAttackHitbox(type); }
  renderServerAttack(d: any) { this.mgr.renderServerValidatedAttack(d); }
  getManager() { return this.mgr; }
  update(): void { this.mgr.update(); }
  destroy(): void { this.mgr.destroy(); }
}