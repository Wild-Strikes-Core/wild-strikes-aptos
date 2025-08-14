import * as Phaser from 'phaser';

export type TiledMapRendererOptions = {
  baseImagePath?: string; // e.g. '/assets/arena-maps/PH'
};

export class TiledMapRenderer {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly opts: TiledMapRendererOptions = {}
  ) {}

  collectImages(layers: any[], baseImagePath = this.opts.baseImagePath || ''): { key: string; path: string }[] {
    const collect = (ls: any[]): { key: string; path: string }[] => {
      const images: { key: string; path: string }[] = [];
      ls.forEach((layer: any) => {
        if (layer.type === 'group' && layer.layers) {
          images.push(...collect(layer.layers));
        } else if (layer.type === 'imagelayer' && layer.image) {
          const imageKey = layer.image.replace('.png', '');
          if (!this.scene.textures.exists(imageKey)) {
            images.push({ key: imageKey, path: `${baseImagePath}/${layer.image}` });
          }
        } else if (layer.type === 'objectgroup' && Array.isArray(layer.objects)) {
          layer.objects.forEach((obj: any) => {
            if (obj.image) {
              const objImageKey = obj.image.replace('.png', '');
              if (!this.scene.textures.exists(objImageKey)) {
                images.push({ key: objImageKey, path: `${baseImagePath}/${obj.image}` });
              }
            }
          });
        }
      });
      return images;
    };
    return collect(layers);
  }

  buildMap(
    map: Phaser.Tilemaps.Tilemap,
    tileset: Phaser.Tilemaps.Tileset | null,
    rawMapData: any
  ): Phaser.Physics.Arcade.StaticGroup {
    const platformGroup = this.scene.physics.add.staticGroup();
    rawMapData.data.layers.forEach((layer: any, index: number) => {
      this.processLayer(layer, index, map, tileset, platformGroup, 0, 1, 1);
    });
    return platformGroup;
  }

  setWorldAndCameraBounds(
    map: Phaser.Tilemaps.Tilemap,
    opts?: { padding?: number; zoom?: number }
  ): void {
    const padding = opts?.padding ?? 800;
    this.scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.scene.cameras.main.setBounds(
      -padding,
      -padding,
      map.widthInPixels + padding * 2,
      map.heightInPixels + padding * 2
    );
    if (opts?.zoom !== undefined) {
      this.scene.cameras.main.setZoom(opts.zoom);
    }
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
  ): void {
    if (layer.type === 'tilelayer' && tileset) {
      if (layer.compression && layer.compression !== 'none') return;
      const tileLayer = map.createLayer(layer.name, tileset, 0, 0)?.setDepth(parentDepth + groupDepthOffset);
      if (tileLayer) {
        const scrollFactorX = layer.parallaxx !== undefined ? layer.parallaxx : parentScrollFactorX;
        const scrollFactorY = layer.parallaxy !== undefined ? layer.parallaxy : parentScrollFactorY;
        tileLayer.setScrollFactor(scrollFactorX, scrollFactorY);
        // Allow a simple boolean property to force render above player sprites
        if (layer.properties) {
          const props: Record<string, any> = {};
          for (const p of layer.properties) props[p.name] = p.value;
          const abovePlayers = props['abovePlayers'] === true || props['abovePlayers'] === 'true' || props['abovePlayers'] === 1;
          if (abovePlayers) tileLayer.setDepth(10000); // players are 9999
        }
      }
      return;
    }

    if (layer.type === 'group' && layer.layers) {
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
      return;
    }

    if (layer.type === 'imagelayer' && layer.image) {
      const imageKey = layer.image.replace('.png', '');

      const isRepeatingX = layer.repeatx === true || layer.repeatx === 'true' || layer.repeatx === 1;
      const isRepeatingY = layer.repeaty === true || layer.repeaty === 'true' || layer.repeaty === 1;
      const isRepeating = isRepeatingX || isRepeatingY;

      const scrollFactorX = layer.parallaxx !== undefined ? layer.parallaxx : parentScrollFactorX;
      const scrollFactorY = layer.parallaxy !== undefined ? layer.parallaxy : parentScrollFactorY;

      let img: Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite;
      if (isRepeating) {
        const tileWidth = isRepeatingX ? map.widthInPixels * 4 : layer.imagewidth;
        const tileHeight = isRepeatingY ? map.heightInPixels * 4 : layer.imageheight;
        img = this.scene.add
          .tileSprite(layer.offsetx || 0, layer.offsety || 0, tileWidth, tileHeight, imageKey)
          .setOrigin(0, 0);
      } else {
        const layerX = layer.offsetx || 0;
        const layerY = layer.offsety || 0;
        const layerWidth = layer.imagewidth || 0;
        const layerHeight = layer.imageheight || 0;
        const isWithinBounds =
          layerX < map.widthInPixels &&
          layerX + layerWidth > 0 &&
          layerY < map.heightInPixels &&
          layerY + layerHeight > 0;
        if (!isWithinBounds) return;
        img = this.scene.add.image(layer.offsetx || 0, layer.offsety || 0, imageKey).setOrigin(0, 0);
      }

      img.setScrollFactor(scrollFactorX, scrollFactorY);
      img.setDepth(parentDepth + groupDepthOffset);

      if (layer.properties) {
        const props: Record<string, any> = {};
        for (const p of layer.properties) props[p.name] = p.value;

        // If requested, force this visual layer above players
        const abovePlayers = props['abovePlayers'] === true || props['abovePlayers'] === 'true' || props['abovePlayers'] === 1;
        if (abovePlayers) img.setDepth(10000); // players are 9999

        // Build platform colliders
        const isPlatform = props['platform'] === true || props['platform'] === 'true' || props['platform'] === 1;
        if (isPlatform) {
          const texture = this.scene.textures.get(imageKey);
          const imageWidth = texture.source[0].width;
          const nativeHeight = texture.source[0].height;
          const imgHeight = (img as any).height ?? nativeHeight;

          // If platformThickness is not provided, fall back to the image/display height (previous behavior).
          const hasThicknessProp = props['platformThickness'] !== undefined && props['platformThickness'] !== null;
          const thickness = hasThicknessProp ? Number(props['platformThickness']) : imgHeight;

          // Place the platform so its bottom aligns with the image's bottom
          const topY = (img as any).y + imgHeight - thickness;

          if (isRepeatingX) {
            const numRepeats = Math.ceil(map.widthInPixels / imageWidth) + 12;
            const startX = layer.offsetx || 0;
            for (let i = 0; i < numRepeats; i++) {
              const platformX = startX + i * imageWidth;
              platformGroup
                .create(platformX, topY, imageKey)
                .setOrigin(0, 0)
                .setDisplaySize(imageWidth, thickness)
                .refreshBody()
                .setVisible(false);
            }
          } else {
            platformGroup
              .create((img as any).x, topY, imageKey)
              .setOrigin(0, 0)
              .setDisplaySize(imageWidth, thickness)
              .refreshBody()
              .setVisible(false);
          }
        }
      }
      return;
    }

    if (layer.type === 'objectgroup' && Array.isArray(layer.objects)) {
      // Support abovePlayers on the whole object layer
      let z = parentDepth + groupDepthOffset;
      if (layer.properties) {
        const props: Record<string, any> = {};
        for (const p of layer.properties) props[p.name] = p.value;
        const abovePlayers = props['abovePlayers'] === true || props['abovePlayers'] === 'true' || props['abovePlayers'] === 1;
        if (abovePlayers) z = 10000; // players are 9999
      }
      layer.objects.forEach((obj: any) => {
        if (obj.image) {
          const objImageKey = obj.image.replace('.png', '');
          this.scene.add.image(obj.x, obj.y, objImageKey).setOrigin(0, 0).setDepth(z);
        } else {
          this.scene.add.rectangle(obj.x, obj.y, obj.width, obj.height, 0xff0000).setOrigin(0, 0).setDepth(z);
        }
      });
    }
  }
}