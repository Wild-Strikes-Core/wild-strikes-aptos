export interface PlayerState {
  id: string;
  health?: number;
  x?: number;
  y?: number;
  connected: boolean;
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
  lastProcessedTick?: number;
}

export interface Match {
  player1: PlayerState;
  player2: PlayerState;
  roomId: string;
  remainingTime: number;
  selectedMap: any; // Consider defining a type for map
}
