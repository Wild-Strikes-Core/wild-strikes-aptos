/**
 * Handles all input processing and mouse/keyboard event management
 */
export class InputManager {
    private scene: Phaser.Scene;
    private keyObjects: { [key: string]: Phaser.Input.Keyboard.Key } = {};
    private mouseButtons: { left: boolean; right: boolean } = { left: false, right: false };
    private mouseButtonsJustPressed: { left: boolean; right: boolean } = { left: false, right: false };
    private jumpJustPressed: boolean = false;
    private enabled: boolean = true;

    constructor(scene: Phaser.Scene, enabled: boolean = true) {
        this.scene = scene;
        this.enabled = enabled;
        
        if (enabled) {
            this.setupInputHandlers();
        }
    }

    private setupInputHandlers(): void {
        this.keyObjects = this.scene.input.keyboard.addKeys({
            left: 'A',
            right: 'D',
            up: 'W',
            jump: 'SPACE',
            dash: 'Q',
            crouch: 'CTRL'
        }) as { [key: string]: Phaser.Input.Keyboard.Key };
        
        // Prevent browser shortcuts for game keys
        this.scene.input.keyboard.on('keydown', (event: KeyboardEvent) => {
            if (event.ctrlKey && ['KeyD', 'KeyW', 'KeyA', 'KeyS', 'KeyQ', 'Space'].includes(event.code)) {
                event.preventDefault();
            }
            if (event.code === 'F5') {
                event.preventDefault();
            }
            
            if (event.code === 'Space' && !event.repeat) {
                this.jumpJustPressed = true;
            }
        });
        
        this.scene.input.keyboard.on('keyup', (event: KeyboardEvent) => {
            if (event.code === 'Space') {
                this.jumpJustPressed = false;
            }
        });
        
        this.setupMouseHandlers();
    }

    private setupMouseHandlers(): void {
        // Disable right-click context menu
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.button === 2) {
                pointer.event.preventDefault();
            }
        });
        
        const canvas = this.scene.game.canvas;
        if (canvas) {
            canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });
            canvas.parentElement?.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });
        }
        
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.button === 0) {
                this.mouseButtons.left = true;
                this.mouseButtonsJustPressed.left = true;
            }
            if (pointer.button === 2) {
                this.mouseButtons.right = true;
                this.mouseButtonsJustPressed.right = true;
                pointer.event.preventDefault();
            }
        });
        
        this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (pointer.button === 0) {
                this.mouseButtons.left = false;
            }
            if (pointer.button === 2) {
                this.mouseButtons.right = false;
            }
        });
    }

    public captureInputs() {
        if (!this.enabled) return null;

        return {
            left: this.keyObjects.left?.isDown || false,
            right: this.keyObjects.right?.isDown || false,
            jump: this.jumpJustPressed,
            crouch: this.keyObjects.crouch?.isDown || false,
            dash: this.keyObjects.dash?.isDown || false,
            lightAttack: this.mouseButtonsJustPressed.left,
            heavyAttack: this.mouseButtonsJustPressed.right
        };
    }

    public resetJustPressedFlags(): void {
        this.mouseButtonsJustPressed.left = false;
        this.mouseButtonsJustPressed.right = false;
        this.jumpJustPressed = false;
    }

    public getKeyObjects() { return this.keyObjects; }
    public isEnabled() { return this.enabled; }
}
