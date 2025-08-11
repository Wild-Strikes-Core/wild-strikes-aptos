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
    private physicsIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastValidationTime: Map<string, number> = new Map();
    // Toggle to bypass server validation and reconciliation. When true,
    // the server accepts client positions/states as-is and only relays them.
    private readonly clientAuthoritativeMode: boolean = true;

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
                        x: mapConfig?.spawnPoints.player2.x || 0, 
                        y: mapConfig?.spawnPoints.player2.y || 0, 
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

        const oldTimestamp = player.timestamp || Date.now();
        const newTimestamp = playerContext.timestamp || Date.now();

        // In client-authoritative mode, trust the client's context directly and broadcast.
        if (this.clientAuthoritativeMode) {
            if (playerContext.position) {
                player.position = { ...player.position, ...playerContext.position } as any;
            }
            if (playerContext.velocityX !== undefined) player.velocityX = playerContext.velocityX;
            if (playerContext.velocityY !== undefined) player.velocityY = playerContext.velocityY;
            if (playerContext.inputs) player.inputs = playerContext.inputs;
            if (playerContext.state) player.state = playerContext.state;
            player.sequenceNumber = playerContext.sequenceNumber || player.sequenceNumber || 0;
            player.timestamp = newTimestamp;
            this.broadcastPlayerContexts(roomId);
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

        // Validate position (anti-teleport) - use old timestamp for delta calculation
        // Validate position (anti-teleport) - use old timestamp for delta calculation
        if (playerContext.position) {
            const now = Date.now();
            const lastValidation = this.lastValidationTime.get(playerId) || 0;
            
            // For dashing, only validate every 100ms instead of every frame
            if (playerContext.state === 'dashing' && (now - lastValidation) < 100) {
                player.position = playerContext.position; // Accept without validation
            } else {
                const deltaTime = newTimestamp - oldTimestamp;
                const maxSpeed = playerContext.state === 'sprinting' ? 450 : 300;
                
                playerContext.position = this.validatePosition(
                    playerContext.position, 
                    player.position, 
                    deltaTime, 
                    maxSpeed,
                    playerContext.state || player.state
                );
                
                player.position = playerContext.position;
                this.lastValidationTime.set(playerId, now);
            }
            
            // Always update facing direction from client - don't validate this
            if (playerContext.position.facing !== undefined) {
                player.position.facing = playerContext.position.facing;
            }
        }

        // Now update the timestamp after position validation
        player.timestamp = newTimestamp;

        // Update state first so velocity validation uses the latest state
        if (playerContext.state) {
            player.state = playerContext.state;
        }

        // Update velocity if provided, capping sprint speed only when sprinting
        if (playerContext.velocityX !== undefined) {
            player.velocityX = this.validateSprintingSpeed(playerContext.velocityX, player.state);
        }
        if (playerContext.velocityY !== undefined) {
            player.velocityY = playerContext.velocityY;
        }

        // Broadcast validated player contexts to all clients in the room
        this.broadcastPlayerContexts(roomId);
    }

    private validateSprintingSpeed(velocityX: number, playerState: string): number {
        const MAX_SPRINT_SPEED = 450; // Ensures sprinting speed does not exceed this value

        if (playerState === 'sprinting') {
            if (Math.abs(velocityX) > MAX_SPRINT_SPEED) {
                return Math.sign(velocityX) * MAX_SPRINT_SPEED;
            }
        }
        return velocityX;
    }

    private validatePosition(newPosition: {x: number, y: number}, oldPosition: {x: number, y: number}, deltaTime: number, maxSpeed: number, playerState?: string): {x: number, y: number} {
        // Handle edge cases
        if (deltaTime <= 0 || deltaTime > 1000) { // More than 1 second indicates connection issues
            console.log(`[BATTLE SERVICE] Invalid deltaTime: ${deltaTime}ms, accepting position`);
            return newPosition;
        }

        // For dashing, be extremely lenient - only prevent obvious teleporting
        if (playerState === 'dashing') {
            const distance = Math.sqrt(
                Math.pow(newPosition.x - oldPosition.x, 2) + 
                Math.pow(newPosition.y - oldPosition.y, 2)
            );
            
            // Only reject if it's an obvious teleport (much higher threshold)
            const maxDashDistance = 500; // Very generous for dash combos
            if (distance > maxDashDistance) {
                console.log(`[BATTLE SERVICE] Extreme dash distance detected: ${distance} > ${maxDashDistance}`);
                return oldPosition; // Keep old position instead of partial correction
            }
            
            return newPosition; // Accept all normal dash movement
        }

        const distance = Math.sqrt(
            Math.pow(newPosition.x - oldPosition.x, 2) + 
            Math.pow(newPosition.y - oldPosition.y, 2)
        );
        
        // Much more lenient validation for all states
        let maxPossibleDistance: number;
        let tolerance: number;
        
        switch (playerState) {
            case 'jumping':
                // Very lenient for jumping - allows for jump momentum
                const jumpSpeed = 800; // Increased from 600
                maxPossibleDistance = Math.max(maxSpeed, jumpSpeed) * (deltaTime / 1000);
                tolerance = 5.0; // Much more lenient
                break;
                
            case 'falling':
            case 'idle': // Player might be falling while idle
            case 'sprinting':
                // Check if this is primarily vertical movement (falling/jumping)
                const horizontalDistance = Math.abs(newPosition.x - oldPosition.x);
                const verticalDistance = Math.abs(newPosition.y - oldPosition.y);
                
                if (verticalDistance > horizontalDistance) {
                    // Primarily vertical movement - very lenient
                    const fallSpeed = 1000; // Increased from 800
                    maxPossibleDistance = fallSpeed * (deltaTime / 1000);
                    tolerance = 4.0; // Very lenient
                } else {
                    // Horizontal movement - still lenient
                    maxPossibleDistance = maxSpeed * (deltaTime / 1000);
                    tolerance = 4.0; // Much more lenient
                }
                break;
                
            default:
                // Default case - very lenient
                maxPossibleDistance = maxSpeed * (deltaTime / 1000);
                tolerance = 4.0; // Much more lenient
                break;
        }
        
        // Only prevent extreme teleportation
        if (distance > maxPossibleDistance * tolerance) {
            console.log(`[BATTLE SERVICE] Extreme movement detected for state '${playerState}': distance ${distance.toFixed(2)} > max ${(maxPossibleDistance * tolerance).toFixed(2)}`);
            
            // Only reject truly extreme movements (likely cheating)
            if (distance > 1000) { // Only block movements > 1000 pixels
                return oldPosition; // Keep old position
            }
        }
        
        return newPosition; // Accept most movement
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
            // Apply damage using AttackData values
            this.applyDamage(opponent, attackData);
            console.log(`[BATTLE SERVICE] Player ${attacker.socketId} hit player ${opponent.socketId} for ${attackData.damage} damage.`);
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
                timestamp: Date.now()
            });
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
        const maxRange = attackType === 'light' ? 80 : 150;
        const VERTICAL_TOLERANCE = 50;
        
        return distance <= maxRange && verticalDistance <= VERTICAL_TOLERANCE;
    }

    private applyDamage(defender: PlayerContext, attackData: AttackData): void {
        // Add damage to damage percentage (this is our new health system)
        defender.playerStats.damagePercentage += attackData.damage;
        
        console.log(`[BATTLE SERVICE] Player ${defender.socketId} took ${attackData.damage} damage. Damage Percentage: ${defender.playerStats.damagePercentage}%`);

        // Apply knockback (you may want to implement knockback physics here)
        // This would use attackData.knockback.force and attackData.knockback.angle
        
        // Check for knockout - when damage percentage reaches 100% or more
        if (defender.playerStats.damagePercentage >= 100) {
            defender.playerStats.lives -= 1;
            defender.playerStats.damagePercentage = 0; // Reset damage percentage
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
                    damagePercentage: p.playerStats.damagePercentage,
                    lives: p.playerStats.lives
                }
            })),
        };
    }
}
