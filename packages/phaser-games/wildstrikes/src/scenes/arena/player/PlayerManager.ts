import { PlayerSpriteManager } from "./PlayerSpriteManager";
import { 
    PlayerState,
    PlayerStates,
    IdleState, 
    WalkingState, 
    CrouchingState,
    CrouchWalkingState,
    JumpingState, 
    DashingState, 
    AttackingLightState, 
    AttackingHeavyState 
} from "./states";
import { 
    Command,
    JumpCommand,
    DashCommand,
    LightAttackCommand,
    HeavyAttackCommand
} from "./commands";
import { InputService } from "./input";
import { battleSocketClient } from "@phaser-games/wildstrikes/src/shared-utils/BattleSocketClient";

export class PlayerManager {
    // State management
    private currentState: PlayerState;
    private states: Map<string, PlayerState> = new Map();

    // Command pattern
    private jumpCommand: Command;
    private dashCommand: Command;
    private lightAttackCommand: Command;
    private heavyAttackCommand: Command;

    // Input handling
    private inputService: InputService;

    private player: Phaser.Physics.Arcade.Sprite | null = null;
    private spriteManager: PlayerSpriteManager;

    private keyObjects: { [key: string]: Phaser.Input.Keyboard.Key } = {};
    private enableInput: boolean;

    constructor(private scene: Phaser.Scene, enableInput: boolean = true) {
        this.scene = scene;
        this.enableInput = enableInput;
        this.spriteManager = new PlayerSpriteManager(scene);
        
        // Initialize states
        this.initializeStates();
        
        // Initialize commands
        this.initializeCommands();
        
        // Initialize input service
        this.inputService = new InputService(scene);
        this.inputService.setCommandTarget(this);
        this.inputService.setEnabled(enableInput);
        
        // Set initial state to idle
        this.currentState = this.states.get(PlayerStates.Idle)!;;
        
        // Only set up input controls if input is enabled
        if (this.enableInput) {
            this.keyObjects = scene.input.keyboard.addKeys({
                left: 'A',
                right: 'D',
                up: 'W',
                jump: 'SPACE',
                dash: 'Q',
                sprint: 'SHIFT',
                crouch: 'CTRL'
            }) as { [key: string]: Phaser.Input.Keyboard.Key };
            this.setupInputHandlers();
            
        }
    }

    private initializeStates(): void {
        this.states.set(PlayerStates.Idle, new IdleState(this));
        this.states.set(PlayerStates.Walking, new WalkingState(this));
        this.states.set(PlayerStates.Crouching, new CrouchingState(this));
        this.states.set(PlayerStates.CrouchWalking, new CrouchWalkingState(this));
        this.states.set(PlayerStates.Jumping, new JumpingState(this));
        this.states.set(PlayerStates.Dashing, new DashingState(this));
        this.states.set(PlayerStates.AttackingLight, new AttackingLightState(this));
        this.states.set(PlayerStates.AttackingHeavy, new AttackingHeavyState(this));
    }

    private initializeCommands(): void {
        this.jumpCommand = new JumpCommand();
        this.dashCommand = new DashCommand();
        this.lightAttackCommand = new LightAttackCommand();
        this.heavyAttackCommand = new HeavyAttackCommand();
    }

    public createPlayer(x: number, y: number): Phaser.Physics.Arcade.Sprite {
        console.log(`[DEBUG] PlayerManager.createPlayer called with position (${x}, ${y})`);
        
        try {
            // Use SpriteManager to create the player sprite
            console.log(`[DEBUG] Creating player sprite via SpriteManager`);
            this.player = this.spriteManager.createPlayerSprite(x, y);
            
            if (!this.player) {
                console.error(`[DEBUG] SpriteManager.createPlayerSprite returned null`);
                return null;
            }
            
            console.log(`[DEBUG] Player sprite created successfully:`, this.player);
            
            // Set depth for proper rendering order
            this.player.setDepth(1);
            console.log(`[DEBUG] Set player depth to 1`);
            
            // Add visual differentiation for local vs remote players
            if (this.enableInput) {
                // Local player gets a blue tint
                this.player.setTint(0x00ffff);
                console.log(`[DEBUG] Applied blue tint to local player`);
            } else {
                // Remote player gets a red tint
                this.player.setTint(0xff0000);
                console.log(`[DEBUG] Applied red tint to remote player`);
            }
            
            // Set up collision with platform
            console.log(`[DEBUG] Setting up collisions`);
            this.setupCollisions();
            
            // Enter initial state
            console.log(`[DEBUG] Entering initial state`);
            this.currentState.enter();
            
            console.log(`[DEBUG] PlayerManager.createPlayer completed successfully`);
            return this.player;
        } catch (error) {
            console.error(`[DEBUG] Error in PlayerManager.createPlayer:`, error);
            console.error(`[DEBUG] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
            return null;
        }
    }

    // State transition method
    public transitionTo(stateName: string): void {
        const newState = this.states.get(stateName);
        if (!newState) {
            console.warn(`State '${stateName}' not found`);
            return;
        }

        // Emit state change for network synchronization
        if (this.enableInput && this.player) {
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            battleSocketClient.emit("player-state-update", {
                playerId: battleSocketClient.getId(),
                state: stateName,
                position: { x: this.player.x, y: this.player.y },
                velocity: { x: body.velocity.x, y: body.velocity.y },
                facing: this.player.flipX ? 'left' : 'right',
                timestamp: Date.now()
            });
        }

        this.currentState.exit();
        this.currentState = newState;
        this.currentState.enter();
    }

    // Helper methods for states to access private properties
    public getScene(): Phaser.Scene {
        return this.scene;
    }

    public getSpriteManager(): PlayerSpriteManager {
        return this.spriteManager;
    }

    public getKeyObjects(): { [key: string]: Phaser.Input.Keyboard.Key } {
        return this.keyObjects;
    }

    public isInputEnabled(): boolean {
        return this.enableInput;
    }

    // Input service access methods
    public getInputService(): InputService {
        return this.inputService;
    }

    public setInputEnabled(enabled: boolean): void {
        this.enableInput = enabled;
        this.inputService.setEnabled(enabled);
    }

    private setupInputHandlers(): void {
        // Set up keyboard bindings using InputService
        this.inputService.bindKeyboard('SPACE', this.jumpCommand, 'Jump/Double Jump');
        this.inputService.bindKeyboard('Q', this.dashCommand, 'Dash');

        // Set up mouse bindings using InputService
        this.inputService.bindMouse({
            leftClick: { 
                command: this.lightAttackCommand, 
                description: 'Light Attack' 
            },
            rightClick: { 
                command: this.heavyAttackCommand, 
                description: 'Heavy Attack' 
            }
        });

        // Note: Client prediction is now passive and doesn't interfere with normal input
    }

    // Client prediction is now passive and doesn't interfere with normal input handling
    // It only tracks the current state for reconciliation purposes

    public update(deltaTime?: number): void {
        if (!this.player) return;
        
        // Delegate to current state first (let normal physics handle movement)
        this.currentState.update();
        this.currentState.handleInput();
        
    }

    private setupCollisions(): void {
        if (!this.player) return;
        
        // Get platform from scene (set by MapManager)
        const platform = (this.scene as any).platform;
        
        if (platform) {
            // Set up collision between player and platform
            this.scene.physics.add.collider(this.player, platform, () => {
                // Let the current state handle landing logic
                if (this.currentState instanceof JumpingState) {
                    this.currentState.onLand();
                }
                console.log('Player landed on platform');
            });
            
            console.log('Player-platform collision set up successfully');
        } else {
            console.warn('Platform not found on scene for collision setup');
        }
    }

    public getPlayer(): Phaser.Physics.Arcade.Sprite | null {
        return this.player;
    }

    // Updated getter methods for state access
    public getIsAttacking(): boolean {
        return this.currentState instanceof AttackingLightState || 
               this.currentState instanceof AttackingHeavyState;
    }

    public getIsAttackingLight(): boolean {
        return this.currentState instanceof AttackingLightState;
    }

    public getIsAttackingHeavy(): boolean {
        return this.currentState instanceof AttackingHeavyState;
    }

    public getIsMoving(): boolean {
        return this.currentState instanceof WalkingState || 
               this.currentState instanceof CrouchWalkingState;
    }

    public getIsOnGround(): boolean {
        if (!this.player) return false;
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        return body.touching.down;
    }

    public getIsDashing(): boolean {
        return this.currentState instanceof DashingState;
    }

    public getIsCrouching(): boolean {
        return this.currentState instanceof CrouchingState || 
               this.currentState instanceof CrouchWalkingState;
    }

    public getPlayerSprite(): Phaser.Physics.Arcade.Sprite | null {
        return this.player;
    }

    // Get current state (useful for debugging)
    public getCurrentState(): PlayerState {
        return this.currentState;
    }

    // Get a specific state by name (useful for commands)
    public getState(stateName: string): PlayerState | undefined {
        return this.states.get(stateName);
    }

    // Command access methods (useful for external systems like AI or input remapping)
    public getJumpCommand(): Command {
        return this.jumpCommand;
    }

    public getDashCommand(): Command {
        return this.dashCommand;
    }

    public getLightAttackCommand(): Command {
        return this.lightAttackCommand;
    }

    public getHeavyAttackCommand(): Command {
        return this.heavyAttackCommand;
    }

    // Execute command directly (useful for AI or replay systems)
    public executeCommand(command: Command): void {
        command.execute(this);
    }

    public destroy(): void {
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
        
        // Clean up input service
        this.inputService.destroy();
        
        
        // Clear sprite manager
        this.spriteManager.destroySprite(this.player);
    }

    public getPlayerPosition(): { x: number, y: number } {
        if (!this.player) return { x: 0, y: 0 };
        return { x: this.player.x, y: this.player.y };
    }


}