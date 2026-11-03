// T217: a model's glass is its own group of the geometry, and only a material per group draws it translucent. The corona's
// props, buildings, drones and trains, and the terrains' models, had one material alone: the lamp's glass came out solid.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Corona } from '../src/kernel/corona';
import { meshVoxels } from '../src/mj/mesh';
import { buildCoronaRing } from '../src/render/corona3d';
import { casts, MAT } from '../src/render/materials';
import { geometry, modelMaterials } from '../src/render/models';

/** Two voxels side by side, one solid and one of glass. */
const voxels = () =>
  meshVoxels(
    { X: 2, Y: 1, Z: 1, cells: new Uint8Array([1, 2]), alphabet: ['.', 'M', 'v'] },
    { M: { color: '#14141a' }, v: { color: '#29adff', alpha: 0.38 } },
    { vpt: 8 },
  );

const form = (key: string, frames = 0) => {
  const m = voxels();
  return { key, status: 'ready', result: { meshes: { body: m, limbs: [], frames: Array.from({ length: frames }, voxels) } } };
};

describe('the glass of a model', () => {
  it('draws with a material of its own, in the corona, in the simulation, in a cut structure', () => {
    const g = geometry(voxels());
    expect(g.groups.map((x) => x.materialIndex)).toEqual([0, 1]);
    expect(modelMaterials(g, MAT.corona)).toEqual([MAT.corona, MAT.coronaGlass]);
    expect(modelMaterials(g, MAT.world)).toEqual([MAT.world, MAT.glass]);
    expect(modelMaterials(g, MAT.cut)).toEqual([MAT.cut, MAT.cutGlass]);
    expect(modelMaterials(g, MAT.sway)).toEqual([MAT.sway, MAT.glass]);
    for (const glass of [MAT.coronaGlass, MAT.glass, MAT.cutGlass]) {
      expect(glass.transparent).toBe(true);
      expect(glass.depthWrite).toBe(false);
    }
  });

  it('a model without glass keeps its one material', () => {
    const solid = meshVoxels({ X: 1, Y: 1, Z: 1, cells: new Uint8Array([1]), alphabet: ['.', 'M'] }, { M: { color: '#14141a' } }, { vpt: 8 });
    expect(modelMaterials(geometry(solid), MAT.corona)).toBe(MAT.corona);
  });

  it('every model of the campus draws its glass: props, drones, trains, animated ones too', () => {
    const c = new Corona(42);
    const files: Record<string, string> = { 'modules/sys.physics/manifest.json': '{}', 'universe.json': '{}' };
    c.build(files, [], []);
    expect(c.props.length).toBeGreaterThan(0);
    const k = {
      corona: c,
      forms: { version: 1, ready: (m: string, s: number) => form(`${m}#${s}`, m === 'corona-drone' ? 2 : 0), get: () => undefined },
    };
    const ring = buildCoronaRing(k as never);
    const meshes: THREE.Mesh[] = [];
    ring.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.geometry.groups.length > 0) meshes.push(m);
    });
    // The props plus four drones with two frames each and two trains.
    expect(meshes.length).toBeGreaterThanOrEqual(c.props.length + 4 * 2 + 2);
    for (const m of meshes) expect(Array.isArray(m.material)).toBe(true);
    const lamp = meshes.find((m) => (m.material as THREE.Material[])[0] === MAT.corona)!;
    expect(lamp.material).toEqual([MAT.corona, MAT.coronaGlass]);
  });

  it('a clipped model with glass still casts a clipped shadow', () => {
    const g = geometry(voxels());
    const clippedOne = casts(new THREE.Mesh(g, modelMaterials(g, MAT.world)));
    expect(clippedOne.customDepthMaterial).toBeDefined();
    const corona = casts(new THREE.Mesh(g, modelMaterials(g, MAT.corona)));
    expect(corona.customDepthMaterial).toBeUndefined();
  });
});
