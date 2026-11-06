import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { allCards, CARDS_FILE, moduleCardId } from '../src/kernel/cards';
import { cloneChanges } from '../src/kernel/clone';
import { cloneUniverse, writeBranch } from '../server/universeStore';
import type { FileMap } from '../src/kernel/types';

const CARPET = 'modules/core.carpet/manifest.json';

/** A multiplayer game whose master is `io`, with cards of `io`, of `anna` and a common one drawn to `io`. */
function many(): FileMap {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const carpet = JSON.parse(bundledFiles[CARPET]);
  return {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, name: 'prima', game: { mode: 'multiplayer', death: 2, pvp: true, freeActionsBetweenPlayers: false, master: 'me' } }, null, 2) + '\n',
    [CARPET]: JSON.stringify({ ...carpet, card: { author: 'engineer', payer: 'me', holder: 'me' } }, null, 2) + '\n',
    [CARDS_FILE]:
      JSON.stringify({
        uses: { 'chunk:0_0': { chunks: 1, plots: 0, prompt: 3 } },
        chunks: {
          '0_0': { author: 'cartographer', payer: 'comune', holder: 'me', name: 'La piazza' },
          '1_0': { author: 'cartographer', payer: 'anna', holder: 'anna', name: 'Il guado' },
        },
      }, null, 1) + '\n',
  };
}

const owners = (files: FileMap) => allCards(files).map((c) => `${c.id} ${c.author} ${c.payer} ${c.holder}`).sort();

describe('cloning a universe with another master (T42d)', () => {
  it('the clone has the same world and the same cards, another name and another master', () => {
    const files = many();
    const { changes, from } = cloneChanges(files, { nome: 'seconda', master: 'anna' });
    expect(from).toBe('me');
    // One more origin on every card (T45c): the files with cards change, nothing else.
    expect(Object.keys(changes).sort()).toEqual([CARPET, 'universe.json', CARDS_FILE].sort());
    const clone = { ...files, ...changes };
    const cfg = JSON.parse(clone['universe.json']);
    expect(cfg.name).toBe('seconda');
    expect(cfg.seed).toBe(JSON.parse(files['universe.json']).seed);
    expect(cfg.game).toEqual({ mode: 'multiplayer', death: 2, pvp: true, freeActionsBetweenPlayers: false, master: 'anna' });
    expect(owners(clone)).toEqual(owners(files));
    expect(owners(clone).length).toBeGreaterThanOrEqual(3);
  });

  it('the old master’s cards may pass to the new one; who wrote and paid for them stays', () => {
    const files = many();
    const { changes } = cloneChanges(files, { nome: 'seconda', master: 'bruno', titolari: 'master' });
    const cards = new Map(allCards({ ...files, ...changes }).map((c) => [c.id, c]));
    expect(cards.get(moduleCardId({ id: 'core.carpet', kind: 'system' }))).toMatchObject({ author: 'engineer', payer: 'me', holder: 'bruno' });
    expect(cards.get('chunk:0_0')).toMatchObject({ author: 'cartographer', payer: 'comune', holder: 'bruno' });
    expect(cards.get('chunk:1_0')).toMatchObject({ payer: 'anna', holder: 'anna' });
    expect(cards.get('chunk:0_0')!.uses.prompt).toBe(3);
  });

  it('refuses what is not a change of master', () => {
    const files = many();
    expect(() => cloneChanges(files, { nome: 'seconda', master: 'me' })).toThrow(/già il master/);
    expect(() => cloneChanges(files, { nome: 'Seconda!', master: 'anna' })).toThrow(/nome/);
    expect(() => cloneChanges(files, { nome: 'seconda', master: 'Anna B' })).toThrow(/viandante/);
    expect(() => cloneChanges(bundledFiles, { nome: 'seconda', master: 'anna' })).toThrow(/multigiocatore/);
  });

  it('the kernel of the clone has the new master in god mode, and the old one is a player', async () => {
    const files = many();
    const k = await Kernel.boot({ files: { ...files, ...cloneChanges(files, { nome: 'seconda', master: 'anna' }).changes }, store: memoryStore(), ai: new MockAiModels() });
    expect(k.gameSetup().master).toBe('anna');
    expect(k.isMaster('anna')).toBe(true);
    expect(k.isMaster('me')).toBe(false);
    expect(k.godMode('me')).toBe(false);
  });
});

describe('the clone on disk (T42d)', () => {
  it('copies history, maps and wanderers, not the old master’s branch; the source is untouched', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'rune-clone-'));
    const src = path.join(base, 'prima');
    const git = (cwd: string, ...args: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'core.autocrlf=false', ...args], { cwd, encoding: 'utf8' });
    try {
      const files = many();
      const keep = ['universe.json', CARPET, CARDS_FILE];
      for (const rel of keep) {
        mkdirSync(path.dirname(path.join(src, rel)), { recursive: true });
        writeFileSync(path.join(src, rel), files[rel]);
      }
      mkdirSync(path.join(src, 'world/players'), { recursive: true });
      writeFileSync(path.join(src, 'world/players/anna.json'), '{"x":3}\n');
      git(base, 'init', '-q', src);
      git(src, 'add', '-A');
      git(src, 'commit', '-q', '-m', 'genesi');
      // A place planned after the last commit, and what the old master was trying on their branch.
      mkdirSync(path.join(src, 'maps'));
      writeFileSync(path.join(src, 'maps/0_0.json'), '{"plan":{}}\n');
      await writeBranch(src, 'master', { 'world/rules.json': '{"regole":[]}\n' }, 'prova del master', 'player');
      const before = git(src, 'rev-parse', 'HEAD');

      const r = await cloneUniverse(base, src, { nome: 'seconda', master: 'anna' });
      const dst = path.join(base, 'seconda');
      expect(r).toMatchObject({ nome: 'seconda', from: 'me' });
      expect(git(dst, 'log', '--format=%s').trim().split('\n')).toEqual(['clone di «prima»: il master è anna (prima me)', 'genesi']);
      expect(git(dst, 'for-each-ref', 'refs/heads/rami/').trim()).toBe('');
      expect(git(dst, 'status', '--porcelain').trim()).toBe('');
      expect(readFileSync(path.join(dst, 'maps/0_0.json'), 'utf8')).toBe('{"plan":{}}\n');
      expect(readFileSync(path.join(dst, 'world/players/anna.json'), 'utf8')).toBe('{"x":3}\n');
      expect(JSON.parse(readFileSync(path.join(dst, 'universe.json'), 'utf8')).game.master).toBe('anna');
      const read = (root: string) => Object.fromEntries(keep.map((rel) => [rel, readFileSync(path.join(root, rel), 'utf8')]));
      expect(owners(read(dst))).toEqual(owners(read(src)));

      expect(git(src, 'rev-parse', 'HEAD')).toBe(before);
      expect(git(src, 'for-each-ref', '--format=%(refname)', 'refs/heads/rami/').trim()).toBe('refs/heads/rami/master');
      expect(JSON.parse(readFileSync(path.join(src, 'universe.json'), 'utf8')).game.master).toBe('me');
      await expect(cloneUniverse(base, src, { nome: 'seconda', master: 'bruno' })).rejects.toThrow(/esiste già/);
      await expect(cloneUniverse(base, src, { nome: 'terza', master: 'me' })).rejects.toThrow(/già il master/);
      expect(existsSync(path.join(base, 'terza'))).toBe(false);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});
