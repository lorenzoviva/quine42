// The Council at work: a live feed of what the agents propose, object, fix and paint.

import { AGENTS, type FeedEntry } from '../kernel/agents/council';
import type { Kernel } from '../kernel/kernel';
import { tallyLine, usd } from '../kernel/ai/usage';
import { el } from './dom';

const VERBS: Record<string, string> = {
  propone: 'propone',
  obietta: 'obietta',
  approva: 'approva',
  corregge: 'corregge',
  dipinge: 'dipinge',
  scarta: 'scarta',
  info: '',
  errore: 'errore',
};

export function feedLine(e: FeedEntry): HTMLElement {
  const a = e.from === 'kernel' ? { name: 'Kernel', color: '#9fb3a8', sigil: '▣' } : AGENTS[e.from];
  const to = e.to ? ` → ${AGENTS[e.to].name}` : '';
  return el(
    'div',
    { class: `feed-line k-${e.kind}` },
    el('span', { class: 'who', style: `color:${a.color}` }, `${a.sigil} ${a.name}`),
    el('span', { class: 'verb' }, `${VERBS[e.kind]}${to}`),
    el('span', { class: 'text' }, e.text),
  );
}

/** Small corner panel during play (G toggles it). */
export class FeedPanel {
  private root: HTMLElement;
  private list = el('div', { class: 'list' });
  /** What the models cost: this session and today, right after every call. */
  private cost = el('div', { class: 'cost' });
  private collapsed = false;

  constructor(host: HTMLElement, k: Kernel) {
    const toggle = el('button', { class: 'toggle' }, 'Concilio');
    toggle.onclick = () => this.toggle();
    this.root = el('div', { id: 'feed' }, toggle, this.cost, this.list);
    host.append(this.root);
    const showCost = () => {
      const day = k.usage.day();
      this.cost.textContent = `sessione ${usd(k.usage.session.usd)} · oggi ${usd(day.total.usd)} · in tutto ${usd(k.usage.total().usd)}`;
      this.cost.title = [`Sessione: ${tallyLine(k.usage.session)}`, ...Object.entries(day.byModel).map(([m, t]) => `${m} (oggi): ${tallyLine(t)}`)].join('\n');
    };
    k.bus.on('usage', showCost);
    showCost();
    k.bus.on('council', (e: FeedEntry) => this.push(e));
    for (const e of k.feed().slice(-6)) this.push(e);
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
    this.root.classList.toggle('collapsed', this.collapsed);
  }

  private push(e: FeedEntry): void {
    const line = feedLine(e);
    this.list.append(line);
    while (this.list.children.length > 7) this.list.firstChild!.remove();
    setTimeout(() => line.classList.add('old'), 15000);
  }
}
