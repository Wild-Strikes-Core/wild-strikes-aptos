import { Server } from 'socket.io';
import { RoomService } from './RoomService';
import { PlayerContext } from '../../models/battle/PlayerContext';


type BattleState = {
    roomId: string;
    players: Record<string, PlayerContext>;
    gameState: 'waiting' | 'active' | 'ended';
    winner?: string;
    startTime: number;
};

export class BattleService {
    private battles: Map<string, BattleState> = new Map();
    private readonly PHYSICS_TIMESTEP = 16.67; // ~60fps
    private physicsIntervals: Map<string, NodeJS.Timeout> = new Map();

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
                    position: { 
                        x: mapConfig?.spawnPoints.player1.x || 0, 
                        y: mapConfig?.spawnPoints.player1.y || 0, 
                        facing: 'right' 
                    },
                    animation: 'idle',
                    inputs: { left: false, right: false, jump: false, crouch: false, dash: false, lightAttack: false, heavyAttack: false },
                    state: 'idle',
                    playerStats: {
                        health: 100,
                        damagePercentage: 0,
                        lives: 3,
                    },
                    isAlive: true,
                    sequenceNumber: 0,
                    timestamp: 0,
                },
                [p2]: { 
                    socketId: p2, 
                    position: { 
                        x: mapConfig?.spawnPoints.player2.x || 0, 
                        y: mapConfig?.spawnPoints.player2.y || 0, 
                        facing: 'right' 
                    },
                    animation: 'idle',
                    inputs: { left: false, right: false, jump: false, crouch: false, dash: false, lightAttack: false, heavyAttack: false },
                    state: 'idle',
                    playerStats: {
                        health: 100,
                        damagePercentage: 0,
                        lives: 3,
                    },
                    isAlive: true,
                    sequenceNumber: 0,
                    timestamp: 0,
                },
            },
        };

        this.battles.set(roomId, state);

        this.io.to(roomId).emit("server:start-battle", {
            ...this.serialize(state),
            mapConfig: mapConfig
        });
    }

    getBattleState(roomId: string): BattleState | undefined {
        return this.battles.get(roomId);
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

        // Clear physics interval
        const interval = this.physicsIntervals.get(roomId);
        if (interval) {
            clearInterval(interval);
            this.physicsIntervals.delete(roomId);
        }
    }


    private serialize(battle: BattleState) {
        return {
            roomId: battle.roomId,
            gameState: battle.gameState,
            winner: battle.winner,
            startTime: battle.startTime,
            players: Object.values(battle.players).map(p => ({
                socketId: p.socketId,
                position: p.position,
                state: p.state,
                isAlive: p.isAlive,
                playerStats: {
                    health: p.playerStats.health,
                    damagePercentage: p.playerStats.damagePercentage,
                    lives: p.playerStats.lives
                }
            })),
        };
    }
}
