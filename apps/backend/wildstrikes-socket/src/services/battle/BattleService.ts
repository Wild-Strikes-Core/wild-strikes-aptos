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
    hp: number;
    maxHp: number;
    position: PlayerPosition;
    state: 'idle' | 'walking' | 'jumping' | 'attacking-light' | 'attacking-heavy' | 'dashing' | 'crouching' | 'defeated';
    lastActionTime: number;
};

type AttackAction = {
    type: 'light' | 'heavy';
    damage: number;
    range: number;
    position: PlayerPosition;
    animation: string;
};

type MovementAction = {
    position: PlayerPosition;
    state: PlayerState['state'];
    timestamp: number;
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
        const currentTime = Date.now();
        
        // Get map configuration from room service
        const mapConfig = this.roomService.getRoomMapConfig(roomId);
        if (!mapConfig) {
            console.error(`No map configuration found for room ${roomId}`);
            return;
        }

        // Update room game state to active
        this.roomService.updateGameState(roomId, 'active');

        const state: BattleState = {
            roomId,
            gameState: 'active',
            startTime: currentTime,
            players: {
                [p1]: { 
                    socketId: p1, 
                    hp: 100, 
                    maxHp: 100,
                    position: { 
                        x: mapConfig.spawnPoints.player1.x, 
                        y: mapConfig.spawnPoints.player1.y, 
                        facing: 'right' 
                    },
                    state: 'idle',
                    lastActionTime: currentTime
                },
                [p2]: { 
                    socketId: p2, 
                    hp: 100, 
                    maxHp: 100,
                    position: { 
                        x: mapConfig.spawnPoints.player2.x, 
                        y: mapConfig.spawnPoints.player2.y, 
                        facing: 'left' 
                    },
                    state: 'idle',
                    lastActionTime: currentTime
                },
            },
        };

        this.battles.set(roomId, state);
        
        // Send battle start with map information
        this.io.to(roomId).emit("battle-start", {
            ...this.serialize(state),
            mapConfig: mapConfig
        });

        console.log(`⚔️ Battle started in room ${roomId} on map "${mapConfig.name}"`);
    }

    handleAttack(roomId: string, attackerId: string, attackAction: AttackAction) {
        const battle = this.battles.get(roomId);
        if (!battle || battle.gameState !== 'active') return;

        const defenderId = Object.keys(battle.players).find(id => id !== attackerId);
        if (!defenderId) return;

        const attacker = battle.players[attackerId];
        const defender = battle.players[defenderId];

        // Check if enough time has passed since last action (prevent spam)
        const currentTime = Date.now();
        const minActionInterval = 300; // 300ms minimum between attacks (for attack cooldown)
        if (currentTime - attacker.lastActionTime < minActionInterval) {
            console.log(`Attack blocked - too frequent (${currentTime - attacker.lastActionTime}ms < ${minActionInterval}ms)`);
            return;
        }

        // Check attack range (distance between players)
        const distance = Math.sqrt(
            Math.pow(attacker.position.x - defender.position.x, 2) + 
            Math.pow(attacker.position.y - defender.position.y, 2)
        );

        if (distance > attackAction.range) {
            console.log(`Attack missed - out of range (${distance} > ${attackAction.range})`);
            this.io.to(roomId).emit("attack-missed", {
                attackerId,
                reason: 'out-of-range',
                distance,
                maxRange: attackAction.range
            });
            return;
        }

        // Update attacker state
        attacker.state = attackAction.type === 'light' ? 'attacking-light' : 'attacking-heavy';
        attacker.lastActionTime = currentTime;
        attacker.position = attackAction.position;

        // Apply damage to defender
        defender.hp = Math.max(0, defender.hp - attackAction.damage);

        // Emit attack event with animation data
        this.io.to(roomId).emit("player-attack", {
            attackerId,
            defenderId,
            attackType: attackAction.type,
            damage: attackAction.damage,
            animation: attackAction.animation,
            attackerPosition: attacker.position,
            defenderPosition: defender.position,
            defenderNewHp: defender.hp
        });

        // Check for victory condition
        if (defender.hp <= 0) {
            defender.state = 'defeated';
            battle.gameState = 'ended';
            battle.winner = attackerId;
            
            this.io.to(roomId).emit("battle-end", { 
                winner: attackerId,
                finalState: this.serialize(battle)
            });
            
            // Clean up battle after a delay
            setTimeout(() => {
                this.battles.delete(roomId);
            }, 5000);
        } else {
            // Emit updated battle state (no turn switching in real-time)
            this.io.to(roomId).emit("battle-update", this.serialize(battle));
        }
    }

    handlePlayerMovement(roomId: string, playerId: string, movementAction: MovementAction) {
        const battle = this.battles.get(roomId);
        if (!battle || battle.gameState !== 'active') return;

        const player = battle.players[playerId];
        if (!player) return;

        // Update player position and state
        player.position = movementAction.position;
        player.state = movementAction.state;
        player.lastActionTime = Date.now();

        // Broadcast movement to other players
        this.io.to(roomId).emit("player-movement", {
            playerId,
            position: player.position,
            state: player.state,
            timestamp: movementAction.timestamp
        });
    }

    handlePlayerStateChange(roomId: string, playerId: string, newState: PlayerState['state']) {
        const battle = this.battles.get(roomId);
        if (!battle || battle.gameState !== 'active') return;

        const player = battle.players[playerId];
        if (!player) return;

        const oldState = player.state;
        player.state = newState;
        player.lastActionTime = Date.now();

        // Broadcast state change to other players
        this.io.to(roomId).emit("player-state-change", {
            playerId,
            oldState,
            newState,
            position: player.position
        });
    }

    syncPlayerPosition(roomId: string, playerId: string, position: PlayerPosition) {
        const battle = this.battles.get(roomId);
        if (!battle) return;

        const player = battle.players[playerId];
        if (!player) return;

        player.position = position;
        
        // Broadcast position update to other players in the room
        this.io.to(roomId).emit("position-sync", {
            playerId,
            position
        });
    }

    handlePlayerStateUpdate(roomId: string, playerId: string, playerState: any) {
        const battle = this.battles.get(roomId);
        if (!battle || !battle.players[playerId]) {
            return;
        }

        // Update the player's state in the battle
        battle.players[playerId].position = playerState.position;
        battle.players[playerId].state = playerState.state;
        battle.players[playerId].lastActionTime = Date.now();

        // Broadcast the state update to other players in the room
        this.io.to(roomId).emit("remote-player-state", {
            ...playerState,
            timestamp: Date.now()
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
                hp: p.hp,
                maxHp: p.maxHp,
                position: p.position,
                state: p.state,
                lastActionTime: p.lastActionTime
            })),
        };
    }
}
