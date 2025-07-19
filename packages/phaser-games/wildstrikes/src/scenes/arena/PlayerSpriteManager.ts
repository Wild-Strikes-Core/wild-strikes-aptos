/**
 * PlayerSpriteManager handles all sprite creation and animation management for the Arena scene
 */
export class PlayerSpriteManager {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.scene.time.delayedCall(100, () => this.createCharacterAnimations());
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
                const frameCount = animData.anims[0].frames.length;
                
                this.scene.anims.create({
                    key: anim.key,
                    frames: this.scene.anims.generateFrameNumbers(anim.texture, { start: 0, end: frameCount - 1 }),
                    frameRate: animData.anims[0].frameRate || 10,
                    repeat: frameCount === 1 ? 0 : (animData.anims[0].repeat || 0)
                });
            }
        });
    }

    // ========================================
    // SPRITE CREATION METHODS
    // ========================================

    public createPlayerSprite(x: number, y: number, texture: string = '_Idle'): Phaser.Physics.Arcade.Sprite {
        const sprite = this.scene.physics.add.sprite(x, y, texture);
        
        sprite.setInteractive({ hitArea: new Phaser.Geom.Rectangle(0, 0, 120, 80), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
        sprite.setScale(3).setOrigin(0, 0);
        
        if (sprite.body) {
            sprite.body.setGravityY(10000).setOffset(45, 40).setSize(30, 40);
        }
        
        sprite.setData('isAttacking', false).setData('currentState', 'idle');
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

    public playJumpingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_Jump', true);
        sprite.setData('currentState', 'jumping');
    }

    public playAttackingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_Attack', true);
        sprite.setData('currentState', 'attacking').setData('isAttacking', true);
        
        sprite.once('animationcomplete', () => {
            sprite.setData('isAttacking', false);
            this.playIdleAnimation(sprite);
        });
    }

    public playDashingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_Dash', true);
        sprite.setData('currentState', 'dashing');
    }

    public playAttack2Animation(sprite: Phaser.Physics.Arcade.Sprite): void {
        sprite.anims.play('_Attack2', true);
        sprite.setData('currentState', 'attacking').setData('isAttacking', true);
        sprite.once('animationcomplete', () => {
            sprite.setData('isAttacking', false);
            this.playIdleAnimation(sprite);
        });
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

    public isAttacking(sprite: Phaser.Physics.Arcade.Sprite): boolean {
        return sprite.getData('isAttacking') || false;
    }

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
