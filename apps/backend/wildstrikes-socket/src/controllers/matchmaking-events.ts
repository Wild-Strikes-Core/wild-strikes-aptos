import { Server, Socket } from "socket.io";
import { MatchmakingService } from "../services/battle/MatchMakingService";

export function registerMatchmakingEvents(io: Server, socket: Socket, matchmaking: MatchmakingService) {
    socket.on("join-matchmaking", (playerData: string[]) => {
        matchmaking.join(socket.id, playerData);
    });

    socket.on("leave-matchmaking", () => {
        matchmaking.leave(socket.id);
    });
}