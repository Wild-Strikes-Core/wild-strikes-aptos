# Wild Strikes Aptos - Monorepo

A multiplayer fighting game built with Phaser 3, Next.js, and Aptos blockchain integration.

## Project Structure

```
wild-strikes-aptos/
├── apps/
│   ├── client/          # Next.js + Phaser frontend
│   └── server/          # Socket.IO + API backend
├── packages/
│   ├── shared/          # Shared types, constants, and hooks
│   ├── web3/            # Aptos wallet and web3 logic
│   └── game-core/       # Reusable Phaser game logic
├── scripts/             # Dev CLI tools
└── .env.example         # Environment variables template
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Clone the repository
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Start both client and server in development mode:

```bash
# Start client (Next.js + Phaser)
pnpm --filter client dev

# Start server (Socket.IO)
pnpm --filter server dev
```

Or use the root scripts:
```bash
pnpm dev:client
pnpm dev:server
```

### Building

```bash
# Build client
pnpm --filter client build

# Build server
pnpm --filter server build
```

## Package Details

### `apps/client`
- **Framework**: Next.js 14 with TypeScript
- **Game Engine**: Phaser 3
- **Styling**: CSS modules and global styles
- **Port**: 8080 (development)

### `apps/server`
- **Framework**: Node.js with TypeScript
- **Real-time**: Socket.IO for multiplayer
- **Port**: 3001 (configurable via .env)

### `packages/game-core`
- **Purpose**: Reusable Phaser game logic
- **Contents**: Scenes, controllers, utilities
- **Dependencies**: Phaser 3, Socket.IO client

### `packages/shared`
- **Purpose**: Shared types, constants, and React hooks
- **Contents**: TypeScript definitions, game constants
- **Dependencies**: React, Socket.IO client

### `packages/web3`
- **Purpose**: Aptos blockchain integration
- **Contents**: Wallet adapters, transaction logic
- **Dependencies**: Aptos SDK, wallet adapters

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server
PORT=3001
HOST=0.0.0.0

# Add client variables as needed
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Architecture

The game uses a client-server architecture with real-time multiplayer:

1. **Client**: Next.js serves the Phaser game and handles UI
2. **Server**: Node.js manages game state and Socket.IO connections
3. **Blockchain**: Aptos integration for wallet and transactions
4. **Shared Logic**: Common types and utilities across packages

## Contributing

1. Follow the monorepo structure
2. Use TypeScript for all new code
3. Test changes in both client and server
4. Update documentation as needed

## License

MIT License - see LICENSE file for details 