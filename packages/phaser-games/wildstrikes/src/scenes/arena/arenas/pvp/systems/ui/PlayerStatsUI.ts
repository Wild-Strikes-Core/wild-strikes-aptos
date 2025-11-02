import * as Phaser from 'phaser';

interface PlayerStats {
    damagePercentage: number;
    lives: number;
    knockback?: { force: number; angle: number };
    position?: { x: number; y: number };
    velocity?: { x: number; y: number };
    animation?: string;
}

export class PlayerStatsUI {
    private scene: Phaser.Scene;
    private playerSprite: Phaser.Physics.Arcade.Sprite;
    private statsContainer: Phaser.GameObjects.Container;
    private popupsGroup: Phaser.GameObjects.Container;

    // Health bar components
    private healthBar: Phaser.GameObjects.Graphics;
    private healthBarBg: Phaser.GameObjects.Graphics;
    private healthBarBorder: Phaser.GameObjects.Graphics;

    // Local player indicator
    private playerIndicator?: Phaser.GameObjects.Graphics;
    private isLocalPlayer: boolean;

    constructor(scene: Phaser.Scene, playerSprite: Phaser.Physics.Arcade.Sprite, isLocalPlayer: boolean = false) {
        this.scene = scene;
        this.playerSprite = playerSprite;
        this.isLocalPlayer = isLocalPlayer;
        this.createUI();
    }

    private createUI(): void {
        this.statsContainer = this.scene.add.container(0, 0);
        this.statsContainer.setDepth(12000);
        this.statsContainer.setScrollFactor(1, 1);

        const barWidth = 100;
        const barHeight = 10;
        const barX = -barWidth / 2;
        const barY = -barHeight / 2;

        // Health bar background
        this.healthBarBg = this.scene.add.graphics();
        this.healthBarBg.fillStyle(0x333333, 1);
        this.healthBarBg.fillRect(barX, barY, barWidth, barHeight);

        // Health bar fill
        this.healthBar = this.scene.add.graphics();

        // Health bar border
        this.healthBarBorder = this.scene.add.graphics();
        this.healthBarBorder.lineStyle(2, 0xffffff, 1);
        this.healthBarBorder.strokeRect(barX, barY, barWidth, barHeight);

        this.popupsGroup = this.scene.add.container(0, 0);

        this.statsContainer.add([
            this.healthBarBg,
            this.healthBar,
            this.healthBarBorder,
            this.popupsGroup
        ]);

        if (this.isLocalPlayer) {
            this.playerIndicator = this.scene.add.graphics();
            this.playerIndicator.setDepth(12001); // Render on top of all other sprites
            const triangleSize = 10;
            this.playerIndicator.fillStyle(0x00ff00, 0.8);
            this.playerIndicator.beginPath();
            this.playerIndicator.moveTo(0, 0);
            this.playerIndicator.lineTo(-triangleSize, triangleSize);
            this.playerIndicator.lineTo(triangleSize, triangleSize);
            this.playerIndicator.closePath();
            this.playerIndicator.fillPath();
        }

        this.updatePosition();
    }

    public updateStats(stats: PlayerStats): void {
        const maxDamage = 100; // Using 100 as the threshold for a full bar depletion.
        const damage = Phaser.Math.Clamp(stats.damagePercentage, 0, maxDamage);
        const healthPercentage = 1 - (damage / maxDamage);
        const barWidth = 100;
        const barHeight = 10;
        const currentBarWidth = barWidth * healthPercentage;

        this.healthBar.clear();

        // Color changes from green to yellow to red
        if (stats.damagePercentage >= 75) { // Critically low health (high damage)
            this.healthBar.fillStyle(0xff0000, 1); // Red
        } else if (stats.damagePercentage >= 50) { // Medium damage
            this.healthBar.fillStyle(0xffff00, 1); // Yellow
        } else { // Low damage
            this.healthBar.fillStyle(0x00ff00, 1); // Green
        }

        this.healthBar.fillRect(-barWidth / 2, -barHeight / 2, currentBarWidth, barHeight);
    }

    public update(): void {
        this.updatePosition();
    }

    private updatePosition(): void {
        if (!this.playerSprite || !this.statsContainer) return;

        // Position health bar above the sprite
        const healthBarOffsetY = -(this.playerSprite.displayHeight / 2) - 20;
        this.statsContainer.setPosition(
            this.playerSprite.x,
            this.playerSprite.y + healthBarOffsetY
        );

        // Position indicator below the sprite
        if (this.playerIndicator) {
            const indicatorOffsetY = 20; // Fixed offset from the player sprite's center
            this.playerIndicator.setPosition(
                this.playerSprite.x,
                this.playerSprite.y + indicatorOffsetY
            );
        }
    }

    public setVisible(visible: boolean): void {
        if (this.statsContainer) {
            this.statsContainer.setVisible(visible);
        }
        if (this.playerIndicator) {
            this.playerIndicator.setVisible(visible);
        }
    }

    public showDamagePopup(amount: number, color: string = '#ff4444'): void {
        if (!this.scene || !this.popupsGroup) return;

        const text = this.scene.add.text(0, -20, `${Math.round(amount)}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            fontStyle: 'bold',
            color,
            stroke: '#000000',
            strokeThickness: 3,
            resolution: 2,
        }).setOrigin(0.5, 1);

        this.popupsGroup.add(text);

        this.scene.tweens.add({
            targets: text,
            y: '-=30',
            alpha: { from: 1, to: 0 },
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy(),
        });
    }

    public destroy(): void {
        if (this.statsContainer) {
            this.statsContainer.destroy();
            (this as any).statsContainer = null;
        }
        if (this.playerIndicator) {
            this.playerIndicator.destroy();
            (this as any).playerIndicator = null;
        }
    }
}