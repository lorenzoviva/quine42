// Misura i programmi sonori di una cartella (D, filtro F) su 10 terne di semi: D=lab/banco/universi-cloud/neapolis/models F=neapolis npx vite-node …/prova-suoni.ts
import { readdirSync } from 'node:fs';
import { measureSound } from './misura-suoni';
const dir = process.env.D ?? 'universe/models';
for (const f of readdirSync(dir).filter((x) => x.startsWith('suono-') && (!process.env.F || x.includes(process.env.F)))) {
  const t = Date.now();
  const r = measureSound(`${dir}/${f}`);
  console.log(`${r.errors.length || r.issues.length ? '✗' : '✓'} ${f} ${r.effect ? '(effetto)' : ''} ${Date.now() - t}ms ${[...r.errors, ...r.issues.slice(0, 3)].join(' | ')}`);
}
