// The Nucleus, inside (T28): the graph of the world (ADR-0045), navigable. Every node of `kernel.graph()`
// laid out by forces (src/ui/graphlayout.ts), coloured by kind; what does not hold (`check()`) ringed in red.
// Drag or arrows to move, wheel or +/- to zoom, a click picks a node (its edges, clickable, on the side),
// a double click or «Vicinato» keeps only what is within two edges of it; the search finds by name and the
// legend hides or shows a kind. Looking changes nothing.

import type { Kernel } from '../kernel/kernel';
import { EDGE_NAME, NODE_COLOR, NODE_NAME, type GraphIssue, type GraphLink, type GraphNode, type NodeType, type WorldGraph } from '../kernel/graph';
import { ForceLayout } from './graphlayout';
import { $, el } from './dom';

/** What is drawn: some nodes of the graph (indices into `ids`), their own layout and the edges among them. */
interface View {
  nodes: number[];
  local: Map<number, number>;
  links: number[];
  layout: ForceLayout;
}

const TYPES = Object.keys(NODE_COLOR) as NodeType[];
const AROUND = 2;

export class GraphPanel {
  private root = $('#graph');
  private canvas = el('canvas', { width: '820', height: '560' }) as HTMLCanvasElement;
  private side = el('div', { class: 'side' });
  private legend = el('div', { class: 'legend' });
  private search = el('input', { placeholder: 'Cerca un nome…', spellcheck: 'false' }) as HTMLInputElement;
  private results = el('div', { class: 'results' });
  private aroundBtn = el('button', {}, 'Vicinato');
  private info = el('div', { class: 'note' });
  private g?: WorldGraph;
  private ids: string[] = [];
  private index = new Map<string, number>();
  private degree: number[] = [];
  private all?: View;
  private view?: View;
  private hidden = new Set<NodeType>();
  private selected?: number;
  private hover?: number;
  private problems: GraphIssue[] = [];
  private flagged = new Map<number, string[]>();
  private cam = { x: 0, y: 0, zoom: 1 };
  private drag: { x: number; y: number; cx: number; cy: number; moved: boolean } | null = null;
  private frame = 0;
  /** The camera was moved by hand: the end of the layout does not frame it again. */
  private touched = false;
  onClose?: () => void;
  onEdit?: (path: string) => void;

  constructor(private k: Kernel) {
    k.bus.on('ui:graph', () => this.open());
    const c = this.canvas;
    c.addEventListener('mousedown', (e) => (this.drag = { x: this.sx(e), y: this.sy(e), cx: this.cam.x, cy: this.cam.y, moved: false }));
    window.addEventListener('mouseup', (e) => {
      const d = this.drag;
      this.drag = null;
      if (!d || d.moved || e.target !== c) return;
      this.select(this.nodeAt(this.sx(e), this.sy(e)));
    });
    c.addEventListener('dblclick', (e) => {
      const i = this.nodeAt(this.sx(e), this.sy(e));
      if (i !== undefined) this.focusAround(i);
    });
    c.addEventListener('mousemove', (e) => {
      const d = this.drag;
      if (d) {
        if (Math.hypot(this.sx(e) - d.x, this.sy(e) - d.y) > 3) d.moved = this.touched = true;
        this.cam.x = d.cx - (this.sx(e) - d.x) / this.cam.zoom;
        this.cam.y = d.cy - (this.sy(e) - d.y) / this.cam.zoom;
      } else {
        const h = this.nodeAt(this.sx(e), this.sy(e));
        if (h === this.hover) return;
        this.hover = h;
        this.info.textContent = h === undefined ? '' : this.k.graph().describe(this.ids[h]).replace(/^- /, '');
      }
      this.draw();
    });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.touched = true;
      // Zoom towards the mouse.
      const [wx, wy] = this.toWorld(this.sx(e), this.sy(e));
      this.cam.zoom = Math.max(0.05, Math.min(6, this.cam.zoom * (e.deltaY < 0 ? 1.15 : 0.87)));
      this.cam.x = wx - (this.sx(e) - c.width / 2) / this.cam.zoom;
      this.cam.y = wy - (this.sy(e) - c.height / 2) / this.cam.zoom;
      this.draw();
    });
    this.search.addEventListener('input', () => this.find());
    this.aroundBtn.onclick = () => (this.view !== this.all ? this.focusAll() : this.selected !== undefined && this.focusAround(this.selected));
    window.addEventListener(
      'keydown',
      (e) => {
        if (!this.isOpen) return;
        if ((e.target as HTMLElement)?.tagName === 'INPUT') {
          // Typing is not playing: the keys stop here (Enter picks the first found).
          if (e.key === 'Escape') this.search.blur();
          if (e.key === 'Enter') this.results.querySelector('button')?.click();
          e.stopPropagation();
          return;
        }
        const step = 60 / this.cam.zoom;
        const keys: Record<string, () => void> = {
          ArrowLeft: () => (this.cam.x -= step),
          ArrowRight: () => (this.cam.x += step),
          ArrowUp: () => (this.cam.y -= step),
          ArrowDown: () => (this.cam.y += step),
          '+': () => (this.cam.zoom = Math.min(6, this.cam.zoom * 1.2)),
          '-': () => (this.cam.zoom = Math.max(0.05, this.cam.zoom / 1.2)),
        };
        if (keys[e.key]) {
          keys[e.key]();
          this.touched = true;
          this.draw();
        } else if (e.key === 'Escape' || e.code === 'KeyE') this.close();
        else return;
        e.preventDefault();
        e.stopPropagation();
      },
      true,
    );
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(): void {
    const g = this.k.graph();
    if (g !== this.g) this.load(g);
    const close = el('button', { class: 'close' }, '×');
    close.onclick = () => this.close();
    const fit = el('button', {}, 'Tutto');
    fit.onclick = () => this.focusAll();
    const n = this.ids.length;
    const title = el('div', { class: 'title' }, 'Il grafo del mondo');
    const count = el('span', { class: 'count' }, `${n} nodi · ${g.links.length} archi${this.problems.length ? ` · ${this.problems.length} cose che non tornano` : ''}`);
    this.root.replaceChildren(
      el(
        'div',
        { class: 'window' },
        close,
        el('div', { class: 'head' }, title, count),
        el('div', { class: 'tools' }, this.search, fit, this.aroundBtn),
        this.results,
        this.legend,
        el('div', { class: 'body' }, this.canvas, this.side),
        this.info,
        el('div', { class: 'note' }, 'Trascina o frecce per spostarti, rotella o +/- per lo zoom; clic su un nodo per sceglierlo, doppio clic per il suo vicinato. Guardare non cambia nulla.'),
      ),
    );
    this.root.hidden = false;
    this.onClose?.();
    this.renderLegend();
    this.renderSide();
    this.animate();
  }

  close(): void {
    cancelAnimationFrame(this.frame);
    this.root.hidden = true;
    this.onClose?.();
  }

  // --- the data ---------------------------------------------------------------------------------

  private load(g: WorldGraph): void {
    const keep = this.selected !== undefined ? this.ids[this.selected] : undefined;
    this.g = g;
    this.ids = [...g.nodes.keys()];
    this.index = new Map(this.ids.map((id, i) => [id, i]));
    this.degree = this.ids.map(() => 0);
    for (const l of g.links) {
      this.degree[this.index.get(l.source)!]++;
      this.degree[this.index.get(l.target)!]++;
    }
    this.problems = g.check();
    this.flagged.clear();
    for (const p of this.problems)
      for (const id of p.nodi) {
        const i = this.index.get(id);
        if (i !== undefined) this.flagged.set(i, [...(this.flagged.get(i) ?? []), p.testo]);
      }
    this.all = this.viewOf(this.ids.map((_, i) => i));
    this.view = this.all;
    this.selected = keep !== undefined ? this.index.get(keep) : undefined;
    this.hover = undefined;
    this.fit();
  }

  private viewOf(nodes: number[]): View {
    const local = new Map(nodes.map((n, i) => [n, i]));
    const links: number[] = [];
    const pairs: Array<[number, number]> = [];
    this.g!.links.forEach((l, i) => {
      const a = local.get(this.index.get(l.source)!), b = local.get(this.index.get(l.target)!);
      if (a === undefined || b === undefined) return;
      links.push(i);
      pairs.push([a, b]);
    });
    const layout = new ForceLayout(nodes.length, pairs);
    // Small graphs are laid out at once; large ones move into place on screen.
    if (nodes.length <= 600) layout.run();
    return { nodes, local, links, layout };
  }

  private node(i: number): GraphNode {
    return this.g!.nodes.get(this.ids[i])!;
  }

  private visible(i: number): boolean {
    return !this.hidden.has(this.node(i).tipo);
  }

  /** Where a node is in the current view, if it is there. */
  private pos(i: number): [number, number] | undefined {
    const v = this.view!;
    const j = v.local.get(i);
    return j === undefined ? undefined : [v.layout.x[j], v.layout.y[j]];
  }

  // --- choosing ---------------------------------------------------------------------------------

  private select(i: number | undefined, center = false): void {
    // Going from node to node in a neighbourhood: the neighbourhood follows.
    if (i !== undefined && center && this.view !== this.all) return this.focusAround(i);
    this.selected = i;
    if (i !== undefined && center) {
      if (!this.pos(i)) this.focusAll();
      const p = this.pos(i)!;
      [this.cam.x, this.cam.y] = p;
      this.cam.zoom = Math.max(this.cam.zoom, 1);
      this.touched = true;
    }
    this.renderSide();
    this.draw();
  }

  /** Only the node and what is within two edges of it, laid out again around it. */
  private focusAround(i: number): void {
    const near = this.g!.neighbors(this.ids[i], AROUND).map((n) => this.index.get(n.id)!);
    this.view = this.viewOf([i, ...near]);
    this.selected = i;
    this.aroundBtn.classList.add('on');
    this.fit();
    this.renderSide();
    this.animate();
  }

  private focusAll(): void {
    this.view = this.all;
    this.aroundBtn.classList.remove('on');
    this.fit();
    this.animate();
  }

  private find(): void {
    const q = this.search.value.trim();
    const found = q ? this.g!.find(q).slice(0, 8) : [];
    this.results.replaceChildren(
      ...found.map((n) => {
        const b = el('button', {}, el('span', { class: 'dot', style: `background:${NODE_COLOR[n.tipo]}` }), n.label);
        b.onclick = () => {
          this.search.value = '';
          this.results.replaceChildren();
          this.select(this.index.get(n.id), true);
        };
        return b;
      }),
      ...(q && !found.length ? [el('span', { class: 'none' }, 'nessuno con questo nome')] : []),
    );
  }

  // --- the side and the legend --------------------------------------------------------------------

  private renderLegend(): void {
    const counts = new Map<NodeType, number>();
    for (const n of this.g!.nodes.values()) counts.set(n.tipo, (counts.get(n.tipo) ?? 0) + 1);
    this.legend.replaceChildren(
      ...TYPES.filter((t) => counts.get(t)).map((t) => {
        const b = el('button', { class: this.hidden.has(t) ? 'off' : '', title: this.hidden.has(t) ? 'mostra' : 'nascondi' }, el('span', { class: 'dot', style: `background:${NODE_COLOR[t]}` }), `${NODE_NAME[t]} ${counts.get(t)}`);
        b.onclick = () => {
          if (this.hidden.has(t)) this.hidden.delete(t);
          else this.hidden.add(t);
          this.renderLegend();
          this.draw();
        };
        return b;
      }),
    );
  }

  private link(i: number): HTMLElement {
    const n = this.node(i);
    const b = el('button', { class: 'node' }, el('span', { class: 'dot', style: `background:${NODE_COLOR[n.tipo]}` }), n.label);
    b.onclick = () => this.select(i, true);
    return b;
  }

  private renderSide(): void {
    this.aroundBtn.toggleAttribute('disabled', this.selected === undefined && this.view === this.all);
    const g = this.g!;
    if (this.selected === undefined) {
      // Nothing chosen: what does not hold, each with its nodes.
      const rows = this.problems.slice(0, 40).map((p) => el('div', { class: 'issue' }, p.testo, el('div', { class: 'row' }, ...p.nodi.map((id) => this.index.get(id)).filter((i): i is number => i !== undefined).map((i) => this.link(i)))));
      this.side.replaceChildren(
        el('div', { class: 'section' }, this.problems.length ? `Cose che non tornano (${this.problems.length})` : 'Tutto torna'),
        ...(this.problems.length ? rows : [el('div', { class: 'note' }, 'Nessun riferimento verso nulla, nessun legame impossibile o da un lato solo, nessun nome che si confonde.')]),
        ...(this.problems.length > 40 ? [el('div', { class: 'note' }, `e altre ${this.problems.length - 40}`)] : []),
        el('div', { class: 'note' }, 'Scegli un nodo per vederne gli archi.'),
      );
      return;
    }
    const i = this.selected;
    const n = this.node(i);
    const out: HTMLElement[] = [
      el('div', { class: 'name', style: `color:${NODE_COLOR[n.tipo]}` }, n.label),
      el('div', { class: 'kind' }, `${n.tipo} · ${n.id}`),
      el('div', { class: 'descr' }, g.describe(n.id).replace(/^- /, '')),
    ];
    const attrs = Object.entries(n).filter(([key]) => !['id', 'label', 'tipo', 'source_file'].includes(key));
    if (attrs.length) out.push(el('div', { class: 'attrs' }, ...attrs.map(([key, v]) => el('div', {}, el('b', {}, `${key}: `), short(v)))));
    if (n.source_file) {
      const row = el('div', { class: 'row' }, el('span', { class: 'path' }, n.source_file));
      if (this.k.files[n.source_file] !== undefined && this.onEdit) {
        const b = el('button', {}, 'Apri il file');
        b.onclick = () => this.onEdit?.(n.source_file);
        row.append(b);
      }
      out.push(row);
    }
    for (const t of this.flagged.get(i) ?? []) out.push(el('div', { class: 'issue' }, t));
    const edges = g.edges(n.id);
    out.push(el('div', { class: 'section' }, `Archi (${edges.length})`));
    for (const l of edges.slice(0, 80)) {
      const from = l.source === n.id;
      const other = this.index.get(from ? l.target : l.source)!;
      out.push(el('div', { class: 'edge' }, el('span', { class: 'rel' }, `${from ? '→' : '←'} ${relName(l)}`), this.link(other)));
    }
    if (edges.length > 80) out.push(el('div', { class: 'note' }, `e altri ${edges.length - 80}`));
    this.side.replaceChildren(...out);
  }

  // --- drawing ----------------------------------------------------------------------------------

  private animate(): void {
    cancelAnimationFrame(this.frame);
    const tick = () => {
      if (!this.isOpen) return;
      const moving = this.view!.layout.step(6);
      if (!moving && !this.touched) this.fit();
      this.draw();
      if (moving) this.frame = requestAnimationFrame(tick);
    };
    tick();
  }

  /** The camera on the whole view. */
  private fit(): void {
    this.touched = false;
    const v = this.view!;
    const [x0, y0, x1, y1] = v.layout.bounds();
    this.cam.x = (x0 + x1) / 2;
    this.cam.y = (y0 + y1) / 2;
    this.cam.zoom = Math.max(0.05, Math.min(2, (0.8 * Math.min(this.canvas.width / Math.max(1, x1 - x0), this.canvas.height / Math.max(1, y1 - y0)))));
  }

  /** A mouse point in the canvas's pixels (CSS may draw it smaller). */
  private sx(e: MouseEvent): number {
    return (e.offsetX * this.canvas.width) / (this.canvas.clientWidth || this.canvas.width);
  }

  private sy(e: MouseEvent): number {
    return (e.offsetY * this.canvas.height) / (this.canvas.clientHeight || this.canvas.height);
  }

  private toScreen(x: number, y: number): [number, number] {
    return [(x - this.cam.x) * this.cam.zoom + this.canvas.width / 2, (y - this.cam.y) * this.cam.zoom + this.canvas.height / 2];
  }

  private toWorld(sx: number, sy: number): [number, number] {
    return [(sx - this.canvas.width / 2) / this.cam.zoom + this.cam.x, (sy - this.canvas.height / 2) / this.cam.zoom + this.cam.y];
  }

  private radius(i: number): number {
    return (2.5 + Math.sqrt(this.degree[i])) * Math.max(0.6, Math.min(2.2, this.cam.zoom));
  }

  private nodeAt(sx: number, sy: number): number | undefined {
    let best: number | undefined;
    let bd = Infinity;
    for (const i of this.view?.nodes ?? []) {
      if (!this.visible(i)) continue;
      const [x, y] = this.toScreen(...this.pos(i)!);
      const d = Math.hypot(x - sx, y - sy);
      if (d < this.radius(i) + 4 && d < bd) [best, bd] = [i, d];
    }
    return best;
  }

  private draw(): void {
    const v = this.view;
    const g = this.g;
    if (!v || !g || !this.isOpen) return;
    const ctx = this.canvas.getContext('2d')!;
    const W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#05060b';
    ctx.fillRect(0, 0, W, H);
    const sel = this.selected;
    const near = new Set<number>();
    if (sel !== undefined) for (const l of g.edges(this.ids[sel])) near.add(this.index.get(l.source === this.ids[sel] ? l.target : l.source)!);
    const lit = (i: number) => sel === undefined || i === sel || near.has(i);
    // The edges: faint, those of the chosen node bright, in the colour of where they go.
    ctx.lineWidth = 1;
    ctx.strokeStyle = sel === undefined ? 'rgba(111, 195, 255, 0.18)' : 'rgba(111, 195, 255, 0.06)';
    ctx.beginPath();
    const mine: Array<[number, number, GraphLink]> = [];
    for (const li of v.links) {
      const l = g.links[li];
      const a = this.index.get(l.source)!, b = this.index.get(l.target)!;
      if (!this.visible(a) || !this.visible(b)) continue;
      if (sel !== undefined && (a === sel || b === sel)) {
        mine.push([a, b, l]);
        continue;
      }
      const [ax, ay] = this.toScreen(...this.pos(a)!);
      const [bx, by] = this.toScreen(...this.pos(b)!);
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
    }
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.font = '10px monospace';
    // One line per node it is linked to, with the names of all the edges between them.
    const byOther = new Map<number, string[]>();
    for (const [a, b, l] of mine) {
      const o = a === sel ? b : a;
      byOther.set(o, [...(byOther.get(o) ?? []), relName(l)]);
    }
    for (const [o, names] of byOther) {
      const [ax, ay] = this.toScreen(...this.pos(sel!)!);
      const [bx, by] = this.toScreen(...this.pos(o)!);
      ctx.strokeStyle = NODE_COLOR[this.node(o).tipo];
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      if (byOther.size <= 24) {
        ctx.fillStyle = 'rgba(200, 220, 230, 0.7)';
        ctx.fillText([...new Set(names)].join(' · '), (ax + bx) / 2 + 3, (ay + by) / 2 - 3);
      }
    }
    // The nodes, the most connected named; what does not hold ringed in red.
    const named = new Set([...v.nodes].sort((p, q) => this.degree[q] - this.degree[p]).slice(0, 14));
    for (const i of v.nodes) {
      if (!this.visible(i)) continue;
      const [x, y] = this.toScreen(...this.pos(i)!);
      if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
      const r = this.radius(i);
      ctx.globalAlpha = lit(i) ? 1 : 0.22;
      ctx.fillStyle = NODE_COLOR[this.node(i).tipo];
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      if (this.flagged.has(i)) {
        ctx.strokeStyle = '#ff4d5e';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (i === sel || i === this.hover) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (i === sel || i === this.hover || near.has(i) || (sel === undefined && (this.cam.zoom > 1.4 || named.has(i)))) {
        ctx.fillStyle = i === sel ? '#ffffff' : '#c8d8e0';
        ctx.font = i === sel ? '12px sans-serif' : '10px sans-serif';
        ctx.fillText(this.node(i).label.slice(0, 28), x + r + 3, y + 3);
      }
    }
    ctx.globalAlpha = 1;
  }
}

function relName(l: GraphLink): string {
  if (l.relation === 'legame') return String(l.legame ?? 'legame');
  if (l.relation === 'tappa') return `tappa${l.giorno !== undefined ? ` (giorno ${l.giorno})` : ''}`;
  return EDGE_NAME[l.relation] ?? l.relation;
}

function short(v: unknown): string {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > 160 ? `${s.slice(0, 157)}…` : s;
}
