// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import bgClouds from "../../components/bg-clouds";
import { walletPhaserBridge } from "../../utils/walletPhaserBridge";
/* END-USER-IMPORTS */

export default class Home extends Phaser.Scene {
    private BG_CLOUDS: Phaser.GameObjects.Layer;
    private MENU_BUTTONS: Phaser.GameObjects.Layer;
    private LEADERBOARDS: Phaser.GameObjects.Image;
    private BUTTON_ARENA: Phaser.GameObjects.Image;
    private BUTTON_ABOUT: Phaser.GameObjects.Image;
    private BUTTON_WARRIORS: Phaser.GameObjects.Image;
    private NAME_CONTAINER: Phaser.GameObjects.Image;
    private PLAYER_NAME: Phaser.GameObjects.Text;

    /* START-USER-CODE */
    logoTween: Phaser.Tweens.Tween | null;

    constructor() {
        super("Home");

        /* START-USER-CTR-CODE */
        // Write your code here.
        /* END-USER-CTR-CODE */
    }

    editorCreate(): void {
        // Add main menu background - responsive to cover full screen
        const background = this.add.image(0, 0, "2G_bg");
        background.setOrigin(0, 0);
        background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        background.depth = -1000; // Ensure it's behind everything else

        // bgClouds
        this.BG_CLOUDS = this.add.layer();
        this.BG_CLOUDS.blendMode = Phaser.BlendModes.SKIP_CHECK;

        // menuBTNS_1
        this.MENU_BUTTONS = this.add.layer();
        this.MENU_BUTTONS.blendMode = Phaser.BlendModes.SKIP_CHECK;

        // leaderboardsContainer
        this.LEADERBOARDS = this.add.image(464, 544, "2G_btnsBackground");
        this.LEADERBOARDS.scaleX = 2.2795097751295637;
        this.LEADERBOARDS.scaleY = 2.2795097751295637;
        this.MENU_BUTTONS.add(this.LEADERBOARDS);

        // btnARENA
        this.BUTTON_ARENA = this.add.image(1392, 592, "2G_btnArena");
        this.BUTTON_ARENA.scaleX = 1.4346425946756112;
        this.BUTTON_ARENA.scaleY = 1.4346425946756112;
        this.MENU_BUTTONS.add(this.BUTTON_ARENA);

        // btnABOUT
        this.BUTTON_ABOUT = this.add.image(1536, 960, "2G_btnAbout");

        // btnWARRIORS
        this.BUTTON_WARRIORS = this.add.image(1232, 960, "2G_btnWarriors");

        // NAME_CONTAINER
        this.NAME_CONTAINER = this.add.image(464, 208, "2G_Player_Name_Card");
        this.NAME_CONTAINER.scaleX = 0.8582378709610599;
        this.NAME_CONTAINER.scaleY = 0.8582378709610599;

        // playerName
        this.PLAYER_NAME = this.add.text(272, 176, "", {});
        this.PLAYER_NAME.text = "Connect Wallet";
        this.PLAYER_NAME.setStyle({
            align: "center",
            fontFamily: "Arial",
            fontSize: "64px",
            fontStyle: "bold",
        });

        this.events.emit("scene-awake");
    }

    // Write your code here
    create() {
        this.editorCreate();

        // Register this scene with the wallet bridge
        walletPhaserBridge.setScene(this);

        // Start background music
        this.startBackgroundMusic();

        // Set up shutdown event listener to stop music when scene closes
        this.events.on("shutdown", this.onShutdown, this);

        // Create a flashy entrance transition for the scene
        this.createSceneEntrance();

        // Set up initial states for all UI components
        const buttons = [
            this.BUTTON_ARENA,
            this.BUTTON_ABOUT,
            this.BUTTON_WARRIORS,
        ];

        // Set initial state for all UI elements with more dynamic starting positions
        buttons.forEach((button, index) => {
            // @ts-ignore
            button.originalY = button.y;
            // @ts-ignore

            button.originalX = button.x;

            // Randomize starting positions for more dynamic feel
            const direction = index % 2 === 0 ? 1 : -1;
            button.x += 50 * direction;
            button.y += 200;
            button.setAlpha(0);
            button.setScale(button.scaleX * 0.7, button.scaleY * 0.7);
        });

        // Set initial state for player name card - shrink from center
        // @ts-ignore

        this.NAME_CONTAINER.originalY = this.NAME_CONTAINER.y;
        this.NAME_CONTAINER.setAlpha(0.5);
        this.NAME_CONTAINER.setScale(
            this.NAME_CONTAINER.scaleX * 0.5,
            this.NAME_CONTAINER.scaleY * 0.5
        );

        // Player name starts invisible
        // @ts-ignore

        this.PLAYER_NAME.originalY = this.PLAYER_NAME.y;
        this.PLAYER_NAME.setAlpha(0);

        // Leaderboards container starts smaller and rotated slightly
        // @ts-ignore

        this.LEADERBOARDS.originalX = this.LEADERBOARDS.x;
        this.LEADERBOARDS.setAlpha(0.3);
        this.LEADERBOARDS.rotation = -0.05;
        this.LEADERBOARDS.setScale(
            this.LEADERBOARDS.scaleX * 0.8,
            this.LEADERBOARDS.scaleY * 0.8
        );

        // Animate everything almost simultaneously with offset timing

        // Fast camera fade-in
        this.cameras.main.fadeIn(250, 0, 0, 0);

        // Animate the name container first - quick pop-in
        this.tweens.add({
            targets: this.NAME_CONTAINER,
            scaleX: this.NAME_CONTAINER.scaleX / 0.5,
            scaleY: this.NAME_CONTAINER.scaleY / 0.5,
            alpha: 1,
            duration: 300,
            ease: "Back.out(1.8)", // More pronounced pop effect
            onComplete: () => {
                // Once container is in, quickly fade in the name text with a slight scale effect
                this.tweens.add({
                    targets: this.PLAYER_NAME,
                    alpha: 1,
                    duration: 200,
                    ease: "Sine.easeOut",
                });
            },
        });

        // Almost immediately animate the leaderboards container
        this.time.delayedCall(100, () => {
            this.tweens.add({
                targets: this.LEADERBOARDS,
                scaleX: this.LEADERBOARDS.scaleX / 0.8,
                scaleY: this.LEADERBOARDS.scaleY / 0.8,
                rotation: 0,
                alpha: 1,
                duration: 350,
                ease: "Back.out(1.2)",
            });
        });

        // Animate buttons with quick sequential stagger
        this.time.delayedCall(150, () => {
            buttons.forEach((button, index) => {
                this.tweens.add({
                    targets: button,
                    // @ts-ignore

                    x: button.originalX,
                    // @ts-ignore

                    y: button.originalY,
                    scaleX: button.scaleX / 0.7,
                    scaleY: button.scaleY / 0.7,
                    alpha: 1,
                    delay: index * 60, // Very short stagger for quick sequence
                    duration: 350,
                    ease: "Back.out(1.7)", // More dynamic bounce
                    onComplete: () => {
                        // Add subtle hover animation once in place
                        this.tweens.add({
                            targets: button,
                            // @ts-ignore

                            y: button.originalY - 5,
                            duration: 1200,
                            yoyo: true,
                            repeat: -1,
                            ease: "Sine.easeInOut",
                        });
                    },
                });
            });
        });

        // Standard button interaction for hover effects
        const setupButtonBase = (button: Phaser.GameObjects.Image) => {
            button
                .setInteractive({ cursor: "pointer" })
                .on("pointerover", () => {
                    button.setTint(0xffff66);
                    // Scale up the button slightly on hover
                    this.tweens.add({
                        targets: button,
                        scaleX: button.scaleX * 1.1,
                        scaleY: button.scaleY * 1.1,
                        duration: 100,
                    });
                })
                .on("pointerout", () => {
                    button.clearTint();
                    // Scale back to normal size
                    this.tweens.add({
                        targets: button,
                        scaleX: button.scaleX / 1.1,
                        scaleY: button.scaleY / 1.1,
                        duration: 100,
                    });
                });
        };

        // Dynamic "Strike" transition for Arena button
        const setupArenaTransition = () => {
            setupButtonBase(this.BUTTON_ARENA);

            this.BUTTON_ARENA.on("pointerdown", () => {
                // Play click sound effect
                this.playClickSound();
                
                // Stop background music before transitioning
                this.stopBackgroundMusic();
                
                // Disable further interactions during transition
                buttons.forEach((b) => b.disableInteractive());

                // Flash effect on the button
                this.tweens.add({
                    targets: this.BUTTON_ARENA,
                    alpha: { from: 1, to: 0.3 },
                    yoyo: true,
                    duration: 80,
                    repeat: 1,
                    onComplete: () => {
                        // Energetic pulse and zoom effect
                        this.tweens.add({
                            targets: this.BUTTON_ARENA,
                            scaleX: this.BUTTON_ARENA.scaleX * 1.3,
                            scaleY: this.BUTTON_ARENA.scaleY * 1.3,
                            alpha: 0,
                            duration: 300,
                            ease: "Back.easeIn",
                            onComplete: () => {
                                // Create a white flash overlay for the "strike" effect
                                const flash = this.add.rectangle(
                                    this.cameras.main.centerX,
                                    this.cameras.main.centerY,
                                    this.cameras.main.width * 2,
                                    this.cameras.main.height * 2,
                                    0xffffff
                                );
                                flash.alpha = 0;
                                flash.depth = 1000;

                                // Add camera shake for impact
                                this.cameras.main.shake(200, 0.01);

                                // Flash then fade to black
                                this.tweens.add({
                                    targets: flash,
                                    alpha: { from: 0, to: 0.8 },
                                    duration: 100,
                                    yoyo: true,
                                    onComplete: () => {
                                        // Create a circular mask that will reveal the next scene
                                        const circle = this.add.circle(
                                            this.BUTTON_ARENA.x,
                                            this.BUTTON_ARENA.y,
                                            50,
                                            0x000000
                                        );
                                        circle.depth = 999;

                                        // Expand the circle to create a reveal effect
                                        this.tweens.add({
                                            targets: circle,
                                            radius: 1500,
                                            duration: 600,
                                            ease: "Cubic.easeIn",
                                            onComplete: () => {
                                                this.time.delayedCall(
                                                    1000,
                                                    () => {
                                                        this.scene.start(
                                                            "Matchmaking"
                                                        );
                                                    }
                                                );
                                            },
                                        });
                                    },
                                });
                            },
                        });
                    },
                });
            });
        };

        // Casual transition for secondary buttons
        const setupCasualTransition = (
            button: Phaser.GameObjects.Image,
            targetScene: string
        ) => {
            setupButtonBase(button);

            button.on("pointerdown", () => {
                // Play click sound effect
                this.playClickSound();
                
                // Stop background music before transitioning
                this.stopBackgroundMusic();
                
                // Disable further interactions during transition
                buttons.forEach((b) => b.disableInteractive());

                // Gentle pulse animation
                this.tweens.add({
                    targets: button,
                    scale: "*=1.1",
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        // Create a smooth slide and fade transition
                        this.tweens.add({
                            targets: buttons,
                            y: "+=50",
                            alpha: 0,
                            duration: 400,
                            ease: "Sine.easeInOut",
                        });

                        // Fade out the scene
                        this.tweens.add({
                            targets: this.cameras.main,
                            alpha: 0,
                            duration: 800,
                            ease: "Sine.easeInOut",
                            onComplete: () => {
                                this.scene.start(targetScene);
                            },
                        });
                    },
                });
            });
        };

        if (this.textures.exists("2G_bgClouds_2")) {
            // Second cloud a bit lower
            const movingClouds2 = new bgClouds(this, 1200, 450);
            this.add.existing(movingClouds2);
            movingClouds2.speed = 30; // Slower speed for parallax effect

            // Third cloud
            const movingClouds3 = new bgClouds(this, 900, 200);
            this.add.existing(movingClouds3);
            movingClouds3.speed = 40;
        } else {
            console.warn(
                "Cloud texture '2G_bgClouds_2' not found. Clouds will not be displayed."
            );
        }

        // Apply the appropriate transition to each button
        setupArenaTransition();
        setupCasualTransition(this.BUTTON_ABOUT, "GM_About");
        setupCasualTransition(this.BUTTON_WARRIORS, "GM_Warriors");
    }

    // Create a simple entrance effect for the scene
    createSceneEntrance() {
        // Create a black overlay that will fade out
        const overlay = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width * 2,
            this.cameras.main.height * 2,
            0x000000
        );
        overlay.depth = 1000;
        overlay.alpha = 1;

        // Simple fade out animation
        this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 500,
            ease: "Linear",
            onComplete: () => {
                overlay.destroy();
            },
        });
    }

    /**
     * Start the background music for the home scene
     * Handles looping and volume control
     */
    startBackgroundMusic() {
        // Stop any existing background music first
        this.stopBackgroundMusic();

        // Play the background music with looping and moderate volume
        // Using the same pattern as Matchmaking.ts
        this.sound.play("game-menu-music", { 
            loop: true, 
            volume: 0.3 
        });
    }

    /**
     * Stop the background music
     * Called when transitioning to other scenes
     */
    stopBackgroundMusic() {
        // Stop the background music by key, same as Matchmaking.ts
        this.sound.stopByKey("game-menu-music");
    }

    /**
     * Play the click sound effect
     * Called when buttons are clicked
     */
    playClickSound() {
        this.sound.play("click-menu", { volume: 0.5 });
    }

    /**
     * Called when the scene is shutting down
     * Ensures music is stopped to prevent audio overlap
     */
    onShutdown() {
        this.stopBackgroundMusic();
    }

    changeScene() {
        // Stop background music before changing scene
        this.stopBackgroundMusic();
        this.scene.start("LandingPage");
    }
    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

