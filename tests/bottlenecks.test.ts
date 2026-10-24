// T56a: niente cose solide sui passaggi obbligati (regola 10).
// Il piazzamento delle cose (placementsOf / placeInside) non mette nulla di solido
// su una casella la cui chiusura separerebbe il luogo (punto di articolazione del grafo delle caselle libere).

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { articulationPoints, gates, layout } from '../src/kernel/layout';
import type { ChunkPlan } from '../src/kernel/agents/cartography';
import type { TileDef } from '../src/kernel/types';

describe('articulationPoints (algoritmo di Tarjan per caselle libere)', () => {
  const S = 18;

  it('un sentiero lineare: tutti i punti interni sono punti di articolazione', () => {
    // 5 celle in riga: (2,5), (3,5), (4,5), (5,5), (6,5)
    const row = 5;
    const cells = new Set<number>([
      row * S + 2,
      row * S + 3,
      row * S + 4,
      row * S + 5,
      row * S + 6,
    ]);
    const arts = articulationPoints(cells, S);
    // Gli estremi (2,5) e (6,5) sono foglie; i tre nodi interni (3,5), (4,5), (5,5) sono punti di articolazione
    expect(arts.has(row * S + 2)).toBe(false);
    expect(arts.has(row * S + 3)).toBe(true);
    expect(arts.has(row * S + 4)).toBe(true);
    expect(arts.has(row * S + 5)).toBe(true);
    expect(arts.has(row * S + 6)).toBe(false);
    expect(arts.size).toBe(3);
  });

  it('un ciclo 2×2: nessun punto di articolazione', () => {
    const cells = new Set<number>([
      1 * S + 1,
      1 * S + 2,
      2 * S + 1,
      2 * S + 2,
    ]);
    const arts = articulationPoints(cells, S);
    expect(arts.size).toBe(0);
  });

  it('un ciclo 2×2 con una casella attaccata a un angolo: l angolo di giunzione e un punto di articolazione', () => {
    // Ciclo (1,1), (1,2), (2,1), (2,2) con appendice (1,3) collegata a (1,2)
    const cells = new Set<number>([
      1 * S + 1,
      1 * S + 2,
      2 * S + 1,
      2 * S + 2,
      1 * S + 3,
    ]);
    const arts = articulationPoints(cells, S);
    expect(arts.has(1 * S + 2)).toBe(true);
    expect(arts.size).toBe(1);
  });

  it('una giunzione a T: il centro e un punto di articolazione', () => {
    // Centro a (3,3), bracci a (3,2), (3,4), (2,3)
    const center = 3 * S + 3;
    const cells = new Set<number>([
      center,
      3 * S + 2,
      3 * S + 4,
      2 * S + 3,
    ]);
    const arts = articulationPoints(cells, S);
    expect(arts.has(center)).toBe(true);
    expect(arts.size).toBe(1);
  });

  it('un grafo con <= 2 celle non ha punti di articolazione', () => {
    expect(articulationPoints(new Set<number>(), S).size).toBe(0);
    expect(articulationPoints(new Set<number>([10]), S).size).toBe(0);
    expect(articulationPoints(new Set<number>([10, 11]), S).size).toBe(0);
  });
});

describe('T56a: niente cose solide sui passaggi obbligati', () => {
  const S = 18;

  const palette: Record<string, TileDef> = {
    p: { name: 'sentiero', color: '#c8a868', solid: false, layer: 'ground' },
    w: { name: 'acqua', color: '#3a78c8', solid: true, layer: 'liquid' },
  };

  it('un luogo con un unico sentiero largo uno non ha cose solide sul sentiero', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
    const cx = 10, cy = 10;
    const g = gates(cx, cy, S, k.config.seed);
    const westGate = g[0];
    const eastGate = g[1];

    const westRow = Math.floor(westGate / S);
    const eastRow = Math.floor(eastGate / S);

    // Bozza: tutto lago (w), tranne un unico sentiero largo 1 che connette westGate e eastGate
    const draftRows: string[] = [];
    for (let r = 0; r < S; r++) {
      let row = '';
      for (let c = 0; c < S; c++) {
        const cell = r * S + c;
        if (cell === westGate || cell === eastGate) row += 'p';
        else if (r === westRow && c < S / 2) row += 'p';
        else if (c === Math.floor(S / 2) && ((r >= westRow && r <= eastRow) || (r >= eastRow && r <= westRow))) row += 'p';
        else if (r === eastRow && c >= S / 2) row += 'p';
        else row += 'w';
      }
      draftRows.push(row);
    }

    const res = layout(draftRows, palette, { cx, cy, seed: k.config.seed, pathCode: 'p' });
    expect(res.reachable.size).toBeGreaterThan(0);

    // Piano con diversi oggetti solidi del gioco (banco, cassa, letto, cartello)
    const plan: ChunkPlan = {
      place: { name: 'Ponte sul Lago', description: 'Una passerella sottile attraversa le acque.' },
      layout: 'passerella',
      objects: [
        { module: 'obj.banco', where: 'fuori' },
        { module: 'obj.cassa', where: 'fuori' },
        { module: 'obj.letto', where: 'ovunque' },
        { module: 'object.sign', where: 'ovunque' },
      ],
      ground: ['Mela rossa'],
      fresh: [],
      runes: [],
    };

    const place = (k as any).placementsOf({ cx, cy, key: `${cx},${cy}` }, plan, res);

    // Nessun oggetto solido deve essere piazzato sul sentiero unico
    for (const obj of place.objects) {
      expect(obj.cell, `l'oggetto solido ${plan.objects[obj.index].module} non deve essere piazzato su un collo di bottiglia`).toBeUndefined();
    }

    // Le cose non solide a terra (ground) possono invece essere piazzate
    expect(place.ground[0].cell).toBeDefined();

    // Verifichiamo anche applicando il piano a un chunk vero
    const ch = {
      cx,
      cy,
      key: `${cx},${cy}`,
      draft: draftRows.join(''),
      tiles: draftRows.join(''),
      buildings: [],
      stage: 'draft' as const,
      version: 0,
    };
    (k as any).applyPlan(ch, plan);

    // Verifichiamo che nel chunk non esista alcuna entità solida piazzata
    const solidInChunk = k.ecs.query('body', 'chunk', 'pos').filter((id) => {
      if (k.ecs.get(id, 'chunk')?.key !== ch.key) return false;
      return k.ecs.get(id, 'body')?.solid;
    });
    expect(solidInChunk).toHaveLength(0);

    // E tutte le celle del sentiero devono essere perfettamente libere e attraversabili
    for (const cell of res.reachable) {
      const col = cx * S + (cell % S);
      const row = cy * S + Math.floor(cell / S);
      expect(k.free(col + 0.5, row + 0.5, 0.2)).toBe(true);
    }
  });

  it('gli oggetti solidi vengono piazzati negli slarghi o nicchie fuori dal sentiero obbligato', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
    const cx = 11, cy = 11;
    const g = gates(cx, cy, S, 456);
    const westGate = g[0];
    const westRow = Math.floor(westGate / S);

    // Sentiero da ovest a est sulla riga westRow, con una nicchia cieca di 1 cella a (5, westRow + 1)
    const draftRows: string[] = [];
    for (let r = 0; r < S; r++) {
      let row = '';
      for (let c = 0; c < S; c++) {
        if (r === westRow) row += 'p';
        else if (r === westRow + 1 && c === 5) row += 'p'; // nicchia cieca
        else row += 'w';
      }
      draftRows.push(row);
    }

    const res = layout(draftRows, palette, { cx, cy, seed: 456, pathCode: 'p' });
    const nicheCell = (westRow + 1) * S + 5;
    expect(res.reachable.has(nicheCell)).toBe(true);

    const plan: ChunkPlan = {
      place: { name: 'Molo con Nicchia', description: 'Un sentiero con una banchina laterale.' },
      layout: 'lago',
      objects: [
        { module: 'obj.cassa', where: 'fuori' },
      ],
      ground: [],
      fresh: [],
      runes: [],
    };

    const place = (k as any).placementsOf({ cx, cy, key: `${cx},${cy}` }, plan, res);

    // La cassa solida viene piazzata, e precisamente nella nicchia cieca (che non è punto di articolazione)!
    expect(place.objects[0].cell).toBe(nicheCell);

    // Il sentiero principale sulla riga westRow rimane completamente libero
    for (let c = 0; c < S; c++) {
      expect(place.objects[0].cell).not.toBe(westRow * S + c);
    }
  });

  it('placeInside non piazza oggetti solidi a ridosso della porta della struttura', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
    for (let i = 0; i < 80; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 25));
      if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
    }
    const ch = k.chunks.get('0,0')!;
    const structures: number[] = [];
    for (const id of k.ecs.query('struttura', 'origin')) {
      const m = new RegExp(`^${ch.key}#s(\\d+)$`).exec(k.ecs.get(id, 'origin').key);
      if (m) structures[Number(m[1])] = id;
    }
    const sid = structures.find((id) => id !== undefined)!;
    const b = ch.buildings[0];
    const door = b.doors[0];
    const doorX = ch.cx * S + (door % S) + 0.5;
    const doorY = ch.cy * S + Math.floor(door / S) + 0.5;

    const placed: Array<{ x: number; y: number }> = [];
    const fallback = { x: 1e6, y: 1e6 };
    for (let n = 0; n < 8; n++) {
      await (k as any).placeInside(ch, sid, fallback, (x: number, y: number) => placed.push({ x, y }), true);
    }
    for (const p of placed) {
      if (p.x !== fallback.x) {
        expect(Math.hypot(p.x - doorX, p.y - doorY)).toBeGreaterThanOrEqual(1.2);
      }
    }
  });
});

