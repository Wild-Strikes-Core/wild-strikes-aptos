import * as Phaser from 'phaser';

export default class MatchFound extends Phaser.Scene {
    private leftPlayerCard!: Phaser.GameObjects.Image;
    private rightPlayerCard!: Phaser.GameObjects.Image;
    private leftPlayerName!: Phaser.GameObjects.Text;
    private rightPlayerName!: Phaser.GameObjects.Text;
    private playerCharSprite!: Phaser.GameObjects.Image;
    private enemyCharSprite!: Phaser.GameObjects.Image;
    private vsText!: Phaser.GameObjects.Text;

    private BG_STARS!: Phaser.GameObjects.Image;
    private BG_CLOUDS!: Phaser.GameObjects.Image;

    private yourData!: string[];
    private opponentData!: string[];
    private opponentId: string;
    private yourId: string;
    private mapConfig!: any;
    private p1SpawnPosition!: { x: number; y: number };
    private p2SpawnPosition!: { x: number; y: number };
    private roomId: string;

    constructor() {
        super("MatchFound");
    }

    /* ------------------------------------------------------------------
     * Initialization from Matchmaking Scene
     * ------------------------------------------------------------------ */
    init(data: {
        opponentId: string,
        yourId: string,
        yourData: string[],
        opponentData: string[],
        mapConfig: any,
        p1SpawnPosition?: { x: number; y: number },
        p2SpawnPosition?: { x: number; y: number },
        roomId: string
    }) {
        this.yourData = data.yourData;
        this.yourId = data.yourId;
        this.opponentId = data.opponentId;
        this.opponentData = data.opponentData;
        this.mapConfig = data.mapConfig;
        this.p1SpawnPosition = data.p1SpawnPosition;
        this.p2SpawnPosition = data.p2SpawnPosition;
        this.roomId = data.roomId;
    }

    /* ------------------------------------------------------------------
     * Scene Creation
     * ------------------------------------------------------------------ */
    create(): void {
        const { width, height, centerX } = this.cameras.main;
        
        this.add.image(0, 0, "2G_bg").setOrigin(0, 0).setDisplaySize(width, height).setDepth(-1000);

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

        this.BG_CLOUDS = this.add.image(centerX, height + cloudsNewHeight / 2, "M_bgClouds")
            .setOrigin(0.5, 1)
            .setDisplaySize(width, cloudsNewHeight)
            .setDepth(-800);

        this.createUI();

        this.animateSceneEntrance();

        this.time.delayedCall(4500, () => this.transitionToBattle());
    }

    /* ------------------------------------------------------------------
     * UI Creation and Animations
     * ------------------------------------------------------------------ */

    private createUI(): void {
        this.leftPlayerCard = this.add.image(146, 216, "M_playerCard").setAlpha(0);

        this.leftPlayerName = this.add.text(18, 184, this.yourData[0], {
            align: "center",
            fontFamily: "Arial",
            fontSize: "64px",
            fontStyle: "bold",
        }).setAlpha(0);

        this.rightPlayerCard = this.add.image(1761, 216, "M_playerCard").setAlpha(0);

        this.rightPlayerName = this.add.text(1521, 184, this.opponentData[0], {
            align: "center",
            fontFamily: "Arial",
            fontSize: "64px",
            fontStyle: "bold",
        }).setAlpha(0);

        this.playerCharSprite = this.add.image(447, 555, this.yourData[1]).setScale(1.310153805177419).setAlpha(0);

        this.enemyCharSprite = this.add.image(1359, 555, this.opponentData[1]).setScale(1.310153805177419).setFlipX(true).setAlpha(0);

        this.vsText = this.add.text(834, 486, "V.S", {
            align: "center",
            fontFamily: "Arial",
            fontSize: "128px",
            fontStyle: "bold",
        }).setAlpha(0);
    }

    private animateSceneEntrance(): void {
        const { width, height, centerX } = this.cameras.main;

        this.tweens.add({
            targets: this.BG_CLOUDS,
            y: height,
            duration: 800,
            ease: 'Power2',
        });
        
        this.time.delayedCall(500, () => {
            this.tweens.add({
                targets: [this.leftPlayerCard, this.leftPlayerName],
                alpha: 1,
                x: { from: -300, to: this.leftPlayerCard.x },
                duration: 600,
                ease: "Back.out(1.5)",
            });
            this.tweens.add({
                targets: [this.rightPlayerCard, this.rightPlayerName],
                alpha: 1,
                x: { from: width + 300, to: this.rightPlayerCard.x },
                duration: 600,
                ease: "Back.out(1.5)",
            });

            this.time.delayedCall(800, () => {
                this.tweens.add({
                    targets: this.playerCharSprite,
                    alpha: 1,
                    scale: 1.31,
                    x: { from: 447 - 50, to: 447 },
                    duration: 500,
                    ease: "Back.out(1.5)",
                    onComplete: () => this.addIdleAnimation(this.playerCharSprite)
                });
                this.tweens.add({
                    targets: this.enemyCharSprite,
                    alpha: 1,
                    scale: 1.31,
                    x: { from: 1359 + 50, to: 1359 },
                    duration: 500,
                    ease: "Back.out(1.5)",
                    onComplete: () => this.addIdleAnimation(this.enemyCharSprite, true)
                });
            });

            this.time.delayedCall(1500, () => {
                this.cameras.main.shake(200, 0.01);
                const flashCircle = this.add.circle(centerX, 486 + 12, 100, 0xffff00, 0).setDepth(-1);
                this.tweens.add({ targets: flashCircle, alpha: 0.7, scale: 2, duration: 300, yoyo: true, onComplete: () => flashCircle.destroy() });
                this.tweens.add({ targets: this.vsText, alpha: 1, scale: 1, duration: 400, ease: "Back.out(1.7)" });
                this.time.delayedCall(400, () => {
                    this.tweens.add({ targets: this.vsText, scale: 1.1, duration: 500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
                });
            });
        });
    }

    private addIdleAnimation(charSprite: Phaser.GameObjects.Image, isEnemy = false): void {
        const originalY = charSprite.y;
        this.tweens.add({
            targets: charSprite,
            y: originalY - 50,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
        });
        const lean = isEnemy ? -8 : 8;
        this.tweens.add({
            targets: charSprite,
            angle: lean,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
    }

    private transitionToBattle(): void {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start('Arena', {
                mapConfig: this.mapConfig,
                yourData: this.yourData,
                opponentData: this.opponentData,
                opponentId: this.opponentId,
                yourId: this.yourId,
                p1SpawnPosition: this.p1SpawnPosition,
                p2SpawnPosition: this.p2SpawnPosition,
                roomId: this.roomId
            });
        });
    }
}
