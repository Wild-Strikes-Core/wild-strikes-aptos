import { MapManager } from "./MapManager";
import { AssetLoader } from "../../AssetLoader";
import { DebugMode } from "./DebugMode";
import { PlayerManager } from "./PlayerManager";
import { MobileButton } from "./components/mobButton";

import { io, Socket } from 'socket.io-client';

export default class Arena extends Phaser.Scene {

    private mapManager: MapManager;
    private debugMode: DebugMode;

    private playerManager: Map<string, PlayerManager> = new Map();
    private localPlayer: string = 'playerONE';

    private currentMapConfig: any;

    private joystick: any;
    
    // Enable/disable debug mode - set to false for production
    private static readonly DEBUG_ENABLED = true;

    // socket (shaket </3)
    private socket: Socket | null = null;
    private roomId: string = '';
    private isMultiplayer: boolean = false;
    private lastUpdateTime: number = 0;

    constructor() {
        super({ key: "Arena" });
    }

    preload(): void {

        this.mapManager = new MapManager();
        
        // Load gameplay and audio assets needed for the arena
        const loader = new AssetLoader(this.load);
        loader.loadGroup('gameplay');
        loader.loadGroup('gameplay-audio');
        // Load character sprites
        loader.loadGroup('chars');

        this.load.plugin('rexvirtualjoystickplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js', true);
    }

    create(): void {
        const gameData = this.scene.settings.data as any;
        if (gameData && gameData.isMultiplayer) {
            this.isMultiplayer = true;
            this.socket = gameData.socket;
            this.roomId = gameData.roomId;
            this.setupMultiplayerGame(gameData);
        } else {
            this.setupSinglePlayerGame();
        }

        this.setupMobileControls();

    }
        

    update(time: number, delta: number): void {
        // Update debug mode if enabled
        if (Arena.DEBUG_ENABLED && this.debugMode) {
            this.debugMode.update(time, delta);
        }

        // Update player managers - this will call handleMovement() for each player
        this.playerManager.forEach((playerManager) => {
            playerManager.update();
        });

        // Send position updates for local player in multiplayer (throttled)
        if (this.isMultiplayer && this.socket) {
            // Throttle to 20 updates per second instead of 60fps
            if (time - (this.lastUpdateTime || 0) > 50) {
                this.sendLocalPlayerUpdate();
                this.lastUpdateTime = time;
            }
        }
    }

    // to be refactored into: ArenaNetworking.ts

    private setupSinglePlayerGame(): void {
        this.currentMapConfig = this.mapManager.getRandomMapConfig();
        this.mapManager.setupMap(this, this.currentMapConfig);

        if (Arena.DEBUG_ENABLED) {
            this.debugMode = new DebugMode(this);
            this.debugMode.enable();
            this.debugMode.initialize(this.mapManager, this.currentMapConfig);
        }

        const spawnX = this.cameras.main.width / 2; // Center horizontally
        const spawnY = 200; // High up in the air

        this.spawnPlayer(this.localPlayer, spawnX, spawnY, true);
        this.spawnPlayer('playerTWO', spawnX + 300, spawnY, false);
    }

    private setupMultiplayerGame(gameData: any): void {
        // Use random map for now (will be overridden by server)
        this.currentMapConfig = this.mapManager.getRandomMapConfig();
        this.mapManager.setupMap(this, this.currentMapConfig);

        this.activateMultiplayerListeners();

        this.socket?.emit('player:ready', { playerId: this.socket.id });
    }

    private activateMultiplayerListeners(): void {
        this.socket.on('player:connected', (data) => {
            console.log('Player connected:', data);

            // Update to synchronized map if provided
            if (data.mapId !== undefined) {
                console.log('Switching to synchronized map:', data.mapId);
                this.currentMapConfig = this.mapManager.allMapConfigs[data.mapId];
                this.mapManager.setupMap(this, this.currentMapConfig);
            }

            const localPlayerId = this.socket.id;
            const player1 = data.player;
            const player2 = data.player2;

            if (player1.id === localPlayerId) {
                // We are player 1
                this.spawnPlayer(player1.id, player1.spawnX, player1.spawnY, true);
                this.spawnPlayer(player2.id, player2.spawnX, player2.spawnY, false);
            } else {
                // We are player 2
                this.spawnPlayer(player2.id, player2.spawnX, player2.spawnY, true);
                this.spawnPlayer(player1.id, player1.spawnX, player1.spawnY, false);
            }
        });

        // Receive opponent position updates
        this.socket.on('player:position', (data) => {
            console.log('Received player position:', data.playerId, 'anim:', data.anim);
            // Only update if this is not our own position
            if (data.playerId !== this.socket.id) {
                this.updateRemotePlayer(data);
            }
        });

        // Handle disconnection
        this.socket.on('player:disconnected', (data) => {
            console.log('Player disconnected:', data);
            // Show disconnection UI
        });

        // Handle reconnection
        this.socket.on('player:reconnected', (data) => {
            console.log('Player reconnected:', data);
            // Hide disconnection UI
        });

        // Handle match ended
        this.socket.on('match:ended', (data) => {
            console.log('Match ended:', data);
            // Show match result screen
        });
    }

    private updateRemotePlayer(data: any): void {
        const remotePlayerManager = this.playerManager.get(data.playerId);
        if (remotePlayerManager) {
            remotePlayerManager.applyRemoteUpdate(data);
        }
    }

    private sendLocalPlayerUpdate(): void {
        const localPlayerManager = this.playerManager.get(this.localPlayer);
        if (localPlayerManager) {
            const player = localPlayerManager.getPlayerSprite();
            if (player && player.body) {
                // Get current animation state
                const currentAnim = player.anims.currentAnim?.key || '_Idle';
                
                this.socket!.emit('player:move', {
                    playerId: this.socket.id, // Add playerId to identify the player
                    x: player.x,
                    y: player.y,
                    velocityX: player.body.velocity.x,
                    velocityY: player.body.velocity.y,
                    flipX: player.flipX,
                    anim: currentAnim,
                    timestamp: Date.now() // Add timestamp for synchronization
                });
            }
        }
    }

    /* ------------------------------------------------------------------
     * Scene shutdown cleanup
     * ------------------------------------------------------------------ */
    shutdown(): void {
        // Clean up debug mode
        if (this.debugMode) {
            this.debugMode.destroy();
        }

        // Clean up map manager
        if (this.mapManager) {
            this.mapManager.destroy();
        }
    }

    destroy(): void {
        this.shutdown();
    }

    setupMobileControls(): void {
        const localPlayerManager = this.playerManager.get(this.localPlayer);

        // movement joystick
        this.joystick = (this.plugins.get('rexvirtualjoystickplugin') as any).add(this, {
            x: 400,
            y: this.cameras.main.height - 300,
            radius: 100,
        });
        
        if (this.joystick) {
            this.joystick.base.setScrollFactor(0);
            this.joystick.thumb.setScrollFactor(0);
            this.joystick.base.setScale(0.8);
            this.joystick.thumb.setScale(0.8);
        }

        // Attack button
        const attackButton = new MobileButton(this, {
            x: this.cameras.main.width - 300,
            y: this.cameras.main.height - 200,
            radius: 50,
            color: 0xff0000,
            alpha: 0.5,
            text: 'ATK',
            onPress: () => {
                console.log('Attack button pressed!');
                localPlayerManager?.triggerLightAttack();
            }
        });

        // Jump button
        const jumpButton = new MobileButton(this, {
            x: this.cameras.main.width - 300,
            y: this.cameras.main.height - 320,
            radius: 45,
            color: 0x00ff00,
            alpha: 0.5,
            text: 'JUMP',
            onPress: () => {
                console.log('Jump button pressed!');
                localPlayerManager?.triggerJump();
            }
        });
    }


    // for multiplayer-proof code
    spawnPlayer(playerId: string, spawnX: number, spawnY: number, isLocal: boolean = false) : void {
        const playerManager = new PlayerManager(this, isLocal);
        playerManager.createPlayer(spawnX, spawnY);
        this.playerManager.set(playerId, playerManager);
        if (isLocal) {
            this.localPlayer = playerId;
            
            this.cameras.main.startFollow(playerManager.getPlayerSprite(), true);
            this.cameras.main.setZoom(1.3, 1.3);
            this.cameras.main.setBounds(0, 0, 1920, 1080);
        }
    }

    removePlayer(playerId: string): void {
        const player = this.playerManager.get(playerId);
        if (player) {
            player.destroy?.();
            this.playerManager.delete(playerId);
        }
    }

    getLocalPlayer(): Phaser.Physics.Arcade.Sprite | null {
        const localPlayer = this.playerManager.get(this.localPlayer);
        return localPlayer?.getPlayerSprite();
    }

    getAllPlayers(): Phaser.Physics.Arcade.Sprite[] {
        return Array.from(this.playerManager.values())
            .map(pm => pm.getPlayerSprite())
            .filter(sprite => sprite !== null);
    }
}
