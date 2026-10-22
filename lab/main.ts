// The voxel lab page (/lab/): pick an asset of the universe or a preset, let the sculptor write a
// MarkovJunior 3D program for it, look at the four 3/4 views, ask the artist, revise. Experimental and
// separate from the game: it only reads the universe, and keeps its results in this browser.

import { GeminiModels } from '../src/kernel/ai/gemini';
import { emptyUsage, type ImageCall, type Models, type TextCall } from '../src/kernel/ai/models';
import { DIRECTION_VIEW, sway, walk } from './mj3d/animate';
import { buildStructure, compose, DEFAULT_STRUCT, STRUCTURE_PRESETS, STRUCTURE_TRIALS, type StructureTarget } from './mj3d/architect';
import { analyse, type Analysis } from './mj3d/check';
import { Mj3Error, run, type Grid3, type Program3, type RunResult, type Vec3 } from './mj3d/engine';
import { EXAMPLES } from './mj3d/examples';
import { meterCost, meteredFetch, newMeter } from './mj3d/meter';
import { usd } from './mj3d/prices';
import { LabMockModels } from './mj3d/mock';
import { DAY, DEFAULT_RENDER, region, render, sheet, shrink, VIEWS, type Picture, type RenderOptions } from './mj3d/render';
import { boxOf, CLASSES, TILE } from './mj3d/scale';
import { classFor, contactSheet, DEFAULT_SCULPT, review, sculpt, type Attempt, type Category, type Critique, type Executor, type SculptOptions, type Target } from './mj3d/sculptor';
import { act as actOn, buildBlocks, catalogue, runLayout, type BlockReport, type Blockset, type Catalogue, type Layout, type LayoutResult, type Placement } from './mj3d/structure';
import { PRESETS, styleOf, universeTargets } from './mj3d/targets';
import { castle, CASTELLO, CASTELLO_PIANTA } from './programs/castello';
import { SOTTERRANEO, SOTTERRANEO_PIANTA } from './programs/sotterraneo';
import { rocca, ROCCA, ROCCA_PIANTA } from './programs/rocca';
import { CRIPTA, CRIPTA_PIANTA } from './programs/cripta';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const params = new URLSearchParams(location.search);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...children: Array<Node | string | null | undefined | false>): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = String(v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v as EventListener);
    else if (v !== undefined && v !== false) (e as any)[k] = v;
  }
  for (const c of children) if (c) e.append(c);
  return e;
}

// ------------------------------------------------------------------ persistence (this browser only)

interface Version {
  n: number;
  time: number;
  model: string;
  how: 'scultore' | 'revisione' | 'a mano';
  options: { examples: boolean; shapes: boolean };
  seed: number;
  program: Program3;
  errors: string[];
  warnings: string[];
  notes: string[];
  attempts: number;
  critique?: Critique;
}

const KEY = 'rune.lab.v1';
const load = <T>(k: string, fallback: T): T => {
  try {
    const s = localStorage.getItem(k);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};
const save = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    log('impossibile salvare nel browser (spazio esaurito?)', 'err');
  }
};

const store: Record<string, Version[]> = load(KEY, {});
const custom: Target[] = load('rune.lab.custom', []);
const edits: Record<string, Partial<Target>> = load('rune.lab.edits', {});
const persist = () => save(KEY, store);

// ------------------------------------------------------------------ models

/** Gemini through the proxy, one client per text model; the counters add up across them. */
class LabModels implements Models {
  readonly canPaint = false;
  limits = { text: 600, images: 0 };
  private clients = new Map<string, Models>();
  constructor(
    private online: boolean,
    public model: string,
  ) {}
  get name() {
    return this.online ? this.model : 'offline';
  }
  get usage() {
    const u = emptyUsage();
    for (const c of this.clients.values()) for (const k of Object.keys(u) as Array<keyof typeof u>) u[k] += c.usage[k];
    return u;
  }
  private client(): Models {
    const key = this.online ? this.model : 'offline';
    let c = this.clients.get(key);
    if (!c) {
      // A request that hangs is given up after 4 minutes (GeminiModels then tries again).
      c = this.online ? new GeminiModels({ textModel: this.model, imageModel: 'none', limits: { text: 600, images: 0 }, fetchImpl: meteredFetch(meter, { timeout: 240_000 }) }) : new LabMockModels();
      this.clients.set(key, c);
    }
    return c;
  }
  async text(call: TextCall): Promise<string> {
    const t0 = performance.now();
    try {
      return await this.client().text(call);
    } finally {
      log(`${call.agent} · ${call.task} · ${this.name} · ${Math.round(performance.now() - t0)} ms`);
      showUsage();
    }
  }
  async image(_call: ImageCall): Promise<string | null> {
    return null;
  }
}

let models: LabModels;
/** Every token of every call, reasoning and cache included. */
const meter = newMeter();

// ------------------------------------------------------------------ worker

let worker: Worker | null = null;
let chain: Promise<unknown> = Promise.resolve();

/** One job at a time in the worker; one that runs for too long is stopped. */
function job<T>(msg: object, parse: (d: any) => T, timeout = 20000): Promise<T> {
  const p = chain.then(
    () =>
      new Promise<T>((resolve, reject) => {
        worker ??= new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
        const w = worker;
        const timer = setTimeout(() => {
          w.terminate();
          worker = null;
          reject(new Mj3Error(`troppo lento: interrotto dopo ${timeout / 1000} secondi (metti "steps" a ciò che cresce)`));
        }, timeout);
        w.onmessage = (e) => {
          clearTimeout(timer);
          const d = e.data;
          if (d.error) reject(d.mj ? new Mj3Error(d.error) : new Error(d.error));
          else resolve(parse(d));
        };
        w.postMessage({ id: 1, ...msg });
      }),
  );
  chain = p.catch(() => undefined);
  return p;
}

const exec: Executor = (program, seed) => job({ program, seed }, (d) => ({ grid: { ...d.grid, log: [], epoch: 0 }, steps: d.steps, finished: d.finished, ms: d.ms }));

/** A structure expanded and photographed in the worker (it can be millions of voxels). */
const photograph = (set: Blockset, placements: Placement[], size: Vec3, seed: number, views: number[], cut?: number, plan?: { layout: Layout; cells: string[] }) =>
  job(
    { kind: 'structure', set, placements: placements.map((p) => ({ x: p.x, y: p.y, z: p.z, rot: p.rot, block: p.block.code })), size, seed, cut, views, render: { ...ropts }, ...(plan ?? {}) },
    (d) => d.pictures as Picture[],
    60000,
  );

// ------------------------------------------------------------------ state

let universe = params.get('universe') ?? 'valmora';
let files: Record<string, string> = {};
let fromUniverse: Target[] = [];
let style: string | undefined;
let step: Category | 'blocchi' = 'semplice';
let current: Target | null = null;
let shown = -1;
let busy = 0;
const results = new Map<string, RunResult>();
const raws = new Map<string, Attempt[]>();
const sprites = new Map<string, Promise<string | undefined>>();
let ropts: RenderOptions & { zoom: number } = { ...DEFAULT_RENDER, zoom: 4, ...load('rune.lab.render', {}) };
let spin: number | undefined;

const STEPS: Array<[Category | 'blocchi', string]> = [
  ['semplice', '1 · semplici'],
  ['struttura', '2 · strutture'],
  ['figura', '3 · figure'],
  ['blocchi', '4 · a blocchi'],
];

const KIND_CATEGORY: Record<string, Category> = { persona: 'figura', animale: 'figura', bestia: 'figura', monumento: 'struttura', edificio: 'struttura' };

/** The programs written by hand (by Claude Code), each with its version already made. */
const handWritten: Target[] = EXAMPLES.map((e) => ({ id: `claude:${e.id}`, name: e.program.name ?? e.ask, category: KIND_CATEGORY[e.kind] ?? 'semplice', kind: e.kind, description: e.ask, source: 'scritto da Claude Code' }));
for (const e of EXAMPLES) {
  const vs = (store[`claude:${e.id}`] ??= []);
  if (!vs.some((v) => v.model === 'Claude Code' && JSON.stringify(v.program) === JSON.stringify(e.program)))
    vs.push({ n: (vs.at(-1)?.n ?? 0) + 1, time: Date.now(), model: 'Claude Code', how: 'a mano', options: { examples: false, shapes: true }, seed: 1, program: e.program, errors: [], warnings: [], notes: [], attempts: 0 });
}

const allTargets = () => [...PRESETS, ...handWritten, ...fromUniverse, ...custom].map((t) => ({ ...t, ...(edits[t.id] ?? {}) }));
const versions = (t: Target) => (store[t.id] ??= []);

function log(text: string, kind: '' | 'ok' | 'err' = '') {
  const feed = $('#feed');
  feed.prepend(el('div', { class: kind }, `${new Date().toLocaleTimeString()}  ${text}`));
  while (feed.childElementCount > 200) feed.lastElementChild!.remove();
}

function showUsage() {
  const u = models.usage;
  $('#usage').textContent = `chiamate ${u.text} · input ${meter.prompt} (in cache ${meter.cached}) · risposta ${meter.output} · ragionamento ${meter.thoughts} · costo ${usd(meterCost(meter))}${u.failures ? ` · errori ${u.failures}` : ''}`;
}

function sprite(ref?: string): Promise<string | undefined> {
  if (!ref) return Promise.resolve(undefined);
  let p = sprites.get(ref);
  if (!p) {
    p = fetch(`/api/universe/${universe}/asset/${encodeURIComponent(ref)}`)
      .then((r) => (r.ok ? r.text() : undefined))
      .then((t) => (t?.startsWith('data:') ? t : undefined))
      .catch(() => undefined);
    sprites.set(ref, p);
  }
  return p;
}

// ------------------------------------------------------------------ pictures

function canvasOf(p: Picture, zoom = ropts.zoom): HTMLCanvasElement {
  const c = el('canvas', { class: 'pix', width: p.w, height: p.h });
  c.getContext('2d')!.putImageData(new ImageData(p.data, p.w, p.h), 0, 0);
  c.style.width = `${p.w * zoom}px`;
  c.style.height = `${p.h * zoom}px`;
  return c;
}
const dataUrl = (p: Picture) => canvasOf(p, 1).toDataURL('image/png');

async function resultOf(t: Target, v: Version, seed = v.seed): Promise<RunResult> {
  const key = `${t.id}#${v.n}#${seed}`;
  let r = results.get(key);
  if (!r) {
    r = await exec(v.program, seed);
    results.set(key, r);
  }
  return r;
}

// ------------------------------------------------------------------ list

function status(t: Target): string {
  const v = store[t.id]?.at(-1);
  if (!v) return '';
  if (v.errors.length) return 'bad';
  if (v.critique?.verdetto === 'approvato') return 'ok';
  return 'mid';
}

function renderList() {
  const tabs = $('#steps');
  tabs.replaceChildren(...STEPS.map(([c, label]) => el('button', { class: c === step ? 'on' : '', onclick: () => ((step = c), renderList(), renderMain()) }, label)));
  const f = $<HTMLInputElement>('#filter').value.trim().toLowerCase();
  const list = $('#list');
  list.replaceChildren();
  if (step === 'blocchi') return renderStructList(list, f);
  const groups: Array<[string, Target[]]> = [
    ['prove', PRESETS],
    ['scritti da Claude Code', handWritten],
    [universe, fromUniverse],
    ['tuoi', custom],
  ];
  for (const [label, ts] of groups) {
    const items = ts.map((t) => ({ ...t, ...(edits[t.id] ?? {}) })).filter((t) => t.category === step && (!f || `${t.name} ${t.source ?? ''}`.toLowerCase().includes(f)));
    if (!items.length) continue;
    list.append(el('div', { class: 'dim' }, `${label} (${items.length})`));
    for (const t of items) {
      const img = el('div', { class: 'ph' });
      void sprite(t.sprite).then((src) => src && img.replaceWith(el('img', { src })));
      const n = store[t.id]?.length ?? 0;
      list.append(
        el(
          'div',
          { class: `target ${current?.id === t.id ? 'on' : ''}`, onclick: () => select(t) },
          img,
          el('div', { class: 'name' }, t.name, el('div', { class: 'src' }, `${t.source ?? ''}${n ? ` · ${n} versioni` : ''}`)),
          el('span', { class: `dot ${status(t)}` }),
        ),
      );
    }
  }
}

function select(t: Target) {
  current = t;
  shown = versions(t).length - 1;
  renderList();
  void renderMain();
}

// ------------------------------------------------------------------ main panel

/** The sculpting options of the page (they survive the redraws and the reloads). */
const ui = { examples: true, shapes: true, review: true, retries: 2, seed: 1, ...load('rune.lab.options', {}) };

function options(): SculptOptions {
  return { ...DEFAULT_SCULPT, examples: ui.examples, shapes: ui.shapes, retries: ui.retries, seed: ui.seed, style };
}

function check(key: 'examples' | 'shapes' | 'review', label: string, title = '') {
  const i = el('input', { type: 'checkbox', checked: ui[key] });
  i.addEventListener('change', () => ((ui[key] = i.checked), save('rune.lab.options', ui)));
  return el('label', { title }, i, label);
}
function num(id: string, label: string, value: number, min: number, max: number, onchange?: (v: number) => void) {
  const i = el('input', { type: 'number', id, value: String(value), min: String(min), max: String(max) });
  if (onchange) i.addEventListener('change', () => onchange(Number(i.value)));
  return el('label', {}, label, i);
}

async function renderMain() {
  const main = $('#main');
  if (spin) clearInterval(spin);
  stopAnimations();
  if (step === 'blocchi') return renderStructMain();
  if (!current) return;
  const t = current;
  const vs = versions(t);
  const v = vs[shown];

  const ref = el('div', { class: 'ref' });
  void sprite(t.sprite).then((src) => src && ref.prepend(el('img', { src }), el('div', { class: 'dim' }, 'sprite attuale')));
  // Every frame the universe has for it: the walk (direction × 3) or the variants of an obstacle.
  if (t.frames || t.variants) {
    const grid = el('div', { class: 'frames' });
    const rows: Array<[string, string[]]> = t.frames ? Object.entries(t.frames) : [['varianti', t.variants!]];
    for (const [dir, ids] of rows) {
      const row = el('div', { class: 'frame-row' }, el('span', { class: 'dim' }, dir));
      for (const id of ids) {
        const img = el('img', { class: 'pix', title: id });
        void sprite(id).then((src) => src && (img.src = src));
        row.append(img);
      }
      grid.append(row);
    }
    ref.append(grid, el('div', { class: 'dim' }, `${rows.reduce((s, [, ids]) => s + ids.length, 0)} fotogrammi nell'universo`));
  }
  const edit = (field: 'description' | 'look', rows = 2) => {
    const a = el('textarea', { rows, value: t[field] ?? '', placeholder: field === 'description' ? 'descrizione' : 'aspetto (imagePrompt)' });
    a.style.width = '100%';
    a.addEventListener('change', () => {
      edits[t.id] = { ...(edits[t.id] ?? {}), [field]: a.value };
      save('rune.lab.edits', edits);
      current = { ...t, [field]: a.value };
    });
    return a;
  };
  // The class gives the box: every member of a class has the same one (scale.ts).
  const { cls, box, minHeight } = classFor(t);
  const kindIn = el('select', {}, ...CLASSES.map((c) => el('option', { value: c.id, selected: c.id === cls.id }, `${c.name} · ${boxOf(c).join('×')}`)));
  kindIn.addEventListener('change', () => {
    edits[t.id] = { ...(edits[t.id] ?? {}), kind: kindIn.value };
    save('rune.lab.edits', edits);
    current = { ...t, kind: kindIn.value };
    void renderMain();
  });
  const sizeIn = el('span', { class: 'dim' }, ` scatola ${box.join('×')} voxel = ${cls.tiles.join('×')} caselle da ${TILE}${minHeight ? ` · alto almeno ${minHeight}` : ''}${cls.animation ? ` · ${cls.animation}` : ''}`);

  const can = !busy;
  const head = el(
    'div',
    { class: 'card' },
    el(
      'div',
      { class: 'row' },
      el(
        'div',
        { class: 'grow' },
        el('h2', {}, t.name),
        el('h3', {}, `${t.source ?? ''}${t.context ? ` · ${t.context}` : ''}`),
        edit('description', 3),
        edit('look'),
        el('div', { class: 'controls' }, el('label', {}, 'classe ', kindIn), sizeIn),
      ),
      ref,
    ),
    el(
      'div',
      { class: 'controls' },
      check('examples', 'esempi', 'esempi scritti a mano nel prompt (few-shot)'),
      check('shapes', 'shape', 'permette le forme primitive; senza, solo regole come in MarkovJunior'),
      check('review', 'Artista subito', "dopo ogni programma valido, l'Artista guarda le viste"),
      num('o-retries', 'tentativi ', ui.retries, 0, 5, (n) => ((ui.retries = n), save('rune.lab.options', ui))),
      num('o-seed', 'seme ', ui.seed, 1, 9999, (n) => ((ui.seed = n), save('rune.lab.options', ui))),
    ),
    el(
      'div',
      { class: 'controls' },
      el('button', { class: 'primary', disabled: !can, onclick: () => act(() => doSculpt(t)) }, 'Scolpisci'),
      el('button', { disabled: !can || !v, onclick: () => act(() => doSculpt(t, v)), title: "lo Scultore vede le sue viste e il giudizio dell'Artista" }, 'Migliora'),
      el('button', { disabled: !can || !v, onclick: () => act(() => doReview(t, v)) }, "Chiedi all'Artista"),
      busy ? el('span', { class: 'busy' }, 'al lavoro…') : null,
    ),
  );
  main.replaceChildren(head);
  if (!vs.length) {
    main.append(el('p', { class: 'dim' }, 'Nessuna versione: «Scolpisci» chiede un programma allo Scultore.'));
    return;
  }

  // Versions and the model.
  const card = el('div', { class: 'card' });
  card.append(
    el(
      'div',
      { class: 'versions' },
      ...vs.map((x, i) =>
        el('button', { class: i === shown ? 'on' : '', onclick: () => ((shown = i), renderMain()), title: `${x.how} · ${x.model} · ${new Date(x.time).toLocaleString()}` }, `v${x.n}${x.critique ? ` · ${x.critique.voto}` : ''}${x.errors.length ? ' ✗' : ''}`),
      ),
    ),
    el('h3', {}, `${v.how} · ${v.model} · esempi ${v.options.examples ? 'sì' : 'no'} · shape ${v.options.shapes ? 'sì' : 'no'} · ${v.attempts} tentativi`),
  );
  main.append(card);

  let r: RunResult;
  let a: Analysis;
  try {
    r = await resultOf(t, v);
    a = analyse(r, v.program.palette);
  } catch (e) {
    card.append(el('ul', { class: 'issues' }, el('li', { class: 'err' }, (e as Error).message)));
    main.append(programCard(t, v));
    return;
  }
  if (current !== t) return;
  card.append(
    el('div', { class: 'stats dim' }, ...[`${a.voxels} voxel`, `griglia ${v.program.size.join('×')}`, `${a.steps} passi`, `${a.ms} ms`, `${a.parts} pezzi`, `colori ${Object.keys(a.colors).length}`].map((s) => el('span', {}, s))),
    el('ul', { class: 'issues' }, ...a.errors.map((s) => el('li', { class: 'err' }, s)), ...a.warnings.map((s) => el('li', { class: 'warn' }, s)), ...v.notes.map((s) => el('li', { class: 'note' }, s))),
  );

  const stage = el('div', { class: 'stage' });
  VIEWS.forEach((name, i) => stage.append(el('figure', {}, canvasOf(render(r.grid, v.program.palette, i, ropts)), el('figcaption', {}, name))));
  const turntable = canvasOf(render(r.grid, v.program.palette, 0, ropts));
  let k = 0;
  spin = window.setInterval(() => {
    const p = render(r.grid, v.program.palette, ++k % 4, ropts);
    turntable.width = p.w;
    turntable.height = p.h;
    turntable.style.width = `${p.w * ropts.zoom}px`;
    turntable.style.height = `${p.h * ropts.zoom}px`;
    turntable.getContext('2d')!.putImageData(new ImageData(p.data, p.w, p.h), 0, 0);
  }, 500);
  stage.append(el('figure', {}, turntable, el('figcaption', {}, 'giro')));
  card.append(stage, renderControls());

  // The same program with other seeds: variety that costs nothing.
  const variants = el('div', { class: 'stage variants' });
  card.append(el('h3', { style: 'margin-top:10px' }, 'varianti (stesso programma, altri semi)'), variants);
  for (const seed of [v.seed + 1, v.seed + 2, v.seed + 3, v.seed + 4, v.seed + 5]) {
    void resultOf(t, v, seed).then(
      (rv) => variants.append(el('figure', {}, canvasOf(render(rv.grid, v.program.palette, 0, ropts), Math.max(1, ropts.zoom - 1)), el('figcaption', {}, `seme ${seed}`))),
      () => undefined,
    );
  }

  main.append(framesCard(r.grid, v.program, t));
  if (v.critique) main.append(critiqueCard(v.critique));
  main.append(programCard(t, v, r));
}

let animations: number[] = [];
const stopAnimations = () => {
  for (const a of animations) clearInterval(a);
  animations = [];
};

/** A canvas that cycles through pictures. */
function animated(pics: Picture[], zoom: number, ms: number): HTMLCanvasElement {
  const c = canvasOf(pics[0], zoom);
  const w = Math.max(...pics.map((p) => p.w)), h = Math.max(...pics.map((p) => p.h));
  c.width = w;
  c.height = h;
  c.style.width = `${w * zoom}px`;
  c.style.height = `${h * zoom}px`;
  let k = 0;
  const draw = () => {
    const p = pics[k++ % pics.length];
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    ctx.putImageData(new ImageData(p.data, p.w, p.h), Math.floor((w - p.w) / 2), h - p.h);
  };
  draw();
  animations.push(window.setInterval(draw, ms));
  return c;
}

const VIANDANTE = EXAMPLES.find((e) => e.id === 'viandante')!.program;
let viandante: Grid3 | undefined;

/**
 * What the kernel makes from one model at no cost: the walk for figures (the game's 4 directions × 3
 * frames: left foot, passing, right foot), the wind for plants, the shadow over the day for everything;
 * and the model next to the wanderer, to judge its size.
 */
function framesCard(g: Grid3, p: Program3, t: Target): HTMLElement {
  stopAnimations();
  const card = el('div', { class: 'card' }, el('h3', {}, 'fotogrammi (generati dal kernel, gratis)'));
  const z = Math.max(1, ropts.zoom - 1);
  const { cls } = classFor(t);
  if (cls.animation === 'camminata') {
    const { frames, rig } = walk(g, p.palette);
    card.append(el('div', { class: 'dim' }, rig.limbs.length ? `scheletro: ${rig.limbs.map((l) => l.part).join(', ')}${rig.guessed ? ' (indovinato: nel palette non ci sono "part")' : ''}` : 'nessun arto: la figura resta ferma'));
    const sheetRow = el('div', { class: 'stage' });
    for (const d of ['down', 'left', 'right', 'up'] as const) {
      const pics = frames.map((f) => render(f, p.palette, DIRECTION_VIEW[d], ropts));
      sheetRow.append(el('figure', {}, el('div', { class: 'strip' }, ...pics.map((pic) => canvasOf(pic, z))), el('figcaption', {}, d)));
      sheetRow.append(el('figure', {}, animated([pics[0], pics[1], pics[2], pics[1]], z, 180), el('figcaption', {}, `${d}, in cammino`)));
    }
    card.append(sheetRow);
  } else if (cls.animation === 'vento') {
    const pics = sway(g).map((f) => render(f, p.palette, 0, ropts));
    card.append(el('div', { class: 'stage' }, el('figure', {}, el('div', { class: 'strip' }, ...pics.map((pic) => canvasOf(pic, z))), el('figcaption', {}, 'vento: fermo, metà, pieno, metà')), el('figure', {}, animated(pics, z, 260), el('figcaption', {}, 'al vento'))));
  }
  const day = DAY.map((d) => render(g, p.palette, 0, { ...ropts, sun: d.sun }));
  viandante ??= run(VIANDANTE, 1).grid;
  card.append(
    el(
      'div',
      { class: 'stage' },
      el('figure', {}, el('div', { class: 'strip' }, ...day.map((pic) => canvasOf(pic, z))), el('figcaption', {}, DAY.map((d) => d.name).join(' · '))),
      el('figure', {}, animated(day, z, 600), el('figcaption', {}, "l'ombra nel giorno")),
      el('figure', {}, canvasOf(sheet([render(viandante, VIANDANTE.palette, 0, ropts), render(g, p.palette, 0, ropts)], 1, 2), z), el('figcaption', {}, 'accanto al viandante (stessa scala)')),
    ),
  );
  return card;
}

function renderControls(): HTMLElement {
  const set = (k: keyof typeof ropts) => (val: number | boolean) => {
    ropts = { ...ropts, [k]: val };
    save('rune.lab.render', ropts);
    void renderMain();
  };
  const box = (k: 'outline' | 'shadow' | 'light' | 'crop', label: string) => {
    const i = el('input', { type: 'checkbox', checked: ropts[k] });
    i.addEventListener('change', () => set(k)(i.checked));
    return el('label', {}, i, label);
  };
  return el(
    'div',
    { class: 'controls dim' },
    num('r-zoom', 'zoom ', ropts.zoom, 1, 10, set('zoom')),
    num('r-px', 'px/voxel ', ropts.px, 1, 8, set('px')),
    num('r-top', 'faccia sopra ', ropts.top, 0, 8, set('top')),
    num('r-front', 'faccia davanti ', ropts.front, 0, 8, set('front')),
    box('outline', 'contorni'),
    box('shadow', 'ombra'),
    box('light', 'luce'),
    box('crop', 'ritaglia'),
  );
}

function critiqueCard(c: Critique): HTMLElement {
  return el(
    'div',
    { class: 'card' },
    el('div', { class: `verdict ${c.verdetto === 'approvato' ? 'ok' : 'no'}` }, el('b', {}, `${c.voto}/10 · ${c.verdetto}`), el('span', { class: 'dim' }, ` · ${c.riconoscibile ? 'riconoscibile' : 'non riconoscibile'} · l'Artista`)),
    el('div', { class: 'row' }, el('div', { class: 'grow' }, el('h3', {}, 'problemi'), el('ul', { class: 'issues' }, ...c.problemi.map((s) => el('li', {}, s)))), el('div', { class: 'grow' }, el('h3', {}, 'consigli'), el('ul', { class: 'issues' }, ...c.consigli.map((s) => el('li', {}, s))))),
  );
}

function programCard(t: Target, v: Version, r?: RunResult): HTMLElement {
  const code = el('textarea', { class: 'code', value: JSON.stringify(v.program, null, 2), spellcheck: false });
  const attempts = raws.get(`${t.id}#${v.n}`);
  return el(
    'div',
    { class: 'card' },
    el('h3', {}, 'programma (modificabile: «Esegui» crea una versione a mano)'),
    code,
    el(
      'div',
      { class: 'controls' },
      el(
        'button',
        {
          onclick: () =>
            act(async () => {
              let program: Program3;
              try {
                program = JSON.parse(code.value);
              } catch (e) {
                return log(`JSON non valido: ${(e as Error).message}`, 'err');
              }
              await addVersion(t, { how: 'a mano', program, notes: [], attempts: 0, model: '—' });
            }),
        },
        'Esegui',
      ),
      r ? el('button', { onclick: () => download(`${slug(t.name)}-v${v.n}.png`, dataUrl(contactSheet(r, v.program, 4))) }, 'Scarica le viste') : null,
      el('button', { onclick: () => download(`${slug(t.name)}-v${v.n}.json`, `data:application/json,${encodeURIComponent(JSON.stringify(v.program, null, 2))}`) }, 'Scarica il programma'),
    ),
    attempts
      ? el(
          'details',
          {},
          el('summary', { class: 'dim' }, `risposte dello Scultore (${attempts.length})`),
          ...attempts.map((x, i) => el('div', {}, el('div', { class: x.error ? 'busy' : 'dim' }, `tentativo ${i + 1}${x.error ? `: ${x.error}` : ': valido'}`), el('pre', {}, x.raw))),
        )
      : null,
  );
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function download(name: string, href: string) {
  el('a', { href, download: name }).click();
}

// ------------------------------------------------------------------ actions

async function act(fn: () => Promise<unknown>) {
  busy++;
  void renderMain();
  try {
    await fn();
  } catch (e) {
    log((e as Error).message, 'err');
  } finally {
    busy--;
    renderList();
    void renderMain();
  }
}

async function addVersion(t: Target, part: Pick<Version, 'how' | 'program' | 'notes' | 'attempts' | 'model'>, critique?: Critique): Promise<Version> {
  const opts = options();
  const vs = versions(t);
  const v: Version = { ...part, n: (vs.at(-1)?.n ?? 0) + 1, time: Date.now(), options: { examples: opts.examples, shapes: opts.shapes }, seed: opts.seed, errors: [], warnings: [], ...(critique ? { critique } : {}) };
  try {
    const r = await resultOf(t, v);
    const a = analyse(r, v.program.palette);
    v.errors = a.errors;
    v.warnings = a.warnings;
  } catch (e) {
    v.errors = [(e as Error).message];
  }
  vs.push(v);
  persist();
  if (current?.id === t.id) shown = vs.length - 1;
  return v;
}

async function doSculpt(t: Target, from?: Version) {
  const opts = options();
  let previous;
  if (from) {
    const r = await resultOf(t, from);
    previous = { program: from.program, critique: from.critique, views: dataUrl(contactSheet(r, from.program)) };
  }
  log(`Scultore → ${t.name}${from ? ` (revisione di v${from.n})` : ''}…`);
  const s = await sculpt(models, t, opts, exec, previous);
  if (!s.program) {
    log(`${t.name}: nessun programma comprensibile dopo ${s.attempts.length} tentativi — ${s.attempts.at(-1)?.error ?? ''}`, 'err');
    return;
  }
  const v = await addVersion(t, { how: from ? 'revisione' : 'scultore', program: s.program, notes: s.attempts.flatMap((x) => x.notes), attempts: s.attempts.length, model: models.name });
  raws.set(`${t.id}#${v.n}`, s.attempts);
  log(`${t.name} v${v.n}: ${v.errors.length ? v.errors.join('; ') : 'valido'} (${s.attempts.length} tentativi)`, v.errors.length ? 'err' : 'ok');
  if (!v.errors.length && ui.review) await doReview(t, v);
}

async function doReview(t: Target, v: Version) {
  const r = await resultOf(t, v);
  const c = await review(models, t, dataUrl(contactSheet(r, v.program)), await sprite(t.sprite), style);
  v.critique = c;
  persist();
  log(`Artista su ${t.name} v${v.n}: ${c.voto}/10, ${c.verdetto}`, c.verdetto === 'approvato' ? 'ok' : '');
}

async function batch() {
  const ts = allTargets().filter((t) => t.category === step);
  if (!ts.length) return log('niente da scolpire in questa scheda (le strutture a blocchi si fanno una alla volta)');
  const todo = ts.filter((t) => !store[t.id]?.length);
  const list = todo.length ? todo : ts;
  if (!confirm(`Scolpire ${list.length} bersagli della scheda (${todo.length ? 'quelli senza versioni' : 'tutti'})? Circa ${list.length * 2}-${list.length * 4} chiamate di testo con ${models.name}.`)) return;
  busy++;
  renderList();
  let i = 0;
  const worker = async () => {
    while (i < list.length) {
      const t = list[i++];
      try {
        await doSculpt(t);
      } catch (e) {
        log(`${t.name}: ${(e as Error).message}`, 'err');
      }
      renderList();
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  busy--;
  renderList();
  void renderMain();
}

function exportAll() {
  const out = allTargets()
    .filter((t) => store[t.id]?.length)
    .map((t) => ({ target: t, versions: store[t.id] }));
  download(`laboratorio-voxel-${universe}.json`, `data:application/json,${encodeURIComponent(JSON.stringify({ universe, exported: new Date().toISOString(), results: out }, null, 2))}`);
}

// ------------------------------------------------------------------ structures (blocks + layout)

interface StructVersion {
  n: number;
  time: number;
  model: string;
  how: 'scultori' | 'a mano';
  set: Blockset;
  layout?: Layout;
  blockErrors: string[];
  blockWarnings: string[];
  critique?: Critique;
}

const structStore: Record<string, StructVersion[]> = load('rune.lab.struct', {});
const persistStruct = () => save('rune.lab.struct', structStore);
const handStructures: StructureTarget[] = [
  { id: 'claude:castello', name: 'Castello con fossato', description: STRUCTURE_PRESETS[0].description, source: 'scritto da Claude Code' },
  { id: 'claude:sotterraneo', name: 'Sotterraneo (wfc)', description: STRUCTURE_PRESETS[1].description, source: 'scritto da Claude Code' },
  { id: 'claude:castello-grande', name: 'Castello grande (100 × 100)', description: 'Lo stesso castello su 100 × 100 caselle: due cinte, mastii nei cortili; mura e torri le sceglie il wfc', source: 'scritto da Claude Code' },
  { id: 'claude:rocca', name: 'Rocca (stile MarkovJunior)', description: 'Un borgo fortificato: il cortile cresce da un seme, mura e fossato ne sono il contorno, torri a ogni angolo, portone dove il muro corre dritto, strade, mastio, case, orti, alberi, pozzo; poi il dettaglio sulla struttura intera (edera, muschio, porte, stendardi)', source: 'scritto da Claude Code' },
  { id: 'claude:rocca-30', name: 'Rocca 30 × 30', description: 'La stessa rocca su 30 × 30 caselle', source: 'scritto da Claude Code' },
  { id: 'claude:cripta', name: 'Cripta (stile DungeonGrowth)', description: 'Stanze tagliate nella roccia su due livelli, collegate da corridoi tracciati finché tutte sono raggiunte, porte, pilastri, scrigni, una scala; poi il dettaglio (roccia ruvida, torce, macerie, pozze col muschio)', source: 'scritto da Claude Code' },
];
for (const [id, set, layout] of [
  ['claude:castello', CASTELLO, CASTELLO_PIANTA],
  ['claude:sotterraneo', SOTTERRANEO, SOTTERRANEO_PIANTA],
  ['claude:castello-grande', CASTELLO, castle([100, 100, 3])],
  ['claude:rocca', ROCCA, ROCCA_PIANTA],
  ['claude:rocca-30', ROCCA, rocca([30, 30, 3])],
  ['claude:cripta', CRIPTA, CRIPTA_PIANTA],
] as const) {
  const vs = (structStore[id] ??= []);
  if (!vs.some((v) => v.model === 'Claude Code' && JSON.stringify(v.set) === JSON.stringify(set) && JSON.stringify(v.layout) === JSON.stringify(layout)))
    vs.push({ n: (vs.at(-1)?.n ?? 0) + 1, time: Date.now(), model: 'Claude Code', how: 'a mano', set, layout, blockErrors: [], blockWarnings: [] });
}
let currentStruct: StructureTarget | null = null;
let shownStruct = -1;
let structSeed = 1;
let cut = 0;
const reports = new Map<StructVersion, BlockReport>();
const layouts = new Map<StructVersion, LayoutResult>();
/** Placements after the actions done on the tile map (per version). */
const acted = new Map<StructVersion, Placement[]>();

function renderStructList(list: HTMLElement, f: string) {
  for (const [label, ts] of [
    ['prove', STRUCTURE_PRESETS],
    ['prove nuove (8E)', STRUCTURE_TRIALS],
    ['scritti da Claude Code', handStructures],
  ] as const) {
    const items = ts.filter((t) => !f || t.name.toLowerCase().includes(f));
    if (!items.length) continue;
    list.append(el('div', { class: 'dim' }, label));
    for (const t of items) {
      const v = structStore[t.id]?.at(-1);
      const dot = !v ? '' : v.blockErrors.length ? 'bad' : v.critique?.verdetto === 'approvato' ? 'ok' : 'mid';
      list.append(
        el(
          'div',
          { class: `target ${currentStruct?.id === t.id ? 'on' : ''}`, onclick: () => ((currentStruct = t), (shownStruct = (structStore[t.id]?.length ?? 0) - 1), renderList(), renderMain()) },
          el('div', { class: 'ph' }),
          el('div', { class: 'name' }, t.name, el('div', { class: 'src' }, `${t.source ?? ''}${structStore[t.id]?.length ? ` · ${structStore[t.id].length} versioni` : ''}`)),
          el('span', { class: `dot ${dot}` }),
        ),
      );
    }
  }
}

let structView = 0;
const catalogues = new Map<StructVersion, Catalogue>();
function catalogueOf(v: StructVersion): Catalogue {
  let c = catalogues.get(v);
  if (!c) catalogues.set(v, (c = catalogue(v.set, reportOf(v).built)));
  return c;
}

function reportOf(v: StructVersion): BlockReport {
  let r = reports.get(v);
  if (!r) reports.set(v, (r = buildBlocks(v.set, 1)));
  return r;
}

function layoutOf(v: StructVersion): LayoutResult | undefined {
  if (!v.layout) return undefined;
  let r = layouts.get(v);
  if (!r) {
    r = runLayout(v.layout, v.set, structSeed, reportOf(v).built);
    layouts.set(v, r);
    acted.set(v, r.placements);
  }
  return r;
}

async function renderStructMain() {
  const main = $('#main');
  const t = currentStruct;
  if (!t) {
    main.replaceChildren(el('p', { class: 'dim' }, 'Scegli una struttura a sinistra: lo Scultore dei blocchi fa le caselle, l\'Architetto le compone.'));
    return;
  }
  const vs = (structStore[t.id] ??= []);
  const v = vs[shownStruct];
  const can = !busy;
  const desc = el('textarea', { rows: 3, value: t.description });
  desc.style.width = '100%';
  desc.addEventListener('change', () => (t.description = desc.value));
  main.replaceChildren(
    el(
      'div',
      { class: 'card' },
      el('h2', {}, t.name),
      el('h3', {}, `${t.source ?? ''} · blocchi da ${TILE}×${TILE}×${TILE} voxel (una casella, un livello)`),
      desc,
      el(
        'div',
        { class: 'controls' },
        el('button', { class: 'primary', disabled: !can, onclick: () => act(() => doBlocks(t)) }, 'Scolpisci i blocchi'),
        el('button', { disabled: !can || !v?.set.blocks.length, onclick: () => act(() => doCompose(t, v)) }, v?.layout ? 'Rifai la pianta' : 'Componi'),
        el('button', { disabled: !can || !v?.layout, onclick: () => act(() => doStructReview(t, v)) }, "Chiedi all'Artista"),
        num('s-seed', 'seme ', structSeed, 1, 9999, (n) => {
          structSeed = n;
          layouts.clear();
          void renderMain();
        }),
        busy ? el('span', { class: 'busy' }, 'al lavoro…') : null,
      ),
    ),
  );
  if (!v) return;
  const card = el(
    'div',
    { class: 'card' },
    el('div', { class: 'versions' }, ...vs.map((x, i) => el('button', { class: i === shownStruct ? 'on' : '', onclick: () => ((shownStruct = i), renderMain()) }, `v${x.n}${x.critique ? ` · ${x.critique.voto}` : ''}${x.blockErrors.length ? ' ✗' : ''}`))),
    el('h3', {}, `${v.how} · ${v.model} · ${v.set.blocks.length} blocchi`),
  );
  main.append(card);
  const rep = reportOf(v);
  const cat = catalogueOf(v);
  card.append(
    el('div', { class: 'dim' }, `${cat.K - 1} varianti (blocco × rotazione, senza doppioni); prese che possono guardare fuori: vuoto${[...cat.open].filter((o) => o !== 'vuoto' && o !== '*').map((o) => `, ${o}`).join('')}`),
    ...(v.set.faces ? [el('div', { class: 'dim' }, `facce: ${Object.entries(v.set.faces).map(([k, d]) => `«${k}» ${d}`).join(' · ')}`)] : []),
  );
  card.append(el('ul', { class: 'issues' }, ...rep.errors.map((s) => el('li', { class: 'err' }, s)), ...rep.warnings.map((s) => el('li', { class: 'warn' }, s))));
  // The blocks, each from the front, with what the game knows of them.
  const gallery = el('div', { class: 'stage blocks' });
  for (const b of rep.built.values()) {
    const s = b.block.sockets;
    gallery.append(
      el(
        'figure',
        { title: `prese: n ${s.n}, e ${s.e}, s ${s.s}, w ${s.w}${s.u ? `, sopra ${s.u}` : ''}${s.d ? `, sotto ${s.d}` : ''}` },
        canvasOf(render(b.grid, b.block.program.palette, 0, ropts), Math.max(1, ropts.zoom - 2)),
        el('figcaption', {}, `${b.block.code} · ${b.block.name}`, el('br'), `${b.block.walk ? 'calpestabile' : 'non calpestabile'} · n ${s.n} · e ${s.e} · s ${s.s} · w ${s.w}`, ...(b.block.actions ?? []).map((a) => el('div', {}, `«${a.label}» → ${a.to}`))),
      ),
    );
  }
  card.append(el('h3', {}, 'blocchi'), gallery);

  const lr = layoutOf(v);
  if (!lr || !v.layout) {
    card.append(el('p', { class: 'dim' }, 'Nessuna pianta: «Componi» chiede all\'Architetto di disporre i blocchi.'));
    return;
  }
  const placements = acted.get(v) ?? lr.placements;
  const size = v.layout.size;
  const sc = el('div', { class: 'card' });
  main.append(sc);
  sc.append(
    el('h3', {}, `pianta ${size.join('×')} blocchi · ${lr.placements.length} posati · ${size[0] * TILE}×${size[1] * TILE}×${size[2] * TILE} voxel`),
    el('div', { class: 'dim' }, `zone: ${Object.entries(v.layout.zones ?? {}).map(([k, z]) => `${k} ${z.name ?? ''} (${z.blocks ?? ''}${z.codes ? ` esatti ${z.codes}` : ''})`).join(' · ') || '—'}${lr.wfc ? ` · wfc su ${lr.wfc.zoneCells} celle tra ${lr.wfc.variants - 1} varianti in ${lr.wfc.ms} ms, ${lr.wfc.repairs} riparazioni${lr.wfc.ok ? '' : ', NON riuscito'}` : ''}`),
    el(
      'ul',
      { class: 'issues' },
      ...lr.mismatches.slice(0, 20).map((s) => el('li', { class: 'err' }, s)),
      ...lr.seams.slice(0, 10).map((s) => el('li', { class: 'warn' }, s)),
      el('li', { class: 'note' }, `${lr.open} lati non vuoti verso il bordo`),
    ),
  );
  const levels = el('div', { class: 'controls' }, el('span', { class: 'dim' }, 'livelli: '));
  for (let k = 0; k <= size[2]; k++) levels.append(el('button', { class: cut === k ? 'on' : '', onclick: () => ((cut = k), renderMain()) }, k === 0 ? 'tutto' : `fino al ${k}`));
  for (let i = 0; i < 4; i++) levels.append(el('button', { class: structView === i ? 'on' : '', onclick: () => ((structView = i), renderMain()) }, VIEWS[i]));
  const stage = el('div', { class: 'stage' }, el('span', { class: 'busy' }, 'fotografo la struttura…'));
  sc.append(levels, stage);
  // The tile map the game would get, one canvas per level: click a tile with actions to do one.
  const map = el('div', { class: 'tilemap' });
  const cell = Math.max(3, Math.min(14, Math.floor(420 / Math.max(size[0], size[1]))));
  const byCell = new Map<number, Placement>();
  for (const p of placements) byCell.set(p.x + p.y * size[0] + p.z * size[0] * size[1], p);
  for (let z = 0; z < size[2]; z++) {
    const c = el('canvas', { width: size[0] * cell, height: size[1] * cell, title: `livello ${z + 1}` });
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#0e1318';
    ctx.fillRect(0, 0, c.width, c.height);
    for (let y = 0; y < size[1]; y++)
      for (let x = 0; x < size[0]; x++) {
        const p = byCell.get(x + y * size[0] + z * size[0] * size[1]);
        if (!p) continue;
        ctx.fillStyle = p.block.walk ? '#2f6b3f' : '#4a5361';
        ctx.fillRect(x * cell, y * cell, cell - (cell > 4 ? 1 : 0), cell - (cell > 4 ? 1 : 0));
        if (p.block.actions?.length) {
          ctx.strokeStyle = '#ffcc66';
          ctx.strokeRect(x * cell + 0.5, y * cell + 0.5, cell - 1, cell - 1);
        }
      }
    c.addEventListener('click', (e) => {
      const r = c.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * size[0]), y = Math.floor(((e.clientY - r.top) / r.height) * size[1]);
      const now = acted.get(v) ?? placements;
      const p = now.find((q) => q.x === x && q.y === y && q.z === z);
      const a = p?.block.actions?.[0];
      if (!p) return;
      if (!a) return log(`(${x},${y},${z}) ${p.block.name}, rot ${p.rot}${p.block.walk ? ', calpestabile' : ''}`);
      acted.set(v, actOn(v.set, now, p, a));
      log(`${p.block.name}: ${a.label}`);
      void renderMain();
    });
    map.append(el('figure', {}, c, el('figcaption', { class: 'dim' }, `livello ${z + 1}`)));
  }
  sc.append(el('h3', {}, 'mappa del gioco (verde: calpestabile; bordo giallo: con azioni, clic per farle)'), map);
  sc.append(el('details', {}, el('summary', { class: 'dim' }, 'blocchi e pianta (JSON)'), el('pre', {}, JSON.stringify({ blocks: v.set, layout: v.layout }, null, 2))));
  if (v.critique) main.append(critiqueCard(v.critique));
  try {
    const t0 = performance.now();
    const lr = layoutOf(v);
    const [pic] = await photograph(v.set, placements, size, structSeed, [structView], cut || undefined, v.layout && lr ? { layout: v.layout, cells: lr.cells } : undefined);
    log(`foto ${VIEWS[structView]}: ${pic.w}×${pic.h} px in ${Math.round(performance.now() - t0)} ms`);
    if (currentStruct !== t) return;
    // Large structures are shown smaller than a pixel per pixel; small ones enlarged.
    const z = Math.min(ropts.zoom, 1300 / pic.w);
    stage.replaceChildren(el('figure', {}, canvasOf(pic, z >= 1 ? Math.floor(z) : z), el('figcaption', {}, `${VIEWS[structView]} · ${pic.w}×${pic.h} px`)));
  } catch (e) {
    stage.replaceChildren(el('span', { class: 'err' }, (e as Error).message));
  }
}

async function doBlocks(t: StructureTarget) {
  // The whole chain (ADR-0035): the architect plans, the kernel commissions, the block sculptor makes to
  // order, the kernel composes; missing blocks are ordered late, and only then the architect mends its plan.
  log(`Architetto e Scultore dei blocchi → ${t.name}…`);
  const r = await buildStructure(models, t, { ...DEFAULT_STRUCT, style, seed: structSeed }, (s) => log(`${t.name}: ${s}`));
  if (!r.set) return log(`${t.name}: nessun blocco comprensibile`, 'err');
  const vs = (structStore[t.id] ??= []);
  const v: StructVersion = { n: (vs.at(-1)?.n ?? 0) + 1, time: Date.now(), model: models.name, how: 'scultori', set: r.set, ...(r.layout ? { layout: r.layout } : {}), blockErrors: r.report?.errors ?? [], blockWarnings: r.report?.warnings ?? [] };
  if (r.report) reports.set(v, r.report);
  vs.push(v);
  shownStruct = vs.length - 1;
  persistStruct();
  const bad = !r.result || r.result.mismatches.length > 0;
  log(`${t.name} v${v.n}: ${r.set.blocks.length} blocchi, ${r.calls} chiamate${r.orders.length ? `, ${r.orders.length} ordini aggiuntivi` : ''}${r.repair ? ', pianta ritoccata' : ''}`, bad ? 'err' : 'ok');
  void renderMain();
  if (!bad && ui.review) await doStructReview(t, v);
}

async function doCompose(t: StructureTarget, v: StructVersion, planned?: Layout) {
  log(`Architetto → ${t.name}…`);
  const c = await compose(models, t, v.set, reportOf(v), { ...DEFAULT_STRUCT, style, seed: structSeed }, undefined, planned);
  if (!c.layout) return log(`${t.name}: nessuna pianta comprensibile — ${c.attempts.at(-1)?.error ?? ''}`, 'err');
  // A new layout for blocks that had one already is a new version (the old one stays to compare).
  const target = v.layout ? { ...v, n: (structStore[t.id].at(-1)?.n ?? 0) + 1, time: Date.now(), critique: undefined } : v;
  target.layout = c.layout;
  target.model = models.name;
  if (target !== v) structStore[t.id].push(target);
  layouts.delete(target);
  shownStruct = structStore[t.id].indexOf(target);
  persistStruct();
  const err = c.attempts.at(-1)?.error;
  log(`${t.name}: pianta ${c.layout.size.join('×')} in ${c.attempts.length} tentativi${err ? ` — ${err.slice(0, 200)}` : ''}`, err ? 'err' : 'ok');
  if (!err && ui.review) await doStructReview(t, target);
}

async function doStructReview(t: StructureTarget, v: StructVersion) {
  const lr = layoutOf(v);
  if (!lr || !v.layout) return;
  const [front] = await photograph(v.set, acted.get(v) ?? lr.placements, v.layout.size, structSeed, [0], undefined, { layout: v.layout, cells: lr.cells });
  // The whole, shrunk, and two details at twice the size: on the whole alone the detail is lost.
  const grass: [number, number, number] = [112, 150, 84];
  const whole = dataUrl(sheet([shrink(front, 1200)], 1, 4, grass));
  const details = [region(front, front.w * 0.35, front.h * 0.7, 360, 240), region(front, front.w * 0.45, front.h * 0.4, 360, 240)].map((p) => dataUrl(sheet([p], 2, 0, grass)));
  const c = await review(models, { id: t.id, name: t.name, category: 'struttura', kind: 'struttura', description: `${t.description}. La prima immagine è la struttura intera vista da sud, le altre due sono dettagli ingranditi.` }, whole, undefined, style, details);
  v.critique = c;
  persistStruct();
  log(`Artista su ${t.name} v${v.n}: ${c.voto}/10, ${c.verdetto}`, c.verdetto === 'approvato' ? 'ok' : '');
}

// ------------------------------------------------------------------ boot

async function loadUniverse(name: string) {
  universe = name;
  sprites.clear();
  try {
    const r = await fetch(`/api/universe/${encodeURIComponent(name)}`);
    const j = await r.json();
    files = j.files ?? {};
  } catch {
    files = {};
  }
  fromUniverse = universeTargets(files);
  style = styleOf(files);
  log(`universo ${name}: ${fromUniverse.length} asset, guida di stile ${style ? 'trovata' : 'assente'}`);
  renderList();
}

async function boot() {
  const online = !params.has('offline') && (await GeminiModels.available());
  const modelIn = $<HTMLInputElement>('#model');
  modelIn.value = load('rune.lab.model.v2', params.get('model') ?? 'gemini-3.5-flash');
  models = new LabModels(online, modelIn.value);
  modelIn.addEventListener('change', () => {
    models.model = modelIn.value.trim();
    save('rune.lab.model.v2', models.model);
    log(`modello di testo: ${models.model}`);
  });
  const mode = $('#mode');
  mode.textContent = online ? 'Gemini' : 'offline';
  mode.classList.toggle('on', online);
  modelIn.disabled = !online;
  showUsage();

  const sel = $<HTMLSelectElement>('#universe');
  const list: string[] = await fetch('/api/universe')
    .then((r) => r.json())
    .then((j) => j.universes ?? [])
    .catch(() => []);
  for (const u of list.length ? list : [universe]) sel.append(el('option', { value: u, selected: u === universe }, u));
  sel.addEventListener('change', () => void loadUniverse(sel.value));
  $('#filter').addEventListener('input', renderList);
  $('#batch').addEventListener('click', () => void batch());
  $('#export').addEventListener('click', exportAll);
  $('#c-add').addEventListener('click', () => {
    const name = $<HTMLInputElement>('#c-name').value.trim();
    if (!name) return;
    const t: Target = { id: `custom:${Date.now()}`, name, category: step === 'blocchi' ? 'struttura' : step, description: $<HTMLTextAreaElement>('#c-desc').value.trim() || undefined, source: 'tuo' };
    custom.push(t);
    save('rune.lab.custom', custom);
    select(t);
  });
  await loadUniverse(universe);
  log(online ? `Gemini disponibile (${models.model})` : 'modelli offline: lo Scultore risponde con gli esempi scritti a mano', online ? 'ok' : '');
}

void boot();
