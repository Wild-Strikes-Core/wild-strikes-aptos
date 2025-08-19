import * as Phaser from 'phaser';
import { PlayerStatsUI } from './PlayerStatsUI';

export type OverlayStats = {
  damagePercentage: number;
  lives: number;
  knockback?: { force: number; angle: number };
  position?: { x: number; y: number };
  velocity?: { x: number; y: number };
  animation?: string;
};

export class PlayerOverlayManager {
  private scene: Phaser.Scene;
  private localPlayerId: string;
  private opponentPlayerId: string;
  private localSprite: Phaser.Physics.Arcade.Sprite;
  private opponentSprite: Phaser.Physics.Arcade.Sprite;

  private localOverlay: PlayerStatsUI;
  private opponentOverlay: PlayerStatsUI;

  constructor(params: {
    scene: Phaser.Scene;
    localPlayerId: string;
    opponentPlayerId: string;
    localSprite: Phaser.Physics.Arcade.Sprite;
    opponentSprite: Phaser.Physics.Arcade.Sprite;
  }) {
    this.scene = params.scene;
    this.localPlayerId = params.localPlayerId;
    this.opponentPlayerId = params.opponentPlayerId;
    this.localSprite = params.localSprite;
    this.opponentSprite = params.opponentSprite;

    this.localOverlay = new PlayerStatsUI(this.scene, this.localSprite);
    this.opponentOverlay = new PlayerStatsUI(this.scene, this.opponentSprite);
  }

  public update(): void {
    this.localOverlay.update();
    this.opponentOverlay.update();
  }

  public updateStatsForPlayer(playerId: string, stats: OverlayStats): void {
    const overlay = this.getOverlay(playerId);
    overlay?.updateStats(stats);
  }

  public showDamage(playerId: string, damage: number, color?: string): void {
    const overlay = this.getOverlay(playerId);
    overlay?.showDamagePopup(damage, color);
  }

  public setVisibleForPlayer(playerId: string, visible: boolean): void {
    const overlay = this.getOverlay(playerId);
    overlay?.setVisible(visible);
  }

  public destroy(): void {
    this.localOverlay?.destroy();
    this.opponentOverlay?.destroy();
  }

  private getOverlay(playerId: string): PlayerStatsUI | undefined {
    if (playerId === this.localPlayerId) return this.localOverlay;
    if (playerId === this.opponentPlayerId) return this.opponentOverlay;
    return undefined;
  }
}


