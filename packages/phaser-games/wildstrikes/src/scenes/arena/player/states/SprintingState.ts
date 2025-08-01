import { PlayerState } from "./PlayerState";
import { PlayerStates } from "./PlayerStates";

export class SprintingState extends PlayerState {
    enter(): void {
        console.log('Entering Sprinting State');
    }

    update(): void {
        if (!this.isInputEnabled()) return;

        const player = this.getPlayer();
        const keyObjects = this.getKeyObjects();
        
        if (!player || !keyObjects) return;

        const body = player.body as Phaser.Physics.Arcade.Body;
        const isOnGround = body.touching.down;

        // Always use sprint speed (no more walking speed)
        const sprintSpeed = 450; // Increased from 300 * 1.5 = 450
        let isMoving = false;

        // Handle horizontal movement
        if (keyObjects.left.isDown) {
            player.setVelocityX(-sprintSpeed);
            this.getSpriteManager().flipSprite(player, true);
            isMoving = true;
        } else if (keyObjects.right.isDown) {
            player.setVelocityX(sprintSpeed);
            this.getSpriteManager().flipSprite(player, false);
            isMoving = true;
        }

        // Always play sprinting animation when moving
        if (isMoving) {
            this.getSpriteManager().playSprintingAnimation(player);
        }

        // Check for state transitions
        if (!isMoving) {
            this.playerManager.transitionTo(PlayerStates.Idle);
        } else if (keyObjects.crouch.isDown && isOnGround) {
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
        console.log('Exiting Sprinting State');
    }
}