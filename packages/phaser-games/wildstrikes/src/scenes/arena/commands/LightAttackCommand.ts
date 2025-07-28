import { Command } from "./Command";
import { PlayerManager } from "../PlayerManager";
import { AttackingLightState } from "../states";

export class LightAttackCommand implements Command {
    execute(player: PlayerManager): void {
        const playerSprite = player.getPlayerSprite();
        if (!playerSprite || !player.isInputEnabled()) return;

        // Check if attack is available
        const attackingLightState = player.getState('attackingLight') as AttackingLightState;
        if (attackingLightState && attackingLightState.canAttack()) {
            player.transitionTo('attackingLight');
        }
    }
}
