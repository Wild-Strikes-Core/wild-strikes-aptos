import * as Phaser from 'phaser';
import { EntityFactory } from "../entities/core/EntityFactory";
import { PlayerEntity } from "../entities/playerEntity";
import { AssetLoader } from "../../../../../AssetLoader";
import { BattleNetworkManager } from "../systems/network/BattleNetworkManager";
import { BattleConfig } from "../config/BattleConfig";
import { HitboxComponent } from "../entities/components/HitboxComponent";
import { PlayerOverlayManager } from "../systems/ui/PlayerOverlayManager";

import { TiledMapRenderer } from '../../utils/TiledMapRenderer';


/**
 * ArenaScene
 *
 * Server-authoritative PvP arena scene that:
 * - Loads the selected map (Tiled JSON) and its images via `TiledMapRenderer`
 * - Spawns local and remote `PlayerEntity` instances and sets up physics/camera
 * - Wires up networking through `BattleNetworkManager` to apply server contexts
 * - Tracks player stats (damage, lives) and handles death/respawn transitions
 * - Controls map-specific background music and ensures it stops on shutdown
 */
export class ArenaScene extends Phaser.Scene {
  // Local player entity controlled on this client
  private localPlayer?: PlayerEntity;
  // Opponent player entity driven by server contexts
  private opponentPlayer?: PlayerEntity;
  // Static platforms created from Tiled collision layers
  private platformGroup?: Phaser.Physics.Arcade.StaticGroup;
  // Socket/network orchestrator for battle events
  private networkManager: BattleNetworkManager;
  // Immutable battle parameters passed from the previous scene
  private battleConfig: BattleConfig;
  // Cache of latest known server stats keyed by socketId for HUD/logic
  private lastKnownStats: Record<string, { damagePercentage: number; lives: number }> = {};
  // HUD/overlay manager (currently optional/disabled)
  private overlayManager?: PlayerOverlayManager;
  // Currently playing BGM key to ensure proper cleanup on shutdown
  private currentBgmKey?: string;

  constructor() {
    super({ key: 'Arena' });
  }

  /**
   * Initialize scene from payload produced by matchmaking. Converts arbitrary
   * payload into a strongly-typed `BattleConfig` and initializes the
   * `BattleNetworkManager` with room and player identifiers.
   */
  init(data?: {
    mapConfig?: any;
    yourData?: string[];
    opponentData?: string[];
    opponentId?: string;
    yourId?: string;
    p1SpawnPosition?: { x: number; y: number };
    p2SpawnPosition?: { x: number; y: number };
    roomId?: string;
  }) {
    // Map incoming payload into BattleConfig
    this.battleConfig = {
      mapConfig: data?.mapConfig,
      localPlayerData: data?.yourData || [],
      opponentData: data?.opponentData || [],
      localPlayerId: data?.yourId || '',
      opponentId: data?.opponentId || '',
      localSpawnPosition: data?.p1SpawnPosition || { x: 600, y: 200 },
      opponentSpawnPosition: data?.p2SpawnPosition || { x: 1200, y: 200 },
      roomId: data?.roomId || ''
    };

    this.networkManager = new BattleNetworkManager({
      localPlayerId: this.battleConfig.localPlayerId,
      opponentId: this.battleConfig.opponentId,
      roomId: this.battleConfig.roomId
    });
  }

  /**
   * Preloads common gameplay assets, the active tilemap JSON, and (if provided)
   * the map's background music. Audio is guarded by cache existence to avoid
   * duplicate loads across multiple matches.
   */
  preload() {
    const loader = new AssetLoader(this.load);
    loader.loadGroup('gameplay');
    loader.loadGroup('gameplay-audio');
    loader.loadGroup('chars');
    const cfg = this.battleConfig?.mapConfig;
    this.load.tilemapTiledJSON(cfg.mapKey, cfg.mapLocation);

    // Preload map-specific background music if provided and not already loaded
    const bgm = cfg?.mapBackgroundMusic as string | undefined;
    if (bgm) {
      const bgmKey = this.deriveAudioKey(bgm);
      if (!this.cache.audio.exists(bgmKey)) {
        this.load.audio(bgmKey, bgm);
      }
    }
  }

  /**
   * Builds the map using `TiledMapRenderer`, spawns players, sets up physics
   * and camera, attaches network listeners, and starts any map-specific BGM.
   * Image layers referenced by the tilemap are loaded on-the-fly if needed.
   */
  create() {
    const cfg = this.battleConfig?.mapConfig;
    const activeMapKey = cfg?.mapKey;
    const map = this.make.tilemap({ key: activeMapKey });
    const tileset = this.textures.exists('world_tileset')
      ? map.addTilesetImage('world_tileset', 'world_tileset')
      : null;
    const rawMapData = this.cache.tilemap.get(activeMapKey);
  
    // Derive base images folder from mapLocation (e.g., /arena-maps/PH/map.json -> /arena-maps/PH)
    const baseImagePath = cfg.mapLocation.substring(0, cfg.mapLocation.lastIndexOf('/'));
    const renderer = new TiledMapRenderer(this, { baseImagePath });
    const imagesToLoad = renderer.collectImages(rawMapData.data.layers);
  
    const finalize = () => {
      this.platformGroup = renderer.buildMap(map, tileset, rawMapData);
      renderer.setWorldAndCameraBounds(map, { padding: 800, zoom: 1.6 });
      this.setupPlayers();
    };
  
    if (imagesToLoad.length > 0) {
      imagesToLoad.forEach((img) => this.load.image(img.key, img.path));
      this.load.once('complete', finalize);
      this.load.start();
    } else {
      finalize();
    }
  
    this.setupNetworkListeners();

    // Stop matchmaking music if still playing
    try { this.sound.stopByKey('waiting-music'); } catch {}
    // Play map-specific BGM if available
    const bgm = cfg?.mapBackgroundMusic;
    if (bgm) {
      const bgmKey = this.deriveAudioKey(bgm);
      if (this.cache.audio.exists(bgmKey)) {
        this.sound.play(bgmKey, { loop: true, volume: 0.6 });
        this.currentBgmKey = bgmKey;
      }
    }


    this.events.once("shutdown", this.onShutdown, this);
  }

  /**
   * Per-frame update loop delegated to entities and overlays.
   */
  update() {
    this.localPlayer?.update();
    this.opponentPlayer?.update();
    this.overlayManager?.update();
  }

  /**
   * Ensures scene-owned resources are cleaned up:
   * - Stops any map-specific BGM
   * - Destroys network listeners
   */
  private onShutdown(): void {
    if (this.currentBgmKey) {
      this.sound.stopByKey(this.currentBgmKey);
    }
    this.currentBgmKey = undefined;
    this.networkManager.destroy();
  }

  /**
   * Creates local and remote `PlayerEntity` instances, sets render depth above
   * background, hooks up physics collisions and configures the camera to follow
   * the local player. Also primes hitbox opponent references.
   */
  private setupPlayers() {
    if (!this.platformGroup) return;

    const safeY = (y: number) => y; // Let physics handle falling; no clamping

    this.localPlayer = EntityFactory.createPlayer(
      this.battleConfig.localPlayerId || 'local-1',
      this,
      this.battleConfig.localSpawnPosition.x,
      safeY(this.battleConfig.localSpawnPosition.y),
      {
        inputEnabled: true,
        singlePlayerMode: false,
        playerId: this.battleConfig.localPlayerId,
        roomId: this.battleConfig.roomId,
        followCamera: false,
      }
    );
    // Ensure local player renders above background layers
    this.localPlayer.sprite.setDepth(9999);

    this.opponentPlayer = EntityFactory.createPlayer(
      this.battleConfig.opponentId || 'remote-1',
      this,
      this.battleConfig.opponentSpawnPosition.x,
      safeY(this.battleConfig.opponentSpawnPosition.y),
      {
        inputEnabled: false,
        singlePlayerMode: false,
        followCamera: false,
      }
    );
    // Ensure opponent also renders above background layers
    this.opponentPlayer.sprite.setDepth(9999);

    // Physics collisions with platforms
    if (this.localPlayer?.sprite) this.physics.add.collider(this.localPlayer.sprite, this.platformGroup);
    if (this.opponentPlayer?.sprite) this.physics.add.collider(this.opponentPlayer.sprite, this.platformGroup);

    // Camera follow
    const sprite = this.localPlayer?.sprite;
    if (sprite) {
      this.cameras.main.startFollow(sprite);
      // Slightly above the player center
      this.cameras.main.setFollowOffset(10, 160);
      this.cameras.main.setDeadzone(130, 130);
    }

    // Hitbox collisions
    this.setupPlayerHitboxCollisions();

    // Initialize overlays
    // if (this.localPlayer?.sprite && this.opponentPlayer?.sprite) {
    //   this.overlayManager = new PlayerOverlayManager({
    //     scene: this,
    //     localPlayerId: this.battleConfig.localPlayerId,
    //     opponentPlayerId: this.battleConfig.opponentId,
    //     localSprite: this.localPlayer.sprite,
    //     opponentSprite: this.opponentPlayer.sprite,
    //   });

    //   // Seed overlays with any known stats
    //   const localStats = this.lastKnownStats[this.battleConfig.localPlayerId] || { damagePercentage: 0, lives: 3 };
    //   const oppStats = this.lastKnownStats[this.battleConfig.opponentId] || { damagePercentage: 0, lives: 3 };
    //   this.overlayManager.updateStatsForPlayer(this.battleConfig.localPlayerId, {
    //     damagePercentage: localStats.damagePercentage,
    //     lives: localStats.lives,
    //   });
    //   this.overlayManager.updateStatsForPlayer(this.battleConfig.opponentId, {
    //     damagePercentage: oppStats.damagePercentage,
    //     lives: oppStats.lives,
    //   });
    // }
  }

  /**
   * Provides mutual references to each player's hitbox component so that
   * hit-detection can query the opponent sprite during collision checks.
   */
  private setupPlayerHitboxCollisions(): void {
    const localSprite = this.localPlayer?.sprite;
    const opponentSprite = this.opponentPlayer?.sprite;
    if (localSprite && opponentSprite) {
      const localHitbox = this.localPlayer?.getComponent<HitboxComponent>('hitbox');
      const oppHitbox = this.opponentPlayer?.getComponent<HitboxComponent>('hitbox');
      if (localHitbox) localHitbox.setOpponent(opponentSprite);
      if (oppHitbox) oppHitbox.setOpponent(localSprite);
    }
  }

  /**
   * Subscribes to server events and translates them into local game actions.
   * - Start: seed stats cache
   * - Player contexts: apply transform/animation to opponent; update stats
   * - Attack: transition defender to 'hit' and update life/damage bookkeeping
   * - Battle end: transition to Victory/Defeat scenes after a small delay
   */
  private setupNetworkListeners(): void {
    // Battle start: seed lastKnownStats for both players
    this.networkManager.onBattleStart((battleData: any) => {
      try {
        const players = battleData?.players || [];
        players.forEach((p: any) => {
          if (p?.socketId && p?.playerStats) {
            this.lastKnownStats[p.socketId] = p.playerStats;
            // this.overlayManager?.updateStatsForPlayer(p.socketId, {
            //   damagePercentage: p.playerStats.damagePercentage,
            //   lives: p.playerStats.lives,
            // });
          }
        });
      } catch {}
    });

    // Apply server contexts only to remote opponent; ignore local echo
    this.networkManager.onPlayerContextsReceived((data: any) => {
      if (data.players && Array.isArray(data.players)) {
        data.players.forEach((playerContext: any) => {
          if (playerContext.socketId === this.battleConfig.opponentId) {
            this.applyServerContextToEntity(this.opponentPlayer, playerContext);
            if (playerContext.playerStats) {
              this.lastKnownStats[playerContext.socketId] = playerContext.playerStats;
              // Keep opponent's stats current for any HUD needs
              const net = this.opponentPlayer?.getComponent<any>('network');
              try { net?.setStats(playerContext.playerStats); } catch {}
              // this.overlayManager?.updateStatsForPlayer(playerContext.socketId, {
              //   damagePercentage: playerContext.playerStats.damagePercentage,
              //   lives: playerContext.playerStats.lives,
              //   position: playerContext.position ? { x: playerContext.position.x, y: playerContext.position.y } : undefined,
              //   velocity: { x: playerContext.velocityX || 0, y: playerContext.velocityY || 0 },
              //   animation: playerContext.state,
              // });
            }
            if (playerContext.isAlive === false) {
              // Opponent dead this tick; pass remaining lives from server context
              const remainingLives = playerContext.playerStats?.lives ?? 0;
              this.handlePlayerDeath(playerContext.socketId, remainingLives);
            }
          } else if (playerContext.socketId === this.battleConfig.localPlayerId) {
            // Update local overlay stats from server context (do not override local transform)
            if (playerContext.playerStats) {
              this.lastKnownStats[playerContext.socketId] = playerContext.playerStats;
              // this.overlayManager?.updateStatsForPlayer(playerContext.socketId, {
              //   damagePercentage: playerContext.playerStats.damagePercentage,
              //   lives: playerContext.playerStats.lives,
              //   position: playerContext.position ? { x: playerContext.position.x, y: playerContext.position.y } : undefined,
              //   velocity: { x: playerContext.velocityX || 0, y: playerContext.velocityY || 0 },
              //   animation: playerContext.state,
              // });
            }
          }
        });
      }
    });

    this.networkManager.onAttackHit((attackData: any) => {
      // this.renderServerAttackHitbox(attackData, true);
      this.handleAttackHitClient(attackData);

      // Track lives/damage for death detection
      const defenderId = attackData?.defenderId;
      const newStats = attackData?.newDefenderStats;
      if (defenderId && newStats) {
        const prev = this.lastKnownStats[defenderId];
        this.lastKnownStats[defenderId] = { damagePercentage: newStats.damagePercentage, lives: newStats.lives };
        const lifeLost = prev ? newStats.lives < prev.lives : false;
        const knockedOut = lifeLost || (newStats.damagePercentage === 0 && (prev && prev.damagePercentage > 0));
        if (lifeLost || knockedOut) {
          this.handlePlayerDeath(defenderId, newStats.lives);
        } else {
          // If damage crossed threshold (e.g. 90 -> 110) but lives not decremented yet, pre-play death anim
          const prevDamage = prev?.damagePercentage ?? 0;
          const crossedThreshold = prevDamage < 100 && newStats.damagePercentage >= 100;
          if (crossedThreshold) {
            const entity = defenderId === this.battleConfig.localPlayerId ? this.localPlayer : this.opponentPlayer;
            const stateComp = entity?.getComponent<any>('state');
            try { stateComp?.transitionTo('dead'); } catch {}
          }
        }

        // Update local player's stats for outbound messages
        const entity = defenderId === this.battleConfig.localPlayerId ? this.localPlayer : this.opponentPlayer;
        const net = entity?.getComponent<any>('network');
        try { net?.setStats({ damagePercentage: newStats.damagePercentage, lives: newStats.lives }); } catch {}

        // Update overlays for defender
        // this.overlayManager?.updateStatsForPlayer(defenderId, {
        //   damagePercentage: newStats.damagePercentage,
        //   lives: newStats.lives,
        //   knockback: attackData?.knockback,
        // });
        if (typeof attackData?.damage === 'number') {
          this.overlayManager?.showDamage(defenderId, attackData.damage);
        }
      }
    });

    // this.networkManager.onAttackMissed((attackData: any) => {
    //   this.renderServerAttackHitbox(attackData, false);
    // });

    // Match end → transition to victory/defeat
    this.networkManager.onBattleEnd((endData: any) => {
      const winnerId = endData?.winnerId;
      const isLocalWinner = winnerId === this.battleConfig.localPlayerId;
      // Small delay to let any last animation finish
      this.time.delayedCall(600, () => {
        try {
            if (isLocalWinner) {
            this.scene.stop('Arena');
            this.scene.start('Victory');
          } else {
            this.scene.stop('Arena');
            this.scene.start('Defeat');
          }
        } catch {}
      });
    });
  }

  // private renderServerAttackHitbox(attackData: any, isHit: boolean): void {
  //   const attackerEntity = attackData.attackerId === this.battleConfig.localPlayerId
  //     ? this.localPlayer
  //     : this.opponentPlayer;
  //   const hitbox = attackerEntity?.getComponent<HitboxComponent>('hitbox');
  //   if (hitbox) {
  //     hitbox.renderServerAttack({
  //       attackType: attackData.attackType,
  //       position: attackData.attackerPosition,
  //       isHit,
  //       timestamp: attackData.timestamp,
  //     });
  //   }
  // }

  /**
   * Applies a server-authoritative context snapshot to a `PlayerEntity`:
   * - Sets transform and velocity
   * - Resolves facing and plays/sets animation state (with "hit/dead" guards)
   * - Forces dead state if server reports `isAlive === false`
   */
  private applyServerContextToEntity(entity: PlayerEntity | undefined, ctx: any): void {
    if (!entity || !entity.sprite) return;
    entity.sprite.setPosition(ctx.position?.x || 0, ctx.position?.y || 0);
    const facing = ctx.position?.facing || 'right';
    entity.sprite.setFlipX(facing === 'left');
    const body = entity.sprite.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) body.setVelocity(ctx.velocityX || 0, ctx.velocityY || 0);

    const spriteComp = entity.getComponent<any>('sprite');
    const stateComp = entity.getComponent<any>('state');
    if (spriteComp && ctx.state) {
      // Allow server 'dead' to override local 'hit', but keep blocking other overrides while hit
      const currentStateKey = typeof stateComp?.getStateKey === 'function' ? stateComp.getStateKey() : undefined;
      const nextIsDead = ctx.state === 'dead';
      const blockOverride = (currentStateKey === 'hit' && !nextIsDead) || currentStateKey === 'dead';
      if (!blockOverride) {
        try { spriteComp.play(this.mapStateToAnimationKey(ctx.state)); } catch {}
        try { spriteComp.setState(ctx.state); } catch {}
      }
    }

    // If server says entity is not alive (no lives), force dead state
    if (ctx.isAlive === false) {
      try { stateComp?.transitionTo('dead'); } catch {}
    }
  }

  /**
   * Maps a logical player state to a sprite animation key.
   */
  private mapStateToAnimationKey(state: string | undefined): string {
    switch (state) {
      case 'idle': return 'player_idle';
      case 'sprinting': return 'player_run';
      case 'jumping': return 'player_jump';
      case 'dashing': return 'player_dash';
      case 'crouching': return 'player_crouch_idle';
      case 'crouchWalking': return 'player_crouch_walk';
      case 'attackingLight': return 'player_attack_light';
      case 'attackingHeavy': return 'player_attack_heavy';
      case 'falling': return 'player_fall';
      case 'hit': return 'player_hit';
      case 'dead': return 'player_death_static';
      default: return 'player_idle';
    }
  }

  /**
   * Client-side reaction to a confirmed server hit. Transitions defender to
   * the 'hit' state; knockback is applied via server contexts on subsequent
   * frames.
   */
  private handleAttackHitClient(attackData: any): void {
    const defenderId = attackData?.defenderId;
    const entity = 
      defenderId === this.battleConfig.localPlayerId ? this.localPlayer :
      defenderId === this.battleConfig.opponentId ? this.opponentPlayer : undefined;
    const stateComp = entity?.getComponent<any>('state');
    try { stateComp?.transitionTo('hit'); } catch {}

    if (!entity || !entity.sprite) return;
    const body = entity.sprite.body as Phaser.Physics.Arcade.Body | undefined;
    if (!body) return;

    let vx: number | undefined = attackData?.knockbackVector?.vx;
    let vy: number | undefined = attackData?.knockbackVector?.vy;

    if (typeof vx !== 'number' || typeof vy !== 'number') {
      const percentBefore = this.lastKnownStats[defenderId]?.damagePercentage ?? 0;
      const baseForce = attackData?.knockback?.force ?? 0;
      let angleDeg = attackData?.knockback?.angle ?? 0;
      const FORCE_TO_VELOCITY = 24;
      const MIN_UPWARD_DEG = 20;
      const scale = 1 + (percentBefore / 100);
      const force = baseForce * scale * FORCE_TO_VELOCITY;
      let rad = Phaser.Math.DEG_TO_RAD * angleDeg;
      const minSin = Math.sin(Phaser.Math.DEG_TO_RAD * MIN_UPWARD_DEG);
      if (Math.abs(Math.sin(rad)) < minSin) {
        const facingRight = Math.cos(rad) >= 0;
        rad = Phaser.Math.DEG_TO_RAD * (facingRight ? MIN_UPWARD_DEG : (180 - MIN_UPWARD_DEG));
      }
      vx = Math.cos(rad) * force;
      vy = -Math.sin(rad) * force;
    }

    if (defenderId === this.battleConfig.localPlayerId) {
      try {
        const input = entity.getComponent<any>('input');
        const keys = input?.getKeys?.();
        const di = (keys?.left?.isDown ? -1 : 0) + (keys?.right?.isDown ? 1 : 0);
        if (di !== 0) {
          const mag = Math.hypot(vx!, vy!);
          const a = Math.atan2(vy!, vx!);
          const diRad = Phaser.Math.DEG_TO_RAD * Phaser.Math.Clamp(di * 12, -18, 18);
          const a2 = a + diRad;
          vx = Math.cos(a2) * mag;
          vy = Math.sin(a2) * mag;
        }
      } catch {}
    }

    body.setVelocity(vx!, vy!);
  }

  /**
   * Handles a life loss or knockout for the specified player. Transitions to
   * 'dead', disables local input, halts movement, and either respawns after a
   * delay (if lives remain) or leaves a tinted corpse.
   */
  private handlePlayerDeath(playerId: string, remainingLives: number): void {
    const isLocal = playerId === this.battleConfig.localPlayerId;
    const entity = isLocal ? this.localPlayer : this.opponentPlayer;
    if (!entity) return;

    const stateComp = entity.getComponent<any>('state');
    try { stateComp?.transitionTo('dead'); } catch {}

    // Disable input for local player during death
    const inputComp = entity.getComponent<any>('input');
    try { if (isLocal) inputComp?.setEnabled(false); } catch {}

    // Stop movement
    const body = entity.sprite.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) { body.setVelocity(0, 0); }

    const respawnDelay = 2000;
    this.time.delayedCall(respawnDelay, () => {
      if (remainingLives > 0) {
        this.respawnPlayer(playerId);
      } else {
        // Permanently dead: optionally hide or keep corpse
        try { entity.sprite.setTint(0x555555); } catch {}
      }
    });
  }

  /**
   * Restores a player to their spawn point, resets velocity/tint, re-enables
   * input for the local player, and transitions back to 'idle'.
   */
  private respawnPlayer(playerId: string): void {
    const isLocal = playerId === this.battleConfig.localPlayerId;
    const entity = isLocal ? this.localPlayer : this.opponentPlayer;
    if (!entity) return;

    const spawn = isLocal ? this.battleConfig.localSpawnPosition : this.battleConfig.opponentSpawnPosition;
    entity.sprite.setPosition(spawn.x, spawn.y);
    const body = entity.sprite.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) { body.setVelocity(0, 0); }

    // Clear tints and re-enable input for local
    try { entity.sprite.clearTint(); } catch {}
    const inputComp = entity.getComponent<any>('input');
    try { if (isLocal) inputComp?.setEnabled(true); } catch {}

    // Back to idle
    const stateComp = entity.getComponent<any>('state');
    try { stateComp?.transitionTo('idle'); } catch {}
  }

  // // Helpers
  /**
   * Derives a stable audio key from either a raw key or a full path. If a
   * path is provided, uses the filename (without extension) as the key.
   */
  private deriveAudioKey(pathOrKey: string): string {
    if (!pathOrKey) return 'map-bgm';
    if (!pathOrKey.includes('/')) return pathOrKey; // assume already a key
    const last = pathOrKey.substring(pathOrKey.lastIndexOf('/') + 1);
    const dot = last.lastIndexOf('.');
    return dot > 0 ? last.substring(0, dot) : last;
  }
}
export default ArenaScene;


