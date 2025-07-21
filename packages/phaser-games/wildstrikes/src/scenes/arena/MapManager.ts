
export interface MapConfig {
    name: string;
    backgroundKey: string;
    musicKey: string;
}

export class MapManager {
    private readonly mapConfigs: MapConfig[] = [
        {
            name: "forest",
            backgroundKey: "newMap",
            musicKey: "in-match"
        },
        {
            name: "Philippines",
            backgroundKey: "Philippines", 
            musicKey: "PH-BG"
        },
        {
            name: "Japan",
            backgroundKey: "Japan",
            musicKey: "JPN-BG"
        },
        {
            name: "France",
            backgroundKey: "France",
            musicKey: "FRN-BG"
        }
    ];

    private currentMusic: Phaser.Sound.BaseSound | null = null;

    // Getter for debug mode to access map configs
    public get allMapConfigs(): MapConfig[] {
        return this.mapConfigs;
    }

    // Randomly selects a map configuration
    public getRandomMapConfig(): MapConfig {
        const randomIndex = Phaser.Math.Between(0, this.mapConfigs.length - 1);
        return this.mapConfigs[randomIndex];
    }

    // Stop current music if playing
    public stopCurrentMusic(): void {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.stop();
        }
        this.currentMusic = null;
    }

    // Sets up the map background and music
    public setupMap(scene: Phaser.Scene, mapConfig: MapConfig): void {
        // Stop any existing music first
        this.stopCurrentMusic();

        // Set background image
        const bg = scene.add.image(0, 0, mapConfig.backgroundKey);
        bg.setOrigin(0, 0);
        bg.setDisplaySize(scene.cameras.main.width, scene.cameras.main.height);
        bg.setDepth(-1000);

        // Create platform with physics body
        const platform = scene.physics.add.staticGroup();
        
        // Create a physics-enabled rectangle for the platform
        const platformSprite = scene.add.rectangle(scene.cameras.main.width / 2, scene.cameras.main.height - 50, scene.cameras.main.width, 100, 0x000000);
        platformSprite.setOrigin(0.5, 0.5);
        platformSprite.setDepth(-999);
        
        // Enable physics on the rectangle and add it to the static group
        scene.physics.add.existing(platformSprite, true); // true makes it static
        platform.add(platformSprite);
        
        // Store platform reference on scene for collision detection
        (scene as any).platform = platform;

        // Play background music - check if audio is loaded
        if (scene.cache.audio.exists(mapConfig.musicKey)) {
            this.currentMusic = scene.sound.add(mapConfig.musicKey, { loop: true, volume: 0.3 });
            this.currentMusic.play();
        } else {
            console.warn(`Music key "${mapConfig.musicKey}" not found in cache`);
        }
    }

    // Clean up resources when scene is destroyed
    public destroy(): void {
        this.stopCurrentMusic();
    }


}

    