// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
// Define constant keys for defeat assets to avoid naming confusion
const DEFEAT_ASSETS = {
    DEFEAT_TEXT: "defeat_text", // Previously "1 (4)"
    ELO_BANNER: "elo_banner",   // Previously "1"
    PLATFORM: "defeat_platform", // Previously "1 (2)"
};
/* END-USER-IMPORTS */

export default class Defeat extends Phaser.Scene {
    constructor() {
        super("Defeat");

        /* START-USER-CTR-CODE */
        // Write your code here.
        /* END-USER-CTR-CODE */
    }

    editorCreate(): void {
        // bgClouds
        const topClouds = this.add.tileSprite(
            920,
            284,
            1029,
            242,
            "Purple_Green_Pixel_Illustration_Game_Presentation__2_-removebg-preview"
        );
        topClouds.blendMode = Phaser.BlendModes.HUE;
        topClouds.scaleX = 2;
        topClouds.scaleY = 2;
        topClouds.tintTopLeft = 6096904;
        topClouds.tintTopRight = 7997962;
        topClouds.tintBottomLeft = 7014151;
        topClouds.tintBottomRight = 5965061;

        // bgClouds_1
        const bottomClouds = this.add.tileSprite(
            952,
            1068,
            1029,
            242,
            "Purple_Green_Pixel_Illustration_Game_Presentation__2_-removebg-preview"
        );
        bottomClouds.blendMode = Phaser.BlendModes.COLOR;
        bottomClouds.scaleX = 2;
        bottomClouds.scaleY = 2;
        bottomClouds.tintTopLeft = 8325385;
        bottomClouds.tintTopRight = 5702917;
        bottomClouds.tintBottomLeft = 8717830;
        bottomClouds.tintBottomRight = 4850178;

        // platform_1
        const leftPlatform = this.add.image(528, 1136, DEFEAT_ASSETS.PLATFORM);

        // platform_2
        const middlePlatform = this.add.image(960, 1136, DEFEAT_ASSETS.PLATFORM);

        // platform_3
        const rightPlatform = this.add.image(1408, 1136, DEFEAT_ASSETS.PLATFORM);

        // eloBanner
        const eloBanner = this.add.image(960, 848, DEFEAT_ASSETS.ELO_BANNER);

        // defeatText
        const defeatText = this.add.image(960, 128, DEFEAT_ASSETS.DEFEAT_TEXT);

        this.topClouds = topClouds;
        this.bottomClouds = bottomClouds;
        this.leftPlatform = leftPlatform;
        this.middlePlatform = middlePlatform;
        this.rightPlatform = rightPlatform;
        this.eloBanner = eloBanner;
        this.defeatText = defeatText;

        this.events.emit("scene-awake");
    }

    private topClouds!: Phaser.GameObjects.TileSprite;
    private bottomClouds!: Phaser.GameObjects.TileSprite;
    private leftPlatform!: Phaser.GameObjects.Image;
    private middlePlatform!: Phaser.GameObjects.Image;
    private rightPlatform!: Phaser.GameObjects.Image;
    private eloBanner!: Phaser.GameObjects.Image;
    private defeatText!: Phaser.GameObjects.Image;

    /* START-USER-CODE */

    // Write your code here

    create() {
        console.log("=== Defeat scene create() called ===");
        
        // Play defeat sound when the scene starts
        try {
            this.sound.play("defeat", { volume: 0.8 });
        } catch (error) {
            console.warn("Error playing defeat sound:", error);
        }

        // Add the main background image first (behind all other elements)
        // Make it responsive to cover the full screen
        const bg = this.add.image(0, 0, "2G_bg");
        bg.setOrigin(0, 0);
        bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        bg.setDepth(-1000); // Ensure background is behind everything

        this.editorCreate();

        this.eloBanner.setAlpha(0);
        this.leftPlatform.setAlpha(0);
        this.middlePlatform.setAlpha(0);
        this.rightPlatform.setAlpha(0);
        this.defeatText.setAlpha(0);

        // Set up shutdown event listener to stop music when scene closes
        this.events.on("shutdown", this.onShutdown, this);

        this.startAnimationSequence();
        
        console.log("=== Defeat scene create() completed ===");
    }

    private onShutdown(): void {
        try {
            this.sound.stopByKey("defeat");
        } catch (error) {
            console.warn("Error stopping defeat sound on shutdown:", error);
        }
    }

    update() {
        [this.topClouds, this.bottomClouds].forEach(
            (cloud) => (cloud.tilePositionX += 1)
        );
    }

    startAnimationSequence() {
        // Platform rise animation with delays
        this.tweens.add({
            targets: this.leftPlatform,
            y: 608,
            alpha: 1,
            duration: 2000,
            ease: "Power2",
        });
        this.time.delayedCall(500, () => {
            this.tweens.add({
                targets: this.middlePlatform,
                y: 560,
                alpha: 1,
                duration: 2000,
                ease: "Power2",
            });
        });
        this.time.delayedCall(1000, () => {
            this.tweens.add({
                targets: this.rightPlatform,
                y: 608,
                alpha: 1,
                duration: 2000,
                ease: "Power2",
            });
        });

        // Defeat Text & Banner fade-in
        this.tweens.add({
            targets: this.defeatText,
            alpha: 1,
            duration: 2000,
            ease: "Linear",
        });
        this.tweens.add({
            targets: this.eloBanner,
            alpha: 1,
            duration: 2000,
            ease: "Linear",
        });

        // After 8 sec, fade platforms
        this.time.delayedCall(8000, () => {
            this.tweens.add({
                targets: [this.leftPlatform, this.middlePlatform, this.rightPlatform],
                alpha: 0,
                duration: 2000,
                ease: "Linear",
            });
            
            // Stop defeat music before transitioning
            try {
                this.sound.stopByKey("defeat");
            } catch (error) {
                console.warn("Error stopping defeat sound:", error);
            }
            
            this.cameras.main.fadeOut(2000, 0, 0, 0);
            this.time.delayedCall(2000, () => this.scene.start("Home"));
        });
    }
    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here

