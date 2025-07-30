import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Map configuration interface
interface MapConfig {
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

// Room data interface
interface RoomData {
    players: Set<string>;
    mapConfig: MapConfig;
    createdAt: number;
    gameState: 'waiting' | 'active' | 'ended';
}

export class RoomService {
    private rooms: Map<string, RoomData> = new Map(); // roomId -> room data
    private playerRoomMap: Map<string, string> = new Map(); // socketId -> roomId mapping
    private availableMaps: MapConfig[] = [];

    constructor(private io: Server) {
        this.initializeMaps();
    }

    private initializeMaps() {
        // Define available battle maps - matching client-side MapManager
        this.availableMaps = [
            {
                id: 'forest',
                name: 'forest',
                theme: 'nature',
                spawnPoints: {
                    player1: { x: 150, y: 400 },
                    player2: { x: 650, y: 400 }
                },
                backgroundMusic: 'in-match',
                backgroundImage: 'newMap',
                platforms: [
                    { x: 0, y: 500, width: 800, height: 20 } // main ground
                ],
                mapBounds: { width: 800, height: 600 }
            },
            {
                id: 'philippines',
                name: 'Philippines',
                theme: 'tropical',
                spawnPoints: {
                    player1: { x: 150, y: 400 },
                    player2: { x: 650, y: 400 }
                },
                backgroundMusic: 'PH-BG',
                backgroundImage: 'Philippines',
                platforms: [
                    { x: 0, y: 500, width: 800, height: 20 } // main ground
                ],
                mapBounds: { width: 800, height: 600 }
            },
            {
                id: 'japan',
                name: 'Japan',
                theme: 'eastern',
                spawnPoints: {
                    player1: { x: 150, y: 400 },
                    player2: { x: 650, y: 400 }
                },
                backgroundMusic: 'JPN-BG',
                backgroundImage: 'Japan',
                platforms: [
                    { x: 0, y: 500, width: 800, height: 20 } // main ground
                ],
                mapBounds: { width: 800, height: 600 }
            },
            {
                id: 'france',
                name: 'France',
                theme: 'european',
                spawnPoints: {
                    player1: { x: 150, y: 400 },
                    player2: { x: 650, y: 400 }
                },
                backgroundMusic: 'FRN-BG',
                backgroundImage: 'France',
                platforms: [
                    { x: 0, y: 500, width: 800, height: 20 } // main ground
                ],
                mapBounds: { width: 800, height: 600 }
            }
        ];

        console.log(`🗺️ Initialized ${this.availableMaps.length} battle maps`);
    }

    private selectRandomMap(): MapConfig {
        const randomIndex = Math.floor(Math.random() * this.availableMaps.length);
        const selectedMap = this.availableMaps[randomIndex];
        console.log(`🎲 Selected random map: ${selectedMap.name} (${selectedMap.theme})`);
        return selectedMap;
    }

    createRoom(p1: string, p2: string): string {
        // Generate unique room ID
        const roomId = uuidv4();
        
        // Select a random map for this battle
        const selectedMap = this.selectRandomMap();
        
        // Create room data with selected map
        const roomData: RoomData = {
            players: new Set([p1, p2]),
            mapConfig: selectedMap,
            createdAt: Date.now(),
            gameState: 'waiting'
        };
        
        this.rooms.set(roomId, roomData);

        // Map both players to this room
        this.playerRoomMap.set(p1, roomId);
        this.playerRoomMap.set(p2, roomId);

        // Join both players to the Socket.IO room
        this.io.sockets.sockets.get(p1)?.join(roomId);
        this.io.sockets.sockets.get(p2)?.join(roomId);

        console.log(`🏟️ Created room ${roomId} with map "${selectedMap.name}" for players ${p1} and ${p2}`);
        return roomId;
    }

    getRoomOf(socketId: string): string | undefined {
        // Get the room ID that this player is currently in
        return this.playerRoomMap.get(socketId);
    }

    getPlayersInRoom(roomId: string): string[] {
        // Get all player socket IDs in a specific room
        const roomData = this.rooms.get(roomId);
        return roomData ? Array.from(roomData.players) : [];
    }

    getRoomData(roomId: string): RoomData | undefined {
        return this.rooms.get(roomId);
    }

    getRoomMapConfig(roomId: string): MapConfig | undefined {
        const roomData = this.rooms.get(roomId);
        return roomData?.mapConfig;
    }

    updateGameState(roomId: string, gameState: 'waiting' | 'active' | 'ended') {
        const roomData = this.rooms.get(roomId);
        if (roomData) {
            roomData.gameState = gameState;
            
            // Notify players about game state change
            this.io.to(roomId).emit("game-state-change", {
                roomId,
                gameState,
                timestamp: Date.now()
            });
        }
    }

    leaveRoom(socketId: string) {
        // Find and leave the player's current room
        const roomId = this.playerRoomMap.get(socketId);
        if (!roomId) return;

        const roomData = this.rooms.get(roomId);
        if (roomData) {
            roomData.players.delete(socketId);
            // Auto-cleanup empty rooms
            if (roomData.players.size === 0) {
                this.rooms.delete(roomId);
                console.log(`🏟️ Room ${roomId} destroyed - no players remaining`);
            } else {
                // Notify remaining players
                this.io.to(roomId).emit("player-left", {
                    roomId,
                    playerId: socketId,
                    remainingPlayers: Array.from(roomData.players)
                });
            }
        }

        // Remove player mapping and leave Socket.IO room
        this.playerRoomMap.delete(socketId);
        this.io.sockets.sockets.get(socketId)?.leave(roomId);
    }

    destroyRoom(roomId: string) {
        // Force destroy a room and remove all players
        const roomData = this.rooms.get(roomId);
        if (!roomData) return;

        const players = Array.from(roomData.players);
        players.forEach((socketId: string) => {
            this.playerRoomMap.delete(socketId);
            this.io.sockets.sockets.get(socketId)?.leave(roomId);
        });

        this.rooms.delete(roomId);
        console.log(`🏟️ Room ${roomId} destroyed with map "${roomData.mapConfig.name}"`);
    }

    // Get all available maps
    getAvailableMaps(): MapConfig[] {
        return [...this.availableMaps];
    }

    // Get a specific map by ID
    getMapById(mapId: string): MapConfig | undefined {
        return this.availableMaps.find(map => map.id === mapId);
    }

    // Get room statistics
    getRoomStats() {
        const totalRooms = this.rooms.size;
        const activeRooms = Array.from(this.rooms.values()).filter(room => room.gameState === 'active').length;
        const waitingRooms = Array.from(this.rooms.values()).filter(room => room.gameState === 'waiting').length;
        
        return {
            totalRooms,
            activeRooms,
            waitingRooms,
            totalPlayers: this.playerRoomMap.size,
            availableMaps: this.availableMaps.length
        };
    }

}