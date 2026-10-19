// The corona's editor: rewriting the universe from outside the simulation.
// Valid code is hot reloaded and committed. Invalid code can still be written: it is the
// player's right to break the world (rollback always brings it back).

import type { Kernel } from '../kernel/kernel';
import { $, el } from './dom';

export class Editor {
  private root = $('#editor');
  private list = el('div', { class: 'files' });
  private area = el('textarea', { spellcheck: 'false', wrap: 'off' });
  private gutter = el('pre', { class: 'gutter' });
  private status = el('div', { class: 'status' });
  private title = el('div', { class: 'title' });
  private forceBtn = el('button', { class: 'danger' }, 'Scrivi comunque (rompe il mondo)');
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
    const code = el('div', { class: 'code' }, this.gutter, this.area);
    this.root.append(
      el('div', { class: 'head' }, this.title, el('div', { class: 'actions' }, check, save, this.forceBtn, close)),
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
    const paths = Object.keys(this.kernel.files).sort();
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
    this.area.value = this.kernel.files[path] ?? '';
    this.updateGutter();
    this.forceBtn.hidden = true;
    this.setStatus(`HEAD ${this.kernel.repo.head().id} — ${this.kernel.repo.head().message}`, 'info');
    this.renderList();
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
    if (r.committed) this.setStatus(`✓ ricaricato a caldo — commit ${this.kernel.repo.head().id}`, 'ok');
    else this.setStatus('⚠ scritto, ma l\'universo è rotto: nessun commit. R (fuori dall\'editor) per tornare indietro.', 'err');
  }

  close(): void {
    this.root.hidden = true;
    this.onClose?.();
  }
}
