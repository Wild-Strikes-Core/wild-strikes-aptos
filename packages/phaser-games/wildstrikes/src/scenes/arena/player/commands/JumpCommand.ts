import { Command } from "./Command";
import { PlayerManager } from "../PlayerManager";
import { JumpingState, PlayerStates } from "../states";

export class JumpCommand implements Command {
    execute(player: PlayerManager): void {
        const playerSprite = player.getPlayerSprite();
        if (!playerSprite || !player.isInputEnabled()) return;

        const currentState = player.getCurrentState();
        const jumpingState = player.getState(PlayerStates.Jumping) as JumpingState;
        
        if (!jumpingState) return;

        // If already in jumping state, try to double jump
        if (currentState instanceof JumpingState) {
            jumpingState.performJumpIfPossible();
        } else {
            // If not in jumping state, transition and the enter() method will handle the first jump
            player.transitionTo(PlayerStates.Jumping);
        }
    }
}
