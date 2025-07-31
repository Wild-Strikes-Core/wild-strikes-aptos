import { Server, Socket } from "socket.io";
import { BattleService } from "../services/battle/BattleService";
import { MatchmakingService } from "../services/battle/MatchMakingService";

export function registerBattleEvents(io: Server, socket: Socket, matchmaking: MatchmakingService, battleService: BattleService) {
    socket.on("player-state-update", (playerState) => {
        const roomId = (socket as any).roomId;
        if (roomId) {
            battleService.handlePlayerStateUpdate(roomId, socket.id, playerState);
        }
    });

    socket.on("player-attack", (attackData) => {
        const roomId = (socket as any).roomId;
        if (roomId) {
            battleService.handleAttack(roomId, socket.id, attackData);
        }
    });
}