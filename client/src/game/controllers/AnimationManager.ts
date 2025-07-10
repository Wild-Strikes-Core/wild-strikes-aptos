/**
 * AnimationManager - Manages player animations
 */
export class AnimationManager {
    private scene: Phaser.Scene;
    private sprite: Phaser.Physics.Arcade.Sprite;
    private animations: { [key: string]: string };
    private options: any;
    private isAttackingFlag: boolean = false;

    constructor(
        scene: Phaser.Scene,
        sprite: Phaser.Physics.Arcade.Sprite,
        animations: { [key: string]: string },
        options: any = {}
    ) {
        this.scene = scene;
        this.sprite = sprite;
        this.animations = animations;
        this.options = options;
    }

    /**
     * Check if currently attacking
     */
    isAttacking(): boolean {
        return this.isAttackingFlag;
    }

    /**
     * Play attack animation
     */
    playAttack(isHeavy: boolean = false): void {
        const attackAnim = isHeavy ? this.animations.attack2 : this.animations.attack;
        if (attackAnim && this.sprite && this.sprite.anims) {
            this.isAttackingFlag = true;
            this.sprite.play(attackAnim);
            
            // Clear attack flag when animation completes
            this.sprite.once('animationcomplete', () => {
                this.isAttackingFlag = false;
            });
        }
    }

    /**
     * Update animation based on movement state
     */
    update(
        velocityX: number,
        velocityY: number,
        onGround: boolean,
        isRunning: boolean,
        isCrouching: boolean,
        time: number
    ): void {
        if (this.isAttackingFlag || !this.sprite || !this.sprite.anims) {
            return;
        }

        let targetAnimation = this.animations.idle;

        // Determine animation based on state
        if (!onGround) {
            // In air
            if (velocityY < 0) {
                targetAnimation = this.animations.jump;
            } else {
                targetAnimation = this.animations.fall;
            }
        } else if (isCrouching) {
            // On ground, crouching
            if (Math.abs(velocityX) > 0.1) {
                targetAnimation = this.animations.crouchWalk;
            } else {
                targetAnimation = this.animations.crouch;
            }
        } else if (Math.abs(velocityX) > 0.1) {
            // On ground, moving
            targetAnimation = isRunning ? this.animations.run : this.animations.walk;
        }

        // Play animation if different from current
        const currentAnim = this.sprite.anims.currentAnim?.key;
        if (currentAnim !== targetAnimation && targetAnimation) {
            try {
                this.sprite.play(targetAnimation);
            } catch (error) {
                console.warn('Error playing animation:', error);
            }
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.isAttackingFlag = false;
    }
}
