import { Socket } from "socket.io-client";

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
    private onNewPlayer: (data: any) => void;
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
            onNewPlayer: (data: any) => void;
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
        this.onNewPlayer = callbacks.onNewPlayer;
        this.onPlayerDisconnected = callbacks.onPlayerDisconnected;
    }

    public setupSocketListeners(): void {
        console.log("Setting up socket event listeners");

        // Clear any existing listeners to prevent duplicates
        this.clearSocketListeners();

        // Game state updates
        this.socket.on("gameStateUpdate", this.onGameStateUpdate);
        this.socket.on("matchEnded", this.onMatchEnded);
        this.socket.on("playerHit", this.onPlayerHit);
        this.socket.on("playerAttacked", this.onPlayerAttacked);
        this.socket.on("timerUpdate", this.onTimerUpdate);
        this.socket.on("playersConnected", this.onPlayersConnected);
        this.socket.on("newPlayer", this.onNewPlayer);
        this.socket.on("playerDisconnected", this.onPlayerDisconnected);

        // Debug listeners
        this.socket.on("matchFound", (data) => {
            console.log("matchFound event received:", data);
        });

        this.socket.on("yourPlayerId", (playerId) => {
            console.log("yourPlayerId event received:", playerId);
        });
    }

    public clearSocketListeners(): void {
        this.socket.off("gameStateUpdate");
        this.socket.off("matchEnded");
        this.socket.off("playerHit");
        this.socket.off("playerAttacked");
        this.socket.off("timerUpdate");
        this.socket.off("playersConnected");
        this.socket.off("newPlayer");
        this.socket.off("playerDisconnected");
        this.socket.off("matchFound");
        this.socket.off("yourPlayerId");
    }

    public emitPlayerReady(player1: any, player2: any): void {
        console.log("Emitting playerReady event");
        this.socket.emit("playerReady", {
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
        this.socket.emit("playerMoved", data);
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
            this.socket.emit("playerAttacked", {
                x: playerData.x, 
                y: playerData.y, 
                attackWidth, 
                attackHeight, 
                flipX: playerData.flipX
            });
        } else {
            // Fallback if player data isn't available
            this.socket.emit("playerAttacked");
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
