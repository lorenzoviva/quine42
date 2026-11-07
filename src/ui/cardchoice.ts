// The choice of the cards to bring (T295, ADR-0170): before the Genesis (the Genesis screen) or, in a clone, before the first wanderer
// enters (the lobby), the master picks models and sounds of the kin universes (the same root) and handmade cards. Two cards with one id,
// or an id this universe has already, are said here, before anything starts; the store says the rest (the check of every program).
// Every text here is someone else's (a name, a signature): shown as text, never as markup.

import { broughtId, doubles, refText, type BringAnswer, type BringRef, type KinCard, type KinView } from '../kernel/bring';
import { el } from './dom';

export interface CardChoiceOptions {
  /** What may come, and whether the choice is open: the store's answer, or undefined without a store. */
  load: () => Promise<KinView | undefined>;
  /** Whether this universe has the model already. */
  has: (id: string) => boolean;
}

const KIND_WORD: Record<KinCard['kind'], string> = { model: 'modello', sound: 'suono' };

export class CardChoicePanel {
  readonly root = el('div', { class: 'game cards-to-bring' });
  private boxes: Array<{ ref: BringRef; box: HTMLInputElement; warn: HTMLElement }> = [];
  private status = el('div', { class: 'note' });
  private view?: KinView;

  constructor(private o: CardChoiceOptions) {
    this.root.append(el('div', { class: 'section' }, 'Le carte da portare'), el('div', { class: 'note' }, 'Cerco gli universi parenti…'));
    void this.reload();
  }

  /** Whether the choice is open now (as the store last said). */
  get open(): boolean {
    return !!this.view?.open;
  }

  /** The cards ticked. */
  chosen(): BringRef[] {
    return this.boxes.filter((b) => b.box.checked && !b.box.disabled).map((b) => b.ref);
  }

  /** The doubles among the ticked cards and against this universe, id → why. */
  doubles(): Map<string, string> {
    return doubles(this.chosen(), this.o.has);
  }

  lock(on: boolean): void {
    for (const b of this.boxes) b.box.disabled = on || !this.view?.open;
  }

  /** What the store said of a choice that did not come: the reason, and each card's. */
  showAnswer(r: BringAnswer): void {
    if (r.ok) {
      this.status.textContent = `Entrate ${r.brought.length} carte: ${r.brought.map((b) => `«${b.name}»`).join(', ')}.`;
      return;
    }
    this.status.textContent = `Le carte non entrano: ${r.reason}.`;
    const why = new Map((r.cards ?? []).map((c) => [c.card, c]));
    for (const b of this.boxes) {
      const c = why.get(refText(b.ref));
      b.warn.textContent = c ? `${c.reason}${c.errors?.length ? `: ${c.errors.slice(0, 2).join('; ')}` : ''}` : b.warn.textContent;
    }
  }

  /** Asks the store again (after a choice came, the Genesis began or failed). */
  async reload(): Promise<void> {
    this.view = await this.o.load().catch(() => undefined);
    this.render();
  }

  private render(): void {
    this.boxes = [];
    const v = this.view;
    const head = [
      el('div', { class: 'section' }, 'Le carte da portare'),
      el('div', { class: 'note' }, 'Modelli e suoni che sono carte di un universo parente (nato dal seme dello stesso contratto: la stessa radice) e le carte fatte a mano. Entrano adesso, prima della Genesi (in un clone, prima che entri il primo viandante); poi la scelta si chiude. Ogni carta ripassa dal controllo, e chi l\'ha fatta riceve la sua quota a ogni utilizzo.'),
    ];
    if (!v) return void this.root.replaceChildren(...head, el('div', { class: 'note' }, 'Senza il server degli universi non ci sono carte da portare.'));
    if (!v.open) return void this.root.replaceChildren(...head, el('div', { class: 'note' }, v.reason ? `${v.reason[0].toUpperCase()}${v.reason.slice(1)}.` : 'La scelta delle carte è chiusa.'));
    const groups: HTMLElement[] = [];
    const row = (ref: BringRef, label: string, detail: string) => {
      const box = el('input', { type: 'checkbox' }) as HTMLInputElement;
      const warn = el('span', { class: 'warn' });
      box.onchange = () => this.check();
      this.boxes.push({ ref, box, warn });
      return el('label', { class: 'card-to-bring' }, box, el('span', {}, label), el('span', { class: 'note' }, detail), warn);
    };
    const mine = v.handmade.filter((h) => h.mine), others = v.handmade.filter((h) => !h.mine);
    const handmade = (title: string, list: typeof v.handmade) => {
      if (!list.length) return;
      groups.push(el('div', { class: 'section-sub' }, title), ...list.map((h) => row({ handmade: h.id }, h.name, `${KIND_WORD[h.kind]}${h.class ? ` · ${h.class}` : ''}${h.size ? ` · ${h.size}` : ''}${!h.mine && h.signature ? ` · di ${h.signature}` : ''}`)));
    };
    handmade('Le tue carte fatte a mano', mine);
    handmade('Le carte fatte a mano degli altri', others);
    for (const k of v.kin) {
      groups.push(el('div', { class: 'section-sub' }, `Da «${k.name}» (kernel ${k.kernel})`));
      if (!k.ok) groups.push(el('div', { class: 'note' }, k.reason ?? 'le sue carte non vengono'));
      else if (!k.cards.length) groups.push(el('div', { class: 'note' }, 'nessuna carta: ha solo i modelli del seme'));
      else groups.push(...k.cards.map((c) => row({ universe: k.name, model: c.id }, c.name, `${KIND_WORD[c.kind]}${c.class ? ` · ${c.class}` : ''}${c.size ? ` · ${c.size}` : ''}${c.environments?.length ? ` · ${c.environments.join(', ')}` : ''}${c.score !== undefined ? ` · voto ${c.score}` : ''} · ${c.id}`)));
    }
    if (!groups.length) groups.push(el('div', { class: 'note' }, 'Nessun universo parente con carte, e nessuna carta fatta a mano: la Genesi scolpirà tutto.'));
    this.root.replaceChildren(...head, ...groups, this.status);
    this.check();
  }

  /** The doubles said next to the cards, as they are ticked. */
  private check(): void {
    const twice = this.doubles();
    for (const b of this.boxes) b.warn.textContent = b.box.checked && twice.has(broughtId(b.ref)) ? ` ${twice.get(broughtId(b.ref))}` : '';
    const n = this.chosen().length;
    this.status.textContent = twice.size ? 'Due carte con lo stesso id, o un id che questo universo ha già: togline una prima di partire.' : n ? `${n} carte scelte.` : '';
  }
}
