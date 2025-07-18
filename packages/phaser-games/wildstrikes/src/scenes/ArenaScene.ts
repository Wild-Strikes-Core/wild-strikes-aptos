import { SceneManager } from "../controllers/SceneManager";

export default class Arena extends Phaser.Scene {

    // Main player sprite reference
    private player!: Phaser.Physics.Arcade.Sprite;


    constructor() {
        super({ key: "Arena" });
    }

    create(): void {
        

        
    }

    update(time: number, delta: number): void {
        
    }


    /* ------------------------------------------------------------------
     * Scene shutdown cleanup
     * ------------------------------------------------------------------ */
    shutdown(): void {

    }

    destroy(): void {
        this.shutdown();
    }
}
