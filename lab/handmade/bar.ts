// The bar of the handmade cards in a lab (T294, ADR-0168): it opens the copy the address asks for (a model or a sound of a universe, a
// card), keeps the work not saved on this machine, and saves it as a card of the account, saying every reason the server gives for a
// refusal. The lab only gives its program and takes one: `CardsHost`. Everything a player wrote (a name, a signature) is shown as text.

import { CLASSES, SIZE_TIERS } from '../../src/mj/classes';
import type { HandmadeKind, HandmadeView } from '../../src/kernel/handmade';
import { accountConfig, signIn, type SignedIn } from '../../src/session/login';
import { CardsClient, labsClosed, localWanderer } from './client';
import {
  cardDraft,
  createBody,
  draftKey,
  draftProblems,
  forkables,
  forkDraft,
  readDraft,
  reasonsOf,
  resume,
  saved,
  sourceFromSearch,
  unsaved,
  updateBody,
  type CardSource,
  type Draft,
  type PlayerLab,
} from './logic';
import './bar.css';

/** What a lab gives the bar. */
export interface CardsHost {
  lab: PlayerLab;
  /** What this lab saves. */
  kind: HandmadeKind;
  /** Where the bar goes: at its start. */
  mount: HTMLElement;
  /** The program as the page has it now. */
  getXml(): string;
  /** Opens a program in the page, and runs it. `vpt` and the box only for a model. */
  setXml(xml: string, meta: { class?: string; size?: string; vpt?: number }): void;
  /** A model's class or size changed: the page may draw it in its box again. */
  onMeta?(meta: { class?: string; size?: string }): void;
  /** Whether the bar keeps the draft of free work too (false: the lab keeps its own). */
  freeDraft?: boolean;
  /** A card was saved: the lab's own draft of free work, if it has one, is that card now. */
  onSaved?(card: HandmadeView): void;
}

const POLL_MS = 1000;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...kids: Array<Node | string>): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  e.append(...kids);
  return e;
}

function storedText(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function keep(key: string, d: Draft | undefined): void {
  try {
    if (d && unsaved(d)) localStorage.setItem(key, JSON.stringify(d));
    else localStorage.removeItem(key);
  } catch {
    /* a browser that keeps nothing: the work stays in the page */
  }
}

/**
 * Who asks: an account if this server has them (its sign-in, with two buttons in `login`), or this machine. `asking` is said when the
 * buttons show; a sign-in that fails leaves a client without an account (its requests are refused, and say so).
 */
export async function signedClient(login: HTMLElement, asking?: () => void): Promise<{ client: CardsClient; signed?: SignedIn }> {
  const config = await accountConfig();
  if (!config) return { client: new CardsClient(undefined, localWanderer()) };
  const signed = await signIn(config, () =>
    new Promise((resolve) => {
      asking?.();
      const google = el('button', { type: 'button' }, 'Entra con Google');
      const anon = el('button', { type: 'button' }, 'Entra come anonimo');
      login.replaceChildren(google, anon);
      login.hidden = false;
      const done = (how: 'google' | 'anonimo') => {
        login.hidden = true;
        resolve(how);
      };
      google.onclick = () => done('google');
      anon.onclick = () => done('anonimo');
    }),
  ).catch(() => undefined);
  return { client: new CardsClient(signed), signed };
}

export interface CardsBar {
  /** Saves (Ctrl+S in a lab). */
  save(): Promise<void>;
  readonly draft: Draft | undefined;
}

/** Puts the bar in the lab. Undefined when this server has the labs switched off and the address asks for nothing. */
export async function startCards(host: CardsHost): Promise<CardsBar | undefined> {
  const kindName = host.kind === 'sound' ? 'suono' : 'modello';
  const badge = el('span', { class: 'hm-badge' }, 'CARTA');
  const state = el('span', { class: 'hm-state' }, 'apro…');
  const name = el('input', { class: 'hm-name', maxlength: '60', placeholder: `nome del ${kindName}`, 'aria-label': 'Il nome della carta' });
  const cls = el('select', { class: 'hm-class', title: 'La classe del modello: la sua scatola nel mondo', 'aria-label': 'Classe' });
  const size = el('select', { class: 'hm-size', title: 'La taglia, se non quella della classe', 'aria-label': 'Taglia' });
  for (const c of CLASSES) cls.append(new Option(c.name, c.id));
  size.append(new Option('taglia della classe', ''));
  for (const t of SIZE_TIERS) size.append(new Option(t.name, t.id));
  const saveBtn = el('button', { class: 'hm-save', type: 'button', title: 'Salva come carta del tuo account (Ctrl+S)' }, 'Salva');
  const asNew = el('button', { class: 'hm-new', type: 'button', title: 'Una carta nuova da questa, l’altra resta com’è', hidden: '' }, 'Salva come nuova');
  const dirty = el('span', { class: 'hm-dirty', hidden: '', title: 'Le modifiche restano su questa macchina finché non salvi' }, '● non salvato');
  const login = el('span', { class: 'hm-login', hidden: '' });
  const home = el('a', { class: 'hm-home', href: '/site/laboratori.html', title: 'I laboratori e le tue carte' }, 'Le tue carte');
  const errors = el('ul', { class: 'hm-errors', hidden: '', 'aria-live': 'polite' });
  const modelOnly = el('span', { class: 'hm-model' }, cls, size);
  const bar = el('div', { class: 'hm-bar', role: 'region', 'aria-label': 'Carta fatta a mano' }, badge, state, name, modelOnly, saveBtn, asNew, dirty, login, home);
  const box = el('div', { class: 'hm-box' }, bar, errors);
  if (host.kind === 'sound') modelOnly.hidden = true;
  host.mount.prepend(box);

  const say = (text: string) => (state.textContent = text);
  const showErrors = (list: string[]) => {
    errors.replaceChildren(...list.map((t) => el('li', {}, t)));
    errors.hidden = !list.length;
  };

  const { client, signed } = await signedClient(login, () => say('entra per salvare le tue carte'));
  let source: CardSource | undefined = sourceFromSearch(location.search);

  const probe = await client.mine();
  if (labsClosed(probe)) {
    if (!source) {
      box.remove();
      return undefined;
    }
    say('i laboratori non sono aperti su questo server');
    saveBtn.disabled = true;
    return undefined;
  }

  let card: HandmadeView | undefined;
  let draft: Draft | undefined;
  let readOnly = false;
  let key = draftKey(host.lab, source);

  const fill = (d: Draft) => {
    name.value = d.name;
    if (d.kind === 'model') {
      cls.value = d.class ?? 'object';
      size.value = d.size ?? '';
    }
  };
  const open = (d: Draft, vpt?: number) => {
    draft = d;
    fill(d);
    host.setXml(d.xml, { class: d.class, size: d.size, ...(vpt ? { vpt } : {}) });
  };
  const describe = () => {
    asNew.hidden = !card?.mine;
    saveBtn.disabled = readOnly;
    name.disabled = cls.disabled = size.disabled = readOnly;
    if (card && !card.mine) return say(`carta di ${card.signature || 'un altro viandante'}: puoi provarla, non salvarla`);
    if (card) return say(`la tua carta${card.from && 'universe' in card.from ? ` · da ${card.from.universe}/${card.from.model}` : ''}`);
    if (source && 'universe' in source) return say(`copia di ${source.universe}/${source.model}: salvala per farne una tua carta`);
    say(`un ${kindName} nuovo: salvalo per farne una tua carta`);
  };

  // --- What the address asks for, and the work this machine kept of it ---
  if (source && 'card' in source) {
    const r = await client.open(source.card);
    card = r.body.card;
    if (!r.ok || !card) {
      showErrors(reasonsOf(r.body));
      say('carta non trovata');
      readOnly = true;
      saveBtn.disabled = true;
      return undefined;
    }
    if (card.kind !== host.kind) {
      say(`questa carta è un ${card.kind === 'sound' ? 'suono' : 'modello'}: si apre nell’altro laboratorio`);
      readOnly = true;
      saveBtn.disabled = true;
      return undefined;
    }
    readOnly = !card.mine;
    const r2 = resume(cardDraft(card), readOnly ? undefined : readDraft(storedText(key), host.kind));
    open(r2.draft);
    if (r2.resumed) showErrors(['ho ripreso le modifiche che non avevi salvato su questa macchina']);
    if (r2.kept) showErrors(['la carta è cambiata altrove: le modifiche non salvate di questa macchina sono rimaste da parte (Annulla non le riporta)']);
  } else if (source) {
    const files = await client.universe(source.universe);
    const f = files ? forkables(files).find((x) => x.id === (source as { model: string }).model) : undefined;
    if (!f || f.kind !== host.kind) {
      showErrors([f ? `«${f.name}» è un ${f.kind === 'sound' ? 'suono' : 'modello'}: si forka nell’altro laboratorio` : `nessun ${kindName} «${source.model}» in «${source.universe}» da leggere`]);
      say('niente da forkare');
      source = undefined;
      key = draftKey(host.lab);
    } else {
      const r2 = resume(forkDraft(f), readDraft(storedText(key), host.kind));
      open(r2.draft, f.vpt);
      if (r2.resumed) showErrors(['ho ripreso le modifiche che non avevi salvato su questa macchina']);
    }
  }
  if (!draft) {
    // Free work: what the lab opened, or what this machine kept.
    const kept = host.freeDraft === false ? undefined : readDraft(storedText(key), host.kind);
    if (kept) open(kept);
    else {
      draft = { kind: host.kind, xml: host.getXml(), name: '', ...(host.kind === 'model' ? { class: 'object' } : {}), base: host.getXml() };
      fill(draft);
    }
  }
  if (signed?.anonimo) showErrors(['da anonimo provi tutto, ma per salvare una carta lega l’account a Google (dal profilo del sito)']);
  describe();

  // --- Keeping the work: the page's program, its name, class and size, on this machine until saved ---
  const sync = () => {
    if (!draft || readOnly) return;
    const xml = host.getXml();
    const next: Draft = { ...draft, xml, name: name.value, ...(draft.kind === 'model' ? { class: cls.value, size: size.value || undefined } : {}) };
    if (next.kind === 'model' && !next.size) delete next.size;
    draft = next;
    if (source || host.freeDraft !== false) keep(key, draft);
    dirty.hidden = !unsaved(draft);
  };
  setInterval(sync, POLL_MS);
  name.addEventListener('input', sync);
  for (const s of [cls, size])
    s.addEventListener('change', () => {
      sync();
      host.onMeta?.({ class: cls.value, size: size.value || undefined });
    });

  const after = (view: HandmadeView, made: boolean) => {
    const oldKey = key;
    card = view;
    source = { card: view.id };
    key = draftKey(host.lab, source);
    draft = saved({ ...draft!, name: view.name });
    keep(oldKey, undefined);
    keep(key, undefined);
    if (made) history.replaceState(null, '', `${location.pathname}?card=${encodeURIComponent(view.id)}`);
    name.value = view.name;
    dirty.hidden = true;
    describe();
    host.onSaved?.(view);
  };

  let busy = false;
  const send = async (asNewCard: boolean) => {
    if (busy || readOnly || !draft) return;
    sync();
    const problems = draftProblems(draft);
    if (problems.length) return showErrors(problems);
    busy = true;
    saveBtn.disabled = asNew.disabled = true;
    say('controllo il programma sul server…');
    try {
      if (card?.mine && !asNewCard) {
        const body = updateBody(draft, card);
        if (!body) {
          showErrors([]);
          return void say('niente da salvare');
        }
        const r = await client.update(card.id, body);
        if (!r.ok || !r.body.card) return void (showErrors(reasonsOf(r.body)), describe());
        showErrors([]);
        after(r.body.card, false);
        say('salvata');
      } else {
        const r = await client.create(createBody(draft, asNewCard && card ? { card: card.id } : source));
        if (!r.ok || !r.body.card) return void (showErrors(reasonsOf(r.body)), describe());
        showErrors([]);
        after(r.body.card, true);
        say('salvata: è una tua carta');
      }
    } finally {
      busy = false;
      saveBtn.disabled = readOnly;
      asNew.disabled = false;
    }
  };
  saveBtn.addEventListener('click', () => void send(false));
  asNew.addEventListener('click', () => void send(true));

  return {
    save: () => send(false),
    get draft() {
      return draft;
    },
  };
}
