// The numbers of the cartoon's daylight (ADR-0093), without three.js: the renderer lights the world with them and the
// photographs of the models (`photo.ts`, also in Node, where the Artist judges) work out their tones from the same ones.

/** Where the sun stands, from what the camera looks at (three.js axes: y up, z south). */
export const SUN_FROM: readonly [number, number, number] = [-14, 24, 10];

/** How much of the sun each band lets through: away from it, half-light, full light. */
export const BAND_LEVELS: readonly [number, number, number] = [0.35, 0.6, 0.85];

/**
 * How much the sun still reaches inside a cast shadow, as the low band: the shadow's intensity is the rest. Faces
 * away from the sun are in shadow too, so at full intensity the low band would never be seen.
 */
export const SHADOW_INTENSITY = 1 - BAND_LEVELS[0];

/** The hemisphere: faces standing upright get the middle of the two, so that middle has to be cold, not grey. */
export const CARTOON_HEMI = { sky: 0xc4dcff, ground: 0x5f5cb4 } as const;

/** Linear RGB multiplying the light of what lies in shadow: the blue of the photo, not a darker grey. */
export type Tint = readonly [number, number, number];

/** Full day: the warm key light, the cold fill, the tint of the shadows. */
export const DAY_LIGHT = { sun: 0xffdca6, sunIntensity: 2.4, sky: CARTOON_HEMI.sky, ground: CARTOON_HEMI.ground, hemiIntensity: 1.1, shade: [0.74, 0.86, 1.18] as Tint } as const;

type Rgb = readonly [number, number, number];

/** One sRGB channel, 0..1, to linear. */
export const toLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** One linear channel to sRGB, 0..1. */
export const toSrgb = (c: number): number => {
  const v = Math.max(0, Math.min(1, c));
  return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
};

const linearOf = (hex: number): Rgb => [toLinear(((hex >> 16) & 255) / 255), toLinear(((hex >> 8) & 255) / 255), toLinear((hex & 255) / 255)];

/** What a colour is multiplied by, in linear RGB, for the faces a photograph shows. */
export interface ToonTones {
  top: Rgb;
  front: Rgb;
  topInShadow: Rgb;
  frontInShadow: Rgb;
}

/**
 * The toon shader by hand, for the faces a photograph shows: colour / π × (band × sun + hemisphere), tinted in shadow, as
 * `addShade` does. A top looks at the sky and has the full light; a front has the half-light and the middle of sky and ground.
 */
export function toonTones(): ToonTones {
  const L = DAY_LIGHT;
  const [sun, sky, ground] = [linearOf(L.sun), linearOf(L.sky), linearOf(L.ground)];
  const tone = (band: number, upness: number, inShadow: boolean): Rgb =>
    [0, 1, 2].map((ch) => {
      const direct = band * sun[ch] * L.sunIntensity * (inShadow ? 1 - SHADOW_INTENSITY : 1);
      const fill = (ground[ch] + (sky[ch] - ground[ch]) * upness) * L.hemiIntensity;
      return ((direct + fill) * (inShadow ? L.shade[ch] : 1)) / Math.PI;
    }) as unknown as Rgb;
  return { top: tone(BAND_LEVELS[2], 1, false), front: tone(BAND_LEVELS[1], 0.5, false), topInShadow: tone(BAND_LEVELS[2], 1, true), frontInShadow: tone(BAND_LEVELS[1], 0.5, true) };
}
