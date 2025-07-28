import { PlayerState } from "./PlayerState";
import { PlayerStates } from "./PlayerStates";

export class CrouchingState extends PlayerState {
    enter(): void {
        console.log('Entering Crouching State');
        const player = this.getPlayer();
        if (player) {
            // Stop horizontal movement when entering crouch
            player.setVelocityX(0);
            this.getSpriteManager().playCrouchFullAnimation(player);
        }
    }

    update(): void {
        if (!this.isInputEnabled()) return;

        const player = this.getPlayer();
        const keyObjects = this.getKeyObjects();
        
        if (!player || !keyObjects) return;

        const body = player.body as Phaser.Physics.Arcade.Body;
        const isOnGround = body.touching.down;
        const isCrouching = keyObjects.crouch.isDown && isOnGround;

        // Maintain crouch animation
        this.getSpriteManager().playCrouchFullAnimation(player);

        // Check for state transitions
        if (!isCrouching) {
            // Released crouch key
            if (keyObjects.left.isDown || keyObjects.right.isDown) {
                this.playerManager.transitionTo(PlayerStates.Walking);
            } else {
                this.playerManager.transitionTo(PlayerStates.Idle);
            }
        } else if (keyObjects.left.isDown || keyObjects.right.isDown) {
            // Started moving while crouching
            this.playerManager.transitionTo(PlayerStates.CrouchWalking);
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
        console.log('Exiting Crouching State');
    }
}
