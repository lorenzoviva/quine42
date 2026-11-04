// The site's news (T234, ADR-0129), the pure part: a Markdown file with its header → a news item → HTML.
// Everything written in a file comes out escaped: the only tags in the result are the ones written here, and a link is only http(s) or of this site.

import { escapeHtml } from './shared';

/** The types of news: a closed list, so the filters stay few and a typo is caught. */
export const NEWS_TAGS = {
  kernel: { label: 'Kernel', badge: 'cyan' },
  universo: { label: 'Universo', badge: 'green' },
  generazione: { label: 'Generazione', badge: 'pink' },
  sondaggio: { label: 'Sondaggio', badge: 'yellow' },
  server: { label: 'Server', badge: 'purple' },
} as const;

export type NewsTag = keyof typeof NEWS_TAGS;

export interface NewsItem {
  slug: string;
  title: string;
  /** YYYY-MM-DD. */
  date: string;
  tag: NewsTag;
  summary: string;
  /** Somewhere else to go: a survey, the planning of the servers. */
  link?: string;
  body: string;
}

export const isNewsTag = (tag: string | null | undefined): tag is NewsTag => !!tag && Object.hasOwn(NEWS_TAGS, tag);

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** The parts of a real day, or undefined (`2026-02-31` is not one). */
function dayOf(date: string): [number, number, number] | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return undefined;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCMonth() === mo - 1 && t.getUTCDate() === d ? [y, mo, d] : undefined;
}

export function formatNewsDate(date: string): string {
  const day = dayOf(date);
  return day ? `${day[2]} ${MONTHS[day[1] - 1]} ${day[0]}` : date;
}

/** The address a link may lead to, or undefined: http(s), or a path of this site. Never `javascript:`, `data:` or a `//` that leaves it. */
export function safeUrl(url: string): string | undefined {
  if (/[\s\\\p{Cc}]/u.test(url)) return undefined;
  return /^https?:\/\/[^/]/i.test(url) || /^(\.{1,2}\/|\/(?!\/))/.test(url) ? url : undefined;
}

/** A file → its news item, or why it cannot be one. */
export function parseNews(raw: string, slug: string): NewsItem | { problem: string } {
  if (!SLUG_RE.test(slug)) return { problem: 'il nome del file è fatto di minuscole, cifre e trattini' };
  const m = /^---\n([\s\S]*?)\n---(?:\n([\s\S]*))?$/.exec(raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n'));
  if (!m) return { problem: 'manca l’intestazione tra due righe ---' };
  const head = new Map<string, string>();
  for (const line of m[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon > 0) head.set(line.slice(0, colon).trim(), line.slice(colon + 1).trim().replace(/^"(.*)"$/, '$1'));
  }
  const [title, date, tag, summary, link] = ['titolo', 'data', 'tag', 'riassunto', 'link'].map((k) => head.get(k) ?? '');
  if (!title) return { problem: 'manca il titolo' };
  if (!dayOf(date)) return { problem: `la data va scritta AAAA-MM-GG: «${date}»` };
  if (!isNewsTag(tag)) return { problem: `il tag è uno di ${Object.keys(NEWS_TAGS).join(', ')}: «${tag}»` };
  if (!summary) return { problem: 'manca il riassunto' };
  if (link && !safeUrl(link)) return { problem: `il link è http(s) o una pagina del sito: «${link}»` };
  return { slug, title, date, tag, summary, ...(link ? { link } : {}), body: (m[2] ?? '').trim() };
}

/** The files of the folder (path → text) → the news, the newest first, and the files that are not news. */
export function loadNews(files: Record<string, string>): { news: NewsItem[]; problems: string[] } {
  const news: NewsItem[] = [];
  const problems: string[] = [];
  for (const [file, raw] of Object.entries(files)) {
    const parsed = parseNews(raw, file.replace(/^.*\//, '').replace(/\.md$/, ''));
    if ('problem' in parsed) problems.push(`${file}: ${parsed.problem}`);
    else news.push(parsed);
  }
  news.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  return { news, problems };
}

const INLINE_RE = /`([^`]+)`|\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

function linkAttributes(url: string): string {
  const out = /^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `href="${escapeHtml(url)}"${out}`;
}

/** One line of text: `codice`, **forte**, *corsivo*, [testo](indirizzo); all the rest, tags too, is text. A link that is not allowed stays its words. */
export function inlineToHtml(text: string): string {
  let html = '';
  let at = 0;
  for (const m of text.matchAll(INLINE_RE)) {
    html += escapeHtml(text.slice(at, m.index));
    at = m.index + m[0].length;
    if (m[1] !== undefined) html += `<code>${escapeHtml(m[1])}</code>`;
    else if (m[2] !== undefined) html += `<strong>${inlineToHtml(m[2])}</strong>`;
    else if (m[3] !== undefined) html += `<em>${inlineToHtml(m[3])}</em>`;
    else {
      const url = safeUrl(m[5]);
      html += url ? `<a ${linkAttributes(url)}>${inlineToHtml(m[4])}</a>` : inlineToHtml(m[4]);
    }
  }
  return html + escapeHtml(text.slice(at));
}

/** The body of a news item: titles, paragraphs, lists, quotes and code. The page's title is the `h1`, so `#` and `##` are both an `h2`. */
export function markdownToHtml(body: string): string {
  const out: string[] = [];
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const isBlock = (line: string) => /^(#{1,3} |[-*] |\d+\. |> |```)/.test(line);
  let i = 0;
  // The lines that go on with a marker, without it.
  const run = (marker: RegExp) => {
    const taken: string[] = [];
    while (i < lines.length && marker.test(lines[i])) taken.push(lines[i++].replace(marker, ''));
    return taken;
  };
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
    } else if (line.startsWith('```')) {
      i++;
      const code: string[] = [];
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      i++;
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
    } else if (/^#{1,3} /.test(line)) {
      const level = line.startsWith('### ') ? 3 : 2;
      out.push(`<h${level}>${inlineToHtml(line.replace(/^#+ /, ''))}</h${level}>`);
      i++;
    } else if (/^[-*] /.test(line)) {
      out.push(`<ul>${run(/^[-*] /).map((l) => `<li>${inlineToHtml(l)}</li>`).join('')}</ul>`);
    } else if (/^\d+\. /.test(line)) {
      out.push(`<ol>${run(/^\d+\. /).map((l) => `<li>${inlineToHtml(l)}</li>`).join('')}</ol>`);
    } else if (line.startsWith('> ')) {
      out.push(`<blockquote>${inlineToHtml(run(/^> /).join(' '))}</blockquote>`);
    } else {
      const words: string[] = [];
      while (i < lines.length && lines[i].trim() && !isBlock(lines[i])) words.push(lines[i++].trim());
      out.push(`<p>${inlineToHtml(words.join(' '))}</p>`);
    }
  }
  return out.join('\n');
}

const badgeOf = (tag: NewsTag) => `<span class="comic-badge ${NEWS_TAGS[tag].badge}">${NEWS_TAGS[tag].label}</span>`;

export const newsAddress = (slug: string) => `./notizie.html?n=${encodeURIComponent(slug)}`;

/** One news item in a list (the page's, the landing's). */
export function renderNewsCard(item: NewsItem): string {
  return `<article class="comic-card news-card">
    <div class="news-meta">${badgeOf(item.tag)}<time datetime="${escapeHtml(item.date)}">${escapeHtml(formatNewsDate(item.date))}</time></div>
    <h3 class="comic-title news-card-title">${escapeHtml(item.title)}</h3>
    <p class="news-summary">${escapeHtml(item.summary)}</p>
    <a class="comic-btn arcade cyan sm full-width news-read" href="${escapeHtml(newsAddress(item.slug))}">LEGGI</a>
  </article>`;
}

/** The filters of the list: links, so that a filter has an address and the back button works. */
export function renderNewsFilters(active: NewsTag | undefined): string {
  const tab = (href: string, label: string, on: boolean) => `<a class="comic-tab${on ? ' active' : ''}" href="${href}"${on ? ' aria-current="true"' : ''}>${label}</a>`;
  return [
    tab('./notizie.html', 'Tutte', !active),
    ...(Object.keys(NEWS_TAGS) as NewsTag[]).map((t) => tab(`./notizie.html?tag=${t}`, NEWS_TAGS[t].label, t === active)),
  ].join('');
}

/** A news item on its own page. */
export function renderNewsPage(item: NewsItem): string {
  const label = item.tag === 'sondaggio' ? 'RISPONDI AL SONDAGGIO' : 'APRI IL LINK';
  const url = item.link ? safeUrl(item.link) : undefined;
  return `<article class="comic-panel news-article">
    <div class="news-meta">${badgeOf(item.tag)}<time datetime="${escapeHtml(item.date)}">${escapeHtml(formatNewsDate(item.date))}</time></div>
    <h1 class="comic-title news-title">${escapeHtml(item.title)}</h1>
    <p class="news-summary">${escapeHtml(item.summary)}</p>
    <div class="news-body">${markdownToHtml(item.body)}</div>
    ${url ? `<a class="comic-btn pink" ${linkAttributes(url)}>${label}</a>` : ''}
  </article>`;
}
