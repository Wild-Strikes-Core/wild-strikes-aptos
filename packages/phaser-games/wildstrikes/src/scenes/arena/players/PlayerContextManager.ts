import { PlayerManager } from "../player/PlayerManager";

export interface PlayerContext {
    id: string;
    name?: string;
    health?: number;
    manager: PlayerManager;
    isLocal: boolean;
    spawnPosition: { x: number; y: number };
}

export interface PlayerSpawnConfig {
    localPlayerId: string;
    opponentId: string;
    localSpawnPosition: { x: number; y: number };
    opponentSpawnPosition: { x: number; y: number };
    roomId: string;
}

export class PlayerContextManager {
    private playerContexts: Map<string, PlayerContext> = new Map();
    private localPlayerId: string | null = null;

    constructor(private scene: Phaser.Scene) {}

    public setupPlayers(config: PlayerSpawnConfig): Map<string, PlayerContext> {
        this.localPlayerId = config.localPlayerId;

        const localPlayer = new PlayerManager(this.scene, true, config.roomId);
        const opponentPlayer = new PlayerManager(this.scene, false, config.roomId);

        localPlayer.setSpawnPosition(config.localSpawnPosition.x, config.localSpawnPosition.y);
        opponentPlayer.setSpawnPosition(config.opponentSpawnPosition.x, config.opponentSpawnPosition.y);

        const localSprite = localPlayer.createPlayer(config.localSpawnPosition.x, config.localSpawnPosition.y);
        const opponentSprite = opponentPlayer.createPlayer(config.opponentSpawnPosition.x, config.opponentSpawnPosition.y);

        // Ensure remote player is above platform
        this.adjustPlayerDepth(opponentSprite);

        const localContext: PlayerContext = {
            id: config.localPlayerId,
            manager: localPlayer,
            isLocal: true,
            spawnPosition: config.localSpawnPosition
        };

        const opponentContext: PlayerContext = {
            id: config.opponentId,
            manager: opponentPlayer,
            isLocal: false,
            spawnPosition: config.opponentSpawnPosition
        };

        this.playerContexts.set(config.localPlayerId, localContext);
        this.playerContexts.set(config.opponentId, opponentContext);

        return this.playerContexts;
    }

    private adjustPlayerDepth(playerSprite: Phaser.Physics.Arcade.Sprite): void {
        const platform = (this.scene as any).platform;
        if (platform && playerSprite && playerSprite.y > platform.y) {
            const bodyHeight = playerSprite.body ? playerSprite.body.height : 0;
            playerSprite.y = platform.y - bodyHeight;
        }
    }

    public getLocalPlayerContext(): PlayerContext | undefined {
        return this.localPlayerId ? this.playerContexts.get(this.localPlayerId) : undefined;
    }

    public getPlayerContext(id: string): PlayerContext | undefined {
        return this.playerContexts.get(id);
    }

    public getAllPlayerContexts(): Map<string, PlayerContext> {
        return this.playerContexts;
    }

    public updatePlayers(delta: number): void {
        this.playerContexts.forEach(player => {
            player.manager.update(delta);
        });
    }

    public destroy(): void {
        this.playerContexts.forEach(player => {
            player.manager.destroy?.();
        });
        this.playerContexts.clear();
    }
} 