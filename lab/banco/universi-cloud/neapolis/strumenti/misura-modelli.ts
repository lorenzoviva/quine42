// La misura dei modelli di Neapolis: modelErrors del validatore (compila, finisce, poggia, tutto d'un pezzo) e la varianza
// di forma su 5 semi: per ogni coppia di semi, i voxel pieni in uno solo sui voxel pieni in almeno uno; la mediana delle coppie.
import { readFileSync } from 'node:fs';
import { compileMjx } from '../../../../../src/mj/model';
import { FORM_LIMITS, runMjx } from '../../../../../src/mj/run';
import { colorTable } from '../../../../../src/mj/mesh';
import { modelErrors } from '../../../../../src/kernel/validator';
import { boxOf, classOf } from '../../../../../src/mj/classes';

export const SEMI = [1, 2, 3, 4, 5];

export function shapeVariance(xml: string, seeds = SEMI): { varianza: number; voxel: number[] } {
  const size = /<(?!!)[a-z]+\b[^>]*\ssize="/i.test(xml) ? undefined : boxOf(classOf('oggetto')!);
  const m = compileMjx(xml, size ? { size } : {});
  const full = seeds.map((s) => {
    const r = runMjx(m, s, { deadline: 8000, limits: FORM_LIMITS });
    const colors = colorTable(r.grid.alphabet, m.program.palette);
    const set = new Set<number>();
    r.grid.cells.forEach((c, i) => colors[c] && set.add(i));
    return set;
  });
  const d: number[] = [];
  for (let i = 0; i < full.length; i++)
    for (let j = i + 1; j < full.length; j++) {
      let both = 0;
      for (const v of full[i]) if (full[j].has(v)) both++;
      const union = full[i].size + full[j].size - both;
      d.push(union ? 1 - both / union : 0);
    }
  d.sort((a, b) => a - b);
  const mid = d.length / 2;
  return { varianza: d.length % 2 ? d[Math.floor(mid)] : (d[mid - 1] + d[mid]) / 2, voxel: full.map((s) => s.size) };
}

export function measureModel(path: string, xml = readFileSync(path, 'utf8')) {
  const rel = `models/${path.split('/').pop()}`;
  const errors = modelErrors(rel, xml);
  const v = errors.length ? { varianza: 0, voxel: [] } : shapeVariance(xml);
  return { errors, ...v };
}
