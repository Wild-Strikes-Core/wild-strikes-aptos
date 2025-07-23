/**
 * PlayerSpriteManager handles all sprite creation and animation management for the Arena scene
 */
export class PlayerSpriteManager {
    private scene: Phaser.Scene;
    private onLightAttackCompleteCallback?: () => void;
    private onHeavyAttackCompleteCallback?: () => void;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.scene.time.delayedCall(100, () => this.createCharacterAnimations());
    }

    // Set callback for when light attack animation completes
    public setLightAttackCompleteCallback(callback: () => void): void {
        this.onLightAttackCompleteCallback = callback;
    }

    // Set callback for when heavy attack animation completes
    public setHeavyAttackCompleteCallback(callback: () => void): void {
        this.onHeavyAttackCompleteCallback = callback;
    }

    // Legacy method for backwards compatibility
    public setAttackCompleteCallback(callback: () => void): void {
        this.onLightAttackCompleteCallback = callback;
        this.onHeavyAttackCompleteCallback = callback;
    }

    // ========================================
    // ANIMATION CREATION METHODS
    // ========================================

    private createCharacterAnimations(): void {
        const animations = [
            { key: '_Idle', texture: '_Idle', data: '_Idle_1' },
            { key: '_Run', texture: '_Run', data: '_Run_1' },
            { key: '_Jump', texture: '_Jump', data: '_Jump_1' },
            { key: '_Dash', texture: '_Dash', data: '_Dash_1' },
            { key: '_Attack', texture: '_Attack', data: '_Attack_1' },
            { key: '_Attack2', texture: '_Attack2', data: '_Attack_2' },
            { key: '_AttackNoMovement', texture: '_AttackNoMovement', data: '_AttackNoMovement_1' },
            { key: '_Attack2NoMovement', texture: '_Attack2NoMovement', data: '_Attack2NoMovement_1' },
            { key: '_AttackCombo2hit', texture: '_AttackCombo2hit', data: '_AttackCombo2hit_1' },
            { key: '_AttackComboNoMovement', texture: '_AttackComboNoMovement', data: '_AttackComboNoMovement_1' },
            { key: '_CrouchAttack', texture: '_CrouchAttack', data: '_CrouchAttack_1' },
            { key: '_CrouchFull', texture: '_CrouchFull', data: '_CrouchFull_1' },
            { key: '_CrouchWalk', texture: '_CrouchWalk', data: '_CrouchWalk_1' },
            { key: '_DeathNoMovement', texture: '_DeathNoMovement', data: '_DeathNoMovement_1' },
            { key: '_Fall', texture: '_Fall', data: '_Fall_1' },
            { key: '_Hit', texture: '_Hit', data: '_Hit_1' },
            { key: '_Roll', texture: '_Roll', data: '_Roll_1' }
        ];

        animations.forEach(anim => {
            if (!this.scene.anims.exists(anim.key)) {
                const animData = this.scene.cache.json.get(anim.data);
                
                if (!animData) {
                    console.warn(`Animation data not found for ${anim.data}`);
                    return;
                }
                
                const frameCount = animData.anims[0].frames.length;
                
                // Attack animations should never repeat
                let repeatValue = frameCount === 1 ? 0 : (animData.anims[0].repeat || 0);
                if (anim.key.includes('Attack') || anim.key.includes('_Hit') || anim.key.includes('_Death')) {
                    repeatValue = 0; // No repeat for attack, hit, or death animations
                }
                
                console.log(`Creating animation ${anim.key} with ${frameCount} frames, repeat: ${repeatValue}`);
                
                this.scene.anims.create({
                    key: anim.key,
                    frames: this.scene.anims.generateFrameNumbers(anim.texture, { start: 0, end: frameCount - 1 }),
                    frameRate: animData.anims[0].frameRate || 10,
                    repeat: repeatValue
                });
            }
        });
    }

    // ========================================
    // SPRITE CREATION METHODS
    // ========================================

    public createPlayerSprite(x: number, y: number, texture: string = '_Idle'): Phaser.Physics.Arcade.Sprite {
        // Create the physics-enabled sprite
        const sprite = this.scene.physics.add.sprite(x, y, texture);
        
        // Set up interactive area for click/touch detection
        sprite.setInteractive({ 
            hitArea: new Phaser.Geom.Rectangle(0, 0, 120, 80), 
            hitAreaCallback: Phaser.Geom.Rectangle.Contains 
        });
        
        // Configure sprite display properties
        sprite.setScale(3);
        sprite.setOrigin(0.5, 1); // Center horizontally, bottom vertically for ground alignment
        
        // Configure physics body
        if (sprite.body) {
            const body = sprite.body as Phaser.Physics.Arcade.Body;
            body.setGravityY(10000);           // Reasonable gravity
            body.setSize(30, 40);            // Collision box size
            body.setOffset(45, 40);          // Center the collision box
            body.setCollideWorldBounds(true); // Keep player in bounds
            body.setBounce(0.1);             // Small bounce on landing
            body.setDragX(200);              // Air resistance for horizontal movement
        }
        
        // Initialize sprite data
        sprite.setData('currentState', 'idle');
        
        // Start with idle animation
        this.playIdleAnimation(sprite);
        
        return sprite;
    }

    // ========================================
    // ANIMATION PLAYBACK METHODS
    // ========================================

    public playIdleAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_Idle', true);
        sprite.setData('currentState', 'idle');
    }

    public playWalkingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        if (sprite.getData('currentState') !== 'walking') {
            sprite.anims.play('_Run', true);
            sprite.setData('currentState', 'walking');
        }
    }

    public playSprintingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        if (sprite.getData('currentState') !== 'sprinting') {
            sprite.anims.play('_Run', true);
            sprite.setData('currentState', 'sprinting');
        }
    }

    public playJumpingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_Jump', true);
        sprite.setData('currentState', 'jumping');
    }

    public playAttackingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        if (sprite.anims.currentAnim) sprite.anims.stop();

        try {
            // Add a small delay to ensure the attacking flag is processed before animation starts
            this.scene.time.delayedCall(10, () => {
                if (sprite && sprite.active) {
                    sprite.play({
                        key: "_Attack",
                        frameRate: 12,
                        repeat: 0,
                    });
                }
            });

            sprite.off('animationcomplete');

            // Reset attacking flag when animation completes
            sprite.once('animationcomplete', () => {
                if (sprite && sprite.active) {
                    console.log("Attack animation completed");
                    if (this.onLightAttackCompleteCallback) {
                        this.onLightAttackCompleteCallback();
                    }
                }
            });

            // Fallback timeout to clear attacking flag if animation doesn't complete
            this.scene.time.delayedCall(300, () => { // Reduced from 400ms to 300ms for spam attacks
                if (sprite && sprite.active) {
                    console.log("Attack animation timeout");
                    if (this.onLightAttackCompleteCallback) {
                        this.onLightAttackCompleteCallback();
                    }
                }
            });
            
        } catch (error) {
            console.error("Failed to play attack animation:", error);
            if (this.onLightAttackCompleteCallback) {
                this.onLightAttackCompleteCallback();
            }
        }

        sprite.setData('currentState', 'attacking');
    }

    public playDashingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_Dash', true);
        sprite.setData('currentState', 'dashing');
    }

    public playAttack2Animation(sprite: Phaser.Physics.Arcade.Sprite): void {
        if (sprite.anims.currentAnim) sprite.anims.stop();

        try {
            // Add a small delay to ensure the attacking flag is processed before animation starts
            this.scene.time.delayedCall(10, () => {
                if (sprite && sprite.active) {
                    sprite.play({
                        key: "_Attack2",
                        frameRate: 12,
                        repeat: 0,
                    });
                }
            });

            sprite.off('animationcomplete');

            // Reset attacking flag when animation completes
            sprite.once('animationcomplete', () => {
                if (sprite && sprite.active) {
                    console.log("Heavy attack animation completed");
                    if (this.onHeavyAttackCompleteCallback) {
                        this.onHeavyAttackCompleteCallback();
                    }
                }
            });

            // Fallback timeout to clear attacking flag if animation doesn't complete
            this.scene.time.delayedCall(400, () => { // Heavy attack might be longer than light attack
                if (sprite && sprite.active) {
                    console.log("Heavy attack animation timeout");
                    if (this.onHeavyAttackCompleteCallback) {
                        this.onHeavyAttackCompleteCallback();
                    }
                }
            });
            
        } catch (error) {
            console.error("Failed to play heavy attack animation:", error);
            if (this.onHeavyAttackCompleteCallback) {
                this.onHeavyAttackCompleteCallback();
            }
        }

        sprite.setData('currentState', 'attacking');
    }

    public playAttackNoMovementAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_AttackNoMovement', true);
        sprite.setData('currentState', 'attacking').setData('isAttacking', true);
        sprite.once('animationcomplete', () => {
            sprite.setData('isAttacking', false);
            this.playIdleAnimation(sprite);
        });
    }

    public playAttack2NoMovementAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_Attack2NoMovement', true);
        sprite.setData('currentState', 'attacking').setData('isAttacking', true);
        sprite.once('animationcomplete', () => {
            sprite.setData('isAttacking', false);
            this.playIdleAnimation(sprite);
        });
    }

    public playAttackCombo2hitAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_AttackCombo2hit', true);
        sprite.setData('currentState', 'attacking').setData('isAttacking', true);
        sprite.once('animationcomplete', () => {
            sprite.setData('isAttacking', false);
            this.playIdleAnimation(sprite);
        });
    }

    public playAttackComboNoMovementAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_AttackComboNoMovement', true);
        sprite.setData('currentState', 'attacking').setData('isAttacking', true);
        sprite.once('animationcomplete', () => {
            sprite.setData('isAttacking', false);
            this.playIdleAnimation(sprite);
        });
    }

    public playCrouchAttackAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_CrouchAttack', true);
        sprite.setData('currentState', 'attacking').setData('isAttacking', true);
        sprite.once('animationcomplete', () => {
            sprite.setData('isAttacking', false);
            this.playIdleAnimation(sprite);
        });
    }

    public playCrouchFullAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_CrouchFull', true);
        sprite.setData('currentState', 'crouching');
    }

    public playCrouchWalkAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_CrouchWalk', true);
        sprite.setData('currentState', 'crouch-walking');
    }

    public playDeathAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_DeathNoMovement', true);
        sprite.setData('currentState', 'dead');
    }

    public playDeathNoMovementAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_DeathNoMovement', true);
        sprite.setData('currentState', 'dead');
    }

    public playFallAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_Fall', true);
        sprite.setData('currentState', 'falling');
    }

    public playHitAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_Hit', true);
        sprite.setData('currentState', 'hit');
        this.scene.time.delayedCall(500, () => this.playIdleAnimation(sprite));
    }

    public playRollAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_Roll', true);
        sprite.setData('currentState', 'rolling');
        sprite.once('animationcomplete', () => this.playIdleAnimation(sprite));
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    public flipSprite(sprite: Phaser.Physics.Arcade.Sprite, flipX: boolean): void {
        sprite.setFlipX(flipX);
    }

    public getCurrentState(sprite: Phaser.Physics.Arcade.Sprite): string {
        return sprite.getData('currentState') || 'idle';
    }

    public destroySprite(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.destroy();
    }

    // Note: isAttacking is now managed in PlayerManager private properties
    // Use PlayerManager.getIsAttacking() instead

    // ========================================
    // DEBUG METHODS
    // ========================================

    public testAllAnimations(sprite: Phaser.Physics.Arcade.Sprite): void {
        const animations = ['_Idle', '_Run', '_Jump', '_Dash', '_Attack', '_Attack2', '_AttackNoMovement', '_Attack2NoMovement', '_AttackCombo2hit', '_AttackComboNoMovement', '_CrouchAttack', '_CrouchFull', '_CrouchWalk', '_DeathNoMovement', '_Fall', '_Hit', '_Roll'];
        
        console.log('Animation availability check:');
        animations.forEach(animKey => {
            const exists = sprite.anims.animationManager.get(animKey) ? '✓' : '✗';
            console.log(`${exists} ${animKey}`);
        });
    }
}
