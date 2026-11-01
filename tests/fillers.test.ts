// The attributes that materials give to geometries without `glow` and `alpha` (T143). three uploads a geometry's
// attributes before the frame draws it: one added during the draw (`onBeforeRender`) gets no buffer and stays unbound,
// reading alpha 0 (the rune slabs, invisible inside the circle). So they must arrive after the frame.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { clipped, glowing } from '../src/render/materials';

const draw = (m: THREE.Material, g: THREE.BufferGeometry) => m.onBeforeRender(undefined as never, undefined as never, undefined as never, g, undefined as never, undefined as never);
const frameEnds = () => new Promise<void>((r) => setTimeout(r));

describe('the filler attributes of a geometry', () => {
  for (const [name, m] of [
    ['clipped', clipped(new THREE.MeshBasicMaterial({ transparent: true }), 'test-rune')],
    ['glowing', glowing(new THREE.MeshLambertMaterial(), 'test-thumb')],
  ] as const) {
    it(`${name}: nothing is added during the draw, everything after the frame`, async () => {
      const g = new THREE.PlaneGeometry(1, 1);
      draw(m, g);
      expect(g.getAttribute('alpha')).toBeUndefined();
      expect(g.getAttribute('glow')).toBeUndefined();
      await frameEnds();
      expect([...g.getAttribute('alpha').array]).toEqual([1, 1, 1, 1]);
      expect([...g.getAttribute('glow').array]).toEqual([0, 0, 0, 0]);
    });
  }

  it('the attributes stay the same from then on: three would have to bind them again', async () => {
    const m = clipped(new THREE.MeshBasicMaterial(), 'test-stable');
    const g = new THREE.PlaneGeometry(1, 1);
    draw(m, g);
    await frameEnds();
    const alpha = g.getAttribute('alpha');
    draw(m, g);
    await frameEnds();
    expect(g.getAttribute('alpha')).toBe(alpha);
  });

  it('several draws in a frame, with several materials, add them once', async () => {
    const a = clipped(new THREE.MeshBasicMaterial(), 'test-a');
    const b = clipped(new THREE.MeshBasicMaterial(), 'test-b');
    const g = new THREE.PlaneGeometry(1, 1);
    const set = g.setAttribute.bind(g);
    let added = 0;
    g.setAttribute = (n, v) => (added++, set(n, v));
    draw(a, g);
    draw(b, g);
    await frameEnds();
    expect(added).toBe(2);
  });

  it("a geometry's own attributes are kept; a filler follows the vertex count", async () => {
    const m = clipped(new THREE.MeshBasicMaterial(), 'test-own');
    const g = new THREE.PlaneGeometry(1, 1);
    const own = new THREE.BufferAttribute(new Float32Array(4).fill(0.5), 1);
    g.setAttribute('alpha', own);
    draw(m, g);
    await frameEnds();
    expect(g.getAttribute('alpha')).toBe(own);
    expect(g.getAttribute('glow').count).toBe(4);

    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3));
    draw(m, g);
    await frameEnds();
    expect(g.getAttribute('glow').count).toBe(6);
    expect(g.getAttribute('alpha')).toBe(own);
  });
});
