import { Command } from "./Command";
import { PlayerManager } from "../PlayerManager";
import { AttackingHeavyState, PlayerStates } from "../states";

export class HeavyAttackCommand implements Command {
    execute(player: PlayerManager): void {
        const playerSprite = player.getPlayerSprite();
        if (!playerSprite || !player.isInputEnabled()) return;

        // Check if attack is available
        const attackingHeavyState = player.getState(PlayerStates.AttackingHeavy) as AttackingHeavyState;
        if (attackingHeavyState && attackingHeavyState.canAttack()) {
            player.transitionTo(PlayerStates.AttackingHeavy);
        }
    }
}
