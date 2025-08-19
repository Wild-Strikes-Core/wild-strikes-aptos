export type AnimConfig = { texture: string; data: string };
export type CharacterMap = Record<string, AnimConfig>;

// Default mapping that matches the current placeholder/knight packs
export const DEFAULT_MAP: CharacterMap = {
  player_idle: { texture: '_Idle', data: '_Idle_1' },
  player_run: { texture: '_Run', data: '_Run_1' },
  player_jump: { texture: '_Jump', data: '_Jump_1' },
  player_dash: { texture: '_Dash', data: '_Dash_1' },
  player_fall: { texture: '_Fall', data: '_Fall_1' },
  player_attack_light: { texture: '_Attack', data: '_Attack_1' },
  player_attack_heavy: { texture: '_Attack2', data: '_Attack_2' },
  player_crouch_idle: { texture: '_CrouchFull', data: '_CrouchFull_1' },
  player_crouch_walk: { texture: '_CrouchWalk', data: '_CrouchWalk_1' },
  player_hit: { texture: '_Hit', data: '_Hit_1' },
  player_death_static: { texture: '_DeathNoMovement', data: '_DeathNoMovement_1' },
};

// Registry of known character maps. Add new characters here.
export const CHARACTER_MAPS: Record<string, CharacterMap> = {
  default: DEFAULT_MAP,
  knight: DEFAULT_MAP,
  minotaur: {
    // Until more anims exist for minotaur, map all to idle
    player_idle: { texture: 'minotaur_Idle', data: 'minotaur_Idle_1' },
    player_run: { texture: 'minotaur_Idle', data: 'minotaur_Idle_1' },
    player_jump: { texture: 'minotaur_Idle', data: 'minotaur_Idle_1' },
    player_dash: { texture: 'minotaur_Idle', data: 'minotaur_Idle_1' },
    player_fall: { texture: 'minotaur_Idle', data: 'minotaur_Idle_1' },
    player_attack_light: { texture: 'minotaur_Idle', data: 'minotaur_Idle_1' },
    player_attack_heavy: { texture: 'minotaur_Idle', data: 'minotaur_Idle_1' },
    player_crouch_idle: { texture: 'minotaur_Idle', data: 'minotaur_Idle_1' },
    player_crouch_walk: { texture: 'minotaur_Idle', data: 'minotaur_Idle_1' },
    player_hit: { texture: 'minotaur_Hit', data: 'minotaur_Hit_1' },
    player_death_static: { texture: 'minotaur_Idle', data: 'minotaur_Idle_1' },
  }
};


