// The gallery of the cards (T104): what a card says, its rarity, its chain of holders, its picture.
import { describe, expect, it } from 'vitest';
import { allCards, CARDS_FILE, type Card } from '../src/kernel/cards';
import { bundledFiles } from '../src/kernel/bundle';
import { Forms, InlineRunner } from '../src/kernel/forms';
import { fingerprint } from '../src/kernel/heritage';
import type { FileMap } from '../src/kernel/types';
import { publicFiles } from '../src/session/files';
import { cardPicture } from '../site/carte-art';
import { artOf, chainOf, collectionView, describeCard, inCategory, mhCode, PAGE, rarityOf, wandererFrom } from '../site/carte';

const carta = (titolare: string, origini?: unknown) => ({ autore: 'narratore', pagante: titolare, titolare, ...(origini ? { origini } : {}) });
const print = (t: string) => fingerprint(t);

/** A small universe of cards: an item pack, an individual, a plot, a place that came with a clone, a rule. */
function universe(): FileMap {
  const models = JSON.parse(bundledFiles['models/index.json'] ?? '{}');
  return {
    ...bundledFiles,
    'universe.json': JSON.stringify({ name: 'seconda', seed: 7 }),
    'modules/pack/manifest.json': JSON.stringify({
      id: 'pack',
      name: 'Pacchetto',
      kind: 'data',
      carta: carta('anna'),
      items: [
        { id: 'spada', name: 'Spada di fuliggine', description: 'Lama forgiata nella cenere. <b>Brucia</b>.', color: '#aa4422', carta: carta('io', [{ titolare: 'anna', universo: 'prima', impronta: print('altro testo, molto diverso') }]) },
        { id: 'pane', name: 'Pane', description: 'x'.repeat(300), color: '#ccaa66', carta: carta('io') },
      ],
    }),
    'models/index.json': JSON.stringify(models),
    'world/people.json': JSON.stringify({ persone: [{ nome: 'Mira', tipo: 'assente', mestiere: 'fornaia', famiglia: [], routine: [], carta: carta('io') }] }),
    'world/plots.json': JSON.stringify({ trame: [{ id: 'furto', titolo: 'Il furto', mistero: 'Chi ha preso il pane?', coinvolti: ['Mira'], tappe: [], inizio: 0, stato: 'attiva', carta: carta('bruno') }] }),
    'world/rules.json': JSON.stringify({ regole: [{ chiave: 'canto', testo: 'Il canto calma i lupi', carta: carta('io') }] }),
    [CARDS_FILE]: JSON.stringify({
      utilizzi: { 'oggetto:spada': { luoghi: 14, trame: 6, prompt: 31 }, 'oggetto:pane': { luoghi: 1, trame: 0, prompt: 0 }, 'regola:canto': { luoghi: 60, trame: 20, prompt: 20 }, 'luogo:0_0': { luoghi: 9, trame: 0, prompt: 1 } },
      luoghi: { '0_0': { ...carta('bruno', [{ titolare: 'io', universo: 'prima', impronta: print('La piazza') }]), nome: 'La piazza' } },
    }),
  };
}

describe('la galleria delle carte', () => {
  it('la rarità cresce con gli utilizzi', () => {
    expect(rarityOf({ luoghi: 0, trame: 0, prompt: 4 })).toBe('comune');
    expect(rarityOf({ luoghi: 2, trame: 2, prompt: 1 })).toBe('rara');
    expect(rarityOf({ luoghi: 14, trame: 6, prompt: 31 })).toBe('epica');
    expect(rarityOf({ luoghi: 60, trame: 20, prompt: 20 })).toBe('leggendaria');
  });

  it('la collezione: le carte del viandante, le più usate prima, e ciò che riceve', () => {
    const c = collectionView(universe(), 'io', 'seconda');
    expect(c.mine.map((v) => v.card.id).slice(0, 2)).toEqual(['regola:canto', 'oggetto:spada']);
    expect(c.mine.every((v) => v.card.titolare === 'io')).toBe(true);
    expect(c.stats).toMatchObject({ totale: 4, rare: 1, leggendarie: 1 });
    // The square is now of Bruno, but it was of whoever looks: 50% of its 10 uses (content never changed).
    expect(c.received.map((v) => v.card.id)).toEqual(['luogo:0_0']);
    expect(c.received[0].quota).toBeCloseTo(0.5);
    expect(c.stats.rendita).toBeCloseTo(5);
    expect(inCategory(c, 'eredita')).toBe(c.received);
    expect(inCategory(c, 'magie')).toEqual([]);
    expect(inCategory(c, 'storie').map((v) => v.card.id)).toEqual(['regola:canto']);
  });

  it('la catena dei titolari: dal primo a quello di ora, con le quote che sommano a 1', () => {
    const files = universe();
    const spada = allCards(files, true).find((c) => c.id === 'oggetto:spada')!;
    const chain = chainOf(spada, 'seconda');
    expect(chain.map((l) => [l.titolare, l.universo])).toEqual([['anna', 'prima'], ['io', 'seconda']]);
    expect(chain[0].cambio).toBeGreaterThan(0.5);
    expect(chain[1].cambio).toBeUndefined();
    expect(chain[0].quota! + chain[1].quota!).toBeCloseTo(1);
    expect(chain[0].mh).toMatch(/^mh:[0-9a-f]{8}$/);
    expect(chain[1].mh).toBe(mhCode(spada.impronta));
    expect(chain[1].mh).not.toBe(chain[0].mh);
  });

  it('una carta senza eredità è tutta del titolare; chi torna nella catena ha una quota sola', () => {
    const base: Card = { id: 'oggetto:x', tipo: 'oggetto', nome: 'X', file: 'f', autore: 'a', pagante: 'io', titolare: 'io', utilizzi: { luoghi: 0, trame: 0, prompt: 0 }, impronta: [1] };
    expect(chainOf(base, 'u')).toEqual([{ titolare: 'io', universo: 'u', mh: 'mh:00000001', quota: 1 }]);
    const back = chainOf({ ...base, origini: [{ titolare: 'io', universo: 'p', impronta: [2] }], quote: { io: 1 } }, 'u');
    expect(back.map((l) => l.quota)).toEqual([1, undefined]);
  });

  it('la frase del fronte viene dal contenuto ed è corta; senza testo dice che cosa è', () => {
    const files = universe();
    const by = (id: string) => allCards(files, true).find((c) => c.id === id)!;
    expect(describeCard(by('oggetto:spada'), files)).toContain('Lama forgiata');
    expect(describeCard(by('oggetto:pane'), files).length).toBeLessThanOrEqual(120);
    expect(describeCard(by('persona:mira'), files)).toBe('fornaia');
    expect(describeCard(by('regola:canto'), files)).toBe('Regola del mondo di questo universo.');
  });

  it('la frase del fronte da ciò che dà publicFiles: description e mestiere; senza, la riga generica (T168)', () => {
    const whole: FileMap = {
      ...universe(),
      'modules/cosa/manifest.json': JSON.stringify({ id: 'cosa', name: 'Cosa', kind: 'entity', lore: 'Segreto del Concilio', appearance: { aspetto: 'Segreto anche lui' }, carta: carta('io') }),
      'modules/detta/manifest.json': JSON.stringify({ id: 'detta', name: 'Detta', kind: 'entity', description: 'Una cosa che si dice.', lore: 'Segreto', carta: carta('io') }),
    };
    const files = publicFiles(whole);
    const by = (id: string) => allCards(whole, true).find((c) => c.id === id)!;
    expect(describeCard(by('tipo:cosa'), files)).toBe('Cosa del mondo di questo universo.');
    expect(describeCard(by('tipo:detta'), files)).toBe('Una cosa che si dice.');
    expect(describeCard(by('oggetto:spada'), files)).toContain('Lama forgiata');
    expect(describeCard(by('persona:mira'), files)).toBe('fornaia');
    expect(describeCard(by('trama:furto'), files)).toBe('Storia di questo universo.');
    // Even a file that still said it, as an old snapshot could: only what is public is read.
    expect(describeCard(by('tipo:cosa'), whole)).toBe('Cosa del mondo di questo universo.');
  });

  it('con ciò che dà publicFiles una carta con un corpo ha la foto; un luogo no, e resta la gemma (T168)', () => {
    const whole: FileMap = { ...universe(), 'modules/cosa/manifest.json': JSON.stringify({ id: 'cosa', name: 'Cosa', kind: 'entity', appearance: { classe: 'object' }, carta: carta('io') }) };
    const files = publicFiles(whole);
    const forms = new Forms(new InlineRunner());
    forms.load(files);
    const by = (id: string) => allCards(whole, true).find((c) => c.id === id)!;
    expect(artOf(by('oggetto:spada'), files, forms)?.model).toBe('object');
    expect(artOf(by('tipo:cosa'), files, forms)?.xml).toBeTruthy();
    // A universe played offline has only cards of places: no picture, so no worker starts. It is what they are, not a fault.
    expect(artOf(by('luogo:0_0'), files, forms)).toBeUndefined();
  });

  it('una carta con un corpo ha la sua miniatura a voxel, le altre no', () => {
    const files = universe();
    const forms = new Forms(new InlineRunner());
    forms.load(files);
    const by = (id: string) => allCards(files, true).find((c) => c.id === id)!;
    const req = artOf(by('oggetto:spada'), files, forms);
    expect(req?.model).toBe('object');
    expect(artOf(by('regola:canto'), files, forms)).toBeUndefined();
    expect(artOf(by('trama:furto'), files, forms)).toBeUndefined();
    const pic = cardPicture(req!);
    expect(pic.w).toBeGreaterThan(8);
    expect(pic.w).toBeLessThanOrEqual(240);
    expect(pic.data.length).toBe(pic.w * pic.h * 4);
    expect(pic.data.some((v, i) => i % 4 === 3 && v === 255)).toBe(true);
  });

  it('di chi è la collezione: l’indirizzo, poi l’account, poi chi gioca da solo', () => {
    expect(wandererFrom('?viandante=anna', 'UID1')).toBe('anna');
    expect(wandererFrom('', 'UID1')).toBe('uid1');
    expect(wandererFrom('')).toBe('io');
  });

  it('un universo senza carte dà una collezione vuota, senza errori', () => {
    const c = collectionView({ ...bundledFiles }, 'nessuno', 'aurora');
    expect(c.mine).toEqual([]);
    expect(c.received).toEqual([]);
    expect(PAGE).toBeGreaterThan(0);
  });
});
