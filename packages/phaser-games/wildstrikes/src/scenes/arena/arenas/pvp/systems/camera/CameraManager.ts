import { battleSocketClient } from "../../../../../../shared-utils/BattleSocketClient";

export interface BattleNetworkConfig {
    localPlayerId: string;
    opponentId: string;
    roomId: string;
}

export class BattleNetworkManager {
    private config: BattleNetworkConfig;
    private eventHandlers: Map<string, (data: any) => void> = new Map();

    constructor(config: BattleNetworkConfig) {
        this.config = config;
        this.setupConnection();
        this.setupEventHandlers();
    }

    private setupConnection(): void {
        console.log(`[BATTLE NETWORK] Setting up connection for room: ${this.config.roomId}`);
        battleSocketClient.connect();
        
        setTimeout(() => {
            if (battleSocketClient.isSocketConnected()) {
                console.log(`[BATTLE NETWORK] Starting battle...`);
                battleSocketClient.startBattle();
            } else {
                console.error(`[BATTLE NETWORK] Failed to connect to socket server`);
            }
        }, 100);
    }

    private setupEventHandlers(): void {
        this.on("server:start-battle", (data: any) => {
            console.log("[BATTLE NETWORK] Battle started", data);
        });

        this.on("connect_error", (error: any) => {
            console.error("[BATTLE NETWORK] Connection error:", error);
        });

        this.on("disconnect", (reason: any) => {
            console.log("[BATTLE NETWORK] Disconnected:", reason);
        });
    }

    public on(event: string, handler: (data: any) => void): void {
        this.eventHandlers.set(event, handler);
        battleSocketClient.on(event, handler);
    }

    public destroy(): void {
        this.eventHandlers.forEach((handler, event) => {
            battleSocketClient.off(event, handler);
        });
        this.eventHandlers.clear();
    }
}

import { PlayerManager } from "../../entities/player/PlayerManager";

export interface PlayerContext {
    id: string;
    name?: string;
    damagePercentage?: number;
    manager: PlayerManager;
    isLocal: boolean;
    spawnPosition: { x: number; y: number };
}

export interface PlayerSpawnConfig {
    localPlayerId: string;
    opponentId: string;
    localSpawnPosition: { x: number; y: number };
    opponentSpawnPosition: { x: number; y: number };
    roomId: string;
}

export class PlayerContextManager {
    private playerContexts: Map<string, PlayerContext> = new Map();
    private localPlayerId: string | null = null;

    constructor(private scene: Phaser.Scene) {}

    public setupPlayers(config: PlayerSpawnConfig): Map<string, PlayerContext> {
        this.localPlayerId = config.localPlayerId;

        const localPlayer = new PlayerManager(this.scene, true, config.roomId, config.localPlayerId);
        const opponentPlayer = new PlayerManager(this.scene, false, config.roomId, config.opponentId);

        // Create players at spawn positions directly - no setSpawnPosition method needed
        const localSprite = localPlayer.createPlayer(config.localSpawnPosition.x, config.localSpawnPosition.y);
        const opponentSprite = opponentPlayer.createPlayer(config.opponentSpawnPosition.x, config.opponentSpawnPosition.y);

        // Ensure remote player is above platform
        this.adjustPlayerDepth(opponentSprite);

        const localContext: PlayerContext = {
            id: config.localPlayerId,
            manager: localPlayer,
            isLocal: true,
            spawnPosition: config.localSpawnPosition
        };

        const opponentContext: PlayerContext = {
            id: config.opponentId,
            manager: opponentPlayer,
            isLocal: false,
            spawnPosition: config.opponentSpawnPosition
        };

        this.playerContexts.set(config.localPlayerId, localContext);
        this.playerContexts.set(config.opponentId, opponentContext);

        return this.playerContexts;
    }

    private adjustPlayerDepth(playerSprite: Phaser.Physics.Arcade.Sprite): void {
        const platform = (this.scene as any).platform;
        if (platform && playerSprite && playerSprite.y > platform.y) {
            const bodyHeight = playerSprite.body ? playerSprite.body.height : 0;
            playerSprite.y = platform.y - bodyHeight;
        }
    }

    public getLocalPlayerContext(): PlayerContext | undefined {
        return this.localPlayerId ? this.playerContexts.get(this.localPlayerId) : undefined;
    }

    public getPlayerContext(id: string): PlayerContext | undefined {
        return this.playerContexts.get(id);
    }

    public getAllPlayerContexts(): Map<string, PlayerContext> {
        return this.playerContexts;
    }

    public updatePlayers(delta: number): void {
        this.playerContexts.forEach(player => {
            player.manager.update(); // PlayerManager.update() takes no parameters
        });
    }

    public destroy(): void {
        this.playerContexts.forEach(player => {
            player.manager.destroy();
        });
        this.playerContexts.clear();
        this.localPlayerId = null;
    }
}

export interface CameraConfig {
    zoom: number;
    followOffset: { x: number; y: number };
    bounds: { x: number; y: number; width: number; height: number };
    lerpSpeed: number;
}

export class ArenaCameraManager {
    private camera: Phaser.Cameras.Scene2D.Camera;
    private config: CameraConfig;
    private target: Phaser.GameObjects.GameObject | null = null;

    constructor(scene: Phaser.Scene, config: CameraConfig) {
        this.camera = scene.cameras.main;
        this.config = config;
        this.setupCamera();
    }

    private setupCamera(): void {
        this.camera.setZoom(this.config.zoom);
        this.camera.setBounds(
            this.config.bounds.x, 
            this.config.bounds.y, 
            this.config.bounds.width, 
            this.config.bounds.height
        );
    }

    public followTarget(target: Phaser.GameObjects.GameObject): void {
        this.target = target;
        this.camera.startFollow(target, true, this.config.lerpSpeed, this.config.lerpSpeed);
        this.camera.followOffset.set(this.config.followOffset.x, this.config.followOffset.y);
    }

    public stopFollowing(): void {
        this.camera.stopFollow();
        this.target = null;
    }

    public update(): void {
        // Custom camera update logic if needed
    }

    public destroy(): void {
        this.stopFollowing();
    }
} 