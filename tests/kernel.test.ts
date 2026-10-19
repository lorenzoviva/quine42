import { beforeEach, describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockProvider } from '../src/kernel/gateway/mock';

const DT = 1 / 60;

async function boot() {
  const provider = new MockProvider();
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), provider });
  return k;
}

function run(k: Kernel, seconds: number) {
  for (let t = 0; t < seconds; t += DT) k.tick(DT);
}

const settle = () => new Promise((r) => setTimeout(r, 150));

/** Moves the player next to a run of free cells and faces right, so inscriptions always fit. */
function clearArea(k: Kernel, width = 24) {
  const { ox, oy } = k.offset();
  const free = (c: number, r: number) => (k as any).freeCell(c, r) && !k.runeCells.has(`${c},${r}`) && k.tileAt(c, r) !== undefined;
  for (let d = 0; d < 20; d++)
    for (const row of [d, -d]) {
      for (let col = -20; col < 0; col++) {
        let ok = true;
        for (let i = 0; i <= width && ok; i++) ok = free(col + i, row);
        if (!ok) continue;
        const p = k.playerPos();
        p.x = col + 0.5 - ox;
        p.y = row + 0.5 - oy;
        k.playerComp().facing = 'right';
        k.carpet()!.active = false;
        k.tick(DT);
        k.carpet()!.active = true;
        return;
      }
    }
  throw new Error('nessuno spazio libero trovato');
}

describe('kernel', () => {
  let k: Kernel;
  beforeEach(async () => {
    k = await boot();
    k.tick(DT);
    await settle();
    k.tick(DT);
  });

  it('boots the bundled universe without faults', () => {
    expect(k.faults.list()).toEqual([]);
    expect(k.modules.size).toBeGreaterThanOrEqual(9);
    expect(k.repo.head().message).toBe('genesi');
    expect(k.chunks.size).toBeGreaterThan(0);
  });

  it('generated runes are valid live code', () => {
    expect(k.lines.size).toBeGreaterThan(0);
    for (const st of k.lines.values()) expect(st.compiled).toBe(true);
  });

  it('the carpet keeps the player at the centre', () => {
    k.input.setHeld('right', true);
    run(k, 6);
    k.input.setHeld('right', false);
    const p = k.playerPos();
    expect(Math.abs(p.x)).toBeLessThan(2);
    expect(k.offset().ox).toBeGreaterThan(5);
    expect(k.zone).toBe('sim');
  });

  it('runes that stop the carpet let the player reach the corona', () => {
    clearArea(k);
    expect(k.inscribe(['carpet', '.', 'active', '=', 'false'])).toBe(true);
    run(k, DT * 2);
    expect(k.carpet()!.active).toBe(false);
    expect(k.faults.size).toBe(0);
    // Walk straight out: teleport along the walk to avoid depending on terrain layout.
    k.playerPos().x = k.config.circleRadius + 0.5;
    run(k, DT * 2);
    expect(k.zone).toBe('corona');
  });

  it('a broken phrase breaks the world; rollback repairs it and returns the runes', () => {
    clearArea(k);
    k.inscribe(['carpet', '.', 'strength', '=']);
    run(k, DT * 2);
    expect(k.faults.list().some((f) => f.key.startsWith('rune:'))).toBe(true);
    expect(k.brokenness()).toBeGreaterThan(0);
    k.rollback();
    run(k, DT * 2);
    expect(k.faults.size).toBe(0);
    expect(k.hand().tokens).toEqual(['carpet', '.', 'strength', '=']);
  });

  it('severing a binding breaks the system that depends on it', () => {
    clearArea(k);
    k.inscribe(['carpet', '=', 'nil']);
    run(k, DT * 3);
    expect(k.faults.has('module:core.carpet:update')).toBe(true);
    k.rollback();
    run(k, DT * 2);
    expect(k.faults.size).toBe(0);
  });

  it('the kernel survives absurd values', () => {
    clearArea(k);
    k.inscribe(['carpet', '.', 'ox', '=', 'nil']);
    run(k, DT * 2);
    expect(Number.isFinite(k.offset().ox)).toBe(true);
    expect(k.faults.has('kernel:sanitize')).toBe(true);
  });

  it('valid edits are hot reloaded and committed; invalid ones are refused unless forced', () => {
    const path = 'modules/core.carpet/logic.lua';
    const bad = k.saveFile(path, 'local M = {} function M.update( return M');
    expect(bad.written).toBe(false);
    expect(bad.errors.length).toBeGreaterThan(0);

    const forced = k.saveFile(path, 'local M = {} function M.update( return M', true);
    expect(forced.committed).toBe(false);
    expect(k.faults.has('module:core.carpet:load')).toBe(true);
    k.rollback();
    expect(k.faults.size).toBe(0);

    const good = k.saveFile(path, k.files[path].replace('carpet.strength *', '0.5 * carpet.strength *'));
    expect(good.committed).toBe(true);
    expect(k.repo.head().message).toContain(path);
  });

  it('the agent writes a validated module that spawns in the world', async () => {
    const r = await k.askAgent('un fabbro che parla di spade');
    expect(r.ok).toBe(true);
    expect(k.modules.has('npc.fabbro')).toBe(true);
    expect(k.repo.head().author).toBe('agent');
  });

  it('the corona maps every universe file', () => {
    const files = Object.keys(k.files);
    const R = k.config.circleRadius;
    const seen = new Set<string>();
    for (let y = -k.corona.outer; y < k.corona.outer; y++)
      for (let x = -k.corona.outer; x < k.corona.outer; x++) {
        const c = k.corona.at(x, y);
        if (c?.path) seen.add(c.path);
        if (c) expect(Math.hypot(x + 0.5, y + 0.5)).toBeGreaterThanOrEqual(R);
      }
    expect([...seen].sort()).toEqual(files.sort());
  });
});
