// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
// No need to import bgClouds here - it's a class, not an asset
/* END-USER-IMPORTS */

/**
 * Preloader scene handles loading all game assets before the game starts
 * This prevents loading delays during gameplay and ensures smooth transitions
 */
export default class Preloader extends Phaser.Scene {
    constructor() {
        super("Preloader");

        /* START-USER-CTR-CODE */
        // Write your code here.
        /* END-USER-CTR-CODE */
    }

    editorCreate(): void {
        // Emit scene-awake event for any listeners
        this.events.emit("scene-awake");
    }

    /* START-USER-CODE */

    /**
     * Initialize the preloader scene
     * Sets up progress bar and event listeners
     */
    init() {
        this.editorCreate();

        // Create a visual progress bar to show loading status
        // This helps users understand that assets are loading
        const bar = this.add.rectangle(726, 524, 4, 28, 0xffffff);

        // Listen for loading progress updates
        this.load.on("progress", (progress: number) => {
            // Update the progress bar width based on loading percentage
            // The bar grows from 4px to 464px when fully loaded
            bar.width = 4 + 460 * progress;
        });
    }

    /**
     * Preload all game assets
     * Groups assets by categories for better organization
     */
    preload() {
        // PLUGINS
        // Load Rex Virtual Joystick plugin for mobile controls
        this.load.plugin('rexvirtualjoystickplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js', true);
        
        // UI ASSETS
        // Main menu and navigation screens
        this.load.pack("gameMenu", "assets/gameMenu-asset-pack.json"); // Main game menu UI
        this.load.pack("landingPage", "assets/landingPage-asset-pack.json"); // Initial landing page UI
        this.load.pack("settingsMenu", "assets/settingsMenu-asset-pack.json"); // Settings panel UI

        // Team and inventory management screens
        this.load.pack(
            "listofteamsMenu",
            "assets/listofteamsMenu-asset-pack.json"
        ); // Team listing screen
        this.load.pack("selectTeam", "assets/selectTeam-asset-pack.json"); // Team selection interface
        this.load.pack("invMenu", "assets/invMenu-asset-pack.json"); // Inventory system UI

        // GAME RESULT SCREENS
        this.load.pack("victoryPage", "assets/victoryPage-asset-pack.json"); // Winner UI elements
        this.load.pack("defeatPage", "assets/defeatPage-asset-pack.json"); // Defeated UI elements
        this.load.pack("drawPage", "assets/drawPage-asset-pack.json"); // Tie game UI elements

        // ADDITIONAL SCREENS
        this.load.pack("aboutMenu", "assets/aboutMenu-asset-pack.json"); // About/credits screen
        this.load.pack("leadMENU", "assets/leadMENU-asset-pack.json"); // Leaderboards UI

        // GAMEPLAY ASSETS
        // Match-related assets for the active gameplay
        this.load.pack(
            "matchMaking",
            "assets/Match/matchMaking-asset-pack.json"
        ); // Matchmaking UI
        this.load.pack("map", "assets/Match/map-asset-pack.json"); // Game map/battlefield
        this.load.pack("tiles", "assets/Match/02 - Map/tiles-asset-pack.json"); // Map tiles;
        this.load.pack("matchUI", "assets/Match/match-skills-assets-pack.json");
        this.load.pack("matchUI", "assets/Match/timerAnim.json");

        // CHARACTER ASSETS
        this.load.pack("sprite_heroP1", "assets/Sprites/Hero_P1-pack.json"); // Player 1 sprite assets
        this.load.pack(
            "placeholderChar",
            "assets/Sprites/placeholderCharacter/placeholderCharacter-sprite-asset-pack.json"
        ); // Player 1 sprite assets

        // ENVIRONMENT ASSETS
        // Background elements and environmental effects
        this.load.image(
            "2G_bgClouds_2",
            "assets/01 - Landing Page/Purple_Green_Pixel_Illustration_Game_Presentation__2_-removebg-preview.png"
        );
        
        // Main menu background
        this.load.image(
            "2G_bg",
            "assets/02 - Game Menu/2G_bg.png"
        );
    }

    /**
     * Called when all assets have been loaded
     * Initialize global game objects and proceed to the main game
     */
    create() {
        // Everything is now loaded and ready to use
        // This would be a good place to initialize game-wide systems

        // Log success message for debugging purposes
        console.log("All assets loaded successfully");

        // Transition to the main game scene
        // You could add a fade transition or other visual effect here
        this.scene.start("Start");
    }
    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here

