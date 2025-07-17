export class ArenaPlayer {
    private scene: Phaser.Scene;
    private jumpCount: number = 0;
    private maxJumps: number = 2;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public createPlayerSprite(
        x: number,
        y: number,
        texture: string = "_Idle_Idle",
        frame: number = 0
    ): Phaser.Physics.Arcade.Sprite {
        console.log(`Creating player sprite at (${x}, ${y}) with texture: ${texture}`);
        
        const sprite = this.scene.physics.add.sprite(x, y, texture, frame);
        
        if (!sprite) {
            console.error("Failed to create sprite");
            throw new Error("Failed to create sprite");
        }
        
        console.log("Sprite created successfully:", sprite);
        
        // Set interactive area without showing debug hitbox
        sprite.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(0, 0, 120, 80),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: false,
            debug: false
        });
        
        sprite.scaleX = 5;
        sprite.scaleY = 5;
        sprite.setOrigin(0, 0);
        
        if (sprite.body) {
            sprite.body.gravity.y = 10000;
            sprite.body.setOffset(45, 40);
            sprite.body.setSize(30, 40, false);
            console.log("Sprite physics body configured");
        } else {
            console.error("Sprite body is null");
        }
        
        // Initialize attacking flag
        sprite.setData('isAttacking', false);
        
        // Set player sprite depth to appear above background but below UI
        sprite.setDepth(1);
        
        console.log("Player sprite created and configured successfully");
        return sprite;
    }

    public configurePlayerSprite(sprite: Phaser.Physics.Arcade.Sprite): void {
        if (!sprite) {
            console.error("Cannot configure null sprite");
            return;
        }
        
        console.log("Configuring player sprite:", sprite);
        
        // Set interactive area without showing debug hitbox
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
            console.log("Sprite physics body configured");
        } else {
            console.error("Sprite body is null");
        }

        // Disable automatic animation complete callbacks
        sprite.setData("autoPlayIdleOnComplete", false);

        // Play initial animation
        if (sprite && sprite.anims && sprite.texture) {
            try {
                sprite.anims.play("_Idle_Idle", true);
                console.log("Initial animation played successfully");
            } catch (error) {
                console.error("Failed to play initial animation:", error);
            }
        } else {
            console.error("Sprite missing required components for animation");
        }
    }

    public isSpriteAnimationSafe(sprite: Phaser.Physics.Arcade.Sprite | undefined): boolean {
        return !!(sprite && 
                 sprite.active && 
                 sprite.texture && 
                 sprite.anims);
    }

    public performAttack(sprite: Phaser.Physics.Arcade.Sprite): boolean {
        if (sprite?.getData('isAttacking')) {
            console.log("Already attacking");
            return false;
        }
        
        // Check for animation conflicts
        if (sprite?.anims?.isPlaying && 
            sprite.anims.currentAnim?.key === "_Attack2") {
            console.log("Attack animation already playing");
            return false;
        }
        
        // Set attacking flag FIRST to prevent movement animations from interfering
        sprite.setData('isAttacking', true);
        
        // Play attack animation with specific parameters like backup
        try {
            // Stop any current animation before playing attack
            if (sprite.anims.currentAnim) {
                sprite.anims.stop();
            }
            
            // Add a small delay to ensure the attacking flag is processed before animation starts
            this.scene.time.delayedCall(10, () => {
                if (sprite && sprite.active) {
                    sprite.play({
                        key: "_Attack2",
                        frameRate: 15, // Increased from 12 to 15 for rapid spam attacks
                        repeat: 0,
                    });
                }
            });
            
            // Clear any existing animation complete listeners to prevent conflicts
            sprite.off('animationcomplete');
            
            // Reset attacking flag when animation completes
            sprite.once('animationcomplete', () => {
                if (sprite && sprite.active) {
                    sprite.setData('isAttacking', false);
                    console.log("Attack animation completed, clearing attacking flag");
                }
            });
            
            // Fallback timeout to clear attacking flag if animation doesn't complete
            this.scene.time.delayedCall(300, () => { // Reduced from 400ms to 300ms for spam attacks
                if (sprite && sprite.active && sprite.getData('isAttacking')) {
                    console.log("Attack animation timeout, clearing attacking flag");
                    sprite.setData('isAttacking', false);
                }
            });
            
            return true;
        } catch (error) {
            console.error("Failed to play attack animation:", error);
            sprite.setData('isAttacking', false);
            return false;
        }
    }

    public handleJump(sprite: Phaser.Physics.Arcade.Sprite): boolean {
        if (!sprite || !sprite.body) return false;

        const onGround = sprite.body.touching.down || sprite.body.blocked.down;
        
        if (onGround) {
            this.jumpCount = 0;
        }
        
        if (this.jumpCount < this.maxJumps) {
            sprite.body.velocity.y = -2000;
            this.jumpCount++;
            return true;
        }
        
        return false;
    }

    public getJumpCount(): number {
        return this.jumpCount;
    }

    public resetJumpCount(): void {
        this.jumpCount = 0;
    }

    public constrainPlayerToCameraBounds(sprite: Phaser.Physics.Arcade.Sprite): boolean {
        if (!sprite || !sprite.body) {
            return false;
        }
        
        // Get world bounds
        const worldBounds = this.scene.physics.world.bounds;
        
        // Add some padding (5% of width/height)
        const paddingX = worldBounds.width * 0.05;
        const paddingY = worldBounds.height * 0.05;
        
        let wasConstrained = false;
        
        // Left constraint
        if (sprite.x < worldBounds.x + paddingX) {
            sprite.x = worldBounds.x + paddingX;
            sprite.body.velocity.x = Math.max(0, sprite.body.velocity.x);
            wasConstrained = true;
        }
        
        // Right constraint
        if (sprite.x > worldBounds.width - paddingX) {
            sprite.x = worldBounds.width - paddingX;
            sprite.body.velocity.x = Math.min(0, sprite.body.velocity.x);
            wasConstrained = true;
        }
        
        // Top constraint (prevent going too high)
        if (sprite.y < worldBounds.y + paddingY) {
            sprite.y = worldBounds.y + paddingY;
            sprite.body.velocity.y = Math.max(0, sprite.body.velocity.y);
            wasConstrained = true;
        }
        
        // Bottom constraint is handled by platform collision
        
        return wasConstrained;
    }

    public destroy(): void {
        // Reset state
        this.jumpCount = 0;
    }
}
