import { Server } from 'socket.io';
import { RoomService } from './RoomService';

type PlayerPosition = {
    x: number;
    y: number;
    velocityX?: number;
    velocityY?: number;
    facing?: 'left' | 'right';
};

type PlayerState = {
    socketId: string;
    damagePercentage: number;  // 0-300%+ (Brawlhalla style)
    position: PlayerPosition;
    state: 'idle' | 'walking' | 'jumping' | 'attacking-light' | 'attacking-heavy' | 'dashing' | 'crouching' | 'defeated';
    isAlive: boolean;
};

type BattleState = {
    roomId: string;
    players: Record<string, PlayerState>; // key: socketId
    gameState: 'waiting' | 'active' | 'ended';
    winner?: string;
    startTime: number;
};

export class BattleService {
    private battles: Map<string, BattleState> = new Map();

    constructor(private io: Server, private roomService: RoomService) {}

    startBattle(roomId: string, p1: string, p2: string) {
        console.log(`[BATTLE SERVICE] Starting battle in room ${roomId} between ${p1} and ${p2}`);
        const currentTime = Date.now();
        
        // Get map configuration from room service
        const mapConfig = this.roomService.getRoomMapConfig(roomId);
        this.roomService.updateGameState(roomId, 'active');

        const state: BattleState = {
            roomId,
            gameState: 'active',
            startTime: currentTime,
            players: {
                [p1]: { 
                    socketId: p1, 
                    damagePercentage: 0, 
                    position: { 
                        x: mapConfig?.spawnPoints.player1.x || 0, 
                        y: mapConfig?.spawnPoints.player1.y || 0, 
                        facing: 'right' 
                    },
                    state: 'idle',
                    isAlive: true,
                },
                [p2]: { 
                    socketId: p2, 
                    damagePercentage: 0, 
                    position: { 
                        x: mapConfig?.spawnPoints.player2.x || 0, 
                        y: mapConfig?.spawnPoints.player2.y || 0, 
                        facing: 'left' 
                    },
                    state: 'idle',
                    isAlive: true,
                },
            },
        };

        this.battles.set(roomId, state);

        this.io.to(roomId).emit("battle-start", {
            ...this.serialize(state),
            mapConfig: mapConfig
        });

    }

    handlePlayerStateUpdate(roomId: string, playerId: string, playerState: any) {
        // console.log("[BATTLE SERVICE] Received player state update:", playerState);
        const battle = this.battles.get(roomId);
        if (!battle) return;
        
        // Update the player state with the received data
        battle.players[playerId] = {
            ...battle.players[playerId], // Keep existing data like damagePercentage, isAlive
            socketId: playerId,
            position: playerState.position,
            state: playerState.state,
            // Add velocity if provided
            ...(playerState.velocity && {
                position: {
                    ...playerState.position,
                    velocityX: playerState.velocity.x,
                    velocityY: playerState.velocity.y
                }
            })
        };
        
        // ✅ ADD DEBUGGING: Check what we're broadcasting
        const broadcastData = {
            id: playerId,
            ...battle.players[playerId]
        };
        console.log("[BATTLE SERVICE] Broadcasting to room:", roomId);
        console.log("[BATTLE SERVICE] Broadcast data:", broadcastData);
        
        this.io.to(roomId).emit("player-state-update", broadcastData);
        
    }

    // Simple handleAttack method (just for data structure)
    handleAttack(roomId: string, attackerId: string, attackData: any) {
        const battle = this.battles.get(roomId);
        if (!battle || battle.gameState !== 'active') return;

        console.log(`[BATTLE] Attack received from ${attackerId}:`, attackData);
        
        // For now, just broadcast the attack event
        this.io.to(roomId).emit("attack-broadcast", {
            attackerId,
            attackData
        });
    }

    getBattleState(roomId: string): BattleState | undefined {
        return this.battles.get(roomId);
    }

    getPlayerState(roomId: string, playerId: string): PlayerState | undefined {
        const battle = this.battles.get(roomId);
        return battle?.players[playerId];
    }

    // Handle player disconnect
    handlePlayerDisconnect(roomId: string, playerId: string) {
        const battle = this.battles.get(roomId);
        if (!battle) return;

        // If the game is active, declare the remaining player as winner
        if (battle.gameState === 'active') {
            const remainingPlayerId = Object.keys(battle.players).find(id => id !== playerId);
            if (remainingPlayerId) {
                battle.gameState = 'ended';
                battle.winner = remainingPlayerId;
                
                this.io.to(roomId).emit("battle-end", {
                    winner: remainingPlayerId,
                    reason: 'opponent-disconnected',
                    finalState: this.serialize(battle)
                });
            }
        }

        // Clean up the battle
        setTimeout(() => {
            this.battles.delete(roomId);
        }, 2000);
    }

    private serialize(battle: BattleState) {
        return {
            roomId: battle.roomId,
            gameState: battle.gameState,
            winner: battle.winner,
            startTime: battle.startTime,
            players: Object.values(battle.players).map(p => ({
                socketId: p.socketId,
                damagePercentage: p.damagePercentage,
                position: p.position,
                state: p.state,
                isAlive: p.isAlive,
            })),
        };
    }
}
