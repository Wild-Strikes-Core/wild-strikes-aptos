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