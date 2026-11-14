// The game by touch (T387): the stick holds what WASD holds, a pinch zooms as the wheel within the same limits, the fingers
// on the scene become the mouse's buttons. Pure functions, a fake clock.

import { describe, expect, it } from 'vitest';
import { Input } from '../src/kernel/input';
import { pinchDistance, wheelFactor, WHEEL, ZOOM, zoomDistance } from '../src/render/camera';
import { axesKeys, SCREEN_DIRECTIONS, SceneGestures, STICK, stickAxes, stickKnob, TOUCH, type ScreenDirection } from '../src/ui/gestures';

const R = 60;
/** The stick pushed `r` pixels towards `deg` degrees on the screen (0 = right, 90 = down: y grows downwards). */
const push = (deg: number, r = R) => stickAxes(r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180), R);
const keysOf = (deg: number) => axesKeys(push(deg)).sort();

describe('la levetta', () => {
  it('dà le otto direzioni dei tasti, la più vicina al pollice', () => {
    expect(keysOf(-90)).toEqual(['up']);
    expect(keysOf(-45)).toEqual(['right', 'up']);
    expect(keysOf(0)).toEqual(['right']);
    expect(keysOf(45)).toEqual(['down', 'right']);
    expect(keysOf(90)).toEqual(['down']);
    expect(keysOf(135)).toEqual(['down', 'left']);
    expect(keysOf(180)).toEqual(['left']);
    expect(keysOf(-135)).toEqual(['left', 'up']);
    // Near a border, the nearer of the two: 20° off up is still up, 25° is the diagonal.
    expect(keysOf(-90 + 20)).toEqual(['up']);
    expect(keysOf(-90 + 25)).toEqual(['right', 'up']);
    // Axes are -1, 0, 1, never -0.
    for (let d = -180; d <= 180; d += 15) {
      const { sx, sy } = push(d);
      expect([-1, 0, 1]).toContain(sx);
      expect([-1, 0, 1]).toContain(sy);
      expect(Object.is(sx, -0) || Object.is(sy, -0)).toBe(false);
    }
  });

  it('nella zona morta, o con ciò che non è un numero, non tiene niente', () => {
    expect(push(-90, R * STICK.dead * 0.9)).toEqual({ sx: 0, sy: 0 });
    expect(push(-90, R * STICK.dead * 1.1)).toEqual({ sx: 0, sy: -1 });
    expect(stickAxes(0, 0, R)).toEqual({ sx: 0, sy: 0 });
    expect(stickAxes(Number.NaN, 10, R)).toEqual({ sx: 0, sy: 0 });
    expect(stickAxes(30, 0, 0)).toEqual({ sx: 0, sy: 0 });
    // Beyond the ring it still holds, the knob stays on the ring.
    expect(push(0, R * 3)).toEqual({ sx: 1, sy: 0 });
    expect(stickKnob(R * 3, 0, R)).toEqual({ x: R, y: 0 });
    expect(stickKnob(10, -5, R)).toEqual({ x: 10, y: -5 });
    expect(stickKnob(Number.NaN, 0, R)).toEqual({ x: 0, y: 0 });
  });

  it('tiene ciò che terrebbero i tasti: il kernel la gira nel mondo come WASD', () => {
    const world = (input: Input) => (['up', 'right', 'down', 'left'] as const).filter((d) => input.isHeld(d));
    for (const angle of [0, Math.PI / 2, 0.7, Math.PI, -2.1]) {
      for (const [deg, keys] of [
        [-90, ['up']],
        [-45, ['up', 'right']],
        [135, ['down', 'left']],
      ] as Array<[number, ScreenDirection[]]>) {
        const byStick = new Input();
        const byKeys = new Input();
        byStick.setAngle(angle);
        byKeys.setAngle(angle);
        const held = axesKeys(push(deg));
        for (const d of SCREEN_DIRECTIONS) byStick.setHeld(d, held.includes(d));
        for (const k of keys) byKeys.setHeld(k, true);
        expect(world(byStick), `${deg}° at ${angle}`).toEqual(world(byKeys));
      }
    }
  });
});

describe('il pizzico e la rotella', () => {
  it('la rotella fa ciò che faceva', () => {
    expect(wheelFactor(100)).toBe(WHEEL.out);
    expect(wheelFactor(-3)).toBe(WHEEL.in);
    expect(zoomDistance(15, wheelFactor(-1), false)).toBeCloseTo(15 * 0.89);
    expect(zoomDistance(15, wheelFactor(1), false)).toBe(ZOOM.max);
    expect(zoomDistance(42, wheelFactor(1), true)).toBe(ZOOM.freeMax);
    expect(zoomDistance(2.6, wheelFactor(-1), true)).toBe(ZOOM.min);
  });

  it('le dita che si aprono avvicinano, quelle che si chiudono allontanano, entro i limiti di oggi', () => {
    expect(pinchDistance(12, 100, 200, false)).toBeCloseTo(6);
    expect(pinchDistance(6, 200, 100, false)).toBeCloseTo(12);
    // In the simulation never beyond the default view, with the free orbit up to 45; never nearer than 2.5.
    expect(pinchDistance(12, 100, 20, false)).toBe(ZOOM.max);
    expect(pinchDistance(12, 100, 20, true)).toBe(45);
    expect(pinchDistance(12, 100, 2000, true)).toBe(ZOOM.min);
    // A span of nothing changes nothing.
    expect(pinchDistance(8, 0, 100, false)).toBe(8);
    expect(pinchDistance(8, 100, 0, false)).toBe(8);
    expect(pinchDistance(Number.NaN, 100, 100, false)).toBe(ZOOM.max);
  });
});

describe('le dita sulla scena', () => {
  it('un tocco breve è il clic, uno lungo il tasto destro', () => {
    const g = new SceneGestures();
    expect(g.down(1, 100, 80, 0)).toEqual([]);
    expect(g.move(1, 104, 83, 50)).toEqual([]); // within the slop
    expect(g.up(1, 120)).toEqual([{ kind: 'tap', x: 100, y: 80 }]);
    expect(g.active).toBe(false);

    g.down(2, 30, 40, 1000);
    expect(g.pressAt).toBe(1000 + TOUCH.longPress);
    expect(g.due(1000 + TOUCH.longPress - 1)).toEqual([]);
    expect(g.due(1000 + TOUCH.longPress)).toEqual([{ kind: 'press', x: 30, y: 40 }]);
    expect(g.due(2000)).toEqual([]); // once
    expect(g.up(2, 2100)).toEqual([]); // and no tap after it
    // A long press whose timer was late is still a long press when it lifts.
    g.down(3, 5, 5, 3000);
    expect(g.up(3, 3000 + TOUCH.longPress + 50)).toEqual([{ kind: 'press', x: 5, y: 5 }]);
    // Taken back by the browser: nothing.
    g.down(4, 5, 5, 4000);
    expect(g.up(4, 4010, true)).toEqual([]);
  });

  it('un dito trascinato gira la camera, dal punto dove ha toccato', () => {
    const g = new SceneGestures();
    g.down(1, 100, 100, 0);
    expect(g.move(1, 100 + TOUCH.slop + 5, 100, 30)).toEqual([
      { kind: 'orbitStart', x: 100, y: 100 },
      { kind: 'orbit', x: 100 + TOUCH.slop + 5, y: 100 },
    ]);
    expect(g.move(1, 160, 110, 60)).toEqual([{ kind: 'orbit', x: 160, y: 110 }]);
    expect(g.due(10_000)).toEqual([]); // a drag is never a long press
    expect(g.up(1, 90)).toEqual([{ kind: 'orbitEnd' }]);
  });

  it('due dita sono il pizzico; finché non si alzano tutte, niente altro', () => {
    const g = new SceneGestures();
    g.down(1, 100, 100, 0);
    g.move(1, 130, 100, 20); // already orbiting
    expect(g.down(2, 230, 100, 40)).toEqual([{ kind: 'orbitEnd' }, { kind: 'pinchStart', span: 100 }]);
    expect(g.move(2, 330, 100, 60)).toEqual([{ kind: 'pinch', span: 200 }]);
    expect(g.down(3, 0, 0, 70)).toEqual([]); // a third finger counts for nothing
    expect(g.up(3, 80)).toEqual([]);
    expect(g.up(2, 100)).toEqual([{ kind: 'pinchEnd' }]);
    // The finger left does not become an orbit nor a tap.
    expect(g.move(1, 300, 300, 120)).toEqual([]);
    expect(g.up(1, 140)).toEqual([]);
    // Two fingers at once, then a new gesture starts clean.
    g.down(5, 0, 0, 200);
    expect(g.down(6, 30, 40, 210)).toEqual([{ kind: 'pinchStart', span: 50 }]);
    expect(g.reset()).toEqual([{ kind: 'pinchEnd' }]);
    expect(g.active).toBe(false);
    g.down(7, 1, 1, 300);
    expect(g.up(7, 310)).toEqual([{ kind: 'tap', x: 1, y: 1 }]);
  });
});
