// npm run immagine (T367, ADR-0201): the server's image, tagged with the kernel's version of this code and with its contract (`quine42:0.7.10`,
// `quine42:0.7`), never only `latest`: who hosts pins a version and updates when the migrations carry their universes (ADR-0152, ADR-0156).
// Arguments after `--` go to `docker build` as they are (`--platform linux/amd64`, `--no-cache`).

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`package.json: «${version}» non è una versione X.Y.Z del kernel`);
  process.exit(1);
}
const contract = version.split('.').slice(0, 2).join('.');
const extra = process.argv.slice(2).filter((a) => a !== '--');
const args = ['build', '--build-arg', `KERNEL_VERSION=${version}`, '-t', `quine42:${version}`, '-t', `quine42:${contract}`, ...extra, '.'];
console.log(`docker ${args.join(' ')}`);
const run = spawnSync('docker', args, { stdio: 'inherit' });
if (run.error) console.error(`docker non parte: ${run.error.message}`);
if (run.status === 0) console.log(`immagine quine42:${version} (contratto ${contract}) pronta; in .env: QUINE_KERNEL=${version}`);
process.exit(run.status ?? 1);
