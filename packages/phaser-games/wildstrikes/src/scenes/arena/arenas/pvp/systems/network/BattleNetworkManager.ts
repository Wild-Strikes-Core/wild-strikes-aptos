import { socket } from "@phaser-games/wildstrikes/src/shared-utils/socket";
interface BattleNetworkConfig {
    localPlayerId: string;
    opponentId: string;
    roomId: string;
}

export class BattleNetworkManager {
    private socket: any;
    private localPlayerId: string;
    private opponentId: string;
    private roomId: string;

    constructor(config: {
        localPlayerId: string;
        opponentId: string;
        roomId: string;
    }) {
        this.localPlayerId = config.localPlayerId;
        this.opponentId = config.opponentId;
        this.roomId = config.roomId;
        
        this.socket = socket;
        
        if (!this.socket) {
            console.error('[BATTLE NETWORK] No socket connection available!');
            return;
        }

        console.log(`[BATTLE NETWORK] Initialized for room ${this.roomId}, local player: ${this.localPlayerId}`);
        console.log(`[BATTLE NETWORK] Socket connected: ${this.socket.connected}`);
        
        this.setupEventListeners();
        
        setTimeout(() => {
            console.log(`[BATTLE NETWORK] Emitting start-battle for room ${this.roomId}`);
            this.socket.emit('client:start-battle', { roomId: this.roomId });
        }, 100);
    }

    private setupEventListeners(): void {
        console.log('[BATTLE NETWORK] Setting up event listeners...');
        
        this.socket.on('server:start-battle', (data: any) => {
            console.log('[BATTLE NETWORK] ✅ Battle started:', data);
            
            // Extract player stats for the local player
            if (data.players && Array.isArray(data.players)) {
                const localPlayerData = data.players.find((p: any) => p.socketId === this.localPlayerId);
                if (localPlayerData && this.onBattleStartCallback) {
                    console.log('[BATTLE NETWORK] Local player stats:', localPlayerData);
                    this.onBattleStartCallback({
                        localPlayerStats: {
                            health: localPlayerData.playerStats?.health || 100,
                            damagePercentage: localPlayerData.playerStats?.damagePercentage || 0,
                            lives: localPlayerData.playerStats?.lives || 3
                        },
                        battleData: data
                    });
                }
            } else if (data.roomId && data.gameState && this.onBattleStartCallback) {
                // Fallback for older format - use default stats
                this.onBattleStartCallback({
                    localPlayerStats: {
                        health: 100,
                        damagePercentage: 0,
                        lives: 3
                    },
                    battleData: data
                });
            }
        });

        this.socket.on('server:playerReconciliation', (data: any) => {
            
        });

        this.socket.on('server:remotePlayerHasMoved', (data: any) => {
            
        });
    }


    // ✅ Keep legacy method for backwards compatibility
    public sendPlayerInput(inputCommand: any): void {
        if (!this.socket || !this.socket.connected) {
            console.error('[BATTLE NETWORK] Cannot send input - socket not connected');
            return;
        }

        const inputData = {
            roomId: this.roomId,
            playerId: this.localPlayerId,
            input: inputCommand
        };

        console.log('[BATTLE NETWORK] 📤 Sending player input:', {
            roomId: inputData.roomId,
            playerId: inputData.playerId,
            inputs: inputCommand.inputs,
            sequenceNumber: inputCommand.sequenceNumber
        });
        
        this.socket.emit('player-input', inputData);
    }

    // ✅ Legacy callbacks
    private onLocalPlayerUpdateCallback?: (data: any) => void;
    private onRemotePlayerUpdateCallback?: (data: any) => void;
    private onBattleStateUpdateCallback?: (data: any) => void;
    private onPlayerStateUpdateCallback?: (data: any) => void;
    private onPhysicsUpdateCallback?: (data: any) => void;
    private onBattleStartCallback?: (data: any) => void;


    // ✅ Legacy methods for backwards compatibility
    public onLocalPlayerUpdate(callback: (data: any) => void): void {
        this.onLocalPlayerUpdateCallback = callback;
    }

    public onRemotePlayerUpdate(callback: (data: any) => void): void {
        this.onRemotePlayerUpdateCallback = callback;
    }

    public onBattleStateUpdate(callback: (data: any) => void): void {
        this.onBattleStateUpdateCallback = callback;
    }

    public onPlayerStateUpdate(callback: (data: any) => void): void {
        this.onPlayerStateUpdateCallback = callback;
    }

    public onPhysicsUpdate(callback: (data: any) => void): void {
        this.onPhysicsUpdateCallback = callback;
    }

    public onBattleStart(callback: (data: any) => void): void {
        this.onBattleStartCallback = callback;
    }

    public destroy(): void {
        if (this.socket) {
            this.socket.off('battle-start');
            this.socket.off('player-state-update'); // ✅ Corrected event name
            this.socket.off('remote-player-update'); // ✅ Corrected event name
            this.socket.off('physics-update');
        }
    }
}