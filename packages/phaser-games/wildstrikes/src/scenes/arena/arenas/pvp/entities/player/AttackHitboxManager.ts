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

    constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite) {
        this.scene = scene;
        this.player = player;
        
        // Create a physics group for hitboxes
        this.hitboxGroup = this.scene.physics.add.group();
        
        // Create graphics object for visual debugging
        this.hitboxGraphics = this.scene.add.graphics();
        this.hitboxGraphics.setDepth(1000); // Render on top
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
        hitboxBody.body.setSize(data.width, data.height);
        
        // Add to hitbox group
        this.hitboxGroup.add(hitboxBody);

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

        console.log(`[HITBOX] Created ${data.type} attack hitbox at (${worldX}, ${worldY})`);
        return hitbox;
    }

    /**
     * Draw visual representation of hitbox
     */
    private drawHitbox(hitbox: AttackHitbox): void {
        if (!this.hitboxGraphics) return;

        // Clear previous drawings
        this.hitboxGraphics.clear();

        // Draw all active hitboxes
        this.activeHitboxes.forEach(hb => {
            if (hb.isActive) {
                this.hitboxGraphics!.fillStyle(hb.color, hb.alpha);
                this.hitboxGraphics!.fillRect(
                    hb.worldX - hb.width / 2,
                    hb.worldY - hb.height / 2,
                    hb.width,
                    hb.height
                );

                // Draw border
                this.hitboxGraphics!.lineStyle(2, hb.color, 1.0);
                this.hitboxGraphics!.strokeRect(
                    hb.worldX - hb.width / 2,
                    hb.worldY - hb.height / 2,
                    hb.width,
                    hb.height
                );
            }
        });
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
                }
            }
        });

        // Redraw hitboxes if any are active
        if (this.activeHitboxes.size > 0) {
            this.redrawAllHitboxes();
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

        // Clear graphics if no more active hitboxes
        if (this.activeHitboxes.size === 0 && this.hitboxGraphics) {
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
