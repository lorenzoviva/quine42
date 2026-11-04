// The report for the kernel 1.0.0 (T238, ADR-0129): `npm run mancanze [-- <universo>] [--cartella <dir>]` prints it as Markdown.

import { shortfallReport } from '../../src/kernel/shortfalls';
import { shortfallsOnDisk } from './leggi';

const args = process.argv.slice(2).filter((a) => a !== '--');
const at = args.indexOf('--cartella');
const root = at >= 0 ? args[at + 1] : process.env.QUINE_UNIVERSI || 'universes';
const name = args.find((_, i) => i !== at && i !== at + 1);

if (!root) {
  console.error('--cartella vuole una cartella');
  process.exit(1);
}
try {
  process.stdout.write(shortfallReport(shortfallsOnDisk(root, name)));
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
