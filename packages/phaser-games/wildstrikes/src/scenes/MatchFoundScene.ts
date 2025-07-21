// Client-side only MatchFound scene – all networking stripped

export default class MatchFound extends Phaser.Scene {
    // Scene element references (renamed for clarity)
    private leftPlayerCard!: Phaser.GameObjects.Image;
    private rightPlayerCard!: Phaser.GameObjects.Image;
    private leftPlayerName!: Phaser.GameObjects.Text;
    private rightPlayerName!: Phaser.GameObjects.Text;
    private playerCharSprite!: Phaser.GameObjects.Image;
    private enemyCharSprite!: Phaser.GameObjects.Image;
    private vsText!: Phaser.GameObjects.Text;

    constructor() {
        super("MatchFound");
    }

    create(): void {
        // Full-screen background
        const bg = this.add.image(0, 0, "2G_bg");
        bg.setOrigin(0, 0);
        bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        bg.setDepth(-1000);

        this.editorCreate();

        // Static placeholder names for polishing
        this.leftPlayerName.setText("Player 1");
        this.rightPlayerName.setText("Player 2");

        // Set up initial states & animate entrance
        this.setupInitialStates();
        this.animateSceneEntrance();

        // Automatically transition to Arena after animations
        this.time.delayedCall(3500, () => this.transitionToBattle());
    }

    /* ------------------------------------------------------------------
     * Original editor-generated nodes
     * ------------------------------------------------------------------ */

    private editorCreate(): void {
        // Left player card
        this.leftPlayerCard = this.add.image(146, 216, "M_playerCard");

        // Left player name
        this.leftPlayerName = this.add.text(18, 184, "", {
            align: "center",
            fontFamily: "Arial",
            fontSize: "64px",
            fontStyle: "bold",
        });

        // Right player card
        this.rightPlayerCard = this.add.image(1761, 216, "M_playerCard");

        // Right player name
        this.rightPlayerName = this.add.text(1521, 184, "", {
            align: "center",
            fontFamily: "Arial",
            fontSize: "64px",
            fontStyle: "bold",
        });

        // Player character sprite
        this.playerCharSprite = this.add.image(447, 555, "M_charONE");
        this.playerCharSprite.setScale(1.310153805177419);

        // Enemy character sprite
        this.enemyCharSprite = this.add.image(1359, 555, "M_charONE");
        this.enemyCharSprite.setScale(1.310153805177419);
        this.enemyCharSprite.setFlipX(true);

        // VS text
        this.vsText = this.add.text(834, 486, "V.S", {
            align: "center",
            fontFamily: "Arial",
            fontSize: "128px",
            fontStyle: "bold",
        });

        this.events.emit("scene-awake");
    }

    /* ------------------------------------------------------------------
     * Helper functions (trimmed from original code)
     * ------------------------------------------------------------------ */

    private setupInitialStates(): void {
        // Hide player names initially
        this.leftPlayerName.setAlpha(0);
        this.rightPlayerName.setAlpha(0);

        // Move player cards off-screen
        this.leftPlayerCard.x = -300;
        this.rightPlayerCard.x = this.cameras.main.width + 300;

        // Character sprites start invisible & small
        this.playerCharSprite.setAlpha(0).setScale(0.5);
        this.enemyCharSprite.setAlpha(0).setScale(0.5);

        // VS text starts invisible & oversized
        this.vsText.setAlpha(0).setScale(2);
    }

    private animateSceneEntrance(): void {
        // Camera flash to start
        this.cameras.main.flash(300, 0, 0, 0);

        // Slide-in player cards
        this.tweens.add({
            targets: this.leftPlayerCard,
            x: 146,
            duration: 600,
            ease: "Back.out(1.5)",
            onComplete: () => this.tweens.add({ targets: this.leftPlayerName, alpha: 1, duration: 300 }),
        });
        this.tweens.add({
            targets: this.rightPlayerCard,
            x: 1761,
            duration: 600,
            ease: "Back.out(1.5)",
            onComplete: () => this.tweens.add({ targets: this.rightPlayerName, alpha: 1, duration: 300 }),
        });

        // Character sprites
        this.time.delayedCall(800, () => {
            this.tweens.add({
                targets: this.playerCharSprite,
                alpha: 1,
                scaleX: 1.31,
                scaleY: 1.31,
                x: "+=50",
                duration: 500,
                ease: "Back.out(1.5)",
                onComplete: () => {
                    this.tweens.add({ targets: this.playerCharSprite, x: 447, duration: 150, ease: "Power1.out" });
                    this.addIdleAnimation(this.playerCharSprite);
                },
            });

            this.time.delayedCall(200, () => {
                this.tweens.add({
                    targets: this.enemyCharSprite,
                    alpha: 1,
                    scaleX: 1.31,
                    scaleY: 1.31,
                    x: "-=50",
                    duration: 500,
                    ease: "Back.out(1.5)",
                    onComplete: () => {
                        this.tweens.add({ targets: this.enemyCharSprite, x: 1359, duration: 150, ease: "Power1.out" });
                        this.addIdleAnimation(this.enemyCharSprite, true);
                    },
                });
            });
        });

        // VS text & impact effect
        this.time.delayedCall(1500, () => {
            this.cameras.main.shake(200, 0.01);
            const flashCircle = this.add.circle(834, 486, 100, 0xffff00, 0).setDepth(-1);
            this.tweens.add({ targets: flashCircle, alpha: 0.7, scale: 2, duration: 300, yoyo: true, onComplete: () => flashCircle.destroy() });
            this.tweens.add({ targets: this.vsText, alpha: 1, scale: 1, duration: 400, ease: "Back.out(1.7)" });
            this.time.delayedCall(400, () => {
                this.tweens.add({ targets: this.vsText, scale: 1.1, duration: 500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
            });
        });
    }

    private transitionToBattle(): void {
        this.cameras.main.flash(300, 255, 255, 255);
        this.cameras.main.once("cameraflashcomplete", () => {
            this.cameras.main.fadeOut(400);
            this.cameras.main.once("camerafadeoutcomplete", () => {
                this.scene.start("Arena");
            });
        });
    }

    private addIdleAnimation(charSprite: Phaser.GameObjects.Image, isEnemy = false): void {
        const originalY = charSprite.y;
        this.tweens.add({
            targets: charSprite,
            y: originalY - 10,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
        const lean = isEnemy ? -0.03 : 0.03;
        this.tweens.add({
            targets: charSprite,
            rotation: lean,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
            delay: 300,
        });
    }
}

