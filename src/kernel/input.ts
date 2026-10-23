// Keyboard input mapped to abstract actions. Physical key codes, so it works on any layout.

export type Action =
  | 'up' | 'down' | 'left' | 'right'
  | 'interact' | 'inscribe' | 'drop' | 'rollback'
  | 'prev' | 'next' | 'movePrev' | 'moveNext'
  | 'help' | 'console' | 'escape'
  | 'inventory' | 'action' | 'feed' | 'walk' | 'cast'
  | 'hot1' | 'hot2' | 'hot3' | 'hot4' | 'hot5' | 'hot6';

const HOLD: Record<string, Action> = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

const PRESS: Record<string, Action> = {
  KeyE: 'interact', Space: 'interact',
  KeyQ: 'inscribe',
  KeyT: 'cast',
  KeyX: 'drop',
  KeyR: 'rollback',
  KeyZ: 'prev',
  KeyC: 'next',
  F1: 'help', KeyH: 'help',
  F2: 'console', Backquote: 'console', Backslash: 'console',
  Escape: 'escape',
  KeyI: 'inventory', Tab: 'inventory',
  KeyF: 'action',
  KeyG: 'feed',
  KeyV: 'walk',
  Digit1: 'hot1', Digit2: 'hot2', Digit3: 'hot3', Digit4: 'hot4', Digit5: 'hot5', Digit6: 'hot6',
};

/** Directions in clockwise order: screen directions and world directions share it (ADR-0047). */
const DIRS = ['up', 'right', 'down', 'left'] as const;

export class Input {
  private held = new Set<Action>();
  /** Quarter turns of the camera (0 = from the south, 1 = from the east, …): the keys are relative to the screen. */
  turn = 0;
  onTurn?: (turn: number) => void;
  private queue: Action[] = [];
  /** When false (an overlay has focus), game actions are ignored. */
  enabled = true;
  /** The inventory panel captures input but can be closed with its own key. */
  inventoryOpen = false;
  onAny?: () => void;

  attach(target: Window): void {
    target.addEventListener('keydown', (e) => {
      this.onAny?.();
      const always = e.code === 'F1' || e.code === 'F2' || e.code === 'Escape' || (this.inventoryOpen && (e.code === 'KeyI' || e.code === 'Tab'));
      if (!this.enabled && !always) return;
      if ((e.code === 'Comma' || e.code === 'Period') && !e.repeat) {
        this.rotate(e.code === 'Comma' ? 1 : -1);
        e.preventDefault();
        return;
      }
      const hold = HOLD[e.code];
      if (hold) {
        this.held.add(hold);
        e.preventDefault();
        return;
      }
      let press = PRESS[e.code];
      if (press === 'prev' && e.shiftKey) press = 'movePrev';
      if (press === 'next' && e.shiftKey) press = 'moveNext';
      if (press && !e.repeat) {
        this.queue.push(press);
        e.preventDefault();
      }
    });
    target.addEventListener('keyup', (e) => {
      const hold = HOLD[e.code];
      if (hold) this.held.delete(hold);
    });
    target.addEventListener('blur', () => this.held.clear());
  }

  /** Whether an action is held; a world direction is held when the screen direction that points to it is. */
  isHeld(action: string): boolean {
    if (!this.enabled) return false;
    const d = DIRS.indexOf(action as (typeof DIRS)[number]);
    if (d < 0) return this.held.has(action as Action);
    return this.held.has(DIRS[(d + this.turn) % 4]);
  }

  /** Turns the camera by quarter turns (positive: it goes round counterclockwise, seen from above). */
  rotate(by: number): void {
    this.setTurn(this.turn + by);
  }

  setTurn(turn: number): void {
    const t = (((Math.round(turn) % 4) + 4) % 4) || 0;
    if (t === this.turn) return;
    this.turn = t;
    this.onTurn?.(t);
  }

  /** Programmatic hold (tests, touch controls). */
  setHeld(action: Action, down: boolean): void {
    if (down) this.held.add(action);
    else this.held.delete(action);
  }

  push(action: Action): void {
    this.queue.push(action);
  }

  drain(): Action[] {
    const q = this.queue;
    this.queue = [];
    return q;
  }

  releaseAll(): void {
    this.held.clear();
  }
}
