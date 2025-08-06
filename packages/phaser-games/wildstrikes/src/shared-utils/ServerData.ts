

export interface PlayerContext {
  socketId: string;
  position : {
    x: number;
    y: number;
    facing: 'left' | 'right';
  }
  velocityX?: number; 
  velocityY?: number;
  animation?: string;
  isAttacking?: boolean;
  isDashing?: boolean;
  isMoving?: boolean;
  inputs: {
      left: boolean;
      right: boolean;
      jump: boolean;
      crouch: boolean;
      dash: boolean;
      lightAttack: boolean;
      heavyAttack: boolean;
  };
  state: 'idle' | 'sprinting' | 'crouching'
  | 'crouchWalking' | 'jumping' | 'dashing'
  | 'attackingLight' | 'attackingHeavy';
  playerStats: {
    health?: number;
    damagePercentage?: number;
    lives?: number;
  }
  isAlive?: boolean;
  sequenceNumber?: number;
  timestamp?: number;
}


// export interface BattleConfig {
//   mapConfig?: any;
//   localPlayerData: string[];
//   opponentData: string[];
//   localPlayerId: string;
//   opponentId: string;
//   localSpawnPosition: { x: number; y: number };
//   opponentSpawnPosition: { x: number; y: number };
//   roomId: string;
// }