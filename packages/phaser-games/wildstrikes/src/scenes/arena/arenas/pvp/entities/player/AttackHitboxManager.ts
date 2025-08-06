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
     * Render a hitbox based on server-validated attack data
     */
    renderServerValidatedAttack(serverData: {
        attackType: 'light' | 'heavy';
        position: { x: number; y: number; facing: 'left' | 'right' };
        isHit: boolean;
        timestamp: number;
    }): void {
        console.log('[HITBOX] 🎯 Rendering server-validated attack:', serverData);

        // Use server position instead of client position
        const serverX = serverData.position.x;
        const serverY = serverData.position.y;
        const facing = serverData.position.facing;

       // Create hitbox data based on server validation
        const hitboxData: HitboxData = serverData.attackType === 'light' ? {
            id: `server_light_${serverData.timestamp}`,
            type: 'light',
            damage: 15,
            knockbackForce: 200,
            knockbackAngle: 45,
            // ✅ Match server: Light = 150px range
            width: 80, 
            height: 60,
            duration: 200,
            offsetX: facing === 'left' ? -75 : 75, // Half of width
            offsetY: -10,
            color: serverData.isHit ? 0x00ff00 : 0xff4444,
            alpha: serverData.isHit ? 0.8 : 0.4
        } : {
            id: `server_heavy_${serverData.timestamp}`,
            type: 'heavy',
            damage: 25,
            knockbackForce: 400,
            knockbackAngle: 60,
            // ✅ Match server: Heavy = 80px range
            width: 150,   // Reduced from 120
            height: 80,
            duration: 400,
            offsetX: facing === 'left' ? -40 : 40, // Half of width
            offsetY: -20,
            color: serverData.isHit ? 0x00ff00 : 0xff8800,
            alpha: serverData.isHit ? 0.8 : 0.5
        };

        // Calculate world position using SERVER position
        const worldX = serverX + hitboxData.offsetX;
        const worldY = serverY + hitboxData.offsetY;

        // ✅ Create visual-only hitbox (no physics body needed since server already validated)
        const visualHitbox: AttackHitbox = {
            ...hitboxData,
            body: null as any, // No physics body needed for visual-only hitboxes
            startTime: this.scene.time.now,
            isActive: true,
            worldX: worldX,
            worldY: worldY
        };

        // Store and draw the server-validated hitbox
        this.activeHitboxes.set(hitboxData.id, visualHitbox);
        this.drawHitbox(visualHitbox);

        // Schedule cleanup
        this.scene.time.delayedCall(hitboxData.duration, () => {
            this.removeHitbox(hitboxData.id);
        });

        console.log(`[HITBOX] ✅ Server-validated ${hitboxData.type} attack rendered at (${worldX}, ${worldY})`);
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
            
            // ✅ Check if body exists before trying to destroy it
            if (hitbox.body && hitbox.body.destroy) {
                // Remove physics body only if it exists
                this.hitboxGroup.remove(hitbox.body);
                hitbox.body.destroy();
            }
            
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
