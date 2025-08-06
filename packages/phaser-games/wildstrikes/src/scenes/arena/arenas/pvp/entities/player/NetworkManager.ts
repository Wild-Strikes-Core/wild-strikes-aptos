/**
 * Handles all networking operations including client prediction and reconciliation
 */
export class NetworkManager {
    private playerId: string;
    private roomId: string;
    private sequenceNumber: number = 0;
    private networkHandler?: any;
    
    // Client prediction
    private predictionBuffer: Array<{
        sequenceNumber: number;
        timestamp: number;
        position: { x: number; y: number };
        velocity: { x: number; y: number };
        inputs: any;
        state: string;
    }> = [];
    
    private readonly MAX_PREDICTION_BUFFER = 60;
    private readonly RECONCILIATION_THRESHOLD = 3;
    private readonly INPUT_RATE_LIMIT = 16;
    
    private lastInputSent: number = 0;
    private lastSentInputs: any = null;
    private lastSentPosition: { x: number; y: number } = { x: 0, y: 0 };
    private lastSentState: string = 'idle';
    private serverState: any = null;

    constructor(playerId: string, roomId: string) {
        this.playerId = playerId;
        this.roomId = roomId;
    }

    public setNetworkHandler(handler: any): void {
        this.networkHandler = handler;
    }

    public shouldSendUpdate(now: number): boolean {
        return now - this.lastInputSent >= this.INPUT_RATE_LIMIT && !!this.networkHandler;
    }

    public sendPlayerUpdate(inputs: any, position: any, player: Phaser.Physics.Arcade.Sprite, currentState: string, serverStats: any, reason: string): void {
        const now = Date.now();
        
        if (!this.shouldSendUpdate(now)) return;

        this.lastInputSent = now;

        const playerContext = {
            socketId: this.playerId,
            position: {
                x: position.x,
                y: position.y,
                facing: (player?.flipX ? 'left' : 'right') as 'left' | 'right'
            },
            velocityX: player?.body ? (player.body as Phaser.Physics.Arcade.Body).velocity.x : 0,
            velocityY: player?.body ? (player.body as Phaser.Physics.Arcade.Body).velocity.y : 0,
            inputs: inputs,
            state: currentState,
            playerStats: serverStats,
            isAlive: true,
            sequenceNumber: ++this.sequenceNumber,
            timestamp: now
        };

        console.log(`[NETWORK] 📤 Sending update (${reason}):`, {
            socketId: playerContext.socketId,
            position: playerContext.position,
            inputs: playerContext.inputs,
            state: playerContext.state,
            sequenceNumber: playerContext.sequenceNumber,
            reason
        });

        this.storePrediction(playerContext, inputs, position);
        this.networkHandler.sendPlayerContext(playerContext);
        this.updateSentData(inputs, position, currentState);
    }

    private storePrediction(playerContext: any, inputs: any, position: any): void {
        this.predictionBuffer.push({
            sequenceNumber: playerContext.sequenceNumber,
            timestamp: playerContext.timestamp,
            position: { ...position },
            velocity: { x: playerContext.velocityX, y: playerContext.velocityY },
            inputs: { ...inputs },
            state: playerContext.state
        });

        if (this.predictionBuffer.length > this.MAX_PREDICTION_BUFFER) {
            this.predictionBuffer.shift();
        }
    }

    private updateSentData(inputs: any, position: any, state: string): void {
        this.lastSentInputs = { ...inputs };
        this.lastSentPosition = { ...position };
        this.lastSentState = state;
    }

    public hasInputChanges(inputs: any): boolean {
        return !this.lastSentInputs || JSON.stringify(inputs) !== JSON.stringify(this.lastSentInputs);
    }

    public hasPositionChanges(position: any): boolean {
        return Math.abs(position.x - this.lastSentPosition.x) > 0.5 || 
               Math.abs(position.y - this.lastSentPosition.y) > 0.5;
    }

    public hasStateChanges(state: string): boolean {
        return state !== this.lastSentState;
    }

    public reconcileWithServer(serverPlayerContext: any, player: Phaser.Physics.Arcade.Sprite, onStateCorrection: (state: string) => void): void {
        if (serverPlayerContext.socketId !== this.playerId) return;

        const serverSequence = serverPlayerContext.sequenceNumber;
        const serverPosition = serverPlayerContext.position;
        const serverState = serverPlayerContext.state;

        const predictionIndex = this.predictionBuffer.findIndex(p => p.sequenceNumber === serverSequence);
        if (predictionIndex === -1) {
            console.warn(`[RECONCILIATION] ⚠️ No prediction found for sequence #${serverSequence}`);
            return;
        }

        const prediction = this.predictionBuffer[predictionIndex];
        const positionDiff = Math.sqrt(
            Math.pow(serverPosition.x - prediction.position.x, 2) + 
            Math.pow(serverPosition.y - prediction.position.y, 2)
        );

        const needsPositionCorrection = positionDiff > this.RECONCILIATION_THRESHOLD;
        const needsStateCorrection = serverState !== prediction.state;

        if (needsPositionCorrection || needsStateCorrection) {
            this.applyServerCorrection(serverPlayerContext, player, onStateCorrection, predictionIndex);
        } else {
            this.predictionBuffer = this.predictionBuffer.slice(predictionIndex + 1);
        }

        this.serverState = { ...serverPlayerContext };
    }

    private applyServerCorrection(serverContext: any, player: Phaser.Physics.Arcade.Sprite, onStateCorrection: (state: string) => void, predictionIndex: number): void {
        console.log(`[RECONCILIATION] 🔧 Applying server correction`);

        player.setPosition(serverContext.position.x, serverContext.position.y);
        
        if (player.body) {
            const body = player.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(serverContext.velocityX || 0, serverContext.velocityY || 0);
        }

        const facing = serverContext.position.facing || 'right';
        player.setFlipX(facing === 'left');

        onStateCorrection(serverContext.state);

        this.predictionBuffer = this.predictionBuffer.slice(predictionIndex + 1);
        this.lastSentPosition = { x: serverContext.position.x, y: serverContext.position.y };
        this.lastSentState = serverContext.state;
    }

    public cleanupOldPredictions(): void {
        const now = Date.now();
        const maxAge = 1000;
        const oldSize = this.predictionBuffer.length;
        
        this.predictionBuffer = this.predictionBuffer.filter(p => (now - p.timestamp) < maxAge);
        
        if (this.predictionBuffer.length !== oldSize) {
            console.log(`[PREDICTION] Cleaned up ${oldSize - this.predictionBuffer.length} old predictions`);
        }
    }

    public getLastInputSent(): number { return this.lastInputSent; }
    public getInputRateLimit(): number { return this.INPUT_RATE_LIMIT; }
}
