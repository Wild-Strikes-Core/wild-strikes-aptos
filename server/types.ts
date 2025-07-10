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
}

export interface Match {
  player1: PlayerState;
  player2: PlayerState;
  roomId: string;
  timer: NodeJS.Timeout | null;
  remainingTime: number;
  selectedMap: {
    name: string;
    backgroundKey: string;
    musicKey: string;
  };
}
