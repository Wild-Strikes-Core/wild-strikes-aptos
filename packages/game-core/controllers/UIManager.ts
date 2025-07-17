/**
 * UIManager - Manages UI elements and their interactions
 */
export class UIManager {
    private scene: Phaser.Scene;
    private uiElements: Phaser.GameObjects.GameObject[] = [];
    
    // UI element references
    private p1infoContainer: Phaser.GameObjects.Image;
    private p2infoContainer: Phaser.GameObjects.Image;
    private player1Name: Phaser.GameObjects.Text;
    private player2Name: Phaser.GameObjects.Text;
    private uiTimer: Phaser.GameObjects.Sprite;
    private matchTimerText: Phaser.GameObjects.Text;
    private uiSkillContainer: Phaser.GameObjects.Image;
    private uiSkillONE: Phaser.GameObjects.Image;
    private uiSkillTWO: Phaser.GameObjects.Image;
    private uiSkillTHREE: Phaser.GameObjects.Image;

    constructor(
        scene: Phaser.Scene,
        elements: {
            p1infoContainer: Phaser.GameObjects.Image;
            p2infoContainer: Phaser.GameObjects.Image;
            player1Name: Phaser.GameObjects.Text;
            player2Name: Phaser.GameObjects.Text;
            uiTimer: Phaser.GameObjects.Sprite;
            matchTimerText: Phaser.GameObjects.Text;
            uiSkillContainer: Phaser.GameObjects.Image;
            uiSkillONE: Phaser.GameObjects.Image;
            uiSkillTWO: Phaser.GameObjects.Image;
            uiSkillTHREE: Phaser.GameObjects.Image;
        }
    ) {
        this.scene = scene;
        this.p1infoContainer = elements.p1infoContainer;
        this.p2infoContainer = elements.p2infoContainer;
        this.player1Name = elements.player1Name;
        this.player2Name = elements.player2Name;
        this.uiTimer = elements.uiTimer;
        this.matchTimerText = elements.matchTimerText;
        this.uiSkillContainer = elements.uiSkillContainer;
        this.uiSkillONE = elements.uiSkillONE;
        this.uiSkillTWO = elements.uiSkillTWO;
        this.uiSkillTHREE = elements.uiSkillTHREE;

        // Store all UI elements
        this.uiElements = [
            this.p1infoContainer,
            this.p2infoContainer,
            this.player1Name,
            this.player2Name,
            this.uiTimer,
            this.matchTimerText,
            this.uiSkillContainer,
            this.uiSkillONE,
            this.uiSkillTWO,
            this.uiSkillTHREE
        ];

        // Set scroll factor to 0 for all UI elements so they don't move with camera
        this.uiElements.forEach(element => {
            if (element && 'setScrollFactor' in element) {
                (element as any).setScrollFactor(0);
            }
        });
    }

    /**
     * Get all UI elements
     */
    getUIElements(): Phaser.GameObjects.GameObject[] {
        return this.uiElements;
    }

    /**
     * Update player names
     */
    updatePlayerNames(player1Name: string, player2Name: string): void {
        if (this.player1Name) {
            this.player1Name.setText(player1Name);
        }
        if (this.player2Name) {
            this.player2Name.setText(player2Name);
        }
    }

    /**
     * Update timer display
     */
    updateTimer(timeText: string): void {
        if (this.matchTimerText) {
            this.matchTimerText.setText(timeText);
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        // UI elements will be cleaned up by the scene
        this.uiElements = [];
    }
}
