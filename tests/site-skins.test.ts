// The site's skins (T283, ADR-0145): each one declares all the base asks for, the pages all follow them, the proportions come from the scale, and a new one is only a folder.

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SKIN, SKIN_KEY, checkManifest, orderSkins } from '../site/skin-core';
import { bootScript, readSkin, readSkins, skinFileOf, skinFiles, skinsDir, type Skin } from '../server/skins';

const ROOT = path.resolve(__dirname, '..');
const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8');
const site = readdirSync(path.join(ROOT, 'site'));
const pages = site.filter((f) => f.endsWith('.html'));
const baseCss = site.filter((f) => f.endsWith('.css'));
const baseFiles = [...baseCss, ...pages, ...site.filter((f) => f.endsWith('.ts'))].map((f) => `site/${f}`);
const dir = skinsDir(ROOT);
const skins = readSkins(dir);
const skinCss = (id: string) => read(`site/skins/${id}/skin.css`);

/** Every token of a skin that the base reads, wherever it reads it (carte.ts holds some as strings). */
const asked = () => new Set(baseFiles.flatMap((f) => [...read(f).matchAll(/--skin-[a-z][a-z0-9-]*/g)].map((m) => m[0])));
const declared = (css: string) => new Set([...css.matchAll(/(--skin-[a-z][a-z0-9-]*)\s*:/g)].map((m) => m[1]));

describe('every skin', () => {
  it('there are the three of the beta, the default first; another one breaks nothing here', () => {
    const ids = skins.map((s) => s.id);
    expect(ids[0]).toBe(DEFAULT_SKIN);
    expect(ids).toEqual(expect.arrayContaining(['sobria', 'fumetto', 'futuristica']));
  });

  it.each(skins.map((s) => s.id))('%s declares all the base asks for', (id) => {
    const has = declared(skinCss(id));
    expect([...asked()].filter((token) => !has.has(token))).toEqual([]);
  });

  it.each(skins.map((s) => s.id))('%s declares its tokens only under its own attribute', (id) => {
    const css = skinCss(id);
    expect(css).toContain(`:root[data-skin='${id}'] {`);
    const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim());
    for (const selector of rules.flatMap((r) => r.split(','))) expect(selector.trim(), id).toContain(`[data-skin='${id}']`);
  });

  it.each(skins.map((s) => s.id))('%s gives the stages colours three.js can read', (id) => {
    for (const token of ['--skin-bg', '--skin-text', '--skin-accent', '--skin-accent-2']) {
      expect(skinCss(id), token).toMatch(new RegExp(`${token}:\\s*#[0-9a-f]{6};`, 'i'));
    }
  });

  it.each(skins.map((s) => s.id))('%s asks nothing of other sites and keeps to the scale', (id) => {
    const css = skinCss(id);
    expect(css).not.toMatch(/https?:\/\/|@import\s+url/);
    expect(rawSizes(css)).toEqual([]);
  });
});

describe('the base', () => {
  it('declares no token of a skin, and no colour of its own', () => {
    for (const file of baseCss) {
      const css = read(`site/${file}`).replace(/\/\*[\s\S]*?\*\//g, '');
      expect([...declared(css)], file).toEqual([]);
      expect(css.match(/#[0-9a-f]{3,8}\b|rgba?\(/gi), file).toBeNull();
    }
  });

  it('no longer reads the names of one look', () => {
    for (const file of baseFiles) expect(read(file), file).not.toMatch(/--(neon|comic|synth|halftone)-|--font-(display|arcade|body|mono)\b|--shadow-hard/);
  });

  it('takes spaces and type only from the scale', () => {
    const texts = [...baseCss, ...pages, 'sessioni.ts'].map((f) => `site/${f}`);
    for (const file of texts) expect(rawSizes(read(file)), file).toEqual([]);
  });

  it('only asks for tokens of the scale that exist', () => {
    const theme = read('src/theme.css');
    for (const file of [...baseCss.map((f) => `site/${f}`), ...skins.map((s) => `site/skins/${s.id}/skin.css`)]) {
      for (const [, token] of read(file).matchAll(/var\((--(?:space|text|measure|leading)-[\w-]+)\)/g)) expect(theme, `${file}: ${token}`).toContain(`${token}:`);
    }
  });
});

describe('every page of the site', () => {
  it.each(pages)('%s follows the skin before anything is drawn', (page) => {
    const html = read(`site/${page}`);
    expect(html).toContain(`<html lang="it" data-skin="${DEFAULT_SKIN}">`);
    expect(html).toContain(`<noscript><link rel="stylesheet" href="/skins/${DEFAULT_SKIN}/skin.css" vite-ignore /></noscript>`);
    const boot = html.indexOf('<script src="/skins/boot.js" vite-ignore></script>');
    expect(boot).toBeGreaterThan(-1);
    expect(boot).toBeLessThan(html.indexOf('rel="stylesheet" href="./'));
    expect(html).toContain('<script type="module" src="./skin.ts"></script>');
    // The look is not in the class of a page any more.
    expect(html).not.toMatch(/<body class="home"/);
  });
});

/** Runs the boot script as a page would, with what the browser remembers. */
function boot(script: string, kept: string | null | Error) {
  const attributes: Record<string, string> = {};
  const written: string[] = [];
  vm.runInNewContext(script, {
    localStorage: {
      getItem: (key: string) => {
        if (kept instanceof Error) throw kept;
        return key === SKIN_KEY ? kept : null;
      },
    },
    document: {
      documentElement: { setAttribute: (name: string, value: string) => (attributes[name] = value) },
      write: (html: string) => written.push(html),
    },
  });
  return { skin: attributes['data-skin'], written: written.join('') };
}

describe('the boot script', () => {
  const script = bootScript(skins);

  it('puts on the default for whoever has not chosen', () => {
    const { skin, written } = boot(script, null);
    expect(skin).toBe(DEFAULT_SKIN);
    expect(written).toContain(`href="/skins/${DEFAULT_SKIN}/skin.css"`);
    expect(written).toContain(`href="/skins/${DEFAULT_SKIN}/icona.svg"`);
  });

  it('puts on what was chosen', () => {
    const { skin, written } = boot(script, 'fumetto');
    expect(skin).toBe('fumetto');
    expect(written).toContain('href="/skins/fumetto/skin.css"');
    expect(written).not.toContain(DEFAULT_SKIN);
  });

  it.each(['non-esiste', '"><script>alert(1)</script>', '../../universes/x', 'constructor', '__proto__', ''])('never writes into the page what is not a skin: %s', (kept) => {
    const { skin, written } = boot(script, kept);
    expect(skin).toBe(DEFAULT_SKIN);
    expect(written).not.toMatch(/alert|universes|constructor|__proto__/);
  });

  it('survives a browser that keeps nothing', () => {
    expect(boot(script, new Error('negato')).skin).toBe(DEFAULT_SKIN);
  });

  it('does not depend on anything loaded yet', () => {
    expect(script).not.toMatch(/\bimport\b|\bfetch\b/);
  });
});

describe('a new skin is only a folder', () => {
  const temp = () => mkdtempSync(path.join(os.tmpdir(), 'quine-skins-'));
  const makeSkin = (root: string, id: string, manifest: unknown = { nome: 'Prova', descrizione: 'Una veste di prova.', icona: 'i.svg' }) => {
    mkdirSync(path.join(root, id), { recursive: true });
    writeFileSync(path.join(root, id, 'skin.json'), JSON.stringify(manifest));
    writeFileSync(path.join(root, id, 'skin.css'), `:root[data-skin='${id}'] {}`);
    writeFileSync(path.join(root, id, 'i.svg'), '<svg/>');
  };

  it('comes up by itself, in the boot script too', () => {
    const root = temp();
    makeSkin(root, 'sobria');
    makeSkin(root, 'nuova');
    expect(readSkins(root).map((s) => s.id)).toEqual(['sobria', 'nuova']);
    expect(boot(bootScript(readSkins(root)), 'nuova').skin).toBe('nuova');
  });

  it('a folder that is not a skin stays out and says why', () => {
    const root = temp();
    makeSkin(root, 'sobria');
    makeSkin(root, 'Maiuscola');
    makeSkin(root, 'senza-nome', { descrizione: 'x', icona: 'i.svg' });
    makeSkin(root, 'senza-icona', { nome: 'x', descrizione: 'x', icona: 'manca.svg' });
    mkdirSync(path.join(root, 'vuota'));
    const problems: string[] = [];
    expect(readSkins(root, problems).map((s) => s.id)).toEqual(['sobria']);
    expect(problems).toHaveLength(4);
  });

  it('does not take the sources to the browser', () => {
    const root = temp();
    makeSkin(root, 'sobria');
    writeFileSync(path.join(root, 'sobria', 'effects.ts'), 'export {}');
    mkdirSync(path.join(root, 'sobria', 'font'));
    writeFileSync(path.join(root, 'sobria', 'font', 'a.woff2'), 'x');
    const skin = readSkin(root, 'sobria') as Skin;
    expect(skinFiles(root, skin).sort()).toEqual(['font/a.woff2', 'i.svg', 'skin.css']);
    expect(skinFileOf(root, '/sobria/skin.css')).toBeTruthy();
    expect(skinFileOf(root, '/sobria/font/a.woff2?v=1')).toBeTruthy();
    expect(skinFileOf(root, '/sobria/effects.ts')).toBeUndefined();
    expect(skinFileOf(root, '/sobria/skin.json')).toBeUndefined();
  });

  it('an address never climbs out of the folder', () => {
    const root = temp();
    makeSkin(root, 'sobria');
    writeFileSync(path.join(root, 'fuori.css'), 'x');
    for (const url of ['/sobria/../fuori.css', '/../fuori.css', '/sobria/..%2ffuori.css', '/sobria/.nascosto.css', '/sobria', '/', '/sobria/non-esiste.css']) expect(skinFileOf(root, url), url).toBeUndefined();
  });

  it('a manifest says all it must', () => {
    expect(typeof checkManifest(null)).toBe('string');
    expect(typeof checkManifest({ nome: 'a', descrizione: 'b', icona: '../x.svg' })).toBe('string');
    expect(checkManifest({ nome: 'a', descrizione: 'b', icona: 'x.svg', altro: 1 })).toEqual({ nome: 'a', descrizione: 'b', icona: 'x.svg' });
    expect(orderSkins(['zeta', 'alfa', DEFAULT_SKIN])).toEqual([DEFAULT_SKIN, 'alfa', 'zeta']);
  });
});

/** The sizes written by hand: `font-size`, `padding`, `margin`, `gap` and their kin in px or rem, and a `line-height` outside the scale. */
function rawSizes(text: string): string[] {
  const declarations = [...text.matchAll(/(?:^|[\s;{"'`])(font-size|line-height|padding[a-z-]*|margin[a-z-]*|gap|row-gap|column-gap)\s*:\s*([^;{}"'`\n]+)/gm)];
  return declarations
    .filter(([, prop, value]) => (prop === 'line-height' ? !/^(var\(--leading-|1\b|inherit)/.test(value.trim()) : /(?<![-\w.])\d*\.?\d+(px|rem)\b/.test(value)))
    .map(([whole]) => whole.trim());
}
