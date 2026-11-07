// The kernel's version (T260, ADR-0136): `X.Y.Z` = era . contract with the universe . increment.
// X is 0 through development and beta, 1 from the kernel 1.0.0. Y goes up when a change of src/kernel/ breaks the contract with the
// universes that exist (formats on disk, meaning of a primitive, rules of the ground): a universe of another X.Y needs a new universe,
// or the server of its version. Z goes up with every change of src/kernel/ that stays compatible, and goes back to 0 when Y goes up.
// The same string is in package.json (a test says so) and in every universe.json the kernel writes (`kernel`).
// Every universe says the range of the kernels it runs on (T302, ADR-0152): `kernels`, from the contract it was born or ported with.

export const KERNEL_VERSION = '0.5.2';

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

const showVersion = (v: KernelVersion): string => `${v.major}.${v.minor}.${v.patch}`;

/** A contract with the universes: the `X.Y` of a version. */
export interface Contract {
  major: number;
  minor: number;
}

/**
 * The range of the kernels a universe runs on (T302, ADR-0152), `universe.json → kernels`: from the contract it was born or ported
 * with (`from`) to the last one (`to`). Without `to` the range is open: it reaches the contract of the last kernel that wrote the
 * universe (`kernel`), and goes further only when a migration ports it (`migrations.ts`) or a kernel of the same contract writes it.
 */
export interface KernelRange {
  from: Contract;
  to?: Contract;
}

export const showContract = (c: Contract): string => `${c.major}.${c.minor}`;
export const contractOf = (v: KernelVersion): Contract => ({ major: v.major, minor: v.minor });
/** Negative, zero or positive, as a comes before, is or comes after b. */
export const compareContracts = (a: Contract, b: Contract): number => a.major - b.major || a.minor - b.minor;

/** `X.Y` with plain numbers, or undefined. */
export function parseContract(v: unknown): Contract | undefined {
  if (typeof v !== 'string') return undefined;
  const m = /^(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,4})$/.exec(v.trim());
  return m ? { major: Number(m[1]), minor: Number(m[2]) } : undefined;
}

/** What universe.json says of its kernels, as read: nothing of it is trusted. */
export interface KernelFields {
  kernel?: unknown;
  kernels?: unknown;
}

export interface UniverseKernels {
  /** The kernel that wrote it; `0.1.0` when it does not say it (before the versioning). */
  version: KernelVersion;
  range: KernelRange;
  /** The last contract it runs on: `to`, or the contract of `version` while the range is open. */
  last: Contract;
  /** The range as the places that choose a universe show it: «kernel 0.1–0.1». */
  label: string;
}

/**
 * The kernels a universe runs on, from its universe.json. A universe without `kernels` (written before T302) was born with the
 * contract of `kernel`; one without `kernel` either is of the first contract, `0.1`. What is not a version, or a range that does not hold
 * the kernel that wrote the universe, is a reason in words, never read as something else.
 */
export function universeKernels(fields: KernelFields): { kernels?: UniverseKernels; motivo?: string } {
  const version = parseVersion(fields.kernel === undefined ? '0.1.0' : fields.kernel);
  if (!version) return { motivo: `universe.json → kernel non è una versione X.Y.Z: ${JSON.stringify(fields.kernel)}` };
  const own = contractOf(version);
  let range: KernelRange = { from: own };
  if (fields.kernels !== undefined) {
    const k = fields.kernels && typeof fields.kernels === 'object' && !Array.isArray(fields.kernels) ? (fields.kernels as { from?: unknown; to?: unknown }) : undefined;
    const from = parseContract(k?.from);
    const to = k?.to === undefined ? undefined : parseContract(k.to);
    if (!from || (k?.to !== undefined && !to)) return { motivo: `universe.json → kernels non è un intervallo { "from": "X.Y", "to"?: "X.Y" }: ${JSON.stringify(fields.kernels)}` };
    if (compareContracts(from, own) > 0 || (to && compareContracts(own, to) > 0)) {
      return { motivo: `universe.json → kernels (${showContract(from)}–${to ? showContract(to) : ''}) non contiene il kernel che l'ha scritto, il ${showVersion(version)}` };
    }
    range = to ? { from, to } : { from };
  }
  const last = range.to ?? own;
  return { kernels: { version, range, last, label: `kernel ${showContract(range.from)}–${showContract(last)}` } };
}

/** Whether a contract is in the universe's range. */
export function inRange(k: UniverseKernels, contract: Contract): boolean {
  return compareContracts(k.range.from, contract) <= 0 && compareContracts(contract, k.last) <= 0;
}

export interface VersionCheck {
  ok: boolean;
  /** Why not, in words for the master: the universe's version, its range and the kernel's. */
  motivo?: string;
  /** Out of the range, the label of the range: «kernel 0.1–0.1» (T302). */
  etichetta?: string;
}

/**
 * Whether a universe runs on the kernel `kernelVersion` (ADR-0136, ADR-0152): the kernel's contract is in the universe's range
 * (`kernels`, or derived from `kernel`), and the kernel is not older than the one that wrote the universe (on its contract, a Z not
 * below the universe's; a universe of a later contract never opens here, even if its range went back to this one).
 * A universe that says neither field was written before the versioning, by a kernel of the first contract: it is read as `0.1.0`, and the
 * next commit writes both.
 */
export function checkKernelVersion(universeKernel: unknown, kernelVersion: string = KERNEL_VERSION, kernels?: unknown): VersionCheck {
  const kernel = parseVersion(kernelVersion);
  if (!kernel) return { ok: false, motivo: `la versione del kernel non è valida: ${String(kernelVersion)}` };
  const read = universeKernels({ kernel: universeKernel, kernels });
  if (!read.kernels) return { ok: false, motivo: read.motivo };
  const u = read.kernels;
  const shown = showVersion(u.version);
  const mine = contractOf(kernel);
  if (!inRange(u, mine)) {
    // The server that opens it: the last contract of its range when the kernel is newer, the first when it is older.
    const server = showContract(compareContracts(mine, u.last) > 0 ? u.last : u.range.from);
    return {
      ok: false,
      etichetta: u.label,
      motivo: `questo universo è del kernel ${shown}, il kernel è il ${kernelVersion}: gira sui kernel ${showContract(u.range.from)}–${showContract(u.last)}, un contratto diverso da ${showContract(mine)}. Serve un universo nuovo, o il server della versione ${server}`,
    };
  }
  // Written by a newer kernel, it never opens on an older one, whatever its range says: the range looks forward, never back.
  const newer = compareContracts(contractOf(u.version), mine) || u.version.patch - kernel.patch;
  if (newer > 0) {
    return { ok: false, etichetta: `kernel ${shown} o successivo`, motivo: `questo universo è del kernel ${shown}, più nuovo di questo (${kernelVersion}): aprilo con un kernel ${shown} o successivo` };
  }
  return { ok: true };
}

/** A universe.json's kernels as the places that choose a universe show them: the label when this kernel does not run it. */
export function rangeLabel(fields: KernelFields, kernelVersion: string = KERNEL_VERSION): string | undefined {
  const check = checkKernelVersion(fields.kernel, kernelVersion, fields.kernels);
  return check.ok ? undefined : (check.etichetta ?? 'kernel ?');
}

/**
 * universe.json with `kernel` set to this kernel and `kernels` written (from the contract it was born with, open), or undefined when
 * nothing changes (or the file is not readable: the fault of the configuration says it). Only a universe in the range is stamped: one
 * that is not is never written as if it were ours.
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
  if (!checkKernelVersion(parsed.kernel, kernelVersion, parsed.kernels).ok) return undefined;
  if (parsed.kernel === kernelVersion && parsed.kernels !== undefined) return undefined;
  const range = parsed.kernels ?? { from: showContract(universeKernels(parsed).kernels!.range.from) };
  // `kernels` goes right after `kernel`, where whoever reads the file looks for it.
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (key === 'kernels') continue;
    out[key] = key === 'kernel' ? kernelVersion : value;
    if (key === 'kernel') out.kernels = range;
  }
  if (!('kernel' in parsed)) Object.assign(out, { kernel: kernelVersion, kernels: range });
  return JSON.stringify(out, null, 2) + '\n';
}

/** Whether the text of a universe.json runs on this kernel (T302, T312); one that is not readable is left to the fault of the configuration. */
export function runsOnThisKernel(src: string | undefined): boolean {
  let parsed: { kernel?: unknown; kernels?: unknown } | null;
  try {
    parsed = JSON.parse(src ?? '');
  } catch {
    return true;
  }
  if (!parsed || typeof parsed !== 'object') return true;
  return checkKernelVersion(parsed.kernel, undefined, parsed.kernels).ok;
}
