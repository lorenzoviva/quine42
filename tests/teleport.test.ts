import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { applyTeleport, teleportTarget } from '../src/kernel/teleport';
import type { FileMap } from '../src/kernel/types';

const boot = (files: FileMap) => Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
const round = (p: { x: number; y: number }) => ({ x: Math.round(p.x * 1000) / 1000, y: Math.round(p.y * 1000) / 1000 });

/** A page load as main.ts does it: boot from what was saved, the teleport if the URL asks for it, then pagehide. */
async function load(files: FileMap, search: string) {
  const k = await boot(files);
  const tp = teleportTarget(new URLSearchParams(search), true);
  if (tp) applyTeleport(k, tp);
  const arrived = round(k.wandererCarpet());
  expect(k.saveState()).toBe(true);
  return { arrived, saved: k.repo.head().files, k };
}

describe('?dev&teleport porta sempre allo stesso punto (T264)', () => {
  it('legge X,Y solo in sviluppo e solo se sono due numeri', () => {
    const q = (s: string) => new URLSearchParams(s);
    expect(teleportTarget(q('dev&teleport=46,0'), true)).toEqual({ x: 46, y: 0 });
    expect(teleportTarget(q('teleport=-3.5,12'), true)).toEqual({ x: -3.5, y: 12 });
    expect(teleportTarget(q('teleport=46,0'), false)).toBeUndefined();
    for (const bad of ['teleport=46', 'teleport=46,', 'teleport=a,0', 'teleport=1,2,3', 'teleport=', 'dev']) expect(teleportTarget(q(bad), true)).toBeUndefined();
  });

  it('due caricamenti di teleport=46,0 chiusi bene arrivano allo stesso punto', async () => {
    const first = await load(bundledFiles, 'dev&teleport=46,0');
    expect(first.arrived).toEqual({ x: 46, y: 0 });
    const second = await load(first.saved, 'dev&teleport=46,0');
    expect(second.arrived).toEqual({ x: 46, y: 0 });
    const third = await load(second.saved, 'dev&teleport=46,0');
    expect(third.arrived).toEqual({ x: 46, y: 0 });
    expect(third.k.wandererPos()).toMatchObject({ x: 46, y: 0 });
    expect(third.k.carpet()).toMatchObject({ active: false, ox: 0, oy: 0 });
  }, 60_000);

  it('senza teleport si riparte dov\'era: lo scostamento salvato vale come prima', async () => {
    const there = await load(bundledFiles, 'dev&teleport=46,0');
    const back = await load(there.saved, 'dev');
    expect(back.arrived).toEqual({ x: 46, y: 0 });
    const offset = back.k.offset();
    expect(Math.hypot(offset.ox, offset.oy)).toBeGreaterThan(0);
    const again = await load(back.saved, '');
    expect(again.arrived).toEqual({ x: 46, y: 0 });
  }, 60_000);
});
