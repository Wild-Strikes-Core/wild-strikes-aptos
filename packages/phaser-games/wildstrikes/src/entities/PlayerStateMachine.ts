import { PlayerState } from "./PlayerStates";

type StateHandler = {
    enter?: () => void;
    update?: (delta: number) => void;
    exit?: () => void;
}

export class PlayerStateMachine {
    private states: Map<PlayerState, StateHandler> = new Map();
    private currentState: PlayerState;
    private currentHandler: StateHandler;

    constructor(initialState: PlayerState) {
        this.currentState = initialState;
        this.currentHandler = { update: () => {} };
    }

    addState(state: PlayerState, handler: StateHandler) {
        this.states.set(state, handler);
    }

    setState(state: PlayerState) {
        if (this.currentState === state) return;
        this.currentHandler.exit?.();
        this.currentState = state;
        this.currentHandler = this.states.get(state) || { update: () => {} };
        this.currentHandler.enter?.();
    }

    update(delta: number) {
        this.currentHandler.update?.(delta);
    }

    getCurrentState() {
        return this.currentState;
    }
}