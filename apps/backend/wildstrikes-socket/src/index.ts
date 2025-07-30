import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import { MatchmakingService } from "./services/battle/MatchMakingService";
import { BattleService } from "./services/battle/BattleService";

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const matchmaking = new MatchmakingService(io);
const roomService = matchmaking.getRoomService(); // Get the room service from matchmaking
const battleService = new BattleService(io, roomService); // Pass room service to battle service

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Matchmaking events
    socket.on("join-matchmaking", (playerData: string[]) => {
        matchmaking.join(socket.id, playerData);
    });

    socket.on("leave-matchmaking", () => {
        matchmaking.leave(socket.id);
    });

    socket.on("start-battle", () => {
        const roomId = matchmaking.getPlayerRoom(socket.id);
        if (roomId) {
            const roomService = matchmaking.getRoomService();
            const players = roomService.getPlayersInRoom(roomId);
            if (players && players.length === 2) {
                battleService.startBattle(roomId, players[0], players[1]);
            }
        }
    });

    // Handle player state updates for multiplayer sync
    socket.on("player-state-update", (playerState) => {
        const roomId = matchmaking.getPlayerRoom(socket.id);
        if (roomId) {
            battleService.handlePlayerStateUpdate(roomId, socket.id, playerState);
        }
    });

    socket.on("disconnect", () => {
        const roomId = matchmaking.getPlayerRoom(socket.id);
        if (roomId) {
            battleService.handlePlayerDisconnect(roomId, socket.id);
        }
        matchmaking.disconnect(socket.id);
    });


});

server.listen(3001, () => {
    console.log("Socket.IO server is running on port 3001");
});
