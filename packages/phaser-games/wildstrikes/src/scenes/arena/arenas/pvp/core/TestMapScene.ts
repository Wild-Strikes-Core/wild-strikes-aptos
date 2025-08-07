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

        // Gather all image keys to load
        const imagesToLoad: { key: string, path: string }[] = [];
        rawMapData.data.layers.forEach((layer: any) => {
            if (layer.type === 'imagelayer' && layer.image) {
                const imageKey = layer.image.replace('.png', '');
                if (!this.textures.exists(imageKey)) {
                    imagesToLoad.push({ key: imageKey, path: `/assets/arena-maps/PH/${layer.image}` });
                }
            }
            if (layer.type === 'objectgroup') {
                layer.objects.forEach((obj: any) => {
                    if (obj.image) {
                        const objImageKey = obj.image.replace('.png', '');
                        if (!this.textures.exists(objImageKey)) {
                            imagesToLoad.push({ key: objImageKey, path: `/assets/arena-maps/PH/${obj.image}` });
                        }
                    }
                });
            }
        });

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

        rawMapData.data.layers.forEach((layer: any) => {
            if (layer.type === 'tilelayer' && tileset) {
                map.createLayer(layer.name, tileset, 0, 0)?.setDepth(1);
            }
            if (layer.type === 'imagelayer' && layer.image) {
                const imageKey = layer.image.replace('.png', '');
                const img = this.add.image(layer.offsetx || 0, layer.offsety || 0, imageKey).setOrigin(0, 0);

                // Check for platform property
                if (layer.properties && layer.properties.some((p: any) => p.name === 'platform' && p.value === true)) {
                    // Add a physics body for the platform using actual image dimensions
                    const texture = this.textures.get(imageKey);
                    const platform = platformGroup.create(img.x, img.y, imageKey)
                        .setOrigin(0, 0)
                        .setDisplaySize(texture.source[0].width, texture.source[0].height)
                        .refreshBody();
                }
            }
            if (layer.type === 'objectgroup') {
                layer.objects.forEach((obj: any) => {
                    if (obj.image) {
                        const objImageKey = obj.image.replace('.png', '');
                        this.add.image(obj.x, obj.y, objImageKey).setOrigin(0, 0);
                    } else {
                        this.add.rectangle(obj.x, obj.y, obj.width, obj.height, 0xff0000).setOrigin(0, 0);
                    }
                });
            }
        });

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setZoom(1);
        this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);

        // Create player
        this.playerManager = new PlayerManager(
            this, 
            true,                // input enabled 
            'test-room',        // room ID (doesn't matter in single player)
            'test-player',      // player ID (doesn't matter in single player)
            true                // singlePlayerMode = true
        );
        const player = this.playerManager.createPlayer(600, 200);

        // Add collider between player and platforms
        this.physics.add.collider(player, platformGroup);

        // Optionally, expose platformGroup for PlayerManager collision setup
        // No need to expose platformGroup for network-related setup
        // (this as any).platform = platformGroup;
    }

    update() {
        this.playerManager?.update();
    }
}