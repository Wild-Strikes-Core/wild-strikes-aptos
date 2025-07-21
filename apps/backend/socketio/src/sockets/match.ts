// Match start, end, rematch, etc.// src/sockets/match.ts
import { Socket, Server } from 'socket.io';
import { findMatch, cancelMatch } from '../services/matchmakingService';

export function registerMatchmakingHandlers(io: Server, socket: Socket) {
  console.log(`🎯 Setting up matchmaking handlers for [${socket.id}]`);
  
  socket.on('matchmaking:find', () => {
    console.log(`🎯 [${socket.id}] requested matchmaking`);
    findMatch(io, socket);
  });

  socket.on('matchmaking:cancel', () => {
    console.log(`❌ [${socket.id}] cancelled matchmaking`);
    cancelMatch(socket);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [${socket.id}] disconnected from matchmaking`);
    cancelMatch(socket); // auto-cancel on disconnect
  });
}
