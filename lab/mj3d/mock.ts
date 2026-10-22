// Offline models for the lab: the sculptor answers with the hand-written example closest to the request,
// the artist with a neutral review. Enough to try the page and the tests without a key.

import { emptyUsage, type ImageCall, type Models, type TextCall } from '../../src/kernel/ai/models';
import { exampleFor } from './examples';
import { rocca, ROCCA } from '../programs/rocca';
import { cripta, CRIPTA } from '../programs/cripta';
import type { Target } from './sculptor';

export class LabMockModels implements Models {
  readonly name = 'offline';
  readonly canPaint = false;
  readonly usage = emptyUsage();
  limits = { text: Infinity, images: 0 };

  async text(call: TextCall): Promise<string> {
    this.usage.text++;
    const t = (call.data as { target?: Target })?.target;
    // Structures: the hand-written castle (rocca), or the dungeon (cripta) when the request is underground.
    const under = /sotterr|dungeon|cripta|grotta|miniera|corridoi/i.test(`${t?.name ?? ''} ${t?.description ?? ''}`);
    const set = under ? CRIPTA : ROCCA;
    const tiles = (t as { tiles?: [number, number, number] } | undefined)?.tiles;
    // The hand-written plans need their own number of levels (the keep has three, the crypt two).
    const layout = under ? cripta(tiles && [tiles[0], tiles[1], 2]) : rocca(tiles && [tiles[0], tiles[1], 3]);
    // A plan written before the blocks (ADR-0035): the same zones, without their blocks (the empty cell stays).
    if (call.task === 'lab.plan')
      return JSON.stringify({ ...layout, zones: Object.fromEntries(Object.entries(layout.zones ?? {}).map(([k, z]) => [k, { name: z.name, describe: z.describe ?? z.name, ...(z.blocks?.includes('.') ? { blocks: '.' } : {}) }])) });
    // Each block serves the zones that list it in the hand-written plan.
    const serves = (code: string) => Object.entries(layout.zones ?? {}).filter(([, z]) => z.blocks?.includes(code)).map(([k]) => k);
    if (call.task === 'lab.catalog') return JSON.stringify({ ...set, blocks: set.blocks.map(({ program: _p, ...b }) => ({ ...b, serves: serves(b.code) })) });
    if (call.task === 'lab.programs') {
      const codes = (call.data as { codes?: string[] })?.codes ?? [];
      return JSON.stringify({ programs: Object.fromEntries(set.blocks.filter((b) => codes.includes(b.code)).map((b) => [b.code, { palette: b.program.palette, program: b.program.program }])) });
    }
    if (call.task === 'lab.layout') return JSON.stringify(layout);
    // A late order: the hand-written blocks of the zones whose configurations lack one, programs included.
    if (call.task === 'lab.order') {
      const zones = new Set(((call.data as { missing?: Array<{ zone: string }> })?.missing ?? []).map((m) => m.zone));
      return JSON.stringify({ blocks: set.blocks.filter((b) => serves(b.code).some((z) => zones.has(z))).map((b) => ({ ...b, serves: serves(b.code) })) });
    }
    if (call.task === 'lab.review')
      return JSON.stringify({ voto: 6, riconoscibile: true, problemi: ['giudizio offline: nessun modello ha guardato le viste'], consigli: [], verdetto: 'da rifare' });
    const e = exampleFor(`${t?.name ?? ''} ${t?.description ?? ''} ${t?.look ?? ''}`, t?.kind);
    return JSON.stringify({ ...e.program, name: t?.name ?? e.program.name });
  }

  async image(_call: ImageCall): Promise<string | null> {
    return null;
  }
}
