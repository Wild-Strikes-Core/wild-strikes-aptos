interface PlayerStats {
    health: number;
    damagePercentage: number;
    lives: number;
    position?: { x: number; y: number };
    velocity?: { x: number; y: number };
    animation?: string;
}

export class PlayerStatsUI {
    private scene: Phaser.Scene;
    private playerSprite: Phaser.Physics.Arcade.Sprite;
    private statsContainer: Phaser.GameObjects.Container;
    private healthText: Phaser.GameObjects.Text;
    private damageText: Phaser.GameObjects.Text;
    private livesText: Phaser.GameObjects.Text;
    private positionText: Phaser.GameObjects.Text;
    private velocityText: Phaser.GameObjects.Text;
    private animationText: Phaser.GameObjects.Text;
    private backgroundRect: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, playerSprite: Phaser.Physics.Arcade.Sprite) {
        this.scene = scene;
        this.playerSprite = playerSprite;
        this.createUI();
    }

    private createUI(): void {
        // Create a container to hold all stats elements
        this.statsContainer = this.scene.add.container(0, 0);
        this.statsContainer.setDepth(1000); // High depth to ensure it's on top

        // Create background rectangle for better readability - larger for more info
        this.backgroundRect = this.scene.add.rectangle(0, 0, 220, 140, 0x000000, 0.85);
        this.backgroundRect.setStrokeStyle(3, 0xffffff, 0.9);
        
        // Create text objects with larger fonts to combat pixelation
        const textStyle = {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2,
            resolution: 1 // Keep at 1 since pixelArt is enabled
        };

        this.healthText = this.scene.add.text(-100, -50, 'HP: 100', {
            ...textStyle,
            color: '#00ff00'
        });

        this.damageText = this.scene.add.text(-100, -28, 'DMG: 0%', {
            ...textStyle,
            color: '#ff6600'
        });

        this.livesText = this.scene.add.text(-100, -6, 'Lives: 3', {
            ...textStyle,
            color: '#ffffff'
        });

        this.positionText = this.scene.add.text(-100, 16, 'Pos: 0, 0', {
            ...textStyle,
            color: '#00ffff'
        });

        this.velocityText = this.scene.add.text(-100, 38, 'Vel: 0, 0', {
            ...textStyle,
            color: '#ffff00'
        });

        this.animationText = this.scene.add.text(-100, 60, 'Anim: idle', {
            ...textStyle,
            color: '#ff00ff'
        });

        // Add all elements to the container
        this.statsContainer.add([
            this.backgroundRect,
            this.healthText,
            this.damageText,
            this.livesText,
            this.positionText,
            this.velocityText,
            this.animationText
        ]);

        this.updatePosition();
    }

    public updateStats(stats: PlayerStats): void {
        if (!this.healthText || !this.damageText || !this.livesText || !this.positionText || !this.velocityText || !this.animationText) return;

        // Update text content
        this.healthText.setText(`HP: ${stats.health}`);
        this.damageText.setText(`DMG: ${stats.damagePercentage}%`);
        this.livesText.setText(`Lives: ${stats.lives}`);
        
        // Update position if provided
        if (stats.position) {
            this.positionText.setText(`Pos: ${Math.round(stats.position.x)}, ${Math.round(stats.position.y)}`);
        }
        
        // Update velocity if provided
        if (stats.velocity) {
            this.velocityText.setText(`Vel: ${Math.round(stats.velocity.x)}, ${Math.round(stats.velocity.y)}`);
        }
        
        // Update animation if provided
        if (stats.animation) {
            this.animationText.setText(`Anim: ${stats.animation}`);
        }

        // Update health text color based on health value
        if (stats.health > 70) {
            this.healthText.setColor('#00ff00'); // Green
        } else if (stats.health > 30) {
            this.healthText.setColor('#ffff00'); // Yellow
        } else {
            this.healthText.setColor('#ff0000'); // Red
        }

        // Update damage text color based on damage percentage
        if (stats.damagePercentage < 50) {
            this.damageText.setColor('#00ff00'); // Green
        } else if (stats.damagePercentage < 100) {
            this.damageText.setColor('#ffff00'); // Yellow
        } else {
            this.damageText.setColor('#ff0000'); // Red
        }

        console.log(`[PLAYER STATS UI] Updated stats - HP: ${stats.health}, DMG: ${stats.damagePercentage}%, Lives: ${stats.lives}, Pos: ${stats.position?.x || 0},${stats.position?.y || 0}, Vel: ${stats.velocity?.x || 0},${stats.velocity?.y || 0}, Anim: ${stats.animation || 'unknown'}`);
    }

    public update(): void {
        this.updatePosition();
    }

    private updatePosition(): void {
        if (!this.playerSprite || !this.statsContainer) return;

        // Position the stats above the player
        const offsetY = -130; // Distance above the player (increased for larger UI)
        this.statsContainer.setPosition(
            this.playerSprite.x,
            this.playerSprite.y + offsetY
        );
    }

    public setVisible(visible: boolean): void {
        if (this.statsContainer) {
            this.statsContainer.setVisible(visible);
        }
    }

    public destroy(): void {
        if (this.statsContainer) {
            this.statsContainer.destroy();
            this.statsContainer = null;
        }
    }
}
