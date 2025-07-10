// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { SCENE } from "@/lib/scenes";
import bgClouds from "../../components/bg-clouds";
/* END-USER-IMPORTS */

export default class Start extends Phaser.Scene {
    private BACKGROUND_LAYER: Phaser.GameObjects.Layer;
    private PLAY_BUTTON: Phaser.GameObjects.Image;
    private MAIN_LOGO: Phaser.GameObjects.Image;
    constructor() {
        super("Start");
    }

    editorCreate(): void {
        this.BACKGROUND_LAYER = this.add.layer();
        this.BACKGROUND_LAYER.blendMode = Phaser.BlendModes.SKIP_CHECK;

        this.PLAY_BUTTON = this.add.image(
            960,
            832,
            "Purple_Green_Pixel_Illustration_Game_Presentation-removebg-preview"
        );
        this.PLAY_BUTTON.scaleX = 0.8596074937886975;
        this.PLAY_BUTTON.scaleY = 0.8596074937886975;

        this.MAIN_LOGO = this.add.image(992, 480, "newLogo");
        this.MAIN_LOGO.scaleX = 1.7396297304984527;
        this.MAIN_LOGO.scaleY = 1.7396297304984527;

        this.events.emit("scene-awake");
    }

    /* START-USER-CODE */

    // Write your code here

    create() {
        // Add the main background image first (behind all other elements)
        // Make it responsive to cover the full screen
        const bg = this.add.image(0, 0, "2G_bg");
        bg.setOrigin(0, 0);
        bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        bg.setDepth(-1000); // Ensure background is behind everything

        this.editorCreate();

        this.cameras.main.fadeIn(180, 0, 0, 0);

        // Check if texture exists before creating clouds (defensive coding)
        if (this.textures.exists("2G_bgClouds_2")) {
            // Create background clouds that move
            // First cloud in the back
            const movingClouds1 = new bgClouds(this, 500, 300);
            this.add.existing(movingClouds1);
            movingClouds1.setDepth(-500); // Set depth to be above background but below UI

            // Second cloud a bit lower
            const movingClouds2 = new bgClouds(this, 1200, 450);
            this.add.existing(movingClouds2);
            movingClouds2.speed = 30; // Slower speed for parallax effect
            movingClouds2.setDepth(-400);

            // Third cloud
            const movingClouds3 = new bgClouds(this, 900, 200);
            this.add.existing(movingClouds3);
            movingClouds3.speed = 40;
            movingClouds3.setDepth(-300);
        } else {
            console.warn(
                "Cloud texture '2G_bgClouds_2' not found. Clouds will not be displayed."
            );
        }

        this.PLAY_BUTTON.setInteractive({ cursor: "pointer" });

        // Create a continuous pulsing/floating animation for the play button
        // to draw attention to it
        this.createPlayButtonIdleAnimation(this.PLAY_BUTTON);

        // Handle button interactions
        this.PLAY_BUTTON.on("pointerdown", () => {
            // Stop the idle animation for a clean click effect
            this.tweens.killTweensOf(this.PLAY_BUTTON);

            // Play an explosive click effect
            this.createClickEffect(this.PLAY_BUTTON, () => {
                // Fade out camera
                this.cameras.main.fadeOut(180, 0, 0, 0);
                this.cameras.main.once("camerafadeoutcomplete", () => {
                    this.scene.start("Home");
                });
            });
        });

        this.PLAY_BUTTON.on("pointerover", () => {
            this.tweens.add({
                targets: this.PLAY_BUTTON,
                scaleX: this.PLAY_BUTTON.scaleX * 1.1,
                scaleY: this.PLAY_BUTTON.scaleY * 1.1,
                duration: 300,
                yoyo: false,
                ease: "Sine.easeOut",
            });

            // Add a shimmering effect with tint
            this.createShimmerEffect(this.PLAY_BUTTON);
        });

        this.PLAY_BUTTON.on("pointerout", () => {
            // Clear all tweens and effects
            this.PLAY_BUTTON.clearTint();

            // Smooth transition back to normal size
            this.tweens.add({
                targets: this.PLAY_BUTTON,
                scaleX: 0.86, // Original scale
                scaleY: 0.86, // Original scale
                duration: 300,
                ease: "Sine.easeOut",
            });
        });

        this.createLogoIdleAnimation(this.MAIN_LOGO);
    }

    // Creates a subtle floating/pulsing idle animation
    createPlayButtonIdleAnimation(button: Phaser.GameObjects.Image) {
        // Store the original position
        const originalY = button.y;

        // Create a subtle floating effect
        this.tweens.add({
            targets: button,
            y: originalY - 15, // Float up and down by 15px
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // Add a subtle pulsing effect
        this.tweens.add({
            targets: button,
            scaleX: button.scaleX * 1.05,
            scaleY: button.scaleY * 1.05,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
            delay: 400, // Offset from the float animation for more organic movement
        });

        // Add a subtle glow effect by periodically changing alpha
        this.tweens.add({
            targets: button,
            alpha: 0.8,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
            delay: 600, // Further offset
        });
    }

    // Creates a shimmering effect using tint transitions
    createShimmerEffect(button: Phaser.GameObjects.Image) {
        // Array of highlight colors to cycle through
        const colors = [0xffff66, 0xffffff, 0xffe066, 0xffffcc];
        let colorIndex = 0;

        // Create a timer to cycle colors
        this.time.addEvent({
            delay: 150,
            callback: () => {
                if (!button.active) return; // Safety check
                button.setTint(colors[colorIndex]);
                colorIndex = (colorIndex + 1) % colors.length;
            },
            repeat: 10,
            callbackScope: this,
        });
    }

    // Creates an explosive click effect
    createClickEffect(button: Phaser.GameObjects.Image, callback: Function) {
        // First, quick shrink effect
        this.tweens.add({
            targets: button,
            scale: "*=0.85",
            duration: 100,
            ease: "Bounce.easeIn",
            onComplete: () => {
                // Then, explosive expansion
                this.tweens.add({
                    targets: button,
                    scale: "*=1.8",
                    alpha: 0,
                    duration: 400,
                    ease: "Back.easeOut",
                    onComplete: () => {
                        callback();
                        // Create particles for an explosive effect
                        // if (this.particles) {
                        //     const particles = this.add.particles(
                        //         button.x,
                        //         button.y,
                        //         "particle",
                        //         {
                        //             speed: { min: 300, max: 500 },
                        //             scale: { start: 0.6, end: 0 },
                        //             lifespan: 800,
                        //             blendMode: "ADD",
                        //             emitting: false,
                        //         }
                        //     );
                        //     particles.explode(30);
                        //     // Clean up particles after they're done
                        //     this.time.delayedCall(800, () => {
                        //         particles.destroy();
                        //         if (callback) callback();
                        //     });
                        // } else {
                        //     // If particles aren't available, just call the callback
                        //     if (callback) callback();
                        // }
                    },
                });
            },
        });
    }

    createLogoIdleAnimation(logo: Phaser.GameObjects.Image) {
        this.tweens.add({
            targets: logo,
            scale: logo.scaleX * 1.02,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
    }

    update() {}

    changeScene() {
        // this.scene.start("MainMenu");
        this.scene.start("GM_SelectTeam");
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here

