import { socket } from "./socket";

export interface MapConfig {
    id: string;
    name: string;
    theme: string;
    spawnPoints: {
        player1: { x: number; y: number };
        player2: { x: number; y: number };
    };
    backgroundMusic?: string;
    backgroundImage: string;
    platforms?: Array<{ x: number; y: number; width: number; height: number }>;
    obstacles?: Array<{ x: number; y: number; width: number; height: number; type: string }>;
    mapBounds: { width: number; height: number };
}

export interface MapSelectedData {
    roomId: string;
    mapConfig: MapConfig;
    players: Array<{
        socketId: string;
        spawnPosition: { x: number; y: number };
    }>;
}

export class BattleSocketClient {
    private onMapSelectedCallback?: (data: MapSelectedData) => void;
    private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();

    constructor() {
        this.setupSocketListeners();
    }

    private setupSocketListeners() {
    }

    onMapSelected(callback: (data: MapSelectedData) => void) {
        this.onMapSelectedCallback = callback;
    }

    // Event listener methods for multiplayer sync
    on(event: string, callback: (...args: any[]) => void) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(callback);
        
        // Also set up socket listener if not already done
        socket.on(event, callback);
    }

    off(event: string, callback?: (...args: any[]) => void) {
        if (callback) {
            // Remove specific callback
            const listeners = this.eventListeners.get(event);
            if (listeners) {
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
            socket.off(event, callback);
        } else {
            // Remove all listeners for this event
            const listeners = this.eventListeners.get(event);
            if (listeners) {
                listeners.forEach(cb => socket.off(event, cb));
                this.eventListeners.delete(event);
            }
        }
    }

    startBattle() {
        socket.emit("start-battle");
    }

    // Utility methods
    isSocketConnected(): boolean {
        return socket.connected;
    }

    disconnect() {
        socket.disconnect();
    }

    connect() {
        socket.connect();
    }

    emit(event: string, data?: any) {
        socket.emit(event, data);
    }

    getId() {
        return socket.id;
    }
}

// Export a singleton instance
export const battleSocketClient = new BattleSocketClient();