import { PlayerState } from "./PlayerState";

export class WalkingState extends PlayerState {
    enter(): void {
        console.log('Entering Walking State');
        const player = this.playerManager.getPlayerSprite();
        if (player) {
            this.playerManager.getSpriteManager().playWalkingAnimation(player);
        }
    }

    exit(): void {
        console.log('Exiting Walking State');
    }

    update(): void {
        // Check if we should transition to other states
        if (!this.playerManager.getIsOnGround()) {
            this.playerManager.transitionTo('jumping');
            return;
        }

        // Movement state is handled in handleInput, so we don't need to check here
        // The transition to idle happens in handleInput when no movement keys are pressed
    }

    handleInput(): void {
        // Handle movement input
        const player = this.playerManager.getPlayerSprite();
        if (!player) return;

        const baseSpeed = 300;
        const sprintMultiplier = 1.5;
        let speed = baseSpeed;

        if (this.playerManager.isKeyPressed('sprint')) {
            speed = baseSpeed * sprintMultiplier;
            const player = this.playerManager.getPlayerSprite();
            if (player) {
                this.playerManager.getSpriteManager().playSprintingAnimation(player);
            }
            this.playerManager.setIsSprinting(true);
        } else {
            this.playerManager.setIsSprinting(false);
        }

        if (this.playerManager.isKeyPressed('left')) {
            player.setVelocityX(-speed);
            this.playerManager.flipSprite(true);
            this.playerManager.setIsMoving(true);
        } else if (this.playerManager.isKeyPressed('right')) {
            player.setVelocityX(speed);
            this.playerManager.flipSprite(false);
            this.playerManager.setIsMoving(true);
        } else {
            player.setVelocityX(0);
            this.playerManager.setIsMoving(false);
            this.playerManager.transitionTo('idle');
        }

        // Check for crouch input
        if (this.playerManager.isKeyPressed('crouch')) {
            this.playerManager.setIsCrouching(true);
            this.playerManager.transitionTo('crouching');
        }
    }

    onJump(): void {
        this.playerManager.transitionTo('jumping');
    }

    onDash(): void {
        if (!this.playerManager.isDashOnCooldown()) {
            this.playerManager.transitionTo('dashing');
        }
    }

    onLightAttack(): void {
        if (this.playerManager.canAttack()) {
            this.playerManager.setLastAttackTime(this.playerManager.getScene().time.now);
            this.playerManager.transitionTo('attacking', 'light');
        }
    }

    onHeavyAttack(): void {
        if (this.playerManager.canAttack()) {
            this.playerManager.setLastAttackTime(this.playerManager.getScene().time.now);
            this.playerManager.transitionTo('attacking', 'heavy');
        }
    }

    onCrouch(): void {
        this.playerManager.setIsCrouching(true);
        this.playerManager.transitionTo('crouching');
    }
} 