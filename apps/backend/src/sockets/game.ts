// game loop sync, attack events

// src/sockets/game.ts
import { Server, Socket } from 'socket.io';
import { handleAttack, handleMove, handlePlayerReady } from '../controllers/gameController';
import { handlePlayerWin, handlePlayerLeft } from '../services/matchEndService';

export default function registerGameHandlers(io: Server, socket: Socket) {
  socket.on('player:move', (data) => {
    handleMove(socket, data);
  });

  socket.on('player:attack', (data) => {
    handleAttack(socket, data);
  });

  socket.on('player:ready', (data) => {
    handlePlayerReady(socket, data);
  });

  // Match end events
  socket.on('player:win', (data: { winnerId: string; loserId: string }) => {
    const { getRoomBySocketId } = require('../services/roomService');
    const room = getRoomBySocketId(socket.id);
    if (room) {
      handlePlayerWin(io, room.id, data.winnerId, data.loserId);
    }
  });

  socket.on('player:leave', () => {
    const { getRoomBySocketId } = require('../services/roomService');
    const room = getRoomBySocketId(socket.id);
    if (room) {
      handlePlayerLeft(io, room.id, socket.id);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player ${socket.id} disconnected from game`);
    // Room cleanup will be handled by the room manager
  });
}
