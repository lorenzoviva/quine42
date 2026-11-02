import { beforeAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

const at = (file: string) => pathToFileURL(path.resolve(__dirname, '../tools/pipeline', file)).href;
let md: (s: string, o?: { breaks?: boolean }) => string;

beforeAll(async () => {
  md = (await import(/* @vite-ignore */ at('markdown.mjs'))).markdownToHtml;
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

describe('la pagina della pipeline', () => {
  it('ha la funzione e il pulsante, spento; lo script si compila', async () => {
    const W = (await import(/* @vite-ignore */ at('web.mjs'))) as { renderHtml(): string };
    const html = W.renderHtml();
    expect(html).toContain('id="btn-md-source"');
    expect(html).toContain('function markdownToHtml');
    expect(html).toContain("localStorage.getItem('pipeline-md-sorgente') === '1'");
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    expect(scripts).toHaveLength(1);
    expect(() => new vm.Script(scripts[0][1])).not.toThrow();
  });
});
