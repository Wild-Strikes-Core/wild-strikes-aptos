# Phaser Game Package - Wild Strikes

Phaser 3 game engine package for the Wild Strikes multiplayer fighting game.

## 🚀 Quick Start

```bash
# From root directory
pnpm install
pnpm dev    # Starts the web app with the game

# Or build the package individually
cd packages/phaser-games/wildstrikes
pnpm build
```

The game package is automatically linked to the web frontend.

## 📁 Project Structure

```
packages/phaser-games/wildstrikes/
├── src/
│   ├── index.ts              # Main game export
│   ├── scenes/               # Phaser game scenes
│   ├── entities/             # Game entities (players, objects)
│   ├── systems/              # Game systems (physics, input)
│   ├── assets/               # Game asset definitions
│   └── utils/                # Utility functions
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🛠 Available Scripts

```bash
pnpm build      # Build the game package
pnpm type-check # Check TypeScript types
pnpm clean      # Clean build artifacts
```

## 🎮 Game Architecture

### Phaser 3 Integration
- **Modern ES6+ modules**: Full TypeScript support
- **Scene Management**: Organized game states
- **Asset Loading**: Efficient asset management
- **Physics**: Matter.js or Arcade Physics
- **Multiplayer Ready**: Socket.IO integration

### Key Components
- **Game Scenes**: Menu, Game, Victory/Defeat screens
- **Player Entities**: Character management and controls
- **Network Layer**: Real-time multiplayer synchronization
- **Asset Management**: Sprites, sounds, and animations

## 🔗 Dependencies

### Production
- **Phaser**: `^3.90.0` - Game engine
- **Socket.IO Client**: Real-time communication

### Development
- **TypeScript**: Type safety and modern JavaScript features

## 🎨 Assets

Game assets are managed through:
- **Asset Packs**: JSON-defined asset loading
- **Sprite Sheets**: Efficient sprite management
- **Audio**: Sound effects and background music
- **Fonts**: Custom game fonts

## 🌐 Multiplayer Features

### Real-time Synchronization
- **Player Movement**: Smooth interpolation
- **Game State**: Shared game world
- **Input Prediction**: Client-side prediction
- **Lag Compensation**: Network-aware gameplay

### Socket.IO Integration
```typescript
// Connect to game server
socket.emit('joinGame', { playerId, roomId })

// Send player actions
socket.emit('playerAction', { type: 'move', direction: 'left' })

// Receive game updates
socket.on('gameUpdate', (gameState) => {
  // Update local game state
})
```

## 📱 Platform Support

- **Web Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: Touch controls (future)
- **Desktop**: Keyboard and mouse controls

## 🔧 Configuration

### Game Settings
```typescript
const gameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  }
}
```

## 📝 Development Notes

- Built as a workspace package for easy sharing
- TypeScript for type safety
- Modular architecture for maintainability
- Hot reloading during development
- Optimized for both single-player and multiplayer

## 🎯 Game Features

### Core Gameplay
- **Fighting Mechanics**: Combat system
- **Character Selection**: Multiple characters
- **Special Moves**: Unique abilities
- **Health System**: Damage and healing

### Visual Effects
- **Particle Systems**: Explosions and effects
- **Animations**: Smooth character movement
- **UI Elements**: HUD and menus
- **Responsive Design**: Various screen sizes

## 🐛 Troubleshooting

### Build Issues
```bash
# Clear TypeScript cache
rm -rf dist
pnpm build
```

### Asset Loading Problems
- Check asset paths in pack files
- Verify asset files exist in web app's public folder
- Check browser console for loading errors

### Performance Issues
- Monitor FPS in development
- Check for memory leaks
- Optimize asset sizes

For more help, see the [main README](../../../README.md) troubleshooting section.
