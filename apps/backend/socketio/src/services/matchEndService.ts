// src/services/matchEndService.ts
import { Server } from 'socket.io';
import { getRoom, removeRoom } from './roomService';
import { getDisconnectedPlayer } from './reconnectionService';

export enum MatchEndReason {
  PLAYER_WIN = 'player_win',
  OPPONENT_DISCONNECTED = 'opponent_disconnected',
  PLAYER_LEFT = 'player_left',
  TIMEOUT = 'timeout',
  DRAW = 'draw'
}

interface MatchEndData {
  roomId: string;
  reason: MatchEndReason;
  winnerId?: string;
  loserId?: string;
  message: string;
}

export function endMatch(io: Server, roomId: string, reason: MatchEndReason, winnerId?: string, loserId?: string) {
  const room = getRoom(roomId);
  if (!room) {
    console.log(`❌ Attempted to end match for non-existent room: ${roomId}`);
    return;
  }

  console.log(`🏁 Ending match in room ${roomId} - Reason: ${reason}`);
  
  // Create match end data
  const matchEndData: MatchEndData = {
    roomId: roomId,
    reason: reason,
    winnerId: winnerId,
    loserId: loserId,
    message: getMatchEndMessage(reason, winnerId, loserId)
  };

  // Notify all players in the room about match end FIRST
  room.broadcastToAll('match:ended', matchEndData);
  
  // Clear any pending reconnection timeouts for players in this room
  const { clearReconnectionTimeouts } = require('./reconnectionService');
  room.players.forEach((socket, playerId) => {
    clearReconnectionTimeouts(playerId);
  });
  
  // Force disconnect all players from the room
  room.players.forEach((socket, playerId) => {
    console.log(`👋 Disconnecting player [${playerId}] from ended match`);
    socket.leave(roomId);
    socket.disconnect(true); // Force disconnect
  });

  // Immediately remove the room
  removeRoom(roomId);
  console.log(`🗑️ Room ${roomId} immediately removed after match end`);
  
  // Log match statistics
  logMatchEnd(matchEndData);
}

export function handlePlayerWin(io: Server, roomId: string, winnerId: string, loserId: string) {
  console.log(`🏆 Player [${winnerId}] won against [${loserId}] in room ${roomId}`);
  endMatch(io, roomId, MatchEndReason.PLAYER_WIN, winnerId, loserId);
}

export function handleOpponentDisconnected(io: Server, roomId: string, disconnectedPlayerId: string) {
  const room = getRoom(roomId);
  if (!room) return;

  // Find the remaining player
  const remainingPlayer = Array.from(room.players.keys()).find(id => id !== disconnectedPlayerId);
  if (remainingPlayer) {
    console.log(`🏆 Player [${remainingPlayer}] wins by opponent disconnect [${disconnectedPlayerId}] in room ${roomId}`);
    endMatch(io, roomId, MatchEndReason.OPPONENT_DISCONNECTED, remainingPlayer, disconnectedPlayerId);
  }
}

export function handlePlayerLeft(io: Server, roomId: string, leavingPlayerId: string) {
  const room = getRoom(roomId);
  if (!room) return;

  // Find the remaining player
  const remainingPlayer = Array.from(room.players.keys()).find(id => id !== leavingPlayerId);
  if (remainingPlayer) {
    console.log(`🏆 Player [${remainingPlayer}] wins by opponent leaving [${leavingPlayerId}] in room ${roomId}`);
    endMatch(io, roomId, MatchEndReason.PLAYER_LEFT, remainingPlayer, leavingPlayerId);
  }
}

export function handleMatchTimeout(io: Server, roomId: string) {
  console.log(`⏰ Match timeout in room ${roomId}`);
  endMatch(io, roomId, MatchEndReason.TIMEOUT);
}

export function handleBothPlayersDisconnected(io: Server, roomId: string) {
  console.log(`🏁 Both players disconnected from room ${roomId}`);
  endMatch(io, roomId, MatchEndReason.TIMEOUT, undefined, undefined);
}

export function handleMatchDraw(io: Server, roomId: string) {
  console.log(`🤝 Match draw in room ${roomId}`);
  endMatch(io, roomId, MatchEndReason.DRAW);
}

function getMatchEndMessage(reason: MatchEndReason, winnerId?: string, loserId?: string): string {
  switch (reason) {
    case MatchEndReason.PLAYER_WIN:
      return `Player ${winnerId} defeated ${loserId}!`;
    case MatchEndReason.OPPONENT_DISCONNECTED:
      return `Player ${winnerId} wins by opponent disconnect!`;
    case MatchEndReason.PLAYER_LEFT:
      return `Player ${winnerId} wins by opponent leaving!`;
    case MatchEndReason.TIMEOUT:
      return 'Match ended due to timeout!';
    case MatchEndReason.DRAW:
      return 'Match ended in a draw!';
    default:
      return 'Match ended!';
  }
}

function logMatchEnd(matchEndData: MatchEndData) {
  const timestamp = new Date().toISOString();
  console.log(`📊 Match End Log - ${timestamp}`);
  console.log(`   Room: ${matchEndData.roomId}`);
  console.log(`   Reason: ${matchEndData.reason}`);
  console.log(`   Winner: ${matchEndData.winnerId || 'N/A'}`);
  console.log(`   Loser: ${matchEndData.loserId || 'N/A'}`);
  console.log(`   Message: ${matchEndData.message}`);
  console.log(`   ---`);
}

// Debug function to get match end statistics
export function getMatchEndStats() {
  // This could be expanded to track match statistics over time
  return {
    totalMatchesEnded: 0, // Could be tracked in a database
    lastMatchEnd: null,
    commonEndReasons: {}
  };
} 