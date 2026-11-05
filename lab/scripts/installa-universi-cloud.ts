// T273: the four universes one can explore, installed in universes/ as git repositories, ready for the browser at no cost:
//   npm run universi:cloud                                  aurora, orichalcum, neapolis, sidera in universes/
//   npm run universi:cloud -- sidera neapolis               only these
//   npm run universi:cloud -- --dir <cartella>              somewhere else (a temporary folder, to try it)
// Then `npm run dev` and http://localhost:5173/?skip&offline (aurora) or ?universo=<nome>&skip&offline.
//
// Each universe is what the kernel reads: the files a universe may hold (`allowedPath`) of universe/ (aurora) or of
// lab/banco/universi-cloud/<nome>/, its maps (aurora's from lab/banco/universi-cloud/aurora/maps/), and `seed.json` with the seed's hashes as the
// browser writes it when a universe is born (main.ts): what the seed has and the universe does not is a choice of the universe, never brought in.
// Then `upgradeFromSeed` as the browser applies it at every load (the seed's new environments, tiles and runes into the manifests of the same
// id), so that the first load commits nothing; the result is checked (the kernel boots it without a fault, every structure of its plans comes
// from its library) and written with one commit by the Genesis, `genesi: …`: a world already born, the Genesis does not start again.
// A universe already there is never deleted: it goes to universes/.cestino/<nome>-<ora>, as «ricomincia dal seme» does.
// No model is called (MockAiModels only), no key is read.

import path from 'node:path';
import { PROGETTO, UNIVERSI } from '../banco/universi-cloud/strumenti/cloud';
import { installa } from '../banco/universi-cloud/strumenti/installa';

{
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const at = args.indexOf('--dir');
  const dir = path.resolve(at >= 0 ? args[at + 1] : path.join(PROGETTO, 'universes'));
  const nomi = args.filter((a, i) => !a.startsWith('--') && (at < 0 || i !== at + 1));
  const unknown = nomi.filter((n) => !UNIVERSI.some((u) => u.nome === n));
  if (unknown.length) {
    console.error(`universi sconosciuti: ${unknown.join(', ')} (ci sono: ${UNIVERSI.map((u) => u.nome).join(', ')})`);
    process.exit(2);
  }
  console.log(`installo in ${dir}`);
  installa({ dir, nomi, log: (s) => console.log(s) })
    .then((r) => {
      console.log(`\n${r.length} universi pronti. npm run dev, poi:`);
      for (const x of r) console.log(`  http://localhost:5173/?${x.nome === 'aurora' ? '' : `universo=${x.nome}&`}skip&offline`);
      process.exit(0);
    })
    .catch((e) => {
      console.error(String(e?.message ?? e));
      process.exit(1);
    });
}
