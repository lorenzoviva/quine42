// The link to the labs in the site's navigation (T294, ADR-0169): only in a build made with `site/beta.json → laboratori` on. Off, the
// labs are not served (`server/production.ts`) and no page points to them.

import { labsOpen } from 'virtual:quine-laboratori';

const here = location.pathname.endsWith('/laboratori.html');

if (labsOpen) {
  const nav = document.getElementById('nav-links');
  if (nav && !nav.querySelector('a[href="./laboratori.html"]')) {
    const a = document.createElement('a');
    a.href = './laboratori.html';
    a.className = `nav-link${here ? ' active' : ''}`;
    if (here) a.setAttribute('aria-current', 'page');
    a.textContent = 'Laboratori';
    const li = document.createElement('li');
    li.append(a);
    // After the cards: forking a card is where a card is made.
    const cards = nav.querySelector('a[href="./carte.html"]')?.closest('li');
    if (cards) cards.after(li);
    else nav.append(li);
  }
  const foot = document.querySelector('.footer-links');
  if (foot && !foot.querySelector('a[href="./laboratori.html"]')) {
    const a = document.createElement('a');
    a.href = './laboratori.html';
    a.textContent = 'LABORATORI';
    const cards = foot.querySelector('a[href="./carte.html"]');
    if (cards) cards.after(a);
    else foot.append(a);
  }
}
