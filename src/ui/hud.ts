// In-world HUD: place, rune hand, hotbar, messages, dialogue, faults, tooltip, banners.

import type { Kernel, HoverInfo } from '../kernel/kernel';
import type { Renderer } from '../render/renderer';
import { HOTBAR } from '../kernel/inventory';
import { $, el } from './dom';
import { runeGlyph } from '../kernel/runes';

/** Where icons come from: photographs of the items' models (src/render/thumbs.ts), set by main. */
export const icons: { get?: (item: string) => Promise<string | undefined>; model?: (model: string, tint?: string) => Promise<string | undefined> } = {};

/** An item's icon: the photograph of its model, its sign in its colour until the photograph is there. */
export function itemIcon(k: Kernel, item: string, size = 32): HTMLElement {
  const info = k.itemInfo(item);
  const box = el('span', { class: 'icon', style: `width:${size}px;height:${size}px;color:${info.color};font-size:${Math.round(size * 0.7)}px` }, info.glyph);
  void icons.get?.(item).then((src) => {
    if (src) box.replaceChildren(el('img', { src, alt: info.name, width: String(size), height: String(size) }));
  });
  return box;
}

export class Hud {
  private place = $('#place');
  private hand = $('#hand');
  private hotbarEl = $('#hotbar');
  private msgs = $('#messages');
  private dialog = $('#dialog');
  private faults = $('#faults');
  private tip = $('#tooltip');
  private banner = $('#banner');
  private zone = $('#zone');
  private needsEl = $('#needs');
  private questsEl = $('#quests');
  private lastQuests = '';
  private lastNeeds = '';
  private lastPlace = '';
  private lastHand = '';
  private lastHot = '';
  private lastFaults = '';
  private dialogTimer = 0;

  constructor(
    private kernel: Kernel,
    private renderer: Renderer,
  ) {
    kernel.bus.on('ui:message', ({ text, tone }) => this.message(text, tone));
    kernel.bus.on('ui:dialog', ({ speaker, text }) => this.showDialog(speaker, text));
    kernel.bus.on('zone', ({ zone, first }) => {
      if (zone === 'corona' && first) this.showBanner('OLTRE IL BORDO', "Il tappeto è fermo. Sotto i tuoi piedi scorre il codice sorgente dell'universo.\nE su una runa per riscriverla.");
    });
    kernel.bus.on('rollback', () => this.showBanner('ROLLBACK', "Il mondo è tornato all'ultimo stato valido.", 1800));
    kernel.bus.on('universe:reloaded', () => (this.lastHot = ''));
  }

  message(text: string, tone: string = 'info'): void {
    const m = el('div', { class: `msg ${tone}` }, text);
    this.msgs.append(m);
    setTimeout(() => m.classList.add('fade'), 4000);
    setTimeout(() => m.remove(), 5000);
    while (this.msgs.children.length > 5) this.msgs.firstChild!.remove();
  }

  showDialog(speaker: string, text: string): void {
    this.dialog.replaceChildren(el('div', { class: 'speaker' }, speaker), el('div', { class: 'text' }, text));
    this.dialog.hidden = false;
    this.dialogTimer = 8;
  }

  hideDialog(): void {
    this.dialog.hidden = true;
  }

  showBanner(title: string, sub: string, ms = 4500): void {
    this.banner.replaceChildren(el('div', { class: 'title' }, title), el('div', { class: 'sub' }, sub));
    this.banner.hidden = false;
    this.banner.classList.remove('out');
    setTimeout(() => this.banner.classList.add('out'), ms);
    setTimeout(() => (this.banner.hidden = true), ms + 800);
  }

  update(dt: number): void {
    const k = this.kernel;
    if (this.dialogTimer > 0 && (this.dialogTimer -= dt) <= 0) this.hideDialog();

    const place = k.zone === 'corona' ? null : k.placeHere();
    const placeKey = place ? place.name + place.description : k.zone;
    if (placeKey !== this.lastPlace) {
      this.lastPlace = placeKey;
      this.place.replaceChildren(
        el('div', { class: 'name' }, place?.name ?? (k.zone === 'corona' ? 'Corona' : '…')),
        el('div', { class: 'descr' }, place?.description ?? (k.zone === 'corona' ? "Il codice sorgente dell'universo." : 'Il Cartografo sta disegnando…')),
      );
      this.place.classList.remove('fresh');
      void this.place.offsetWidth;
      this.place.classList.add('fresh');
    }

    if (k.zone === 'corona') {
      const p = k.playerPos();
      const cell = k.corona.at(Math.floor(p.x), Math.floor(p.y));
      this.zone.hidden = false;
      this.zone.textContent = cell?.path ? `§ ${cell.path}${cell.line ? ` : riga ${cell.line}` : ''} — E per riscrivere` : 'Corona — cammina sul codice';
    } else this.zone.hidden = true;

    const hand = k.hand();
    const handKey = `${hand.tokens.join('\u0001')}|${hand.sel}`;
    if (handKey !== this.lastHand) {
      this.lastHand = handKey;
      this.hand.replaceChildren(
        ...hand.tokens.map((t, i) => {
          const look = runeGlyph(t, k.content.runes[t]);
          const span = el('span', { class: `slot${i === hand.sel ? ' sel' : ''}${look.color ? ' magic' : ''}` }, el('b', {}, look.glyph), look.label ? el('small', {}, look.label) : '');
          if (look.color) span.style.color = look.color;
          return span;
        }),
      );
      const spell = k.incantation();
      if (spell.length) this.hand.append(el('span', { class: 'cast' }, el('kbd', {}, 'T'), ` ${k.content.spells[spell.join(' ')]?.name ?? 'incantesimo ignoto'}`));
      this.hand.hidden = hand.tokens.length === 0;
    }

    const inv = k.inventory();
    const hotKey = JSON.stringify([inv.slots.slice(0, HOTBAR), inv.equipped]);
    if (hotKey !== this.lastHot) {
      this.lastHot = hotKey;
      this.hotbarEl.replaceChildren(
        ...inv.slots.slice(0, HOTBAR).map((s, i) => {
          const cell = el('div', { class: `hot${inv.equipped === i ? ' held' : ''}`, title: s ? k.itemInfo(s.item).name : '' }, el('span', { class: 'n' }, String(i + 1)));
          if (s) {
            cell.append(itemIcon(k, s.item, 30));
            if (s.count > 1) cell.append(el('span', { class: 'count' }, String(s.count)));
          }
          return cell;
        }),
      );
    }

    // The wanderer's diary: requests accepted, what they ask.
    const qs = k.quests();
    const qk = JSON.stringify(qs);
    if (qk !== this.lastQuests) {
      this.lastQuests = qk;
      this.questsEl.hidden = !qs.length;
      this.questsEl.replaceChildren(el('div', { class: 'h' }, 'Missioni'), ...qs.map((q) => el('div', { class: 'q' }, el('b', {}, `${q.da}: `), q.obiettivo, el('span', {}, `«${q.testo}» — ${q.titolo}`))));
    }

    const n = k.needs();
    if (n) {
      const bars: Array<[string, number, string]> = [['fame', n.hunger, '#e0a040'], ['sete', n.thirst, '#4aa8e8'], ['energia', n.energy, '#c0d860'], ['salute', n.health, '#e85060'], ['mana', n.mana ?? 0, '#a070ff']];
      const key = bars.map((b) => Math.round(b[1])).join(',') + Object.keys(k.states()).join('|');
      if (key !== this.lastNeeds) {
        this.lastNeeds = key;
        const stati = Object.keys(k.states());
      this.needsEl.replaceChildren(...(stati.length ? [el('div', { class: 'need' }, el('span', { class: 'l' }, stati.join(' · ')))] : []), ...bars.map(([label, v, color]) => el('div', { class: `need${v < 25 ? ' low' : ''}`, title: `${label} ${Math.round(v)}` }, el('span', { class: 'l' }, label), el('span', { class: 'bar' }, el('span', { class: 'fill', style: `width:${Math.max(0, Math.min(100, v))}%;background:${color}` })))));
      }
    }

    const faults = k.faults.list();
    const fKey = faults.map((f) => f.key + f.message).join('|');
    if (fKey !== this.lastFaults) {
      this.lastFaults = fKey;
      this.faults.hidden = faults.length === 0;
      const head = k.repo.head();
      this.faults.replaceChildren(
        el('div', { class: 'title' }, `⚠ ${faults.length} anomali${faults.length === 1 ? 'a' : 'e'} nella simulazione`),
        ...faults.slice(0, 4).map((f) => el('div', { class: 'fault' }, el('b', {}, f.key), ' ', f.message.slice(0, 140))),
        el('div', { class: 'hint' }, `R — torna a «${head.message}» (${head.id})`),
      );
    }

    this.updateTooltip();
  }

  private updateTooltip(): void {
    const m = this.renderer.mouse;
    if (!m) {
      this.tip.hidden = true;
      return;
    }
    const r = this.renderer.toReal(m.x, m.y);
    const info = this.kernel.hoverAt(r.x, r.y);
    const content = info && this.describe(info);
    if (!content) {
      this.tip.hidden = true;
      return;
    }
    this.tip.replaceChildren(...content);
    this.tip.hidden = false;
    const x = Math.min(m.x + 16, window.innerWidth - this.tip.offsetWidth - 8);
    const y = Math.min(m.y + 16, window.innerHeight - this.tip.offsetHeight - 8);
    this.tip.style.transform = `translate(${x}px, ${y}px)`;
  }

  private describe(info: HoverInfo): Node[] | null {
    switch (info.kind) {
      case 'player':
        return [el('div', { class: 'h' }, 'Tu'), el('div', {}, 'Sei sempre al centro.')];
      case 'rune': {
        const out: Node[] = [el('div', { class: 'h rune' }, `runa «${info.token}»`)];
        if (info.symbol !== null && info.symbol !== 'nil') out.push(el('div', { class: 'val' }, `${info.token} = ${info.symbol}`));
        if (info.doc) out.push(el('div', { class: 'doc' }, info.doc));
        if (info.line && info.line.src !== info.token) out.push(el('div', { class: 'code' }, info.line.src));
        if (info.line?.error) out.push(el('div', { class: 'err' }, info.line.error));
        else if (info.line?.result && info.line.src !== info.token) out.push(el('div', { class: 'val' }, `→ ${info.line.result}`));
        out.push(el('div', { class: 'src' }, info.source === 'player' ? 'incisa da te' : 'trovata nel mondo'));
        return out;
      }
      case 'entity':
        return [el('div', { class: 'h' }, info.name), el('div', { class: 'doc' }, info.description), ...(info.extra ? [el('div', { class: 'src' }, info.extra)] : [])];
      case 'tile':
        return null;
      case 'code':
        return [el('div', { class: 'h code' }, info.cell.path ?? info.folder ?? '')];
      case 'studio': {
        const it = info.item;
        const LOOK: Record<string, string> = { libro: 'un libro: il manifest di un modulo', cristallo: 'un cristallo: codice Lua', pergamena: 'una pergamena: testo', tavoletta: 'una tavoletta: dati' };
        const what =
          it.kind === 'file' ? `${LOOK[it.look ?? ''] ?? ''} — ${it.lines} righe` : it.kind === 'sprite' ? 'un modello in mostra' : it.kind === 'tile' ? 'un campione di terreno' : it.label;
        return [
          el('div', { class: 'h code' }, it.kind === 'file' ? (it.path ?? '') : it.label),
          el('div', { class: 'doc' }, `${what}, in «${info.building}»`),
          ...(info.recent ? [el('div', { class: 'val' }, `✦ modificato di recente — ${info.recent}`)] : []),
          el('div', { class: 'src' }, it.kind === 'file' ? 'E per aprirlo' : it.kind === 'sprite' || it.kind === 'tile' ? 'E per guardarlo (e farlo ridipingere)' : 'E'),
        ];
      }
      case 'door':
        return [el('div', { class: 'h' }, info.building), el('div', { class: 'doc' }, `ci lavora la squadra del ${info.team}`), el('div', { class: 'src' }, 'E alla porta per entrare')];
      case 'agent':
        return [el('div', { class: 'h' }, info.agent === 'referente' ? 'Il Referente del Concilio' : `${info.name} del Concilio`), ...(info.doing ? [el('div', { class: 'doc' }, info.doing)] : []), el('div', { class: 'src' }, 'E per parlarci')];
    }
    return null;
  }
}
