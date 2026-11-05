// Ogni ambiente di Neapolis sulle bozze vere della città: validateLayout (compila, solo codici noti, finisce, lascia spazio).
import { bootNeapolis } from './universo';

const k = await bootNeapolis();
const content = (k as any).content;
const drafts: string[][] = [];
for (const [cx, cy] of [[0, 0], [-1, -1], [1, -1], [-2, 0], [2, 0], [-2, 1], [0, 1], [-1, 2], [0, 2], [1, 2], [0, -2], [1, -2]]) {
  const d: string = (k as any).genDraft(cx, cy);
  drafts.push(Array.from({ length: 18 }, (_, r) => d.slice(r * 18, r * 18 + 18)));
}
let bad = 0;
for (const [id, def] of Object.entries<any>(content.layouts)) {
  const errors = k.validator.validateLayout(id, def, (k as any).palette, drafts);
  if (errors.length) bad++;
  console.log(`${errors.length ? '✗' : '✓'} ${id}${errors.length ? ': ' + errors.join('; ') : ''}`);
}
console.log(drafts[8].join('\n'));
console.log(`faults: ${k.faults.size}`);
process.exit(bad ? 1 : 0);
