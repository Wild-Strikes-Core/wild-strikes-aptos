import { MapManager } from "../maps/MapManager";
import { AssetLoader } from "../../../../../AssetLoader";
import { ArenaCameraManager } from "../systems/camera/CameraManager";
import { BattleNetworkManager } from "../systems/network/BattleNetworkManager";
import { PlayerContextManager } from "../entities/player/PlayerContextManager";
import { BattleConfig, DEFAULT_CAMERA_CONFIG } from "../config/BattleConfig";

export default class Arena extends Phaser.Scene {
    private mapManager: MapManager;
    private cameraManager: ArenaCameraManager;
    private networkManager: BattleNetworkManager;
    private playerContextManager: PlayerContextManager;
    
    private battleConfig: BattleConfig;
    
    // Enable/disable debug mode - set to false for production
    private static readonly DEBUG_ENABLED = true;

    constructor() {
        super({ key: "Arena" });
    }

    init(data?: {
        mapConfig?: any;
        yourData?: string[];
        opponentData?: string[];
        opponentId?: string;
        yourId?: string;
        p1SpawnPosition?: { x: number; y: number };
        p2SpawnPosition?: { x: number; y: number };
        roomId?: string;
    }): void {
        console.log(`[ARENA] Initializing with data:`, data);
        
        // Map the old data structure to the new BattleConfig interface
        this.battleConfig = {
            mapConfig: data.mapConfig,
            localPlayerData: data.yourData || [],
            opponentData: data.opponentData || [],
            localPlayerId: data.yourId || '',
            opponentId: data.opponentId || '',
            localSpawnPosition: data.p1SpawnPosition || { x: 0, y: 0 },
            opponentSpawnPosition: data.p2SpawnPosition || { x: 0, y: 0 },
            roomId: data.roomId || ''
        };
        
        // Initialize managers
        this.playerContextManager = new PlayerContextManager(this);
        this.cameraManager = new ArenaCameraManager(this, DEFAULT_CAMERA_CONFIG);
        this.networkManager = new BattleNetworkManager({
            localPlayerId: this.battleConfig.localPlayerId,
            opponentId: this.battleConfig.opponentId,
            roomId: this.battleConfig.roomId
        });

        // Set up network event handlers
        this.setupNetworkHandlers();
    }

    preload(): void {
        const loader = new AssetLoader(this.load);
        loader.loadGroup('gameplay');
        loader.loadGroup('gameplay-audio');
        loader.loadGroup('chars');
    }

    create(): void {
        console.log(`[ARENA] Creating arena scene`);
        
        this.setupMap();
        this.setupPlayers();
        this.setupCamera();
    }

    update(time: number, delta: number): void {
        this.playerContextManager.updatePlayers(delta);
        this.cameraManager.update();
    }

    shutdown(): void {
        this.cleanup();
    }

    destroy(): void {
        this.cleanup();
    }

    private setupNetworkHandlers(): void {
        this.networkManager.onPlayerStateUpdate((playerState: any) => {
            console.log("[ARENA] Received player state update:", playerState);
            const playerContext = this.playerContextManager.getPlayerContext(playerState.id);
            if (playerContext && !playerContext.isLocal) {
                console.log(`[ARENA] Updating remote player: ${playerState.id}`);
                playerContext.manager.updateFromNetwork(playerState);
            }
        });
    }

    private setupMap(): void {
        this.mapManager = new MapManager();
        const clientMapConfig = {
            name: this.battleConfig.mapConfig.name,
            backgroundKey: this.battleConfig.mapConfig.backgroundImage,
            musicKey: this.battleConfig.mapConfig.backgroundMusic
        };
        this.mapManager.setupMap(this, clientMapConfig);
    }

    private setupPlayers(): void {
        const playerContexts = this.playerContextManager.setupPlayers({
            localPlayerId: this.battleConfig.localPlayerId,
            opponentId: this.battleConfig.opponentId,
            localSpawnPosition: this.battleConfig.localSpawnPosition,
            opponentSpawnPosition: this.battleConfig.opponentSpawnPosition,
            roomId: this.battleConfig.roomId
        });

        console.log(`[ARENA] Players setup complete. Local: ${this.battleConfig.localPlayerId}, Opponent: ${this.battleConfig.opponentId}`);
    }

    private setupCamera(): void {
        const localPlayerContext = this.playerContextManager.getLocalPlayerContext();
        if (localPlayerContext) {
            const playerSprite = localPlayerContext.manager.getPlayerSprite();
            if (playerSprite) {
                this.cameraManager.followTarget(playerSprite);
            }
        }
    }

    private cleanup(): void {
        this.cameraManager?.destroy();
        this.networkManager?.destroy();
        this.playerContextManager?.destroy();
        this.mapManager?.destroy();
    }
}
