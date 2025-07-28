import { Command } from "./Command";
import { PlayerManager } from "../PlayerManager";
import { AttackingHeavyState } from "../states";

export class HeavyAttackCommand implements Command {
    execute(player: PlayerManager): void {
        const playerSprite = player.getPlayerSprite();
        if (!playerSprite || !player.isInputEnabled()) return;

        // Check if attack is available
        const attackingHeavyState = player.getState('attackingHeavy') as AttackingHeavyState;
        if (attackingHeavyState && attackingHeavyState.canAttack()) {
            player.transitionTo('attackingHeavy');
        }
    }
}
