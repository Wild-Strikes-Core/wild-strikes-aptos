import { Command } from "../commands";

export interface InputBinding {
    command: Command;
    description?: string;
}

export interface KeyboardBindings {
    [key: string]: InputBinding;
}

export interface MouseBindings {
    leftClick?: InputBinding;
    rightClick?: InputBinding;
    middleClick?: InputBinding;
}

export interface MobileBindings {
    // Placeholder for future mobile input bindings
    // Will be implemented when mobile support is added
}

export interface GamepadBindings {
    // Placeholder for future gamepad input bindings  
    // Will be implemented when gamepad support is added
}

export class InputService {
    private scene: Phaser.Scene;
    private isEnabled: boolean = true;
    
    // Input bindings
    private keyboardBindings: KeyboardBindings = {};
    private mouseBindings: MouseBindings = {};
    private mobileBindings: MobileBindings = {};
    private gamepadBindings: GamepadBindings = {};
    
    // Tracking bound events for cleanup
    private boundKeyboardEvents: string[] = [];
    private boundMouseEvents: boolean = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    // Enable/disable all input
    public setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }

    public isInputEnabled(): boolean {
        return this.isEnabled;
    }

    // Keyboard input methods
    public bindKeyboard(key: string, command: Command, description?: string): void {
        this.keyboardBindings[key] = { command, description };
        
        // Set up the actual keyboard event listener
        const eventName = `keydown-${key}`;
        this.scene.input.keyboard?.on(eventName, () => {
            if (this.isEnabled) {
                this.keyboardBindings[key].command.execute(this.getCommandTarget());
            }
        });
        
        this.boundKeyboardEvents.push(eventName);
    }

    public unbindKeyboard(key: string): void {
        if (this.keyboardBindings[key]) {
            const eventName = `keydown-${key}`;
            this.scene.input.keyboard?.off(eventName);
            delete this.keyboardBindings[key];
            
            const index = this.boundKeyboardEvents.indexOf(eventName);
            if (index > -1) {
                this.boundKeyboardEvents.splice(index, 1);
            }
        }
    }

    // Mouse input methods
    public bindMouse(mouseBindings: MouseBindings): void {
        this.mouseBindings = { ...this.mouseBindings, ...mouseBindings };
        
        if (!this.boundMouseEvents) {
            this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (!this.isEnabled) return;
                
                if (pointer.leftButtonDown() && this.mouseBindings.leftClick) {
                    this.mouseBindings.leftClick.command.execute(this.getCommandTarget());
                } else if (pointer.rightButtonDown() && this.mouseBindings.rightClick) {
                    this.mouseBindings.rightClick.command.execute(this.getCommandTarget());
                } else if (pointer.middleButtonDown() && this.mouseBindings.middleClick) {
                    this.mouseBindings.middleClick.command.execute(this.getCommandTarget());
                }
            });
            
            // Prevent context menu on right click
            this.scene.input.mouse?.disableContextMenu();
            this.boundMouseEvents = true;
        }
    }

    public unbindMouse(): void {
        this.mouseBindings = {};
        if (this.boundMouseEvents) {
            this.scene.input.off('pointerdown');
            this.boundMouseEvents = false;
        }
    }

    // Mobile input methods (placeholder for future implementation)
    public bindMobile(mobileBindings: MobileBindings): void {
        this.mobileBindings = { ...this.mobileBindings, ...mobileBindings };
        console.log('Mobile input binding - Will be implemented in future');
    }

    public unbindMobile(): void {
        this.mobileBindings = {};
    }

    // Gamepad input methods (placeholder for future implementation)
    public bindGamepad(gamepadBindings: GamepadBindings): void {
        this.gamepadBindings = { ...this.gamepadBindings, ...gamepadBindings };
        console.log('Gamepad input binding - Will be implemented in future');
    }

    public unbindGamepad(): void {
        this.gamepadBindings = {};
    }

    // Utility methods
    public getKeyboardBindings(): KeyboardBindings {
        return { ...this.keyboardBindings };
    }

    public getMouseBindings(): MouseBindings {
        return { ...this.mouseBindings };
    }

    public getMobileBindings(): MobileBindings {
        return { ...this.mobileBindings };
    }

    public getGamepadBindings(): GamepadBindings {
        return { ...this.gamepadBindings };
    }

    // Clear all bindings
    public clearAllBindings(): void {
        this.clearKeyboardBindings();
        this.unbindMouse();
        this.unbindMobile();
        this.unbindGamepad();
    }

    public clearKeyboardBindings(): void {
        // Remove all keyboard event listeners
        this.boundKeyboardEvents.forEach(eventName => {
            this.scene.input.keyboard?.off(eventName);
        });
        
        this.keyboardBindings = {};
        this.boundKeyboardEvents = [];
    }

    // Command target - this will be overridden by the system using InputService
    private commandTarget: any = null;

    public setCommandTarget(target: any): void {
        this.commandTarget = target;
    }

    private getCommandTarget(): any {
        return this.commandTarget;
    }

    // Cleanup method
    public destroy(): void {
        this.clearAllBindings();
        this.commandTarget = null;
    }
}
