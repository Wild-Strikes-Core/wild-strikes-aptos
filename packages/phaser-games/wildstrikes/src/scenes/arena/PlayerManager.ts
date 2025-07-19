import { SpriteManager } from "./SpriteManager";

export class PlayerManager {
    private jumpCount: number = 0;
    private jumpLimit: number = 2; // Allow double jump
    private isJumping: boolean = false;
    private isDashing: boolean = false;
    private dashDuration: number = 300; // Duration of dash in milliseconds
    private dashCooldown: number = 1000; // Cooldown time after dash
    private dashTimer: Phaser.Time.TimerEvent | null = null;
    private player: Phaser.Physics.Arcade.Sprite | null = null;
    private spriteManager: SpriteManager;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;

    constructor(private scene: Phaser.Scene) {
        this.scene = scene;
        this.spriteManager = new SpriteManager(scene);
        
        // Set up input controls
        this.cursors = this.scene.input.keyboard?.createCursorKeys();
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
        if (!this.scene.input.keyboard) return;

        // Set up keyboard input for movement
        this.scene.input.keyboard.on('keydown-SPACE', () => {
            this.handleJump();
        });

        this.scene.input.keyboard.on('keydown-SHIFT', () => {
            this.handleDash();
        });

        this.scene.input.keyboard.on('keydown-Z', () => {
            this.handleAttack();
        });
    }

    public update(): void {
        if (!this.player || !this.cursors) return;

        this.handleMovement();
        this.updateAnimations();
    }

    private handleMovement(): void {
        if (!this.player || !this.cursors) return;

        const isMoving = this.cursors.left?.isDown || this.cursors.right?.isDown;
        
        if (this.cursors.left?.isDown) {
            this.player.setVelocityX(-300);
            this.spriteManager.flipSprite(this.player, true);
        } else if (this.cursors.right?.isDown) {
            this.player.setVelocityX(300);
            this.spriteManager.flipSprite(this.player, false);
        } else {
            this.player.setVelocityX(0);
        }

        // Update movement state
        this.player.setData('isMoving', isMoving);
    }

    private updateAnimations(): void {
        if (!this.player) return;

        const isMoving = this.player.getData('isMoving');
        const isAttacking = this.spriteManager.isAttacking(this.player);
        const currentState = this.spriteManager.getCurrentState(this.player);

        // Don't change animation if attacking
        if (isAttacking) return;

        // Handle animation based on state
        if (this.isJumping || !this.player.body?.touching.down) {
            if (currentState !== 'jumping') {
                this.spriteManager.playJumpingAnimation(this.player);
            }
        } else if (isMoving) {
            if (currentState !== 'walking') {
                this.spriteManager.playWalkingAnimation(this.player);
            }
        } else {
            if (currentState !== 'idle') {
                this.spriteManager.playIdleAnimation(this.player);
            }
        }
    }

    private handleJump(): void {
        if (!this.player) return;

        if (this.jumpCount < this.jumpLimit) {
            this.player.setVelocityY(-800);
            this.jumpCount++;
            this.isJumping = true;
            this.spriteManager.playJumpingAnimation(this.player);
        }
    }

    private handleDash(): void {
        if (!this.player || this.isDashing) return;

        this.isDashing = true;
        const dashDirection = this.player.flipX ? -1 : 1;
        this.player.setVelocityX(dashDirection * 600);
        
        this.spriteManager.playDashingAnimation(this.player);

        // End dash after duration
        this.dashTimer = this.scene.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false;
            this.player?.setVelocityX(0);
        });
    }

    private handleAttack(): void {
        if (!this.player || this.spriteManager.isAttacking(this.player)) return;

        this.spriteManager.playAttackingAnimation(this.player);
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
            });
            
            console.log('Player-platform collision set up successfully');
        } else {
            console.warn('Platform not found on scene for collision setup');
        }
    }

    public getPlayer(): Phaser.Physics.Arcade.Sprite | null {
        return this.player;
    }
}