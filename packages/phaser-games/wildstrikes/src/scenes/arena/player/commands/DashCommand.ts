import { Command } from "./Command";
import { PlayerManager } from "../PlayerManager";
import { DashingState, PlayerStates } from "../states";

export class DashCommand implements Command {
    execute(player: PlayerManager): void {
        const playerSprite = player.getPlayerSprite();
        if (!playerSprite || !player.isInputEnabled()) return;

        // Check if dash is available
        const dashingState = player.getState(PlayerStates.Dashing) as DashingState;
        if (dashingState && dashingState.canDash()) {
            player.transitionTo(PlayerStates.Dashing);
        }
    }
}
