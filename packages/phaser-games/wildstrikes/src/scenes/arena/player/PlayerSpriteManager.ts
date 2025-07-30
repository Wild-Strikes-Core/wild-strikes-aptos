/**
 * PlayerSpriteManager handles all sprite creation and animation management for the Arena scene
 * 
 * ANIMATION NAMING CONVENTION:
 * =========================
 * 
 * Semantic Keys (New Standard):
 * - Format: [character]_[action]_[variant]
 * - Examples: 
 *   - player_idle
 *   - player_attack_light
 *   - player_attack_heavy_static
 *   - player_crouch_walk
 * 
 * Benefits:
 * - Easier searching/filtering (e.g., all 'attack' animations)
 * - Scalable for multiple characters (warrior_attack_light, mage_spell_fire)
 * - Self-documenting code
 * - Better IDE autocomplete support
 * 
 * Legacy Support:
 * - Old keys (_Attack, _Idle, etc.) are still supported for backward compatibility
 * - Both semantic and legacy keys reference the same animation data
 * - Gradual migration path - update calling code when convenient
 */
export class PlayerSpriteManager {
    private scene: Phaser.Scene;
    private onLightAttackCompleteCallback?: () => void;
    private onHeavyAttackCompleteCallback?: () => void;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        // Create animations immediately instead of with delay
        this.createCharacterAnimations();
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

    /**
     * Animation key mappings for semantic naming
     * Maps semantic keys to legacy texture/data names for backward compatibility
     */
    private static readonly ANIMATION_MAPPINGS = {
        // Basic movement animations
        'player_idle': { texture: '_Idle', data: '_Idle_1', legacy: '_Idle' },
        'player_run': { texture: '_Run', data: '_Run_1', legacy: '_Run' },
        'player_jump': { texture: '_Jump', data: '_Jump_1', legacy: '_Jump' },
        'player_dash': { texture: '_Dash', data: '_Dash_1', legacy: '_Dash' },
        'player_fall': { texture: '_Fall', data: '_Fall_1', legacy: '_Fall' },
        'player_roll': { texture: '_Roll', data: '_Roll_1', legacy: '_Roll' },
        
        // Attack animations
        'player_attack_light': { texture: '_Attack', data: '_Attack_1', legacy: '_Attack' },
        'player_attack_heavy': { texture: '_Attack2', data: '_Attack_2', legacy: '_Attack2' },
        'player_attack_light_static': { texture: '_AttackNoMovement', data: '_AttackNoMovement_1', legacy: '_AttackNoMovement' },
        'player_attack_heavy_static': { texture: '_Attack2NoMovement', data: '_Attack2NoMovement_1', legacy: '_Attack2NoMovement' },
        'player_attack_combo_2': { texture: '_AttackCombo2hit', data: '_AttackCombo2hit_1', legacy: '_AttackCombo2hit' },
        'player_attack_combo_static': { texture: '_AttackComboNoMovement', data: '_AttackComboNoMovement_1', legacy: '_AttackComboNoMovement' },
        
        // Crouch animations
        'player_crouch_idle': { texture: '_CrouchFull', data: '_CrouchFull_1', legacy: '_CrouchFull' },
        'player_crouch_walk': { texture: '_CrouchWalk', data: '_CrouchWalk_1', legacy: '_CrouchWalk' },
        'player_crouch_attack': { texture: '_CrouchAttack', data: '_CrouchAttack_1', legacy: '_CrouchAttack' },
        
        // State animations
        'player_hit': { texture: '_Hit', data: '_Hit_1', legacy: '_Hit' },
        'player_death_static': { texture: '_DeathNoMovement', data: '_DeathNoMovement_1', legacy: '_DeathNoMovement' }
    } as const;

    private createCharacterAnimations(): void {
        console.log(`[DEBUG] createCharacterAnimations called`);
        console.log(`[DEBUG] Checking for animation data files...`);
        
        // Check if character assets are loaded
        const availableTextures = this.scene.textures.getTextureKeys();
        console.log(`[DEBUG] Available textures:`, availableTextures);
        
        // Check if animation data files are loaded
        const availableJson = this.scene.cache.json.entries.entries;
        console.log(`[DEBUG] Available JSON files:`, Object.keys(availableJson));
        
        Object.entries(PlayerSpriteManager.ANIMATION_MAPPINGS).forEach(([semanticKey, config]) => {
            console.log(`[DEBUG] Processing animation: ${semanticKey} -> ${config.data}`);
            
            // Create animations with semantic keys
            if (!this.scene.anims.exists(semanticKey)) {
                console.log(`[DEBUG] Animation '${semanticKey}' does not exist, creating...`);
                const animData = this.scene.cache.json.get(config.data);
                
                if (!animData) {
                    console.warn(`[DEBUG] Animation data not found for ${config.data}`);
                    return;
                }
                
                console.log(`[DEBUG] Found animation data for ${config.data}:`, animData);
                const frameCount = animData.anims[0].frames.length;
                
                // Attack animations should never repeat
                let repeatValue = frameCount === 1 ? 0 : (animData.anims[0].repeat || 0);
                if (semanticKey.includes('attack') || semanticKey.includes('hit') || semanticKey.includes('death')) {
                    repeatValue = 0; // No repeat for attack, hit, or death animations
                }
                
                console.log(`[DEBUG] Creating animation ${semanticKey} (${config.legacy}) with ${frameCount} frames, repeat: ${repeatValue}`);
                
                try {
                    this.scene.anims.create({
                        key: semanticKey,
                        frames: this.scene.anims.generateFrameNumbers(config.texture, { start: 0, end: frameCount - 1 }),
                        frameRate: animData.anims[0].frameRate || 10,
                        repeat: repeatValue
                    });
                    console.log(`[DEBUG] Successfully created animation: ${semanticKey}`);
                } catch (error) {
                    console.error(`[DEBUG] Failed to create animation ${semanticKey}:`, error);
                }
            } else {
                console.log(`[DEBUG] Animation '${semanticKey}' already exists`);
            }
            
            // Also create legacy key for backward compatibility (if different from semantic key)
            if (config.legacy !== semanticKey && !this.scene.anims.exists(config.legacy)) {
                console.log(`[DEBUG] Creating legacy animation: ${config.legacy}`);
                // Create alias animation with same configuration as semantic version
                const animData = this.scene.cache.json.get(config.data);
                if (animData) {
                    const frameCount = animData.anims[0].frames.length;
                    let repeatValue = frameCount === 1 ? 0 : (animData.anims[0].repeat || 0);
                    if (semanticKey.includes('attack') || semanticKey.includes('hit') || semanticKey.includes('death')) {
                        repeatValue = 0;
                    }
                    
                    try {
                        this.scene.anims.create({
                            key: config.legacy,
                            frames: this.scene.anims.generateFrameNumbers(config.texture, { start: 0, end: frameCount - 1 }),
                            frameRate: animData.anims[0].frameRate || 10,
                            repeat: repeatValue
                        });
                        console.log(`[DEBUG] Successfully created legacy animation: ${config.legacy}`);
                    } catch (error) {
                        console.error(`[DEBUG] Failed to create legacy animation ${config.legacy}:`, error);
                    }
                }
            }
        });
        
        console.log(`[DEBUG] createCharacterAnimations completed`);
    }

    // ========================================
    // SPRITE CREATION METHODS
    // ========================================

    /**
     * Get the semantic animation key from legacy key (for backward compatibility)
     * @param legacyKey - The legacy animation key
     * @returns The semantic key or the original key if no mapping exists
     */
    private getSemanticKey(legacyKey: string): string {
        const mapping = Object.entries(PlayerSpriteManager.ANIMATION_MAPPINGS)
            .find(([_, config]) => config.legacy === legacyKey);
        return mapping ? mapping[0] : legacyKey;
    }

    /**
     * Get the legacy animation key from semantic key (for backward compatibility)
     * @param semanticKey - The semantic animation key
     * @returns The legacy key or the original key if no mapping exists
     */
    private getLegacyKey(semanticKey: string): string {
        const config = PlayerSpriteManager.ANIMATION_MAPPINGS[semanticKey as keyof typeof PlayerSpriteManager.ANIMATION_MAPPINGS];
        return config ? config.legacy : semanticKey;
    }

    public createPlayerSprite(x: number, y: number, texture: string = '_Idle'): Phaser.Physics.Arcade.Sprite {
        console.log(`[DEBUG] PlayerSpriteManager.createPlayerSprite called with position (${x}, ${y}), texture: ${texture}`);
        
        try {
            // Check if the texture exists
            if (!this.scene.textures.exists(texture)) {
                console.error(`[DEBUG] Texture '${texture}' does not exist!`);
                console.log(`[DEBUG] Available textures:`, this.scene.textures.getTextureKeys());
                return null;
            }
            
            console.log(`[DEBUG] Texture '${texture}' exists, creating physics sprite`);
            
            // Create the physics-enabled sprite
            const sprite = this.scene.physics.add.sprite(x, y, texture);
            
            if (!sprite) {
                console.error(`[DEBUG] Failed to create physics sprite`);
                return null;
            }
            
            console.log(`[DEBUG] Physics sprite created successfully:`, sprite);
            
            // Set up interactive area for click/touch detection
            sprite.setInteractive({ 
                hitArea: new Phaser.Geom.Rectangle(0, 0, 120, 80), 
                hitAreaCallback: Phaser.Geom.Rectangle.Contains 
            });
            console.log(`[DEBUG] Set up interactivity`);
            
            // Configure sprite display properties
            sprite.setScale(3);
            sprite.setOrigin(0.5, 1); // Center horizontally, bottom vertically for ground alignment
            console.log(`[DEBUG] Set scale and origin`);
            
            // Configure physics body
            if (sprite.body) {
                const body = sprite.body as Phaser.Physics.Arcade.Body;
                body.setGravityY(10000);           // Reasonable gravity
                body.setSize(30, 40);            // Collision box size
                body.setOffset(45, 40);          // Center the collision box
                body.setCollideWorldBounds(true); // Keep player in bounds
                body.setBounce(0.1);             // Small bounce on landing
                body.setDragX(200);              // Air resistance for horizontal movement
                console.log(`[DEBUG] Configured physics body`);
            } else {
                console.warn(`[DEBUG] Sprite body is null, physics not configured`);
            }
            
            // Initialize sprite data
            sprite.setData('currentState', 'idle');
            console.log(`[DEBUG] Set sprite data`);
            
            // Start with idle animation
            console.log(`[DEBUG] Playing idle animation`);
            this.playIdleAnimation(sprite);
            
            console.log(`[DEBUG] PlayerSpriteManager.createPlayerSprite completed successfully`);
            return sprite;
        } catch (error) {
            console.error(`[DEBUG] Error in PlayerSpriteManager.createPlayerSprite:`, error);
            console.error(`[DEBUG] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
            return null;
        }
    }

    // ========================================
    // ANIMATION PLAYBACK METHODS
    // ========================================

    /**
     * Shared helper method for playing animations with consistent state management
     * @param sprite - The sprite to animate
     * @param animationKey - The animation key to play
     * @param state - The state to set on the sprite
     * @param options - Optional configuration for the animation
     */
    private playAnimationWithReset(
        sprite: Phaser.Physics.Arcade.Sprite, 
        animationKey: string, 
        state: string,
        options: {
            frameRate?: number;
            repeat?: number;
            onComplete?: () => void;
            timeoutBuffer?: number; // Buffer time added to animation duration for fallback
            resetToIdle?: boolean;
            setAttackingFlag?: boolean;
            stopCurrentAnimation?: boolean;
        } = {}
    ): void {
        const {
            frameRate,
            repeat = 0,
            onComplete,
            timeoutBuffer = 100, // Default 100ms buffer
            resetToIdle = false,
            setAttackingFlag = false,
            stopCurrentAnimation = false
        } = options;

        try {
            // Stop current animation if requested
            if (stopCurrentAnimation && sprite.anims.currentAnim) {
                sprite.anims.stop();
                sprite.off('animationcomplete');
            }

            // Small delay for attack animations to ensure proper processing
            const playAnimation = () => {
                if (sprite && sprite.active) {
                    const animConfig: any = { key: animationKey, repeat };
                    if (frameRate) animConfig.frameRate = frameRate;
                    sprite.play(animConfig);
                }
            };

            if (stopCurrentAnimation) {
                this.scene.time.delayedCall(10, playAnimation);
            } else {
                sprite.anims.play(animationKey, true);
            }

            // Set sprite state and data
            sprite.setData('currentState', state);
            if (setAttackingFlag) {
                sprite.setData('isAttacking', true);
            }

            // Handle animation completion
            if (onComplete || resetToIdle || setAttackingFlag) {
                sprite.once('animationcomplete', () => {
                    if (sprite && sprite.active) {
                        console.log(`${animationKey} animation completed`);
                        
                        if (setAttackingFlag) {
                            sprite.setData('isAttacking', false);
                        }
                        
                        if (onComplete) {
                            onComplete();
                        }
                        
                        if (resetToIdle) {
                            this.playIdleAnimation(sprite);
                        }
                    }
                });

                // Dynamic fallback timeout based on actual animation duration
                if (onComplete || setAttackingFlag) {
                    // Calculate timeout after animation starts to get accurate duration
                    this.scene.time.delayedCall(50, () => {
                        if (sprite && sprite.active) {
                            let animDuration: number;
                            
                            // Try to get duration from current animation, fallback to calculated duration
                            if (sprite.anims.currentAnim && sprite.anims.currentAnim.duration) {
                                animDuration = sprite.anims.currentAnim.duration;
                            } else {
                                animDuration = this.calculateAnimationDuration(animationKey, frameRate);
                            }
                            
                            const timeoutDuration = animDuration + timeoutBuffer;
                            
                            console.log(`Setting fallback timeout for ${animationKey}: ${timeoutDuration}ms (duration: ${animDuration}ms + buffer: ${timeoutBuffer}ms)`);
                            
                            this.scene.time.delayedCall(timeoutDuration, () => {
                                if (sprite && sprite.active) {
                                    console.log(`${animationKey} animation timeout (${timeoutDuration}ms)`);
                                    
                                    if (setAttackingFlag) {
                                        sprite.setData('isAttacking', false);
                                    }
                                    
                                    if (onComplete) {
                                        onComplete();
                                    }
                                }
                            });
                        }
                    });
                }
            }

        } catch (error) {
            console.error(`Failed to play ${animationKey} animation:`, error);
            if (onComplete) {
                onComplete();
            }
        }
    }

    public playIdleAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        console.log(`[DEBUG] playIdleAnimation called for sprite:`, sprite);
        console.log(`[DEBUG] Attempting to play 'player_idle' animation`);
        this.playAnimationWithReset(sprite, 'player_idle', 'idle');
    }

    public playWalkingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        if (sprite.getData('currentState') !== 'walking') {
            this.playAnimationWithReset(sprite, 'player_run', 'walking');
        }
    }

    public playSprintingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        if (sprite.getData('currentState') !== 'sprinting') {
            this.playAnimationWithReset(sprite, 'player_run', 'sprinting');
        }
    }

    public playJumpingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_jump', 'jumping');
    }

    public playAttackingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_attack_light', 'attacking', {
            frameRate: 12,
            repeat: 0,
            stopCurrentAnimation: true,
            onComplete: () => {
                if (this.onLightAttackCompleteCallback) {
                    this.onLightAttackCompleteCallback();
                }
            },
            timeoutBuffer: 50 // Shorter buffer for light attacks to allow spam
        });
    }

    public playDashingAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_dash', 'dashing');
    }

    public playAttack2Animation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_attack_heavy', 'attacking', {
            frameRate: 12,
            repeat: 0,
            stopCurrentAnimation: true,
            onComplete: () => {
                if (this.onHeavyAttackCompleteCallback) {
                    this.onHeavyAttackCompleteCallback();
                }
            },
            timeoutBuffer: 150 // Longer buffer for heavy attacks
        });
    }

    public playAttackNoMovementAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_attack_light_static', 'attacking', {
            setAttackingFlag: true,
            resetToIdle: true
        });
    }

    public playAttack2NoMovementAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_attack_heavy_static', 'attacking', {
            setAttackingFlag: true,
            resetToIdle: true
        });
    }

    public playAttackCombo2hitAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_attack_combo_2', 'attacking', {
            setAttackingFlag: true,
            resetToIdle: true
        });
    }

    public playAttackComboNoMovementAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_attack_combo_static', 'attacking', {
            setAttackingFlag: true,
            resetToIdle: true
        });
    }

    public playCrouchAttackAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_crouch_attack', 'attacking', {
            setAttackingFlag: true,
            resetToIdle: true
        });
    }

    public playCrouchFullAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_crouch_idle', 'crouching');
    }

    public playCrouchWalkAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_crouch_walk', 'crouch-walking');
    }

    public playDeathAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_death_static', 'dead');
    }

    public playDeathNoMovementAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_death_static', 'dead');
    }

    public playFallAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_fall', 'falling');
    }

    public playHitAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_hit', 'hit');
        
        // Dynamically calculate delay based on hit animation duration
        const hitAnimDuration = this.calculateAnimationDuration('player_hit');
        const delayBeforeIdle = hitAnimDuration + 100; // Small buffer after hit animation
        
        console.log(`Hit animation duration: ${hitAnimDuration}ms, returning to idle after: ${delayBeforeIdle}ms`);
        
        this.scene.time.delayedCall(delayBeforeIdle, () => {
            if (sprite && sprite.active) {
                this.playIdleAnimation(sprite);
            }
        });
    }

    public playRollAnimation(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.playAnimationWithReset(sprite, 'player_roll', 'rolling', {
            resetToIdle: true
        });
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    /**
     * Calculate the duration of an animation in milliseconds
     * @param animationKey - The animation key to calculate duration for
     * @param frameRate - Optional frame rate override
     * @returns Duration in milliseconds
     */
    private calculateAnimationDuration(animationKey: string, frameRate?: number): number {
        const animation = this.scene.anims.get(animationKey);
        if (!animation) {
            console.warn(`Animation ${animationKey} not found, using default duration`);
            return 300; // Default fallback
        }

        const frames = animation.frames.length;
        const rate = frameRate || animation.frameRate;
        const duration = (frames / rate) * 1000; // Convert to milliseconds
        
        console.log(`Animation ${animationKey}: ${frames} frames at ${rate}fps = ${duration}ms`);
        return duration;
    }

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
        // Test semantic animation keys
        const semanticKeys = Object.keys(PlayerSpriteManager.ANIMATION_MAPPINGS);
        
        console.log('Animation availability check (Semantic Keys):');
        semanticKeys.forEach(animKey => {
            const exists = sprite.anims.animationManager.get(animKey) ? '✓' : '✗';
            console.log(`${exists} ${animKey}`);
        });
        
        console.log('\nLegacy compatibility check:');
        Object.values(PlayerSpriteManager.ANIMATION_MAPPINGS).forEach(config => {
            const exists = sprite.anims.animationManager.get(config.legacy) ? '✓' : '✗';
            console.log(`${exists} ${config.legacy} (legacy)`);
        });
    }

    /**
     * Get all available animation keys (both semantic and legacy)
     * @returns Object containing arrays of semantic and legacy keys
     */
    public getAvailableAnimations(): { semantic: string[], legacy: string[] } {
        const semantic = Object.keys(PlayerSpriteManager.ANIMATION_MAPPINGS);
        const legacy = Object.values(PlayerSpriteManager.ANIMATION_MAPPINGS).map(config => config.legacy);
        
        return { semantic, legacy };
    }

    /**
     * Search for animations by category (useful for filtering)
     * @param category - The category to search for (e.g., 'attack', 'crouch', 'player')
     * @returns Array of matching semantic animation keys
     */
    public getAnimationsByCategory(category: string): string[] {
        return Object.keys(PlayerSpriteManager.ANIMATION_MAPPINGS)
            .filter(key => key.includes(category.toLowerCase()));
    }

    /**
     * Get animation information for debugging/development
     * @param animationKey - The animation key (semantic or legacy)
     * @returns Animation info object or null if not found
     */
    public getAnimationInfo(animationKey: string): { 
        semanticKey: string, 
        legacyKey: string, 
        texture: string, 
        data: string 
    } | null {
        // Check if it's a semantic key
        const semanticConfig = PlayerSpriteManager.ANIMATION_MAPPINGS[animationKey as keyof typeof PlayerSpriteManager.ANIMATION_MAPPINGS];
        if (semanticConfig) {
            return {
                semanticKey: animationKey,
                legacyKey: semanticConfig.legacy,
                texture: semanticConfig.texture,
                data: semanticConfig.data
            };
        }
        
        // Check if it's a legacy key
        const semanticEntry = Object.entries(PlayerSpriteManager.ANIMATION_MAPPINGS)
            .find(([_, config]) => config.legacy === animationKey);
        
        if (semanticEntry) {
            const [semantic, config] = semanticEntry;
            return {
                semanticKey: semantic,
                legacyKey: animationKey,
                texture: config.texture,
                data: config.data
            };
        }
        
        return null;
    }
}
