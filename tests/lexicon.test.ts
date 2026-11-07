import { describe, expect, it } from 'vitest';
import { Council, lexiconSummary, wordsOf, type Bible } from '../src/kernel/agents/council';
import { bundledFiles } from '../src/kernel/bundle';
import { upgradeFromSeed } from '../src/kernel/universes';
import { OWN_CUSTOMS, bibleBreaks, cleanBible, glossaryBreak, metaBreak } from '../src/kernel/fourthwall';
import { reviewPlot, type Plot } from '../src/kernel/plots';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { AiModels, TextCall } from '../src/kernel/ai/models';
import type { FileMap } from '../src/kernel/types';
import { internalFields } from '../src/kernel/internalNames';

/** A Council whose model only records what it is asked. */
function council(files: FileMap) {
  const asked: TextCall[] = [];
  const models = { text: async (r: TextCall) => (asked.push(r), '{}') } as unknown as AiModels;
  return { c: new Council(models, () => ({ files, palette: {}, catalog: [] })), asked };
}

const bible = (extra: Partial<Bible> = {}): Bible => ({ title: 'Valmora', tone: 'caldo', summary: 'Un regno quieto.', places: [], characters: [], facts: [], mysteries: [], ...extra });

describe('the lexicon (T65)', () => {
  const lexicon = bundledFiles['world/lexicon.md'];
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
    const files: FileMap = { ...bundledFiles, 'world/bible.json': JSON.stringify(bible({ customs: ['Chi vende il primo pane lo lascia sulla soglia.'] })) };
    const { c, asked } = council(files);
    for (const agent of ['narrator', 'arbiter'] as const) {
      const ctx = c.context(agent);
      expect(ctx).toMatch(/## Lexicon of the world[\s\S]*never explaining it/);
      expect(ctx).toContain('**bonombo**');
      expect(ctx).toMatch(/### Customs of this world\n- Chi vende il primo pane/);
      expect(c.context(agent, true)).toContain('## Lexicon of the world');
    }
    for (const agent of ['sculptor', 'artist', 'physicist', 'engineer', 'cartographer', 'liaison'] as const) expect(c.context(agent)).not.toContain('Lexicon of the world');
    await c.ask('narrator', 'npc.reply', 'una battuta', { type: 'OBJECT' });
    expect(asked[0].system).toContain('Lexicon of the world');
  });

  it('an old universe receives it from the seed; without it, nothing', () => {
    const old: FileMap = { ...bundledFiles };
    delete old['world/lexicon.md'];
    expect(lexiconSummary(old)).toBe('');
    expect(wordsOf(old)).toEqual([]);
    expect(upgradeFromSeed(old, bundledFiles).files['world/lexicon.md']).toBe(lexicon);
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
      facts: ['Al forno si dice «bonombo» a ogni cliente.', 'Lerpio vuol dire bello, dicono al porto.'],
      customs: ['Bonombo: si dice solo di sera.', 'Si brinda battendo i bicchieri sul tavolo.', 'Chi perde una scommessa canta.', 'Le vedove portano un nastro verde.', 'I bambini scelgono il nome del cane.'],
    });
    expect(bibleBreaks(b, words).join(' ')).toContain('Lerpio vuol dire');
    const clean = cleanBible(b, words);
    expect(clean.facts).toEqual(['Al forno si dice «bonombo» a ogni cliente.']);
    expect(clean.customs).toHaveLength(OWN_CUSTOMS);
    expect(clean.customs).not.toContain('Bonombo: si dice solo di sera.');
    expect(cleanBible(bible({ customs: [] }), words).customs).toBeUndefined();
  });

  it('a plot that translates the lexicon goes back to the Narrator', () => {
    const people = { people: [{ name: 'Anselmo', species: 'person', gender: 'male', family: [] }], expected: [] } as never;
    const plot = { id: 't1', title: 'Il saluto', state: 'active', mystery: 'Anselmo insegna che «bonombo» significa ciao.', involved: [], beats: [{ who: 'Anselmo', what: 'saluta i forestieri' }] } as unknown as Plot;
    expect(reviewPlot(plot, people, words).problems.join(' ')).toMatch(/spiega il lessico/);
    expect(reviewPlot(plot, people).problems.join(' ')).not.toMatch(/spiega il lessico/);
  });

  it('the offline Narrator writes a bible with a custom of its own', async () => {
    const models = new MockAiModels();
    const text = await models.text({ agent: 'narrator', task: 'genesis.bible', system: '', prompt: '', data: { theme: 'x' } } as TextCall);
    // The Narrator answers with the Italian fields of its schema (until T310): the kernel reads them with those of 0.4.
    const b = internalFields('bible', JSON.parse(text)) as Bible;
    expect(cleanBible(b, words).customs?.length).toBe(1);
  });
});
