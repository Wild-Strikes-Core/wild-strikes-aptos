# Wild Strikes Aptos Server

## Description
WebSocket server for the Wild Strikes Aptos game, handling real-time multiplayer matches.

## Features
- Real-time player matching
- Match timer system
- Player health and attack system
- Multiple map support
- Graceful shutdown handling

## Deployment

### Environment Variables
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)

### Scripts
- `npm run dev`: Start development server with nodemon
- `npm run start`: Start production server
- `npm run build`: Build TypeScript to JavaScript
- `npm run start:prod`: Start production server from built files

### Health Check
The server provides a health check endpoint at `/health` that returns:
- Server status
- Active matches count
- Waiting users count
- Current timestamp

### Deployment Notes
The server is configured to bind to `0.0.0.0` to accept external connections, making it suitable for deployment on platforms like Render, Heroku, or similar.

## Development
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Server will be available at `http://localhost:3000`

## Production
1. Build the project: `npm run build`
2. Start production server: `npm run start:prod`
