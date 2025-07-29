import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import { MatchmakingService } from "./services/battle/MatchMakingService";

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const matchmaking = new MatchmakingService(io);

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-matchmaking", (playerData: string[]) => {
        matchmaking.join(socket.id, playerData);
    });

    socket.on("leave-matchmaking", () => {
        matchmaking.leave(socket.id);
    });

    socket.on("disconnect", () => {
        matchmaking.disconnect(socket.id);
    });
});

server.listen(3001, () => {
    console.log("Socket.IO server is running on port 3001");
});
