/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server, Socket } from "socket.io";
import { BattleService } from "../services/battle/BattleService";
import { MatchmakingService } from "../services/battle/MatchMakingService";

/**
 * Registers per-socket battle event handlers. Ensures socket is joined to the
 * correct room for each event and forwards messages to the BattleService.
 */
export function registerBattleEvents(io: Server, socket: Socket, matchmaking: MatchmakingService, battleService: BattleService) {
    // Client → server periodic context update (movement, inputs, state)
    socket.on("player:moved", (playerContext) => {
        const playerId = socket.id;
        const mappedRoomId = matchmaking.getPlayerRoom(playerId);
        const currentSocketRoomId = (socket as any).roomId;

        // Ensure socket is in the correct room for this event every time
        if (mappedRoomId && mappedRoomId !== currentSocketRoomId) {
            if (currentSocketRoomId) socket.leave(currentSocketRoomId);
            (socket as any).roomId = mappedRoomId;
            socket.join(mappedRoomId);
            console.log(`[BATTLE EVENTS] Updated socket room mapping for ${playerId}: ${currentSocketRoomId} -> ${mappedRoomId}`);
        }

        const roomId = mappedRoomId || currentSocketRoomId;

        if (roomId && playerId) {
            battleService.validatePlayerInput(roomId, playerId, playerContext);
        }
    });

    // Client → server attack attempt. Server validates and broadcasts result.
    socket.on("player:attacked", (attackData) => {
        const roomId = (socket as any).roomId;
        const playerId = socket.id;
        console.log(`[BATTLE EVENTS] Received player:attacked from ${playerId} in room ${roomId}:`, attackData);
        
        if (roomId && playerId) {
            battleService.handlePlayerAttack(roomId, playerId, attackData);
        } else {
            console.log(`[BATTLE EVENTS] Missing roomId (${roomId}) or playerId (${playerId}) for player:attacked event`);
        }
    });
}