// `?dev&teleport=X,Y` (T264): the address of a point that is always the same point. It stops the carpet and drops the
// wanderer at real coordinates; the carpet's offset that `pagehide` saved (the wanderer's position on their carpet) is
// set to zero, otherwise every load closed well moved the same URL by the offset of the time before (46 tiles a time
// for `teleport=46,0`). Without `teleport` nothing changes: whoever closes in the corona starts again where they were.

/** The point `?teleport=X,Y` asks for, only in development; undefined when there is none or it is not two numbers. */
export function teleportTarget(params: URLSearchParams, dev: boolean): { x: number; y: number } | undefined {
  if (!dev) return undefined;
  const raw = params.get('teleport');
  if (!raw) return undefined;
  const parts = raw.split(',');
  if (parts.length !== 2 || parts.some((p) => !p.trim())) return undefined;
  const [x, y] = parts.map(Number);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined;
}

interface Teleportable {
  carpet(): { active: boolean; ox: number; oy: number } | undefined;
  wandererPos(): { x: number; y: number };
}

/** Puts the wanderer at `at`, real and on the carpet alike: the carpet stops and forgets the saved offset. */
export function applyTeleport(k: Teleportable, at: { x: number; y: number }): void {
  const c = k.carpet();
  if (c) Object.assign(c, { active: false, ox: 0, oy: 0 });
  Object.assign(k.wandererPos(), { x: at.x, y: at.y });
}
