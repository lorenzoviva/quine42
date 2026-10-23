// T28: the Nucleus, inside. The graph of the world (ADR-0045) stands on a pedestal on its ground floor; E or a
// click opens it, navigable; its layout (src/ui/graphlayout.ts) is deterministic and puts what is linked close.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { ForceLayout } from '../src/ui/graphlayout';
import { EDGE_NAME, NODE_COLOR, NODE_NAME } from '../src/kernel/graph';

const boot = () => Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });

function stand(k: Kernel, x: number, y: number): void {
  Object.assign(k.playerPos(), { x, y });
  k.zone = 'studio';
}

/** The layout of a graph's nodes and edges, by index. */
function layoutOf(k: Kernel) {
  const g = k.graph();
  const ids = [...g.nodes.keys()];
  const ix = new Map(ids.map((id, i) => [id, i]));
  const links = g.links.map((l) => [ix.get(l.source)!, ix.get(l.target)!] as const);
  return { ids, links, layout: new ForceLayout(ids.length, links).run() };
}

describe('the Nucleus', () => {
  it('has the graph of the world on its ground floor, with room around it', async () => {
    const k = await boot();
    const b = k.corona.building('nucleo')!;
    const f = b.floors[0];
    const g = f.items.find((i) => i.kind === 'grafo')!;
    expect(g.label).toBe('il grafo del mondo');
    // Only in the Nucleus.
    expect(k.corona.buildings.filter((x) => x.floors.some((fl) => fl.items.some((i) => i.kind === 'grafo'))).map((x) => x.id)).toEqual(['nucleo']);
    const [w, h] = [g.w!, g.h!];
    for (let x = g.x - 1; x <= g.x + w; x++)
      for (let y = g.y - 1; y <= g.y + h; y++) {
        const inside = x >= g.x && x < g.x + w && y >= g.y && y < g.y + h;
        const here = f.items.filter((i) => y >= i.y && y < i.y + (i.h ?? 1) && x >= i.x && x < i.x + (i.w ?? 1));
        // Its cells are its own and block; the ring around it is free to walk.
        if (inside) {
          expect(here, `${x},${y}`).toEqual([g]);
          expect(k.corona.free(x + 0.5, y + 0.5)).toBe(false);
        } else expect(k.corona.free(x + 0.5, y + 0.5), `${x},${y}`).toBe(true);
      }
  });

  it('opens with E in front of it or a click within reach', async () => {
    const k = await boot();
    const g = k.corona.building('nucleo')!.floors[0].items.find((i) => i.kind === 'grafo')!;
    const opened: unknown[] = [];
    k.bus.on('ui:graph', (e) => opened.push(e));
    stand(k, g.x + 1.5, g.y + g.h! + 0.5);
    await k.interact();
    expect(opened.length).toBe(1);
    expect(k.clickStudio(g.x + 1.5, g.y + 1.5)).toBe(true);
    expect(opened.length).toBe(2);
    // Too far: nothing.
    stand(k, g.x + 1.5, g.y + g.h! + 5.5);
    expect(k.clickStudio(g.x + 1.5, g.y + 1.5)).toBe(false);
    expect(opened.length).toBe(2);
  });

  it('lays the graph out the same way every time, linked nodes close, none on top of another', async () => {
    const k = await boot();
    const a = layoutOf(k);
    const b = layoutOf(k);
    expect(a.ids.length).toBeGreaterThan(50);
    expect([...a.layout.x]).toEqual([...b.layout.x]);
    expect([...a.layout.y]).toEqual([...b.layout.y]);
    const { x, y } = a.layout;
    expect([...x, ...y].every(Number.isFinite)).toBe(true);
    const dist = (i: number, j: number) => Math.hypot(x[i] - x[j], y[i] - y[j]);
    const edge = a.links.reduce((s, [i, j]) => s + dist(i, j), 0) / a.links.length;
    let pairs = 0;
    let far = 0;
    let closest = Infinity;
    for (let i = 0; i < a.ids.length; i++)
      for (let j = i + 1; j < a.ids.length; j++) {
        far += dist(i, j);
        pairs++;
        closest = Math.min(closest, dist(i, j));
      }
    expect(edge * 3).toBeLessThan(far / pairs);
    expect(closest).toBeGreaterThan(3);
  });

  it('has a colour and a name for every kind of node and edge', () => {
    expect(Object.keys(NODE_NAME).sort()).toEqual(Object.keys(NODE_COLOR).sort());
    for (const c of Object.values(NODE_COLOR)) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    expect(Object.keys(EDGE_NAME).length).toBe(15);
  });

  it('lays out a graph of thousands of nodes in a few seconds', () => {
    // A tree of 2000 nodes with some cross links, like a big universe.
    const n = 2000;
    const links: Array<[number, number]> = [];
    for (let i = 1; i < n; i++) links.push([Math.floor((i - 1) / 4), i]);
    for (let i = 0; i < 400; i++) links.push([(i * 7919) % n, (i * 104729 + 13) % n]);
    const t = performance.now();
    const l = new ForceLayout(n, links).run();
    expect(performance.now() - t).toBeLessThan(4000);
    expect([...l.x].every(Number.isFinite)).toBe(true);
  });
});
