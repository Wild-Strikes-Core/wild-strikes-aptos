// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import bgClouds from "../../components/bg-clouds";
/* END-USER-IMPORTS */

export default class Start extends Phaser.Scene {
    private BACKGROUND_LAYER: Phaser.GameObjects.Layer;
    private PLAY_BUTTON: Phaser.GameObjects.Image;
    private MAIN_LOGO: Phaser.GameObjects.Image;
    private BG_HILL: Phaser.GameObjects.Image;
    constructor() {
        super("StartMenu");
    }

    editorCreate(): void {
        this.BACKGROUND_LAYER = this.add.layer();
        this.BACKGROUND_LAYER.blendMode = Phaser.BlendModes.SKIP_CHECK;

        this.PLAY_BUTTON = this.add.image(
            960,
            832,
            "connect-btn"
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
        this.editorCreate();

        this.startBackgroundMusic();

        const { width, height } = this.cameras.main;

        const bg = this.add.image(0, 0, "2G_bg");
        bg.setOrigin(0, 0);
        bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        bg.setDepth(-1000); 

        if (this.textures.exists("2g_bgStars")) {
            const starLayer = this.add.image(0, 0, "2g_bgStars");
            starLayer.setOrigin(0, 0);
            starLayer.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
            starLayer.setDepth(-900);
            this.tweens.add({
                targets: starLayer,
                alpha: { from: 0.2, to: 1 }, 
                duration: 1500, 
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            });
        } else {
            console.warn(
                "Star texture '2g_bgStars' not found. Stars will not be displayed."
            );
        }

        if (this.textures.exists('2G_bgHill')) {
           this.BG_HILL = this.add.image(this.cameras.main.centerX, this.cameras.main.height, '2G_bgHill').setOrigin(0.5, 1).setDepth(-800);
        } else {
            console.warn("Hill texture '2G_bgHill' not found. Hill will not be displayed.");
        }

        this.cameras.main.fadeIn(180, 0, 0, 0);

        if (this.textures.exists("2G_bgClouds_2")) {
            const movingClouds1 = new bgClouds(this, 500, 300);
            movingClouds1.setScale(2.2);
            this.add.existing(movingClouds1);
            movingClouds1.setDepth(-500);

            const movingClouds2 = new bgClouds(this, 1200, 450);
            movingClouds2.setScale(2.2);
            this.add.existing(movingClouds2);
            movingClouds2.speed = 30; 
            movingClouds2.setDepth(-400);

            const movingClouds3 = new bgClouds(this, 900, 200);
            movingClouds3.setScale(2.2);
            this.add.existing(movingClouds3);
            movingClouds3.speed = 40;
            movingClouds3.setDepth(-300);
        } else {
            console.warn(
                "Cloud texture '2G_bgClouds_2' not found. Clouds will not be displayed."
            );
        }

        this.PLAY_BUTTON.setInteractive({ cursor: "pointer" });

        this.createPlayButtonIdleAnimation(this.PLAY_BUTTON);

        this.PLAY_BUTTON.on("pointerdown", () => {
            this.playClickSound();
            this.tweens.killTweensOf(this.PLAY_BUTTON);
            this.sound.stopByKey('landing-menu-music');
            this.createClickEffect(this.PLAY_BUTTON, () => {
                const event = new CustomEvent('b3-connect-wallet');
                window.dispatchEvent(event);
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


            this.createShimmerEffect(this.PLAY_BUTTON);
        });

        this.PLAY_BUTTON.on("pointerout", () => {
            this.PLAY_BUTTON.clearTint();
            this.tweens.add({
                targets: this.PLAY_BUTTON,
                scaleX: 0.86,
                scaleY: 0.86, 
                duration: 300,
                ease: "Sine.easeOut",
            });
        });

        this.createLogoIdleAnimation(this.MAIN_LOGO);
    }


    createPlayButtonIdleAnimation(button: Phaser.GameObjects.Image) {
        const originalY = button.y;

        this.tweens.add({
            targets: button,
            y: originalY - 15,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        this.tweens.add({
            targets: button,
            scaleX: button.scaleX * 1.05,
            scaleY: button.scaleY * 1.05,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
            delay: 400, 
        });

        this.tweens.add({
            targets: button,
            alpha: 0.8,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
            delay: 600, 
        });
    }


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

     private startBackgroundMusic(): void {
        this.sound.stopByKey('landing-menu-music');
        this.sound.play('landing-menu-music', { loop: true, volume: 0.3 });
    }

    private playClickSound(): void {
    // Plays a sound asset named 'click-sound'
    this.sound.play('click-menu');
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