import { IEntityState } from '../../components/StateComponent';
import { GameEntity } from '../../core/GameEntity';

export class IdleState implements IEntityState {
    constructor(private entity: GameEntity) {}

    enter() { /* ... */ }
    update() { /* ... */ }
    exit() { /* ... */ }
}