export default class BgClouds extends Phaser.GameObjects.Image {
    constructor(
        scene: Phaser.Scene,
        x?: number,
        y?: number,
        texture?: string,
        frame?: number | string
    ) {
        // Check if the specified texture or default texture exists
        const textureToUse = texture || "2G_bgClouds_2";

        // Use the middle of screen for Y position if not specified (540 for 1080px height)
        const centerY = y ?? 540; // Vertical center of 1920x1080 screen

        // Use the specified texture if it exists, otherwise use a placeholder
        if (!scene.textures.exists(textureToUse)) {
            console.warn(
                `Texture ${textureToUse} not found. Using a placeholder.`
            );
            // Create a simple rectangle as placeholder
            const graphics = new Phaser.GameObjects.Graphics(scene);
            graphics.fillStyle(0xaaddff, 0.5); // Light blue, semi-transparent
            graphics.fillRect(0, 0, 200, 100);
            graphics.generateTexture("cloud_placeholder", 200, 100);

            super(
                scene,
                x ?? scene.scale.width + 200,
                centerY,
                "cloud_placeholder"
            );
        } else {
            super(
                scene,
                x ?? scene.scale.width + 200,
                centerY,
                textureToUse,
                frame
            );
        }

        this.scaleX = 2.25;
        this.scaleY = 2.25;

        // Set to the back/background layer
        this.setDepth(-100);

        // Add to scene's update list so our update method gets called
        scene.events.on("update", this.update, this);

        // Set movement properties
        this.speed = 50; // pixels per second
        this.resetX = this.scene.scale.width + this.width / 2;

        // Store the original y-position for resets
        this.originalY = this.y;
    }

    // Cloud movement properties
    public speed: number;
    private resetX: number;
    private originalY: number;

    // Called each frame by the game loop
    update(time: number, delta: number): void {
        // Move the clouds to the left
        this.x -= (this.speed * delta) / 1000;

        // Only reset when cloud is fully off-screen by twice its width
        // For a 1920px wide scene, this ensures clouds only reset when completely gone
        if (this.x < -this.width * 2) {
            // Reset position to the right side of screen (1920px width)
            this.x = 1920 + this.width / 2;
            // Keep original y position when recycling
            this.y = this.originalY;
        }
    }

    // Method to reposition cloud (useful for initial placement)
    public resetPosition(): void {
        this.x = -(1920 + this.width / 2); // Negative position off the left side
        this.y = this.originalY;
    }

    // Clean up when this game object is destroyed
    destroy(fromScene?: boolean): void {
        // Remove from update list to prevent memory leaks
        this.scene.events.off("update", this.update, this);
        super.destroy(fromScene);
    }
}

