import { describe, expect, it } from 'vitest';
import { Council, lexiconSummary, wordsOf, type Bible } from '../src/kernel/agents/council';
import { bundledFiles } from '../src/kernel/bundle';
import { upgradeFromSeed } from '../src/kernel/universes';
import { OWN_CUSTOMS, bibleBreaks, cleanBible, glossaryBreak, metaBreak } from '../src/kernel/fourthwall';
import { reviewPlot, type Plot } from '../src/kernel/plots';
import { MockModels } from '../src/kernel/ai/mock';
import type { Models, TextCall } from '../src/kernel/ai/models';
import type { FileMap } from '../src/kernel/types';

/** A Council whose model only records what it is asked. */
function council(files: FileMap) {
  const asked: TextCall[] = [];
  const models = { text: async (r: TextCall) => (asked.push(r), '{}') } as unknown as Models;
  return { c: new Council(models, () => ({ files, palette: {}, catalog: [] })), asked };
}

const bible = (extra: Partial<Bible> = {}): Bible => ({ titolo: 'Valmora', tono: 'caldo', sintesi: 'Un regno quieto.', luoghi: [], personaggi: [], fatti: [], misteri: [], ...extra });

describe('the lexicon (T65)', () => {
  const lexicon = bundledFiles['world/lessico.md'];
  const words = wordsOf(bundledFiles);

  it('is in the seed: 15-20 entries, at most 6 substituted words, nothing of the Council’s table', () => {
    expect(lexicon).toBeTruthy();
    for (const s of ['## Parole che si dicono così', '## Saluti e buone maniere', '## Usanze', '## Modi di dire', '## Come si usa']) expect(lexicon).toContain(s);
    const section = (title: string) => (lexicon.split(`## ${title}`)[1] ?? '').split('\n## ')[0];
    const entries = ['Parole che si dicono così', 'Saluti e buone maniere', 'Usanze', 'Modi di dire'].reduce((n, t) => n + (section(t).match(/^- /gm) ?? []).length, 0);
    expect(entries).toBeGreaterThanOrEqual(15);
    expect(entries).toBeLessThanOrEqual(20);
    expect((section('Parole che si dicono così').match(/^- /gm) ?? []).length).toBeLessThanOrEqual(6);
    for (const w of ['bonombo', 'macico', 'macica', 'macichi', 'lerpio', 'pagosso', 'Ciok Ciok']) expect(words).toContain(w);
    for (const line of lexicon.split('\n')) expect(metaBreak(line)).toBeUndefined();
  });

  it('goes with every narrative task (Narrator and Arbiter), with the customs the universe added', async () => {
    const files: FileMap = { ...bundledFiles, 'world/bible.json': JSON.stringify(bible({ usanze: ['Chi vende il primo pane lo lascia sulla soglia.'] })) };
    const { c, asked } = council(files);
    for (const agent of ['narratore', 'arbitro'] as const) {
      const ctx = c.context(agent);
      expect(ctx).toMatch(/## Lessico del mondo[\s\S]*senza mai spiegarlo/);
      expect(ctx).toContain('**bonombo**');
      expect(ctx).toMatch(/### Usanze di questo mondo\n- Chi vende il primo pane/);
      expect(c.context(agent, true)).toContain('## Lessico del mondo');
    }
    for (const agent of ['scultore', 'artista', 'fisico', 'ingegnere', 'cartografo', 'referente'] as const) expect(c.context(agent)).not.toContain('Lessico del mondo');
    await c.ask('narratore', 'npc.reply', 'una battuta', { type: 'OBJECT' });
    expect(asked[0].system).toContain('Lessico del mondo');
  });

  it('an old universe receives it from the seed; without it, nothing', () => {
    const old: FileMap = { ...bundledFiles };
    delete old['world/lessico.md'];
    expect(lexiconSummary(old)).toBe('');
    expect(wordsOf(old)).toEqual([]);
    expect(upgradeFromSeed(old, bundledFiles).files['world/lessico.md']).toBe(lexicon);
  });

  it('is never explained like a glossary inside the world, but it can be spoken', () => {
    for (const t of ['«Bonombo» significa buongiorno.', 'lerpio vuol dire bello', '«macico», cioè un tale', 'la parola pagosso viene dal nord', 'Ciok Ciok equivale a una radio'])
      expect(glossaryBreak(t, words), t).toBeTruthy();
    for (const t of ['Bonombo bonombo, Anselmo!', 'il macico sta per partire', 'Che lerpio, questo pane!', 'Un lerpio regalo significa molto.', 'Lo sa anche Ciok Ciok.', 'Il pagosso benedice il raccolto.'])
      expect(glossaryBreak(t, words), t).toBeUndefined();
    expect(glossaryBreak('«Bonombo» significa buongiorno.', [])).toBeUndefined();
    expect(metaBreak('«Bonombo» significa buongiorno.', words)).toBeTruthy();
  });

  it('a bible keeps few customs of its own, none that explains or redefines a word', () => {
    const b = bible({
      fatti: ['Al forno si dice «bonombo» a ogni cliente.', 'Lerpio vuol dire bello, dicono al porto.'],
      usanze: ['Bonombo: si dice solo di sera.', 'Si brinda battendo i bicchieri sul tavolo.', 'Chi perde una scommessa canta.', 'Le vedove portano un nastro verde.', 'I bambini scelgono il nome del cane.'],
    });
    expect(bibleBreaks(b, words).join(' ')).toContain('Lerpio vuol dire');
    const clean = cleanBible(b, words);
    expect(clean.fatti).toEqual(['Al forno si dice «bonombo» a ogni cliente.']);
    expect(clean.usanze).toHaveLength(OWN_CUSTOMS);
    expect(clean.usanze).not.toContain('Bonombo: si dice solo di sera.');
    expect(cleanBible(bible({ usanze: [] }), words).usanze).toBeUndefined();
  });

  it('a plot that translates the lexicon goes back to the Narrator', () => {
    const people = { persone: [{ nome: 'Anselmo', specie: 'persona', genere: 'maschile', legami: [] }], attesi: [] } as never;
    const plot = { id: 't1', titolo: 'Il saluto', stato: 'aperta', mistero: 'Anselmo insegna che «bonombo» significa ciao.', tappe: [{ chi: 'Anselmo', cosa: 'saluta i forestieri' }] } as unknown as Plot;
    expect(reviewPlot(plot, people, words).problems.join(' ')).toMatch(/spiega il lessico/);
    expect(reviewPlot(plot, people).problems.join(' ')).not.toMatch(/spiega il lessico/);
  });

  it('the offline Narrator writes a bible with a custom of its own', async () => {
    const models = new MockModels();
    const text = await models.text({ agent: 'narratore', task: 'genesis.bible', system: '', prompt: '', data: { theme: 'x' } } as TextCall);
    const b = JSON.parse(text) as Bible;
    expect(cleanBible(b, words).usanze?.length).toBe(1);
  });
});
