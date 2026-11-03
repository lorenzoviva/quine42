// Multiplayer Lobby (T45d, ADR-0086): displayed before entering a multiplayer universe.
// Shows the master's universe generation coefficients, models, minimums, the entering wanderer's
// credit spending cap (which adds to the universe AI budgets), and their collection of cards with usages.

import { collectionOf } from '../kernel/cards';
import { COEFFICIENT_INFO, COEFFICIENT_KEYS, hourlyEstimate, isLowDetail, pricedAiModels, repairAttore, repairCoefficients } from '../kernel/coefficients';
import { DEFAULT_SCULPTORS, type SculptorAiModels } from '../kernel/agents/sculptor';
import { readConfig } from '../kernel/universe';
import type { FileMap } from '../kernel/types';
import { usd } from '../kernel/ai/prices';
import { el } from './dom';

export interface LobbyOptions {
  name: string;
  files: FileMap;
  wandererId: string;
  wandererName?: string;
  credits: number;
  isAnonymous?: boolean;
  onRecharge?: (amount: number) => Promise<{ ok: boolean; url?: string; motivo?: string }>;
}

export interface LobbyResult {
  tetto: number;
  offline?: boolean;
  /** The Actor (T157), as the master set it in the lobby; only when they changed it. */
  attore?: { acceso: boolean; modello: string };
}

export class LobbyScreen {
  private root: HTMLElement;
  private resolvePromise?: (res: LobbyResult) => void;

  constructor(private opts: LobbyOptions) {
    let root = document.getElementById('lobby');
    if (!root) {
      root = el('div', { id: 'lobby', class: 'lobby-screen' });
      document.body.appendChild(root);
    }
    this.root = root;
    this.root.hidden = true;
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(): Promise<LobbyResult> {
    return new Promise<LobbyResult>((resolve) => {
      this.resolvePromise = resolve;
      this.render();
      this.root.hidden = false;
    });
  }

  close(result: LobbyResult): void {
    this.root.hidden = true;
    this.resolvePromise?.(result);
  }

  private render(): void {
    const { name, files, wandererId, wandererName, credits, isAnonymous } = this.opts;
    const { config } = readConfig(files);
    const ai = config.ai;
    const master = config.partita?.master ?? 'io';
    const minimi = ai.minimi;
    const coef = repairCoefficients(ai.coefficienti);
    const sculpt: SculptorAiModels = { ...DEFAULT_SCULPTORS, ...(ai.scultori ?? {}) };
    const actor = repairAttore(ai.attore);
    // The Actor (T157): everyone sees it; the master, and only the master, sets it here (the server refuses the others).
    const isMaster = wandererId === master;
    const actorOn = el('input', { type: 'checkbox', id: 'lobby-attore' }) as HTMLInputElement;
    actorOn.checked = actor.acceso;
    const actorModel = el('select', { id: 'lobby-attore-modello' }, ...[...new Set([actor.modello, ...pricedAiModels()])].map((m) => el('option', { value: m }, m))) as HTMLSelectElement;
    actorModel.value = actor.modello;
    const estimateRow = el('div', { class: 'estimate-row' });
    const showEstimate = () => {
      const estimate = hourlyEstimate({ ...ai, attore: { acceso: actorOn.checked, modello: actorModel.value } });
      estimateRow.textContent = `Stima oraria: circa ${usd(estimate.dollari)} (${estimate.chiamate} chiamate/ora). Budget sessione: ${ai.maxText} chiamate testo.`;
    };
    actorOn.onchange = showEstimate;
    actorModel.onchange = showEstimate;
    showEstimate();
    actorOn.disabled = !isMaster;
    actorModel.disabled = !isMaster;
    const actorRow = el(
      'div',
      { class: 'actor-row' },
      el('label', { for: 'lobby-attore' }, actorOn, el('strong', {}, ' Attore: '), isMaster ? 'interpreta le persone con le schede del Narratore' : actor.acceso ? `acceso (${actor.modello})` : 'spento: il Narratore interpreta le persone'),
      isMaster ? el('label', { for: 'lobby-attore-modello' }, ' modello ', actorModel) : '',
      el('div', { class: 'note' }, isMaster ? "Spento, nulla cambia e nessuna chiamata in più. Acceso, il Narratore scrive una scheda per persona alla sua prima battuta e l'Attore la interpreta con il suo modello." : 'Lo stabilisce il master.'),
    );

    // Cards collection outside of the match (T45d)
    const cards = collectionOf(files, wandererId);
    const totalUses = cards.reduce((s, c) => s + c.utilizzi.luoghi + c.utilizzi.trame + c.utilizzi.prompt, 0);

    // Master settings block
    const presetLabel = isLowDetail(coef)
      ? 'Low Detail (a risparmio)'
      : COEFFICIENT_KEYS.every((k) => coef[k] === 1)
        ? 'Pieno dettaglio'
        : 'Su misura';

    const coefItems = COEFFICIENT_KEYS.map((k) =>
      el(
        'span',
        { class: 'badge' },
        `${COEFFICIENT_INFO[k].nome}: ${coef[k].toFixed(2)}`,
      ),
    );

    const masterBlock = el(
      'div',
      { class: 'lobby-section master-settings' },
      el('div', { class: 'section-title' }, 'Impostazioni dell’universo (stabilite dal master)'),
      el(
        'div',
        { class: 'row' },
        el('div', {}, el('strong', {}, 'Dettaglio: '), presetLabel),
        el('div', {}, el('strong', {}, 'Modello Concilio: '), ai.textModel),
      ),
      el(
        'div',
        { class: 'sculpt-row' },
        el('strong', {}, 'Modelli Scultore: '),
        `semplice (${sculpt.semplice}) · figure (${sculpt.figura}) · strutture (${sculpt.struttura}) · importanti (${sculpt.importante}) · artista (${sculpt.artista})`,
      ),
      el('div', { class: 'coef-list' }, el('strong', {}, 'Coefficienti: '), ...coefItems),
      actorRow,
      estimateRow,
    );

    // Minimi block (if set)
    let minimiBlock: HTMLElement | null = null;
    if (minimi) {
      const items: HTMLElement[] = [];
      if (minimi.textModel) items.push(el('div', {}, `Modello testo minimo: ${minimi.textModel}`));
      if (minimi.scultori?.struttura) items.push(el('div', {}, `Strutture minime: ${minimi.scultori.struttura}`));
      if (minimi.tetto !== undefined) items.push(el('div', {}, `Tetto minimo d’ingresso: ${usd(minimi.tetto)}`));
      if (minimi.coefficienti) {
        items.push(el('div', {}, 'Coefficienti minimi imposti dal master'));
      }
      if (items.length) {
        minimiBlock = el(
          'div',
          { class: 'lobby-section minimi-settings' },
          el('div', { class: 'section-title' }, 'Requisiti minimi fissati dal master'),
          ...items,
        );
      }
    }

    // Wanderer & Tetto block
    const tettoMin = minimi?.tetto ?? 0;
    const defaultTetto = isAnonymous ? 0 : Math.max(tettoMin, Math.min(1.0, credits > 0 ? credits : 1.0));
    const tettoInput = el('input', {
      type: 'number',
      min: String(tettoMin),
      step: '0.5',
      value: defaultTetto.toFixed(2),
    }) as HTMLInputElement;
    if (isAnonymous) tettoInput.disabled = true;

    const setTetto = (v: number) => {
      tettoInput.value = Math.max(tettoMin, v).toFixed(2);
    };

    const preset1 = el('button', { type: 'button' }, '$1.00');
    preset1.onclick = () => setTetto(1.0);
    const preset2 = el('button', { type: 'button' }, '$2.00');
    preset2.onclick = () => setTetto(2.0);
    const preset5 = el('button', { type: 'button' }, '$5.00');
    preset5.onclick = () => setTetto(5.0);
    const presetAll = el('button', { type: 'button' }, 'Tutto il saldo');
    presetAll.onclick = () => setTetto(credits);

    const statusEl = el('div', { class: 'lobby-status' });

    const wandererBlock = el(
      'div',
      { class: 'lobby-section wanderer-settings' },
      el('div', { class: 'section-title' }, 'Il tuo ingresso'),
      el(
        'div',
        { class: 'wanderer-info' },
        el('div', {}, el('strong', {}, 'Viandante: '), `${wandererName ?? wandererId} (${wandererId})`),
        el(
          'div',
          {},
          el('strong', {}, 'Saldo crediti: '),
          isAnonymous ? '0.00 $ (Account anonimo: modelli locali)' : usd(credits),
        ),
      ),
      el(
        'div',
        { class: 'tetto-form' },
        el('label', {}, el('strong', {}, 'Tetto di spesa per questa sessione: ')),
        el('div', { class: 'tetto-controls' }, tettoInput, preset1, preset2, preset5, presetAll),
        el(
          'div',
          { class: 'note' },
          'Il tetto stabilisce la spesa massima autorizzata per questa sessione e si somma ai budget di IA dell’universo. Se esaurito durante il gioco, continuerai a giocare offline con i modelli locali.',
        ),
      ),
    );

    // Cards Collection block outside match (T45d)
    const cardsList = el('div', { class: 'cards-list', hidden: '' });
    const toggleCards = el('button', { type: 'button' }, 'Mostra carte');
    toggleCards.onclick = () => {
      const isHidden = cardsList.hidden;
      cardsList.hidden = !isHidden;
      toggleCards.textContent = isHidden ? 'Nascondi carte' : 'Mostra carte';
    };

    if (cards.length === 0) {
      cardsList.appendChild(
        el('div', { class: 'note' }, 'Non possiedi ancora nessuna carta in questo universo. Genera ed esplora per collezionarle!'),
      );
    } else {
      for (const c of cards) {
        const u = c.utilizzi;
        const usesStr = `Utilizzi: ${u.luoghi} luoghi, ${u.trame} trame, ${u.prompt} prompt (totale: ${u.luoghi + u.trame + u.prompt})`;
        const item = el(
          'div',
          { class: 'card-entry' },
          el('div', { class: 'card-header' }, el('span', { class: 'card-kind' }, `[${c.tipo}]`), el('span', { class: 'card-id' }, c.nome ? `${c.nome} (${c.id})` : c.id)),
          el('div', { class: 'card-meta' }, `Autore: ${c.autore} · Pagante: ${c.pagante}`),
          el('div', { class: 'card-uses' }, usesStr),
        );
        cardsList.appendChild(item);
      }
    }

    const cardsBlock = el(
      'div',
      { class: 'lobby-section cards-section' },
      el(
        'div',
        { class: 'cards-header-row' },
        el('div', { class: 'section-title' }, `La tua collezione di carte (${cards.length} carte · ${totalUses} utilizzi)`),
        toggleCards,
      ),
      cardsList,
    );

    // Action buttons
    const btnEnter = el('button', { class: 'primary' }, 'Entra nel mondo');
    btnEnter.onclick = () => {
      const tetto = isAnonymous ? 0 : Number(tettoInput.value) || 0;
      if (tetto < tettoMin) {
        statusEl.textContent = `Il master richiede un tetto minimo di ${usd(tettoMin)} per entrare.`;
        return;
      }
      const changed = isMaster && (actorOn.checked !== actor.acceso || actorModel.value !== actor.modello);
      this.close({ tetto, ...(changed ? { attore: { acceso: actorOn.checked, modello: actorModel.value } } : {}) });
    };

    const btnOffline = el('button', {}, 'Gioca offline (modelli locali)');
    btnOffline.onclick = () => {
      this.close({ tetto: 0, offline: true });
    };

    const btnRecharge = el('button', {}, 'Ricarica crediti');
    if (isAnonymous || !this.opts.onRecharge) {
      btnRecharge.hidden = true;
    } else {
      btnRecharge.onclick = async () => {
        statusEl.textContent = 'Creazione sessione Stripe in corso…';
        try {
          const res = await this.opts.onRecharge!(5);
          if (res.url) {
            window.location.href = res.url;
          } else {
            statusEl.textContent = res.motivo ?? 'Impossibile avviare il pagamento.';
          }
        } catch (e) {
          statusEl.textContent = `Errore: ${(e as Error).message}`;
        }
      };
    }

    const actions = el('div', { class: 'lobby-actions' }, btnEnter, btnOffline, btnRecharge);

    const windowBox = el(
      'div',
      { class: 'lobby-window' },
      el('div', { class: 'lobby-logo' }, 'ᚱ ᚢ ᚾ ᛖ'),
      el('h1', {}, 'LOBBY MULTIGIOCATORE'),
      el('div', { class: 'lobby-sub' }, `Universo «${name}» · Master: ${master}`),
      masterBlock,
      ...(minimiBlock ? [minimiBlock] : []),
      wandererBlock,
      cardsBlock,
      statusEl,
      actions,
    );

    this.root.replaceChildren(windowBox);
  }
}
