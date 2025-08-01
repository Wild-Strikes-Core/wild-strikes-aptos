import { PlayerSpriteManager } from "./PlayerSpriteManager";
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
import { 
    ScalableCommand,
    CommandType
} from "./commands/CommandTypes";
import { CommandFactory } from "./commands/CommandFactory";
import { InputService } from "./input";
import { battleSocketClient } from "@phaser-games/wildstrikes/src/shared-utils/BattleSocketClient";

export class PlayerManager {
    // State management
    private currentState: PlayerState;
    private states: Map<string, PlayerState> = new Map();

    // Command pattern - now using ScalableCommand
    private jumpCommand: ScalableCommand;
    private dashCommand: ScalableCommand;
    private lightAttackCommand: ScalableCommand;
    private heavyAttackCommand: ScalableCommand;

    // Input handling
    private inputService: InputService;

    private targetPosition: { x: number; y: number } | null = null;
    private targetVelocity: { x: number; y: number } | null = null;
    private interpolationTime: number = 0;
    private interpolationDuration: number = 100; // 100ms interpolation
    private lastNetworkUpdate: number = 0;
    private isInterpolating: boolean = false;
    private lastNetworkAnimation: string | null = null;

    private player: Phaser.Physics.Arcade.Sprite | null = null;
    private spriteManager: PlayerSpriteManager;

    private keyObjects: { [key: string]: Phaser.Input.Keyboard.Key } = {};
    private enableInput: boolean;

    private spawnPosition: { x: number, y: number };

    private roomId: string;

    constructor(private scene: Phaser.Scene, enableInput: boolean = true, roomId: string) {
        this.scene = scene;
        this.enableInput = enableInput;
        this.spriteManager = new PlayerSpriteManager(scene);
        
        this.roomId = roomId;

        // Initialize states
        this.initializeStates();
        
        // Initialize commands
        this.initializeCommands();
        
        // Initialize input service
        this.inputService = new InputService(scene);
        this.inputService.setCommandTarget(this);
        this.inputService.setEnabled(enableInput);
        
        // Set initial state to idle
        this.currentState = this.states.get(PlayerStates.Idle)!;
        
        // Only set up input controls if input is enabled
        if (this.enableInput) {
            this.keyObjects = scene.input.keyboard.addKeys({
                left: 'A',
                right: 'D',
                up: 'W',
                jump: 'SPACE',
                dash: 'Q',
                crouch: 'CTRL'
            }) as { [key: string]: Phaser.Input.Keyboard.Key };
            this.setupInputHandlers();
            
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

    private initializeCommands(): void {
        // Create commands with LOCAL_INPUT type for local players
        this.jumpCommand = CommandFactory.createCommand('jump', CommandType.LOCAL_INPUT);
        this.dashCommand = CommandFactory.createCommand('dash', CommandType.LOCAL_INPUT);
        this.lightAttackCommand = CommandFactory.createCommand('lightAttack', CommandType.LOCAL_INPUT);
        this.heavyAttackCommand = CommandFactory.createCommand('heavyAttack', CommandType.LOCAL_INPUT);
    }

    // Add new methods for different command execution contexts
    public executeLocalCommand(command: ScalableCommand): void {
        if (command.getCommandType() !== CommandType.LOCAL_INPUT) {
            console.warn('Attempting to execute non-local command on local player');
            return;
        }
        command.execute(this);
    }

    public executeRemoteCommand(command: ScalableCommand): void {
        if (command.getCommandType() !== CommandType.REMOTE_SYNC) {
            console.warn('Attempting to execute non-remote command on remote player');
            return;
        }
        command.execute(this);
    }

    public setSpawnPosition(x: number, y: number): void {
        this.spawnPosition = { x, y };
    }

    public createPlayer(x: number, y: number): Phaser.Physics.Arcade.Sprite {
        this.player = this.spriteManager.createPlayerSprite(x, y);
        this.player.setDepth(1);
        if (this.enableInput) {
            this.player.setTint(0x00ffff);
        } else {
            this.player.setTint(0xff0000);
        }
        this.setupCollisions();        
        this.currentState.enter();
        return this.player;
    }

    public transitionTo(stateName: string): void {
        const newState = this.states.get(stateName);
        if (!newState) {
            return;
        }
    
        // Emit state change for network synchronization
        if (this.enableInput && this.player) {
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            
            const networkStateName = stateName
                .replace(/([a-z])([A-Z])/g, '$1-$2')
                .toLowerCase();
            
            const networkData = {
                id: this.getPlayerId(), // Add player ID for routing
                state: networkStateName,
                position: { 
                    x: this.player.x, 
                    y: this.player.y,
                    facing: this.player.flipX ? 'left' : 'right'
                },
                velocity: { x: body.velocity.x, y: body.velocity.y },
                timestamp: Date.now(),
                roomId: this.roomId
            };
            
            console.log(`[NETWORK] Sending state update:`, networkData);
            battleSocketClient.emit("player-state-update", networkData);
        }
    
        this.currentState.exit();
        this.currentState = newState;
        this.currentState.enter();
    }

    public updateFromNetwork(networkState: any): void {
        if (!this.player || this.enableInput) return; // Don't update local player from network

        const currentTime = Date.now();
        
        // Throttle network updates to prevent excessive processing
        if (currentTime - this.lastNetworkUpdate < 16) return; // ~60fps max
        
        console.log(`[NETWORK] Received state update:`, networkState);
        
        // Convert network state to local state name
        const localStateName = this.convertNetworkStateToLocal(networkState.state);
        
        // Always transition to the appropriate state for remote players
        if (localStateName && this.states.has(localStateName)) {
            // Update position and velocity for interpolation
            if (networkState.position) {
                this.targetPosition = { 
                    x: networkState.position.x, 
                    y: networkState.position.y 
                };
            }
            if (networkState.velocity) {
                this.targetVelocity = { 
                    x: networkState.velocity.x, 
                    y: networkState.velocity.y 
                };
            }
            
            // Update facing direction immediately
            if (networkState.position?.facing) {
                this.player.setFlipX(networkState.position.facing === 'left');
            }
            
            // Transition to the appropriate state (this will handle animation)
            this.transitionTo(localStateName);
            
            // Start interpolation
            this.interpolationTime = 0;
            this.interpolationDuration = 100; // Increased for smoother movement
            this.lastNetworkUpdate = currentTime;
            this.isInterpolating = true;
        }
    }

    private updateInterpolation(deltaTime: number): void {
        if (!this.player || this.enableInput || !this.isInterpolating || !this.targetPosition) return;
    
        this.interpolationTime += deltaTime;
        const progress = Math.min(this.interpolationTime / this.interpolationDuration, 1);
    
        // Use smoother easing function
        const easedProgress = this.easeOutQuart(progress);
    
        // Interpolate position
        const startX = this.player.x;
        const startY = this.player.y;
        const targetX = this.targetPosition.x;
        const targetY = this.targetPosition.y;
    
        const newX = startX + (targetX - startX) * easedProgress;
        const newY = startY + (targetY - startY) * easedProgress;
    
        this.player.setPosition(newX, newY);
    
        // Interpolate velocity if available
        if (this.targetVelocity) {
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            const startVelX = body.velocity.x;
            const startVelY = body.velocity.y;
            
            const newVelX = startVelX + (this.targetVelocity.x - startVelX) * easedProgress;
            const newVelY = startVelY + (this.targetVelocity.y - startVelY) * easedProgress;
            
            this.player.setVelocity(newVelX, newVelY);
        }
    
        // Stop interpolation when complete
        if (progress >= 1) {
            this.isInterpolating = false;
            this.targetPosition = null;
            this.targetVelocity = null;
        }
    }

    private easeOutQuart(t: number): number {
        return 1 - Math.pow(1 - t, 4);
    }

    private convertNetworkStateToLocal(networkState: string): string {
        // Convert kebab-case back to camelCase
        const stateMap: { [key: string]: string } = {
            'idle': PlayerStates.Idle,
            'sprinting': PlayerStates.Sprinting,
            'jumping': PlayerStates.Jumping,
            'attacking-light': PlayerStates.AttackingLight,
            'attacking-heavy': PlayerStates.AttackingHeavy,
            'dashing': PlayerStates.Dashing,
            'crouching': PlayerStates.Crouching,
            'crouch-walking': PlayerStates.CrouchWalking
        };
        return stateMap[networkState] || PlayerStates.Idle;
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
        
        // Update interpolation for remote players
        if (!this.enableInput) {
            this.updateInterpolation(deltaTime || 16);
        }
        
        // Send continuous updates for local player during movement
        if (this.enableInput) {
            this.sendContinuousUpdate();
        }
        
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
            });
            
        } else {
            console.warn('Platform not found on scene for collision setup');
        }
    }

    private sendContinuousUpdate(): void {
        if (!this.enableInput || !this.player) return;
        
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const currentState = this.currentState.constructor.name.toLowerCase();
        
        // Only send continuous updates for movement states and reduce frequency
        const movementStates = ['sprinting', 'jumping', 'dashing', 'crouchwalking'];
        if (movementStates.some(state => currentState.includes(state))) {
            // Add throttling to reduce network traffic
            const now = Date.now();
            if (now - this.lastNetworkUpdate < 50) return; // Only send every 50ms max
            
            const networkData = {
                id: this.getPlayerId(), // Add player ID for routing
                state: currentState.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
                position: { 
                    x: this.player.x, 
                    y: this.player.y,
                    facing: this.player.flipX ? 'left' : 'right'
                },
                velocity: { x: body.velocity.x, y: body.velocity.y },
                timestamp: now,
                roomId: this.roomId
            };
            
            battleSocketClient.emit("player-state-update", networkData);
            this.lastNetworkUpdate = now;
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
        return this.currentState instanceof SprintingState || 
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
    public getJumpCommand(): ScalableCommand {
        return this.jumpCommand;
    }

    public getDashCommand(): ScalableCommand {
        return this.dashCommand;
    }

    public getLightAttackCommand(): ScalableCommand {
        return this.lightAttackCommand;
    }

    public getHeavyAttackCommand(): ScalableCommand {
        return this.heavyAttackCommand;
    }

    // Execute command directly (useful for AI or replay systems)
    public executeCommand(command: ScalableCommand): void {
        if (!command.canExecute(this)) {
            console.warn(`Command cannot be executed: ${command.constructor.name}`);
            return;
        }
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

    public getPlayerId(): string {
        // Get player ID from the scene's player contexts
        const arenaScene = this.scene as any;
        if (arenaScene.playerContexts) {
            for (const [id, context] of arenaScene.playerContexts) {
                if (context.manager === this) {
                    return id;
                }
            }
        }
        return 'unknown';
    }


}