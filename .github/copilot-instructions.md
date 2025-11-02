# Wild Strikes Aptos - AI Coding Agent Instructions

## Project Overview

**Wild Strikes** is a real-time multiplayer fighting game built on the Aptos blockchain. This monorepo contains a full-stack application with Phaser.js game engine, Socket.IO networking, and Aptos wallet integration.

### Architecture

- **Monorepo**: Turborepo with pnpm workspaces
- **Frontend**: Next.js 15 + React 19 + TailwindCSS 4 + Phaser 3
- **Backend**: Socket.IO server (port 3001) + NestJS API with Prisma/PostgreSQL
- **Game Engine**: Custom entity-component system with server-authoritative networking
- **Blockchain**: Aptos integration for wallets and match results

### Key Directories

```
apps/
├── web/                    # Next.js frontend + Phaser game
├── backend/
│   ├── wildstrikes-backend/  # NestJS API + Prisma DB
│   └── wildstrikes-socket/   # Socket.IO real-time server
packages/
├── phaser-games/wildstrikes/ # Phaser game package
```

## Development Workflow

### Starting Development

```bash
# Root directory - start all services
pnpm dev

# Individual services
cd apps/web && pnpm dev              # Frontend (port 3000)
cd apps/backend/wildstrikes-socket && pnpm dev  # Socket server (port 3001)
cd apps/backend/wildstrikes-backend && pnpm dev # API server
```

### Platform-Specific Commands

- **Windows**: Uses webpack by default (see `apps/web/start-dev.js`)
- **Linux/macOS**: Uses Turbopack for faster builds
- **Manual override**: `pnpm dev:webpack` or `pnpm dev:turbo`

### Environment Setup

Create `.env` in root:
```env
# Server
PORT=3001
HOST=192.168.100.6

# Client - Socket.IO connection
NEXT_PUBLIC_SOCKET_URL=http://192.168.100.6:3001
SOCKET_HOST=192.168.100.6
SOCKET_PORT=3001
```

## Game Architecture Patterns

### Entity-Component System

**Location**: `packages/phaser-games/wildstrikes/src/scenes/arena/arenas/pvp/entities/`

- **GameEntity**: Base class with component management
- **PlayerEntity**: Extends GameEntity with player-specific logic
- **Components**: Modular behaviors (Movement, Input, Sprite, Network, etc.)

**Example**:
```typescript
// Add components to entity
player.addComponent('movement', new MovementComponent());
player.addComponent('network', new NetworkComponent(socketId));

// Update loop
player.update(); // Updates all components
```

### Server-Authoritative Networking

**Location**: `packages/phaser-games/wildstrikes/src/scenes/arena/arenas/pvp/systems/network/`

- **BattleNetworkManager**: Handles Socket.IO events and callbacks
- **Client sends**: Player input, attack requests
- **Server sends**: Authoritative state, hit confirmations, match results

**Pattern**:
```typescript
// Client-side prediction + server reconciliation
socket.emit('player:attack', { type: 'light', x, y });
socket.on('server:attackHit', (data) => {
  // Apply server-confirmed hit
});
```

### Scene Management

**Location**: `packages/phaser-games/wildstrikes/src/scenes/`

- **Menu Scenes**: BootScene, StartMenuScene, MatchmakingScene
- **Arena Scenes**: ArenaScene (main game), VictoryScene, DefeatScene
- **Scene Data**: Pass configuration between scenes

**Example**:
```typescript
// Transition with data
this.scene.start('Arena', {
  roomId: 'room-123',
  localPlayerId: 'socket-456',
  opponentId: 'socket-789'
});
```

## Backend Patterns

### Socket.IO Event Handling

**Location**: `apps/backend/wildstrikes-socket/src/controllers/`

- **battle-events.ts**: Game state events (attacks, movement)
- **matchmaking-events.ts**: Queue and room management

**Pattern**:
```typescript
// Register event handlers
socket.on('player:attack', (data) => {
  // Validate and broadcast
  io.to(roomId).emit('server:attackHit', validatedData);
});
```

### Service Layer Architecture

**Location**: `apps/backend/wildstrikes-socket/src/services/`

- **MatchmakingService**: Queue management and pairing
- **BattleService**: Game state and room management
- **RoomService**: Player room lifecycle

**Example**:
```typescript
// Service composition
const matchmaking = new MatchmakingService(io);
const roomService = matchmaking.getRoomService();
const battleService = new BattleService(io, roomService);
```

## Database Patterns

### Prisma Schema

**Location**: `apps/backend/wildstrikes-backend/prisma/schema.prisma`

- **User**: Player profiles with Aptos wallets
- **Match**: Game results with Elo ratings
- **Season**: Competitive seasons with leaderboards

**Migrations**:
```bash
cd apps/backend/wildstrikes-backend
pnpm prisma migrate dev --name descriptive_name
pnpm prisma generate
```

## Frontend Integration

### Phaser Game Integration

**Location**: `apps/web/app/components/WildstrikesCanvas.tsx`

- **Dynamic Import**: Load Phaser game package
- **Canvas Container**: Full-screen game container
- **Cleanup**: Destroy game on unmount

**Pattern**:
```typescript
import('@phaser-games/wildstrikes').then(({ default: WildstrikesGame }) => {
  game = new WildstrikesGame(containerRef.current!);
});
```

### Wallet Integration

**Location**: `apps/web/app/providers/WalletProvider.tsx`

- **Aptos Wallets**: Petra, Aptos Connect
- **Context Provider**: Global wallet state
- **Components**: WalletConnector, WalletDebugger

## Build & Deployment

### Turborepo Pipeline

**Configuration**: `turbo.json`

- **build**: Depends on upstream builds, outputs to `dist/`, `.next/`, `out/`
- **dev**: Non-cached, persistent processes
- **lint/format**: Code quality checks

### Package Management

- **pnpm workspaces**: Monorepo dependency management
- **Internal packages**: `@phaser-games/wildstrikes` linked automatically
- **Path mapping**: TypeScript paths in `tsconfig.json`

## Common Tasks

### Adding New Game Features

1. **Create component**: `packages/phaser-games/wildstrikes/src/scenes/arena/arenas/pvp/entities/components/`
2. **Add to entity**: Update `PlayerEntity` or create new entity type
3. **Network events**: Add Socket.IO events in backend controllers
4. **UI updates**: Modify scenes or add overlay components

### Database Changes

1. **Update schema**: `apps/backend/wildstrikes-backend/prisma/schema.prisma`
2. **Create migration**: `pnpm prisma migrate dev --name feature_name`
3. **Generate client**: `pnpm prisma generate`
4. **Update API**: Add NestJS endpoints if needed

### Adding UI Scenes

1. **Create scene**: `packages/phaser-games/wildstrikes/src/scenes/menu/`
2. **Add to game config**: `packages/phaser-games/wildstrikes/src/index.ts`
3. **Handle navigation**: Update existing scenes' transition logic

## Debugging

### Network Issues

- Check Socket.IO connection: `http://localhost:3001/debug`
- Monitor room state and player connections
- Verify environment variables match server config

### Game State

- Phaser debug mode: Set `debug: true` in physics config
- Console logs: Search for `[BATTLE NETWORK]` prefixes
- Scene transitions: Check data passing between scenes

### Build Issues

- **Windows**: Try `pnpm dev:webpack` if Turbopack fails
- **Dependencies**: Run `pnpm install` from root
- **TypeScript**: Check `tsconfig.json` path mappings

## Code Quality

### TypeScript

- **Strict mode**: Enabled throughout
- **Path mapping**: Use `@phaser-games/*`, `@scenes/*`, etc.
- **Type definitions**: Check `packages/phaser-games/wildstrikes/src/types/`

### ESLint

- **Config**: Flat config in each package
- **Rules**: TypeScript-specific rules enabled
- **Auto-fix**: `pnpm lint` with `--fix` option

### Testing

- **Manual testing**: Open multiple browser tabs to `http://localhost:3001`
- **Socket debugging**: Use `/debug` endpoint for server state
- **Game testing**: Test matchmaking, disconnections, reconnections

## Performance Considerations

### Game Optimization

- **Asset loading**: Use `AssetLoader` for efficient loading
- **Physics**: Arcade physics with 60 FPS
- **Networking**: Client-side prediction with server reconciliation
- **Memory**: Clean up Phaser objects in `destroy()` methods

### Build Optimization

- **Code splitting**: Dynamic imports for game package
- **Caching**: Turborepo caches builds between runs
- **Bundle size**: Monitor with build outputs

## Security Notes

### Network Security

- **Input validation**: Validate all Socket.IO events server-side
- **Rate limiting**: Consider adding to prevent spam
- **CORS**: Configured for development, restrict in production

### Blockchain Integration

- **Wallet security**: Never store private keys
- **Transaction validation**: Verify Aptos transactions server-side
- **User data**: Handle PII according to privacy requirements

## File Naming Conventions

- **Components**: PascalCase (e.g., `WildstrikesCanvas.tsx`)
- **Scenes**: PascalCase with "Scene" suffix (e.g., `ArenaScene.ts`)
- **Services**: PascalCase with "Service" suffix (e.g., `BattleService.ts`)
- **Utilities**: camelCase (e.g., `socket.ts`)
- **Directories**: kebab-case for packages, camelCase for source

## Git Workflow

- **Branch naming**: `feature/`, `bugfix/`, `hotfix/`
- **Commits**: Descriptive messages with scope (e.g., `feat(game): add combo system`)
- **PRs**: Include testing instructions and screenshots for UI changes

---

*Last updated: November 1, 2025*</content>
<parameter name="filePath">e:\wild-strikes-aptos\.github\copilot-instructions.md