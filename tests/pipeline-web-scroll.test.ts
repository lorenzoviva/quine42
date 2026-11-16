import { beforeAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

type PatchModule = {
  patchHtml(el: unknown, html: string, opts?: { stickToBottom?: boolean; bottomThreshold?: number }): boolean;
  patchText(el: unknown, text: string): boolean;
  patchValue(el: unknown, val: string, opts?: { force?: boolean }): boolean;
};

type WebModule = {
  renderHtml(): string;
  patchHtml: PatchModule['patchHtml'];
};

let D: PatchModule;
let W: WebModule;

beforeAll(async () => {
  const domPatchUrl = pathToFileURL(path.resolve(__dirname, '../tools/pipeline/domPatch.mjs')).href;
  const webUrl = pathToFileURL(path.resolve(__dirname, '../tools/pipeline/web.mjs')).href;
  D = (await import(/* @vite-ignore */ domPatchUrl)) as PatchModule;
  W = (await import(/* @vite-ignore */ webUrl)) as WebModule;
});

type MockNode = {
  tagName?: string;
  type?: string;
  id?: string;
  dataset: Record<string, string>;
  parentElement: MockNode | null;
  ownerDocument: MockDoc;
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  clientHeight: number;
  value?: string;
  checked?: boolean;
  selectionStart?: number;
  selectionEnd?: number;
  selectionDirection?: string;
  children: MockNode[];
  innerHTML: string;
  textContent: string;
  innerSetCount: number;
  textSetCount: number;
  valueSetCount: number;
  focusedWith?: unknown;
  getAttribute(name: string): string | null;
  contains(other: unknown): boolean;
  querySelector(sel: string): MockNode | null;
  querySelectorAll(sel: string): MockNode[];
  focus?(opts?: unknown): void;
  setSelectionRange?(s: number, e: number, dir?: string): void;
};

type MockDoc = {
  activeElement: MockNode | null;
  scrollingElement: MockNode;
  documentElement: MockNode;
  defaultView: {
    scrollX: number;
    scrollY: number;
    scrollTo(x: number, y: number): void;
  };
  getElementById(id: string): MockNode | null;
};

/** Creates a minimal DOM tree stub where setting `innerHTML` or `textContent` mimics browser scroll-collapse/reset. */
function makeEnv() {
  const win = {
    scrollX: 0,
    scrollY: 0,
    scrollTo(x: number, y: number) {
      this.scrollX = x;
      this.scrollY = y;
      doc.scrollingElement.scrollLeft = x;
      doc.scrollingElement.scrollTop = y;
    },
  };
  const doc: MockDoc = {
    activeElement: null,
    scrollingElement: null as unknown as MockNode,
    documentElement: null as unknown as MockNode,
    defaultView: win,
    getElementById: () => null,
  };

  function makeNode(init: Partial<MockNode> & { onReplace?: (n: MockNode, next: string) => void } = {}): MockNode {
    let html = init.innerHTML ?? '';
    let text = init.textContent ?? '';
    let val = init.value ?? '';
    const attrs: Record<string, string> = {};
    if (init.dataset?.focusKey) attrs['data-focus-key'] = init.dataset.focusKey;
    if (init.dataset?.scrollKey) attrs['data-scroll-key'] = init.dataset.scrollKey;

    const node: MockNode = {
      tagName: init.tagName ?? 'DIV',
      type: init.type,
      id: init.id,
      dataset: init.dataset ?? {},
      parentElement: init.parentElement ?? null,
      ownerDocument: doc,
      scrollTop: init.scrollTop ?? 0,
      scrollLeft: init.scrollLeft ?? 0,
      scrollHeight: init.scrollHeight ?? 0,
      clientHeight: init.clientHeight ?? 0,
      checked: init.checked,
      children: init.children ?? [],
      innerSetCount: 0,
      textSetCount: 0,
      valueSetCount: 0,
      get innerHTML() {
        return html;
      },
      set innerHTML(next: string) {
        node.innerSetCount++;
        html = next;
        // Simulate browser resetting scroll of the element and clamping ancestors/page on DOM replacement.
        node.scrollTop = 0;
        node.scrollLeft = 0;
        let p = node.parentElement;
        while (p) {
          p.scrollTop = 0;
          p = p.parentElement;
        }
        win.scrollY = 0;
        win.scrollX = 0;
        init.onReplace?.(node, next);
      },
      get textContent() {
        return text;
      },
      set textContent(next: string) {
        node.textSetCount++;
        text = next;
        node.scrollTop = 0;
        if (node.parentElement) node.parentElement.scrollTop = 0;
      },
      get value() {
        return val;
      },
      set value(next: string) {
        node.valueSetCount++;
        val = next;
        node.scrollTop = 0;
      },
      getAttribute(name: string) {
        return attrs[name] ?? null;
      },
      contains(other: unknown): boolean {
        if (other === node) return true;
        return node.children.some((c) => c.contains(other));
      },
      querySelector(sel: string): MockNode | null {
        const idMatch = /^\[id="(.+)"\]$/.exec(sel);
        if (idMatch) return node.children.find((c) => c.id === idMatch[1]) ?? null;
        const fkMatch = /^\[data-focus-key="(.+)"\]$/.exec(sel);
        if (fkMatch) return node.children.find((c) => c.getAttribute('data-focus-key') === fkMatch[1]) ?? null;
        return null;
      },
      querySelectorAll(sel: string): MockNode[] {
        if (sel === '[data-scroll-key]') return node.children.filter((c) => Boolean(c.getAttribute('data-scroll-key')));
        return [];
      },
      focus(opts?: unknown) {
        node.focusedWith = opts;
        doc.activeElement = node;
      },
    };
    if (init.selectionStart !== undefined) node.selectionStart = init.selectionStart;
    if (init.selectionEnd !== undefined) node.selectionEnd = init.selectionEnd;
    if (init.selectionDirection !== undefined) node.selectionDirection = init.selectionDirection;
    return node;
  }

  const root = makeNode({ tagName: 'HTML' });
  doc.scrollingElement = root;
  doc.documentElement = root;
  return { doc, win, root, makeNode };
}

describe('pipeline web domPatch (T399)', () => {
  it('non riscrive il DOM quando HTML o testo non cambiano', () => {
    const { root, makeNode } = makeEnv();
    const col = makeNode({ parentElement: root, scrollTop: 240, scrollHeight: 1000, clientHeight: 400 });

    expect(D.patchHtml(col, '<div>uno</div>')).toBe(true);
    expect(col.innerSetCount).toBe(1);
    col.scrollTop = 240;

    // Identical HTML: no rewrite, scroll untouched.
    expect(D.patchHtml(col, '<div>uno</div>')).toBe(false);
    expect(col.innerSetCount).toBe(1);
    expect(col.scrollTop).toBe(240);

    // Same for patchText.
    expect(D.patchText(col, 'log 1')).toBe(true);
    expect(col.textSetCount).toBe(1);
    expect(D.patchText(col, 'log 1')).toBe(false);
    expect(col.textSetCount).toBe(1);
  });

  it('quando riscrive conserva lo scroll del riquadro, dei contenitori padri, della pagina e dei figli con chiave', () => {
    const { doc, win, root, makeNode } = makeEnv();
    root.scrollTop = 310;
    win.scrollY = 310;
    const boardsWrap = makeNode({ parentElement: root, scrollLeft: 185, scrollTop: 20 });

    let preChild = makeNode({ dataset: { scrollKey: 'conv-log-T10' }, scrollTop: 95 });
    const container = makeNode({
      parentElement: boardsWrap,
      scrollTop: 420,
      scrollLeft: 12,
      children: [preChild],
      onReplace(self) {
        // Replacement creates a fresh descendant node with scrollTop = 0.
        preChild = makeNode({ dataset: { scrollKey: 'conv-log-T10' }, scrollTop: 0 });
        self.children = [preChild];
      },
    });
    preChild.parentElement = container;

    expect(D.patchHtml(container, '<div class="updated">nuovo</div>')).toBe(true);
    expect(container.scrollTop).toBe(420);
    expect(container.scrollLeft).toBe(12);
    expect(boardsWrap.scrollLeft).toBe(185);
    expect(boardsWrap.scrollTop).toBe(20);
    expect(doc.scrollingElement.scrollTop).toBe(310);
    expect(win.scrollY).toBe(310);
    expect(preChild.scrollTop).toBe(95);
  });

  it('chat (stickToBottom): segue il fondo solo se era in fondo e conserva lo scroll se l’utente è salito', () => {
    const { root, makeNode } = makeEnv();
    const chat = makeNode({ parentElement: root, scrollHeight: 1000, clientHeight: 400, scrollTop: 580 });

    // Near bottom (1000 - 580 - 400 = 20 < 60), identical HTML -> untouched (no yank to 600).
    chat.dataset.shown = '<div>m1</div>';
    expect(D.patchHtml(chat, '<div>m1</div>', { stickToBottom: true })).toBe(false);
    expect(chat.scrollTop).toBe(580);

    // Near bottom, new message arrives -> scrolls to new bottom.
    const chatFollowing = makeNode({
      parentElement: root,
      scrollHeight: 1000,
      clientHeight: 400,
      scrollTop: 580,
      onReplace(self) { self.scrollHeight = 1120; },
    });
    expect(D.patchHtml(chatFollowing, '<div>m1</div><div>m2</div>', { stickToBottom: true })).toBe(true);
    expect(chatFollowing.scrollTop).toBe(1120);

    // User scrolled up (1000 - 150 - 400 = 450 >= 60), new message arrives -> stays at 150!
    const chatReadingOld = makeNode({
      parentElement: root,
      scrollHeight: 1000,
      clientHeight: 400,
      scrollTop: 150,
      onReplace(self) { self.scrollHeight = 1120; },
    });
    expect(D.patchHtml(chatReadingOld, '<div>m1</div><div>m2</div>', { stickToBottom: true })).toBe(true);
    expect(chatReadingOld.scrollTop).toBe(150);
  });

  it('conserva focus, valore in corso, selezione e regge input numerici su aggiornamento', () => {
    const { doc, root, makeNode } = makeEnv();
    const inp = makeNode({
      tagName: 'INPUT',
      type: 'text',
      dataset: { focusKey: 'q-T10-1' },
      value: 'bozza utente',
      selectionStart: 2,
      selectionEnd: 5,
      selectionDirection: 'forward',
    });
    let setRangeArgs: unknown[] | undefined;
    inp.setSelectionRange = (s, e, d) => { setRangeArgs = [s, e, d]; };

    let nextInp: MockNode | undefined;
    const box = makeNode({
      parentElement: root,
      scrollTop: 80,
      children: [inp],
      onReplace(self) {
        nextInp = makeNode({
          tagName: 'INPUT',
          type: 'text',
          dataset: { focusKey: 'q-T10-1' },
          value: 'valore vecchio del server',
        });
        nextInp.setSelectionRange = (s, e, d) => { setRangeArgs = [s, e, d]; };
        self.children = [nextInp];
      },
    });
    inp.parentElement = box;
    doc.activeElement = inp;

    expect(D.patchHtml(box, '<input data-focus-key="q-T10-1" />')).toBe(true);
    expect(nextInp?.value).toBe('bozza utente');
    expect(nextInp?.focusedWith).toEqual({ preventScroll: true });
    expect(setRangeArgs).toEqual([2, 5, 'forward']);
    expect(doc.activeElement).toBe(nextInp);
    expect(box.scrollTop).toBe(80);

    // Numeric input whose selectionStart getter throws (like HTML5 input[type="number"]).
    const numInp = makeNode({ tagName: 'INPUT', type: 'number', id: 'manual-budget-claude', value: '42' });
    Object.defineProperty(numInp, 'selectionStart', {
      get() { throw new Error('InvalidStateError'); },
    });
    let nextNum: MockNode | undefined;
    const grid = makeNode({
      parentElement: root,
      children: [numInp],
      onReplace(self) {
        nextNum = makeNode({ tagName: 'INPUT', type: 'number', id: 'manual-budget-claude', value: '99' });
        self.children = [nextNum];
      },
    });
    numInp.parentElement = grid;
    doc.activeElement = numInp;

    expect(() => D.patchHtml(grid, '<input id="manual-budget-claude" type="number" />')).not.toThrow();
    expect(nextNum?.value).toBe('42');
    expect(doc.activeElement).toBe(nextNum);
  });

  it('patchValue non tocca un campo invariato né uno con il focus (salvo force) e conserva lo scroll', () => {
    const { doc, root, makeNode } = makeEnv();
    const editor = makeNode({ tagName: 'TEXTAREA', parentElement: root, value: 'testo', scrollTop: 140 });

    // Same value -> untouched.
    expect(D.patchValue(editor, 'testo')).toBe(false);
    expect(editor.valueSetCount).toBe(0);
    expect(editor.scrollTop).toBe(140);

    // Different value while focused -> untouched without force.
    doc.activeElement = editor;
    expect(D.patchValue(editor, 'altro')).toBe(false);
    expect(editor.value).toBe('testo');

    // Forced or unfocused -> updates and keeps scroll.
    expect(D.patchValue(editor, 'altro', { force: true })).toBe(true);
    expect(editor.value).toBe('altro');
    expect(editor.scrollTop).toBe(140);
  });

  it('la pagina web compila lo script e usa patchHtml/patchText su tutti i riquadri aggiornati', () => {
    expect(W.patchHtml).toBe(D.patchHtml);
    const html = W.renderHtml();
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    expect(scripts).toHaveLength(1);
    const script = scripts[0][1];
    expect(() => new vm.Script(script)).not.toThrow();

    for (const fn of ['captureScroll', 'restoreScroll', 'patchHtml', 'patchText', 'patchValue']) {
      expect(script).toContain(`function ${fn}`);
    }
    expect(script).toContain('data-board-cards');
    expect(script).toContain('data-scroll-key');
    expect(script).toContain('data-focus-key');
    // Only patchHtml itself and the one-time boards-wrap column shell initialization assign `.innerHTML =`.
    const rawInnerHtml = [...script.matchAll(/\.innerHTML\s*=/g)];
    expect(rawInnerHtml).toHaveLength(2);
  });
});
