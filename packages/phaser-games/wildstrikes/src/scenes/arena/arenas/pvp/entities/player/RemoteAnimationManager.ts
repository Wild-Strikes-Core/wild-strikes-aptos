/**
 * Handles remote player animation logic and state transitions
 */
export class RemoteAnimationManager {
    private player: Phaser.Physics.Arcade.Sprite;
    private spriteManager: any;
    private currentRemoteState: string = 'idle';
    private currentRemoteAnimation: string = '';
    private lastRemoteAnimationChange: number = 0;

    constructor(player: Phaser.Physics.Arcade.Sprite, spriteManager: any) {
        this.player = player;
        this.spriteManager = spriteManager;
    }

    public applyRemoteState(serverStateName: string): void {
        const now = Date.now();
        
        const isPlayingAttackAnim = this.currentRemoteAnimation === 'attackingLight' || this.currentRemoteAnimation === 'attackingHeavy';
        const isNewAttackState = serverStateName === 'attackingLight' || serverStateName === 'attackingHeavy';
        
        if (isNewAttackState) {
            this.handleAttackAnimation(serverStateName, now);
            return;
        }
        
        if (isPlayingAttackAnim && !isNewAttackState) {
            this.interruptAttackAnimation(serverStateName, now);
            return;
        }
        
        if (this.currentRemoteAnimation !== serverStateName) {
            this.transitionToAnimation(serverStateName, now);
        }
    }

    private handleAttackAnimation(serverStateName: string, now: number): void {
        const timeSinceLastChange = now - this.lastRemoteAnimationChange;
        const isNewAttackType = this.currentRemoteAnimation !== serverStateName;
        const shouldRestart = isNewAttackType || timeSinceLastChange > 400;
        
        if (shouldRestart) {
            console.log(`[REMOTE ANIMATION] 🗡️ Starting ${serverStateName} animation`);
            this.currentRemoteAnimation = serverStateName;
            this.lastRemoteAnimationChange = now;
            
            this.player?.off('animationcomplete');
            
            const animationKey = serverStateName === 'attackingLight' ? 'player_attack_light' : 'player_attack_heavy';
            
            if (this.player?.anims) {
                this.player.anims.play(animationKey, true);
                this.player.once('animationcomplete', () => {
                    this.handleAttackComplete();
                });
            }
        }
    }

    private interruptAttackAnimation(serverStateName: string, now: number): void {
        console.log(`[REMOTE ANIMATION] ⏹️ Interrupting attack animation, transitioning to: ${serverStateName}`);
        this.player?.off('animationcomplete');
        this.currentRemoteAnimation = serverStateName;
        this.lastRemoteAnimationChange = now;
        this.playStateAnimation(serverStateName);
    }

    private transitionToAnimation(serverStateName: string, now: number): void {
        console.log(`[REMOTE ANIMATION] 🎬 State change: '${this.currentRemoteAnimation}' → '${serverStateName}'`);
        this.currentRemoteAnimation = serverStateName;
        this.lastRemoteAnimationChange = now;
        this.playStateAnimation(serverStateName);
    }

    private handleAttackComplete(): void {
        if (!this.player?.body) return;
        
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const isMoving = Math.abs(body.velocity.x) > 0.1;
        
        console.log(`[REMOTE ANIMATION] ⚡ Attack completed, moving: ${isMoving}, state: ${this.currentRemoteState}`);
        
        if (isMoving) {
            this.currentRemoteAnimation = 'sprinting';
            this.spriteManager.playSprintingAnimation(this.player);
        } else {
            switch (this.currentRemoteState) {
                case 'crouching':
                    this.currentRemoteAnimation = 'crouching';
                    this.spriteManager.playCrouchFullAnimation(this.player);
                    break;
                case 'idle':
                default:
                    this.currentRemoteAnimation = 'idle';
                    this.spriteManager.playIdleAnimation(this.player);
                    break;
            }
        }
    }

    private playStateAnimation(serverStateName: string): void {
        switch (serverStateName) {
            case 'idle':
                this.spriteManager.playIdleAnimation(this.player);
                break;
            case 'sprinting':
                this.spriteManager.playSprintingAnimation(this.player);
                break;
            case 'jumping':
                this.spriteManager.playJumpingAnimation(this.player);
                break;
            case 'crouching':
                this.spriteManager.playCrouchFullAnimation(this.player);
                break;
            case 'crouchWalking':
                this.spriteManager.playCrouchWalkAnimation(this.player);
                break;
            case 'dashing':
                this.spriteManager.playDashingAnimation(this.player);
                break;
            case 'attackingLight':
                this.spriteManager.playAttackingAnimation(this.player);
                break;
            case 'attackingHeavy':
                this.spriteManager.playAttack2Animation(this.player);
                break;
            default:
                console.warn(`[REMOTE ANIMATION] ⚠️ Unknown state: '${serverStateName}'`);
                this.spriteManager.playIdleAnimation(this.player);
                break;
        }
    }

    public updateRemoteState(state: string): void {
        this.currentRemoteState = state;
    }
}
