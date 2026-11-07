// The instructions of the beta (T244, ADR-0131): Markdown in docs/beta/, in the build only when they are there and only what is switched on. The second part is a surprise
// of the test: while it is off its text is not in `dist/` at all, not even hidden, because no module ever reads it. `site/beta.json` is the switch: nothing else decides.

import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/** The text of the page. */
const PARTS_ID = 'virtual:quine-istruzioni';
/** Only whether the page exists: for who links to it, without carrying its text. */
const PRESENT_ID = 'virtual:quine-istruzioni-presenti';
/** Whether the labs are open in this build (T294): the site's links to them, and their entry page, exist only then. */
const LABS_ID = 'virtual:quine-laboratori';

export interface GuidePart {
  id: 'guida' | 'la-corona';
  md: string;
}

const guideFile = (root: string, id: GuidePart['id']) => path.join(root, 'docs', 'beta', `${id}.md`);
const switchFile = (root: string) => path.join(root, 'site', 'beta.json');

/** A switch of `site/beta.json`: off unless the file says exactly `true`. A file that is not there, or that does not read, turns nothing on. */
function switchOn(root: string, name: 'laCorona' | 'laboratori'): boolean {
  try {
    return (JSON.parse(fs.readFileSync(switchFile(root), 'utf8')) as Record<string, unknown>)[name] === true;
  } catch {
    return false;
  }
}

/** Off unless the file says exactly so: a file that is not there, or that does not read, shows nothing more. */
export const secondPartOn = (root: string): boolean => switchOn(root, 'laCorona');

/**
 * The labs for the players (T293, ADR-0161), a switch of their own, apart from the second part: off, the routes of the handmade cards refuse
 * everyone and the production server does not serve `/lab`. The dev server reads it at every request, the production server when it starts.
 */
export const labsOn = (root: string): boolean => switchOn(root, 'laboratori');

/** The site's entry page of the labs (T294, ADR-0169) among the build's inputs: only with `laboratori` on. */
export function labsPage(root: string): Record<string, string> {
  return labsOn(root) ? { laboratori: path.resolve(root, 'site/laboratori.html') } : {};
}

/** The parts to show, in order: a file that does not exist yet, or is empty, is not one. */
export function guideParts(root: string): GuidePart[] {
  const ids: GuidePart['id'][] = secondPartOn(root) ? ['guida', 'la-corona'] : ['guida'];
  const parts: GuidePart[] = [];
  for (const id of ids) {
    try {
      const md = fs.readFileSync(guideFile(root, id), 'utf8');
      if (md.trim()) parts.push({ id, md });
    } catch {
      /* not written yet */
    }
  }
  return parts;
}

/** The page among the build's inputs: without text, there is no page. */
export function guidePage(root: string): Record<string, string> {
  return guideParts(root).length ? { istruzioni: path.resolve(root, 'site/istruzioni.html') } : {};
}

export function betaGuide(root: string): Plugin {
  const resolved = (id: string) => `\0${id}`;
  return {
    name: 'quine-beta-guide',
    resolveId(id) {
      return id === PARTS_ID || id === PRESENT_ID || id === LABS_ID ? resolved(id) : undefined;
    },
    load(id) {
      if (id === resolved(LABS_ID)) return `export const labsOpen = ${labsOn(root)};`;
      if (id !== resolved(PARTS_ID) && id !== resolved(PRESENT_ID)) return undefined;
      const parts = guideParts(root);
      return id === resolved(PARTS_ID) ? `export const parts = ${JSON.stringify(parts)};` : `export const guidePresent = ${parts.length > 0};`;
    },
    // In `npm run dev` a new file or the switch show at once. Not `addWatchFile`: for Vite that is an import, and a file not written yet would break the page.
    configureServer(server) {
      const files = [switchFile(root), guideFile(root, 'guida'), guideFile(root, 'la-corona')].map((f) => path.resolve(f));
      server.watcher.add(files);
      const changed = (file: string) => {
        if (!files.includes(path.resolve(file))) return;
        for (const id of [PARTS_ID, PRESENT_ID, LABS_ID]) {
          const module = server.moduleGraph.getModuleById(resolved(id));
          if (module) server.moduleGraph.invalidateModule(module);
        }
        server.ws.send({ type: 'full-reload' });
      };
      for (const event of ['add', 'change', 'unlink'] as const) server.watcher.on(event, changed);
    },
  };
}
