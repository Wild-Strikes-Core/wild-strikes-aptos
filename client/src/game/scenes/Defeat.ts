// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
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
        const bgClouds = this.add.tileSprite(
            920,
            284,
            1029,
            242,
            "Purple_Green_Pixel_Illustration_Game_Presentation__2_-removebg-preview"
        );
        bgClouds.blendMode = Phaser.BlendModes.HUE;
        bgClouds.scaleX = 2;
        bgClouds.scaleY = 2;
        bgClouds.tintTopLeft = 6096904;
        bgClouds.tintTopRight = 7997962;
        bgClouds.tintBottomLeft = 7014151;
        bgClouds.tintBottomRight = 5965061;

        // bgClouds_1
        const bgClouds_1 = this.add.tileSprite(
            952,
            1068,
            1029,
            242,
            "Purple_Green_Pixel_Illustration_Game_Presentation__2_-removebg-preview"
        );
        bgClouds_1.blendMode = Phaser.BlendModes.COLOR;
        bgClouds_1.scaleX = 2;
        bgClouds_1.scaleY = 2;
        bgClouds_1.tintTopLeft = 8325385;
        bgClouds_1.tintTopRight = 5702917;
        bgClouds_1.tintBottomLeft = 8717830;
        bgClouds_1.tintBottomRight = 4850178;

        // platform_1
        const platform_1 = this.add.image(528, 1136, "1 (2)");

        // platform_2
        const platform_2 = this.add.image(960, 1136, "1 (2)");

        // platform_3
        const platform_3 = this.add.image(1408, 1136, "1 (2)");

        // eloBanner
        const eloBanner = this.add.image(960, 848, "1");

        // defeatText
        const defeatText = this.add.image(960, 128, "1 (4)");

        this.bgClouds = bgClouds;
        this.bgClouds_1 = bgClouds_1;
        this.platform_1 = platform_1;
        this.platform_2 = platform_2;
        this.platform_3 = platform_3;
        this.eloBanner = eloBanner;
        this.defeatText = defeatText;

        this.events.emit("scene-awake");
    }

    private bgClouds!: Phaser.GameObjects.TileSprite;
    private bgClouds_1!: Phaser.GameObjects.TileSprite;
    private platform_1!: Phaser.GameObjects.Image;
    private platform_2!: Phaser.GameObjects.Image;
    private platform_3!: Phaser.GameObjects.Image;
    private eloBanner!: Phaser.GameObjects.Image;
    private defeatText!: Phaser.GameObjects.Image;

    /* START-USER-CODE */

    // Write your code here

    create() {
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
        this.platform_1.setAlpha(0);
        this.platform_2.setAlpha(0);
        this.platform_3.setAlpha(0);
        this.defeatText.setAlpha(0);

        // Set up shutdown event listener to stop music when scene closes
        this.events.on("shutdown", this.onShutdown, this);

        this.startAnimationSequence();
    }

    private onShutdown(): void {
        try {
            this.sound.stopByKey("defeat");
        } catch (error) {
            console.warn("Error stopping defeat sound on shutdown:", error);
        }
    }

    update() {
        [this.bgClouds, this.bgClouds_1].forEach(
            (cloud) => (cloud.tilePositionX += 1)
        );
    }

    startAnimationSequence() {
        // Platform rise animation with delays
        this.tweens.add({
            targets: this.platform_1,
            y: 608,
            alpha: 1,
            duration: 2000,
            ease: "Power2",
        });
        this.time.delayedCall(500, () => {
            this.tweens.add({
                targets: this.platform_2,
                y: 560,
                alpha: 1,
                duration: 2000,
                ease: "Power2",
            });
        });
        this.time.delayedCall(1000, () => {
            this.tweens.add({
                targets: this.platform_3,
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
                targets: [this.platform_1, this.platform_2, this.platform_3],
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

