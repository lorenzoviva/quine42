// How near and how far the camera goes (T387): what the wheel and a pinch of two fingers share, with the same limits.
// Pure, without three.js: the renderer applies it, the touch controls (src/ui/touch.ts) ask it, the tests read it.

/**
 * The camera's distance from the wanderer, in tiles: never nearer than `min`; in the simulation never further than the
 * default view (`max`), at a vehicle's helm (T439) up to `helm`, to see the hull and the shore; with the free orbit (god mode,
 * the corona, the studio, following a player) up to `freeMax`.
 */
export const ZOOM = { min: 2.5, max: 15, helm: 30, freeMax: 45 } as const;

/** Where the camera draws back to when the helm is taken (T439), if it is nearer: the wheel goes on from there. */
export const HELM_VIEW = 22;

/** How far the camera may go now: the free orbit's, the helm's, or the simulation's. */
export function zoomMax(free: boolean, helm = false): number {
  return free ? ZOOM.freeMax : helm ? ZOOM.helm : ZOOM.max;
}

/** One notch of the wheel: further (down) or nearer (up). */
export const WHEEL = { out: 1.12, in: 0.89 } as const;

/** The factor of one notch of the wheel: only its sign counts, as before. */
export function wheelFactor(deltaY: number): number {
  return deltaY > 0 ? WHEEL.out : WHEEL.in;
}

/** The distance scaled by `factor`, within the limits; what is not a number leaves it where it was (within them). */
export function zoomDistance(distance: number, factor: number, free: boolean, helm = false): number {
  const max = zoomMax(free, helm);
  const from = Number.isFinite(distance) ? distance : ZOOM.max;
  const to = Number.isFinite(factor) && factor > 0 ? from * factor : from;
  return Math.min(max, Math.max(ZOOM.min, to));
}

/**
 * A pinch: the distance the camera had when the two fingers touched, scaled by how their span changed. Fingers that
 * part bring the camera nearer (as the wheel up), fingers that close take it further; a span of nothing changes nothing.
 */
export function pinchDistance(startDistance: number, startSpan: number, span: number, free: boolean, helm = false): number {
  const factor = startSpan > 0 && span > 0 ? startSpan / span : 1;
  return zoomDistance(startDistance, factor, free, helm);
}
