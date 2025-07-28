import { PlayerState } from "./PlayerState";

export class CrouchWalkingState extends PlayerState {
    enter(): void {
        console.log('Entering Crouch Walking State');
    }

    update(): void {
        if (!this.isInputEnabled()) return;

        const player = this.getPlayer();
        const keyObjects = this.getKeyObjects();
        
        if (!player || !keyObjects) return;

        const body = player.body as Phaser.Physics.Arcade.Body;
        const isOnGround = body.touching.down;
        const isCrouching = keyObjects.crouch.isDown && isOnGround;

        // Handle crouch walking movement
        const crouchSpeed = 150; // Slower speed when crouching
        let isMoving = false;

        if (isCrouching && (keyObjects.left.isDown || keyObjects.right.isDown)) {
            if (keyObjects.left.isDown) {
                player.setVelocityX(-crouchSpeed);
                this.getSpriteManager().flipSprite(player, true);
                isMoving = true;
            } else if (keyObjects.right.isDown) {
                player.setVelocityX(crouchSpeed);
                this.getSpriteManager().flipSprite(player, false);
                isMoving = true;
            }

            // Play crouch walking animation
            this.getSpriteManager().playCrouchWalkAnimation(player);
        }

        // Check for state transitions
        if (!isCrouching) {
            // Released crouch key
            if (keyObjects.left.isDown || keyObjects.right.isDown) {
                this.playerManager.transitionTo('walking');
            } else {
                this.playerManager.transitionTo('idle');
            }
        } else if (!isMoving) {
            // Stopped moving while crouching
            this.playerManager.transitionTo('crouching');
        } else if (keyObjects.jump.isDown && isOnGround) {
            this.playerManager.transitionTo('jumping');
        } else if (keyObjects.dash.isDown) {
            this.playerManager.transitionTo('dashing');
        } else if (!isOnGround) {
            this.playerManager.transitionTo('jumping');
        }
    }

    handleInput(): void {
        // Input handling is done in update for this state
    }

    exit(): void {
        console.log('Exiting Crouch Walking State');
    }
}
