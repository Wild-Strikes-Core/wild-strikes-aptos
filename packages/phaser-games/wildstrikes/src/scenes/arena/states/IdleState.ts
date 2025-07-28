import { PlayerState } from "./PlayerState";

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
                this.playerManager.transitionTo('crouchWalking');
            } else {
                this.playerManager.transitionTo('walking');
            }
        } else if (keyObjects.crouch.isDown && isOnGround) {
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
        console.log('Exiting Idle State');
    }
}
