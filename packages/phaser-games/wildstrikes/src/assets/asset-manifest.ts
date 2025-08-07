export interface AssetEntry {
    key: string;
    url: string;
    type: 'image' | 'audio' | 'atlas' | 'pack';
    group?: string;
  }
  
  export const ASSETS: AssetEntry[] = [
    // ---------- BOOT ---------- //
    { key: 'boot', url: '/assets/game/ui/boot-asset-pack.json', type: 'pack', group: 'boot' },
  
    // ---------- UI PACKS (Images/Sprites Only) ---------- //
    { key: 'gameMenu', url: '/assets/game/ui/gameMenu-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'landingPage', url: '/assets/game/ui/landingPage-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'settingsMenu', url: '/assets/game/ui/settingsMenu-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'listofteamsMenu', url: '/assets/game/ui/listofteamsMenu-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'selectTeam', url: '/assets/game/ui/selectTeam-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'invMenu', url: '/assets/game/ui/invMenu-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'victoryPage', url: '/assets/game/ui/victoryPage-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'defeatPage', url: '/assets/game/ui/defeatPage-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'drawPage', url: '/assets/game/ui/drawPage-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'aboutMenu', url: '/assets/game/ui/aboutMenu-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'leadMENU', url: '/assets/game/ui/leadMENU-asset-pack.json', type: 'pack', group: 'ui' },
  
    // ---------- UI AUDIO (Individual Audio Files) ---------- //
    { key: 'game-menu-music', url: '/assets/game/ui/menu/game-menu.mp3', type: 'audio', group: 'ui-audio' },
    { key: 'click-menu', url: '/assets/game/ui/menu/click-menu.mp3', type: 'audio', group: 'ui-audio' },
    { key: 'victory', url: '/assets/game/ui/results/victory.mp3', type: 'audio', group: 'ui-audio' },
    { key: 'defeat', url: '/assets/game/ui/results/defeat.mp3', type: 'audio', group: 'ui-audio' },
  
    // ---------- GAMEPLAY PACKS (Images/Sprites Only) ---------- //
    { key: 'matchMaking', url: '/assets/game/gameplay/matchMaking-asset-pack.json', type: 'pack', group: 'gameplay' },
    { key: 'map', url: '/assets/game/gameplay/map-asset-pack.json', type: 'pack', group: 'gameplay' },
    { key: 'tiles', url: '/assets/game/gameplay/maps/tiles-asset-pack.json', type: 'pack', group: 'gameplay' },
    { key: 'matchUI', url: '/assets/game/gameplay/match-skills-assets-pack.json', type: 'pack', group: 'gameplay' },
    { key: 'timerAnim', url: '/assets/game/gameplay/timerAnim.json', type: 'pack', group: 'gameplay' },
  
    // ---------- GAMEPLAY AUDIO (Individual Audio Files) ---------- //
    { key: 'waiting-music', url: '/assets/game/gameplay/matchmaking/waiting-music.mp3', type: 'audio', group: 'gameplay-audio' },
    { key: 'in-match', url: '/assets/game/gameplay/maps/in-match.mp3', type: 'audio', group: 'gameplay-audio' },
    { key: 'player-attack', url: '/assets/game/gameplay/maps/Attack.wav', type: 'audio', group: 'gameplay-audio' },
    { key: 'player-sprint', url: '/assets/game/gameplay/maps/Footstep.wav', type: 'audio', group: 'gameplay-audio' },
    // { key: 'player-hit', url: '/assets/game/gameplay/maps/player-hit.mp3', type: 'audio', group: 'gameplay-audio' },
    { key: 'game-over', url: '/assets/game/gameplay/maps/game-over.mp3', type: 'audio', group: 'gameplay-audio' },
    { key: 'PH-BG', url: '/assets/game/gameplay/maps/PH-BG.mp3', type: 'audio', group: 'gameplay-audio' },
    { key: 'JPN-BG', url: '/assets/game/gameplay/maps/JPN-BG.mp3', type: 'audio', group: 'gameplay-audio' },
    { key: 'FRN-BG', url: '/assets/game/gameplay/maps/FRN-BG.mp3', type: 'audio', group: 'gameplay-audio' },
  
    // ---------- CHARACTERS ---------- //
    { key: 'sprite_heroP1', url: '/assets/game/characters/heroes/Hero_P1-pack.json', type: 'pack', group: 'chars' },
    { key: 'placeholderChar', url: '/assets/game/characters/placeholder/placeholderCharacter/placeholderCharacter-sprite-asset-pack.json', type: 'pack', group: 'chars' },
    { key: 'player-hurt', url: '/assets/game/characters/audio/hurt.wav', type: 'audio', group: 'chars' },
    { key: 'player-jump', url: '/assets/game/characters/audio/jump.wav', type: 'audio', group: 'chars' },
    { key: 'player-dash', url: '/assets/game/characters/audio/power_up.wav', type: 'audio', group: 'chars' },

    // ---------- ENVIRONMENT ---------- //
    { key: '2G_bgClouds_2', url: '/assets/game/ui/landing/Purple_Green_Pixel_Illustration_Game_Presentation__2_-removebg-preview.png', type: 'image', group: 'environment' },
    { key: '2G_bg', url: '/assets/game/ui/menu/2G_bg.png', type: 'image', group: 'environment' },
  ];