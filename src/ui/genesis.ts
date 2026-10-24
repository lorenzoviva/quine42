// Genesis screen: the player gives a theme and chooses the game (how punishing death is, the mode, PvP,
// «Altro…» between players: fixed forever after, ADR-0053); the Council generates the universe while they watch.

import type { FeedEntry } from '../kernel/agents/council';
import type { Kernel } from '../kernel/kernel';
import { DEATH_LEVELS } from '../kernel/partita';
import type { Partita } from '../kernel/types';
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

  /** Resolves when the player has a world to play (generated or the example one). */
  show(canGenerate: boolean): Promise<void> {
    return new Promise((resolve) => {
      const theme = el('textarea', { rows: '7', spellcheck: 'false' }) as HTMLTextAreaElement;
      theme.value = (this.k.files[this.k.config.theme] ?? '').trim();
      const go = el('button', { class: 'primary' }, canGenerate ? 'Genera il mondo con Gemini' : 'Gemini non disponibile');
      const skip = el('button', {}, "Gioca l'universo di esempio");
      if (!canGenerate) go.setAttribute('disabled', '');
      const game = this.gameForm();
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
        off();
        this.root.hidden = true;
        resolve();
      };
      go.onclick = async () => {
        go.setAttribute('disabled', '');
        skip.setAttribute('disabled', '');
        theme.setAttribute('disabled', '');
        game.lock(true);
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
