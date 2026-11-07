// The handmade cards in the sandbox (T294, ADR-0169): every account's models, to put in front of you in the world; a card of the address
// (`?card=<id>`) opens at once. A card is changed in the editor: the link opens it there (another's only to look at and try).

import type { HandmadeSummary } from '../../src/kernel/handmade';
import { signedClient } from '../handmade/bar';
import { labsClosed } from '../handmade/client';
import { boxFor, labLink, reasonsOf, sourceFromSearch } from '../handmade/logic';
import type { Entry, Role } from './catalog';

const ROLE: Record<string, Role> = { person: 'npc', animal: 'animal', beast: 'animal', tree: 'tree', bush: 'plant', rock: 'rock', pebble: 'rock', object: 'prop', furniture: 'prop', monument: 'structure', building: 'structure', structure: 'structure' };

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...kids: Array<Node | string>): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  e.append(...kids);
  return e;
}

export async function startCardsList(o: { mount: HTMLElement; open: (e: Entry) => void }): Promise<void> {
  const login = el('div', { class: 'row', hidden: '' });
  const list = el('div');
  const note = el('div', { class: 'small' }, 'apro le carte…');
  o.mount.replaceChildren(login, note, list);
  const { client } = await signedClient(login, () => (note.textContent = 'entra per vedere le carte dei viandanti'));
  const all = await client.everyone();
  if (labsClosed(all)) return void o.mount.closest('section')?.remove();
  if (!all.ok) return void (note.textContent = reasonsOf(all.body).join(' · '));
  const models = (all.body.cards ?? []).filter((c) => c.kind === 'model');
  note.textContent = models.length ? 'clic: davanti a te · editor: per cambiarla (o guardarla, se non è tua)' : 'ancora nessun modello fatto a mano';

  const openCard = async (id: string) => {
    const r = await client.open(id);
    const v = r.body.card;
    if (!r.ok || !v) return void (note.textContent = reasonsOf(r.body).join(' · '));
    if (v.kind !== 'model') return void (note.textContent = 'è un suono: si apre nel SoundLab');
    const by = v.mine ? 'tua' : v.signature || 'un altro viandante';
    const size = boxFor(v.xml, v.class, v.size);
    o.open({ id: v.id, name: v.name, role: ROLE[v.class ?? ''] ?? 'prop', xml: v.xml, vpt: 20, source: `carta fatta a mano (${by})`, ...(size ? { size } : {}) });
  };
  const row = (c: HandmadeSummary) => {
    const b = el('button', { title: `${c.class ?? ''} · ${c.mine ? 'tua' : c.signature || 'un altro viandante'}` }, c.name);
    b.dataset.id = c.id;
    b.onclick = () => void openCard(c.id);
    const edit = el('a', { href: labLink('editor', { card: c.id }), class: 'small' }, c.mine ? 'editor' : 'guarda');
    return el('div', { class: 'row' }, b, ' ', el('span', { class: 'small' }, c.mine ? 'tua' : c.signature || '—'), ' ', edit);
  };
  list.replaceChildren(...models.map(row));
  const asked = sourceFromSearch(location.search);
  if (asked && 'card' in asked) await openCard(asked.card);
}
