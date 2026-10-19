// The inventory: 24 slots (the first 6 are the hotbar), weight, the held item, item details and
// actions, and the rune hand. Drag a slot onto another to swap or combine (the Council decides),
// drag it out of the panel to drop it in the world, drag runes to reorder the phrase.

import type { Kernel } from '../kernel/kernel';
import type { ImageCache } from '../render/imagetools';
import { CARRY_CAPACITY, HOTBAR, totalWeight } from '../kernel/inventory';
import { itemIcon } from './hud';
import { $, el } from './dom';

export class InventoryPanel {
  private root = $('#inventory');
  private sel = 0;
  private busy = '';
  onClose?: () => void;

  constructor(
    private k: Kernel,
    private images: ImageCache,
  ) {
    this.root.addEventListener('dragover', (e) => e.preventDefault());
    this.root.addEventListener('drop', (e) => {
      // Dropped on the backdrop (outside the window): put it in the world.
      if (e.target !== this.root) return;
      const from = Number(e.dataTransfer?.getData('slot'));
      if (Number.isInteger(from) && e.dataTransfer?.getData('slot') !== '') {
        this.k.dropSlot(from);
        this.render();
      }
    });
    this.root.addEventListener('mousedown', (e) => {
      if (e.target === this.root) this.close();
    });
    k.bus.on('item:picked', () => this.isOpen && this.render());
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  open(): void {
    this.root.hidden = false;
    this.k.input.inventoryOpen = true;
    this.render();
  }

  close(): void {
    this.root.hidden = true;
    this.k.input.inventoryOpen = false;
    this.onClose?.();
  }

  private slotAction(i: number): void {
    this.sel = i;
    this.render();
  }

  render(): void {
    const k = this.k;
    const inv = k.inventory();
    const lookup = (id: string) => k.itemInfo(id).spec;
    const weight = totalWeight(inv, lookup);

    const grid = el('div', { class: 'grid' });
    inv.slots.forEach((s, i) => {
      const cell = el('div', { class: `cell${i === this.sel ? ' sel' : ''}${inv.equipped === i ? ' held' : ''}${i < HOTBAR ? ' hotbar' : ''}`, draggable: s ? 'true' : 'false' });
      if (i < HOTBAR) cell.append(el('span', { class: 'n' }, String(i + 1)));
      if (s) {
        cell.append(itemIcon(k, this.images, s.item, 40));
        if (s.count > 1) cell.append(el('span', { class: 'count' }, String(s.count)));
        cell.title = k.itemInfo(s.item).name;
      }
      cell.onclick = () => this.slotAction(i);
      cell.ondblclick = () => {
        if (s) k.useSlot(i);
        this.render();
      };
      cell.ondragstart = (e) => e.dataTransfer?.setData('slot', String(i));
      cell.ondragover = (e) => e.preventDefault();
      cell.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const from = Number(e.dataTransfer?.getData('slot'));
        if (!Number.isInteger(from) || from === i) return;
        const a = inv.slots[from];
        const b = inv.slots[i];
        if (a && b && a.item !== b.item) this.askCombine(from, i);
        else {
          k.moveSlot(from, i);
          this.sel = i;
          this.render();
        }
      };
      grid.append(cell);
    });

    const s = inv.slots[this.sel];
    const details = el('div', { class: 'details' });
    if (s) {
      const info = k.itemInfo(s.item);
      const actions = el('div', { class: 'actions' });
      const btn = (label: string, fn: () => void, cls = '') => {
        const b = el('button', { class: cls }, label);
        b.onclick = () => {
          fn();
          this.render();
        };
        actions.append(b);
      };
      if (k.sandbox.has(s.item, 'on_use')) btn('Usa', () => k.useSlot(this.sel), 'primary');
      if (info.spec.equippable) btn(inv.equipped === this.sel ? 'Riponi' : 'Impugna', () => k.equipSlot(this.sel), 'primary');
      btn('Getta', () => k.dropSlot(this.sel));
      if (s.count > 1) btn('Getta 1', () => k.dropSlot(this.sel, 1));
      details.append(
        el('div', { class: 'big' }, itemIcon(k, this.images, s.item, 96)),
        el('div', { class: 'name' }, `${info.name}${s.count > 1 ? ` ×${s.count}` : ''}`),
        el('div', { class: 'descr' }, info.description),
        el('div', { class: 'props' }, `peso ${info.spec.weight}${info.spec.stackable ? ` · pila fino a ${info.spec.maxStack}` : ''}${info.spec.equippable ? ' · si impugna (F)' : ''}`),
        ...Object.entries(info.spec.controls ?? {}).map(([a, d]) => el('div', { class: 'control' }, el('b', {}, a), ' ', d)),
        actions,
      );
    } else details.append(el('div', { class: 'empty' }, 'Slot vuoto. Trascina un oggetto su un altro per scambiarli o combinarli; fuori dalla finestra per posarlo.'));
    if (this.busy) details.append(el('div', { class: 'busy' }, this.busy));

    const hand = k.hand();
    const runes = el('div', { class: 'runes' });
    hand.tokens.forEach((t, i) => {
      const r = el('span', { class: `rune${i === hand.sel ? ' sel' : ''}`, draggable: 'true' }, t);
      r.ondragstart = (e) => e.dataTransfer?.setData('rune', String(i));
      r.ondragover = (e) => e.preventDefault();
      r.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const from = Number(e.dataTransfer?.getData('rune'));
        if (Number.isInteger(from)) k.moveRune(from, i);
        this.render();
      };
      r.onclick = () => {
        hand.sel = i;
        this.render();
      };
      runes.append(r);
    });
    const inscribe = el('button', { class: 'primary' }, 'Incidi davanti a te (Q)');
    inscribe.onclick = () => {
      k.inscribeHand();
      this.render();
    };

    const over = weight > CARRY_CAPACITY;
    this.root.replaceChildren(
      el(
        'div',
        { class: 'window' },
        el('div', { class: 'head' }, el('span', { class: 'title' }, 'Inventario'), el('span', { class: `weight${over ? ' over' : ''}` }, `peso ${Math.round(weight * 10) / 10} / ${CARRY_CAPACITY}${over ? ' — sei appesantito' : ''}`), el('span', { class: 'hint' }, 'I / Tab per chiudere')),
        el('div', { class: 'body' }, grid, details),
        el('div', { class: 'runebar' }, el('div', { class: 'label' }, 'Rune in mano — trascinale per comporre la frase'), hand.tokens.length ? runes : el('div', { class: 'empty' }, 'nessuna runa'), hand.tokens.length ? inscribe : ''),
      ),
    );
  }

  private askCombine(a: number, b: number): void {
    const inv = this.k.inventory();
    const na = this.k.itemInfo(inv.slots[a]!.item).name;
    const nb = this.k.itemInfo(inv.slots[b]!.item).name;
    const swap = el('button', {}, 'Scambia');
    const combine = el('button', { class: 'primary' }, 'Combina (chiedi al Concilio)');
    const box = el('div', { class: 'combine' }, el('div', {}, `${na} + ${nb}`), swap, combine);
    swap.onclick = () => {
      this.k.moveSlot(a, b);
      this.render();
    };
    combine.onclick = async () => {
      this.busy = 'Il Concilio valuta la combinazione…';
      this.render();
      const out = await this.k.combine(a, b);
      this.busy = out;
      this.render();
      setTimeout(() => {
        this.busy = '';
        if (this.isOpen) this.render();
      }, 6000);
    };
    this.root.querySelector('.details')?.append(box);
  }
}
