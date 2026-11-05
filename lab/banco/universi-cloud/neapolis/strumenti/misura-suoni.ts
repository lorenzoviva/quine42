// La misura dei programmi sonori di Neapolis: modelErrors del validatore (tre semi, le soglie dell'analisi) e
// analyzeSound su 10 terne di semi diverse: nessun difetto in nessuna terna.
import { readFileSync } from 'node:fs';
import { compileMjx } from '../../../../../src/mj/model';
import { analyzeSound } from '../../../../../src/mj/soundanalysis';
import { modelErrors } from '../../../../../src/kernel/validator';

export const TERNE: number[][] = Array.from({ length: 10 }, (_, i) => [3 * i + 1, 3 * i + 2, 3 * i + 3]);

export function measureSound(path: string, xml = readFileSync(path, 'utf8')) {
  const errors = modelErrors(`models/${path.split('/').pop()}`, xml);
  const m = compileMjx(xml);
  const issues: string[] = [];
  let effect = false;
  for (const seeds of TERNE) {
    const r = analyzeSound(m, { seeds, frugal: true, deadline: 6000 });
    effect = r.effect;
    for (const i of r.issues) issues.push(`semi ${seeds.join(',')}: ${i.defect}: ${i.message}`);
  }
  return { errors, issues, effect };
}
