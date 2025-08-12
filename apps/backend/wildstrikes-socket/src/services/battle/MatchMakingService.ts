import { Server } from 'socket.io';
import { RoomService } from './RoomService';

export class MatchmakingService {
    private queue: Map<string, string[]> = new Map(); // Queue of players waiting for match
    private matches: Record<string, string> = {}; // Track matched players (socketId -> opponentId)
    private roomService: RoomService; // Room management service

    constructor(private io: Server) {
        this.roomService = new RoomService(io); // Initialize room service
    }

    join(socketId: string, playerData: string[]) {
        // Add player to matchmaking queue
        this.queue.set(socketId, playerData);
        this.attemptMatch();
    }

    leave(socketId: string) {
        // Remove player from matchmaking queue
        this.queue.delete(socketId);
    }

    disconnect(socketId: string) {
        // Remove from matchmaking queue
        this.leave(socketId);

        // Handle opponent disconnect if in active match
        const opponentId = this.matches[socketId];
        if (opponentId) {
            this.io.to(opponentId).emit("opponent-disconnected");
            delete this.matches[opponentId];
            delete this.matches[socketId];
        }

        // Leave any active battle room
        this.roomService.leaveRoom(socketId);
    }

    // Called when a battle ends to clear match mapping for both players
    clearMatch(p1: string, p2: string) {
        delete this.matches[p1];
        delete this.matches[p2];
    }

    private attemptMatch() {
        // Check if there are at least 2 players in queue
        const entries = Array.from(this.queue.entries());
        if (entries.length >= 2) {
            const [p1Id, p1Data] = entries[0];
            const [p2Id, p2Data] = entries[1];

            // Remove matched players from queue
            this.queue.delete(p1Id);
            this.queue.delete(p2Id);

            // Track the match relationship
            this.matches[p1Id] = p2Id;
            this.matches[p2Id] = p1Id;

            // Create a battle room for the matched players
            const roomId = this.roomService.createRoom(p1Id, p2Id);
            
            // Get the room's map configuration
            const mapConfig = this.roomService.getRoomMapConfig(roomId);
            
            // Send map-selected event to both players with player data
            // Player 1 gets their spawn position first, Player 2 gets their spawn position first
            const mapSelectedDataP1 = {
                roomId: roomId,
                mapConfig: mapConfig,
                players: [
                    {
                        socketId: p1Id,
                        spawnPosition: mapConfig?.spawnPoints.player1 || { x: 100, y: 300 }
                    },
                    {
                        socketId: p2Id,
                        spawnPosition: mapConfig?.spawnPoints.player2 || { x: 700, y: 300 }
                    }
                ]
            };

            const mapSelectedDataP2 = {
                roomId: roomId,
                mapConfig: mapConfig,
                players: [
                    {
                        socketId: p2Id,
                        spawnPosition: mapConfig?.spawnPoints.player2 || { x: 700, y: 300 }
                    },
                    {
                        socketId: p1Id,
                        spawnPosition: mapConfig?.spawnPoints.player1 || { x: 100, y: 300 }
                    }
                ]
            };

            this.io.to(p1Id).emit("map-selected", mapSelectedDataP1);
            this.io.to(p2Id).emit("map-selected", mapSelectedDataP2);

            console.log(`Match found between ${p1Id} and ${p2Id} in room ${roomId} with map ${mapConfig?.name}`);

            // Notify both players about the match and room with map config
            this.io.to(p1Id).emit("match-found", {
                roomId: roomId,
                opponentId: p2Id,
                opponentData: p2Data,
                yourId: p1Id,
                yourData: p1Data,
                mapConfig: mapConfig
            });
            this.io.to(p2Id).emit("match-found", {
                roomId: roomId,
                opponentId: p1Id,
                opponentData: p1Data,
                yourId: p2Id,
                yourData: p2Data,
                mapConfig: mapConfig
            });
        }
    }

    // Get the room ID for a specific player
    getPlayerRoom(socketId: string): string | undefined {
        return this.roomService.getRoomOf(socketId);
    }

    // Get room service instance for external use (if needed)
    getRoomService(): RoomService {
        return this.roomService;
    }
}
