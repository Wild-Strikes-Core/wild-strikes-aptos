import { PlayerSpriteManager } from "./PlayerSpriteManager";
import { PlayerStatsUI } from "../../systems/ui/PlayerStatsUI";
import { 
    PlayerState,
    PlayerStates,
    IdleState, 
    SprintingState, 
    CrouchingState,
    CrouchWalkingState,
    JumpingState, 
    DashingState, 
    AttackingLightState, 
    AttackingHeavyState 
} from "./states";

interface InputCommand {
    sequenceNumber: number;
    timestamp: number;
    inputs: {
        left: boolean;
        right: boolean;
        jump: boolean;
        crouch: boolean;
        dash: boolean;
        lightAttack: boolean;
        heavyAttack: boolean;
    };
}

interface ServerUpdate {
    sequenceNumber: number;
    timestamp: number;
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    state: PlayerStates;
}

export class PlayerManager {
    private spriteManager: PlayerSpriteManager;
    private statsUI: PlayerStatsUI | null = null;
    private states: Map<PlayerStates, PlayerState> = new Map();
    private currentState: PlayerState | null = null;
    private scene: Phaser.Scene;

    private player: Phaser.Physics.Arcade.Sprite | null = null;

    private keyObjects: { [key: string]: Phaser.Input.Keyboard.Key } = {};
    private enabledInput: boolean = true;
    
    // Mouse button states
    private mouseButtons: { left: boolean; right: boolean } = { left: false, right: false };
    private mouseButtonsJustPressed: { left: boolean; right: boolean } = { left: false, right: false };
    
    // Key just pressed tracking for jump
    private jumpJustPressed: boolean = false;

    private roomId: string;
    private playerId: string;

    // Client prediction properties
    private sequenceNumber: number = 0;
    private inputHistory: InputCommand[] = [];
    private lastServerUpdate: ServerUpdate | null = null;
    private serverReconciliation: boolean = true;
    private inputBuffer: InputCommand[] = [];

    private networkManager?: any; // Will be injected by ArenaScene

    // Add rate limiting properties
    private lastInputSent: number = 0;
    private readonly INPUT_RATE_LIMIT = 16; // ~60fps max

    // UI update throttling
    private lastUIUpdate: number = 0;
    private readonly UI_UPDATE_RATE = 100; // Update UI every 100ms for performance

    constructor(scene: Phaser.Scene, isInputEnabled: boolean = true, roomId: string, playerId: string = '') {
        this.scene = scene;
        this.enabledInput = isInputEnabled;
        this.roomId = roomId;
        this.playerId = playerId; // ✅ Set playerId from constructor
        this.spriteManager = new PlayerSpriteManager(this.scene);
        this.initializeStates();

        this.currentState = this.states.get(PlayerStates.Idle)!;

        if (this.enabledInput) {
            this.keyObjects = scene.input.keyboard.addKeys({
                left: 'A',
                right: 'D',
                up: 'W',
                jump: 'SPACE',
                dash: 'Q',
                crouch: 'CTRL'
            }) as { [key: string]: Phaser.Input.Keyboard.Key };
            
            // Prevent browser shortcuts for game keys
            scene.input.keyboard.on('keydown', (event: KeyboardEvent) => {
                // Prevent Ctrl+D (bookmark), Ctrl+W (close tab), Ctrl+Space (spotlight), etc.
                if (event.ctrlKey && ['KeyD', 'KeyW', 'KeyA', 'KeyS', 'KeyQ', 'Space'].includes(event.code)) {
                    event.preventDefault();
                }
                // Prevent F5 refresh during gameplay
                if (event.code === 'F5') {
                    event.preventDefault();
                }
                
                // Track jump just pressed
                if (event.code === 'Space' && !event.repeat) {
                    this.jumpJustPressed = true;
                }
            });
            
            scene.input.keyboard.on('keyup', (event: KeyboardEvent) => {
                // Reset jump just pressed on key release
                if (event.code === 'Space') {
                    this.jumpJustPressed = false;
                }
            });
            
            // Disable right-click context menu
            scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
                if (pointer.button === 2) { // Right mouse button
                    pointer.event.preventDefault();
                }
            });
            
            // Also disable context menu at the DOM level
            const canvas = scene.game.canvas;
            if (canvas) {
                canvas.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    return false;
                });
                
                // Also prevent on the parent container
                canvas.parentElement?.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    return false;
                });
            }
            
            // Set up mouse button event listeners
            this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.button === 0) { // Left mouse button
                    this.mouseButtons.left = true;
                    this.mouseButtonsJustPressed.left = true;
                }
                if (pointer.button === 2) { // Right mouse button
                    this.mouseButtons.right = true;
                    this.mouseButtonsJustPressed.right = true;
                    // Prevent context menu
                    pointer.event.preventDefault();
                }
            });
            
            this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
                if (pointer.button === 0) { // Left mouse button
                    this.mouseButtons.left = false;
                }
                if (pointer.button === 2) { // Right mouse button
                    this.mouseButtons.right = false;
                }
            });
            
            // ✅ ADD: Listen for server updates
            this.setupServerEventListeners();
        }
    }

    private setupServerEventListeners(): void {
        if (!this.networkManager) {
            // Set up listeners when networkManager is available
            setTimeout(() => this.setupServerEventListeners(), 100);
            return;
        }
    }

    public setNetworkManager(networkManager: any): void {
        this.networkManager = networkManager;
        if (this.enabledInput) {
            this.setupServerEventListeners();
        }
    }

   
    public createPlayer(x: number, y: number): Phaser.Physics.Arcade.Sprite {
        this.player = this.spriteManager.createPlayerSprite(x, y);
        this.player.setDepth(1); // Ensure player is rendered above other entities
        if (this.enabledInput) {
            this.player.setTint(0x00fffff);
            // Create stats UI for local player only
            this.statsUI = new PlayerStatsUI(this.scene, this.player);
        } else {
            this.player.clearTint();
        }
        this.setupCollisions();
        this.currentState?.enter();
        return this.player;
    }

    private setupCollisions(): void {
        const platform = (this.scene as any).platform; // Assuming platforms is defined in the scene
        this.scene.physics.add.collider(this.player, platform, () => {
            if (this.currentState instanceof JumpingState) {
                this.currentState.onLand();
            }
        });
    }

    public update(): void {
        if (!this.player) return;
        
        if (this.enabledInput) {
            this.captureAndProcessInput();
        }
        
        this.currentState?.update();
        
        // Update stats UI position and real-time data (throttled for performance)
        const now = Date.now();
        if (this.statsUI && this.player && (now - this.lastUIUpdate >= this.UI_UPDATE_RATE)) {
            this.lastUIUpdate = now;
            this.statsUI.update();
            
            // Update real-time position, velocity, and animation with stored server stats
            const currentAnimation = this.player.anims?.currentAnim?.key || 'idle';
            this.statsUI.updateStats({
                ...this.serverStats, // Use server-provided health, damage, lives
                position: { 
                    x: this.player.x, 
                    y: this.player.y 
                },
                velocity: { 
                    x: this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.x : 0,
                    y: this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.y : 0
                },
                animation: currentAnimation
            });
        } else if (this.statsUI) {
            // Always update position for smooth following
            this.statsUI.update();
        }
    }

    // filepath: /home/j3yz/Documents/GitHub/wild-strikes-aptos/packages/phaser-games/wildstrikes/src/scenes/arena/arenas/pvp/entities/player/PlayerManager.ts
    private captureAndProcessInput(): void {
        const now = Date.now();
        
        // Still rate limit sending to server but not local processing
        const shouldSendToServer = now - this.lastInputSent >= this.INPUT_RATE_LIMIT;
        if (shouldSendToServer) {
            this.lastInputSent = now;
        }

        // Capture ALL inputs regardless of attacks
        const inputCommand: InputCommand = {
            sequenceNumber: shouldSendToServer ? ++this.sequenceNumber : this.sequenceNumber,
            timestamp: now,
            inputs: {
                left: this.keyObjects.left?.isDown || false,
                right: this.keyObjects.right?.isDown || false,
                jump: this.jumpJustPressed, // Use "just pressed" for jump
                crouch: this.keyObjects.crouch?.isDown || false,
                dash: this.keyObjects.dash?.isDown || false,
                lightAttack: this.mouseButtonsJustPressed.left, // Use "just pressed" for attacks
                heavyAttack: this.mouseButtonsJustPressed.right // Use "just pressed" for attacks
            }
        };
        
        // Debug logging for attacks
        if (this.mouseButtonsJustPressed.left || this.mouseButtonsJustPressed.right) {
            console.log('Attack input detected:', { light: this.mouseButtonsJustPressed.left, heavy: this.mouseButtonsJustPressed.right });
        }
        
        // Debug logging for jump
        if (this.jumpJustPressed) {
            console.log('Jump input detected');
        }
        
        // Reset "just pressed" flags after capturing input
        this.mouseButtonsJustPressed.left = false;
        this.mouseButtonsJustPressed.right = false;
        this.jumpJustPressed = false;
        
        this.inputHistory.push(inputCommand);
        
        if (this.inputHistory.length > 60) { // 1 second at 60fps
            this.inputHistory.shift();
        }
        
        // Apply input locally for client-side prediction
        if (this.currentState && 'handleInput' in this.currentState) {
            (this.currentState as any).handleInput(inputCommand.inputs);
        }
        
        if (shouldSendToServer && this.networkManager) {
            this.inputBuffer.push(inputCommand);
        }
    }

    public transitionTo(stateName: PlayerStates): void {
        const newState = this.states.get(stateName);
        if (newState && newState !== this.currentState) {
            this.currentState?.exit();
            this.currentState = newState;
            this.currentState.enter();
        }
    }

    private initializeStates(): void {
        this.states.set(PlayerStates.Idle, new IdleState(this));
        this.states.set(PlayerStates.Sprinting, new SprintingState(this));
        this.states.set(PlayerStates.Crouching, new CrouchingState(this));
        this.states.set(PlayerStates.CrouchWalking, new CrouchWalkingState(this));
        this.states.set(PlayerStates.Jumping, new JumpingState(this));
        this.states.set(PlayerStates.Dashing, new DashingState(this));
        this.states.set(PlayerStates.AttackingLight, new AttackingLightState(this));
        this.states.set(PlayerStates.AttackingHeavy, new AttackingHeavyState(this));
    }
    
    // state utilities
    public getPlayerSprite(): Phaser.Physics.Arcade.Sprite | null { return this.player; }
    public getScene(): Phaser.Scene { return this.scene; }
    public getSpriteManager(): PlayerSpriteManager { return this.spriteManager; }
    public getKeyObjects(): any { return this.keyObjects; }
    public isInputEnabled(): boolean { return this.enabledInput; }
    public getCurrentState(): PlayerState | null { return this.currentState; }

    // Update player stats (for local player only)
    private serverStats = { health: 100, damagePercentage: 0, lives: 3 };
    
    public updatePlayerStats(stats: { health: number; damagePercentage: number; lives: number }): void {
        // Store server stats
        this.serverStats = { ...stats };
        
        if (this.statsUI && this.player) {
            // Combine server stats with real-time data
            const currentAnimation = this.player.anims?.currentAnim?.key || 'unknown';
            this.statsUI.updateStats({
                ...this.serverStats,
                position: { 
                    x: this.player.x, 
                    y: this.player.y 
                },
                velocity: { 
                    x: this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.x : 0,
                    y: this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.y : 0
                },
                animation: currentAnimation
            });
        }
    }

    // Clean up resources
    public destroy(): void {
        if (this.statsUI) {
            this.statsUI.destroy();
            this.statsUI = null;
        }
    }

}