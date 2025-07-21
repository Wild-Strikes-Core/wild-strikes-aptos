// src/services/roomService.ts
import { Socket } from 'socket.io';
import { GameRoom } from '../models/Room';

const rooms = new Map<string, GameRoom>();

export function createRoom(player1: Socket, player2: Socket): string {
  const roomId = `room-${player1.id.slice(0, 4)}-${player2.id.slice(0, 4)}`;
  const room = new GameRoom(roomId);
  
  // Add players to the room
  room.addPlayer(player1.id, player1);
  room.addPlayer(player2.id, player2);
  
  rooms.set(roomId, room);
  console.log(`🏠 Created room ${roomId}`);
  console.log(`👤 Room ${roomId} players: [${player1.id}], [${player2.id}]`);
  console.log(`📊 Total rooms: ${rooms.size}`);
  return roomId;
}

export function getRoomBySocketId(socketId: string): GameRoom | undefined {
  for (const room of rooms.values()) {
    if (room.hasPlayer(socketId)) {
      return room;
    }
  }
  return undefined;
}

export function removeRoom(roomId: string): void {
  const room = rooms.get(roomId);
  if (room) {
    room.cleanup();
    rooms.delete(roomId);
    console.log(`🗑️  Room ${roomId} removed`);
    console.log(`📊 Total rooms: ${rooms.size}`);
  }
}

export function getRoom(roomId: string): GameRoom | undefined {
  return rooms.get(roomId);
}

// Add a function to get all rooms status (for debugging)
export function getAllRoomsStatus() {
  const roomStatus = [];
  for (const [roomId, room] of rooms.entries()) {
    roomStatus.push({
      roomId,
      playerCount: room.players.size,
      players: Array.from(room.players.keys())
    });
  }
  return roomStatus;
}