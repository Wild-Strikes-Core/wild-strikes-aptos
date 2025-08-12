import * as Phaser from 'phaser';
import { EntityFactory } from "../entities/core/EntityFactory";
import { PlayerEntity } from "../entities/playerEntity";
import { AssetLoader } from "../../../../../AssetLoader";
import { BattleNetworkManager } from "../systems/network/BattleNetworkManager";
import { BattleConfig } from "../config/BattleConfig";
import { HitboxComponent } from "../entities/components/HitboxComponent";
import { PlayerOverlayManager } from "../systems/ui/PlayerOverlayManager";

import { TiledMapRenderer } from '../../utils/TiledMapRenderer';


export class ArenaScene extends Phaser.Scene {
  private localPlayer?: PlayerEntity;
  private opponentPlayer?: PlayerEntity;
  private platformGroup?: Phaser.Physics.Arcade.StaticGroup;
  private networkManager: BattleNetworkManager;
  private battleConfig: BattleConfig;
  private lastKnownStats: Record<string, { damagePercentage: number; lives: number }> = {};
  private overlayManager?: PlayerOverlayManager;

  constructor() {
    super({ key: 'Arena' });
  }

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

  preload() {
    const loader = new AssetLoader(this.load);
    loader.loadGroup('gameplay');
    loader.loadGroup('gameplay-audio');
    loader.loadGroup('chars');
    if (this.battleConfig?.mapConfig?.tiledKey) {
      this.load.tilemapTiledJSON('test-map', this.battleConfig.mapConfig.tiledKey);
    } else {
      this.load.tilemapTiledJSON('test-map', '/arena-maps/PH/test-map.json');
    }
  }

  create() {
    const map = this.make.tilemap({ key: 'test-map' });
    const tileset = this.textures.exists('world_tileset')
      ? map.addTilesetImage('world_tileset', 'world_tileset')
      : null;
    const rawMapData = this.cache.tilemap.get('test-map');
  
    const renderer = new TiledMapRenderer(this, { baseImagePath: '/arena-maps/PH' });
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
  }

  update() {
    this.localPlayer?.update();
    this.opponentPlayer?.update();
    this.overlayManager?.update();
  }

  private processLayer(
    layer: any,
    parentDepth: number,
    map: Phaser.Tilemaps.Tilemap,
    tileset: Phaser.Tilemaps.Tileset | null,
    platformGroup: Phaser.Physics.Arcade.StaticGroup,
    groupDepthOffset: number = 0,
    parentScrollFactorX: number = 1,
    parentScrollFactorY: number = 1
  ) {
    if (layer.type === 'tilelayer' && tileset) {
      if (layer.compression && layer.compression !== 'none') return;
      const tileLayer = map.createLayer(layer.name, tileset, 0, 0)?.setDepth(parentDepth + groupDepthOffset);
      if (tileLayer) {
        const scrollFactorX = layer.parallaxx !== undefined ? layer.parallaxx : parentScrollFactorX;
        const scrollFactorY = layer.parallaxy !== undefined ? layer.parallaxy : parentScrollFactorY;
        tileLayer.setScrollFactor(scrollFactorX, scrollFactorY);
      }
    }
    else if (layer.type === 'group' && layer.layers) {
      const groupScrollFactorX = layer.parallaxx !== undefined ? layer.parallaxx : parentScrollFactorX;
      const groupScrollFactorY = layer.parallaxy !== undefined ? layer.parallaxy : parentScrollFactorY;
      layer.layers.forEach((childLayer: any, index: number) => {
        this.processLayer(
          childLayer,
          parentDepth,
          map,
          tileset,
          platformGroup,
          index * 0.1,
          groupScrollFactorX,
          groupScrollFactorY
        );
      });
    }
    else if (layer.type === 'imagelayer' && layer.image) {
      const imageKey = layer.image.replace('.png', '');

      // Repeat flags
      const isRepeatingX = layer.repeatx === true || layer.repeatx === 'true' || layer.repeatx === 1;
      const isRepeatingY = layer.repeaty === true || layer.repeaty === 'true' || layer.repeaty === 1;
      const isRepeating = isRepeatingX || isRepeatingY;

      const scrollFactorX = layer.parallaxx !== undefined ? layer.parallaxx : parentScrollFactorX;
      const scrollFactorY = layer.parallaxy !== undefined ? layer.parallaxy : parentScrollFactorY;

      let img: Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite;
      if (isRepeating) {
        const tileWidth = isRepeatingX ? map.widthInPixels * 2 : layer.imagewidth;
        const tileHeight = isRepeatingY ? map.heightInPixels * 2 : layer.imageheight;
        img = this.add.tileSprite(
          layer.offsetx || 0,
          layer.offsety || 0,
          tileWidth,
          tileHeight,
          imageKey
        ).setOrigin(0, 0);
      } else {
        // Bounds check
        const layerX = layer.offsetx || 0;
        const layerY = layer.offsety || 0;
        const layerWidth = layer.imagewidth || 0;
        const layerHeight = layer.imageheight || 0;
        const isWithinBounds = (
          layerX < map.widthInPixels &&
          layerX + layerWidth > 0 &&
          layerY < map.heightInPixels &&
          layerY + layerHeight > 0
        );
        if (!isWithinBounds) return;
        img = this.add.image(layer.offsetx || 0, layer.offsety || 0, imageKey).setOrigin(0, 0);
      }

      img.setScrollFactor(scrollFactorX, scrollFactorY);
      img.setDepth(parentDepth + groupDepthOffset);

      // Platform physics from layer properties
      if (layer.properties) {
        for (const prop of layer.properties) {
          if (prop.name === 'platform' && prop.value === true) {
            const texture = this.textures.get(imageKey);
            const imageWidth = texture.source[0].width;
            const imageHeight = texture.source[0].height;

            if (isRepeatingX) {
              const numRepeats = Math.ceil(map.widthInPixels / imageWidth) + 2;
              const startX = layer.offsetx || 0;
              for (let i = 0; i < numRepeats; i++) {
                const platformX = startX + i * imageWidth;
                const platform = platformGroup.create(platformX, (img as any).y, imageKey)
                  .setOrigin(0, 0)
                  .setDisplaySize(imageWidth, imageHeight)
                  .refreshBody();
                platform.setVisible(false);
              }
            } else {
              const platform = platformGroup.create((img as any).x, (img as any).y, imageKey)
                .setOrigin(0, 0)
                .setDisplaySize(imageWidth, imageHeight)
                .refreshBody();
              platform.setVisible(false);
            }
          }
        }
      }
    }
    else if (layer.type === 'objectgroup') {
      layer.objects.forEach((obj: any) => {
        if (obj.image) {
          const objImageKey = obj.image.replace('.png', '');
          this.add.image(obj.x, obj.y, objImageKey).setOrigin(0, 0);
        } else {
          this.add.rectangle(obj.x, obj.y, obj.width, obj.height, 0xff0000).setOrigin(0, 0);
        }
      });
    }
  }

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
    if (this.localPlayer?.sprite && this.opponentPlayer?.sprite) {
      this.overlayManager = new PlayerOverlayManager({
        scene: this,
        localPlayerId: this.battleConfig.localPlayerId,
        opponentPlayerId: this.battleConfig.opponentId,
        localSprite: this.localPlayer.sprite,
        opponentSprite: this.opponentPlayer.sprite,
      });

      // Seed overlays with any known stats
      const localStats = this.lastKnownStats[this.battleConfig.localPlayerId] || { damagePercentage: 0, lives: 3 };
      const oppStats = this.lastKnownStats[this.battleConfig.opponentId] || { damagePercentage: 0, lives: 3 };
      this.overlayManager.updateStatsForPlayer(this.battleConfig.localPlayerId, {
        damagePercentage: localStats.damagePercentage,
        lives: localStats.lives,
      });
      this.overlayManager.updateStatsForPlayer(this.battleConfig.opponentId, {
        damagePercentage: oppStats.damagePercentage,
        lives: oppStats.lives,
      });
    }
  }

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

  private setupNetworkListeners(): void {
    // Battle start: seed lastKnownStats for both players
    this.networkManager.onBattleStart((battleData: any) => {
      try {
        const players = battleData?.players || [];
        players.forEach((p: any) => {
          if (p?.socketId && p?.playerStats) {
            this.lastKnownStats[p.socketId] = p.playerStats;
            this.overlayManager?.updateStatsForPlayer(p.socketId, {
              damagePercentage: p.playerStats.damagePercentage,
              lives: p.playerStats.lives,
            });
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
              this.overlayManager?.updateStatsForPlayer(playerContext.socketId, {
                damagePercentage: playerContext.playerStats.damagePercentage,
                lives: playerContext.playerStats.lives,
                position: playerContext.position ? { x: playerContext.position.x, y: playerContext.position.y } : undefined,
                velocity: { x: playerContext.velocityX || 0, y: playerContext.velocityY || 0 },
                animation: playerContext.state,
              });
            }
            if (playerContext.isAlive === false) {
              // Opponent permanently dead
              this.handlePlayerDeath(playerContext.socketId, 0);
            }
          } else if (playerContext.socketId === this.battleConfig.localPlayerId) {
            // Update local overlay stats from server context (do not override local transform)
            if (playerContext.playerStats) {
              this.lastKnownStats[playerContext.socketId] = playerContext.playerStats;
              this.overlayManager?.updateStatsForPlayer(playerContext.socketId, {
                damagePercentage: playerContext.playerStats.damagePercentage,
                lives: playerContext.playerStats.lives,
                position: playerContext.position ? { x: playerContext.position.x, y: playerContext.position.y } : undefined,
                velocity: { x: playerContext.velocityX || 0, y: playerContext.velocityY || 0 },
                animation: playerContext.state,
              });
            }
          }
        });
      }
    });

    this.networkManager.onAttackHit((attackData: any) => {
      this.renderServerAttackHitbox(attackData, true);
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
        this.overlayManager?.updateStatsForPlayer(defenderId, {
          damagePercentage: newStats.damagePercentage,
          lives: newStats.lives,
          knockback: attackData?.knockback,
        });
        if (typeof attackData?.damage === 'number') {
          this.overlayManager?.showDamage(defenderId, attackData.damage);
        }
      }
    });

    this.networkManager.onAttackMissed((attackData: any) => {
      this.renderServerAttackHitbox(attackData, false);
    });

    // Match end → transition to victory/defeat
    this.networkManager.onBattleEnd((endData: any) => {
      const winnerId = endData?.winnerId;
      const isLocalWinner = winnerId === this.battleConfig.localPlayerId;
      // Small delay to let any last animation finish
      this.time.delayedCall(600, () => {
        try {
          if (isLocalWinner) this.scene.start('Victory');
          else this.scene.start('Defeat');
        } catch {}
      });
    });
  }

  private renderServerAttackHitbox(attackData: any, isHit: boolean): void {
    const attackerEntity = attackData.attackerId === this.battleConfig.localPlayerId
      ? this.localPlayer
      : this.opponentPlayer;
    const hitbox = attackerEntity?.getComponent<HitboxComponent>('hitbox');
    if (hitbox) {
      hitbox.renderServerAttack({
        attackType: attackData.attackType,
        position: attackData.attackerPosition,
        isHit,
        timestamp: attackData.timestamp,
      });
    }
  }

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

  private handleAttackHitClient(attackData: any): void {
    const defenderId = attackData?.defenderId;
    const entity = 
      defenderId === this.battleConfig.localPlayerId ? this.localPlayer :
      defenderId === this.battleConfig.opponentId ? this.opponentPlayer : undefined;
    const stateComp = entity?.getComponent<any>('state');
    try { stateComp?.transitionTo('hit'); } catch {}
  }

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

    const respawnDelay = 1200;
    this.time.delayedCall(respawnDelay, () => {
      if (remainingLives > 0) {
        this.respawnPlayer(playerId);
      } else {
        // Permanently dead: optionally hide or keep corpse
        try { entity.sprite.setTint(0x555555); } catch {}
      }
    });
  }

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
}
export default ArenaScene;


