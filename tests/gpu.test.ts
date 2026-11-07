import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { GPU_PREFERENCE } from '../src/render/gpu';

/** T330: every WebGL renderer of the game, the lab and the site asks for the dedicated GPU through one helper. */
function sources(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sources(path));
    else if (/\.(ts|tsx|js|mjs)$/.test(name)) out.push(path);
  }
  return out;
}

describe('the GPU of the renderers (T330)', () => {
  it('asks for the high-performance GPU', () => {
    expect(GPU_PREFERENCE).toBe('high-performance');
  });

  it('no source builds a WebGLRenderer outside the helper', () => {
    const files = ['src', 'lab', 'site'].flatMap(sources);
    const helper = join('src', 'render', 'gpu.ts');
    const direct = files.filter((f) => f !== helper && /new\s+(THREE\.)?WebGLRenderer\s*\(/.test(readFileSync(f, 'utf8')));
    expect(direct).toEqual([]);
    const users = files.filter((f) => /\bmakeRenderer\(/.test(readFileSync(f, 'utf8')));
    expect(users.length).toBeGreaterThanOrEqual(7);
  });
});
