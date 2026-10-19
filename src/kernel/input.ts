// Keyboard input mapped to abstract actions. Physical key codes, so it works on any layout.

export type Action =
  | 'up' | 'down' | 'left' | 'right'
  | 'interact' | 'inscribe' | 'drop' | 'rollback'
  | 'prev' | 'next' | 'movePrev' | 'moveNext'
  | 'help' | 'console' | 'escape';

const HOLD: Record<string, Action> = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

const PRESS: Record<string, Action> = {
  KeyE: 'interact', Space: 'interact',
  KeyQ: 'inscribe',
  KeyX: 'drop',
  KeyR: 'rollback',
  KeyZ: 'prev',
  KeyC: 'next',
  F1: 'help', KeyH: 'help',
  F2: 'console', Backquote: 'console', Backslash: 'console',
  Escape: 'escape',
};

export class Input {
  private held = new Set<Action>();
  private queue: Action[] = [];
  /** When false (an overlay has focus), game actions are ignored. */
  enabled = true;
  onAny?: () => void;

  attach(target: Window): void {
    target.addEventListener('keydown', (e) => {
      this.onAny?.();
      const always = e.code === 'F1' || e.code === 'F2' || e.code === 'Escape';
      if (!this.enabled && !always) return;
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

  isHeld(action: string): boolean {
    return this.enabled && this.held.has(action as Action);
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
