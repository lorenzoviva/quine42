// The cartoon's bands and switch (ADR-0093, T89a): what can be said without drawing. The look itself is checked in the browser.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { addShade, aerial, BAND_LEVELS, bandOf, bandRamp, CARTOON_BLOOM_RADIUS, CARTOON_HEMI, cartoonLight, cartoonOn, PHASES, SHADE, SHADOW_INTENSITY, SUN_FROM, toon } from '../src/render/cartoon';
import { addGlow } from '../src/render/materials';

describe('the switch', () => {
  it('until the cartoon is the default, only ?cartone turns it on', () => {
    expect(cartoonOn('', false)).toBe(false);
    expect(cartoonOn('?skip&offline', false)).toBe(false);
    expect(cartoonOn('?skip&cartone', false)).toBe(true);
  });

  it('once it is the default, only ?classica turns it off', () => {
    expect(cartoonOn('', true)).toBe(true);
    expect(cartoonOn('?cartone', true)).toBe(true);
    expect(cartoonOn('?skip&classica', true)).toBe(false);
  });

  it('?classica wins over ?cartone', () => {
    expect(cartoonOn('?cartone&classica', false)).toBe(false);
  });
});

describe('the bands', () => {
  const sun = new THREE.Vector3(...SUN_FROM).normalize();
  const face = (x: number, y: number, z: number) => bandOf(sun.dot(new THREE.Vector3(x, y, z)));

  it('a voxel shows all three: voxels have only six normals', () => {
    expect(face(0, 1, 0)).toBe(2); // top
    expect(face(0, 0, 1)).toBe(1); // towards the south, what the camera sees
    expect(face(-1, 0, 0)).toBe(1); // towards the west
    expect(face(1, 0, 0)).toBe(0); // away from the sun
    expect(face(0, 0, -1)).toBe(0);
  });

  it('the ramp is the same step function, read as three does', () => {
    const ramp = bandRamp();
    const texels = ramp.length / 4;
    const read = (cosine: number) => ramp[Math.min(texels - 1, Math.floor((cosine * 0.5 + 0.5) * texels)) * 4] / 255;
    for (const cosine of [-1, -0.34, -0.01, 0.01, 0.34, 0.47, 0.59, 0.61, 0.81, 1]) {
      expect(read(cosine)).toBeCloseTo(BAND_LEVELS[bandOf(cosine)], 2);
    }
    expect(new Set(ramp.filter((_, i) => i % 4 === 0)).size).toBe(3);
  });

  it('the low band stays at about 0.35, in a cast shadow too', () => {
    expect(BAND_LEVELS[0]).toBeGreaterThanOrEqual(0.35);
    expect(1 - SHADOW_INTENSITY).toBeCloseTo(BAND_LEVELS[0]);
  });

  it('what the hemisphere gives an upright face is not grey', () => {
    const mid = new THREE.Color(CARTOON_HEMI.sky).lerp(new THREE.Color(CARTOON_HEMI.ground), 0.5);
    const { s } = mid.getHSL({ h: 0, s: 0, l: 0 }, THREE.SRGBColorSpace);
    expect(s).toBeGreaterThan(0.3);
    expect(mid.b).toBeGreaterThan(mid.r); // cold, as in ADR-0093
  });
});

describe('glowing voxels and the bands', () => {
  const shader = (name: 'toon' | 'lambert') => {
    const sh = { uniforms: {}, vertexShader: THREE.ShaderLib[name].vertexShader, fragmentShader: THREE.ShaderLib[name].fragmentShader } as THREE.WebGLProgramParametersWithUniforms;
    addGlow(sh);
    return sh.fragmentShader;
  };

  it('in the toon shader they leave the bands, right before the colour is written', () => {
    expect(shader('toon')).toMatch(/outgoingLight = mix\(outgoingLight, vColor\.rgb \* \(GLOW_BASE \+ uGlow\), vGlow\);\s+#endif\s+#include <opaque_fragment>/);
  });

  it('the classic look stays as it was', () => {
    expect(shader('lambert')).not.toContain('outgoingLight = mix');
    expect(shader('lambert')).toContain('totalEmissiveRadiance += vColor.rgb * vGlow * uGlow;');
  });
});

describe('the light of the day', () => {
  const warm = (c: THREE.Color) => c.r > c.b;

  it('a warm key and a cold fill by day and at dusk, a cold moon at night', () => {
    expect(warm(cartoonLight(1).sun)).toBe(true);
    expect(warm(cartoonLight(0.35).sun)).toBe(true);
    expect(warm(cartoonLight(0).sun)).toBe(false);
    for (const day of [1, 0.35, 0]) {
      const l = cartoonLight(day);
      expect(l.sky.b).toBeGreaterThan(l.sky.r);
      expect(l.ground.b).toBeGreaterThan(l.ground.r);
    }
  });

  it('at dusk the key is redder than by day', () => {
    const redness = (c: THREE.Color) => c.r / c.g;
    expect(redness(cartoonLight(0.35).sun)).toBeGreaterThan(redness(cartoonLight(1).sun));
  });

  it('the night still has a direct light, or there would be no bands', () => {
    expect(cartoonLight(0).sunIntensity).toBeGreaterThan(0);
    expect(cartoonLight(0).sunIntensity).toBeLessThan(cartoonLight(1).sunIntensity / 2);
  });

  it('shadows are blue at every moment of the day, not grey', () => {
    for (let day = 0; day <= 1; day += 0.05) {
      const [r, , b] = cartoonLight(day).shade;
      expect(b).toBeGreaterThan(1);
      expect(r).toBeLessThan(1);
    }
  });

  it('it follows the day without a jump, at the same steps as the sky', () => {
    const near = (a: number, b: number) => Math.abs(a - b) < 0.02;
    for (const edge of [0.3, 0.6]) {
      const [low, high] = [cartoonLight(edge - 0.001), cartoonLight(edge + 0.001)];
      expect(near(low.sunIntensity, high.sunIntensity)).toBe(true);
      expect(near(low.sun.r, high.sun.r) && near(low.sun.b, high.sun.b)).toBe(true);
      expect(near(low.bloom, high.bloom)).toBe(true);
    }
    expect(cartoonLight(0.8).sunIntensity).toBe(PHASES.day.sunIntensity);
  });

  it('the bloom is higher in the dark, and tighter than the classic radius of 0.45', () => {
    expect(cartoonLight(0).bloom).toBeGreaterThan(cartoonLight(1).bloom);
    expect(CARTOON_BLOOM_RADIUS).toBeLessThan(0.45);
  });
});

describe('the aerial perspective', () => {
  /** How much fog at this view depth, as three computes it. */
  const fogAt = (depth: number, f: { near: number; far: number }) => {
    const t = Math.max(0, Math.min(1, (depth - f.near) / (f.far - f.near)));
    return t * t * (3 - 2 * t);
  };

  it('in 3/4 the wanderer is clear and the top of the screen fades, where the classic fog never showed', () => {
    const f = aerial(15, 1);
    expect(fogAt(15, f)).toBeLessThan(0.05);
    expect(fogAt(15 * 1.33, f)).toBeGreaterThan(0.25);
    expect(fogAt(15 * 1.33, { near: 15 * 2.2, far: 15 * 4.5 })).toBe(0);
  });

  it('it is all sky before the end of what is loaded, the free camera low on the horizon included', () => {
    for (const d of [2.5, 5, 7.5, 15, 30, 45]) {
      // At the lowest pitch, looking at the far side of the view: 1.1 distances and one chunk past the wanderer.
      const pitch = 0.2;
      const edge = Math.cos(pitch) * (Math.cos(pitch) * d + 1.1 * d + 18);
      expect(aerial(d, 1).far).toBeLessThanOrEqual(edge);
    }
  });

  it('a close-up has no air in between', () => {
    for (const d of [2.5, 5, 10]) expect(fogAt(d * 1.33, aerial(d, 1))).toBeLessThan(0.01);
  });

  it('at night one sees less far, and a day out of range stays a fog', () => {
    expect(aerial(15, 0).far).toBeLessThan(aerial(15, 1).far);
    expect(aerial(15, 7)).toEqual(aerial(15, 1));
    expect(aerial(15, -7)).toEqual(aerial(15, 0));
  });
});

describe('the tinted shadow', () => {
  const compiled = (name: 'toon' | 'lambert', add: (sh: THREE.WebGLProgramParametersWithUniforms) => void) => {
    const sh = { uniforms: {}, vertexShader: THREE.ShaderLib[name].vertexShader, fragmentShader: THREE.ShaderLib[name].fragmentShader } as THREE.WebGLProgramParametersWithUniforms;
    add(sh);
    return sh;
  };

  it('goes after the lights, on what they have gathered, with the shared tint', () => {
    const sh = compiled('toon', addShade);
    expect(sh.fragmentShader).toMatch(/#include <lights_fragment_end>\s+#if NUM_DIR_LIGHTS > 0[\s\S]*reflectedLight\.indirectDiffuse \*= shade;/);
    expect(sh.uniforms.uShade).toBe(SHADE);
  });

  it('reads the sun from what three leaves: the directional lights come last, rect area lights do not touch it', () => {
    const chunk = THREE.ShaderChunk.lights_fragment_begin;
    const dir = chunk.indexOf('#if ( NUM_DIR_LIGHTS > 0 )');
    expect(dir).toBeGreaterThan(chunk.indexOf('#if ( NUM_POINT_LIGHTS > 0 )'));
    expect(dir).toBeGreaterThan(chunk.indexOf('#if ( NUM_SPOT_LIGHTS > 0 )'));
    expect(chunk.slice(chunk.indexOf('#if ( NUM_RECT_AREA_LIGHTS > 0 )'))).not.toContain('directLight');
  });

  it('reaches the toon materials both ways, alone and through the glow, and never the classic look', () => {
    const plain = toon({ color: '#fff' });
    expect(compiled('toon', (sh) => plain.onBeforeCompile(sh, undefined as never)).fragmentShader).toContain('uShade');
    expect(compiled('toon', (sh) => addGlow(sh)).fragmentShader).toContain('reflectedLight.directDiffuse *= shade;');
    expect(compiled('lambert', (sh) => addGlow(sh)).fragmentShader).not.toContain('uShade');
  });
});
