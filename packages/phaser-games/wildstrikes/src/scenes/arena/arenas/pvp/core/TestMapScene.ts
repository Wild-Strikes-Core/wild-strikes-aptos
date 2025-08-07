import * as Phaser from 'phaser';
import { PlayerManager } from "../entities/player/PlayerManager";
import { AssetLoader } from "../../../../../AssetLoader";

export class TestMapScene extends Phaser.Scene {
    private playerManager: PlayerManager;
    
    constructor() {
        super({ key: 'TestMapScene' });
    }

    preload() {
        // ESSENTIAL FOR PLAYER MANAGER!
        const loader = new AssetLoader(this.load);
        loader.loadGroup('gameplay');
        loader.loadGroup('gameplay-audio');
        loader.loadGroup('chars');

        this.load.tilemapTiledJSON('test-map', '/assets/arena-maps/PH/test-map.json');
        
        // Note: world_tileset is loaded by AssetLoader as a spritesheet, no need to load manually
    }


    create() { 
        const map = this.make.tilemap({ key: 'test-map' });
        
        // Only add tileset if the texture exists
        let tileset = null;
        if (this.textures.exists('world_tileset')) {
            tileset = map.addTilesetImage('world_tileset', 'world_tileset');
        }
        
        const rawMapData = this.cache.tilemap.get('test-map');

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
        const imagesToLoad = collectImages(rawMapData.data.layers);

        // If there are images to load, load them and then build the map
        if (imagesToLoad.length > 0) {
            imagesToLoad.forEach(img => this.load.image(img.key, img.path));
            this.load.once('complete', () => this.buildMap(map, tileset, rawMapData));
            this.load.start();
        } else {
            this.buildMap(map, tileset, rawMapData);
        }
    }

    buildMap(map: Phaser.Tilemaps.Tilemap, tileset: Phaser.Tilemaps.Tileset | null, rawMapData: any) {
        // Create a physics group for platforms
        const platformGroup = this.physics.add.staticGroup();

        // Recursive function to process layers (handles groups)
        const processLayer = (layer: any, parentDepth: number, groupDepthOffset: number = 0) => {
            if (layer.type === 'tilelayer' && tileset) {
                map.createLayer(layer.name, tileset, 0, 0)?.setDepth(1);
            }
            else if (layer.type === 'group' && layer.layers) {
                // Process all layers within the group recursively
                // Use the parent group's depth for all child layers
                layer.layers.forEach((childLayer: any, index: number) => {
                    processLayer(childLayer, parentDepth, index * 0.1); // Small offset for child ordering
                });
            }
            else if (layer.type === 'imagelayer' && layer.image) {
                const imageKey = layer.image.replace('.png', '');
                
                // Check for repeating properties
                const isRepeatingX = layer.repeatx === true || layer.repeatx === "true" || layer.repeatx === 1;
                const isRepeatingY = layer.repeaty === true || layer.repeaty === "true" || layer.repeaty === 1;
                const isRepeating = isRepeatingX || isRepeatingY;
                
                // Apply parallax scroll factors
                const scrollFactorX = layer.parallaxx !== undefined ? layer.parallaxx : 1;
                const scrollFactorY = layer.parallaxy !== undefined ? layer.parallaxy : 1;
                
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
                if (layer.properties && layer.properties.some((p: any) => p.name === 'platform' && p.value === true)) {
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
        };

        // Process all top-level layers (including groups)
        rawMapData.data.layers.forEach((layer: any, index: number) => {
            processLayer(layer, index);
        });

        // Simplified world bounds approach - use map dimensions + generous padding
        const padding = 800; // Extra space for player movement and camera freedom
        
        // Set physics world bounds to map dimensions
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        
        // Set camera bounds with padding for smooth movement beyond map edges
        this.cameras.main.setBounds(
            -padding, 
            -padding, 
            map.widthInPixels + (padding * 2), 
            map.heightInPixels + (padding * 2)
        );
        this.cameras.main.setZoom(1.8);

        // Create player
        this.playerManager = new PlayerManager(
            this, 
            true,                // input enabled 
            'test-room',        // room ID (doesn't matter in single player)
            'test-player',      // player ID (doesn't matter in single player)
            true                // singlePlayerMode = true
        );
        const player = this.playerManager.createPlayer(600, 200);
        player.setDepth(9999);

        // Follow the player, but clamp the camera so it doesn't go below the player's feet
        const camera = this.cameras.main;
        camera.startFollow(player, true, 0.08, 0.08, -70, 180); 
            
        // Add collider between player and platforms
        if (player) {
            this.physics.add.collider(player, platformGroup);
        }
    }

    update() {
        this.playerManager?.update();
    }
}