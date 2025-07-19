export interface AssetEntry {
    key: string;
    url: string;
    type: 'image' | 'audio' | 'atlas' | 'pack';
    group?: string;
  }
  
  export const ASSETS: AssetEntry[] = [
    // ---------- BOOT ---------- //
    { key: 'boot', url: '/assets/boot-asset-pack.json', type: 'pack', group: 'boot' },
  
    // ---------- UI PACKS (Images/Sprites Only) ---------- //
    { key: 'gameMenu', url: '/assets/gameMenu-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'landingPage', url: '/assets/landingPage-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'settingsMenu', url: '/assets/settingsMenu-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'listofteamsMenu', url: '/assets/listofteamsMenu-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'selectTeam', url: '/assets/selectTeam-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'invMenu', url: '/assets/invMenu-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'victoryPage', url: '/assets/victoryPage-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'defeatPage', url: '/assets/defeatPage-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'drawPage', url: '/assets/drawPage-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'aboutMenu', url: '/assets/aboutMenu-asset-pack.json', type: 'pack', group: 'ui' },
    { key: 'leadMENU', url: '/assets/leadMENU-asset-pack.json', type: 'pack', group: 'ui' },
  
    // ---------- UI AUDIO (Individual Audio Files) ---------- //
    { key: 'game-menu-music', url: '/assets/02 - Game Menu/game-menu.mp3', type: 'audio', group: 'ui-audio' },
    { key: 'click-menu', url: '/assets/02 - Game Menu/click-menu.mp3', type: 'audio', group: 'ui-audio' },
    { key: 'victory', url: '/assets/11 - Victory/victory.mp3', type: 'audio', group: 'ui-audio' },
    { key: 'defeat', url: '/assets/12 - Defeat/defeat.mp3', type: 'audio', group: 'ui-audio' },
  
    // ---------- GAMEPLAY PACKS (Images/Sprites Only) ---------- //
    { key: 'matchMaking', url: '/assets/Match/matchMaking-asset-pack.json', type: 'pack', group: 'gameplay' },
    { key: 'map', url: '/assets/Match/map-asset-pack.json', type: 'pack', group: 'gameplay' },
    { key: 'tiles', url: '/assets/Match/02 - Map/tiles-asset-pack.json', type: 'pack', group: 'gameplay' },
    { key: 'matchUI', url: '/assets/Match/match-skills-assets-pack.json', type: 'pack', group: 'gameplay' },
    { key: 'timerAnim', url: '/assets/Match/timerAnim.json', type: 'pack', group: 'gameplay' },
  
    // ---------- GAMEPLAY AUDIO (Individual Audio Files) ---------- //
    { key: 'waiting-music', url: '/assets/Match/01 - Matchmaking/waiting-music.mp3', type: 'audio', group: 'gameplay-audio' },
    { key: 'in-match', url: '/assets/Match/02 - Map/in-match.mp3', type: 'audio', group: 'gameplay-audio' },
    { key: 'Attack', url: '/assets/Match/02 - Map/Attack.wav', type: 'audio', group: 'gameplay-audio' },
    { key: 'Footstep', url: '/assets/Match/02 - Map/Footstep.wav', type: 'audio', group: 'gameplay-audio' },
    { key: 'player-hit', url: '/assets/Match/02 - Map/player-hit.mp3', type: 'audio', group: 'gameplay-audio' },
    { key: 'game-over', url: '/assets/Match/02 - Map/game-over.mp3', type: 'audio', group: 'gameplay-audio' },
    { key: 'PH-BG', url: '/assets/Match/02 - Map/PH-BG.mp3', type: 'audio', group: 'gameplay-audio' },
    { key: 'JPN-BG', url: '/assets/Match/02 - Map/JPN-BG.mp3', type: 'audio', group: 'gameplay-audio' },
    { key: 'FRN-BG', url: '/assets/Match/02 - Map/FRN-BG.mp3', type: 'audio', group: 'gameplay-audio' },
  
    // ---------- CHARACTERS ---------- //
    { key: 'sprite_heroP1', url: '/assets/Sprites/Hero_P1-pack.json', type: 'pack', group: 'chars' },
    { key: 'placeholderChar', url: '/assets/Sprites/placeholderCharacter/placeholderCharacter-sprite-asset-pack.json', type: 'pack', group: 'chars' },
  
    // ---------- ENVIRONMENT ---------- //
    { key: '2G_bgClouds_2', url: '/assets/01 - Landing Page/Purple_Green_Pixel_Illustration_Game_Presentation__2_-removebg-preview.png', type: 'image', group: 'environment' },
    { key: '2G_bg', url: '/assets/02 - Game Menu/2G_bg.png', type: 'image', group: 'environment' },
  ];