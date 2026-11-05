// While writing a realm: the game's measures and the variance of one or more programs, on 5 seeds.
import fs from 'node:fs';
import { checkModel } from './verifica';
for (const f of process.argv.slice(2).filter((a) => a.endsWith('.xml'))) {
  const r = checkModel(f.split('/').pop()!.slice(0, -4), fs.readFileSync(f, 'utf8'));
  console.log(f.split('/').pop(), r.errori.length ? r.errori.join('\n  ') : 'OK', `forma ${r.voxel.toFixed(3)} colore ${r.colore.toFixed(3)}`);
}
