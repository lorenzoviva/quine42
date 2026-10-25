import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { allCards, CARDS_FILE, moduleCardId } from '../src/kernel/cards';
import { cloneChanges } from '../src/kernel/clone';
import { cloneUniverse, writeBranch } from '../server/universeStore';
import type { FileMap } from '../src/kernel/types';

const CARPET = 'modules/core.carpet/manifest.json';

/** A game of many whose master is `io`, with cards of `io`, of `anna` and a common one drawn to `io`. */
function many(): FileMap {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const carpet = JSON.parse(bundledFiles[CARPET]);
  return {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, name: 'prima', partita: { modalita: 'multigiocatore', morte: 2, pvp: true, altroTraGiocatori: false, master: 'io' } }, null, 2) + '\n',
    [CARPET]: JSON.stringify({ ...carpet, carta: { autore: 'ingegnere', pagante: 'io', titolare: 'io' } }, null, 2) + '\n',
    [CARDS_FILE]:
      JSON.stringify({
        utilizzi: { 'luogo:0_0': { luoghi: 1, trame: 0, prompt: 3 } },
        luoghi: {
          '0_0': { autore: 'cartografo', pagante: 'comune', titolare: 'io', nome: 'La piazza' },
          '1_0': { autore: 'cartografo', pagante: 'anna', titolare: 'anna', nome: 'Il guado' },
        },
      }, null, 1) + '\n',
  };
}

const owners = (files: FileMap) => allCards(files).map((c) => `${c.id} ${c.autore} ${c.pagante} ${c.titolare}`).sort();

describe('cloning a universe with another master (T42d)', () => {
  it('the clone has the same world and the same cards, another name and another master', () => {
    const files = many();
    const { changes, from } = cloneChanges(files, { nome: 'seconda', master: 'anna' });
    expect(from).toBe('io');
    expect(Object.keys(changes)).toEqual(['universe.json']);
    const clone = { ...files, ...changes };
    const cfg = JSON.parse(clone['universe.json']);
    expect(cfg.name).toBe('seconda');
    expect(cfg.seed).toBe(JSON.parse(files['universe.json']).seed);
    expect(cfg.partita).toEqual({ modalita: 'multigiocatore', morte: 2, pvp: true, altroTraGiocatori: false, master: 'anna' });
    expect(owners(clone)).toEqual(owners(files));
    expect(owners(clone).length).toBeGreaterThanOrEqual(3);
  });

  it('the old master’s cards may pass to the new one; who wrote and paid for them stays', () => {
    const files = many();
    const { changes } = cloneChanges(files, { nome: 'seconda', master: 'bruno', titolari: 'master' });
    const cards = new Map(allCards({ ...files, ...changes }).map((c) => [c.id, c]));
    expect(cards.get(moduleCardId({ id: 'core.carpet', kind: 'system' }))).toMatchObject({ autore: 'ingegnere', pagante: 'io', titolare: 'bruno' });
    expect(cards.get('luogo:0_0')).toMatchObject({ autore: 'cartografo', pagante: 'comune', titolare: 'bruno' });
    expect(cards.get('luogo:1_0')).toMatchObject({ pagante: 'anna', titolare: 'anna' });
    expect(cards.get('luogo:0_0')!.utilizzi.prompt).toBe(3);
  });

  it('refuses what is not a change of master', () => {
    const files = many();
    expect(() => cloneChanges(files, { nome: 'seconda', master: 'io' })).toThrow(/già il master/);
    expect(() => cloneChanges(files, { nome: 'Seconda!', master: 'anna' })).toThrow(/nome/);
    expect(() => cloneChanges(files, { nome: 'seconda', master: 'Anna B' })).toThrow(/viandante/);
    expect(() => cloneChanges(bundledFiles, { nome: 'seconda', master: 'anna' })).toThrow(/multigiocatore/);
  });

  it('the kernel of the clone has the new master in god mode, and the old one is a player', async () => {
    const files = many();
    const k = await Kernel.boot({ files: { ...files, ...cloneChanges(files, { nome: 'seconda', master: 'anna' }).changes }, store: memoryStore(), models: new MockModels() });
    expect(k.partita().master).toBe('anna');
    expect(k.isMaster('anna')).toBe(true);
    expect(k.isMaster('io')).toBe(false);
    expect(k.godMode('io')).toBe(false);
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
      mkdirSync(path.join(src, 'world/giocatori'), { recursive: true });
      writeFileSync(path.join(src, 'world/giocatori/anna.json'), '{"x":3}\n');
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
      expect(r).toMatchObject({ nome: 'seconda', from: 'io' });
      expect(git(dst, 'log', '--format=%s').trim().split('\n')).toEqual(['clone di «prima»: il master è anna (prima io)', 'genesi']);
      expect(git(dst, 'for-each-ref', 'refs/heads/rami/').trim()).toBe('');
      expect(git(dst, 'status', '--porcelain').trim()).toBe('');
      expect(readFileSync(path.join(dst, 'maps/0_0.json'), 'utf8')).toBe('{"plan":{}}\n');
      expect(readFileSync(path.join(dst, 'world/giocatori/anna.json'), 'utf8')).toBe('{"x":3}\n');
      expect(JSON.parse(readFileSync(path.join(dst, 'universe.json'), 'utf8')).partita.master).toBe('anna');
      const read = (root: string) => Object.fromEntries(keep.map((rel) => [rel, readFileSync(path.join(root, rel), 'utf8')]));
      expect(owners(read(dst))).toEqual(owners(read(src)));

      expect(git(src, 'rev-parse', 'HEAD')).toBe(before);
      expect(git(src, 'for-each-ref', '--format=%(refname)', 'refs/heads/rami/').trim()).toBe('refs/heads/rami/master');
      expect(JSON.parse(readFileSync(path.join(src, 'universe.json'), 'utf8')).partita.master).toBe('io');
      await expect(cloneUniverse(base, src, { nome: 'seconda', master: 'bruno' })).rejects.toThrow(/esiste già/);
      await expect(cloneUniverse(base, src, { nome: 'terza', master: 'io' })).rejects.toThrow(/già il master/);
      expect(existsSync(path.join(base, 'terza'))).toBe(false);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});
