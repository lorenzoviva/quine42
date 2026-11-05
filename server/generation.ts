// Who has a universe now (T207, ADR-0143): a world of many that the server keeps lit, or a deferred generation. Never both:
// the world would write over what the generation commits, and the other way round. Markers on disk, beside the universes
// (`universes/.accesi/<nome>.json` for a world, `universes/.generazione/<nome>.lock` for a generation), with the pid of who holds them:
// one whose process is gone does not count (a server or a command that was killed).

import fs from 'node:fs';
import path from 'node:path';
import type { DeferredProgress, DeferredStorage } from '../src/kernel/deferred';

export const LIT_DIR = '.accesi';
export const GENERATION_DIR = '.generazione';

function alive(pid: unknown): boolean {
  if (!Number.isInteger(pid) || (pid as number) <= 0) return false;
  try {
    process.kill(pid as number, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'EPERM';
  }
}

function holder(file: string): boolean {
  try {
    return alive(JSON.parse(fs.readFileSync(file, 'utf8')).pid);
  } catch {
    return false;
  }
}

const litFile = (dir: string, name: string) => path.join(dir, LIT_DIR, `${name}.json`);
const lockFile = (dir: string, name: string) => path.join(dir, GENERATION_DIR, `${name}.lock`);

/** The server lights a world: until `worldOut`, no generation starts on its universe. */
export function worldLit(dir: string, name: string, pid = process.pid): void {
  fs.mkdirSync(path.join(dir, LIT_DIR), { recursive: true });
  fs.writeFileSync(litFile(dir, name), JSON.stringify({ pid, dal: new Date().toISOString() }));
}

export function worldOut(dir: string, name: string): void {
  fs.rmSync(litFile(dir, name), { force: true });
}

/** Whether a world of that universe is lit by a live server. */
export function isWorldLit(dir: string, name: string): boolean {
  return holder(litFile(dir, name));
}

/** Whether a live command is generating that universe. */
export function isGenerating(dir: string, name: string): boolean {
  return holder(lockFile(dir, name));
}

/** The universe for this process's generation, or why not: a world lit, another generation. Release it at the end. */
export function takeGeneration(dir: string, name: string, pid = process.pid): { release: () => void } | { error: string } {
  if (isWorldLit(dir, name)) return { error: `«${name}» ha un mondo acceso: si genera solo un universo che nessuno sta giocando` };
  fs.mkdirSync(path.join(dir, GENERATION_DIR), { recursive: true });
  const file = lockFile(dir, name);
  for (let tries = 0; tries < 2; tries++) {
    try {
      fs.writeFileSync(file, JSON.stringify({ pid, dal: new Date().toISOString() }), { flag: 'wx' });
      // The server may have lit it between the look and the lock: it looks at the lock before lighting, so one of the two sees the other.
      if (isWorldLit(dir, name)) {
        fs.rmSync(file, { force: true });
        return { error: `«${name}» ha un mondo acceso: si genera solo un universo che nessuno sta giocando` };
      }
      return { release: () => fs.rmSync(file, { force: true }) };
    } catch {
      if (holder(file)) return { error: `«${name}» si sta già generando` };
      fs.rmSync(file, { force: true }); // left by a command that was killed
    }
  }
  return { error: `«${name}»: il lucchetto della generazione non si prende` };
}

/** The progress of a generation, a file beside the universes: what it did and the ceiling the author may change while it runs. */
export function progressFile(dir: string, name: string, defaults: { tetto: number }): DeferredStorage {
  const file = path.join(dir, GENERATION_DIR, `${name}.json`);
  return {
    load(): DeferredProgress {
      try {
        const j = JSON.parse(fs.readFileSync(file, 'utf8'));
        const tetto = Number(j.tetto);
        return {
          passi: Array.isArray(j.passi) ? j.passi.filter((s: unknown): s is string => typeof s === 'string') : [],
          tetto: Number.isFinite(tetto) && tetto >= 0 ? tetto : defaults.tetto,
          ...(j.partita === 'singola' || j.partita === 'multigiocatore' ? { partita: j.partita } : {}),
          ...(j.consumo && typeof j.consumo === 'object' ? { consumo: { reset: typeof j.consumo.reset === 'string' ? j.consumo.reset : undefined, ultimo: Number(j.consumo.ultimo) || 0, speso: Number(j.consumo.speso) || 0 } } : {}),
        };
      } catch {
        return { passi: [], tetto: defaults.tetto };
      }
    },
    save(p: DeferredProgress): void {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(p, null, 1) + '\n');
      fs.renameSync(tmp, file);
    },
  };
}
