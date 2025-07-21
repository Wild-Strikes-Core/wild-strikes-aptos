// src/services/matchmakingService.ts
import { Server, Socket } from 'socket.io';
import { createRoom } from './roomService';

const matchmakingQueue: Set<Socket> = new Set();

export function findMatch(io: Server, socket: Socket) {
  if (matchmakingQueue.has(socket)) {
    console.log(`⚠️  [${socket.id}] already in queue, ignoring duplicate request`);
    return;
  }

  matchmakingQueue.add(socket);
  console.log(`➕ [${socket.id}] added to matchmaking queue`);
  console.log(`📊 Queue size: ${matchmakingQueue.size}`);

  // Attempt match if 2 players available
  if (matchmakingQueue.size >= 2) {
    console.log(`🎯 Found 2 players! Creating match...`);
    
    const players = Array.from(matchmakingQueue).slice(0, 2);
    players.forEach((p) => matchmakingQueue.delete(p));

    const [player1, player2] = players;
    console.log(` Players: [${player1.id}] vs [${player2.id}]`);

    const roomId = createRoom(player1, player2);
    player1.join(roomId);
    player2.join(roomId);

    console.log(`🏠 Room created: ${roomId}`);
    console.log(`📤 Notifying players of match...`);

    // Notify both players
    player1.emit('matchmaking:found', { roomId, opponentId: player2.id });
    player2.emit('matchmaking:found', { roomId, opponentId: player1.id });

    // Start the match
    io.to(roomId).emit('match:start', { roomId });
    console.log(`🎮 Match started in room ${roomId}`);
    console.log(`📊 Remaining queue size: ${matchmakingQueue.size}`);
  } else {
    console.log(`⏳ Waiting for more players... (${matchmakingQueue.size}/2)`);
  }
}

export function cancelMatch(socket: Socket) {
  if (matchmakingQueue.has(socket)) {
    matchmakingQueue.delete(socket);
    console.log(`❌ [${socket.id}] removed from matchmaking queue`);
    console.log(`📊 Queue size: ${matchmakingQueue.size}`);
  }
}

// Add a function to get queue status (for debugging)
export function getQueueStatus() {
  return {
    size: matchmakingQueue.size,
    players: Array.from(matchmakingQueue).map(socket => socket.id)
  };
}
