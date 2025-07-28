import { PlayerState } from "./PlayerState";
import { PlayerStates } from "./PlayerStates";

export class IdleState extends PlayerState {
    enter(): void {
        console.log('Entering Idle State');
        const player = this.getPlayer();
        if (player) {
            // Stop horizontal movement
            player.setVelocityX(0);
            this.getSpriteManager().playIdleAnimation(player);
        }
    }

    update(): void {
        if (!this.isInputEnabled()) return;

        const player = this.getPlayer();
        const keyObjects = this.getKeyObjects();
        
        if (!player || !keyObjects) return;

        const body = player.body as Phaser.Physics.Arcade.Body;
        const isOnGround = body.touching.down;

        // Check for state transitions
        if (keyObjects.left.isDown || keyObjects.right.isDown) {
            if (keyObjects.crouch.isDown && isOnGround) {
                this.playerManager.transitionTo(PlayerStates.CrouchWalking);
            } else {
                this.playerManager.transitionTo(PlayerStates.Walking);
            }
        } else if (keyObjects.crouch.isDown && isOnGround) {
            this.playerManager.transitionTo(PlayerStates.Crouching);
        } else if (keyObjects.jump.isDown && isOnGround) {
            this.playerManager.transitionTo(PlayerStates.Jumping);
        } else if (keyObjects.dash.isDown) {
            this.playerManager.transitionTo(PlayerStates.Dashing);
        } else if (!isOnGround) {
            this.playerManager.transitionTo(PlayerStates.Jumping);
        }
    }

    handleInput(): void {
        // Input handling is done in update for this state
    }

    exit(): void {
        console.log('Exiting Idle State');
    }
}
