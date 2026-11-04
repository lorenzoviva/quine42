// The news page (T234, ADR-0129): the list with its filters, or one news item with `?n=<file name>`.

import { news, problems } from './notizie-file';
import { isNewsTag, renderNewsCard, renderNewsFilters, renderNewsPage } from './notizie-testo';
import { $, alertBox, initNav } from './shared';

/** The list, of one type if the address asks for one. What the address says is only compared, never written on the page. */
function showList(asked: string | null): void {
  const tag = isNewsTag(asked) ? asked : undefined;
  $('news-filters').innerHTML = renderNewsFilters(tag);
  const shown = tag ? news.filter((n) => n.tag === tag) : news;
  $('news-empty').hidden = shown.length > 0;
  $('news-list').innerHTML = shown.map(renderNewsCard).join('');
}

function showOne(slug: string): void {
  $('news-list-view').hidden = true;
  $('news-one-view').hidden = false;
  const item = news.find((n) => n.slug === slug);
  $('news-missing').hidden = !!item;
  if (!item) return;
  document.title = `QUINE42 · ${item.title}`;
  $('news-one').innerHTML = renderNewsPage(item);
}

if (typeof document !== 'undefined') {
  initNav();
  // Who is writing a news item sees here why it does not appear; the test on the folder says it too.
  for (const problem of problems) console.warn(`notizie: ${problem}`);
  if (import.meta.env.DEV && problems.length) alertBox('warning', 'FILE DA RIVEDERE', problems.join(' · '));
  const query = new URLSearchParams(location.search);
  const slug = query.get('n');
  if (slug !== null) showOne(slug);
  else showList(query.get('tag'));
}
