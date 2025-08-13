import { socket } from "@phaser-games/wildstrikes/src/shared-utils/socket";
interface BattleNetworkConfig {
    localPlayerId: string;
    opponentId: string;
    roomId: string;
}

/**
 * BattleNetworkManager
 *
 * Thin wrapper around a socket connection that:
 * - Emits battle lifecycle and player context messages
 * - Subscribes to server-authoritative updates (contexts, hits, end)
 * - Exposes ergonomic callback setters for the scene to react to events
 */
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

    /**
     * Binds all server → client socket subscriptions used during a battle.
     * Logs key events for easier debugging of the network flow.
     */
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
                        damagePercentage: 0,
                        lives: 3
                    },
                    battleData: data
                });
            }
        });

        this.socket.on('server:playerReconciliation', (data: any) => {
            // Legacy event - no longer used in server-authoritative system
        });

        this.socket.on('server:remotePlayerHasMoved', (data: any) => {
            // Legacy event - no longer used in server-authoritative system
        });

        // Listen for server-authoritative player context broadcasts
        this.socket.on('server:broadcastPlayerContexts', (data: any) => {
            console.log('[BATTLE NETWORK] 📥 Received server:broadcastPlayerContexts:', data);
            
            if (this.onPlayerContextsReceivedCallback) {
                this.onPlayerContextsReceivedCallback(data);
            }
        });

        this.socket.on('server:attackHit', (data: any) => {
            console.log('[BATTLE NETWORK] ⚔️ Server attack hit:', data);
            if (this.onAttackHitCallback) {
                this.onAttackHitCallback(data);
            }
        });

        // ✅ Listen for server-validated attack misses
        this.socket.on('server:attackMissed', (data: any) => {
            console.log('[BATTLE NETWORK] 💨 Server attack missed:', data);
            if (this.onAttackMissedCallback) {
                this.onAttackMissedCallback(data);
            }
        });

        // ✅ Listen for server-declared battle end
        this.socket.on('server:battleEnd', (data: any) => {
            console.log('[BATTLE NETWORK] 🏁 Battle ended:', data);
            if (this.onBattleEndCallback) {
                this.onBattleEndCallback(data);
            }
        });
    }

    // Send player context to server for validation
    public sendPlayerContext(playerContext: any): void {
        if (!this.socket || !this.socket.connected) {
            console.error('[BATTLE NETWORK] Cannot send player context - socket not connected');
            return;
        }

        console.log('[BATTLE NETWORK] 📤 Sending player context:', playerContext);
        this.socket.emit('player:moved', playerContext);
    }

    // Callbacks
    private onBattleStartCallback?: (data: any) => void;
    private onPlayerContextsReceivedCallback?: (data: any) => void;
    private onAttackHitCallback?: (data: any) => void;
    private onAttackMissedCallback?: (data: any) => void;
    private onBattleEndCallback?: (data: any) => void;

    // Methods
    /** Register a handler for the initial battle payload. */
    public onBattleStart(callback: (data: any) => void): void {
        this.onBattleStartCallback = callback;
    }

    /** Register a handler for periodic server context snapshots. */
    public onPlayerContextsReceived(callback: (data: any) => void): void {
        this.onPlayerContextsReceivedCallback = callback;
    }
    
    /** Register a handler for confirmed attack hits. */
    public onAttackHit(callback: (data: any) => void): void {
        this.onAttackHitCallback = callback;
    }

    /** Register a handler for validated attack misses. */
    public onAttackMissed(callback: (data: any) => void): void {
        this.onAttackMissedCallback = callback;
    }

    /** Register a handler for the battle end event. */
    public onBattleEnd(callback: (data: any) => void): void {
        this.onBattleEndCallback = callback;
    }

    /**
     * Unsubscribes all battle-related socket events. Safe to call multiple
     * times; does not close the socket transport, only removes listeners.
     */
    public destroy(): void {
        if (this.socket) {
            this.socket.off('server:start-battle');
            this.socket.off('server:playerReconciliation');
            this.socket.off('server:remotePlayerHasMoved');
            this.socket.off('server:broadcastPlayerContexts');
            this.socket.off('server:attackHit');
            this.socket.off('server:attackMissed');
            this.socket.off('server:battleEnd');
            this.socket.off('server:playerDeath');
            this.socket.off('server:playerRespawn');
            this.socket.off('server:playerRevive');
            this.socket.off('server:playerRevive');
        }
    }
}