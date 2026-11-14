// The game by touch (T387), the part that is only arithmetic: the virtual stick → the same screen axes as WASD, and the
// fingers on the scene → a tap (the left button), a long press (the right button), a drag (the orbit of the middle
// button) or a pinch (the wheel). No DOM, no clock of its own: src/ui/touch.ts gives the positions and the times.

/** The four screen directions the keys hold (`Input`, src/kernel/input.ts): the stick holds the same ones. */
export type ScreenDirection = 'up' | 'down' | 'left' | 'right';
export const SCREEN_DIRECTIONS: readonly ScreenDirection[] = ['up', 'down', 'left', 'right'];

/** The stick: under `dead` (a fraction of its radius) the thumb rests and nothing is held. */
export const STICK = { dead: 0.25 } as const;

/** What the fingers on the scene need to become a gesture: how far they move before it is a drag, how long a long press lasts. */
export const TOUCH = { slop: 10, longPress: 500 } as const;

/**
 * The stick's displacement (screen pixels, y downwards) → the screen axes, each -1, 0 or 1: one of the eight directions
 * two keys give (W, W+D, D…), the nearest to the thumb, so the kernel turns it into the world as it turns WASD. Within the
 * dead zone, or for what is not a number, nothing.
 */
export function stickAxes(dx: number, dy: number, radius: number, dead: number = STICK.dead): { sx: number; sy: number } {
  const r = Math.hypot(dx, dy);
  if (!Number.isFinite(r) || !(radius > 0) || r < dead * radius || r === 0) return { sx: 0, sy: 0 };
  const sector = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  const a = (sector * Math.PI) / 4;
  return { sx: Math.round(Math.cos(a)) || 0, sy: Math.round(Math.sin(a)) || 0 };
}

/** The screen axes → the directions held, as the keys hold them (W is up, S down, A left, D right). */
export function axesKeys({ sx, sy }: { sx: number; sy: number }): ScreenDirection[] {
  const out: ScreenDirection[] = [];
  if (sy < 0) out.push('up');
  if (sy > 0) out.push('down');
  if (sx < 0) out.push('left');
  if (sx > 0) out.push('right');
  return out;
}

/** Where the stick's knob is drawn: under the thumb, but never out of the stick's ring. */
export function stickKnob(dx: number, dy: number, radius: number): { x: number; y: number } {
  const r = Math.hypot(dx, dy);
  if (!Number.isFinite(r) || r === 0 || !(radius > 0)) return { x: 0, y: 0 };
  const k = Math.min(1, radius / r);
  return { x: dx * k, y: dy * k };
}

/** What the fingers on the scene mean, in the order they happen. */
export type SceneGesture =
  /** A short touch without moving: the left button there. */
  | { kind: 'tap'; x: number; y: number }
  /** A long touch without moving: the right button there. */
  | { kind: 'press'; x: number; y: number }
  /** One finger that moves: the middle button dragged, from where it touched. */
  | { kind: 'orbitStart'; x: number; y: number }
  | { kind: 'orbit'; x: number; y: number }
  | { kind: 'orbitEnd' }
  /** Two fingers: their span, from when the second touched. */
  | { kind: 'pinchStart'; span: number }
  | { kind: 'pinch'; span: number }
  | { kind: 'pinchEnd' };

type Mode = 'idle' | 'pending' | 'orbit' | 'pinch' | 'spent';

/**
 * The fingers on the scene, one gesture at a time. A finger that touches waits (`pending`): it becomes a tap if it lifts
 * soon, a long press if it stays `TOUCH.longPress` ms, an orbit if it moves more than `TOUCH.slop` pixels. A second finger
 * turns whatever the first was doing into a pinch. Once a gesture has ended (`spent`) nothing more happens until every
 * finger has lifted: a pinch that loses a finger does not become an orbit, a long press does not become a tap.
 */
export class SceneGestures {
  private points = new Map<number, { x: number; y: number }>();
  private mode: Mode = 'idle';
  private first = -1;
  private pair: [number, number] = [-1, -1];
  private start = { x: 0, y: 0, t: 0 };

  /** Whether a finger is on the scene. */
  get active(): boolean {
    return this.points.size > 0;
  }

  /** When the finger that waits becomes a long press, if one waits. */
  get pressAt(): number | undefined {
    return this.mode === 'pending' ? this.start.t + TOUCH.longPress : undefined;
  }

  down(id: number, x: number, y: number, t: number): SceneGesture[] {
    this.points.set(id, { x, y });
    if (this.points.size === 1) {
      this.mode = 'pending';
      this.first = id;
      this.start = { x, y, t };
      return [];
    }
    if (this.points.size === 2 && (this.mode === 'pending' || this.mode === 'orbit')) {
      const out: SceneGesture[] = this.mode === 'orbit' ? [{ kind: 'orbitEnd' }] : [];
      this.mode = 'pinch';
      this.pair = [this.first, id];
      out.push({ kind: 'pinchStart', span: this.span() });
      return out;
    }
    return [];
  }

  move(id: number, x: number, y: number, _t: number): SceneGesture[] {
    const p = this.points.get(id);
    if (!p) return [];
    p.x = x;
    p.y = y;
    if (this.mode === 'pending' && id === this.first) {
      if (Math.hypot(x - this.start.x, y - this.start.y) <= TOUCH.slop) return [];
      this.mode = 'orbit';
      return [{ kind: 'orbitStart', x: this.start.x, y: this.start.y }, { kind: 'orbit', x, y }];
    }
    if (this.mode === 'orbit' && id === this.first) return [{ kind: 'orbit', x, y }];
    if (this.mode === 'pinch' && this.pair.includes(id)) return [{ kind: 'pinch', span: this.span() }];
    return [];
  }

  /** A finger lifts, or the browser takes it back (`cancel`: no tap, no long press). */
  up(id: number, t: number, cancel = false): SceneGesture[] {
    if (!this.points.delete(id)) return [];
    let out: SceneGesture[] = [];
    if (this.mode === 'pending' && id === this.first) {
      if (!cancel) out = [{ kind: t - this.start.t >= TOUCH.longPress ? 'press' : 'tap', x: this.start.x, y: this.start.y }];
      this.mode = 'spent';
    } else if (this.mode === 'orbit' && id === this.first) {
      out = [{ kind: 'orbitEnd' }];
      this.mode = 'spent';
    } else if (this.mode === 'pinch' && this.pair.includes(id)) {
      out = [{ kind: 'pinchEnd' }];
      this.mode = 'spent';
    }
    if (this.points.size === 0) this.mode = 'idle';
    return out;
  }

  /** The time has come for the finger that waits: a long press, once. */
  due(t: number): SceneGesture[] {
    if (this.mode !== 'pending' || t - this.start.t < TOUCH.longPress) return [];
    this.mode = 'spent';
    return [{ kind: 'press', x: this.start.x, y: this.start.y }];
  }

  /** Every finger forgotten (the page hidden, the scene covered): what was going on ends. */
  reset(): SceneGesture[] {
    const out: SceneGesture[] = this.mode === 'orbit' ? [{ kind: 'orbitEnd' }] : this.mode === 'pinch' ? [{ kind: 'pinchEnd' }] : [];
    this.points.clear();
    this.mode = 'idle';
    return out;
  }

  private span(): number {
    const a = this.points.get(this.pair[0]);
    const b = this.points.get(this.pair[1]);
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }
}
