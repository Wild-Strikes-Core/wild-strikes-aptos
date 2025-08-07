import { GameEntity } from '../core/GameEntity';

export class NetworkComponent {
    constructor(private entity: GameEntity) {}

    update() {
        // Handle input for this.entity.sprite
    }

    destroy() {
        // Cleanup if needed
    }
}