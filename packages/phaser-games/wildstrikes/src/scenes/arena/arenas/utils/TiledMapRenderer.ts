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
        const tileWidth = isRepeatingX ? map.widthInPixels * 2 : layer.imagewidth;
        const tileHeight = isRepeatingY ? map.heightInPixels * 2 : layer.imageheight;
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
        for (const prop of layer.properties) {
          if (prop.name === 'platform' && prop.value === true) {
            const texture = this.scene.textures.get(imageKey);
            const imageWidth = texture.source[0].width;
            const imageHeight = texture.source[0].height;

            if (isRepeatingX) {
              const numRepeats = Math.ceil(map.widthInPixels / imageWidth) + 2;
              const startX = layer.offsetx || 0;
              for (let i = 0; i < numRepeats; i++) {
                const platformX = startX + i * imageWidth;
                const platform = platformGroup
                  .create(platformX, (img as any).y, imageKey)
                  .setOrigin(0, 0)
                  .setDisplaySize(imageWidth, imageHeight)
                  .refreshBody();
                platform.setVisible(false);
              }
            } else {
              const platform = platformGroup
                .create((img as any).x, (img as any).y, imageKey)
                .setOrigin(0, 0)
                .setDisplaySize(imageWidth, imageHeight)
                .refreshBody();
              platform.setVisible(false);
            }
          }
        }
      }
      return;
    }

    if (layer.type === 'objectgroup' && Array.isArray(layer.objects)) {
      layer.objects.forEach((obj: any) => {
        if (obj.image) {
          const objImageKey = obj.image.replace('.png', '');
          this.scene.add.image(obj.x, obj.y, objImageKey).setOrigin(0, 0);
        } else {
          this.scene.add.rectangle(obj.x, obj.y, obj.width, obj.height, 0xff0000).setOrigin(0, 0);
        }
      });
    }
  }
}