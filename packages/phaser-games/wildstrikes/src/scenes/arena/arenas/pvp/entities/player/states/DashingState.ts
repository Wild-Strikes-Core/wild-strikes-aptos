import { PlayerState } from "./PlayerState";
import { PlayerStates } from "./PlayerStates";

export class DashingState extends PlayerState {
    private dashDuration: number = 300;
    private dashCooldown: number = 1000;
    private dashTimer: Phaser.Time.TimerEvent | null = null;
    private isDashOnCooldown: boolean = false;

    enter(): void {
        console.log('Entering Dashing State');
        const player = this.getPlayer();
        
        if (!player) return;

        // Check if dash is on cooldown (only for local players)
        if (this.isInputEnabled() && this.isDashOnCooldown) {
            console.log('Dash on cooldown');
            this.playerManager.transitionTo(PlayerStates.Idle);
            return;
        }

        // Set dash velocity (for both local and remote players)
        const dashSpeed = player.flipX ? -2400 : 2400;
        player.setVelocityX(dashSpeed);
        
        this.getSpriteManager().playDashingAnimation(player);
        console.log('Dash executed');

        // End dash after duration (for both local and remote players)
        this.getScene().time.delayedCall(this.dashDuration, () => {
            this.exitDash();
        });

        this.getScene().sound.play('player-dash', { volume: 0.5 });
    }

    update(): void {
        const player = this.getPlayer();
        if (!player) return;

        // Maintain dash animation
        this.getSpriteManager().playDashingAnimation(player);
    }

    handleInput(inputs?: any): void {
        // No input handling during dash
    }

    private exitDash(): void {
        // Start cooldown timer (only for local players)
        if (this.isInputEnabled()) {
            this.isDashOnCooldown = true;
            this.dashTimer = this.getScene().time.delayedCall(this.dashCooldown, () => {
                this.isDashOnCooldown = false;
                console.log('Dash cooldown finished');
            });
        }

        // Transition to appropriate state
        const keyObjects = this.getKeyObjects();
        const player = this.getPlayer();
        
        if (!player || !keyObjects) {
            this.playerManager.transitionTo(PlayerStates.Idle);
            return;
        }

        // For remote players, always transition to idle when dash completes
        if (!this.isInputEnabled()) {
            this.playerManager.transitionTo(PlayerStates.Idle);
            return;
        }

        // For local players, check input for state transitions
        const body = player.body as Phaser.Physics.Arcade.Body;
        const isOnGround = body.touching.down;

        if (!isOnGround) {
            this.playerManager.transitionTo(PlayerStates.Jumping);
        } else if (keyObjects.crouch.isDown) {
            if (keyObjects.left.isDown || keyObjects.right.isDown) {
                this.playerManager.transitionTo(PlayerStates.CrouchWalking);
            } else {
                this.playerManager.transitionTo(PlayerStates.Crouching);
            }
        } else if (keyObjects.left.isDown || keyObjects.right.isDown) {
            this.playerManager.transitionTo(PlayerStates.Sprinting);
        } else {
            this.playerManager.transitionTo(PlayerStates.Idle);
        }
    }

    public canDash(): boolean {
        return !this.isDashOnCooldown;
    }

    exit(): void {
        console.log('Exiting Dashing State');
    }
}
