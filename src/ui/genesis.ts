// Genesis screen: the player gives a theme and chooses the game (how punishing death is, the mode, PvP,
// «Altro…» between players: fixed forever after, ADR-0053) and the detail of generation with the agents' models (T45b, ADR-0085:
// how often every agent asks the model, «Low Detail» to save, what an hour of play costs); the Council generates the
// universe while they watch.

import type { FeedEntry } from '../kernel/agents/council';
import type { Kernel } from '../kernel/kernel';
import { DEATH_LEVELS } from '../kernel/gameSetup';
import type { AiConfig, GameSetup } from '../kernel/types';
import { COEFFICIENT_INFO, COEFFICIENT_KEYS, CENSUS, FULL_DETAIL, hourlyEstimate, isLowDetail, LOW_DETAIL, pricedAiModels, type Coefficients } from '../kernel/coefficients';
import { DEFAULT_SCULPTORS, type SculptorAiModels } from '../kernel/agents/sculptor';
import { usd } from '../kernel/ai/prices';
import { themeOfText, WORLD_THEMES } from '../kernel/themes';
import { feedLine } from './feed';
import { CardChoicePanel } from './cardchoice';
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
  private gameForm(): { form: HTMLElement; read: () => GameSetup; lock: (on: boolean) => void } {
    const now = this.k.gameSetup();
    const free = this.k.needsGenesis();
    const death = el('input', { type: 'range', min: '0', max: String(DEATH_LEVELS.length - 1), step: '1' }) as HTMLInputElement;
    death.value = String(now.death);
    const deathText = el('div', { class: 'note' });
    const showDeath = () => {
      const d = DEATH_LEVELS[Number(death.value)];
      deathText.textContent = `${death.value} · ${d.nome}: ${d.testo}.`;
    };
    death.oninput = showDeath;
    showDeath();
    const mode = el('select', {}, el('option', { value: 'single' }, 'singola'), el('option', { value: 'multiplayer' }, 'multigiocatore')) as HTMLSelectElement;
    mode.value = now.mode;
    const check = (on: boolean) => {
      const c = el('input', { type: 'checkbox' }) as HTMLInputElement;
      c.checked = on;
      return c;
    };
    const pvp = check(now.pvp);
    const other = check(now.freeActionsBetweenPlayers);
    const lock = (on: boolean) => {
      for (const c of [death, mode]) c.disabled = on || !free;
      // PvP and «Altro…» between players only mean something with more than one player.
      for (const c of [pvp, other]) c.disabled = on || !free || mode.value !== 'multiplayer';
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
    return { form, read: () => ({ mode: mode.value === 'multiplayer' ? 'multiplayer' : 'single', death: Number(death.value), pvp: pvp.checked, freeActionsBetweenPlayers: other.checked }), lock };
  }

  /**
   * The detail of generation (T45b): a preset, a coefficient per rhythm of the Council, the agents' models, and what an
   * hour of play costs with them. Unlike the game it can change, but only before a match (T247): the lobby. `read` gives what goes into universe.json → ai.
   */
  private aiForm(): { form: HTMLElement; read: () => Pick<AiConfig, 'textModel' | 'sculptors' | 'coefficients' | 'actor'>; lock: (on: boolean) => void } {
    const ai = this.k.config.ai;
    const coef: Coefficients = this.k.coefficients();
    const sculptors: SculptorAiModels = this.k.sculptors();
    const actor = this.k.actor();
    const models = pricedAiModels();
    const pick = (value: string) => {
      const s = el('select', {}, ...[...new Set([value, ...models])].map((m) => el('option', { value: m }, m))) as HTMLSelectElement;
      s.value = value;
      return s;
    };
    const text = pick(ai.textModel);
    // The Actor (T157): off by default (nothing changes, no call is added); on, with its own model.
    const actorOn = el('input', { type: 'checkbox', id: 'genesi-attore' }) as HTMLInputElement;
    actorOn.checked = actor.on;
    const actorModel = pick(actor.model);
    actorModel.id = 'genesi-attore-modello';
    const classes: Array<[keyof SculptorAiModels, string]> = [['simple', 'cose semplici'], ['figure', 'figure'], ['structure', 'strutture'], ['important', 'strutture importanti'], ['artist', 'Artista (giudizio)'], ['musician', 'Musicista']];
    const sculpt = new Map(classes.map(([k]) => [k, pick(String(sculptors[k]))]));
    const sliders = new Map<keyof Coefficients, HTMLInputElement>();
    const preset = el('select', {}, el('option', { value: 'pieno' }, 'Pieno dettaglio'), el('option', { value: 'low' }, 'Low Detail (a risparmio)'), el('option', { value: 'misura' }, 'Su misura')) as HTMLSelectElement;
    const estimate = el('div', { class: 'note' });
    const read = (): Pick<AiConfig, 'textModel' | 'sculptors' | 'coefficients' | 'actor'> => ({
      textModel: text.value,
      actor: { on: actorOn.checked, model: actorModel.value },
      sculptors: { ...Object.fromEntries([...sculpt].map(([k, s]) => [k, s.value])), importanteFino: sculptors.importanteFino } as Partial<SculptorAiModels>,
      coefficients: Object.fromEntries([...sliders].map(([k, s]) => [k, Number(s.value)])) as Coefficients,
    });
    const show = () => {
      const r = read();
      const c = r.coefficients as Coefficients;
      preset.value = isLowDetail(c) ? 'low' : COEFFICIENT_KEYS.every((k) => c[k] === 1) ? 'pieno' : 'misura';
      for (const s of sliders.values()) (s.nextElementSibling as HTMLElement).textContent = Number(s.value).toFixed(2);
      const h = hourlyEstimate({ ...ai, ...r }, undefined, { decisions: this.k.council.decisions !== this.k.council.localAiModels });
      estimate.replaceChildren(
        el('div', {}, `Un'ora di gioco costa circa ${usd(h.dollari)} (${h.chiamate} chiamate), con ${ai.maxText} chiamate al più per sessione.`),
        ...h.righe.map((x) => el('div', {}, `· ${x.voce} (${x.modo}): ${x.chiamate} → ${usd(x.dollari)}`)),
        el('div', {}, `Una volta sola, in questa Genesi: ${CENSUS.filter((c) => c.modo === 'non regolabile').length} compiti su ${CENSUS.length}. Tutti gli altri si regolano qui e nella lobby.`),
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
      const c = preset.value === 'low' ? LOW_DETAIL.coefficients : preset.value === 'pieno' ? FULL_DETAIL : undefined;
      if (!c) return;
      for (const [k, s] of sliders) s.value = String(c[k]);
      const models: Partial<SculptorAiModels> = preset.value === 'low' ? LOW_DETAIL.sculptors : DEFAULT_SCULPTORS;
      for (const [k, s] of sculpt) if (models[k]) s.value = String(models[k]);
      show();
    };
    for (const s of [text, actorModel, ...sculpt.values()]) s.onchange = show;
    actorOn.onchange = show;
    show();
    const form = el(
      'div',
      { class: 'game' },
      el('div', { class: 'section' }, 'Il dettaglio e i modelli'),
      el('div', { class: 'note' }, "Quanto spesso ogni agente del Concilio interroga l'IA (1: sempre come serve; 0: mai). Durante la partita non cambia: si regola di nuovo nella lobby, prima di entrare."),
      el('label', {}, 'Dettaglio', preset),
      ...rows,
      el('label', {}, 'Modello del Concilio', text),
      el('div', { class: 'row' }, ...classes.map(([k, name]) => el('label', {}, k === 'musician' ? name : `Scultore, ${name}`, sculpt.get(k)!))),
      el('div', { class: 'row' }, el('label', { for: 'genesi-attore' }, actorOn, "L'Attore interpreta gli individui (con le schede del Narratore)"), el('label', { for: 'genesi-attore-modello' }, "Modello dell'Attore", actorModel)),
      el('div', { class: 'note' }, "Spento, il Narratore interpreta gli individui come sempre e nessuna chiamata si aggiunge. Acceso, il Narratore scrive una scheda per individuo alla sua prima battuta e l'Attore la recita con il suo modello."),
      estimate,
    );
    const lock = (on: boolean) => [preset, text, actorOn, actorModel, ...sculpt.values(), ...sliders.values()].forEach((c) => (c.disabled = on || this.k.settingsLocked));
    lock(false);
    return { form, read, lock };
  }

  /** Resolves when the player has a world to play (generated or the example one). `local`: the local models were asked for (`?offline`): a Genesis with them can be run. */
  show(online: boolean, local = false): Promise<void> {
    const canGenerate = online || local;
    return new Promise((resolve) => {
      const theme = el('textarea', { rows: '10', spellcheck: 'false' }) as HTMLTextAreaElement;
      theme.value = (this.k.files[this.k.config.theme] ?? '').trim();
      // Four themes to start from (ADR-0134): the text stays free, and a text rewritten is simply «su misura».
      const CUSTOM = 'misura';
      const themes = el('select', { id: 'genesi-tema' }, ...WORLD_THEMES.map((t) => el('option', { value: t.id }, t.name)), el('option', { value: CUSTOM }, 'Su misura')) as HTMLSelectElement;
      const showTheme = () => (themes.value = themeOfText(theme.value)?.id ?? CUSTOM);
      showTheme();
      theme.oninput = showTheme;
      themes.onchange = () => {
        const chosen = WORLD_THEMES.find((t) => t.id === themes.value);
        if (chosen) theme.value = chosen.text;
      };
      const go = el('button', { class: 'primary' }, online ? 'Genera il mondo con Gemini' : local ? 'Genera il mondo con i modelli locali' : 'Gemini non disponibile');
      const skip = el('button', {}, "Gioca l'universo di esempio");
      if (!canGenerate) go.setAttribute('disabled', '');
      const game = this.gameForm();
      const detail = this.aiForm();
      // The cards to bring (T295): only with the store of the universes, and only while the choice is open (it says why not).
      const cards = this.k.repo.backend?.kin ? new CardChoicePanel({ load: () => this.k.cardChoice(), has: (id) => this.k.files[`models/${id}.xml`] !== undefined }) : undefined;
      const cost = el(
        'div',
        { class: 'note' },
        online
          ? `Il Concilio (${this.k.config.ai.textModel}) scriverà bibbia, stile, terreni, ambienti, decine di oggetti e i primi abitanti (circa 60 chiamate di testo, economiche). Niente immagini: ogni cosa sarà un modello scritto in regole.`
          : local
            ? 'Senza Gemini: i modelli locali non leggono il tema e scrivono sempre lo stesso mondo, ma ogni passo della Genesi si compie e il tema resta scritto.'
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
      const unlock = () => {
        go.removeAttribute('disabled');
        skip.removeAttribute('disabled');
        theme.removeAttribute('disabled');
        themes.disabled = false;
        game.lock(false);
        detail.lock(false);
        cards?.lock(false);
        this.root.classList.remove('running');
      };
      go.onclick = async () => {
        go.setAttribute('disabled', '');
        skip.setAttribute('disabled', '');
        theme.setAttribute('disabled', '');
        themes.disabled = true;
        game.lock(true);
        detail.lock(true);
        // The cards come first (T295): the Genesis then knows them, and does not make them again.
        const chosen = cards?.open ? cards.chosen() : [];
        if (chosen.length) {
          const twice = cards!.doubles();
          if (twice.size) {
            status.textContent = `Due carte con lo stesso id, o un id che c'è già: ${[...twice.values()][0]}.`;
            return unlock();
          }
          cards!.lock(true);
          status.textContent = `Le carte entrano (${chosen.length}): ogni programma ripassa dal controllo…`;
          const brought = await this.k.bringCards(chosen);
          cards!.showAnswer(brought);
          if (!brought.ok) {
            status.textContent = `Le carte non entrano: ${brought.reason}. Togli quelle che non vanno e riprova.`;
            return unlock();
          }
        }
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
          unlock();
          // The Genesis closed the choice when it began: the panel says so, the cards that came stay.
          void cards?.reload();
        }
      };
      this.root.replaceChildren(
        el(
          'div',
          { class: 'window' },
          el('div', { class: 'logo' }, 'ᚱ ᚢ ᚾ ᛖ'),
          el('h1', {}, 'Genesi'),
          el('div', { class: 'note' }, "Scegli un'ambientazione e, se vuoi, riscrivila: descrivi il mondo che vuoi. Il tappeto, le rune e la corona ci saranno comunque: sono le costanti di ogni universo."),
          el('label', { for: 'genesi-tema' }, 'Ambientazione', themes),
          theme,
          game.form,
          detail.form,
          ...(cards ? [cards.root] : []),
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
