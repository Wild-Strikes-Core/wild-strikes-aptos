export interface BattleConfig {
    mapConfig: any;
    localPlayerData: string[];
    opponentData: string[];
    localPlayerId: string;
    opponentId: string;
    localSpawnPosition: { x: number; y: number };
    opponentSpawnPosition: { x: number; y: number };
    roomId: string;
}

export interface CameraConfig {
    zoom: number;
    followOffset: { x: number; y: number };
    bounds: { x: number; y: number; width: number; height: number };
    lerpSpeed: number;
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
    zoom: 1.3,
    followOffset: { x: -200, y: 0 },
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    lerpSpeed: 0.1
}; 