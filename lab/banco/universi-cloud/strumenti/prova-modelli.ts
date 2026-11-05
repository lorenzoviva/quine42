// The bench of models and sounds: `npx vite-node lab/banco/universi-cloud/strumenti/prova-modelli.ts [-- id …]`.
import { MODELLI, provaModello, provaSuono, SUONI } from './modelli';

{
  const ids = process.argv.slice(2).filter((a) => a !== '--');
  let bad = 0;
  for (const id of ids.length ? ids : [...MODELLI, ...SUONI]) {
    const sound = id.startsWith('suono-');
    const r = sound ? provaSuono(id) : provaModello(id);
    bad += r.errori.length;
    const info = sound ? `${(r as any).effetto ? 'effetto' : 'brano'}` : `varianza ${(r as any).varianza?.toFixed(3) ?? '–'} voxel ${(r as any).voxel?.join('/') ?? ''}`;
    console.log(`${r.errori.length ? '✗' : '✓'} ${id} (${r.ms} ms) ${info}${r.errori.length ? '\n  ' + r.errori.slice(0, 6).join('\n  ') : ''}`);
  }
  process.exit(bad ? 1 : 0);
}
