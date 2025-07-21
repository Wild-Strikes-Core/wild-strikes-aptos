# Multiplayer Integration Tasks

| TASK | DESCRIPTION | FILES & FUNCTIONS | STATUS |
|------|-------------|-------------------|--------|
| **🔌 Socket Connection Setup** | Set up Socket.IO connection and basic networking infrastructure in new Arena scene. | **Files:** `packages/phaser-games/wildstrikes/src/scenes/arena/ArenaScene.ts`, potentially create `src/networking/SocketManager.ts`<br>**Functions:** `create()`, `preload()`<br>**Steps:** 1. Import socket.io-client 2. Create socket connection: `this.socket = io('ws://localhost:3001')` 3. Set up connection handlers 4. Initialize networking in `create()` | ⏳ |
| **🎮 Matchmaking Integration** | Connect new Arena scene to existing matchmaking system and handle scene transitions. | **Files:** `packages/phaser-games/wildstrikes/src/scenes/MatchmakingScene.ts`, `ArenaScene.ts`<br>**Functions:** `goToMatchFound()`, `create()`<br>**Steps:** 1. Replace simulated match with real socket events 2. Listen for `matchmaking:found` event 3. Handle `match:start` event 4. Pass room data to Arena scene 5. Implement `player:ready` emission | ⏳ |
| **👥 Player State Synchronization** | Sync player positions, animations, and states between clients using existing backend. | **Files:** `packages/phaser-games/wildstrikes/src/scenes/arena/ArenaScene.ts`, `PlayerManager.ts`<br>**Functions:** `update()`, `handleMove()`, `broadcastPlayerState()`<br>**Steps:** 1. Emit `player:move` events: `{x, y, velocityX, velocityY, flipX, anim}` 2. Listen for `player:position` events 3. Update opponent player from received data 4. Implement client-side prediction 5. Handle server reconciliation | ⏳ |
| **⚔️ Combat Synchronization** | Sync attack events, hit detection, and damage between players. | **Files:** `packages/phaser-games/wildstrikes/src/scenes/arena/PlayerManager.ts`, potentially create `src/combat/CombatManager.ts`<br>**Functions:** `handleLightAttack()`, `handleHeavyAttack()`, `handlePlayerAttacked()`<br>**Steps:** 1. Emit `player:attack` events: `{type: 'light'/'heavy', x, y}` 2. Listen for `player:attack` events from opponent 3. Play attack animations on opponent 4. Implement hit detection validation 5. Handle damage calculation | ⏳ |
| **🏠 Room Management** | Handle room joining, player spawning, and initial game state setup. | **Files:** `packages/phaser-games/wildstrikes/src/scenes/arena/ArenaScene.ts`<br>**Functions:** `create()`, `handlePlayersConnected()`, `spawnPlayers()`<br>**Steps:** 1. Listen for `players:connected` event 2. Extract player1/player2 spawn positions 3. Create local player and opponent sprites 4. Set up player IDs and roles (player1 vs player2) 5. Initialize camera follow for local player only | ⏳ |
| **🔄 Reconnection System** | Implement reconnection handling for dropped connections during matches. | **Files:** `packages/phaser-games/wildstrikes/src/scenes/arena/ArenaScene.ts`, potentially create `src/networking/ReconnectionManager.ts`<br>**Functions:** `handlePlayerDisconnected()`, `handlePlayerReconnected()`, `handleReconnection()`<br>**Steps:** 1. Listen for `player:disconnected` events 2. Show reconnection UI to remaining player 3. Listen for `player:reconnected` events 4. Handle buffered events replay 5. Emit `player:ready` on reconnection | ⏳ |
| **🎯 Hit Detection & Health** | Implement client-side hit detection with server validation and health management. | **Files:** Create `packages/phaser-games/wildstrikes/src/combat/HitDetection.ts`, `PlayerManager.ts`<br>**Functions:** `checkHitCollision()`, `takeDamage()`, `validateHit()`<br>**Steps:** 1. Implement local hit detection using Phaser physics 2. Send hit events to server for validation 3. Listen for validated `player:hit` events 4. Update health bars and visual feedback 5. Trigger death animations when health reaches 0 | ⏳ |
| **⏱️ Game Timer & Match End** | Sync match timer and handle various match end conditions. | **Files:** `packages/phaser-games/wildstrikes/src/scenes/arena/ArenaScene.ts`, potentially create `src/ui/MatchTimer.ts`<br>**Functions:** `handleTimerUpdate()`, `handleMatchEnded()`, `endMatch()`<br>**Steps:** 1. Listen for `timer:update` events from server 2. Update match timer UI 3. Listen for `match:ended` events 4. Handle different end reasons (win, timeout, disconnect) 5. Transition to appropriate end screen | ⏳ |
| **📊 Game State Management** | Centralized game state management for multiplayer synchronization. | **Files:** Create `packages/phaser-games/wildstrikes/src/state/GameStateManager.ts`<br>**Functions:** `updateLocalState()`, `updateOpponentState()`, `reconcileState()`<br>**Steps:** 1. Create central state store for both players 2. Implement state updates from network events 3. Handle lag compensation 4. Implement rollback for mispredictions 5. Maintain authoritative server state | ⏳ |
| **🎮 Input Prediction & Lag Compensation** | Implement client-side prediction to handle network latency smoothly. | **Files:** Create `packages/phaser-games/wildstrikes/src/networking/PredictionManager.ts`, `PlayerManager.ts`<br>**Functions:** `predictMovement()`, `reconcileInputs()`, `bufferInputs()`<br>**Steps:** 1. Buffer local inputs with timestamps 2. Apply inputs immediately for local player 3. Store inputs for server reconciliation 4. Rollback and replay on server correction 5. Interpolate opponent movements | ⏳ |
| **🗺️ Map Synchronization** | Ensure both players load the same map and environment setup. | **Files:** `packages/phaser-games/wildstrikes/src/scenes/arena/ArenaScene.ts`, `MapManager.ts`<br>**Functions:** `handlePlayersConnected()`, `setupMap()`<br>**Steps:** 1. Receive map selection from `players:connected` event 2. Load specified map instead of random 3. Sync map-specific elements (platforms, boundaries) 4. Ensure identical collision setup 5. Handle map-specific spawn points | ⏳ |
| **💀 Death & Respawn System** | Handle player death, death animations, and respawn mechanics. | **Files:** `packages/phaser-games/wildstrikes/src/scenes/arena/PlayerManager.ts`, `ArenaScene.ts`<br>**Functions:** `die()`, `respawn()`, `handlePlayerDeath()`<br>**Steps:** 1. Detect when player health reaches 0 2. Trigger death animation and disable controls 3. Emit `player:death` event to server 4. Handle respawn timer and countdown 5. Reset player state on respawn | ⏳ |
| **🎊 Victory & Match Results** | Handle match victory conditions and result displays. | **Files:** `packages/phaser-games/wildstrikes/src/scenes/arena/ArenaScene.ts`, create victory/defeat scenes<br>**Functions:** `handleMatchEnded()`, `showResults()`<br>**Steps:** 1. Listen for `match:ended` events 2. Determine local player win/loss 3. Show appropriate victory/defeat animation 4. Display match statistics 5. Provide options for rematch or return to menu | ⏳ |
| **📱 Mobile Multiplayer Controls** | Ensure mobile controls work properly in multiplayer environment. | **Files:** `packages/phaser-games/wildstrikes/src/scenes/arena/ArenaScene.ts`<br>**Functions:** `setupMobileControls()`, `handleMobileInput()`<br>**Steps:** 1. Test mobile controls with network events 2. Ensure touch events emit proper movement data 3. Optimize for mobile network conditions 4. Add mobile-specific UI elements 5. Handle mobile reconnection scenarios | ⏳ |

---

## 📋 Implementation Notes

### 🔧 Key Integration Points

1. **Backend API Compatibility**: The backend is already set up with all necessary socket events. Frontend needs to match the exact event names and data structures.

2. **Event Structure**: All events follow the pattern established in the backend:
   - `player:move` → `player:position` (broadcast to others)
   - `player:attack` → `player:attack` (broadcast with attacker info)
   - `player:ready` → triggers game start when both ready

3. **State Synchronization**: The backend maintains authoritative state with the `PlayerState` interface:
   ```typescript
   {
     id: string,
     x: number,
     y: number, 
     velocityX: number,
     velocityY: number,
     health: number,
     flipX: boolean,
     anim: string,
     lastProcessedTick: number
   }
   ```

### 🌐 Network Architecture

- **Client-Side Prediction**: Apply movements immediately, reconcile with server
- **Server Authority**: Server validates all actions and maintains canonical state  
- **Event Buffering**: Disconnected players receive buffered events on reconnection
- **Room-Based**: All communication happens within room context

### 📡 Socket Events Reference

#### Client → Server
- `matchmaking:find` - Join matchmaking queue
- `player:move` - Send movement data
- `player:attack` - Send attack data  
- `player:ready` - Signal ready to start
- `player:win` / `player:leave` - End match conditions

#### Server → Client  
- `matchmaking:found` - Match found with room info
- `match:start` - Game started
- `players:connected` - Initial game state
- `player:position` - Opponent movement
- `player:attack` - Opponent attacks
- `player:disconnected` / `player:reconnected` - Connection events
- `match:ended` - Game over

### 🔄 Migration Strategy

1. **Phase 1**: Basic connection and matchmaking
2. **Phase 2**: Movement synchronization 
3. **Phase 3**: Combat and health systems
4. **Phase 4**: Advanced features (reconnection, prediction)
5. **Phase 5**: Polish and mobile optimization

### 🚦 Dependencies

- **Frontend Movement Complete**: All movement mechanics must be finished before multiplayer integration
- **Backend Running**: Ensure backend server is running on localhost:3001
- **Socket.IO Client**: Install and configure socket.io-client package

---

## 📊 Status Legend
- ⏳ **Pending** - Not started, waiting for movement completion
- 🚧 **In Progress** - Currently being worked on  
- ✅ **Complete** - Finished and tested
- ❌ **Blocked** - Waiting for dependencies
- 🔄 **Testing** - Implementation done, testing multiplayer scenarios
