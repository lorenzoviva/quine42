// The faces under the floor of a form (T356, ADR-0185): a body stands on the ground, so the worker leaves out the faces that look
// down from z = 0 of its grid (half the mesh of a large flat structure); a limb keeps them, a foot swings up and shows its sole.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Forms, InlineRunner, runForm } from '../src/kernel/forms';
import { meshVoxels, type MeshData } from '../src/mj/mesh';
import { formMeshes } from '../src/render/formmeshes';

const forms = new Forms(new InlineRunner());
forms.load(bundledFiles);

/** Vertices of faces that look down (three.js y) and lie on the floor of the grid. */
const underside = (m: MeshData): number => {
  let n = 0;
  for (let i = 0; i < m.normals.length; i += 3) if (m.normals[i + 1] < 0 && Math.abs(m.positions[i + 1]) < 1e-6) n++;
  return n;
};

describe('the faces under the floor of a form (T356)', () => {
  it('a structure and a thing have none in the worker, and the same mesh with them is larger by just those', () => {
    for (const model of ['structure', 'furniture']) {
      const req = forms.request(model, 1)!;
      const r = runForm(req);
      const meshes = formMeshes(r, req);
      expect(underside(meshes.body), model).toBe(0);
      const full = meshVoxels(r.grid, r.palette, { vpt: req.vpt });
      const bottom = underside(full);
      expect(bottom, model).toBeGreaterThan(0);
      expect(full.positions.length - meshes.body.positions.length, model).toBe(bottom * 3);
    }
  });

  it('a figure keeps the soles of its limbs', () => {
    const req = forms.request('person', 1)!;
    const r = runForm(req);
    const meshes = formMeshes(r, req);
    expect(underside(meshes.body)).toBe(0);
    const legs = meshes.limbs.filter((l) => l.part === 'leg');
    expect(legs.length).toBeGreaterThan(0);
    // A limb's mesh has its joint as origin: its sole is below the joint, so look at the faces that look down at the lowest vertices.
    for (const l of legs) {
      let lowest = Infinity;
      for (let i = 1; i < l.mesh.positions.length; i += 3) lowest = Math.min(lowest, l.mesh.positions[i]);
      let soles = 0;
      for (let i = 0; i < l.mesh.normals.length; i += 3) if (l.mesh.normals[i + 1] < 0 && Math.abs(l.mesh.positions[i + 1] - lowest) < 1e-6) soles++;
      expect(soles).toBeGreaterThan(0);
    }
  });
});
