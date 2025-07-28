import { PlayerState } from "./PlayerState";

export class JumpingState extends PlayerState {
    private jumpCount: number = 0;
    private jumpLimit: number = 2;

    enter(): void {
        console.log('Entering Jumping State');
        const player = this.playerManager.getPlayerSprite();
        if (player) {
            this.playerManager.getSpriteManager().playJumpingAnimation(player);
        }
    }

    exit(): void {
        console.log('Exiting Jumping State');
        this.jumpCount = 0;
    }

    update(): void {
        const player = this.playerManager.getPlayerSprite();
        if (!player) return;

        const body = player.body as Phaser.Physics.Arcade.Body;
        
        // Check if we landed
        if (body.touching.down) {
            this.playerManager.transitionTo('idle');
            return;
        }

        // Update animation based on velocity
        if (body.velocity.y < 0) {
            this.playerManager.getSpriteManager().playJumpingAnimation(player);
        } else {
            this.playerManager.getSpriteManager().playFallAnimation(player);
        }
    }

    handleInput(): void {
        // Allow limited movement while in air
        const player = this.playerManager.getPlayerSprite();
        if (!player) return;

        const airSpeed = 200; // Reduced speed in air

        if (this.playerManager.isKeyPressed('left')) {
            player.setVelocityX(-airSpeed);
            this.playerManager.flipSprite(true);
            this.playerManager.setIsMoving(true);
        } else if (this.playerManager.isKeyPressed('right')) {
            player.setVelocityX(airSpeed);
            this.playerManager.flipSprite(false);
            this.playerManager.setIsMoving(true);
        } else {
            this.playerManager.setIsMoving(false);
        }
    }

    onJump(): void {
        // Allow double jump
        if (this.jumpCount < this.jumpLimit) {
            const player = this.playerManager.getPlayerSprite();
            if (player) {
                player.setVelocityY(-1300);
                this.jumpCount++;
                console.log(`Jump ${this.jumpCount}/${this.jumpLimit}`);
            }
        }
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
} 