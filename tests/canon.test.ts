import { describe, expect, it } from 'vitest';
import { Council, canonSummary } from '../src/kernel/agents/council';
import { bundledFiles } from '../src/kernel/bundle';
import { upgradeFromSeed } from '../src/kernel/universes';
import type { Models, TextCall } from '../src/kernel/ai/models';
import type { FileMap } from '../src/kernel/types';

/** A Council whose model only records what it is asked. */
function council(files: FileMap) {
  const asked: TextCall[] = [];
  const models = { text: async (r: TextCall) => (asked.push(r), '{}') } as unknown as Models;
  return { c: new Council(models, () => ({ files, palette: {}, catalog: [] })), asked };
}

describe('the rune canon', () => {
  it('is in the seed and says what runes are, where they are, that they stay put, what magic does', () => {
    const canon = bundledFiles['world/canone.md'];
    expect(canon).toBeTruthy();
    for (const s of ['Aspetto', 'Dove si trovano', 'Restano dove sono finché qualcuno non le raccoglie', 'La magia', 'Ciò che nessuno sa']) expect(canon).toContain(s);
  });

  it('goes with every narrative task (Narrator and Arbiter), with the magic runes and incantations of the world', async () => {
    const { c, asked } = council(bundledFiles);
    for (const agent of ['narratore', 'arbitro'] as const) {
      const ctx = c.context(agent);
      expect(ctx).toMatch(/## Canone delle rune[\s\S]*nessuna trama/);
      expect(ctx).toContain('Non si spostano');
      expect(ctx).toMatch(/ᛊ Sowilo \(«luce», luce\)/);
      expect(ctx).toMatch(/acqua \+ fuoco → Vapore/);
    }
    for (const agent of ['scultore', 'artista', 'fisico', 'ingegnere', 'cartografo', 'referente'] as const) expect(c.context(agent)).not.toContain('Canone delle rune');
    await c.ask('narratore', 'plot.weave', 'una trama', { type: 'OBJECT' });
    expect(asked[0].system).toContain('Canone delle rune');
  });

  it('lists the runes a universe added; an old universe receives the canon from the seed', () => {
    const files: FileMap = { ...bundledFiles };
    files['modules/magic.stelle/manifest.json'] = JSON.stringify({ id: 'magic.stelle', kind: 'data', runes: { stella: { name: 'Stella', glyph: '✶', color: '#ffffff', element: 'cielo', description: 'la stella: guida' } } });
    expect(canonSummary(files)).toMatch(/✶ Stella \(«stella», cielo\): la stella: guida/);
    const old: FileMap = { ...bundledFiles };
    delete old['world/canone.md'];
    expect(canonSummary(old)).toBe('');
    expect(upgradeFromSeed(old, bundledFiles).files['world/canone.md']).toBe(bundledFiles['world/canone.md']);
  });
});
