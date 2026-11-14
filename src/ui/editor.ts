// The corona's editor: rewriting the universe from outside the simulation.
// Valid code is hot reloaded and committed. Invalid code can still be written: it is the
// player's right to break the world (rollback always brings it back). In a multiplayer game the master's saves go on
// their branch (T42b): they try them alone, and «Pubblica» gives them to the world.

import type { Kernel } from '../kernel/kernel';
import { CAMPAIGN_FILE, campaignTemplate, readCampaign } from '../kernel/campaign';
import { wordsOf } from '../kernel/agents/council';
import { languageOf } from '../kernel/language';
import { $, el } from './dom';

export class Editor {
  private root = $('#editor');
  private list = el('div', { class: 'files' });
  private area = el('textarea', { spellcheck: 'false', wrap: 'off' });
  private gutter = el('pre', { class: 'gutter' });
  private status = el('div', { class: 'status' });
  private title = el('div', { class: 'title' });
  private forceBtn = el('button', { class: 'danger' }, 'Scrivi comunque (rompe il mondo)');
  private publishBtn = el('button', { class: 'primary' }, 'Pubblica');
  private path = '';
  onClose?: () => void;

  constructor(private kernel: Kernel) {
    const save = el('button', { class: 'primary' }, 'Salva  Ctrl+S');
    const check = el('button', {}, 'Valida');
    const close = el('button', {}, 'Chiudi  Esc');
    save.onclick = () => this.save(false);
    check.onclick = () => this.check();
    close.onclick = () => this.close();
    this.forceBtn.onclick = () => this.save(true);
    this.forceBtn.hidden = true;
    this.publishBtn.onclick = () => void this.publish();
    this.publishBtn.hidden = true;
    const code = el('div', { class: 'code' }, this.gutter, this.area);
    this.root.append(
      el('div', { class: 'head' }, this.title, el('div', { class: 'actions' }, check, save, this.forceBtn, this.publishBtn, close)),
      el('div', { class: 'body' }, this.list, code),
      this.status,
    );
    this.area.addEventListener('input', () => {
      this.updateGutter();
      this.forceBtn.hidden = true;
    });
    this.area.addEventListener('scroll', () => (this.gutter.scrollTop = this.area.scrollTop));
    this.area.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = this.area.selectionStart;
        this.area.setRangeText('  ', s, this.area.selectionEnd, 'end');
        this.updateGutter();
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.save(false);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
      e.stopPropagation();
    });
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(path: string, line = 1): void {
    this.root.hidden = false;
    this.renderList();
    this.load(path, line);
  }

  private renderList(): void {
    // The master's directives are always there to write (T374), even before the first one.
    const paths = [...new Set([...Object.keys(this.kernel.files), CAMPAIGN_FILE])].sort();
    this.list.replaceChildren(
      ...paths.map((p) => {
        const item = el('div', { class: `file${p === this.path ? ' on' : ''}` }, p);
        item.onclick = () => this.load(p, 1);
        return item;
      }),
    );
  }

  private load(path: string, line: number): void {
    this.path = path;
    this.title.textContent = `§ ${path}`;
    this.area.value = this.kernel.files[path] ?? (path === CAMPAIGN_FILE ? campaignTemplate(languageOf(this.kernel.files)) : '');
    this.updateGutter();
    this.forceBtn.hidden = true;
    this.setStatus(`HEAD ${this.kernel.repo.head().id} — ${this.kernel.repo.head().message}`, 'info');
    this.renderList();
    this.updatePublish();
    requestAnimationFrame(() => {
      this.area.focus();
      const lines = this.area.value.split('\n');
      const offset = lines.slice(0, Math.max(0, line - 1)).reduce((n, l) => n + l.length + 1, 0);
      this.area.setSelectionRange(offset, offset + (lines[line - 1]?.length ?? 0));
      const lineHeight = parseFloat(getComputedStyle(this.area).lineHeight) || 18;
      this.area.scrollTop = Math.max(0, (line - 6) * lineHeight);
    });
  }

  private updateGutter(): void {
    const n = this.area.value.split('\n').length;
    this.gutter.textContent = Array.from({ length: n }, (_, i) => String(i + 1)).join('\n');
  }

  private setStatus(text: string, tone: 'info' | 'ok' | 'err'): void {
    this.status.textContent = text;
    this.status.className = `status ${tone}`;
  }

  private check(): void {
    const errors = this.kernel.validator.validateFile(this.path, this.area.value);
    if (errors.length) this.setStatus(`✗ ${errors.join(' · ')}`, 'err');
    else this.setStatus('✓ valido', 'ok');
  }

  private save(force: boolean): void {
    const r = this.kernel.saveFile(this.path, this.area.value, force);
    if (!r.written) {
      this.setStatus(`✗ non valido: ${r.errors.join(' · ')}`, 'err');
      this.forceBtn.hidden = false;
      return;
    }
    this.forceBtn.hidden = true;
    this.updatePublish();
    if (r.committed && this.kernel.publisher) this.setStatus(`✓ nel tuo ramo — commit ${this.kernel.repo.head().id}; il mondo lo vede quando pubblichi${this.leftOut()}`, 'ok');
    else if (r.committed) this.setStatus(`✓ ricaricato a caldo — commit ${this.kernel.repo.head().id}${this.leftOut()}`, 'ok');
    else this.setStatus('⚠ scritto, ma l\'universo è rotto: nessun commit. R (fuori dall\'editor) per tornare indietro.', 'err');
  }

  /** Of the master's directives, the lines the fourth wall keeps out of the requests (T374): said, not refused (rule 3). */
  private leftOut(): string {
    if (this.path !== CAMPAIGN_FILE) return '';
    const files = this.kernel.files;
    const left = readCampaign(this.area.value, { words: wordsOf(files), lang: languageOf(files) }).left;
    if (!left.length) return '';
    const shown = left.slice(0, 3).map((l) => `«${l.line.replace(/^[-*]\s+/, '').slice(0, 50)}» (nel mondo non si dice «${l.reason}»)`);
    return ` — ${left.length === 1 ? 'una riga resta' : `${left.length} righe restano`} fuori dalle richieste: ${shown.join('; ')}`;
  }

  /** «Pubblica (n)» while the master's branch has files the world does not. */
  private updatePublish(): void {
    const n = this.kernel.publisher?.branch().length ?? 0;
    this.publishBtn.hidden = !n;
    this.publishBtn.textContent = `Pubblica (${n})`;
  }

  private async publish(): Promise<void> {
    const p = this.kernel.publisher;
    if (!p) return;
    this.setStatus('… pubblicazione in corso', 'info');
    const r = await p.publish();
    this.setStatus(r.ok ? `✓ ${r.text ?? 'pubblicato'}` : `✗ ${r.reason ?? 'non pubblicato'}`, r.ok ? 'ok' : 'err');
    this.updatePublish();
  }

  close(): void {
    this.root.hidden = true;
    this.onClose?.();
  }
}
