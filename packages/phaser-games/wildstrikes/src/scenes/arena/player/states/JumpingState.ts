import { PlayerState } from "./PlayerState";
import { PlayerStates } from "./PlayerStates";

export class JumpingState extends PlayerState {
    private jumpCount: number = 0;
    private jumpLimit: number = 2;

    enter(): void {
        console.log('Entering Jumping State');
        const player = this.getPlayer();
        if (player) {
            const body = player.body as Phaser.Physics.Arcade.Body;
            
            // If we're on the ground, perform the initial jump
            if (body.touching.down && this.jumpCount === 0) {
                this.performJump();
            }
            
            // Play appropriate animation based on velocity
            if (body.velocity.y < 0) {
                this.getSpriteManager().playJumpingAnimation(player);
            } else {
                this.getSpriteManager().playFallAnimation(player);
            }
        }
    }

    update(): void {
        const player = this.getPlayer();
        const keyObjects = this.getKeyObjects();
        
        if (!player || !keyObjects) return;

        const body = player.body as Phaser.Physics.Arcade.Body;
        const isOnGround = body.touching.down;

        // Handle horizontal movement while in air (only for local players)
        if (this.isInputEnabled()) {
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
        }

        // Update animation based on velocity (for both local and remote players)
        if (body.velocity.y < 0) {
            this.getSpriteManager().playJumpingAnimation(player);
        } else {
            this.getSpriteManager().playFallAnimation(player);
        }

        // Check for state transitions (for both local and remote players)
        if (isOnGround) {
            this.jumpCount = 0; // Reset jump count when landing
            
            // For remote players, always transition to idle when landing
            if (!this.isInputEnabled()) {
                this.playerManager.transitionTo(PlayerStates.Idle);
                return;
            }
            
            // For local players, check input for state transitions
            if (keyObjects.crouch.isDown) {
                if (keyObjects.left.isDown || keyObjects.right.isDown) {
                    this.playerManager.transitionTo(PlayerStates.CrouchWalking);
                } else {
                    this.playerManager.transitionTo(PlayerStates.Crouching);
                }
            } else if (keyObjects.left.isDown || keyObjects.right.isDown) {
                this.playerManager.transitionTo(PlayerStates.Walking);
            } else {
                this.playerManager.transitionTo(PlayerStates.Idle);
            }
        } else if (this.isInputEnabled() && keyObjects.dash.isDown) {
            // Only allow dash input for local players
            this.playerManager.transitionTo(PlayerStates.Dashing);
        }
    }

    handleInput(): void {
        const keyObjects = this.getKeyObjects();
        const player = this.getPlayer();
        
        if (!player || !keyObjects || !this.isInputEnabled()) return;

        // Handle double jump
        if (keyObjects.jump.isDown && this.jumpCount < this.jumpLimit) {
            this.performJump();
        }
    }

    private performJump(): void {
        const player = this.getPlayer();
        if (!player) return;

        const jumpSpeed = -1300;
        player.setVelocityY(jumpSpeed);
        this.jumpCount++;
        console.log(`Jump ${this.jumpCount}/${this.jumpLimit}`);
    }

    public getJumpCount(): number {
        return this.jumpCount;
    }

    public setJumpCount(count: number): void {
        this.jumpCount = count;
    }

    // Public method for commands to perform jumps
    public performJumpIfPossible(): boolean {
        if (this.jumpCount < this.jumpLimit) {
            this.performJump();
            return true;
        }
        return false;
    }

    // Hook method called when the player lands on ground
    public onLand(): void {
        console.log('Player landed - resetting jump count');
        this.jumpCount = 0;
    }

    exit(): void {
        console.log('Exiting Jumping State');
    }
}
