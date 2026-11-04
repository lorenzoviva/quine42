// The lab's switch between the cartoon and the classic look (ADR-0093): live, because a reload would lose the sandbox's world
// and the editor's model. The game decides once, from the URL (`?classica`); the lab starts from the same answer (`CARTOON`).

import * as THREE from 'three';
import { CARTOON_BLOOM_RADIUS, CARTOON_HEMI, cartoonLight, SHADE, SHADOW_INTENSITY, SHADOW_RADIUS, SUN_FROM, toon } from '../src/render/cartoon';

/** One material in both looks. */
export interface Twin {
  classic: THREE.MeshLambertMaterial;
  cartoon: THREE.MeshToonMaterial;
}

/** What the look moves: the page's own scene, lights and bloom, and what the classic look has for the bloom. */
export interface LookParts {
  scene: THREE.Object3D;
  bloom: { inked: boolean; strength: number; radius: number };
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  classic: { bloomStrength: number; bloomRadius: number };
}

export class LabLook {
  cartoon = false;
  private twinOf = new Map<THREE.Material, THREE.Material>();
  private readonly classicSky: THREE.Color;
  private readonly classicGround: THREE.Color;

  constructor(private parts: LookParts) {
    this.classicSky = parts.hemi.color.clone();
    this.classicGround = parts.hemi.groundColor.clone();
  }

  /** The material in both looks; `wrap` (glow, wind) goes on each. */
  twin(opts: THREE.MeshLambertMaterialParameters, wrap: <M extends THREE.Material>(m: M) => M): Twin {
    const classic = wrap(new THREE.MeshLambertMaterial(opts));
    const cartoon = wrap(toon(opts as THREE.MeshToonMaterialParameters));
    this.twinOf.set(classic, cartoon);
    this.twinOf.set(cartoon, classic);
    return { classic, cartoon };
  }

  /** The twin's material in the look of now, for a new mesh. */
  of(t: Twin): THREE.Material {
    return this.cartoon ? t.cartoon : t.classic;
  }

  /** Into this look, what the scene already shows included. */
  set(cartoon: boolean): void {
    this.cartoon = cartoon;
    const p = this.parts;
    p.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => this.inLook(m)) : this.inLook(mesh.material);
    });
    p.sun.shadow.intensity = cartoon ? SHADOW_INTENSITY : 1;
    p.sun.shadow.radius = cartoon ? SHADOW_RADIUS : 1;
    p.bloom.inked = cartoon;
    p.bloom.radius = cartoon ? CARTOON_BLOOM_RADIUS : p.classic.bloomRadius;
    p.bloom.strength = p.classic.bloomStrength;
    p.hemi.color.copy(cartoon ? new THREE.Color(CARTOON_HEMI.sky) : this.classicSky);
    p.hemi.groundColor.copy(cartoon ? new THREE.Color(CARTOON_HEMI.ground) : this.classicGround);
    if (cartoon) this.daylight(1);
  }

  /** The cartoon's light at the moment `day` (0 deep night, 1 full day), as the game gives it. Only in the cartoon. */
  daylight(day: number): void {
    const p = this.parts;
    const light = cartoonLight(day);
    p.sun.intensity = light.sunIntensity;
    p.sun.color.copy(light.sun);
    p.hemi.intensity = light.hemiIntensity;
    p.hemi.color.copy(light.sky);
    p.hemi.groundColor.copy(light.ground);
    SHADE.value.set(...light.shade);
    p.bloom.strength = light.bloom;
  }

  /** The sun where the game has it, from what the camera looks at. */
  sunOver(target: THREE.Vector3): void {
    this.parts.sun.position.set(...SUN_FROM).add(target);
    this.parts.sun.target.position.copy(target);
  }

  private inLook(m: THREE.Material): THREE.Material {
    const twin = this.twinOf.get(m);
    if (!twin) return m;
    return this.cartoon === m instanceof THREE.MeshToonMaterial ? m : twin;
  }
}

/** The switch's button: it says the look, and the URL keeps it for the next reload as `?classica`. */
export function bindLookButton(look: LabLook, button: HTMLElement, onChange?: () => void): void {
  const show = () => {
    button.classList.toggle('active', look.cartoon);
    button.textContent = look.cartoon ? 'Cartone' : 'Classica';
  };
  show();
  button.addEventListener('click', () => {
    look.set(!look.cartoon);
    const url = new URL(location.href);
    if (look.cartoon) url.searchParams.delete('classica');
    else url.searchParams.set('classica', '');
    history.replaceState(null, '', url);
    show();
    onChange?.();
  });
}
