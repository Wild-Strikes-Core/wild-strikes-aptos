import { PlayerSpriteManager } from "./PlayerSpriteManager";
import { 
    PlayerState, 
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

export class PlayerManager {
    // State management
    private currentState: PlayerState;
    private states: Map<string, PlayerState> = new Map();

    // Command pattern
    private jumpCommand: Command;
    private dashCommand: Command;
    private lightAttackCommand: Command;
    private heavyAttackCommand: Command;

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
        
        // Set initial state to idle
        this.currentState = this.states.get('idle')!;
        
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
        this.states.set('idle', new IdleState(this));
        this.states.set('walking', new WalkingState(this));
        this.states.set('crouching', new CrouchingState(this));
        this.states.set('crouchWalking', new CrouchWalkingState(this));
        this.states.set('jumping', new JumpingState(this));
        this.states.set('dashing', new DashingState(this));
        this.states.set('attackingLight', new AttackingLightState(this));
        this.states.set('attackingHeavy', new AttackingHeavyState(this));
    }

    private initializeCommands(): void {
        this.jumpCommand = new JumpCommand();
        this.dashCommand = new DashCommand();
        this.lightAttackCommand = new LightAttackCommand();
        this.heavyAttackCommand = new HeavyAttackCommand();
    }

    public createPlayer(x: number, y: number): Phaser.Physics.Arcade.Sprite {
        // Use SpriteManager to create the player sprite
        this.player = this.spriteManager.createPlayerSprite(x, y);
        
        // Set depth for proper rendering order
        this.player.setDepth(1);
        
        // Set up collision with platform
        this.setupCollisions();
        
        // Enter initial state
        this.currentState.enter();

        return this.player;
    }

    // State transition method
    public transitionTo(stateName: string): void {
        const newState = this.states.get(stateName);
        if (!newState) {
            console.warn(`State '${stateName}' not found`);
            return;
        }

        if (this.currentState) {
            this.currentState.exit();
        }

        console.log(`Transitioning from ${this.currentState.constructor.name} to ${newState.constructor.name}`);
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

    private setupInputHandlers(): void {
        // Set up keyboard event listeners for special actions using commands
        this.scene.input.keyboard?.on('keydown-SPACE', () => {
            this.jumpCommand.execute(this);
        }, this);
        
        this.scene.input.keyboard?.on('keydown-Q', () => {
            this.dashCommand.execute(this);
        }, this);

        // Set up mouse event listeners for attacks using commands
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                this.lightAttackCommand.execute(this);
            } else if (pointer.rightButtonDown()) {
                this.heavyAttackCommand.execute(this);
            }
        });
        
        // Prevent context menu on right click
        this.scene.input.mouse?.disableContextMenu();
    }

    public update(): void {
        if (!this.player) return;
        
        // Delegate to current state
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
                // Reset jump count when player lands on platform
                const jumpingState = this.states.get('jumping') as JumpingState;
                if (jumpingState) {
                    jumpingState.setJumpCount(0);
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
        // Clear input handlers
        this.scene.input.keyboard?.removeAllListeners();
        this.scene.input.off('pointerdown');
        
        // Clear sprite manager
        this.spriteManager.destroySprite(this.player);
    }

    // For multiplayer support (soon):

}