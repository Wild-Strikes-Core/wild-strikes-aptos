# ArenaScene ↔ WildStrikes Socket.IO Backend Communication Flow

This document outlines the complete communication flow between the Phaser.js ArenaScene and the Socket.IO backend server for real-time multiplayer battles.

## Architecture Overview

```
┌─────────────────┐    WebSocket    ┌─────────────────────┐
│   ArenaScene    │ ◄─────────────► │  Socket.IO Server   │
│   (Phaser.js)   │                 │   (Node.js)         │
└─────────────────┘                 └─────────────────────┘
         │                                    │
         │                                    │
    ┌────▼────┐                         ┌────▼────┐
    │Network  │                         │Battle   │
    │State    │                         │Service  │
    │Manager  │                         │         │
    └─────────┘                         └─────────┘
```

## Communication Flow

### 1. Initial Connection & Matchmaking

#### Client → Server
```typescript
// ArenaScene connects to socket server
battleSocketClient.connect();

// Join matchmaking queue with player data
socket.emit("join-matchmaking", playerData: string[]);
```

#### Server → Client
```typescript
// Server finds match and sends map selection
socket.emit("map-selected", {
    roomId: string,
    mapConfig: MapConfig,
    players: Array<{
        socketId: string,
        spawnPosition: { x: number; y: number }
    }>
});

// Server confirms match found
socket.emit("match-found", {
    roomId: string,
    opponentId: string,
    mapConfig: MapConfig
});
```

### 2. Battle Initialization

#### Client → Server
```typescript
// Client signals ready to start battle
socket.emit("start-battle");
```

#### Server → Client
```typescript
// Server starts battle and sends initial state
socket.emit("battle-start", {
    roomId: string,
    gameState: 'active',
    startTime: number,
    players: {
        [socketId]: {
            socketId: string,
            hp: number,
            maxHp: number,
            position: PlayerPosition,
            state: PlayerState,
            lastActionTime: number
        }
    },
    mapConfig: MapConfig
});
```

### 3. Real-Time Player State Synchronization

#### Client → Server (Continuous)
```typescript
// Player state updates (sent ~20fps)
socket.emit("player-state-update", {
    playerId: string,
    state: string, // 'idle', 'walking', 'jumping', etc.
    position: { x: number; y: number },
    velocity: { x: number; y: number },
    facing: 'left' | 'right',
    timestamp: number
});
```

#### Server → Client (Broadcast)
```typescript
// Server broadcasts remote player state to other players
socket.emit("remote-player-state", {
    playerId: string,
    state: string,
    position: { x: number; y: number },
    velocity: { x: number; y: number },
    facing: 'left' | 'right',
    timestamp: number
});
```

### 4. Attack Actions

#### Client → Server
```typescript
// Player performs attack
socket.emit("player-attack", {
    type: 'light' | 'heavy',
    damage: number,
    range: number,
    position: PlayerPosition,
    animation: string
});
```

#### Server → Client
```typescript
// Server validates and broadcasts attack
socket.emit("player-attack", {
    attackerId: string,
    defenderId: string,
    attackType: 'light' | 'heavy',
    damage: number,
    animation: string,
    attackerPosition: PlayerPosition,
    defenderPosition: PlayerPosition,
    defenderNewHp: number
});

// Or if attack misses
socket.emit("attack-missed", {
    attackerId: string,
    reason: 'out-of-range',
    distance: number,
    maxRange: number
});
```

### 5. Battle State Updates

#### Server → Client
```typescript
// Server broadcasts battle state changes
socket.emit("battle-update", {
    roomId: string,
    gameState: 'active' | 'ended',
    players: PlayerState[],
    startTime: number
});
```

### 6. Battle End

#### Server → Client
```typescript
// Server announces battle end
socket.emit("battle-end", {
    winner: string,
    reason?: string, // 'victory', 'opponent-disconnected'
    finalState: BattleState
});
```

### 7. Disconnection Handling

#### Client → Server
```typescript
// Client disconnects (automatic)
socket.disconnect();
```

#### Server → Client
```typescript
// Server handles opponent disconnect
socket.emit("opponent-disconnected");
socket.emit("battle-end", {
    winner: string,
    reason: 'opponent-disconnected',
    finalState: BattleState
});
```

## Data Structures

### MapConfig
```typescript
interface MapConfig {
    id: string;
    name: string;
    theme: string;
    spawnPoints: {
        player1: { x: number; y: number };
        player2: { x: number; y: number };
    };
    backgroundMusic?: string;
    backgroundImage: string;
    platforms?: Array<{ x: number; y: number; width: number; height: number }>;
    obstacles?: Array<{ x: number; y: number; width: number; height: number; type: string }>;
    mapBounds: { width: number; height: number };
}
```

### PlayerPosition
```typescript
type PlayerPosition = {
    x: number;
    y: number;
    velocityX?: number;
    velocityY?: number;
    facing?: 'left' | 'right';
};
```

### PlayerState
```typescript
type PlayerState = {
    socketId: string;
    hp: number;
    maxHp: number;
    position: PlayerPosition;
    state: 'idle' | 'walking' | 'jumping' | 'attacking-light' | 'attacking-heavy' | 'dashing' | 'crouching' | 'defeated';
    lastActionTime: number;
};
```

### AttackAction
```typescript
type AttackAction = {
    type: 'light' | 'heavy';
    damage: number;
    range: number;
    position: PlayerPosition;
    animation: string;
};
```

## Client-Side Implementation

### ArenaScene Integration

```typescript
// In ArenaScene.ts
export default class Arena extends Phaser.Scene {
    private networkStateManager: NetworkStateManager;
    
    create(): void {
        // Connect to socket server
        battleSocketClient.connect();
        
        // Initialize network state manager
        this.networkStateManager = new NetworkStateManager(this);
        
        // Set up local player
        const localPlayerManager = new PlayerManager(this, true);
        this.networkStateManager.setLocalPlayer(localPlayerManager);
    }
    
    update(): void {
        // Update network state manager (sends local state, updates remote players)
        this.networkStateManager.update();
    }
}
```

### NetworkStateManager

The `NetworkStateManager` handles all network communication:

```typescript
// Sends local player state to server
public sendLocalPlayerState(): void {
    const networkState: NetworkPlayerState = {
        playerId: battleSocketClient.getId(),
        state: currentState.constructor.name.replace('State', '').toLowerCase(),
        position: { x: playerSprite.x, y: playerSprite.y },
        velocity: { x: body.velocity.x, y: body.velocity.y },
        facing: playerSprite.flipX ? 'left' : 'right',
        timestamp: this.scene.time.now
    };
    
    battleSocketClient.emit('player-state-update', networkState);
}

// Handles remote player state updates
private handleRemotePlayerState(data: NetworkPlayerState): void {
    // Update remote player position, animation, and state
    this.updateRemotePlayerState(remotePlayer, data);
}
```

## Server-Side Implementation

### BattleService

The `BattleService` manages all battle-related logic:

```typescript
export class BattleService {
    private battles: Map<string, BattleState> = new Map();
    
    // Start a new battle
    startBattle(roomId: string, p1: string, p2: string): void {
        // Initialize battle state
        // Send battle-start event to all players
    }
    
    // Handle player state updates
    handlePlayerStateUpdate(roomId: string, playerId: string, playerState: any): void {
        // Update player state
        // Broadcast to other players
        this.io.to(roomId).emit("remote-player-state", playerState);
    }
    
    // Handle attack actions
    handleAttack(roomId: string, attackerId: string, attackAction: AttackAction): void {
        // Validate attack (range, cooldown)
        // Apply damage
        // Broadcast attack to all players
    }
}
```

### MatchmakingService

The `MatchmakingService` handles player matching:

```typescript
export class MatchmakingService {
    private queue: Map<string, string[]> = new Map();
    
    join(socketId: string, playerData: string[]): void {
        // Add player to queue
        // Attempt to find match
        this.attemptMatch();
    }
    
    private attemptMatch(): void {
        // Find two players
        // Create room
        // Send map-selected event
    }
}
```

## Socket Event Summary

### Client → Server Events
- `join-matchmaking` - Join matchmaking queue
- `leave-matchmaking` - Leave matchmaking queue
- `start-battle` - Signal ready to start battle
- `player-state-update` - Send player state (continuous)
- `player-attack` - Send attack action
- `disconnect` - Player disconnection

### Server → Client Events
- `map-selected` - Map and spawn positions assigned
- `match-found` - Match confirmed with opponent
- `battle-start` - Battle initialization
- `remote-player-state` - Remote player state updates
- `player-attack` - Attack broadcast
- `attack-missed` - Attack validation failed
- `battle-update` - Battle state changes
- `battle-end` - Battle completion
- `opponent-disconnected` - Opponent left

## Performance Considerations

### Client-Side Optimization
- **State Update Frequency**: ~20fps (50ms intervals) for smooth gameplay
- **Interpolation**: Remote players use interpolation for smooth movement
- **Buffer Management**: Limited buffer size (10 states) to prevent memory issues

### Server-Side Optimization
- **Attack Cooldown**: 300ms minimum between attacks to prevent spam
- **Range Validation**: Server-side attack range checking
- **Room Management**: Automatic cleanup of ended battles

## Error Handling

### Connection Issues
- Automatic reconnection attempts
- Graceful degradation when disconnected
- Opponent disconnect detection

### State Synchronization
- Timestamp-based state validation
- Interpolation for network latency compensation
- Fallback to idle state for invalid states

## Debugging

### Client Debug Logs
```typescript
// Enable debug mode in ArenaScene
private static readonly DEBUG_ENABLED = true;

// Network state manager logs
console.log(`📡 Sending state: ${networkState.state} @ (${networkState.position.x}, ${networkState.position.y})`);
console.log(`📥 Received remote state: ${data.state} @ (${data.position.x}, ${data.position.y}) from ${data.playerId}`);
```

### Server Debug Logs
```typescript
console.log(`⚔️ Battle started in room ${roomId} on map "${mapConfig.name}"`);
console.log(`Attack missed - out of range (${distance} > ${attackAction.range})`);
```

This communication flow ensures real-time, synchronized multiplayer battles with proper state management, attack validation, and error handling.
