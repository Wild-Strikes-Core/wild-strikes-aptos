import { io, Socket } from 'socket.io-client';

export default class Matchmaking extends Phaser.Scene {
    // Scene element references (renamed for clarity)
    private playerSprite!: Phaser.GameObjects.Image;
    private cancelButton!: Phaser.GameObjects.Image;
    private loaderText!: Phaser.GameObjects.Text;
    private playerNameLabel!: Phaser.GameObjects.Text;
    private findingMatchLabel!: Phaser.GameObjects.Text;

    private loaderDots: string[] = [".", "..", "..."];
    private loaderIndex = 0;

    private socket: Socket | null = null;

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
        // this.time.delayedCall(2500, () => this.goToMatchFound());

        // Optional ambience - only play if audio is loaded
        if (this.sound.get("waiting-music") || this.cache.audio.exists("waiting-music")) {
            this.sound.play("waiting-music", { loop: true });
        } else {
            console.warn("waiting-music audio not found in cache");
        }
        this.events.once("shutdown", this.onShutdown, this);

        this.connectToServer();
    }

    private connectToServer(): void {
        console.log('Connecting to matchmaking server...');
        this.socket = io('http://localhost:3001');

        this.socket.on('connect', () => {
            console.log('Connected to server:', this.socket!.id);
            this.findingMatchLabel.setText('Connected! Finding Match...');
            
            // Send matchmaking request once connected
            this.socket!.emit('matchmaking:find');
        });

        this.socket.on('matchmaking:found', (data: any) => {
            console.log('Match found:', data);
            this.findingMatchLabel.setText('Match Found!');
            
            // Go to MatchFound scene with socket data
            this.goToMatchFound(data);
        });

        this.socket.on('connect_error', (error: any) => {
            console.error('Connection failed:', error);
            this.findingMatchLabel.setText('Connection Failed!');
            
            // Fallback to single player after 3 seconds
            this.time.delayedCall(3000, () => {
                this.scene.start('Arena');
            });
        });
    }

    /* ------------------------------------------------------------------
     * Helpers
     * ------------------------------------------------------------------ */

    private setupCancelButton(): void {
        this.cancelButton.setInteractive();

        this.cancelButton.on("pointerdown", () => {
            this.cameras.main.fadeOut(180, 0, 0, 0);
            this.cameras.main.once("camerafadeoutcomplete", () => {
                this.scene.stop("Matchmaking");
                this.scene.start("Home");
            });
        });

        this.cancelButton.on("pointerover", () => this.cancelButton.setTint(0xffff66));
        this.cancelButton.on("pointerout", () => this.cancelButton.clearTint());
    }

    private animateEntrance(): void {
        this.tweens.add({
            targets: this.playerSprite,
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
                this.loaderText.text = this.loaderDots[this.loaderIndex];
                this.loaderIndex = (this.loaderIndex + 1) % this.loaderDots.length;
            },
        });
    }

    private goToMatchFound(matchData:any): void {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.stop("Matchmaking");
            this.scene.start("MatchFound", {
                socket: this.socket,
                roomId: matchData.roomId,
                opponentId: matchData.opponentId,
            });
        });
    }

    private onShutdown(): void {
        // Only stop audio if it exists and is playing
        if (this.sound.get("waiting-music")) {
            this.sound.stopByKey("waiting-music");
        }
    }

    /* ------------------------------------------------------------------
     * editorCreate – UI recreated from the original auto-generated code
     * ------------------------------------------------------------------ */

    editorCreate(): void {
        this.playerSprite = this.add.image(528, 608, "M_charONE");
        this.playerSprite.setScale(1.310153805177419);

        // Player card background
        this.add.image(160, 176, "M_playerCard");

        // Cancel button
        this.cancelButton = this.add.image(1424, 704, "M_btnCancel");
        this.cancelButton.setScale(1.419003049417908);

        // ‘Finding a Match’ text
        this.findingMatchLabel = this.add.text(1168, 416, "Finding a Match", {
            fontFamily: "Arial",
            fontSize: "48px",
            fontStyle: "bold",
        });
        this.findingMatchLabel.setScale(1.4657553250177893);

        // Loader text (animated dots)
        this.loaderText = this.add.text(1392, 496, "...", {
            fontFamily: "Arial",
            fontSize: "48px",
            fontStyle: "bold",
        });
        this.loaderText.setScale(1.4657553250177893);

        // Player name placeholder
        this.playerNameLabel = this.add.text(32, 144, "Player Name", {
            align: "center",
            fontFamily: "Arial",
            fontSize: "64px",
            fontStyle: "bold",
        });

        this.events.emit("scene-awake");
    }
}

