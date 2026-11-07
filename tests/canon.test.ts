import { describe, expect, it } from 'vitest';
import { Council, canonSummary } from '../src/kernel/agents/council';
import { bundledFiles } from '../src/kernel/bundle';
import { upgradeFromSeed } from '../src/kernel/universes';
import type { AiModels, TextCall } from '../src/kernel/ai/models';
import type { FileMap } from '../src/kernel/types';

/** A Council whose model only records what it is asked. */
function council(files: FileMap) {
  const asked: TextCall[] = [];
  const models = { text: async (r: TextCall) => (asked.push(r), '{}') } as unknown as AiModels;
  return { c: new Council(models, () => ({ files, palette: {}, catalog: [] })), asked };
}

describe('the rune canon', () => {
  it('is in the seed and says what runes are, where they are, that they stay put, what magic does', () => {
    const canon = bundledFiles['world/canon.md'];
    expect(canon).toBeTruthy();
    for (const s of ['Aspetto', 'Dove si trovano', 'Restano dove sono finché qualcuno non le raccoglie', 'La magia', 'Ciò che nessuno sa']) expect(canon).toContain(s);
  });

  it('goes with every narrative task (Narrator and Arbiter), with the magic runes and incantations of the world', async () => {
    const { c, asked } = council(bundledFiles);
    for (const agent of ['narrator', 'arbiter'] as const) {
      const ctx = c.context(agent);
      expect(ctx).toMatch(/## Canon of the runes[\s\S]*no plot/);
      expect(ctx).toContain('Non si spostano');
      // The token is Latin (T307a), the element in the language of the world.
      expect(ctx).toMatch(/ᛊ Sowilo \(«lux», luce\)/);
      expect(ctx).toMatch(/terra \+ ignis → Palla di fuoco/);
    }
    for (const agent of ['sculptor', 'artist', 'physicist', 'engineer', 'cartographer', 'liaison'] as const) expect(c.context(agent)).not.toContain('Canon of the runes');
    await c.ask('narrator', 'plot.weave', 'una trama', { type: 'OBJECT' });
    expect(asked[0].system).toContain('Canon of the runes');
  });

  it('lists the runes a universe added; an old universe receives the canon from the seed', () => {
    const files: FileMap = { ...bundledFiles };
    files['modules/magic.stelle/manifest.json'] = JSON.stringify({ id: 'magic.stelle', kind: 'data', runes: { stella: { name: 'Stella', glyph: '✶', color: '#ffffff', element: 'cielo', description: 'la stella: guida' } } });
    expect(canonSummary(files)).toMatch(/✶ Stella \(«stella», cielo\): la stella: guida/);
    const old: FileMap = { ...bundledFiles };
    delete old['world/canon.md'];
    expect(canonSummary(old)).toBe('');
    expect(upgradeFromSeed(old, bundledFiles).files['world/canon.md']).toBe(bundledFiles['world/canon.md']);
  });
});
