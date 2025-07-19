import { PlayerSpriteManager } from "./PlayerSpriteManager";

export class PlayerManager {
    private jumpCount: number = 0;
    private jumpLimit: number = 2; // Allow double jump
    private isJumping: boolean = false;
    private isDashing: boolean = false;
    private isAttacking: boolean = false;
    private isMoving: boolean = false;
    private isOnGround: boolean = false;

    private dashDuration: number = 300; // Duration of dash in milliseconds
    private dashCooldown: number = 1000; // Cooldown time after dash
    private dashTimer: Phaser.Time.TimerEvent | null = null;
    
    // Attack cooldown properties
    private attackCooldown: number = 300; // Minimum time between attacks in milliseconds
    private lastAttackTime: number = 0;

    private player: Phaser.Physics.Arcade.Sprite | null = null;
    private spriteManager: PlayerSpriteManager;

    private keyObjects: { [key: string]: Phaser.Input.Keyboard.Key } = {};

    constructor(private scene: Phaser.Scene) {
        this.scene = scene;
        this.spriteManager = new PlayerSpriteManager(scene);
        
        // Set up callback for when attack animation completes
        this.spriteManager.setAttackCompleteCallback(() => {
            this.isAttacking = false;
            console.log('Attack state cleared by callback');
        });
        
        // Set up input controls
        this.keyObjects = scene.input.keyboard.addKeys({
            left: 'A',
            right: 'D',
            up: 'W',
            jump: 'SPACE',
            dash: 'SHIFT'
        }) as { [key: string]: Phaser.Input.Keyboard.Key };
        this.setupInputHandlers();
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
        this.scene.input.keyboard?.on('keydown-SHIFT', this.handleDash, this);
        
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
        
        this.handleMovement();
        this.updateAnimations();
        
        // Don't reset velocity here - let physics handle it naturally
    }

    private handleMovement(): void {
        if (!this.player) return;

        const speed = 300;
        this.isMoving = false;

        // Handle horizontal movement
        if (this.keyObjects.left.isDown) {
            this.player.setVelocityX(-speed);
            this.spriteManager.flipSprite(this.player, true); // Face left
            this.isMoving = true;
        } else if (this.keyObjects.right.isDown) {
            this.player.setVelocityX(speed);
            this.spriteManager.flipSprite(this.player, false); // Face right
            this.isMoving = true;
        } else {
            // Stop horizontal movement when no keys are pressed
            this.player.setVelocityX(0);
        }
    }

    private updateAnimations(): void {
        if (!this.player) return;

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        this.isOnGround = body.touching.down;

        // Don't override animations if already attacking
        if (this.isAttacking) {
            return;
        } else if (this.isDashing) {
            this.spriteManager.playDashingAnimation(this.player);
        } else if (!this.isOnGround) {
            // In air - jumping or falling
            if (body.velocity.y < 0) {
                this.spriteManager.playJumpingAnimation(this.player);
            } else {
                this.spriteManager.playFallAnimation(this.player);
            }
        } else if (this.isMoving) {
            this.spriteManager.playWalkingAnimation(this.player);
        } else {
            // Player is on ground, not moving, not attacking - play idle
            this.spriteManager.playIdleAnimation(this.player);
        }
    }

    private handleJump(): void {
        if (!this.player) return;

        const jumpSpeed = -1300;
        
        // Allow jumping if we haven't exceeded jump limit
        if (this.jumpCount < this.jumpLimit) {
            this.player.setVelocityY(jumpSpeed);
            this.jumpCount++;
            this.isJumping = true;
            
            console.log(`Jump ${this.jumpCount}/${this.jumpLimit}`);
        }
    }

    private handleDash(): void {
        if (!this.player || this.isDashing) return;

        // Check if dash is on cooldown
        if (this.dashTimer && this.dashTimer.getRemaining() > 0) {
            console.log('Dash on cooldown');
            return;
        }

        this.isDashing = true;
        const dashSpeed = this.player.flipX ? -2400 : 2400;
        
        // Apply dash velocity
        this.player.setVelocityX(dashSpeed);
        
        console.log('Dash executed');

        // End dash after duration
        this.scene.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false;
            
            // Start cooldown timer
            this.dashTimer = this.scene.time.delayedCall(this.dashCooldown, () => {
                console.log('Dash cooldown finished');
            });
        });
    }

    private handleLightAttack(): void {
        if (!this.player) return;

        // Don't attack while dashing
        if (this.isDashing) return;

        // Don't attack if already attacking
        if (this.isAttacking) {
            console.log('Light attack blocked - already attacking');
            return;
        }

        // Check attack cooldown
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            console.log('Light attack blocked - cooldown');
            return;
        }

        // Set attacking state and trigger animation
        this.isAttacking = true;
        this.spriteManager.playAttackingAnimation(this.player);
        this.lastAttackTime = currentTime;

        console.log('Light attack executed');
    }

    private handleHeavyAttack(): void {
        if (!this.player) return;

        // Don't attack while dashing
        if (this.isDashing) return;

        // Don't attack if already attacking
        if (this.isAttacking) {
            console.log('Heavy attack blocked - already attacking');
            return;
        }

        // Check attack cooldown
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            console.log('Heavy attack blocked - cooldown');
            return;
        }

        // Set attacking state and trigger heavy attack animation
        this.isAttacking = true;
        this.spriteManager.playAttack2Animation(this.player);
        this.lastAttackTime = currentTime;

        console.log('Heavy attack executed');
    }

    private setupCollisions(): void {
        if (!this.player) return;
        
        // Get platform from scene (set by MapManager)
        const platform = (this.scene as any).platform;
        
        if (platform) {
            // Set up collision between player and platform
            this.scene.physics.add.collider(this.player, platform, () => {
                // Reset jump count when player lands on platform
                this.jumpCount = 0;
                this.isJumping = false;
                this.isOnGround = true;
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

    // Getter methods for state access
    public getIsAttacking(): boolean {
        return this.isAttacking;
    }

    public getIsMoving(): boolean {
        return this.isMoving;
    }

    public getIsOnGround(): boolean {
        return this.isOnGround;
    }

    public getIsDashing(): boolean {
        return this.isDashing;
    }

}