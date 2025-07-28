import { PlayerManager } from "../PlayerManager";

export abstract class PlayerState {
    protected playerManager: PlayerManager;

    constructor(playerManager: PlayerManager) {
        this.playerManager = playerManager;
    }

    abstract enter(): void;
    abstract update(): void;
    abstract handleInput(): void;
    abstract exit(): void;

    // Helper method to get the player sprite
    protected getPlayer(): Phaser.Physics.Arcade.Sprite | null {
        return this.playerManager.getPlayerSprite();
    }

    // Helper method to get the scene
    protected getScene(): Phaser.Scene {
        return this.playerManager.getScene();
    }

    // Helper method to get sprite manager
    protected getSpriteManager() {
        return this.playerManager.getSpriteManager();
    }

    // Helper method to get key objects
    protected getKeyObjects() {
        return this.playerManager.getKeyObjects();
    }

    // Helper method to check if input is enabled
    protected isInputEnabled(): boolean {
        return this.playerManager.isInputEnabled();
    }
}
