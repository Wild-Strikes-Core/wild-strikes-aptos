// src/controllers/gameController.ts
import { Socket } from 'socket.io';
import { getRoomBySocketId } from '../services/roomService';
import { handlePlayerReconnect, bufferEventForDisconnectedPlayer, isPlayerDisconnected } from '../services/reconnectionService';

export function handleMove(socket: Socket, data: { x: number; y: number; velocityX: number; velocityY: number; flipX: boolean; anim: string }) {
  const room = getRoomBySocketId(socket.id);
  if (!room) {
    console.log(`Player ${socket.id} tried to move but not in a room`);
    return;
  }

  // Update player position in room
  room.updatePlayerPosition(socket.id, data);

  // Broadcast position to other players in the room
  const positionData = {
    playerId: socket.id,
    x: data.x,
    y: data.y,
    velocityX: data.velocityX,
    velocityY: data.velocityY,
    flipX: data.flipX,
    anim: data.anim
  };

  room.broadcastToOthers(socket.id, 'player:position', positionData);
  
  // Buffer events for disconnected players
  room.players.forEach((playerSocket, playerId) => {
    if (playerId !== socket.id && isPlayerDisconnected(playerId)) {
      bufferEventForDisconnectedPlayer(playerId, 'player:position', positionData);
    }
  });
}

export function handleAttack(socket: Socket, data: { type: string; x: number; y: number }) {
  const room = getRoomBySocketId(socket.id);
  if (!room) {
    console.log(`Player ${socket.id} tried to attack but not in a room`);
    return;
  }

  // Process attack in room
  room.processAttack(socket.id, data);
}

export function handlePlayerReady(socket: Socket, data: { playerId: string }) {
  const room = getRoomBySocketId(socket.id);
  if (!room) {
    console.log(`Player ${socket.id} tried to ready up but not in a room`);
    return;
  }

  console.log(`Player ${socket.id} is ready`);
  
  // Check if this is a reconnection
  if (handlePlayerReconnect(socket, room.id)) {
    console.log(`🔄 [${socket.id}] successfully reconnected to room ${room.id}`);
    return;
  }
  
  // Check if both players are ready and start the game
  const gameState = room.getGameState();
  if (gameState && !room.gameStarted) {
    room.startGame();
    
    // Send initial game state to both players
    room.broadcastToAll('players:connected', {
      player1: gameState.player1,
      player2: gameState.player2,
      selectedMap: 'default' // You can randomize this
    });
  }
}


