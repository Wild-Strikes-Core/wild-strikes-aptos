export class DebugMode {
    private scene: Phaser.Scene;
    private debugGraphics: Phaser.GameObjects.Graphics;
    private debugPanel: Phaser.GameObjects.Container;
    private isEnabled: boolean = false;
    private mapManager: any; // Will be passed from ArenaScene
    private currentMapConfig: any;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.debugGraphics = scene.add.graphics();
        this.debugGraphics.setDepth(9999);
        this.setupKeyboardControls();
        this.createDebugPanel();
    }

    // Initialize debug mode with map manager reference
    initialize(mapManager: any, currentMapConfig: any): void {
        this.mapManager = mapManager;
        this.currentMapConfig = currentMapConfig;
        this.updateMapInfo();
        // Panel is already visible by default when debug mode is enabled
    }

    private setupKeyboardControls(): void {
        const keyboard = this.scene.input.keyboard;

        // Reload current map with M
        keyboard?.on('keydown-M', () => {
            this.reloadCurrentMap();
        });

        // Random new map with N
        keyboard?.on('keydown-N', () => {
            this.loadRandomMap();
        });

        // Map selection shortcuts (1-4)
        keyboard?.on('keydown-ONE', () => this.loadSpecificMap(0));
        keyboard?.on('keydown-TWO', () => this.loadSpecificMap(1));
        keyboard?.on('keydown-THREE', () => this.loadSpecificMap(2));
        keyboard?.on('keydown-FOUR', () => this.loadSpecificMap(3));

        // Restart scene
        keyboard?.on('keydown-R', () => {
            this.scene.scene.restart();
        });

        // Toggle mute with S
        keyboard?.on('keydown-S', () => {
            this.scene.sound.mute = !this.scene.sound.mute;
            console.log(`Audio ${this.scene.sound.mute ? 'muted' : 'unmuted'}`);
        });

        // Pause/Resume
        keyboard?.on('keydown-P', () => {
            if (this.scene.scene.isPaused()) {
                this.scene.scene.resume();
                console.log('Scene resumed');
            } else {
                this.scene.scene.pause();
                console.log('Scene paused');
            }
        });

        // Toggle grid overlay
        keyboard?.on('keydown-G', () => {
            this.toggleGrid();
        });

        // Scene info
        keyboard?.on('keydown-I', () => {
            this.logSceneInfo();
        });

        // Toggle fullscreen with F11
        keyboard?.on('keydown-F11', () => {
            if (this.scene.scale.isFullscreen) {
                this.scene.scale.stopFullscreen();
            } else {
                this.scene.scale.startFullscreen();
            }
        });

        // Player debug controls
        keyboard?.on('keydown-T', () => {
            this.togglePlayerPhysics();
        });

        keyboard?.on('keydown-Y', () => {
            this.resetPlayerPosition();
        });
    }

    private createDebugPanel(): void {
        this.debugPanel = this.scene.add.container(10, 10);
        this.debugPanel.setDepth(10000);
        this.debugPanel.setVisible(true); // Always visible when debug mode is enabled

        // Background for debug panel
        const panelBg = this.scene.add.rectangle(0, 0, 320, 340, 0x000000, 0.8);
        panelBg.setOrigin(0, 0);
        panelBg.setStrokeStyle(2, 0x00ff00);

        // Title
        const title = this.scene.add.text(10, 10, 'DEBUG PANEL', {
            fontSize: '16px',
            color: '#00ff00',
            fontStyle: 'bold'
        });

        // Control instructions - moved to top after title
        const instructions = [
            'CONTROLS:',
            'M - Reload current map',
            'N - Load random map',
            '1-4 - Load specific map',
            'R - Restart scene',
            'S - Toggle mute',
            'P - Pause/Resume',
            'G - Toggle grid',
            'I - Log scene info',
            'F11 - Toggle fullscreen',
            '',
            'PLAYER DEBUG:',
            'T - Toggle player physics',
            'Y - Reset player position'
        ];

        instructions.forEach((text, index) => {
            const color = index === 0 || index === 11 ? '#ffff00' : '#ffffff';
            const fontSize = index === 0 || index === 11 ? '12px' : '10px';
            const instructionText = this.scene.add.text(10, 35 + (index * 15), text, {
                fontSize,
                color,
                fontStyle: index === 0 || index === 11 ? 'bold' : 'normal'
            });
            this.debugPanel.add(instructionText);
        });

        // Current map info - moved below controls
        const mapInfo = this.scene.add.text(10, 260, 'Current Map: Loading...', {
            fontSize: '12px',
            color: '#ffffff'
        });

        // Performance info
        const fpsText = this.scene.add.text(10, 280, 'FPS: 60', {
            fontSize: '10px',
            color: '#ffff00'
        });

        // Game state info
        const gameStateText = this.scene.add.text(10, 300, '', {
            fontSize: '10px',
            color: '#ffffff'
        });

        // Player info
        const playerInfo = this.scene.add.text(10, 320, '', {
            fontSize: '10px',
            color: '#ffffff'
        });

        // Add all elements to container
        this.debugPanel.add([panelBg, title, mapInfo, fpsText, gameStateText, playerInfo]);

        // Store references for updates
        this.debugPanel.setData('mapInfo', mapInfo);
        this.debugPanel.setData('fpsText', fpsText);
        this.debugPanel.setData('gameStateText', gameStateText);
        this.debugPanel.setData('playerInfo', playerInfo);
    }

    // Public methods for ArenaScene to call
    update(time: number, delta: number): void {
        if (this.debugPanel) {
            const fpsText = this.debugPanel.getData('fpsText');
            const gameStateText = this.debugPanel.getData('gameStateText');
            const playerInfo = this.debugPanel.getData('playerInfo');
            
            const fps = Math.round(this.scene.game.loop.actualFps);
            fpsText?.setText(`FPS: ${fps} | Delta: ${delta.toFixed(1)}ms`);
            
            // Update game state info
            const soundCount = (this.scene.sound as any).sounds?.length || 0;
            const gameState = [
                `Objects: ${this.scene.children.length}`,
                `Sounds: ${soundCount}`,
                `Paused: ${this.scene.scene.isPaused()}`
            ].join(' | ');
            gameStateText?.setText(gameState);

            // Update player info
            const players = this.scene.children.getChildren().filter(child => 
                child.type === 'Sprite' && (child as any).body && 
                (child as any).texture?.key?.includes('_Idle')
            );
            
            if (players.length > 0) {
                const player = players[0] as Phaser.Physics.Arcade.Sprite;
                const playerData = `Player: (${Math.round(player.x)}, ${Math.round(player.y)}) | Texture: ${player.texture.key}`;
                playerInfo?.setText(playerData);
            } else {
                playerInfo?.setText('Player: Not found');
            }
        }
    }

    private reloadCurrentMap(): void {
        if (!this.mapManager || !this.currentMapConfig) return;

        // Stop all audio using both methods for safety
        this.scene.sound.stopAll();
        this.mapManager.stopCurrentMusic();
        
        // Clear background
        this.clearMapBackground();

        // Small delay to ensure audio is fully stopped before starting new music
        this.scene.time.delayedCall(100, () => {
            // Reload same map
            this.mapManager.setupMap(this.scene, this.currentMapConfig);
            console.log(`Reloaded map: ${this.currentMapConfig.name || 'Unknown'}`);
        });
    }

    private loadRandomMap(): void {
        if (!this.mapManager) return;

        // Stop all audio using both methods for safety
        this.scene.sound.stopAll();
        this.mapManager.stopCurrentMusic();
        
        this.clearMapBackground();

        // Small delay to ensure audio is fully stopped before starting new music
        this.scene.time.delayedCall(100, () => {
            // Get new random map
            this.currentMapConfig = this.mapManager.getRandomMapConfig();
            this.mapManager.setupMap(this.scene, this.currentMapConfig);
            
            this.updateMapInfo();
            console.log(`Loaded new map: ${this.currentMapConfig.name || 'Unknown'}`);
        });
    }

    private loadSpecificMap(index: number): void {
        if (!this.mapManager) return;

        // Use the new getter to access map configs
        const allMaps = this.mapManager.allMapConfigs;
        
        if (index >= 0 && index < allMaps.length) {
            // Stop all audio using both methods for safety
            this.scene.sound.stopAll();
            this.mapManager.stopCurrentMusic();
            
            this.clearMapBackground();

            // Small delay to ensure audio is fully stopped before starting new music
            this.scene.time.delayedCall(100, () => {
                this.currentMapConfig = allMaps[index];
                this.mapManager.setupMap(this.scene, this.currentMapConfig);
                
                this.updateMapInfo();
                console.log(`Loaded specific map: ${this.currentMapConfig.name || `Map ${index + 1}`}`);
            });
        } else {
            console.warn(`Map index ${index + 1} not available. Total maps: ${allMaps.length}`);
        }
    }

    private clearMapBackground(): void {
        // Clear existing background images/sprites
        this.scene.children.getChildren().forEach(child => {
            if (child.type === 'Image' && (child as any).depth <= 0) {
                child.destroy();
            }
        });
    }

    private toggleGrid(): void {
        const existingGrid = this.scene.children.getByName('debugGrid');
        if (existingGrid) {
            existingGrid.destroy();
            console.log('Grid hidden');
        } else {
            this.createGrid();
            console.log('Grid shown');
        }
    }

    private createGrid(): void {
        const graphics = this.scene.add.graphics();
        graphics.setName('debugGrid');
        graphics.setDepth(9998);
        
        const gridSize = 50;
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        graphics.lineStyle(1, 0x00ff00, 0.3);

        // Vertical lines
        for (let x = 0; x <= width; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }

        // Horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }

        graphics.strokePath();
    }

    private logSceneInfo(): void {
        console.group('Scene Debug Info');
        console.log('Scene Key:', this.scene.scene.key);
        console.log('Current Map:', this.currentMapConfig);
        console.log('Active Objects:', this.scene.children.length);
        console.log('Camera:', {
            x: this.scene.cameras.main.scrollX,
            y: this.scene.cameras.main.scrollY,
            zoom: this.scene.cameras.main.zoom
        });
        console.log('Sound:', {
            muted: this.scene.sound.mute,
            volume: this.scene.sound.volume
        });
        console.groupEnd();
    }

    private updateMapInfo(): void {
        if (this.debugPanel) {
            const mapInfo = this.debugPanel.getData('mapInfo');
            const mapName = this.currentMapConfig?.name || 'Unknown';
            mapInfo?.setText(`Current Map: ${mapName}`);
        }
    }

    private togglePlayerPhysics(): void {
        // Find all player sprites in the scene
        const players = this.scene.children.getChildren().filter(child => 
            child.type === 'Sprite' && (child as any).body && 
            (child as any).texture?.key?.includes('_Idle')
        );

        players.forEach(player => {
            const sprite = player as Phaser.Physics.Arcade.Sprite;
            if (sprite.body) {
                const wasEnabled = sprite.body.enable;
                sprite.body.enable = !wasEnabled;
                console.log(`Player physics ${wasEnabled ? 'disabled' : 'enabled'}`);
            }
        });
    }

    private resetPlayerPosition(): void {
        // Find all player sprites and reset to spawn position
        const players = this.scene.children.getChildren().filter(child => 
            child.type === 'Sprite' && (child as any).body && 
            (child as any).texture?.key?.includes('_Idle')
        );

        players.forEach(player => {
            const sprite = player as Phaser.Physics.Arcade.Sprite;
            sprite.setPosition(500, 700); // Default spawn position
            if (sprite.body && 'setVelocity' in sprite.body) {
                (sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
            }
            console.log('Player position reset');
        });
    }

    enable(): void {
        this.isEnabled = true;
        this.debugGraphics.setVisible(true);
    }

    disable(): void {
        this.isEnabled = false;
        this.debugGraphics.setVisible(false);
        this.debugPanel.setVisible(false);
    }

    toggle(): void {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    drawBounds(object: Phaser.GameObjects.GameObject): void {
        if (!this.isEnabled) return;

        // Type check for objects that have getBounds method
        if ('getBounds' in object && typeof (object as any).getBounds === 'function') {
            const bounds = (object as any).getBounds();
            this.debugGraphics.lineStyle(2, 0xff0000);
            this.debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        } else if ('x' in object && 'y' in object && 'width' in object && 'height' in object) {
            // Fallback for objects with basic position/size properties
            const obj = object as any;
            this.debugGraphics.lineStyle(2, 0xff0000);
            this.debugGraphics.strokeRect(obj.x, obj.y, obj.width || 10, obj.height || 10);
        }
    }

    drawPoint(x: number, y: number, color: number = 0x00ff00): void {
        if (!this.isEnabled) return;

        this.debugGraphics.fillStyle(color);
        this.debugGraphics.fillCircle(x, y, 3);
    }

    clear(): void {
        this.debugGraphics.clear();
    }

    destroy(): void {
        this.debugGraphics.destroy();
        this.debugPanel.destroy();
    }
}