// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { SOCKET } from "@shared/socket";
import { Socket } from "socket.io-client";
/* END-USER-IMPORTS */

export default class MatchFound extends Phaser.Scene {
    constructor() {
        super("MatchFound");
    }

    editorCreate(): void {
        // image_3
        const image_3 = this.add.image(146, 216, "M_playerCard");

        // playerName
        const playerName = this.add.text(18, 184, "", {});
        playerName.text = "";
        playerName.setStyle({
            align: "center",
            fontFamily: "Arial",
            fontSize: "64px",
            fontStyle: "bold",
        });

        // image
        const image = this.add.image(1761, 216, "M_playerCard");

        // playerName_1
        const playerName_1 = this.add.text(1521, 184, "", {});
        playerName_1.text = "";
        playerName_1.setStyle({
            align: "center",
            fontFamily: "Arial",
            fontSize: "64px",
            fontStyle: "bold",
        });

        // playerCharSprite
        const playerCharSprite = this.add.image(447, 555, "M_charONE");
        playerCharSprite.scaleX = 1.310153805177419;
        playerCharSprite.scaleY = 1.310153805177419;

        // enemyCharSprite
        const enemyCharSprite = this.add.image(1359, 555, "M_charONE");
        enemyCharSprite.scaleX = 1.310153805177419;
        enemyCharSprite.scaleY = 1.310153805177419;
        enemyCharSprite.flipX = true;

        // vs
        const vs = this.add.text(834, 486, "", {});
        vs.text = "V.S";
        vs.setStyle({
            align: "center",
            fontFamily: "Arial",
            fontSize: "128px",
            fontStyle: "bold",
        });

        this.image_3 = image_3;
        this.playerName = playerName;
        this.image = image;
        this.playerName_1 = playerName_1;
        this.playerCharSprite = playerCharSprite;
        this.enemyCharSprite = enemyCharSprite;
        this.vs = vs;

        this.events.emit("scene-awake");
    }

    private image_3!: Phaser.GameObjects.Image;
    private playerName!: Phaser.GameObjects.Text;
    private image!: Phaser.GameObjects.Image;
    private playerName_1!: Phaser.GameObjects.Text;
    private playerCharSprite!: Phaser.GameObjects.Image;
    private enemyCharSprite!: Phaser.GameObjects.Image;
    private vs!: Phaser.GameObjects.Text;

    /* START-USER-CODE */

    // Socket connection
    private socket: Socket = SOCKET;

    // Match data from server
    private matchData: any = null;

    // Is player on left or right side
    private playerPosition: "left" | "right" = "left";

    // Track if we've received match data
    private matchDataReceived: boolean = false;

    // Initialize the scene before it's created
    init(data: any) {
        console.log("MatchFound init with data:", data);

        // If match data was passed from another scene
        if (data && data.matchData) {
            this.matchData = data.matchData;
            this.matchDataReceived = true;
        }

        // Set up socket listeners immediately
        this.setupSocketListeners();
    }

    create() {
        // Add the main background image first (behind all other elements)
        // Make it responsive to cover the full screen
        const bg = this.add.image(0, 0, "2G_bg");
        bg.setOrigin(0, 0);
        bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        bg.setDepth(-1000); // Ensure background is behind everything

        this.init({});
        this.editorCreate();

        console.log(
            "MatchFound created, matchDataReceived:",
            this.matchDataReceived
        );

        // Update player names if we already have match data
        if (this.matchDataReceived) {
            this.updatePlayerNames();
        }

        // Set up initial states for elements
        this.setupInitialStates();

        // Create entrance animations
        this.animateSceneEntrance();

        // Add auto-transition to battle after animations
        this.time.delayedCall(3500, () => {
            this.transitionToBattle();
        });
    }

    /**
     * Set up socket listeners for match data
     */
    setupSocketListeners() {
        console.log("Setting up match found socket listeners");

        // Remove any existing listeners to avoid duplicates
        this.socket.off("matchFound");

        // Listen for match found event
        this.socket.on("matchFound", (data) => {
            console.log("Match found data received:", data);
            this.matchData = data;
            this.matchDataReceived = true;

            // Update the player names if the scene is already created
            if (this.playerName && this.playerName_1) {
                this.updatePlayerNames();
            }
        });
    }

    /**
     * Update the player name displays with data from the server
     */
    updatePlayerNames() {
        if (!this.matchData || !this.matchData.players) {
            console.error(
                "Cannot update player names: No match data available"
            );
            return;
        }

        console.log("Updating player names with match data:", this.matchData);

        // Determine which player this client is
        const isPlayer1 = this.socket.id === this.matchData.players.player1.id;
        this.playerPosition = isPlayer1 ? "left" : "right";

        // Set player names based on data from server
        const localPlayerData = isPlayer1
            ? this.matchData.players.player1
            : this.matchData.players.player2;
        const opponentData = isPlayer1
            ? this.matchData.players.player2
            : this.matchData.players.player1;

        console.log(
            `Local player: ${localPlayerData.name}, Opponent: ${opponentData.name}`
        );

        // Update UI with player names - ensure text elements exist
        if (this.playerName && this.playerName_1) {
            this.playerName.setText(this.matchData.players.player1.id);
            this.playerName_1.setText(this.matchData.players.player2.id);
            console.log(
                "Player name texts updated:",
                this.playerName.text,
                this.playerName_1.text
            );
        } else {
            console.error("Player name text elements not initialized yet");
        }
    }

    setupInitialStates() {
        // Use direct references to the class properties instead of getByName
        // Hide player names initially
        this.playerName.setAlpha(0);
        this.playerName_1.setAlpha(0);

        // Move player cards off screen
        this.image_3.x = -300; // Using class property instead of getByName
        this.image.x = this.cameras.main.width + 300; // Using class property instead of getByName

        // Character sprites start invisible and small
        this.playerCharSprite.setAlpha(0);
        this.playerCharSprite.setScale(0.5);

        this.enemyCharSprite.setAlpha(0);
        this.enemyCharSprite.setScale(0.5);

        // VS text starts invisible and large
        this.vs.setAlpha(0);
        this.vs.setScale(2);
    }

    animateSceneEntrance() {
        // Use direct references
        // Camera flash to start
        this.cameras.main.flash(300, 0, 0, 0);

        // 1. Animate player cards sliding in
        this.tweens.add({
            targets: this.image_3, // Use class property
            x: 146, // Original position
            duration: 600,
            ease: "Back.out(1.5)",
            onComplete: () => {
                // Fade in player name
                this.tweens.add({
                    targets: this.playerName,
                    alpha: 1,
                    duration: 300,
                });
            },
        });

        this.tweens.add({
            targets: this.image, // Use class property
            x: 1761, // Original position
            duration: 600,
            ease: "Back.out(1.5)",
            onComplete: () => {
                // Fade in enemy name
                this.tweens.add({
                    targets: this.playerName_1,
                    alpha: 1,
                    duration: 300,
                });
            },
        });

        // 2. After a short delay, animate character sprites
        this.time.delayedCall(800, () => {
            // Player character animation
            this.tweens.add({
                targets: this.playerCharSprite,
                alpha: 1,
                scaleX: 1.31, // Original scale
                scaleY: 1.31,
                x: "+= 50", // Move slightly right
                duration: 500,
                ease: "Back.out(1.5)",
                onComplete: () => {
                    // Bounce back to position
                    this.tweens.add({
                        targets: this.playerCharSprite,
                        x: 447, // Original position
                        duration: 150,
                        ease: "Power1.out",
                    });

                    // Add idle animation
                    this.addIdleAnimation(this.playerCharSprite);
                },
            });

            // Enemy character animation with slight delay
            this.time.delayedCall(200, () => {
                this.tweens.add({
                    targets: this.enemyCharSprite,
                    alpha: 1,
                    scaleX: 1.31, // Original scale
                    scaleY: 1.31,
                    x: "-= 50", // Move slightly left
                    duration: 500,
                    ease: "Back.out(1.5)",
                    onComplete: () => {
                        // Bounce back to position
                        this.tweens.add({
                            targets: this.enemyCharSprite,
                            x: 1359, // Original position
                            duration: 150,
                            ease: "Power1.out",
                        });

                        // Add idle animation
                        this.addIdleAnimation(this.enemyCharSprite, true);
                    },
                });
            });
        });

        // 3. Finally, animate the VS text with a strong impact
        this.time.delayedCall(1500, () => {
            // Camera shake for impact
            this.cameras.main.shake(200, 0.01);

            // Flash effect behind VS text
            const flashCircle = this.add.circle(834, 486, 100, 0xffff00, 0);
            flashCircle.setDepth(-1);

            this.tweens.add({
                targets: flashCircle,
                alpha: 0.7,
                scale: 2,
                duration: 300,
                yoyo: true,
                onComplete: () => {
                    flashCircle.destroy();
                },
            });

            // VS text animation
            this.tweens.add({
                targets: this.vs,
                alpha: 1,
                scale: 1,
                duration: 400,
                ease: "Back.out(1.7)",
            });

            // Add a pulsing effect to the VS text
            this.time.delayedCall(400, () => {
                this.tweens.add({
                    targets: this.vs,
                    scale: 1.1,
                    duration: 500,
                    yoyo: true,
                    repeat: -1,
                    ease: "Sine.easeInOut",
                });
            });
        });
    }

    transitionToBattle() {
        // Camera flash
        this.cameras.main.flash(300, 255, 255, 255);

        this.cameras.main.once("cameraflashcomplete", () => {
            this.cameras.main.fadeOut(400);

            this.cameras.main.once("camerafadeoutcomplete", () => {
                // Pass match data to the game scene
                this.scene.start("Arena", { matchData: this.matchData });

                // Clean up socket listeners when leaving this scene
                this.socket.off("matchFound");
            });
        });
    }

    addIdleAnimation(
        charSprite: Phaser.GameObjects.Image,
        isEnemy: boolean = false
    ) {
        // Create a subtle breathing/idle animation
        const originalY = charSprite.y;

        this.tweens.add({
            targets: charSprite,
            y: originalY - 10,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // Add a subtle sideways tilt for dynamic posing
        const lean = isEnemy ? -0.03 : 0.03;

        this.tweens.add({
            targets: charSprite,
            rotation: lean,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
            delay: 300, // Offset from the vertical movement
        });
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here

