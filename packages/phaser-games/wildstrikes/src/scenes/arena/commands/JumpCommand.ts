import { Command } from "./Command";
import { PlayerManager } from "../PlayerManager";
import { JumpingState } from "../states";

export class JumpCommand implements Command {
    execute(player: PlayerManager): void {
        const playerSprite = player.getPlayerSprite();
        if (!playerSprite || !player.isInputEnabled()) return;

        // Get the jumping state to check jump count
        const jumpingState = player.getState('jumping') as JumpingState;
        if (jumpingState && jumpingState.getJumpCount() < 2) {
            player.transitionTo('jumping');
            jumpingState.handleInput();
        }
    }
}
