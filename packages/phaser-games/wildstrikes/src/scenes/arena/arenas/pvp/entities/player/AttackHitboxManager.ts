/**
 * Manages visual hitboxes for player attacks
 * Handles hitbox creation, positioning, timing, and visual effects
 */
export class AttackHitboxManager {
    private scene: Phaser.Scene;
    private player: Phaser.Physics.Arcade.Sprite;
    private hitboxGraphics: Phaser.GameObjects.Graphics | null = null;
    private hitboxGroup: Phaser.Physics.Arcade.Group;
    private activeHitboxes: Map<string, AttackHitbox> = new Map();
    private opponentPlayer: Phaser.Physics.Arcade.Sprite | null = null;

    // Add this property near the top of the class
    private debugMode: boolean = true;
    private networkManager: any;

    constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite) {
        this.scene = scene;
        this.player = player;
        
        // Create a physics group for hitboxes
        this.hitboxGroup = this.scene.physics.add.group();
        
        // Create graphics object for visual debugging
        this.hitboxGraphics = this.scene.add.graphics();
        this.hitboxGraphics.setDepth(1000); // Render on top
        
        // Enable physics debugging if in debug mode
        if (this.debugMode && this.scene.physics.world.drawDebug) {
            this.scene.physics.world.debugGraphic.setVisible(true);
        }
    }

    /**
     * Set the opponent player for collision detection
     */
    setOpponentPlayer(opponent: Phaser.Physics.Arcade.Sprite): void {
        this.opponentPlayer = opponent;
        
        // FIXED: Improved overlap detection with debug logging
        if (this.hitboxGroup && opponent && opponent.body) {
            console.log("[HITBOX] Setting up collision between hitboxes and opponent", {
                opponentPosition: { x: opponent.x, y: opponent.y },
                opponentBodySize: { 
                    width: (opponent.body as Phaser.Physics.Arcade.Body).width, 
                    height: (opponent.body as Phaser.Physics.Arcade.Body).height 
                },
                hitboxGroupActive: this.hitboxGroup.countActive(true)
            });
            
            // Remove any existing overlap callbacks to prevent duplicates
            const existingColliders = this.scene.physics.world.colliders.getActive()
                .filter(collider => 
                    collider.object1 === this.hitboxGroup || 
                    collider.object2 === this.hitboxGroup);
            
            if (existingColliders.length > 0) {
                console.log(`[HITBOX] Removing ${existingColliders.length} existing colliders`);
                existingColliders.forEach(collider => collider.destroy());
            }
            
            // Add new overlap detection
            this.scene.physics.add.overlap(
                this.hitboxGroup,
                opponent,
                (hitboxObj: any, opponentObj: any) => {
                    console.log("[HITBOX] ⚡ Overlap detected between hitbox and opponent!", {
                        hitboxPosition: { x: hitboxObj.x, y: hitboxObj.y },
                        opponentPosition: { x: opponentObj.x, y: opponentObj.y }
                    });
                    this.handleHitCollision(hitboxObj, opponentObj);
                },
                undefined, // No custom process callback
                this  // Context
            );
            
            console.log("[HITBOX] ✅ Collision detection setup complete");
        } else {
            console.warn("[HITBOX] Could not set up collision - missing hitboxGroup or opponent");
        }
    }

    /**
     * Handle collision between hitbox and opponent
     */
    private handleHitCollision(hitboxBody: Phaser.Physics.Arcade.Sprite, opponent: Phaser.Physics.Arcade.Sprite): void {
        // Find the hitbox data associated with this physics body
        const hitbox = Array.from(this.activeHitboxes.values()).find(h => h.body === hitboxBody);
        
        if (hitbox && hitbox.isActive) {
            console.log("[HITBOX] ⚡ Attack hit detected locally!", {
                hitboxType: hitbox.type,
                damage: hitbox.damage,
                knockbackForce: hitbox.knockbackForce,
                hitboxId: hitbox.id
            });
            
            // Mark hitbox as inactive to prevent multiple hits from same attack
            hitbox.isActive = false;
            
            // TODO: Send hit event to server here
            // this.networkManager?.sendHitEvent(hitbox, opponent);
            
            // Remove hitbox immediately after hit
            this.removeHitbox(hitbox.id);
        }
    }

    /**
     * Create a light attack hitbox
     */
    createLightAttackHitbox(): AttackHitbox {
        const hitboxData: HitboxData = {
            id: `light_attack_${Date.now()}`,
            type: 'light' as const,
            damage: 15,
            knockbackForce: 200,
            knockbackAngle: 45,
            width: 80,
            height: 60,
            duration: 200, // ms
            offsetX: this.player.flipX ? -60 : 60, // Offset from player center
            offsetY: -10,
            color: 0xff4444, // Red for light attacks
            alpha: 0.6
        };

        return this.createHitbox(hitboxData);
    }

    /**
     * Create a heavy attack hitbox
     */
    createHeavyAttackHitbox(): AttackHitbox {
        const hitboxData: HitboxData = {
            id: `heavy_attack_${Date.now()}`,
            type: 'heavy' as const,
            damage: 25,
            knockbackForce: 400,
            knockbackAngle: 60,
            width: 120,
            height: 80,
            duration: 400, // ms
            offsetX: this.player.flipX ? -80 : 80,
            offsetY: -20,
            color: 0xff8800, // Orange for heavy attacks
            alpha: 0.7
        };

        return this.createHitbox(hitboxData);
    }

    /**
     * Create a hitbox with the given parameters
     */
    private createHitbox(data: HitboxData): AttackHitbox {
        // Calculate world position
        const worldX = this.player.x + data.offsetX;
        const worldY = this.player.y + data.offsetY;

        // Create physics body for collision detection
        const hitboxBody = this.scene.physics.add.sprite(worldX, worldY, null);
        hitboxBody.setVisible(false); // Only the visual representation should be visible
        
        // FIXED: Configure physics body properly for Arcade Physics
        if (hitboxBody.body) {
            const body = hitboxBody.body as Phaser.Physics.Arcade.Body;
            body.setSize(data.width, data.height);
            body.setOffset(-data.width / 2, -data.height / 2); // Center the hitbox
            body.enable = true;
            body.debugShowBody = this.debugMode; // Only show debug in debug mode
            body.debugBodyColor = 0xff0000;
            
            // Make hitbox a sensor (doesn't affect physics but detects overlaps)
            body.setImmovable(true);
            hitboxBody.body.pushable = false;
        }
        
        // Add to hitbox group
        this.hitboxGroup.add(hitboxBody);

        // Ensure collision detection is set up for this hitbox if opponent exists
        if (this.opponentPlayer && this.opponentPlayer.body) {
            console.log(`[HITBOX] ⚡ Setting up individual collision for ${data.type} hitbox`);
            this.scene.physics.add.overlap(
                hitboxBody,
                this.opponentPlayer,
                (hitboxObj: any, opponentObj: any) => {
                    console.log("[HITBOX] ⚡ Individual overlap detected!", {
                        hitboxType: data.type,
                        hitboxPosition: { x: hitboxObj.x, y: hitboxObj.y },
                        opponentPosition: { x: opponentObj.x, y: opponentObj.y }
                    });
                    this.handleHitCollision(hitboxObj, opponentObj);
                },
                undefined,
                this
            );
        }

        const hitbox: AttackHitbox = {
            id: data.id,
            type: data.type,
            body: hitboxBody,
            damage: data.damage,
            knockbackForce: data.knockbackForce,
            knockbackAngle: data.knockbackAngle,
            width: data.width,
            height: data.height,
            startTime: this.scene.time.now,
            duration: data.duration,
            isActive: true,
            color: data.color,
            alpha: data.alpha,
            worldX: worldX,
            worldY: worldY
        };

        // Store the hitbox
        this.activeHitboxes.set(data.id, hitbox);

        // Draw visual representation
        this.drawHitbox(hitbox);

        // Schedule cleanup
        this.scene.time.delayedCall(data.duration, () => {
            this.removeHitbox(data.id);
        });

        console.log(`[HITBOX] Created ${data.type} attack hitbox at (${worldX}, ${worldY})`, {
            hitboxData: data,
            playerPosition: { x: this.player.x, y: this.player.y },
            playerFlipX: this.player.flipX,
            worldPosition: { x: worldX, y: worldY },
            hasOpponent: !!this.opponentPlayer,
            opponentPosition: this.opponentPlayer ? { x: this.opponentPlayer.x, y: this.opponentPlayer.y } : null
        });
        return hitbox;
    }

    /**
     * Draw visual representation of hitbox - don't clear, just add to existing graphics
     */
    private drawHitbox(hitbox: AttackHitbox): void {
        if (!this.hitboxGraphics) return;

        // Draw the specific hitbox (don't clear all graphics)
        this.hitboxGraphics.fillStyle(hitbox.color, hitbox.alpha);
        this.hitboxGraphics.fillRect(
            hitbox.worldX - hitbox.width / 2,
            hitbox.worldY - hitbox.height / 2,
            hitbox.width,
            hitbox.height
        );

        // Draw border
        this.hitboxGraphics.lineStyle(2, hitbox.color, 1.0);
        this.hitboxGraphics.strokeRect(
            hitbox.worldX - hitbox.width / 2,
            hitbox.worldY - hitbox.height / 2,
            hitbox.width,
            hitbox.height
        );
    }

    /**
     * Update hitbox positions (if needed for moving attacks)
     */
    update(): void {
        const currentTime = this.scene.time.now;

        // Update active hitboxes
        this.activeHitboxes.forEach((hitbox, id) => {
            if (hitbox.isActive) {
                // Check if hitbox has expired
                if (currentTime - hitbox.startTime >= hitbox.duration) {
                    this.removeHitbox(id);
                    return;
                }
                
                // Only use manual overlap check if automatic collision detection fails
                // Comment this out to rely on Phaser's automatic collision detection
                // if (this.debugMode && this.opponentPlayer) {
                //     this.manualOverlapCheck(hitbox);
                // }
            }
        });

        // Redraw hitboxes if any are active
        if (this.activeHitboxes.size > 0) {
            this.redrawAllHitboxes();
        }
    }

    /**
     * Manual overlap check for debugging purposes - now prevents duplicate hits
     */
    private manualOverlapCheck(hitbox: AttackHitbox): void {
        if (!this.opponentPlayer || !this.opponentPlayer.body || !hitbox.isActive) return;
        
        const hitboxBounds = {
            left: hitbox.worldX - hitbox.width / 2,
            right: hitbox.worldX + hitbox.width / 2,
            top: hitbox.worldY - hitbox.height / 2,
            bottom: hitbox.worldY + hitbox.height / 2
        };
        
        const opponentBody = this.opponentPlayer.body as Phaser.Physics.Arcade.Body;
        const opponentBounds = {
            left: opponentBody.x,
            right: opponentBody.x + opponentBody.width,
            top: opponentBody.y,
            bottom: opponentBody.y + opponentBody.height
        };
        
        const isOverlapping = !(
            hitboxBounds.right < opponentBounds.left ||
            hitboxBounds.left > opponentBounds.right ||
            hitboxBounds.bottom < opponentBounds.top ||
            hitboxBounds.top > opponentBounds.bottom
        );
        
        if (isOverlapping && hitbox.isActive) {
            console.log("[HITBOX] 🎯 Manual overlap detected!", {
                hitboxBounds,
                opponentBounds,
                hitboxId: hitbox.id,
                hitboxType: hitbox.type
            });
            
            // Trigger hit collision manually if automatic detection failed
            this.handleHitCollision(hitbox.body, this.opponentPlayer);
        }
    }

    /**
     * Redraw all active hitboxes
     */
    private redrawAllHitboxes(): void {
        if (!this.hitboxGraphics) return;

        this.hitboxGraphics.clear();

        this.activeHitboxes.forEach(hitbox => {
            if (hitbox.isActive) {
                // Add pulsing effect based on time
                const timeRatio = (this.scene.time.now - hitbox.startTime) / hitbox.duration;
                const pulseAlpha = hitbox.alpha * (1 - timeRatio * 0.5); // Fade out over time

                this.hitboxGraphics!.fillStyle(hitbox.color, pulseAlpha);
                this.hitboxGraphics!.fillRect(
                    hitbox.worldX - hitbox.width / 2,
                    hitbox.worldY - hitbox.height / 2,
                    hitbox.width,
                    hitbox.height
                );

                // Draw border
                this.hitboxGraphics!.lineStyle(2, hitbox.color, 1.0);
                this.hitboxGraphics!.strokeRect(
                    hitbox.worldX - hitbox.width / 2,
                    hitbox.worldY - hitbox.height / 2,
                    hitbox.width,
                    hitbox.height
                );
            }
        });
    }

    /**
     * Remove a hitbox by ID
     */
    private removeHitbox(id: string): void {
        const hitbox = this.activeHitboxes.get(id);
        if (hitbox) {
            hitbox.isActive = false;
            
            // Remove physics body
            this.hitboxGroup.remove(hitbox.body);
            hitbox.body.destroy();
            
            // Remove from active hitboxes
            this.activeHitboxes.delete(id);
            
            console.log(`[HITBOX] Removed hitbox: ${id}`);
        }

        // Redraw all remaining hitboxes (clear and redraw)
        if (this.activeHitboxes.size > 0) {
            this.redrawAllHitboxes();
        } else if (this.hitboxGraphics) {
            // Clear graphics if no more active hitboxes
            this.hitboxGraphics.clear();
        }
    }

    /**
     * Get all active hitboxes
     */
    getActiveHitboxes(): AttackHitbox[] {
        return Array.from(this.activeHitboxes.values()).filter(h => h.isActive);
    }

    /**
     * Get the hitbox physics group for collision detection
     */
    getHitboxGroup(): Phaser.Physics.Arcade.Group {
        return this.hitboxGroup;
    }

    /**
     * Get debug information about collision setup
     */
    getCollisionDebugInfo(): any {
        return {
            hasOpponentPlayer: !!this.opponentPlayer,
            opponentPosition: this.opponentPlayer ? { x: this.opponentPlayer.x, y: this.opponentPlayer.y } : null,
            activeHitboxCount: this.activeHitboxes.size,
            hitboxGroupSize: this.hitboxGroup ? this.hitboxGroup.countActive(true) : 0,
            activeColliders: this.scene.physics.world.colliders.getActive().length,
            debugMode: this.debugMode
        };
    }

    /**
     * Force check all active hitboxes for overlaps (debugging method)
     */
    forceCheckOverlaps(): void {
        console.log('[HITBOX] 🔍 Force checking overlaps for all active hitboxes');
        this.activeHitboxes.forEach((hitbox, id) => {
            if (hitbox.isActive && this.opponentPlayer) {
                this.manualOverlapCheck(hitbox);
            }
        });
    }

    /**
     * Clean up all hitboxes and graphics
     */
    destroy(): void {
        // Remove all active hitboxes
        this.activeHitboxes.forEach((hitbox, id) => {
            this.removeHitbox(id);
        });
        
        // Clean up graphics
        if (this.hitboxGraphics) {
            this.hitboxGraphics.destroy();
            this.hitboxGraphics = null;
        }

        // Clean up physics group
        this.hitboxGroup.destroy();
        
        console.log('[HITBOX] AttackHitboxManager destroyed');
    }

    // Add to constructor or create a setter method
    public setNetworkManager(networkManager: any): void {
        this.networkManager = networkManager;
    }
}

// Type definitions
interface HitboxData {
    id: string;
    type: 'light' | 'heavy';
    damage: number;
    knockbackForce: number;
    knockbackAngle: number;
    width: number;
    height: number;
    duration: number;
    offsetX: number;
    offsetY: number;
    color: number;
    alpha: number;
}

export interface AttackHitbox {
    id: string;
    type: 'light' | 'heavy';
    body: Phaser.Physics.Arcade.Sprite;
    damage: number;
    knockbackForce: number;
    knockbackAngle: number;
    width: number;
    height: number;
    startTime: number;
    duration: number;
    isActive: boolean;
    color: number;
    alpha: number;
    worldX: number;
    worldY: number;
}
