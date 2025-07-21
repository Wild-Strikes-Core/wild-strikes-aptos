import { MapManager } from "./MapManager";
import { AssetLoader } from "../../AssetLoader";
import { DebugMode } from "./DebugMode";
import { PlayerManager } from "./PlayerManager";
import { MobileButton } from "./components/mobButton";


export default class Arena extends Phaser.Scene {

    constructor() {
        super({ key: "Arena" });
    }

    private mapManager: MapManager;
    private debugMode: DebugMode;

    private playerManager: Map<string, PlayerManager> = new Map();
    private localPlayer: string = 'playerONE';

    private currentMapConfig: any;

    private joystick: any;
    
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

        this.load.plugin('rexvirtualjoystickplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js', true);
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

        
        // Create player way above the platform (will fall down due to gravity)
        const spawnX = this.cameras.main.width / 2; // Center horizontally
        const spawnY = 200; // High up in the air
        
        this.spawnPlayer(this.localPlayer, spawnX, spawnY, true);
        this.spawnPlayer('playerTWO', spawnX + 300, spawnY, false);

        this.setupMobileControls();

    }
        

    update(time: number, delta: number): void {
        // Update debug mode if enabled
        if (Arena.DEBUG_ENABLED && this.debugMode) {
            this.debugMode.update(time, delta);
        }

        // Update player managers - this will call handleMovement() for each player
        this.playerManager.forEach((playerManager) => {
            playerManager.update();
        });
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

    setupMobileControls(): void {
        const localPlayerManager = this.playerManager.get(this.localPlayer);

        // movement joystick
        this.joystick = (this.plugins.get('rexvirtualjoystickplugin') as any).add(this, {
            x: 400,
            y: this.cameras.main.height - 300,
            radius: 100,
        });
        
        if (this.joystick) {
            this.joystick.base.setScrollFactor(0);
            this.joystick.thumb.setScrollFactor(0);
            this.joystick.base.setScale(0.8);
            this.joystick.thumb.setScale(0.8);
        }

        // Attack button
        const attackButton = new MobileButton(this, {
            x: this.cameras.main.width - 300,
            y: this.cameras.main.height - 200,
            radius: 50,
            color: 0xff0000,
            alpha: 0.5,
            text: 'ATK',
            onPress: () => {
                console.log('Attack button pressed!');
                localPlayerManager?.triggerLightAttack();
            }
        });

        // Jump button
        const jumpButton = new MobileButton(this, {
            x: this.cameras.main.width - 300,
            y: this.cameras.main.height - 320,
            radius: 45,
            color: 0x00ff00,
            alpha: 0.5,
            text: 'JUMP',
            onPress: () => {
                console.log('Jump button pressed!');
                localPlayerManager?.triggerJump();
            }
        });
    }


    // for multiplayer-proof code
    spawnPlayer(playerId: string, spawnX: number, spawnY: number, isLocal: boolean = false) : void {
        const playerManager = new PlayerManager(this, isLocal);
        playerManager.createPlayer(spawnX, spawnY);
        this.playerManager.set(playerId, playerManager);
        if (isLocal) {
            this.localPlayer = playerId;
            
            this.cameras.main.startFollow(playerManager.getPlayerSprite(), true);
            this.cameras.main.setZoom(1.3, 1.3);
            this.cameras.main.setBounds(0, 0, 1920, 1080);
        }
    }

    removePlayer(playerId: string): void {
        const player = this.playerManager.get(playerId);
        if (player) {
            player.destroy?.();
            this.playerManager.delete(playerId);
        }
    }

    getLocalPlayer(): Phaser.Physics.Arcade.Sprite | null {
        const localPlayer = this.playerManager.get(this.localPlayer);
        return localPlayer?.getPlayerSprite();
    }

    getAllPlayers(): Phaser.Physics.Arcade.Sprite[] {
        return Array.from(this.playerManager.values())
            .map(pm => pm.getPlayerSprite())
            .filter(sprite => sprite !== null);
    }
}
