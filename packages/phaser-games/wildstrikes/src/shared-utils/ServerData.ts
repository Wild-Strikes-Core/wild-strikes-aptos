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
    health: number;
    damagePercentage: number;
    lives: number;
  }
  isAlive?: boolean;
  sequenceNumber?: number;
  timestamp?: number;
}


export interface AttackData {
  playerId: string;
  attackType: 'light' | 'heavy';
  facing: 'left' | 'right';
  damage: number;
  knockback: {
      force: number; 
      angle: number; 
  };
  position: {
      x: number;
      y: number;
  };
  timestamp: number; 
}