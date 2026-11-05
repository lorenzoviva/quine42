// The site's skins (T283, ADR-0145): a skin is a folder of `site/skins/`, and adding one touches nothing else. This plugin finds them, writes the script that puts one
// on before the page is drawn, and serves their files as they are, at the same addresses in development and in the build (`/skins/...`, plain files in `dist/`: no route).

import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { DEFAULT_SKIN, SKIN_FILE_RE, SKIN_ID_RE, SKIN_KEY, checkManifest, orderSkins, type SkinManifest } from '../site/skin-core';

export interface Skin extends SkinManifest {
  id: string;
}

/** What a browser may fetch from a skin: not its `skin.json` or `effects.ts`, which Vite bundles through `site/skin.ts`. */
const TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

export const skinsDir = (root: string) => path.join(root, 'site', 'skins');

/** The reason a folder is not a skin, or its skin. */
export function readSkin(dir: string, id: string): Skin | string {
  if (!SKIN_ID_RE.test(id)) return `«${id}»: nome di cartella non valido`;
  const folder = path.join(dir, id);
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(path.join(folder, 'skin.json'), 'utf8'));
  } catch {
    return `${id}: skin.json manca o non si legge`;
  }
  const manifest = checkManifest(raw);
  if (typeof manifest === 'string') return `${id}: ${manifest}`;
  if (!fs.existsSync(path.join(folder, 'skin.css'))) return `${id}: manca skin.css`;
  if (!fs.existsSync(path.join(folder, manifest.icona))) return `${id}: manca ${manifest.icona}`;
  return { id, ...manifest };
}

/** The skins of a folder, the default first. A folder that is not one is left out and `problems` says why: it must not take the site down. */
export function readSkins(dir: string, problems: string[] = []): Skin[] {
  let ids: string[];
  try {
    ids = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
  const found: Skin[] = [];
  for (const id of orderSkins(ids)) {
    const skin = readSkin(dir, id);
    if (typeof skin === 'string') problems.push(skin);
    else found.push(skin);
  }
  return found;
}

/**
 * The script at the top of every page. It runs before anything is drawn, and `document.write` is what makes that enough: a stylesheet the parser meets holds the first paint,
 * one added from a script does not, and the CSP leaves no inline script. What the browser remembers only chooses among the known ids: it is never written into the page.
 */
export function bootScript(skins: Skin[], fallback: string = DEFAULT_SKIN): string {
  const icons = Object.fromEntries(skins.map((s) => [s.id, s.icona]));
  return `(function () {
  var icons = ${JSON.stringify(icons)};
  var id = ${JSON.stringify(fallback)};
  try {
    var kept = localStorage.getItem(${JSON.stringify(SKIN_KEY)});
    if (kept && Object.prototype.hasOwnProperty.call(icons, kept)) id = kept;
  } catch (e) {}
  document.documentElement.setAttribute('data-skin', id);
  document.write('<link rel="stylesheet" id="skin-sheet" href="/skins/' + id + '/skin.css">');
  document.write('<link rel="icon" id="skin-icon" href="/skins/' + id + '/' + icons[id] + '">');
})();
`;
}

/** The files a browser may fetch from a skin, relative to its folder. */
export function skinFiles(dir: string, skin: Skin): string[] {
  const walk = (rel: string): string[] =>
    fs.readdirSync(path.join(dir, skin.id, rel), { withFileTypes: true }).flatMap((e) => {
      const name = path.posix.join(rel, e.name);
      if (e.isDirectory()) return walk(name);
      return e.isFile() && TYPES[path.extname(e.name).toLowerCase()] ? [name] : [];
    });
  return walk('');
}

/** The file of an address under /skins/, or undefined: each piece is a plain name, so nothing here climbs out of the folder. */
export function skinFileOf(dir: string, url: string): string | undefined {
  const [first, ...rest] = url.split(/[?#]/)[0].split('/').filter(Boolean);
  if (!SKIN_ID_RE.test(first ?? '') || !rest.length || !rest.every((piece) => SKIN_FILE_RE.test(piece))) return undefined;
  const file = path.join(dir, first, ...rest);
  if (!TYPES[path.extname(file).toLowerCase()]) return undefined;
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : undefined;
}

export function siteSkins(root: string): Plugin {
  const dir = skinsDir(root);
  return {
    name: 'quine-skins',
    configureServer(server) {
      // Read at each request: a new folder needs no restart.
      server.middlewares.use('/skins', (req, res, next) => {
        const url = req.url ?? '/';
        if (url.split('?')[0] === '/boot.js') {
          res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          return void res.end(bootScript(readSkins(dir)));
        }
        const file = skinFileOf(dir, url);
        if (!file) return next();
        res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()]);
        res.setHeader('Cache-Control', 'no-cache');
        fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
      });
    },
    generateBundle() {
      const problems: string[] = [];
      const skins = readSkins(dir, problems);
      for (const problem of problems) this.warn(`veste scartata: ${problem}`);
      if (!skins.some((s) => s.id === DEFAULT_SKIN)) this.error(`manca la veste di partenza, ${DEFAULT_SKIN}`);
      this.emitFile({ type: 'asset', fileName: 'skins/boot.js', source: bootScript(skins) });
      for (const skin of skins) {
        for (const file of skinFiles(dir, skin)) this.emitFile({ type: 'asset', fileName: `skins/${skin.id}/${file}`, source: fs.readFileSync(path.join(dir, skin.id, file)) });
      }
    },
  };
}
