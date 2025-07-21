export interface ButtonConfig {
    x: number;
    y: number;
    radius?: number;
    color?: number;
    alpha?: number;
    text?: string;
    textColor?: string;
    fontSize?: string;
    scale?: number;
    onPress?: () => void;
    onRelease?: () => void;
}

export class MobileButton {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private circle: Phaser.GameObjects.Arc;
    private label?: Phaser.GameObjects.Text;
    private isPressed: boolean = false;
    private config: ButtonConfig;

    constructor(scene: Phaser.Scene, config: ButtonConfig) {
        this.scene = scene;
        this.config = {
            radius: 50,
            color: 0xff0000,
            alpha: 0.5,
            scale: 0.8,
            textColor: '#ffffff',
            fontSize: '16px',
            ...config
        };
        
        this.createButton();
        this.setupInteraction();
    }

    private createButton(): void {
        // Create container for button components
        this.container = this.scene.add.container(this.config.x, this.config.y);
        this.container.setScrollFactor(0);
        this.container.setScale(this.config.scale!);
        this.container.setDepth(2000);
        
        // Make the CONTAINER interactive with a circular hit area
        this.container.setInteractive(
            new Phaser.Geom.Circle(0, 0, this.config.radius!), 
            Phaser.Geom.Circle.Contains
        );

        // Create circle background (remove setInteractive from here)
        this.circle = this.scene.add.circle(0, 0, this.config.radius!, this.config.color!, this.config.alpha!);
        // Don't set interactive on the circle anymore
        this.container.add(this.circle);

        // Add text label if provided
        if (this.config.text) {
            this.label = this.scene.add.text(0, 0, this.config.text, {
                fontSize: this.config.fontSize!,
                color: this.config.textColor!,
                fontStyle: 'bold'
            });
            this.label.setOrigin(0.5, 0.5);
            this.container.add(this.label);
        }

        console.log('MobileButton created at:', this.config.x, this.config.y);
    }

    private setupInteraction(): void {
        // Set up events on the CONTAINER instead of the circle
        this.container.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            console.log('MobileButton pointerdown');
            
            // STOP EVENT PROPAGATION - This prevents the click from reaching other objects
            event.stopPropagation();
            
            this.isPressed = true;
            this.circle.setFillStyle(this.config.color!, 1);
            this.container.setScale((this.config.scale! * 1.2));
            
            if (this.config.onPress) {
                this.config.onPress();
            }
        });

        this.container.on('pointerup', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            console.log('MobileButton pointerup');
            
            // STOP EVENT PROPAGATION
            event.stopPropagation();
            
            this.isPressed = false;
            this.circle.setFillStyle(this.config.color!, this.config.alpha!);
            this.container.setScale(this.config.scale!);
            
            if (this.config.onRelease) {
                this.config.onRelease();
            }
        });

        this.container.on('pointerout', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            if (this.isPressed) {
                console.log('MobileButton pointerout');
                
                // STOP EVENT PROPAGATION
                event.stopPropagation();
                
                this.isPressed = false;
                this.circle.setFillStyle(this.config.color!, this.config.alpha!);
                this.container.setScale(this.config.scale!);
            }
        });

        this.container.on('pointerover', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            console.log('MobileButton pointerover');
            
            // STOP EVENT PROPAGATION
            event.stopPropagation();
        });

        // Also prevent clicks from propagating through
        this.container.on('pointerclick', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            console.log('MobileButton click - preventing propagation');
            event.stopPropagation();
        });
    }

    // Public methods for controlling the button
    setPosition(x: number, y: number): void {
        this.container.setPosition(x, y);
    }

    setVisible(visible: boolean): void {
        this.container.setVisible(visible);
    }

    setScale(scale: number): void {
        this.config.scale = scale;
        this.container.setScale(scale);
    }

    destroy(): void {
        this.container.destroy();
    }

    getContainer(): Phaser.GameObjects.Container {
        return this.container;
    }
}