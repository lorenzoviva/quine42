import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { fakeLink } from '../src/session/protocol';
import { playerChanges, SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import { mergeBranch, readBranch, writeBranch } from '../server/universeStore';

const DT = 1 / 60;

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
}

async function thin(server: SessionServer, id: string): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id });
  await session.ready;
  const k = await Kernel.boot({ files: session.files, store: memoryStore(), models: new MockModels(), mirror: true });
  return new ThinClient(k, session);
}

function run(server: SessionServer, clients: ThinClient[], frames: number) {
  for (let i = 0; i < frames; i++) {
    for (const c of clients) {
      c.k.tick(DT);
      c.frame(DT);
    }
    server.tick(DT);
  }
}

/** A manifest a player's client has too (an entity's), and the same with another name. */
function entityManifest(k: Kernel, nth = 0): { path: string; edited: (name: string) => string } {
  const path = Object.keys(k.files)
    .filter((p) => p.endsWith('manifest.json') && JSON.parse(k.files[p]).kind === 'entity')
    .sort()[nth];
  return { path, edited: (name) => JSON.stringify({ ...JSON.parse(k.files[path]), name }, null, 2) + '\n' };
}

/** What the Council does on the main line: a file changed and committed, on the server. */
function councilWrites(k: Kernel, path: string, text: string) {
  k.repo.write(path, text);
  k.applyFiles({ ...k.repo.working });
  k.repo.commit(`concilio: ${path}`, 'agent');
}

describe('the master’s branch and the publication (T42b)', () => {
  it('a change on the master’s branch reaches the players only once it is published', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = await thin(server, 'io');
    const anna = await thin(server, 'anna');
    run(server, [master, anna], 6);
    const { path, edited } = entityManifest(k);
    const before = k.files[path];
    expect(anna.k.files[path]).toBeDefined();
    // The master saves in the editor: valid, so their mirror reloads it and commits it on their branch.
    const r = master.k.saveFile(path, edited('Nome sul ramo'));
    expect(r.committed).toBe(true);
    run(server, [master, anna], 12);
    await new Promise((r) => setTimeout(r, 0));
    expect(JSON.parse(master.k.files[path]).name).toBe('Nome sul ramo');
    expect(master.k.publisher!.branch()).toEqual([path]);
    expect(server.branchFiles()).toEqual({ [path]: edited('Nome sul ramo') });
    // The world, and every player in it, do not have it.
    expect(k.files[path]).toBe(before);
    expect(JSON.parse(anna.k.files[path]).name).toBe(JSON.parse(before).name);
    expect(anna.k.publisher).toBeUndefined();
    // Published: one commit of the main line, and the files reach every client.
    const done = master.k.publisher!.publish();
    run(server, [master, anna], 2);
    const out = await done;
    expect(out.ok).toBe(true);
    expect(out.testo).toMatch(/Pubblicato: 1 file/);
    expect(k.repo.head().message).toContain('pubblicazione del master');
    expect(JSON.parse(k.files[path]).name).toBe('Nome sul ramo');
    run(server, [master, anna], 12);
    expect(JSON.parse(anna.k.files[path]).name).toBe('Nome sul ramo');
    expect(anna.k.modules.get(JSON.parse(before).id)?.manifest.name).toBe('Nome sul ramo');
    // The branch is now the world: nothing left to publish.
    expect(server.branchFiles()).toEqual({});
    expect(master.k.publisher!.branch()).toEqual([]);
  });

  it('what the Council commits meanwhile reaches everyone; on the same file the master wins, and the feed says so', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = await thin(server, 'io');
    const anna = await thin(server, 'anna');
    run(server, [master, anna], 6);
    const one = entityManifest(k, 0);
    const two = entityManifest(k, 1);
    master.k.saveFile(one.path, one.edited('Del master'));
    run(server, [master, anna], 6);
    // The Council changes another file and the same one, on the main line.
    councilWrites(k, two.path, two.edited('Del Concilio'));
    councilWrites(k, one.path, one.edited('Anche del Concilio'));
    run(server, [master, anna], 12);
    expect(JSON.parse(anna.k.files[two.path]).name).toBe('Del Concilio');
    expect(JSON.parse(anna.k.files[one.path]).name).toBe('Anche del Concilio');
    // The master's mirror takes the world's file, but keeps their own version of the one on their branch.
    expect(JSON.parse(master.k.files[two.path]).name).toBe('Del Concilio');
    expect(JSON.parse(master.k.files[one.path]).name).toBe('Del master');
    expect(master.k.publisher!.branch()).toEqual([one.path]);
    // Published: the master's version wins, the Council's other change stays, the feed tells of the conflict.
    const done = master.k.publisher!.publish();
    run(server, [master, anna], 2);
    expect((await done).ok).toBe(true);
    run(server, [master, anna], 12);
    expect(JSON.parse(k.files[one.path]).name).toBe('Del master');
    expect(JSON.parse(k.files[two.path]).name).toBe('Del Concilio');
    expect(JSON.parse(anna.k.files[one.path]).name).toBe('Del master');
    expect(k.feed().some((e) => e.text.includes(one.path) && e.text.includes('resta la versione del master'))).toBe(true);
  });

  it('only the master has a branch; their R goes back to its last valid state, and it waits for them when they come back', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = await thin(server, 'io');
    const anna = await thin(server, 'anna');
    run(server, [master, anna], 6);
    const { path, edited } = entityManifest(k);
    // A player cannot write the branch nor publish.
    const sent = anna.session.act({ t: 'ramo', files: { [path]: edited('Di Anna') }, base: {} });
    const pub = anna.session.act({ t: 'pubblica' });
    run(server, [master, anna], 1);
    expect((await sent).ok).toBe(false);
    expect((await pub).ok).toBe(false);
    expect(server.branchFiles()).toEqual({});
    // A valid change, then a broken one written anyway: R brings the branch back to the valid one.
    master.k.saveFile(path, edited('Valido'));
    const broken = master.k.saveFile(path, '{ rotto', true);
    expect(broken.committed).toBe(false);
    master.k.rollback();
    expect(JSON.parse(master.k.files[path]).name).toBe('Valido');
    run(server, [master, anna], 6);
    expect(Object.keys(server.branchFiles())).toEqual([path]);
    // A path that leaves the universe is not a branch.
    const bad = master.session.act({ t: 'ramo', files: { '../fuori.txt': 'x' }, base: {} });
    run(server, [master, anna], 1);
    expect((await bad).ok).toBe(false);
    expect(Object.keys(server.branchFiles())).toEqual([path]);
    // The master leaves and comes back: their branch is in their mirror again, the world still has not got it.
    master.session.leave();
    run(server, [anna], 6);
    const again = await thin(server, 'io');
    run(server, [again, anna], 6);
    expect(JSON.parse(again.k.files[path]).name).toBe('Valido');
    expect(again.k.publisher!.branch()).toEqual([path]);
    expect(JSON.parse(k.files[path]).name).not.toBe('Valido');
    // R to a commit before the change: the branch is empty, on the server too.
    again.k.rollback(again.k.repo.log().at(-1)!.id);
    run(server, [again, anna], 6);
    expect(again.k.publisher!.branch()).toEqual([]);
    expect(server.branchFiles()).toEqual({});
  });

  it('a player hears only of the files its client has', async () => {
    const k = await bootMany();
    const { path, edited } = entityManifest(k);
    const files = { ...k.files, [path]: edited('Altro nome'), 'world/bible.json': '{}' };
    const out = playerChanges(files, [path, 'world/bible.json', 'prompts/theme.md']);
    expect(Object.keys(out)).toContain(path);
    expect(JSON.parse(out[path]!).name).toBe('Altro nome');
    expect(JSON.parse(out[path]!).logic).toBeUndefined();
    expect(out['world/bible.json']).toBeUndefined();
    expect('prompts/theme.md' in out).toBe(false);
  });
});

describe('the branch on disk (T42b)', () => {
  it('is written beside the main line without touching it, read back, and merged', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'quine-ramo-'));
    const git = (...args: string[]) => execFileSync('git', ['-c', 'user.name=Prova', '-c', 'user.email=prova@rune.local', '-c', 'core.autocrlf=false', ...args], { cwd: root, encoding: 'utf8' });
    try {
      git('init', '-q');
      writeFileSync(path.join(root, 'a.txt'), 'uno\n');
      writeFileSync(path.join(root, 'b.txt'), 'due\n');
      git('add', '-A');
      git('commit', '-q', '-m', 'genesi');
      const main = git('rev-parse', 'HEAD').trim();
      expect(await readBranch(root, 'master')).toBeNull();
      await writeBranch(root, 'master', { 'a.txt': 'uno del master\n', 'b.txt': null, 'c/d.txt': 'nuovo\n' }, 'ramo del master', 'player');
      // The main line and its working tree are as they were.
      expect(git('rev-parse', 'HEAD').trim()).toBe(main);
      expect(git('status', '--porcelain').trim()).toBe('');
      expect(await readBranch(root, 'master')).toEqual({ 'a.txt': 'uno del master\n', 'b.txt': null, 'c/d.txt': 'nuovo\n' });
      // The main line goes on: what the branch changes is still only its own files.
      writeFileSync(path.join(root, 'e.txt'), 'del concilio\n');
      git('add', '-A');
      git('commit', '-q', '-m', 'concilio');
      await writeBranch(root, 'master', { 'a.txt': 'uno del master, ancora\n' }, 'ramo del master', 'player');
      expect(await readBranch(root, 'master')).toEqual({ 'a.txt': 'uno del master, ancora\n' });
      // Published: the main line has its files, the branch is merged and gone.
      writeFileSync(path.join(root, 'a.txt'), 'uno del master, ancora\n');
      git('add', '-A');
      git('commit', '-q', '-m', 'pubblicazione del master: a.txt');
      await mergeBranch(root, 'master', 'il ramo master nel mondo');
      expect(git('log', '-1', '--format=%P').trim().split(' ').length).toBe(2);
      expect(git('show', 'HEAD:a.txt')).toBe('uno del master, ancora\n');
      expect(git('show', 'HEAD:e.txt')).toBe('del concilio\n');
      expect(await readBranch(root, 'master')).toBeNull();
      await expect(writeBranch(root, '../fuori', { 'a.txt': 'x' }, 'm', 'player')).rejects.toThrow();
      await expect(writeBranch(root, 'master', { '../fuori.txt': 'x' }, 'm', 'player')).rejects.toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
    // A git process per step: slow on Windows, with the other tests running beside.
  }, 30_000);
});
