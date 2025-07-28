import { PlayerState } from "./PlayerState";
import { PlayerStates } from "./PlayerStates";

export class AttackingHeavyState extends PlayerState {
    private attackCooldown: number = 300;
    private lastAttackTime: number = 0;

    enter(): void {
        console.log('Entering Heavy Attack State');
        const player = this.getPlayer();
        
        if (!player) return;

        // Check attack cooldown
        const currentTime = this.getScene().time.now;
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            console.log('Heavy attack blocked - cooldown');
            this.playerManager.transitionTo(PlayerStates.Idle);
            return;
        }

        // Play heavy attack animation
        this.getSpriteManager().playAttack2Animation(player);
        this.lastAttackTime = currentTime;

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

    handleInput(): void {
        // No input handling during attack animation
    }

    private onAttackComplete(): void {
        // Transition to appropriate state after attack
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
            this.playerManager.transitionTo(PlayerStates.Walking);
        } else {
            this.playerManager.transitionTo(PlayerStates.Idle);
        }
    }

    public canAttack(): boolean {
        const currentTime = this.getScene().time.now;
        return currentTime - this.lastAttackTime >= this.attackCooldown;
    }

    exit(): void {
        console.log('Exiting Heavy Attack State');
    }
}
