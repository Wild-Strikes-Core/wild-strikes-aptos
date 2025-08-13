/**
 * Represents the state of a player in a battle.
 * Used for both client-side prediction and server-side authoritative updates.
 */
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
  | 'attackingLight' | 'attackingHeavy' | 'hit' | 'dead';
  playerStats: {
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