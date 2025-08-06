import { MapManager } from "../maps/MapManager";
import { AssetLoader } from "../../../../../AssetLoader";
import { ArenaCameraManager } from "../systems/camera/CameraManager";
import { BattleNetworkManager } from "../systems/network/BattleNetworkManager";
import { BattleConfig, DEFAULT_CAMERA_CONFIG } from "../config/BattleConfig";
import { PlayerManager } from "../entities/player/PlayerManager";

export default class Arena extends Phaser.Scene {
    private mapManager: MapManager;
    private cameraManager: ArenaCameraManager;
    private networkManager: BattleNetworkManager;
    private localPlayerManager: PlayerManager;
    private opponentPlayerManager: PlayerManager;
    
    private battleConfig: BattleConfig;
    
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
        
        this.cameraManager = new ArenaCameraManager(this, DEFAULT_CAMERA_CONFIG);
        this.networkManager = new BattleNetworkManager({
            localPlayerId: this.battleConfig.localPlayerId,
            opponentId: this.battleConfig.opponentId,
            roomId: this.battleConfig.roomId
        });
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
        this.setupNetworkListeners();
    }

    update(time: number, delta: number): void {
        this.cameraManager.update();
        this.localPlayerManager?.update();
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

    private setupCamera(): void {
        const localPlayerSprite = this.localPlayerManager.getPlayerSprite();
        if (localPlayerSprite) {
            this.cameras.main.startFollow(localPlayerSprite);
            this.cameras.main.setFollowOffset(0, 50);
            this.cameras.main.setDeadzone(100, 100);
        }
    }

    private setupPlayers(): void {
        // Create local player (with input enabled)
        this.localPlayerManager = new PlayerManager(
            this, 
            true, 
            this.battleConfig.roomId,
            this.battleConfig.localPlayerId
        );
        
        // ✅ Inject network manager for sending inputs
        this.localPlayerManager.setNetworkManager(this.networkManager);
        this.localPlayerManager.createPlayer(
            this.battleConfig.localSpawnPosition.x,
            this.battleConfig.localSpawnPosition.y
        );

        // Create opponent player (with input disabled)
        this.opponentPlayerManager = new PlayerManager(
            this, 
            false, 
            this.battleConfig.roomId,
            this.battleConfig.opponentId
        );
        
        this.opponentPlayerManager.createPlayer(
            this.battleConfig.opponentSpawnPosition.x,
            this.battleConfig.opponentSpawnPosition.y
        );

        // ✅ Set up hitbox collision detection between players
        this.setupPlayerHitboxCollisions();
        
    }

    private setupPlayerHitboxCollisions(): void {
        const localPlayerSprite = this.localPlayerManager.getPlayerSprite();
        const opponentPlayerSprite = this.opponentPlayerManager.getPlayerSprite();
        
        // Set up hitbox collision detection for local player's attacks against opponent
        if (localPlayerSprite && opponentPlayerSprite) {
            const localHitboxManager = this.localPlayerManager.getAttackHitboxManager();
            if (localHitboxManager) {
                console.log('[ARENA] 🥊 Setting up local player hitbox collisions with opponent');
                localHitboxManager.setOpponentPlayer(opponentPlayerSprite);
            }
            
            // Set up hitbox collision detection for opponent's attacks against local player
            const opponentHitboxManager = this.opponentPlayerManager.getAttackHitboxManager();
            if (opponentHitboxManager) {
                console.log('[ARENA] 🥊 Setting up opponent hitbox collisions with local player');
                opponentHitboxManager.setOpponentPlayer(localPlayerSprite);
            }
        } else {
            console.warn('[ARENA] ⚠️ Could not set up hitbox collisions - missing player sprites');
        }
    }

    private setupNetworkListeners(): void {
   
        // ✅ Handle battle start with player stats
        this.networkManager.onBattleStart((battleData: any) => {
            console.log('[ARENA] Battle start received with stats:', battleData);
            
            if (battleData.localPlayerStats) {
                // Update local player stats UI
                this.localPlayerManager.updatePlayerStats(battleData.localPlayerStats);
            }
        });

        // ✅ Handle server-authoritative player contexts
        this.networkManager.onPlayerContextsReceived((data: any) => {
            console.log('[ARENA] 📥 Server-authoritative player contexts received:', data);
            
            if (data.players && Array.isArray(data.players)) {
                data.players.forEach((playerContext: any) => {
                    console.log(`[ARENA] Player context for ${playerContext.socketId}:`, {
                        position: playerContext.position,
                        inputs: playerContext.inputs,
                        state: playerContext.state,
                        sequenceNumber: playerContext.sequenceNumber,
                        timestamp: playerContext.timestamp
                    });
                    
                    // Apply client-side prediction reconciliation or remote player updates
                    if (playerContext.socketId === this.battleConfig.localPlayerId) {
                        console.log('[ARENA] � Local player reconciliation data received');
                        // Reconcile local player predictions with server state
                        this.localPlayerManager.reconcileWithServer(playerContext);
                    } else {
                        console.log('[ARENA] 👤 Remote player update data received');
                        // Apply remote player state directly (no prediction needed)
                        this.updateRemotePlayer(playerContext);
                    }
                });
            }
        });
    }

    private updateRemotePlayer(playerContext: any): void {
        // 🎯 Option 1: Use PlayerManager method (cleaner approach)
        this.opponentPlayerManager.applyRemotePlayerState(playerContext);
        
        // 🎯 Option 2: Direct sprite manipulation (more control)
        // this.applyRemotePlayerState(playerContext);
        
        console.log(`[ARENA] 🤖 Updated remote player:`, {
            position: playerContext.position,
            velocity: { x: playerContext.velocityX, y: playerContext.velocityY },
            state: playerContext.state,
            inputs: playerContext.inputs
        });
    }

    shutdown(): void {
        this.cleanup();
    }

    destroy(): void {
        this.cleanup();
    }

    private cleanup(): void {
        this.cameraManager?.destroy();
        this.networkManager?.destroy();
        this.mapManager?.destroy();
        this.localPlayerManager?.destroy();
        this.opponentPlayerManager?.destroy();
    }
}
