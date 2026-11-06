// T312 (ADR-0156): a universe out of the range of the kernels it runs on is read-only. Nothing reaches its repository (commits, plans,
// branches, merges, rollbacks on the disk) and the Council does not call the models; a universe of this kernel writes as before.

import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { bundledFiles } from '../src/kernel/bundle';
import type { ChunkRecord, ChunkStore } from '../src/kernel/chunks';
import { Kernel, READ_ONLY_WORDS } from '../src/kernel/kernel';
import { opensOnThisKernel } from '../src/kernel/migrations';
import { memoryStore } from '../src/kernel/repo';
import type { FileMap } from '../src/kernel/types';
import type { UniverseBackend } from '../src/kernel/universes';
import { KERNEL_VERSION, runsOnThisKernel } from '../src/kernel/version';

class CountingModels extends MockAiModels {
  calls: string[] = [];
  override async text(call: TextCall): Promise<string> {
    this.calls.push(call.task);
    return super.text(call);
  }
}

/** A universe repository on disk that only writes down what it is asked. */
function diskOf() {
  const writes: string[] = [];
  const backend: UniverseBackend = {
    name: 'prova',
    listMaps: async () => [],
    commit: async (_c, message) => (writes.push(`commit ${message}`), 'abc1234'),
    checkout: async (id) => (writes.push(`checkout ${id}`), { ...bundledFiles }),
    reset: async () => undefined,
    branch: async (name) => (writes.push(`branch ${name}`), 'abc1234'),
    readBranch: async () => null,
    merge: async (name) => void writes.push(`merge ${name}`),
  };
  const plans = new Map<string, ChunkRecord>();
  const chunks: ChunkStore = {
    load: async (key) => plans.get(key),
    save: async (key, record) => {
      writes.push(`piano ${key}`);
      plans.set(key, record);
    },
    clear: async () => plans.clear(),
  };
  return { writes, backend, chunks, plans };
}

const withKernel = (v: string, kernels?: unknown): FileMap => {
  const u = JSON.parse(bundledFiles['universe.json']);
  u.kernel = v;
  if (kernels === undefined) delete u.kernels;
  else u.kernels = kernels;
  return { ...bundledFiles, 'universe.json': JSON.stringify(u, null, 2) + '\n' };
};

async function open(files: FileMap) {
  const disk = diskOf();
  const ai = new CountingModels();
  const k = await Kernel.boot({ files, store: memoryStore(), ai, backend: disk.backend, chunks: disk.chunks });
  for (let i = 0; i < 120; i++) k.tick(1 / 60);
  return { k, ai, disk };
}

const plan = { plan: { objects: [], fresh: [] } } as unknown as ChunkRecord;

describe('a universe out of the range of the kernels (T312)', () => {
  it('is read-only, and the panel of the faults says so', async () => {
    const { k } = await open(withKernel('0.0.4', { from: '0.0' }));
    expect(k.readOnly()).toContain('gira sui kernel 0.0–0.0');
    expect(k.faults.get('universe:kernel')?.message.startsWith(READ_ONLY_WORDS)).toBe(true);
  });

  it('commits nothing: not the Council, not the player, not the state; the disk is never written', async () => {
    const { k, disk } = await open(withKernel('0.0.4', { from: '0.0' }));
    const head = k.repo.head();
    k.repo.write('world/prova.txt', 'x\n');
    expect(k.repo.commit('il Concilio scrive', 'agent')).toBe(head);
    expect(k.repo.commit('il viandante scrive', 'player')).toBe(head);
    expect(k.saveFile('world/prova.txt', 'y\n').committed).toBe(false);
    k.saveState();
    expect(k.repo.head()).toBe(head);
    expect(k.repo.log().length).toBe(1);
    // What the master's branch and its publication would write on the disk.
    expect(await k.repo.backend!.branch!('master', { 'world/prova.txt': 'z\n' }, 'ramo', 'player')).toBeNull();
    await k.repo.backend!.merge!('master', 'pubblicazione');
    expect(await k.rollbackPast('abc1234')).toBe(false);
    await new Promise((r) => setTimeout(r, 0));
    expect(disk.writes).toEqual([]);
  });

  it('keeps a new plan in this session only', async () => {
    const { k, disk } = await open(withKernel('0.0.4', { from: '0.0' }));
    await k.chunkStore.save('chunk:1,1', plan);
    expect(await k.chunkStore.load('chunk:1,1')).toBe(plan);
    expect(disk.plans.size).toBe(0);
    expect(disk.writes).toEqual([]);
  });

  it('does not call the models: the Council answers with the local ones, and says why', async () => {
    const { k, ai } = await open(withKernel('0.0.4', { from: '0.0' }));
    const before = ai.calls.length;
    const said = await k.council.write('narrator', 'npc.reply', 'Buongiorno.');
    expect(typeof said).toBe('string');
    expect(ai.calls.length).toBe(before);
    expect(ai.calls).toEqual([]);
    expect(k.council.feed.some((e) => e.task === 'npc.reply' && /si legge soltanto/.test(e.text))).toBe(true);
  });
});

describe('a universe of this kernel (T312): as before', () => {
  it('is not read-only, commits on the disk, saves plans and calls the models', async () => {
    const { k, ai, disk } = await open(bundledFiles);
    expect(k.readOnly()).toBeUndefined();
    const head = k.repo.head();
    k.repo.write('world/prova.txt', 'x\n');
    const c = k.repo.commit('il Concilio scrive', 'agent');
    expect(c).not.toBe(head);
    expect(k.repo.head()).toBe(c);
    expect(await k.repo.backend!.branch!('master', { 'world/prova.txt': 'z\n' }, 'ramo', 'player')).toBe('abc1234');
    await k.chunkStore.save('chunk:1,1', plan);
    expect(disk.plans.get('chunk:1,1')).toBe(plan);
    await new Promise((r) => setTimeout(r, 0));
    expect(disk.writes).toEqual(expect.arrayContaining(['commit il Concilio scrive', 'branch master', 'piano chunk:1,1']));
    const before = ai.calls.length;
    await k.council.write('narrator', 'npc.reply', 'Buongiorno.');
    expect(ai.calls.length).toBe(before + 1);
  });

  it('a mirror is never read-only: its repository is its own bookkeeping', async () => {
    const k = await Kernel.boot({ files: withKernel('0.0.4', { from: '0.0' }), store: memoryStore(), ai: new MockAiModels(), mirror: true });
    expect(k.faults.has('universe:kernel')).toBe(true);
    expect(k.readOnly()).toBeUndefined();
    k.repo.write('world/prova.txt', 'x\n');
    expect(k.repo.commit('dal mondo', 'kernel')).not.toBe(k.repo.log()[1]);
    expect(k.repo.log().length).toBe(2);
  });
});

describe('a universe of the contract before, ported by the migrations (T317)', () => {
  it('is not read-only: the migration reaches the disk, and so does what follows', async () => {
    const { k, ai, disk } = await open(withKernel('0.1.14', { from: '0.1' }));
    expect(k.faults.has('universe:kernel')).toBe(false);
    expect(k.readOnly()).toBeUndefined();
    expect(JSON.parse(k.files['universe.json']).kernels).toEqual({ from: '0.3' });
    const head = k.repo.head();
    k.repo.write('world/prova.txt', 'x\n');
    const c = k.repo.commit('il Concilio scrive', 'agent');
    expect(c).not.toBe(head);
    await k.chunkStore.save('chunk:1,1', plan);
    expect(disk.plans.has('chunk:1,1')).toBe(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(disk.writes.some((w) => w.startsWith('commit migrazione'))).toBe(true);
    expect(disk.writes).toEqual(expect.arrayContaining(['commit il Concilio scrive', 'piano chunk:1,1']));
    const before = ai.calls.length;
    await k.council.write('narrator', 'npc.reply', 'Buongiorno.');
    expect(ai.calls.length).toBe(before + 1);
  });

  it('one with no chain of migrations to this contract stays out of the range, and read-only', async () => {
    const { k, disk } = await open(withKernel('0.0.4', { from: '0.0' }));
    expect(k.readOnly()).toBeDefined();
    expect(JSON.parse(k.files['universe.json']).kernels).toEqual({ from: '0.0' });
    await new Promise((r) => setTimeout(r, 0));
    expect(disk.writes).toEqual([]);
  });
});

describe('opensOnThisKernel (T317): what the routes ask with the world off', () => {
  const text = (fields: Record<string, unknown>) => JSON.stringify({ name: 'u', ...fields });
  it('a universe of this contract, of the one before or with no version opens; one with no chain of migrations does not', () => {
    expect(opensOnThisKernel(text({ kernel: KERNEL_VERSION, kernels: { from: '0.2' } }))).toBe(true);
    expect(opensOnThisKernel(text({ kernel: '0.1.14', kernels: { from: '0.1' } }))).toBe(true);
    expect(opensOnThisKernel(text({}))).toBe(true);
    expect(opensOnThisKernel(text({ kernel: '0.0.4', kernels: { from: '0.0' } }))).toBe(false);
    expect(runsOnThisKernel(text({ kernel: '0.1.14', kernels: { from: '0.1' } }))).toBe(false);
    expect(opensOnThisKernel('{ non è json')).toBe(true);
  });
});
