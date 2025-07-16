export interface MapConfig {
    name: string;
    backgroundKey: string;
    musicKey: string;
}

export class ArenaBackground {
    private scene: Phaser.Scene;
    private background!: Phaser.GameObjects.Sprite;
    private background_2!: Phaser.GameObjects.Sprite;
    private background_3!: Phaser.GameObjects.Sprite;
    private grass!: Phaser.GameObjects.Sprite;
    
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
    
    private selectedMap: MapConfig | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.selectedMap = this.mapConfigs[0]; // Default to forest
    }

    public createBackground(): void {
        console.log("Creating background for map:", this.selectedMap?.name);
        
        if (!this.selectedMap) {
            console.error("No map selected for background creation");
            return;
        }

        if (this.selectedMap.name === "forest") {
            this.createForestBackground();
        } else {
            this.createSingleImageBackground();
        }
    }

    private createForestBackground(): void {
        // Forest map uses spritesheet frames from newMap
        this.background = this.scene.add.sprite(960, 544, this.selectedMap!.backgroundKey, 0);
        this.background.setDepth(-4);

        this.background_2 = this.scene.add.sprite(960, 560, this.selectedMap!.backgroundKey, 1);
        this.background_2.setDepth(-3);

        this.background_3 = this.scene.add.sprite(960, 656, this.selectedMap!.backgroundKey, 2);
        this.background_3.setDepth(-2);

        this.grass = this.scene.add.sprite(960, 656, this.selectedMap!.backgroundKey, 3);
        this.grass.setDepth(-1);
    }

    private createSingleImageBackground(): void {
        // Single image maps (Philippines, Japan, France)
        this.background = this.scene.add.sprite(960, 540, this.selectedMap!.backgroundKey);
        this.background.setDisplaySize(1920, 1080);
        this.background.setDepth(-4);
        
        // Create hidden placeholder sprites for consistency
        this.background_2 = this.scene.add.sprite(0, 0, "").setVisible(false);
        this.background_3 = this.scene.add.sprite(0, 0, "").setVisible(false);
        this.grass = this.scene.add.sprite(0, 0, "").setVisible(false);
    }

    public recreateBackground(): void {
        if (!this.selectedMap) return;
        
        // Destroy existing background sprites
        if (this.background) this.background.destroy();
        if (this.background_2) this.background_2.destroy();
        if (this.background_3) this.background_3.destroy();
        if (this.grass) this.grass.destroy();
        
        // Create new background
        this.createBackground();
    }

    public setSelectedMap(mapData: string | MapConfig): void {
        if (typeof mapData === 'string') {
            // Legacy string format
            const mapConfig = this.mapConfigs.find(config => config.name === mapData);
            if (mapConfig) {
                this.selectedMap = mapConfig;
                console.log("Map selected:", mapData);
            } else {
                console.warn("Unknown map:", mapData);
            }
        } else {
            // Object format
            const mapConfig = this.mapConfigs.find(config => config.name === mapData.name);
            if (mapConfig) {
                this.selectedMap = mapConfig;
                console.log("Map selected:", mapData.name);
            } else {
                console.warn("Unknown map:", mapData);
            }
        }
    }

    public getSelectedMap(): MapConfig | null {
        return this.selectedMap;
    }
    
    public getBackgroundSprite(): Phaser.GameObjects.Sprite | null {
        return this.background || null;
    }
    
    public getBackgroundSprites(): Phaser.GameObjects.Sprite[] {
        return [this.background, this.background_2, this.background_3, this.grass].filter(
            sprite => sprite && sprite.visible
        ) as Phaser.GameObjects.Sprite[];
    }

    public getMapConfigs(): MapConfig[] {
        return this.mapConfigs;
    }

    public destroy(): void {
        if (this.background) this.background.destroy();
        if (this.background_2) this.background_2.destroy();
        if (this.background_3) this.background_3.destroy();
        if (this.grass) this.grass.destroy();
    }
}
