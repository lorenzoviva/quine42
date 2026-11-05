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

  it('measures the scale in Fibonacci and Lucas numbers, each about φ times the one before in its row', () => {
    const fibonacci = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610];
    const lucas = [11, 18, 29, 47, 76, 123, 199, 322, 521, 843, 1364];
    const steps = [...theme.matchAll(/--(space|text|measure)-(\d+):\s*(\d+)px/g)];
    expect(steps.length).toBeGreaterThan(20);
    for (const [, kind, name, value] of steps) {
      expect(value, `--${kind}-${name}`).toBe(name);
      if (kind === 'space') expect(fibonacci).toContain(Number(value));
      else expect([...fibonacci, ...lucas]).toContain(Number(value));
    }
    for (const row of [fibonacci, lucas]) {
      for (let i = 4; i < row.length; i++) expect(row[i] / row[i - 1]).toBeCloseTo(1.618, 1);
    }
  });

  it('takes spaces and type only from the scale', () => {
    const declarations = [...style.matchAll(/(?:^|[\s;{])(font-size|font|line-height|padding[a-z-]*|margin[a-z-]*|gap)\s*:\s*([^;{}]+)/g)];
    expect(declarations.length).toBeGreaterThan(100);
    const raw = declarations.filter(([, , value]) => /(?<![-\w.])\d*\.?\d+px/.test(value)).map(([text]) => text.trim());
    expect(raw).toEqual([]);
  });

  it('asks nothing of other sites', () => {
    expect(`${theme}\n${style}`).not.toMatch(/https?:\/\/|@import\s+url/);
  });
});
