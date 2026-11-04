// The lab's switch between the cartoon and the classic look (ADR-0093, T89e): what it does to the scene and the lights, without drawing.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { LabLook } from '../lab/look';
import { CARTOON_BLOOM_RADIUS, CARTOON_HEMI, SHADOW_INTENSITY } from '../src/render/cartoon';

function setup() {
  const scene = new THREE.Scene();
  const sun = new THREE.DirectionalLight();
  const hemi = new THREE.HemisphereLight(0x112233, 0x445566, 1);
  const bloom = { inked: false, strength: 0, radius: 0 };
  const look = new LabLook({ scene, bloom, sun, hemi, classic: { bloomStrength: 0.9, bloomRadius: 0.45 } });
  return { scene, sun, hemi, bloom, look };
}

describe('the lab look', () => {
  it('moves what the scene shows, also a mesh with glass, and leaves other materials alone', () => {
    const { scene, look } = setup();
    const wall = look.twin({ vertexColors: true }, (m) => m);
    const glass = look.twin({ vertexColors: true, transparent: true }, (m) => m);
    const mine = new THREE.MeshBasicMaterial();
    const hidden = new THREE.Mesh(new THREE.BufferGeometry(), look.of(wall));
    hidden.visible = false;
    const both = new THREE.Mesh(new THREE.BufferGeometry(), [look.of(wall), look.of(glass)]);
    const other = new THREE.Mesh(new THREE.BufferGeometry(), mine);
    scene.add(hidden, both, other);

    look.set(true);
    expect(hidden.material).toBe(wall.cartoon);
    expect(both.material).toEqual([wall.cartoon, glass.cartoon]);
    expect(other.material).toBe(mine);
    expect(look.of(wall)).toBe(wall.cartoon);

    look.set(true);
    expect(hidden.material).toBe(wall.cartoon);

    look.set(false);
    expect(hidden.material).toBe(wall.classic);
    expect(both.material).toEqual([wall.classic, glass.classic]);
  });

  it('gives the cartoon the ink, the shadow and the fill, and gives the classic look back what it had', () => {
    const { sun, hemi, bloom, look } = setup();
    look.set(true);
    expect(bloom.inked).toBe(true);
    expect(bloom.radius).toBe(CARTOON_BLOOM_RADIUS);
    expect(sun.shadow.intensity).toBe(SHADOW_INTENSITY);
    expect(hemi.groundColor.getHex()).toBe(new THREE.Color(CARTOON_HEMI.ground).getHex());

    look.set(false);
    expect(bloom.inked).toBe(false);
    expect(bloom.radius).toBe(0.45);
    expect(bloom.strength).toBe(0.9);
    expect(sun.shadow.intensity).toBe(1);
    expect(hemi.color.getHex()).toBe(new THREE.Color(0x112233).getHex());
    expect(hemi.groundColor.getHex()).toBe(new THREE.Color(0x445566).getHex());
  });

  it('stands the sun where the game has it, over what the camera looks at', () => {
    const { sun, look } = setup();
    const target = new THREE.Vector3(5, 0, -3);
    look.sunOver(target);
    expect(sun.target.position.toArray()).toEqual([5, 0, -3]);
    expect(sun.position.toArray()).toEqual([5 - 14, 24, -3 + 10]);
  });
});
