// T260 (ADR-0136): the kernel's version X.Y.Z, the universes it opens, and the effect nobody applies.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import type { FileMap } from '../src/kernel/types';
import { checkKernelVersion, KERNEL_VERSION, parseVersion, stampKernel } from '../src/kernel/version';

const boot = (files: FileMap) => Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
const withKernel = (v: unknown): FileMap => {
  const u = JSON.parse(bundledFiles['universe.json']);
  if (v === undefined) delete u.kernel;
  else u.kernel = v;
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
    expect(stampKernel('{"name":"x","kernel":"0.1.3"}', '0.1.3')).toBeUndefined();
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
    const k = await boot(withKernel('0.2.0'));
    expect(k.faults.get('universe:kernel')?.message).toMatch(/0\.2\.0.*0\.1\.0/);
    const saved = k.saveFile('world/prova.txt', 'x\n');
    expect(saved.committed).toBe(false);
    expect(JSON.parse(k.repo.working['universe.json']).kernel).toBe('0.2.0');
  });

  it('that does not say it gets the field at its next commit', async () => {
    const k = await boot(withKernel(undefined));
    expect(k.faults.has('universe:kernel')).toBe(false);
    k.repo.write('world/prova.txt', 'x\n');
    k.repo.commit('prova', 'player');
    expect(JSON.parse(k.repo.head().files['universe.json']).kernel).toBe(KERNEL_VERSION);
  });
});

describe('an effect that nobody applies', () => {
  it('is a fault that names it, not a silence', async () => {
    const k = await boot(bundledFiles);
    k.applyEffects([{ tipo: 'vento' } as any], k.wandererEntity);
    expect(k.faults.get('effect:vento')?.message).toMatch(/vento.*non ha chi lo applica/);
  });

  it('the effects of the seed are all applied by someone, and none is a fault', async () => {
    const k = await boot(bundledFiles);
    k.applyEffects([{ tipo: 'messaggio', testo: 'ciao' } as any, { tipo: 'legame', legame: 'amico' } as any, { tipo: 'stato', nome: 'bagnato', durata: 5 } as any], k.wandererEntity);
    expect(k.faults.list().filter((f) => f.key.startsWith('effect:'))).toEqual([]);
  });

  it('a core.effects written before `handles` is trusted with the effects of the first contract only', async () => {
    const old = bundledFiles['modules/core.effects/logic.lua'].replace(/-- Se un effetto ha chi lo applica[\s\S]*?\nend\n\n/, '');
    expect(old).not.toContain('M.handles');
    const k = await boot({ ...bundledFiles, 'modules/core.effects/logic.lua': old });
    expect(k.applyEffects([{ tipo: 'messaggio', testo: 'ciao' } as any], k.wandererEntity)).toEqual(['ciao']);
    k.applyEffects([{ tipo: 'vento' } as any], k.wandererEntity);
    expect(k.faults.has('effect:vento')).toBe(true);
  });

  it('without core.effects, every effect that is not the kernel’s is a fault', async () => {
    const files = Object.fromEntries(Object.entries(bundledFiles).filter(([p]) => !p.startsWith('modules/core.effects/')));
    const k = await boot(files);
    k.applyEffects([{ tipo: 'messaggio', testo: 'ciao' } as any, { tipo: 'legame', legame: 'amico' } as any]);
    expect(k.faults.has('effect:messaggio')).toBe(true);
    expect(k.faults.has('effect:legame')).toBe(false);
  });
});
