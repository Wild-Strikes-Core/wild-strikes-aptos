import { SceneManager } from "../controllers/SceneManager";

export default class Arena extends Phaser.Scene {

    // Main player sprite reference
    private player!: Phaser.Physics.Arcade.Sprite;


    constructor() {
        super({ key: "Arena" });
    }

    create(): void {
        const bg = this.add.image(0, 0, 'Philippines');
        bg.setOrigin(0, 0);
        bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        bg.setDepth(-1000);
        
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
