import { PlayerState } from "./PlayerState";

export class WalkingState extends PlayerState {
    enter(): void {
        console.log('Entering Walking State');
    }

    update(): void {
        if (!this.isInputEnabled()) return;

        const player = this.getPlayer();
        const keyObjects = this.getKeyObjects();
        
        if (!player || !keyObjects) return;

        const body = player.body as Phaser.Physics.Arcade.Body;
        const isOnGround = body.touching.down;
        const isSprinting = keyObjects.sprint.isDown;

        // Calculate movement speed
        const baseSpeed = 300;
        const sprintMultiplier = 1.5;
        
        let speed = isSprinting ? baseSpeed * sprintMultiplier : baseSpeed;
        let isMoving = false;

        // Handle horizontal movement
        if (keyObjects.left.isDown) {
            player.setVelocityX(-speed);
            this.getSpriteManager().flipSprite(player, true);
            isMoving = true;
        } else if (keyObjects.right.isDown) {
            player.setVelocityX(speed);
            this.getSpriteManager().flipSprite(player, false);
            isMoving = true;
        }

        // Update animations
        if (isSprinting && isMoving) {
            this.getSpriteManager().playSprintingAnimation(player);
        } else if (isMoving) {
            this.getSpriteManager().playWalkingAnimation(player);
        }

        // Check for state transitions
        if (!isMoving) {
            this.playerManager.transitionTo('idle');
        } else if (keyObjects.crouch.isDown && isOnGround) {
            this.playerManager.transitionTo('crouchWalking');
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
        console.log('Exiting Walking State');
    }
}
