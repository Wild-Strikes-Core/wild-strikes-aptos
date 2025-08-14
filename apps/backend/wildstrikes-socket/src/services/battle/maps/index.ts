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
  // {
  //   name: 'Philippines',
  //   mapLocation: `${basePath}PH/map.json`,
  //   mapKey: 'PH-map',
  //   mapSpawnPoints: {
  //     player1: { x: 100, y: 300 },
  //     player2: { x: 700, y: 300 },
  //   },
  //   mapBackgroundMusic: `${basePath}PH/PH-BG.mp3`,
  // },
  // {
  //   name: 'France',
  //   mapLocation: `${basePath}FRN/map.json`,
  //   mapKey: 'FRN-map',
  //   mapSpawnPoints: {
  //     player1: { x: 100, y: 300 },
  //     player2: { x: 700, y: 300 },
  //   },
  //   mapBackgroundMusic: `${basePath}FRN/music/FRN-BG.mp3`,
  // },
  {
    name: 'Untitled Map 00',
    mapLocation: `${basePath}UNT_MAP_01/map.json`,
    mapKey: 'UNT_MP_01-map',
    mapSpawnPoints: {
      player1: { x: 100, y: 1200 },
      player2: { x: 700, y: 1200 },
    },
    mapBackgroundMusic: `${basePath}PH/PH-BG.mp3`,
  },
  // {
  //   name: 'Untitled Map 02',
  //   mapLocation: `${basePath}UNT_MAP_02/map.json`,
  //   mapKey: 'UNT_MP_02-map',
  //   mapSpawnPoints: {
  //     player1: { x: 100, y: 1200 },
  //     player2: { x: 700, y: 1200 },
  //   },
  //   mapBackgroundMusic: `${basePath}PH/PH-BG.mp3`,
  // }
];


