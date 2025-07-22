// src/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

import { setupSocketHandlers } from './sockets';
import { registerMiddlewares } from './config/middleware';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: { 
    origin: ['http://localhost:3002', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'], // Allow both polling and websocket
  allowEIO3: true // Allow Engine.IO v3 clients
});

// Apply express middlewares
registerMiddlewares(app);

// Serve a simple test page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Matchmaking Test</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
            .connected { background: #d4edda; color: #155724; }
            .queued { background: #fff3cd; color: #856404; }
            .matched { background: #d1ecf1; color: #0c5460; }
            .room { background: #f8d7da; color: #721c24; }
            .error { background: #f8d7da; color: #721c24; }
        </style>
    </head>
    <body>
        <h1>🎮 Matchmaking Test</h1>
        <div id="status" class="status">Connecting...</div>
        <div id="queue-status" class="status" style="display:none;">In queue...</div>
        <div id="match-status" class="status" style="display:none;">Match found!</div>
        <div id="room-status" class="status" style="display:none;">In room...</div>

        <div id="debug" style="margin-top: 20px; font-family: monospace; font-size: 12px;"></div>
        
        <script src="/socket.io/socket.io.js"></script>
        <script>
            const statusDiv = document.getElementById('status');
            const queueDiv = document.getElementById('queue-status');
            const matchDiv = document.getElementById('match-status');
            const roomDiv = document.getElementById('room-status');
            const debugDiv = document.getElementById('debug');
            
            function log(message) {
                console.log(message);
                debugDiv.innerHTML += new Date().toLocaleTimeString() + ': ' + message + '<br>';
            }
            
            let socket; // Declare socket globally
            
            try {
                log('Initializing socket connection...');
                socket = io('http://localhost:3001', {
                    transports: ['websocket', 'polling']
                });
                
                socket.on('connect', () => {
                    log('✅ Connected! Socket ID: ' + socket.id);
                    statusDiv.textContent = 'Connected! Socket ID: ' + socket.id;
                    statusDiv.className = 'status connected';
                    
                    // Automatically join matchmaking queue
                    setTimeout(() => {
                        log('🎯 Joining matchmaking queue...');
                        socket.emit('matchmaking:find');
                        queueDiv.style.display = 'block';
                        queueDiv.textContent = 'Joined matchmaking queue...';
                        queueDiv.className = 'status queued';
                    }, 1000);
                });
                
                socket.on('matchmaking:found', (data) => {
                    log('🎉 Match found! Room: ' + data.roomId);
                    queueDiv.style.display = 'none';
                    matchDiv.style.display = 'block';
                    matchDiv.textContent = 'Match found! Room: ' + data.roomId + ' | Opponent: ' + data.opponentId;
                    matchDiv.className = 'status matched';
                });
                
                            socket.on('match:start', (data) => {
                log('🎮 Game started in room: ' + data.roomId);
                roomDiv.style.display = 'block';
                roomDiv.textContent = 'Game started in room: ' + data.roomId;
                roomDiv.className = 'status room';
            });
            
            socket.on('player:disconnected', (data) => {
                if (!matchEnded) { // Only show if match hasn't ended
                    log('🔄 Opponent disconnected. Reconnection window: ' + (data.reconnectionWindow / 1000) + 's');
                    roomDiv.textContent = 'Opponent disconnected. Waiting for reconnection...';
                    roomDiv.className = 'status error';
                } else {
                    log('🔄 Ignoring disconnect event - match already ended');
                }
            });
            
            socket.on('player:reconnected', (data) => {
                if (!matchEnded) { // Only show if match hasn't ended
                    log('✅ Opponent reconnected!');
                    roomDiv.textContent = 'Opponent reconnected! Game resumed.';
                    roomDiv.className = 'status connected';
                } else {
                    log('✅ Ignoring reconnect event - match already ended');
                }
            });
            
            socket.on('player:permanently_disconnected', (data) => {
                if (!matchEnded) { // Only show if match hasn't ended
                    log('👋 Opponent permanently disconnected');
                    roomDiv.textContent = 'Opponent left the game.';
                    roomDiv.className = 'status error';
                } else {
                    log('👋 Ignoring permanent disconnect event - match already ended');
                }
            });
            
            let matchEnded = false; // Flag to prevent conflicting UI updates
            
            socket.on('match:ended', (data) => {
                matchEnded = true; // Set flag to prevent other UI updates
                log('🏁 Match ended: ' + data.message);
                roomDiv.textContent = 'Match ended: ' + data.message;
                roomDiv.className = 'status matched';
                
                // Disconnect after showing the result
                setTimeout(() => {
                    log('🔄 Disconnecting after match end...');
                    socket.disconnect();
                }, 3000);
            });
            
            socket.on('disconnect', () => {
                log('❌ Disconnected');
                statusDiv.textContent = 'Disconnected';
                statusDiv.className = 'status';
            });
                
                socket.on('connect_error', (error) => {
                    log('❌ Connection error: ' + error.message);
                    statusDiv.textContent = 'Connection error: ' + error.message;
                    statusDiv.className = 'status error';
                });
                
            } catch (error) {
                log('❌ Error initializing socket: ' + error.message);
                statusDiv.textContent = 'Error: ' + error.message;
                statusDiv.className = 'status error';
            }
            

        </script>
    </body>
    </html>
  `);
});

// Debug endpoint to check server status
app.get('/debug', (req, res) => {
  const { getQueueStatus } = require('./services/matchmakingService');
  const { getAllRoomsStatus } = require('./services/roomService');
  const { getDisconnectedPlayersStatus } = require('./services/reconnectionService');
  const { getMatchEndStats } = require('./services/matchEndService');
  
  const queueStatus = getQueueStatus();
  const roomsStatus = getAllRoomsStatus();
  const disconnectedPlayersStatus = getDisconnectedPlayersStatus();
  const matchEndStats = getMatchEndStats();
  
  res.json({
    timestamp: new Date().toISOString(),
    queue: queueStatus,
    rooms: roomsStatus,
    disconnectedPlayers: disconnectedPlayersStatus,
    matchEndStats: matchEndStats,
    totalConnections: io.engine.clientsCount
  });
});

// Initialize all socket listeners
setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Open multiple browser tabs to test matchmaking!`);
});
