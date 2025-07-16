import { Socket } from "socket.io-client";
import { AnimationManager } from "./AnimationManager";
import { createPlayerSprite } from '../utils/spriteUtils';

/**
 * PlayerManager - Manages player-specific functionality for camera integration
 */
export class PlayerManager {
    private scene: Phaser.Scene;
    private player: Phaser.Physics.Arcade.Sprite;
    private hpText: Phaser.GameObjects.Text;
    private staminaText: Phaser.GameObjects.Text;
    private cursors: any;
    private socket: Socket;
    private animationManager?: AnimationManager;
    private disableAttackHandlers: boolean = false;
    
    // Movement config
    private walkSpeed: number = 200;
    private runSpeed: number = 400;
    private jumpSpeed: number = -2000;
    private crouchSpeed: number = 150;
    
    // UI elements for skills
    private skillIcons: {
        skillE?: Phaser.GameObjects.Image;
        skillQ?: Phaser.GameObjects.Image;
        skillR?: Phaser.GameObjects.Image;
    };

    constructor(
        scene: Phaser.Scene, 
        socket: Socket,
        config: {
            walkSpeed?: number;
            runSpeed?: number;
            jumpSpeed?: number;
            crouchSpeed?: number;
            skillE?: Phaser.GameObjects.Image;
            skillQ?: Phaser.GameObjects.Image;
            skillR?: Phaser.GameObjects.Image;
            disableAttackHandlers?: boolean;
        } = {}
    ) {
        this.scene = scene;
        this.socket = socket;
        
        // Apply configuration
        this.walkSpeed = config.walkSpeed || this.walkSpeed;
        this.runSpeed = config.runSpeed || this.runSpeed;
        this.jumpSpeed = config.jumpSpeed || this.jumpSpeed;
        this.crouchSpeed = config.crouchSpeed || this.crouchSpeed;
        this.disableAttackHandlers = config.disableAttackHandlers || false;
        
        // Store skill icons
        this.skillIcons = {
            skillE: config.skillE,
            skillQ: config.skillQ,
            skillR: config.skillR
        };
    }
    
    /**
     * Initialize the player character and UI elements
     */
    initialize(
        x: number, 
        y: number, 
        hpText: Phaser.GameObjects.Text, 
        staminaText: Phaser.GameObjects.Text,
        existingSprite?: Phaser.Physics.Arcade.Sprite
    ): void {
        // Use existing sprite if provided, otherwise create a new one
        if (existingSprite) {
            this.player = existingSprite;
            this.player.x = x;
            this.player.y = y;
        } else {
            this.player = createPlayerSprite(this.scene, x, y);
        }

        this.hpText = hpText;
        this.staminaText = staminaText;
        
        // Initialize animation manager
        this.animationManager = new AnimationManager(
            this.scene,
            this.player,
            {
                idle: '_Idle_Idle',
                walk: '_Run',
                run: '_Run',
                jump: '_Jump',
                fall: '_Fall',
                crouch: '_CrouchFull',
                crouchWalk: '_CrouchWalk',
                attack: '_Attack',
                attack2: '_Attack2'
            }
        );
        
        this.setupControls();
        
        // Only setup attack handlers if not disabled
        if (!this.disableAttackHandlers) {
            this.setupAttackHandlers();
        }
    }
    
    /**
     * Set up keyboard controls
     */
    private setupControls(): void {
        this.cursors = this.scene.input.keyboard?.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.SPACE,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            ctrl: Phaser.Input.Keyboard.KeyCodes.CTRL,
            skillE: Phaser.Input.Keyboard.KeyCodes.E,
            skillQ: Phaser.Input.Keyboard.KeyCodes.Q,
            skillR: Phaser.Input.Keyboard.KeyCodes.R
        });
    }
    
    /**
     * Set up attack handlers
     */
    private setupAttackHandlers(): void {
        // Skip setting up attack handlers if disabled
        if (this.disableAttackHandlers) {
            console.log("PlayerManager: Attack handlers disabled");
            return;
        }
        
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                this.handleAttack('left');
            } else if (pointer.rightButtonDown()) {
                this.handleAttack('right');
            }
        });
    }
    
    /**
     * Handle attack
     */
    handleAttack(attackType: 'left' | 'right'): void {
        if (this.animationManager) {
            this.animationManager.playAttack(attackType === 'right');
        }
    }
    
    /**
     * Update player state
     */
    update(time: number, delta: number): void {
        if (!this.player || !this.player.body) return;
        
        // Skip movement if attacking
        if (this.animationManager?.isAttacking()) {
            this.positionHPTextAbovePlayer();
            return;
        }
        
        // Basic movement
        const onGround = this.player.body.touching.down || this.player.body.blocked.down;
        const isRunning = this.cursors?.shift?.isDown || false;
        const isCrouching = this.cursors?.down?.isDown || false;
        
        // Jump
        if (this.cursors?.up?.isDown && onGround) {
            this.player.setVelocityY(this.jumpSpeed);
        }
        
        // Horizontal movement
        if (this.cursors?.left?.isDown) {
            const speed = isRunning ? -this.runSpeed : -this.walkSpeed;
            this.player.setVelocityX(speed);
            this.player.setFlipX(true);
        } else if (this.cursors?.right?.isDown) {
            const speed = isRunning ? this.runSpeed : this.walkSpeed;
            this.player.setVelocityX(speed);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }
        
        // Update animation
        if (this.animationManager) {
            this.animationManager.update(
                this.player.body.velocity.x,
                this.player.body.velocity.y,
                onGround,
                isRunning,
                isCrouching,
                time
            );
        }
        
        this.positionHPTextAbovePlayer();
    }
    
    /**
     * Position HP and Stamina text above player
     */
    private positionHPTextAbovePlayer(): void {
        if (!this.hpText || !this.staminaText || !this.player) return;
        
        const hpYOffset = -40;
        const staYOffset = -15;

        this.hpText.setPosition(
            this.player.x - this.hpText.width / 2, 
            this.player.y + hpYOffset
        );

        this.staminaText.setPosition(
            this.player.x - this.staminaText.width / 2, 
            this.player.y + staYOffset
        );
    }
    
    /**
     * Get the player sprite
     */
    getPlayer(): Phaser.Physics.Arcade.Sprite {
        return this.player;
    }
    
    /**
     * Get player's speed for camera effects
     */
    getSpeed(): number {
        return this.player?.body ? Math.abs(this.player.body.velocity.x || 0) : 0;
    }
    
    /**
     * Get run speed threshold for camera effects
     */
    getRunSpeedThreshold(): number {
        return this.runSpeed * 0.8;
    }
    
    /**
     * Clean up resources
     */
    destroy(): void {
        if (this.animationManager) {
            this.animationManager.destroy();
        }
    }
}
