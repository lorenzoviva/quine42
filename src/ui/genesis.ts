// Genesis screen: the player gives a theme, the Council generates the universe while they watch.

import type { FeedEntry } from '../kernel/agents/council';
import type { Kernel } from '../kernel/kernel';
import { feedLine } from './feed';
import { $, el } from './dom';

export class GenesisScreen {
  private root = $('#genesis');

  constructor(private k: Kernel) {}

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  /** Resolves when the player has a world to play (generated or the example one). */
  show(canGenerate: boolean): Promise<void> {
    return new Promise((resolve) => {
      const theme = el('textarea', { rows: '7', spellcheck: 'false' }) as HTMLTextAreaElement;
      theme.value = (this.k.files[this.k.config.theme] ?? '').trim();
      const go = el('button', { class: 'primary' }, canGenerate ? 'Genera il mondo con Gemini' : 'Gemini non disponibile');
      const skip = el('button', {}, "Gioca l'universo di esempio");
      if (!canGenerate) go.setAttribute('disabled', '');
      const cost = el(
        'div',
        { class: 'note' },
        canGenerate
          ? `Il Concilio (${this.k.config.ai.textModel} + ${this.k.config.ai.imageModel}) scriverà bibbia, stile, terreni e i primi abitanti, poi dipingerà i luoghi mentre esplori. Circa 40 chiamate di testo e 7 immagini per la genesi.`
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
        this.root.classList.add('running');
        const ok = await this.k.runGenesis(theme.value, (step) => (status.textContent = step));
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
