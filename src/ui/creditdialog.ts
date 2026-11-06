// In-game credit exhaustion dialog (T45d): when credits run out or the session spending cap is reached,
// the wanderer is presented with 3 clear options: ricarica, offline (local models), or abbandona.

import { el } from './dom';

export interface CreditDialogOptions {
  onRecharge: () => Promise<void> | void;
  onOffline: () => void;
  onAbandon: () => void;
}

export class CreditExhaustedModal {
  private root: HTMLElement;
  private titleEl: HTMLElement;
  private descEl: HTMLElement;
  private statusEl: HTMLElement;

  constructor(private opts: CreditDialogOptions) {
    let root = document.getElementById('credit-dialog');
    if (!root) {
      root = el('div', { id: 'credit-dialog', class: 'modal-backdrop' });
      document.body.appendChild(root);
    }
    this.root = root;
    this.root.hidden = true;

    this.titleEl = el('h2', { class: 'modal-title comic-title' }, 'Crediti esauriti');
    this.descEl = el(
      'p',
      { class: 'modal-desc' },
      'Non hai più crediti disponibili per generare nuovi contenuti con l’IA.',
    );
    this.statusEl = el('div', { class: 'modal-status' });

    const btnRecharge = el('button', { class: 'primary comic-btn arcade' }, 'Ricarica crediti');
    btnRecharge.onclick = async () => {
      this.statusEl.textContent = 'Apertura pagamento in corso…';
      try {
        await this.opts.onRecharge();
      } catch (e) {
        this.statusEl.textContent = `Errore: ${(e as Error).message}`;
      }
    };

    const btnOffline = el('button', { class: 'comic-btn cyan' }, 'Gioca offline (modelli locali)');
    btnOffline.onclick = () => {
      this.hide();
      this.opts.onOffline();
    };

    const btnAbandon = el('button', { class: 'danger comic-btn pink' }, 'Abbandona partita');
    btnAbandon.onclick = () => {
      this.hide();
      this.opts.onAbandon();
    };

    const box = el(
      'div',
      { class: 'modal-window credit-exhausted-window' },
      this.titleEl,
      this.descEl,
      this.statusEl,
      el('div', { class: 'modal-actions' }, btnRecharge, btnOffline, btnAbandon),
    );

    this.root.replaceChildren(box);
  }

  show(info?: { reason?: 'exhausted' | 'cap'; text?: string }): void {
    const isCap = info?.reason === 'cap';
    this.titleEl.textContent = isCap ? 'Tetto di spesa raggiunto' : 'Crediti esauriti';
    this.descEl.textContent =
      info?.text ??
      (isCap
        ? 'Hai raggiunto il tetto di crediti fissato per questa sessione nella lobby. Le richieste all’IA useranno i modelli locali.'
        : 'Hai esaurito i tuoi crediti. Scegli se ricaricare il tuo saldo, continuare a giocare offline con i modelli locali o abbandonare la partita.');
    this.statusEl.textContent = '';
    this.root.hidden = false;
  }

  hide(): void {
    this.root.hidden = true;
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }
}
