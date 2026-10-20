// The inventory: 24 slots (the first 6 are the hotbar), weight, the held item, item details and
// actions, an open container next to it, recipes to craft, and the rune hand.
// Drag a slot onto another to swap or combine (the Council decides), out of the window to drop it.

import type { Kernel } from '../kernel/kernel';
import type { ImageCache } from '../render/imagetools';
import { CARRY_CAPACITY, HOTBAR, totalWeight } from '../kernel/inventory';
import { itemIcon } from './hud';
import { $, el } from './dom';
import { runeGlyph } from '../kernel/runes';

export class InventoryPanel {
  private root = $('#inventory');
  private sel = 0;
  private busy = '';
  private tab: 'oggetti' | 'crea' = 'oggetti';
  private box: number | null = null;
  /** A bag the player carries, opened (slot index). */
  private bagSlot: number | null = null;
  onClose?: () => void;

  constructor(
    private k: Kernel,
    private images: ImageCache,
  ) {
    this.root.addEventListener('dragover', (e) => e.preventDefault());
    this.root.addEventListener('drop', (e) => {
      if (e.target !== this.root) return;
      const raw = e.dataTransfer?.getData('slot');
      if (raw) {
        this.k.dropSlot(Number(raw));
        this.render();
      }
    });
    this.root.addEventListener('mousedown', (e) => {
      if (e.target === this.root) this.close();
    });
    k.bus.on('item:picked', () => this.isOpen && this.render());
    k.bus.on('ui:container', ({ id }: { id: number }) => {
      this.box = id;
      this.bagSlot = null;
      this.tab = 'oggetti';
      this.open();
    });
    k.bus.on('ui:bag', ({ slot }: { slot: number }) => {
      this.bagSlot = slot;
      this.box = null;
      this.tab = 'oggetti';
      if (this.isOpen) this.render();
      else this.open();
    });
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
    this.onClose?.();
  }

  close(): void {
    this.root.hidden = true;
    this.box = null;
    this.bagSlot = null;
    this.k.input.inventoryOpen = false;
    this.onClose?.();
  }

  private grid(slots: Array<{ item: string; count: number } | null>, opts: { hotbar?: boolean; held?: number | null; sel?: number; onClick: (i: number) => void; onDbl?: (i: number) => void; drag?: string; onDrop?: (from: number, to: number) => void }): HTMLElement {
    const grid = el('div', { class: 'grid' });
    slots.forEach((s, i) => {
      const cell = el('div', { class: `cell${i === opts.sel ? ' sel' : ''}${opts.held === i ? ' held' : ''}${opts.hotbar && i < HOTBAR ? ' hotbar' : ''}`, draggable: s && opts.drag ? 'true' : 'false' });
      if (opts.hotbar && i < HOTBAR) cell.append(el('span', { class: 'n' }, String(i + 1)));
      if (s) {
        cell.append(itemIcon(this.k, this.images, s.item, 38));
        if (s.count > 1) cell.append(el('span', { class: 'count' }, String(s.count)));
        cell.title = this.k.itemInfo(s.item).name;
      }
      cell.onclick = () => opts.onClick(i);
      if (opts.onDbl) cell.ondblclick = () => opts.onDbl!(i);
      if (opts.drag) {
        cell.ondragstart = (e) => e.dataTransfer?.setData(opts.drag!, String(i));
        cell.ondragover = (e) => e.preventDefault();
        cell.ondrop = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const raw = e.dataTransfer?.getData(opts.drag!);
          if (raw && opts.onDrop) opts.onDrop(Number(raw), i);
        };
      }
      grid.append(cell);
    });
    return grid;
  }

  render(): void {
    const k = this.k;
    const inv = k.inventory();
    const weight = totalWeight(inv, (id) => k.itemInfo(id).spec);
    const box = this.box !== null ? k.container(this.box) : undefined;
    const bag = this.bagSlot !== null && !box ? k.bag(this.bagSlot) : undefined;
    if (this.bagSlot !== null && !bag) this.bagSlot = null;

    const mine = this.grid(inv.slots, {
      hotbar: true,
      held: inv.equipped,
      sel: this.sel,
      drag: 'slot',
      onClick: (i) => {
        if (box && inv.slots[i]) k.putIntoContainer(this.box!, i);
        else if (bag && inv.slots[i] && i !== this.bagSlot) k.putIntoBag(this.bagSlot!, i);
        else this.sel = i;
        this.render();
      },
      onDbl: (i) => {
        if (!box && inv.slots[i]) k.useSlot(i);
        this.render();
      },
      onDrop: (from, to) => {
        const a = inv.slots[from];
        const b = inv.slots[to];
        if (a && b && a.item !== b.item) this.askCombine(from, to);
        else {
          k.moveSlot(from, to);
          this.sel = to;
          this.render();
        }
      },
    });

    const side = el('div', { class: 'details' });
    if (bag) {
      const bs = this.bagSlot!;
      const close = el('button', {}, 'Chiudi');
      close.onclick = () => {
        this.bagSlot = null;
        this.render();
      };
      const accepts = k.content.get(inv.slots[bs]!.item)?.container?.accepts;
      side.append(
        el('div', { class: 'name' }, k.itemInfo(inv.slots[bs]!.item).name),
        el('div', { class: 'descr' }, `${bag.slots.some(Boolean) ? 'Clic su ciò che c\'è dentro per prenderlo; clic sui tuoi oggetti per metterli dentro.' : 'Vuota. Clic sui tuoi oggetti per metterli dentro.'}${accepts ? ` Ci vanno solo cose «${accepts}».` : ''}`),
        this.grid(bag.slots, { onClick: (i) => (k.takeFromBag(bs, i), this.render()) }),
        close,
      );
    } else if (box) {
      const take = el('button', { class: 'primary' }, 'Prendi tutto');
      take.onclick = () => {
        box.inv.slots.forEach((s, i) => s && k.takeFromContainer(this.box!, i));
        this.render();
      };
      side.append(
        el('div', { class: 'name' }, k.nameOf(this.box!)),
        el('div', { class: 'descr' }, box.inv.slots.some(Boolean) ? 'Clic su un oggetto per prenderlo; clic sui tuoi per riporli qui.' : 'Vuoto.'),
        this.grid(box.inv.slots, { onClick: (i) => (k.takeFromContainer(this.box!, i), this.render()) }),
        take,
      );
    } else if (this.tab === 'crea') {
      const { available, all } = k.recipes();
      const sorted = [...all].sort((a, b) => Number(available.has(b.id)) - Number(available.has(a.id)));
      side.append(
        el('div', { class: 'name' }, 'Ricette'),
        ...(sorted.length
          ? sorted.map((r) => {
              const ok = available.has(r.id);
              const btn = el('button', { class: ok ? 'primary' : '' }, 'Crea');
              if (!ok) btn.setAttribute('disabled', '');
              btn.onclick = () => {
                k.craft(r.id);
                this.render();
              };
              const parts = r.inputs.map((i) => `${k.itemInfo(i.item).name} ×${i.count}`).join(' + ');
              const tools = r.tools?.length ? ` (con ${r.tools.map((t) => k.itemInfo(t).name).join(', ')})` : '';
              return el('div', { class: `recipe${ok ? ' ok' : ''}` }, el('div', {}, el('b', {}, k.itemInfo(r.output.item).name), r.output.count > 1 ? ` ×${r.output.count}` : ''), el('div', { class: 'parts' }, parts + tools), btn);
            })
          : [el('div', { class: 'empty' }, 'Nessuna ricetta conosciuta.')]),
      );
    } else {
      const s = inv.slots[this.sel];
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
        const def = k.content.get(s.item);
        const isRune = s.item.startsWith('rune:');
        const usable = !isRune && !def?.container && (!!info.effects || ['cibo', 'bevanda', 'medicina', 'luce', 'vestiario'].includes(info.category) || k.sandbox.has(def?.module ?? '', 'on_use'));
        if (def?.container) btn(`Apri (${(s.inv?.slots.filter(Boolean).length ?? 0)}/${def.container.size})`, () => k.useSlot(this.sel), 'primary');
        if (isRune) btn('Aggiungi alla frase', () => k.composeRune(s.item.slice(5)), 'primary');
        if (usable) btn(info.category === 'cibo' ? 'Mangia' : info.category === 'bevanda' ? 'Bevi' : info.category === 'magia' ? 'Assorbi' : 'Usa', () => k.useSlot(this.sel), 'primary');
        if (info.spec.equippable) btn(inv.equipped === this.sel ? 'Riponi' : 'Impugna', () => k.equipSlot(this.sel), 'primary');
        btn('Getta', () => k.dropSlot(this.sel));
        if (s.count > 1) btn('Getta 1', () => k.dropSlot(this.sel, 1));
        const e = info.effects ?? {};
        const effects = [e.hunger && `fame ${e.hunger > 0 ? '+' : ''}${e.hunger}`, e.thirst && `sete ${e.thirst > 0 ? '+' : ''}${e.thirst}`, e.energy && `energia ${e.energy > 0 ? '+' : ''}${e.energy}`, e.health && `salute ${e.health > 0 ? '+' : ''}${e.health}`].filter(Boolean).join(' · ');
        side.append(
          el('div', { class: 'big' }, itemIcon(k, this.images, s.item, 96)),
          el('div', { class: 'name' }, `${info.name}${s.count > 1 ? ` ×${s.count}` : ''}`),
          el('div', { class: 'descr' }, info.description),
          el('div', { class: 'props' }, `${info.category} · peso ${info.spec.weight}${info.spec.stackable ? ` · pila fino a ${info.spec.maxStack}` : ''}${info.spec.equippable ? ' · si impugna (F)' : ''}`),
          effects ? el('div', { class: 'control' }, effects) : '',
          info.tags.length ? el('div', { class: 'props' }, info.tags.join(', ')) : '',
          actions,
        );
      } else side.append(el('div', { class: 'empty' }, 'Slot vuoto. Trascina un oggetto su un altro per scambiarli o combinarli; fuori dalla finestra per posarlo. Doppio clic per usare.'));
    }
    if (this.busy) side.append(el('div', { class: 'busy' }, this.busy));

    const hand = k.hand();
    const runes = el('div', { class: 'runes' });
    hand.tokens.forEach((t, i) => {
      const look = runeGlyph(t, k.content.runes[t]);
      const r = el('span', { class: `rune${i === hand.sel ? ' sel' : ''}`, draggable: 'true', title: k.content.runes[t]?.description ?? t }, `${look.glyph !== t ? `${look.glyph} ` : ''}${t}`);
      if (look.color) r.style.color = look.color;
      r.ondragstart = (e) => e.dataTransfer?.setData('rune', String(i));
      r.ondragover = (e) => e.preventDefault();
      r.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const raw = e.dataTransfer?.getData('rune');
        if (raw) k.moveRune(Number(raw), i);
        this.render();
      };
      r.title = 'clic: togli dalla frase (resta nella borsa)';
      r.onclick = () => {
        k.uncompose(i);
        this.render();
      };
      runes.append(r);
    });
    const inscribe = el('button', { class: 'primary' }, 'Incidi davanti a te (Q)');
    inscribe.onclick = () => {
      k.inscribeHand();
      this.render();
    };
    const spell = k.incantation();
    const cast = el('button', { class: 'primary' }, `Pronuncia (T): ${k.content.spells[spell.join(' ')]?.name ?? 'incantesimo ignoto'}`);
    cast.onclick = async () => {
      this.close();
      await k.castSpell();
    };

    const tabs = el('div', { class: 'tabs' });
    for (const [id, label] of [['oggetti', 'Oggetti'], ['crea', `Crea (${k.recipes().available.size})`]] as const) {
      const b = el('button', { class: this.tab === id && !box ? 'on' : '' }, label);
      b.onclick = () => {
        this.tab = id;
        this.box = null;
        this.bagSlot = null;
        this.render();
      };
      tabs.append(b);
    }
    const over = weight > CARRY_CAPACITY;
    this.root.replaceChildren(
      el(
        'div',
        { class: 'window' },
        el('div', { class: 'head' }, el('span', { class: 'title' }, 'Inventario'), tabs, el('span', { class: `weight${over ? ' over' : ''}` }, `peso ${Math.round(weight * 10) / 10} / ${CARRY_CAPACITY}${over ? ' — appesantito' : ''}`), el('span', { class: 'hint' }, 'I / Tab per chiudere')),
        el('div', { class: 'body' }, mine, side),
        el(
          'div',
          { class: 'runebar' },
          el('div', { class: 'label' }, 'Frase — le rune che userai: trascinale per riordinarle, clic per toglierle; dalla borsa «Aggiungi alla frase»'),
          hand.tokens.length ? runes : el('div', { class: 'empty' }, 'nessuna runa nella frase'),
          hand.tokens.length ? inscribe : '',
          spell.length ? cast : '',
        ),
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
      this.busy = await this.k.combine(a, b);
      this.render();
      setTimeout(() => {
        this.busy = '';
        if (this.isOpen) this.render();
      }, 6000);
    };
    this.root.querySelector('.details')?.append(box);
  }
}
