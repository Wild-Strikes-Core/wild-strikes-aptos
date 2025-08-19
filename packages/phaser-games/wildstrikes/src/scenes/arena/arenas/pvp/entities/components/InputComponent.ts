// InputComponent.ts
import { GameEntity } from '../core/GameEntity';
import { EntityComponent } from './EntityComponent';

type KeyLike = string; // e.g. 'A', 'SPACE', 'ArrowLeft'
type PointerButton = 0 | 1 | 2; // left, middle, right

export type BindingSpec = {
  keys?: KeyLike[];                    // keyboard keys
  pointerButtons?: PointerButton[];    // mouse buttons
  // (Optional) future: gamepadButtons?: number[], axes?: { axis: 'x'|'y', sign: 1|-1 }
};

export type ActionHandlers = {
  onDown?: (meta?: any) => void;       // first frame it becomes down
  onUp?: (meta?: any) => void;         // first frame it becomes up
  onHold?: (durationMs?: number) => void; // called each update while pressed (can be throttled)
};

export type ActionState = {
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
  downTime: number; // ms pressed duration
};

export class InputComponent implements EntityComponent {
  entity: GameEntity;
  enabled = true;

  // mapping actionName -> binding
  private bindings: Map<string, BindingSpec> = new Map();
  // mapping actionName -> handlers
  private handlers: Map<string, ActionHandlers> = new Map();
  // mapping actionName -> runtime state
  private states: Map<string, ActionState> = new Map();

  // reverse index: key -> Set<actionName>
  private keyIndex: Map<string, Set<string>> = new Map();
  private pointerIndex: Map<number, Set<string>> = new Map();

  private scene: Phaser.Scene;
  private lastUpdateTs = 0;
  private listenersSetup = false;

  constructor(entity: GameEntity, enabled = true, initialBindings?: Record<string, BindingSpec>) {
    this.entity = entity;
    this.enabled = enabled;
    this.scene = entity.scene;
    if (initialBindings) {
      for (const k of Object.keys(initialBindings)) {
        this.addAction(k, initialBindings[k]);
      }
    }
    if (enabled) this.setupListeners();
  }

  // ------- public API -------

  addAction(actionName: string, spec: BindingSpec, handlers?: ActionHandlers) {
    this.bindings.set(actionName, spec);
    this.handlers.set(actionName, handlers ?? {});
    this.states.set(actionName, { pressed: false, justPressed: false, justReleased: false, downTime: 0 });
    this.indexBinding(actionName, spec);
  }

  removeAction(actionName: string) {
    const spec = this.bindings.get(actionName);
    if (spec) this.unindexBinding(actionName, spec);
    this.bindings.delete(actionName);
    this.handlers.delete(actionName);
    this.states.delete(actionName);
  }

  setHandlers(actionName: string, handlers: ActionHandlers) {
    this.handlers.set(actionName, handlers);
  }

  getActionState(actionName: string): ActionState | null {
    return this.states.get(actionName) ?? null;
  }

  // Poll snapshot useful for network or logic
  getSnapshot(): Record<string, { pressed: boolean; justPressed: boolean; justReleased: boolean }> {
    const out: Record<string, { pressed: boolean; justPressed: boolean; justReleased: boolean }> = {};
    for (const [k, s] of this.states.entries()) {
      out[k] = { pressed: s.pressed, justPressed: s.justPressed, justReleased: s.justReleased };
    }
    return out;
  }

  // Remap an action at runtime
  remapAction(actionName: string, spec: BindingSpec) {
    const old = this.bindings.get(actionName);
    if (old) this.unindexBinding(actionName, old);
    this.bindings.set(actionName, spec);
    this.indexBinding(actionName, spec);
  }

  enable() { this.enabled = true; if (!this.listenersSetup) this.setupListeners(); }
  disable() { this.enabled = false; }

  // Must be called every frame by your entity/system loop
  update(now = performance.now()) {
    if (!this.enabled) return;
    const dt = this.lastUpdateTs ? (now - this.lastUpdateTs) : 0;
    this.lastUpdateTs = now;

    for (const [action, state] of this.states.entries()) {
      // update timers
      if (state.pressed) state.downTime += dt;
      else state.downTime = 0;

      // call handlers
      const h = this.handlers.get(action);
      if (h) {
        if (state.justPressed && h.onDown) {
          try { h.onDown({ action, entity: this.entity }); } catch (e) { console.error(e); }
        }
        if (state.justReleased && h.onUp) {
          try { h.onUp({ action, entity: this.entity }); } catch (e) { console.error(e); }
        }
        if (state.pressed && h.onHold) {
          try { h.onHold(state.downTime); } catch (e) { console.error(e); }
        }
      }
    }
  }

  // Call at end of the frame, after game logic consumed per-frame flags
  endFrame() {
    for (const [, state] of this.states.entries()) {
      state.justPressed = false;
      state.justReleased = false;
    }
  }

  destroy() {
    // remove all listeners
    this.scene.input.keyboard.off('keydown', this._onKeyDown as any);
    this.scene.input.keyboard.off('keyup', this._onKeyUp as any);
    this.scene.input.off('pointerdown', this._onPointerDown as any);
    this.scene.input.off('pointerup', this._onPointerUp as any);
  }

  // ------- internal helpers -------

  private indexBinding(actionName: string, spec: BindingSpec) {
    if (spec.keys) {
      for (const k of spec.keys) {
        const key = k.toUpperCase();
        if (!this.keyIndex.has(key)) this.keyIndex.set(key, new Set());
        this.keyIndex.get(key)!.add(actionName);
      }
    }
    if (spec.pointerButtons) {
      for (const b of spec.pointerButtons) {
        const idx = b;
        if (!this.pointerIndex.has(idx)) this.pointerIndex.set(idx, new Set());
        this.pointerIndex.get(idx)!.add(actionName);
      }
    }
  }

  private unindexBinding(actionName: string, spec: BindingSpec) {
    if (!spec) return;
    if (spec.keys) {
      for (const k of spec.keys) {
        const key = k.toUpperCase();
        this.keyIndex.get(key)?.delete(actionName);
        if (this.keyIndex.get(key)?.size === 0) this.keyIndex.delete(key);
      }
    }
    if (spec.pointerButtons) {
      for (const b of spec.pointerButtons) {
        const idx = b;
        this.pointerIndex.get(idx)?.delete(actionName);
        if (this.pointerIndex.get(idx)?.size === 0) this.pointerIndex.delete(idx);
      }
    }
  }

  private setupListeners() {
    if (this.listenersSetup) return;
    // keyboard
    this.scene.input.keyboard.on('keydown', this._onKeyDown as any);
    this.scene.input.keyboard.on('keyup', this._onKeyUp as any);

    // pointer
    this.scene.input.on('pointerdown', this._onPointerDown as any);
    this.scene.input.on('pointerup', this._onPointerUp as any);

    // optional: prevent right-click menu
    this.scene.input.mouse?.disableContextMenu();
    this.listenersSetup = true;
  }

  // arrow functions because we register/unregister them
  private _onKeyDown = (e: KeyboardEvent) => {
    const key = (e.key || '').toUpperCase();
    // also consider e.code like 'Space' -> 'SPACE'
    const code = (e.code || '').toUpperCase();
    const candidates = this._expandKeyCandidates([key, code]);
    for (const k of candidates) {
      const actions = this.keyIndex.get(k);
      if (!actions) continue;
      for (const a of actions) {
        const s = this.states.get(a)!;
        if (!s.pressed) {
          s.pressed = true;
          s.justPressed = true;
          // downTime will be updated in update()
        }
      }
    }
  };

  private _onKeyUp = (e: KeyboardEvent) => {
    const key = (e.key || '').toUpperCase();
    const code = (e.code || '').toUpperCase();
    const candidates = this._expandKeyCandidates([key, code]);
    for (const k of candidates) {
      const actions = this.keyIndex.get(k);
      if (!actions) continue;
      for (const a of actions) {
        const s = this.states.get(a)!;
        if (s.pressed) {
          s.pressed = false;
          s.justReleased = true;
        }
      }
    }
  };

  private _expandKeyCandidates(base: string[]): string[] {
    const out = new Set<string>(base);
    for (const k of base) {
      // Normalize left/right variants
      if (k.endsWith('LEFT') || k.endsWith('RIGHT')) {
        out.add(k.replace(/LEFT|RIGHT$/, ''));
      }
      // Common synonyms
      if (k.includes('CONTROL')) out.add('CTRL');
      if (k === 'CONTROL') out.add('CTRL');
      if (k.includes('SHIFT')) out.add('SHIFT');
      if (k.includes('ALT')) out.add('ALT');
      // Spacebar convenience
      if (k === ' ') out.add('SPACE');
    }
    return Array.from(out);
  }

  private _onPointerDown = (p: Phaser.Input.Pointer) => {
    const idx = p.button;
    const actions = this.pointerIndex.get(idx);
    if (!actions) return;
    for (const a of actions) {
      const s = this.states.get(a)!;
      if (!s.pressed) {
        s.pressed = true;
        s.justPressed = true;
      }
    }
  };

  private _onPointerUp = (p: Phaser.Input.Pointer) => {
    const idx = p.button;
    const actions = this.pointerIndex.get(idx);
    if (!actions) return;
    for (const a of actions) {
      const s = this.states.get(a)!;
      if (s.pressed) {
        s.pressed = false;
        s.justReleased = true;
      }
    }
  };
}
