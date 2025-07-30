import { MapManager } from "./MapManager";
import { AssetLoader } from "../../AssetLoader";
import { DebugMode } from "./DebugMode";
import { PlayerManager } from "./player/PlayerManager";
import { NetworkStateManager } from "./player/NetworkStateManager";
import { battleSocketClient} from "../../shared-utils/BattleSocketClient";

// ========================================
// INTERFACES & TYPES
// ========================================

interface PlayerContext {
    id: string;
    manager: PlayerManager;
    isLocal: boolean;
    team?: string;
    health?: number;
    name?: string;
    spawnPosition: { x: number; y: number };
    lastUpdate: number;
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
        this.setupInput();
        this.setupUI();
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

    private setupInput(): void {
        // Input setup specific to local players
        // This could include UI interactions, menus, etc.
        console.log(`Setting up input for local player: ${this.playerContext.id}`);
    }

    private setupUI(): void {
        // UI overlay setup for local players (health bars, minimap, etc.)
        console.log(`Setting up UI overlay for local player: ${this.playerContext.id}`);
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
    private debugMode: DebugMode;
    private networkStateManager: NetworkStateManager;

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
        }): void {
        console.log("=== ARENA SCENE INIT ===");
        console.log("Received data:", data);
        
        this.currentMapConfig = data.mapConfig;
        this.yourData = data.yourData;
        this.yourId = data.yourId;
        this.opponentId = data.opponentId;
        this.opponentData = data.opponentData;
        this.p1SpawnPosition = data.p1SpawnPosition;
        this.p2SpawnPosition = data.p2SpawnPosition;

        // Validate required data
        if (!this.yourId || !this.opponentId) {
            console.error("❌ Missing player IDs in Arena init");
        }
        if (!this.p1SpawnPosition || !this.p2SpawnPosition) {
            console.error("❌ Missing spawn positions in Arena init");
        }
        if (!this.currentMapConfig) {
            console.error("❌ Missing map config in Arena init");
        }

        console.log("=== ARENA INIT COMPLETE ===");
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
        battleSocketClient.connect();
        const isConnected: boolean = battleSocketClient.isSocketConnected();
        console.log(`🔌 Socket connected: ${isConnected}`);
        console.log(`🆔 Socket ID: ${battleSocketClient.getId()}`);

        // Initialize map manager
        this.mapManager = new MapManager();

        // Initialize network state manager for multiplayer sync
        this.networkStateManager = new NetworkStateManager(this);

        console.log("Arena scene created");

        // Initialize debug mode if enabled
        if (Arena.DEBUG_ENABLED) {
            this.debugMode = new DebugMode(this);
            this.debugMode.enable();
        }

        // Always set up network listeners to receive player data from server

        // If we received mapConfig directly, use it immediately for map setup
        if (this.currentMapConfig) {
            console.log("Using mapConfig received from MatchFound scene");
            this.setupMapAndPlayers();
           // Send ready signal to start the battle
            console.log("Sending ready signal to start battle...");
            battleSocketClient.startBattle();
        } else {
            console.log("No mapConfig received, will wait for server selection");
        }


    }

    private setupMapAndPlayers(): void {
        console.log("Setting up map with config:", this.currentMapConfig);

        // Convert server map config to client map config
        const clientMapConfig = this.convertServerMapToClientMap(this.currentMapConfig);

        // Set up the map background and music
        this.mapManager.setupMap(this, clientMapConfig);

        console.log("Map setup complete, initializing debug mode...");

        // Initialize debug mode with the selected map
        if (Arena.DEBUG_ENABLED && this.debugMode) {
            this.debugMode.initialize(this.mapManager, clientMapConfig);
        }

        // Create players using spawn points from server
        console.log("=== PLAYER SPAWNING DEBUG ===");
        console.log(`Your ID: ${this.yourId} (Local Player)`);
        console.log(`Opponent ID: ${this.opponentId} (Remote Player)`);
        console.log(`P1 Spawn Position: (${this.p1SpawnPosition.x}, ${this.p1SpawnPosition.y})`);
        console.log(`P2 Spawn Position: (${this.p2SpawnPosition.x}, ${this.p2SpawnPosition.y})`);
        console.log(`Your Data:`, this.yourData);
        console.log(`Opponent Data:`, this.opponentData);
        console.log("================================");

        // Spawn local player (you) at P1 position
        console.log(`🎯 Spawning LOCAL player (${this.yourId}) at P1 position: (${this.p1SpawnPosition.x}, ${this.p1SpawnPosition.y})`);
        const localSpawnSuccess = this.spawnPlayer(this.yourId, this.p1SpawnPosition, true);
        console.log(`Local player spawn ${localSpawnSuccess ? 'SUCCESS' : 'FAILED'}`);

        // Set up network state manager with local player
        if (localSpawnSuccess) {
            const localPlayerContext = this.playerContexts.get(this.yourId);
            if (localPlayerContext) {
                this.networkStateManager.setLocalPlayer(localPlayerContext.manager);
                console.log('Network state manager configured with local player');
            }
        }

        // Spawn opponent as remote player at P2 position ONLY
        console.log(`🎯 Spawning OPPONENT (${this.opponentId}) as REMOTE player at P2 position: (${this.p2SpawnPosition.x}, ${this.p2SpawnPosition.y})`);
        this.networkStateManager.spawnRemotePlayer(this.opponentId, this.p2SpawnPosition);
        
        // Don't spawn opponent locally - let the network manager handle it
        console.log(`Remote opponent spawn initiated`);

        if (localSpawnSuccess) {
            console.log("✅ Local player spawned successfully!");
            // Log final positions after a short delay to ensure everything is set up
            this.time.delayedCall(100, () => {
                this.logPlayerPositions();
            });
        } else {
            console.error("❌ Local player spawning failed!");
        }
    }


    private convertServerMapToClientMap(serverMap: any): any {
        console.log("Converting server map to client map:", serverMap);
        
        // Convert server map format to client MapConfig format
        const clientMap = {
            name: serverMap.name,
            backgroundKey: serverMap.backgroundImage,
            musicKey: serverMap.backgroundMusic
        };
        
        console.log("Converted to client map:", clientMap);
        return clientMap;
    }

 
    update(time: number, delta: number): void {
        // Update debug mode if enabled
        if (Arena.DEBUG_ENABLED && this.debugMode) {
            this.debugMode.update(time, delta);
        }

        // Update all player managers
        this.playerContexts.forEach((playerContext) => {
            playerContext.manager.update(delta);
            playerContext.lastUpdate = time;
        });

        // Update local player controller
        if (this.localPlayerController) {
            this.localPlayerController.updateCamera();
        }

        // Update network state manager for multiplayer sync
        if (this.networkStateManager) {
            this.networkStateManager.update();
        }

        // Debug: Test network sync every 2 seconds
        if (this.time.now % 2000 < 16) {
            console.log("🔍 Testing network sync...");
            const localPlayer = this.getLocalPlayer();
            if (localPlayer) {
                console.log(`📍 Local player position: (${localPlayer.x.toFixed(1)}, ${localPlayer.y.toFixed(1)})`);
            }
            
            const remotePlayers = this.networkStateManager.getRemotePlayers();
            console.log(`🌐 Remote players count: ${remotePlayers.size}`);
            remotePlayers.forEach((remoteData, playerId) => {
                const sprite = remoteData.manager.getPlayerSprite();
                if (sprite) {
                    console.log(`📍 Remote player ${playerId}: (${sprite.x.toFixed(1)}, ${sprite.y.toFixed(1)})`);
                }
            });

            // Test manual network sync
            this.networkStateManager.testNetworkSync();
        }
    }

    /* ------------------------------------------------------------------
     * Scene shutdown cleanup
     * ------------------------------------------------------------------ */
    shutdown(): void {
        // Clean up debug mode
        if (this.debugMode) {
            this.debugMode.destroy();
        }

        // Clean up map manager
        if (this.mapManager) {
            this.mapManager.destroy();
        }

        // Clean up network state manager
        if (this.networkStateManager) {
            this.networkStateManager.destroy();
        }

        // Clean up local player controller
        if (this.localPlayerController) {
            this.localPlayerController.destroy();
            this.localPlayerController = null;
        }

        // Clean up all player contexts
        this.playerContexts.forEach((context) => {
            context.manager.destroy?.();
        });
        this.playerContexts.clear();
    }

    destroy(): void {
        this.shutdown();
    }

    // ========================================
    // ENHANCED PLAYER MANAGEMENT
    // ========================================

    /**
     * Spawn a player with enhanced validation and context management
     * @param playerId - Unique identifier for the player
     * @param spawnConfig - Spawn configuration including position and metadata
     * @param isLocal - Whether this is the local player
     * @returns Whether the spawn was successful
     */
    spawnPlayer(playerId: string, spawnConfig: SpawnConfig, isLocal: boolean = false): boolean {
        console.log(`🎮 SPAWNING PLAYER: '${playerId}' at (${spawnConfig.x}, ${spawnConfig.y}) - ${isLocal ? 'LOCAL' : 'REMOTE'}`);

        // Validate spawn configuration
        if (!spawnConfig || typeof spawnConfig.x !== 'number' || typeof spawnConfig.y !== 'number') {
            console.error(`❌ Invalid spawn config for player '${playerId}':`, spawnConfig);
            return false;
        }

        // Check if player already exists
        if (this.playerContexts.has(playerId)) {
            console.warn(`⚠️ Player '${playerId}' already exists, removing old instance`);
            this.removePlayer(playerId);
        }

        try {
            console.log(`📦 Creating PlayerManager for '${playerId}' (input enabled: ${isLocal})`);
            // Create player manager
            const playerManager = new PlayerManager(this, isLocal);
            
            console.log(`🎯 Creating player sprite at position (${spawnConfig.x}, ${spawnConfig.y})`);
            const playerSprite = playerManager.createPlayer(spawnConfig.x, spawnConfig.y);
            
            if (!playerSprite) {
                console.error(`❌ PlayerManager.createPlayer returned null for '${playerId}'`);
                return false;
            }
            
            console.log(`✅ Player sprite created successfully for '${playerId}' at (${playerSprite.x}, ${playerSprite.y})`);

            // Create player context
            const playerContext: PlayerContext = {
                id: playerId,
                manager: playerManager,
                isLocal,
                team: spawnConfig.team || (isLocal ? 'player1' : 'player2'),
                health: spawnConfig.health || 100,
                name: spawnConfig.name || (isLocal ? 'You' : 'Opponent'),
                spawnPosition: { x: spawnConfig.x, y: spawnConfig.y },
                lastUpdate: this.time.now
            };

            // Store player context
            this.playerContexts.set(playerId, playerContext);

            // Set up local player specifics
            if (isLocal) {
                console.log(`🎮 Setting up local player controller for '${playerId}'`);
                this.localPlayerId = playerId;
                this.localPlayerController = new LocalPlayerController(this, this.cameras.main, playerContext);
            }

            console.log(`🎉 Successfully spawned player '${playerId}' (${isLocal ? 'LOCAL' : 'REMOTE'}) at (${spawnConfig.x}, ${spawnConfig.y})`);
            console.log(`📊 Total players in arena: ${this.playerContexts.size}`);
            
            // Log player details
            const sprite = playerContext.manager.getPlayerSprite();
            console.log(`📍 Final sprite position: (${sprite?.x}, ${sprite?.y})`);
            
            return true;

        } catch (error) {
            console.error(`❌ Error spawning player '${playerId}':`, error);
            console.error(`🔍 Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
            return false;
        }
    }

    /**
     * Remove a player from the arena
     * @param playerId - The player ID to remove
     * @returns Whether the removal was successful
     */
    removePlayer(playerId: string): boolean {
        const playerContext = this.playerContexts.get(playerId);
        if (!playerContext) {
            console.warn(`Player '${playerId}' not found for removal`);
            return false;
        }

        try {
            // Clean up local player controller if this is the local player
            if (playerContext.isLocal && this.localPlayerController) {
                this.localPlayerController.destroy();
                this.localPlayerController = null;
                this.localPlayerId = null;
            }

            // Destroy player manager
            playerContext.manager.destroy?.();

            // Remove from contexts
            this.playerContexts.delete(playerId);

            console.log(`Successfully removed player '${playerId}'`);
            return true;

        } catch (error) {
            console.error(`Error removing player '${playerId}':`, error);
            return false;
        }
    }

    // ========================================
    // PLAYER QUERY METHODS
    // ========================================

    /**
     * Get the local player sprite
     */
    getLocalPlayer(): Phaser.Physics.Arcade.Sprite | null {
        if (!this.localPlayerId) return null;
        
        const localPlayerContext = this.playerContexts.get(this.localPlayerId);
        return localPlayerContext?.manager.getPlayerSprite() || null;
    }

    /**
     * Get all player sprites
     */
    getAllPlayers(): Phaser.Physics.Arcade.Sprite[] {
        return Array.from(this.playerContexts.values())
            .map(context => context.manager.getPlayerSprite())
            .filter(sprite => sprite !== null);
    }

    /**
     * Get player context by ID
     */
    getPlayerContext(playerId: string): PlayerContext | null {
        return this.playerContexts.get(playerId) || null;
    }

    /**
     * Get all player contexts
     */
    getAllPlayerContexts(): PlayerContext[] {
        return Array.from(this.playerContexts.values());
    }

    /**
     * Get players by team
     */
    getPlayersByTeam(team: string): PlayerContext[] {
        return Array.from(this.playerContexts.values())
            .filter(context => context.team === team);
    }

    /**
     * Get local player context
     */
    getLocalPlayerContext(): PlayerContext | null {
        return this.localPlayerId ? this.playerContexts.get(this.localPlayerId) || null : null;
    }

    /**
     * Update player health
     */
    updatePlayerHealth(playerId: string, health: number): boolean {
        const playerContext = this.playerContexts.get(playerId);
        if (playerContext) {
            playerContext.health = Math.max(0, Math.min(100, health));
            return true;
        }
        return false;
    }

    /**
     * Get arena statistics
     */
    getArenaStats(): {
        totalPlayers: number;
        localPlayers: number;
        teamCounts: Record<string, number>;
        averageHealth: number;
    } {
        const contexts = Array.from(this.playerContexts.values());
        const teamCounts: Record<string, number> = {};
        let totalHealth = 0;

        contexts.forEach(context => {
            teamCounts[context.team || 'neutral'] = (teamCounts[context.team || 'neutral'] || 0) + 1;
            totalHealth += context.health || 0;
        });

        return {
            totalPlayers: contexts.length,
            localPlayers: contexts.filter(c => c.isLocal).length,
            teamCounts,
            averageHealth: contexts.length > 0 ? totalHealth / contexts.length : 0
        };
    }

    // ========================================
    // ADVANCED PLAYER OPERATIONS
    // ========================================

    /**
     * Respawn a player at a new location
     */
    respawnPlayer(playerId: string, spawnConfig: SpawnConfig): boolean {
        const existingContext = this.playerContexts.get(playerId);
        if (!existingContext) {
            console.warn(`Cannot respawn non-existent player: ${playerId}`);
            return false;
        }

        const wasLocal = existingContext.isLocal;
        const originalTeam = existingContext.team;
        const originalName = existingContext.name;

        // Remove existing player
        if (!this.removePlayer(playerId)) {
            return false;
        }

        // Respawn with updated config
        const newConfig: SpawnConfig = {
            ...spawnConfig,
            team: spawnConfig.team || originalTeam,
            name: spawnConfig.name || originalName
        };

        return this.spawnPlayer(playerId, newConfig, wasLocal);
    }

    /**
     * Switch a player to a different team
     */
    switchPlayerTeam(playerId: string, newTeam: string): boolean {
        const playerContext = this.playerContexts.get(playerId);
        if (playerContext) {
            const oldTeam = playerContext.team;
            playerContext.team = newTeam;
            console.log(`Player '${playerId}' switched from team '${oldTeam}' to '${newTeam}'`);
            return true;
        }
        return false;
    }

    /**
     * Find the closest player to a given position
     */
    findClosestPlayer(x: number, y: number, excludePlayerId?: string): PlayerContext | null {
        let closestPlayer: PlayerContext | null = null;
        let closestDistance = Infinity;

        this.playerContexts.forEach((context) => {
            if (excludePlayerId && context.id === excludePlayerId) return;

            const playerSprite = context.manager.getPlayerSprite();
            if (playerSprite) {
                const distance = Phaser.Math.Distance.Between(x, y, playerSprite.x, playerSprite.y);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPlayer = context;
                }
            }
        });

        return closestPlayer;
    }

    /**
     * Get players within a certain radius
     */
    getPlayersInRadius(x: number, y: number, radius: number, excludePlayerId?: string): PlayerContext[] {
        const playersInRadius: PlayerContext[] = [];

        this.playerContexts.forEach((context) => {
            if (excludePlayerId && context.id === excludePlayerId) return;

            const playerSprite = context.manager.getPlayerSprite();
            if (playerSprite) {
                const distance = Phaser.Math.Distance.Between(x, y, playerSprite.x, playerSprite.y);
                if (distance <= radius) {
                    playersInRadius.push(context);
                }
            }
        });

        return playersInRadius;
    }

    /**
     * Check if a player ID is already taken
     */
    isPlayerIdTaken(playerId: string): boolean {
        return this.playerContexts.has(playerId);
    }

    /**
     * Generate a unique player ID
     */
    generateUniquePlayerId(baseId: string = 'player'): string {
        let counter = 1;
        let candidateId = baseId;

        while (this.isPlayerIdTaken(candidateId)) {
            candidateId = `${baseId}${counter}`;
            counter++;
        }

        return candidateId;
    }

    /**
     * Batch update multiple players' health
     */
    batchUpdateHealth(updates: Array<{ playerId: string; health: number }>): void {
        updates.forEach(update => {
            this.updatePlayerHealth(update.playerId, update.health);
        });
    }

    /**
     * Get debug information about all players
     */
    getDebugInfo(): string {
        const stats = this.getArenaStats();
        const playerList = Array.from(this.playerContexts.values())
            .map(context => {
                const sprite = context.manager.getPlayerSprite();
                return `  ${context.id}: ${context.name} (${context.team}) HP:${context.health} ${context.isLocal ? '[LOCAL]' : ''} @ (${sprite?.x?.toFixed(0) || '?'}, ${sprite?.y?.toFixed(0) || '?'})`;
            })
            .join('\n');

        return `Arena Debug Info:
Total Players: ${stats.totalPlayers}
Local Players: ${stats.localPlayers}
Average Health: ${stats.averageHealth.toFixed(1)}
Teams: ${Object.entries(stats.teamCounts).map(([team, count]) => `${team}:${count}`).join(', ')}

Players:
${playerList}`;
    }

    /**
     * Log current player positions for debugging
     */
    logPlayerPositions(): void {
        console.log("=== CURRENT PLAYER POSITIONS ===");
        
        // Log local players
        this.playerContexts.forEach((context, playerId) => {
            const sprite = context.manager.getPlayerSprite();
            console.log(`🎮 LOCAL ${playerId}: ${context.name} @ (${sprite?.x?.toFixed(1) || '?'}, ${sprite?.y?.toFixed(1) || '?'})`);
        });
        
        // Log remote players from network manager
        const remotePlayers = this.networkStateManager.getRemotePlayers();
        remotePlayers.forEach((remoteData, playerId) => {
            const sprite = remoteData.manager.getPlayerSprite();
            console.log(`👤 REMOTE ${playerId}: @ (${sprite?.x?.toFixed(1) || '?'}, ${sprite?.y?.toFixed(1) || '?'})`);
        });
        
        console.log("================================");
    }

    /**
     * Get the network state manager
     */
    getNetworkStateManager(): NetworkStateManager {
        return this.networkStateManager;
    }
}
