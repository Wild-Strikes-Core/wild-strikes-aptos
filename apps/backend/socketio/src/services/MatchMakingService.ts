import { Server, Socket } from 'socket.io';

export class MatchmakingService {
    private queue: Map<string, string[]> = new Map();
    private matches: Record<string, string> = {};

    constructor(private io: Server) {}

    join(socketId: string, playerData: string[]) {
        this.queue.set(socketId, playerData);
        this.attemptMatch();
    }

    leave(socketId: string) {
        this.queue.delete(socketId);
    }

    disconnect(socketId: string) {
        this.leave(socketId);

        const opponentId = this.matches[socketId];
        if (opponentId) {
            this.io.to(opponentId).emit("opponent-disconnected");
            delete this.matches[opponentId];
            delete this.matches[socketId];
        }
    }

    private attemptMatch() {
        const entries = Array.from(this.queue.entries());
        if (entries.length >= 2) {
            const [p1Id, p1Data] = entries[0];
            const [p2Id, p2Data] = entries[1];

            this.queue.delete(p1Id);
            this.queue.delete(p2Id);

            this.matches[p1Id] = p2Id;
            this.matches[p2Id] = p1Id;

            this.io.to(p1Id).emit("match-found", {
                opponentId: p2Id,
                yourData: p1Data,
                opponentData: p2Data,
            });
            this.io.to(p2Id).emit("match-found", {
                opponentId: p1Id,
                yourData: p2Data,
                opponentData: p1Data,
            });

            console.log(`Match found between ${p1Id} and ${p2Id}`);
        }
    }
}
