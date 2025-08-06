import { PlayerState } from "./PlayerState";
import { PlayerStates } from "./PlayerStates";

export class HitState extends PlayerState {
    private hitRecoveryTime: number = 400; // ms
    private hitStartTime: number = 0;

    enter(): void {
        const sprite = this.playerManager.getPlayerSprite();
        if (!sprite) return;
        
        // Play hit animation
        this.playerManager.getSpriteManager().playHitAnimation(sprite);
        
        // Record start time
        this.hitStartTime = this.playerManager.getScene().time.now;
        
        console.log("[PLAYER STATE] Entered Hit state");
    }

    update(): void {
        const currentTime = this.playerManager.getScene().time.now;
        
        // Check if recovery time has passed
        if (currentTime - this.hitStartTime >= this.hitRecoveryTime) {
            // Return to idle state after recovery
            this.playerManager.transitionTo(PlayerStates.Idle);
        }
    }

    handleInput(inputs?: any): void {
        
    }

    exit(): void {
        console.log("[PLAYER STATE] Exiting Hit state");
    }
}