import { existsSync, lstatSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error a plain .mjs of the kit, without types
import { assertLoopback, assertThrowaway, cleanEnv, fakeSecrets, LINKS, makeProject, removeProject, REPO, scrub } from '../tools/sicurezza/ambiente.mjs';
// @ts-expect-error a plain .mjs of the kit, without types
import { PROBES, UNCOVERED } from '../tools/sicurezza/catalogo.mjs';

// The author's kit (T137) must not be able to do damage: these are its own guards, on no server. It is not under
// tests/sicurezza/ because its tests are not about a V-NNN.

describe('il kit dell\'autore non può fare danni', () => {
  it('parla solo con il loopback', () => {
    for (const ok of ['http://localhost:4871/', 'http://127.0.0.1:1/', 'http://[::1]:1/']) expect(() => assertLoopback(ok)).not.toThrow();
    for (const no of ['http://example.com/', 'http://192.168.1.2:5173/', 'http://localhost.example.com/', 'https://quine42.example/']) expect(() => assertLoopback(no)).toThrow();
  });

  it('lavora solo in una cartella nuova in quella temporanea', () => {
    for (const no of [REPO, path.join(REPO, 'universes'), os.tmpdir(), path.dirname(REPO)]) expect(() => assertThrowaway(no), no).toThrow();
    expect(() => assertThrowaway(path.join(os.tmpdir(), 'quine-prove-x'))).not.toThrow();
  });

  it('non passa al server le chiavi dell\'ambiente di chi lo lancia', () => {
    const env = cleanEnv('/tmp/x', { PATH: 'p', GEMINI_API_KEY: 'a', STRIPE_SECRET_KEY: 'b', STRIPE_WEBHOOK_SECRET: 'c', FIREBASE_PROJECT_ID: 'd', QUINE_MASTER: 'e', ALTRO: 'f' });
    expect(env.PATH).toBe('p');
    for (const k of ['GEMINI_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'FIREBASE_PROJECT_ID', 'QUINE_MASTER', 'ALTRO']) expect(env[k], k).toBeUndefined();
  });

  it('il progetto usa e getta ha un .env finto e universi suoi; toglierlo lascia intatti i sorgenti', async () => {
    const secrets = fakeSecrets();
    const work = await makeProject(secrets);
    try {
      expect(Object.values(secrets).every((v) => String(v).startsWith('FINTA-'))).toBe(true);
      expect(readFileSync(path.join(work, '.env'), 'utf8')).toContain(secrets.GEMINI_API_KEY);
      expect(lstatSync(path.join(work, 'universes')).isSymbolicLink()).toBe(false);
      for (const name of LINKS) expect(lstatSync(path.join(work, name)).isSymbolicLink(), name).toBe(true);
      expect(LINKS).not.toContain('universes');
    } finally {
      expect(await removeProject(work)).toBeUndefined();
    }
    expect(existsSync(work)).toBe(false);
    expect(existsSync(path.join(REPO, 'src', 'kernel', 'kernel.ts'))).toBe(true);
    expect(existsSync(path.join(REPO, 'universe', 'universe.json'))).toBe(true);
  });

  it('nessun valore finto e nessuna cartella della macchina in ciò che stampa', () => {
    const secrets = { GEMINI_API_KEY: 'FINTA-x' };
    const text = scrub(`a FINTA-x b ${path.join('C:', 'tmp', 'w')}/f ${REPO}/g`, secrets, path.join('C:', 'tmp', 'w'));
    expect(text).not.toContain('FINTA-x');
    expect(text).not.toContain(REPO);
    expect(text).toContain('<tmp>/f');
  });
});

describe('il catalogo delle prove', () => {
  type Probe = { id: string; voce: string; fase: string; proprieta: string; run?: unknown; caso?: string; interna?: string };
  const probes = PROBES as Probe[];
  const REGISTER = readFileSync('docs/sicurezza/registro.md', 'utf8').replace(/\r\n/g, '\n');
  const F12 = readFileSync('docs/sicurezza/prove-f12.md', 'utf8');
  const voices = [...REGISTER.matchAll(/^### (V-\d{3}) · /gm)].map((m) => m[1]);
  const rows = new Map([...REGISTER.matchAll(/^\| (V-\d{3}) \| ([^|]*) \| ([^|]*) \|.*$/gm)].map((m) => [m[1], { kit: m[2].trim(), f12: m[3].trim(), line: m[0] }]));
  const letters = (cell: string) => (cell === '—' ? [] : cell.split(' '));

  it('ogni prova ha un id della sua voce, una proprietà e un modo di girare', () => {
    expect(new Set(probes.map((p) => p.id)).size).toBe(probes.length);
    for (const p of probes) {
      expect(p.id.startsWith(`${p.voce}.`), p.id).toBe(true);
      expect(voices, p.id).toContain(p.voce);
      expect(p.proprieta, p.id).toBeTruthy();
      expect(!!(p.run || p.caso || p.interna), p.id).toBe(true);
    }
  });

  it('il registro dice per ogni voce quale prova la copre', () => {
    expect(voices.length).toBeGreaterThanOrEqual(19);
    for (const v of voices) expect(rows.has(v), `${v} non è nella tabella`).toBe(true);
  });

  it('la tabella del registro è il catalogo, lettera per lettera', () => {
    for (const v of voices) {
      const mine = probes.filter((p) => p.voce === v).map((p) => p.id.slice(6));
      expect(letters(rows.get(v)!.kit), v).toEqual(mine);
    }
  });

  it('la tabella del registro e i blocchi per F12 dicono le stesse prove', () => {
    const inDoc = new Set([...F12.matchAll(/\b(V-\d{3})\.([a-z])\b/g)].map((m) => `${m[1]}.${m[2]}`));
    const inTable = new Set(voices.flatMap((v) => letters(rows.get(v)!.f12).map((l) => `${v}.${l}`)));
    expect([...inDoc].sort()).toEqual([...inTable].sort());
    const kit = new Set(probes.map((p) => p.id));
    for (const id of inDoc) expect(kit.has(id), `${id} sta anche nel kit`).toBe(false);
  });

  it('una voce senza nessuna prova dice perché', () => {
    for (const v of voices) {
      const row = rows.get(v)!;
      if (row.kit === '—' && row.f12 === '—') {
        expect((UNCOVERED as Record<string, string>)[v], v).toBeTruthy();
        expect(row.line, v).toContain((UNCOVERED as Record<string, string>)[v]);
      }
    }
  });

  it('gli esiti non contengono valori di segreti', () => {
    for (const text of [REGISTER, F12]) expect(text).not.toMatch(/AIza[\w-]{10,}|\b[sr]k_(live|test)_\w+|whsec_\w+|FINTA-\w+-[0-9a-f]{6,}/);
  });
});
