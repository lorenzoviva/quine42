// T260 (ADR-0136): the kernel's version X.Y.Z, the universes it opens, and the effect nobody applies.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { upgradeFromSeed } from '../src/kernel/universes';
import type { FileMap } from '../src/kernel/types';
import { migrateUniverse, migrationPath, MIGRATIONS, type Migration } from '../src/kernel/migrations';
import { checkKernelVersion, KERNEL_VERSION, parseContract, parseVersion, rangeLabel, stampKernel, universeKernels } from '../src/kernel/version';

const boot = (files: FileMap) => Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
const withKernel = (v: unknown, kernels?: unknown): FileMap => {
  const u = JSON.parse(bundledFiles['universe.json']);
  if (v === undefined) delete u.kernel;
  else u.kernel = v;
  if (kernels === undefined) delete u.kernels;
  else u.kernels = kernels;
  return { ...bundledFiles, 'universe.json': JSON.stringify(u, null, 2) + '\n' };
};

describe('the version of the kernel', () => {
  it('is the one of package.json, and the seed says it', () => {
    expect(JSON.parse(readFileSync('package.json', 'utf8')).version).toBe(KERNEL_VERSION);
    expect(JSON.parse(bundledFiles['universe.json']).kernel).toBe(KERNEL_VERSION);
    expect(parseVersion(KERNEL_VERSION)).toBeDefined();
  });

  it('reads X.Y.Z with plain numbers only', () => {
    expect(parseVersion('0.1.0')).toEqual({ major: 0, minor: 1, patch: 0 });
    expect(parseVersion('1.12.304')).toEqual({ major: 1, minor: 12, patch: 304 });
    for (const bad of ['1.0', '01.1.0', 'v0.1.0', '0.1.0-beta', '', 3, null, '0.1.x']) expect(parseVersion(bad)).toBeUndefined();
  });
});

describe('checkKernelVersion', () => {
  it('the same X.Y with a Z not above the kernel is compatible', () => {
    expect(checkKernelVersion('0.1.0', '0.1.0').ok).toBe(true);
    expect(checkKernelVersion('0.1.2', '0.1.5').ok).toBe(true);
    expect(checkKernelVersion('1.3.0', '1.3.9').ok).toBe(true);
  });

  it('a universe that does not say it is of the first contract, 0.1', () => {
    expect(checkKernelVersion(undefined, '0.1.7').ok).toBe(true);
    expect(checkKernelVersion(undefined, '0.2.0').ok).toBe(false);
  });

  it('another X.Y is refused, saying both versions and what to do', () => {
    for (const [u, k] of [['0.1.0', '0.2.0'], ['0.2.0', '0.1.0'], ['0.9.0', '1.0.0'], ['1.0.0', '0.9.0']]) {
      const r = checkKernelVersion(u, k);
      expect(r.ok).toBe(false);
      expect(r.motivo).toContain(u);
      expect(r.motivo).toContain(k);
      expect(r.motivo).toMatch(/universo nuovo/);
    }
  });

  it('a universe newer than the kernel (Z above) is refused', () => {
    const r = checkKernelVersion('0.1.4', '0.1.3');
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/più nuovo/);
  });

  it('what is not a version is refused, never read as one', () => {
    expect(checkKernelVersion('latest', '0.1.0').ok).toBe(false);
    expect(checkKernelVersion(1, '0.1.0').ok).toBe(false);
  });
});

describe('stampKernel', () => {
  it('writes this kernel in a compatible universe, and nothing when it is already there', () => {
    expect(JSON.parse(stampKernel('{"name":"x"}', '0.1.3')!).kernel).toBe('0.1.3');
    expect(JSON.parse(stampKernel('{"name":"x","kernel":"0.1.1"}', '0.1.3')!).kernel).toBe('0.1.3');
    expect(stampKernel('{"name":"x","kernel":"0.1.3","kernels":{"from":"0.1"}}', '0.1.3')).toBeUndefined();
  });

  it('never writes an incompatible universe as if it were ours, nor a file it cannot read', () => {
    expect(stampKernel('{"name":"x","kernel":"0.2.0"}', '0.1.3')).toBeUndefined();
    expect(stampKernel('{"name":"x","kernel":"0.1.4"}', '0.1.3')).toBeUndefined();
    expect(stampKernel('{ rotto', '0.1.3')).toBeUndefined();
    expect(stampKernel(undefined, '0.1.3')).toBeUndefined();
  });
});

describe('a universe at boot', () => {
  it('of this kernel opens with no fault', async () => {
    const k = await boot(bundledFiles);
    expect(k.faults.has('universe:kernel')).toBe(false);
  });

  it('of another contract opens standing, with a fault that says why, and is never committed as ours', async () => {
    const k = await boot(withKernel('0.9.0'));
    expect(k.faults.get('universe:kernel')?.message).toContain(`del kernel 0.9.0, il kernel è il ${KERNEL_VERSION}`);
    const saved = k.saveFile('world/prova.txt', 'x\n');
    expect(saved.committed).toBe(false);
    expect(JSON.parse(k.repo.working['universe.json']).kernel).toBe('0.9.0');
  });

  it('that does not say it gets the field at its next commit', async () => {
    const k = await boot(withKernel(undefined));
    expect(k.faults.has('universe:kernel')).toBe(false);
    k.repo.write('world/prova.txt', 'x\n');
    k.repo.commit('prova', 'player');
    expect(JSON.parse(k.repo.head().files['universe.json']).kernel).toBe(KERNEL_VERSION);
  });
});

describe('the range of the kernels a universe runs on (T302)', () => {
  const contract = KERNEL_VERSION.split('.').slice(0, 2).join('.');

  it('the seed says it, open, from this kernel’s contract', () => {
    expect(JSON.parse(bundledFiles['universe.json']).kernels).toEqual({ from: contract });
    expect(universeKernels(JSON.parse(bundledFiles['universe.json'])).kernels?.label).toBe(`kernel ${contract}–${contract}`);
  });

  it('reads X.Y with plain numbers only', () => {
    expect(parseContract('0.1')).toEqual({ major: 0, minor: 1 });
    for (const bad of ['0.1.0', '01.1', '0.x', '', 1, null]) expect(parseContract(bad)).toBeUndefined();
  });

  it('a universe without the field takes it from `kernel`, and one without either is of 0.1', () => {
    expect(universeKernels({ kernel: '0.1.5' }).kernels).toMatchObject({ range: { from: { major: 0, minor: 1 } }, label: 'kernel 0.1–0.1' });
    expect(universeKernels({ kernel: '0.3.2' }).kernels?.label).toBe('kernel 0.3–0.3');
    expect(universeKernels({}).kernels?.label).toBe('kernel 0.1–0.1');
  });

  it('open, it reaches the contract of the kernel that wrote it; closed, its `to`', () => {
    expect(universeKernels({ kernel: '0.2.4', kernels: { from: '0.1' } }).kernels?.label).toBe('kernel 0.1–0.2');
    expect(universeKernels({ kernel: '0.2.4', kernels: { from: '0.1', to: '0.3' } }).kernels?.label).toBe('kernel 0.1–0.3');
    expect(checkKernelVersion('0.2.4', '0.2.9', { from: '0.1' }).ok).toBe(true);
    expect(checkKernelVersion('0.2.4', '0.3.0', { from: '0.1', to: '0.3' }).ok).toBe(true);
    expect(checkKernelVersion('0.2.4', '0.3.0', { from: '0.1' }).ok).toBe(false);
    // The range looks forward: written by a newer kernel, a universe never opens on an older one.
    expect(checkKernelVersion('0.2.0', '0.1.9', { from: '0.1' })).toMatchObject({ ok: false, etichetta: 'kernel 0.2.0 o successivo', motivo: expect.stringMatching(/più nuovo/) });
    expect(checkKernelVersion('0.2.4', '0.1.9', { from: '0.1', to: '0.3' }).ok).toBe(false);
  });

  it('what is not a range, or does not hold the kernel that wrote it, is refused with the reason', () => {
    for (const bad of ['0.1', { from: '0.1.0' }, { to: '0.2' }, { from: '0.1', to: 'x' }, [], null]) {
      expect(checkKernelVersion('0.1.3', '0.1.3', bad)).toMatchObject({ ok: false, motivo: expect.stringMatching(/kernels non è un intervallo/) });
    }
    expect(checkKernelVersion('0.1.3', '0.1.3', { from: '0.2' })).toMatchObject({ ok: false, motivo: expect.stringMatching(/non contiene il kernel che l'ha scritto/) });
    expect(checkKernelVersion('0.3.0', '0.3.0', { from: '0.1', to: '0.2' }).ok).toBe(false);
  });

  it('out of the range: the fault says the range, and the places that choose a universe show its label', () => {
    const newer = checkKernelVersion('0.1.5', '0.2.0', { from: '0.1' });
    expect(newer).toMatchObject({ ok: false, etichetta: 'kernel 0.1–0.1' });
    expect(newer.motivo).toContain('gira sui kernel 0.1–0.1');
    expect(newer.motivo).toMatch(/server della versione 0\.1$/);
    const older = checkKernelVersion('0.3.1', '0.2.0', { from: '0.3' });
    expect(older).toMatchObject({ ok: false, etichetta: 'kernel 0.3–0.3' });
    expect(older.motivo).toMatch(/server della versione 0\.3$/);
    expect(rangeLabel({ kernel: '0.1.5', kernels: { from: '0.1' } }, '0.2.0')).toBe('kernel 0.1–0.1');
    expect(rangeLabel({ kernel: '0.1.5', kernels: { from: '0.1' } }, '0.1.9')).toBeUndefined();
    expect(rangeLabel({ kernel: 'rotto' }, '0.1.9')).toBe('kernel ?');
  });

  it('the kernel writes it at its next commit, from the contract the universe was born with, right after `kernel`', () => {
    const stamped = JSON.parse(stampKernel('{"name":"x","kernel":"0.1.1","seed":3}', '0.1.3')!);
    expect(Object.keys(stamped)).toEqual(['name', 'kernel', 'kernels', 'seed']);
    expect(stamped.kernels).toEqual({ from: '0.1' });
    expect(JSON.parse(stampKernel('{"name":"x","kernel":"0.1.3"}', '0.1.3')!).kernels).toEqual({ from: '0.1' });
    // A range already written is kept as it is.
    expect(JSON.parse(stampKernel('{"name":"x","kernel":"0.1.1","kernels":{"from":"0.0"}}', '0.1.3')!).kernels).toEqual({ from: '0.0' });
    expect(stampKernel('{"name":"x","kernel":"0.1.3","kernels":{"from":"0.1"}}', '0.1.3')).toBeUndefined();
    expect(stampKernel('{"name":"x","kernel":"0.1.3","kernels":"0.1"}', '0.1.3')).toBeUndefined();
  });

  it('a universe out of the range opens standing with its label in the fault, and nothing is written on it', async () => {
    const k = await boot(withKernel('0.0.4', { from: '0.0' }));
    expect(k.faults.get('universe:kernel')?.message).toContain('gira sui kernel 0.0–0.0');
    k.repo.write('world/prova.txt', 'x\n');
    expect(k.saveFile('world/prova.txt', 'y\n').committed).toBe(false);
    expect(JSON.parse(k.repo.working['universe.json'])).toMatchObject({ kernel: '0.0.4', kernels: { from: '0.0' } });
  });

  it('a universe out of the range takes nothing from the seed, one in the range takes what it always took', () => {
    const seed = { ...bundledFiles, 'modules/nuovo/manifest.json': '{"id":"nuovo","kind":"data"}' };
    const out = withKernel('0.0.4', { from: '0.0' });
    expect(upgradeFromSeed(out, seed)).toEqual({ files: out, changes: {}, updated: [] });
    expect(upgradeFromSeed(withKernel('0.7.0'), seed).updated).toContain('modules/nuovo/manifest.json');
    // One of a contract before takes nothing either, until it is ported (prepareUniverse, T307a, T307b, T308a, T308b, T342, T310b).
    expect(upgradeFromSeed(withKernel('0.1.2'), seed).updated).toEqual([]);
    expect(upgradeFromSeed(withKernel('0.2.1'), seed).updated).toEqual([]);
    expect(upgradeFromSeed(withKernel('0.3.0'), seed).updated).toEqual([]);
    expect(upgradeFromSeed(withKernel('0.4.0'), seed).updated).toEqual([]);
    expect(upgradeFromSeed(withKernel('0.5.10'), seed).updated).toEqual([]);
    expect(upgradeFromSeed(withKernel('0.6.12'), seed).updated).toEqual([]);
  });

  it('a universe without the field opens as before, and gets it at its next commit; one of 0.1 is ported, born again with 0.7', async () => {
    const k = await boot(withKernel('0.7.0'));
    expect(k.faults.has('universe:kernel')).toBe(false);
    k.repo.write('world/prova.txt', 'x\n');
    k.repo.commit('prova', 'player');
    expect(JSON.parse(k.repo.head().files['universe.json'])).toMatchObject({ kernel: KERNEL_VERSION, kernels: { from: '0.7' } });
    const old = await boot(withKernel('0.1.2'));
    expect(old.faults.has('universe:kernel')).toBe(false);
    expect(JSON.parse(old.repo.working['universe.json'])).toMatchObject({ kernel: KERNEL_VERSION, kernels: { from: '0.7' } });
  });
});

describe('the migrations (T302): one place, three migrations today (T307a, T307b, T308a)', () => {
  const at = (kernel: string, kernels?: unknown): FileMap => ({ 'universe.json': JSON.stringify({ name: 'x', kernel, ...(kernels ? { kernels } : {}) }), 'world/a.txt': 'a' });
  const step = (from: string, to: string): Migration => ({ from, to, descrizione: `da ${from} a ${to}`, migrate: (f) => ({ ...f, 'world/a.txt': `${f['world/a.txt']}>${to}` }) });

  it('there are six, 0.1 → 0.2 → 0.3 → 0.4 → 0.5 → 0.6 → 0.7; a universe they do not reach, of this contract or unreadable stays as it is', () => {
    expect(MIGRATIONS.map((m) => `${m.from}→${m.to}`)).toEqual(['0.1→0.2', '0.2→0.3', '0.3→0.4', '0.4→0.5', '0.5→0.6', '0.6→0.7']);
    expect(migrateUniverse(at('0.1.1', { from: '0.1' })).applied).toHaveLength(6);
    expect(migrateUniverse(at('0.2.1', { from: '0.2' })).applied).toHaveLength(5);
    expect(migrateUniverse(at('0.3.0', { from: '0.3' })).applied).toHaveLength(4);
    expect(migrateUniverse(at('0.4.0', { from: '0.4' })).applied).toHaveLength(3);
    expect(migrateUniverse(at('0.5.10', { from: '0.5' })).applied).toHaveLength(2);
    expect(migrateUniverse(at('0.6.12', { from: '0.6' })).applied).toHaveLength(1);
    for (const files of [at('0.0.3'), at(KERNEL_VERSION, { from: '0.7' }), at('9.9.9'), { 'universe.json': '{ rotto' }, {}]) {
      const r = migrateUniverse(files);
      expect(r.applied).toEqual([]);
      expect(r.files).toBe(files);
    }
  });

  it('with a chain, a universe of an older contract is ported step by step and says it was born again with this contract', () => {
    const list = [step('0.1', '0.2'), step('0.2', '0.3')];
    expect(migrationPath(parseContract('0.1')!, parseContract('0.3')!, list)?.map((m) => m.to)).toEqual(['0.2', '0.3']);
    expect(migrationPath(parseContract('0.1')!, parseContract('0.4')!, list)).toBeUndefined();
    const r = migrateUniverse(at('0.1.7', { from: '0.1' }), '0.3.0', list);
    expect(r.applied).toEqual(['0.1→0.2: da 0.1 a 0.2', '0.2→0.3: da 0.2 a 0.3']);
    expect(r.files['world/a.txt']).toBe('a>0.2>0.3');
    expect(JSON.parse(r.files['universe.json'])).toMatchObject({ kernel: '0.3.0', kernels: { from: '0.3' } });
    expect(checkKernelVersion('0.3.0', '0.3.0', { from: '0.3' }).ok).toBe(true);
  });

  it('a universe in the range, or newer than the kernel, is never migrated', () => {
    const list = [step('0.1', '0.2')];
    const mine = at('0.2.0', { from: '0.1', to: '0.2' });
    expect(migrateUniverse(mine, '0.2.1', list).files).toBe(mine);
    const newer = at('0.3.0');
    expect(migrateUniverse(newer, '0.2.1', list).files).toBe(newer);
  });
});

describe('an effect that nobody applies', () => {
  it('is a fault that names it, not a silence', async () => {
    const k = await boot(bundledFiles);
    k.applyEffects([{ type: 'vento' } as any], k.wandererEntity);
    expect(k.faults.get('effect:vento')?.message).toMatch(/vento.*non ha chi lo applica/);
  });

  it('the effects of the seed are all applied by someone, and none is a fault', async () => {
    const k = await boot(bundledFiles);
    k.applyEffects([{ type: 'message', text: 'ciao' } as any, { type: 'bond', bond: 'amico' } as any, { type: 'state', name: 'bagnato', duration: 5 } as any], k.wandererEntity);
    expect(k.faults.list().filter((f) => f.key.startsWith('effect:'))).toEqual([]);
  });

  it('a core.effects written before `handles` knew only the Italian effects of 0.1: since 0.2 it is trusted with none (T307a)', async () => {
    const old = bundledFiles['modules/core.effects/logic.lua'].replace(/-- Whether an effect has someone applying it[\s\S]*?\nend\n\n/, '');
    expect(old).not.toContain('M.handles');
    const k = await boot({ ...bundledFiles, 'modules/core.effects/logic.lua': old });
    expect(k.applyEffects([{ type: 'message', text: 'ciao' } as any], k.wandererEntity)).toEqual([]);
    expect(k.faults.has('effect:message')).toBe(true);
  });

  it('without core.effects, every effect that is not the kernel’s is a fault', async () => {
    const files = Object.fromEntries(Object.entries(bundledFiles).filter(([p]) => !p.startsWith('modules/core.effects/')));
    const k = await boot(files);
    k.applyEffects([{ type: 'message', text: 'ciao' } as any, { type: 'bond', bond: 'amico' } as any]);
    expect(k.faults.has('effect:message')).toBe(true);
    expect(k.faults.has('effect:bond')).toBe(false);
  });
});
