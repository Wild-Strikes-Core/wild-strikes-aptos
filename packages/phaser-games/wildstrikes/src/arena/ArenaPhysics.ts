export class ArenaPhysics {
    private scene: Phaser.Scene;
    private platform!: Phaser.Physics.Arcade.Image;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public createPlatforms(): void {
        console.log("Creating platforms...");
        
        // Create the main platform
        this.platform = this.scene.physics.add.staticImage(48, 1088, "M_playerCard");
        this.platform.scaleX = 5;
        this.platform.alpha = 0.1;
        this.platform.alphaTopLeft = 0.1;
        this.platform.alphaTopRight = 0.1;
        this.platform.alphaBottomLeft = 0.1;
        this.platform.alphaBottomRight = 0.1;
        
        if (this.platform.body) {
            this.platform.body.pushable = false;
            this.platform.body.immovable = true;
            this.platform.body.setSize(830, 171, false);
        }
        
        console.log("Platform created:", this.platform);
        
        // Additional platform configuration from backup
        this.configurePlatform();
    }

    private configurePlatform(): void {
        if (this.platform) {
            console.log("Platform found, configuring...");
            this.platform.setOrigin(0.5, 0); // Center origin horizontally
            this.platform.setImmovable(true);

            // Adjust platform to match camera width with extra safety margin
            const cameraWidth = this.scene.cameras.main.width;
            const safetyMargin = 400; // Extra width on each side
            const totalWidth = cameraWidth + safetyMargin * 2;

            // Update both display width and physics body size
            this.platform.displayWidth = totalWidth;
            if (this.platform.body) {
                (this.platform.body as Phaser.Physics.Arcade.StaticBody).width =
                    totalWidth;
                this.platform.body.setSize(
                    totalWidth,
                    this.platform.body.height,
                    false
                );
            }

            // Position platform in the center of the camera view
            this.platform.x = cameraWidth / 2;

            // Ensure platform is enabled for physics
            if (this.platform.body) {
                this.platform.body.enable = true;
            }

            console.log(
                `Platform configured: width=${totalWidth}, position=(${this.platform.x}, ${this.platform.y})`
            );
        } else {
            console.error("Platform not found in createPlatforms");
        }
    }

    public addPlatformCollider(sprite: Phaser.Physics.Arcade.Sprite): void {
        if (this.platform && sprite && sprite.body) {
            // Remove any existing colliders first to prevent duplicates
            this.scene.physics.world.colliders
                .getActive()
                .filter(
                    (collider) =>
                        (collider.object1 === sprite &&
                            collider.object2 === this.platform) ||
                        (collider.object1 === this.platform &&
                            collider.object2 === sprite)
                )
                .forEach((collider) => collider.destroy());

            // Add a fresh collider
            const collider = this.scene.physics.add.collider(sprite, this.platform);

            // Store reference to help with debugging
            sprite.setData("platformCollider", collider);

            console.log(
                `Platform collider added to player at (${sprite.x}, ${sprite.y})`
            );
        } else {
            console.warn(
                "Could not add platform collider - sprite, platform, or body is missing"
            );
        }
    }

    public getPlatform(): Phaser.Physics.Arcade.Image {
        return this.platform;
    }

    public setupPhysicsDebug(enabled: boolean = false): void {
        // Disable physics debug rendering
        this.scene.physics.world.drawDebug = enabled;
        if (!enabled) {
            this.scene.physics.world.debugGraphic.clear();
        }
    }

    public destroy(): void {
        if (this.platform) {
            this.platform.destroy();
        }
    }
}
