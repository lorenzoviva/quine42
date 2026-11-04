// What the universes on this disk say the Council could not do (T238, ADR-0130): it reads `world/mancanze.json` of each one, without
// the server nor the kernel. A folder that starts with a dot is not a universe (`.saldi`, `.cestino`, `.coda`).

import fs from 'node:fs';
import path from 'node:path';
import { readShortfalls, SHORTFALLS_FILE, type Shortfall } from '../../src/kernel/shortfalls';
import { UNIVERSE_NAME_RE } from '../../src/kernel/paths';

export interface UniverseShortfalls {
  universo: string;
  voci: Shortfall[];
}

/** Every universe under `root`, or only the one named. Throws if that name is not a universe of `root`. */
export function shortfallsOnDisk(root: string, name?: string): UniverseShortfalls[] {
  if (name !== undefined && !(UNIVERSE_NAME_RE.test(name) && fs.existsSync(path.join(root, name)))) throw new Error(`universo sconosciuto: ${name}`);
  const names = name !== undefined ? [name] : fs.existsSync(root) ? fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && UNIVERSE_NAME_RE.test(d.name)).map((d) => d.name).sort() : [];
  return names.map((universo) => {
    const file = path.join(root, universo, ...SHORTFALLS_FILE.split('/'));
    return { universo, voci: readShortfalls(fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : undefined) };
  });
}
