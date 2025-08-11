import * as Phaser from 'phaser';
import { EntityFactory } from "../entities/experimental/core/EntityFactory";
import { PlayerEntity } from "../entities/experimental/playerEntity";
import { AssetLoader } from "../../../../../AssetLoader";
import { BattleNetworkManager } from "../systems/network/BattleNetworkManager";
import { BattleConfig, DEFAULT_CAMERA_CONFIG } from "../config/BattleConfig";
import { HitboxComponent } from "../entities/experimental/components/HitboxComponent";

export class TestMapSceneMultiplayer extends Phaser.Scene {
  private localPlayer?: PlayerEntity;
  private opponentPlayer?: PlayerEntity;
  private platformGroup?: Phaser.Physics.Arcade.StaticGroup;
  private networkManager: BattleNetworkManager;
  private battleConfig: BattleConfig;

  constructor() {
    super({ key: 'TestMapSceneMultiplayer' });
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
      this.load.tilemapTiledJSON('test-map', '/assets/arena-maps/PH/test-map.json');
    }
  }

  create() {
    const map = this.make.tilemap({ key: 'test-map' });
    const tileset = this.textures.exists('world_tileset')
      ? map.addTilesetImage('world_tileset', 'world_tileset')
      : null;
    const rawMapData = this.cache.tilemap.get('test-map');
    const imagesToLoad = this.collectImages(rawMapData.data.layers);

    if (imagesToLoad.length > 0) {
      imagesToLoad.forEach(img => this.load.image(img.key, img.path));
      this.load.once('complete', () => this.setupMap(map, tileset, rawMapData));
      this.load.start();
    } else {
      this.setupMap(map, tileset, rawMapData);
    }

    this.setupNetworkListeners();
  }

  update() {
    this.localPlayer?.update();
    this.opponentPlayer?.update();
  }

  private collectImages(layers: any[]): { key: string, path: string }[] {
    const collect = (layers: any[]): { key: string, path: string }[] => {
      const images: { key: string, path: string }[] = [];
      layers.forEach((layer: any) => {
        if (layer.type === 'group' && layer.layers) {
          images.push(...collect(layer.layers));
        } else if (layer.type === 'imagelayer' && layer.image) {
          const imageKey = layer.image.replace('.png', '');
          if (!this.textures.exists(imageKey)) {
            images.push({ key: imageKey, path: `/assets/arena-maps/PH/${layer.image}` });
          }
        } else if (layer.type === 'objectgroup') {
          layer.objects.forEach((obj: any) => {
            if (obj.image) {
              const objImageKey = obj.image.replace('.png', '');
              if (!this.textures.exists(objImageKey)) {
                images.push({ key: objImageKey, path: `/assets/arena-maps/PH/${obj.image}` });
              }
            }
          });
        }
      });
      return images;
    };
    return collect(layers);
  }

  private setupMap(map: Phaser.Tilemaps.Tilemap, tileset: Phaser.Tilemaps.Tileset | null, rawMapData: any) {
    this.platformGroup = this.physics.add.staticGroup();
    rawMapData.data.layers.forEach((layer: any, index: number) => {
      this.processLayer(layer, index, map, tileset, this.platformGroup!, 0, 1, 1);
    });
    this.setWorldAndCameraBounds(map);
    this.setupPlayers();
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

  private setWorldAndCameraBounds(map: Phaser.Tilemaps.Tilemap) {
    const padding = 800;
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(-padding, -padding, map.widthInPixels + padding * 2, map.heightInPixels + padding * 2);
    // Match the single-player TestMap zoom for better framing
    this.cameras.main.setZoom(1.6);
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
    // Battle start (optional UI hook)
    this.networkManager.onBattleStart((_battleData: any) => {});

    // Apply server contexts only to remote opponent; ignore local echo
    this.networkManager.onPlayerContextsReceived((data: any) => {
      if (data.players && Array.isArray(data.players)) {
        data.players.forEach((playerContext: any) => {
          if (playerContext.socketId === this.battleConfig.opponentId) {
            this.applyServerContextToEntity(this.opponentPlayer, playerContext);
          }
        });
      }
    });

    this.networkManager.onAttackHit((attackData: any) => {
      this.renderServerAttackHitbox(attackData, true);
    });

    this.networkManager.onAttackMissed((attackData: any) => {
      this.renderServerAttackHitbox(attackData, false);
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
    if (spriteComp && ctx.state) {
      try { spriteComp.play(this.mapStateToAnimationKey(ctx.state)); } catch {}
      try { spriteComp.setState(ctx.state); } catch {}
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
      default: return 'player_idle';
    }
  }
}

export default TestMapSceneMultiplayer;


