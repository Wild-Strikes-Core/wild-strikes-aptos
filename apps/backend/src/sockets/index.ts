// this file gets the server-wide io instance
// registers listeners for each game context (e.g. game, lobby, etc.)

import { Server, Socket } from 'socket.io';
import registerGameHandlers from './game';
import { registerMatchmakingHandlers } from './match';
import { handlePlayerDisconnect, handlePlayerReconnect, isPlayerDisconnected } from '../services/reconnectionService';

export function setupSocketHandlers(io: Server) {
  console.log('🔌 Setting up socket handlers...');
  
  io.on('connection', (socket: Socket) => {
    console.log(`✅ [+] Player connected: ${socket.id}`);
    console.log(`📊 Total connections: ${io.engine.clientsCount}`);

    // Check if this is a reconnection
    if (isPlayerDisconnected(socket.id)) {
      console.log(`🔄 [${socket.id}] attempting to reconnect...`);
      // The reconnection will be handled when they join a room
    }

    // Register feature modules
    registerGameHandlers(io, socket);
    registerMatchmakingHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`❌ [-] Player disconnected: ${socket.id}`);
      console.log(`📊 Total connections: ${io.engine.clientsCount}`);
      
      // Check if player was in a room and handle graceful disconnection
      const { getRoomBySocketId } = require('../services/roomService');
      const room = getRoomBySocketId(socket.id);
      if (room) {
        handlePlayerDisconnect(socket, room.id);
      }
    });
  });
}