import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runGit } from '../../server/git';
import { universeStore, writeBranch } from '../../server/universeStore';
import { bundledFiles } from '../../src/kernel/bundle';
import { allowedPath, refusedPath, UNIVERSE_NAME_RE } from '../../src/kernel/paths';
import { validWandererId } from '../../src/kernel/wanderers';
import { cleanBranch } from '../../src/session/server';

// V-003 (T121, ADR-0103): what a universe may hold is a list, in one plain form, because on NTFS many names are git's folder.
// Everything happens in a temporary folder; a refused path is only ever looked at by the validator or refused by the store.

const REFUSED: Array<[string, string]> = [
  ['.git/config', 'la cartella di git'],
  ['.GIT/config', 'con altre maiuscole'],
  ['.Git/hooks/pre-commit', 'con altre maiuscole'],
  ['.git./config', 'con un punto finale'],
  ['.git /config', 'con uno spazio finale'],
  ['.git. . /config', 'con punti e spazi finali'],
  ['GIT~1/config', 'con il nome corto di NTFS'],
  ['git~1/config', 'con il nome corto, minuscolo'],
  ['.git::$INDEX_ALLOCATION/config', 'con un flusso NTFS'],
  ['.git:$DATA', 'con un flusso NTFS'],
  ['world/.git/config', 'più in basso'],
  ['world/.GIT/config', 'più in basso, con altre maiuscole'],
  ['modules/GIT~1/config', 'più in basso, con il nome corto'],
  ['modules/a/.gitattributes', 'gli attributi di git'],
  ['.gitattributes', 'gli attributi di git, che il server scrive da sé'],
  ['.gitignore', 'ciò che git ignora'],
  ['.gitmodules', 'i sottomoduli'],
  ['world/.gitignore', 'ciò che git ignora, più in basso'],
  ['world/bible.json:nascosto', 'un flusso su un file ammesso'],
  ['world/bible.json::$DATA', 'il flusso principale di un file ammesso'],
  ['world/bible.json.', 'un punto finale su un file ammesso'],
  ['world/bible.json ', 'uno spazio finale su un file ammesso'],
  ['world./bible.json', 'una cartella ammessa con un punto finale'],
  ['world /bible.json', 'una cartella ammessa con uno spazio finale'],
  ['WORLD/bible.json', 'una cartella ammessa con altre maiuscole'],
  ['WORLD~1/bible.json', 'una cartella ammessa con il nome corto'],
  ['UNIVERSE.JSON', 'un file ammesso con altre maiuscole'],
  ['universe.json.', 'un file ammesso con un punto finale'],
  ['universe.json::$DATA', 'un file ammesso con un flusso'],
  ['modules/nul', 'un nome riservato'],
  ['modules/NUL.json', 'un nome riservato con estensione'],
  ['world/con.json', 'un nome riservato con estensione'],
  ['world/Aux/x.json', 'un nome riservato come cartella'],
  ['maps/prn.json', 'un nome riservato tra le mappe'],
  ['maps/COM1.json', 'una porta'],
  ['prompts/lpt9.md', 'una porta'],
  ['../fuori', 'fuori dall’universo'],
  ['world/../../fuori', 'fuori dall’universo, passando da dentro'],
  ['world/../.git/config', 'nella cartella di git, passando da dentro'],
  ['world/./bible.json', 'un punto come segmento'],
  ['world//bible.json', 'un segmento vuoto'],
  ['world/', 'un segmento vuoto in fondo'],
  ['/world/bible.json', 'assoluto'],
  ['C:/Windows/x', 'assoluto, con il disco'],
  ['C:\\Windows\\x', 'assoluto, con le barre di Windows'],
  ['\\\\?\\C:\\x', 'un percorso di dispositivo'],
  ['world\\bible.json', 'con le barre di Windows'],
  ['world\\..\\.git\\config', 'con le barre di Windows, nella cartella di git'],
  ['world/bi\0ble.json', 'con un byte nullo'],
  ['world/a,b.json', 'una virgola, che `--cacheinfo` di git separa'],
  ['world/\u200b.git', 'un carattere invisibile'],
  ['world/.g\u200cit', 'un carattere che HFS+ ignora'],
  ['modules/ｇｉｔ', 'caratteri a larghezza piena'],
  ['leggimi.txt', 'un file fuori dall’elenco'],
  ['server/access.ts', 'una cartella fuori dall’elenco'],
  ['assets/a.png', 'la cartella del vecchio 2D'],
  ['', 'vuoto'],
  [`world/${'a'.repeat(300)}`, 'troppo lungo'],
];

describe('V-003 i percorsi ammessi', () => {
  it.each(REFUSED)('V-003 rifiuta %j: %s', (rel) => {
    expect(refusedPath(rel)).toBeDefined();
    expect(allowedPath(rel)).toBe(false);
  });

  it('V-003 rifiuta ciò che non è una stringa', () => {
    for (const v of [undefined, null, 1, {}, []]) expect(allowedPath(v)).toBe(false);
  });

  it('V-003 ammette ogni file del seme, e ciò che il kernel scrive', () => {
    const paths = [
      ...Object.keys(bundledFiles),
      'universe.json',
      'seed.json',
      'world/stato.json',
      'world/consumi.json',
      'world/carte.json',
      'world/grafo.json',
      'world/pagamenti.json',
      'world/giocatori/io.json',
      'world/giocatori/viandante-2_a.json',
      'maps/-1_0.json',
      'maps/12_-3.json',
      'models/corona-nucleo.xml',
      'modules/sys.fire/logic.lua',
      'modules/magic.runes/manifest.json',
      'prompts/agents/scultore.md',
    ];
    expect(paths.filter((p) => !allowedPath(p))).toEqual([]);
  });

  it('V-003 i nomi di universi e viandanti non sono dispositivi di Windows', () => {
    for (const n of ['con', 'nul', 'aux', 'prn', 'com1', 'lpt9']) {
      expect(UNIVERSE_NAME_RE.test(n)).toBe(false);
      expect(validWandererId(n)).toBe(false);
    }
    for (const n of ['aurora', 'valmora-new', 'console', 'nulla', 'com10']) expect(UNIVERSE_NAME_RE.test(n)).toBe(true);
    for (const n of ['io', 'console', 'nulla']) expect(validWandererId(n)).toBe(true);
  });

  it.each(REFUSED)('V-003 il ramo dal WebSocket rifiuta %j: %s', (rel) => {
    expect(cleanBranch({ 'world/bible.json': 'buono', [rel]: 'sonda' })).toBeUndefined();
  });

  it('V-003 il ramo dal WebSocket tiene ciò che è ammesso', () => {
    const files = { 'world/bible.json': '{}', 'modules/a.b/logic.lua': null, 'universe.json': '{}' };
    expect(cleanBranch(files)).toEqual(files);
  });
});

describe('V-003 il magazzino degli universi', () => {
  let dir: string;
  let root: string;
  let server: http.Server;
  let base: string;
  const git = (cwd: string, ...args: string[]) => execFileSync('git', ['-c', 'user.name=Prova', '-c', 'user.email=prova@rune.local', '-c', 'core.autocrlf=false', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  /** Who sits at this machine, in a game alone: the universe is theirs, so only the paths stop them. */
  const post = (name: string, op: string, body: unknown) => fetch(`${base}/api/universe/${name}/${op}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Quine-Viandante': 'io' }, body: JSON.stringify(body) });
  const commit = (changes: Record<string, string | null>) => post('sonda', 'commit', { changes, message: 'sonda', author: 'player' });

  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-percorsi-'));
    root = path.join(dir, 'sonda');
    mkdirSync(path.join(root, 'world'), { recursive: true });
    writeFileSync(path.join(root, 'universe.json'), '{"name":"sonda"}\n');
    writeFileSync(path.join(root, 'world', 'bible.json'), '{}\n');
    git(root, 'init', '-q');
    git(root, 'add', '-A');
    git(root, 'commit', '-q', '-m', 'inizio');
    let handler: ((req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void) | undefined;
    (universeStore(dir).configureServer as unknown as (s: unknown) => void)({ middlewares: { use: (h: typeof handler) => (handler = h) } });
    server = http.createServer((req, res) => handler!(req, res, () => ((res.statusCode = 404), res.end())));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((r) => server.close(r));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
  });

  it.each(REFUSED.filter(([rel]) => rel))('V-003 un commit su %j è rifiutato per intero: %s', async (rel) => {
    const gitBefore = readdirSync(path.join(root, '.git')).sort();
    const r = await commit({ 'world/mezzo-commit.json': 'sonda\n', [rel]: 'sonda\n' });
    expect(r.status).toBe(400);
    expect(existsSync(path.join(root, 'world', 'mezzo-commit.json'))).toBe(false);
    expect(readdirSync(path.join(root, '.git')).sort()).toEqual(gitBefore);
    expect(readdirSync(dir)).toEqual(['sonda']);
  });

  it('V-003 un commit ammesso passa, e la configurazione di git non cambia', async () => {
    const config = readFileSync(path.join(root, '.git', 'config'), 'utf8');
    const r = await commit({ 'world/buono.json': '{}\n' });
    expect(r.status).toBe(200);
    expect(readFileSync(path.join(root, 'world', 'buono.json'), 'utf8')).toBe('{}\n');
    expect(readFileSync(path.join(root, '.git', 'config'), 'utf8')).toBe(config);
  });

  it('V-003 il ramo rifiuta gli stessi percorsi, via HTTP e nella funzione', async () => {
    expect((await post('sonda', 'branch', { branch: 'master', files: { '.GIT/config': 'sonda' }, message: 'sonda' })).status).toBe(400);
    await expect(writeBranch(root, 'master', { 'GIT~1/config': 'sonda' }, 'sonda', 'player')).rejects.toThrow();
    expect(git(root, 'for-each-ref', 'refs/heads/rami/').trim()).toBe('');
  });

  it('V-003 la creazione rifiuta gli stessi percorsi e non lascia nulla', async () => {
    const r = await post('nuovo', 'create', { files: { 'universe.json': '{}\n', '.git./config': 'sonda' }, message: 'sonda' });
    expect(r.status).toBe(400);
    expect(existsSync(path.join(dir, 'nuovo'))).toBe(false);
  });

  it('V-003 una mappa con un nome riservato non si scrive', async () => {
    const put = (key: string) => fetch(`${base}/api/universe/sonda/map/${key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Quine-Viandante': 'io' }, body: '{}' });
    expect((await put('con')).status).toBe(400);
    expect((await put('0,0')).status).toBe(200);
    expect(existsSync(path.join(root, 'maps', '0_0.json'))).toBe(true);
  });

  it('V-003 un universo con il nome di un dispositivo non esiste', async () => {
    expect((await post('nul', 'create', { files: {}, message: 'sonda' })).status).toBe(404);
  });

  it('V-003 un commit su un universo che non c’è non arriva al repository di sopra', async () => {
    // The universes' folder inside a repository of its own, as `universes/` sits inside the kernel's.
    git(dir, 'init', '-q');
    writeFileSync(path.join(dir, 'di-sopra.txt'), 'sonda\n');
    try {
      const r = await post('assente', 'commit', { changes: { 'world/x.json': '{}\n' }, message: 'sonda', author: 'player' });
      expect(r.status).toBe(500);
      expect(existsSync(path.join(dir, 'assente'))).toBe(false);
      await expect(runGit(root, ['rev-parse', '--show-toplevel'], { author: ['Prova', 'prova@rune.local'] })).resolves.toContain('sonda');
      mkdirSync(path.join(dir, 'senza-git'));
      await expect(runGit(path.join(dir, 'senza-git'), ['status'], { author: ['Prova', 'prova@rune.local'] })).rejects.toThrow();
      expect(() => git(dir, 'log', '-1')).toThrow(); // nothing was ever committed up there
    } finally {
      rmSync(path.join(dir, '.git'), { recursive: true, force: true, maxRetries: 5 });
      rmSync(path.join(dir, 'di-sopra.txt'), { force: true });
      rmSync(path.join(dir, 'senza-git'), { recursive: true, force: true });
    }
  });

  it('V-003 un hook già nella cartella di git non gira', async () => {
    // As if something had reached it before this fix: the server's git does not look there, nor does it read `core.hooksPath` from the repository.
    const marker = path.join(dir, 'hook-eseguito').replace(/\\/g, '/');
    const hooks = path.join(root, '.git', 'hooks');
    const altri = path.join(root, '.git', 'altri-hooks');
    mkdirSync(hooks, { recursive: true });
    mkdirSync(altri, { recursive: true });
    const script = `#!/bin/sh\necho eseguito > "${marker}"\n`;
    for (const d of [hooks, altri]) writeFileSync(path.join(d, 'pre-commit'), script, { mode: 0o755 });
    const config = path.join(root, '.git', 'config');
    const before = readFileSync(config, 'utf8');
    try {
      expect((await commit({ 'world/con-hook.json': '{}\n' })).status).toBe(200);
      expect(existsSync(marker)).toBe(false);
      git(root, 'config', 'core.hooksPath', altri.replace(/\\/g, '/'));
      expect((await commit({ 'world/con-hook2.json': '{}\n' })).status).toBe(200);
      expect(existsSync(marker)).toBe(false);
      // The test proves something only if git, left to itself, does run it.
      writeFileSync(path.join(root, 'world', 'prova-hook.json'), '{}\n');
      git(root, 'add', '-A');
      git(root, 'commit', '-q', '-m', 'senza il server');
      expect(existsSync(marker)).toBe(true);
    } finally {
      writeFileSync(config, before);
      rmSync(path.join(hooks, 'pre-commit'), { force: true });
      rmSync(altri, { recursive: true, force: true });
      rmSync(marker, { force: true });
    }
  });
});
