// The handmade cards in the gallery (T294, ADR-0169): every account's, recognisable, with how their author signs and the lab that opens
// them (another's only to look at and try). Only in a build with `site/beta.json → laboratori` on; with accounts, any account reads them
// (an anonymous one too). Loaded by carte.ts when the page starts: what a player wrote goes on the page as text.

import { labsOpen } from 'virtual:quine-laboratori';
import type { HandmadeSummary } from '../src/kernel/handmade';
import type { SignedIn } from '../src/session/login';
import { el } from '../src/ui/dom';
import { CLASSES } from '../src/mj/classes';
import { CardsClient, localWanderer } from '../lab/handmade/client';
import { labLink, labOf, reasonsOf } from '../lab/handmade/logic';

const className = (id: string | undefined) => CLASSES.find((c) => c.id === id)?.name ?? id ?? '';

function handmadeCard(c: HandmadeSummary): HTMLElement {
  const by = c.mine ? 'TU' : c.signature || 'SENZA FIRMA';
  return el(
    'article',
    { class: 'handmade-card comic-card' },
    el('div', { class: 'handmade-top' }, el('span', { class: 'comic-badge yellow' }, 'FATTA A MANO'), el('span', { class: `comic-badge ${c.kind === 'sound' ? 'pink' : 'cyan'}` }, c.kind === 'sound' ? 'SUONO' : className(c.class).toUpperCase())),
    el('h3', { class: 'handmade-name', title: c.name }, c.name),
    el('p', { class: 'handmade-by arcade-text' }, 'DI ', el('b', {}, by)),
    el('p', { class: 'handmade-from text-dim' }, c.from ? ('card' in c.from ? 'da un’altra sua carta' : `da ${c.from.universe} · ${c.from.model}`) : 'nata nei laboratori'),
    el(
      'div',
      { class: 'handmade-actions' },
      el('a', { class: 'comic-btn arcade cyan', href: labLink(labOf(c.kind), { card: c.id }) }, c.mine ? 'MODIFICA' : 'GUARDA'),
      c.kind === 'model' ? el('a', { class: 'comic-btn arcade', href: labLink('3d', { card: c.id }) }, 'NEL MONDO') : '',
    ),
  );
}

export async function showHandmade(signed: SignedIn | undefined): Promise<void> {
  const section = document.getElementById('handmade-section');
  if (!labsOpen || !section) return;
  const grid = document.getElementById('handmade-grid')!;
  const r = await new CardsClient(signed, signed ? undefined : localWanderer()).everyone();
  section.hidden = false;
  if (!r.ok) return void grid.replaceChildren(el('p', { class: 'text-dim' }, reasonsOf(r.body).join(' · ')));
  const cards = r.body.cards ?? [];
  document.getElementById('handmade-count')!.textContent = String(cards.length);
  grid.replaceChildren(...(cards.length ? cards.map(handmadeCard) : [el('p', { class: 'text-dim' }, 'Ancora nessuna carta fatta a mano: forka un modello o un suono nei laboratori.')]));
}
