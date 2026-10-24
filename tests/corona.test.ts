import { describe, expect, it } from 'vitest';
import { CAMPUS, Corona, DEVICE_MARGIN, ROOM_H, ROOM_W } from '../src/kernel/corona';

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

// T49b: every room's device stands in the middle, with DEVICE_MARGIN free cells on every side, reachable from the door;
// the ground floor's shelves are at its sides, the files that do not fit there go upstairs.
const DEVICE_KINDS = ['showcase', 'prev', 'next', 'less', 'more', 'grafo', 'situazione', 'banco'];

describe('the devices of the rooms', () => {
  it('stand in the middle, the cells around them free and reachable from the door', () => {
    const c = campus();
    const rooms = c.buildings.filter((b) => b.floors[0].items.some((i) => ['showcase', 'grafo', 'situazione', 'banco'].includes(i.kind)));
    expect(rooms.map((b) => b.id).sort()).toEqual(['cose', 'luoghi', 'magia', 'nucleo', 'oggetti', 'persone', 'sistemi', 'universo']);
    for (const b of rooms) {
      const f = b.floors[0];
      const device = f.items.filter((i) => DEVICE_KINDS.includes(i.kind) && (i.kind !== 'prev' && i.kind !== 'next' || i.target !== 'tempo'));
      const x0 = Math.min(...device.map((i) => i.x)) - f.ox, x1 = Math.max(...device.map((i) => i.x + (i.w ?? 1) - 1)) - f.ox;
      const y0 = Math.min(...device.map((i) => i.y)) - f.oy, y1 = Math.max(...device.map((i) => i.y + (i.h ?? 1) - 1)) - f.oy;
      // Centred on the exit's column, the margin inside the room.
      expect((x0 + x1) / 2, b.id).toBe(ROOM_W / 2);
      expect(x0 - DEVICE_MARGIN, b.id).toBeGreaterThanOrEqual(1);
      expect(y0 - DEVICE_MARGIN, b.id).toBeGreaterThanOrEqual(1);
      expect(x1 + DEVICE_MARGIN, b.id).toBeLessThanOrEqual(ROOM_W - 2);
      expect(y1 + DEVICE_MARGIN, b.id).toBeLessThanOrEqual(ROOM_H - 2);
      // Everything that can be walked is reached from the door.
      const start = c.entrance(b);
      const seen = new Set<string>([`${Math.floor(start.x)},${Math.floor(start.y)}`]);
      const queue = [[Math.floor(start.x), Math.floor(start.y)]];
      while (queue.length) {
        const [x, y] = queue.shift()!;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const key = `${x + dx},${y + dy}`;
          if (!seen.has(key) && c.free(x + dx + 0.5, y + dy + 0.5)) seen.add(key), queue.push([x + dx, y + dy]);
        }
      }
      for (let y = y0 - DEVICE_MARGIN; y <= y1 + DEVICE_MARGIN; y++)
        for (let x = x0 - DEVICE_MARGIN; x <= x1 + DEVICE_MARGIN; x++) {
          const here = f.items.filter((i) => f.oy + y >= i.y && f.oy + y < i.y + (i.h ?? 1) && f.ox + x >= i.x && f.ox + x < i.x + (i.w ?? 1));
          if (here.length && here.every((i) => device.includes(i))) continue;
          expect(here.map((i) => i.kind), `${b.id} ${x},${y}`).toEqual([]);
          expect(seen.has(`${f.ox + x},${f.oy + y}`), `${b.id} ${x},${y}`).toBe(true);
        }
    }
  });

  it('keep the ground floor\'s shelves at their sides, the other files upstairs', () => {
    const many: Record<string, string> = { ...files };
    for (let i = 0; i < 128; i++) many[`modules/npc.p${String(i).padStart(3, '0')}/manifest.json`] = '{}';
    const c = new Corona(R);
    c.build(many);
    const b = c.building('persone')!;
    const ground = b.floors[0].items.filter((i) => i.kind === 'file');
    const show = b.floors[0].items.find((i) => i.kind === 'showcase')!;
    expect(ground.length).toBe(24);
    expect(ground.every((i) => i.x < show.x - 1 - DEVICE_MARGIN || i.x > show.x + show.w! + DEVICE_MARGIN)).toBe(true);
    // Upstairs the whole floor holds files; none is lost.
    expect(b.floors.length).toBe(3);
    expect(b.floors.flatMap((f) => f.items.filter((i) => i.kind === 'file')).length).toBe(129);
    // The rooms without a device keep their full shelves on the ground floor.
    expect(c.building('galleria')!.floors[0].items.filter((i) => i.kind === 'file').length).toBe(1);
  });
});
