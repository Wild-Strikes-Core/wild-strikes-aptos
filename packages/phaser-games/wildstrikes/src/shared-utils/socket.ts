import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL
    || (process.env.NEXT_PUBLIC_SOCKET_HOST
        ? `http://${process.env.NEXT_PUBLIC_SOCKET_HOST}:${process.env.NEXT_PUBLIC_SOCKET_PORT || '3001'}`
        : `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3001`);

export const socket = io(SOCKET_URL, {
    autoConnect: true,
});
