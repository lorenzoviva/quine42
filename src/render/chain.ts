// The chain of the Systems Room in 3D (T27a): over each station's plinth (itemMesh) a screen leaning back like the
// Direction's wall, its canvas drawn again only when what it shows changes (src/kernel/chain.ts gives it); along the
// front of the plinths the belt, and on it a pulse that runs from the first system to the last and starts again: the
// tick, which in the game runs sixty times a second.

import * as THREE from 'three';
import type { StudioItem } from '../kernel/corona';
import { msText, STATION_KIND, type Chain, type Station } from '../kernel/chain';
import { BEZEL, DARK, DIM, fit, FOOT, PX, TILT, wrap2 } from './screens';
import { Builder } from './terrain';
import { MAT, rgbOf } from './materials';

/** The screens are a little shorter than the Direction's: the shelves behind the walkway stay in sight. */
const LONG = 1.45;
/** One run of the pulse along the belt, in seconds (the tick is sixty times faster: it would be a blur). */
const RUN = 1.6;
/** The belt's height: the top of the plinths' front edge. */
const BELT = 0.43;
const FAULT = '#ff3b3b';

function drawStation(g: CanvasRenderingContext2D, s: Station, n: number, color: string, W: number, H: number): void {
  const bad = !!s.fault;
  const c = bad ? FAULT : color;
  if (bad) {
    g.fillStyle = 'rgba(255,59,59,0.14)';
    g.fillRect(0, 0, W, H);
  }
  g.strokeStyle = c;
  g.lineWidth = 3;
  g.strokeRect(3, 3, W - 6, H - 6);
  // Its place in the tick, in a ring.
  g.beginPath();
  g.arc(28, 30, 17, 0, Math.PI * 2);
  g.fillStyle = '#0b0b16';
  g.fill();
  g.shadowColor = c;
  g.shadowBlur = 10;
  g.stroke();
  g.shadowBlur = 0;
  g.fillStyle = c;
  g.font = 'bold 20px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(s.step), 28, 31);
  g.textAlign = 'left';
  g.textBaseline = 'top';
  g.font = 'bold 19px system-ui, sans-serif';
  g.fillStyle = '#ffffff';
  const name = wrap2(g, s.name, W - 62);
  name.forEach((l, i) => g.fillText(l, 52, (name.length > 1 ? 10 : 20) + i * 21));
  g.font = '14px system-ui, sans-serif';
  g.fillStyle = DIM;
  g.fillText(fit(g, s.panel ? `${STATION_KIND[s.kind]} · «${s.panel}»` : `${STATION_KIND[s.kind]} · ${s.step} di ${n}`, W - 20), 12, 60);
  if (bad) {
    g.font = 'bold 26px system-ui, sans-serif';
    g.fillStyle = FAULT;
    g.fillText('GUASTO', 12, 86);
    g.font = '15px system-ui, sans-serif';
    g.fillStyle = '#ffd0d0';
    wrap2(g, s.fault!.message, W - 24).forEach((l, i) => g.fillText(l, 12, 120 + i * 19));
  } else {
    const m = s.measure;
    g.font = 'bold 32px system-ui, sans-serif';
    g.fillStyle = '#ffffff';
    g.shadowColor = color;
    g.shadowBlur = 8;
    g.fillText(fit(g, m ? msText(m.ms) : '— ms', W - 24), 12, 84);
    g.shadowBlur = 0;
    g.font = '18px system-ui, sans-serif';
    g.fillStyle = DIM;
    g.fillText(fit(g, m ? `${m.touched} entità a tick` : 'misura…', W - 24), 12, 124);
  }
  g.font = '13px monospace';
  g.fillStyle = 'rgba(255,255,255,0.5)';
  g.fillText(fit(g, s.id, W - 24), 12, H - 26);
}

export class ChainView {
  readonly group = new THREE.Group();
  private screens: Array<{ id: string; cv: HTMLCanvasElement; tex: THREE.CanvasTexture; key: string }> = [];
  private pulse: THREE.Mesh;
  private x0: number;
  private x1: number;
  /** When it was last read (renderer time). */
  at = -Infinity;

  constructor(
    items: StudioItem[],
    private color: string,
  ) {
    for (const it of items) {
      const w = it.w ?? 1;
      const cv = document.createElement('canvas');
      cv.width = Math.round((w - 0.16) * PX);
      cv.height = Math.round((LONG - 0.12) * PX);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const panel = new THREE.Group();
      const bezel = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, LONG, 0.08), BEZEL);
      bezel.position.set(0, LONG / 2, -0.045);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.16, LONG - 0.12), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
      m.position.set(0, LONG / 2, 0.002);
      panel.add(bezel, m);
      panel.position.set(it.x + w / 2, FOOT.y, it.y + FOOT.z);
      panel.rotation.x = -TILT;
      this.group.add(panel);
      this.screens.push({ id: it.target!, cv, tex, key: '' });
    }
    this.x0 = Math.min(...items.map((i) => i.x)) + 0.1;
    this.x1 = Math.max(...items.map((i) => i.x + (i.w ?? 1))) - 0.1;
    const z = (items[0]?.y ?? 0) + FOOT.z;
    const b = new Builder();
    b.box(-0.18, BELT, z - 0.03, 0.18, BELT + 0.05, z + 0.03, rgbOf('#ffffff', 0.95));
    this.pulse = new THREE.Mesh(b.geometry(), MAT.glow);
    this.group.add(this.pulse);
  }

  /** The pulse runs along the belt. */
  run(t: number): void {
    this.pulse.position.x = this.x0 + 0.18 + ((t / RUN) % 1) * Math.max(0, this.x1 - this.x0 - 0.36);
  }

  /** Draws the stations whose content changed; returns how many. */
  draw(c: Chain): number {
    let n = 0;
    for (const f of this.screens) {
      const s = c.stations.find((x) => x.id === f.id);
      if (!s) continue;
      const key = JSON.stringify([s, c.stations.length]);
      if (key === f.key) continue;
      f.key = key;
      const g = f.cv.getContext('2d')!;
      g.fillStyle = DARK;
      g.fillRect(0, 0, f.cv.width, f.cv.height);
      drawStation(g, s, c.stations.length, this.color, f.cv.width, f.cv.height);
      f.tex.needsUpdate = true;
      n++;
    }
    return n;
  }

  dispose(): void {
    for (const f of this.screens) f.tex.dispose();
    this.pulse.geometry.dispose();
  }
}
