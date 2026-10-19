// In-world HUD: place, hand of runes, messages, dialogue, faults, tooltip, banners, help.

import type { Kernel, HoverInfo } from '../kernel/kernel';
import type { Renderer } from '../render/renderer';
import { $, el } from './dom';

export class Hud {
  private place = $('#place');
  private hand = $('#hand');
  private msgs = $('#messages');
  private dialog = $('#dialog');
  private faults = $('#faults');
  private tip = $('#tooltip');
  private banner = $('#banner');
  private zone = $('#zone');
  private lastPlace = '';
  private lastHand = '';
  private lastFaults = '';
  private dialogTimer = 0;

  constructor(
    private kernel: Kernel,
    private renderer: Renderer,
  ) {
    kernel.bus.on('ui:message', ({ text, tone }) => this.message(text, tone));
    kernel.bus.on('ui:dialog', ({ speaker, text }) => this.showDialog(speaker, text));
    kernel.bus.on('zone', ({ zone, first }) => {
      if (zone === 'corona' && first) this.showBanner('OLTRE IL BORDO', 'Il tappeto è fermo. Sotto i tuoi piedi scorre il codice sorgente dell\'universo.\nE su una runa per riscriverla.');
    });
    kernel.bus.on('rollback', () => this.showBanner('ROLLBACK', 'Il mondo è tornato all\'ultimo stato valido.', 1800));
  }

  message(text: string, tone: string = 'info'): void {
    const m = el('div', { class: `msg ${tone}` }, text);
    this.msgs.append(m);
    setTimeout(() => m.classList.add('fade'), 3500);
    setTimeout(() => m.remove(), 4500);
    while (this.msgs.children.length > 5) this.msgs.firstChild!.remove();
  }

  showDialog(speaker: string, text: string): void {
    this.dialog.replaceChildren(el('div', { class: 'speaker' }, speaker), el('div', { class: 'text' }, text));
    this.dialog.hidden = false;
    this.dialogTimer = 7;
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
        el('div', { class: 'descr' }, place?.description ?? (k.zone === 'corona' ? 'Il codice sorgente dell\'universo.' : '')),
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
        ...(hand.tokens.length
          ? hand.tokens.map((t, i) => el('span', { class: `slot${i === hand.sel ? ' sel' : ''}` }, t))
          : [el('span', { class: 'empty' }, 'mano vuota — E per raccogliere una runa')]),
      );
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
        return [el('div', { class: 'h' }, info.name), el('div', { class: 'doc' }, info.description)];
      case 'tile':
        return null;
      case 'code': {
        const c = info.cell;
        const ch = c.ch === '\n' ? '↵' : c.ch;
        const where = c.kind === 'code' ? `${c.path}:${c.line}:${c.col}` : c.kind === 'eof' ? `${c.path} — EOF` : `file ${c.path}`;
        return [el('div', { class: 'h code' }, `«${ch}»`), el('div', { class: 'doc' }, where)];
      }
    }
  }
}
