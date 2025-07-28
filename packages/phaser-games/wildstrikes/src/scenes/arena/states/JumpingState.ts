import { PlayerState } from "./PlayerState";

export class JumpingState extends PlayerState {
    private jumpCount: number = 0;
    private jumpLimit: number = 2;

    enter(): void {
        console.log('Entering Jumping State');
        const player = this.getPlayer();
        if (player) {
            const body = player.body as Phaser.Physics.Arcade.Body;
            
            // Play appropriate animation based on velocity
            if (body.velocity.y < 0) {
                this.getSpriteManager().playJumpingAnimation(player);
            } else {
                this.getSpriteManager().playFallAnimation(player);
            }
        }
    }

    update(): void {
        if (!this.isInputEnabled()) return;

        const player = this.getPlayer();
        const keyObjects = this.getKeyObjects();
        
        if (!player || !keyObjects) return;

        const body = player.body as Phaser.Physics.Arcade.Body;
        const isOnGround = body.touching.down;

        // Handle horizontal movement while in air
        const baseSpeed = 300;
        const isSprinting = keyObjects.sprint.isDown;
        const speed = isSprinting ? baseSpeed * 1.5 : baseSpeed;

        if (keyObjects.left.isDown) {
            player.setVelocityX(-speed);
            this.getSpriteManager().flipSprite(player, true);
        } else if (keyObjects.right.isDown) {
            player.setVelocityX(speed);
            this.getSpriteManager().flipSprite(player, false);
        }

        // Update animation based on velocity
        if (body.velocity.y < 0) {
            this.getSpriteManager().playJumpingAnimation(player);
        } else {
            this.getSpriteManager().playFallAnimation(player);
        }

        // Check for state transitions
        if (isOnGround) {
            this.jumpCount = 0; // Reset jump count when landing
            if (keyObjects.crouch.isDown) {
                if (keyObjects.left.isDown || keyObjects.right.isDown) {
                    this.playerManager.transitionTo('crouchWalking');
                } else {
                    this.playerManager.transitionTo('crouching');
                }
            } else if (keyObjects.left.isDown || keyObjects.right.isDown) {
                this.playerManager.transitionTo('walking');
            } else {
                this.playerManager.transitionTo('idle');
            }
        } else if (keyObjects.dash.isDown) {
            this.playerManager.transitionTo('dashing');
        }
    }

    handleInput(): void {
        const keyObjects = this.getKeyObjects();
        const player = this.getPlayer();
        
        if (!player || !keyObjects || !this.isInputEnabled()) return;

        // Handle double jump
        if (keyObjects.jump.isDown && this.jumpCount < this.jumpLimit) {
            const jumpSpeed = -1300;
            player.setVelocityY(jumpSpeed);
            this.jumpCount++;
            console.log(`Jump ${this.jumpCount}/${this.jumpLimit}`);
        }
    }

    public getJumpCount(): number {
        return this.jumpCount;
    }

    public setJumpCount(count: number): void {
        this.jumpCount = count;
    }

    exit(): void {
        console.log('Exiting Jumping State');
    }
}
