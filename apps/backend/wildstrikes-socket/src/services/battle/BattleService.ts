import { Server } from 'socket.io';
import { RoomService } from './RoomService';
import { PlayerContext } from '../../models/battle/PlayerContext';
import { AttackData } from '../../models/battle/AttackData';

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

    // Handle player input validation (server-authoritative)
    validatePlayerInput(roomId: string, playerId: string, playerContext: any) {
        //console.log(`[BATTLE SERVICE] Validating input for player ${playerId} in room ${roomId}:`, playerContext);
        
        const battle = this.battles.get(roomId);
        if (!battle || battle.gameState !== 'active') {
            console.log(`[BATTLE SERVICE] Battle not active for room ${roomId}`);
            return;
        }

        const player = battle.players[playerId];
        if (!player || !player.isAlive) {
            console.log(`[BATTLE SERVICE] Player ${playerId} not found or not alive in room ${roomId}`);
            return;
        }

        // Server-side validation of input
        // For now, we'll accept all inputs but log them for debugging
        // console.log(`[BATTLE SERVICE] Input validation passed for player ${playerId}:`, {
        //     inputs: playerContext.inputs,
        //     currentPosition: player.position,
        //     newPosition: playerContext.position,
        //     sequenceNumber: playerContext.sequenceNumber,
        //     timestamp: playerContext.timestamp
        // });

        // Update player state on server
        player.inputs = playerContext.inputs;
        player.sequenceNumber = playerContext.sequenceNumber || 0;
        player.timestamp = playerContext.timestamp || Date.now();
        
        // Update position if provided
        if (playerContext.position) {
            player.position = playerContext.position;
        }

        // Update velocity if provided
        if (playerContext.velocityX !== undefined) {
            player.velocityX = playerContext.velocityX;
        }
        if (playerContext.velocityY !== undefined) {
            player.velocityY = playerContext.velocityY;
        }

        // Update state if provided
        if (playerContext.state) {
            player.state = playerContext.state;
        }

        // Broadcast validated player contexts to all clients in the room
        this.broadcastPlayerContexts(roomId);
    }

    // Broadcast player contexts to all clients
    private broadcastPlayerContexts(roomId: string) {
        const battle = this.battles.get(roomId);
        if (!battle) return;

        const playerContexts = Object.values(battle.players).map(player => ({
            socketId: player.socketId,
            position: player.position,
            velocityX: player.velocityX || 0,
            velocityY: player.velocityY || 0,
            inputs: player.inputs,
            state: player.state,
            playerStats: player.playerStats,
            isAlive: player.isAlive,
            sequenceNumber: player.sequenceNumber,
            timestamp: player.timestamp
        }));

        //console.log(`[BATTLE SERVICE] Broadcasting player contexts to room ${roomId}:`, playerContexts);
        
        this.io.to(roomId).emit("server:broadcastPlayerContexts", {
            roomId: roomId,
            players: playerContexts,
            serverTimestamp: Date.now()
        });
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


    handlePlayerAttack(roomId: string, playerId: string, attackData: AttackData) {
        const battle = this.battles.get(roomId);
        if (!battle || battle.gameState !== 'active') {
            console.log(`[BATTLE SERVICE] Battle not active for room ${roomId} or player ${playerId} not found`);
            return;
        }
        
        // Use the playerId from the socket (the one calling the method) instead of attackData.playerId
        const attacker = battle.players[playerId];
        const opponent = Object.values(battle.players).find(p => p.socketId !== playerId);
        
        if (!attacker || !opponent) {
            console.log(`[BATTLE SERVICE] Attacker or opponent not found in room ${roomId}`);
            console.log(`[BATTLE SERVICE] Available players:`, Object.keys(battle.players));
            console.log(`[BATTLE SERVICE] Looking for attacker with ID:`, playerId);
            console.log(`[BATTLE SERVICE] AttackData playerId:`, attackData.playerId);
            return;
        }

        // Calculate hit detection using AttackData structure
        const isHit = this.calculateDirectionalHitDetection(
            {
                x: attackData.position.x,
                y: attackData.position.y,
                facing: attackData.facing
            }, 
            opponent.position, 
            attackData.attackType
        );

        if (isHit) {
            // Apply damage using AttackData values
            this.applyDamage(opponent, attackData);
            console.log(`[BATTLE SERVICE] Player ${attacker.socketId} hit player ${opponent.socketId} for ${attackData.damage} damage.`);
            // Broadcast hit result to all players
            // this.io.to(roomId).emit("server:attackHit", {
            //     attackerId: playerId, // Use the socket ID instead of attackData.playerId
            //     defenderId: opponent.socketId,
            //     damage: attackData.damage,
            //     knockback: attackData.knockback,
            //     newDefenderStats: opponent.playerStats
            // });
        } else {
            console.log(`[BATTLE SERVICE] Player ${attacker.socketId} missed the attack on player ${opponent.socketId}.`);
            // Optionally broadcast a miss event
            // this.io.to(roomId).emit("server:attackMissed", {
            //     attackerId: playerId,
            //     defenderId: opponent.socketId
            // });
        }
    }

    calculateDirectionalHitDetection(
    attackerPos: {x: number, y: number, facing: 'left' | 'right'}, 
    defenderPos: {x: number, y: number}, 
    attackType: 'light' | 'heavy'
    ): boolean {
        const horizontalDistance = defenderPos.x - attackerPos.x;
        const verticalDistance = Math.abs(attackerPos.y - defenderPos.y);
        
        // Attack must be in the direction player is facing
        const attackingInRightDirection = (attackerPos.facing === 'right' && horizontalDistance >= 0) ||
                                        (attackerPos.facing === 'left' && horizontalDistance <= 0);
        
        if (!attackingInRightDirection) {
            return false; // Can't hit behind you
        }
        
        const distance = Math.abs(horizontalDistance);
        const maxRange = attackType === 'light' ? 150 : 80;
        const VERTICAL_TOLERANCE = 50;
        
        return distance <= maxRange && verticalDistance <= VERTICAL_TOLERANCE;
    }

    private applyDamage(defender: PlayerContext, attackData: AttackData): void {
        defender.playerStats.health -= attackData.damage;
        defender.playerStats.damagePercentage += attackData.damage;
        
        console.log(`[BATTLE SERVICE] Player ${defender.socketId} took ${attackData.damage} damage. Health: ${defender.playerStats.health}, Damage Percentage: ${defender.playerStats.damagePercentage}`);

        // Apply knockback (you may want to implement knockback physics here)
        // This would use attackData.knockback.force and attackData.knockback.angle
        
        // Check for knockout
        if (defender.playerStats.health <= 0) {
            defender.playerStats.lives -= 1;
            defender.playerStats.health = 100;
            defender.playerStats.damagePercentage = 0;
            console.log(`[BATTLE SERVICE] Player ${defender.socketId} has lost a life. Remaining lives: ${defender.playerStats.lives}`);

            if (defender.playerStats.lives <= 0) {
                defender.isAlive = false;
                console.log(`[BATTLE SERVICE] Player ${defender.socketId} has been knocked out.`);
            }
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
