import { PlayerState } from "./PlayerState";
import { PlayerStates } from "./PlayerStates";

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
                this.playerManager.transitionTo(PlayerStates.Sprinting);
            } else {
                this.playerManager.transitionTo(PlayerStates.Idle);
            }
        } else if (!isMoving) {
            // Stopped moving while crouching
            this.playerManager.transitionTo(PlayerStates.Crouching);
        } else if (keyObjects.jump.isDown && isOnGround) {
            this.playerManager.transitionTo(PlayerStates.Jumping);
        } else if (keyObjects.dash.isDown) {
            this.playerManager.transitionTo(PlayerStates.Dashing);
        } else if (!isOnGround) {
            this.playerManager.transitionTo(PlayerStates.Jumping);
        }
    }

    handleInput(inputs?: any): void {
        if (!this.isInputEnabled() || !inputs) return;

        // Handle jump input
        if (inputs.jump) {
            this.playerManager.transitionTo(PlayerStates.Jumping);
            return;
        }

        // Handle attack inputs
        if (inputs.lightAttack) {
            this.playerManager.transitionTo(PlayerStates.AttackingLight);
        } else if (inputs.heavyAttack) {
            this.playerManager.transitionTo(PlayerStates.AttackingHeavy);
        }
    }

    exit(): void {
        console.log('Exiting Crouch Walking State');
    }
}
