import { PlayerState } from "./PlayerState";

export class DashingState extends PlayerState {
    private dashStartTime: number = 0;
    private dashDuration: number = 300; // milliseconds
    private dashSpeed: number = 2400;

    enter(): void {
        console.log('Entering Dashing State');
        this.dashStartTime = this.playerManager.getScene().time.now;
        
        const player = this.playerManager.getPlayerSprite();
        if (player) {
            // Apply dash velocity based on facing direction
            const dashVelocity = player.flipX ? -this.dashSpeed : this.dashSpeed;
            player.setVelocityX(dashVelocity);
            this.playerManager.getSpriteManager().playDashingAnimation(player);
        }
    }

    exit(): void {
        console.log('Exiting Dashing State');
        // Start dash cooldown
        this.playerManager.startDashCooldown();
    }

    update(): void {
        const currentTime = this.playerManager.getScene().time.now;
        
        // Check if dash duration is complete
        if (currentTime - this.dashStartTime >= this.dashDuration) {
            this.playerManager.transitionTo('idle');
            return;
        }

        // Check if we're no longer on ground during dash
        if (!this.playerManager.getIsOnGround()) {
            this.playerManager.transitionTo('jumping');
            return;
        }
    }

    handleInput(): void {
        // Limited input during dash - mostly just maintain dash direction
        const player = this.playerManager.getPlayerSprite();
        if (!player) return;

        // Keep the dash velocity applied
        const dashVelocity = player.flipX ? -this.dashSpeed : this.dashSpeed;
        player.setVelocityX(dashVelocity);
    }

    // Block most inputs during dash
    onJump(): void {
        // Can't jump during dash
    }

    onDash(): void {
        // Can't dash during dash
    }

    onLightAttack(): void {
        // Can't attack during dash
    }

    onHeavyAttack(): void {
        // Can't attack during dash
    }
} 