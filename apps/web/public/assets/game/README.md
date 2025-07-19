# Game Assets Structure

This directory contains all game assets organized by functionality and type.

## Folder Structure

```
assets/game/
├── ui/                          # User Interface assets
│   ├── landing/                 # Landing page assets
│   ├── menu/                    # Main menu assets
│   ├── settings/                # Settings menu assets
│   ├── teams/                   # Team selection assets
│   ├── inventory/               # Inventory system assets
│   ├── results/                 # Victory/Defeat/Draw screens
│   ├── leaderboards/            # Leaderboard assets
│   ├── about/                   # About/Team developers assets
│   └── *.json                   # Asset pack files
├── gameplay/                    # Gameplay-related assets
│   ├── matchmaking/             # Matchmaking screen assets
│   ├── maps/                    # Map and level assets
│   ├── ui/                      # In-game UI elements
│   ├── arena/                   # Arena-specific assets
│   └── *.json                   # Gameplay asset packs
├── characters/                  # Character sprites and animations
│   ├── heroes/                  # Hero character assets
│   └── placeholder/             # Placeholder character assets
├── audio/                       # Audio files
│   ├── ui/                      # UI audio (menus, buttons)
│   └── gameplay/                # Gameplay audio (effects, music)
└── environment/                 # Environmental assets
    ├── backgrounds/             # Background images
    └── effects/                 # Visual effects and behaviors
```

## Asset Types

### UI Assets (`/ui/`)
- **Landing Page**: Initial game screen assets
- **Menu**: Main menu buttons, backgrounds, and UI elements
- **Settings**: Settings menu interface elements
- **Teams**: Team selection and management UI
- **Inventory**: Inventory system interface
- **Results**: Victory, defeat, and draw screen assets
- **Leaderboards**: Leaderboard display elements
- **About**: Team information and credits

### Gameplay Assets (`/gameplay/`)
- **Matchmaking**: Pre-game matchmaking interface
- **Maps**: Level backgrounds, tiles, and map-specific assets
- **UI**: In-game user interface elements
- **Arena**: Battle arena specific assets

### Character Assets (`/characters/`)
- **Heroes**: Main character sprites and animations
- **Placeholder**: Temporary character assets for development

### Audio Assets (`/audio/`)
- **UI**: Menu sounds, button clicks, interface audio
- **Gameplay**: Game effects, background music, combat sounds

### Environment Assets (`/environment/`)
- **Backgrounds**: Background images and textures
- **Effects**: Visual effects, particle systems, and behaviors

## Asset Pack Files

Asset pack files (`.json`) are organized by their primary function:
- UI asset packs are in `/ui/`
- Gameplay asset packs are in `/gameplay/`
- Audio packs are in `/audio/ui/` and `/audio/gameplay/`

## Migration Notes

This structure replaces the previous numbered folder system:
- `01 - Landing Page` → `ui/landing/`
- `02 - Game Menu` → `ui/menu/`
- `03 - Leaderboards` → `ui/leaderboards/`
- `04 - Team-Developers` → `ui/about/`
- `05 - Settings` → `ui/settings/`
- `07 - List of Teams` → `ui/teams/`
- `08 - Select Team` → `ui/teams/`
- `09 - Inventory` → `ui/inventory/`
- `11 - Victory` → `ui/results/`
- `12 - Defeat` → `ui/results/`
- `13 - Draw` → `ui/results/`
- `Match/` → `gameplay/`
- `Sprites/` → `characters/`

All asset references in the codebase have been updated to reflect the new structure under `/assets/game/`. 