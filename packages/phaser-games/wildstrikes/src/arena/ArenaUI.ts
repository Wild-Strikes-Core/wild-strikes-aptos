export class ArenaUI {
    private scene: Phaser.Scene;
    private player1HP!: Phaser.GameObjects.Text;
    private player1STA!: Phaser.GameObjects.Text;
    private p1infoContainer!: Phaser.GameObjects.Image;
    private p2infoContainer!: Phaser.GameObjects.Image;
    private uiTimer!: Phaser.GameObjects.Sprite;
    private matchTimerText!: Phaser.GameObjects.Text;
    private player1Name!: Phaser.GameObjects.Text;
    private player2Name!: Phaser.GameObjects.Text;
    
    // Health bars above player heads
    private player1HealthBar!: Phaser.GameObjects.Graphics;
    private player2HealthBar!: Phaser.GameObjects.Graphics;
    private player1HealthBarBg!: Phaser.GameObjects.Graphics;
    private player2HealthBarBg!: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public createUI(): void {
        this.createPlayerStats();
        this.createTimer();
        this.createPlayerNames();
        this.createHealthBars();
    }

    private createPlayerStats(): void {
        // player1HP
        this.player1HP = this.scene.add.text(678, 708, "(100/100 HP)", {
            fontSize: "24px",
            fontStyle: "bold italic"
        });
        this.player1HP.setDepth(10);

        // player1STA
        this.player1STA = this.scene.add.text(672, 736, "(100/100 STA)", {
            fontSize: "24px",
            fontStyle: "bold italic"
        });
        this.player1STA.setDepth(10);

        // p1infoContainer
        this.p1infoContainer = this.scene.add.image(336, 112, "PlayerStats_Container");
        this.p1infoContainer.scaleX = 1.07;
        this.p1infoContainer.scaleY = 1.07;
        this.p1infoContainer.alpha = 0.8;
        this.p1infoContainer.setDepth(5);

        // p2infoContainer
        this.p2infoContainer = this.scene.add.image(1584, 112, "PlayerStats_Container");
        this.p2infoContainer.scaleX = 1.07;
        this.p2infoContainer.scaleY = 1.07;
        this.p2infoContainer.flipX = true;
        this.p2infoContainer.alpha = 0.8;
        this.p2infoContainer.setDepth(5);
    }

    private createTimer(): void {
        // uiTimer
        this.uiTimer = this.scene.add.sprite(1760, 1008, "Timer_Container_Frames", 0);
        this.uiTimer.scaleX = 0.8191303940245613;
        this.uiTimer.scaleY = 0.8191303940245613;
        this.uiTimer.setDepth(6);
        this.uiTimer.play("matchTimerAnimTimer_Container_Frames");

        // matchTimerText
        this.matchTimerText = this.scene.add.text(1728, 986, "XX:XX", {
            align: "center",
            fontFamily: "Sans-serif",
            fontSize: "42px",
            fontStyle: "bold italic",
            shadow: { stroke: true }
        });
        this.matchTimerText.setDepth(7);
    }

    private createPlayerNames(): void {
        // player1Name
        this.player1Name = this.scene.add.text(200, 123, "Player 1 Name", {
            align: "center",
            color: "#580000ff",
            fontFamily: "Sans-serif",
            fontSize: "42px",
            fontStyle: "bold italic",
            shadow: { stroke: true }
        });
        this.player1Name.scaleX = 0.7156265225589847;
        this.player1Name.scaleY = 0.7156265225589847;
        this.player1Name.setDepth(6);

        // player2Name
        this.player2Name = this.scene.add.text(1513, 123, "Player 2 Name", {
            align: "center",
            color: "#580000ff",
            fontFamily: "Sans-serif",
            fontSize: "42px",
            fontStyle: "bold italic",
            shadow: { stroke: true }
        });
        this.player2Name.scaleX = 0.7156265225589847;
        this.player2Name.scaleY = 0.7156265225589847;
        this.player2Name.setDepth(6);
    }

    private createHealthBars(): void {
        // Create health bars above player heads
        this.player1HealthBarBg = this.scene.add.graphics();
        this.player1HealthBarBg.setDepth(15);
        
        this.player1HealthBar = this.scene.add.graphics();
        this.player1HealthBar.setDepth(16);
        
        this.player2HealthBarBg = this.scene.add.graphics();
        this.player2HealthBarBg.setDepth(15);
        
        this.player2HealthBar = this.scene.add.graphics();
        this.player2HealthBar.setDepth(16);
    }

    public updateTimer(timeText: string): void {
        if (this.matchTimerText) {
            console.log("Updating timer to:", timeText);
            this.matchTimerText.setText(timeText || "XX:XX");
            
            // Make sure timer is visible and has correct depth
            this.matchTimerText.setVisible(true);
            this.matchTimerText.setDepth(10);
        } else {
            console.warn("Match timer text element is not available");
        }
    }

    public updatePlayerNames(player1Name: string, player2Name: string): void {
        if (this.player1Name && player1Name) {
            this.player1Name.setText(player1Name);
        }
        if (this.player2Name && player2Name) {
            this.player2Name.setText(player2Name);
        }
    }

    public updateHealthBar(
        backgroundBar: Phaser.GameObjects.Graphics,
        healthBar: Phaser.GameObjects.Graphics,
        playerSprite: Phaser.Physics.Arcade.Sprite,
        health: number
    ): void {
        if (!playerSprite || !playerSprite.active) return;
        
        const barWidth = 60;
        const barHeight = 8;

        // Calculate character center position
        const bodyOffsetX = playerSprite.body ? playerSprite.body.offset.x : 45;
        const bodyWidth = playerSprite.body ? playerSprite.body.width : 30;
        const characterCenterX = playerSprite.x + (bodyOffsetX + bodyWidth/2) * playerSprite.scaleX;
        const characterTopY = playerSprite.y + 5 * playerSprite.scaleY;
        
        // Position the health bar
        const x = characterCenterX - barWidth / 2;
        const y = characterTopY - barHeight - 5;
        
        // Clear previous graphics
        backgroundBar.clear();
        healthBar.clear();
        
        // Draw background (dark red)
        backgroundBar.fillStyle(0x330000);
        backgroundBar.fillRect(x, y, barWidth, barHeight);
        
        // Draw health bar
        const healthPercent = Math.max(0, health) / 100;
        const healthBarWidth = barWidth * healthPercent;
        
        // Color based on health percentage
        let healthColor = 0x00ff00; // Green
        if (healthPercent < 0.5) {
            healthColor = 0xffff00; // Yellow
        }
        if (healthPercent < 0.25) {
            healthColor = 0xff0000; // Red
        }
        
        healthBar.fillStyle(healthColor);
        healthBar.fillRect(x, y, healthBarWidth, barHeight);
        
        // Add border
        backgroundBar.lineStyle(1, 0xffffff);
        backgroundBar.strokeRect(x, y, barWidth, barHeight);
    }

    public updatePlayerHealthBars(
        myPlayer: Phaser.Physics.Arcade.Sprite | undefined,
        otherPlayer: Phaser.Physics.Arcade.Sprite | undefined,
        gameState: any,
        socketId: string
    ): void {
        // Update player 1 health bar
        if (myPlayer && gameState.player1.id === socketId) {
            this.updateHealthBar(
                this.player1HealthBarBg,
                this.player1HealthBar,
                myPlayer,
                gameState.player1.health
            );
        } else if (otherPlayer && gameState.player1.id !== socketId) {
            this.updateHealthBar(
                this.player1HealthBarBg,
                this.player1HealthBar,
                otherPlayer,
                gameState.player1.health
            );
        }
        
        // Update player 2 health bar
        if (myPlayer && gameState.player2.id === socketId) {
            this.updateHealthBar(
                this.player2HealthBarBg,
                this.player2HealthBar,
                myPlayer,
                gameState.player2.health
            );
        } else if (otherPlayer && gameState.player2.id !== socketId) {
            this.updateHealthBar(
                this.player2HealthBarBg,
                this.player2HealthBar,
                otherPlayer,
                gameState.player2.health
            );
        }
    }

    public ensureUIElementsVisible(): void {
        console.log("Ensuring UI elements are visible and properly layered...");
        
        // Health and stamina displays
        if (this.player1HP) {
            this.player1HP.setVisible(true);
            this.player1HP.setDepth(10);
        }
        if (this.player1STA) {
            this.player1STA.setVisible(true);
            this.player1STA.setDepth(10);
        }
        
        // Player info containers
        if (this.p1infoContainer) {
            this.p1infoContainer.setVisible(true);
            this.p1infoContainer.setDepth(5);
        }
        if (this.p2infoContainer) {
            this.p2infoContainer.setVisible(true);
            this.p2infoContainer.setDepth(5);
        }
        
        // Timer elements
        if (this.uiTimer) {
            this.uiTimer.setVisible(true);
            this.uiTimer.setDepth(6);
        }
        if (this.matchTimerText) {
            this.matchTimerText.setVisible(true);
            this.matchTimerText.setDepth(7);
        }
        
        // Player names
        if (this.player1Name) {
            this.player1Name.setVisible(true);
            this.player1Name.setDepth(6);
        }
        if (this.player2Name) {
            this.player2Name.setVisible(true);
            this.player2Name.setDepth(6);
        }
        
        // Health bars above heads
        if (this.player1HealthBar) this.player1HealthBar.setDepth(16);
        if (this.player2HealthBar) this.player2HealthBar.setDepth(16);
        if (this.player1HealthBarBg) this.player1HealthBarBg.setDepth(15);
        if (this.player2HealthBarBg) this.player2HealthBarBg.setDepth(15);
    }

    public createEntranceAnimation(): void {
        // Hide UI elements initially
        this.p1infoContainer.setAlpha(0);
        this.p2infoContainer.setAlpha(0);
        this.player1Name.setAlpha(0);
        this.player2Name.setAlpha(0);
        this.uiTimer.setAlpha(0);
        this.matchTimerText.setAlpha(0);

        // Create entrance animations
        this.scene.time.delayedCall(300, () => {
            this.scene.tweens.add({
                targets: [this.p1infoContainer, this.p2infoContainer],
                alpha: 0.8,
                duration: 600,
                ease: 'Power2'
            });
        });

        this.scene.time.delayedCall(1800, () => {
            this.scene.tweens.add({
                targets: [this.player1Name, this.player2Name, this.uiTimer, this.matchTimerText],
                alpha: 1,
                duration: 400,
                ease: 'Power2'
            });
        });
    }

    public getAllUIElements(): Phaser.GameObjects.GameObject[] {
        return [
            this.p1infoContainer,
            this.p2infoContainer,
            this.player1Name,
            this.player2Name,
            this.uiTimer,
            this.matchTimerText,
            this.player1HealthBar,
            this.player2HealthBar,
            this.player1HealthBarBg,
            this.player2HealthBarBg,
            this.player1HP,
            this.player1STA
        ].filter(element => element);
    }

    public destroy(): void {
        if (this.player1HP) this.player1HP.destroy();
        if (this.player1STA) this.player1STA.destroy();
        if (this.p1infoContainer) this.p1infoContainer.destroy();
        if (this.p2infoContainer) this.p2infoContainer.destroy();
        if (this.uiTimer) this.uiTimer.destroy();
        if (this.matchTimerText) this.matchTimerText.destroy();
        if (this.player1Name) this.player1Name.destroy();
        if (this.player2Name) this.player2Name.destroy();
        if (this.player1HealthBar) this.player1HealthBar.destroy();
        if (this.player2HealthBar) this.player2HealthBar.destroy();
        if (this.player1HealthBarBg) this.player1HealthBarBg.destroy();
        if (this.player2HealthBarBg) this.player2HealthBarBg.destroy();
    }
}
