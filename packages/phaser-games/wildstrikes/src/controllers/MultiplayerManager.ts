import { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@shared/socket-events";
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

    // Cache input objects to avoid recreating every frame
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private attackKey: Phaser.Input.Keyboard.Key;

    private inputSeq: number = 0;

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

        // Initialize input references once
        this.cursors = this.scene.input.keyboard!.createCursorKeys();
        this.attackKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
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
        // Send compact input packets every interval
        if (time - this.lastPositionUpdate > this.positionUpdateInterval) {
            this.sendInputPacket();
            this.lastPositionUpdate = time;
        }
    }

    /**
     * Send position update to server
     */
    private sendInputPacket(): void {
        if (!this.myPlayer || !this.socket) return;

        // Determine directional input (-1,0,1)
        let dirX: -1 | 0 | 1 = 0;
        if (this.cursors.left!.isDown) dirX = -1;
        else if (this.cursors.right!.isDown) dirX = 1;

        const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up!);
        const run = this.cursors.shift!.isDown;

        // Attack key uses cached reference
        const attack = Phaser.Input.Keyboard.JustDown(this.attackKey);

        this.socket.emit(SOCKET_EVENTS.PLAYER_INPUT, {
            seq: this.inputSeq++,
            dirX,
            jump,
            run,
            attack,
        });

    }

    /**
     * Clean up resources
     */
    cleanup(): void {
        // Clean up any multiplayer-specific resources
    }
}
