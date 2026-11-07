// The site's entry to the labs (T294, ADR-0169): the three labs, the account's handmade cards (open, sign, take away) and what can be forked
// of a universe (only what `publicFiles` gives to who is not its master). In the build only with `site/beta.json → laboratori` on.
// Everything a player wrote (names, signatures) goes on the page as text.

import type { HandmadeSummary } from '../src/kernel/handmade';
import { el } from '../src/ui/dom';
import { CardsClient, labsClosed, rememberLocalWanderer, universeNames } from '../lab/handmade/client';
import { forkables, labLink, labOf, reasonsOf } from '../lab/handmade/logic';
import { CLASSES } from '../src/mj/classes';
import { $, alertBox, hideAlert, initNav, pageLogin, pickUniverse, store, stored, UNIVERSE_KEY } from './shared';

const className = (id: string | undefined) => CLASSES.find((c) => c.id === id)?.name ?? id ?? '';
const kindName = (c: { kind: string; class?: string }) => (c.kind === 'sound' ? 'suono' : `modello · ${className(c.class)}`);
const day = (iso: string) => new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });

function cardRow(c: HandmadeSummary, client: CardsClient, gone: () => void): HTMLElement {
  const from = c.from ? ('card' in c.from ? 'da una tua carta' : `da ${c.from.universe}/${c.from.model}`) : 'nuova';
  const open = el('a', { class: 'comic-btn arcade cyan', href: labLink(labOf(c.kind), { card: c.id }) }, 'APRI');
  const look = c.kind === 'model' ? el('a', { class: 'comic-btn arcade', href: labLink('3d', { card: c.id }) }, 'NEL MONDO') : '';
  // Two presses, never a dialog: the first asks, the second takes it away.
  const drop = el('button', { type: 'button', class: 'comic-btn arcade' }, 'ELIMINA');
  let armed = false;
  drop.addEventListener('click', async () => {
    if (!armed) {
      armed = true;
      drop.textContent = 'CONFERMA';
      setTimeout(() => {
        armed = false;
        drop.textContent = 'ELIMINA';
      }, 4000);
      return;
    }
    const r = await client.remove(c.id);
    if (!r.ok) return alertBox('error', 'ZAP!', reasonsOf(r.body).join(' · '));
    alertBox('success', 'FATTO', `«${c.name}» non c’è più`);
    gone();
  });
  return el(
    'li',
    {},
    el('span', { class: 'labs-name' }, c.name),
    el('span', { class: 'comic-badge' }, kindName(c).toUpperCase()),
    el('span', { class: 'text-dim' }, `${from} · ${day(c.changed)}`),
    open,
    look,
    drop,
  );
}

async function showMine(client: CardsClient): Promise<void> {
  const list = $('mine-list');
  const r = await client.mine();
  if (!r.ok) {
    list.replaceChildren(el('li', {}, reasonsOf(r.body).join(' · ')));
    return;
  }
  const cards = r.body.cards ?? [];
  const sig = $<HTMLInputElement>('signature');
  if (document.activeElement !== sig) sig.value = r.body.signature ?? '';
  const used = r.body.used;
  const caps = r.body.caps;
  $('mine-used').textContent = used && caps ? `${used.cards} / ${caps.cards} carte · ${Math.ceil(used.bytes / 1024)} / ${Math.round(caps.bytes / 1024)} KiB` : '';
  list.replaceChildren(
    ...(cards.length
      ? cards.map((c) => cardRow(c, client, () => void showMine(client)))
      : [el('li', {}, 'Ancora nessuna carta fatta a mano: forka un modello o un suono qui sotto, o comincia da zero in un laboratorio.')]),
  );
}

async function showForkables(client: CardsClient, name: string): Promise<void> {
  const list = $('fork-list');
  list.replaceChildren(el('li', {}, 'apro l’universo…'));
  const files = await client.universe(name);
  if (!files) return void list.replaceChildren(el('li', {}, 'L’universo non risponde: riprova tra poco.'));
  const all = forkables(files);
  if (!all.length) return void list.replaceChildren(el('li', {}, 'In questo universo non c’è ancora niente da forkare.'));
  list.replaceChildren(
    ...all.map((f) =>
      el(
        'li',
        {},
        el('span', { class: 'labs-name' }, f.name),
        el('span', { class: 'comic-badge' }, kindName(f).toUpperCase()),
        el('a', { class: 'comic-btn arcade cyan', href: labLink(labOf(f.kind), { universe: name, model: f.id }) }, 'FORKA'),
      ),
    ),
  );
}

async function start(): Promise<void> {
  initNav();
  const content = $('labs-content');
  // With accounts, the site's sign-in; without (only this machine), the id the page asks once and remembers, as the labs read it.
  const who = await pageLogin(content);
  if (!who) return;
  hideAlert();
  content.hidden = false;
  // Without accounts the labs this page links to read the id from here: their addresses do not carry it.
  const client = new CardsClient(who.signed, who.localId ? rememberLocalWanderer(who.localId) : undefined);

  const probe = await client.mine();
  if (labsClosed(probe)) {
    content.hidden = true;
    return alertBox('warning', 'CHIUSI', 'I laboratori non sono aperti su questo server.');
  }
  if (who.signed?.anonimo) alertBox('info', 'ANONIMO', 'Da anonimo vedi le carte di tutti e provi tutto nei laboratori; per salvare una carta lega l’account a Google dal profilo.');
  await showMine(client);

  $<HTMLFormElement>('signature-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await client.sign($<HTMLInputElement>('signature').value);
    if (!r.ok) return alertBox('error', 'ZAP!', reasonsOf(r.body).join(' · '));
    alertBox('success', 'FIRMATO', r.body.signature ? `Le tue carte sono firmate «${r.body.signature}»` : 'Le tue carte non hanno più una firma');
  });

  const select = $<HTMLSelectElement>('fork-universe');
  const names = await universeNames();
  select.replaceChildren(...names.map((n) => el('option', { value: n }, n.toUpperCase())));
  const first = pickUniverse(names, new URLSearchParams(location.search).get('universo'), stored(UNIVERSE_KEY));
  if (!first) {
    select.disabled = true;
    $('fork-list').replaceChildren(el('li', {}, 'Nessun universo su questo server, per ora.'));
    return;
  }
  select.value = first;
  select.addEventListener('change', () => {
    store(UNIVERSE_KEY, select.value);
    void showForkables(client, select.value);
  });
  await showForkables(client, first);
}

void start();
