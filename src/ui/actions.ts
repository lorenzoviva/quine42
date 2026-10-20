// The action menu: what you can do to the thing in front of you (E). Number keys or click.

import type { ActionOption, Kernel } from '../kernel/kernel';
import { $, el } from './dom';

export class ActionMenu {
  private root = $('#actions');
  private target: number | null = null;
  private options: ActionOption[] = [];
  onClose?: () => void;

  constructor(private k: Kernel) {
    k.bus.on('ui:actions', ({ id, name, options }: { id: number; name: string; options: ActionOption[] }) => this.open(id, name, options));
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
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
    this.onClose?.();
  }
}
