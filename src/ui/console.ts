// Kernel console: the simulator's view of the universe. Log, faults, commits, modules,
// the AI gateway, the agent, import/export.

import type { Kernel } from '../kernel/kernel';
import { $, el } from './dom';
import { feedLine } from './feed';

type Tab = 'log' | 'faults' | 'commits' | 'modules' | 'ai' | 'agent' | 'universe';

const TABS: Array<[Tab, string]> = [
  ['log', 'Log'],
  ['faults', 'Anomalie'],
  ['commits', 'Commit'],
  ['modules', 'Moduli'],
  ['ai', 'Concilio'],
  ['agent', 'Agente'],
  ['universe', 'Universo'],
];

export class Console {
  private root = $('#console');
  private tabs = el('div', { class: 'tabs' });
  private body = el('div', { class: 'body' });
  private tab: Tab = 'log';
  private timer = 0;
  onEdit?: (path: string) => void;
  onClose?: () => void;
  onGenesis?: () => void;
  dev = false;

  constructor(private kernel: Kernel) {
    const close = el('button', { class: 'close' }, '×');
    close.onclick = () => this.close();
    this.root.append(el('div', { class: 'head' }, el('span', { class: 'brand' }, 'RUNE // kernel'), this.tabs, close), this.body);
    this.root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      e.stopPropagation();
    });
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  open(tab?: Tab): void {
    if (tab) this.tab = tab;
    this.root.hidden = false;
    this.render();
    this.timer = window.setInterval(() => {
      if (this.tab === 'log' || this.tab === 'faults' || this.tab === 'ai') this.render();
    }, 700);
  }

  close(): void {
    this.root.hidden = true;
    clearInterval(this.timer);
    this.onClose?.();
  }

  private render(): void {
    this.tabs.replaceChildren(
      ...TABS.map(([id, label]) => {
        const b = el('button', { class: id === this.tab ? 'on' : '' }, label + (id === 'faults' && this.kernel.faults.size ? ` (${this.kernel.faults.size})` : ''));
        b.onclick = () => {
          this.tab = id;
          this.render();
        };
        return b;
      }),
    );
    const scroll = this.body.scrollTop;
    this.body.replaceChildren(...this.content());
    if (this.tab !== 'log') this.body.scrollTop = scroll;
    else this.body.scrollTop = this.body.scrollHeight;
  }

  private content(): Node[] {
    const k = this.kernel;
    const time = (t: number) => new Date(t).toLocaleTimeString();
    switch (this.tab) {
      case 'log':
        return k.logs.slice(-200).map((l) => el('div', { class: `row src-${l.source}` }, el('span', { class: 't' }, time(l.time)), el('span', { class: 's' }, l.source), l.message));
      case 'faults': {
        const list = k.faults.list();
        if (!list.length) return [el('div', { class: 'empty' }, 'Nessuna anomalia. La simulazione è integra.')];
        return list.map((f) => el('div', { class: 'row fault' }, el('span', { class: 's' }, f.key), `${f.message}  ×${f.count}`));
      }
      case 'commits': {
        const head = k.repo.head().id;
        const rows = k.repo.log().map((c) => {
          const b = el('button', {}, c.id === head ? 'HEAD' : 'checkout');
          if (c.id === head) b.setAttribute('disabled', '');
          b.onclick = () => {
            k.rollback(c.id);
            this.render();
          };
          return el('div', { class: 'row' }, el('span', { class: 'id' }, c.id), el('span', { class: 's' }, c.author), `${c.message} — ${time(c.time)}`, b);
        });
        return [el('div', { class: 'note' }, `Ogni universo è un repository. ${k.repo.isDirty() ? '⚠ modifiche non committate (universo rotto)' : 'Nessuna modifica in sospeso.'}`), ...rows];
      }
      case 'modules':
        return [...k.modules.values()].map((m) => {
          const id = m.manifest.id;
          const broken = k.faults.list().filter((f) => f.key.startsWith(`module:${id}:`));
          const row = el(
            'div',
            { class: `row${broken.length ? ' fault' : ''}` },
            el('span', { class: 'id' }, id),
            el('span', { class: 's' }, m.manifest.kind),
            `${m.manifest.name}${broken.length ? ` — ${broken[0].message}` : ''}`,
          );
          if (this.dev) {
            const b = el('button', {}, 'modifica');
            b.onclick = () => this.onEdit?.(m.logicPath ?? m.manifestPath);
            row.append(b);
          }
          return row;
        });
      case 'ai': {
        const u = k.models.usage;
        return [
          el('div', { class: 'note' }, `Modelli: ${k.models.name} (${k.config.ai.textModel} · ${k.config.ai.imageModel}). Chiamate di testo ${u.text}/${k.models.limits.text}, immagini ${u.images}/${k.models.limits.images}, errori ${u.failures}, token ${u.inputTokens}→${u.outputTokens}. Ogni proposta passa dall'Arbitro e dal validatore.`),
          ...k.feed().slice(-150).reverse().map((e) => feedLine(e)),
        ];
      }
      case 'agent': {
        const input = el('textarea', { placeholder: 'Es: un fabbro che parla di spade incantate', rows: '3' });
        const out = el('div', { class: 'note' });
        const go = el('button', { class: 'primary' }, 'Chiedi all\'agente');
        go.onclick = async () => {
          if (!input.value.trim()) return;
          go.setAttribute('disabled', '');
          out.textContent = 'L\'agente sta scrivendo…';
          const r = await k.askAgent(input.value.trim());
          out.textContent = r.ok ? `✓ ${r.summary}. Validato, committato e caricato a caldo: comparirà nei nuovi luoghi.` : `✗ ${r.summary}`;
          go.removeAttribute('disabled');
        };
        const locked = !k.exitedOnce && !this.dev;
        if (locked) return [el('div', { class: 'empty' }, 'L\'agente parla solo con chi è uscito dalla simulazione.')];
        return [el('div', { class: 'note' }, 'L\'agente che genera il mondo. Chiedigli un nuovo abitante.'), input, go, out];
      }
      case 'universe': {
        const exp = el('button', {}, 'Esporta universo (.json)');
        exp.onclick = () => {
          const blob = new Blob([k.repo.export()], { type: 'application/json' });
          const a = el('a', { href: URL.createObjectURL(blob), download: `${k.config.name}.universe.json` });
          a.click();
        };
        const file = el('input', { type: 'file', accept: '.json' });
        file.onchange = async () => {
          const f = file.files?.[0];
          if (!f) return;
          try {
            k.repo.import(await f.text());
            k.rollback();
          } catch (e) {
            alert((e as Error).message);
          }
        };
        const genesis = el('button', { class: 'primary' }, 'Nuova genesi…');
        genesis.onclick = () => {
          this.close();
          this.onGenesis?.();
        };
        const flush = el('button', {}, 'Dimentica i luoghi generati (cache)');
        flush.onclick = async () => {
          await k.chunkStore.clear();
          flush.textContent = 'Cache svuotata: i luoghi nuovi verranno rigenerati';
        };
        const reset = el('button', { class: 'danger' }, 'Cancella la storia e riparti dalla genesi');
        reset.onclick = () => {
          if (!confirm('Cancellare tutti i commit di questo universo?')) return;
          localStorage.removeItem(`rune:repo:${k.config.name}`);
          void k.chunkStore.clear().then(() => location.reload());
        };
        return [
          el('div', { class: 'note' }, `Universo «${k.config.name}» — seme ${k.config.seed} — ${Object.keys(k.files).length} file — ${k.ecs.count()} entità — ${k.chunks.size} chunk`),
          el('div', { class: 'row' }, exp),
          el('div', { class: 'row' }, 'Importa: ', file),
          el('div', { class: 'row' }, genesis),
          el('div', { class: 'row' }, flush),
          el('div', { class: 'row' }, reset),
        ];
      }
    }
  }
}
