# Enhanced Battle System - Real-Time Synchronized Player Actions with Server-Side Map Management

This enhanced battle system provides real-time synchronization of player states, positions, and attacks between clients in a **real-time 1v1 PvP multiplayer** environment. The server now handles map selection to ensure both players fight on the same battlefield.

## ✅ **New Feature: Server-Side Map Management**

### **Map Synchronization**
- **Server-controlled map selection**: RoomService randomly selects a map for each battle room
- **Synchronized map loading**: Both players receive the same map configuration
- **Available maps**: Forest, Philippines, Japan, France (matching client-side MapManager)
- **Spawn point coordination**: Server provides exact spawn positions for each player

### **How It Works**
1. **Room Creation**: When a match is found, RoomService randomly selects a map
2. **Map Broadcast**: Server sends `map-selected` event with map config and spawn points
3. **Client Setup**: ArenaScene waits for server map selection instead of random selection
4. **Synchronized Start**: Both players load the same map and spawn at designated positions

## Features

### ✅ **Synchronized Player States**
- Real-time position synchronization
- State management (idle, walking, jumping, attacking, etc.)
- **Real-time combat** - no turns, immediate action
- Health and damage tracking

### ✅ **Attack System**
- Validates attack range server-side
- Prevents attack spam with cooldowns (300ms between attacks)
- Triggers animations on both clients
- Supports different attack types (light/heavy)
- **Instant attack feedback** - no waiting for turns

### ✅ **Movement Synchronization**
- Smooth position interpolation
- Velocity tracking
- Facing direction sync
- Optimized network traffic

### ✅ **Animation Triggers**
- Automatic animation playback on attack
- Hurt animations and effects
- State-based animation transitions
- **Immediate visual feedback** for real-time combat

## Server-Side Components

### Enhanced RoomService with Map Management
```typescript
// Server randomly selects map for each room
createRoom(p1: string, p2: string): string {
    const selectedMap = this.selectRandomMap();
    const roomData: RoomData = {
        players: new Set([p1, p2]),
        mapConfig: selectedMap,
        createdAt: Date.now(),
        gameState: 'waiting'
    };
    
    // Notify players about selected map
    this.io.to(roomId).emit("map-selected", {
        roomId,
        mapConfig: selectedMap,
        players: [p1, p2]
    });
}
```

### Available Maps
The server includes all client-side maps:
- **Forest** (`newMap` background, `in-match` music)
- **Philippines** (`Philippines` background, `PH-BG` music)  
- **Japan** (`Japan` background, `JPN-BG` music)
- **France** (`France` background, `FRN-BG` music)

### Enhanced BattleService
```typescript
// Uses map spawn points from RoomService
startBattle(roomId: string, p1: string, p2: string) {
    const mapConfig = this.roomService.getRoomMapConfig(roomId);
    
    const state: BattleState = {
        roomId,
        gameState: 'active',
        players: {
            [p1]: { 
                socketId: p1, 
                position: { 
                    x: mapConfig.spawnPoints.player1.x, 
                    y: mapConfig.spawnPoints.player1.y, 
                    facing: 'right' 
                },
                // ... other player state
            },
            [p2]: { 
                socketId: p2, 
                position: { 
                    x: mapConfig.spawnPoints.player2.x, 
                    y: mapConfig.spawnPoints.player2.y, 
                    facing: 'left' 
                },
                // ... other player state
            }
        }
    };
}
```

### Socket Events
The server now emits:
- `map-selected` - Map configuration with spawn points (sent when room is created)
- `player-attack` - Attack actions with damage, range, animation (real-time)
- `player-movement` - Position and state updates (continuous)
- `player-state-change` - State transitions (immediate)
- `position-sync` - Position synchronization (optimized)
- `battle-start` - Battle initialization with map data

## Client-Side Components

### Enhanced ArenaScene
```typescript
create(): void {
    // Wait for server map selection instead of random selection
    console.log("Arena scene created, waiting for server map selection...");
    this.setupNetworkListeners();
}

private setupNetworkListeners(): void {
    battleSocketClient.onMapSelected((data: MapSelectedData) => {
        this.handleServerMapSelection(data);
    });
}

private handleServerMapSelection(data: MapSelectedData): void {
    // Convert server map config to client format
    const clientMapConfig = this.convertServerMapToClientMap(data.mapConfig);
    this.currentMapConfig = clientMapConfig;
    
    // Set up the map
    this.mapManager.setupMap(this, clientMapConfig);
    
    // Create players at server-designated spawn points
    this.createPlayersFromServerData(data);
}
```

### Enhanced BattleSocketClient
```typescript
// New map selection handling
socket.on("map-selected", (data: MapSelectedData) => {
    console.log("Map selected by server:", data);
    this.onMapSelected?.(data);
});

// Registration method
onMapSelected(callback: (data: MapSelectedData) => void) {
    this.onMapSelected = callback;
}
```

## Integration Steps

### 1. Server Setup
```typescript
// Enhanced room service with map management
const matchmaking = new MatchmakingService(io);
const roomService = matchmaking.getRoomService();
const battleService = new BattleService(io, roomService);

// Map selection happens automatically when room is created
```

### 2. Client Integration  
```typescript
// In your ArenaScene
import { battleSocketClient, MapSelectedData } from '../../shared-utils/BattleSocketClient';

create() {
    // Remove random map selection
    // this.currentMapConfig = this.mapManager.getRandomMapConfig(); // ❌ REMOVE THIS
    
    // Wait for server map selection
    this.setupNetworkListeners(); // ✅ ADD THIS
}

private setupNetworkListeners() {
    battleSocketClient.onMapSelected((data: MapSelectedData) => {
        this.handleServerMapSelection(data);
    });
}
```

### 3. Map Configuration Sync
```typescript
private convertServerMapToClientMap(serverMap: ServerMapConfig): MapConfig {
    return {
        name: serverMap.name,
        backgroundKey: serverMap.backgroundImage,
        musicKey: serverMap.backgroundMusic || 'in-match'
    };
}
```

## Battle Flow

### 1. **Matchmaking**
- Players join matchmaking queue
- Server pairs two players
- RoomService creates room and randomly selects map

### 2. **Map Selection & Sync**
- Server emits `map-selected` with map config and spawn points
- Both clients receive same map data
- Clients load identical map and spawn players at designated positions

### 3. **Real-Time Battle**
- Players attack and move in real-time (no turns)
- Server validates all actions and broadcasts to opponent
- Animations trigger automatically on both clients
- Battle continues until one player's HP reaches 0

### 4. **Battle End**
- Server declares winner and cleans up room
- Clients transition to victory/defeat screens

## Key Benefits

1. **Synchronized Maps**: Both players always fight on the same battlefield
2. **Server Authority**: All actions validated server-side prevents cheating
3. **Real-Time Combat**: No turn-based delays, immediate action and feedback
4. **Smooth Synchronization**: Optimized network traffic with interpolation
5. **Animation Sync**: Perfect timing of attack/hurt animations across clients
6. **Disconnect Handling**: Graceful handling of player disconnections
7. **Consistent Spawn Points**: Players spawn at balanced positions

## Configuration

### Map Spawn Points
Each map defines spawn points for balanced gameplay:
```typescript
spawnPoints: {
    player1: { x: 200, y: 400 }, // Left side
    player2: { x: 600, y: 400 }  // Right side
}
```

### Attack System
- **Light Attack**: 15 damage, 80 range, 300ms cooldown
- **Heavy Attack**: 30 damage, 120 range, longer cooldown
- **Range Validation**: Server checks distance between players
- **Animation Sync**: Both clients play attack/hurt animations

The enhanced system ensures perfectly synchronized real-time multiplayer battles with server-authoritative map selection and gameplay validation!

## Features

### ✅ **Synchronized Player States**
- Real-time position synchronization
- State management (idle, walking, jumping, attacking, etc.)
- **Real-time combat** - no turns, immediate action
- Health and damage tracking

### ✅ **Attack System**
- Validates attack range server-side
- Prevents attack spam with cooldowns (300ms between attacks)
- Triggers animations on both clients
- Supports different attack types (light/heavy)
- **Instant attack feedback** - no waiting for turns

### ✅ **Movement Synchronization**
- Smooth position interpolation
- Velocity tracking
- Facing direction sync
- Optimized network traffic

### ✅ **Animation Triggers**
- Automatic animation playback on attack
- Hurt animations and effects
- State-based animation transitions
- **Immediate visual feedback** for real-time combat

## Server-Side Components

### BattleService
Enhanced battle service that handles:
```typescript
// Attack handling with range validation
handleAttack(roomId: string, attackerId: string, attackAction: AttackAction)

// Player movement synchronization
handlePlayerMovement(roomId: string, playerId: string, movementAction: MovementAction)

// State change handling
handlePlayerStateChange(roomId: string, playerId: string, newState: PlayerState['state'])

// Position synchronization
syncPlayerPosition(roomId: string, playerId: string, position: PlayerPosition)
```

### Socket Events
The server listens for these events:
- `player-attack` - Attack actions with damage, range, animation (real-time)
- `player-movement` - Position and state updates (continuous)
- `player-state-change` - State transitions (immediate)
- `position-sync` - Position synchronization (optimized)
- `start-battle` - Battle initialization

## Client-Side Components

### BattleSocketClient
Handles all battle-related socket communication:
```typescript
import { battleSocketClient } from './shared-utils/BattleSocketClient';

// Send an attack to the server
battleSocketClient.sendAttack('light', 15, 80, position, 'light-attack');

// Send movement update
battleSocketClient.sendMovement(position, 'walking');

// Listen for events
battleSocketClient.onAttack((attackData) => {
    // Play attack animation
});
```

### ArenaBattleIntegration
Integrates the socket client with your Phaser ArenaScene:
```typescript
import { ArenaBattleIntegration } from './scenes/arena/ArenaBattleIntegration';

// In your ArenaScene
const battleIntegration = new ArenaBattleIntegration(this, localPlayerId);
```

### NetworkedAttackCommands
Enhanced attack commands that sync with the server:
```typescript
import { NetworkedLightAttackCommand } from './commands/NetworkedAttackCommands';

// Use instead of regular attack commands for networked play
const networkAttackCommand = new NetworkedLightAttackCommand();
```

### NetworkedInputHandler
Optimized input handling for multiplayer:
```typescript
import { NetworkedInputHandler } from './input/NetworkedInputHandler';

const inputHandler = new NetworkedInputHandler(scene);
inputHandler.onPlayerMove(sprite, 'walking');
```

## Usage Example

### 1. Server Setup
```typescript
// In your socket server
import { BattleService } from './services/battle/BattleService';

const battleService = new BattleService(io);

// Handle battle events
socket.on("player-attack", (data) => {
    const roomId = getPlayerRoom(socket.id);
    battleService.handleAttack(roomId, socket.id, data);
});
```

### 2. Client Integration
```typescript
// In your ArenaScene
export default class Arena extends Phaser.Scene {
    private battleIntegration?: ArenaBattleIntegration;

    create() {
        // ... existing scene setup ...

        // Initialize battle integration
        this.battleIntegration = new ArenaBattleIntegration(this, localPlayerId);
    }
}
```

### 3. Player Attack
```typescript
// In your PlayerManager
import { NetworkedLightAttackCommand } from './commands/NetworkedAttackCommands';

// Replace regular attack commands
this.lightAttackCommand = new NetworkedLightAttackCommand();

// When player attacks in real-time, it will automatically:
// 1. Send attack data to server immediately
// 2. Validate range and timing server-side
// 3. Broadcast to other players instantly
// 4. Trigger animations on all clients
// 5. Apply damage with visual feedback
```

### 4. Movement Sync
```typescript
// In your player update loop
const inputHandler = new NetworkedInputHandler(this.scene);

update() {
    // ... existing update logic ...
    
    // Sync movement when player moves
    if (this.playerMoved) {
        inputHandler.onPlayerMove(this.playerSprite, this.currentState);
    }
}
```

## Socket Events Reference

### Client → Server
- `player-attack`: `{ attackType, damage, range, position, animation }`
- `player-movement`: `{ position, state, timestamp }`
- `player-state-change`: `{ newState }`
- `position-sync`: `{ position }`
- `start-battle`: `{}`

### Server → Client
- `battle-start`: `BattleState`
- `battle-update`: `BattleState`
- `battle-end`: `{ winner, reason?, finalState }`
- `player-attack`: `AttackData` (immediate animation trigger)
- `player-movement`: `MovementData` (real-time position sync)
- `player-state-change`: `StateChangeData`
- `position-sync`: `PositionData`
- `attack-missed`: `{ attackerId, reason, distance, maxRange }`

## Key Benefits

1. **Server Authority**: All actions are validated server-side
2. **Smooth Synchronization**: Optimized network traffic with interpolation
3. **Animation Sync**: Automatic animation triggers on all clients
4. **Real-Time Combat**: Immediate attack feedback and response
5. **Disconnect Handling**: Graceful handling of player disconnections
6. **Attack Validation**: Range checking and cooldown enforcement (300ms)
7. **No Turn Waiting**: Pure real-time 1v1 PvP experience

## Integration Steps

1. **Replace BattleService**: Use the enhanced version in your socket server
2. **Update Socket Events**: Add the new event handlers to your server
3. **Install Client Components**: Add BattleSocketClient and integration classes
4. **Modify Player Commands**: Use networked versions of attack commands
5. **Add Input Handling**: Integrate NetworkedInputHandler for movement sync
6. **Initialize Battle Integration**: Set up ArenaBattleIntegration in your scene

The system is designed to be modular and can be integrated gradually into your existing codebase.
