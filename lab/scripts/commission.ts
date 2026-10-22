// Prints the commission of a hand-written plan: zone by zone, every configuration it needs and how often
// (what the sculptor reads), over several seeds.
// npx vite-node lab/scripts/commission.ts -- <rocca|cripta> [seeds] [size] [zone]
import { commission, commissionText } from '../mj3d/commission';
import { rocca } from '../programs/rocca';
import { cripta } from '../programs/cripta';

const [name = 'rocca', seeds = '1', size = '0', only] = process.argv.slice(2).filter((a) => a !== '--');
const n = Number(size);
const layout = name === 'cripta' ? cripta(n ? [n, n, 2] : undefined) : rocca(n ? [n, n, 3] : undefined);
for (let seed = 1; seed <= Number(seeds); seed++) {
  const c = commission(layout, seed);
  const zones = only ? { [only]: layout.zones![only] } : layout.zones;
  console.log(`seme ${seed}:\n${commissionText({ ...layout, zones }, c, 30)}`);
}
