import { PlayerState } from "./PlayerState";

export class CrouchingState extends PlayerState {
    enter(): void {
        console.log('Entering Crouching State');
        const player = this.playerManager.getPlayerSprite();
        if (player) {
            this.playerManager.getSpriteManager().playCrouchFullAnimation(player);
        }
    }

    exit(): void {
        console.log('Exiting Crouching State');
    }

    update(): void {
        // Check if we should transition to other states
        if (!this.playerManager.getIsOnGround()) {
            this.playerManager.transitionTo('jumping');
            return;
        }

        if (!this.playerManager.isKeyPressed('crouch')) {
            this.playerManager.setIsCrouching(false);
            this.playerManager.transitionTo('idle');
            return;
        }

        this.playerManager.setIsCrouching(true);
    }

    handleInput(): void {
        // Handle movement while crouching
        const player = this.playerManager.getPlayerSprite();
        if (!player) return;

        const crouchSpeed = 150; // Reduced speed while crouching

        if (this.playerManager.isKeyPressed('left')) {
            player.setVelocityX(-crouchSpeed);
            this.playerManager.flipSprite(true);
            this.playerManager.getSpriteManager().playCrouchWalkAnimation(player);
            this.playerManager.setIsMoving(true);
        } else if (this.playerManager.isKeyPressed('right')) {
            player.setVelocityX(crouchSpeed);
            this.playerManager.flipSprite(false);
            this.playerManager.getSpriteManager().playCrouchWalkAnimation(player);
            this.playerManager.setIsMoving(true);
        } else {
            player.setVelocityX(0);
            this.playerManager.getSpriteManager().playCrouchFullAnimation(player);
            this.playerManager.setIsMoving(false);
        }
    }

    onJump(): void {
        // Can't jump while crouching
    }

    onDash(): void {
        // Can't dash while crouching
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
} 