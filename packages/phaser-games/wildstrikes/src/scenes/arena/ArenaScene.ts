import { MapManager } from "./MapManager";
import { AssetLoader } from "../../AssetLoader";
import { PlayerManager } from "./player/PlayerManager";
import { battleSocketClient} from "../../shared-utils/BattleSocketClient";

// ========================================
// INTERFACES & TYPES
// ========================================

interface PlayerContext {
    id: string;
    name?: string;
    health?: number;
    manager: PlayerManager;
    isLocal: boolean;
    spawnPosition: { x: number; y: number };
}

interface SpawnConfig {
    x: number;
    y: number;
    team?: string;
    name?: string;
    health?: number;
}

interface CameraConfig {
    zoom: number;
    followOffset: { x: number; y: number };
    bounds: { x: number; y: number; width: number; height: number };
    lerpSpeed: number;
}

class LocalPlayerController {
    private camera: Phaser.Cameras.Scene2D.Camera;
    private scene: Phaser.Scene;
    private playerContext: PlayerContext;

    constructor(scene: Phaser.Scene, camera: Phaser.Cameras.Scene2D.Camera, playerContext: PlayerContext) {
        this.scene = scene;
        this.camera = camera;
        this.playerContext = playerContext;
        this.setupCamera();
    }

    private setupCamera(): void {
        const config: CameraConfig = {
            zoom: 1.3,
            followOffset: { x: -200, y: 0 },
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            lerpSpeed: 0.1
        };

        const playerSprite = this.playerContext.manager.getPlayerSprite();
        if (playerSprite) {
            this.camera.startFollow(playerSprite, true, config.lerpSpeed, config.lerpSpeed);
            this.camera.setZoom(config.zoom);
            this.camera.setBounds(config.bounds.x, config.bounds.y, config.bounds.width, config.bounds.height);
            this.camera.followOffset.set(config.followOffset.x, config.followOffset.y);
        }
    }

    public updateCamera(): void {
        // Custom camera update logic if needed
        const playerSprite = this.playerContext.manager.getPlayerSprite();
        if (playerSprite) {
            // Update camera follow target if needed
            // Phaser camera will handle the following automatically once startFollow is called
        }
    }

    public destroy(): void {
        // Clean up camera, input, and UI
        this.camera.stopFollow();
        console.log(`Cleaned up local player controller for: ${this.playerContext.id}`);
    }
}

export default class Arena extends Phaser.Scene {

    constructor() {
        super({ key: "Arena" });
    }

    private mapManager: MapManager;

    // Enhanced player management with context
    private playerContexts: Map<string, PlayerContext> = new Map(); // 
    
    private localPlayerId: string | null = null;
    private localPlayerController: LocalPlayerController | null = null;
    
    private yourData!: string[];
    private opponentData!: string[];
    private yourId!: string;
    private opponentId!: string;
    private p1SpawnPosition!: { x: number; y: number };
    private p2SpawnPosition!: { x: number; y: number };

    private currentMapConfig: any;
    private roomId: string;
    
    // Enable/disable debug mode - set to false for production
    private static readonly DEBUG_ENABLED = true;

    init(data?: {
        mapConfig?: any;
        yourData?: string[];
        opponentData?: string[];
        opponentId?: string;
        yourId?: string;
        p1SpawnPosition?: { x: number; y: number };
        p2SpawnPosition?: { x: number; y: number };
        roomId?: string; // Add roomId to init data
        }): void {
        console.log(`[ARENA] Initializing with data:`, data);
        this.currentMapConfig = data.mapConfig;
        this.yourData = data.yourData;
        this.yourId = data.yourId;
        this.opponentId = data.opponentId;
        this.opponentData = data.opponentData;
        this.p1SpawnPosition = data.p1SpawnPosition;
        this.p2SpawnPosition = data.p2SpawnPosition;
        this.roomId = data.roomId; // Store roomId
        
        console.log(`[ARENA] Local player: ${this.yourId}`);
        console.log(`[ARENA] Opponent: ${this.opponentId}`);
        console.log(`[ARENA] Map: ${this.currentMapConfig?.name}`);
        console.log(`[ARENA] Room ID: ${this.roomId}`);
        
        // ✅ Set up socket connection immediately in init
        this.setupBattleSocket();
    }


    preload(): void {
        
        // Load gameplay and audio assets needed for the arena
        const loader = new AssetLoader(this.load);
        loader.loadGroup('gameplay');
        loader.loadGroup('gameplay-audio');
        // Load character sprites
        loader.loadGroup('chars');

        // this.load.plugin('rexvirtualjoystickplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js', true);
    }

    create(): void {
        console.log(`[ARENA] Creating arena scene`);
        console.log(`[ARENA] Local player ID: ${this.yourId}`);
        console.log(`[ARENA] Opponent ID: ${this.opponentId}`);
        console.log(`[ARENA] Map config:`, this.currentMapConfig);
        
        this.setupMap();
        this.setupPlayers();
    }
 
    update(time: number, delta: number): void {
        this.playerContexts.forEach(player => {
            player.manager.update(delta);
        });

        this.localPlayerController?.updateCamera();

    }

    /* ------------------------------------------------------------------
     * Scene shutdown cleanup
     * ------------------------------------------------------------------ */
    shutdown(): void {
    }

    destroy(): void {
        this.shutdown();
    }

    private setupBattleSocket(): void {
        console.log(`[ARENA] Setting up battle socket...`);
        console.log(`[ARENA] Local player ID: ${this.yourId}`);
        console.log(`[ARENA] Opponent ID: ${this.opponentId}`);
        
        battleSocketClient.connect();
        
        // Wait a bit for connection to establish
        setTimeout(() => {
            const isConnectionSuccessful: boolean = battleSocketClient.isSocketConnected();
            const socketId = battleSocketClient.getId();
            console.log(`[BATTLE SOCKET] Socket connected: ${isConnectionSuccessful}`);
            console.log(`[BATTLE SOCKET] Socket ID: ${socketId}`);
            
            if (isConnectionSuccessful) {
                console.log(`[BATTLE SOCKET] Starting battle...`);
                battleSocketClient.startBattle();
            } else {
                console.error(`[BATTLE SOCKET] Failed to connect to socket server`);
            }
        }, 100);
    
        battleSocketClient.on("battle-start", (data: any) => {
            console.log("[BATTLE SOCKET] Battle started", data);
        });
    
        battleSocketClient.on("player-state-update", (playerState: any) => {
            console.log("[BATTLE SOCKET] Received player state update:", playerState);
            const playerContext = this.playerContexts.get(playerState.id);
            if (playerContext && !playerContext.isLocal) {
                console.log(`[BATTLE SOCKET] Updating remote player: ${playerState.id}`);
                playerContext.manager.updateFromNetwork(playerState);
            } else {
                console.log(`[BATTLE SOCKET] Ignoring update for local player or unknown player: ${playerState.id}`);
            }
        });
    
        // Add error handling
        battleSocketClient.on("connect_error", (error: any) => {
            console.error("[BATTLE SOCKET] Connection error:", error);
        });
    
        battleSocketClient.on("disconnect", (reason: any) => {
            console.log("[BATTLE SOCKET] Disconnected:", reason);
        });
    }

    private setupMap(): void {
        // MAP SETUP
        this.mapManager = new MapManager();

        const clientMapConfig =  {
            name: this.currentMapConfig.name,
            backgroundKey: this.currentMapConfig.backgroundImage,
            musicKey: this.currentMapConfig.backgroundMusic
        };

        this.mapManager.setupMap(this, clientMapConfig);
    }

    private setupPlayers(): void {
    const player1 = new PlayerManager(this, true, this.roomId);
    const player2 = new PlayerManager(this, false, this.roomId);
    player1.setSpawnPosition(this.p1SpawnPosition.x, this.p1SpawnPosition.y);
    player2.setSpawnPosition(this.p2SpawnPosition.x, this.p2SpawnPosition.y);

    const p1Sprite = player1.createPlayer(this.p1SpawnPosition.x, this.p1SpawnPosition.y);
    const p2Sprite = player2.createPlayer(this.p2SpawnPosition.x, this.p2SpawnPosition.y);

    // Ensure remote player is above platform
    const platform = (this as any).platform;
    if (platform && p2Sprite && p2Sprite.y > platform.y) {
        const bodyHeight = p2Sprite.body ? p2Sprite.body.height : 0;
        p2Sprite.y = platform.y - bodyHeight;
    }

    const p1Context = {
        id: this.yourId,
        manager: player1,
        isLocal: true,
        spawnPosition: this.p1SpawnPosition
    };

    const p2Context = {
        id: this.opponentId,
        manager: player2,
        isLocal: false,
        spawnPosition: this.p2SpawnPosition
    };

    this.playerContexts.set(this.yourId, p1Context);
    this.playerContexts.set(this.opponentId, p2Context);

    const localPlayerContext = this.playerContexts.get(this.yourId);
    this.localPlayerController = new LocalPlayerController(this, this.cameras.main, localPlayerContext);
}
}
