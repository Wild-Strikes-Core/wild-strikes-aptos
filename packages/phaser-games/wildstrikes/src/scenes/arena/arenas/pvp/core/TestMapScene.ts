import * as Phaser from 'phaser';
import { EntityFactory } from "../entities/experimental/core/EntityFactory";
import { PlayerEntity } from "../entities/experimental/playerEntity";

import { AssetLoader } from "../../../../../AssetLoader";

export class TestMapScene extends Phaser.Scene {
    private player?: PlayerEntity;

    constructor() {
        super({ key: 'TestMapScene' });
    }

    preload() {
        this.loadEssentialAssets();
        this.load.tilemapTiledJSON('test-map', '/assets/arena-maps/PH/test-map.json');
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
    }

    update() {
        this.player?.update();
    }

    // --- Helper Methods ---

    private loadEssentialAssets() {
        const loader = new AssetLoader(this.load);
        loader.loadGroup('gameplay');
        loader.loadGroup('gameplay-audio');
        loader.loadGroup('chars');
    }

    private collectImages(layers: any[]): { key: string, path: string }[] {
        // Recursive function to collect images from layers (including groups)
        const collectImages = (layers: any[]): { key: string, path: string }[] => {
            const images: { key: string, path: string }[] = [];
            
            layers.forEach((layer: any) => {
                if (layer.type === 'group' && layer.layers) {
                    // Recursively process group layers
                    images.push(...collectImages(layer.layers));
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

        // Gather all image keys to load (including from groups)
        const imagesToLoad = collectImages(layers);

        return imagesToLoad;
    }

    private setupMap(map: Phaser.Tilemaps.Tilemap, tileset: Phaser.Tilemaps.Tileset | null, rawMapData: any) {
        const platformGroup = this.physics.add.staticGroup();
        rawMapData.data.layers.forEach((layer: any, index: number) => {
            this.processLayer(layer, index, map, tileset, platformGroup, 0, 1, 1);
        });
        this.setWorldAndCameraBounds(map);
        this.setupPlayer(platformGroup);
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
            // Skip compressed layers that Phaser can't handle
            if (layer.compression && layer.compression !== 'none') {
                console.warn(`Skipping compressed tile layer '${layer.name}' - compression: ${layer.compression}`);
                return;
            }
            
            const tileLayer = map.createLayer(layer.name, tileset, 0, 0)?.setDepth(parentDepth + groupDepthOffset);
            
            // Apply parallax scroll factors for tile layers (inherit from parent if not specified)
            if (tileLayer) {
                const scrollFactorX = layer.parallaxx !== undefined ? layer.parallaxx : parentScrollFactorX;
                const scrollFactorY = layer.parallaxy !== undefined ? layer.parallaxy : parentScrollFactorY;
                tileLayer.setScrollFactor(scrollFactorX, scrollFactorY);
            }
        }
        else if (layer.type === 'group' && layer.layers) {
            // Get group's parallax properties, fallback to parent values
            const groupScrollFactorX = layer.parallaxx !== undefined ? layer.parallaxx : parentScrollFactorX;
            const groupScrollFactorY = layer.parallaxy !== undefined ? layer.parallaxy : parentScrollFactorY;
            
            // Process all layers within the group recursively
            // Pass the group's scroll factors to child layers
            layer.layers.forEach((childLayer: any, index: number) => {
                this.processLayer(
                    childLayer, 
                    parentDepth, 
                    map, 
                    tileset, 
                    platformGroup, 
                    index * 0.1, // Small offset for child ordering
                    groupScrollFactorX,
                    groupScrollFactorY
                );
            });
        }
        else if (layer.type === 'imagelayer' && layer.image) {
            const imageKey = layer.image.replace('.png', '');
            
            // Check for repeating properties
            const isRepeatingX = layer.repeatx === true || layer.repeatx === "true" || layer.repeatx === 1;
            const isRepeatingY = layer.repeaty === true || layer.repeaty === "true" || layer.repeaty === 1;
            const isRepeating = isRepeatingX || isRepeatingY;
            
            // Apply parallax scroll factors (inherit from parent if not specified)
            const scrollFactorX = layer.parallaxx !== undefined ? layer.parallaxx : parentScrollFactorX;
            const scrollFactorY = layer.parallaxy !== undefined ? layer.parallaxy : parentScrollFactorY;
            
            let img;
            if (isRepeating) {
                // Use TileSprite for repeating backgrounds
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
                // Check bounds for static layers
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
                
                if (isWithinBounds) {
                    img = this.add.image(layer.offsetx || 0, layer.offsety || 0, imageKey).setOrigin(0, 0);
                } else {
                    return; // Skip this layer
                }
            }

            img.setScrollFactor(scrollFactorX, scrollFactorY);
            
            // Set depth based on parent depth + group offset
            img.setDepth(parentDepth + groupDepthOffset);

            // Check for platform physics
            if (layer.properties) {
                for (const prop of layer.properties) {
                    switch (prop.name) {
                        case 'platform':
                            if (prop.value === true) {
                                const texture = this.textures.get(imageKey);
                                const imageWidth = texture.source[0].width;
                                const imageHeight = texture.source[0].height;

                                if (isRepeatingX) {
                                    const numRepeats = Math.ceil(map.widthInPixels / imageWidth) + 2;
                                    const startX = layer.offsetx || 0;

                                    for (let i = 0; i < numRepeats; i++) {
                                        const platformX = startX + (i * imageWidth);
                                        const platform = platformGroup.create(platformX, img.y, imageKey)
                                            .setOrigin(0, 0)
                                            .setDisplaySize(imageWidth, imageHeight)
                                            .refreshBody();
                                        platform.setVisible(false);
                                    }
                                } else {
                                    const platform = platformGroup.create(img.x, img.y, imageKey)
                                        .setOrigin(0, 0)
                                        .setDisplaySize(imageWidth, imageHeight)
                                        .refreshBody();
                                }
                            }
                            break;
                        // Add more cases for other properties here
                        default:
                            break;
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
        this.cameras.main.setBounds(
            -padding,
            -padding,
            map.widthInPixels + (padding * 2),
            map.heightInPixels + (padding * 2)
        );
        this.cameras.main.setZoom(1.8);
    }

    private setupPlayer(platformGroup: Phaser.Physics.Arcade.StaticGroup) {
        this.player = EntityFactory.createPlayer('local-1', this, 600, 200, {
            inputEnabled: true,
            singlePlayerMode: true,
            followCamera: false, // we’ll set custom offsets below
        });
        this.player.sprite.setDepth(9999);
        this.physics.add.collider(this.player.sprite, platformGroup);
        // Camera follow with offsets/lerp
        this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08, -70, 180);
    }
}