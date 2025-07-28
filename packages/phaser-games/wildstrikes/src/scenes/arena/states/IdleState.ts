import { PlayerState } from "./PlayerState";

export class IdleState extends PlayerState {
    enter(): void {
        console.log('Entering Idle State');
        const player = this.playerManager.getPlayerSprite();
        if (player) {
            this.playerManager.getSpriteManager().playIdleAnimation(player);
        }
    }

    exit(): void {
        console.log('Exiting Idle State');
    }

    update(): void {
        // Check if we should transition to other states
        if (!this.playerManager.getIsOnGround()) {
            this.playerManager.transitionTo('jumping');
            return;
        }

        // Movement state is handled in handleInput, so we don't need to check here
        // The transition to walking happens in handleInput when movement keys are pressed
    }

    handleInput(): void {
        // Handle input while in idle state
        if (this.playerManager.isKeyPressed('left') || this.playerManager.isKeyPressed('right')) {
            this.playerManager.transitionTo('walking');
        }
        
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

    onSprint(): void {
        this.playerManager.transitionTo('walking');
    }

    onCrouch(): void {
        this.playerManager.transitionTo('crouching');
    }
} 