import { Socket } from "socket.io-client";
import { PlayerSpriteManager } from "./PlayerSpriteManager";
import { PlayerState, IdleState, WalkingState, JumpingState, AttackingState, DashingState, CrouchingState } from "./states";

export class PlayerManager {
    // State management
    private currentState: PlayerState;
    private states: Map<string, PlayerState> = new Map();
    
    // State tracking properties
    private _isOnGround: boolean = false;
    private _isMoving: boolean = false;
    private _isSprinting: boolean = false;
    private _isCrouching: boolean = false;
    
    // Cooldown properties
    private dashCooldown: number = 1000; // Cooldown time after dash
    private dashTimer: Phaser.Time.TimerEvent | null = null;
    private attackCooldown: number = 300; // Minimum time between attacks in milliseconds
    private lastAttackTime: number = 0;
    private isAttackInProgress: boolean = false; // Prevent multiple attacks

    private player: Phaser.Physics.Arcade.Sprite | null = null;
    private spriteManager: PlayerSpriteManager;

    private keyObjects: { [key: string]: Phaser.Input.Keyboard.Key } = {};
    private enableInput: boolean;

    // socket
    private socket?: Socket;
    private playerId: string;


    constructor(private scene: Phaser.Scene, enableInput: boolean = true, socket?: Socket, playerId?: string) {
        this.scene = scene;
        this.enableInput = enableInput;
        this.socket = socket;
        this.playerId = playerId || 'playerONE'; // Default player ID if not provided

        this.spriteManager = new PlayerSpriteManager(scene);
        
        // Initialize states
        this.initializeStates();
        
        // Set initial state
        this.currentState = this.states.get('idle')!;
        console.log('Setting initial state:', this.currentState.constructor.name);
        this.currentState.enter();
        
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
        console.log('Initializing Player States...');
        this.states.set('idle', new IdleState(this));
        this.states.set('walking', new WalkingState(this));
        this.states.set('jumping', new JumpingState(this));
        this.states.set('attacking', new AttackingState(this));
        this.states.set('dashing', new DashingState(this));
        this.states.set('crouching', new CrouchingState(this));
        console.log('Player States initialized:', Array.from(this.states.keys()));
    }

    public transitionTo(stateName: string, attackType?: 'light' | 'heavy'): void {
        const newState = this.states.get(stateName);
        if (!newState) {
            console.warn(`State '${stateName}' not found`);
            return;
        }

        console.log(`Transitioning from ${this.currentState.constructor.name} to ${newState.constructor.name}`);
        
        if (this.currentState) {
            this.currentState.exit();
        }

        this.currentState = newState;
        if (attackType && newState instanceof AttackingState) {
            newState.enter(attackType);
        } else {
            newState.enter();
        }
    }

    // Helper methods for states
    public isKeyPressed(key: string): boolean {
        return this.keyObjects[key]?.isDown || false;
    }

    public getScene(): Phaser.Scene {
        return this.scene;
    }

    public flipSprite(flipX: boolean): void {
        if (this.player) {
            this.player.setFlipX(flipX);
        }
    }

    public startDashCooldown(): void {
        this.dashTimer = this.scene.time.delayedCall(this.dashCooldown, () => {
            console.log('Dash cooldown finished');
        });
    }

    public isDashOnCooldown(): boolean {
        return this.dashTimer ? this.dashTimer.getRemaining() > 0 : false;
    }

    public canAttack(): boolean {
        const currentTime = this.scene.time.now;
        return currentTime - this.lastAttackTime >= this.attackCooldown;
    }

    public setLastAttackTime(time: number): void {
        this.lastAttackTime = time;
    }

    public createPlayer(x: number, y: number): Phaser.Physics.Arcade.Sprite {
        // Use SpriteManager to create the player sprite
        this.player = this.spriteManager.createPlayerSprite(x, y);
        
        // Set depth for proper rendering order
        this.player.setDepth(1);
        
        // Set up collision with platform
        this.setupCollisions();
        

        return this.player;
    }

    private setupInputHandlers(): void {
        // Set up keyboard event listeners for special actions
        this.scene.input.keyboard?.on('keydown-SPACE', this.handleJump, this);
        this.scene.input.keyboard?.on('keydown-Q', this.handleDash, this);

        // Set up mouse event listeners for attacks
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                this.handleLightAttack();
            } else if (pointer.rightButtonDown()) {
                this.handleHeavyAttack();
            }
        });
        
        // Prevent context menu on right click
        this.scene.input.mouse?.disableContextMenu();
    }

    public update(): void {
        if (!this.player) return;
        
        // Update current state
        this.currentState.update();
        
        // Handle input if enabled
        if (this.enableInput) {
            this.currentState.handleInput();
        }
        
        // Update ground state
        this.updateGroundState();
    }

    private updateGroundState(): void {
        if (!this.player) return;
        
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const wasOnGround = this.getIsOnGround();
        const isOnGround = body.touching.down;
        
        // Update ground state
        this._isOnGround = isOnGround;
        
        // If we just landed, reset jump count
        if (!wasOnGround && isOnGround) {
            console.log('Player landed on platform');
        }
    }

    private handleJump(): void {
        if (!this.enableInput) return;
        console.log('Handle Jump called, current state:', this.currentState.constructor.name);
        this.currentState.onJump();
    }

    private handleDash(): void {
        if (!this.enableInput) return;
        console.log('Handle Dash called, current state:', this.currentState.constructor.name);
        this.currentState.onDash();
    }

    private handleLightAttack(): void {
        if (!this.enableInput) return;
        console.log('Handle Light Attack called, current state:', this.currentState.constructor.name);
        this.currentState.onLightAttack();
    }

    private handleHeavyAttack(): void {
        if (!this.enableInput) return;
        console.log('Handle Heavy Attack called, current state:', this.currentState.constructor.name);
        this.currentState.onHeavyAttack();
    }

    private setupCollisions(): void {
        if (!this.player) return;
        
        // Get platform from scene (set by MapManager)
        const platform = (this.scene as any).platform;
        
        if (platform) {
            // Set up collision between player and platform
            this.scene.physics.add.collider(this.player, platform, () => {
                // Ground state is handled in updateGroundState()
                console.log('Player-platform collision detected');
            });
            
            console.log('Player-platform collision set up successfully');
        } else {
            console.warn('Platform not found on scene for collision setup');
        }
    }

    // multiplayer - start
    public applyRemoteUpdate(data: any): void {
        if (!this.player || this.enableInput) return; // only apply updates to remote players

        this.player.setPosition(data.x, data.y);
        this.player.setVelocity(data.velocityX, data.velocityY);
        this.player.setFlipX(data.flipX);

        // Update animation if different
        if (data.anim && this.player.anims.currentAnim?.key !== data.anim) {
            console.log('Updating remote player animation from', this.player.anims.currentAnim?.key, 'to', data.anim);
            this.player.anims.play(data.anim, true);
        }
    }


    // multiplayer - end

    public getPlayer(): Phaser.Physics.Arcade.Sprite | null {
        return this.player;
    }

    // Getter methods for state access
    public getIsAttacking(): boolean {
        return this.currentState instanceof AttackingState;
    }

    public getIsAttackingLight(): boolean {
        return this.currentState instanceof AttackingState;
    }

    public getIsAttackingHeavy(): boolean {
        return this.currentState instanceof AttackingState;
    }

    public getIsMoving(): boolean {
        return this._isMoving;
    }

    public getIsOnGround(): boolean {
        return this._isOnGround;
    }

    public getIsDashing(): boolean {
        return this.currentState instanceof DashingState;
    }

    public getIsSprinting(): boolean {
        return this._isSprinting;
    }

    public getIsCrouching(): boolean {
        return this._isCrouching;
    }

    // Setter methods for state tracking
    public setIsMoving(moving: boolean): void {
        this._isMoving = moving;
    }

    public setIsSprinting(sprinting: boolean): void {
        this._isSprinting = sprinting;
    }

    public setIsCrouching(crouching: boolean): void {
        this._isCrouching = crouching;
    }

    public getPlayerSprite(): Phaser.Physics.Arcade.Sprite | null {
        return this.player;
    }

    public getSpriteManager(): PlayerSpriteManager {
        return this.spriteManager;
    }

    public getCurrentStateName(): string {
        return this.currentState.constructor.name;
    }

    public getIsAttackInProgress(): boolean {
        return this.isAttackInProgress;
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

    // temporary mobile triggers, would be replaced with event-based input handling soon

    public triggerJump(): void {
        console.log('Trigger Jump called');
        this.handleJump();
    }

    public triggerLightAttack(): void {
        console.log('Trigger Light Attack called');
        console.log('Current state:', this.currentState.constructor.name);
        console.log('Can attack:', this.canAttack());
        console.log('Time since last attack:', this.scene.time.now - this.lastAttackTime);
        console.log('Attack in progress:', this.getIsAttackInProgress());
        
        if (this.getIsAttackInProgress()) {
            console.log('Attack blocked - already in progress');
            return;
        }
        
        this.handleLightAttack();
    }

    public triggerHeavyAttack(): void {
        console.log('Trigger Heavy Attack called');
        this.handleHeavyAttack();
    }

    public triggerDash(): void {
        console.log('Trigger Dash called');
        this.handleDash();
    }

    // For multiplayer support (soon):

}