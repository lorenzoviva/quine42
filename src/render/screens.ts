// The Direction's wall of screens in 3D (T46b): a dark bezel per field against the back wall and on it a canvas
// texture, drawn again only when what it shows changes (src/kernel/screens.ts gives the content). The writing is in
// the texture, not on the 2D layer: it stays on the wall when the camera turns and costs nothing while it is the same.

import * as THREE from 'three';
import type { StudioItem } from '../kernel/corona';
import { fill, FILM, type CostBoard, type LiveFeed, type ScreenField, type Screens, type Timeline } from '../kernel/screens';
import { usd } from '../kernel/ai/usage';
import { arrowSign } from './corona3d';

/**
 * The screen leans back on its plinth (itemMesh), its foot at the plinth's front edge, its top against the wall: the camera
 * looks down at 54°, a screen standing upright would be a third of its height on the picture; tilted, nearly all of it.
 */
const TILT = 0.6;
const FOOT = { y: 0.4, z: 1.15 };
const LONG = 1.75;
const BEZEL = new THREE.MeshStandardMaterial({ color: '#0c0c16', roughness: 0.6 });
/** Texture pixels per cell. */
const PX = 150;

const DARK = '#06060c';
const DIM = 'rgba(255,255,255,0.8)';

function fit(g: CanvasRenderingContext2D, text: string, max: number): string {
  if (g.measureText(text).width <= max) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (g.measureText(text.slice(0, mid) + '…').width <= max) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + '…';
}

/** Two lines at most, cut where the words allow. */
function wrap2(g: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/\s+/);
  let a = '';
  while (words.length && g.measureText(a ? `${a} ${words[0]}` : words[0]).width <= max) a = a ? `${a} ${words.shift()}` : words.shift()!;
  if (!a) return [fit(g, text, max)];
  return words.length ? [a, fit(g, words.join(' '), max)] : [a];
}

function title(g: CanvasRenderingContext2D, text: string, right: string, color: string, W: number): void {
  g.font = 'bold 30px system-ui, sans-serif';
  g.textBaseline = 'top';
  g.shadowColor = color;
  g.shadowBlur = 12;
  g.fillStyle = color;
  g.textAlign = 'left';
  g.fillText(text, 18, 12);
  g.shadowBlur = 0;
  g.font = '22px system-ui, sans-serif';
  g.fillStyle = DIM;
  g.textAlign = 'right';
  g.fillText(right, W - 18, 18);
  g.textAlign = 'left';
}

const clock = (t: number) => new Date(t).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

/** The film: a strip with its holes, a frame per commit, the chosen one lit. */
function drawTimeline(g: CanvasRenderingContext2D, t: Timeline, color: string, W: number, H: number): void {
  title(g, 'LINEA DEL TEMPO', t.count ? `${t.count - t.index} di ${t.count}` : 'vuota', color, W);
  const top = 60, bottom = H - 34;
  g.fillStyle = '#121220';
  g.fillRect(8, top, W - 16, bottom - top);
  g.fillStyle = DARK;
  for (let x = 20; x < W - 20; x += 34) {
    g.fillRect(x, top + 6, 16, 12);
    g.fillRect(x, bottom - 18, 16, 12);
  }
  const fw = (W - 40) / FILM, y0 = top + 26, y1 = bottom - 26;
  t.frames.forEach((f, i) => {
    const x = 20 + i * fw;
    const chosen = i === t.at;
    g.fillStyle = chosen ? 'rgba(255,207,92,0.16)' : '#0b0b16';
    g.fillRect(x + 4, y0, fw - 8, y1 - y0);
    g.strokeStyle = chosen ? color : 'rgba(255,255,255,0.18)';
    g.lineWidth = chosen ? 4 : 2;
    if (chosen) {
      g.shadowColor = color;
      g.shadowBlur = 14;
    }
    g.strokeRect(x + 4, y0, fw - 8, y1 - y0);
    g.shadowBlur = 0;
    const inner = fw - 24;
    g.textBaseline = 'top';
    g.font = 'bold 20px system-ui, sans-serif';
    g.fillStyle = chosen ? '#ffffff' : DIM;
    g.fillText(fit(g, f.who, inner), x + 12, y0 + 8);
    g.font = '18px system-ui, sans-serif';
    g.fillStyle = chosen ? '#ffe7a8' : 'rgba(255,255,255,0.65)';
    wrap2(g, f.message, inner).forEach((l, j) => g.fillText(l, x + 12, y0 + 36 + j * 22));
    g.font = '16px monospace';
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.fillText(fit(g, `${clock(f.time)} · ${f.id}`, inner), x + 12, y1 - 24);
  });
  g.font = '18px system-ui, sans-serif';
  g.fillStyle = DIM;
  g.textBaseline = 'bottom';
  g.fillText('«<» «>» scorrono · E: che cosa è cambiato', 18, H - 6);
}

/** The consoles of the Council: two columns of four, who works lit. */
function drawLive(g: CanvasRenderingContext2D, f: LiveFeed, color: string, W: number, H: number): void {
  const busy = f.desks.filter((d) => d.working).length;
  title(g, 'REGISTRO DAL VIVO', busy ? `${busy} al lavoro` : 'tutto fermo', color, W);
  const top = 58, rows = 4, rh = (H - top - 8) / rows, cw = (W - 24) / 2;
  f.desks.slice(0, rows * 2).forEach((d, i) => {
    const x = 12 + (i % 2) * cw, y = top + Math.floor(i / 2) * rh;
    g.fillStyle = d.working ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)';
    g.fillRect(x + 4, y + 3, cw - 8, rh - 6);
    g.fillStyle = d.working ? '#5cff8a' : 'rgba(255,255,255,0.2)';
    g.beginPath();
    g.arc(x + 20, y + 17, 6, 0, Math.PI * 2);
    g.fill();
    g.textBaseline = 'top';
    g.font = 'bold 20px system-ui, sans-serif';
    g.fillStyle = d.color;
    g.globalAlpha = d.working ? 1 : 0.75;
    g.fillText(`${d.sigil} ${d.name}`, x + 34, y + 6);
    g.globalAlpha = 1;
    g.font = '16px system-ui, sans-serif';
    g.fillStyle = d.working ? '#ffffff' : 'rgba(255,255,255,0.6)';
    const what = d.task ? [d.task, d.model].filter(Boolean).join(' · ') : 'non ha ancora lavorato';
    g.fillText(fit(g, what, cw - 46), x + 34, y + 27);
  });
}

/** The costs: today and the session, a bar per agent, the budgets as gauges (amber over 80 %, red when full). */
function drawCosts(g: CanvasRenderingContext2D, c: CostBoard, color: string, W: number, _H: number): void {
  title(g, 'COSTI', `oggi ${usd(c.today.usd)} · in tutto ${usd(c.total.usd)}`, color, W);
  const half = W / 2;
  g.textBaseline = 'top';
  g.font = '18px system-ui, sans-serif';
  g.fillStyle = DIM;
  g.fillText(`sessione ${usd(c.session.usd)} · ${c.session.calls} chiamate`, 18, 54);
  const agents = c.byAgent.slice(0, 4);
  const top = Math.max(0.000001, ...agents.map((a) => a.tally.usd));
  agents.forEach((a, i) => {
    const y = 84 + i * 36;
    g.font = '18px system-ui, sans-serif';
    g.fillStyle = a.color;
    g.fillText(fit(g, a.name, 110), 18, y + 4);
    g.fillStyle = 'rgba(255,255,255,0.08)';
    g.fillRect(132, y + 4, half - 230, 20);
    g.fillStyle = a.color;
    g.fillRect(132, y + 4, ((half - 230) * a.tally.usd) / top, 20);
    g.fillStyle = '#ffffff';
    g.fillText(usd(a.tally.usd), half - 90, y + 4);
  });
  if (!agents.length) {
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.fillText('nessuna chiamata in questa sessione', 18, 90);
  }
  c.budgets.forEach((b, i) => {
    const y = 50 + i * 38, x = half + 10, w = half - 30;
    const v = fill(b);
    g.font = '18px system-ui, sans-serif';
    g.fillStyle = DIM;
    g.fillText(`${b.nome} ${b.usati}/${b.max}`, x, y);
    g.fillStyle = 'rgba(255,255,255,0.08)';
    g.fillRect(x, y + 21, w, 10);
    g.fillStyle = v >= 1 ? '#ff3b3b' : v > 0.8 ? '#ffb000' : '#5cff8a';
    g.fillRect(x, y + 21, w * v, 10);
  });
}

const DRAW: Record<ScreenField, (g: CanvasRenderingContext2D, s: any, color: string, W: number, H: number) => void> = { tempo: drawTimeline, registro: drawLive, costi: drawCosts };

export class ScreenWall {
  readonly group = new THREE.Group();
  private fields: Array<{ field: ScreenField; cv: HTMLCanvasElement; tex: THREE.CanvasTexture; key: string }> = [];
  /** When it was last read (renderer time). */
  at = -Infinity;

  constructor(
    items: StudioItem[],
    private color: string,
  ) {
    for (const it of items) {
      const w = it.w ?? 1, h = LONG;
      const cv = document.createElement('canvas');
      cv.width = Math.round((w - 0.16) * PX);
      cv.height = Math.round((h - 0.12) * PX);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const panel = new THREE.Group();
      const bezel = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, h, 0.08), BEZEL);
      bezel.position.set(0, h / 2, -0.045);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.16, h - 0.12), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
      m.position.set(0, h / 2, 0.002);
      panel.add(bezel, m);
      panel.position.set(it.x + w / 2, FOOT.y, it.y + FOOT.z);
      panel.rotation.x = -TILT;
      this.group.add(panel);
      this.fields.push({ field: it.target as ScreenField, cv, tex, key: '' });
      // The film's arrows, on their pillars in front of it.
      if (it.target === 'tempo') {
        const a = arrowSign(it.x, it.y + 1, '<', color), b = arrowSign(it.x + w - 1, it.y + 1, '>', color);
        a.position.y = b.position.y = 1.1;
        this.group.add(a, b);
      }
    }
  }

  /** Draws the fields whose content changed; returns how many. */
  draw(s: Screens): number {
    let n = 0;
    for (const f of this.fields) {
      const key = JSON.stringify(s[f.field]);
      if (key === f.key) continue;
      f.key = key;
      const g = f.cv.getContext('2d')!;
      g.fillStyle = DARK;
      g.fillRect(0, 0, f.cv.width, f.cv.height);
      DRAW[f.field](g, s[f.field], this.color, f.cv.width, f.cv.height);
      f.tex.needsUpdate = true;
      n++;
    }
    return n;
  }

  dispose(): void {
    for (const f of this.fields) f.tex.dispose();
  }
}
