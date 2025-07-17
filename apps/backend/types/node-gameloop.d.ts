declare module 'node-gameloop' {
  export function setGameLoop(callback: (delta: number) => void, fps?: number): number;
  export function clearGameLoop(loopId: number): void;
} 