// The lobby (T45d, ADR-0086; T247, ADR-0132): what comes before entering. It shows the master's settings to everyone and lets the
// master, and only the master, set every knob of the consumption while no match is under way: preset, coefficients, models, budgets and
// minimums, with the estimate of an hour following the values. What it sets goes in with the master (`entra`): the server repairs it, refuses
// it to anyone else and during a match. Then the entering wanderer's ceiling (which adds to the budgets) and their cards. Alone
// (`alone`) it is the same screen without what is about other people.

import { collectionOf } from '../kernel/cards';
import { COEFFICIENT_INFO, COEFFICIENT_KEYS, FULL_DETAIL, hourlyEstimate, isLowDetail, LOW_DETAIL, pricedAiModels, repairActor, repairCoefficients, type CoefficientKey } from '../kernel/coefficients';
import { DEFAULT_SCULPTORS, type SculptorAiModels } from '../kernel/agents/sculptor';
import { BUDGET_KEYS, BUDGET_SCALE, readConfig, SCULPTOR_CLASSES, withinMinimums, type BudgetKey } from '../kernel/universe';
import type { AiSettings, FileMap } from '../kernel/types';
import { usd } from '../kernel/ai/prices';
import { el } from './dom';

export interface LobbyOptions {
  name: string;
  files: FileMap;
  wandererId: string;
  wandererName?: string;
  credits: number;
  isAnonymous?: boolean;
  /** A match is under way in this universe: the settings are shown and do not change, for the master too (T247). */
  inCorso?: boolean;
  /** A game alone: only the settings, there is no ceiling, no recharge and nobody else (T247). */
  alone?: boolean;
  onRecharge?: (amount: number) => Promise<{ ok: boolean; url?: string; motivo?: string }>;
}

export interface LobbyResult {
  tetto: number;
  offline?: boolean;
  /** What the master set here (T247); only when they changed something. */
  regolazioni?: AiSettings;
}

const BUDGET_NAMES: Record<BudgetKey, string> = {
  maxText: 'Chiamate di testo per sessione',
  maxForges: 'Fucine per sessione',
  maxPacks: 'Pacchetti di oggetti per sessione',
  maxCast: 'Tipi di abitanti per sessione',
  maxModels: 'Modelli per sessione',
  maxBrani: 'Brani per sessione',
  placesPerMinute: 'Luoghi nuovi al minuto',
};
const BUDGET_DEFAULTS: Partial<Record<BudgetKey, number>> = { maxPacks: 4, maxCast: 3, maxModels: 40, maxBrani: 8, placesPerMinute: 20 };
const CLASS_NAMES: Record<(typeof SCULPTOR_CLASSES)[number], string> = { semplice: 'Scultore, cose semplici', figura: 'Scultore, figure', struttura: 'Scultore, strutture', importante: 'Scultore, strutture importanti', artista: 'Artista (giudizio)', musicista: 'Musicista' };
const THINKING: Array<[string, string]> = [['off', 'predefinito del modello'], ['low', 'basso'], ['medium', 'medio'], ['high', 'alto']];

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
    const { name, files, wandererId, wandererName, credits, isAnonymous, inCorso, alone } = this.opts;
    const { config } = readConfig(files);
    const ai = config.ai;
    const master = config.partita?.master ?? 'io';
    const minimi = ai.minimi;
    const coef = repairCoefficients(ai.coefficienti);
    const sculpt: SculptorAiModels = { ...DEFAULT_SCULPTORS, ...(ai.scultori ?? {}) };
    const actor = repairActor(ai.attore);
    // Everyone sees the settings; the master, and only the master, sets them, while no match is under way (the server refuses the rest).
    const isMaster = !!alone || wandererId === master;
    const editable = isMaster && !inCorso;
    const lockIf = <T extends HTMLInputElement | HTMLSelectElement>(c: T): T => {
      c.disabled = !editable;
      return c;
    };
    const estimateRow = el('div', { class: 'estimate-row' });
    const estimateLines = el('div', { class: 'note' });
    let read: () => AiSettings = () => ({});
    const showEstimate = () => {
      const h = hourlyEstimate(withinMinimums({ ...ai, ...read() } as typeof ai));
      const budget = (read().maxText as number | undefined) ?? ai.maxText;
      estimateRow.textContent = `Stima oraria: circa ${usd(h.dollari)} (${h.chiamate} chiamate/ora). Budget sessione: ${budget} chiamate testo.`;
      estimateLines.replaceChildren(...h.righe.map((x) => el('div', {}, `· ${x.voce}: ${x.chiamate} → ${usd(x.dollari)}`)));
    };
    const pick = (value: string, id: string, extra: string[] = []) => {
      const s = lockIf(el('select', { id }, ...extra.map((m) => el('option', { value: m }, m || 'nessuno')), ...[...new Set([value, ...pricedAiModels()])].filter((m) => m && !extra.includes(m)).map((m) => el('option', { value: m }, m))) as HTMLSelectElement);
      s.value = value;
      s.onchange = showEstimate;
      return s;
    };
    const field = (label: string, control: Node | string) => el('label', {}, label, control);

    // The Actor (T157).
    const actorOn = lockIf(el('input', { type: 'checkbox', id: 'lobby-attore' }) as HTMLInputElement);
    actorOn.checked = actor.acceso;
    actorOn.onchange = showEstimate;
    const actorModel = pick(actor.modello, 'lobby-attore-modello');
    const actorRow = el(
      'div',
      { class: 'actor-row' },
      el('label', { for: 'lobby-attore' }, actorOn, el('strong', {}, ' Attore: '), isMaster ? 'interpreta gli individui con le schede del Narratore' : actor.acceso ? `acceso (${actor.modello})` : 'spento: il Narratore interpreta le persone'),
      isMaster ? el('label', { for: 'lobby-attore-modello' }, ' modello ', actorModel) : '',
      el('div', { class: 'note' }, isMaster ? "Spento, nulla cambia e nessuna chiamata in più. Acceso, il Narratore scrive una scheda per individuo alla sua prima battuta e l'Attore la interpreta con il suo modello." : 'Lo stabilisce il master.'),
    );

    // Cards collection outside of the match (T45d)
    const cards = collectionOf(files, wandererId);
    const totalUses = cards.reduce((s, c) => s + c.utilizzi.luoghi + c.utilizzi.trame + c.utilizzi.prompt, 0);

    // The coefficients: what each does, and what the game does at the minimum, for everyone to read.
    const sliders = new Map<CoefficientKey, HTMLInputElement>();
    const values = new Map<CoefficientKey, HTMLElement>();
    const preset = lockIf(el('select', { id: 'lobby-preset' }, el('option', { value: 'pieno' }, 'Pieno dettaglio'), el('option', { value: 'low' }, 'Low Detail (a risparmio)'), el('option', { value: 'misura' }, 'Su misura')) as HTMLSelectElement);
    const knobs = COEFFICIENT_KEYS.map((k) => {
      const info = COEFFICIENT_INFO[k];
      const slider = lockIf(el('input', { type: 'range', min: '0', max: '1', step: '0.05', id: `lobby-knob-${k}` }) as HTMLInputElement);
      slider.value = String(coef[k]);
      sliders.set(k, slider);
      const value = el('span', { class: 'knob-value' }, coef[k].toFixed(2));
      values.set(k, value);
      slider.oninput = () => {
        value.textContent = Number(slider.value).toFixed(2);
        showPreset();
        showEstimate();
      };
      return el('label', { class: 'knob', title: info.testo }, el('span', { class: 'knob-name' }, info.nome), slider, value, el('span', { class: 'note' }, `A 0: ${info.minimo}.`));
    });

    // The models.
    const text = pick(ai.textModel, 'lobby-modello-testo');
    const sculptors = new Map(SCULPTOR_CLASSES.map((k) => [k, pick(String(sculpt[k]), `lobby-scultore-${k}`)]));
    const thinking = lockIf(el('select', { id: 'lobby-ragionamento' }, ...THINKING.map(([v, n]) => el('option', { value: v }, n))) as HTMLSelectElement);
    thinking.value = ai.thinking ?? 'low';
    thinking.onchange = showEstimate;

    // The budgets: numbers for who sets them, words for who reads them (a player has only one field to fill: the ceiling).
    const budgetOf = (k: BudgetKey): number => (ai[k] as number | undefined) ?? BUDGET_DEFAULTS[k] ?? 0;
    const budgets = new Map<BudgetKey, HTMLInputElement>();
    const budgetRows = BUDGET_KEYS.map((k) => {
      if (!isMaster) return el('div', {}, `${BUDGET_NAMES[k]}: ${budgetOf(k)}`);
      const input = lockIf(el('input', { type: 'number', id: `lobby-budget-${k}`, min: String(BUDGET_SCALE[k][0]), max: String(BUDGET_SCALE[k][1]), step: '1', value: String(budgetOf(k)) }) as HTMLInputElement);
      input.oninput = showEstimate;
      budgets.set(k, input);
      return field(BUDGET_NAMES[k], input);
    });

    // The minimums: the master's to set; for everyone else, what is asked of them (below).
    const minText = pick(minimi?.textModel ?? '', 'lobby-minimo-testo', ['']);
    const minSculptors = new Map(SCULPTOR_CLASSES.map((k) => [k, pick(String(minimi?.scultori?.[k] ?? ''), `lobby-minimo-${k}`, [''])]));
    const minCapField = lockIf(el('input', { type: 'number', id: 'lobby-minimo-tetto', min: '0', step: '0.5', value: String(minimi?.tetto ?? 0) }) as HTMLInputElement);
    const minKnobs = new Map(
      COEFFICIENT_KEYS.map((k) => {
        const input = lockIf(el('input', { type: 'number', id: `lobby-minimo-${k}`, min: '0', max: '1', step: '0.05', value: minimi?.coefficienti?.[k] !== undefined ? String(minimi.coefficienti[k]) : '' }) as HTMLInputElement);
        input.oninput = showEstimate;
        return [k, input];
      }),
    );
    minCapField.oninput = showEstimate;

    read = () => {
      const number = (v: string) => (v.trim() === '' ? undefined : Number(v));
      const minScult = Object.fromEntries([...minSculptors].filter(([, s]) => s.value).map(([k, s]) => [k, s.value]));
      const minCoef = Object.fromEntries([...minKnobs].flatMap(([k, i]) => (number(i.value) === undefined ? [] : [[k, number(i.value)]])));
      return {
        textModel: text.value,
        thinking: thinking.value as AiSettings['thinking'],
        attore: { acceso: actorOn.checked, modello: actorModel.value },
        scultori: { ...Object.fromEntries([...sculptors].map(([k, s]) => [k, s.value])), importanteFino: sculpt.importanteFino } as Partial<SculptorAiModels>,
        coefficienti: Object.fromEntries([...sliders].map(([k, s]) => [k, Number(s.value)])) as AiSettings['coefficienti'],
        ...Object.fromEntries([...budgets].map(([k, i]) => [k, Number(i.value)])),
        minimi: {
          ...(minText.value ? { textModel: minText.value } : {}),
          ...(Object.keys(minScult).length ? { scultori: minScult } : {}),
          ...(Number(minCapField.value) > 0 ? { tetto: Number(minCapField.value) } : {}),
          ...(Object.keys(minCoef).length ? { coefficienti: minCoef } : {}),
        },
      };
    };

    const showPreset = () => {
      const c = Object.fromEntries([...sliders].map(([k, s]) => [k, Number(s.value)])) as Record<CoefficientKey, number>;
      preset.value = isLowDetail(c) ? 'low' : COEFFICIENT_KEYS.every((k) => c[k] === 1) ? 'pieno' : 'misura';
    };
    preset.onchange = () => {
      const chosen = preset.value === 'low' ? LOW_DETAIL : preset.value === 'pieno' ? { coefficienti: FULL_DETAIL, scultori: DEFAULT_SCULPTORS as Partial<SculptorAiModels> } : undefined;
      if (!chosen) return;
      for (const [k, s] of sliders) {
        s.value = String(chosen.coefficienti[k]);
        values.get(k)!.textContent = chosen.coefficienti[k].toFixed(2);
      }
      for (const [k, s] of sculptors) if (chosen.scultori[k]) s.value = String(chosen.scultori[k]);
      showEstimate();
    };
    showPreset();
    showEstimate();
    /** What the master found on opening, to send only what they changed. */
    const opened = JSON.stringify(read());

    const lockedNote = inCorso ? 'La partita è in corso: le regolazioni restano queste per chiunque, anche per il master. Si possono cambiare quando nel mondo non c’è più nessuno.' : '';
    const howLong = alone ? 'Si fissano entrando: durante la partita non cambiano. Si regolano di nuovo la prossima volta che apri questo universo.' : 'Si fissano entrando: durante la partita nessuno le cambia, nemmeno il master. Si regolano di nuovo quando nel mondo non c’è più nessuno.';
    const masterBlock = el(
      'div',
      { class: 'lobby-section master-settings' },
      el('div', { class: 'section-title' }, alone ? 'Le regolazioni del consumo' : 'Impostazioni dell’universo (stabilite dal master)'),
      lockedNote ? el('div', { class: 'locked-note' }, lockedNote) : el('div', { class: 'note' }, isMaster ? howLong : `Le stabilisce il master. ${howLong}`),
      estimateRow,
      el('div', { class: 'settings-grid' }, field('Dettaglio', preset), field('Modello del Concilio', text), field('Ragionamento', thinking)),
      el('div', { class: 'settings-title' }, 'Modelli'),
      el('div', { class: 'settings-grid sculpt-row' }, ...SCULPTOR_CLASSES.map((k) => field(CLASS_NAMES[k], sculptors.get(k)!))),
      actorRow,
      el('div', { class: 'settings-title' }, 'Quanto spesso si chiede ai modelli (0: mai; 1: sempre)'),
      el('div', { class: 'knobs coef-list' }, ...knobs),
      el('div', { class: 'settings-title' }, 'Budget'),
      el('div', { class: 'settings-grid' }, ...budgetRows),
      el('details', {}, el('summary', {}, 'Da dove viene la stima'), estimateLines),
      isMaster && !alone
        ? el(
            'details',
            {},
            el('summary', {}, 'Requisiti minimi per chi entra'),
            el('div', { class: 'note' }, 'Né tu né chi entra scendete sotto questi valori: un modello non più economico, una manopola non più bassa, un tetto d’ingresso non più piccolo. Vuoto: nessun minimo.'),
            el('div', { class: 'settings-grid' }, field('Tetto minimo d’ingresso', minCapField), field('Modello del Concilio', minText), ...SCULPTOR_CLASSES.map((k) => field(CLASS_NAMES[k], minSculptors.get(k)!)), ...COEFFICIENT_KEYS.map((k) => field(COEFFICIENT_INFO[k].nome, minKnobs.get(k)!))),
          )
        : '',
    );

    // Minimi block (if set): what the master asks of whoever enters.
    let minimumsBlock: HTMLElement | null = null;
    if (minimi && !isMaster) {
      const items: HTMLElement[] = [];
      if (minimi.textModel) items.push(el('div', {}, `Modello testo minimo: ${minimi.textModel}`));
      if (minimi.scultori?.struttura) items.push(el('div', {}, `Strutture minime: ${minimi.scultori.struttura}`));
      if (minimi.tetto !== undefined) items.push(el('div', {}, `Tetto minimo d’ingresso: ${usd(minimi.tetto)}`));
      if (minimi.coefficienti) {
        items.push(el('div', {}, 'Coefficienti minimi imposti dal master'));
      }
      if (items.length) {
        minimumsBlock = el(
          'div',
          { class: 'lobby-section minimi-settings' },
          el('div', { class: 'section-title' }, 'Requisiti minimi fissati dal master'),
          ...items,
        );
      }
    }

    // Wanderer & Tetto block
    const minCap = editable ? Math.max(0, Number(minCapField.value) || 0) : (minimi?.tetto ?? 0);
    const defaultCap = isAnonymous ? 0 : Math.max(minCap, Math.min(1.0, credits > 0 ? credits : 1.0));
    const capInput = el('input', {
      type: 'number',
      min: String(minCap),
      step: '0.5',
      value: defaultCap.toFixed(2),
    }) as HTMLInputElement;
    if (isAnonymous) capInput.disabled = true;

    const setCap = (v: number) => {
      capInput.value = Math.max(minCap, v).toFixed(2);
    };

    const preset1 = el('button', { type: 'button' }, '$1.00');
    preset1.onclick = () => setCap(1.0);
    const preset2 = el('button', { type: 'button' }, '$2.00');
    preset2.onclick = () => setCap(2.0);
    const preset5 = el('button', { type: 'button' }, '$5.00');
    preset5.onclick = () => setCap(5.0);
    const presetAll = el('button', { type: 'button' }, 'Tutto il saldo');
    presetAll.onclick = () => setCap(credits);

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
        el('div', { class: 'tetto-controls' }, capInput, preset1, preset2, preset5, presetAll),
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
    const btnEnter = el('button', { class: 'primary comic-btn arcade' }, 'Entra nel mondo');
    btnEnter.onclick = () => {
      const tetto = isAnonymous || alone ? 0 : Number(capInput.value) || 0;
      if (!alone && tetto < minCap) {
        statusEl.textContent = `Il master richiede un tetto minimo di ${usd(minCap)} per entrare.`;
        return;
      }
      const now = read();
      this.close({ tetto, ...(editable && JSON.stringify(now) !== opened ? { regolazioni: now } : {}) });
    };

    const btnOffline = el('button', { class: 'comic-btn cyan' }, 'Gioca offline (modelli locali)');
    btnOffline.onclick = () => {
      this.close({ tetto: 0, offline: true });
    };

    const btnRecharge = el('button', { class: 'comic-btn pink' }, 'Ricarica crediti');
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

    const actions = alone ? el('div', { class: 'lobby-actions' }, btnEnter) : el('div', { class: 'lobby-actions' }, btnEnter, btnOffline, btnRecharge);

    const windowBox = el(
      'div',
      { class: 'lobby-window' },
      el('div', { class: 'lobby-logo' }, 'ᚱ ᚢ ᚾ ᛖ'),
      el('h1', { class: 'comic-title' }, alone ? 'PRIMA DI ENTRARE' : 'LOBBY MULTIGIOCATORE'),
      el('div', { class: 'lobby-sub' }, alone ? `Universo «${name}»` : `Universo «${name}» · Master: ${master}`),
      masterBlock,
      ...(minimumsBlock ? [minimumsBlock] : []),
      ...(alone ? [] : [wandererBlock, cardsBlock]),
      statusEl,
      actions,
    );

    this.root.replaceChildren(windowBox);
  }
}
