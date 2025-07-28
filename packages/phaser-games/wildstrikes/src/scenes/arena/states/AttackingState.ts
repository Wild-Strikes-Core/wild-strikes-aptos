import { PlayerState } from "./PlayerState";

export class AttackingState extends PlayerState {
    private attackType: 'light' | 'heavy' = 'light';
    private attackStartTime: number = 0;
    private attackDuration: number = 500; // milliseconds

    enter(attackType?: 'light' | 'heavy'): void {
        const type = attackType || 'light';
        console.log(`Entering Attacking State - ${type} attack`);
        this.attackType = type;
        this.attackStartTime = this.playerManager.getScene().time.now;
        
        // Set attack in progress flag
        (this.playerManager as any).isAttackInProgress = true;
        
        const player = this.playerManager.getPlayerSprite();
        if (player) {
            if (type === 'light') {
                this.playerManager.getSpriteManager().playAttackingAnimation(player);
            } else {
                this.playerManager.getSpriteManager().playAttack2Animation(player);
            }
        }
    }

    exit(): void {
        console.log('Exiting Attacking State');
        // Clear attack in progress flag
        (this.playerManager as any).isAttackInProgress = false;
    }

    update(): void {
        const currentTime = this.playerManager.getScene().time.now;
        
        // Check if attack animation is complete
        if (currentTime - this.attackStartTime >= this.attackDuration) {
            // Clear attack in progress flag
            (this.playerManager as any).isAttackInProgress = false;
            this.playerManager.transitionTo('idle');
            return;
        }

        // Check if we're no longer on ground during attack
        if (!this.playerManager.getIsOnGround()) {
            // Clear attack in progress flag
            (this.playerManager as any).isAttackInProgress = false;
            this.playerManager.transitionTo('jumping');
            return;
        }
    }

    handleInput(): void {
        // Limited input handling during attack
        // Allow movement but at reduced speed
        const player = this.playerManager.getPlayerSprite();
        if (!player) return;

        const attackMoveSpeed = 150; // Reduced speed during attack

        if (this.playerManager.isKeyPressed('left')) {
            player.setVelocityX(-attackMoveSpeed);
            this.playerManager.flipSprite(true);
            this.playerManager.setIsMoving(true);
        } else if (this.playerManager.isKeyPressed('right')) {
            player.setVelocityX(attackMoveSpeed);
            this.playerManager.flipSprite(false);
            this.playerManager.setIsMoving(true);
        } else {
            player.setVelocityX(0);
            this.playerManager.setIsMoving(false);
        }
    }

    // Block most inputs during attack
    onJump(): void {
        // Can't jump during attack
    }

    onDash(): void {
        // Can't dash during attack
    }

    onLightAttack(): void {
        // Can't start new attack during attack
    }

    onHeavyAttack(): void {
        // Can't start new attack during attack
    }
} 