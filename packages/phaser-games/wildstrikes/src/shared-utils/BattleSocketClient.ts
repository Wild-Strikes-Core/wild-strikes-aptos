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

// export interface MapSelectedData {
//     roomId: string;
//     mapConfig: MapConfig;
//     players: Array<{
//         socketId: string;
//         spawnPosition: { x: number; y: number };
//     }>;
// }

export class BattleSocketClient {

    constructor() {
     }

    // Event listener methods for multiplayer sync
    on(event: string, callback: (...args: any[]) => void) {
        socket.on(event, callback);
    }

    off(event: string, callback?: (...args: any[]) => void) {
        socket.off(event, callback);
    }

    startBattle() {
        socket.emit("start-battle");
    }

    // Server-authoritative input system
    sendPlayerContext(playerContext: any) {
        socket.emit("player:moved", playerContext);
    }

    sendPlayerAttack(attackData: any) {
        socket.emit("player:attacked", attackData);
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