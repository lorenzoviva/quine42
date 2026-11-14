// The campaign in the site (T377, ADR-0188 §6 row 7, ADR-0202): on the session page, for the master of a universe of many, what the console and the
// Direction do in the game: the guests and the invites (`guests`), the pace of the world (`pace`), the atlas with the regions of the master and the
// directives (`campaign`), each through the store's own route. Here only what the master asks and what the server answers: the checks are the
// server's (the same functions as in the game), and every reason it gives is shown. Nothing is written as HTML: every text goes in as text.

import type { GuestsView } from '../src/kernel/universes';
import { MASTER_REGION_LIMITS, REGION_KIND_NAME, REGION_KIND_NOTE, regionKind, type Region, type RegionKind } from '../src/kernel/atlas';
import { PACE_MODES, PACE_NAME, type PaceMode, type WorldPace } from '../src/kernel/worldPace';
import { CAMPAIGN_TEXT_CHARS, type CampaignEnvironment } from '../src/kernel/campaignEdit';
import { hueOf, regionColor } from '../src/ui/regions';
import { el } from '../src/ui/dom';

/** What the page sends to say who it is: an account's token, or the wanderer of this machine. Asked at every request (a token expires). */
export type CampaignHeaders = () => Promise<Record<string, string>>;

interface Place {
  cx: number;
  cy: number;
  name: string;
  layout: string;
}

/** What the `campaign` route answers. */
interface CampaignView {
  running: boolean;
  text: string;
  template: boolean;
  regions: Region[];
  environments: CampaignEnvironment[];
  places: Place[];
  done?: { said: string; left?: Array<{ section: string; line: string; reason: string }> };
}

interface Answer<T> {
  ok: boolean;
  status: number;
  body: T & { error?: string; reasons?: string[] };
}

type Kind = RegionKind | 'plan';
const KINDS: Kind[] = ['filler', 'held', 'plan'];

/** The link of an invite, as the console makes it: the token in the fragment, which no server log sees. */
export const inviteLink = (origin: string, universe: string, token: string) => `${origin}/?universo=${encodeURIComponent(universe)}#invito=${token}`;

/** How many places the atlas shows around the first: at least this, and as far as the places and the regions go, within a cap. */
const ATLAS_MIN = 6;
const ATLAS_MAX = 24;

/** The reach of the atlas: the farthest place or region edge from the first, between the two caps. */
export function atlasReach(places: Array<Pick<Place, 'cx' | 'cy'>>, regions: Array<Pick<Region, 'center' | 'radius'>>): number {
  let far = ATLAS_MIN;
  for (const p of places) far = Math.max(far, Math.abs(p.cx), Math.abs(p.cy));
  for (const r of regions) far = Math.max(far, Math.abs(r.center[0]) + r.radius, Math.abs(r.center[1]) + r.radius);
  return Math.min(ATLAS_MAX, far + 1);
}

const day = (ms: number) => new Date(ms).toLocaleDateString('it-IT');

export class CampaignPanel {
  private guests?: GuestsView;
  private guestsSaid = '';
  private link = '';
  private pace?: WorldPace;
  private paceSaid = '';
  private view?: CampaignView;
  private atlasSaid = '';
  private textSaid: HTMLElement[] = [];
  /** The place chosen on the atlas, and the region of the master being changed. */
  private chosen: [number, number] = [1, 0];
  private editing?: Region;
  private draft?: string;
  /** What the master asked for a region the server refused: the form keeps it, with the reasons beside. */
  private regionDraft?: { name: string; description: string; center: [number, number]; radius: number; kind: string; environment: string };

  constructor(
    private readonly root: HTMLElement,
    readonly universe: string,
    private readonly headers: CampaignHeaders,
    private readonly onClose: () => void = () => undefined,
  ) {}

  private async ask<T>(op: 'guests' | 'pace' | 'campaign', method: 'GET' | 'POST' | 'DELETE' = 'GET', body?: unknown): Promise<Answer<T>> {
    try {
      const r = await fetch(`/api/universe/${encodeURIComponent(this.universe)}/${op}`, {
        method,
        cache: 'no-store',
        headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(await this.headers()) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      const parsed = (await r.json().catch(() => ({}))) as Answer<T>['body'];
      return { ok: r.ok, status: r.status, body: parsed };
    } catch {
      return { ok: false, status: 0, body: { error: 'il server non risponde' } as Answer<T>['body'] };
    }
  }

  /** Reads all three and draws. */
  async open(): Promise<void> {
    this.root.hidden = false;
    this.root.replaceChildren(el('p', { class: 'campaign-note' }, 'Lettura della campagna…'));
    const [g, p, c] = await Promise.all([this.ask<GuestsView>('guests'), this.ask<{ pace: WorldPace }>('pace'), this.ask<CampaignView>('campaign')]);
    if (g.ok) this.guests = g.body;
    else this.guestsSaid = `✗ ${g.body.error ?? 'non letti'}`;
    if (p.ok) this.pace = p.body.pace;
    else this.paceSaid = `✗ ${p.body.error ?? 'non letto'}`;
    if (c.ok) this.view = c.body;
    else this.atlasSaid = `✗ ${c.body.error ?? 'non letta'}`;
    this.render();
  }

  close(): void {
    this.root.hidden = true;
    this.root.replaceChildren();
    this.onClose();
  }

  private render(): void {
    const close = el('button', { type: 'button', class: 'comic-modal-close', 'aria-label': 'Chiudi la campagna', 'data-campaign-close': '' }, '✕');
    close.addEventListener('click', () => this.close());
    const running = this.view
      ? el('span', { class: `comic-badge ${this.view.running ? 'green' : 'yellow'}` }, this.view.running ? 'MONDO ACCESO' : 'MONDO SPENTO')
      : el('span', {});
    const state = this.view
      ? this.view.running
        ? 'Il mondo è acceso: ciò che cambi qui arriva subito a chi gioca, come dalla console.'
        : 'Il mondo è spento: ciò che cambi qui si scrive nell’universo, e il mondo lo trova quando riparte.'
      : '';
    this.root.replaceChildren(
      el(
        'div',
        { class: 'campaign-head' },
        el('div', {}, el('span', { class: 'comic-badge pink' }, 'CAMPAGNA'), ' ', running, el('h2', { class: 'comic-title campaign-title' }, this.universe.toUpperCase())),
        close,
      ),
      el('p', { class: 'campaign-note' }, `Ciò che la console del master e la Direzione fanno nel gioco, da qui, anche senza entrare. ${state}`),
      el('div', { class: 'campaign-grid' }, this.guestsBlock(), this.paceBlock()),
      this.atlasBlock(),
      this.textBlock(),
    );
  }

  private block(title: string, attr: string, ...children: Array<Node | string>): HTMLElement {
    return el('section', { class: 'campaign-block', [attr]: '' }, el('h3', { class: 'campaign-block-title' }, title), ...children);
  }

  private row(...children: Array<Node | string>): HTMLElement {
    return el('div', { class: 'campaign-row' }, ...children);
  }

  private button(text: string, attrs: Record<string, string>, act: () => void | Promise<void>): HTMLButtonElement {
    const b = el('button', { type: 'button', class: 'comic-btn arcade sm', ...attrs }, text);
    b.addEventListener('click', () => {
      b.disabled = true;
      void Promise.resolve(act()).finally(() => (b.disabled = false));
    });
    return b;
  }

  // ── Guests and invites ─────────────────────────────────────────────────────────────────────────────────────────────

  private async guestsDo(method: 'POST' | 'DELETE', body: Record<string, unknown>, said: string): Promise<void> {
    const r = await this.ask<GuestsView>('guests', method, body);
    if (r.ok) {
      this.guests = r.body;
      this.guestsSaid = said;
      if (r.body.token) this.link = inviteLink(location.origin, this.universe, r.body.token);
    } else this.guestsSaid = `✗ ${r.body.error ?? 'non riuscito'}`;
    this.render();
  }

  private guestsBlock(): HTMLElement {
    const v = this.guests;
    const said = this.guestsSaid ? el('p', { class: 'campaign-said', 'data-guests-said': '' }, this.guestsSaid) : '';
    if (!v) return this.block('Ospiti e inviti', 'data-guests', said || el('p', { class: 'campaign-note' }, 'Non letti.'));
    const toggle = this.button(v.private ? 'Rendi pubblico' : 'Rendi privato', { 'data-guests-private': '' }, () =>
      this.guestsDo('POST', { op: 'private', value: !v.private }, v.private ? '✓ ora l’universo è pubblico: entra chiunque abbia un account' : '✓ ora l’universo è privato: chi era nel mondo è fra gli ospiti'),
    );
    const rows: Array<Node | string> = [
      el(
        'p',
        { class: 'campaign-note' },
        v.private ? 'PRIVATO: entrano solo il master e gli ospiti; agli altri non esiste, né nell’elenco né per nome.' : 'Pubblico: entra chiunque abbia un account.',
        ' Un invito vale 7 giorni e un uso se non dici altro; chi lo usa diventa ospite e da lì entra col suo account.',
      ),
      this.row(toggle),
    ];
    const list = el('ul', { class: 'campaign-list' });
    for (const g of v.guests) {
      const out = this.button('Togli', { 'data-guest-out': g.id }, () => this.guestsDo('DELETE', { guest: g.id }, `✓ ${g.id} non è più un ospite: se era nel mondo ne è uscito`));
      list.append(el('li', { 'data-guest': g.id }, el('b', {}, g.id), ` ${g.note ? `«${g.note}» · ` : ''}dal ${day(g.since)}${g.invite ? ' con un invito' : ''} `, out));
    }
    for (const i of v.invites) {
      const revoke = this.button('Revoca', { 'data-invite-revoke': i.id }, () => this.guestsDo('DELETE', { invite: i.id }, '✓ invito revocato'));
      list.append(el('li', { 'data-invite': i.id }, el('b', {}, 'invito'), ` ${i.note ? `«${i.note}» · ` : ''}${i.left} su ${i.uses} usi · scade il ${day(i.expires)} `, revoke));
    }
    if (!v.guests.length && !v.invites.length) list.append(el('li', { class: 'campaign-note' }, 'Nessun ospite e nessun invito aperto.'));
    const id = el('input', { type: 'text', class: 'comic-input', placeholder: 'id del viandante', 'data-guest-id': '' });
    const note = el('input', { type: 'text', class: 'comic-input', placeholder: 'nota (facoltativa)', maxlength: '80' });
    const add = this.button('Aggiungi ospite', { 'data-guest-add': '' }, () => {
      const who = id.value.trim();
      if (!who) return;
      return this.guestsDo('POST', { op: 'add', id: who, ...(note.value.trim() ? { note: note.value.trim() } : {}) }, `✓ ${who} è un ospite`);
    });
    const days = el('input', { type: 'number', class: 'comic-input campaign-number', min: '1', max: '30', value: '7', 'aria-label': 'giorni' });
    const uses = el('input', { type: 'number', class: 'comic-input campaign-number', min: '1', max: '20', value: '1', 'aria-label': 'usi' });
    const forWhom = el('input', { type: 'text', class: 'comic-input', placeholder: 'per chi (facoltativo)', maxlength: '80' });
    const make = this.button('Crea invito', { 'data-invite-make': '' }, () =>
      this.guestsDo('POST', { op: 'invite', days: Number(days.value) || 7, uses: Number(uses.value) || 1, ...(forWhom.value.trim() ? { note: forWhom.value.trim() } : {}) }, '✓ invito creato'),
    );
    rows.push(list, this.row(id, note, add), this.row('giorni ', days, ' usi ', uses, forWhom, make));
    if (this.link) {
      const link = el('input', { type: 'text', class: 'comic-input', readonly: '', value: this.link, 'data-invite-link': '' });
      const copy = this.button('Copia', {}, () => navigator.clipboard?.writeText(link.value).then(() => void (copy.textContent = 'Copiato')));
      const hide = this.button('Nascondi', {}, () => {
        this.link = '';
        this.render();
      });
      rows.push(el('p', { class: 'campaign-note' }, 'Il link dell’invito si vede solo ora: mandalo a chi inviti. Il server ne tiene solo l’impronta.'), this.row(link, copy, hide));
    }
    if (said) rows.push(said);
    return this.block('Ospiti e inviti', 'data-guests', ...rows);
  }

  // ── The pace ───────────────────────────────────────────────────────────────────────────────────────────────────────

  private paceBlock(): HTMLElement {
    const now = this.pace?.mode;
    const buttons = PACE_MODES.map((mode: PaceMode) => {
      const b = this.button(PACE_NAME[mode], { 'data-pace': mode, ...(mode === now ? { 'aria-pressed': 'true' } : {}) }, async () => {
        if (mode === this.pace?.mode) return;
        const r = await this.ask<{ pace: WorldPace; running?: WorldPace }>('pace', 'POST', { mode });
        if (r.ok) {
          this.pace = r.body.pace;
          this.paceSaid = `✓ ritmo ${PACE_NAME[r.body.pace.mode]}${r.body.running ? ': il mondo acceso l’ha preso' : ': il mondo lo trova quando riparte'}`;
        } else this.paceSaid = `✗ ${r.body.error ?? 'non riuscito'}`;
        this.render();
      });
      if (mode === now) b.classList.add('cyan');
      return b;
    });
    const meaning =
      now === 'hold'
        ? 'In pausa: i luoghi nuovi restano abbozzati e il mondo non fa niente da sé (modelli, brani, trame, dialoghi fra individui); le risposte ai viandanti continuano. I giocatori lo vedono scritto.'
        : now === 'slow'
          ? 'Lento: meno luoghi nuovi al minuto, le pause dello Scultore e del Musicista raddoppiate.'
          : now === 'normal'
            ? 'Normale: ciò che è stato regolato nella lobby.'
            : 'Non letto.';
    return this.block(
      'Ritmo del mondo',
      'data-pace-block',
      this.row(...buttons),
      el('p', { class: 'campaign-note' }, `${meaning} Solo verso il basso: mai più di quanto deciso nella lobby.`),
      ...(this.paceSaid ? [el('p', { class: 'campaign-said', 'data-pace-said': '' }, this.paceSaid)] : []),
    );
  }

  // ── The atlas and the regions ──────────────────────────────────────────────────────────────────────────────────────

  private async campaignDo(body: Record<string, unknown>): Promise<CampaignView | undefined> {
    const r = await this.ask<CampaignView>('campaign', 'POST', body);
    if (!r.ok) {
      const reasons = r.body.reasons?.length ? r.body.reasons : [r.body.error ?? 'non riuscito'];
      return void (this.atlasSaid = reasons.map((x) => `✗ ${x}`).join('\n'));
    }
    this.view = r.body;
    return r.body;
  }

  private atlasBlock(): HTMLElement {
    const v = this.view;
    if (!v) return this.block('Atlante e regioni', 'data-atlas', el('p', { class: 'campaign-said' }, this.atlasSaid || 'Non letto.'));
    const reach = atlasReach(v.places, v.regions);
    const side = reach * 2 + 1;
    const canvas = el('canvas', { class: 'campaign-atlas', 'data-atlas-canvas': '', width: String(side * 16), height: String(side * 16), 'aria-label': 'L’atlante: tocca un luogo per sceglierlo' });
    const caption = el('p', { class: 'campaign-note', 'data-atlas-caption': '' });
    const draw = () => this.drawAtlas(canvas, reach);
    const describe = () => {
      const [x, y] = this.chosen;
      const place = v.places.find((p) => p.cx === x && p.cy === y);
      const env = (id: string) => v.environments.find((e) => e.id === id)?.name ?? id;
      const inside = v.regions.filter((r) => Math.max(Math.abs(r.center[0] - x), Math.abs(r.center[1] - y)) <= r.radius).map((r) => `«${r.name}»`);
      caption.textContent = `Luogo ${x},${y}: ${place ? `${place.name || 'senza nome'}${place.layout ? ` (${env(place.layout)})` : ''}` : 'non ancora pianificato'}${inside.length ? ` · nelle regioni ${inside.join(', ')}` : ''}.`;
    };
    canvas.addEventListener('click', (e) => {
      const box = canvas.getBoundingClientRect();
      const cell = box.width / side;
      const x = Math.floor((e.clientX - box.left) / cell) - reach;
      const y = Math.floor((e.clientY - box.top) / cell) - reach;
      this.chosen = [x, y];
      const cx = this.root.querySelector<HTMLInputElement>('[data-region="cx"]');
      const cy = this.root.querySelector<HTMLInputElement>('[data-region="cy"]');
      if (cx && cy) {
        cx.value = String(x);
        cy.value = String(y);
      }
      if (this.regionDraft) this.regionDraft.center = [x, y];
      draw();
      describe();
    });
    requestAnimationFrame(draw);
    describe();
    const mine = v.regions.filter((r) => r.master);
    const theirs = v.regions.filter((r) => !r.master);
    const list = el('ul', { class: 'campaign-list', 'data-master-regions': '' });
    for (const r of mine) {
      const change = this.button('Cambia', { 'data-region-change': r.id }, () => {
        this.editing = r;
        this.regionDraft = undefined;
        this.chosen = [r.center[0], r.center[1]];
        this.render();
      });
      const free = this.button('Libera', { 'data-region-release': r.id }, async () => {
        const done = await this.campaignDo({ op: 'release', id: r.id });
        if (done) this.atlasSaid = `✓ «${r.name}» liberata: i suoi luoghi nuovi si pianificano come il resto del mondo`;
        if (this.editing?.id === r.id) this.editing = undefined;
        this.render();
      });
      list.append(el('li', { 'data-master-region': r.id }, this.swatch(r), ` ${this.regionLine(r)} `, change, free));
    }
    if (!mine.length) list.append(el('li', { class: 'campaign-note' }, 'Nessuna regione del master.'));
    const others = theirs.length ? el('p', { class: 'campaign-note' }, `Del Cartografo: ${theirs.map((r) => this.regionLine(r)).join(' · ')}.`) : '';
    return this.block(
      'Atlante e regioni',
      'data-atlas',
      el('p', { class: 'campaign-note' }, 'I quadretti pieni sono i luoghi già pianificati, i riquadri le regioni (tratteggiate quelle del Cartografo). Tocca un luogo per metterci il centro di una regione.'),
      el('div', { class: 'campaign-atlas-wrap' }, canvas, el('div', { class: 'campaign-atlas-side' }, caption, this.regionForm(v), list, others)),
      ...(this.atlasSaid ? [el('p', { class: 'campaign-said', 'data-atlas-said': '' }, this.atlasSaid)] : []),
    );
  }

  private swatch(r: Region): HTMLElement {
    const s = el('span', { class: 'campaign-swatch' });
    s.style.background = regionColor(r);
    return s;
  }

  private regionLine(r: Region): string {
    const kind: Kind = regionKind(r) ?? 'plan';
    const env = r.environment ? (this.view?.environments.find((e) => e.id === r.environment)?.name ?? r.environment) : '';
    return `«${r.name}» — ${REGION_KIND_NAME[kind]}${env ? ` (${env})` : ''}, centro ${r.center[0]},${r.center[1]}, raggio ${r.radius}`;
  }

  /** The form of «Dichiara regione», the same fields as in the studio (src/ui/regions.ts). */
  private regionForm(v: CampaignView): HTMLElement {
    const L = MASTER_REGION_LIMITS;
    const r = this.editing;
    const d = this.regionDraft;
    const name = el('input', { type: 'text', class: 'comic-input', placeholder: 'nome (lo leggono anche le persone)', maxlength: String(L.name), 'data-region': 'name', value: d?.name ?? r?.name ?? '' });
    const description = el('input', { type: 'text', class: 'comic-input', placeholder: 'descrizione (facoltativa)', maxlength: String(L.description), 'data-region': 'description', value: d?.description ?? r?.description ?? '' });
    const num = (value: number, min: number, max: number, key: string) =>
      el('input', { type: 'number', class: 'comic-input campaign-number', min: String(min), max: String(max), step: '1', value: String(value), 'data-region': key, 'aria-label': key });
    const [x0, y0] = d?.center ?? r?.center ?? this.chosen;
    const cx = num(x0, -L.reach, L.reach, 'cx');
    const cy = num(y0, -L.reach, L.reach, 'cy');
    const radius = num(d?.radius ?? r?.radius ?? 1, 0, L.radius, 'radius');
    const kind = el('select', { class: 'comic-select', 'data-region': 'kind' }, ...KINDS.map((x) => el('option', { value: x }, REGION_KIND_NAME[x])));
    kind.value = d?.kind ?? (r ? (regionKind(r) ?? 'plan') : 'filler');
    const environment = el('select', { class: 'comic-select', 'data-region': 'environment' }, el('option', { value: '' }, 'nessun ambiente'), ...v.environments.map((e) => el('option', { value: e.id }, e.name)));
    environment.value = d?.environment ?? r?.environment ?? v.environments[0]?.id ?? '';
    const meaning = el('p', { class: 'campaign-note' });
    const explain = () => (meaning.textContent = `${REGION_KIND_NAME[kind.value as Kind]}: ${REGION_KIND_NOTE[kind.value as Kind]}. I luoghi già pianificati restano come sono.`);
    kind.addEventListener('change', explain);
    explain();
    const declare = this.button(r ? 'Cambia' : 'Dichiara', { 'data-region': 'declare' }, async () => {
      const request = {
        ...(r ? { id: r.id } : {}),
        name: name.value,
        description: description.value,
        center: [Number(cx.value), Number(cy.value)] as [number, number],
        radius: Number(radius.value),
        kind: kind.value,
        environment: environment.value,
      };
      const done = await this.campaignDo({ op: 'region', region: request });
      this.regionDraft = done ? undefined : request;
      if (done) {
        this.atlasSaid = `✓ ${done.done?.said ?? 'regione scritta'}`;
        this.editing = undefined;
      }
      this.render();
    });
    const cancel =
      r || d
        ? this.button('Annulla', {}, () => {
            this.editing = undefined;
            this.regionDraft = undefined;
            this.atlasSaid = '';
            this.render();
          })
        : '';
    return el(
      'div',
      { class: 'campaign-form', 'data-region-form': '' },
      el('h4', { class: 'campaign-form-title' }, r ? `Cambia la regione «${r.name}»` : 'Dichiara regione'),
      this.row(name),
      this.row(description),
      this.row('centro ', cx, ' ', cy, ' raggio ', radius, ' luoghi'),
      this.row(kind, environment),
      meaning,
      this.row(declare, cancel),
    );
  }

  private drawAtlas(canvas: HTMLCanvasElement, reach: number): void {
    const v = this.view;
    const g = canvas.getContext('2d');
    if (!g || !v) return;
    const side = reach * 2 + 1;
    const cell = canvas.width / side;
    const css = getComputedStyle(this.root);
    const ink = css.getPropertyValue('--skin-text').trim() || 'gray';
    const dim = css.getPropertyValue('--skin-text-dim').trim() || 'gray';
    const accent = css.getPropertyValue('--skin-accent-2').trim() || 'magenta';
    const at = (x: number, y: number): [number, number] => [(x + reach) * cell, (y + reach) * cell];
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.globalAlpha = 0.25;
    g.strokeStyle = dim;
    g.lineWidth = 1;
    for (let i = 0; i <= side; i++) {
      g.beginPath();
      g.moveTo(i * cell, 0);
      g.lineTo(i * cell, canvas.height);
      g.moveTo(0, i * cell);
      g.lineTo(canvas.width, i * cell);
      g.stroke();
    }
    g.globalAlpha = 1;
    // The Cartographer's first, then the master's: theirs win where both cover a place.
    for (const r of [...v.regions.filter((x) => !x.master), ...v.regions.filter((x) => x.master)]) {
      const [x, y] = at(r.center[0] - r.radius, r.center[1] - r.radius);
      const w = (r.radius * 2 + 1) * cell;
      g.fillStyle = regionColor(r);
      g.globalAlpha = r.master ? 0.3 : 0.15;
      g.fillRect(x, y, w, w);
      g.globalAlpha = 1;
      g.strokeStyle = regionColor(r);
      g.lineWidth = 2;
      g.setLineDash(r.master ? [] : [4, 3]);
      g.strokeRect(x + 1, y + 1, w - 2, w - 2);
      g.setLineDash([]);
    }
    for (const p of v.places) {
      if (Math.abs(p.cx) > reach || Math.abs(p.cy) > reach) continue;
      const [x, y] = at(p.cx, p.cy);
      g.fillStyle = p.layout ? `hsl(${hueOf(p.layout)} 70% 55%)` : ink;
      g.fillRect(x + cell * 0.2, y + cell * 0.2, cell * 0.6, cell * 0.6);
    }
    // The first place, nobody's region; and the place chosen.
    const [ox, oy] = at(0, 0);
    g.strokeStyle = ink;
    g.lineWidth = 2;
    g.strokeRect(ox + 2, oy + 2, cell - 4, cell - 4);
    const [sx, sy] = at(this.chosen[0], this.chosen[1]);
    g.strokeStyle = accent;
    g.lineWidth = 3;
    g.strokeRect(sx + 1, sy + 1, cell - 2, cell - 2);
  }

  // ── The directives ─────────────────────────────────────────────────────────────────────────────────────────────────

  private textBlock(): HTMLElement {
    const v = this.view;
    if (!v) return this.block('Direttive (campaign.md)', 'data-directives', el('p', { class: 'campaign-note' }, 'Non lette.'));
    const area = el('textarea', { class: 'comic-input campaign-text', rows: '16', maxlength: String(CAMPAIGN_TEXT_CHARS), spellcheck: 'false', 'data-directives-text': '' });
    area.value = this.draft ?? v.text;
    area.addEventListener('input', () => (this.draft = area.value));
    const save = this.button('Salva le direttive', { 'data-directives-save': '' }, async () => {
      const r = await this.ask<CampaignView>('campaign', 'POST', { op: 'text', text: area.value });
      if (!r.ok) {
        const reasons = r.body.reasons?.length ? r.body.reasons : [r.body.error ?? 'non salvate'];
        this.textSaid = reasons.map((x) => el('p', { class: 'campaign-said' }, `✗ ${x}`));
      } else {
        this.view = r.body;
        this.draft = undefined;
        const left = r.body.done?.left ?? [];
        this.textSaid = [
          el('p', { class: 'campaign-said' }, `✓ salvate${r.body.running ? ': il mondo le usa dalla prossima richiesta' : ''}`),
          ...left.slice(0, 5).map((l) => el('p', { class: 'campaign-said' }, `Resta fuori dalle richieste: «${l.line.replace(/^[-*]\s+/, '').slice(0, 60)}» (nel mondo non si dice «${l.reason}»)`)),
        ];
      }
      this.render();
    });
    return this.block(
      'Direttive (campaign.md)',
      'data-directives',
      el(
        'p',
        { class: 'campaign-note' },
        'Come si fa il mondo da qui in avanti, a sezioni per squadra: ogni richiesta del Concilio porta «Per tutti» e la sezione del suo agente. Ciò che rompe la quarta parete resta fuori dalle richieste, e qui lo vedi. Nessun giocatore le legge.',
        v.template ? ' Non ce ne sono ancora: qui sotto le sezioni vuote.' : '',
      ),
      area,
      this.row(save),
      ...this.textSaid,
    );
  }
}
