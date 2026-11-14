// Every window of the game has a way out by a finger (T393): the census of src/ui/panels.ts, held to what the code does.

import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { closesOnTouchOutside, PANELS, touchExits } from '../src/ui/panels';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const sources = (dir: string): string[] =>
  readdirSync(new URL(`../${dir}`, import.meta.url), { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? sources(`${dir}/${d.name}`) : d.name.endsWith('.ts') ? [read(`${dir}/${d.name}`)] : [],
  );
const everything = [read('index.html'), ...sources('src')].join('\n');
const main = read('src/main.ts');
const style = read('src/style.css');
const theme = read('src/theme.css');

describe('i pannelli al tocco', () => {
  it('il censimento ha ogni finestra che il task nomina', () => {
    const names = PANELS.map((p) => p.name).join(' | ');
    for (const word of ['inventario', 'borsa delle rune', 'chat', 'mappa', 'profilo', 'menu delle azioni', 'pannelli dei moduli', 'contenitori', 'dialoghi', 'crediti', 'aiuto', 'comandi']) {
      expect(names, word).toContain(word);
    }
    expect(new Set(PANELS.map((p) => p.id)).size).toBe(PANELS.length);
  });

  it('nessuna finestra resta senza una via d\'uscita al tocco, e nessuna via è un tasto', () => {
    for (const p of PANELS) {
      const exits = touchExits(p);
      expect(exits.length, p.id).toBeGreaterThan(0);
      for (const e of exits) expect(['cross', 'outside', 'choice', 'turn', 'self']).toContain(e);
      if (p.kind === 'window') expect(exits, p.id).toContain('cross');
      else expect(p.exit, p.id).toBeDefined();
      // Where a touch outside does not close, the census says why.
      if (p.outside !== 'yes') expect(p.why, p.id).toBeTruthy();
    }
  });

  it('ogni finestra ha la sua croce nel codice che la costruisce, e le radici esistono', () => {
    for (const p of PANELS) {
      const id = p.root.match(/^#([\w-]+)/)?.[1];
      expect(id, p.id).toBeTruthy();
      expect(everything.includes(`id="${id}"`) || everything.includes(`id: '${id}'`), p.root).toBe(true);
      if (p.kind !== 'window') continue;
      expect(p.file, p.id).toBeTruthy();
      expect(read(p.file!), `${p.id}: ${p.file}`).toContain('closeButton(');
    }
  });

  it('un tocco fuori chiude solo dove non si perde niente, e il gioco ascolta ogni finestra che lo prevede', () => {
    expect(closesOnTouchOutside('yes', true)).toBe(true);
    expect(closesOnTouchOutside('yes', false)).toBe(true);
    expect(closesOnTouchOutside('unlessTyped', false)).toBe(true);
    expect(closesOnTouchOutside('unlessTyped', true)).toBe(false);
    expect(closesOnTouchOutside('no', false)).toBe(false);
    expect(closesOnTouchOutside('no', true)).toBe(false);
    // One watch per root: the inventory's views (bag, containers, the modules' panels) are the same window.
    const roots = new Map<string, string[]>();
    for (const p of PANELS.filter((p) => p.kind === 'window')) roots.set(p.root, [...(roots.get(p.root) ?? []), p.id]);
    for (const [root, ids] of roots) expect(ids.some((id) => main.includes(`outside.watch('${id}'`)), root).toBe(true);
  });

  it('la croce al tocco è grande almeno 44 × 44 px, da un token del tema', () => {
    const token = theme.match(/--touch-target:\s*var\((--measure-\d+)\)/)?.[1];
    expect(token).toBeTruthy();
    const px = Number(theme.match(new RegExp(`${token}:\\s*(\\d+)px`))?.[1]);
    expect(px).toBeGreaterThanOrEqual(44);
    const rule = style.match(/\.touch \.cross \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/min-width:\s*var\(--touch-target\)/);
    expect(rule).toMatch(/min-height:\s*var\(--touch-target\)/);
  });
});
