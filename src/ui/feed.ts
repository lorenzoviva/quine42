// The Council at work: a live feed of what the agents propose, object, fix and paint.

import { AGENTS, type FeedEntry } from '../kernel/agents/council';
import type { Kernel } from '../kernel/kernel';
import { tallyLine, usd } from '../kernel/ai/usage';
import { describeQueue, describeQueueDetails, describeSubscriptions, QueueModels, RoutedModels } from '../kernel/ai/subscription';
import { el } from './dom';

const VERBS: Record<string, string> = {
  propone: 'propone',
  obietta: 'obietta',
  approva: 'approva',
  corregge: 'corregge',
  scolpisce: 'scolpisce',
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
  /** Subscription routing and waiting queue status. */
  private subs = el('div', { class: 'subs' });
  private collapsed = false;
  private pollTimer?: ReturnType<typeof setInterval>;

  constructor(host: HTMLElement, k: Kernel) {
    const toggle = el('button', { class: 'toggle' }, 'Concilio');
    toggle.onclick = () => this.toggle();
    this.root = el('div', { id: 'feed' }, toggle, this.cost, this.subs, this.list);
    host.append(this.root);
    const showCost = () => {
      const day = k.usage.day();
      this.cost.textContent = `sessione ${usd(k.usage.session.usd)} · oggi ${usd(day.total.usd)} · in tutto ${usd(k.usage.total().usd)}`;
      this.cost.title = [`Sessione: ${tallyLine(k.usage.session)}`, ...Object.entries(day.byModel).map(([m, t]) => `${m} (oggi): ${tallyLine(t)}`)].join('\n');
    };
    const showSubs = async () => {
      if (k.models instanceof RoutedModels) {
        this.subs.hidden = false;
        const firstQueue = Object.values(k.models.queues)[0] as QueueModels | undefined;
        const state = await QueueModels.queryState(firstQueue?.endpoint, firstQueue?.fetchImpl);
        this.subs.textContent = `${describeSubscriptions(k.models.table)} · ${describeQueue(state)}`;
        const details = describeQueueDetails(state);
        this.subs.title = [describeSubscriptions(k.models.table), details].filter(Boolean).join('\n');
      } else {
        this.subs.hidden = true;
      }
    };
    k.bus.on('usage', () => {
      showCost();
      void showSubs();
    });
    showCost();
    void showSubs();
    if (k.models instanceof RoutedModels) {
      this.pollTimer = setInterval(() => void showSubs(), 3000);
    }
    k.bus.on('council', (e: FeedEntry) => {
      this.push(e);
      void showSubs();
    });
    for (const e of k.feed().slice(-6)) this.push(e);
  }

  destroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.root.remove();
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
