// La quarta parete di Neapolis da sola: npx vite-node lab/banco/universi-cloud/neapolis/strumenti/prova-quarta-parete.ts
import { checkFourthWall } from './quarta-parete';
const r = checkFourthWall();
console.log(`${r.files} file, ${r.texts} testi, ${r.breaks.length} rotture`);
for (const b of r.breaks) console.log(`  ✗ ${b}`);
process.exit(r.breaks.length ? 1 : 0);
