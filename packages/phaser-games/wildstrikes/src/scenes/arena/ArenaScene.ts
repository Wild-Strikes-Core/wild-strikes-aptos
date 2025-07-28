import { MapManager } from "./MapManager";
import { AssetLoader } from "../../AssetLoader";
import { DebugMode } from "./DebugMode";
import { PlayerManager } from "./player/PlayerManager";

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

// ========================================
// VALIDATION & UTILITIES
// ========================================

class PlayerSpawnValidator {
    private static readonly MIN_SPAWN_DISTANCE = 100;
    private static readonly MAX_PLAYERS = 8;
    private static readonly RESERVED_IDS = ['system', 'server', 'ai'];

    static validateSpawnRequest(
        playerId: string, 
        spawnConfig: SpawnConfig, 
        existingPlayers: Map<string, PlayerContext>
    ): { valid: boolean; error?: string } {
        // Check for duplicate ID
        if (existingPlayers.has(playerId)) {
            return { valid: false, error: `Player with ID '${playerId}' already exists` };
        }

        // Check for reserved IDs
        if (this.RESERVED_IDS.includes(playerId.toLowerCase())) {
            return { valid: false, error: `Player ID '${playerId}' is reserved` };
        }

        // Check maximum players
        if (existingPlayers.size >= this.MAX_PLAYERS) {
            return { valid: false, error: `Maximum players (${this.MAX_PLAYERS}) reached` };
        }

        // Check spawn position conflicts
        const tooClose = Array.from(existingPlayers.values()).some(player => {
            const distance = Phaser.Math.Distance.Between(
                spawnConfig.x, spawnConfig.y,
                player.spawnPosition.x, player.spawnPosition.y
            );
            return distance < this.MIN_SPAWN_DISTANCE;
        });

        if (tooClose) {
            return { valid: false, error: `Spawn position too close to existing player` };
        }

        // Validate spawn bounds (assuming scene dimensions)
        if (spawnConfig.x < 0 || spawnConfig.x > 1920 || spawnConfig.y < 0 || spawnConfig.y > 1080) {
            return { valid: false, error: `Spawn position out of bounds` };
        }

        return { valid: true };
    }
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

    // Enhanced player management with context
    private playerContexts: Map<string, PlayerContext> = new Map();
    private localPlayerId: string | null = null;
    private localPlayerController: LocalPlayerController | null = null;

    private currentMapConfig: any;
    
    // Enable/disable debug mode - set to false for production
    private static readonly DEBUG_ENABLED = true;

    preload(): void {
        this.mapManager = new MapManager();
        
        // Load gameplay and audio assets needed for the arena
        const loader = new AssetLoader(this.load);
        loader.loadGroup('gameplay');
        loader.loadGroup('gameplay-audio');
        // Load character sprites
        loader.loadGroup('chars');

        // this.load.plugin('rexvirtualjoystickplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js', true);
    }

    create(): void {
        // Get a random map configuration
        this.currentMapConfig = this.mapManager.getRandomMapConfig();

        // Set up the map background and music
        this.mapManager.setupMap(this, this.currentMapConfig);

        // Initialize debug mode if enabled
        if (Arena.DEBUG_ENABLED) {
            this.debugMode = new DebugMode(this);
            this.debugMode.enable();
            this.debugMode.initialize(this.mapManager, this.currentMapConfig);
        }

        // Create players using the new enhanced system
        const spawnX = this.cameras.main.width / 2; // Center horizontally
        const spawnY = 200; // High up in the air
        
        this.spawnPlayer('playerONE', {
            x: spawnX,
            y: spawnY,
            team: 'blue',
            name: 'Local Player',
            health: 100
        }, true);

        this.spawnPlayer('playerTWO', {
            x: spawnX + 300,
            y: spawnY,
            team: 'red',
            name: 'AI Player',
            health: 100
        }, false);
    }
    update(time: number, delta: number): void {
        // Update debug mode if enabled
        if (Arena.DEBUG_ENABLED && this.debugMode) {
            this.debugMode.update(time, delta);
        }

        // Update all player managers
        this.playerContexts.forEach((playerContext) => {
            playerContext.manager.update();
            playerContext.lastUpdate = time;
        });

        // Update local player controller
        if (this.localPlayerController) {
            this.localPlayerController.updateCamera();
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
        // Validate spawn request
        const validation = PlayerSpawnValidator.validateSpawnRequest(playerId, spawnConfig, this.playerContexts);
        if (!validation.valid) {
            console.error(`Failed to spawn player '${playerId}': ${validation.error}`);
            return false;
        }

        try {
            // Create player manager
            const playerManager = new PlayerManager(this, isLocal);
            playerManager.createPlayer(spawnConfig.x, spawnConfig.y);

            // Create player context
            const playerContext: PlayerContext = {
                id: playerId,
                manager: playerManager,
                isLocal,
                team: spawnConfig.team || 'neutral',
                health: spawnConfig.health || 100,
                name: spawnConfig.name || playerId,
                spawnPosition: { x: spawnConfig.x, y: spawnConfig.y },
                lastUpdate: this.time.now
            };

            // Store player context
            this.playerContexts.set(playerId, playerContext);

            // Set up local player specifics
            if (isLocal) {
                this.localPlayerId = playerId;
                this.localPlayerController = new LocalPlayerController(this, this.cameras.main, playerContext);
            }

            console.log(`Successfully spawned player '${playerId}' at (${spawnConfig.x}, ${spawnConfig.y})`);
            return true;

        } catch (error) {
            console.error(`Error spawning player '${playerId}':`, error);
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
}
