// The migrations of the universes (T302, ADR-0152): the one place where, one day, a universe of a contract `X.Y` is ported to the next.
// Empty today: the author has decided (D36) that a universe no longer compatible is neither thrown away nor migrated, it is labelled with
// the range of the kernels it runs on (`kernels`, version.ts) and left standing with the fault `universe:kernel`. When a contract changes
// and a migration is worth writing, it goes in MIGRATIONS: a pure function from the files of `from` to the files of `to`, with its test.
// The kernel runs the chain at boot (`Kernel.boot`), before the files are read; a ported universe says it in `kernels.from`.

import type { FileMap } from './types';
import { checkKernelVersion, compareContracts, contractOf, KERNEL_VERSION, parseContract, parseVersion, showContract, universeKernels, type Contract } from './version';

export interface Migration {
  /** The contract it reads, `X.Y`. */
  from: string;
  /** The contract it writes, the next one, `X.Y`. */
  to: string;
  /** What it changes, in words for the master and the commit. */
  descrizione: string;
  /** The universe's files of `from` → those of `to`. Pure: the same files give the same files; universe.json's kernels are the kernel's. */
  migrate(files: FileMap): FileMap;
}

/** The migrations from one contract to the next, in order. None yet. */
export const MIGRATIONS: readonly Migration[] = [];

/** The chain from the contract `from` to `to`, one step at a time; undefined when a step is missing (or `to` is not after `from`). */
export function migrationPath(from: Contract, to: Contract, list: readonly Migration[] = MIGRATIONS): Migration[] | undefined {
  if (compareContracts(from, to) >= 0) return undefined;
  const chain: Migration[] = [];
  let at = from;
  while (compareContracts(at, to) < 0) {
    const step = list.find((m) => {
      const a = parseContract(m.from);
      const b = parseContract(m.to);
      return !!a && !!b && compareContracts(a, at) === 0 && compareContracts(b, at) > 0 && compareContracts(b, to) <= 0;
    });
    if (!step) return undefined;
    chain.push(step);
    at = parseContract(step.to)!;
  }
  return chain;
}

export interface MigrationResult {
  files: FileMap;
  /** The migrations applied, «0.1→0.2: …»; empty when the universe stays as it is. */
  applied: string[];
}

/**
 * A universe's files for the kernel `kernelVersion`: the same files when it runs on it already, when it cannot be read, when it is of a
 * contract after this kernel's, or when a step of the chain is missing; ported by the chain otherwise, with `kernel` and
 * `kernels.from` of this kernel (a ported universe was born again with this contract).
 */
export function migrateUniverse(files: FileMap, kernelVersion: string = KERNEL_VERSION, list: readonly Migration[] = MIGRATIONS): MigrationResult {
  const same = { files, applied: [] };
  const kernel = parseVersion(kernelVersion);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(files['universe.json'] ?? '');
  } catch {
    return same;
  }
  if (!kernel || !parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return same;
  if (checkKernelVersion(parsed.kernel, kernelVersion, parsed.kernels).ok) return same;
  const read = universeKernels(parsed).kernels;
  if (!read) return same;
  const chain = migrationPath(read.last, contractOf(kernel), list);
  if (!chain) return same;
  let out = files;
  for (const m of chain) out = m.migrate(out);
  let config: Record<string, unknown>;
  try {
    config = JSON.parse(out['universe.json'] ?? '');
  } catch {
    return same;
  }
  const ported = { ...config, kernel: kernelVersion, kernels: { from: showContract(contractOf(kernel)) } };
  return { files: { ...out, 'universe.json': JSON.stringify(ported, null, 2) + '\n' }, applied: chain.map((m) => `${m.from}→${m.to}: ${m.descrizione}`) };
}
