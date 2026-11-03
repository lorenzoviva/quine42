// The game's interfaces read the theme (T106, ADR-0095): a token that does not exist fails silently in the browser.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const theme = read('src/theme.css');
const style = read('src/style.css');
const declared = new Set([...`${theme}\n${style}`.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
const used = (text: string) => [...text.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]);

describe('the in-game theme', () => {
  it('uses only tokens that exist', () => {
    const missing = used(`${style}\n${read('src/ui/hud.ts')}`).filter((name) => !declared.has(name));
    expect(missing).toEqual([]);
  });

  it('builds the windows from the tokens of the theme', () => {
    for (const token of ['--border-ink-thick', '--shadow-hard-cyan', '--shadow-hard-pink', '--halftone-cyan', '--halftone-pink', '--font-display', '--font-arcade']) {
      expect(used(style)).toContain(token);
    }
  });

  it('asks nothing of other sites', () => {
    expect(`${theme}\n${style}`).not.toMatch(/https?:\/\/|@import\s+url/);
  });
});
