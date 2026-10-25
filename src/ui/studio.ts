// Panels of the studio (the corona): a thing on show seen up close — its model, or the terrain as the Artist
// shows it, with «Riscolpisci» — a building's notice board, with the latest changes to its files, and what a
// showcase shows (T21), with its arrows, and an environment of the sample room on its trial draft (T26d).

import { PLACE_PHASES, type CanonShown, type Kernel, type LayoutSample, type PlaceMiniature, type RuleShown, type ShowcaseEntry } from '../kernel/kernel';
import type { StudioItem } from '../kernel/corona';
import { OPERATION_COLOR, OPERATION_NAME, type Operation, type OperationKind, type Situation } from '../kernel/situation';
import { ALERT_COLOR, ALERT_NAME, LIVE_LINES, SCREEN_NAME, fill, type Screens, type ScreenField } from '../kernel/screens';
import { tallyLine, usd } from '../kernel/ai/usage';
import { msText, STATION_KIND, type Chain, type Station } from '../kernel/chain';
import { fieldLabel, valueText, type BenchShown } from '../kernel/bench';
import type { BenchStep } from '../kernel/types';
import type { BibleShown } from '../kernel/bible';
import { NODE_COLOR, NODE_NAME, type GraphNode } from '../kernel/graph';
import { $, el } from './dom';
import { icons } from './hud';

/** A showcase and what it shows (the kernel's `ui:showcase` and `studio:showcase`). */
type Shown = { building: string; name: string; entry: ShowcaseEntry; index: number; count: number; phase?: number };

export class StudioPanel {
  private root = $('#studio');
  /** The building whose showcase the panel shows, while it is open. */
  private shown?: string;
  /** The field of the Direction's wall the panel shows, while it is open (T46b). */
  private screen?: ScreenField;
  /** Whether the panel shows the bench of the Systems Room (T27b), while it is open. */
  private benchOpen = false;
  /** Whether the panel shows the Library's lectern (T47a), while it is open. */
  private bibleOpen = false;
  onClose?: () => void;
  onEdit?: (path: string) => void;

  constructor(
    private k: Kernel,
  ) {
    k.bus.on('ui:exhibit', ({ item, building }: { item: StudioItem; building: string }) => this.exhibit(item, building));
    k.bus.on('ui:board', ({ building, name }: { building: string; name: string }) => this.board(building, name));
    k.bus.on('ui:showcase', (e: Shown) => this.showcase(e));
    k.bus.on('ui:situation', ({ situation }: { situation: Situation }) => this.situation(situation));
    k.bus.on('ui:screens', ({ field, screens }: { field: ScreenField; screens: Screens }) => this.screens(field, screens));
    // The film moved with the panel open: it follows.
    k.bus.on('studio:screens', ({ screens }: { screens: Screens }) => {
      if (this.isOpen && this.screen === 'tempo') this.screens('tempo', screens);
    });
    k.bus.on('ui:station', ({ station, chain }: { station: Station; chain: Chain }) => this.station(station, chain));
    k.bus.on('ui:bench', ({ bench, station }: { bench: BenchShown; station?: Station }) => this.bench(bench, station));
    // Another case, or its run arrived, with the panel open: it follows.
    k.bus.on('studio:bench', (b?: BenchShown) => {
      if (this.isOpen && this.benchOpen && b) this.bench(b, this.k.chain().stations.find((x) => x.id === b.entry.system));
    });
    k.bus.on('ui:layout', ({ sample, building }: { sample: LayoutSample; building: string }) => this.layout(sample, building));
    k.bus.on('ui:bible', (b: BibleShown) => this.bible(b));
    // The pages flipped with the panel open: it follows.
    k.bus.on('studio:bible', (b: BibleShown) => {
      if (this.isOpen && this.bibleOpen) this.bible(b);
    });
    k.bus.on('ui:rule', (r: RuleShown) => this.rule(r));
    k.bus.on('ui:canon', (c: CanonShown) => this.canon(c));
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
    this.screen = undefined;
    this.benchOpen = false;
    this.bibleOpen = false;
    this.root.replaceChildren(el('div', { class: 'window' }, close, ...children));
    this.root.hidden = false;
    this.onClose?.();
  }

  close(): void {
    this.root.hidden = true;
    this.shown = undefined;
    this.screen = undefined;
    this.benchOpen = false;
    this.bibleOpen = false;
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
    return mini && this.drawPlan(mini, phase);
  }

  private drawPlan(mini: PlaceMiniature, phase = PLACE_PHASES.length - 1): HTMLCanvasElement {
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

  /** An environment of the sample room (T26d): its trial draft from above, what it is, its program, «Apri il file». */
  layout(sample: LayoutSample, building: string): void {
    const frame = el('div', { class: 'frame' }, this.drawPlan(sample.mini));
    const S = sample.mini.size;
    const tried = sample.error
      ? `Non gira: ${sample.error}`
      : `Il suo programma su una bozza di prova (la ${sample.draft + 1} di 3, quella che cambia di più, come la prova il validatore): ${sample.changed} caselle su ${S * S} cambiate.`;
    const open = el('button', {}, 'Apri il file');
    open.onclick = () => {
      this.close();
      if (sample.path) this.onEdit?.(sample.path);
    };
    this.show(
      el('div', { class: 'title' }, sample.name),
      el('div', { class: 'note' }, `Ambiente del campionario — ${building} — ${sample.path}`),
      frame,
      el('div', { class: 'item' }, el('span', { class: 'path' }, 'Descrizione'), ` ${sample.description}`),
      el('div', { class: 'item' }, el('span', { class: 'path' }, 'Spazio'), ` ${sample.environment}`),
      el('div', { class: 'note' }, tried),
      el('div', { class: 'section' }, 'Il programma'),
      el('pre', { class: 'program' }, JSON.stringify(this.k.content.layouts[sample.id]?.program ?? {}, null, 1)),
      el('div', { class: 'row' }, open),
    );
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

  /**
   * The situation table of the Direction (T46a): the operations under way on a small map (regions outlined, a mark for
   * each, faults in red), then by kind, with where they are.
   */
  situation(s: Situation): void {
    const where = (o: Operation) => (o.cx === undefined ? 'nel codice, non nel mondo' : [o.place, o.region, `${o.cx},${o.cy}`].filter(Boolean).join(' · '));
    const row = (o: Operation) => el('div', { class: 'item' }, el('span', { style: `color:${OPERATION_COLOR[o.kind]}` }, '● '), el('span', { class: 'path' }, o.label), ` — ${o.detail} `, el('span', { class: 'note' }, `(${where(o)})`));
    const of = (kind: OperationKind) => s.ops.filter((o) => o.kind === kind);
    const places = of('luogo');
    const live = places.filter((o) => o.live);
    const queued = places.length - live.length;
    const section = (kind: OperationKind, list: Operation[], none: string) => [el('div', { class: 'section' }, `${OPERATION_NAME[kind][0].toUpperCase()}${OPERATION_NAME[kind].slice(1)} (${list.length})`), ...(list.length ? list.map(row) : [el('div', { class: 'note' }, none)])];
    this.show(
      el('div', { class: 'title' }, 'Il tavolo della situazione — Direzione'),
      el('div', { class: 'note' }, 'Il mondo dall\x27alto, come operazioni in corso. Guardare non cambia nulla.'),
      el('div', { class: 'frame situation' }, this.situationMap(s)),
      ...section('viandante', of('viandante'), ''),
      ...section('luogo', live, 'Il Cartografo non sta pianificando nessun luogo.'),
      ...(queued ? [el('div', { class: 'note' }, `In coda: ${queued} luogh${queued === 1 ? 'o' : 'i'} solo abbozzat${queued === 1 ? 'o' : 'i'}.`)] : []),
      ...section('trama', of('trama'), 'Nessuna trama aperta.'),
      ...section('missione', of('missione'), 'Nessuna missione accettata.'),
      ...section('guasto', of('guasto'), 'Nessun guasto aperto.'),
    );
  }

  /** The table seen from above: a cell per chunk, the regions outlined with their names, the marks. */
  private situationMap(s: Situation): HTMLCanvasElement {
    const { x0, y0, x1, y1 } = s.bounds;
    const cols = x1 - x0 + 1, rows = y1 - y0 + 1;
    const cell = Math.max(4, Math.floor(Math.min(236 / cols, 236 / rows)));
    const c = el('canvas', { class: 'plan' }) as HTMLCanvasElement;
    c.width = cols * cell;
    c.height = rows * cell;
    const g = c.getContext('2d')!;
    g.fillStyle = '#0a0812';
    g.fillRect(0, 0, c.width, c.height);
    g.font = '10px monospace';
    for (const r of s.regions) {
      g.strokeStyle = 'rgba(255,207,92,0.45)';
      g.strokeRect((r.centro[0] - r.raggio - x0) * cell + 0.5, (r.centro[1] - r.raggio - y0) * cell + 0.5, (r.raggio * 2 + 1) * cell - 1, (r.raggio * 2 + 1) * cell - 1);
      g.fillStyle = 'rgba(255,207,92,0.7)';
      g.fillText(r.nome, (r.centro[0] - r.raggio - x0) * cell + 2, (r.centro[1] - r.raggio - y0) * cell + 10);
    }
    // The places under the rest; the wanderer on top.
    const order: OperationKind[] = ['luogo', 'trama', 'missione', 'guasto', 'viandante'];
    for (const kind of order)
      for (const o of s.ops) {
        if (o.kind !== kind || o.cx === undefined || o.cy === undefined) continue;
        g.fillStyle = OPERATION_COLOR[kind];
        g.globalAlpha = kind === 'luogo' && !o.live ? 0.3 : 1;
        const m = kind === 'luogo' ? 1 : Math.max(1, cell / 4);
        g.fillRect((o.cx - x0) * cell + m, (o.cy - y0) * cell + m, cell - m * 2, cell - m * 2);
      }
    g.globalAlpha = 1;
    return c;
  }

  /**
   * A station of the Systems Room's chain (T27a): what the system does, its place in the tick, what it cost in the last
   * second, its fault, the whole chain with it lit, «Apri il file».
   */
  station(s: Station, c: Chain): void {
    const item = (what: string, text: string, color?: string) => el('div', { class: 'item' }, el('span', { class: 'path', ...(color ? { style: `color:${color}` } : {}) }, what), ` ${text}`);
    const measured = (x: Station) => (x.measure ? `${msText(x.measure.ms)} · ${x.measure.touched} entità` : 'non ancora misurato');
    const open = el('button', {}, 'Apri il file');
    open.onclick = () => {
      this.close();
      this.onEdit?.(s.path);
    };
    this.show(
      el('div', { class: 'title' }, `${s.name} — Sala Sistemi`),
      el('div', { class: 'note' }, `Stazione ${s.step} di ${c.stations.length} della catena: a ogni tick, ${c.hz} volte al secondo, il kernel esegue i sistemi uno dopo l'altro, in quest'ordine.`),
      ...(s.description ? [item('Che cosa fa', s.description)] : []),
      item('Chi è', `${STATION_KIND[s.kind]}, ordine ${s.order}${s.panel ? `, con il pannello «${s.panel}» nell'inventario` : ''}`),
      el('div', { class: 'section' }, "Nell'ultimo secondo, a tick"),
      ...(s.measure
        ? [item('Tempo', `${msText(s.measure.ms)} in media, ${msText(s.measure.peak)} al più`), item('Entità toccate', `${s.measure.touched} (lette, scritte, create o distrutte)`)]
        : [el('div', { class: 'note' }, 'Non ancora misurato: la catena misura un secondo alla volta.')]),
      ...(s.fault ? [el('div', { class: 'section' }, 'Guasto'), item('●', `${s.fault.message}${s.fault.count > 1 ? ` (${s.fault.count} volte)` : ''}`, '#ff3b3b')] : []),
      el('div', { class: 'section' }, `La catena (${msText(c.ms)} a tick in tutto)`),
      ...c.stations.map((x) => el('div', { class: 'item', ...(x.id === s.id ? { style: 'background:rgba(185,166,255,0.12)' } : {}) }, el('span', { class: 'path', ...(x.fault ? { style: 'color:#ff3b3b' } : {}) }, `${x.step}. ${x.name}`), ` — ${x.fault ? 'guasto' : measured(x)}`)),
      el('div', { class: 'row' }, open),
    );
  }

  /**
   * The bench of the Systems Room (T27b): the system and its case in words, what the kernel in miniature did with the code
   * the system has now (before → after, what it said, why it does not show the system working), the steps, the code with
   * the lines of the case lit, the station of the chain, «<» «>» and «Apri il file».
   */
  bench(b: BenchShown, s?: Station): void {
    const { entry, run, scene } = b;
    const c = entry.case;
    const item = (what: string, text: string, color?: string) => el('div', { class: 'item' }, el('span', { class: 'path', ...(color ? { style: `color:${color}` } : {}) }, what), ` ${text}`);
    const step = (d: number, text: string) => {
      const btn = el('button', {}, text);
      btn.onclick = () => this.k.stepBench(d);
      return btn;
    };
    const open = el('button', {}, 'Apri il file');
    open.onclick = () => {
      this.close();
      this.onEdit?.(entry.path);
    };
    const STEP: Record<BenchStep['tipo'], (p: any) => string> = {
      slot: (p) => `mette «${p.oggetto}» nello slot «${p.slot}»`,
      togli: (p) => `toglie ciò che è nello slot «${p.slot}»`,
      pulsante: (p) => `preme «${p.azione}»`,
      attendi: (p) => `aspetta ${valueText(p.secondi)} s`,
      cammina: (p) => `cammina verso ${p.verso === 'giu' ? 'giù' : p.verso} per ${valueText(p.secondi)} s`,
    };
    const lines = new Set(c.righe ?? []);
    const code = el('pre', { class: 'program' }, ...b.code.map((l, i) => el('div', lines.has(i + 1) ? { style: 'background:rgba(255,207,92,0.18);color:#ffcf5c' } : {}, `${String(i + 1).padStart(3, ' ')}  ${l}`)));
    this.show(
      el('div', { class: 'title' }, `${entry.name}: «${c.titolo}» — Sala Sistemi`),
      el('div', { class: 'note' }, `Il banco di prova, caso ${b.index + 1} di ${b.count}: un mondo in miniatura (5 × 5 caselle, il viandante al centro) dove gira il codice vero del sistema, quello che ha adesso. Se lo riscrivi, il caso cambia.`),
      ...(entry.description ? [item('Che cosa fa', entry.description)] : []),
      item('Il caso', c.racconto || c.titolo),
      ...(c.passi?.length ? [item('Che cosa succede', `${c.passi.map((p) => STEP[p.tipo](p)).join(', poi ')}; poi ${valueText(c.durata)} s.`)] : [item('Quanto dura', `${valueText(c.durata)} s`)]),
      el('div', { class: 'section' }, 'Prima e dopo'),
      ...(run
        ? [
            ...c.guarda.map((g) => item(fieldLabel(g, scene), `${valueText(run.prima[g])} → ${valueText(run.dopo[g])}`, run.cambiati.includes(g) ? '#7dff9a' : undefined)),
            ...run.messaggi.slice(0, 4).map((m) => item('Il viandante legge', `«${m}»`)),
            ...run.errori.map((e) => item('Non va', e, '#ff3b3b')),
          ]
        : [el('div', { class: 'note' }, 'Il mondo in miniatura sta girando…')]),
      ...(s ? [item('Nella catena', `stazione ${s.step}, ordine ${s.order}${s.measure ? `, ${msText(s.measure.ms)} a tick, ${s.measure.touched} entità` : ''}${s.fault ? `; guasto: ${s.fault.message}` : ''}`, s.fault ? '#ff3b3b' : undefined)] : []),
      el('div', { class: 'section' }, `Il codice (${entry.path}), le righe del caso accese`),
      code,
      el('div', { class: 'row' }, step(-1, '« il precedente'), step(1, 'il successivo »'), open),
    );
    this.benchOpen = true;
    // The code opens on the first lit line.
    const first = code.children[Math.min(...(c.righe?.length ? c.righe : [1])) - 1] as HTMLElement | undefined;
    if (first) code.scrollTop = Math.max(0, first.offsetTop - code.offsetTop - 40);
  }

  /**
   * A field of the Direction's wall of screens (T46b): the commit chosen on the film (what changed, who wanted it) with
   * «<» «>»; the consoles of the Council and the last lines of the log; the costs by agent and by task with the budgets.
   * Under the title, the band of the alert (T46c) and why.
   */
  screens(field: ScreenField, s: Screens): void {
    const a = s.allerta;
    const head = (text: string) =>
      el(
        'div',
        {},
        el('div', { class: 'title' }, `${text[0].toUpperCase()}${text.slice(1)} — Direzione`),
        el('div', { class: 'item' }, el('span', { class: 'path', style: `color:${ALERT_COLOR[a.level]}` }, `● Allerta ${a.level}: ${ALERT_NAME[a.level]}`)),
        ...a.reasons.map((r) => el('div', { class: 'note', style: `color:${ALERT_COLOR[a.level]}` }, `— ${r}`)),
      );
    const item = (what: string, text: string, color?: string) => el('div', { class: 'item' }, el('span', { class: 'path', ...(color ? { style: `color:${color}` } : {}) }, what), ` ${text}`);
    const time = (t: number) => new Date(t).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    if (field === 'tempo') {
      const t = s.tempo, c = t.chosen;
      const step = (d: number, text: string) => {
        const b = el('button', {}, text);
        b.onclick = () => this.k.stepTimeline(d);
        return b;
      };
      const changed = c?.changed;
      const files = changed === undefined
        ? [el('div', { class: 'note' }, 'Un commit di una sessione precedente: che cosa ha cambiato è nella storia del repository su disco.')]
        : changed.length
          ? changed.slice(0, 30).map((path) => {
              const b = el('button', {}, 'apri');
              b.onclick = () => {
                this.close();
                this.onEdit?.(path);
              };
              return el('div', { class: 'item' }, el('span', { class: 'path' }, path), ' ', b);
            })
          : [el('div', { class: 'note' }, 'Nessun file cambiato.')];
      this.show(
        head(SCREEN_NAME.tempo),
        el('div', { class: 'note' }, "Guardare non torna indietro: per tornare all'ultimo stato valido c'è solo R."),
        el('div', { class: 'row' }, step(1, '<'), el('span', { class: 'note' }, t.count ? `${t.count - t.index} di ${t.count}` : 'nessun commit'), step(-1, '>')),
        ...(c
          ? [
              item(c.id, c.message),
              item("chi l'ha voluto", c.who),
              item('quando', time(c.time)),
              el('div', { class: 'section' }, `Che cosa è cambiato${changed?.length ? ` (${changed.length} file)` : ''}`),
              ...files,
              ...(changed && changed.length > 30 ? [el('div', { class: 'note' }, `… e altri ${changed.length - 30}.`)] : []),
            ]
          : []),
        el('div', { class: 'section' }, 'La pellicola'),
        ...t.frames.map((f, i) => el('div', { class: 'item' }, el('span', { class: 'path', ...(i === t.at ? { style: 'color:#ffcf5c' } : {}) }, `${i === t.at ? '▶ ' : ''}${f.id}`), ` ${f.who}: ${f.message}`)),
      );
    } else if (field === 'registro') {
      const f = s.registro;
      const ago = (n?: number) => (n === undefined ? 'mai' : n < 60 ? `${n} s fa` : n < 3600 ? `${Math.round(n / 60)} min fa` : `${Math.round(n / 3600)} h fa`);
      this.show(
        head(SCREEN_NAME.registro),
        el('div', { class: 'note' }, "Chi lavora adesso (nell'ultimo minuto e mezzo), a che cosa, con quale modello. Il registro intero è nel pannello del Concilio (G)."),
        el('div', { class: 'section' }, 'Le console del Concilio'),
        ...f.desks.map((d) => el('div', { class: 'item' }, el('span', { style: `color:${d.working ? '#5cff8a' : '#555'}` }, '● '), el('span', { class: 'path', style: `color:${d.color}` }, `${d.sigil} ${d.name}`), ` ${d.task ? [d.task, d.model].filter(Boolean).join(' · ') : 'non ha ancora lavorato'} `, el('span', { class: 'note' }, `(${ago(d.ago)})${d.text ? ` — ${d.text.slice(0, 140)}` : ''}`))),
        el('div', { class: 'section' }, `Le ultime ${LIVE_LINES} righe`),
        ...(f.lines.length ? f.lines.map((l) => item(l.from, `${l.kind}: ${l.text.slice(0, 200)}`, l.color)) : [el('div', { class: 'note' }, 'Il registro è vuoto.')]),
      );
    } else {
      const c = s.costi;
      this.show(
        head(SCREEN_NAME.costi),
        el('div', { class: 'note' }, `sessione ${usd(c.session.usd)} · oggi ${usd(c.today.usd)} · in tutto ${usd(c.total.usd)}`),
        item('sessione', tallyLine(c.session)),
        item('oggi', tallyLine(c.today)),
        el('div', { class: 'section' }, 'Per agente (questa sessione)'),
        ...(c.byAgent.length ? c.byAgent.map((a) => item(a.name, tallyLine(a.tally), a.color)) : [el('div', { class: 'note' }, 'Nessuna chiamata in questa sessione.')]),
        el('div', { class: 'section' }, 'Per compito (oggi)'),
        ...(c.byTask.length ? c.byTask.map((t) => item(t.task, `${t.model} — ${tallyLine(t.tally)}`)) : [el('div', { class: 'note' }, 'Nessuna chiamata oggi.')]),
        el('div', { class: 'section' }, 'I budget della sessione (universe.json → ai)'),
        ...c.budgets.map((b) => item(b.nome, `${b.usati} di ${b.max} (${Math.round(fill(b) * 100)} %)`, fill(b) >= 1 ? '#ff3b3b' : fill(b) > 0.8 ? '#ffb000' : '#5cff8a')),
      );
    }
    this.screen = field;
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

  /**
   * The Library's lectern (T47a): the page of the bible, with touching graph nodes.
   * Clicking a node opens the Nucleus's graph centered on it.
   */
  bible(b: BibleShown): void {
    const { page } = b;
    const secColor: Record<string, string> = {
      prologo: '#ffcf5c',
      luoghi: '#9ad27a',
      personaggi: '#ffb38a',
      fatti: '#6fc3ff',
      misteri: '#c48aff',
    };
    const col = secColor[page.sezione] ?? '#7dd87d';

    const step = (d: number, text: string) => {
      const btn = el('button', {}, text);
      btn.onclick = () => this.k.stepBible(d);
      return btn;
    };

    const nodeChip = (n: GraphNode) => {
      const chip = el(
        'button',
        { class: 'node', style: 'margin: 2px 4px 2px 0;' },
        el('span', { class: 'dot', style: `background:${NODE_COLOR[n.tipo]}` }),
        `${n.label} `,
        el('small', { style: 'color: var(--dim);' }, `(${NODE_NAME[n.tipo] || n.tipo})`),
      );
      chip.onclick = () => {
        this.close();
        this.k.bus.emit('ui:graph', { node: n.id });
      };
      return chip;
    };

    const editBtn = el('button', {}, 'Apri world/bible.json');
    editBtn.onclick = () => {
      this.close();
      this.onEdit?.('world/bible.json');
    };

    this.show(
      el('div', { class: 'title' }, 'La Biblioteca del Mondo — Il Leggio'),
      el('div', { class: 'note' }, `La bibbia del mondo, pagina ${b.index + 1} di ${b.count}. «<» «>» sfogliano le pagine; i nodi del grafo toccati da questa pagina sono navigabili nel Nucleo.`),
      el(
        'div',
        { class: 'item', style: 'margin-top: 6px;' },
        el('span', { class: 'path', style: `color:${col}; text-transform: uppercase; font-weight: bold;` }, `[${page.sezione}]`),
        el('strong', { style: 'font-size: 15px; margin-left: 6px; color: var(--fg);' }, page.titolo),
      ),
      el('div', { class: 'note', style: 'white-space: pre-wrap; font-size: 13px; line-height: 1.5; color: var(--fg); background: #0c0f14; border: 1px solid var(--line); padding: 10px 12px; margin: 4px 0;' }, page.testo),
      el('div', { class: 'section' }, `Nodi del grafo collegati (${b.nodes.length})`),
      el(
        'div',
        { class: 'row', style: 'flex-wrap: wrap; max-height: 140px; overflow-y: auto; padding: 4px 0;' },
        ...(b.nodes.length ? b.nodes.map(nodeChip) : [el('div', { class: 'note' }, 'Nessun nodo collegato direttamente a questa voce.')]),
      ),
      el(
        'div',
        { class: 'row', style: 'justify-content: space-between; margin-top: 8px;' },
        el('div', { class: 'row' }, step(-1, '« precedente'), step(1, 'successivo »')),
        editBtn,
      ),
    );
    this.bibleOpen = true;
  }

  /**
   * A rule tablet of the Library of the World (T47b): the judgement of world/rules.json.
   */
  rule(r: RuleShown): void {
    const { rule, index, count, marked } = r;

    const step = (d: number, text: string) => {
      const btn = el('button', {}, text);
      btn.onclick = () => {
        const nextIdx = index + d;
        if (nextIdx >= 0 && nextIdx < count) this.k.openRule(nextIdx);
      };
      if (index + d < 0 || index + d >= count) btn.setAttribute('disabled', 'true');
      return btn;
    };

    const editBtn = el('button', {}, 'Apri world/rules.json');
    editBtn.onclick = () => {
      this.close();
      this.onEdit?.('world/rules.json');
    };

    const outcomeTag = rule.possibile
      ? el('span', { class: 'tag', style: 'background: #153820; color: #7ee08a; border: 1px solid #2a7a40; font-weight: bold; padding: 2px 8px; border-radius: 4px;' }, '✓ SI PUÒ')
      : el('span', { class: 'tag', style: 'background: #381515; color: #ff8a8a; border: 1px solid #7a2a2a; font-weight: bold; padding: 2px 8px; border-radius: 4px;' }, '✗ NON SI PUÒ');

    const recentBadge = marked
      ? el('span', { class: 'tag', style: 'background: #3a2e10; color: #ffcf5c; border: 1px solid #7a6020; font-weight: bold; padding: 2px 8px; border-radius: 4px; margin-left: 6px;' }, '★ REGOLA RECENTE')
      : undefined;

    this.show(
      el('div', { class: 'title' }, 'La Biblioteca del Mondo — Tavola della Regola'),
      el('div', { class: 'note' }, `Regola ${index + 1} di ${count} stabilita dal Concilio (world/rules.json). Le ultime 12 guidano il Narratore e il mondo.`),
      el(
        'div',
        { class: 'row', style: 'align-items: center; justify-content: space-between; margin-top: 8px;' },
        el('div', { class: 'row', style: 'align-items: center;' }, outcomeTag, ...(recentBadge ? [recentBadge] : [])),
        el('small', { style: 'color: var(--dim);' }, rule.chiave),
      ),
      el(
        'div',
        { class: 'item', style: 'margin-top: 8px;' },
        el('strong', { style: 'font-size: 15px; color: var(--fg);' }, rule.testo),
      ),
      el('div', { class: 'section' }, 'Il giudizio del Concilio'),
      el('div', { class: 'note', style: 'white-space: pre-wrap; font-size: 13px; line-height: 1.5; color: var(--fg); background: #0c0f14; border: 1px solid var(--line); padding: 10px 12px; margin: 4px 0;' }, rule.racconto),
      ...(rule.effetti?.length
        ? [
            el('div', { class: 'section' }, `Effetti applicati (${rule.effetti.length})`),
            el(
              'div',
              { class: 'row', style: 'flex-wrap: wrap; gap: 4px; margin: 4px 0;' },
              ...rule.effetti.map((eff: string) => el('span', { class: 'tag', style: 'background: #182230; color: #6fc3ff; border: 1px solid #284460; padding: 2px 6px;' }, eff)),
            ),
          ]
        : []),
      ...(rule.carta
        ? [
            el('div', { class: 'section' }, 'Carta del giocatore'),
            el('div', { class: 'note', style: 'font-size: 12px; color: var(--dim);' }, `Autore: ${rule.carta.autore ?? 'Concilio'} · Titolare: ${rule.carta.titolare ?? rule.carta.pagante}`),
          ]
        : []),
      el(
        'div',
        { class: 'row', style: 'justify-content: space-between; margin-top: 12px;' },
        el('div', { class: 'row' }, step(-1, '« precedente'), step(1, 'successiva »')),
        editBtn,
      ),
    );
  }

  /**
   * The rune canon engraved above the door (T47b): world/canone.md and the magic runes with their colours.
   */
  canon(c: CanonShown): void {
    const editBtn = el('button', {}, 'Apri world/canone.md');
    editBtn.onclick = () => {
      this.close();
      this.onEdit?.('world/canone.md');
    };

    const runeCard = (r: CanonShown['runes'][number]) =>
      el(
        'div',
        {
          style: `display: inline-flex; flex-direction: column; background: #0c1018; border: 1px solid ${r.color}55; border-radius: 4px; padding: 6px 8px; margin: 3px; min-width: 100px;`,
        },
        el('div', { style: 'display: flex; align-items: center; justify-content: space-between;' },
          el('span', { style: `font-size: 20px; font-weight: bold; color: ${r.color}; line-height: 1;` }, r.glyph),
          el('span', { style: 'font-size: 11px; text-transform: uppercase; color: var(--dim);' }, r.element),
        ),
        el('strong', { style: `font-size: 13px; color: ${r.color}; margin-top: 2px;` }, r.name),
        el('small', { style: 'color: var(--dim); font-size: 11px;' }, `«${r.token}»`),
        el('div', { style: 'font-size: 11px; color: var(--fg); margin-top: 4px; line-height: 1.2;' }, r.description),
      );

    this.show(
      el('div', { class: 'title' }, 'La Biblioteca del Mondo — Il Canone delle Rune'),
      el('div', { class: 'note' }, 'Ciò che chi vive nel mondo sa delle rune. È inciso sull\'architrave sopra la porta della Biblioteca (world/canone.md).'),
      el('div', { class: 'section' }, `Le rune magiche di questo mondo (${c.runes.length})`),
      el(
        'div',
        { class: 'row', style: 'flex-wrap: wrap; margin: 4px 0;' },
        ...c.runes.map(runeCard),
      ),
      el('div', { class: 'section' }, 'Il testo del Canone'),
      el('div', { class: 'note', style: 'white-space: pre-wrap; font-size: 12px; line-height: 1.5; color: var(--fg); background: #0c0f14; border: 1px solid var(--line); padding: 10px 12px; max-height: 220px; overflow-y: auto; margin: 4px 0;' }, c.text),
      ...(c.spells.length
        ? [
            el('div', { class: 'section' }, `Incantesimi conosciuti (${c.spells.length})`),
            el(
              'div',
              { style: 'max-height: 120px; overflow-y: auto;' },
              ...c.spells.map((s) =>
                el(
                  'div',
                  { class: 'item', style: 'margin: 2px 0;' },
                  el('span', { class: 'path', style: 'color: #7dd87d;' }, s.seq),
                  el('strong', { style: 'margin-left: 6px;' }, s.name),
                  el('span', { style: 'color: var(--dim); margin-left: 6px; font-size: 12px;' }, s.description),
                ),
              ),
            ),
          ]
        : []),
      el(
        'div',
        { class: 'row', style: 'justify-content: flex-end; margin-top: 10px;' },
        editBtn,
      ),
    );
  }
}
