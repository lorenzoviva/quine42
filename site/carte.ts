// The gallery of the cards (T104, ADR-0095, ADR-0056, ADR-0084): a wanderer's collection in a universe, each card in CSS 3D
// with its foil, its uses, its fingerprint and the chain of the holders it had before. It only reads: the cards the server
// measured and what shows them, from /api/universe/<nome>/carte (T120: the code they are measured on does not leave the server).

import { accountConfig, signIn } from '../src/session/login';
import { accountWanderer } from '../src/session/account';
import { allCards, COMUNE, receivedBy, type Card, type CardKind, type Uses } from '../src/kernel/cards';
import { changeOf } from '../src/kernel/heritage';
import { Forms, InlineRunner, type FormRequest } from '../src/kernel/forms';
import { slug } from '../src/kernel/graph';
import { el } from '../src/ui/dom';
import type { FileMap, Manifest } from '../src/kernel/types';

// --- What a card shows (pure) ---------------------------------------------------------------------------------------

export type Rarity = 'comune' | 'rara' | 'epica' | 'leggendaria';

export const RARITIES: Array<{ id: Rarity; da: number; nome: string; badge: string }> = [
  { id: 'leggendaria', da: 100, nome: 'LEGGENDARIA', badge: 'pink' },
  { id: 'epica', da: 25, nome: 'EPICA', badge: 'yellow' },
  { id: 'rara', da: 5, nome: 'RARA', badge: 'cyan' },
  { id: 'comune', da: 0, nome: 'COMUNE', badge: 'dark' },
];

export const totalUses = (u: Uses) => u.luoghi + u.trame + u.prompt;

/** Cards carry no rarity: it is how much the world uses them, so a card grows as it is played. */
export function rarityOf(u: Uses): Rarity {
  const n = totalUses(u);
  return RARITIES.find((r) => n >= r.da)!.id;
}

export const CATEGORIES = [
  { id: 'tutte', nome: 'TUTTE' },
  { id: 'oggetti', nome: 'OGGETTI' },
  { id: 'luoghi', nome: 'LUOGHI' },
  { id: 'creature', nome: 'CREATURE & COSE' },
  { id: 'magie', nome: 'MAGIE & RUNE' },
  { id: 'storie', nome: 'STORIE & REGOLE' },
  { id: 'eredita', nome: 'EREDITÀ' },
] as const;
export type Category = (typeof CATEGORIES)[number]['id'];

const CATEGORY: Record<CardKind, Category> = {
  item: 'oggetti',
  recipe: 'oggetti',
  chunk: 'luoghi',
  environment: 'luoghi',
  model: 'creature',
  module: 'creature',
  individual: 'creature',
  spell: 'magie',
  rune: 'magie',
  plot: 'storie',
  rule: 'storie',
};

const KIND_NAME: Record<CardKind, string> = {
  item: 'Oggetto',
  recipe: 'Ricetta',
  chunk: 'Luogo',
  environment: 'Ambiente',
  model: 'Figura',
  module: 'Cosa del mondo',
  individual: 'Abitante',
  spell: 'Incantesimo',
  rune: 'Runa',
  plot: 'Storia',
  rule: 'Regola del mondo',
};

/** The gem of the cards with no model: two colours of the theme for each family. */
const GEM: Record<Category, [string, string]> = {
  tutte: ['--skin-accent-2', '--skin-accent'],
  oggetti: ['--skin-accent-2', '--skin-accent'],
  luoghi: ['--skin-primary', '--skin-success'],
  creature: ['--skin-accent', '--skin-accent-2'],
  magie: ['--skin-accent-2', '--skin-rare'],
  storie: ['--skin-rare', '--skin-accent'],
  eredita: ['--skin-success', '--skin-primary'],
};

/** How a fingerprint is written: its first number, which two similar contents often share. */
export function mhCode(impronta: number[] | undefined): string {
  return impronta?.length ? `mh:${(impronta[0] >>> 0).toString(16).padStart(8, '0')}` : 'mh:--------';
}

/** A link of the chain: who held the card, where, what the content was then, how much of every use they get. */
export interface ChainLink {
  titolare: string;
  universo: string;
  mh: string;
  /** Share of every use, 0-1; undefined on a later link of someone who is in the chain twice (their share is one). */
  quota?: number;
  /** How much the content changed from this link to the next one, 0-1 (none for the last). */
  cambio?: number;
}

/** The chain of a card, the first holder first and the holder of now last. */
export function chainOf(card: Card, universo: string): ChainLink[] {
  const past = card.origini ?? [];
  const seen = new Set<string>();
  const quota = (who: string) => {
    if (seen.has(who)) return undefined;
    seen.add(who);
    return card.quote?.[who] ?? (past.length ? 0 : 1);
  };
  const links: ChainLink[] = past.map((o, i) => ({
    titolare: o.titolare,
    universo: o.universo,
    mh: mhCode(o.impronta),
    quota: quota(o.titolare),
    cambio: changeOf(o.impronta, past[i + 1]?.impronta ?? card.impronta ?? o.impronta),
  }));
  links.push({ titolare: card.titolare, universo, mh: mhCode(card.impronta), quota: quota(card.titolare) });
  return links;
}

const parse = (src: string | undefined): any => {
  try {
    return JSON.parse(src ?? 'null');
  } catch {
    return null;
  }
};

/** What holds the card in its file: an item, a spell, an individual… (the module itself when it has nothing of its own). */
function entryOf(card: Card, files: FileMap): any {
  const key = card.id.slice(card.id.indexOf(':') + 1);
  const data = parse(files[card.file]);
  if (!data) return undefined;
  const byKey = (o: Record<string, any> | undefined, name: (k: string, v: any) => string) => Object.entries(o ?? {}).find(([k, v]) => slug(name(k, v)) === key)?.[1];
  switch (card.tipo) {
    case 'item':
      return (data.items as any[] | undefined)?.find((it) => slug(it?.id ?? '') === key) ?? data.item ?? data;
    case 'environment':
      return byKey(data.layouts, (k) => k) ?? data;
    case 'spell':
      return byKey(data.spells, (k, v) => v?.name ?? k) ?? data;
    case 'rune':
      return byKey(data.runes, (k) => k) ?? data;
    case 'recipe':
      return (data.recipes as any[] | undefined)?.find((r) => slug(r?.id ?? '') === key) ?? data;
    case 'model':
      return byKey(data, (k) => k);
    case 'individual':
      return (data.persone as any[] | undefined)?.find((p) => slug(p?.nome ?? '') === key);
    case 'plot':
      return (data.trame as any[] | undefined)?.find((t) => slug(t?.id ?? '') === key);
    case 'rule':
      return undefined;
    case 'chunk':
      return undefined;
    default:
      return data;
  }
}

/** What the content says of itself among what `publicFiles` gives (T168): the rest stays on the server, and the card says what it is. */
const SAYS = ['description', 'mestiere'];
const MAX_TEXT = 120;

/** A line for the front of the card, from what the content says of itself. */
export function describeCard(card: Card, files: FileMap): string {
  const entry = entryOf(card, files);
  const text = SAYS.map((k) => entry?.[k]).find((v) => typeof v === 'string' && v.trim()) as string | undefined;
  const line = (text ?? `${KIND_NAME[card.tipo]} di questo universo.`).trim().replace(/\s+/g, ' ');
  return line.length > MAX_TEXT ? `${line.slice(0, MAX_TEXT - 1).trimEnd()}…` : line;
}

/** The program and the seed of a card's picture, or undefined for what has no body (a plot, a rule, a place). */
export function artOf(card: Card, files: FileMap, forms: Forms): FormRequest | undefined {
  const entry = entryOf(card, files);
  const modulePic = (m: Manifest | undefined, who: string) => {
    if (!m?.appearance || m.kind === 'system' || m.kind === 'generator' || m.kind === 'data') return undefined;
    const model = forms.resolve(m.appearance.model, m.appearance.classe);
    return forms.request(model, forms.seedFor(model, who), m.appearance.color);
  };
  switch (card.tipo) {
    case 'model':
      return forms.request(Object.keys(forms.models()).find((id) => slug(id) === card.id.slice('model:'.length)) ?? '', 1);
    case 'item': {
      const model = forms.resolve(entry?.model ?? entry?.appearance?.model, 'oggetto');
      return forms.request(model, 1, entry?.color ?? entry?.appearance?.color);
    }
    case 'module':
      return modulePic(parse(files[card.file]), card.id);
    case 'individual':
      return modulePic(parse(files[`modules/${entry?.tipo}/manifest.json`]), entry?.origine ?? entry?.nome ?? card.id);
    default:
      return undefined;
  }
}

export interface CardView {
  card: Card;
  rarita: Rarity;
  categoria: Category;
  descrizione: string;
  catena: ChainLink[];
  art?: FormRequest;
  /** For the cards someone else holds now: the share of every use this wanderer gets, and how much it came to. */
  quota?: number;
  ricevuto?: number;
}

export interface Collection {
  mine: CardView[];
  received: CardView[];
  stats: { totale: number; rare: number; leggendarie: number; rendita: number };
}

/** A wanderer's collection in a universe: the cards they hold and those that pay them back as an earlier holder. */
export function collectionView(files: FileMap, wanderer: string, universo: string, cards: Card[] = allCards(files, true)): Collection {
  const forms = new Forms(new InlineRunner());
  forms.load(files);
  const view = (card: Card): CardView => ({
    card,
    rarita: rarityOf(card.utilizzi),
    categoria: CATEGORY[card.tipo],
    descrizione: describeCard(card, files),
    catena: chainOf(card, universo),
    art: artOf(card, files, forms),
  });
  const used = (c: Card) => totalUses(c.utilizzi);
  const mine = cards
    .filter((c) => c.titolare === wanderer)
    .sort((a, b) => used(b) - used(a) || a.id.localeCompare(b.id))
    .map(view);
  const paid = receivedBy(files, wanderer, cards);
  const received = paid.map((r) => ({ ...view(r.card), quota: r.quota, ricevuto: r.ricevuto }));
  return {
    mine,
    received,
    stats: {
      totale: mine.length,
      rare: mine.filter((v) => v.rarita === 'rara' || v.rarita === 'epica').length,
      leggendarie: mine.filter((v) => v.rarita === 'leggendaria').length,
      rendita: paid.reduce((s, r) => s + r.ricevuto, 0),
    },
  };
}

export function inCategory(c: Collection, cat: Category): CardView[] {
  if (cat === 'tutte') return c.mine;
  if (cat === 'eredita') return c.received;
  return c.mine.filter((v) => v.categoria === cat);
}

/** Whose collection: the id in the address (it only reads what is public anyway), then the account, then the one who plays alone. */
export function wandererFrom(search: string, uid?: string): string {
  const asked = new URLSearchParams(search).get('viandante')?.trim();
  return asked || (uid ? accountWanderer(uid) : 'io');
}

const percent = (q: number) => `${Math.round(q * 100)}%`;
const who = (id: string, me: string) => (id === me ? 'TU' : id === COMUNE ? 'IL MONDO' : id);

// --- The page -------------------------------------------------------------------------------------------------------

/** How many cards go on the page at a time: the foil of hundreds of them would not hold 60 frames a second. */
export const PAGE = 24;

function faceHead(v: CardView): HTMLElement {
  const r = RARITIES.find((x) => x.id === v.rarita)!;
  return el('div', { class: 'card-header' }, el('h4', { class: 'card-name', title: v.card.nome }, v.card.nome.toUpperCase()), el('span', { class: `comic-badge ${r.badge}` }, r.nome));
}

function renderCard(v: CardView, me: string, index: number): HTMLElement {
  const [from, to] = GEM[v.categoria];
  const gem = el('div', { class: 'card-art-gem', style: `background: linear-gradient(45deg, var(${from}), var(${to}));` });
  const art = el('div', { class: 'card-art-box' }, gem, el('span', { class: 'card-kind arcade-text' }, KIND_NAME[v.card.tipo].toUpperCase()));
  const u = v.card.utilizzi;
  const stat = (label: string, n: number, cls = '') => el('div', { class: 'card-stat' }, `${label}: `, el('b', cls ? { class: cls } : {}, String(n)));
  const front = el(
    'div',
    { class: 'card-face card-front' },
    el('div', { class: 'card-holo-foil' }),
    el(
      'div',
      { class: 'card-inner' },
      faceHead(v),
      art,
      el('p', { class: 'card-text' }, v.descrizione),
      el('div', { class: 'card-stats-box' }, stat('Luoghi', u.luoghi), stat('Trame', u.trame), stat('Prompt', u.prompt), stat('Totale', totalUses(u), 'text-green')),
    ),
  );

  const links = v.catena.map((l, i) => {
    const now = i === v.catena.length - 1;
    return el(
      'li',
      { class: `card-genealogy-node${now ? ' is-now' : ''}` },
      el('div', { class: 'link-head' }, el('span', { class: `comic-badge ${now ? 'green' : 'dark'}` }, now ? 'ORA' : i === 0 ? 'ORIGINE' : `#${i + 1}`), el('b', {}, who(l.titolare, me)), l.quota === undefined ? '' : el('span', { class: 'text-green link-share' }, percent(l.quota))),
      el('div', { class: 'link-where text-dim' }, l.universo, ' · ', l.mh, l.cambio === undefined ? '' : ` · cambiata ${percent(l.cambio)}`),
    );
  });
  const back = el(
    'div',
    { class: 'card-face card-back' },
    el('div', { class: 'card-holo-foil' }),
    el(
      'div',
      { class: 'card-inner' },
      el(
        'div',
        { class: 'card-back-frame' },
        el('div', { class: 'card-back-brand' }, 'QUINE42'),
        el('div', { class: 'arcade-text text-cyan card-back-label' }, 'IMPRONTA MINHASH'),
        el('code', { class: 'mono-text text-yellow card-back-code' }, mhCode(v.card.impronta)),
        el('div', { class: 'arcade-text text-cyan card-back-label' }, 'CATENA DEI TITOLARI'),
        el('ol', { class: 'card-genealogy-box' }, ...links),
        v.quota === undefined ? '' : el('div', { class: 'card-paid text-green' }, `Ti spetta ${percent(v.quota)} di ogni utilizzo: ${formatUses(v.ricevuto ?? 0)} finora`),
      ),
    ),
  );

  const card = el('div', { class: 'retro-card', role: 'button', tabindex: '0', 'aria-pressed': 'false', 'aria-label': `${v.card.nome}: premi per girare la carta`, title: 'Clicca per girare' }, front, back);
  const wrap = el('div', { class: 'card-3d-wrapper', style: `--float-delay: ${-((index * 0.73) % 5).toFixed(2)}s;` }, card);
  wrap.dataset.rarita = v.rarita;
  wrap.dataset.id = v.card.id;
  if (v.art) pictures.watch(wrap, art, gem, v.art);
  return wrap;
}

const formatUses = (n: number) => n.toLocaleString('it-IT', { maximumFractionDigits: 1 });

/** One worker, one program at a time, only for the cards on screen; two cards of one picture run it once. */
class Pictures {
  private worker?: Worker;
  private queue: Array<{ key: string; req: FormRequest }> = [];
  private busy?: string;
  private done = new Map<string, ImageData | null>();
  private waiting = new Map<string, Array<(p: ImageData | null) => void>>();
  private observer?: IntersectionObserver;
  private pending = new WeakMap<Element, () => void>();

  watch(wrap: HTMLElement, box: HTMLElement, gem: HTMLElement, req: FormRequest): void {
    this.observer ??= new IntersectionObserver((seen) => {
      for (const s of seen) {
        if (!s.isIntersecting) continue;
        this.observer!.unobserve(s.target);
        this.pending.get(s.target)?.();
      }
    }, { rootMargin: '300px' });
    this.pending.set(wrap, () =>
      this.ask(req, (img) => {
        if (!img) return;
        const canvas = el('canvas', { class: 'card-art-voxel', 'aria-hidden': 'true' });
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')?.putImageData(img, 0, 0);
        gem.replaceWith(canvas);
        box.classList.add('has-voxels');
      }),
    );
    this.observer.observe(wrap);
  }

  private ask(req: FormRequest, then: (p: ImageData | null) => void): void {
    const key = `${req.model}#${req.seed}#${req.tint?.color ?? ''}`;
    if (this.done.has(key)) return then(this.done.get(key)!);
    const list = this.waiting.get(key);
    if (list) {
      list.push(then);
      return;
    }
    this.waiting.set(key, [then]);
    this.queue.push({ key, req });
    this.next();
  }

  private next(): void {
    if (this.busy || !this.queue.length) return;
    const { key, req } = this.queue.shift()!;
    this.busy = key;
    this.worker ??= this.start();
    this.worker.postMessage({ id: 0, req });
  }

  private start(): Worker {
    const w = new Worker(new URL('./carte-worker.ts', import.meta.url), { type: 'module' });
    const finish = (img: ImageData | null) => {
      const key = this.busy!;
      this.busy = undefined;
      this.done.set(key, img);
      for (const then of this.waiting.get(key) ?? []) then(img);
      this.waiting.delete(key);
      this.next();
    };
    w.onmessage = (ev: MessageEvent<{ w?: number; h?: number; data?: Uint8ClampedArray }>) => {
      const { w: pw, h, data } = ev.data;
      finish(data && pw && h ? new ImageData(data, pw, h) : null);
    };
    w.onerror = () => finish(null);
    return w;
  }
}

const pictures = new Pictures();

/** Flip on click and on Enter or Space; the card leans to the mouse, a frame at a time; what is off screen stops moving. */
function wireGrid(grid: HTMLElement): IntersectionObserver {
  const flip = (card: HTMLElement) => {
    const on = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(on));
  };
  const cardOf = (e: Event) => (e.target as HTMLElement).closest<HTMLElement>('.retro-card');
  grid.addEventListener('click', (e) => {
    const card = cardOf(e);
    if (card) flip(card);
  });
  grid.addEventListener('keydown', (e) => {
    if ((e.key !== 'Enter' && e.key !== ' ') || !(e.target as HTMLElement).classList.contains('retro-card')) return;
    e.preventDefault();
    flip(e.target as HTMLElement);
  });

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let leaning: { card: HTMLElement; x: number; y: number } | undefined;
  let frame = 0;
  const lean = () => {
    frame = 0;
    if (!leaning) return;
    const { card, x, y } = leaning;
    card.style.setProperty('--ry', `${(x * 24).toFixed(2)}deg`);
    card.style.setProperty('--rx', `${(-y * 18).toFixed(2)}deg`);
    card.style.setProperty('--foil-x', `${(x * 28).toFixed(2)}%`);
    card.style.setProperty('--foil-y', `${(y * 28).toFixed(2)}%`);
  };
  const rest = (card: HTMLElement) => {
    card.classList.remove('is-leaning');
    for (const p of ['--rx', '--ry', '--foil-x', '--foil-y']) card.style.removeProperty(p);
  };
  if (!still) {
    grid.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const card = cardOf(e);
      if (leaning && leaning.card !== card) {
        rest(leaning.card);
        leaning = undefined;
      }
      if (!card) return;
      const box = card.parentElement!.getBoundingClientRect();
      card.classList.add('is-leaning');
      leaning = { card, x: (e.clientX - box.left) / box.width - 0.5, y: (e.clientY - box.top) / box.height - 0.5 };
      frame ||= requestAnimationFrame(lean);
    });
    grid.addEventListener('pointerleave', () => {
      if (leaning) rest(leaning.card);
      leaning = undefined;
    });
  }

  return new IntersectionObserver((seen) => {
    for (const s of seen) s.target.classList.toggle('is-away', !s.isIntersecting);
  });
}

function stat(id: string, text: string): void {
  const e = document.getElementById(id);
  if (e) e.textContent = text;
}

const message = (badge: string, title: string, text: string, ...more: Array<Node | string>) =>
  el('div', { class: 'cards-empty' }, el('span', { class: 'comic-badge yellow' }, badge), el('h3', { class: 'comic-title' }, title), el('p', {}, text), ...more);

async function snapshot(name: string): Promise<{ files: FileMap; carte: Card[] } | undefined> {
  try {
    const r = await fetch(`/api/universe/${encodeURIComponent(name)}/carte`);
    const snap = r.ok ? await r.json() : undefined;
    return snap?.exists && snap.files && Array.isArray(snap.carte) ? { files: snap.files as FileMap, carte: snap.carte as Card[] } : undefined;
  } catch {
    return undefined;
  }
}

async function universeNames(): Promise<string[]> {
  try {
    const r = await fetch('/api/universe');
    const data = r.ok ? await r.json() : undefined;
    return Array.isArray(data?.universes) ? data.universes : [];
  } catch {
    return [];
  }
}

async function start(): Promise<void> {
  const grid = document.getElementById('cards-container')!;
  const tabs = document.getElementById('card-filter-tabs')!;
  const select = document.getElementById('card-universe') as HTMLSelectElement;
  const moreBox = document.getElementById('cards-more')!;
  const moreBtn = document.getElementById('btn-cards-more')!;
  const away = wireGrid(grid);

  const config = await accountConfig();
  const signed = config && !new URLSearchParams(location.search).get('viandante') ? await signIn(config).catch(() => undefined) : undefined;
  const me = wandererFrom(location.search, signed?.uid);
  stat('card-owner', me === 'io' ? 'IL TUO VIANDANTE' : `VIANDANTE ${me}`);

  let collection: Collection = { mine: [], received: [], stats: { totale: 0, rare: 0, leggendarie: 0, rendita: 0 } };
  let category: Category = 'tutte';
  let shown = 0;

  const showMore = () => {
    const list = inCategory(collection, category);
    const page = list.slice(shown, shown + PAGE);
    page.forEach((v, i) => {
      const card = renderCard(v, me, shown + i);
      grid.append(card);
      away.observe(card);
    });
    shown += page.length;
    moreBox.hidden = shown >= list.length;
    if (!moreBox.hidden) moreBtn.textContent = `MOSTRA ALTRE (${list.length - shown})`;
  };
  const showCategory = () => {
    away.disconnect();
    grid.replaceChildren();
    shown = 0;
    if (!inCategory(collection, category).length) {
      moreBox.hidden = true;
      const none = category === 'eredita' ? 'Nessuna carta di questo universo ti riconosce come titolare di prima.' : 'Niente in questa famiglia, per ora.';
      grid.append(collection.mine.length || category === 'eredita' ? message('VUOTO', 'NESSUNA CARTA QUI', none) : message('COLLEZIONE VUOTA', 'ANCORA NESSUNA CARTA', 'Ciò che porti nel mondo diventa una tua carta: esplora, parla, fabbrica, e torna a vedere quanto viene usato.', el('a', { class: 'comic-btn arcade cyan', href: '../index.html' }, 'GIOCA SUBITO')));
      return;
    }
    showMore();
  };
  const drawTabs = () => {
    tabs.replaceChildren(
      ...CATEGORIES.map((c) => {
        const tab = el('button', { type: 'button', class: `comic-tab${c.id === category ? ' active' : ''}` }, `${c.nome} (${inCategory(collection, c.id).length})`);
        tab.addEventListener('click', () => {
          category = c.id;
          drawTabs();
          showCategory();
        });
        return tab;
      }),
    );
  };
  const show = (name: string, snap: { files: FileMap; carte: Card[] }) => {
    collection = collectionView(snap.files, me, name, snap.carte);
    stat('stat-total', String(collection.stats.totale));
    stat('stat-rare', String(collection.stats.rare));
    stat('stat-legendary', String(collection.stats.leggendarie));
    stat('stat-income', formatUses(collection.stats.rendita));
    drawTabs();
    showCategory();
  };
  moreBtn.addEventListener('click', showMore);

  const names = await universeNames();
  const asked = new URLSearchParams(location.search).get('universo');
  if (asked && !names.includes(asked)) names.unshift(asked);
  select.replaceChildren(...names.map((n) => el('option', { value: n }, n.toUpperCase())));
  if (!names.length) {
    select.disabled = true;
    grid.replaceChildren(message('NESSUN UNIVERSO', 'NESSUN UNIVERSO RAGGIUNGIBILE', 'Quando un universo sarà aperto su questo server, qui troverai le sue carte.', el('a', { class: 'comic-btn arcade cyan', href: './sessioni.html' }, 'VAI ALLE SESSIONI')));
    return;
  }
  select.addEventListener('change', async () => {
    const snap = await snapshot(select.value);
    if (snap) show(select.value, snap);
  });

  // The asked universe, or the first where this wanderer holds something (or the first one).
  let first: { name: string; snap: { files: FileMap; carte: Card[] } } | undefined;
  for (const name of asked ? [asked] : names) {
    const snap = await snapshot(name);
    if (!snap) continue;
    first ??= { name, snap };
    if (snap.carte.some((c) => c.titolare === me)) {
      first = { name, snap };
      break;
    }
  }
  if (!first) {
    grid.replaceChildren(message('NESSUN UNIVERSO', 'UNIVERSO NON RAGGIUNGIBILE', 'L’universo scelto non risponde: riprova tra poco.'));
    return;
  }
  select.value = first.name;
  show(first.name, first.snap);
}

function wireNav(): void {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  const actions = document.querySelector('.nav-actions');
  toggle?.addEventListener('click', () => {
    const open = !links?.classList.contains('is-open');
    links?.classList.toggle('is-open', open);
    actions?.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
}

if (typeof document !== 'undefined') {
  wireNav();
  void start();
}
