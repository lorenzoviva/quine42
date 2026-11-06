import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CAMPUS, Corona, DEVICE_MARGIN, ROOM_H, ROOM_W, fileModelOf, fileSeedOf } from '../src/kernel/corona';
import { animateRing, AVENUE_SEGMENTS, Avatars, buildCoronaRing, buildRoom, hexEdges, hexLines, outsideCircle } from '../src/render/corona3d';
import { bundledFiles } from '../src/kernel/bundle';

// T18: the campus on the ring is four times the 2D one (the circle stays): avenue, doors, buildings
// big enough for a model, alleys, lawns, a glowing edge; every door reachable from the avenue.

const R = 42;
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

// T219: the avenue is a ring between two concentric circles, and the ground meets it without gaps or overlaps.
describe('the avenue', () => {
  const kernel = (c: Corona): any => ({ corona: c, forms: { version: 1, ready: () => undefined, get: () => undefined } });
  const vertices = (m: THREE.Object3D): number[][] => {
    const a = (m as THREE.Mesh).geometry.getAttribute('position');
    return Array.from({ length: a.count }, (_, i) => [a.getX(i), a.getY(i), a.getZ(i)]);
  };
  /** The triangles of a mesh that lie flat on the ground. */
  const flatTriangles = (m: THREE.Object3D): number[][][] => {
    const v = vertices(m);
    const out: number[][][] = [];
    for (let i = 0; i < v.length; i += 3) if (v[i][1] === 0 && v[i + 1][1] === 0 && v[i + 2][1] === 0) out.push([v[i], v[i + 1], v[i + 2]]);
    return out;
  };
  const inside = (t: number[][], x: number, z: number): boolean => {
    const s = (a: number[], b: number[]) => (b[0] - a[0]) * (z - a[2]) - (b[2] - a[2]) * (x - a[0]);
    const [d0, d1, d2] = [s(t[0], t[1]), s(t[1], t[2]), s(t[2], t[0])];
    return (d0 >= 0 && d1 >= 0 && d2 >= 0) || (d0 <= 0 && d1 <= 0 && d2 <= 0);
  };

  it('has both edges on circles around the centre of the world, and no line of cells', () => {
    const c = campus();
    const ring = buildCoronaRing(kernel(c));
    const paving = flatTriangles(ring.children[0]).flat().filter((v) => Math.hypot(v[0], v[2]) < R + CAMPUS.avenue - 0.01);
    const onCircle = (r: number) => paving.filter((v) => Math.abs(Math.hypot(v[0], v[2]) - r) < 1e-4);
    // Every vertex that is not beyond the avenue stands on one of its circles.
    expect(paving.length).toBeGreaterThan(AVENUE_SEGMENTS);
    for (const v of paving) expect([R, R + CAMPUS.line].some((r) => Math.abs(Math.hypot(v[0], v[2]) - r) < 1e-4), v.join()).toBe(true);
    for (const r of [R, R + CAMPUS.line]) {
      const on = onCircle(r);
      expect(on.reduce((s, v) => s + v[0], 0) / on.length).toBeCloseTo(0, 3);
      expect(on.reduce((s, v) => s + v[2], 0) / on.length).toBeCloseTo(0, 3);
    }
    const outer = flatTriangles(ring.children[0]).flat().filter((v) => Math.abs(Math.hypot(v[0], v[2]) - (R + CAMPUS.avenue)) < 1e-4);
    expect(outer.length).toBeGreaterThanOrEqual(AVENUE_SEGMENTS);
    // What glows low over the avenue is its circles of light alone: the one along the middle and the one on the inner edge.
    for (const v of vertices(ring.children[1])) {
      const d = Math.hypot(v[0], v[2]);
      if (v[1] <= 0.02 && d < R + CAMPUS.avenue - 1) expect(Math.abs(d - (R + CAMPUS.line)) < 0.051 || d < R + 0.071, v.join()).toBe(true);
    }
  });

  it('meets the ground exactly: every point has one and only one floor', () => {
    const c = campus();
    const flat = flatTriangles(buildCoronaRing(kernel(c)).children[0]);
    for (let i = 0; i < 1500; i++) {
      const a = i * 2.399963;
      const r = R + 0.002 + ((i * 0.618034) % 1) * 9;
      const [x, z] = [Math.cos(a) * r, Math.sin(a) * r];
      const tile = c.at(Math.floor(x), Math.floor(z));
      // A plain block has no floor under it: it stands on the ground.
      if (r >= R + CAMPUS.avenue && tile?.kind === 'building') continue;
      const near = flat.filter((t) => Math.abs(t[0][0] - x) < 3 && Math.abs(t[0][2] - z) < 3);
      expect(near.filter((t) => inside(t, x, z)).length, `${x},${z} r ${r}`).toBe(1);
    }
  });

  it('cuts a cell along the circle, and leaves whole what the circle does not touch', () => {
    const area = (p: number[][]) => Math.abs(p.reduce((s, q, i) => s + q[0] * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * q[1], 0)) / 2;
    expect(outsideCircle(60, 0, 48).map(area)).toEqual([1]);
    expect(outsideCircle(10, 10, 48)).toEqual([]);
    // In every quadrant, the cell on the circle is split as the disc splits it.
    for (const [x, z] of [[33, 33], [-34, 33], [33, -34], [-34, -34]]) {
      let hits = 0;
      const n = 400;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (Math.hypot(x + (i + 0.5) / n, z + (j + 0.5) / n) >= 48) hits++;
      expect(outsideCircle(x, z, 48).reduce((s, p) => s + area(p), 0)).toBeCloseTo(hits / (n * n), 2);
    }
  });

  it('lets one walk everywhere on it: no cell the circle crosses is a hidden wall (rule 10)', () => {
    const c = campus();
    for (let i = 0; i < 3600; i++) {
      const a = (i / 3600) * Math.PI * 2;
      for (const r of [R + 0.001, R + 0.1, R + 0.3, R + 0.6, R + CAMPUS.avenue - 0.8]) {
        const [x, y] = [Math.cos(a) * r, Math.sin(a) * r];
        // A lamp post blocks its cell, and shows there.
        if (!c.propAt(Math.floor(x), Math.floor(y))) expect(c.free(x, y), `angle ${a} r ${r}`).toBe(true);
      }
    }
  });
});

// T49b: every room's device stands in the middle, with DEVICE_MARGIN free cells on every side, reachable from the door;
// the ground floor's shelves are at its sides, the files that do not fit there go upstairs.
const DEVICE_KINDS = ['showcase', 'prev', 'next', 'less', 'more', 'grafo', 'situazione', 'banco', 'leggio'];

describe('the devices of the rooms', () => {
  it('stand in the middle, the cells around them free and reachable from the door', () => {
    const c = campus();
    const rooms = c.buildings.filter((b) => b.storeys[0].items.some((i) => ['showcase', 'grafo', 'situazione', 'banco', 'leggio'].includes(i.kind)));
    expect(rooms.map((b) => b.id).sort()).toEqual(['cose', 'luoghi', 'magia', 'mondo', 'nucleo', 'oggetti', 'persone', 'sistemi', 'universo']);
    for (const b of rooms) {
      const f = b.storeys[0];
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
    const ground = b.storeys[0].items.filter((i) => i.kind === 'file');
    const show = b.storeys[0].items.find((i) => i.kind === 'showcase')!;
    expect(ground.length).toBe(24);
    expect(ground.every((i) => i.x < show.x - 1 - DEVICE_MARGIN || i.x > show.x + show.w! + DEVICE_MARGIN)).toBe(true);
    // Upstairs the whole storey holds files; none is lost.
    expect(b.storeys.length).toBe(3);
    expect(b.storeys.flatMap((f) => f.items.filter((i) => i.kind === 'file')).length).toBe(129);
    // The rooms without a device keep their full shelves on the ground floor.
    expect(c.building('galleria')!.storeys[0].items.filter((i) => i.kind === 'file').length).toBe(1);
  });

  it('builds the graph pedestal in Il Nucleo with light rims around both steps on all four faces (T58a)', () => {
    const c = campus();
    const b = c.building('nucleo')!;
    const f = b.storeys[0];
    const mockKernel: any = {
      corona: c,
      forms: { version: 0, ready: () => undefined },
      layoutSample: () => undefined,
      graph: () => ({ nodes: [], links: [] }),
    };
    const room = buildRoom(mockKernel, b, f);
    expect(room.group).toBeDefined();
    expect(room.globe).toBeDefined();

    const glowMesh = room.group.children[1] as THREE.Mesh;
    expect(glowMesh).toBeDefined();
    const pos = glowMesh.geometry.getAttribute('position');
    expect(pos).toBeDefined();

    const grafo = f.items.find((i) => i.kind === 'grafo')!;
    const cx = grafo.x + (grafo.w ?? 1) / 2, cz = grafo.y + (grafo.h ?? 1) / 2;
    // Lower step rim at y in [0.18, 0.21], outer extents cx +- 1.2, cz +- 1.2
    // Upper step rim at y in [0.42, 0.45], outer extents cx +- 0.8, cz +- 0.8
    const faces = {
      lower: { minX: 0, maxX: 0, minZ: 0, maxZ: 0 },
      upper: { minX: 0, maxX: 0, minZ: 0, maxZ: 0 },
    };
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      if (vy >= 0.179 && vy <= 0.211) {
        if (Math.abs(vx - (cx - 1.2)) < 0.05) faces.lower.minX++;
        if (Math.abs(vx - (cx + 1.2)) < 0.05) faces.lower.maxX++;
        if (Math.abs(vz - (cz - 1.2)) < 0.05) faces.lower.minZ++;
        if (Math.abs(vz - (cz + 1.2)) < 0.05) faces.lower.maxZ++;
      }
      if (vy >= 0.419 && vy <= 0.451) {
        if (Math.abs(vx - (cx - 0.8)) < 0.05) faces.upper.minX++;
        if (Math.abs(vx - (cx + 0.8)) < 0.05) faces.upper.maxX++;
        if (Math.abs(vz - (cz - 0.8)) < 0.05) faces.upper.minZ++;
        if (Math.abs(vz - (cz + 0.8)) < 0.05) faces.upper.maxZ++;
      }
    }
    // All 4 faces on lower step must have neon
    expect(faces.lower.minX).toBeGreaterThan(0);
    expect(faces.lower.maxX).toBeGreaterThan(0);
    expect(faces.lower.minZ).toBeGreaterThan(0);
    expect(faces.lower.maxZ).toBeGreaterThan(0);
    // All 4 faces on upper step must have neon
    expect(faces.upper.minX).toBeGreaterThan(0);
    expect(faces.upper.maxX).toBeGreaterThan(0);
    expect(faces.upper.minZ).toBeGreaterThan(0);
    expect(faces.upper.maxZ).toBeGreaterThan(0);
  });

  it('builds the character silo in Studio dei Personaggi with circular rims and cylindrical lid and base (T58b)', () => {
    const c = campus();
    const b = c.building('persone')!;
    const f = b.storeys[0];
    const mockKernel: any = {
      corona: c,
      forms: { version: 0, ready: () => undefined },
      layoutSample: () => undefined,
      graph: () => ({ nodes: [], links: [] }),
    };
    const room = buildRoom(mockKernel, b, f);
    expect(room.group).toBeDefined();

    const litMesh = room.group.children[0] as THREE.Mesh;
    const glowMesh = room.group.children[1] as THREE.Mesh;
    expect(litMesh).toBeDefined();
    expect(glowMesh).toBeDefined();

    const litPos = litMesh.geometry.getAttribute('position');
    const glowPos = glowMesh.geometry.getAttribute('position');
    expect(litPos).toBeDefined();
    expect(glowPos).toBeDefined();

    const show = f.items.find((i) => i.kind === 'showcase')!;
    const cx = show.x + (show.w ?? 1) / 2, cz = show.y + 0.5;

    // Verify lit geometry has vertices for lid at y in [2.56, 2.85] and base at y in [0, 0.30]
    let lidCount = 0, baseCount = 0;
    for (let i = 0; i < litPos.count; i++) {
      const vx = litPos.getX(i), vy = litPos.getY(i), vz = litPos.getZ(i);
      const r = Math.hypot(vx - cx, vz - cz);
      if (vy >= 2.55 && vy <= 2.86 && r <= 1.1) lidCount++;
      if (vy >= -0.01 && vy <= 0.31 && r <= 1.1) baseCount++;
    }
    expect(lidCount).toBeGreaterThan(0);
    expect(baseCount).toBeGreaterThan(0);

    // Verify glow geometry has circular rims near radius 0.95 at base (y in [0.29, 0.34]) and top (y in [2.52, 2.57])
    // and verify points exist in all 4 quadrants (angles around cx, cz)
    const baseQuads = [0, 0, 0, 0];
    const topQuads = [0, 0, 0, 0];
    for (let i = 0; i < glowPos.count; i++) {
      const vx = glowPos.getX(i), vy = glowPos.getY(i), vz = glowPos.getZ(i);
      const dx = vx - cx, dz = vz - cz;
      const r = Math.hypot(dx, dz);
      if (r >= 0.85 && r <= 1.0) {
        const q = (dx >= 0 ? 1 : 0) + (dz >= 0 ? 2 : 0);
        if (vy >= 0.29 && vy <= 0.34) baseQuads[q]++;
        if (vy >= 2.52 && vy <= 2.57) topQuads[q]++;
      }
    }
    for (let q = 0; q < 4; q++) {
      expect(baseQuads[q]).toBeGreaterThan(0);
      expect(topQuads[q]).toBeGreaterThan(0);
    }
  });

  it('populates campus props and sets up logistics and gerboa avatars (T50)', () => {
    const c = campus();
    expect(c.props.length).toBeGreaterThanOrEqual(44);
    const kinds = new Set(c.props.map((p) => p.kind));
    expect([...kinds].sort()).toEqual(['albero', 'lampione', 'panchina', 'totem']);

    // Solid props block their tile
    const solid = c.props.find((p) => p.solid);
    expect(solid).toBeDefined();
    expect(c.free(solid!.x, solid!.y)).toBe(false);

    // Verify buildCoronaRing creates drones and trains
    const requested: string[] = [];
    const mockKernel: any = {
      corona: c,
      forms: {
        version: 1,
        ready: (_m: string) => undefined,
        get: (m: string) => { requested.push(m); return undefined; },
      },
      archive: {
        avatars: new Map([
          ['narratore@concilio', { agent: 'narratore', name: 'Narratore', color: '#ffcf5c', sigil: '📖', building: 'concilio', x: 12, y: 8, tx: 12, ty: 8, sayUntil: 0, idleUntil: 0, speed: 3.2 }],
          ['ingegnere@sistemi', { agent: 'ingegnere', name: 'Ingegnere', color: '#b9a6ff', sigil: '⚙', building: 'sistemi', x: 5, y: 10, tx: 5, ty: 10, sayUntil: 0, idleUntil: 0, speed: 3.2 }],
        ]),
      },
    };

    const ring = buildCoronaRing(mockKernel);
    expect(ring.userData.drones).toBeDefined();
    expect(ring.userData.trains).toBeDefined();

    // animateRing runs without throwing
    expect(() => animateRing(ring, 1.5, mockKernel)).not.toThrow();

    // Avatars create and request gerboa models
    const scene = new THREE.Group();
    const avatars = new Avatars(scene);
    avatars.update(mockKernel, 0);
    expect(scene.children.length).toBe(2);
    expect(requested).toContain('corona-gerboa-narratore');
    expect(requested).toContain('corona-gerboa-ingegnere');
  });

  it('uses handmade 3D models for files on shelves (T63)', () => {
    // 1. fileModelOf mappings
    expect(fileModelOf('modules/core.carpet/logic.lua')).toBe('circuito-3D');
    expect(fileModelOf('modules/sys.physics/manifest.json')).toBe('schermo-struttura');
    expect(fileModelOf('world/rules.json')).toBe('schermo-struttura');
    expect(fileModelOf('models/tree.xml')).toBe('schermo-struttura');
    expect(fileModelOf('prompts/theme.md')).toBe('schermo-scritte');
    expect(fileModelOf('world/canone.md')).toBe('schermo-scritte');
    expect(fileModelOf('world/notes.txt')).toBe('schermo-scritte');

    // 2. fileSeedOf returns deterministic 1..4
    expect([1, 2, 3, 4]).toContain(fileSeedOf('logic.lua'));
    expect(fileSeedOf('logic.lua')).toBe(fileSeedOf('logic.lua'));

    // 3. Library registration and metadata
    const index = JSON.parse(bundledFiles['models/index.json']);
    for (const id of ['schermo-scritte', 'schermo-struttura', 'circuito-3D']) {
      expect(bundledFiles[`models/${id}.xml`], id).toBeDefined();
      expect(index[id], id).toBeDefined();
      expect(index[id].classe, id).toBe('object');
      expect(index[id].vpt, id).toBe(20);
    }

    // 4. Corona building populates items with models and seeds
    const c = campus();
    const allFiles = c.buildings.flatMap((b) => b.storeys.flatMap((f) => f.items.filter((i) => i.kind === 'file')));
    expect(allFiles.length).toBeGreaterThan(0);
    for (const f of allFiles) {
      expect(f.model).toBe(fileModelOf(f.path!));
      expect(f.seed).toBe(fileSeedOf(f.path!));
    }

    // 5. buildRoom requests models and renders them on shelves
    const requested: Array<{ model: string; seed: number }> = [];
    const b = c.buildings.find((x) => x.id === 'nucleo')!;
    const fl = b.storeys[0];
    const mockKernel: any = {
      corona: c,
      forms: {
        version: 1,
        ready: (_m: string, _s: number) => undefined,
        get: (m: string, s: number) => { requested.push({ model: m, seed: s }); return undefined; },
      },
      graph: () => ({ nodes: [], links: [] }),
    };
    const room = buildRoom(mockKernel, b, fl);
    expect(room.group).toBeDefined();
    // Files on shelves triggered get calls
    expect(requested.some((r) => r.model === 'circuito-3D' || r.model === 'schermo-struttura' || r.model === 'schermo-scritte')).toBe(true);
  });
});

describe('the hexagonal floor of the studio (T220)', () => {
  const [x0, z0, x1, z1] = [1, 1, ROOM_W - 1, ROOM_H - 1];

  it('is a lattice of hexagons: edges of one side, each once, three to a corner', () => {
    const key = (x: number, z: number) => `${x.toFixed(4)},${z.toFixed(4)}`;
    const edges = hexEdges(x0, z0, x1, z1, 1);
    const corners = new Map<string, number>();
    const seen = new Set<string>();
    for (const [ax, az, bx, bz] of edges) {
      expect(Math.hypot(bx - ax, bz - az)).toBeCloseTo(1, 9);
      const [a, b] = [key(ax, az), key(bx, bz)].sort();
      expect(seen.has(a + b)).toBe(false);
      seen.add(a + b);
      for (const [x, z] of [[ax, az], [bx, bz]]) if (x > x0 + 1 && x < x1 - 1 && z > z0 + 1 && z < z1 - 1) corners.set(key(x, z), (corners.get(key(x, z)) ?? 0) + 1);
    }
    expect(corners.size).toBeGreaterThan(50);
    for (const n of corners.values()) expect(n).toBe(3);
  });

  it('is cut clean at the sides of the floor', () => {
    const pieces = hexLines(x0, z0, x1, z1, 1, 0.01);
    expect(pieces.length).toBeGreaterThan(300);
    for (const piece of pieces)
      for (const [x, z] of piece) {
        expect(x).toBeGreaterThanOrEqual(x0 - 1e-9);
        expect(x).toBeLessThanOrEqual(x1 + 1e-9);
        expect(z).toBeGreaterThanOrEqual(z0 - 1e-9);
        expect(z).toBeLessThanOrEqual(z1 + 1e-9);
      }
    // Each line faces up: its corners turn the way of the floor quad, (x, z) -> (x, z + 1) -> (x + 1, z + 1).
    for (const p of pieces) {
      const signed = p.reduce((s, c, i) => s + c[0] * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * c[1], 0);
      expect(signed).toBeLessThan(0);
    }
    // The cost of a room: 679 triangles today, against the 370 of the square grid.
    expect(pieces.reduce((s, p) => s + p.length - 2, 0)).toBeLessThan(700);
  });
});
