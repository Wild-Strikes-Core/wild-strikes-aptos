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

    // Client-side prediction reconciliation
    private predictionBuffer: Array<{
        sequenceNumber: number;
        timestamp: number;
        position: { x: number; y: number };
        velocity: { x: number; y: number };
        inputs: any;
        state: string;
    }> = [];
    private serverState: any = null;
    private readonly MAX_PREDICTION_BUFFER = 60; // ~1 second at 60fps
    private readonly RECONCILIATION_THRESHOLD = 3; // pixels

    private networkManager?: any; // Will be injected by ArenaScene

    // Add rate limiting properties
    private lastInputSent: number = 0;
    private readonly INPUT_RATE_LIMIT = 16; // ~60fps max

    // UI update throttling
    private lastUIUpdate: number = 0;
    private readonly UI_UPDATE_RATE = 100; // Update UI every 100ms for performance

    // Remote player animation tracking
    private currentRemoteState: string = 'idle';
    private currentRemoteAnimation: string = '';
    private lastRemoteAnimationChange: number = 0;

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

        console.log('[PLAYER MANAGER] Server event listeners set up - enabling client-side prediction reconciliation');
        
        // Enable client-side prediction reconciliation for local player
        if (this.enabledInput) {
            console.log('[PLAYER MANAGER] 🎯 Client-side prediction reconciliation ENABLED');
        }
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
            // Periodically clean up old predictions
            this.cleanupOldPredictions();
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
                facing: (this.player?.flipX ? 'left' : 'right') as 'left' | 'right'
            },
            velocityX: this.player?.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.x : 0,
            velocityY: this.player?.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.y : 0,
            inputs: inputs,
            state: this.mapPhaserStateToPlayerState(this.currentState),
            playerStats: this.serverStats,
            isAlive: true,
            sequenceNumber: ++this.sequenceNumber, // Increment sequence number here
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

        // Store prediction for reconciliation (local player only)
        if (this.enabledInput) {
            this.storePrediction(playerContext, inputs, currentPosition);
        }

        // Send via server-authoritative system
        this.networkManager.sendPlayerContext(playerContext);

        // Update last sent data
        this.lastSentInputs = { ...inputs };
        this.lastSentPosition = { ...currentPosition };
        this.lastSentState = playerContext.state;
    }

    private storePrediction(playerContext: any, inputs: any, currentPosition: any): void {
        // Store client prediction for reconciliation
        this.predictionBuffer.push({
            sequenceNumber: playerContext.sequenceNumber,
            timestamp: playerContext.timestamp,
            position: { ...currentPosition },
            velocity: {
                x: playerContext.velocityX,
                y: playerContext.velocityY
            },
            inputs: { ...inputs },
            state: playerContext.state
        });

        // Keep buffer size reasonable
        if (this.predictionBuffer.length > this.MAX_PREDICTION_BUFFER) {
            this.predictionBuffer.shift();
        }

        console.log(`[PREDICTION] Stored prediction #${playerContext.sequenceNumber}, buffer size: ${this.predictionBuffer.length}`);
    }

    // Client-side prediction reconciliation
    public reconcileWithServer(serverPlayerContext: any): void {
        // Only reconcile for local player
        if (!this.enabledInput || serverPlayerContext.socketId !== this.playerId) {
            return;
        }

        const serverSequence = serverPlayerContext.sequenceNumber;
        const serverPosition = serverPlayerContext.position;
        const serverState = serverPlayerContext.state;

        console.log(`[RECONCILIATION] 🔍 Reconciling with server sequence #${serverSequence}`);

        // Find our prediction for this sequence number
        const predictionIndex = this.predictionBuffer.findIndex(p => p.sequenceNumber === serverSequence);

        if (predictionIndex === -1) {
            console.warn(`[RECONCILIATION] ⚠️ No prediction found for sequence #${serverSequence}`);
            return;
        }

        const prediction = this.predictionBuffer[predictionIndex];
        const clientPosition = prediction.position;
        const clientState = prediction.state;

        // Calculate position difference
        const positionDiff = Math.sqrt(
            Math.pow(serverPosition.x - clientPosition.x, 2) + 
            Math.pow(serverPosition.y - clientPosition.y, 2)
        );

        // Check for significant differences
        const needsPositionCorrection = positionDiff > this.RECONCILIATION_THRESHOLD;
        const needsStateCorrection = serverState !== clientState;

        console.log(`[RECONCILIATION] 📊 Differences:`, {
            positionDiff: positionDiff.toFixed(2),
            stateMatch: serverState === clientState,
            needsCorrection: needsPositionCorrection || needsStateCorrection,
            serverPos: serverPosition,
            clientPos: clientPosition,
            serverState,
            clientState
        });

        if (needsPositionCorrection || needsStateCorrection) {
            this.applyServerCorrection(serverPlayerContext, prediction, predictionIndex);
        } else {
            console.log(`[RECONCILIATION] ✅ Prediction accurate - no correction needed`);
            // Clean up predictions up to this point
            this.predictionBuffer = this.predictionBuffer.slice(predictionIndex + 1);
        }

        // Store server state for future reference
        this.serverState = { ...serverPlayerContext };
    }

    private applyServerCorrection(serverContext: any, mismatchedPrediction: any, predictionIndex: number): void {
        console.log(`[RECONCILIATION] 🔧 Applying server correction`);

        // Apply server position immediately
        if (this.player) {
            this.player.setPosition(serverContext.position.x, serverContext.position.y);
            
            // Apply server velocity
            if (this.player.body) {
                const body = this.player.body as Phaser.Physics.Arcade.Body;
                body.setVelocity(serverContext.velocityX || 0, serverContext.velocityY || 0);
            }

            // Update facing direction using flipX (consistent with SpriteManager)
            const facing = serverContext.position.facing || 'right';
            this.player.setFlipX(facing === 'left');
        }

        // Apply server state if different
        if (serverContext.state !== this.mapPhaserStateToPlayerState(this.currentState)) {
            console.log(`[RECONCILIATION] 🔄 State correction: ${this.mapPhaserStateToPlayerState(this.currentState)} → ${serverContext.state}`);
            this.applyServerState(serverContext.state);
        }

        // Re-apply predictions that came after the corrected one
        const remainingPredictions = this.predictionBuffer.slice(predictionIndex + 1);
        console.log(`[RECONCILIATION] ↩️ Re-applying ${remainingPredictions.length} predictions`);

        // Clear buffer and start fresh from server state
        this.predictionBuffer = remainingPredictions;
        
        // Update tracking variables
        this.lastSentPosition = { x: serverContext.position.x, y: serverContext.position.y };
        this.lastSentState = serverContext.state;

        console.log(`[RECONCILIATION] ✅ Correction applied, buffer size: ${this.predictionBuffer.length}`);
    }

    private applyServerState(serverStateName: string): void {
        // Map server state name back to PlayerStates enum
        const stateMapping: { [key: string]: PlayerStates } = {
            'idle': PlayerStates.Idle,
            'sprinting': PlayerStates.Sprinting,
            'crouching': PlayerStates.Crouching,
            'crouchWalking': PlayerStates.CrouchWalking,
            'jumping': PlayerStates.Jumping,
            'dashing': PlayerStates.Dashing,
            'attackingLight': PlayerStates.AttackingLight,
            'attackingHeavy': PlayerStates.AttackingHeavy
        };

        const targetState = stateMapping[serverStateName];
        if (targetState && this.states.has(targetState)) {
            // Directly set state without triggering force update (to avoid recursion)
            const newState = this.states.get(targetState)!;
            if (newState !== this.currentState) {
                this.currentState?.exit();
                this.currentState = newState;
                this.currentState.enter();
                console.log(`[RECONCILIATION] 🎯 State corrected to: ${serverStateName}`);
            }
        }
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

    // Apply server-authoritative state to remote player (for opponent players)
    public applyRemotePlayerState(serverPlayerContext: any): void {
        // Only apply to remote players (opponents)
        if (this.enabledInput) {
            console.warn('[PLAYER MANAGER] ⚠️ applyRemotePlayerState called on local player - ignoring');
            return;
        }

        if (!this.player || !serverPlayerContext) {
            return;
        }

        const serverState = serverPlayerContext.state;
        const serverPosition = serverPlayerContext.position;
        const serverVelocity = { x: serverPlayerContext.velocityX || 0, y: serverPlayerContext.velocityY || 0 };

        console.log(`[PLAYER MANAGER] 🤖 Applying remote state: '${serverState}' at (${serverPosition?.x?.toFixed(1)}, ${serverPosition?.y?.toFixed(1)})`);

        // Update position with smooth interpolation (optional - can be disabled for instant updates)
        if (serverPosition) {
            // Option 1: Instant position update (more accurate)
            this.player.setPosition(serverPosition.x, serverPosition.y);
            
            // Update facing direction using flipX (consistent with SpriteManager)
            const facing = serverPosition.facing || 'right';
            this.player.setFlipX(facing === 'left');
        }

        // Update velocity
        if (this.player.body) {
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(serverVelocity.x, serverVelocity.y);
        }

        // Apply state-based animation with smart animation management for remote players
        this.applyRemoteStateWithSimpleTracking(serverState);
    }

    private applyRemoteState(serverStateName: string): void {
        // Map server state to appropriate animation
        switch (serverStateName) {
            case 'idle':
                this.spriteManager.playIdleAnimation(this.player!);
                break;
            case 'sprinting':
                this.spriteManager.playSprintingAnimation(this.player!);
                break;
            case 'jumping':
                this.spriteManager.playJumpingAnimation(this.player!);
                break;
            case 'crouching':
                this.spriteManager.playCrouchFullAnimation(this.player!);
                break;
            case 'crouchWalking':
                this.spriteManager.playCrouchWalkAnimation(this.player!);
                break;
            case 'dashing':
                this.spriteManager.playDashingAnimation(this.player!);
                break;
            case 'attackingLight':
                this.spriteManager.playAttackingAnimation(this.player!);
                break;
            case 'attackingHeavy':
                this.spriteManager.playAttack2Animation(this.player!);
                break;
            default:
                console.warn(`[PLAYER MANAGER] ⚠️ Unknown server state: '${serverStateName}', defaulting to idle`);
                this.spriteManager.playIdleAnimation(this.player!);
                break;
        }
    }

    private applyRemoteStateWithAnimationTracking(serverStateName: string, serverVelocity: { x: number; y: number }): void {
        const now = Date.now();
        const isMoving = Math.abs(serverVelocity.x) > 0.1; // Consider moving if velocity > 0.1
        
        // Determine the appropriate animation based on state and movement
        let targetAnimation = '';
        let shouldRestart = false;

        switch (serverStateName) {
            case 'idle':
                targetAnimation = 'idle';
                break;
            case 'sprinting':
                targetAnimation = 'sprinting';
                break;
            case 'jumping':
                targetAnimation = 'jumping';
                break;
            case 'crouching':
                targetAnimation = 'crouching';
                break;
            case 'crouchWalking':
                targetAnimation = 'crouchWalking';
                break;
            case 'dashing':
                targetAnimation = 'dashing';
                break;
            case 'attackingLight':
                // Always show attack animation, whether moving or stationary
                targetAnimation = 'attackingLight';
                // Only restart attack animation if it's a new attack or enough time has passed
                const timeSinceLastLight = now - this.lastRemoteAnimationChange;
                shouldRestart = (this.currentRemoteAnimation !== 'attackingLight') || timeSinceLastLight > 300;
                break;
            case 'attackingHeavy':
                // Always show attack animation, whether moving or stationary  
                targetAnimation = 'attackingHeavy';
                // Only restart attack animation if it's a new attack or enough time has passed
                const timeSinceLastHeavy = now - this.lastRemoteAnimationChange;
                shouldRestart = (this.currentRemoteAnimation !== 'attackingHeavy') || timeSinceLastHeavy > 500;
                break;
            default:
                targetAnimation = 'idle';
                break;
        }

        // Only change animation if needed
        if (targetAnimation !== this.currentRemoteAnimation || shouldRestart) {
            console.log(`[REMOTE ANIMATION] 🎬 Changing animation: '${this.currentRemoteAnimation}' → '${targetAnimation}' (moving: ${isMoving}, state: ${serverStateName})`);
            
            this.currentRemoteAnimation = targetAnimation;
            this.lastRemoteAnimationChange = now;

            // Apply the appropriate animation
            switch (targetAnimation) {
                case 'idle':
                    this.spriteManager.playIdleAnimation(this.player!);
                    break;
                case 'sprinting':
                    this.spriteManager.playSprintingAnimation(this.player!);
                    break;
                case 'jumping':
                    this.spriteManager.playJumpingAnimation(this.player!);
                    break;
                case 'crouching':
                    this.spriteManager.playCrouchFullAnimation(this.player!);
                    break;
                case 'crouchWalking':
                    this.spriteManager.playCrouchWalkAnimation(this.player!);
                    break;
                case 'dashing':
                    this.spriteManager.playDashingAnimation(this.player!);
                    break;
                case 'attackingLight':
                    // For remote players, play attack animation directly without complex callbacks
                    if (this.player && this.player.anims) {
                        this.player.anims.play('player_attack_light', true);
                        console.log(`[REMOTE ANIMATION] 🗡️ Playing light attack animation (moving: ${isMoving})`);
                    }
                    break;
                case 'attackingHeavy':
                    // For remote players, play attack animation directly without complex callbacks
                    if (this.player && this.player.anims) {
                        this.player.anims.play('player_attack_heavy', true);
                        console.log(`[REMOTE ANIMATION] ⚔️ Playing heavy attack animation (moving: ${isMoving})`);
                    }
                    break;
                default:
                    this.spriteManager.playIdleAnimation(this.player!);
                    break;
            }
        }

        // Update state tracking
        this.currentRemoteState = serverStateName;
    }

    private applyRemoteStateWithSimpleTracking(serverStateName: string): void {
        const now = Date.now();
        
        // Check if we're currently playing an attack animation
        const isPlayingAttackAnim = this.currentRemoteAnimation === 'attackingLight' || this.currentRemoteAnimation === 'attackingHeavy';
        const isNewAttackState = serverStateName === 'attackingLight' || serverStateName === 'attackingHeavy';
        
        // For attack animations, handle with special logic
        if (isNewAttackState) {
            const timeSinceLastChange = now - this.lastRemoteAnimationChange;
            const isNewAttackType = this.currentRemoteAnimation !== serverStateName;
            const shouldRestart = isNewAttackType || timeSinceLastChange > 400; // 400ms cooldown
            
            if (shouldRestart) {
                console.log(`[REMOTE ANIMATION] 🗡️ Starting ${serverStateName} animation (restart: ${shouldRestart})`);
                this.currentRemoteAnimation = serverStateName;
                this.lastRemoteAnimationChange = now;
                
                // Clear any previous animation complete listeners to avoid conflicts
                this.player?.off('animationcomplete');
                
                // Use direct animation play with completion handler for remote players
                if (serverStateName === 'attackingLight') {
                    if (this.player && this.player.anims) {
                        this.player.anims.play('player_attack_light', true);
                        // Set up completion handler to check state after attack
                        this.player.once('animationcomplete', () => {
                            this.handleRemoteAttackComplete();
                        });
                    }
                } else if (serverStateName === 'attackingHeavy') {
                    if (this.player && this.player.anims) {
                        this.player.anims.play('player_attack_heavy', true);
                        // Set up completion handler to check state after attack
                        this.player.once('animationcomplete', () => {
                            this.handleRemoteAttackComplete();
                        });
                    }
                }
            }
            // If we're already playing the right attack animation, don't interrupt it
            return;
        }
        
        // For non-attack states, check if we should interrupt an ongoing attack
        if (isPlayingAttackAnim && !isNewAttackState) {
            // If we were playing an attack but server says we're not attacking anymore,
            // immediately transition to the new state
            console.log(`[REMOTE ANIMATION] ⏹️ Interrupting attack animation, transitioning to: ${serverStateName}`);
            this.player?.off('animationcomplete'); // Remove attack completion handler
            this.currentRemoteAnimation = serverStateName;
            this.lastRemoteAnimationChange = now;
            this.applyRemoteState(serverStateName);
            return;
        }
        
        // For all other non-attack state changes
        if (this.currentRemoteAnimation !== serverStateName) {
            console.log(`[REMOTE ANIMATION] 🎬 State change: '${this.currentRemoteAnimation}' → '${serverStateName}'`);
            this.currentRemoteAnimation = serverStateName;
            this.lastRemoteAnimationChange = now;
            
            // Use the original applyRemoteState for non-attack animations
            this.applyRemoteState(serverStateName);
        }
    }

    private handleRemoteAttackComplete(): void {
        if (!this.player || !this.player.body) return;
        
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const isMoving = Math.abs(body.velocity.x) > 0.1;
        
        console.log(`[REMOTE ANIMATION] ⚡ Attack animation completed, moving: ${isMoving}, remote state: ${this.currentRemoteState}, velocity: ${body.velocity.x.toFixed(2)}`);
        
        // Determine what animation to play based on current velocity and state
        if (isMoving) {
            // If still moving, transition to sprinting regardless of current remote state
            console.log(`[REMOTE ANIMATION] 🏃 Transitioning to sprinting after attack (velocity: ${body.velocity.x.toFixed(2)})`);
            this.currentRemoteAnimation = 'sprinting';
            this.spriteManager.playSprintingAnimation(this.player);
        } else {
            // If not moving, check the current remote state to decide animation
            switch (this.currentRemoteState) {
                case 'crouching':
                    console.log(`[REMOTE ANIMATION] 🫏 Transitioning to crouching after attack`);
                    this.currentRemoteAnimation = 'crouching';
                    this.spriteManager.playCrouchFullAnimation(this.player);
                    break;
                case 'idle':
                default:
                    console.log(`[REMOTE ANIMATION] 🛑 Transitioning to idle after attack`);
                    this.currentRemoteAnimation = 'idle';
                    this.spriteManager.playIdleAnimation(this.player);
                    break;
            }
        }
    }

    private cleanupOldPredictions(): void {
        const now = Date.now();
        const maxAge = 1000; // 1 second
        
        const oldBufferSize = this.predictionBuffer.length;
        this.predictionBuffer = this.predictionBuffer.filter(p => (now - p.timestamp) < maxAge);
        
        if (this.predictionBuffer.length !== oldBufferSize) {
            console.log(`[PREDICTION] Cleaned up ${oldBufferSize - this.predictionBuffer.length} old predictions`);
        }
    }

    // Clean up resources
    public destroy(): void {
        if (this.statsUI) {
            this.statsUI.destroy();
            this.statsUI = null;
        }
        
        // Clear prediction buffer
        this.predictionBuffer = [];
        console.log('[PLAYER MANAGER] Resources cleaned up');
    }

}