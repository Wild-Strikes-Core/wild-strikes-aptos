import { PlayerState } from "./PlayerState";
import { PlayerStates } from "./PlayerStates";

export class SprintingState extends PlayerState {
    enter(): void {
        console.log('Entering Sprinting State');
        
        // For remote players, play the animation immediately when entering the state
        if (!this.isInputEnabled()) {
            const player = this.getPlayer();
            if (player) {
                this.getSpriteManager().playSprintingAnimation(player);
            }
        }
    }

    update(): void {
        const player = this.getPlayer();
        
        if (!player) return;

        
        // Only handle input and movement for local players
        if (!this.isInputEnabled()) {
            // For remote players, just ensure the animation is playing
            // The animation will continue playing until the state changes
            return;
        }

        const keyObjects = this.getKeyObjects();
        
        if (!keyObjects) return;

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

        // Removed repeated sprint sound playback to prevent overlapping audio issues
        if (isMoving) {
            this.getSpriteManager().playSprintingAnimation(player);

            // Play footstep sound only on specific animation frame
            if (!(player as any).hasFootstepListener) {
                player.on('animationupdate-player_run', (anim: any, frame: any) => {
                    // Play sound on frames where foot touches ground (e.g., frame.index === 2 or 5)
                    if (frame.index === 2 || frame.index === 5) {
                        this.getScene().sound.play('player-sprint', { volume: 0.5 });
                    }
                });
                (player as any).hasFootstepListener = true;
            }
        } else {
            // Remove listener when not moving
            if ((player as any).hasFootstepListener) {
                player.off('animationupdate-player_run');
                (player as any).hasFootstepListener = false;
            }
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
        console.log('Exiting Sprinting State');
    }
}