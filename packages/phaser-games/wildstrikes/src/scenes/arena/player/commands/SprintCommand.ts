// packages/phaser-games/wildstrikes/src/scenes/arena/player/commands/SprintCommand.ts
import { ScalableCommand, CommandType } from "./CommandTypes";
import { PlayerManager } from "../PlayerManager";
import { PlayerStates } from "../states";

export class SprintCommand implements ScalableCommand {
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
        // Original local player logic
        const playerSprite = player.getPlayerSprite();
        if (!playerSprite || !player.isInputEnabled()) return;

        // Transition to sprinting state
        player.transitionTo(PlayerStates.Sprinting);
    }

    executeRemote(player: PlayerManager): void {
        // Remote player logic - just display
        if (player.isInputEnabled()) return; // Don't execute on local players

        const playerSprite = player.getPlayerSprite();
        if (!playerSprite) return;

        // Apply network data if provided
        if (this.networkData) {
            if (this.networkData.position) {
                playerSprite.setPosition(this.networkData.position.x, this.networkData.position.y);
            }
            if (this.networkData.velocity) {
                playerSprite.setVelocity(this.networkData.velocity.x, this.networkData.velocity.y);
            }
        }

        // For remote players, transition to sprinting state to handle the animation properly
        player.transitionTo(PlayerStates.Sprinting);
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