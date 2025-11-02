import * as Phaser from 'phaser';
import { AssetLoader } from '../../AssetLoader';

/**
 * BootScene is the first scene to run. It is responsible for
 * loading all game assets and then transitioning to the HomeScene.
 */
export class BootScene extends Phaser.Scene {
    // We will use a graphics object to draw the progress bar and its border
    private progressBar?: Phaser.GameObjects.Graphics;
    private loadingText?: Phaser.GameObjects.Text;
    private BG!: Phaser.GameObjects.Image; // The main background image bugged!!
    private BG_STARS!: Phaser.GameObjects.Image; // The animated stars bugged!!
    private BG_HILL!: Phaser.GameObjects.Image; // The hill image bugged!!
 
    //WIP before i proceed with using animation, thisis bugged pa

    private platform: string = 'desktop';

    constructor() {
        super('Boot');
    }

    init(): void {
        this.platform = this.sys.game.device.os.desktop ? 'desktop' : 'mobile';
    }

    preload(): void {
        this.createLoadingUI();
        
        const loader = new AssetLoader(this.load);

        loader.loadGroup('environment');

        this.load.image("2G_bg", "/assets/game/ui/menu/2G_bg.png");
        this.load.image("2g_bgStars", "/assets/game/ui/menu/2G_mainBg.png");
        this.load.image("2G_bgHill", "/assets/game/ui/menu/2G_bgHill.png");
        
        this.load.css('VT323', 'https://fonts.googleapis.com/css2?family=VT323&display=swap');

        this.load.on("progress", (progress: number) => {
            const { width, height } = this.cameras.main;
            if (this.progressBar) {
                // Clear the previous drawing
                this.progressBar.clear();
                
                // Draw the progress bar background (the border)
                const barWidth = 464;
                const barHeight = 28;
                const borderRadius = 8;
                const x = width / 2 - barWidth / 2;
                const y = height / 2;

                // Border
                this.progressBar.fillStyle(0xffffff);
                this.progressBar.fillRoundedRect(x - 2, y - 2, barWidth + 4, barHeight + 4, borderRadius + 2);
                
                // Inner bar background
                this.progressBar.fillStyle(0x000000);
                this.progressBar.fillRoundedRect(x, y, barWidth, barHeight, borderRadius);

                // Draw the actual progress bar
                this.progressBar.fillStyle(0xffffff);
                // The bar grows from 4px to 464px when fully loaded
                const currentWidth = 4 + 460 * progress;
                this.progressBar.fillRoundedRect(x, y, currentWidth, barHeight, borderRadius);
            }
        });
        
        // Load the remaining asset groups
        loader.loadGroup('boot');
        loader.loadGroup('ui');
        loader.loadGroup('ui-audio');
        loader.loadGroup('gameplay-audio');
    }

    create(): void {
        this.createBackground();
        
        console.log('All assets loaded successfully');

        const fontsApi = (document as any).fonts;
        if (fontsApi && fontsApi.load) {
            fontsApi.load('50px VT323').then(() => {
                this.scene.start('StartMenu');
            });
        } else {
            this.scene.start('StartMenu');
        }
    }

    private createBackground(): void {
        const { width, height } = this.cameras.main;

        // This is the static background
        this.BG = this.add.image(0, 0, "2G_bg");
        this.BG.setOrigin(0, 0);
        this.BG.setDisplaySize(width, height);
        this.BG.setDepth(-1000); // Put it behind everything

        // This is the animated starry background
        this.BG_STARS = this.add.image(0, 0, "2g_bgStars");
        this.BG_STARS.setOrigin(0, 0);
        this.BG_STARS.setDisplaySize(width, height);
        this.BG_STARS.setDepth(-900); // Between the main background and the hill
        this.tweens.add({
            targets: this.BG_STARS,
            alpha: { from: 0.2, to: 1 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // This is the hill to be removed once we fix this file
        this.BG_HILL = this.add.image(width / 2, height, '2G_bgHill').setOrigin(0.5, 1);
        this.BG_HILL.setDepth(-800); // In front of the stars
    }

    private createLoadingUI(): void {
        const { width, height } = this.cameras.main;

        this.progressBar = this.add.graphics();
        this.progressBar.setDepth(1);

        // Add the "LOADING" text on top off the bar
        this.loadingText = this.add.text(width / 2, height / 2 - 40, 'LOADING', {
            fontFamily: '"VT323", monospace',
            fontSize: '50px',
            color: '#ffffff',
        }).setOrigin(0.5);
    }
}
