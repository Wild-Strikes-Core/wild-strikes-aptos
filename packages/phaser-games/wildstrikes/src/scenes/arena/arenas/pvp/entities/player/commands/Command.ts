import { PlayerManager } from "../PlayerManager";

export interface Command {
    execute(player: PlayerManager): void;
}
