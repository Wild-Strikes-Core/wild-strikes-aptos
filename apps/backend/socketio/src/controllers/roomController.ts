// controllers/roomController.ts
import { createRoom } from '../services/roomService';

export function handleMatchFound(player1: any, player2: any) {
  const roomId = createRoom(player1, player2);
  player1.join(roomId);
  player2.join(roomId);

  player1.emit('matchmaking:found', { roomId, opponentId: player2.id });
  player2.emit('matchmaking:found', { roomId, opponentId: player1.id });

  return roomId;
}
