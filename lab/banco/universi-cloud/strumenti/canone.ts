// Writes world/canone.md of orichalcum: the seed's canon plus one line per rune of magic.vapore (canonWithRune), each rune validated
// with validateNewRune against all the other eighteen (in groups under MAX_MAGIC_RUNES: the cap is for what the Council adds, ADR-0097).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { canonWithRune, MAX_MAGIC_RUNES, validateNewRune } from '../../../../src/kernel/magic';
import { lexiconWords } from '../../../../src/kernel/fourthwall';
import type { MagicRune } from '../../../../src/kernel/types';

const U = fileURLToPath(new URL('../orichalcum/', import.meta.url));
const read = (p: string) => readFileSync(U + p, 'utf8');
const seed: Record<string, MagicRune> = JSON.parse(read('modules/magic.runes/manifest.json')).runes;
const mine: Record<string, MagicRune> = JSON.parse(read('modules/magic.vapore/manifest.json')).runes;
const lines: Record<string, string> = JSON.parse(readFileSync(process.argv[2] ?? '/dev/null', 'utf8') || '{}');
const words = lexiconWords(read('world/lessico.md'));
let canon = readFileSync(new URL('../../../../universe/world/canone.md', import.meta.url), 'utf8');
canon = canon.replace("né inventare altri segni luminosi nel terreno", "né inventare altre incisioni che brillano nel terreno");
let bad = 0;
for (const [token, r] of Object.entries(mine)) {
  const others = Object.entries({ ...seed, ...mine }).filter(([t]) => t !== token);
  const errors = new Set<string>();
  for (let i = 0; i < others.length; i += MAX_MAGIC_RUNES - 1) {
    const v = validateNewRune({ token, nome: r.name, glifo: r.glyph, colore: r.color, elemento: r.element, descrizione: r.description, canone: lines[token] ?? r.description }, Object.fromEntries(others.slice(i, i + MAX_MAGIC_RUNES - 1)), words);
    v.errors.forEach((e) => errors.add(e));
    if (v.rune && v.rune.rune.glyph !== r.glyph) errors.add(`il segno ${r.glyph} è stato cambiato in ${v.rune.rune.glyph}`);
    if (i === 0 && v.rune) canon = canonWithRune(canon, v.rune);
  }
  console.log(errors.size ? `✗ ${token}: ${[...errors].join('; ')}` : `✓ ${token} (${r.name} ${r.glyph})`);
  bad += errors.size;
}
if (process.argv[2]) writeFileSync(U + 'world/canone.md', canon);
process.exit(bad ? 1 : 0);
