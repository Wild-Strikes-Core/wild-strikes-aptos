// player starting lives
// max damage percentage to KO
// respawn delay
// damage per attack type
// base knockback
// cooldown per type
// server hit detection range and vertical tolerance

// camera defaults
// ui thresholds
// physics defaults

/**
 * export type AttackType = 'light' | 'heavy';

export const GameConfig = {
  player: {
    startingLives: 3,
    maxDamagePercent: 100,
    respawnDelayMs: 2000,
  },

  attacks: {
    light: {
      damage: 10,
      knockback: { baseForce: 5, angleDeg: 0 }, // 180 when facing left at runtime
      cooldownMs: 300,
      detection: { rangePx: 105, verticalTolerancePx: 70 },
      visuals: { width: 80, height: 60, durationMs: 200, offsetX: 75, offsetY: -10 },
    },
    heavy: {
      damage: 20,
      knockback: { baseForce: 40, angleDeg: 0 }, // 180 when facing left at runtime
      cooldownMs: 500,
      detection: { rangePx: 150, verticalTolerancePx: 50 },
      visuals: { width: 150, height: 80, durationMs: 400, offsetX: 40, offsetY: -20 },
    },
  } as Record<AttackType, {
    damage: number;
    knockback: { baseForce: number; angleDeg: number };
    cooldownMs: number;
    detection: { rangePx: number; verticalTolerancePx: number };
    visuals: { width: number; height: number; durationMs: number; offsetX: number; offsetY: number };
  }>,

  knockback: {
    forceToVelocity: 24,
    minUpwardDeg: 20,
    scaleByDamagePercent: (p: number) => 1 + p / 100,
  },

  net: {
    clientMoveSendRateMs: 16,
    serverBroadcastIntervalMs: 50,
    attackPositionTolerance: {
      basePx: 50,
      extraPerMs: 0.3,
      maxExtraPx: 100,
    },
    clientAuthoritativeMode: true,
  },

  camera: {
    defaultZoom: 1.8,
    deadzone: { x: 130, y: 130 },
    followOffset: { x: 10, y: 160 },
    worldPaddingPx: 800,
    shake: { durationMs: 150, intensity: 0.01 },
  },

  physics: {
    gravityY: 8000,
    body: { size: { w: 30, h: 40 }, offset: { x: 45, y: 40 } },
    bounce: 0.1,
    dragX: 200,
    targetDisplayHeight: 240,
  },

  ui: {
    damageColorThresholds: { greenBelow: 50, yellowBelow: 100 },
    statsOffsetY: -110,
  },
} as const;

export type GameConfigType = typeof GameConfig;
 */