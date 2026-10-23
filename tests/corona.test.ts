import { describe, expect, it } from 'vitest';
import { CAMPUS, Corona } from '../src/kernel/corona';

// T18: the campus on the ring is four times the 2D one (the circle stays): avenue, doors, buildings
// big enough for a model, alleys, lawns, a glowing edge; every door reachable from the avenue.

const R = 44;
const files: Record<string, string> = {};
for (const p of ['core.effects', 'sys.physics', 'world.forest', 'items.base', 'obj.well', 'npc.smith', 'magic.runes', 'misc.other'])
  files[`modules/${p}/manifest.json`] = '{}';
Object.assign(files, { 'prompts/theme.md': '', 'models/index.json': '{}', 'world/bible.json': '{}', 'universe.json': '{}' });

function campus(): Corona {
  const c = new Corona(R);
  c.build(files, [{ label: 'un modello', path: 'models/x.xml', target: 'x' }], [{ label: 'erba', path: 'modules/world.forest/manifest.json', target: 'g' }]);
  return c;
}

describe('the corona campus', () => {
  it('is four times deeper than the 2D one, the circle unchanged', () => {
    const c = campus();
    expect(c.radius).toBe(R);
    expect(c.outer).toBe(R + 36);
    expect(c.inRing(R + 30, 0)).toBe(true);
    expect(c.inRing(R - 1, 0)).toBe(false);
  });

  it('gives every building a block big enough for a model, with its door towards the avenue', () => {
    const c = campus();
    expect(c.buildings.length).toBeGreaterThan(8);
    for (const b of c.buildings) {
      const pts = [...b.cells].map((k) => k.split(',').map(Number));
      const radii = pts.map(([x, y]) => Math.hypot(x + 0.5, y + 0.5));
      expect(Math.max(...radii) - Math.min(...radii), b.id).toBeGreaterThan(14);
      expect(b.cells.size, b.id).toBeGreaterThan(200);
      expect(c.at(b.door.x, b.door.y)?.kind, b.id).toBe('door');
      const exit = c.exitPoint(b);
      expect(c.free(exit.x, exit.y), b.id).toBe(true);
      expect(c.at(Math.floor(exit.x), Math.floor(exit.y))?.ground, b.id).toBe('viale');
      expect(c.doorNear(b.door.x + 0.5, b.door.y + 0.5)?.id).toBe(b.id);
    }
  });

  it('has an avenue, alleys, lawns and an edge, and every door is reachable from the avenue', () => {
    const c = campus();
    const grounds = new Set<string>();
    const max = Math.ceil(c.outer) + 1;
    for (let y = -max; y < max; y++) for (let x = -max; x < max; x++) {
      const g = c.at(x, y)?.ground;
      if (g) grounds.add(g);
    }
    expect([...grounds].sort()).toEqual(['bordo', 'prato', 'viale', 'vicolo']);
    // Flood the walkable outside cells from the avenue in front of the first door.
    const start = c.exitPoint(c.buildings[0]);
    const seen = new Set<string>([`${Math.floor(start.x)},${Math.floor(start.y)}`]);
    const todo = [[Math.floor(start.x), Math.floor(start.y)]];
    while (todo.length) {
      const [x, y] = todo.pop()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${x + dx},${y + dy}`;
        if (seen.has(k) || !c.free(x + dx + 0.5, y + dy + 0.5)) continue;
        seen.add(k);
        todo.push([x + dx, y + dy]);
      }
    }
    for (const b of c.buildings) expect(seen.has(`${b.door.x},${b.door.y}`), b.id).toBe(true);
    // The lawns behind the buildings are reachable too, by the alleys.
    const back = c.buildings[0];
    const mid = (back.from + back.to) / 2;
    const behind = { x: Math.floor(Math.sin(mid) * (R + CAMPUS.back + 4)), y: Math.floor(-Math.cos(mid) * (R + CAMPUS.back + 4)) };
    expect(seen.has(`${behind.x},${behind.y}`)).toBe(true);
  });
});
