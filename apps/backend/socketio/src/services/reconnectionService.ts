// src/services/reconnectionService.ts
import { Socket } from 'socket.io';
import { GameRoom } from '../models/Room';

interface DisconnectedPlayer {
  socketId: string;
  roomId: string;
  disconnectTime: number;
  reconnectionWindow: number; // milliseconds
  bufferedEvents: Array<{
    event: string;
    data: any;
    timestamp: number;
  }>;
}

const disconnectedPlayers = new Map<string, DisconnectedPlayer>();
const RECONNECTION_WINDOW = 30000; // 30 seconds to reconnect
const BUFFER_CLEANUP_INTERVAL = 10000; // Clean up every 10 seconds
const reconnectionTimeouts = new Map<string, NodeJS.Timeout>();

export function handlePlayerDisconnect(socket: Socket, roomId: string) {
  const playerId = socket.id;
  const disconnectTime = Date.now();
  
  console.log(`🔄 [${playerId}] disconnected from room ${roomId}, starting reconnection window...`);
  
  // Store disconnected player info
  disconnectedPlayers.set(playerId, {
    socketId: playerId,
    roomId: roomId,
    disconnectTime: disconnectTime,
    reconnectionWindow: RECONNECTION_WINDOW,
    bufferedEvents: []
  });
  
  // Check if both players in the room are now disconnected
  if (areBothPlayersDisconnected(roomId)) {
    console.log(`🏁 Both players disconnected from room ${roomId}, ending match immediately`);
    endMatchForBothDisconnected(roomId);
    return;
  }
  
  // Notify other players in the room
  socket.to(roomId).emit('player:disconnected', {
    playerId: playerId,
    reconnectionWindow: RECONNECTION_WINDOW
  });
  
  // Set timeout to permanently remove player if they don't reconnect
  const timeout = setTimeout(() => {
    const player = disconnectedPlayers.get(playerId);
    if (player) {
      console.log(`⏰ [${playerId}] reconnection window expired, permanently removing from room ${roomId}`);
      permanentlyRemovePlayer(playerId, roomId);
    }
  }, RECONNECTION_WINDOW);
  
  // Store the timeout so we can clear it if needed
  reconnectionTimeouts.set(playerId, timeout);
}

export function handlePlayerReconnect(socket: Socket, roomId: string): boolean {
  const playerId = socket.id;
  const disconnectedPlayer = disconnectedPlayers.get(playerId);
  
  if (!disconnectedPlayer || disconnectedPlayer.roomId !== roomId) {
    console.log(`❌ [${playerId}] attempted to reconnect but not found in disconnected players`);
    return false;
  }
  
  console.log(`✅ [${playerId}] successfully reconnected to room ${roomId}`);
  
  // Clear the reconnection timeout
  clearReconnectionTimeouts(playerId);
  
  // Remove from disconnected players
  disconnectedPlayers.delete(playerId);
  
  // Send buffered events to the reconnected player
  if (disconnectedPlayer.bufferedEvents.length > 0) {
    console.log(`📦 Sending ${disconnectedPlayer.bufferedEvents.length} buffered events to [${playerId}]`);
    disconnectedPlayer.bufferedEvents.forEach(event => {
      socket.emit(event.event, event.data);
    });
  }
  
  // Notify other players in the room
  socket.to(roomId).emit('player:reconnected', {
    playerId: playerId
  });
  
  return true;
}

export function bufferEventForDisconnectedPlayer(playerId: string, event: string, data: any) {
  const disconnectedPlayer = disconnectedPlayers.get(playerId);
  if (disconnectedPlayer) {
    disconnectedPlayer.bufferedEvents.push({
      event: event,
      data: data,
      timestamp: Date.now()
    });
    
    console.log(`📦 Buffered event '${event}' for disconnected player [${playerId}]`);
  }
}

export function isPlayerDisconnected(playerId: string): boolean {
  return disconnectedPlayers.has(playerId);
}

export function getDisconnectedPlayer(playerId: string): DisconnectedPlayer | undefined {
  return disconnectedPlayers.get(playerId);
}

export function clearReconnectionTimeouts(playerId: string): void {
  const timeout = reconnectionTimeouts.get(playerId);
  if (timeout) {
    clearTimeout(timeout);
    reconnectionTimeouts.delete(playerId);
    console.log(`⏰ Cleared reconnection timeout for [${playerId}]`);
  }
}

function areBothPlayersDisconnected(roomId: string): boolean {
  const { getRoom } = require('./roomService');
  const room = getRoom(roomId);
  
  if (!room) return false;
  
  // Get all players in the room
  const roomPlayers = Array.from(room.players.keys()) as string[];
  
  // Check if all players in the room are disconnected
  return roomPlayers.every(playerId => isPlayerDisconnected(playerId));
}

function endMatchForBothDisconnected(roomId: string): void {
  const { getRoom } = require('./roomService');
  const { handleBothPlayersDisconnected } = require('./matchEndService');
  const room = getRoom(roomId);
  
  if (!room) return;
  
  // Clear all reconnection timeouts for players in this room
  room.players.forEach((socket: Socket, playerId: string) => {
    clearReconnectionTimeouts(playerId);
  });
  
  // Get io instance from any socket in the room
  const io = room.players.values().next().value?.server;
  
  if (io) {
    // End match due to both players disconnecting
    handleBothPlayersDisconnected(io, roomId);
  } else {
    // Fallback: manually clean up the room
    console.log(`🏚️ Manually cleaning up room ${roomId} due to both players disconnecting`);
    const { removeRoom } = require('./roomService');
    removeRoom(roomId);
  }
}

function permanentlyRemovePlayer(playerId: string, roomId: string, io?: any) {
  // Remove from disconnected players
  disconnectedPlayers.delete(playerId);
  
  // Get the room and handle permanent removal
  const { getRoom } = require('./roomService');
  const { handleOpponentDisconnected } = require('./matchEndService');
  const room = getRoom(roomId);
  
  if (room && io) {
    // End the match due to opponent disconnection
    handleOpponentDisconnected(io, roomId, playerId);
  } else if (room) {
    // Fallback: manually remove player and notify others
    room.removePlayer(playerId);
    
    // If room is empty, remove it
    if (room.players.size === 0) {
      const { removeRoom } = require('./roomService');
      removeRoom(roomId);
      console.log(`🏚️ Room ${roomId} is empty, removing it`);
    } else {
      // Notify remaining players
      room.broadcastToAll('player:permanently_disconnected', {
        playerId: playerId
      });
      console.log(`👋 [${playerId}] permanently removed from room ${roomId}`);
    }
  }
}

// Cleanup function to remove old disconnected players
export function cleanupDisconnectedPlayers() {
  const now = Date.now();
  const toRemove: string[] = [];
  
  disconnectedPlayers.forEach((player, playerId) => {
    if (now - player.disconnectTime > player.reconnectionWindow) {
      toRemove.push(playerId);
    }
  });
  
  toRemove.forEach(playerId => {
    const player = disconnectedPlayers.get(playerId);
    if (player) {
      console.log(`🧹 Cleaning up expired disconnected player [${playerId}]`);
      permanentlyRemovePlayer(playerId, player.roomId);
    }
  });
}

// Start cleanup interval
setInterval(cleanupDisconnectedPlayers, BUFFER_CLEANUP_INTERVAL);

// Debug function
export function getDisconnectedPlayersStatus() {
  const status = [];
  for (const [playerId, player] of disconnectedPlayers.entries()) {
    status.push({
      playerId: playerId,
      roomId: player.roomId,
      disconnectTime: player.disconnectTime,
      timeUntilExpiry: player.reconnectionWindow - (Date.now() - player.disconnectTime),
      bufferedEventsCount: player.bufferedEvents.length
    });
  }
  return status;
} 