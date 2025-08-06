import { Server, Socket } from "socket.io";
import { BattleService } from "../services/battle/BattleService";
import { MatchmakingService } from "../services/battle/MatchMakingService";

export function registerBattleEvents(io: Server, socket: Socket, matchmaking: MatchmakingService, battleService: BattleService) {
    socket.on("player:moved", (playerContext) => {
        let roomId = (socket as any).roomId;
        const playerId = socket.id;
        
        // Fallback: Try to get roomId from matchmaking service if not set on socket
        if (!roomId) {
            roomId = matchmaking.getPlayerRoom(playerId);
            if (roomId) {
                (socket as any).roomId = roomId; // Cache it on the socket for future use
                socket.join(roomId); // Ensure socket is in the room
                console.log(`[BATTLE EVENTS] Found and set roomId ${roomId} for player ${playerId}`);
            }
        }
        
        console.log(`[BATTLE EVENTS] Received player:moved from ${playerId} in room ${roomId}:`, playerContext);
        
        if (roomId && playerId) {
            battleService.validatePlayerInput(roomId, playerId, playerContext);
        } else {
            console.log(`[BATTLE EVENTS] Missing roomId (${roomId}) or playerId (${playerId}) for player:moved event`);
        }
    });

    socket.on("player:attacked", (attackData) => {
        const roomId = (socket as any).roomId;
        
    });
}