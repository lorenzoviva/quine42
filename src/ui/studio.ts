// Panels of the studio (the corona): a thing on show seen up close — its model, or the terrain as the Artist
// shows it, with «Riscolpisci» — and a building's notice board, with the latest changes to its files.

import type { Kernel } from '../kernel/kernel';
import type { StudioItem } from '../kernel/corona';
import { $, el } from './dom';
import { icons } from './hud';

export class StudioPanel {
  private root = $('#studio');
  onClose?: () => void;
  onEdit?: (path: string) => void;

  constructor(
    private k: Kernel,
  ) {
    k.bus.on('ui:exhibit', ({ item, building }: { item: StudioItem; building: string }) => this.exhibit(item, building));
    k.bus.on('ui:board', ({ building, name }: { building: string; name: string }) => this.board(building, name));
    window.addEventListener(
      'keydown',
      (e) => {
        if (!this.isOpen || (e.target as HTMLElement)?.tagName === 'INPUT') return;
        if (e.key === 'Escape' || e.code === 'KeyE') {
          e.preventDefault();
          e.stopPropagation();
          this.close();
        }
      },
      true,
    );
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  private show(...children: Array<Node | string>): void {
    const close = el('button', { class: 'close' }, '×');
    close.onclick = () => this.close();
    this.root.replaceChildren(el('div', { class: 'window' }, close, ...children));
    this.root.hidden = false;
    this.onClose?.();
  }

  close(): void {
    this.root.hidden = true;
    this.onClose?.();
  }

  exhibit(item: StudioItem, building: string): void {
    const frame = el('div', { class: 'frame' }, el('div', { class: 'swatch', style: `background:${item.color ?? '#333'}` }));
    if (item.model)
      void icons.model?.(item.model, item.tint).then((src) => {
        if (src) frame.replaceChildren(el('img', { src, alt: item.label }));
      });
    const why = el('input', { type: 'text', placeholder: "Come lo vuoi? (es. «più scuro, con un mantello rosso»)", maxlength: '160' }) as HTMLInputElement;
    const out = el('div', { class: 'note' });
    const repaint = el('button', { class: 'primary' }, 'Chiedi allo Scultore di riscolpirlo');
    repaint.onclick = () => {
      const ok = item.target ? this.k.requestResculpt(item.target, why.value.trim()) : false;
      out.textContent = ok ? 'Lo Scultore lo riscolpirà: lo vedrai cambiare qui e nel mondo.' : 'Questo non si può riscolpire.';
    };
    why.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') repaint.click();
    });
    const open = el('button', {}, 'Apri il file');
    open.onclick = () => {
      this.close();
      if (item.path) this.onEdit?.(item.path);
    };
    this.show(
      el('div', { class: 'title' }, item.label),
      el('div', { class: 'note' }, `${item.kind === 'tile' ? 'Terreno' : 'Modello'} della ${building} — ${item.path ?? ''}`),
      frame,
      el('div', { class: 'row' }, why, repaint),
      out,
      el('div', { class: 'row' }, open),
    );
  }

  board(building: string, name: string): void {
    const mine = this.k.boardOf(building);
    const all = this.k.repo.log().slice(0, 25);
    const row = (path: string, text: string) => {
      const b = el('button', {}, 'apri');
      b.onclick = () => {
        this.close();
        this.onEdit?.(path);
      };
      return el('div', { class: 'item' }, el('span', { class: 'path' }, path), ` ${text} `, b);
    };
    this.show(
      el('div', { class: 'title' }, `Bacheca — ${name}`),
      el('div', { class: 'section' }, 'Modifiche recenti in questo edificio'),
      ...(mine.length ? mine.map((m) => row(m.path, `— ${m.author}: ${m.message}`)) : [el('div', { class: 'note' }, 'Niente di nuovo, in questa sessione.')]),
      el('div', { class: 'section' }, "La storia dell'universo (ultimi commit)"),
      ...all.map((c) => el('div', { class: 'item' }, el('span', { class: 'path' }, c.id), ` ${c.author}: ${c.message}`)),
    );
  }
}
