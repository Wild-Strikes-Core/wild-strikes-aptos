import { battleSocketClient } from "@phaser-games/wildstrikes/src/shared-utils/BattleSocketClient";
import { PlayerState } from "./PlayerState";
import { PlayerStates } from "./PlayerStates";

export class AttackingHeavyState extends PlayerState {
    private attackCooldown: number = 300;
    private lastAttackTime: number = 0;

    enter(): void {
        console.log('Entering Heavy Attack State');
        const player = this.getPlayer();
        
        if (!player) return;
    
        // Check attack cooldown (only for local players)
        if (this.isInputEnabled()) {
            const currentTime = this.getScene().time.now;
            if (currentTime - this.lastAttackTime < this.attackCooldown) {
                console.log('Heavy attack blocked - cooldown');
                this.playerManager.transitionTo(PlayerStates.Idle);
                return;
            }
            this.lastAttackTime = currentTime;
    
            // ✅ Create visual hitbox using the new system
            const hitboxManager = this.playerManager.getAttackHitboxManager();
            if (hitboxManager) {
                const hitbox = hitboxManager.createHeavyAttackHitbox();
                console.log(`[HEAVY ATTACK] Created visual hitbox:`, hitbox);
            }

            // Send attack event to server
            const body = player.body as Phaser.Physics.Arcade.Body;
            battleSocketClient.emit('player-attack', {
                type: 'heavy',
                damage: 30,
                range: 120,
                position: { x: player.x, y: player.y },
                animation: 'heavy-attack',
                knockbackForce: 100,  // Higher knockback for heavy attacks
                knockbackAngle: 45    // Knockback angle in degrees
            });
        }
    
        // Play heavy attack animation (for both local and remote players)
        this.getSpriteManager().playAttack2Animation(player);
    
        // Set up animation complete callback
        this.getSpriteManager().setHeavyAttackCompleteCallback(() => {
            this.onAttackComplete();
        });
    
        console.log('Heavy attack executed');
    }

    update(): void {
        // Animation is handled by sprite manager
        // State will transition when animation completes
    }

    handleInput(inputs?: any): void {
        // No input handling during attack animation
    }

    private onAttackComplete(): void {
        // For remote players, always transition to idle
        if (!this.isInputEnabled()) {
            this.playerManager.transitionTo(PlayerStates.Idle);
            return;
        }

        // Transition to appropriate state after attack (local players only)
        const keyObjects = this.getKeyObjects();
        const player = this.getPlayer();
        
        if (!player || !keyObjects) {
            this.playerManager.transitionTo(PlayerStates.Idle);
            return;
        }

        const body = player.body as Phaser.Physics.Arcade.Body;
        const isOnGround = body.touching.down;

        if (!isOnGround) {
            this.playerManager.transitionTo(PlayerStates.Jumping);
        } else if (keyObjects.crouch.isDown) {
            if (keyObjects.left.isDown || keyObjects.right.isDown) {
                this.playerManager.transitionTo(PlayerStates.CrouchWalking);
            } else {
                this.playerManager.transitionTo(PlayerStates.Crouching);
            }
        } else if (keyObjects.left.isDown || keyObjects.right.isDown) {
            this.playerManager.transitionTo(PlayerStates.Sprinting);
        } else {
            this.playerManager.transitionTo(PlayerStates.Idle);
        }
    }

    public canAttack(): boolean {
        // Remote players can always attack (no cooldown check)
        if (!this.isInputEnabled()) {
            return true;
        }
        
        const currentTime = this.getScene().time.now;
        return currentTime - this.lastAttackTime >= this.attackCooldown;
    }

    exit(): void {
        console.log('Exiting Heavy Attack State');
    }
}
