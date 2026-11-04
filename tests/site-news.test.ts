// The site's news (T234, ADR-0129): a file becomes a news item, and nothing written in a file becomes HTML that runs.
import { describe, expect, it } from 'vitest';
import { news, problems } from '../site/notizie-file';
import { formatNewsDate, inlineToHtml, loadNews, markdownToHtml, parseNews, renderNewsCard, renderNewsFilters, renderNewsPage, safeUrl, type NewsItem } from '../site/notizie-testo';

const file = (head: Record<string, string>, body = 'Testo.') =>
  `---\n${Object.entries({ titolo: 'Titolo', data: '2026-11-04', tag: 'kernel', riassunto: 'Breve.', ...head }).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n${body}\n`;

const item = (over: Partial<NewsItem> = {}): NewsItem => ({ slug: 'prova', title: 'Titolo', date: '2026-11-04', tag: 'kernel', summary: 'Breve.', body: 'Testo.', ...over });

/** Every opening tag in some HTML, with what is written in it: what the renderer wrote, since the rest is escaped. */
const tagsIn = (html: string) => [...html.matchAll(/<([a-z0-9]+)([^>]*)>/gi)].map((m) => ({ name: m[1].toLowerCase(), attributes: m[2] }));

const NASTY = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg/onload=alert(1)>',
  '"><script>alert(1)</script>',
  "' onmouseover='alert(1)",
  '[clic](javascript:alert(1))',
  '[clic](JaVaScRiPt:alert(1))',
  '[clic](data:text/html,<script>alert(1)</script>)',
  '[clic](//altrove.example)',
  '[clic](&#106;avascript:alert(1))',
  '[<img src=x onerror=alert(1)>](https://esempio.it)',
  '[clic](https://esempio.it/"onclick="alert(1))',
  '**<script>alert(1)</script>**',
  '*<b onclick=alert(1)>x</b>*',
  '`<script>alert(1)</script>`',
  '- <script>alert(1)</script>',
  '> <iframe src=javascript:alert(1)></iframe>',
  '## <script>alert(1)</script>',
  '```\n</code></pre><script>alert(1)</script>\n```',
];

function expectHarmless(html: string): void {
  for (const tag of tagsIn(html)) {
    expect(['p', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'a'], html).toContain(tag.name);
    if (tag.name === 'a') {
      const href = /^ href="([^"]*)"( target="_blank" rel="noopener noreferrer")?$/.exec(tag.attributes);
      expect(href, html).not.toBeNull();
      expect(href![1], html).toMatch(/^(https?:\/\/|\.{1,2}\/|\/[^/])/i);
    } else {
      expect(tag.attributes.trim(), html).toBe('');
    }
  }
}

describe('il testo di una notizia non diventa HTML eseguibile', () => {
  it.each(NASTY)('%s', (text) => {
    expectHarmless(markdownToHtml(text));
  });

  it('l’HTML scritto in un file si legge come testo', () => {
    expect(markdownToHtml('<script>alert(1)</script>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
    expect(inlineToHtml('[clic](javascript:alert(1))')).not.toContain('<a');
  });

  it('un’intestazione non esce dal suo posto, in una carta né nella pagina', () => {
    const evil = '"><script>alert(1)</script><img src=x onerror=alert(1)>';
    const parsed = parseNews(file({ titolo: evil, riassunto: evil }, evil), 'prova') as NewsItem;
    for (const html of [renderNewsCard(parsed), renderNewsPage(parsed)]) {
      expect(html).not.toMatch(/<script|<img/i);
      expect(html).toContain('&lt;script&gt;');
    }
  });

  it('solo http(s) e i percorsi del sito sono link', () => {
    for (const ok of ['https://esempio.it/sondaggio?a=1', 'http://esempio.it', './sessioni.html', '../index.html', '/site/']) expect(safeUrl(ok)).toBe(ok);
    for (const no of ['javascript:alert(1)', 'java\tscript:alert(1)', ' https://esempio.it', 'data:text/html,x', '//altrove.example', '/\\altrove.example', 'vbscript:x', 'sessioni.html', '']) expect(safeUrl(no)).toBeUndefined();
  });

  it('il link di un’intestazione è solo uno di quelli, e nella pagina è un pulsante che apre fuori', () => {
    expect(parseNews(file({ link: 'javascript:alert(1)' }), 'prova')).toHaveProperty('problem');
    const page = renderNewsPage(parseNews(file({ tag: 'sondaggio', link: 'https://esempio.it/s' }), 'prova') as NewsItem);
    expect(page).toContain('href="https://esempio.it/s" target="_blank" rel="noopener noreferrer"');
    expect(page).toContain('RISPONDI AL SONDAGGIO');
    expect(renderNewsPage(item({ link: 'javascript:alert(1)' }))).not.toContain('javascript:');
  });
});

describe('un file diventa una notizia', () => {
  it('l’intestazione e il testo, anche con gli a capo di Windows', () => {
    const parsed = parseNews(file({ titolo: 'Un titolo: con i due punti' }, 'Riga.').replace(/\n/g, '\r\n'), 'prova');
    expect(parsed).toEqual({ slug: 'prova', title: 'Un titolo: con i due punti', date: '2026-11-04', tag: 'kernel', summary: 'Breve.', body: 'Riga.' });
  });

  it('ciò che non va lo dice, e il file resta fuori', () => {
    for (const [raw, slug] of [
      ['senza intestazione', 'prova'],
      [file({ titolo: '' }), 'prova'],
      [file({ data: '4 novembre' }), 'prova'],
      [file({ data: '2026-02-31' }), 'prova'],
      [file({ tag: 'annuncio' }), 'prova'],
      [file({ tag: 'constructor' }), 'prova'],
      [file({ riassunto: '' }), 'prova'],
      [file({}), 'Con Spazi'],
    ]) {
      expect(parseNews(raw, slug), `${slug}: ${raw}`).toHaveProperty('problem');
    }
    const { news: some, problems: bad } = loadNews({ './notizie/buona.md': file({}), './notizie/cattiva.md': 'niente' });
    expect(some.map((n) => n.slug)).toEqual(['buona']);
    expect(bad[0]).toContain('cattiva.md');
  });

  it('la più recente per prima', () => {
    const { news: some } = loadNews({ './a.md': file({ data: '2026-01-01' }), './b.md': file({ data: '2026-12-31' }), './c.md': file({ data: '2026-06-15' }) });
    expect(some.map((n) => n.slug)).toEqual(['b', 'c', 'a']);
  });

  it('il Markdown che serve', () => {
    expect(markdownToHtml('# A\n## B\n### C')).toBe('<h2>A</h2>\n<h2>B</h2>\n<h3>C</h3>');
    expect(markdownToHtml('una\nriga\n\naltra')).toBe('<p>una riga</p>\n<p>altra</p>');
    expect(markdownToHtml('- a\n- **b**\n\n1. c\n2. d')).toBe('<ul><li>a</li><li><strong>b</strong></li></ul>\n<ol><li>c</li><li>d</li></ol>');
    expect(markdownToHtml('> detto\n> bene')).toBe('<blockquote>detto bene</blockquote>');
    expect(inlineToHtml('*x* `y` [z](./p.html) [w](https://e.it)')).toBe('<em>x</em> <code>y</code> <a href="./p.html">z</a> <a href="https://e.it" target="_blank" rel="noopener noreferrer">w</a>');
  });

  it('la data in italiano, i filtri come indirizzi', () => {
    expect(formatNewsDate('2026-11-04')).toBe('4 novembre 2026');
    const filters = renderNewsFilters('sondaggio');
    expect(filters).toContain('href="./notizie.html?tag=server"');
    expect(filters).toMatch(/comic-tab active" href="\.\/notizie\.html\?tag=sondaggio"/);
  });

  it('i file della cartella sono tutti notizie valide, e la guida non è una di loro', () => {
    expect(problems).toEqual([]);
    expect(news.length).toBeGreaterThan(0);
    expect(news.map((n) => n.slug)).not.toContain('LEGGIMI');
  });
});
