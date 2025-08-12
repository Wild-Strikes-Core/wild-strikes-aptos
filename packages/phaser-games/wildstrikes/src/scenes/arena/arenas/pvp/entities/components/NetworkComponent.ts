import { EntityComponent } from './EntityComponent';
import { GameEntity } from '../core/GameEntity';
import { socket } from '@phaser-games/wildstrikes/src/shared-utils/socket';

type Inputs = { left: boolean; right: boolean; jump: boolean; crouch: boolean; dash: boolean; lightAttack: boolean; heavyAttack: boolean };
type PlayerStats = { damagePercentage: number; lives: number };

export class NetworkComponent implements EntityComponent {
  private seq = 0;
  private lastSent = 0;
  private readonly RATE = 16;
  private playerStats: PlayerStats = { damagePercentage: 0, lives: 3 };

  constructor(private entity: GameEntity, private config: { playerId: string; roomId: string } | null) {}

  setStats(stats: PlayerStats) { this.playerStats = stats; }

  sendPlayerMoved(inputs: Inputs, state: string, reason: string): void {
    if (!this.config || !socket?.connected) return;
    const now = Date.now();
    if (now - this.lastSent < this.RATE) return;
    this.lastSent = now;

    const body = this.entity.sprite.body as Phaser.Physics.Arcade.Body;
    const ctx = {
      socketId: this.config.playerId,
      position: { x: this.entity.sprite.x, y: this.entity.sprite.y, facing: (this.entity.sprite.flipX ? 'left' : 'right') as 'left' | 'right' },
      velocityX: body ? body.velocity.x : 0,
      velocityY: body ? body.velocity.y : 0,
      inputs,
      state,
      playerStats: this.playerStats,
      isAlive: true,
      sequenceNumber: ++this.seq,
      timestamp: now,
    };
    // EXACT protocol
    socket.emit('player:moved', ctx);
  }

  sendAttack(attack: {
    attackType: 'light' | 'heavy';
    facing: 'left' | 'right';
    damage: number;
    knockback: { force: number; angle: number };
    position: { x: number; y: number };
    timestamp: number;
  }): void {
    if (!this.config || !socket?.connected) return;
    const payload = {
      playerId: this.config.playerId,
      ...attack,
    };
    // EXACT protocol
    socket.emit('player:attacked', payload);
  }

  on<T = any>(event: string, handler: (data: T) => void) { socket?.on(event, handler); }
  off(event: string, handler: (...a: any[]) => void) { socket?.off(event, handler); }

  update(): void {}
  destroy(): void {}
}