import { Server, Socket } from "socket.io";
import { BattleService } from "../services/battle/BattleService";
import { MatchmakingService } from "../services/battle/MatchMakingService";

export function registerBattleEvents(io: Server, socket: Socket, matchmaking: MatchmakingService, battleService: BattleService) {
    socket.on("player:moved", (playerState) => {
        const roomId = (socket as any).roomId;
        // battleService.playerHasMoved(roomId, playerState.socketId, playerState);
    });

    socket.on("player:attacked", (attackData) => {
        const roomId = (socket as any).roomId;
        
    });
}