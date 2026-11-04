// The instructions of the beta (T244, ADR-0131): the second part does not reach the build while it is off, its text included; really built, with Vite.

import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build, createServer } from 'vite';
import { betaGuide, guidePage, guideParts, secondPartOn } from '../server/betaGuide';

const ROOT = path.resolve(__dirname, '..');
const FIRST = 'SENTINELLA-PRIMA-PARTE-t244';
const SECOND = 'SENTINELLA-SECONDA-PARTE-t244';

let work: string;
const write = (rel: string, text: string) => {
  mkdirSync(path.dirname(path.join(work, rel)), { recursive: true });
  writeFileSync(path.join(work, rel), text);
};
const clean = () => rmSync(path.join(work, 'docs'), { recursive: true, force: true });

/** Every file under a folder, as one text. */
function allText(dir: string): string {
  return readdirSync(dir)
    .map((name) => {
      const file = path.join(dir, name);
      return statSync(file).isDirectory() ? allText(file) : readFileSync(file, 'latin1');
    })
    .join('\n');
}

/** The real pages of the site, with the instructions of this test's folder. Only those two: the rest of the site does not read them. */
async function built(out: string): Promise<string> {
  await build({
    root: ROOT,
    configFile: false,
    logLevel: 'silent',
    plugins: [betaGuide(work)],
    build: { outDir: out, emptyOutDir: true, rollupOptions: { input: { istruzioni: path.join(ROOT, 'site/istruzioni.html'), site: path.join(ROOT, 'site/index.html') } } },
  });
  return allText(out);
}

beforeAll(() => {
  work = mkdtempSync(path.join(os.tmpdir(), 'quine-beta-'));
});

afterAll(() => {
  rmSync(work, { recursive: true, force: true });
});

describe('le istruzioni della beta', () => {
  it('senza i file non c’è la pagina', () => {
    clean();
    write('site/beta.json', '{ "laCorona": true }');
    expect(guideParts(work)).toEqual([]);
    expect(guidePage(work)).toEqual({});
    write('docs/beta/guida.md', '   \n');
    expect(guidePage(work)).toEqual({});
    write('docs/beta/guida.md', 'Testo.');
    expect(Object.keys(guidePage(work))).toEqual(['istruzioni']);
  });

  it.each([
    ['{ "laCorona": false }', false],
    ['{ "laCorona": "true" }', false],
    ['{ "laCorona": 1 }', false],
    ['{}', false],
    ['non è json', false],
    ['{ "laCorona": true }', true],
  ])('l’interruttore %s', (text, on) => {
    write('site/beta.json', text);
    expect(secondPartOn(work)).toBe(on);
  });

  it('il repository nasce con la seconda parte spenta', () => {
    expect(secondPartOn(ROOT)).toBe(false);
  });

  it('in sviluppo, senza i file la pagina non si rompe, e un file nuovo si vede senza riavviare', async () => {
    clean();
    write('site/beta.json', '{ "laCorona": false }');
    // As in the repository: the folder is there, with its guide, before the texts.
    write('docs/beta/LEGGIMI.md', 'Guida.');
    const server = await createServer({ root: ROOT, configFile: false, logLevel: 'silent', appType: 'custom', server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] }, plugins: [betaGuide(work)] });
    const present = async () => (await server.transformRequest('virtual:quine-istruzioni-presenti'))?.code ?? '';
    try {
      expect(await present()).toContain('guidePresent = false');
      write('docs/beta/guida.md', 'Testo.');
      // The event as the watcher would say it: how long the real one takes on a whole repository is not what is being tried here.
      server.watcher.emit('add', path.join(work, 'docs/beta/guida.md'));
      expect(await present()).toContain('guidePresent = true');
    } finally {
      await server.close();
    }
  }, 60_000);

  it('spenta non finisce in dist, nemmeno il testo; accesa sì, con una riga e nient’altro', async () => {
    clean();
    write('docs/beta/guida.md', `# Prima\n\n${FIRST}`);
    write('docs/beta/la-corona.md', `# Seconda\n\n${SECOND}`);
    const out = path.join(work, 'dist');

    write('site/beta.json', '{ "laCorona": false }');
    const off = await built(out);
    expect(off).toContain(FIRST);
    expect(off).not.toContain(SECOND);
    expect(off).not.toContain('la-corona');
    expect(existsSync(path.join(out, 'site', 'istruzioni.html'))).toBe(true);

    // The landing knows only that the page exists: the text stays with the page.
    const landing = readFileSync(path.join(out, 'site', 'index.html'), 'utf8');
    const scripts = [...landing.matchAll(/src="\/assets\/([^"]+\.js)"/g)].map((m) => readFileSync(path.join(out, 'assets', m[1]), 'latin1')).join('\n');
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts).not.toContain(FIRST);

    write('site/beta.json', '{ "laCorona": true }');
    const on = await built(out);
    expect(on).toContain(FIRST);
    expect(on).toContain(SECOND);
  }, 120_000);
});
