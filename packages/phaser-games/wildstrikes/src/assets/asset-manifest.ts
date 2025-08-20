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
    { key: 'home-menu-music', url: '/assets/game/ui/menu/home-menu-NOSTALGIA.mp3', type: 'audio', group: 'ui-audio' },
    { key: 'hover-sound', url: '/assets/game/ui/menu/hover-sound.mp3', type: 'audio', group: 'ui-audio' },
    { key: 'landing-menu-music', url: '/assets/game/ui/menu/landing-menu-AriaStrikes.mp3', type: 'audio', group: 'ui-audio' },
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
  
    // ---------- CHARACTERS ---------- //
    { key: '2G_Char_Knight', url: '/assets/game/ui/menu/2G_Char_Knight.png', type: 'image', group: 'environment' },
    { key: 'minotaur', url: '/arena-characters/minotaur/minotaur-asset-pack.json', type: 'pack', group: 'chars' },


    { key: 'player-hurt', url: '/assets/game/characters/audio/hurt.wav', type: 'audio', group: 'chars' },
    { key: 'player-jump', url: '/assets/game/characters/audio/jump.wav', type: 'audio', group: 'chars' },
    { key: 'player-dash', url: '/assets/game/characters/audio/power_up.wav', type: 'audio', group: 'chars' },

    // ---------- ENVIRONMENT ---------- //
    { key: '2G_bgClouds_2', url: '/assets/game/ui/landing/Purple_Green_Pixel_Illustration_Game_Presentation__2_-removebg-preview.png', type: 'image', group: 'environment' },
    { key: '2G_bg', url: '/assets/game/ui/menu/2G_mainBg.png', type: 'image', group: 'environment' }, //2G_mainBg.png dapat gamitin, but its missing the land asset so temporarily keep the original//
    { key: '2G_bgHill', url: '/assets/game/ui/menu/2G_bgHill.png', type: 'image', group: 'environment' }, 
    { key: '2g_bgStars', url: '/assets/game/ui/menu/2G_bgStars.png', type: 'image', group: 'environment' },
  ];