import { Socket } from "socket.io-client";
import { SceneManager } from "./SceneManager";

/**
 * MultiplayerManager - Handles multiplayer functionality
 */
export class MultiplayerManager {
    private scene: Phaser.Scene;
    private socket: Socket;
    private myPlayer: Phaser.Physics.Arcade.Sprite;
    private platform?: Phaser.Physics.Arcade.Image;
    private sceneManager?: SceneManager;
    private positionUpdateInterval: number = 50;
    private lastPositionUpdate: number = 0;

    constructor(
        scene: Phaser.Scene,
        socket: Socket,
        myPlayer: Phaser.Physics.Arcade.Sprite,
        config: {
            positionUpdateInterval?: number;
            platform?: Phaser.Physics.Arcade.Image;
        } = {}
    ) {
        this.scene = scene;
        this.socket = socket;
        this.myPlayer = myPlayer;
        this.platform = config.platform;
        this.positionUpdateInterval = config.positionUpdateInterval || 50;
    }

    /**
     * Set the scene manager reference
     */
    setSceneManager(sceneManager: SceneManager): void {
        this.sceneManager = sceneManager;
    }

    /**
     * Set platform reference
     */
    setPlatform(platform: Phaser.Physics.Arcade.Image): void {
        this.platform = platform;
    }

    /**
     * Update multiplayer state
     */
    update(time: number, delta: number): void {
        // Send position updates
        if (time - this.lastPositionUpdate > this.positionUpdateInterval) {
            this.sendPositionUpdate();
            this.lastPositionUpdate = time;
        }
    }

    /**
     * Send position update to server
     */
    private sendPositionUpdate(): void {
        if (!this.myPlayer || !this.socket) return;

        const currentAnim = this.myPlayer.anims.currentAnim?.key || '_Idle_Idle';
        
        this.socket.emit("playerMoved", {
            x: this.myPlayer.x,
            y: this.myPlayer.y,
            animation: currentAnim,
            flipX: this.myPlayer.flipX,
            velocityX: this.myPlayer.body?.velocity.x,
            velocityY: this.myPlayer.body?.velocity.y,
        });
    }

    /**
     * Clean up resources
     */
    cleanup(): void {
        // Clean up any multiplayer-specific resources
    }
}
