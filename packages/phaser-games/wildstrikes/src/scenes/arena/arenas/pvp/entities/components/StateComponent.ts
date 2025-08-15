// StateComponent.ts
import { EntityComponent } from './EntityComponent';
import { GameEntity } from '../core/GameEntity';
import { InputComponent } from './InputComponent';
import { SpriteComponent } from './SpriteComponent';
import { HitboxComponent } from './HitboxComponent';
import { MovementComponent } from './MovementComponent';
import { NetworkComponent } from './NetworkComponent';

export interface IEntityState { enter(): void; update(): void; exit(): void; }

export type StateDeps = {
  entity: GameEntity;
  input: InputComponent;
  sprite: SpriteComponent;
  hitbox: HitboxComponent;
  movement: MovementComponent;
  network?: NetworkComponent | null;
  inputEnabled: boolean;
  singlePlayerMode: boolean;
};

export type StateFactory = (deps: StateDeps, goto: (key: string) => void) => IEntityState;

export class StateComponent implements EntityComponent {
  private deps: StateDeps;
  private factories = new Map<string, StateFactory>();
  private instances = new Map<string, IEntityState>();
  private currentKey: string;
  private current: IEntityState;

  constructor(
    private entity: GameEntity,
    options: {
      inputEnabled: boolean;
      singlePlayerMode: boolean;
      states: Record<string, StateFactory>;
      initial?: string;
    }
  ) {
    const input = entity.getComponent<InputComponent>('input')!;
    const sprite = entity.getComponent<SpriteComponent>('sprite')!;
    const hitbox = entity.getComponent<HitboxComponent>('hitbox')!;
    const movement = entity.getComponent<MovementComponent>('movement')!;
    const network = entity.getComponent<NetworkComponent>('network');

    this.deps = { entity, input, sprite, hitbox, movement, network, inputEnabled: options.inputEnabled, singlePlayerMode: options.singlePlayerMode };

    Object.entries(options.states).forEach(([k, f]) => this.factories.set(k, f));
    this.currentKey = options.initial || 'idle';
    this.current = this.getOrCreate(this.currentKey);
    this.current.enter();
  }

  private getOrCreate(key: string): IEntityState {
    const existing = this.instances.get(key);
    if (existing) return existing;
    const factory = this.factories.get(key);
    if (!factory) throw new Error(`State '${key}' not registered`);
    const inst = factory(this.deps, this.transitionTo.bind(this));
    this.instances.set(key, inst);
    return inst;
  }

  transitionTo(key: string): void {
    if (key === this.currentKey) return;
    const next = this.getOrCreate(key);
    this.current.exit();
    this.current = next;
    this.currentKey = key;
    this.current.enter();
  }

  getStateKey(): string { return this.currentKey; }

  // NOTE: do NOT call input.resetJustPressed() here — the InputComponent manages per-frame flags.
  update(now?: number, dt?: number): void {
    // State machine consumes the *already-updated* input snapshot. Make sure PlayerEntity updates input first.
    this.current.update();

    // Send network snapshot using the new Input API
    if (this.deps.inputEnabled) {
      const input = this.deps.input as any;
      if (typeof input.getSnapshot === 'function') {
        const snapshot = input.getSnapshot();
        if (this.deps.network && snapshot) {
          // snapshot is a map action -> { pressed, justPressed, justReleased }
          this.deps.network.sendPlayerMoved(snapshot, this.currentKey, 'TICK');
        }
      } else {
        // Defensive: if InputComponent doesn't expose getSnapshot, throw / log so you can fix it
        console.warn('StateComponent: InputComponent has no getSnapshot(). Ensure input uses the new API.');
      }
    }

    // Clear per-frame flags once states have consumed them
    try {
      (this.deps.input as any).endFrame?.();
    } catch {}
  }

  destroy(): void { this.current.exit(); }
}
