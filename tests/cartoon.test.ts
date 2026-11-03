// The cartoon's bands and switch (ADR-0093, T89a): what can be said without drawing. The look itself is checked in the browser.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BAND_LEVELS, bandOf, bandRamp, CARTOON_HEMI, cartoonOn, SHADOW_INTENSITY, SUN_FROM } from '../src/render/cartoon';
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
