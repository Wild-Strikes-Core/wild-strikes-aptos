import { MapManager } from "../maps/MapManager";
import { AssetLoader } from "../../../../../AssetLoader";
import { ArenaCameraManager } from "../systems/camera/CameraManager";
import { BattleNetworkManager } from "../systems/network/BattleNetworkManager";
import { BattleConfig, DEFAULT_CAMERA_CONFIG } from "../config/BattleConfig";
import { EntityFactory } from "../entities/experimental/core/EntityFactory";
import { PlayerEntity } from "../entities/experimental/playerEntity";
import { HitboxComponent } from "../entities/experimental/components/HitboxComponent";

export default class Arena extends Phaser.Scene {
    private mapManager: MapManager;
    private cameraManager: ArenaCameraManager;
    private networkManager: BattleNetworkManager;
    private localPlayer?: PlayerEntity;
    private opponentPlayer?: PlayerEntity;
    
    private battleConfig: BattleConfig;
    
    constructor() {
        super({ key: "ArenaFALSE" });
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
    }): void {
        console.log(`[ARENA] Initializing with data:`, data);
        
        // Map the old data structure to the new BattleConfig interface
        this.battleConfig = {
            mapConfig: data.mapConfig,
            localPlayerData: data.yourData || [],
            opponentData: data.opponentData || [],
            localPlayerId: data.yourId || '',
            opponentId: data.opponentId || '',
            localSpawnPosition: data.p1SpawnPosition || { x: 0, y: 0 },
            opponentSpawnPosition: data.p2SpawnPosition || { x: 0, y: 0 },
            roomId: data.roomId || ''
        };
        
        this.cameraManager = new ArenaCameraManager(this, DEFAULT_CAMERA_CONFIG);
        this.networkManager = new BattleNetworkManager({
            localPlayerId: this.battleConfig.localPlayerId,
            opponentId: this.battleConfig.opponentId,
            roomId: this.battleConfig.roomId
        });
    }

    preload(): void {
        const loader = new AssetLoader(this.load);
        loader.loadGroup('gameplay');
        loader.loadGroup('gameplay-audio');
        loader.loadGroup('chars');
    }

    create(): void {
        console.log(`[ARENA] Creating arena scene`);
        
        this.setupMap();
        this.setupPlayers();
        this.setupCamera();
        this.setupNetworkListeners();
    }

    update(time: number, delta: number): void {
        this.cameraManager.update();
        this.localPlayer?.update();
        this.opponentPlayer?.update();
    }

    private setupMap(): void {
        this.mapManager = new MapManager();
        const clientMapConfig = {
            name: this.battleConfig.mapConfig.name,
            backgroundKey: this.battleConfig.mapConfig.backgroundImage,
            musicKey: this.battleConfig.mapConfig.backgroundMusic
        };
        this.mapManager.setupMap(this, clientMapConfig);
    }

    private setupCamera(): void {
        const sprite = this.localPlayer?.sprite;
        if (sprite) {
            this.cameras.main.startFollow(sprite);
            this.cameras.main.setFollowOffset(0, 50);
            this.cameras.main.setDeadzone(100, 100);
        }
    }

    private setupPlayers(): void {
        // Compute a safe spawn Y above the platform
        const groundTopY = this.cameras.main.height - 100; // from MapManager platform (center at h-50, height 100)
        const safeY = (y: number) => Math.min(y, groundTopY - 10);

        // Local ECS player with inputs and network component
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

        // Remote ECS player (no input, no network sender)
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

        // Physics collisions with the ground platform
        const platform = (this as any).platform;
        if (platform) {
            if (this.localPlayer?.sprite) this.physics.add.collider(this.localPlayer.sprite, platform);
            if (this.opponentPlayer?.sprite) this.physics.add.collider(this.opponentPlayer.sprite, platform);
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
            if (localHitbox) {
                console.log('[ARENA] 🥊 Setting up local player hitbox collisions with opponent');
                localHitbox.setOpponent(opponentSprite);
            }
            if (oppHitbox) {
                console.log('[ARENA] 🥊 Setting up opponent hitbox collisions with local player');
                oppHitbox.setOpponent(localSprite);
            }
        } else {
            console.warn('[ARENA] ⚠️ Could not set up hitbox collisions - missing player sprites');
        }
    }

    private setupNetworkListeners(): void {
   
        // ✅ Handle battle start (optional UI hook)
        this.networkManager.onBattleStart((battleData: any) => {
            console.log('[ARENA] Battle start received:', battleData);
        });

        // ✅ Handle server-authoritative player contexts
        this.networkManager.onPlayerContextsReceived((data: any) => {
            console.log('[ARENA] 📥 Server-authoritative player contexts received:', data);
            
            if (data.players && Array.isArray(data.players)) {
                data.players.forEach((playerContext: any) => {
                    console.log(`[ARENA] Player context for ${playerContext.socketId}:`, {
                        position: playerContext.position,
                        inputs: playerContext.inputs,
                        state: playerContext.state,
                        playerStats: playerContext.playerStats,
                        sequenceNumber: playerContext.sequenceNumber,
                        timestamp: playerContext.timestamp
                    });
                    
            // In client-authoritative mode, ignore local echo to avoid overriding physics.
            // Always apply updates to the remote opponent.
            if (playerContext.socketId === this.battleConfig.opponentId) {
                this.applyServerContextToEntity(this.opponentPlayer, playerContext);
            }
                });
            }
        });

         this.networkManager.onAttackHit((attackData: any) => {
            console.log('[ARENA] ⚔️ Server attack hit received:', attackData);
            this.renderServerAttackHitbox(attackData, true); // true = hit
            this.applyAttackEffects(attackData);
        });

        // ✅ Handle server-validated attack misses
        this.networkManager.onAttackMissed((attackData: any) => {
            console.log('[ARENA] 💨 Server attack miss received:', attackData);
            this.renderServerAttackHitbox(attackData, false); // false = miss
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

    private applyAttackEffects(attackData: any): void {
        
        // Play hit sound, particle effects, etc.
        console.log('[ARENA] 🎯 Applying hit effects:', attackData);
    }

    private applyServerContextToEntity(entity: PlayerEntity | undefined, ctx: any): void {
        if (!entity || !entity.sprite) return;
        // Position, velocity, facing
        entity.sprite.setPosition(ctx.position?.x || 0, ctx.position?.y || 0);
        const facing = ctx.position?.facing || 'right';
        entity.sprite.setFlipX(facing === 'left');
        const body = entity.sprite.body as Phaser.Physics.Arcade.Body | undefined;
        if (body) body.setVelocity(ctx.velocityX || 0, ctx.velocityY || 0);

        // Animation according to state
        const spriteComp = entity.getComponent<any>('sprite');
        const animKey = this.mapStateToAnimationKey(ctx.state);
        if (spriteComp && animKey) {
            try { spriteComp.play(animKey); } catch {}
            try { spriteComp.setState(ctx.state); } catch {}
        }
    }

    private mapStateToAnimationKey(state: string | undefined): string | null {
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
            default: return null;
        }
    }

    shutdown(): void {
        this.cleanup();
    }

    destroy(): void {
        this.cleanup();
    }

    private cleanup(): void {
        this.cameraManager?.destroy();
        this.networkManager?.destroy();
        this.mapManager?.destroy();
        this.localPlayer?.destroy();
        this.opponentPlayer?.destroy();
    }
}
