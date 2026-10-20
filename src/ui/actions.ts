// The action menu: what you can do to the thing in front of you (E). Number keys or click.
// "Altro…" turns it into a line where you write the action yourself; the Council judges it.

import type { ActionOption, Kernel } from '../kernel/kernel';
import { $, el } from './dom';

export class ActionMenu {
  private root = $('#actions');
  private target: number | null = null;
  private options: ActionOption[] = [];
  private typing = false;
  onClose?: () => void;

  constructor(private k: Kernel) {
    k.bus.on('ui:actions', ({ id, name, options }: { id: number; name: string; options: ActionOption[] }) => this.open(id, name, options));
    k.bus.on('ui:freeaction', ({ id, name }: { id: number; name: string }) => this.write(id, name));
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen || this.typing) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= this.options.length) {
        e.preventDefault();
        e.stopPropagation();
        this.choose(this.options[n - 1]);
      } else if (e.key === 'Escape' || e.code === 'KeyE') {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      }
    }, true);
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(id: number, name: string, options: ActionOption[]): void {
    this.target = id;
    this.options = options;
    this.typing = false;
    this.root.replaceChildren(
      el('div', { class: 'title' }, name),
      ...options.map((o, i) => {
        const b = el('button', { class: o.enabled ? '' : 'disabled' }, el('kbd', {}, String(i + 1)), ` ${o.label}`, o.reason ? el('span', { class: 'reason' }, ` — ${o.reason}`) : '');
        b.onclick = () => this.choose(o);
        return b;
      }),
    );
    this.root.hidden = false;
    this.onClose?.();
  }

  /** Free action: the player writes what they do. */
  write(id: number, name: string): void {
    this.target = id;
    this.typing = true;
    const input = el('input', { type: 'text', placeholder: 'Cosa fai? (es. «forzo la serratura col coltello»)', maxlength: '200' }) as HTMLInputElement;
    const note = el('div', { class: 'reason' }, 'Il Concilio giudicherà se è possibile. Invio per provare, Esc per lasciar stare.');
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') this.close();
      if (e.key !== 'Enter' || !input.value.trim()) return;
      const text = input.value;
      input.disabled = true;
      note.textContent = 'Il Concilio valuta…';
      void this.k.freeAction(id, text).finally(() => this.close());
    });
    this.root.replaceChildren(el('div', { class: 'title' }, name), input, note);
    this.root.hidden = false;
    this.onClose?.();
    requestAnimationFrame(() => input.focus());
  }

  private choose(o: ActionOption): void {
    if (this.target === null) return;
    const id = this.target;
    this.close();
    if (o.enabled) void this.k.perform(id, o.id);
    else this.k.message(o.reason ?? 'Non puoi farlo.', 'warn');
  }

  close(): void {
    this.root.hidden = true;
    this.target = null;
    this.typing = false;
    this.onClose?.();
  }
}
