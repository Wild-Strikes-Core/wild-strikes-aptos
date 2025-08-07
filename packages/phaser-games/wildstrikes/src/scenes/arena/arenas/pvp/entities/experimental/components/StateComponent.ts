import { GameEntity } from '../core/GameEntity';

export interface IEntityState {
    enter(): void;
    update(): void;
    exit(): void;
}

export class StateComponent {
    private entity: GameEntity;
    private states: Map<string, IEntityState>;
    private currentState: IEntityState | null = null;

    constructor(entity: GameEntity, states: Map<string, IEntityState>, initialState: string) {
        this.entity = entity;
        this.states = states;
        this.transitionTo(initialState);
    }

    transitionTo(stateName: string) {
        if (this.currentState) {
            this.currentState.exit();
        }
        const newState = this.states.get(stateName);
        if (newState) {
            this.currentState = newState;
            this.currentState.enter();
        }
    }

    update() {
        if (this.currentState) {
            this.currentState.update();
        }
    }

    getCurrentState(): IEntityState | null {
        return this.currentState;
    }
}