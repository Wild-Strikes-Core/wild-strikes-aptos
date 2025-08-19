/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
// You can add other imports here if needed
/* END-USER-IMPORTS */

export default class Defeat extends Phaser.Scene {
    constructor() {
        super("Defeat");
    }

    editorCreate(): void {
        this.events.emit("scene-awake");
    }

    private topClouds!: Phaser.GameObjects.TileSprite;
    private bottomClouds!: Phaser.GameObjects.TileSprite;
    private rankIcon!: Phaser.GameObjects.Image;
    private shards: Phaser.GameObjects.Image[] = [];

    private eloBanner!: Phaser.GameObjects.Image;
    private defeatText!: Phaser.GameObjects.Text;

    /* START-USER-CODE */

    preload() {
        console.log("Defeat scene preload() called");
        
        this.load.image('2G_bg', 'assets/2G_bg.png');
        this.load.image('Purple_Green_Pixel_Illustration_Game_Presentation__2_-removebg-preview', 'assets/game/ui/landing/Purple_Green_Pixel_Illustration_Game_Presentation__2_-removebg-preview.png');
        this.load.image('rank_icon', 'assets/New Assets/Rank/rank6.png'); 
        this.load.image('Empty-Shards', 'assets/New Assets/Shards/gray-shards.png');
        this.load.image('elo_banner', 'assets/11 - Victory/1.png');
        
        console.log("Defeat scene preload() completed");
    }

    create() {
        console.log("=== Defeat scene create() called ===");
        
        const bg = this.add.image(0, 0, "2G_bg").setOrigin(0, 0);
        bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        bg.setTint(0x802020); // Dark red tint for defeat
        bg.setDepth(-1000);

        this.topClouds = this.add.tileSprite(976, 288, 1029, 242, "Purple_Green_Pixel_Illustration_Game_Presentation__2_-removebg-preview")
            .setScale(2).setDepth(-950);

        this.bottomClouds = this.add.tileSprite(1008, 1072, 1029, 242, "Purple_Green_Pixel_Illustration_Game_Presentation__2_-removebg-preview")
            .setScale(2).setDepth(-950);

        const { centerX, centerY } = this.cameras.main;

        this.defeatText = this.add.text(centerX, 128, "DEFEAT!", {
            fontFamily: '"VT323"',
            fontSize: "180px",
            color: '#ffdd00', 
            align: 'center',
            stroke: '#000000',
            strokeThickness: 10,
        }).setOrigin(0.5).setDepth(15);
        
        this.rankIcon = this.add.image(centerX, centerY - 100, 'rank_icon')
            .setDepth(10)
            .setScale(3);
        
        const bannerY = this.rankIcon.y + (this.rankIcon.displayHeight / 2) + 140; 

        this.eloBanner = this.add.image(centerX, bannerY, 'elo_banner')
            .setDepth(12);

        const shardCount = 3;
        const spacing = 150;
        const startX = this.eloBanner.x - (spacing * (shardCount - 1)) / 2;

        for (let i = 0; i < shardCount; i++) {
            const shard = this.add.image(startX + i * spacing, this.eloBanner.y - 40, 'Empty-Shards').setDepth(13);
            this.shards.push(shard);
        }

        this.eloBanner.setAlpha(0);
        this.defeatText.setAlpha(0);
        this.rankIcon.setAlpha(0);
        this.shards.forEach(shard => shard.setAlpha(0));

        this.sound.play("defeat", { volume: 0.8 });
        this.events.on("shutdown", this.onShutdown, this);

        this.startAnimationSequence();
        
        console.log("=== Defeat scene create() completed ===");
    }

    private onShutdown(): void {
        this.sound.stopByKey("defeat");
    }

    update() {
        this.topClouds.tilePositionX += 1;
        this.bottomClouds.tilePositionX += 1;
    }

    startAnimationSequence() {
        console.log("Starting animation sequence...");

        this.tweens.add({
            targets: this.rankIcon,
            alpha: 1,
            y: { from: this.rankIcon.y - 200, to: this.rankIcon.y },
            duration: 1500,
            ease: 'Power2',
        });
    
        this.tweens.add({
            targets: this.eloBanner,
            alpha: 1,
            y: { from: this.eloBanner.y + 200, to: this.eloBanner.y },
            duration: 1500,
            ease: 'Power2',
            delay: 200,
            onComplete: () => {
                this.shards.forEach((shard, index) => {
                    this.time.delayedCall(index * 200, () => {
                        this.tweens.add({
                            targets: shard,
                            alpha: 1,
                            y: shard.y - 20, 
                            duration: 500,
                            ease: 'Sine.easeInOut'
                        });
                    });
                });
            }
        });
        
        this.tweens.add({
            targets: this.defeatText,
            alpha: 1,
            duration: 1000,
            ease: "Linear",
        });
    
        // Transition back to Home scene after a delay
        this.time.delayedCall(5000, () => {
            console.log("Fading out scene...");
            this.cameras.main.fadeOut(2000, 0, 0, 0, (camera, progress) => {
                if (progress === 1) {
                    console.log("Switching to Home scene...");
                    this.scene.start("Home");
                }
            });
        });
    }
    /* END-USER-CODE */
}

/* END OF COMPILED CODE */