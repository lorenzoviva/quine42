// The regions of the master in the studio (T375, ADR-0188 §5, ADR-0201): «Dichiara regione» in the Office of places (the atlas on the wall) and
// in the Direction, the same form; the regions the master declared, each with «Cambia» and «Libera». The kernel checks and writes them (on a
// mirror the world does): here only what the master asked, and the reasons when it does not hold. Only the master sees it.

import type { Kernel } from '../kernel/kernel';
import { MASTER_REGION_LIMITS, REGION_KIND_NAME, REGION_KIND_NOTE, regionKind, type Region, type RegionKind } from '../kernel/atlas';
import { NATURE_ACCEPTS } from '../kernel/nature';
import { el } from './dom';

type Kind = RegionKind | 'plan';
const KINDS: Kind[] = ['filler', 'held', 'plan'];

/** A hue for a text (an environment's id): the same on every map. */
export const hueOf = (s: string): number => {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 360;
};

/** The colour of a region on the maps: the Cartographer's by their environment, the master's by what they do. */
export function regionColor(r: Region): string {
  const kind = regionKind(r);
  if (kind === 'held') return 'hsl(0 0% 70%)';
  if (kind === 'filler') return `hsl(${hueOf(r.environment)} 45% 55%)`;
  return `hsl(${hueOf(r.environment)} 80% 60%)`;
}

/** A region in a line, for the master: name, kind, environment, where. */
export function regionLine(k: Kernel, r: Region): string {
  const kind: Kind = regionKind(r) ?? 'plan';
  const env = r.environment ? (k.content.layouts[r.environment]?.name ?? r.environment) : '';
  const gravity = typeof r.gravity === 'number' ? `, gravità ${r.gravity}` : '';
  const air = r.air === false ? ', senz’aria' : r.air === true ? ', con aria' : '';
  return `«${r.name}» — ${REGION_KIND_NAME[kind]}${env ? ` (${env})` : ''}, centro ${r.center[0]},${r.center[1]}, raggio ${r.radius}${gravity}${air}`;
}

export interface RegionFormOptions {
  /** Where the region goes when it is new: the place chosen on the map. */
  center: [number, number];
  /** A region of the master to change. */
  region?: Region;
  /** After the world wrote it: what to say, and who redraws. */
  done: (said: string, region: Region) => void;
  cancel: () => void;
}

/**
 * The form: name, description, centre, radius, what it does (filler, held, the Cartographer's environment), the environment among those the
 * world has, the gravity of its places (T447: empty, the world's) and, in a world that counts the breath, its air (T446: empty, the places'). «Dichiara» asks the kernel; what does not hold stays here with every reason.
 */
export function regionForm(k: Kernel, o: RegionFormOptions): HTMLElement {
  const L = MASTER_REGION_LIMITS;
  const r = o.region;
  const name = el('input', { placeholder: 'nome (lo leggono anche le persone)', maxlength: String(L.name), 'data-region': 'name', value: r?.name ?? '' }) as HTMLInputElement;
  const description = el('input', { placeholder: 'descrizione (facoltativa)', maxlength: String(L.description), 'data-region': 'description', value: r?.description ?? '' }) as HTMLInputElement;
  const num = (v: number, min: number, max: number, key: string) => el('input', { type: 'number', min: String(min), max: String(max), step: '1', value: String(v), style: 'width:5em', 'data-region': key }) as HTMLInputElement;
  const [x0, y0] = r?.center ?? o.center;
  const cx = num(x0, -L.reach, L.reach, 'cx');
  const cy = num(y0, -L.reach, L.reach, 'cy');
  const radius = num(r?.radius ?? 1, 0, L.radius, 'radius');
  const kind = el('select', { 'data-region': 'kind' }, ...KINDS.map((x) => el('option', { value: x }, REGION_KIND_NAME[x]))) as HTMLSelectElement;
  kind.value = r ? (regionKind(r) ?? 'plan') : 'filler';
  const layouts = Object.entries(k.content.layouts).sort((a, b) => a[1].name.localeCompare(b[1].name));
  const environment = el('select', { 'data-region': 'environment' }, el('option', { value: '' }, 'nessun ambiente'), ...layouts.map(([id, l]) => el('option', { value: id }, l.name))) as HTMLSelectElement;
  environment.value = r?.environment ?? layouts[0]?.[0] ?? '';
  const [glo, ghi] = NATURE_ACCEPTS.gravity;
  const gravity = el('input', { type: 'number', min: String(glo), max: String(ghi), step: '0.1', placeholder: 'del mondo', value: typeof r?.gravity === 'number' ? String(r.gravity) : '', style: 'width:6em', 'data-region': 'gravity' }) as HTMLInputElement;
  // The air only where it counts (T446): in a world of today no body has the need, a region would say it for nothing.
  const breath = k.nature().oxygen;
  const air = el('select', { 'data-region': 'air' }, el('option', { value: '' }, 'quella dei luoghi'), el('option', { value: 'true' }, 'con aria'), el('option', { value: 'false' }, 'senz’aria')) as HTMLSelectElement;
  air.value = typeof r?.air === 'boolean' ? String(r.air) : '';
  const meaning = el('div', { class: 'note' });
  const said = el('div', { class: 'note', 'data-region': 'said' });
  const explain = () => {
    const k2 = kind.value as Kind;
    meaning.textContent = `${REGION_KIND_NAME[k2]}: ${REGION_KIND_NOTE[k2]}. I luoghi già pianificati restano come sono.`;
  };
  kind.onchange = explain;
  explain();
  const declare = el('button', { class: 'primary', 'data-region': 'declare' }, r ? 'Cambia' : 'Dichiara');
  declare.onclick = () => {
    declare.setAttribute('disabled', '');
    const request = {
      ...(r ? { id: r.id } : {}),
      name: name.value,
      description: description.value,
      center: [Number(cx.value), Number(cy.value)],
      radius: Number(radius.value),
      kind: kind.value,
      environment: environment.value,
      ...(gravity.value.trim() ? { gravity: Number(gravity.value) } : {}),
      ...(breath && air.value ? { air: air.value === 'true' } : {}),
    };
    void k
      .declareRegion(request)
      .then((a) => (a.ok ? o.done(`✓ ${regionLine(k, a.region)}`, a.region) : said.replaceChildren(...a.reasons.map((why) => el('div', {}, `✗ ${why}`)))))
      .catch((e: Error) => said.replaceChildren(el('div', {}, `✗ ${e.message}`)))
      .finally(() => declare.removeAttribute('disabled'));
  };
  const cancel = el('button', {}, 'Annulla');
  cancel.onclick = o.cancel;
  return el(
    'div',
    { class: 'region-form', 'data-region-form': '' },
    el('div', { class: 'section' }, r ? `Cambia la regione «${r.name}»` : 'Dichiara regione'),
    el('div', { class: 'row' }, name),
    el('div', { class: 'row' }, description),
    el('div', { class: 'row' }, 'centro ', cx, ' ', cy, ' raggio ', radius, ' luoghi'),
    el('div', { class: 'row' }, kind, ' ', environment),
    el('div', { class: 'row', title: `il salto e il passo nei suoi luoghi; 1 è la terra, da ${glo} a ${ghi}` }, 'gravità ', gravity),
    ...(breath ? [el('div', { class: 'row', title: 'se nei suoi luoghi si respira: senza, l’ossigeno cala' }, 'aria ', air)] : []),
    meaning,
    said,
    el('div', { class: 'row' }, declare, cancel),
  );
}

/** The regions the master declared, each with «Cambia» (`change`) and «Libera»; `changed` redraws who shows them, with what was said. */
export function masterRegionRows(k: Kernel, regions: Region[], change: (r: Region) => void, changed: (said: string, gone?: string) => void): HTMLElement[] {
  const mine = regions.filter((r) => r.master);
  if (!mine.length) return [el('div', { class: 'note' }, 'Nessuna regione del master.')];
  return mine.map((r) => {
    const edit = el('button', {}, 'Cambia');
    edit.onclick = () => change(r);
    const free = el('button', { 'data-region-release': r.id }, 'Libera');
    free.onclick = () => {
      free.setAttribute('disabled', '');
      void k
        .releaseRegion(r.id)
        .then((a) => (a.ok ? changed(`✓ «${a.region.name}» liberata: i suoi luoghi nuovi si pianificano come il resto del mondo`, a.region.id) : changed(`✗ ${a.reasons.join(' · ')}`)))
        .catch((e: Error) => changed(`✗ ${e.message}`));
    };
    return el('div', { class: 'item', 'data-master-region': r.id }, el('span', { style: `color:${regionColor(r)}` }, '■ '), regionLine(k, r), ' ', edit, ' ', free);
  });
}
