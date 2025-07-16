export class ArenaInput {
    private scene: Phaser.Scene;
    private KEYS: any;
    private attackCallback: () => void;
    private contextMenuHandler: (e: Event) => void;
    private lastAttackTime: number = 0;
    private attackCooldown: number = 300; // 300ms cooldown between attacks

    constructor(scene: Phaser.Scene, attackCallback: () => void) {
        this.scene = scene;
        this.attackCallback = attackCallback;
        this.contextMenuHandler = (e: Event) => {
            e.preventDefault();
        };
    }

    public setupControls(): void {
        this.KEYS = this.scene.input.keyboard?.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.SPACE,  // Space for jump
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,  // Shift for running
            attack: Phaser.Input.Keyboard.KeyCodes.X,  // X key for attack
        });

        // Setup mouse/pointer input for attacks (no cooldown here - handled in performAttack)
        this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            this.attackCallback();
        });

        // Prevent context menu on right click
        this.scene.game.canvas.addEventListener('contextmenu', this.contextMenuHandler);
    }

    public isKeyPressed(key: string): boolean {
        return this.KEYS[key]?.isDown || false;
    }

    public isKeyJustPressed(key: string): boolean {
        return Phaser.Input.Keyboard.JustDown(this.KEYS[key]);
    }

    public canAttack(): boolean {
        const now = this.scene.time.now;
        return now - this.lastAttackTime >= this.attackCooldown;
    }

    public markAttack(): void {
        this.lastAttackTime = this.scene.time.now;
    }

    public getKeys(): any {
        return this.KEYS;
    }

    public destroy(): void {
        // Clean up input listeners
        this.scene.input.off("pointerdown");
        
        // Remove context menu event listener
        if (this.scene.game.canvas) {
            this.scene.game.canvas.removeEventListener('contextmenu', this.contextMenuHandler);
        }
    }
}
