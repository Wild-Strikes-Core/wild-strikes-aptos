import { Server } from 'socket.io';
import { RoomService } from './RoomService';
import type { WebMapConfig } from './maps';
import { PlayerContext } from '../../models/battle/PlayerContext';
import { AttackData } from '../../models/battle/AttackData';

/**
 * In-memory representation of a live battle.
 * Stored per room. Tracks player contexts, lifecycle state, and winner.
 */
type BattleState = {
    roomId: string;
    players: Record<string, PlayerContext>;
    gameState: 'waiting' | 'active' | 'ended';
    winner?: string;
    startTime: number;
};

/**
 * BattleService
 *
 * Server-side orchestrator for PvP battles. Responsibilities:
 * - Initialize a battle for a room with spawn positions and base stats
 * - Receive and validate client inputs; update authoritative player contexts
 * - Run lightweight broadcast loop to sync clients at ~20Hz
 * - Validate attacks, compute directional hit detection, apply damage/KO
 * - Emit battle lifecycle events (start, context updates, hits/misses, end)
 * - Handle disconnects and cleanup of timers/room state
 */
export class BattleService {
    private battles: Map<string, BattleState> = new Map();
    private physicsIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastValidationTime: Map<string, number> = new Map();
    // Toggle to bypass server validation and reconciliation. When true,
    // the server accepts client positions/states as-is and only relays them.
    private readonly clientAuthoritativeMode: boolean = true;

    constructor(private io: Server, private roomService: RoomService) {}

    /**
     * Starts a new battle for the given room and two players.
     * Seeds initial player contexts and begins the periodic broadcast loop.
     */
    startBattle(roomId: string, p1: string, p2: string) {
        console.log(`[BATTLE SERVICE] Starting battle in room ${roomId} between ${p1} and ${p2}`);
        const currentTime = Date.now();
        
        // Get map configuration from room service
        const mapConfig = this.roomService.getRoomMapConfig(roomId) as WebMapConfig | undefined;
        this.roomService.updateGameState(roomId, 'active');

        const state: BattleState = {
            roomId,
            gameState: 'active',
            startTime: currentTime,
            players: {
                [p1]: { 
                    socketId: p1, 
                    position: { 
                        x: mapConfig?.mapSpawnPoints.player1.x || 0, 
                        y: mapConfig?.mapSpawnPoints.player1.y || 0, 
                        facing: 'right' 
                    },
                    animation: 'idle',
                    inputs: { left: false, right: false, jump: false, crouch: false, dash: false, lightAttack: false, heavyAttack: false },
                    state: 'idle',
                    playerStats: {
                        damagePercentage: 0,
                        lives: 3,
                    },
                    isAlive: true,
                    sequenceNumber: 0,
                    timestamp: currentTime,
                },
                [p2]: { 
                    socketId: p2, 
                    position: { 
                        x: mapConfig?.mapSpawnPoints.player2.x || 0, 
                        y: mapConfig?.mapSpawnPoints.player2.y || 0, 
                        facing: 'right' 
                    },
                    animation: 'idle',
                    inputs: { left: false, right: false, jump: false, crouch: false, dash: false, lightAttack: false, heavyAttack: false },
                    state: 'idle',
                    playerStats: {
                        damagePercentage: 0,
                        lives: 3,
                    },
                    isAlive: true,
                    sequenceNumber: 0,
                    timestamp: currentTime,
                },
            },
        };

        this.battles.set(roomId, state);

        this.io.to(roomId).emit("server:start-battle", {
            ...this.serialize(state),
            mapConfig: mapConfig
        });

        // Start a lightweight periodic broadcast loop to ensure all clients
        // receive authoritative contexts even if input events are sparse.
        // If an interval already exists for this room, clear it first.
        const existingInterval = this.physicsIntervals.get(roomId);
        if (existingInterval) {
            clearInterval(existingInterval);
            this.physicsIntervals.delete(roomId);
        }

        const interval = setInterval(() => {
            const battle = this.battles.get(roomId);
            if (!battle || battle.gameState !== 'active') {
                clearInterval(interval);
                this.physicsIntervals.delete(roomId);
                return;
            }
            this.broadcastPlayerContexts(roomId);
        }, 50); // ~20Hz

        this.physicsIntervals.set(roomId, interval);
    }

    /** Gets the current battle state for a room, if any. */
    getBattleState(roomId: string): BattleState | undefined {
        return this.battles.get(roomId);
    }

    // Handle player input validation (server-authoritative)
    /**
     * Validates and applies a player's context update. The server is
     * authoritative: it merges allowed fields and rebroadcasts the snapshot.
     * Fields honored from the client: position, velocityX/Y, inputs, state,
     * sequenceNumber, timestamp.
     */
    validatePlayerInput(roomId: string, playerId: string, playerContext: any) {
        const battle = this.battles.get(roomId);
        if (!battle || battle.gameState !== 'active') {
            // Silently ignore inputs when battle is not active to avoid log spam after end
            return;
        }

        const player = battle.players[playerId];
        if (!player || !player.isAlive) {
            return;
        }

        const newTimestamp = playerContext.timestamp || Date.now();
        
        if (playerContext.position) {
            player.position = { ...player.position, ...playerContext.position } as any;
        }
        if (playerContext.velocityX !== undefined) player.velocityX = playerContext.velocityX;
        if (playerContext.velocityY !== undefined) player.velocityY = playerContext.velocityY;
        if (playerContext.inputs) player.inputs = playerContext.inputs;
        if (playerContext.state) player.state = playerContext.state;
        player.sequenceNumber = playerContext.sequenceNumber || player.sequenceNumber || 0;
        player.timestamp = newTimestamp;
        // Immediately rebroadcast after applying the new authoritative values
        this.broadcastPlayerContexts(roomId);
        return;
    }

    // Broadcast player contexts to all clients
    /**
     * Emits `server:broadcastPlayerContexts` to the room with an array of
     * normalized player snapshots and a `serverTimestamp` for client-side
     * reconciliation and latency measurement.
     */
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

    // Respawn helper to reset a dead player with remaining lives
    /**
     * Restores a player to an alive state if they have remaining lives and
     * rebroadcasts contexts. Optional spawn position can override current.
     */
    respawnPlayer(roomId: string, playerId: string, spawnPos?: {x: number, y: number}) {
        const battle = this.battles.get(roomId);
        if (!battle) return;
        const player = battle.players[playerId];
        if (!player) return;
        if (player.isAlive === false && player.playerStats.lives > 0) {
            // Reset player server-side
            player.isAlive = true;
            player.state = 'idle';
            player.position.x = spawnPos?.x ?? player.position.x;
            player.position.y = spawnPos?.y ?? player.position.y;
            player.playerStats.damagePercentage = 0;
            player.velocityX = 0; player.velocityY = 0;
            this.broadcastPlayerContexts(roomId);
        }
    }

    // Handle player disconnect
    /**
     * Handles a player disconnect during a battle. If the game is active,
     * declares the remaining player as the winner and emits the result. Also
     * clears timers and schedules state cleanup for the room.
     */
    handlePlayerDisconnect(roomId: string, playerId: string) {
        const battle = this.battles.get(roomId);
        if (!battle) return;

        // If the game is active, declare the remaining player as winner
        if (battle.gameState === 'active') {
            const remainingPlayerId = Object.keys(battle.players).find(id => id !== playerId);
            if (remainingPlayerId) {
                battle.gameState = 'ended';
                battle.winner = remainingPlayerId;
                
                // Note: legacy event name for disconnect path
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


    /**
     * Validates a client's attack event against server state and applies
     * damage/KO logic. Emits `server:attackHit` or `server:attackMissed` with
     * server-authoritative positions and updated stats.
     */
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

        // Ignore attacks from or against dead players
        if (attacker.isAlive === false || attacker.state === 'dead') {
            // Attacker cannot attack while dead
            return;
        }
        if (opponent.isAlive === false || opponent.state === 'dead') {
            // Defender is dead or in respawn window; ignore
            return;
        }

        // ✅ Validate client's attack position against server position
        const positionValid = this.validateAttackPosition(attacker.position, attackData.position, attackData.timestamp);
        
        if (!positionValid) {
            console.log(`[BATTLE SERVICE] Invalid attack position from player ${playerId}. Server: (${attacker.position.x}, ${attacker.position.y}), Client: (${attackData.position.x}, ${attackData.position.y})`);
            return; // Reject the attack entirely
        }

        // Calculate hit detection using AttackData structure
        const isHit = this.calculateDirectionalHitDetection(
            {
                x: attacker.position.x,         // Server position
                y: attacker.position.y,         // Server position
                facing: attacker.position.facing // Server facing direction
            }, 
            opponent.position,                  // Server position
            attackData.attackType
        );

        if (isHit) {
            const kbVector = this.computerKnocbackVector (
                opponent.playerStats?.damagePercentage || 0,
                attackData.knockback?.force || 0,
                attackData.knockback?.angle || 0
            );

            opponent.velocityX = kbVector.vx;
            opponent.velocityY = kbVector.vy;

            // Apply damage using AttackData values
            const wasKnockout = this.applyDamage(roomId, opponent, attackData, attacker.socketId);
            console.log(`[BATTLE SERVICE] Player ${attacker.socketId} hit player ${opponent.socketId} for ${attackData.damage} damage.`);
            
            if (!wasKnockout) {
                opponent.state = 'hit';
            }

            this.io.to(roomId).emit("server:attackHit", {
                attackerId: playerId,
                defenderId: opponent.socketId,
                damage: attackData.damage,
                knockback: attackData.knockback,
                attackType: attackData.attackType,
                // Use SERVER position for rendering
                attackerPosition: {
                    x: attacker.position.x,
                    y: attacker.position.y,
                    facing: attacker.position.facing
                },
                defenderPosition: opponent.position,
                newDefenderStats: {
                    damagePercentage: opponent.playerStats.damagePercentage,
                    lives: opponent.playerStats.lives,
                    knockback: attackData.knockback // Include knockback in stats
                },
                knockbackVector: { vx: kbVector.vx, vy: kbVector.vy },
                timestamp: Date.now()
            });
            if (!wasKnockout) {
                this.broadcastPlayerContexts(roomId);
            }
        } else {
            console.log(`[BATTLE SERVICE] Player ${attacker.socketId} missed the attack on player ${opponent.socketId}.`);
            // ✅ Broadcast MISS with server-validated data
            this.io.to(roomId).emit("server:attackMissed", {
                attackerId: playerId,
                defenderId: opponent.socketId,
                attackType: attackData.attackType,
                attackerPosition: {
                    x: attacker.position.x,
                    y: attacker.position.y,
                    facing: attacker.position.facing
                },
                timestamp: Date.now()
            });
        }
    }

    private computerKnocbackVector(
        defenderDamagePercent: number, 
        baseForce: number, 
        angleDeg: number): {vx: number, vy: number} {

        const FORCE_TO_VELOCITY = 24;
        const MIN_UPWARD_DEG = 20;
        const scale = 1 + (defenderDamagePercent / 100);
        const force = (baseForce || 0) * scale * FORCE_TO_VELOCITY;

        let rad = (angleDeg || 0) * Math.PI / 180;
        const minSin = Math.sin(MIN_UPWARD_DEG * Math.PI / 180);
        if (Math.abs(Math.sin(rad)) < minSin) {
            const facingRight = Math.cos(rad) >= 0;
            const adjustedDeg = facingRight ? MIN_UPWARD_DEG : (180 - MIN_UPWARD_DEG);
            rad = adjustedDeg * Math.PI / 180;
        }

        const vx = Math.cos(rad) * force;
        const vy = -Math.sin(rad) * force;
        return { vx, vy };
    }
    
    /**
     * Validates that the client's reported attack position is within a
     * tolerance of the server position, with slack proportional to latency.
     */
    private validateAttackPosition(
        serverPos: {x: number, y: number}, 
        clientPos: {x: number, y: number}, 
        attackTimestamp: number
    ): boolean {
        const distance = Math.sqrt(
            Math.pow(clientPos.x - serverPos.x, 2) + 
            Math.pow(clientPos.y - serverPos.y, 2)
        );
        
        // Allow some tolerance for network lag and client prediction
        const currentTime = Date.now();
        const timeDiff = currentTime - attackTimestamp;
        
        // Base tolerance + extra for network lag
        const baseTolerance = 50; // Base 50 pixels
        const lagTolerance = Math.min(timeDiff * 0.3, 100); // Up to 100px for lag
        const maxTolerance = baseTolerance + lagTolerance;
        
        if (distance > maxTolerance) {
            console.log(`[BATTLE SERVICE] Attack position validation failed: distance ${distance.toFixed(2)} > tolerance ${maxTolerance.toFixed(2)} (lag: ${timeDiff}ms)`);
            return false;
        }
        
        return true;
    }

    /**
     * Computes simple directional hit detection:
     * - Target must be within horizontal range and vertical tolerance
     * - Attacker must face towards the target
     */
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
        const maxRange = attackType === 'light' ? 105 : 150;
        const VERTICAL_TOLERANCE = attackType === 'light' ? 70 : 50;
        
        return distance <= maxRange && verticalDistance <= VERTICAL_TOLERANCE;
    }

    /**
     * Applies damage to the defender. Returns true if this hit caused a KO.
     * Handles life decrement, death state, respawn scheduling, and KO end.
     */
    private applyDamage(roomId: string, defender: PlayerContext, attackData: AttackData, attackerId?: string): boolean {
        // Add damage to damage percentage (this is our new health system)
        defender.playerStats.damagePercentage += attackData.damage;
        
        console.log(`[BATTLE SERVICE] Player ${defender.socketId} took ${attackData.damage} damage. Damage Percentage: ${defender.playerStats.damagePercentage}%`);

        // Apply knockback (you may want to implement knockback physics here)
        // This would use attackData.knockback.force and attackData.knockback.angle
        
        // Check for knockout - when damage percentage reaches 100% or more
        if (defender.playerStats.damagePercentage >= 100) {
            defender.playerStats.lives -= 1;
            defender.playerStats.damagePercentage = 0; // Reset damage percentage
            defender.state = 'dead';

            // Enter a true dead state during the respawn window so inputs are ignored
            defender.isAlive = false;
            console.log(`[BATTLE SERVICE] Player ${defender.socketId} has lost a life. Remaining lives: ${defender.playerStats.lives}`);

            // Broadcast immediately so all clients show death anim and disable interactions
            this.broadcastPlayerContexts(roomId);

            if (defender.playerStats.lives <= 0) {
                console.log(`[BATTLE SERVICE] Player ${defender.socketId} has been knocked out.`);
                // Declare winner and end battle
                const winnerId = attackerId || Object.keys(this.battles.get(roomId)?.players || {}).find(id => id !== defender.socketId);
                if (winnerId) {
                    this.endBattle(roomId, winnerId, defender.socketId, 'ko');
                }
                return true;
            } else {
                // Schedule server-authoritative respawn with short delay
                setTimeout(() => {
                    try {
                        this.respawnPlayer(roomId, defender.socketId);
                    } catch {}
                }, 2000);
            }
            // KO occurred (life lost). Even if not final, signal knockout to caller
            return true;
        }
        return false;
    }

    /**
     * Produces a client-friendly snapshot of the battle for initial payloads
     * and final results.
     */
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
                    damagePercentage: p.playerStats.damagePercentage,
                    lives: p.playerStats.lives
                }
            })),
        };
    }

    /**
     * Finalizes a battle, emits `server:battleEnd`, clears intervals, and
     * schedules cleanup of room state and memberships.
     */
    private endBattle(roomId: string, winnerId: string, loserId: string, reason: 'ko' | 'opponent-disconnected' | 'timeout' = 'ko') {
        const battle = this.battles.get(roomId);
        if (!battle) return;
        battle.gameState = 'ended';
        battle.winner = winnerId;
        // Clear interval
        const interval = this.physicsIntervals.get(roomId);
        if (interval) { clearInterval(interval); this.physicsIntervals.delete(roomId); }
        // Notify clients with final result
        this.io.to(roomId).emit('server:battleEnd', {
            roomId,
            reason,
            winnerId,
            loserId,
            finalState: this.serialize(battle),
            timestamp: Date.now()
        });

        // Schedule cleanup of battle state to avoid lingering rooms
        setTimeout(() => {
            this.battles.delete(roomId);
            // Also clean Socket.IO room membership to avoid stale joins
            try {
                const sockets = this.io.sockets.adapter.rooms.get(roomId);
                if (sockets) {
                    for (const socketId of sockets) {
                        this.io.sockets.sockets.get(socketId)?.leave(roomId);
                    }
                }
            } catch {}
        }, 2000);
    }
}
