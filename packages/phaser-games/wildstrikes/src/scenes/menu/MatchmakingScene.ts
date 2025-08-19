import * as Phaser from 'phaser';
import { socket } from "../../shared-utils/socket";

export default class Matchmaking extends Phaser.Scene {
    private BG_STARS!: Phaser.GameObjects.Image;
    private BG_CLOUDS!: Phaser.GameObjects.Image;
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
     * Preload all assets
     * ------------------------------------------------------------------ */
    preload(): void {
        this.load.pack('matchmakingAssets', 'path/to/your/asset-pack.json');
    }

    /* ------------------------------------------------------------------
    * Scene creation
    * ------------------------------------------------------------------ */
    create(): void {
        const { width, height, centerX } = this.cameras.main;

        const bg = this.add.image(0, 0, "2G_bg").setOrigin(0, 0).setDisplaySize(width, height).setDepth(-1000);

        if (this.textures.exists("2g_bgStars")) {
            this.BG_STARS = this.add.image(0, 0, "2g_bgStars").setOrigin(0, 0).setDisplaySize(width, height).setDepth(-900);
            this.tweens.add({
                targets: this.BG_STARS,
                alpha: { from: 0.2, to: 1 },
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            });
        }
        
        const cloudsTexture = this.textures.get("M_bgClouds");
        const cloudsOriginalWidth = cloudsTexture.source[0].width;
        const cloudsOriginalHeight = cloudsTexture.source[0].height;
        const cloudsScaleRatio = width / cloudsOriginalWidth;
        const cloudsNewHeight = cloudsOriginalHeight * cloudsScaleRatio;

        const startY = height + cloudsNewHeight;

        this.BG_CLOUDS = this.add.image(centerX, startY, "M_bgClouds")
            .setOrigin(0.5, 1)
            .setDisplaySize(width, cloudsNewHeight)
            .setDepth(-800);

        this.tweens.add({
            targets: this.BG_CLOUDS,
            y: height,
            duration: 1000,
            ease: 'Power2',
            delay: 200
        });
        
        this.createUI();
        
        this.connectMatchmakingSocket();
        this.events.emit("scene-awake");
        this.events.once("shutdown", this.onShutdown, this);
    }

    /* ------------------------------------------------------------------
    * UI Creation and Animations
    * ------------------------------------------------------------------ */

    private createUI(): void {
        const finalX = 528;
        const finalY = 608;
        this.playerSprite = this.add.image(-200, finalY, "M_charONE").setScale(1.31).setAlpha(0);
        (this.playerSprite as any).originalX = finalX;
        (this.playerSprite as any).originalY = finalY;

        this.add.image(160, 176, "M_playerCard");
        this.cancelButton = this.add.image(1424, 704, "M_btnCancel").setScale(1.419);
        this.findingMatchLabel = this.add.text(1168, 416, "Finding a Match", { fontFamily: "Arial", fontSize: "48px", fontStyle: "bold" }).setScale(1.465);
        this.loaderText = this.add.text(1392, 496, "...", { fontFamily: "Arial", fontSize: "48px", fontStyle: "bold" }).setScale(1.465);
        this.playerNameLabel = this.add.text(32, 144, "Player Name", { align: "center", fontFamily: "Arial", fontSize: "64px", fontStyle: "bold" });

        this.animateEntrance();
        this.setupEntranceTransition();
        this.setupCancelButton();
        this.animateLoader();
        
        if (this.sound.get("waiting-music") || this.cache.audio.exists("waiting-music")) {
            this.sound.play("waiting-music", { loop: true });
        } else {
            console.warn("waiting-music audio not found in cache");
        }
    }

    private setupCancelButton(): void {
        this.cancelButton.setInteractive();
        
        this.cancelButton.on("pointerdown", () => {
            socket.emit("leave-matchmaking");
            this.cameras.main.fadeOut(180, 0, 0, 0, () => {
                this.scene.stop("Matchmaking");
                this.scene.start("Home");
            });
        });

        this.cancelButton.on("pointerover", () => this.cancelButton.setTint(0xffff66));
        this.cancelButton.on("pointerout", () => this.cancelButton.clearTint());
    }

    private animateEntrance(): void {
        const { originalX, originalY } = this.playerSprite as any;
        this.tweens.add({
            targets: this.playerSprite,
            x: originalX,
            y: originalY,
            alpha: 1,
            duration: 1500,
            ease: "Back.easeOut",
            onComplete: () => this.animateIdle()
        });
    }

    private animateIdle(): void {
        const originalY = (this.playerSprite as any).originalY;
        this.tweens.add({
            targets: this.playerSprite,
            y: originalY - 50,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
        });
        this.tweens.add({
            targets: this.playerSprite,
            angle: '+=8',
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
        });
    }

    private setupEntranceTransition(): void {
        this.cameras.main.fadeIn(800, 0, 0, 0);
    }

    private animateLoader(): void {
        this.time.addEvent({
            delay: 250,
            repeat: -1,
            callback: () => {
                this.loaderIndex = (this.loaderIndex + 1) % this.loaderDots.length;
                this.loaderText.text = this.loaderDots[this.loaderIndex];
            },
        });
    }

    /* ------------------------------------------------------------------
    * Socket and Shutdown Logic
    * ------------------------------------------------------------------ */

    private onShutdown(): void {
        if (this.sound.get("waiting-music")) {
            this.sound.stopByKey("waiting-music");
        }
        socket.off("match-found");
        socket.off("opponent-disconnected");
        socket.off("map-selected");
    }

    private connectMatchmakingSocket(): void {
        socket.off("match-found");
        socket.off("map-selected");
        socket.off("opponent-disconnected");

        socket.on("map-selected", (MapSelectedData) => {
            this.mapConfig = MapSelectedData.mapConfig;
            this.p1SpawnPosition = MapSelectedData.players[0].spawnPosition;
            this.p2SpawnPosition = MapSelectedData.players[1].spawnPosition;
        });

        socket.on("match-found", (data) => {
            this.sound.stopByKey("waiting-music");
            this.cameras.main.fadeOut(400, 0, 0, 0, () => {
                this.scene.stop("Matchmaking");
                this.scene.start("MatchFound", { ...data, mapConfig: this.mapConfig, p1SpawnPosition: this.p1SpawnPosition, p2SpawnPosition: this.p2SpawnPosition });
            });
        });

        socket.on("opponent-disconnected", () => {
            console.warn("Opponent disconnected during matchmaking");
            this.cameras.main.fadeOut(400, 0, 0, 0, () => {
                this.scene.stop("Matchmaking");
                this.scene.start("Home");
            });
        });

        const playerData = [this.playerNameLabel.text || "Anonymous", "M_charONE"];
        socket.emit("join-matchmaking", playerData);
    }
}