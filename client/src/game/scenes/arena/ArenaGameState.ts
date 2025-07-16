import { IPlayerState } from "./ArenaNetworking";

export class ArenaGameState {
    private scene: Phaser.Scene;
    private lastPositionUpdate: number = 0;
    private positionUpdateInterval: number = 50;
    private lastAnimationUpdate: number = 0;
    private animationUpdateInterval: number = 100;
    private _isTransitioning: boolean = false;

    private MY_PLAYER: {
        sprite?: Phaser.Physics.Arcade.Sprite;
    } = {};

    private OTHER_PLAYER: {
        sprite?: Phaser.Physics.Arcade.Sprite;
        lastReceivedAnimation?: string;
        lastAnimationChangeTime?: number;
    } = {};

    private GAME_STATE: {
        player1: IPlayerState;
        player2: IPlayerState;
    } = {
        player1: {
            id: undefined,
            x: undefined,
            y: undefined,
            velocityX: 0,
            velocityY: 0,
            health: 100,
            flipX: false,
            anim: "_Idle_Idle",
            pastAnim: undefined,
        },
        player2: {
            id: undefined,
            x: undefined,
            y: undefined,
            velocityX: 0,
            velocityY: 0,
            flipX: true,
            health: 100,
            anim: "_Idle_Idle",
            pastAnim: undefined,
        },
    };

    private otherPlayers: { [id: string]: Phaser.Physics.Arcade.Sprite } = {};
    private matchData: {
        players?: {
            player1: { id: string; name: string };
            player2: { id: string; name: string };
        };
    } = {};

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public getMyPlayer(): { sprite?: Phaser.Physics.Arcade.Sprite } {
        return this.MY_PLAYER;
    }

    public getOtherPlayer(): { 
        sprite?: Phaser.Physics.Arcade.Sprite;
        lastReceivedAnimation?: string;
        lastAnimationChangeTime?: number;
    } {
        return this.OTHER_PLAYER;
    }

    public getGameState(): {
        player1: IPlayerState;
        player2: IPlayerState;
    } {
        return this.GAME_STATE;
    }

    public setMyPlayerSprite(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.MY_PLAYER.sprite = sprite;
    }

    public setOtherPlayerSprite(sprite: Phaser.Physics.Arcade.Sprite): void {
        this.OTHER_PLAYER.sprite = sprite;
    }

    public updateGameState(player1: IPlayerState, player2: IPlayerState): void {
        this.GAME_STATE.player1 = { ...this.GAME_STATE.player1, ...player1 };
        this.GAME_STATE.player2 = { ...this.GAME_STATE.player2, ...player2 };
    }

    public updatePlayerState(playerId: string, state: Partial<IPlayerState>): void {
        if (this.GAME_STATE.player1.id === playerId) {
            this.GAME_STATE.player1 = { ...this.GAME_STATE.player1, ...state };
        } else if (this.GAME_STATE.player2.id === playerId) {
            this.GAME_STATE.player2 = { ...this.GAME_STATE.player2, ...state };
        }
    }

    public isTransitioning(): boolean {
        return this._isTransitioning;
    }

    public setTransitioning(transitioning: boolean): void {
        this._isTransitioning = transitioning;
    }

    public canSendPositionUpdate(): boolean {
        const currentTime = this.scene.time.now;
        return currentTime - this.lastPositionUpdate > this.positionUpdateInterval;
    }

    public markPositionUpdateSent(): void {
        this.lastPositionUpdate = this.scene.time.now;
    }

    public canSendAnimationUpdate(): boolean {
        const currentTime = this.scene.time.now;
        return currentTime - this.lastAnimationUpdate > this.animationUpdateInterval;
    }

    public markAnimationUpdateSent(): void {
        this.lastAnimationUpdate = this.scene.time.now;
    }

    public getOtherPlayers(): { [id: string]: Phaser.Physics.Arcade.Sprite } {
        return this.otherPlayers;
    }

    public addOtherPlayer(id: string, sprite: Phaser.Physics.Arcade.Sprite): void {
        this.otherPlayers[id] = sprite;
    }

    public removeOtherPlayer(id: string): void {
        if (this.otherPlayers[id]) {
            this.otherPlayers[id].destroy();
            delete this.otherPlayers[id];
        }
    }

    public getMatchData(): {
        players?: {
            player1: { id: string; name: string };
            player2: { id: string; name: string };
        };
    } {
        return this.matchData;
    }

    public setMatchData(data: {
        players?: {
            player1: { id: string; name: string };
            player2: { id: string; name: string };
        };
    }): void {
        this.matchData = data;
    }

    public reset(): void {
        this._isTransitioning = false;
        this.lastPositionUpdate = 0;
        this.lastAnimationUpdate = 0;
        
        // Reset game state
        this.GAME_STATE = {
            player1: {
                id: undefined,
                x: undefined,
                y: undefined,
                velocityX: 0,
                velocityY: 0,
                health: 100,
                flipX: false,
                anim: "_Idle_Idle",
                pastAnim: undefined,
            },
            player2: {
                id: undefined,
                x: undefined,
                y: undefined,
                velocityX: 0,
                velocityY: 0,
                health: 100,
                flipX: true,
                anim: "_Idle_Idle",
                pastAnim: undefined,
            },
        };

        // Reset player references
        this.OTHER_PLAYER = {
            sprite: undefined,
            lastReceivedAnimation: undefined,
            lastAnimationChangeTime: undefined,
        };
        
        this.MY_PLAYER = {
            sprite: undefined,
        };

        // Clean up other players
        Object.values(this.otherPlayers).forEach((sprite) => {
            if (sprite && sprite.active) {
                sprite.destroy();
            }
        });
        this.otherPlayers = {};

        // Reset match data
        this.matchData = {};
    }

    public destroy(): void {
        this.reset();
    }
}
