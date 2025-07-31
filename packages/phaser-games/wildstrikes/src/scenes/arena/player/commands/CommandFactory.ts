import { ScalableCommand, CommandType } from "./CommandTypes";
import { JumpCommand } from "./JumpCommand";
import { DashCommand } from "./DashCommand";
import { LightAttackCommand } from "./LightAttackCommand";
import { HeavyAttackCommand } from "./HeavyAttackCommand";

export class CommandFactory {
    static createCommand(
        commandName: string, 
        commandType: CommandType, 
        networkData?: any
    ): ScalableCommand | null {
        switch (commandName) {
            case 'jump':
                return new JumpCommand(commandType, networkData);
            case 'dash':
                return new DashCommand(commandType, networkData);
            case 'lightAttack':
                return new LightAttackCommand(commandType, networkData);
            case 'heavyAttack':
                return new HeavyAttackCommand(commandType, networkData);
            case 'none':
                console.log(`No command needed for this state`);
                return null;
            default:
                console.warn(`Unknown command: ${commandName}`);
                return null;
        }
    }

    static createFromNetworkData(networkState: any): ScalableCommand | null {
        const commandName = this.convertStateToCommand(networkState.state);
        return this.createCommand(commandName, CommandType.REMOTE_SYNC, networkState);
    }

    private static convertStateToCommand(state: string): string {
        const stateToCommand: { [key: string]: string } = {
            'jumping': 'jump',
            'dashing': 'dash',
            'attacking-light': 'lightAttack',
            'attacking-heavy': 'heavyAttack'
        };
        
        const command = stateToCommand[state];
        if (!command) {
            // For states like 'idle', 'walking', 'crouching', 'crouch-walking', etc., we don't need commands
            // Just handle position updates
            console.log(`State ${state} doesn't require a command, skipping`);
            return 'none';
        }
        return command;
    }
} 