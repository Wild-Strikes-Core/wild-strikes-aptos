/**
 * Utility functions for creating and configuring sprites
 */

/**
 * Create a player sprite with standard configuration
 */
export function createPlayerSprite(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string = '_Idle_Idle',
    frame: number = 0
): Phaser.Physics.Arcade.Sprite {
    const sprite = scene.physics.add.sprite(x, y, texture, frame);
    
    // Standard player sprite configuration
    // Set interactive area without showing debug hitbox
    sprite.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, 120, 80),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: false,
        // Don't render debug visuals
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
    
    // Initialize attacking flag
    sprite.setData('isAttacking', false);
    
    // Play initial animation
    try {
        sprite.anims.play('_Idle_Idle', true);
    } catch (error) {
        console.warn('Error playing initial animation:', error);
    }
    
    return sprite;
}
