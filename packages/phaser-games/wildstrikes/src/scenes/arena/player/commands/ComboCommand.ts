import { Command } from "./Command";
import { PlayerManager } from "../PlayerManager";

/**
 * Example composite command that executes multiple commands in sequence.
 * This demonstrates the flexibility of the Command pattern for creating
 * complex actions, combos, or macros.
 */
export class ComboCommand implements Command {
    private commands: Command[] = [];
    private delays: number[] = [];

    constructor(commands: Command[], delays: number[] = []) {
        this.commands = commands;
        this.delays = delays;
    }

    execute(player: PlayerManager): void {
        this.commands.forEach((command, index) => {
            const delay = this.delays[index] || 0;
            
            if (delay > 0) {
                // Execute with delay using Phaser's timer
                player.getScene().time.delayedCall(delay, () => {
                    command.execute(player);
                });
            } else {
                // Execute immediately
                command.execute(player);
            }
        });
    }

    // Add a command to the combo
    addCommand(command: Command, delay: number = 0): void {
        this.commands.push(command);
        this.delays.push(delay);
    }

    // Clear all commands
    clear(): void {
        this.commands = [];
        this.delays = [];
    }
}
