export interface AssetEntry {
    key: string;
    url: string;
    type: 'image' | 'audio' | 'atlas' | 'pack';
    group?: string;
  }
  
  export const ASSETS: AssetEntry[] = [
    // ---------- BOOT ---------- //
    { key: 'boot', url: '/assets/boot-asset-pack.json', type: 'pack', group: 'boot' },
  
    // ---------- UI ---------- //
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
  
    // ---------- GAMEPLAY ---------- //
    { key: 'matchMaking', url: '/assets/Match/matchMaking-asset-pack.json', type: 'pack', group: 'gameplay' },
    { key: 'map', url: '/assets/Match/map-asset-pack.json', type: 'pack', group: 'gameplay' },
    { key: 'tiles', url: '/assets/Match/02 - Map/tiles-asset-pack.json', type: 'pack', group: 'gameplay' },
    { key: 'matchUI', url: '/assets/Match/match-skills-assets-pack.json', type: 'pack', group: 'gameplay' },
    { key: 'timerAnim', url: '/assets/Match/timerAnim.json', type: 'pack', group: 'gameplay' },
  
    // ---------- CHARACTERS ---------- //
    { key: 'sprite_heroP1', url: '/assets/Sprites/Hero_P1-pack.json', type: 'pack', group: 'chars' },
    { key: 'placeholderChar', url: '/assets/Sprites/placeholderCharacter/placeholderCharacter-sprite-asset-pack.json', type: 'pack', group: 'chars' },
  
    // ---------- ENVIRONMENT ---------- //
    { key: '2G_bgClouds_2', url: '/assets/01 - Landing Page/Purple_Green_Pixel_Illustration_Game_Presentation__2_-removebg-preview.png', type: 'image', group: 'environment' },
    { key: '2G_bg', url: '/assets/02 - Game Menu/2G_bg.png', type: 'image', group: 'environment' },
  ];