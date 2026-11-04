// The cartoon's ink (ADR-0093, T89b): the parts and things it follows, and how they are drawn. The line itself is checked in the browser.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { meshVoxels, partTable } from '../src/mj/mesh';
import { compileMjx } from '../src/mj/model';
import { TERRAIN_THING, thingOf } from '../src/render/cartoon';
import { CUT, idsOf, MAT, U } from '../src/render/materials';
import { geometry } from '../src/render/models';
import { Builder } from '../src/render/terrain';
import { bundledFiles } from '../src/kernel/bundle';

describe('the parts the ink follows', () => {
  const lettersOf = (xml: string) => {
    const { palette } = compileMjx(xml).program;
    const alphabet = ['.', ...Object.keys(palette).filter((ch) => ch !== '.')];
    const parts = partTable(alphabet, palette);
    return (ch: string) => parts[alphabet.indexOf(ch)];
  };

  it('a mesh says the part of each vertex, one per voxel face', () => {
    const palette = { W: { color: '#d8c8a0' }, R: { color: '#a03020' } };
    const m = meshVoxels({ X: 2, Y: 1, Z: 1, cells: new Uint8Array([1, 2]), alphabet: ['.', 'W', 'R'] }, palette, { vpt: 1 });
    expect(m.part!.length).toBe(m.positions.length / 3);
    const xs = (p: number) => [...m.part!].flatMap((v, i) => (v === p ? [m.positions[i * 3]] : []));
    expect(xs(1).every((x) => x <= 0)).toBe(true);
    expect(xs(2).every((x) => x >= 0)).toBe(true);
    expect(xs(1).length).toBe(20);
    expect(xs(2).length).toBe(20);
  });

  it('the part reaches the geometry as it is', () => {
    const m = meshVoxels({ X: 1, Y: 1, Z: 1, cells: new Uint8Array([1]), alphabet: ['.', 'W'] }, { W: { color: '#d8c8a0' } }, { vpt: 1 });
    expect(geometry(m).getAttribute('part').array).toBe(m.part);
  });

  it('the crown of a pine is one part, however many greens are scattered on it, and the trunk another', () => {
    const part = lettersOf(bundledFiles['models/albero.xml']);
    expect(part('L')).toBe(part('F'));
    expect(part('N')).toBe(part('F'));
    expect(part('T')).not.toBe(part('F'));
  });

  it('so is the crown of an oak, its darkest and lightest leaves joined through the ones in between', () => {
    const part = lettersOf(bundledFiles['models/quercia.xml']);
    expect(new Set(['F', 'f', 'L', 'Y'].map(part)).size).toBe(1);
    expect(part('t')).toBe(part('T'));
    expect(part('T')).not.toBe(part('F'));
  });

  it('walls, roof and window stay apart; so do a light wall and a dark door of the same hue', () => {
    const palette = { W: { color: '#d8c8a0' }, D: { color: '#6b4a2e' }, R: { color: '#a03020' }, V: { color: '#3a6ea5' } };
    const parts = partTable(['.', 'W', 'D', 'R', 'V'], palette);
    expect(new Set(parts.slice(1)).size).toBe(4);
  });

  it('two greys are shades of one stone unless they are far in lightness, and a colour is not a grey', () => {
    const palette = { A: { color: '#808080' }, B: { color: '#6a6a6a' }, C: { color: '#202020' }, D: { color: '#d05050' } };
    const parts = partTable(['.', 'A', 'B', 'C', 'D'], palette);
    expect(parts[2]).toBe(parts[1]);
    expect(parts[3]).not.toBe(parts[1]);
    expect(parts[4]).not.toBe(parts[1]);
  });

  it('what gives light or lets it through does not join what does not, even in the same colour', () => {
    const palette = { A: { color: '#ffcc40' }, B: { color: '#ffcc40', glow: true }, C: { color: '#ffcc40', alpha: 0.5 } };
    expect(new Set(partTable(['.', 'A', 'B', 'C'], palette).slice(1)).size).toBe(3);
  });

  it('a limb is one part whatever its colours, and not the same as the rest in its colour', () => {
    const palette = { A: { color: '#3050c0', part: 'braccio' as const }, H: { color: '#e8b88a', part: 'braccio' as const }, B: { color: '#3050c0' } };
    const parts = partTable(['.', 'A', 'H', 'B'], palette);
    expect(parts[2]).toBe(parts[1]);
    expect(parts[3]).not.toBe(parts[1]);
  });

  it('a palette with what cannot be read does no harm: the empty and the colourless are their own', () => {
    const parts = partTable(['.', 'H', 'Z', 'A'], { H: { hidden: true }, Z: { color: 'rosso' }, A: { color: '#112233' } });
    expect([...parts]).toEqual([0, 1, 2, 3]);
  });
});

describe('the parts of what is not voxels', () => {
  const partsOf = (b: Builder) => [...b.geometry().getAttribute('part').array];

  it('unsaid, a colour is a part: the faces of a box differ, and nothing is left out', () => {
    const b = new Builder();
    b.box(0, 0, 0, 1, 1, 1, [0.5, 0.4, 0.3], true);
    b.cylinder(0, 0, 0, 1, 1, [0.5, 0.4, 0.3], 6, true, true);
    b.flat([[0, 0], [1, 0], [1, 1]], 0, [0.1, 0.2, 0.3]);
    b.ring(0, 0, 0, 1, 2, [0.1, 0.2, 0.3], 6);
    const parts = partsOf(b);
    expect(parts.length).toBe(b.pos.length / 3);
    expect(parts.every((p) => p > 0)).toBe(true);
    expect(parts[0]).not.toBe(parts[6]);
  });

  it('a terrain says its part: every tile the same whatever its shade, its sides another', () => {
    const b = new Builder();
    b.fixedPart = 3;
    b.quad([0, 0, 0], [0, 0, 1], [1, 0, 1], [1, 0, 0], [0, 1, 0], [0.5, 0.5, 0.5]);
    b.quad([1, 0, 0], [1, 0, 1], [2, 0, 1], [2, 0, 0], [0, 1, 0], [0.4, 0.5, 0.5]);
    b.quad([0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0], [0, 0, 1], [0.3, 0.3, 0.3], true);
    expect(partsOf(b)).toEqual([...Array(12).fill(3), ...Array(6).fill(131)]);
  });
});

describe('the things the ink follows', () => {
  it('each mesh has its own id, in the channel, never the empty nor the terrain', () => {
    for (const id of [0, 1, 253, 254, 255, 508, 100000]) {
      const thing = thingOf({ id, userData: {} });
      expect(thing).toBeGreaterThan(0);
      expect(thing).toBeLessThan(TERRAIN_THING);
    }
    expect(thingOf({ id: 7, userData: {} })).not.toBe(thingOf({ id: 8, userData: {} }));
  });

  it('the terrain is one thing across its chunks', () => {
    expect(thingOf({ id: 7, userData: { inkThing: TERRAIN_THING } })).toBe(thingOf({ id: 8, userData: { inkThing: TERRAIN_THING } }));
  });
});

describe('the drawing of the ids', () => {
  const ids = (m: THREE.Material) => idsOf(m) as THREE.ShaderMaterial;
  const draw = (m: THREE.Material, g: THREE.BufferGeometry, object: THREE.Object3D) => m.onBeforeRender(undefined as never, undefined as never, undefined as never, g, object, undefined as never);
  const triangle = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    return g;
  };

  it('keeps what the material does to what is drawn: the circle, the cut above the head, the wind', () => {
    expect(ids(MAT.world).fragmentShader).toContain('length(vClipXZ) > uClipR');
    expect(ids(MAT.world).uniforms.uClipR).toBe(U.clipR);
    expect(ids(MAT.cut).clippingPlanes).toEqual([CUT]);
    expect(ids(MAT.cut).clipping).toBe(true);
    expect(ids(MAT.sway).vertexShader).toContain('sway * uWind');
    expect(ids(MAT.world).vertexShader).not.toContain('sway * uWind');
  });

  it('the corona has no circle', () => {
    expect(ids(MAT.corona).fragmentShader).not.toContain('discard');
  });

  it('one stand-in per material, and the thing is told at each draw', () => {
    expect(idsOf(MAT.world)).toBe(idsOf(MAT.world));
    expect(idsOf(MAT.world)).not.toBe(idsOf(MAT.corona));
    const m = ids(MAT.world);
    const object = new THREE.Mesh(triangle());
    object.userData.inkThing = 42;
    draw(m, object.geometry, object);
    expect(m.uniforms.uThing.value).toBe(42);
    expect(m.uniformsNeedUpdate).toBe(true);
  });

  it('a geometry with no parts gets them after the frame, as with the other fillers', async () => {
    const g = triangle();
    draw(ids(MAT.world), g, new THREE.Mesh(g));
    expect(g.getAttribute('part')).toBeUndefined();
    await Promise.resolve();
    expect([...g.getAttribute('part').array]).toEqual([0, 0, 0]);
  });

  it('leaves out what has no edge of its own: neon, the faint lines, what is seen through and is not voxels, what is not drawn', () => {
    expect(idsOf(MAT.glow)).toBeUndefined();
    expect(idsOf(MAT.line)).toBeUndefined();
    expect(idsOf(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35 }))).toBeUndefined();
    expect(idsOf(new THREE.MeshBasicMaterial({ visible: false }))).toBeUndefined();
    expect(idsOf(new THREE.MeshBasicMaterial({ colorWrite: false }))).toBeUndefined();
  });

  it('glass made of voxels has its line', () => {
    expect(idsOf(MAT.glass)).toBeDefined();
    expect(idsOf(MAT.coronaGlass)).toBeDefined();
  });

  it('the classic look does not pay for the parts: only the drawing of the ids asks for them', async () => {
    const g = triangle();
    draw(MAT.world, g, new THREE.Mesh(g));
    await Promise.resolve();
    expect(g.getAttribute('glow')).toBeDefined();
    expect(g.getAttribute('part')).toBeUndefined();
  });
});
