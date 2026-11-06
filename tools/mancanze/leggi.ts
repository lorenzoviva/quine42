// What the universes on this disk say the Council could not do (T238, ADR-0130): it reads `world/shortfalls.json` of each one, without
// the server nor the kernel, or `world/mancanze.json` of one not opened since the contract 0.4 (T308a). A folder that starts with a dot
// is not a universe (`.balances`, `.trash`, `.queue`).

import fs from 'node:fs';
import path from 'node:path';
import { readShortfalls, SHORTFALLS_FILE, type Shortfall } from '../../src/kernel/shortfalls';
import { UNIVERSE_NAME_RE } from '../../src/kernel/paths';
import { pathsBefore } from '../../src/kernel/migrations';

export interface UniverseShortfalls {
  universo: string;
  voci: Shortfall[];
}

/** Every universe under `root`, or only the one named. Throws if that name is not a universe of `root`. */
export function shortfallsOnDisk(root: string, name?: string): UniverseShortfalls[] {
  if (name !== undefined && !(UNIVERSE_NAME_RE.test(name) && fs.existsSync(path.join(root, name)))) throw new Error(`universo sconosciuto: ${name}`);
  const names = name !== undefined ? [name] : fs.existsSync(root) ? fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && UNIVERSE_NAME_RE.test(d.name)).map((d) => d.name).sort() : [];
  return names.map((universo) => {
    const file = pathsBefore([SHORTFALLS_FILE]).map((rel) => path.join(root, universo, ...rel.split('/'))).find((f) => fs.existsSync(f));
    return { universo, voci: readShortfalls(file ? fs.readFileSync(file, 'utf8') : undefined) };
  });
}
