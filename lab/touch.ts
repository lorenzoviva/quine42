// The labs by touch (T389): the fingers on a preview and the stick of the sandbox, over the same pure functions as the
// game (src/ui/gestures.ts, T387). A finger that drags orbits, two fingers pinch, a short touch is the click there, a long
// one the right button. Only `pointerType: 'touch'`: the mouse keeps its own handlers. The labs import src/, never the reverse.

import { SceneGestures, axesKeys, stickAxes, stickKnob, type ScreenDirection } from '../src/ui/gestures';

/** The layout of the labs on a small screen: narrow (a phone upright) or low (a phone on its side). The CSS says the same. */
export const COMPACT_QUERY = '(max-width: 900px), (max-height: 520px)';

/** What a preview does with the fingers. */
export interface PreviewTouch {
  /** One finger moved by (dx, dy) pixels since the last move. */
  orbit(dx: number, dy: number): void;
  /** Two fingers: the camera's distance times `factor` (fingers that part bring it nearer: under 1). */
  zoom(factor: number): void;
  /** A short touch at (x, y), client pixels: the click. */
  tap?(x: number, y: number): void;
  /** A long touch at (x, y): the right button. */
  press?(x: number, y: number): void;
}

/**
 * The factor the distance takes when the span of two fingers goes from `from` to `to`: `from / to`, as the game's pinch
 * (`pinchDistance`). What is not a positive number changes nothing.
 */
export function pinchFactor(from: number, to: number): number {
  return from > 0 && to > 0 && Number.isFinite(from / to) ? from / to : 1;
}

/** The fingers on `target` become `PreviewTouch`. Returns the function that detaches them. */
export function attachPreviewTouch(target: HTMLElement, on: PreviewTouch): () => void {
  const gestures = new SceneGestures();
  let last = { x: 0, y: 0 };
  let span = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  target.style.touchAction = 'none';

  const run = (list: ReturnType<SceneGestures['down']>) => {
    for (const g of list) {
      if (g.kind === 'tap') on.tap?.(g.x, g.y);
      else if (g.kind === 'press') on.press?.(g.x, g.y);
      else if (g.kind === 'orbitStart') last = { x: g.x, y: g.y };
      else if (g.kind === 'orbit') {
        on.orbit(g.x - last.x, g.y - last.y);
        last = { x: g.x, y: g.y };
      } else if (g.kind === 'pinchStart') span = g.span;
      else if (g.kind === 'pinch') {
        on.zoom(pinchFactor(span, g.span));
        span = g.span;
      }
    }
    clearTimeout(timer);
    const at = gestures.pressAt;
    if (at !== undefined) timer = setTimeout(() => run(gestures.due(performance.now())), Math.max(0, at - performance.now()) + 5);
  };
  const touch = (e: PointerEvent) => e.pointerType === 'touch';
  const down = (e: PointerEvent) => {
    if (!touch(e)) return;
    e.preventDefault();
    run(gestures.down(e.pointerId, e.clientX, e.clientY, performance.now()));
  };
  const move = (e: PointerEvent) => {
    if (touch(e)) run(gestures.move(e.pointerId, e.clientX, e.clientY, performance.now()));
  };
  const up = (e: PointerEvent) => {
    if (touch(e)) run(gestures.up(e.pointerId, performance.now(), e.type === 'pointercancel'));
  };
  const menu = (e: Event) => e.preventDefault();
  target.addEventListener('pointerdown', down);
  target.addEventListener('pointermove', move);
  target.addEventListener('pointerup', up);
  target.addEventListener('pointercancel', up);
  target.addEventListener('contextmenu', menu);
  return () => {
    clearTimeout(timer);
    gestures.reset();
    target.removeEventListener('pointerdown', down);
    target.removeEventListener('pointermove', move);
    target.removeEventListener('pointerup', up);
    target.removeEventListener('pointercancel', up);
    target.removeEventListener('contextmenu', menu);
  };
}

/** The keys a screen direction holds in the sandbox, as WASD. */
export const STICK_CODES: Record<ScreenDirection, string> = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' };

/** The codes the stick holds for a thumb displaced by (dx, dy) in a ring of `radius` pixels. */
export function stickCodes(dx: number, dy: number, radius: number): string[] {
  return axesKeys(stickAxes(dx, dy, radius)).map((d) => STICK_CODES[d]);
}

/**
 * A stick in `parent` (bottom left, shown only by the CSS of a compact page or a coarse pointer) that keeps in `keys`
 * the codes WASD would: the sandbox's loop reads them as it reads the keyboard.
 */
export function mountStick(parent: HTMLElement, keys: Set<string>): HTMLElement {
  const ring = document.createElement('div');
  ring.className = 'lab-stick';
  ring.setAttribute('aria-hidden', 'true');
  const knob = document.createElement('div');
  knob.className = 'lab-stick-knob';
  ring.append(knob);
  parent.append(ring);
  let id: number | undefined;
  let centre = { x: 0, y: 0 };
  const held = new Set<string>();
  const hold = (codes: string[]) => {
    for (const c of held) if (!codes.includes(c)) keys.delete(c);
    held.clear();
    for (const c of codes) {
      held.add(c);
      keys.add(c);
    }
  };
  const at = (e: PointerEvent) => {
    const radius = ring.clientWidth / 2;
    const dx = e.clientX - centre.x;
    const dy = e.clientY - centre.y;
    const k = stickKnob(dx, dy, radius);
    knob.style.transform = `translate(${k.x}px, ${k.y}px)`;
    hold(stickCodes(dx, dy, radius));
  };
  ring.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (id !== undefined) return;
    id = e.pointerId;
    const r = ring.getBoundingClientRect();
    centre = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    ring.setPointerCapture(e.pointerId);
    at(e);
  });
  ring.addEventListener('pointermove', (e) => {
    if (e.pointerId === id) at(e);
  });
  const end = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = undefined;
    knob.style.transform = '';
    hold([]);
  };
  ring.addEventListener('pointerup', end);
  ring.addEventListener('pointercancel', end);
  return ring;
}
