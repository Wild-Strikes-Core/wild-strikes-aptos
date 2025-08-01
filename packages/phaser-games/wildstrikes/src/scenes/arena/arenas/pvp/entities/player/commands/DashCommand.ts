import { ScalableCommand, CommandType } from "./CommandTypes";
import { PlayerManager } from "../PlayerManager";
import { DashingState, PlayerStates } from "../states";

export class DashCommand implements ScalableCommand {
    private commandType: CommandType;
    private networkData?: any;

    constructor(commandType: CommandType = CommandType.LOCAL_INPUT, networkData?: any) {
        this.commandType = commandType;
        this.networkData = networkData;
    }

    execute(player: PlayerManager): void {
        switch (this.commandType) {
            case CommandType.LOCAL_INPUT:
                this.executeLocal(player);
                break;
            case CommandType.REMOTE_SYNC:
                this.executeRemote(player);
                break;
        }
    }

    executeLocal(player: PlayerManager): void {
        const playerSprite = player.getPlayerSprite();
        if (!playerSprite || !player.isInputEnabled()) return;

        const dashingState = player.getState(PlayerStates.Dashing) as DashingState;
        if (dashingState && dashingState.canDash()) {
            player.transitionTo(PlayerStates.Dashing);
        }
    }

    executeRemote(player: PlayerManager): void {
        if (player.isInputEnabled()) return;

        const playerSprite = player.getPlayerSprite();
        if (!playerSprite) return;

        if (this.networkData) {
            if (this.networkData.position) {
                playerSprite.setPosition(this.networkData.position.x, this.networkData.position.y);
            }
            if (this.networkData.velocity) {
                playerSprite.setVelocity(this.networkData.velocity.x, this.networkData.velocity.y);
            }
        }

        // For remote players, we need to transition to dashing state to handle the animation properly
        // The dashing state will handle the animation and transitions
        player.transitionTo(PlayerStates.Dashing);
    }

    canExecute(player: PlayerManager): boolean {
        switch (this.commandType) {
            case CommandType.LOCAL_INPUT:
                return player.isInputEnabled();
            case CommandType.REMOTE_SYNC:
                return !player.isInputEnabled();
        }
        return false;
    }

    getCommandType(): CommandType {
        return this.commandType;
    }
}
