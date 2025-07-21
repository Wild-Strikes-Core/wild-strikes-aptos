declare module 'node-gameloop' {
  export function setGameLoop(callback: () => void, interval: number): number;
  export function clearGameLoop(loopId: number): void;
} 