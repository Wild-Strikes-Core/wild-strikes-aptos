import { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@shared/socket-events";

export interface IPlayerState {
    id?: string;
    x?: number;
    y?: number;
    velocityX?: number;
    velocityY?: number;
    health: number;
    flipX?: boolean;
    anim?: string;
    pastAnim?: string;
}

export class ArenaNetworking {
    private scene: Phaser.Scene;
    private socket: Socket;
    private onGameStateUpdate: (data: any) => void;
    private onMatchEnded: (data: any) => void;
    private onPlayerHit: (data: any) => void;
    private onPlayerAttacked: (data: any) => void;
    private onTimerUpdate: (data: any) => void;
    private onPlayersConnected: (data: any) => void;
    private onPlayerDisconnected: (data: any) => void;

    constructor(
        scene: Phaser.Scene,
        socket: Socket,
        callbacks: {
            onGameStateUpdate: (data: any) => void;
            onMatchEnded: (data: any) => void;
            onPlayerHit: (data: any) => void;
            onPlayerAttacked: (data: any) => void;
            onTimerUpdate: (data: any) => void;
            onPlayersConnected: (data: any) => void;
            onPlayerDisconnected: (data: any) => void;
        }
    ) {
        this.scene = scene;
        this.socket = socket;
        this.onGameStateUpdate = callbacks.onGameStateUpdate;
        this.onMatchEnded = callbacks.onMatchEnded;
        this.onPlayerHit = callbacks.onPlayerHit;
        this.onPlayerAttacked = callbacks.onPlayerAttacked;
        this.onTimerUpdate = callbacks.onTimerUpdate;
        this.onPlayersConnected = callbacks.onPlayersConnected;
        this.onPlayerDisconnected = callbacks.onPlayerDisconnected;
    }

    public setupSocketListeners(): void {
        console.log("Setting up socket event listeners");

        // Clear any existing listeners to prevent duplicates
        this.clearSocketListeners();

        // Game state updates
        this.socket.on(SOCKET_EVENTS.GAME_STATE_UPDATE, this.onGameStateUpdate);
        this.socket.on(SOCKET_EVENTS.MATCH_ENDED, this.onMatchEnded);
        this.socket.on(SOCKET_EVENTS.PLAYER_HIT, this.onPlayerHit);
        this.socket.on(SOCKET_EVENTS.PLAYER_ATTACKED, this.onPlayerAttacked);
        this.socket.on(SOCKET_EVENTS.TIMER_UPDATE, this.onTimerUpdate);
        this.socket.on(SOCKET_EVENTS.PLAYERS_CONNECTED, this.onPlayersConnected);
        this.socket.on(SOCKET_EVENTS.PLAYER_DISCONNECTED, this.onPlayerDisconnected);

        // Debug listeners
        this.socket.on(SOCKET_EVENTS.MATCH_FOUND, (data) => {
            console.log("matchFound event received:", data);
        });

        this.socket.on(SOCKET_EVENTS.YOUR_PLAYER_ID, (playerId) => {
            console.log("yourPlayerId event received:", playerId);
        });
    }

    public clearSocketListeners(): void {
        this.socket.off(SOCKET_EVENTS.GAME_STATE_UPDATE);
        this.socket.off(SOCKET_EVENTS.MATCH_ENDED);
        this.socket.off(SOCKET_EVENTS.PLAYER_HIT);
        this.socket.off(SOCKET_EVENTS.PLAYER_ATTACKED);
        this.socket.off(SOCKET_EVENTS.TIMER_UPDATE);
        this.socket.off(SOCKET_EVENTS.PLAYERS_CONNECTED);
        this.socket.off(SOCKET_EVENTS.PLAYER_DISCONNECTED);
        this.socket.off(SOCKET_EVENTS.MATCH_FOUND);
        this.socket.off(SOCKET_EVENTS.YOUR_PLAYER_ID);
    }

    public emitPlayerReady(player1: any, player2: any): void {
        console.log("Emitting playerReady event");
        this.socket.emit(SOCKET_EVENTS.PLAYER_READY, {
            player1: player1,
            player2: player2,
        });
    }

    public emitPlayerMoved(data: {
        x: number;
        y: number;
        velocityX: number;
        velocityY: number;
        flipX: boolean;
        anim: string;
    }): void {
        this.socket.emit(SOCKET_EVENTS.PLAYER_MOVED, data);
    }

    public emitPlayerAttack(playerData?: {
        x: number;
        y: number;
        flipX: boolean;
    }): void {
        if (playerData) {
            // Define attack area (in front of the player)
            const attackWidth = 120;  // Attack reach
            const attackHeight = 80;  // Attack height
            
            // Send attack data to server with position for hit detection
            this.socket.emit(SOCKET_EVENTS.PLAYER_ATTACK, {
                x: playerData.x, 
                y: playerData.y, 
                attackWidth, 
                attackHeight, 
                flipX: playerData.flipX
            });
        } else {
            // Fallback if player data isn't available
            this.socket.emit(SOCKET_EVENTS.PLAYER_ATTACK);
        }
    }

    public getSocketId(): string | undefined {
        return this.socket.id;
    }

    public isConnected(): boolean {
        return this.socket.connected;
    }

    public destroy(): void {
        this.clearSocketListeners();
    }
}
