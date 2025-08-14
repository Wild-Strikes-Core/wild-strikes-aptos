export interface WebMapConfig {
  name: string;
  mapLocation: string;
  mapKey: string;
  mapSpawnPoints: {
    player1: { x: number; y: number };
    player2: { x: number; y: number };
  };
  mapBackgroundMusic: string;
}

const basePath = '/arena-maps/';

export const AVAILABLE_WEB_MAPS: WebMapConfig[] = [
  {
    name: 'Philippines',
    mapLocation: `${basePath}PH/map.json`,
    mapKey: 'PH-map',
    mapSpawnPoints: {
      player1: { x: 100, y: 300 },
      player2: { x: 700, y: 300 },
    },
    mapBackgroundMusic: `${basePath}PH/PH-BG.mp3`,
  },
  {
    name: 'France',
    mapLocation: `${basePath}FRN/map.json`,
    mapKey: 'FRN-map',
    mapSpawnPoints: {
      player1: { x: 100, y: 300 },
      player2: { x: 700, y: 300 },
    },
    mapBackgroundMusic: `${basePath}FRN/music/FRN-BG.mp3`,
  },
];


