import { createServer } from "http";
import { Server } from "socket.io";
import { MATCHES, PLAYER_MATCH } from "./states";
import { Match } from "./types";

// Constants for configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const MATCH_DURATION = 120; // 2 minutes in seconds
const UPDATE_THROTTLE = 50; // milliseconds between position updates
const MAX_PLAYERS_PER_MATCH = 2;

// Create HTTP server and Socket.IO instance
const server = createServer();

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Type definitions for better safety
interface PlayerState {
  id: string;
  x: number;
  y: number;
  animation?: string;
  flipX?: boolean;
  velocityX?: number;
  velocityY?: number;
  isAttacking?: boolean;
  isDodging?: boolean; // Add the dodge state flag
  animState?: {
    idle?: boolean;
    running?: boolean;
    jumping?: boolean;
    falling?: boolean;
    attacking?: boolean;
    crouching?: boolean;
    isMoving?: boolean;
    onGround?: boolean;
    doubleJumping?: boolean;
    isDodging?: boolean; // Also add to animState for consistency
  };
  lastUpdate?: number; // Timestamp of last update
}

// Maps to store match data and waiting users
let matchCount = 0;
let waitingUsers: string[] = [];

// Map of player IDs to their match IDs for quick lookups

// Track last update timestamp per player to throttle updates
const lastPlayerUpdate: Map<string, number> = new Map();

/**
 * Start match timer that counts down and broadcasts time updates
 */
function startMatchTimer(match: Match): void {
  const updateTimer = () => {
    match.remainingTime--;
    
    // Broadcast timer update to all players in the match
    io.to(match.roomId).emit("timerUpdate", {
      remainingTime: match.remainingTime,
      formattedTime: formatTime(match.remainingTime),
    });
    
    console.log(`Match ${match.roomId} - Time remaining: ${formatTime(match.remainingTime)}`);
    
    // Check if match should end
    if (match.remainingTime <= 0) {
      // End match due to timeout - determine winner based on health
      let winner: string | null = null;
      let loser: string | null = null;
      
      const player1Health = match.player1.health ?? 100;
      const player2Health = match.player2.health ?? 100;
      
      console.log(`Match ${match.roomId} ended - Player 1 health: ${player1Health}, Player 2 health: ${player2Health}`);
      
      if (player1Health > player2Health) {
        winner = match.player1.id;
        loser = match.player2.id;
      } else if (player2Health > player1Health) {
        winner = match.player2.id;
        loser = match.player1.id;
      } else {
        // It's a tie - no winner/loser
        winner = null;
        loser = null;
      }
      
      // End match due to timeout
      io.to(match.roomId).emit("matchEnded", {
        reason: "timeout",
        winner: winner,
        loser: loser,
        finalHealth: {
          player1: player1Health,
          player2: player2Health,
        }
      });
      
      console.log(`Match ${match.roomId} ended - Winner: ${winner}, Loser: ${loser}`);
      
      // Clean up match
      const matchId = getMatchIdFromRoomId(match.roomId);
      if (matchId !== null) {
        PLAYER_MATCH.delete(match.player1.id);
        PLAYER_MATCH.delete(match.player2.id);
        delete MATCHES[matchId];
      }
      
      if (match.timer) {
        clearInterval(match.timer);
      }
    }
  };
  
  // Start the timer (update every second)
  match.timer = setInterval(updateTimer, 1000);
}

/**
 * Format time in MM:SS format
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Extract match ID from room ID string
 */
function getMatchIdFromRoomId(roomId: string): number | null {
  if (!roomId) return null;
  const parts = roomId.split("_");
  if (parts.length !== 2 || parts[0] !== "match") return null;
  return Number(parts[1]);
}

/**
 * Send current match state to players
 */
function broadcastMatchState(match: Match): void {
  const gameState = {
    player1: {
      id: match.player1.id,
      x: match.player1.x,
      y: match.player1.y,
      velocityX: match.player1.velocityX,
      velocityY: match.player1.velocityY,
      flipX: match.player1.flipX,
      animation: match.player1.animation,
      animState: match.player1.animState,
      health: match.player1.health,
    },
    player2: {
      id: match.player2.id,
      x: match.player2.x,
      y: match.player2.y,
      velocityX: match.player2.velocityX,
      velocityY: match.player2.velocityY,
      flipX: match.player2.flipX,
      animation: match.player2.animation,
      animState: match.player2.animState,
      health: match.player2.health,
    },
    roomId: match.roomId,
  };

  // Broadcast to all players in the match
  io.to(match.roomId).emit("gameStateUpdate", gameState);
}

/**
 * Create a new match between two players
 */
function createMatch(player1Id: string, player2Id: string): Match | null {
  const player1Socket = io.sockets.sockets.get(player1Id);
  const player2Socket = io.sockets.sockets.get(player2Id);

  if (!player1Socket || !player2Socket) {
    return null;
  }

  const matchId = matchCount++;
  const roomId = `match_${matchId}`;

  // Define available maps
  const availableMaps = [
    {
      name: "forest",
      backgroundKey: "newMap",
      musicKey: "in-match"
    },
    {
      name: "Philippines",
      backgroundKey: "Philippines", 
      musicKey: "PH-BG"
    },
    {
      name: "Japan",
      backgroundKey: "Japan",
      musicKey: "JPN-BG"
    },
    {
      name: "France",
      backgroundKey: "France",
      musicKey: "FRN-BG"
    }
  ];

  // Randomly select a map for this match
  const selectedMap = availableMaps[Math.floor(Math.random() * availableMaps.length)];
  console.log(`Match ${matchId}: Selected map "${selectedMap.name}" for players ${player1Id} and ${player2Id}`);

  // Create match data with initial positions
  const match: Match = {
    player1: {
      id: player1Id,
      connected: false,
      x: 100, // Default starting position for player 1
      y: 300,
      health: 100,
      flipX: false,
      velocityX: 0,
      velocityY: 0,
    },
    player2: {
      id: player2Id,
      connected: false,
      x: 700, // Default starting position for player 2
      y: 300,
      health: 100,
      flipX: true,
      velocityX: 0,
      velocityY: 0,
    },
    roomId,
    timer: null,
    remainingTime: MATCH_DURATION,
    selectedMap: selectedMap,
  };

  // Store the match
  MATCHES[matchId] = match;
  console.log(`Stored match ${matchId} in MATCHES`);
  console.log(`MATCHES object after storage:`, Object.keys(MATCHES));
  console.log(`Can retrieve match ${matchId}:`, MATCHES[matchId] !== undefined);

  // Add players to the match room
  player1Socket.join(roomId);
  player2Socket.join(roomId);

  // Set up quick lookup from player ID to match ID
  PLAYER_MATCH.set(player1Id, matchId);
  PLAYER_MATCH.set(player2Id, matchId);
  
  console.log(`Setting up PLAYER_MATCH: ${player1Id} -> ${matchId}, ${player2Id} -> ${matchId}`);
  console.log(`Current PLAYER_MATCH size: ${PLAYER_MATCH.size}`);
  console.log(`PLAYER_MATCH contents:`, Array.from(PLAYER_MATCH.entries()));

  // Start match timer
  startMatchTimer(match);

  // Generate more friendly player names
  const player1Name = `Player ${player1Id.substring(0, 4)}`;
  const player2Name = `Player ${player2Id.substring(0, 4)}`;

  // Notify players with enhanced player information
  io.to(roomId).emit("matchFound", {
    room: roomId,
    players: {
      player1: {
        id: player1Id,
        name: player1Name,
        position: "left",
        x: match.player1.x,
        y: match.player1.y,
        health: match.player1.health,
        flipX: match.player1.flipX,
      },
      player2: {
        id: player2Id,
        name: player2Name,
        position: "right",
        x: match.player2.x,
        y: match.player2.y,
        health: match.player2.health,
        flipX: match.player2.flipX,
      },
    },
    matchDuration: MATCH_DURATION,
    formattedTime: formatTime(MATCH_DURATION),
  });

  console.log(
    `Match #${matchId} started between ${player1Name} (${player1Id}) and ${player2Name} (${player2Id})`
  );

  // Send initial game state immediately
  const initialGameState = {
    player1: {
      id: match.player1.id,
      x: match.player1.x,
      y: match.player1.y,
      velocityX: match.player1.velocityX,
      velocityY: match.player1.velocityY,
      flipX: match.player1.flipX,
      health: match.player1.health,
    },
    player2: {
      id: match.player2.id,
      x: match.player2.x,
      y: match.player2.y,
      velocityX: match.player2.velocityX,
      velocityY: match.player2.velocityY,
      flipX: match.player2.flipX,
      health: match.player2.health,
    },
  };

  io.to(roomId).emit("gameStateUpdate", initialGameState);

  // Also send individualized messages to each player with their socket ID identified
  player1Socket.emit("yourPlayerId", player1Id);
  player2Socket.emit("yourPlayerId", player2Id);

  return match;
}

// Socket event handlers
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Add generic event listener for debugging
  socket.onAny((event, ...args) => {
    console.log(`Event '${event}' received from ${socket.id}:`, args);
  });

  socket.on("playerMoved", (data) => {
    const matchId = PLAYER_MATCH.get(socket.id);

    if (matchId === undefined) {
      console.log(`No match found for player ${socket.id} in playerMoved`);
      return;
    }

    const match = MATCHES[matchId];

    if (!match) {
      console.log(`Match ${matchId} not found in playerMoved`);
      return;
    }

    const currentPlayerId = socket.id;
    console.log(`Player ${currentPlayerId} moved:`, { x: data.x, y: data.y, velocityX: data.velocityX, velocityY: data.velocityY });

    // Update player state based on which player moved
    if (match.player1.id === currentPlayerId) {
      match.player1.connected = true;
      match.player1.x = data.x;
      match.player1.y = data.y;
      match.player1.velocityX = data.velocityX;
      match.player1.velocityY = data.velocityY;
      match.player1.flipX = data.flipX;
      
      // Only update animation if it's provided (to reduce unnecessary updates)
      if (data.animation !== undefined) {
        match.player1.animation = data.animation;
      }
      
      match.player1.animState = data.animState;
    } else if (match.player2.id === currentPlayerId) {
      match.player2.connected = true;
      match.player2.x = data.x;
      match.player2.y = data.y;
      match.player2.velocityX = data.velocityX;
      match.player2.velocityY = data.velocityY;
      match.player2.flipX = data.flipX;
      
      // Only update animation if it's provided (to reduce unnecessary updates)
      if (data.animation !== undefined) {
        match.player2.animation = data.animation;
      }
      
      match.player2.animState = data.animState;
    }

    // Broadcast the complete game state to both players
    const gameState = {
      player1: {
        id: match.player1.id,
        x: match.player1.x,
        y: match.player1.y,
        velocityX: match.player1.velocityX,
        velocityY: match.player1.velocityY,
        flipX: match.player1.flipX,
        animation: match.player1.animation,
        animState: match.player1.animState,
        health: match.player1.health,
      },
      player2: {
        id: match.player2.id,
        x: match.player2.x,
        y: match.player2.y,
        velocityX: match.player2.velocityX,
        velocityY: match.player2.velocityY,
        flipX: match.player2.flipX,
        animation: match.player2.animation,
        animState: match.player2.animState,
        health: match.player2.health,
      },
    };

    // Broadcast to all players in the room
    console.log(`Broadcasting gameStateUpdate to room ${match.roomId}`);
    io.to(match.roomId).emit("gameStateUpdate", gameState);
  });

  socket.on("playerAttacked", (data) => {
    console.log(`Player ${socket.id} attacked with data:`, data);
    
    const matchId = PLAYER_MATCH.get(socket.id);

    if (matchId === undefined) {
      console.log(`No match found for player ${socket.id} in playerAttacked`);
      return;
    }

    const match = MATCHES[matchId];

    if (!match) {
      console.log(`Match ${matchId} not found in playerAttacked`);
      return;
    }

    const { x, y, attackWidth, attackHeight, flipX } = data;
    const currentPlayerId = socket.id;

    const SPRITE_WIDTH = 30;  // Updated to match actual player body size (before scaling)
    const SPRITE_HEIGHT = 40; // Updated to match actual player body size (before scaling)
    
    // Calculate attack position based on facing direction
    // When flipX is true (facing left), attack extends to the left
    // When flipX is false (facing right), attack extends to the right
    const attackX = flipX ? x - attackWidth : x;
    const attackY = y;

    // First, broadcast the attack animation to all players
    console.log(`Broadcasting attack animation to room ${match.roomId}`);
    io.to(match.roomId).emit("playerAttacked", {
      id: currentPlayerId,
      x: attackX,  // Use calculated attack position
      y: attackY,  // Use calculated attack position
      attackWidth,
      attackHeight,
      flipX,  // Include facing direction
    });

    // Then check for hits
    if (match.player1.id === currentPlayerId) {
      // Player 1 is attacking, check if they hit player 2
      if (
        match.player2.x !== undefined &&
        match.player2.y !== undefined &&
        attackX < match.player2.x + SPRITE_WIDTH &&
        attackX + attackWidth > match.player2.x &&
        attackY < match.player2.y + SPRITE_HEIGHT &&
        attackY + attackHeight > match.player2.y
      ) {
        match.player2.health! -= 10;
        io.to(match.roomId).emit("playerHit", {
          id: match.player2.id,
          health: match.player2.health,
          attackerId: match.player1.id,
        });

        if (match.player2.health! <= 0) {
          // Clear the timer
          if (match.timer) {
            clearInterval(match.timer);
          }
          
          io.to(match.roomId).emit("matchEnded", {
            reason: "knockout",
            winner: match.player1.id,
            loser: match.player2.id,
            finalHealth: {
              player1: match.player1.health,
              player2: match.player2.health,
            }
          });
          
          // Clean up match
          const cleanupMatchId = getMatchIdFromRoomId(match.roomId);
          if (cleanupMatchId !== null) {
            PLAYER_MATCH.delete(match.player1.id);
            PLAYER_MATCH.delete(match.player2.id);
            delete MATCHES[cleanupMatchId];
          }
          return;
        }
      }
    } else if (match.player2.id === currentPlayerId) {
      // Player 2 is attacking, check if they hit player 1
      if (
        match.player1.x !== undefined &&
        match.player1.y !== undefined &&
        attackX < match.player1.x + SPRITE_WIDTH &&
        attackX + attackWidth > match.player1.x &&
        attackY < match.player1.y + SPRITE_HEIGHT &&
        attackY + attackHeight > match.player1.y
      ) {
        match.player1.health! -= 10;
        io.to(match.roomId).emit("playerHit", {
          id: match.player1.id,
          health: match.player1.health,
          attackerId: match.player2.id,
        });

        if (match.player1.health! <= 0) {
          // Clear the timer
          if (match.timer) {
            clearInterval(match.timer);
          }
          
          io.to(match.roomId).emit("matchEnded", {
            reason: "knockout",
            winner: match.player2.id,
            loser: match.player1.id,
            finalHealth: {
              player1: match.player1.health,
              player2: match.player2.health,
            }
          });
          
          // Clean up match
          const cleanupMatchId = getMatchIdFromRoomId(match.roomId);
          if (cleanupMatchId !== null) {
            PLAYER_MATCH.delete(match.player1.id);
            PLAYER_MATCH.delete(match.player2.id);
            delete MATCHES[cleanupMatchId];
          }
          return;
        }
      }
    }

    // Broadcast updated game state after attack
    broadcastMatchState(match);
  });

  socket.on("playerReady", (data) => {
    console.log(`Player ${socket.id} is ready with data:`, data);
    console.log(`Current PLAYER_MATCH size: ${PLAYER_MATCH.size}`);
    console.log(`PLAYER_MATCH contents:`, Array.from(PLAYER_MATCH.entries()));
    
    const matchId = PLAYER_MATCH.get(socket.id);
    console.log(`Looking up match for ${socket.id}: ${matchId}`);
    console.log(`MATCHES object keys:`, Object.keys(MATCHES));
    console.log(`MATCHES[${matchId}] exists:`, matchId !== undefined && MATCHES[matchId] !== undefined);

    if (matchId === undefined) {
      console.log(`No match found for player ${socket.id}`);
      return;
    }

    const match = MATCHES[matchId];
    console.log(`Match ${matchId} found:`, match !== undefined);

    if (!match) {
      console.log(`Match ${matchId} not found for player ${socket.id}`);
      return;
    }

    const currentPlayerId = socket.id;

    if (match.player1.id === currentPlayerId) {
      match.player1.connected = true;
      // The client sends data in format { player1: { x, y }, player2: { x, y } }
      // Use the player1 data for player1, or keep defaults
      if (data.player1) {
        match.player1.x = data.player1.x || match.player1.x;
        match.player1.y = data.player1.y || match.player1.y;
      }
      match.player1.health = 100;
      match.player1.flipX = false; // Player 1 faces right
      console.log(`Player 1 (${currentPlayerId}) ready at position (${match.player1.x}, ${match.player1.y})`);
    }

    if (match.player2.id === currentPlayerId) {
      match.player2.connected = true;
      // The client sends data in format { player1: { x, y }, player2: { x, y } }
      // Use the player2 data for player2, or keep defaults
      if (data.player2) {
        match.player2.x = data.player2.x || match.player2.x;
        match.player2.y = data.player2.y || match.player2.y;
      }
      match.player2.health = 100;
      match.player2.flipX = true; // Player 2 faces left
      console.log(`Player 2 (${currentPlayerId}) ready at position (${match.player2.x}, ${match.player2.y})`);
    }

    // Check if both players are ready
    if (match.player2.connected && match.player1.connected) {
      console.log(`Both players ready in match ${match.roomId}! Starting game...`);
      
      const gameState = {
        room: match.roomId,
        selectedMap: match.selectedMap,
        player1: {
          id: match.player1.id,
          position: "left",
          x: match.player1.x,
          y: match.player1.y,
          flipX: match.player1.flipX,
          health: match.player1.health,
          velocityX: 0,
          velocityY: 0,
        },
        player2: {
          id: match.player2.id,
          position: "right",
          x: match.player2.x,
          y: match.player2.y,
          flipX: match.player2.flipX,
          health: match.player2.health,
          velocityX: 0,
          velocityY: 0,
        },
      };

      io.to(match.roomId).emit("playersConnected", gameState);
      io.to(match.roomId).emit("gameStateUpdate", gameState);
      
      console.log(`Game started in match ${match.roomId}!`);
    } else {
      console.log(`Waiting for other player in match ${match.roomId}. Player1 connected: ${match.player1.connected}, Player2 connected: ${match.player2.connected}`);
    }
  });

  // Handle key input events
  socket.on("keyPressed", (data) => {
    const matchId = PLAYER_MATCH.get(socket.id);
    if (matchId !== undefined) {
      const match = MATCHES[matchId];
      if (match) {
        console.log(`Player ${socket.id} pressed key:`, data);
        // Broadcast key press to other players
        socket.to(match.roomId).emit("opponentKeyPressed", {
          playerId: socket.id,
          key: data.key,
          pressed: data.pressed,
        });
      }
    }
  });

  socket.on("keyReleased", (data) => {
    const matchId = PLAYER_MATCH.get(socket.id);
    if (matchId !== undefined) {
      const match = MATCHES[matchId];
      if (match) {
        console.log(`Player ${socket.id} released key:`, data);
        // Broadcast key release to other players
        socket.to(match.roomId).emit("opponentKeyReleased", {
          playerId: socket.id,
          key: data.key,
          pressed: data.pressed,
        });
      }
    }
  });

  // Handle player state updates
  socket.on("playerStateUpdate", (data) => {
    const matchId = PLAYER_MATCH.get(socket.id);
    if (matchId !== undefined) {
      const match = MATCHES[matchId];
      if (match) {
        console.log(`Player ${socket.id} state update:`, data);
        
        // Update the player's state in the match
        if (match.player1.id === socket.id) {
          Object.assign(match.player1, data);
        } else if (match.player2.id === socket.id) {
          Object.assign(match.player2, data);
        }
        
        // Broadcast updated state
        broadcastMatchState(match);
      }
    }
  });

  // Handle animation updates
  socket.on("animationUpdate", (data) => {
    const matchId = PLAYER_MATCH.get(socket.id);
    if (matchId !== undefined) {
      const match = MATCHES[matchId];
      if (match) {
        console.log(`Player ${socket.id} animation update:`, data);
        // Broadcast animation to other players
        socket.to(match.roomId).emit("opponentAnimationUpdate", {
          playerId: socket.id,
          animation: data.animation,
          animState: data.animState,
        });
      }
    }
  });

  socket.on("findMatch", () => {
    console.log(`Player ${socket.id} is looking for a match`);

    // Ensure player is only in waiting list once
    waitingUsers = [...new Set([...waitingUsers, socket.id])];
    console.log(`Current waiting users: ${waitingUsers.length} - [${waitingUsers.join(', ')}]`);

    // Check if we have enough players to start a match
    if (waitingUsers.length >= MAX_PLAYERS_PER_MATCH) {
      // Get the first two waiting players
      const player1 = waitingUsers.shift();
      const player2 = waitingUsers.shift();

      if (player1 && player2) {
        console.log(`Creating match between ${player1} and ${player2}`);
        const match = createMatch(player1, player2);
        if (match) {
          console.log(`Match created successfully: ${match.roomId}`);
        } else {
          console.log(`Failed to create match between ${player1} and ${player2}`);
        }
      }
    }
  });

  // Add a debug event to check match status
  socket.on("getMatchStatus", () => {
    const matchId = PLAYER_MATCH.get(socket.id);
    if (matchId !== undefined) {
      const match = MATCHES[matchId];
      socket.emit("matchStatus", {
        matchId,
        match: match ? {
          roomId: match.roomId,
          player1: { id: match.player1.id, connected: match.player1.connected, x: match.player1.x, y: match.player1.y },
          player2: { id: match.player2.id, connected: match.player2.connected, x: match.player2.x, y: match.player2.y },
          remainingTime: match.remainingTime,
        } : null,
      });
    } else {
      socket.emit("matchStatus", { matchId: null, match: null });
    }
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log(`Player ${socket.id} disconnected`);
    
    // Remove from waiting list
    waitingUsers = waitingUsers.filter((user) => user !== socket.id);
    
    // Handle match disconnection
    const matchId = PLAYER_MATCH.get(socket.id);
    if (matchId !== undefined) {
      const match = MATCHES[matchId];
      if (match) {
        // Notify the other player
        io.to(match.roomId).emit("playerDisconnected", {
          disconnectedPlayerId: socket.id,
        });
        
        // Clean up the match
        PLAYER_MATCH.delete(match.player1.id);
        PLAYER_MATCH.delete(match.player2.id);
        delete MATCHES[matchId];
        
        console.log(`Match ${matchId} ended due to player disconnection`);
      }
    }
  });
});

// Start the server
server.listen(PORT, () =>
  console.log(`Socket.IO Server running on port ${PORT}`)
);
