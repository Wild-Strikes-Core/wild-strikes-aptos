import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import { MatchmakingService } from "./services/battle/MatchMakingService";
import { BattleService } from "./services/battle/BattleService";
import { registerBattleEvents } from "./controllers/battle-events";
import { registerMatchmakingEvents } from "./controllers/matchmaking-events";

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const matchmaking = new MatchmakingService(io);
const roomService = matchmaking.getRoomService(); // Get the room service from matchmaking
const battleService = new BattleService(io, roomService); // Pass room service to battle service

io.use((socket, next) => {
    const roomId = matchmaking.getPlayerRoom(socket.id);
    if (roomId) {
        (socket as any).roomId = roomId;
        console.log(`[SOCKET MIDDLEWARE] Set roomId ${roomId} for socket ${socket.id}`);
    } else {
        console.log(`[SOCKET MIDDLEWARE] No roomId found for socket ${socket.id}`);
    }
    next();
});

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    
    // ✅ ADD THIS: Join socket to room if it's already mapped
    const roomId = matchmaking.getPlayerRoom(socket.id);
    if (roomId) {
        socket.join(roomId);
        (socket as any).roomId = roomId;
        console.log(`[SOCKET] Socket ${socket.id} rejoined room ${roomId}`);
    }

    registerMatchmakingEvents(io, socket, matchmaking);
    registerBattleEvents(io, socket, matchmaking, battleService);

    socket.on("client:start-battle", (data?: { roomId?: string }) => {
        // console.log(`[BATTLE SOCKET] Start battle requested by socket: ${socket.id}`, data);
        
        let roomId = data?.roomId || (socket as any).roomId || matchmaking.getPlayerRoom(socket.id);
        // console.log(`[BATTLE SOCKET] Resolved room ID: ${roomId}`);
        
        if (roomId) {
            const roomService = matchmaking.getRoomService();
            const players = roomService.getPlayersInRoom(roomId);
            // console.log(`[BATTLE SOCKET] Players in room ${roomId}:`, players);
            
            if (players && players.length === 2) {
                // console.log(`[BATTLE SOCKET] Starting battle for room ${roomId}`);
                battleService.startBattle(roomId, players[0], players[1]);
            } 
            // else {
            //     console.log(`[BATTLE SOCKET] Not enough players in room ${roomId}. Found: ${players?.length || 0}`);
            // }
        } 
        // else {
        //     console.log(`[BATTLE SOCKET] No room ID found for socket ${socket.id}`);
        // }
    });

    socket.on("disconnect", () => {
        const roomId = (socket as any).roomId;
        if (roomId) {
            battleService.handlePlayerDisconnect(roomId, socket.id);
        }
        matchmaking.disconnect(socket.id);
    });
});

server.listen(3001, () => {
    console.log("Socket.IO server is running on port 3001");
});
