import { MapManager } from "./MapManager";
import { AssetLoader } from "../../AssetLoader";
import { DebugMode } from "./DebugMode";
import { PlayerManager } from "./PlayerManager";
import { PLAYER_1 } from "@shared/constants/constants";


export default class Arena extends Phaser.Scene {

    constructor() {
        super({ key: "Arena" });
    }

    private mapManager: MapManager;
    private debugMode: DebugMode;
    private playerManager: PlayerManager;
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
    }


    create(): void {
        // Get a random map configuration
        this.currentMapConfig = this.mapManager.getRandomMapConfig();

        // Set up the map background and music
        this.mapManager.setupMap(this, this.currentMapConfig);

        // Create animations from loaded animation JSON files
        this.createCharacterAnimations();

        // Initialize debug mode if enabled
        if (Arena.DEBUG_ENABLED) {
            this.debugMode = new DebugMode(this);
            this.debugMode.enable();
            this.debugMode.initialize(this.mapManager, this.currentMapConfig);
        }

        // Add any additional setup for the arena scene here
        this.playerManager = new PlayerManager(this);
        // Create player way above the platform (will fall down due to gravity)
        const spawnX = this.cameras.main.width / 2; // Center horizontally
        const spawnY = 200; // High up in the air
        const player = this.playerManager.createPlayer(spawnX, spawnY);
        
    }

    private createCharacterAnimations(): void {
        // Create animations from loaded animation JSON files
        try {
            // Check if animation data exists before creating
            const idleAnimData = this.cache.json.get('_Idle_1');
            const jumpAnimData = this.cache.json.get('_Jump_1');
            const attackAnimData = this.cache.json.get('_Attack_1');
            const runAnimData = this.cache.json.get('_Run_1');
            const dashAnimData = this.cache.json.get('_Dash_1');

            if (idleAnimData && idleAnimData.anims) {
                idleAnimData.anims.forEach((anim: any) => {
                    if (!this.anims.exists(anim.key)) {
                        this.anims.create(anim);
                    }
                });
            }

            if (jumpAnimData && jumpAnimData.anims) {
                jumpAnimData.anims.forEach((anim: any) => {
                    if (!this.anims.exists(anim.key)) {
                        this.anims.create(anim);
                    }
                });
            }

            if (attackAnimData && attackAnimData.anims) {
                attackAnimData.anims.forEach((anim: any) => {
                    if (!this.anims.exists(anim.key)) {
                        this.anims.create(anim);
                    }
                });
            }

            if (runAnimData && runAnimData.anims) {
                runAnimData.anims.forEach((anim: any) => {
                    if (!this.anims.exists(anim.key)) {
                        this.anims.create(anim);
                    }
                });
            }

            if (dashAnimData && dashAnimData.anims) {
                dashAnimData.anims.forEach((anim: any) => {
                    if (!this.anims.exists(anim.key)) {
                        this.anims.create(anim);
                    }
                });
            }

            console.log('Character animations created successfully');
        } catch (error) {
            console.error('Error creating character animations:', error);
        }
    }

    update(time: number, delta: number): void {
        // Update debug mode if enabled
        if (Arena.DEBUG_ENABLED && this.debugMode) {
            this.debugMode.update(time, delta);
        }

        // Update player manager for input handling and animations
        if (this.playerManager) {
            this.playerManager.update();
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
    }

    destroy(): void {
        this.shutdown();
    }
}
