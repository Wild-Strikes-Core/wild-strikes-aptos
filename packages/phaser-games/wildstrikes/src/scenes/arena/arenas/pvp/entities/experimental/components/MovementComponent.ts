import { GameEntity } from '../core/GameEntity';

export class MovementComponent {
    constructor(private entity: GameEntity) {}

    update() {
        // Handle input for this.entity.sprite
    }

    destroy() {
        // Cleanup if needed
    }
}