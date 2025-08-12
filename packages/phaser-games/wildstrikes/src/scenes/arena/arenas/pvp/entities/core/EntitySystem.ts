import { GameEntity } from './GameEntity';

export class EntitySystem {
    private entities: GameEntity[] = [];

    addEntity(entity: GameEntity) {
        this.entities.push(entity);
    }

    removeEntity(entity: GameEntity) {
        this.entities = this.entities.filter(e => e !== entity);
    }

    updateAll() {
        this.entities.forEach(entity => entity.update());
    }

    destroyAll() {
        this.entities.forEach(entity => entity.destroy());
        this.entities = [];
    }
}