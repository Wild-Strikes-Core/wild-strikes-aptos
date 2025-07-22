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
    
    // Generate a random map ID for both players to use the same map
    const mapId = Math.floor(Math.random() * 4); // Assuming you have 4 maps (0-3)
    
    // Send initial game state to both players
    room.broadcastToAll('player:connected', {
      player: {
        id: gameState.player1.id,
        spawnX: gameState.player1.x,
        spawnY: gameState.player1.y
      },
      player2: {
        id: gameState.player2.id,
        spawnX: gameState.player2.x,
        spawnY: gameState.player2.y
      },
      mapId: mapId // Add synchronized map ID
    });
  }
}


