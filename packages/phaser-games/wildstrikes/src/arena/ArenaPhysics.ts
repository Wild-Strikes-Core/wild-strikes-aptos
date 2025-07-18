export class ArenaPhysics {
    private scene: Phaser.Scene;
    private platformRect!: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public createPlatforms(): void {
        console.log("Creating platforms...");

        // Create an invisible static body to act as the ground. This is more
        // reliable than using and configuring a static image.
        const platformWidth = this.scene.cameras.main.width * 2; // ensure wide
        const platformHeight = 60;
        const platformY = this.scene.cameras.main.height - platformHeight / 2;
        const platformX = this.scene.cameras.main.width / 2;

        // Create an invisible rectangle graphics object
        this.platformRect = this.scene.add.rectangle(
            platformX,
            platformY,
            platformWidth,
            platformHeight,
            0x000000,
            0 // fully transparent
        );
        // Add static physics body
        this.scene.physics.add.existing(this.platformRect, true);

        console.log(
            `Invisible platform created at (${platformX}, ${platformY}) size ${platformWidth}x${platformHeight}`
        );
    }

    public addPlatformCollider(sprite: Phaser.Physics.Arcade.Sprite): void {
        if (this.platformRect && sprite && sprite.body) {
            // Remove any existing colliders first to prevent duplicates
            this.scene.physics.world.colliders
                .getActive()
                .filter(
                    (collider) =>
                        (collider.object1 === sprite &&
                            collider.object2 === this.platformRect.body) ||
                        (collider.object1 === this.platformRect.body &&
                            collider.object2 === sprite)
                )
                .forEach((collider) => collider.destroy());

            // Add a fresh collider
            const collider = this.scene.physics.add.collider(
                sprite,
                this.platformRect
            );

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

    public getPlatform(): Phaser.GameObjects.Rectangle {
        return this.platformRect;
    }

    public setupPhysicsDebug(enabled: boolean = false): void {
        // Disable physics debug rendering
        this.scene.physics.world.drawDebug = enabled;
        if (!enabled) {
            this.scene.physics.world.debugGraphic.clear();
        }
    }

    public destroy(): void {
        if (this.platformRect) {
            this.platformRect.destroy();
        }
    }
}
