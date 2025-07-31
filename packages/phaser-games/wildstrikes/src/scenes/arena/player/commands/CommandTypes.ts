// packages/phaser-games/wildstrikes/src/scenes/arena/player/commands/CommandTypes.ts
import { PlayerManager } from "../PlayerManager";

export enum CommandType {
    LOCAL_INPUT,    // Commands triggered by local input
    REMOTE_SYNC     // Commands triggered by network data
}

export interface ScalableCommand {
    execute(player: PlayerManager): void;
    canExecute(player: PlayerManager): boolean;
    getCommandType(): CommandType;
}