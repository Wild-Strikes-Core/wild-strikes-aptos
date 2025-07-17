export class ArenaInput {
    private scene: Phaser.Scene;
    private KEYS: any;
    private attackCallback: () => void;
    private contextMenuHandler: (e: Event) => void;
    private lastAttackTime: number = 0;
    private attackCooldown: number = 150; // Faster for spam attacks: 150ms for rapid fire
    private consecutiveAttacks: number = 0; // Track consecutive attacks for balanced spam
    private lastAttackResetTime: number = 0; // Time when consecutive attacks reset

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
        
        // Reset consecutive attack counter if enough time has passed
        if (now - this.lastAttackResetTime > 2000) { // 2 second reset window for spam
            this.consecutiveAttacks = 0;
        }
        
        // Allow spam attacks but with slight delay increases for balance
        let currentCooldown = this.attackCooldown;
        if (this.consecutiveAttacks >= 5) {
            // After 5 spam attacks, add minimal 25ms extra delay
            currentCooldown = this.attackCooldown + 25;
        } else if (this.consecutiveAttacks >= 10) {
            // After 10 spam attacks, add 50ms extra delay
            currentCooldown = this.attackCooldown + 50;
        }
        
        return now - this.lastAttackTime >= currentCooldown;
    }

    public markAttack(): void {
        const now = this.scene.time.now;
        this.lastAttackTime = now;
        
        // Increment consecutive attacks if this attack is within the spam window
        if (now - this.lastAttackResetTime < 2000) {
            this.consecutiveAttacks++;
        } else {
            this.consecutiveAttacks = 1; // Reset to 1 for this attack
        }
        
        this.lastAttackResetTime = now;
        
        console.log(`Spam attack ${this.consecutiveAttacks}: cooldown=${this.attackCooldown + (this.consecutiveAttacks >= 5 ? 25 : 0)}ms`);
    }

    public getKeys(): any {
        return this.KEYS;
    }

    public getAttackCooldownProgress(): number {
        // Returns a value between 0 and 1 representing cooldown progress
        const now = this.scene.time.now;
        const timeSinceAttack = now - this.lastAttackTime;
        
        let currentCooldown = this.attackCooldown;
        if (this.consecutiveAttacks >= 5) {
            currentCooldown = this.attackCooldown + 25;
        } else if (this.consecutiveAttacks >= 10) {
            currentCooldown = this.attackCooldown + 50;
        }
        
        return Math.min(1, timeSinceAttack / currentCooldown);
    }

    public getConsecutiveAttacks(): number {
        return this.consecutiveAttacks;
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
