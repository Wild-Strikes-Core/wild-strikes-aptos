// Client-side only Matchmaking scene – networking stripped for animation polish
export default class Matchmaking extends Phaser.Scene {
    private PLAYER_SPRITE!: Phaser.GameObjects.Image;
    private BUTTON_CANCEL!: Phaser.GameObjects.Image;
    private LOADER!: Phaser.GameObjects.Text;
    private PLAYER_NAME!: Phaser.GameObjects.Text;
    private FINDING_MATCH_TEXT!: Phaser.GameObjects.Text;

    private loaderDots: string[] = [".", "..", "..."];
    private loaderIndex = 0;

    constructor() {
        super("Matchmaking");
    }

    /* ------------------------------------------------------------------
     * Scene creation
     * ------------------------------------------------------------------ */
    create(): void {
        // Full-screen background
        const bg = this.add.image(0, 0, "2G_bg");
        bg.setOrigin(0, 0);
        bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        bg.setDepth(-1000);

        // Build UI that was originally auto-generated
        this.editorCreate();

        this.animateEntrance();
        this.setupEntranceTransition();
        this.setupCancelButton();
        this.animateLoader();

        // Simulate a match being found after a short delay
        this.time.delayedCall(2500, () => this.goToMatchFound());

        // Optional ambience
        this.sound.play("waiting-music", { loop: true });
        this.events.once("shutdown", this.onShutdown, this);
    }

    /* ------------------------------------------------------------------
     * Helpers
     * ------------------------------------------------------------------ */

    private setupCancelButton(): void {
        this.BUTTON_CANCEL.setInteractive();

        this.BUTTON_CANCEL.on("pointerdown", () => {
            this.cameras.main.fadeOut(180, 0, 0, 0);
            this.cameras.main.once("camerafadeoutcomplete", () => {
                this.scene.stop("Matchmaking");
                this.scene.start("Home");
            });
        });

        this.BUTTON_CANCEL.on("pointerover", () => this.BUTTON_CANCEL.setTint(0xffff66));
        this.BUTTON_CANCEL.on("pointerout", () => this.BUTTON_CANCEL.clearTint());
    }

    private animateEntrance(): void {
        this.tweens.add({
            targets: this.PLAYER_SPRITE,
            angle: 360,
            duration: 1000,
            ease: "Sine.easeInOut",
        });
    }

    private setupEntranceTransition(): void {
        this.cameras.main.fadeIn(800, 0, 0, 0, (_: any, progress: number) => {
            this.cameras.main.setAlpha(Math.pow(progress, 3));
        });
    }

    private animateLoader(): void {
        this.time.addEvent({
            delay: 250,
            repeat: -1,
            callback: () => {
                this.LOADER.text = this.loaderDots[this.loaderIndex];
                this.loaderIndex = (this.loaderIndex + 1) % this.loaderDots.length;
            },
        });
    }

    private goToMatchFound(): void {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.stop("Matchmaking");
            this.scene.start("MatchFound");
        });
    }

    private onShutdown(): void {
        this.sound.stopByKey("waiting-music");
    }

    /* ------------------------------------------------------------------
     * editorCreate – UI recreated from the original auto-generated code
     * ------------------------------------------------------------------ */

    editorCreate(): void {
        this.PLAYER_SPRITE = this.add.image(528, 608, "M_charONE");
        this.PLAYER_SPRITE.setScale(1.310153805177419);

        // Player card background
        this.add.image(160, 176, "M_playerCard");

        // Cancel button
        this.BUTTON_CANCEL = this.add.image(1424, 704, "M_btnCancel");
        this.BUTTON_CANCEL.setScale(1.419003049417908);

        // ‘Finding a Match’ text
        this.FINDING_MATCH_TEXT = this.add.text(1168, 416, "Finding a Match", {
            fontFamily: "Arial",
            fontSize: "48px",
            fontStyle: "bold",
        });
        this.FINDING_MATCH_TEXT.setScale(1.4657553250177893);

        // Loader text (animated dots)
        this.LOADER = this.add.text(1392, 496, "...", {
            fontFamily: "Arial",
            fontSize: "48px",
            fontStyle: "bold",
        });
        this.LOADER.setScale(1.4657553250177893);

        // Player name placeholder
        this.PLAYER_NAME = this.add.text(32, 144, "Player Name", {
            align: "center",
            fontFamily: "Arial",
            fontSize: "64px",
            fontStyle: "bold",
        });

        this.events.emit("scene-awake");
    }
}

