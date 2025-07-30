import { battleSocketClient } from "../../../shared-utils/BattleSocketClient";
import { PlayerManager } from "./PlayerManager";
import { PlayerStates } from "./states";

export interface NetworkPlayerState {
    playerId: string;
    state: string;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    facing: 'left' | 'right';
    timestamp: number;
    health?: number;
}

export interface RemotePlayerData {
    playerId: string;
    manager: PlayerManager;
    lastUpdate: number;
    interpolationBuffer: NetworkPlayerState[];
    targetState: NetworkPlayerState | null;
    currentState: NetworkPlayerState | null;
}

export class NetworkStateManager {
    private scene: Phaser.Scene;
    private localPlayerManager: PlayerManager | null = null;
    private remotePlayers: Map<string, RemotePlayerData> = new Map();
    private interpolationDelay: number = 100; // ms delay for interpolation
    private maxBufferSize: number = 10; // max states to buffer

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupNetworkListeners();
    }

    private setupNetworkListeners(): void {
        // Listen for remote player state updates
        battleSocketClient.on('remote-player-state', (data: NetworkPlayerState) => {
            this.handleRemotePlayerState(data);
        });

        // Listen for remote player spawn
        battleSocketClient.on('remote-player-spawn', (data: { playerId: string; position: { x: number; y: number } }) => {
            this.spawnRemotePlayer(data.playerId, data.position);
        });

        // Listen for remote player disconnect
        battleSocketClient.on('remote-player-disconnect', (data: { playerId: string }) => {
            this.removeRemotePlayer(data.playerId);
        });

        // Listen for battle start to sync all players
        battleSocketClient.on('battle-start', (data: any) => {
            console.log('Battle started, syncing player states');
        });
    }

    public setLocalPlayer(manager: PlayerManager): void {
        this.localPlayerManager = manager;
        console.log('NetworkStateManager: Local player set');
    }

    public spawnRemotePlayer(playerId: string, position: { x: number; y: number }): void {
        if (this.remotePlayers.has(playerId)) {
            console.warn(`Remote player ${playerId} already exists`);
            return;
        }

        console.log(`🎮 Spawning remote player ${playerId} at (${position.x}, ${position.y})`);
        
        // Create remote player manager (input disabled)
        const remoteManager = new PlayerManager(this.scene, false);
        const playerSprite = remoteManager.createPlayer(position.x, position.y);
        
        if (!playerSprite) {
            console.error(`❌ Failed to create remote player sprite for ${playerId}`);
            return;
        }

        // Ensure remote player has red tint and is positioned correctly
        playerSprite.setTint(0xff0000); // Red tint for remote players
        playerSprite.setPosition(position.x, position.y);
        
        // Force update the physics body position as well
        const body = playerSprite.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.x = position.x;
            body.y = position.y;
        }
        
        console.log(`✅ Remote player sprite created at (${playerSprite.x}, ${playerSprite.y}) with red tint`);
        console.log(`🎯 Target position was (${position.x}, ${position.y})`);

        // Create remote player data
        const remotePlayerData: RemotePlayerData = {
            playerId,
            manager: remoteManager,
            lastUpdate: this.scene.time.now,
            interpolationBuffer: [],
            targetState: null,
            currentState: {
                playerId,
                state: PlayerStates.Idle,
                position: { x: position.x, y: position.y },
                velocity: { x: 0, y: 0 },
                facing: 'right',
                timestamp: this.scene.time.now
            }
        };

        this.remotePlayers.set(playerId, remotePlayerData);
        console.log(`🎉 Remote player ${playerId} spawned successfully at (${position.x}, ${position.y})`);
    }

    public removeRemotePlayer(playerId: string): void {
        const remotePlayer = this.remotePlayers.get(playerId);
        if (remotePlayer) {
            remotePlayer.manager.destroy();
            this.remotePlayers.delete(playerId);
            console.log(`Remote player ${playerId} removed`);
        }
    }

    private handleRemotePlayerState(data: NetworkPlayerState): void {

        const remotePlayer = this.remotePlayers.get(data.playerId);
        if (!remotePlayer) {
            console.warn(`Received state for unknown remote player: ${data.playerId}`);
            return;
        }

        // Add to interpolation buffer
        remotePlayer.interpolationBuffer.push(data);
        
        // Keep buffer size manageable
        if (remotePlayer.interpolationBuffer.length > this.maxBufferSize) {
            remotePlayer.interpolationBuffer.shift();
        }

        // Update target state for interpolation
        remotePlayer.targetState = data;
        remotePlayer.lastUpdate = this.scene.time.now;

        // Immediately update player state if it's a significant change
        this.updateRemotePlayerState(remotePlayer, data);

        // Debug logging (only log occasionally to avoid spam)
        if (this.scene.time.now % 1000 < 16) { // Log once per second
            console.log(`📥 Received remote state: ${data.state} @ (${data.position.x.toFixed(1)}, ${data.position.y.toFixed(1)}) from ${data.playerId}`);
        }
    }

    private updateRemotePlayerState(remotePlayer: RemotePlayerData, state: NetworkPlayerState): void {
        const playerSprite = remotePlayer.manager.getPlayerSprite();
        if (!playerSprite) return;

        // Smooth interpolation for remote players
        const currentPos = { x: playerSprite.x, y: playerSprite.y };
        const targetPos = state.position;
        const interpolationFactor = 0.3; // Smooth movement

        // Interpolate position
        const newX = currentPos.x + (targetPos.x - currentPos.x) * interpolationFactor;
        const newY = currentPos.y + (targetPos.y - currentPos.y) * interpolationFactor;
        playerSprite.setPosition(newX, newY);
        
        // Update velocity
        const body = playerSprite.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocity(state.velocity.x, state.velocity.y);
        }

        // Update facing direction
        if (state.facing === 'left') {
            playerSprite.setFlipX(true);
        } else {
            playerSprite.setFlipX(false);
        }

        // Update animation state
        this.updateRemotePlayerAnimation(remotePlayer, state.state);

        // Update current state
        remotePlayer.currentState = state;
    }

    private updateRemotePlayerAnimation(remotePlayer: RemotePlayerData, state: string): void {
        const playerSprite = remotePlayer.manager.getPlayerSprite();
        if (!playerSprite) return;

        // Map network states to local states
        switch (state) {
            case PlayerStates.Idle:
                remotePlayer.manager.getSpriteManager().playIdleAnimation(playerSprite);
                break;
            case PlayerStates.Walking:
                remotePlayer.manager.getSpriteManager().playWalkingAnimation(playerSprite);
                break;
            case PlayerStates.Jumping:
                remotePlayer.manager.getSpriteManager().playJumpingAnimation(playerSprite);
                break;
            case PlayerStates.Dashing:
                remotePlayer.manager.getSpriteManager().playDashingAnimation(playerSprite);
                break;
            case PlayerStates.AttackingLight:
                remotePlayer.manager.getSpriteManager().playAttackingAnimation(playerSprite);
                break;
            case PlayerStates.AttackingHeavy:
                remotePlayer.manager.getSpriteManager().playAttack2Animation(playerSprite);
                break;
            case PlayerStates.Crouching:
                remotePlayer.manager.getSpriteManager().playCrouchFullAnimation(playerSprite);
                break;
            case PlayerStates.CrouchWalking:
                remotePlayer.manager.getSpriteManager().playCrouchWalkAnimation(playerSprite);
                break;
            default:
                remotePlayer.manager.getSpriteManager().playIdleAnimation(playerSprite);
                break;
        }
    }

    public sendLocalPlayerState(): void {
        if (!this.localPlayerManager) return;

        const playerSprite = this.localPlayerManager.getPlayerSprite();
        if (!playerSprite) return;

        const body = playerSprite.body as Phaser.Physics.Arcade.Body;
        const currentState = this.localPlayerManager.getCurrentState();

        const networkState: NetworkPlayerState = {
            playerId: battleSocketClient.getId(),
            state: currentState.constructor.name.replace('State', '').toLowerCase(),
            position: { x: playerSprite.x, y: playerSprite.y },
            velocity: { x: body.velocity.x, y: body.velocity.y },
            facing: playerSprite.flipX ? 'left' : 'right',
            timestamp: this.scene.time.now
        };

        // Send to server
        battleSocketClient.emit('player-state-update', networkState);
        
        // Debug logging (only log occasionally to avoid spam)
        if (this.scene.time.now % 1000 < 16) { // Log once per second
            console.log(`📡 Sending state: ${networkState.state} @ (${networkState.position.x.toFixed(1)}, ${networkState.position.y.toFixed(1)})`);
        }
    }

    public update(): void {
        // Update remote player interpolation
        this.remotePlayers.forEach((remotePlayer) => {
            this.interpolateRemotePlayer(remotePlayer);
        });

        // Send local player state periodically (reduced frequency for better performance)
        if (this.localPlayerManager && this.scene.time.now % 50 === 0) { // ~20fps for network updates
            this.sendLocalPlayerState();
        }
    }

    private interpolateRemotePlayer(remotePlayer: RemotePlayerData): void {
        if (!remotePlayer.targetState || remotePlayer.interpolationBuffer.length < 2) {
            return;
        }

        const now = this.scene.time.now;
        const targetTime = remotePlayer.targetState.timestamp + this.interpolationDelay;

        if (now >= targetTime) {
            // Use the most recent state
            const latestState = remotePlayer.interpolationBuffer[remotePlayer.interpolationBuffer.length - 1];
            this.updateRemotePlayerState(remotePlayer, latestState);
        } else {
            // Interpolate between states
            const interpolatedState = this.interpolateStates(remotePlayer.interpolationBuffer, now);
            if (interpolatedState) {
                this.updateRemotePlayerState(remotePlayer, interpolatedState);
            }
        }
    }

    private interpolateStates(buffer: NetworkPlayerState[], currentTime: number): NetworkPlayerState | null {
        if (buffer.length < 2) return null;

        // Find the two states to interpolate between
        let state1: NetworkPlayerState | null = null;
        let state2: NetworkPlayerState | null = null;

        for (let i = 0; i < buffer.length - 1; i++) {
            if (buffer[i].timestamp <= currentTime && buffer[i + 1].timestamp >= currentTime) {
                state1 = buffer[i];
                state2 = buffer[i + 1];
                break;
            }
        }

        if (!state1 || !state2) return null;

        // Calculate interpolation factor
        const timeDiff = state2.timestamp - state1.timestamp;
        const alpha = timeDiff > 0 ? (currentTime - state1.timestamp) / timeDiff : 0;

        // Interpolate position and velocity
        const interpolatedState: NetworkPlayerState = {
            playerId: state1.playerId,
            state: state1.state, // Use state1's state (no interpolation for discrete states)
            position: {
                x: state1.position.x + (state2.position.x - state1.position.x) * alpha,
                y: state1.position.y + (state2.position.y - state1.position.y) * alpha
            },
            velocity: {
                x: state1.velocity.x + (state2.velocity.x - state1.velocity.x) * alpha,
                y: state1.velocity.y + (state2.velocity.y - state1.velocity.y) * alpha
            },
            facing: state1.facing, // Use state1's facing (no interpolation for discrete values)
            timestamp: currentTime
        };

        return interpolatedState;
    }

    public getRemotePlayers(): Map<string, RemotePlayerData> {
        return this.remotePlayers;
    }

    public getRemotePlayer(playerId: string): RemotePlayerData | undefined {
        return this.remotePlayers.get(playerId);
    }

    // Test method to manually send a state update
    public testNetworkSync(): void {
        if (!this.localPlayerManager) {
            console.log("❌ No local player manager set for network sync test");
            return;
        }

        const playerSprite = this.localPlayerManager.getPlayerSprite();
        if (!playerSprite) {
            console.log("❌ No local player sprite for network sync test");
            return;
        }

        console.log("🧪 Testing network sync - sending manual state update");
        this.sendLocalPlayerState();
    }

    public destroy(): void {
        // Clean up remote players
        this.remotePlayers.forEach((remotePlayer) => {
            remotePlayer.manager.destroy();
        });
        this.remotePlayers.clear();

        // Remove network listeners
        battleSocketClient.off('remote-player-state');
        battleSocketClient.off('remote-player-spawn');
        battleSocketClient.off('remote-player-disconnect');
        battleSocketClient.off('battle-start');
    }
} 