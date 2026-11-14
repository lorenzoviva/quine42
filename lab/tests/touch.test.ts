// The labs by touch (T389): the pinch and the stick over the game's pure functions.
import { describe, expect, it } from 'vitest';
import { pinchFactor, stickCodes } from '../touch';

describe('i laboratori al tocco', () => {
  it('il pizzico: le dita che si allargano avvicinano, quelle che si stringono allontanano', () => {
    expect(pinchFactor(100, 200)).toBe(0.5);
    expect(pinchFactor(200, 100)).toBe(2);
    expect(pinchFactor(0, 100)).toBe(1);
    expect(pinchFactor(100, 0)).toBe(1);
    expect(pinchFactor(Number.NaN, 100)).toBe(1);
  });

  it('la levetta tiene i tasti di WASD, fuori dalla zona morta', () => {
    expect(stickCodes(0, -50, 60)).toEqual(['KeyW']);
    expect(stickCodes(50, 0, 60)).toEqual(['KeyD']);
    expect(stickCodes(-40, 40, 60)).toEqual(['KeyS', 'KeyA']);
    expect(stickCodes(3, 3, 60)).toEqual([]);
  });
});
