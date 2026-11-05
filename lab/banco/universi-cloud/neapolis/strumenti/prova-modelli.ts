import { measureModel } from './misura-modelli';
import { DIR } from './universo';
const ids = (process.env.M ?? 'distributore,macchina-espresso,scrivania-ufficio,banco-officina,quadro-elettrico,edicola,transenna,cucina-trattoria,lampione,motorino,cabina-telefonica,cassonetto,casa-comune-edificio-f2e1f8de,casa-comune-grande-f2e1f8de,struttura-torre-di-vetro,struttura-mercato-coperto').split(',');
let bad = 0;
for (const id of ids) {
  const t = Date.now();
  const r = measureModel(`${DIR}/models/${id}.xml`);
  const ok = !r.errors.length && r.varianza > 0.15;
  if (!ok) bad++;
  console.log(`${ok ? '✓' : '✗'} ${id}: varianza ${r.varianza.toFixed(3)} voxel ${r.voxel.join('/')} (${Date.now() - t} ms)${r.errors.map((e) => '\n    ' + e).join('')}`);
}
process.exit(bad ? 1 : 0);
