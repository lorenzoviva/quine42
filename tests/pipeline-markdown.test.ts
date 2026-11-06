import { beforeAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

const at = (file: string) => pathToFileURL(path.resolve(__dirname, '../tools/pipeline', file)).href;
let md: (s: string, o?: { breaks?: boolean; inline?: boolean }) => string;
let refs: (html: string, titles: Map<string, string>, o?: { anyCase?: boolean }) => string;

beforeAll(async () => {
  const M = await import(/* @vite-ignore */ at('markdown.mjs'));
  md = M.markdownToHtml;
  refs = M.taskRefsToHtml;
});

describe('markdownToHtml', () => {
  it('titoli, enfasi, codice', () => {
    expect(md('## Un **titolo**')).toBe('<h2>Un <strong>titolo</strong></h2>');
    expect(md('*a* e `b*c*` e snake_case_name')).toBe('<p><em>a</em> e <code>b*c*</code> e snake_case_name</p>');
    expect(md('```js\nconst a = "<b>";\n```')).toBe('<pre><code>const a = &quot;&lt;b&gt;&quot;;</code></pre>');
  });

  it('elenchi, anche annidati e con righe che continuano', () => {
    expect(md('- uno\n  continua\n- due\n  - sotto\n- tre')).toBe('<ul><li>uno continua</li><li>due<ul><li>sotto</li></ul></li><li>tre</li></ul>');
    expect(md('3. a\n4. b')).toBe('<ol start="3"><li>a</li><li>b</li></ol>');
    expect(md('- a\n\n- b')).toBe('<ul><li>a</li><li>b</li></ul>');
    expect(md('- a\nfine riga\n\naltro')).toBe('<ul><li>a fine riga</li></ul><p>altro</p>');
  });

  it('tabelle: una barra nel codice non divide', () => {
    const html = md('| A | B |\n|---|--:|\n| `x|y` | 2 |');
    expect(html).toContain('<th>A</th><th style="text-align:right">B</th>');
    expect(html).toContain('<td><code>x|y</code></td><td style="text-align:right">2</td>');
  });

  it('citazioni, righe, a capo', () => {
    expect(md('> detto\n> ancora')).toBe('<blockquote><p>detto ancora</p></blockquote>');
    expect(md('a\n\n---\n\nb')).toBe('<p>a</p><hr><p>b</p>');
    expect(md('a\nb')).toBe('<p>a b</p>');
    expect(md('a\nb', { breaks: true })).toBe('<p>a<br>b</p>');
  });

  it('niente HTML né link pericolosi', () => {
    expect(md('<img src=x onerror=alert(1)>')).toBe('<p>&lt;img src=x onerror=alert(1)&gt;</p>');
    expect(md('[x](javascript:alert(1))')).not.toContain('<a');
    expect(md('[x](docs/a.md)')).toBe('<p>x</p>');
    expect(md('[x](https://a.b/"onclick="y)')).not.toContain('"onclick');
    expect(md('[ok](https://a.b/c)')).toBe('<p><a href="https://a.b/c" target="_blank" rel="noopener noreferrer">ok</a></p>');
    expect(md('`<script>`')).toBe('<p><code>&lt;script&gt;</code></p>');
  });

  it('non si ferma su ciò che non è ben formato', () => {
    expect(md('```\nsenza fine')).toBe('<pre><code>senza fine</code></pre>');
    for (const s of ['', '*', '**', '`', '|', '|-|', '- ', '>'.repeat(5000), '- '.repeat(500), '\u00000\u0000']) expect(typeof md(s)).toBe('string');
    expect(md(undefined as unknown as string)).toBe('');
  });
});

describe('taskRefsToHtml', () => {
  const titles = new Map([['T93', 'La chat'], ['T89b', 'Un pezzo'], ['T12', 'Dodici']]);
  const ref = (id: string, title: string) => `<span class="task-ref" data-task="${id}" title="${title}">${id}</span>`;

  it('un task esistente, anche col suffisso di lettera, diventa un riferimento col titolo', () => {
    expect(refs('<p>vedi T93, poi (T89b).</p>', titles)).toBe(`<p>vedi ${ref('T93', 'La chat')}, poi (${ref('T89b', 'Un pezzo')}).</p>`);
    expect(refs('task/T93', titles)).toBe(`task/${ref('T93', 'La chat')}`);
    expect(refs(md('&#39;T93&#39; **T12**'), titles)).toContain(`<strong>${ref('T12', 'Dodici')}</strong>`);
  });

  it('un numero senza task resta testo, e così ciò che sta dentro una parola', () => {
    for (const s of ['T999', 'T93c', 'T89', 'ST12', 'T12x', 'T12_a', 'èT12', 'T123', 't12']) expect(refs(s, titles)).toBe(s);
    expect(refs(undefined as unknown as string, titles)).toBe('');
  });

  it('dentro il codice in linea sì', () => {
    expect(refs(md('il `T93`'), titles)).toBe(`<p>il <code>${ref('T93', 'La chat')}</code></p>`);
  });

  it('non tocca gli attributi né il testo di un link, e dopo il link riprende', () => {
    const link = '<a href="https://a.b/T12" title="T93 > T12" target="_blank">T12</a>';
    expect(refs(`${link} T12`, titles)).toBe(`${link} ${ref('T12', 'Dodici')}`);
    expect(refs(md('[T12](https://a.b/T93)'), titles)).toBe(md('[T12](https://a.b/T93)'));
  });

  it("il titolo passa per l'escape", () => {
    const html = refs('T1', new Map([['T1', `Un "titolo" <img src=x onerror=y> & l'altro`]]));
    expect(html).toBe(ref('T1', 'Un &quot;titolo&quot; &lt;img src=x onerror=y&gt; &amp; l&#39;altro'));
    expect(html).not.toContain('<img');
  });
});

describe('la pagina della pipeline', () => {
  it('ha la funzione e il pulsante, spento; lo script si compila', async () => {
    const W = (await import(/* @vite-ignore */ at('web.mjs'))) as { renderHtml(): string };
    const html = W.renderHtml();
    expect(html).toContain('id="btn-md-source"');
    expect(html).toContain('function markdownToHtml');
    expect(html).toContain('function taskRefsToHtml');
    expect(html).toContain("localStorage.getItem('pipeline-md-sorgente') === '1'");
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    expect(scripts).toHaveLength(1);
    expect(() => new vm.Script(scripts[0][1])).not.toThrow();
  });
});

describe('la lavagna (T304)', () => {
  type Tiles = { stepStyle(s: unknown): string | undefined; priorityStyle(p: unknown): string; effortStyle(e: unknown): string };
  type Done = { id: string; quando: string; commit?: string; esito?: string };
  let T: Tiles;
  let W: { recentlyDone(tasks: object[], runs?: object, commits?: Map<string, { hash: string; date: string }>, limit?: number): Done[] };
  beforeAll(async () => {
    T = (await import(/* @vite-ignore */ at('tiles.mjs'))) as Tiles;
    W = await import(/* @vite-ignore */ at('web.mjs'));
  });
  const hueOf = (style: string | undefined) => Number(/^background:hsl\((\d+) /.exec(style ?? '')?.[1]);

  it('il titolo in Markdown in linea: ogni Txx o txx di un task che esiste è un link, nient’altro diventa un blocco', () => {
    const titles = new Map([['T69', "L'interfaccia web"], ['T304', 'La lavagna']]);
    const html = refs(md('La lavagna di `T69` e **task/t304**, non T999', { inline: true }), titles, { anyCase: true });
    expect(html).toBe(
      'La lavagna di <code><span class="task-ref" data-task="T69" title="L&#39;interfaccia web">T69</span></code> e ' +
        '<strong>task/<span class="task-ref" data-task="T304" title="La lavagna">t304</span></strong>, non T999',
    );
    expect(md('1. # non un titolo', { inline: true })).toBe('1. # non un titolo');
    expect(md('<b>x</b>', { inline: true })).toBe('&lt;b&gt;x&lt;/b&gt;');
    expect(refs('t304', titles)).toBe('t304'); // senza anyCase la minuscola resta testo, come prima
  });

  it('il colore dello step è sempre lo stesso, e step diversi hanno colori diversi', () => {
    expect(T.stepStyle(19)).toBe(T.stepStyle(19));
    expect(T.stepStyle('19')).toBe(T.stepStyle(19));
    expect(T.stepStyle(19)).toMatchInlineSnapshot(`"background:hsl(221 55% 20%);color:hsl(221 75% 80%);border:1px solid hsl(221 55% 38%)"`);
    const hues = new Set(Array.from({ length: 12 }, (_, i) => hueOf(T.stepStyle(i + 1))));
    expect(hues.size).toBe(12);
    for (const s of [undefined, null, '', 'x']) expect(T.stepStyle(s)).toBeUndefined();
  });

  it('priorità e sforzo in scala: la priorità più alta è la più calda, lo sforzo sale da low a max', () => {
    const pri = [1, 2, 5, 10, 30, 100].map((p) => hueOf(T.priorityStyle(p)));
    expect(pri[0]).toBe(0);
    for (let i = 1; i < pri.length; i++) expect(pri[i]).toBeGreaterThan(pri[i - 1]);
    expect(hueOf(T.priorityStyle(undefined))).toBe(hueOf(T.priorityStyle(100)));
    const eff = ['low', 'medium', 'high', 'extra', 'xhigh', 'max'].map((e) => hueOf(T.effortStyle(e)));
    for (let i = 1; i < eff.length; i++) expect(eff[i]).toBeGreaterThan(eff[i - 1]);
    expect(T.effortStyle('boh')).toContain('hsl(220 10%');
  });

  it('gli ultimi finiti: i più recenti in alto, con commit ed esito, senza data fuori', () => {
    const tasks = [
      { id: 'T1', title: 'uno', status: 'fatto', commit: 'aaaaaaa' },
      { id: 'T2', title: 'due', status: 'fatto' },
      { id: 'T3', title: 'tre', status: 'fatto' },
      { id: 'T4', title: 'quattro', status: 'da fare' },
      { id: 'T5', title: 'cinque', status: 'fatto' },
    ];
    const runs = { T1: { integrato: '2026-11-05T10:00:00Z', esito: 'ESITO: fatto — bene' }, T2: { fine: '2026-11-06T10:00:00Z' }, T4: { integrato: '2026-11-07T00:00:00Z' } };
    const commits = new Map([['T3', { hash: 'ccccccc', date: '2026-11-04T10:00:00Z' }], ['T1', { hash: 'bbbbbbb', date: '2026-11-05T09:00:00Z' }]]);
    const list = W.recentlyDone(tasks, runs, commits);
    expect(list.map((d) => d.id)).toEqual(['T2', 'T1', 'T3']);
    expect(list[1]).toMatchObject({ commit: 'aaaaaaa', esito: 'fatto — bene' });
    expect(list[2].commit).toBe('ccccccc');
    expect(W.recentlyDone(tasks, runs, commits, 1)).toHaveLength(1);
  });
});
