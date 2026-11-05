// Every environment of orichalcum through Validator.validateLayout, on the real drafts of the nineteen planned places.
import { avvia, RADICE } from './carica';
import { LUOGHI } from './luoghi';

const { k } = await avvia(RADICE + 'orichalcum/');
const kk = k as any;
const drafts = LUOGHI.map(([cx, cy]) => kk.rows(kk.genDraft(cx, cy)) as string[]);
const layouts = k.content.layouts;
let bad = 0;
for (const [id, def] of Object.entries(layouts)) {
  const e = k.validator.validateLayout(id, def as any, k.palette, drafts);
  console.log(e.length ? `✗ ${id}: ${e.join('; ')}` : `✓ ${id}`);
  bad += e.length;
}
console.log('fault:', [...k.faults.list?.() ?? []].map((f: any) => f.key));
process.exit(bad ? 1 : 0);
