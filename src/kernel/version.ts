// The kernel's version (T260, ADR-0136): `X.Y.Z` = era . contract with the universe . increment.
// X is 0 through development and beta, 1 from the kernel 1.0.0. Y goes up when a change of src/kernel/ breaks the contract with the
// universes that exist (formats on disk, meaning of a primitive, rules of the ground): a universe of another X.Y needs a new universe,
// or the server of its version. Z goes up with every change of src/kernel/ that stays compatible, and goes back to 0 when Y goes up.
// The same string is in package.json (a test says so) and in every universe.json the kernel writes (`kernel`).

export const KERNEL_VERSION = '0.1.0';

export interface KernelVersion {
  major: number;
  minor: number;
  patch: number;
}

/** `X.Y.Z` with plain numbers, or undefined. */
export function parseVersion(v: unknown): KernelVersion | undefined {
  if (typeof v !== 'string') return undefined;
  const m = /^(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,5})$/.exec(v.trim());
  if (!m) return undefined;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

export interface VersionCheck {
  ok: boolean;
  /** Why not, in words for the master: the universe's version and the kernel's. */
  motivo?: string;
}

/**
 * Whether a universe written by the kernel `universeKernel` runs on the kernel `kernelVersion`: the same X.Y and a Z not above the
 * kernel's. A universe that does not say it (`undefined`) was written before the versioning, by a kernel of the first contract: it is
 * read as `0.1.0`, and the next commit writes the field.
 */
export function checkKernelVersion(universeKernel: unknown, kernelVersion: string = KERNEL_VERSION): VersionCheck {
  const kernel = parseVersion(kernelVersion);
  if (!kernel) return { ok: false, motivo: `la versione del kernel non è valida: ${String(kernelVersion)}` };
  const raw = universeKernel === undefined ? '0.1.0' : universeKernel;
  const u = parseVersion(raw);
  if (!u) return { ok: false, motivo: `universe.json → kernel non è una versione X.Y.Z: ${JSON.stringify(universeKernel)}` };
  const shown = `${u.major}.${u.minor}.${u.patch}`;
  if (u.major !== kernel.major || u.minor !== kernel.minor) {
    return { ok: false, motivo: `questo universo è del kernel ${shown}, il kernel è il ${kernelVersion}: un contratto diverso (${u.major}.${u.minor} contro ${kernel.major}.${kernel.minor}). Serve un universo nuovo, o il server della versione ${u.major}.${u.minor}` };
  }
  if (u.patch > kernel.patch) {
    return { ok: false, motivo: `questo universo è del kernel ${shown}, più nuovo di questo (${kernelVersion}): aprilo con un kernel ${u.major}.${u.minor}.${u.patch} o successivo` };
  }
  return { ok: true };
}

/**
 * universe.json with `kernel` set to this kernel, or undefined when nothing changes (or the file is not readable: the fault of the
 * configuration says it). Only a compatible universe is stamped: an incompatible one is never written as if it were ours.
 */
export function stampKernel(src: string | undefined, kernelVersion: string = KERNEL_VERSION): string | undefined {
  if (!src) return undefined;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(src);
  } catch {
    return undefined;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
  if (parsed.kernel === kernelVersion || !checkKernelVersion(parsed.kernel, kernelVersion).ok) return undefined;
  return JSON.stringify({ ...parsed, kernel: kernelVersion }, null, 2) + '\n';
}
