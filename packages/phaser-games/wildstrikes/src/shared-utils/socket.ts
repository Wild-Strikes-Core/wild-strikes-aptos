import { io } from "socket.io-client";

// Debug: Log all available environment variables
console.log('  All process.env keys:', Object.keys(process.env));
console.log('  All NEXT_PUBLIC vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')));
console.log('  process.env.NEXT_PUBLIC_SOCKET_HOST:', process.env.NEXT_PUBLIC_SOCKET_HOST);
console.log('  process.env.NEXT_PUBLIC_SOCKET_PORT:', process.env.NEXT_PUBLIC_SOCKET_PORT);

// Use NEXT_PUBLIC_ prefix for browser access with fallbacks
const SOCKET_HOST = process.env.NEXT_PUBLIC_SOCKET_HOST || '192.168.100.6';
const SOCKET_PORT = process.env.NEXT_PUBLIC_SOCKET_PORT || '3001';

console.log('  Current working directory:', process.cwd ? process.cwd() : 'N/A (browser)');
console.log('  Socket host:', SOCKET_HOST);
console.log('  Socket port:', SOCKET_PORT);
console.log(`http://${SOCKET_HOST}:${SOCKET_PORT}`);

export const socket = io(`http://${SOCKET_HOST}:${SOCKET_PORT}`, {
    autoConnect: true,
});
