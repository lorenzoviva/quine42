// The page of the instructions (T244, ADR-0131): the parts that were in the build, through the same transformation as the news. A part that is off is not here at all.

import { parts } from 'virtual:quine-istruzioni';
import { markdownToHtml } from './notizie-testo';
import { $, initNav } from './shared';

if (typeof document !== 'undefined') {
  initNav();
  $('guide-missing').hidden = parts.length > 0;
  $('guide-parts').innerHTML = parts.map((p) => `<article class="comic-panel news-article guide-part"><div class="news-body">${markdownToHtml(p.md)}</div></article>`).join('');
}
