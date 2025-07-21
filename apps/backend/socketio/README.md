# 🎮 Wild Strikes Backend

A real-time multiplayer game backend built with Node.js, Express, and Socket.IO for the Wild Strikes fighting game.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Socket.IO Events](#socketio-events)
- [Services](#services)
- [Models](#models)
- [Testing](#testing)
- [Future Steps](#future-steps)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

The backend follows a modular architecture with clear separation of concerns:

```
src/
├── config/          # Middleware and configuration
├── constants/       # Global state and constants
├── controllers/     # Business logic handlers
├── models/          # Data models and room management
├── services/        # Core services (matchmaking, reconnection, etc.)
├── sockets/         # Socket.IO event handlers
├── types/           # TypeScript type definitions
└── index.ts         # Main server entry point
```

### Key Components:

- **Express Server**: HTTP server with middleware setup
- **Socket.IO**: Real-time bidirectional communication
- **Matchmaking Service**: Queue management and player pairing
- **Room Service**: Game room creation and management
- **Reconnection Service**: Graceful disconnection handling
- **Match End Service**: Match completion and cleanup

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Navigate to backend directory
cd apps/backend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The server will start on `http://localhost:3001`

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3001
NODE_ENV=development
```

## 🔌 API Endpoints

### Health Check
- `GET /` - Test page with matchmaking interface
- `GET /debug` - Server status and debugging information

### Debug Information

The `/debug` endpoint returns:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "queue": {
    "size": 2,
    "players": ["socket-id-1", "socket-id-2"]
  },
  "rooms": [
    {
      "roomId": "room-abc1-def2",
      "playerCount": 2,
      "players": ["socket-id-1", "socket-id-2"]
    }
  ],
  "disconnectedPlayers": [
    {
      "playerId": "socket-id-3",
      "roomId": "room-abc1-def2",
      "disconnectTime": 1704067200000,
      "timeUntilExpiry": 25000,
      "bufferedEventsCount": 5
    }
  ],
  "matchEndStats": {
    "totalMatchesEnded": 0,
    "lastMatchEnd": null,
    "commonEndReasons": {}
  },
  "totalConnections": 5
}
```

## 🔄 Socket.IO Events

### Client → Server Events

#### Matchmaking
```typescript
// Join matchmaking queue
socket.emit('matchmaking:find');

// Cancel matchmaking
socket.emit('matchmaking:cancel');
```

#### Game Events
```typescript
// Send player movement
socket.emit('player:move', {
  x: number,
  y: number,
  velocityX: number,
  velocityY: number,
  flipX: boolean,
  anim: string
});

// Send player attack
socket.emit('player:attack', {
  type: 'light' | 'heavy',
  x: number,
  y: number
});

// Signal player ready
socket.emit('player:ready', {
  playerId: string
});

// Declare player win
socket.emit('player:win', {
  winnerId: string,
  loserId: string
});

// Player leaves match
socket.emit('player:leave');
```

### Server → Client Events

#### Matchmaking
```typescript
// Match found
socket.on('matchmaking:found', (data: {
  roomId: string;
  opponentId: string;
}) => {
  // Handle match found
});

// Match started
socket.on('match:start', (data: {
  roomId: string;
}) => {
  // Handle match start
});
```

#### Game Events
```typescript
// Opponent position update
socket.on('player:position', (data: {
  playerId: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  flipX: boolean;
  anim: string;
}) => {
  // Update opponent position
});

// Opponent attack
socket.on('player:attack', (data: {
  attackerId: string;
  type: string;
  x: number;
  y: number;
}) => {
  // Handle opponent attack
});

// Players connected to room
socket.on('players:connected', (data: {
  player1: PlayerState;
  player2: PlayerState;
  selectedMap: string;
}) => {
  // Initialize both players
});
```

#### Connection Events
```typescript
// Opponent disconnected
socket.on('player:disconnected', (data: {
  playerId: string;
  reconnectionWindow: number;
}) => {
  // Show reconnection message
});

// Opponent reconnected
socket.on('player:reconnected', (data: {
  playerId: string;
}) => {
  // Hide reconnection message
});

// Opponent permanently disconnected
socket.on('player:permanently_disconnected', (data: {
  playerId: string;
}) => {
  // Handle permanent disconnect
});

// Match ended
socket.on('match:ended', (data: {
  roomId: string;
  reason: 'player_win' | 'opponent_disconnected' | 'player_left' | 'timeout' | 'draw';
  winnerId?: string;
  loserId?: string;
  message: string;
}) => {
  // Show match end screen
});
```

## 🛠️ Services

### Matchmaking Service (`services/matchmakingService.ts`)

Manages the matchmaking queue and player pairing:

- **`findMatch(io, socket)`**: Adds player to queue and creates matches when 2 players are available
- **`cancelMatch(socket)`**: Removes player from queue
- **`getQueueStatus()`**: Returns current queue status for debugging

### Room Service (`services/roomService.ts`)

Handles game room creation and management:

- **`createRoom(player1, player2)`**: Creates a new game room with two players
- **`getRoomBySocketId(socketId)`**: Finds room containing a specific player
- **`removeRoom(roomId)`**: Removes and cleans up a room
- **`getAllRoomsStatus()`**: Returns status of all rooms for debugging

### Reconnection Service (`services/reconnectionService.ts`)

Manages graceful disconnections and reconnections:

- **`handlePlayerDisconnect(socket, roomId)`**: Starts reconnection window for disconnected player
- **`handlePlayerReconnect(socket, roomId)`**: Handles successful reconnection
- **`bufferEventForDisconnectedPlayer(playerId, event, data)`**: Buffers events for disconnected players
- **`isPlayerDisconnected(playerId)`**: Checks if player is in reconnection window

**Features:**
- 30-second reconnection window
- Event buffering during disconnection
- Automatic cleanup of expired disconnections
- Immediate match end if both players disconnect

### Match End Service (`services/matchEndService.ts`)

Handles match completion scenarios:

- **`endMatch(io, roomId, reason, winnerId?, loserId?)`**: Ends match and cleans up
- **`handlePlayerWin(io, roomId, winnerId, loserId)`**: Handles player victory
- **`handleOpponentDisconnected(io, roomId, disconnectedPlayerId)`**: Handles opponent disconnect
- **`handleBothPlayersDisconnected(io, roomId)`**: Handles both players disconnecting

**Match End Reasons:**
- `player_win`: Normal victory
- `opponent_disconnected`: Opponent failed to reconnect
- `player_left`: Player manually left
- `timeout`: Match timeout
- `draw`: Match ended in draw

## 📊 Models

### GameRoom (`models/Room.ts`)

Manages individual game rooms:

```typescript
interface PlayerState {
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

class GameRoom {
  id: string;
  players: Map<string, Socket>;
  playerStates: Map<string, PlayerState>;
  gameStarted: boolean;
  
  // Methods for player management, broadcasting, game state
}
```

## 🧪 Testing

### Manual Testing

1. **Start the server:**
   ```bash
   pnpm dev
   ```

2. **Open multiple browser tabs** to `http://localhost:3001`

3. **Watch terminal logs** for matchmaking and game events

4. **Test scenarios:**
   - Normal matchmaking (2+ tabs)
   - Player disconnection/reconnection
   - Match end conditions
   - Both players disconnecting

### Debug Endpoint

Visit `http://localhost:3001/debug` for real-time server status.

## 🚀 Future Steps

### Phase 1: Core Game Integration

1. **Phaser Client Integration**
   - Replace test HTML page with Phaser game
   - Implement socket event handlers in Phaser scenes
   - Add player sprite synchronization
   - Implement attack animations and hit detection

2. **Game State Synchronization**
   - Add game loop synchronization
   - Implement player health tracking
   - Add collision detection server-side
   - Synchronize game timers and match duration

### Phase 2: Enhanced Features

3. **Player Authentication**
   - Add user registration/login system
   - Implement player profiles and statistics
   - Add persistent player data storage
   - Implement session management

4. **Advanced Matchmaking**
   - Add skill-based matchmaking
   - Implement custom game rooms
   - Add tournament system
   - Support for different game modes

5. **Game Mechanics**
   - Add character selection system
   - Implement different character abilities
   - Add power-ups and special moves
   - Implement combo system

### Phase 3: Production Features

6. **Database Integration**
   - Add PostgreSQL/MongoDB for persistent data
   - Implement player statistics tracking
   - Add match history and replays
   - Store leaderboards and rankings

7. **Scalability**
   - Implement Redis for session management
   - Add load balancing for multiple server instances
   - Implement horizontal scaling
   - Add monitoring and logging

8. **Security & Performance**
   - Add rate limiting and DDoS protection
   - Implement input validation and anti-cheat
   - Add SSL/TLS encryption
   - Optimize network performance

### Phase 4: Advanced Features

9. **Social Features**
   - Add friend system
   - Implement chat functionality
   - Add spectator mode
   - Create guild/clan system

10. **Monetization**
    - Add cosmetic items and skins
    - Implement battle pass system
    - Add premium features
    - Create marketplace for trading

## 🔧 Troubleshooting

### Common Issues

1. **Socket connection fails**
   - Check if server is running on port 3001
   - Verify CORS settings in middleware
   - Check browser console for errors

2. **Matchmaking not working**
   - Ensure at least 2 browser tabs are open
   - Check terminal logs for queue status
   - Verify socket events are being emitted

3. **Players not syncing**
   - Check if both players are in the same room
   - Verify position data format
   - Check for network connectivity issues

4. **Reconnection not working**
   - Verify reconnection window timing (30 seconds)
   - Check if both players disconnect simultaneously
   - Review terminal logs for reconnection events

### Debug Commands

```bash
# Check server status
curl http://localhost:3001/debug

# Monitor server logs
tail -f logs/server.log

# Check for memory leaks
node --inspect src/index.ts
```

### Performance Monitoring

- Monitor active connections: `io.engine.clientsCount`
- Track room count: `rooms.size`
- Monitor queue size: `matchmakingQueue.size`
- Check disconnected players: `disconnectedPlayers.size`

## 📝 Development Guidelines

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Add JSDoc comments for public methods
- Use meaningful variable and function names

### Error Handling
- Always handle socket disconnections gracefully
- Validate input data before processing
- Log errors with context information
- Implement proper cleanup for resources

### Testing Strategy
- Test with multiple concurrent connections
- Verify reconnection scenarios
- Test edge cases (both players disconnecting)
- Monitor memory usage during extended sessions

---

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation for API changes
4. Test thoroughly before submitting

## 📄 License

This project is part of the Wild Strikes game development. 