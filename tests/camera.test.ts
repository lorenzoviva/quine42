// The camera turns freely or by quarter turns and the keys turn with it (ADR-0047, T55): W always goes up the screen.
import { describe, expect, it } from 'vitest';
import { MockModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { Input } from '../src/kernel/input';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { Renderer } from '../src/render/renderer';

describe('camera turns', () => {
  it('maps the screen directions to the world directions of each quarter turn', () => {
    const input = new Input();
    input.setHeld('up', true);
    const world = () => (['up', 'right', 'down', 'left'] as const).filter((d) => input.isHeld(d));
    expect(world()).toEqual(['up']);
    input.rotate(1); // from the east: up the screen is west
    expect(world()).toEqual(['left']);
    input.rotate(1); // from the north
    expect(world()).toEqual(['down']);
    input.rotate(1); // from the west
    expect(world()).toEqual(['right']);
    input.rotate(1);
    expect(input.turn).toBe(0);
    input.rotate(-1);
    expect(input.turn).toBe(3);
    input.setTurn(-5); // any number, wrapped
    expect(input.turn).toBe(3);
    expect(input.isHeld('walk')).toBe(false);
  });

  it('tells the renderer when it turns, once per change', () => {
    const input = new Input();
    const seen: number[] = [];
    input.onTurn = (t) => seen.push(t);
    input.setTurn(1);
    input.setTurn(1);
    input.setTurn(2);
    expect(seen).toEqual([1, 2]);
  });

  it('the wanderer walks where the screen says, whatever the turn', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
    k.input.setTurn(1); // the camera is east of the wanderer: right on the screen is north
    const before = { ...k.playerPos() };
    k.input.setHeld('right', true);
    for (let i = 0; i < 6; i++) k.tick(1 / 60);
    k.input.setHeld('right', false);
    expect(k.playerComp().facing).toBe('up');
    expect(Math.abs(k.playerPos().x - before.x)).toBeLessThan(0.01); // nothing sideways
    k.input.setTurn(0);
  });

  it('maps screen directions to world directions for arbitrary continuous angles', () => {
    const input = new Input();
    input.setHeld('up', true);
    const world = () => (['up', 'right', 'down', 'left'] as const).filter((d) => input.isHeld(d));

    // At 45 degrees: up on screen points North-West in world (up and left)
    input.setAngle(Math.PI / 4);
    expect(world()).toEqual(['up', 'left']);

    // At -45 degrees (-PI/4): up on screen points North-East in world (up and right)
    input.setAngle(-Math.PI / 4);
    expect(world()).toEqual(['up', 'right']);

    // At 135 degrees (3*PI/4): up on screen points South-West in world (down and left)
    input.setAngle((3 * Math.PI) / 4);
    expect(world()).toEqual(['down', 'left']);

    // At 180 degrees (PI): up on screen points South in world (down)
    input.setAngle(Math.PI);
    expect(world()).toEqual(['down']);
  });

  it('returns to a quarter turn with comma/period rotate', () => {
    const input = new Input();
    input.setAngle(0.5); // continuous angle between 0 and PI/2
    expect(input.turn).toBe(0);
    input.rotate(1); // comma key rotates to next quarter turn
    expect(input.turn).toBe(1);
    expect(input.angle).toBeCloseTo(Math.PI / 2);

    input.setAngle(1.2); // continuous angle near PI/2
    expect(input.turn).toBe(1);
    input.rotate(-1); // period key rotates to previous quarter turn
    expect(input.turn).toBe(0);
    expect(input.angle).toBeCloseTo(0);
  });

  it('the wanderer walks diagonally when angle is 45 degrees', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
    k.input.setAngle(Math.PI / 4);
    const before = { ...k.playerPos() };
    k.input.setHeld('up', true);
    for (let i = 0; i < 6; i++) k.tick(1 / 60);
    k.input.setHeld('up', false);
    // Walks North-West (both -x and -y)
    expect(k.playerPos().x).toBeLessThan(before.x);
    expect(k.playerPos().y).toBeLessThan(before.y);
  });

  it('zoom constraints in simulation vs god mode/corona', () => {
    const view: any = {
      distance: 15,
      godMode: false,
      kernel: { zone: 'sim', coronaRevealed: () => false, playerPos: () => ({ x: 0, y: 0 }), config: { circleRadius: 42 } },
      fitView: () => {},
      canFreeOrbit: Renderer.prototype.canFreeOrbit,
      zoom: Renderer.prototype.zoom,
    };

    // Immersed in simulation: can zoom in, but cannot zoom out beyond 15
    expect(view.canFreeOrbit()).toBe(false);
    view.zoom(100); // try zoom out
    expect(view.distance).toBe(15); // capped at 15

    view.zoom(-100); // zoom in
    expect(view.distance).toBeLessThan(15);
    expect(view.distance).toBeCloseTo(15 * 0.89);

    // Zoom out back to 15 (clamped)
    view.zoom(100);
    view.zoom(100);
    expect(view.distance).toBe(15);

    // In god mode: can zoom out far up to 45
    view.godMode = true;
    expect(view.canFreeOrbit()).toBe(true);
    view.zoom(100);
    expect(view.distance).toBeGreaterThan(15);
    for (let i = 0; i < 20; i++) view.zoom(100);
    expect(view.distance).toBe(45); // clamped to 45
  });
});
