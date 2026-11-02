import { describe, expect, it } from 'vitest';
import { canonWithRune, MAX_MAGIC_RUNES, NEW_RUNES_HEADING, validateNewRune } from '../src/kernel/magic';
import { FUTHARK } from '../src/kernel/runes';
import { MockModels } from '../src/kernel/ai/mock';
import { countItem } from '../src/kernel/inventory';
import { allCards } from '../src/kernel/cards';
import { canonSummary } from '../src/kernel/agents/council';
import type { TextCall } from '../src/kernel/ai/models';
import type { MagicRune } from '../src/kernel/types';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';

// As in world.ts.
const DT = 1 / 60;
async function boot(models = new MockModels()) {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models });
  for (let i = 0; i < 80; i++) {
    k.tick(DT);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(DT);
  return k;
}
function clearArea(k: Kernel) {
  const { ox, oy } = k.offset();
  const free = (c: number, r: number) => (k as any).freeCell(c, r) && !k.runeCells.has(`${c},${r}`) && k.tileAt(c, r) !== undefined && !k.buildingAt(c + 0.5, r + 0.5);
  for (let d = 0; d < 30; d++)
    for (const row of [d, -d])
      for (let col = -30; col < 0; col++) {
        let ok = true;
        for (let i = 0; i <= 8 && ok; i++) ok = free(col + i, row);
        if (!ok) continue;
        const p = k.playerPos();
        p.x = col + 0.5 - ox;
        p.y = row + 0.5 - oy;
        k.playerComp().facing = 'right';
        k.carpet()!.active = false;
        k.tick(DT);
        k.carpet()!.active = true;
        return;
      }
  throw new Error('nessuno spazio libero trovato');
}
const giveRunes = (k: Kernel, tokens: string[]) => tokens.forEach((t) => k.give(`rune:${t}`, 1));

const seed: Record<string, MagicRune> = {
  fuoco: { name: 'Kenaz', glyph: 'ᚲ', color: '#ff7a3a', element: 'fuoco', description: 'la fiaccola' },
  acqua: { name: 'Laguz', glyph: 'ᛚ', color: '#5ab8ff', element: 'acqua', description: 'il lago' },
};
const draft = { token: 'Sangue', nome: 'Wunjo', glifo: 'ᛝ', colore: '#C8323C', elemento: 'sangue', descrizione: 'la vena: lega, scambia', canone: 'segna i patti' };

describe('new magic runes (T57b)', () => {
  it('the validator lets in a rune of its own and repairs its form', () => {
    const ok = validateNewRune(draft, seed);
    expect(ok.errors).toEqual([]);
    expect(ok.rune).toMatchObject({ token: 'sangue', rune: { name: 'Wunjo', glyph: 'ᛝ', color: '#c8323c', element: 'sangue' }, canone: 'segna i patti' });
    // A glyph taken, a word rune's letter, or not one sign: a free sign instead; a colour that is not one: a colour.
    for (const glifo of ['ᚲ', FUTHARK[0], 'ab', '', 'x']) {
      const r = validateNewRune({ ...draft, glifo, colore: 'rosso' }, seed).rune!;
      expect(r.rune.glyph).not.toBe('ᚲ');
      expect(r.rune.glyph).not.toBe('ᛚ');
      expect(FUTHARK).not.toContain(r.rune.glyph);
      expect([...r.rune.glyph]).toHaveLength(1);
      expect(r.rune.color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('the validator refuses what would be mistaken or breaks the fourth wall', () => {
    expect(validateNewRune({ ...draft, token: 'fuoco' }, seed).errors.join()).toMatch(/già una runa/);
    expect(validateNewRune({ ...draft, token: 'fuochi' }, seed).errors.join()).toMatch(/troppo simile/);
    expect(validateNewRune({ ...draft, nome: 'Kenas' }, seed).errors.join()).toMatch(/troppo simile a «Kenaz»/);
    expect(validateNewRune({ ...draft, token: 'end' }, seed).errors.join()).toMatch(/riservata/);
    expect(validateNewRune({ ...draft, token: 'concilio' }, seed).errors.join()).toMatch(/riservata/);
    expect(validateNewRune({ ...draft, token: 'x2' }, seed).errors.join()).toMatch(/3-12 lettere/);
    expect(validateNewRune({ ...draft, canone: 'la incise chi osserva ogni viandante' }, seed).errors.join()).toMatch(/quarta parete/);
    const many = Object.fromEntries(Array.from({ length: MAX_MAGIC_RUNES }, (_, i) => [`r${i}`, seed.fuoco]));
    expect(validateNewRune(draft, many).errors.join()).toMatch(/il massimo/);
  });

  it('the canon gets one line per new rune, under its own heading', () => {
    const r = validateNewRune(draft, seed).rune!;
    const once = canonWithRune('# Il canone\n\nqualcosa\n', r);
    expect(once).toContain(NEW_RUNES_HEADING);
    expect(once).toContain('- ᛝ Wunjo («sangue», sangue): segna i patti');
    const twice = canonWithRune(once, { ...r, token: 'gelo', rune: { ...r.rune, name: 'Isaz' } });
    expect(twice.split(NEW_RUNES_HEADING)).toHaveLength(2);
    expect(twice).toContain('Isaz («gelo»');
  });

  it('a new rune enters the world: valid, in the canon and the loot, picked up and composed', async () => {
    const k = await boot();
    const before = Object.keys(k.content.runes).length;
    const token = await k.inventRune('una prova');
    expect(token).toBe('sangue');
    const rune = k.content.runes.sangue;
    expect(rune).toBeTruthy();
    expect(Object.keys(k.content.runes)).toHaveLength(before + 1);
    // Its own sign (the mock asked for a word rune's letter), committed with the canon and the loot.
    expect(FUTHARK).not.toContain(rune.glyph);
    expect(Object.values(k.content.runes).filter((r) => r.glyph === rune.glyph)).toHaveLength(1);
    expect(k.repo.head().message).toMatch(/runa nuova: sangue/);
    expect(k.files['world/canone.md']).toContain('Wunjo («sangue»');
    expect(canonSummary(k.files)).toContain('Wunjo («sangue», sangue)');
    expect(k.content.loot.magia.entries.some((e) => e.item === 'rune:sangue')).toBe(true);
    expect(k.content.get('rune:sangue')).toMatchObject({ category: 'magia', tags: ['runa', 'magica'] });
    expect(allCards(k.files).some((c) => c.id === 'runa:sangue' && c.tipo === 'runa' && c.autore === 'narratore')).toBe(true);
    expect(k.feed().some((e) => e.task === 'rune.invent' && /runa nuova/.test(e.text))).toBe(true);

    // On the ground like any rune: picked up, it goes to the phrase.
    clearArea(k);
    giveRunes(k, ['sangue']);
    expect(k.inscribe(['sangue'])).toBe(true);
    expect(countItem(k.inventory(), 'rune:sangue')).toBe(0);
    k.hand().tokens = [];
    k.carpet()!.active = false;
    k.tick(DT);
    expect(k.pickUpRune()).toBe(true);
    expect(countItem(k.inventory(), 'rune:sangue')).toBe(1);
    expect(k.hand().tokens).toEqual(['sangue']);

    // Composed with the others: a formula the Narrator names once.
    giveRunes(k, ['fuoco']);
    k.hand().tokens = ['sangue', 'fuoco'];
    k.needs()!.mana = 100;
    expect(k.incantation()).toEqual(['sangue', 'fuoco']);
    expect(await k.castSpell()).toBe(true);
    expect(k.content.spells['sangue fuoco']).toBeTruthy();

    // A second one is another rune; the same one never twice.
    expect(await k.inventRune('ancora')).toBe('ghiaccio');
    expect(Object.keys(k.content.runes)).toHaveLength(before + 2);
  });

  it('a session of the Council and a formula can ask for one', async () => {
    const models = new MockModels();
    const text = models.text.bind(models);
    models.text = async (call: TextCall) => {
      if (call.task === 'council.session') return JSON.stringify({ valutazione: 'manca il gelo', intervento: 'runa', richiesta: 'ghiaccio' });
      if (call.task === 'spell.name') return JSON.stringify({ nome: 'Patto', descrizione: 'un patto', costo: 8, effetti: [{ tipo: 'bisogni', salute: 5 }], runa_nuova: 'ombra' });
      return text(call);
    };
    const k = await boot(models);
    const asked: string[] = [];
    const orig = models.text;
    models.text = async (call: TextCall) => (call.task === 'rune.invent' && asked.push(call.prompt), orig(call));
    expect(await k.holdSession(true)).toBe('runa');
    expect(k.content.runes.sangue).toBeTruthy();
    expect(asked[0]).toMatch(/sessione del Concilio[^\n]*ghiaccio/);
    // The formula that calls for an element no rune has: one more rune, after the spell.
    clearArea(k);
    giveRunes(k, ['vita', 'acqua']);
    k.hand().tokens = ['vita', 'acqua'];
    k.needs()!.mana = 100;
    expect(await k.castSpell()).toBe(true);
    for (let i = 0; i < 40 && !k.content.runes.ghiaccio; i++) await new Promise((r) => setTimeout(r, 25));
    expect(k.content.runes.ghiaccio).toBeTruthy();
    expect(asked[1]).toMatch(/vita acqua[^\n]*ombra/);
  });
});
