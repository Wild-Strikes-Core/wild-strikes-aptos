/// <reference path="./types/node-gameloop.d.ts" />
// Copied from legacy server; handles matchmaking, real-time state and game loop

import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';
import * as gameLoop from 'node-gameloop';
import { MATCHES, PLAYER_MATCH } from '@shared/constants/states';
import { Match } from '@shared/types/types';

// ------------------ Configuration ------------------ //
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const HOST = process.env.HOST || '0.0.0.0';
const MATCH_DURATION = process.env.MATCH_DURATION ? parseInt(process.env.MATCH_DURATION) : 120; // seconds
const UPDATE_THROTTLE = process.env.UPDATE_THROTTLE ? parseInt(process.env.UPDATE_THROTTLE) : 50; // ms
const MAX_PLAYERS_PER_MATCH = process.env.MAX_PLAYERS_PER_MATCH ? parseInt(process.env.MAX_PLAYERS_PER_MATCH) : 2;

// ------------------ Server & Socket.IO setup ------------------ //
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// ------------------ Matchmaking state ------------------ //
let matchCount = 0;
let waitingUsers: string[] = [];
let matchmakingLock = false;

// Utility: format seconds to MM:SS
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

// Utility: extract numeric matchId from roomId string "match_#"
function getMatchIdFromRoomId(roomId: string): number | null {
  const parts = roomId.split('_');
  if (parts.length !== 2) return null;
  return Number(parts[1]);
}

function broadcastMatchState(match: Match) {
  const gameState = {
    player1: { ...match.player1 },
    player2: { ...match.player2 },
    roomId: match.roomId,
  };
  io.to(match.roomId).emit('gameStateUpdate', gameState);
}

function startMatchGameLoop(match: Match) {
  const loopId = gameLoop.setGameLoop(() => {
    match.remainingTime -= 1;
    io.to(match.roomId).emit('timerUpdate', {
      remainingTime: match.remainingTime,
      formattedTime: formatTime(match.remainingTime),
    });

    if (match.remainingTime <= 0) {
      const p1hp = match.player1.health ?? 100;
      const p2hp = match.player2.health ?? 100;
      const winner = p1hp > p2hp ? match.player1.id : p1hp < p2hp ? match.player2.id : null;
      const loser = winner === match.player1.id ? match.player2.id : winner === match.player2.id ? match.player1.id : null;

      io.to(match.roomId).emit('matchEnded', {
        reason: 'timeout',
        winner,
        loser,
        finalHealth: { player1: p1hp, player2: p2hp },
      });

      const mId = getMatchIdFromRoomId(match.roomId);
      if (mId !== null) {
        PLAYER_MATCH.delete(match.player1.id);
        PLAYER_MATCH.delete(match.player2.id);
        delete MATCHES[mId];
      }
      gameLoop.clearGameLoop(loopId);
    }
  }, 1000); // every second
}

function createMatch(player1Id: string, player2Id: string): Match | null {
  const s1 = io.sockets.sockets.get(player1Id);
  const s2 = io.sockets.sockets.get(player2Id);
  if (!s1 || !s2) return null;

  const matchId = matchCount++;
  const roomId = `match_${matchId}`;
  s1.join(roomId);
  s2.join(roomId);

  // Choose a random map
  const availableMaps = [
    { name: 'forest', backgroundKey: 'newMap', musicKey: 'in-match' },
    { name: 'Philippines', backgroundKey: 'Philippines', musicKey: 'PH-BG' },
    { name: 'Japan', backgroundKey: 'Japan', musicKey: 'JPN-BG' },
    { name: 'France', backgroundKey: 'France', musicKey: 'FRN-BG' },
  ];
  const selectedMap = availableMaps[Math.floor(Math.random() * availableMaps.length)];

  const match: Match = {
    roomId,
    remainingTime: MATCH_DURATION,
    selectedMap,
    player1: {
      id: player1Id,
      connected: false,
      x: 100,
      y: 300,
      health: 100,
      flipX: false,
      velocityX: 0,
      velocityY: 0,
    },
    player2: {
      id: player2Id,
      connected: false,
      x: 700,
      y: 300,
      health: 100,
      flipX: true,
      velocityX: 0,
      velocityY: 0,
    },
  };

  MATCHES[matchId] = match;
  PLAYER_MATCH.set(player1Id, matchId);
  PLAYER_MATCH.set(player2Id, matchId);

  startMatchGameLoop(match);

  io.to(roomId).emit('matchFound', {
    room: roomId,
    players: {
      player1: { id: player1Id, name: `Player ${player1Id.slice(0,4)}`, position: 'left' },
      player2: { id: player2Id, name: `Player ${player2Id.slice(0,4)}`, position: 'right' },
    },
    matchDuration: MATCH_DURATION,
    formattedTime: formatTime(MATCH_DURATION),
    selectedMap,
  });

  // no immediate broadcast; state will be sent on next throttle tick
  s1.emit('yourPlayerId', player1Id);
  s2.emit('yourPlayerId', player2Id);
  return match;
}

async function processMatchmakingQueue() {
  if (matchmakingLock) return;
  matchmakingLock = true;
  try {
    while (waitingUsers.length >= MAX_PLAYERS_PER_MATCH) {
      const p1 = waitingUsers.shift();
      const p2 = waitingUsers.shift();
      if (p1 && p2) {
        if (!createMatch(p1, p2)) {
          waitingUsers.unshift(p2);
          waitingUsers.unshift(p1);
          break;
        }
      }
    }
  } finally {
    matchmakingLock = false;
  }
}

// ------------------ Global broadcast loop ------------------ //
setInterval(() => {
  // Iterate through active matches and emit authoritative state at most every UPDATE_THROTTLE ms.
  Object.values(MATCHES).forEach(match => {
    const gameState = {
      player1: {
        id: match.player1.id,
        x: match.player1.x,
        y: match.player1.y,
        velocityX: match.player1.velocityX,
        velocityY: match.player1.velocityY,
        flipX: match.player1.flipX,
        anim: match.player1.animation,
        health: match.player1.health,
        lastProcessedTick: match.player1.lastProcessedTick,
      },
      player2: {
        id: match.player2.id,
        x: match.player2.x,
        y: match.player2.y,
        velocityX: match.player2.velocityX,
        velocityY: match.player2.velocityY,
        flipX: match.player2.flipX,
        anim: match.player2.animation,
        health: match.player2.health,
        lastProcessedTick: match.player2.lastProcessedTick,
      },
      roomId: match.roomId,
    };
    io.to(match.roomId).emit('gameStateUpdate', gameState);
  });
}, UPDATE_THROTTLE);

// ------------------ Socket event handlers ------------------ //
io.on('connection', socket => {
  console.log('Player connected', socket.id);

  socket.on('findMatch', () => {
    if (!waitingUsers.includes(socket.id)) waitingUsers.push(socket.id);
    processMatchmakingQueue();
  });

  socket.on('playerReady', data => {
    const matchId = PLAYER_MATCH.get(socket.id);
    if (matchId === undefined) return;
    const match = MATCHES[matchId];
    if (!match) return;

    // Mark players as connected and take provided spawn positions if any
    if (data.player1) {
      match.player1.connected = true;
      match.player1.x = data.player1.x ?? match.player1.x;
      match.player1.y = data.player1.y ?? match.player1.y;
    }
    if (data.player2) {
      match.player2.connected = true;
      match.player2.x = data.player2.x ?? match.player2.x;
      match.player2.y = data.player2.y ?? match.player2.y;
    }

    // When both ready, broadcast
    if (match.player1.connected && match.player2.connected) {
      const gameState = {
        room: match.roomId,
        selectedMap: match.selectedMap,
        player1: {
          id: match.player1.id,
          position: 'left',
          x: match.player1.x,
          y: match.player1.y,
          flipX: match.player1.flipX,
          health: match.player1.health,
          velocityX: 0,
          velocityY: 0,
        },
        player2: {
          id: match.player2.id,
          position: 'right',
          x: match.player2.x,
          y: match.player2.y,
          flipX: match.player2.flipX,
          health: match.player2.health,
          velocityX: 0,
          velocityY: 0,
        },
      };

      io.to(match.roomId).emit('playersConnected', gameState);
      io.to(match.roomId).emit('gameStateUpdate', gameState);
    }
  });

  // Legacy 'playerMoved' pathway removed – clients now send compact input packets.

  socket.on('playerAttack', data => {
    const matchId = PLAYER_MATCH.get(socket.id);
    if (matchId === undefined) return;
    const match = MATCHES[matchId];
    if (!match) return;

    const { x, y, attackWidth, attackHeight, flipX } = data;
    const attackX = flipX ? x - attackWidth : x;
    const attackY = y;

    io.to(match.roomId).emit('playerAttacked', { id: socket.id, x: attackX, y: attackY, attackWidth, attackHeight, flipX });

    const opponent = match.player1.id === socket.id ? match.player2 : match.player1;
    const SPRITE_W = 30;
    const SPRITE_H = 40;

    if (
      attackX < (opponent.x ?? 0) + SPRITE_W &&
      attackX + attackWidth > (opponent.x ?? 0) &&
      attackY < (opponent.y ?? 0) + SPRITE_H &&
      attackY + attackHeight > (opponent.y ?? 0)
    ) {
      opponent.health = (opponent.health ?? 100) - 10;
      io.to(match.roomId).emit('playerHit', { id: opponent.id, health: opponent.health, attackerId: socket.id });
      if (opponent.health <= 0) {
        io.to(match.roomId).emit('matchEnded', {
          reason: 'knockout',
          winner: socket.id,
          loser: opponent.id,
          finalHealth: { player1: match.player1.health, player2: match.player2.health },
        });
        const mid = getMatchIdFromRoomId(match.roomId);
        if (mid !== null) {
          PLAYER_MATCH.delete(match.player1.id);
          PLAYER_MATCH.delete(match.player2.id);
          delete MATCHES[mid];
        }
      }
    }
  });

  // NEW: handle compact input packets
  socket.on('playerInput', data => {
    const matchId = PLAYER_MATCH.get(socket.id);
    if (matchId === undefined) return;
    const match = MATCHES[matchId];
    if (!match) return;

    const player = match.player1.id === socket.id ? match.player1 : match.player2;

    // Basic integration – compute horizontal velocity from input
    const speed = data.run ? 400 : 200;
    const delta = UPDATE_THROTTLE / 1000; // seconds per tick

    // Update velocityX so it can be relayed back to clients for accurate animations
    player.velocityX = data.dirX * speed;

    // Integrate position using the computed velocity
    player.x = (player.x ?? 0) + player.velocityX * delta;

    // Simple ground check (y>300 considered ground)
    const currentY = player.y ?? 300;
    if (data.jump && currentY >= 300) {
      player.velocityY = -600; // jump impulse
    }

    // Apply gravity
    player.velocityY = (player.velocityY ?? 0) + 1200 * delta;
    player.y = (player.y ?? 300) + player.velocityY * delta;
    if ((player.y ?? 300) > 300) {
      player.y = 300;
      player.velocityY = 0;
    }

    player.flipX = data.dirX < 0 ? true : data.dirX > 0 ? false : player.flipX;

    // Set animation based on state
    if (data.attack) {
      player.animation = '_Attack2';
    } else if (player.velocityY && player.velocityY < 0) {
      player.animation = '_Jump';
    } else if (data.dirX !== 0) {
      player.animation = '_Run';
    } else {
      player.animation = '_Idle_Idle';
    }

    player.lastProcessedTick = data.seq; // Track latest input processed for reconciliation

  });

  socket.on('disconnect', () => {
    console.log('Player disconnected', socket.id);
    waitingUsers = waitingUsers.filter(id => id !== socket.id);
    const matchId = PLAYER_MATCH.get(socket.id);
    if (matchId !== undefined) {
      const match = MATCHES[matchId];
      if (match) {
        io.to(match.roomId).emit('playerDisconnected', { id: socket.id });
        delete MATCHES[matchId];
      }
      PLAYER_MATCH.delete(socket.id);
    }
  });
});

// ------------------ Express endpoints ------------------ //
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

httpServer.listen(PORT, HOST, () => console.log(`Socket.IO server on ${HOST}:${PORT}`));

// Export for integration tests
export { httpServer, io };
