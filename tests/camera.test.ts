// The camera turns by quarter turns and the keys turn with it (ADR-0047): W always goes up the screen.
import { describe, expect, it } from 'vitest';
import { MockModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { Input } from '../src/kernel/input';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';

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
});
