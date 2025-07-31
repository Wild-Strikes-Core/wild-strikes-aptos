import { socket } from "../shared-utils/socket";

export default class Matchmaking extends Phaser.Scene {
    // Scene element references (renamed for clarity)
    private playerSprite!: Phaser.GameObjects.Image;
    private cancelButton!: Phaser.GameObjects.Image;
    private loaderText!: Phaser.GameObjects.Text;
    private playerNameLabel!: Phaser.GameObjects.Text;
    private findingMatchLabel!: Phaser.GameObjects.Text;

    private loaderDots: string[] = [".", "..", "..."];
    private loaderIndex = 0;

    private mapConfig!: string[];
    private p1SpawnPosition!: { x: number; y: number };
    private p2SpawnPosition!: { x: number; y: number };


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

        this.connectMatchmakingSocket();

        this.events.emit("scene-awake");

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
    }

    /* ------------------------------------------------------------------
     * Helpers
     * ------------------------------------------------------------------ */

    private setupCancelButton(): void {
        this.cancelButton.setInteractive();
        
        this.cancelButton.on("pointerdown", () => {
            socket.emit("leave-matchmaking");
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



    private onShutdown(): void {
        // Only stop audio if it exists and is playing
        if (this.sound.get("waiting-music")) {
            this.sound.stopByKey("waiting-music");
        }

        socket.off("match-found");
        socket.off("opponent-disconnected");
    }

    private connectMatchmakingSocket(): void {
        socket.off("match-found"); // avoid duplication

                // Map selection event
        socket.on("map-selected", (MapSelectedData) => {
            console.log("=== MAP SELECTED BY SERVER ===");
            console.log("Full MapSelectedData:", MapSelectedData);
            console.log(`Map Config:`, MapSelectedData.mapConfig);
            console.log(`Player 1 (${MapSelectedData.players[0].socketId}): (${MapSelectedData.players[0].spawnPosition.x}, ${MapSelectedData.players[0].spawnPosition.y})`);
            console.log(`Player 2 (${MapSelectedData.players[1].socketId}): (${MapSelectedData.players[1].spawnPosition.x}, ${MapSelectedData.players[1].spawnPosition.y})`);
            console.log(`My Socket ID: ${socket.id}`);
            console.log(`First player is me: ${MapSelectedData.players[0].socketId === socket.id}`);
            console.log("================================");
            
            this.mapConfig = MapSelectedData.mapConfig;
            
            // The first player in the array is always the local player
            // The second player is always the opponent
            this.p1SpawnPosition = MapSelectedData.players[0].spawnPosition;
            this.p2SpawnPosition = MapSelectedData.players[1].spawnPosition;
        });

        socket.on("match-found", (data) => {
            console.log("=== MATCH FOUND EVENT ===");
            console.log("Full match data:", data);
            console.log(`Your ID: ${data.yourId}`);
            console.log(`Opponent ID: ${data.opponentId}`);
            console.log(`Room ID: ${data.roomId}`); // ✅ Add this log
            console.log(`Your Data:`, data.yourData);
            console.log(`Opponent Data:`, data.opponentData);
            console.log(`Map Config:`, this.mapConfig);
            console.log(`P1 Spawn: (${this.p1SpawnPosition?.x}, ${this.p1SpawnPosition?.y})`);
            console.log(`P2 Spawn: (${this.p2SpawnPosition?.x}, ${this.p2SpawnPosition?.y})`);
            console.log("================================");
            
            this.sound.stopByKey("waiting-music");
        
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once("camerafadeoutcomplete", () => {
                this.scene.stop("Matchmaking");
                this.scene.start("MatchFound", {
                    opponentId: data.opponentId,
                    opponentData: data.opponentData,
                    yourId: data.yourId,
                    yourData: data.yourData,
                    mapConfig: this.mapConfig,
                    p1SpawnPosition: this.p1SpawnPosition,
                    p2SpawnPosition: this.p2SpawnPosition,
                    roomId: data.roomId 
                });
            });
        });

        socket.on("opponent-disconnected", () => {
            console.warn("Opponent disconnected during matchmaking");
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once("camerafadeoutcomplete", () => {
                this.scene.stop("Matchmaking");
                this.scene.start("Home");
            });
        });

        const playerData = [
            this.playerNameLabel.text || "Anonymous", // You can enhance this
            "M_charONE", // character ID or other info
        ];

        socket.emit("join-matchmaking", playerData);
    }

}

