import { PlayerSpriteManager } from "./PlayerSpriteManager";
import { PlayerStatsUI } from "../../systems/ui/PlayerStatsUI";
import { InputManager } from "./InputManager";
import { NetworkManager } from "./NetworkManager";
import { RemoteAnimationManager } from "./RemoteAnimationManager";
import { AttackHitboxManager } from "./AttackHitboxManager";
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
import { HitState } from "./states/HitState";

export class PlayerManager {
    private scene: Phaser.Scene;
    private player: Phaser.Physics.Arcade.Sprite | null = null;
    private enabledInput: boolean = true;
    private singlePlayerMode: boolean = false; // Add this flag

    // Component managers
    private spriteManager: PlayerSpriteManager;
    private inputManager: InputManager;
    private networkManager: NetworkManager | null = null; // Make this optional
    private remoteAnimationManager: RemoteAnimationManager | null = null;
    private attackHitboxManager: AttackHitboxManager | null = null;
    private statsUI: PlayerStatsUI | null = null;

    // State management
    private states: Map<PlayerStates, PlayerState> = new Map();
    private currentState: PlayerState | null = null;
    
    // Player data
    private roomId: string;
    private playerId: string;
    private serverStats = { damagePercentage: 0, lives: 3 };
    
    // UI throttling
    private lastUIUpdate: number = 0;
    private readonly UI_UPDATE_RATE = 100;

    constructor(
        scene: Phaser.Scene, 
        isInputEnabled: boolean = true, 
        roomId: string = 'offline', 
        playerId: string = 'local-player',
        singlePlayerMode: boolean = false
    ) {
        this.scene = scene;
        this.enabledInput = isInputEnabled;
        this.roomId = roomId;
        this.playerId = playerId;
        this.singlePlayerMode = singlePlayerMode;
        
        // Initialize components
        this.spriteManager = new PlayerSpriteManager(scene);
        this.inputManager = new InputManager(scene, isInputEnabled);
        
        // Only create network manager if not in single player mode
        if (!this.singlePlayerMode) {
            this.networkManager = new NetworkManager(playerId, roomId);
        }
        
        this.initializeStates();
        this.currentState = this.states.get(PlayerStates.Idle)!;
        
        if (this.enabledInput && !this.singlePlayerMode) {
            this.setupServerEventListeners();
        }
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

        this.states.set(PlayerStates.Hit, new HitState(this));
    }

    private setupServerEventListeners(): void {
        if (!this.networkManager) {
            return; // Skip if no network manager
        }
        console.log('[PLAYER MANAGER] 🎯 Client-side prediction reconciliation ENABLED');
    }

    public setNetworkManager(networkHandler: any): void {
        if (this.singlePlayerMode) return; // Skip in single player mode
        
        this.networkManager?.setNetworkHandler(networkHandler);
        if (this.enabledInput) {
            this.setupServerEventListeners();
        }
    }

    public createPlayer(x: number, y: number): Phaser.Physics.Arcade.Sprite {
        this.player = this.spriteManager.createPlayerSprite(x, y);
        this.player.setDepth(1);
        
        // Initialize attack hitbox manager with single player mode
        this.attackHitboxManager = new AttackHitboxManager(this.scene, this.player, this.singlePlayerMode);
        
        if (this.enabledInput) {
            this.player.setTint(0x00fffff);
            this.statsUI = new PlayerStatsUI(this.scene, this.player);
        } else {
            this.player.clearTint();
            this.remoteAnimationManager = new RemoteAnimationManager(this.player, this.spriteManager);
        }
        
        this.setupCollisions();
        this.currentState?.enter();
        return this.player;
    }

    private setupCollisions(): void {
        const platform = (this.scene as any).platform;
        this.scene.physics.add.collider(this.player, platform, () => {
            if (this.currentState instanceof JumpingState) {
                this.currentState.onLand();
            }
        });
    }

    public update(): void {
        if (!this.player) return;
        
        if (this.enabledInput) {
            this.processLocalPlayerUpdate();
        }
        
        this.currentState?.update();
        this.attackHitboxManager?.update(); // Update hitboxes
        this.updateUI();
    }

    private processLocalPlayerUpdate(): void {
        const inputs = this.inputManager.captureInputs();
        if (!inputs) return;

        // Only send network updates if not in single player mode
        if (!this.singlePlayerMode && this.networkManager) {
            this.sendNetworkUpdates(inputs);
        }
        
        this.inputManager.resetJustPressedFlags();
        
        // Apply input locally
        if (this.currentState && 'handleInput' in this.currentState) {
            (this.currentState as any).handleInput(inputs);
        }

        // Only send state updates if not in single player mode
        if (!this.singlePlayerMode && this.networkManager) {
            this.sendStateUpdatesIfChanged();
            this.networkManager.cleanupOldPredictions();
        }
    }

    private sendNetworkUpdates(inputs: any): void {
        if (this.singlePlayerMode || !this.networkManager) return;
        
        const now = Date.now();
        if (!this.networkManager.shouldSendUpdate(now)) return;

        const currentPosition = { x: this.player?.x || 0, y: this.player?.y || 0 };
        const currentState = this.mapPhaserStateToPlayerState(this.currentState);
        
        const hasInputChanges = this.networkManager.hasInputChanges(inputs);
        const hasPositionChanges = this.networkManager.hasPositionChanges(currentPosition);
        const hasMovementInput = inputs.left || inputs.right || inputs.jump || inputs.crouch || inputs.dash;
        
        if (hasInputChanges || hasPositionChanges || hasMovementInput) {
            const reason = hasInputChanges ? 'INPUT_CHANGE' : 
                          hasPositionChanges ? 'POSITION_CHANGE' : 'MOVEMENT_ACTIVE';
            
            this.networkManager.sendPlayerUpdate(
                inputs, currentPosition, this.player!, currentState, this.serverStats, reason
            );
        }
    }

    private sendStateUpdatesIfChanged(): void {
        if (this.singlePlayerMode || !this.networkManager) return;
        
        const currentStateString = this.mapPhaserStateToPlayerState(this.currentState);
        const now = Date.now();
        
        if (this.networkManager.hasStateChanges(currentStateString) && 
            this.networkManager.shouldSendUpdate(now)) {
            
            const currentPosition = { x: this.player?.x || 0, y: this.player?.y || 0 };
            const currentInputs = {
                left: this.inputManager.getKeyObjects().left?.isDown || false,
                right: this.inputManager.getKeyObjects().right?.isDown || false,
                jump: false,
                crouch: this.inputManager.getKeyObjects().crouch?.isDown || false,
                dash: this.inputManager.getKeyObjects().dash?.isDown || false,
                lightAttack: false,
                heavyAttack: false
            };
            
            this.networkManager.sendPlayerUpdate(
                currentInputs, currentPosition, this.player!, currentStateString, this.serverStats, 'STATE_CHANGE'
            );
        }
    }

    private updateUI(): void {
        const now = Date.now();
        if (this.statsUI && this.player && (now - this.lastUIUpdate >= this.UI_UPDATE_RATE)) {
            this.lastUIUpdate = now;
            this.statsUI.update();
            
            const currentAnimation = this.player.anims?.currentAnim?.key || 'idle';
            this.statsUI.updateStats({
                ...this.serverStats,
                position: { x: this.player.x, y: this.player.y },
                velocity: { 
                    x: this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.x : 0,
                    y: this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.y : 0
                },
                animation: currentAnimation
            });
        } else if (this.statsUI) {
            this.statsUI.update();
        }
    }

    // State management methods
    public transitionTo(stateName: PlayerStates): void {
        const newState = this.states.get(stateName);
        if (newState && newState !== this.currentState) {
            const oldStateName = this.mapPhaserStateToPlayerState(this.currentState);
            const newStateName = this.mapPhaserStateToPlayerState(newState);
            
            console.log(`[PLAYER MANAGER] 🔄 State transition: ${oldStateName} → ${newStateName}`);
            
            this.currentState?.exit();
            this.currentState = newState;
            this.currentState.enter();
            
            if (this.enabledInput) {
                this.forceStateUpdate(newStateName);
            }
        }
    }

    private forceStateUpdate(newStateName: string): void {
        const now = Date.now();
        
        if (!this.networkManager?.shouldSendUpdate(now)) {
            setTimeout(() => this.forceStateUpdate(newStateName), this.networkManager?.getInputRateLimit() || 100);
            return;
        }
        
        const currentPosition = { x: this.player?.x || 0, y: this.player?.y || 0 };
        const currentInputs = {
            left: this.inputManager.getKeyObjects().left?.isDown || false,
            right: this.inputManager.getKeyObjects().right?.isDown || false,
            jump: false,
            crouch: this.inputManager.getKeyObjects().crouch?.isDown || false,
            dash: this.inputManager.getKeyObjects().dash?.isDown || false,
            lightAttack: false,
            heavyAttack: false
        };
        
        this.networkManager.sendPlayerUpdate(
            currentInputs, currentPosition, this.player!, newStateName, this.serverStats, 'STATE_TRANSITION'
        );
    }

    private mapPhaserStateToPlayerState(currentState: PlayerState | null): string {
        if (!currentState) return 'idle';
        
        const stateName = currentState.constructor.name;
        const stateMap: { [key: string]: string } = {
            'IdleState': 'idle',
            'SprintingState': 'sprinting',
            'CrouchingState': 'crouching',
            'CrouchWalkingState': 'crouchWalking',
            'JumpingState': 'jumping',
            'DashingState': 'dashing',
            'AttackingLightState': 'attackingLight',
            'AttackingHeavyState': 'attackingHeavy'
        };
        
        return stateMap[stateName] || 'idle';
    }

    // Network reconciliation
    public reconcileWithServer(serverPlayerContext: any): void {
        if (this.singlePlayerMode) return;
        
        this.networkManager?.reconcileWithServer(
            serverPlayerContext,
            this.player!,
            (state: string) => this.applyServerState(state)
        );
    }

    private applyServerState(serverStateName: string): void {
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
            const newState = this.states.get(targetState)!;
            if (newState !== this.currentState) {
                this.currentState?.exit();
                this.currentState = newState;
                this.currentState.enter();
                console.log(`[RECONCILIATION] 🎯 State corrected to: ${serverStateName}`);
            }
        }
    }

    // Remote player methods
    public applyRemotePlayerState(serverPlayerContext: any): void {
        if (this.enabledInput) {
            console.warn('[PLAYER MANAGER] ⚠️ applyRemotePlayerState called on local player - ignoring');
            return;
        }

        if (!this.player || !serverPlayerContext) return;

        const serverState = serverPlayerContext.state;
        const serverPosition = serverPlayerContext.position;
        const serverVelocity = { x: serverPlayerContext.velocityX || 0, y: serverPlayerContext.velocityY || 0 };

        console.log(`[PLAYER MANAGER] 🤖 Applying remote state: '${serverState}' at (${serverPosition?.x?.toFixed(1)}, ${serverPosition?.y?.toFixed(1)})`);

        // Update position and velocity
        if (serverPosition) {
            this.player.setPosition(serverPosition.x, serverPosition.y);
            const facing = serverPosition.facing || 'right';
            this.player.setFlipX(facing === 'left');
        }

        if (this.player.body) {
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(serverVelocity.x, serverVelocity.y);
        }

        // Apply animation through remote animation manager
        if (this.remoteAnimationManager) {
            this.remoteAnimationManager.updateRemoteState(serverState);
            this.remoteAnimationManager.applyRemoteState(serverState);
        }
    }

    // Player stats
    public updatePlayerStats(stats: { 
        damagePercentage: number; 
        lives: number; 
        knockback?: { force: number; angle: number };
        position?: { x: number; y: number };
        velocity?: { x: number; y: number };
        animation?: string;
    }): void {
        // Update server stats with core combat data
        this.serverStats = {
            damagePercentage: stats.damagePercentage,
            lives: stats.lives
        };

        // Force immediate UI update with all provided data
        if (this.statsUI && this.player) {
            this.statsUI.updateStats({
                damagePercentage: stats.damagePercentage,
                lives: stats.lives,
                knockback: stats.knockback,
                position: stats.position || { x: this.player.x, y: this.player.y },
                velocity: stats.velocity || { 
                    x: this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.x : 0,
                    y: this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.y : 0
                },
                animation: stats.animation || this.player.anims?.currentAnim?.key || 'idle'
            });
        }
        
        console.log(`[PLAYER MANAGER] Stats updated - DMG: ${stats.damagePercentage}%, Lives: ${stats.lives}, KB: ${stats.knockback?.force || 0}`);
    }

    // Getters for compatibility with existing state classes
    public getPlayerSprite(): Phaser.Physics.Arcade.Sprite | null { return this.player; }
    public getScene(): Phaser.Scene { return this.scene; }
    public getSpriteManager(): PlayerSpriteManager { return this.spriteManager; }
    public getKeyObjects(): any { return this.inputManager.getKeyObjects(); }
    public isInputEnabled(): boolean { return this.enabledInput; }
    public getCurrentState(): PlayerState | null { return this.currentState; }
    public getAttackHitboxManager(): AttackHitboxManager | null { return this.attackHitboxManager; }

    // Cleanup
    public destroy(): void {
        this.statsUI?.destroy();
        this.statsUI = null;
        this.attackHitboxManager?.destroy();
        this.attackHitboxManager = null;
        console.log('[PLAYER MANAGER] Resources cleaned up');
    }
}
