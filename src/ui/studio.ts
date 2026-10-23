// Panels of the studio (the corona): a thing on show seen up close — its model, or the terrain as the Artist
// shows it, with «Riscolpisci» — a building's notice board, with the latest changes to its files, and what a
// showcase shows (T21), with its arrows.

import { PLACE_PHASES, type Kernel, type ShowcaseEntry } from '../kernel/kernel';
import type { StudioItem } from '../kernel/corona';
import { $, el } from './dom';
import { icons } from './hud';

/** A showcase and what it shows (the kernel's `ui:showcase` and `studio:showcase`). */
type Shown = { building: string; name: string; entry: ShowcaseEntry; index: number; count: number; phase?: number };

export class StudioPanel {
  private root = $('#studio');
  /** The building whose showcase the panel shows, while it is open. */
  private shown?: string;
  onClose?: () => void;
  onEdit?: (path: string) => void;

  constructor(
    private k: Kernel,
  ) {
    k.bus.on('ui:exhibit', ({ item, building }: { item: StudioItem; building: string }) => this.exhibit(item, building));
    k.bus.on('ui:board', ({ building, name }: { building: string; name: string }) => this.board(building, name));
    k.bus.on('ui:showcase', (e: Shown) => this.showcase(e));
    // The arrows pressed with the panel open: it follows.
    k.bus.on('studio:showcase', (e: Shown) => {
      if (this.isOpen && this.shown === e.building) this.showcase({ ...e, name: this.k.corona.building(e.building)?.name ?? e.building });
    });
    window.addEventListener(
      'keydown',
      (e) => {
        if (!this.isOpen || (e.target as HTMLElement)?.tagName === 'INPUT') return;
        if (e.key === 'Escape' || e.code === 'KeyE') {
          e.preventDefault();
          e.stopPropagation();
          this.close();
        }
      },
      true,
    );
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  private show(...children: Array<Node | string>): void {
    const close = el('button', { class: 'close' }, '×');
    close.onclick = () => this.close();
    this.shown = undefined;
    this.root.replaceChildren(el('div', { class: 'window' }, close, ...children));
    this.root.hidden = false;
    this.onClose?.();
  }

  close(): void {
    this.root.hidden = true;
    this.shown = undefined;
    this.onClose?.();
  }

  /** What a showcase shows: its model (or its runes), what is known of it, «<» «>» to change it. */
  showcase(e: Shown): void {
    const { entry } = e;
    const frame = el('div', { class: 'frame' }, el('div', { class: 'swatch', style: `background:${entry.color ?? '#333'}` }));
    if (entry.runes?.length)
      frame.replaceChildren(
        el('div', { class: 'runes' }, ...entry.runes.map((t) => {
          const r = this.k.content.runes[t];
          return el('span', { class: 'rune', style: `color:${r?.color ?? entry.color ?? '#c48aff'}` }, r?.glyph ?? t, el('small', {}, r?.name ?? t));
        })),
      );
    else if (entry.place) {
      const plan = this.planOf(entry.place.cx, entry.place.cy, e.phase);
      if (plan) frame.replaceChildren(plan);
    } else if (entry.model)
      void icons.model?.(entry.model, entry.tint, entry.seed).then((src) => {
        if (src && this.shown === e.building) frame.replaceChildren(el('img', { src, alt: entry.label }));
      });
    const step = (d: number, text: string) => {
      const b = el('button', {}, text);
      b.onclick = () => this.k.stepShowcase(e.building, d);
      return b;
    };
    // The model of places (T26): its phases, the one shown explained in a line.
    const phases: Node[] = [];
    if (e.phase !== undefined) {
      const p = PLACE_PHASES[e.phase];
      // A phase that changed nothing here (often the paths: the environment left no corner cut off).
      const idle = e.phase > 0 && !this.k.miniature(entry.place!.cx, entry.place!.cy)?.phases[e.phase]?.lit.length;
      const move = (d: number, text: string) => {
        const b = el('button', {}, text);
        b.onclick = () => this.k.stepPhase(e.building, d);
        return b;
      };
      phases.push(el('div', { class: 'row' }, move(-1, '−'), el('span', { class: 'note' }, `Fase ${e.phase + 1} di ${PLACE_PHASES.length}, ${p.name}: ${p.what}${idle ? ' Qui non è servito nulla.' : ''}`), move(1, '+')));
    }
    const open = el('button', {}, 'Apri il file');
    open.onclick = () => {
      this.close();
      if (entry.path) this.onEdit?.(entry.path);
    };
    this.show(
      el('div', { class: 'title' }, entry.label),
      el('div', { class: 'note' }, `${e.name} — ${e.index + 1} di ${e.count}`),
      el('div', { class: 'row showcase' }, step(-1, '<'), frame, step(1, '>')),
      ...phases,
      ...entry.facts.map(([what, text]) => el('div', { class: 'item' }, el('span', { class: 'path' }, what), ` ${text}`)),
      ...(entry.path ? [el('div', { class: 'row' }, open)] : []),
    );
    this.shown = e.building;
  }

  /**
   * The plan of a place seen from above (T26): its tiles in their colours, the structures, the things and the runes; in a
   * phase (`PLACE_PHASES`), the place as it is then, what the phase adds outlined in green.
   */
  private planOf(cx: number, cy: number, phase = PLACE_PHASES.length - 1): HTMLCanvasElement | undefined {
    const mini = this.k.miniature(cx, cy);
    if (!mini) return undefined;
    const now = mini.phases[phase] ?? { tiles: mini.tiles, lit: [] };
    const finished = phase >= PLACE_PHASES.length - 1;
    const S = mini.size, px = 8;
    const cv = el('canvas', { width: String(S * px), height: String(S * px), class: 'plan' }) as HTMLCanvasElement;
    const ctx = cv.getContext('2d');
    if (!ctx) return cv;
    for (let i = 0; i < S * S; i++) {
      ctx.fillStyle = this.k.palette[now.tiles[i]]?.color ?? '#333';
      ctx.fillRect((i % S) * px, Math.floor(i / S) * px, px, px);
    }
    ctx.strokeStyle = '#39ff88';
    ctx.lineWidth = 1.5;
    for (const i of now.lit) ctx.strokeRect((i % S) * px + 1, Math.floor(i / S) * px + 1, px - 2, px - 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (const s of phase >= 4 ? mini.structures : []) ctx.strokeRect((s.x - s.w / 2) * px + 1, (s.y - s.h / 2) * px + 1, s.w * px - 2, s.h * px - 2);
    if (!finished) return cv;
    for (const t of mini.things) {
      ctx.fillStyle = t.color ?? '#ffffff';
      ctx.beginPath();
      ctx.arc(t.x * px, t.y * px, px * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const r of mini.runes) {
      ctx.fillStyle = r.color ?? '#ffcf5c';
      ctx.fillRect((r.x - 0.4) * px, (r.y - 0.4) * px, px * 0.8, px * 0.8);
    }
    return cv;
  }

  exhibit(item: StudioItem, building: string): void {
    const frame = el('div', { class: 'frame' }, el('div', { class: 'swatch', style: `background:${item.color ?? '#333'}` }));
    if (item.model)
      void icons.model?.(item.model, item.tint).then((src) => {
        if (src) frame.replaceChildren(el('img', { src, alt: item.label }));
      });
    const why = el('input', { type: 'text', placeholder: "Come lo vuoi? (es. «più scuro, con un mantello rosso»)", maxlength: '160' }) as HTMLInputElement;
    const out = el('div', { class: 'note' });
    const repaint = el('button', { class: 'primary' }, 'Chiedi allo Scultore di riscolpirlo');
    repaint.onclick = () => {
      const ok = item.target ? this.k.requestResculpt(item.target, why.value.trim()) : false;
      out.textContent = ok ? 'Lo Scultore lo riscolpirà: lo vedrai cambiare qui e nel mondo.' : 'Questo non si può riscolpire.';
    };
    why.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') repaint.click();
    });
    const open = el('button', {}, 'Apri il file');
    open.onclick = () => {
      this.close();
      if (item.path) this.onEdit?.(item.path);
    };
    this.show(
      el('div', { class: 'title' }, item.label),
      el('div', { class: 'note' }, `${item.kind === 'tile' ? 'Terreno del campionario' : 'Modello in mostra'} — ${building} — ${item.path ?? ''}`),
      frame,
      el('div', { class: 'row' }, why, repaint),
      out,
      el('div', { class: 'row' }, open),
    );
  }

  board(building: string, name: string): void {
    const mine = this.k.boardOf(building);
    const all = this.k.repo.log().slice(0, 25);
    const row = (path: string, text: string) => {
      const b = el('button', {}, 'apri');
      b.onclick = () => {
        this.close();
        this.onEdit?.(path);
      };
      return el('div', { class: 'item' }, el('span', { class: 'path' }, path), ` ${text} `, b);
    };
    this.show(
      el('div', { class: 'title' }, `Bacheca — ${name}`),
      el('div', { class: 'section' }, 'Modifiche recenti in questo edificio'),
      ...(mine.length ? mine.map((m) => row(m.path, `— ${m.author}: ${m.message}`)) : [el('div', { class: 'note' }, 'Niente di nuovo, in questa sessione.')]),
      el('div', { class: 'section' }, "La storia dell'universo (ultimi commit)"),
      ...all.map((c) => el('div', { class: 'item' }, el('span', { class: 'path' }, c.id), ` ${c.author}: ${c.message}`)),
    );
  }
}
