import { PlayerManager } from "../PlayerManager";

export abstract class PlayerState {
    protected playerManager: PlayerManager;

    constructor(playerManager: PlayerManager) {
        this.playerManager = playerManager;
    }

    abstract update(): void;
    abstract handleInput(): void;
    abstract enter(): void;
    abstract exit(): void;
    
    // Optional methods that can be overridden
    onJump(): void {}
    onDash(): void {}
    onLightAttack(): void {}
    onHeavyAttack(): void {}
    onMoveLeft(): void {}
    onMoveRight(): void {}
    onSprint(): void {}
    onCrouch(): void {}
} 