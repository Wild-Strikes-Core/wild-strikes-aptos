/**
 * SpriteManager handles all sprite creation and animation management for the Arena scene
 */
export class SpriteManager {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Create a player sprite with standard configuration
     */
    public createPlayerSprite(
        x: number,
        y: number,
        texture: string = '_Idle_Idle',
        frame: number = 0
    ): Phaser.Physics.Arcade.Sprite {
        const sprite = this.scene.physics.add.sprite(x, y, texture, frame);
        
        // Standard player sprite configuration
        sprite.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(0, 0, 120, 80),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: false,
            debug: false
        });
        
        sprite.scaleX = 3;
        sprite.scaleY = 3;
        sprite.setOrigin(0, 0);
        
        if (sprite.body) {
            sprite.body.gravity.y = 10000;
            sprite.body.setOffset(45, 40);
            sprite.body.setSize(30, 40, false);
        }
        
        // Initialize sprite data
        sprite.setData('isAttacking', false);
        sprite.setData('currentState', 'idle');
        
        // Play initial animation
        this.playIdleAnimation(sprite);
        
        return sprite;
    }

    /**
     * Set player sprite to idle animation
     */
    public playIdleAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        try {
            sprite.anims.play('_Idle_Idle', true);
            sprite.setData('currentState', 'idle');
        } catch (error) {
            console.warn('Error playing idle animation:', error);
        }
    }

    /**
     * Set player sprite to walking animation
     */
    public playWalkingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        try {
            // Only change animation if not already walking
            if (sprite.getData('currentState') !== 'walking') {
                sprite.anims.play('_Run', true);
                sprite.setData('currentState', 'walking');
            }
        } catch (error) {
            console.warn('Error playing walking animation:', error);
            // Fallback to idle if walking animation doesn't exist
            this.playIdleAnimation(sprite);
        }
    }

    /**
     * Set player sprite to jumping animation
     */
    public playJumpingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        try {
            sprite.anims.play('_Jump', true);
            sprite.setData('currentState', 'jumping');
        } catch (error) {
            console.warn('Error playing jumping animation:', error);
            // Fallback to idle if jumping animation doesn't exist
            this.playIdleAnimation(sprite);
        }
    }

    /**
     * Set player sprite to attacking animation
     */
    public playAttackingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        try {
            sprite.anims.play('_Attack', true);
            sprite.setData('currentState', 'attacking');
            sprite.setData('isAttacking', true);
            
            // Reset attacking state when animation completes
            sprite.once('animationcomplete', () => {
                sprite.setData('isAttacking', false);
                this.playIdleAnimation(sprite);
            });
        } catch (error) {
            console.warn('Error playing attacking animation:', error);
            // Fallback to idle if attacking animation doesn't exist
            this.playIdleAnimation(sprite);
        }
    }

    /**
     * Set player sprite to dashing animation
     */
    public playDashingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        try {
            sprite.anims.play('_Dash', true);
            sprite.setData('currentState', 'dashing');
        } catch (error) {
            console.warn('Error playing dashing animation:', error);
            // Fallback to idle if dashing animation doesn't exist
            this.playIdleAnimation(sprite);
        }
    }

    /**
     * Flip sprite horizontally (for direction changes)
     */
    public flipSprite(sprite: Phaser.Physics.Arcade.Sprite, flipX: boolean): void {
        sprite.setFlipX(flipX);
    }

    /**
     * Get current animation state of sprite
     */
    public getCurrentState(sprite: Phaser.Physics.Arcade.Sprite): string {
        return sprite.getData('currentState') || 'idle';
    }

    /**
     * Check if sprite is currently attacking
     */
    public isAttacking(sprite: Phaser.Physics.Arcade.Sprite): boolean {
        return sprite.getData('isAttacking') || false;
    }
}
