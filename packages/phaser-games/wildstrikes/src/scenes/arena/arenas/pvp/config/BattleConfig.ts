export interface BattleConfig {
    mapConfig: any;
    localPlayerData: string[];
    opponentData: string[];
    localPlayerId: string;
    opponentId: string;
    localSpawnPosition: { x: number; y: number };
    opponentSpawnPosition: { x: number; y: number };
    roomId: string;
    // Optional character selection keys
    localCharacterKey?: string;
    opponentCharacterKey?: string;
}