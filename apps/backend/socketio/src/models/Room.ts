import { Socket } from 'socket.io';

export interface PlayerState {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  health: number;
  flipX: boolean;
  anim: string;
  lastProcessedTick: number;
}

export class GameRoom {
  id: string;
  players: Map<string, Socket>;
  playerStates: Map<string, PlayerState>;
  gameStarted: boolean = false;
  lastUpdateTime: number = Date.now();

  constructor(id: string) {
    this.id = id;
    this.players = new Map();
    this.playerStates = new Map();
    console.log(`🏠 GameRoom ${id} created`);
  }

  addPlayer(socketId: string, socket: Socket): void {
    this.players.set(socketId, socket);
    
    // Initialize player state
    this.playerStates.set(socketId, {
      id: socketId,
      x: 960 + (this.players.size - 1) * 300, // Center screen with offset
      y: 200,
      velocityX: 0,
      velocityY: 0,
      health: 100,
      flipX: this.players.size === 2, // Second player faces left
      anim: "_Idle",
      lastProcessedTick: 0
    });

    console.log(` Player [${socketId}] added to room ${this.id}`);
    console.log(`📊 Room ${this.id} now has ${this.players.size} players`);
  }

  hasPlayer(socketId: string): boolean {
    return this.players.has(socketId);
  }

  getPlayer(socketId: string): Socket | undefined {
    return this.players.get(socketId);
  }

  removePlayer(socketId: string): void {
    const player = this.players.get(socketId);
    if (player) {
      player.leave(this.id);
      this.players.delete(socketId);
      this.playerStates.delete(socketId);
      console.log(`👋 Player [${socketId}] removed from room ${this.id}`);
      console.log(`📊 Room ${this.id} now has ${this.players.size} players`);
    }
  }

  getPlayerState(socketId: string): PlayerState | undefined {
    return this.playerStates.get(socketId);
  }

  updatePlayerPosition(socketId: string, data: { x: number; y: number; velocityX: number; velocityY: number; flipX: boolean; anim: string }): void {
    const state = this.playerStates.get(socketId);
    if (state) {
      state.x = data.x;
      state.y = data.y;
      state.velocityX = data.velocityX;
      state.velocityY = data.velocityY;
      state.flipX = data.flipX;
      state.anim = data.anim;
    }
  }

  processAttack(socketId: string, data: { type: string; x: number; y: number }): void {
    console.log(`⚔️  Player [${socketId}] attacked with ${data.type} at (${data.x}, ${data.y})`);
    
    // Broadcast attack to other players
    this.broadcastToOthers(socketId, 'player:attack', {
      attackerId: socketId,
      type: data.type,
      x: data.x,
      y: data.y
    });
  }

  broadcastToOthers(senderId: string, event: string, data: any): void {
    this.players.forEach((socket, playerId) => {
      if (playerId !== senderId) {
        socket.emit(event, data);
      }
    });
  }

  broadcastToAll(event: string, data: any): void {
    this.players.forEach((socket) => {
      socket.emit(event, data);
    });
  }

  getGameState(): { player1: PlayerState; player2: PlayerState } | null {
    const playerIds = Array.from(this.playerStates.keys());
    if (playerIds.length !== 2) return null;

    const player1 = this.playerStates.get(playerIds[0]);
    const player2 = this.playerStates.get(playerIds[1]);
    
    if (!player1 || !player2) return null;

    return { player1, player2 };
  }

  startGame(): void {
    this.gameStarted = true;
    this.broadcastToAll('match:start', { roomId: this.id });
    console.log(`🎮 Game started in room ${this.id}`);
  }

  cleanup(): void {
    console.log(`🧹 Cleaning up room ${this.id}`);
    this.players.forEach((socket) => {
      socket.leave(this.id);
    });
    this.players.clear();
    this.playerStates.clear();
  }
}
