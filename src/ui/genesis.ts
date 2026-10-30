// Genesis screen: the player gives a theme and chooses the game (how punishing death is, the mode, PvP,
// «Altro…» between players: fixed forever after, ADR-0053) and the detail of generation with the agents' models (T45b:
// how often every agent asks the model, «Low Detail» to save, what an hour of play costs); the Council generates the
// universe while they watch.

import type { FeedEntry } from '../kernel/agents/council';
import type { Kernel } from '../kernel/kernel';
import { DEATH_LEVELS } from '../kernel/partita';
import type { AiConfig, Partita } from '../kernel/types';
import { COEFFICIENT_INFO, COEFFICIENT_KEYS, CENSUS, FULL_DETAIL, hourlyEstimate, isLowDetail, LOW_DETAIL, pricedModels, type Coefficients } from '../kernel/coefficients';
import { DEFAULT_SCULPTORS, type SculptorModels } from '../kernel/agents/sculptor';
import { usd } from '../kernel/ai/prices';
import { feedLine } from './feed';
import { $, el } from './dom';

export class GenesisScreen {
  private root = $('#genesis');

  constructor(private k: Kernel) {}

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  /**
   * The choices of the game: free before the first Genesis, shown and locked after. `read` gives what
   * is chosen.
   */
  private gameForm(): { form: HTMLElement; read: () => Partita; lock: (on: boolean) => void } {
    const now = this.k.partita();
    const free = this.k.needsGenesis();
    const death = el('input', { type: 'range', min: '0', max: String(DEATH_LEVELS.length - 1), step: '1' }) as HTMLInputElement;
    death.value = String(now.morte);
    const deathText = el('div', { class: 'note' });
    const showDeath = () => {
      const d = DEATH_LEVELS[Number(death.value)];
      deathText.textContent = `${death.value} · ${d.nome}: ${d.testo}.`;
    };
    death.oninput = showDeath;
    showDeath();
    const mode = el('select', {}, el('option', { value: 'singola' }, 'singola'), el('option', { value: 'multigiocatore' }, 'multigiocatore')) as HTMLSelectElement;
    mode.value = now.modalita;
    const check = (on: boolean) => {
      const c = el('input', { type: 'checkbox' }) as HTMLInputElement;
      c.checked = on;
      return c;
    };
    const pvp = check(now.pvp);
    const other = check(now.altroTraGiocatori);
    const lock = (on: boolean) => {
      for (const c of [death, mode]) c.disabled = on || !free;
      // PvP and «Altro…» between players only mean something with more than one player.
      for (const c of [pvp, other]) c.disabled = on || !free || mode.value !== 'multigiocatore';
    };
    mode.onchange = () => lock(false);
    lock(false);
    const form = el(
      'div',
      { class: 'game' },
      el('div', { class: 'section' }, 'La partita'),
      el('div', { class: 'note' }, free ? 'Si sceglie adesso, per sempre: il Concilio costruirà il mondo su queste regole.' : 'Scelta alla prima Genesi di questo universo: non cambia più.'),
      el('label', {}, 'Quanto è punitiva la morte', death),
      deathText,
      el('label', {}, 'Modalità', mode),
      el('div', { class: 'row' }, el('label', {}, pvp, 'PvP: i viandanti possono ferirsi'), el('label', {}, other, '«Altro…» anche su un altro viandante')),
      el('div', { class: 'note' }, 'Il multigiocatore arriverà: per ora ogni universo si gioca da soli, ma la scelta resta.'),
    );
    return { form, read: () => ({ modalita: mode.value === 'multigiocatore' ? 'multigiocatore' : 'singola', morte: Number(death.value), pvp: pvp.checked, altroTraGiocatori: other.checked }), lock };
  }

  /**
   * The detail of generation (T45b): a preset, a coefficient per rhythm of the Council, the agents' models, and what an
   * hour of play costs with them. Unlike the game it can change later. `read` gives what goes into universe.json → ai.
   */
  private aiForm(): { form: HTMLElement; read: () => Pick<AiConfig, 'textModel' | 'scultori' | 'coefficienti'>; lock: (on: boolean) => void } {
    const ai = this.k.config.ai;
    const coef: Coefficients = this.k.coefficients();
    const sculptors: SculptorModels = this.k.sculptors();
    const models = pricedModels();
    const pick = (value: string) => {
      const s = el('select', {}, ...[...new Set([value, ...models])].map((m) => el('option', { value: m }, m))) as HTMLSelectElement;
      s.value = value;
      return s;
    };
    const text = pick(ai.textModel);
    const classes: Array<[keyof SculptorModels, string]> = [['semplice', 'cose semplici'], ['figura', 'figure'], ['struttura', 'strutture'], ['importante', 'strutture importanti'], ['artista', 'Artista (giudizio)']];
    const sculpt = new Map(classes.map(([k]) => [k, pick(String(sculptors[k]))]));
    const sliders = new Map<keyof Coefficients, HTMLInputElement>();
    const preset = el('select', {}, el('option', { value: 'pieno' }, 'Pieno dettaglio'), el('option', { value: 'low' }, 'Low Detail (a risparmio)'), el('option', { value: 'misura' }, 'Su misura')) as HTMLSelectElement;
    const estimate = el('div', { class: 'note' });
    const read = (): Pick<AiConfig, 'textModel' | 'scultori' | 'coefficienti'> => ({
      textModel: text.value,
      scultori: { ...Object.fromEntries([...sculpt].map(([k, s]) => [k, s.value])), importanteFino: sculptors.importanteFino } as Partial<SculptorModels>,
      coefficienti: Object.fromEntries([...sliders].map(([k, s]) => [k, Number(s.value)])) as Coefficients,
    });
    const show = () => {
      const r = read();
      const c = r.coefficienti as Coefficients;
      preset.value = isLowDetail(c) ? 'low' : COEFFICIENT_KEYS.every((k) => c[k] === 1) ? 'pieno' : 'misura';
      for (const s of sliders.values()) (s.nextElementSibling as HTMLElement).textContent = Number(s.value).toFixed(2);
      const h = hourlyEstimate({ ...ai, ...r });
      const fixed = h.righe.filter((x) => x.modo === 'non regolabile');
      estimate.replaceChildren(
        el('div', {}, `Un'ora di gioco costa circa ${usd(h.dollari)} (${h.chiamate} chiamate), con ${ai.maxText} chiamate al più per sessione.`),
        ...h.righe.map((x) => el('div', {}, `· ${x.voce} (${x.modo}): ${x.chiamate} → ${usd(x.dollari)}`)),
        el('div', {}, `Non si regolano (${fixed.map((x) => x.voce.toLowerCase()).join('; ')}): ${CENSUS.filter((c) => c.modo === 'non regolabile').length} compiti su ${CENSUS.length}, si pagano quando servono.`),
      );
    };
    const rows = COEFFICIENT_KEYS.map((key) => {
      const info = COEFFICIENT_INFO[key];
      const s = el('input', { type: 'range', min: '0', max: '1', step: '0.05' }) as HTMLInputElement;
      s.value = String(coef[key]);
      s.oninput = show;
      sliders.set(key, s);
      return el('label', { title: `${info.agente}, regolazione ${info.modo}: ${info.testo}` }, `${info.nome}`, s, el('span', {}, ''));
    });
    preset.onchange = () => {
      const c = preset.value === 'low' ? LOW_DETAIL.coefficienti : preset.value === 'pieno' ? FULL_DETAIL : undefined;
      if (!c) return;
      for (const [k, s] of sliders) s.value = String(c[k]);
      const models: Partial<SculptorModels> = preset.value === 'low' ? LOW_DETAIL.scultori : DEFAULT_SCULPTORS;
      for (const [k, s] of sculpt) if (models[k]) s.value = String(models[k]);
      show();
    };
    for (const s of [text, ...sculpt.values()]) s.onchange = show;
    show();
    const form = el(
      'div',
      { class: 'game' },
      el('div', { class: 'section' }, 'Il dettaglio e i modelli'),
      el('div', { class: 'note' }, "Quanto spesso ogni agente del Concilio interroga l'IA (1: sempre come serve; 0: mai). Si può cambiare anche dopo."),
      el('label', {}, 'Dettaglio', preset),
      ...rows,
      el('label', {}, 'Modello del Concilio', text),
      el('div', { class: 'row' }, ...classes.map(([k, name]) => el('label', {}, `Scultore, ${name}`, sculpt.get(k)!))),
      estimate,
    );
    return { form, read, lock: (on) => [preset, text, ...sculpt.values(), ...sliders.values()].forEach((c) => (c.disabled = on)) };
  }

  /** Resolves when the player has a world to play (generated or the example one). */
  show(canGenerate: boolean): Promise<void> {
    return new Promise((resolve) => {
      const theme = el('textarea', { rows: '7', spellcheck: 'false' }) as HTMLTextAreaElement;
      theme.value = (this.k.files[this.k.config.theme] ?? '').trim();
      const go = el('button', { class: 'primary' }, canGenerate ? 'Genera il mondo con Gemini' : 'Gemini non disponibile');
      const skip = el('button', {}, "Gioca l'universo di esempio");
      if (!canGenerate) go.setAttribute('disabled', '');
      const game = this.gameForm();
      const detail = this.aiForm();
      const cost = el(
        'div',
        { class: 'note' },
        canGenerate
          ? `Il Concilio (${this.k.config.ai.textModel}) scriverà bibbia, stile, terreni, ambienti, decine di oggetti e i primi abitanti (circa 60 chiamate di testo, economiche). Niente immagini: ogni cosa sarà un modello scritto in regole.`
          : 'Manca GEMINI_API_KEY nel file .env, oppure il server non è quello di Vite. Puoi giocare offline: i luoghi saranno abbozzati e gli agenti risponderanno con un modello locale.',
      );
      const feed = el('div', { class: 'feed' });
      const status = el('div', { class: 'status' });
      const off = this.k.bus.on('council', (e: FeedEntry) => {
        feed.append(feedLine(e));
        feed.scrollTop = feed.scrollHeight;
      });
      skip.onclick = () => {
        this.k.setAi(detail.read());
        off();
        this.root.hidden = true;
        resolve();
      };
      go.onclick = async () => {
        go.setAttribute('disabled', '');
        skip.setAttribute('disabled', '');
        theme.setAttribute('disabled', '');
        game.lock(true);
        detail.lock(true);
        this.k.setAi(detail.read());
        this.root.classList.add('running');
        const ok = await this.k.runGenesis(theme.value, (step) => (status.textContent = step), game.read());
        status.textContent = ok ? 'Il mondo è pronto.' : 'La genesi è fallita: puoi riprovare o giocare l\'universo di esempio.';
        if (ok) {
          setTimeout(() => {
            off();
            this.root.hidden = true;
            resolve();
          }, 1500);
        } else {
          go.removeAttribute('disabled');
          skip.removeAttribute('disabled');
          theme.removeAttribute('disabled');
          game.lock(false);
          detail.lock(false);
          this.root.classList.remove('running');
        }
      };
      this.root.replaceChildren(
        el(
          'div',
          { class: 'window' },
          el('div', { class: 'logo' }, 'ᚱ ᚢ ᚾ ᛖ'),
          el('h1', {}, 'Genesi'),
          el('div', { class: 'note' }, 'Descrivi il mondo che vuoi. Il tappeto, le rune e la corona ci saranno comunque: sono le costanti di ogni universo.'),
          theme,
          game.form,
          detail.form,
          cost,
          el('div', { class: 'actions' }, go, skip),
          status,
          feed,
        ),
      );
      this.root.hidden = false;
    });
  }
}
