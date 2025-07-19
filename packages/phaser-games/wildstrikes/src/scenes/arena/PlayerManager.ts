import { PlayerSpriteManager } from "./PlayerSpriteManager";

export class PlayerManager {
    private jumpCount: number = 0;
    private jumpLimit: number = 2; // Allow double jump
    private isJumping: boolean = false;
    private isDashing: boolean = false;
    private dashDuration: number = 300; // Duration of dash in milliseconds
    private dashCooldown: number = 1000; // Cooldown time after dash
    private dashTimer: Phaser.Time.TimerEvent | null = null;

    private player: Phaser.Physics.Arcade.Sprite | null = null;
    private spriteManager: PlayerSpriteManager;

    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;

    constructor(private scene: Phaser.Scene) {
        this.scene = scene;
        this.spriteManager = new PlayerSpriteManager(scene);
        
        // Set up input controls
        this.cursors = this.scene.input.keyboard?.createCursorKeys();
        this.setupInputHandlers();
    }

    public createPlayer(x: number, y: number): Phaser.Physics.Arcade.Sprite {
        // Use SpriteManager to create the player sprite
        this.player = this.spriteManager.createPlayerSprite(x, y);
        
        // Set depth for proper rendering order
        this.player.setDepth(1);
        
        // Test all animations for debugging
        this.spriteManager.testAllAnimations(this.player);
        
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

        // ========================================
        // ANIMATION TEST CONTROLS (Non-conflicting)
        // ========================================
        // Basic animations:
        // J - Jump animation
        // D - Dash animation
        // K - Idle animation
        // L - Run animation
        // U - Attack animation
        // V - Attack2 animation
        // B - AttackNoMovement animation
        // N - Attack2NoMovement animation
        // O - AttackCombo2hit animation
        // P - AttackComboNoMovement animation
        // Z - CrouchAttack animation
        // X - CrouchFull animation
        // C - CrouchWalk animation
        // W - Death animation
        // Q - DeathNoMovement animation
        // H - Fall animation
        // G - Hit animation
        // F - Roll animation
        // ========================================

        this.scene.input.keyboard.on('keydown-J', () => {
            if (this.player) {
                console.log('Testing Jump animation...');
                this.spriteManager.playJumpingAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-D', () => {
            if (this.player) {
                console.log('Testing Dash animation...');
                this.spriteManager.playDashingAnimation(this.player);
            }
        });

        // Animation test keys using non-conflicting letters
        this.scene.input.keyboard.on('keydown-K', () => {
            if (this.player) {
                console.log('Testing Idle animation...');
                this.spriteManager.playIdleAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-L', () => {
            if (this.player) {
                console.log('Testing Run animation...');
                this.spriteManager.playWalkingAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-U', () => {
            if (this.player) {
                console.log('Testing Attack animation...');
                this.spriteManager.playAttackingAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-V', () => {
            if (this.player) {
                console.log('Testing Attack2 animation...');
                this.spriteManager.playAttack2Animation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-B', () => {
            if (this.player) {
                console.log('Testing AttackNoMovement animation...');
                this.spriteManager.playAttackNoMovementAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-N', () => {
            if (this.player) {
                console.log('Testing Attack2NoMovement animation...');
                this.spriteManager.playAttack2NoMovementAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-O', () => {
            if (this.player) {
                console.log('Testing AttackCombo2hit animation...');
                this.spriteManager.playAttackCombo2hitAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-P', () => {
            if (this.player) {
                console.log('Testing AttackComboNoMovement animation...');
                this.spriteManager.playAttackComboNoMovementAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-Z', () => {
            if (this.player) {
                console.log('Testing CrouchAttack animation...');
                this.spriteManager.playCrouchAttackAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-X', () => {
            if (this.player) {
                console.log('Testing CrouchFull animation...');
                this.spriteManager.playCrouchFullAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-C', () => {
            if (this.player) {
                console.log('Testing CrouchWalk animation...');
                this.spriteManager.playCrouchWalkAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-W', () => {
            if (this.player) {
                console.log('Testing Death animation...');
                this.spriteManager.playDeathAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-Q', () => {
            if (this.player) {
                console.log('Testing DeathNoMovement animation...');
                this.spriteManager.playDeathNoMovementAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-H', () => {
            if (this.player) {
                console.log('Testing Fall animation...');
                this.spriteManager.playFallAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-G', () => {
            if (this.player) {
                console.log('Testing Hit animation...');
                this.spriteManager.playHitAnimation(this.player);
            }
        });

        this.scene.input.keyboard.on('keydown-F', () => {
            if (this.player) {
                console.log('Testing Roll animation...');
                this.spriteManager.playRollAnimation(this.player);
            }
        });
    }

    public update(): void {
        if (!this.player || !this.cursors) return;

        this.handleMovement();
        this.updateAnimations();
    }

    private handleMovement(): void {
       
    }

    private updateAnimations(): void {
        
    }

    private handleJump(): void {
        
    }

    private handleDash(): void {
        
    }

    private handleAttack(): void {
        
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

}