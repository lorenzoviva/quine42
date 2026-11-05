// The «fumetto» skin's motion (T285, ADR-0145): the halftone of the pages (body::before in skin.css) breathes, slowly, a drift of one dot over half a minute and back.
// Never with the tab hidden, never for whoever asked the system for less motion; without this file, or where a pseudo-element cannot be animated, the dots stay still.

/** One dot of the screen (21 px) of drift, and a breath of 3 %: little enough not to move under the eyes of whoever is reading. */
export const DRIFT: Keyframe[] = [
  { transform: 'translate3d(0, 0, 0) scale(1)' },
  { transform: 'translate3d(-21px, 13px, 0) scale(1.03)' },
];
export const DRIFT_TIMING: KeyframeAnimationOptions = {
  duration: 34_000,
  direction: 'alternate',
  easing: 'ease-in-out',
  iterations: Infinity,
  pseudoElement: '::before',
};
const LESS_MOTION = '(prefers-reduced-motion: reduce)';

/** Where the browser can animate a pseudo-element: elsewhere `pseudoElement` would be ignored and the whole page would move. */
function canAnimatePseudo(): boolean {
  return typeof KeyframeEffect !== 'undefined' && 'pseudoElement' in KeyframeEffect.prototype;
}

export function start(): () => void {
  const body = document.body;
  if (!body || typeof body.animate !== 'function' || !canAnimatePseudo()) return () => {};
  const lessMotion = window.matchMedia(LESS_MOTION);
  let drift: Animation | undefined;

  const follow = (): void => {
    if (lessMotion.matches) {
      drift?.cancel();
      drift = undefined;
      return;
    }
    drift ??= body.animate(DRIFT, DRIFT_TIMING);
    if (document.visibilityState === 'hidden') drift.pause();
    else drift.play();
  };

  document.addEventListener('visibilitychange', follow);
  lessMotion.addEventListener('change', follow);
  follow();
  return () => {
    document.removeEventListener('visibilitychange', follow);
    lessMotion.removeEventListener('change', follow);
    drift?.cancel();
    drift = undefined;
  };
}
