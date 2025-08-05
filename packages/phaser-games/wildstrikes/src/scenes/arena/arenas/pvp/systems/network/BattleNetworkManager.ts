import { battleSocketClient } from "../../../../../../shared-utils/BattleSocketClient";

export interface BattleNetworkConfig {
    localPlayerId: string;
    opponentId: string;
    roomId: string;
}

export class BattleNetworkManager {
    private config: BattleNetworkConfig;
    private eventHandlers: Map<string, (data: any) => void> = new Map();

    constructor(config: BattleNetworkConfig) {
        this.config = config;
        this.setupConnection();
        this.setupEventHandlers();
    }

    private setupConnection(): void {
        console.log(`[BATTLE NETWORK] Setting up connection for room: ${this.config.roomId}`);
        battleSocketClient.connect();
        
        setTimeout(() => {
            if (battleSocketClient.isSocketConnected()) {
                console.log(`[BATTLE NETWORK] Starting battle...`);
                battleSocketClient.startBattle();
            } else {
                console.error(`[BATTLE NETWORK] Failed to connect to socket server`);
            }
        }, 100);
    }

    private setupEventHandlers(): void {
        this.on("battle-start", (data: any) => {
            console.log("[BATTLE NETWORK] Battle started", data);
        });

        this.on("connect_error", (error: any) => {
            console.error("[BATTLE NETWORK] Connection error:", error);
        });

        this.on("disconnect", (reason: any) => {
            console.log("[BATTLE NETWORK] Disconnected:", reason);
        });
    }

    public onPlayerStateUpdate(handler: (playerState: any) => void): void {
        battleSocketClient.on("player-state-update", handler);
    }

    public on(event: string, handler: (data: any) => void): void {
        this.eventHandlers.set(event, handler);
        battleSocketClient.on(event, handler);
    }

    public sendPlayerState(state: any): void {
        // Send local player state to server
        battleSocketClient.emit("player-state", state);
    }

    public destroy(): void {
        this.eventHandlers.forEach((handler, event) => {
            battleSocketClient.off(event, handler);
        });
        this.eventHandlers.clear();
    }
}   