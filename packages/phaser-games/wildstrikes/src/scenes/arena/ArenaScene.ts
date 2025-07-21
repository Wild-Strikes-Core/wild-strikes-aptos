import { MapManager } from "./MapManager";
import { AssetLoader } from "../../AssetLoader";
import { DebugMode } from "./DebugMode";
import { PlayerManager } from "./PlayerManager";


export default class Arena extends Phaser.Scene {

    constructor() {
        super({ key: "Arena" });
    }

    private mapManager: MapManager;
    private debugMode: DebugMode;

    private playerONE: PlayerManager;
    private playerTWO: PlayerManager;

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

        // Add any additional setup for the arena scene here
        this.playerONE = new PlayerManager(this);
        this.playerTWO = new PlayerManager(this, false); // Disable input for playerTWO (dummy)

        // Create player way above the platform (will fall down due to gravity)
        const spawnX = this.cameras.main.width / 2; // Center horizontally
        const spawnY = 200; // High up in the air
        
        this.playerONE.createPlayer(spawnX, spawnY);
        this.playerTWO.createPlayer(spawnX + 300, spawnY);

        

        this.cameras.main.startFollow(this.playerONE.getPlayerSprite(), true, 0.1, 0.1);
        this.cameras.main.setZoom(1.3, 1.3);
        this.cameras.main.setBounds(0, 0, 1920, 1080);

        this.setupMobileControls();

    }
        

    update(time: number, delta: number): void {
        // Update debug mode if enabled
        if (Arena.DEBUG_ENABLED && this.debugMode) {
            this.debugMode.update(time, delta);
        }

        // Update player managers
        if (this.playerONE) {
            this.playerONE.update();
            this.cameras.main.followOffset.set(-200, 0);
        }
        if (this.playerTWO) {
            this.playerTWO.update();
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

    setupMobileControls(): void {
        var joyStick = (this.plugins.get('rexvirtualjoystickplugin') as any).add(this, {
            x: 400,
            y: this.cameras.main.height - 300,
            radius: 100,
        })
        if (joyStick) {
            joyStick.base.setScrollFactor(0);
            joyStick.thumb.setScrollFactor(0);
            // Scale down the joystick to fit better with camera zoom
            joyStick.base.setScale(0.8);
            joyStick.thumb.setScale(0.8);
        }

        var button = this.add.circle(this.cameras.main.width - 300, this.cameras.main.height - 200, 50, 0xff0000, 0.5)
            .setInteractive()
            .setScrollFactor(0)
            .setScale(0.8); // Scale down the button to fit better with camera zoom

        let isPressed = false;

        button.on('pointerdown', () => {
            isPressed = true;
            button.setFillStyle(0xff0000, 1);
            button.setScale(1.2);
            console.log('Attack');
        });

        button.on('pointerup', () => {
            isPressed = false;
            button.setFillStyle(0xff0000, 0.5);
            button.setScale(1);
        });

        button.on('pointerout', () => {
            if (isPressed) {
            isPressed = false;
            button.setFillStyle(0xff0000, 0.5);
            button.setScale(1);
            }
        });
    }
}
