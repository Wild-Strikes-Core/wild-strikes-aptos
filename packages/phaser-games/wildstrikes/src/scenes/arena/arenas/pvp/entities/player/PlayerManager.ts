import { PlayerSpriteManager } from "./PlayerSpriteManager";
import { PlayerStatsUI } from "../../systems/ui/PlayerStatsUI";
import { 
    PlayerState,
    PlayerStates,
    IdleState, 
    SprintingState, 
    CrouchingState,
    CrouchWalkingState,
    JumpingState, 
    DashingState, 
    AttackingLightState, 
    AttackingHeavyState 
} from "./states";

export class PlayerManager {
    private spriteManager: PlayerSpriteManager;
    private statsUI: PlayerStatsUI | null = null;
    private states: Map<PlayerStates, PlayerState> = new Map();
    private currentState: PlayerState | null = null;
    private scene: Phaser.Scene;

    private player: Phaser.Physics.Arcade.Sprite | null = null;

    private keyObjects: { [key: string]: Phaser.Input.Keyboard.Key } = {};
    private enabledInput: boolean = true;
    
    // Mouse button states
    private mouseButtons: { left: boolean; right: boolean } = { left: false, right: false };
    private mouseButtonsJustPressed: { left: boolean; right: boolean } = { left: false, right: false };
    
    // Key just pressed tracking for jump
    private jumpJustPressed: boolean = false;

    private roomId: string;
    private playerId: string;

    // Client prediction properties
    private sequenceNumber: number = 0;
    private lastSentInputs: any = null; // Track last sent inputs to avoid spam
    private lastSentPosition: { x: number; y: number } = { x: 0, y: 0 };
    private lastSentState: string = 'idle'; // Track last sent state to detect state changes

    private networkManager?: any; // Will be injected by ArenaScene

    // Add rate limiting properties
    private lastInputSent: number = 0;
    private readonly INPUT_RATE_LIMIT = 16; // ~60fps max

    // UI update throttling
    private lastUIUpdate: number = 0;
    private readonly UI_UPDATE_RATE = 100; // Update UI every 100ms for performance

    constructor(scene: Phaser.Scene, isInputEnabled: boolean = true, roomId: string, playerId: string = '') {
        this.scene = scene;
        this.enabledInput = isInputEnabled;
        this.roomId = roomId;
        this.playerId = playerId; // ✅ Set playerId from constructor
        this.spriteManager = new PlayerSpriteManager(this.scene);
        this.initializeStates();

        this.currentState = this.states.get(PlayerStates.Idle)!;

        if (this.enabledInput) {
            this.keyObjects = scene.input.keyboard.addKeys({
                left: 'A',
                right: 'D',
                up: 'W',
                jump: 'SPACE',
                dash: 'Q',
                crouch: 'CTRL'
            }) as { [key: string]: Phaser.Input.Keyboard.Key };
            
            // Prevent browser shortcuts for game keys
            scene.input.keyboard.on('keydown', (event: KeyboardEvent) => {
                // Prevent Ctrl+D (bookmark), Ctrl+W (close tab), Ctrl+Space (spotlight), etc.
                if (event.ctrlKey && ['KeyD', 'KeyW', 'KeyA', 'KeyS', 'KeyQ', 'Space'].includes(event.code)) {
                    event.preventDefault();
                }
                // Prevent F5 refresh during gameplay
                if (event.code === 'F5') {
                    event.preventDefault();
                }
                
                // Track jump just pressed
                if (event.code === 'Space' && !event.repeat) {
                    this.jumpJustPressed = true;
                }
            });
            
            scene.input.keyboard.on('keyup', (event: KeyboardEvent) => {
                // Reset jump just pressed on key release
                if (event.code === 'Space') {
                    this.jumpJustPressed = false;
                }
            });
            
            // Disable right-click context menu
            scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
                if (pointer.button === 2) { // Right mouse button
                    pointer.event.preventDefault();
                }
            });
            
            // Also disable context menu at the DOM level
            const canvas = scene.game.canvas;
            if (canvas) {
                canvas.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    return false;
                });
                
                // Also prevent on the parent container
                canvas.parentElement?.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    return false;
                });
            }
            
            // Set up mouse button event listeners
            this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.button === 0) { // Left mouse button
                    this.mouseButtons.left = true;
                    this.mouseButtonsJustPressed.left = true;
                }
                if (pointer.button === 2) { // Right mouse button
                    this.mouseButtons.right = true;
                    this.mouseButtonsJustPressed.right = true;
                    // Prevent context menu
                    pointer.event.preventDefault();
                }
            });
            
            this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
                if (pointer.button === 0) { // Left mouse button
                    this.mouseButtons.left = false;
                }
                if (pointer.button === 2) { // Right mouse button
                    this.mouseButtons.right = false;
                }
            });
            
            // ✅ ADD: Listen for server updates
            this.setupServerEventListeners();
        }
    }

    private setupServerEventListeners(): void {
        if (!this.networkManager) {
            // Set up listeners when networkManager is available
            setTimeout(() => this.setupServerEventListeners(), 100);
            return;
        }

        console.log('[PLAYER MANAGER] Server event listeners set up - server reconciliation handled in ArenaScene');
        // Note: Server reconciliation and player context updates are now handled in ArenaScene
        // via the networkManager.onPlayerContextsReceived() callback
    }

    public setNetworkManager(networkManager: any): void {
        this.networkManager = networkManager;
        if (this.enabledInput) {
            this.setupServerEventListeners();
        }
    }

   
    public createPlayer(x: number, y: number): Phaser.Physics.Arcade.Sprite {
        this.player = this.spriteManager.createPlayerSprite(x, y);
        this.player.setDepth(1); // Ensure player is rendered above other entities
        if (this.enabledInput) {
            this.player.setTint(0x00fffff);
            // Create stats UI for local player only
            this.statsUI = new PlayerStatsUI(this.scene, this.player);
        } else {
            this.player.clearTint();
        }
        this.setupCollisions();
        this.currentState?.enter();
        return this.player;
    }

    private setupCollisions(): void {
        const platform = (this.scene as any).platform; // Assuming platforms is defined in the scene
        this.scene.physics.add.collider(this.player, platform, () => {
            if (this.currentState instanceof JumpingState) {
                this.currentState.onLand();
            }
        });
    }

    public update(): void {
        if (!this.player) return;
        
        if (this.enabledInput) {
            this.captureAndProcessInput();
        }
        
        this.currentState?.update();
        
        // Check for state changes and send updates even without input changes
        if (this.enabledInput && this.networkManager) {
            this.sendStateUpdatesIfChanged();
        }
        
        // Update stats UI position and real-time data (throttled for performance)
        const now = Date.now();
        if (this.statsUI && this.player && (now - this.lastUIUpdate >= this.UI_UPDATE_RATE)) {
            this.lastUIUpdate = now;
            this.statsUI.update();
            
            // Update real-time position, velocity, and animation with stored server stats
            const currentAnimation = this.player.anims?.currentAnim?.key || 'idle';
            this.statsUI.updateStats({
                ...this.serverStats, // Use server-provided health, damage, lives
                position: { 
                    x: this.player.x, 
                    y: this.player.y 
                },
                velocity: { 
                    x: this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.x : 0,
                    y: this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.y : 0
                },
                animation: currentAnimation
            });
        } else if (this.statsUI) {
            // Always update position for smooth following
            this.statsUI.update();
        }
    }

    // filepath: /home/j3yz/Documents/GitHub/wild-strikes-aptos/packages/phaser-games/wildstrikes/src/scenes/arena/arenas/pvp/entities/player/PlayerManager.ts
    private captureAndProcessInput(): void {
        const now = Date.now();

        // Capture current inputs BEFORE resetting just-pressed flags
        const inputs = {
            left: this.keyObjects.left?.isDown || false,
            right: this.keyObjects.right?.isDown || false,
            jump: this.jumpJustPressed,
            crouch: this.keyObjects.crouch?.isDown || false,
            dash: this.keyObjects.dash?.isDown || false,
            lightAttack: this.mouseButtonsJustPressed.left,
            heavyAttack: this.mouseButtonsJustPressed.right
        };
        
        // Debug logging for attacks
        if (this.mouseButtonsJustPressed.left || this.mouseButtonsJustPressed.right) {
            console.log('Attack input detected:', { light: this.mouseButtonsJustPressed.left, heavy: this.mouseButtonsJustPressed.right });
        }
        
        // Debug logging for jump
        if (this.jumpJustPressed) {
            console.log('Jump input detected');
        }
        
        // Send input-based updates BEFORE resetting flags (so we can compare properly)
        this.sendInputBasedUpdates(inputs, now);
        
        // Reset "just pressed" flags AFTER sending to server
        this.mouseButtonsJustPressed.left = false;
        this.mouseButtonsJustPressed.right = false;
        this.jumpJustPressed = false;
        
        // Apply input locally for client-side prediction
        if (this.currentState && 'handleInput' in this.currentState) {
            (this.currentState as any).handleInput(inputs);
        }
    }

    private sendInputBasedUpdates(inputs: any, now: number): void {
        const shouldSendToServer = now - this.lastInputSent >= this.INPUT_RATE_LIMIT;
        
        if (!shouldSendToServer || !this.networkManager) return;
        
        this.lastInputSent = now;
        
        const currentPosition = {
            x: this.player?.x || 0,
            y: this.player?.y || 0
        };
        
        // Check for input changes
        const hasInputChanges = !this.lastSentInputs || JSON.stringify(inputs) !== JSON.stringify(this.lastSentInputs);
        
        // Check for significant position changes (movement)
        const hasPositionChanges = Math.abs(currentPosition.x - this.lastSentPosition.x) > 0.5 || 
                                 Math.abs(currentPosition.y - this.lastSentPosition.y) > 0.5;
        
        // Check if any movement keys are held down (continuous movement should be sent)
        const hasMovementInput = inputs.left || inputs.right || inputs.jump || inputs.crouch || inputs.dash;
        
        // Send if there are input changes, position changes, or active movement
        if (hasInputChanges || hasPositionChanges || hasMovementInput) {
            const reason = hasInputChanges ? 'INPUT_CHANGE' : 
                          hasPositionChanges ? 'POSITION_CHANGE' : 'MOVEMENT_ACTIVE';
            
            this.sendPlayerContextToServer(inputs, currentPosition, now, reason as any);
            
            console.log(`[PLAYER MANAGER] 📡 Sending update: input=${hasInputChanges}, pos=${hasPositionChanges}, movement=${hasMovementInput}`);
        } else {
            console.log('[PLAYER MANAGER] ⏹️ No changes detected - skipping update');
        }
    }

    private sendStateUpdatesIfChanged(): void {
        const now = Date.now();
        const currentStateString = this.mapPhaserStateToPlayerState(this.currentState);
        
        // Check if state changed without input change (e.g., attack finished -> idle)
        if (currentStateString !== this.lastSentState) {
            const shouldSendToServer = now - this.lastInputSent >= this.INPUT_RATE_LIMIT;
            
            if (shouldSendToServer) {
                this.lastInputSent = now;
                
                const currentPosition = {
                    x: this.player?.x || 0,
                    y: this.player?.y || 0
                };
                
                // Send with current input state (might be different from what triggered the original state)
                const currentInputs = {
                    left: this.keyObjects.left?.isDown || false,
                    right: this.keyObjects.right?.isDown || false,
                    jump: false, // No just-pressed states for state updates
                    crouch: this.keyObjects.crouch?.isDown || false,
                    dash: this.keyObjects.dash?.isDown || false,
                    lightAttack: false,
                    heavyAttack: false
                };
                
                this.sendPlayerContextToServer(currentInputs, currentPosition, now, 'STATE_CHANGE');
                
                console.log(`[PLAYER MANAGER] 📋 State changed from '${this.lastSentState}' to '${currentStateString}' - sending update`);
            }
        }
        
        // Always update last sent state to track changes
        this.lastSentState = currentStateString;
    }

    private sendPlayerContextToServer(inputs: any, currentPosition: any, now: number, reason: 'INPUT_CHANGE' | 'STATE_CHANGE' | 'POSITION_CHANGE' | 'MOVEMENT_ACTIVE' | 'STATE_TRANSITION'): void {
        const playerContext = {
            socketId: this.playerId,
            position: {
                x: currentPosition.x,
                y: currentPosition.y,
                facing: (this.player?.scaleX === 1 ? 'right' : 'left') as 'left' | 'right'
            },
            velocityX: this.player?.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.x : 0,
            velocityY: this.player?.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.y : 0,
            inputs: inputs,
            state: this.mapPhaserStateToPlayerState(this.currentState),
            playerStats: this.serverStats,
            isAlive: true,
            sequenceNumber: ++this.sequenceNumber,
            timestamp: now
        };

        console.log(`[PLAYER MANAGER] 📤 Sending player context (${reason}):`, {
            socketId: playerContext.socketId,
            position: playerContext.position,
            inputs: playerContext.inputs,
            state: playerContext.state,
            sequenceNumber: playerContext.sequenceNumber,
            reason
        });

        // Send via server-authoritative system
        this.networkManager.sendPlayerContext(playerContext);

        // Update last sent data
        this.lastSentInputs = { ...inputs };
        this.lastSentPosition = { ...currentPosition };
        this.lastSentState = playerContext.state;
    }

    // Helper method to map Phaser state to PlayerContext state
    private mapPhaserStateToPlayerState(currentState: PlayerState | null): string {
        if (!currentState) return 'idle';
        
        const stateName = currentState.constructor.name;
        
        switch (stateName) {
            case 'IdleState': return 'idle';
            case 'SprintingState': return 'sprinting';
            case 'CrouchingState': return 'crouching';
            case 'CrouchWalkingState': return 'crouchWalking';
            case 'JumpingState': return 'jumping';
            case 'DashingState': return 'dashing';
            case 'AttackingLightState': return 'attackingLight';
            case 'AttackingHeavyState': return 'attackingHeavy';
            default: return 'idle';
        }
    }

    public transitionTo(stateName: PlayerStates): void {
        const newState = this.states.get(stateName);
        if (newState && newState !== this.currentState) {
            const oldStateName = this.mapPhaserStateToPlayerState(this.currentState);
            const newStateName = this.mapPhaserStateToPlayerState(newState);
            
            console.log(`[PLAYER MANAGER] 🔄 State transition: ${oldStateName} → ${newStateName}`);
            
            this.currentState?.exit();
            this.currentState = newState;
            this.currentState.enter();
            
            // Force immediate state update to server for local player
            if (this.enabledInput && this.networkManager) {
                this.forceStateUpdate(newStateName);
            }
        }
    }
    
    private forceStateUpdate(newStateName: string): void {
        const now = Date.now();
        
        // Check if enough time has passed since last update (respect rate limiting)
        const shouldSendToServer = now - this.lastInputSent >= this.INPUT_RATE_LIMIT;
        
        if (!shouldSendToServer) {
            // If rate limited, schedule the update for the next available slot
            setTimeout(() => this.forceStateUpdate(newStateName), this.INPUT_RATE_LIMIT);
            return;
        }
        
        this.lastInputSent = now;
        
        const currentPosition = {
            x: this.player?.x || 0,
            y: this.player?.y || 0
        };
        
        // Send with current input state
        const currentInputs = {
            left: this.keyObjects.left?.isDown || false,
            right: this.keyObjects.right?.isDown || false,
            jump: false, // No just-pressed states for forced updates
            crouch: this.keyObjects.crouch?.isDown || false,
            dash: this.keyObjects.dash?.isDown || false,
            lightAttack: false,
            heavyAttack: false
        };
        
        this.sendPlayerContextToServer(currentInputs, currentPosition, now, 'STATE_TRANSITION');
        
        console.log(`[PLAYER MANAGER] ⚡ FORCED state update sent: '${this.lastSentState}' → '${newStateName}'`);
        
        // Update tracking variables
        this.lastSentState = newStateName;
    }

    private initializeStates(): void {
        this.states.set(PlayerStates.Idle, new IdleState(this));
        this.states.set(PlayerStates.Sprinting, new SprintingState(this));
        this.states.set(PlayerStates.Crouching, new CrouchingState(this));
        this.states.set(PlayerStates.CrouchWalking, new CrouchWalkingState(this));
        this.states.set(PlayerStates.Jumping, new JumpingState(this));
        this.states.set(PlayerStates.Dashing, new DashingState(this));
        this.states.set(PlayerStates.AttackingLight, new AttackingLightState(this));
        this.states.set(PlayerStates.AttackingHeavy, new AttackingHeavyState(this));
    }
    
    // state utilities
    public getPlayerSprite(): Phaser.Physics.Arcade.Sprite | null { return this.player; }
    public getScene(): Phaser.Scene { return this.scene; }
    public getSpriteManager(): PlayerSpriteManager { return this.spriteManager; }
    public getKeyObjects(): any { return this.keyObjects; }
    public isInputEnabled(): boolean { return this.enabledInput; }
    public getCurrentState(): PlayerState | null { return this.currentState; }

    // Update player stats (for local player only)
    private serverStats = { health: 100, damagePercentage: 0, lives: 3 };
    
    public updatePlayerStats(stats: { health: number; damagePercentage: number; lives: number }): void {
        // Store server stats
        this.serverStats = { ...stats };
        
        if (this.statsUI && this.player) {
            // Combine server stats with real-time data
            const currentAnimation = this.player.anims?.currentAnim?.key || 'unknown';
            this.statsUI.updateStats({
                ...this.serverStats,
                position: { 
                    x: this.player.x, 
                    y: this.player.y 
                },
                velocity: { 
                    x: this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.x : 0,
                    y: this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.y : 0
                },
                animation: currentAnimation
            });
        }
    }

    // Clean up resources
    public destroy(): void {
        if (this.statsUI) {
            this.statsUI.destroy();
            this.statsUI = null;
        }
    }

}