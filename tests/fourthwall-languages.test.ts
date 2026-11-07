// The fourth wall in more languages (T310, ADR-0165): the filter reads the language of the world, Italian and English; every table
// catches its test phrases and leaves twenty harmless ones alone. The Language block says in what language the world is written.
import { describe, expect, it } from 'vitest';
import { glossaryBreak, metaBreak, metaLanguages } from '../src/kernel/fourthwall';
import { DEFAULT_LANGUAGE, detectLanguage, languageBlock, languageOf } from '../src/kernel/language';
import { bundledFiles } from '../src/kernel/bundle';
import { wordsOf } from '../src/kernel/agents/council';

/** The phrases of tests/fourthwall.test.ts (the author's analysis and the others), in each language. */
const BREAKS = {
  it: [
    'Alcuni anziani sussurrano che tornare sempre in piazza sia un dono di benevolenza per non far perdere nessuno nella vastità del mondo.',
    'Circola voce che il Re Muto, che riposa sotto le acque del lago, osservi ogni viandante attraverso il riflesso della luna.',
    'Nessun viandante è mai riuscito a superare il confine del bosco senza tornare sui suoi passi.',
    'Scava freneticamente vicino a un simbolo luminoso che sembra cambiare forma.',
    'Chi cammina troppo a lungo si ritrova in piazza.',
    'Le lettere luminose affiorano dopo la pioggia.',
    'Un confine invalicabile chiude la valle.',
    'Il mondo si ripete ogni notte.',
    'Il vecchio dice che il mondo è una simulazione.',
    'Il Concilio degli agenti ha deciso così.',
  ],
  en: [
    'Some old folk whisper that always coming back to the square is a gift of kindness, so that no one ever gets lost in the vastness of the world.',
    'Word goes round that the Mute King, who rests beneath the waters of the lake, watches every wanderer through the reflection of the moon.',
    'No wanderer has ever managed to cross the edge of the wood without retracing their steps.',
    'He digs frantically near a glowing symbol that seems to change shape.',
    'Whoever walks too far finds themselves back in the square.',
    'The letters of light surface after the rain.',
    'An uncrossable border closes the valley.',
    'The world starts over every night.',
    'The old man says the world is a simulation.',
    'The council of agents decided so.',
  ],
};

/** Twenty harmless phrases per language: the life of the world, with the words a table must not take (a loop of rope, a waiter, corn). */
const HARMLESS = {
  it: [
    'La sera torna in piazza a chiacchierare con le comari.',
    'Conserverà il pane per l’inverno; la guardia osserva il viandante con sospetto.',
    'Raccoglie le rune e le vende al mercato; dice che la luce del segno è più forte d’inverno.',
    'Supera il confine del regno con un carro di lana.',
    'Il fornaio impasta il pane prima dell’alba.',
    'Il codice della corporazione vieta il lavoro di notte.',
    'Il fiume fa un’ansa larga attorno al mulino.',
    'La guardia sorveglia il ponte di notte.',
    'Il mercato apre il martedì e chiude al tramonto.',
    'Suo fratello deve al mugnaio tre sacchi di farina.',
    'Il lago canta quando il vento è forte.',
    'Una volpe ruba le galline alla fattoria vicino al guado.',
    'Il pastore conta quaranta pecore prima di sera.',
    'Il viandante trova riparo nel fienile.',
    'Le lanterne della locanda restano accese fino a tardi.',
    'Un calciatore del borgo vicino sposa la figlia del fabbro.',
    'Alla radio danno la trasmissione della domenica.',
    'Il calcolatore dell’ufficio fa i conti delle tasse.',
    'La strega del bosco legge le rune alla luce di una candela.',
    'Chi parte all’alba arriva alla torre prima di mezzogiorno.',
  ],
  en: [
    'In the evening she goes back to the square to chat with her neighbours.',
    'The guard watches the wanderer with suspicion.',
    'He crosses the border of the kingdom with a cart of wool.',
    'She picks up runes and sells them at the market; she says the light of the sign is stronger in winter.',
    'The baker kneads the bread before dawn.',
    'A loop of rope hangs from the well.',
    'The corn kernels dry on the roof of the barn.',
    'The server at the inn brings a jug of cider.',
    'A bug crawls along the windowsill.',
    'The festival program is pinned on the church door.',
    'The code of the guild forbids night work.',
    'He renders the fat for soap.',
    'The river makes a wide bend around the mill.',
    'Her brother owes the miller three sacks of flour.',
    'The lake sings when the wind is strong.',
    'A fox steals hens from the farm by the ford.',
    'The shepherd counts forty sheep before evening.',
    'The wanderer finds shelter in the hayloft.',
    'The lanterns of the inn stay lit until late.',
    'A footballer from the next village marries the smith’s daughter.',
  ],
};

const GLOSSARY = {
  it: ['«bonombo» significa ciao', 'lerpio vuol dire bello', '«macico», cioè un tale', 'la parola bonombo la dicono tutti'],
  en: ['"bonombo" means hello', 'lerpio is a word for beautiful', '"macico", that is a fellow', 'the word bonombo is said by everyone'],
};
const SPEECH = {
  it: ['«Bonombo!» grida il fornaio dalla soglia.', 'il macico sta per partire'],
  en: ['"Bonombo!" the baker shouts from the doorstep.', 'the macico is about to leave'],
};

describe('the fourth wall in the language of the world, Italian and English', () => {
  it('reads the language of the world, Italian and English, each once', () => {
    expect(metaLanguages()).toEqual(['it', 'en']);
    expect(metaLanguages('en')).toEqual(['en', 'it']);
    expect(metaLanguages('fr')).toEqual(['fr', 'it', 'en']);
  });

  for (const lang of ['it', 'en'] as const) {
    it(`catches the test phrases in ${lang}, whatever the language of the world`, () => {
      for (const t of BREAKS[lang]) {
        expect(metaBreak(t, [], 'it'), t).toBeTruthy();
        expect(metaBreak(t, [], 'en'), t).toBeTruthy();
      }
    });

    it(`leaves twenty harmless phrases in ${lang} alone, in a world of ${lang}`, () => {
      expect(HARMLESS[lang]).toHaveLength(20);
      for (const t of HARMLESS[lang]) expect(metaBreak(t, [], lang), t).toBeUndefined();
    });

    it(`catches a glossary in ${lang}, and not plain speech`, () => {
      const words = wordsOf(bundledFiles);
      expect(words).toEqual(expect.arrayContaining(['bonombo', 'lerpio', 'macico']));
      for (const t of GLOSSARY[lang]) expect(glossaryBreak(t, words), t).toBeTruthy();
      for (const t of SPEECH[lang]) expect(glossaryBreak(t, words, lang), t).toBeUndefined();
    });
  }

  it('the Italian words borrowed from the Council’s table count only in an Italian world', () => {
    expect(metaBreak('Il server del castello è caduto.')).toBeTruthy();
    expect(metaBreak('The server at the inn brings a jug of cider.', [], 'en')).toBeUndefined();
  });
});

describe('the Language block', () => {
  it('a universe that says no language speaks Italian; a language it does not know is Italian too', () => {
    expect(DEFAULT_LANGUAGE).toBe('it');
    expect(languageOf(bundledFiles)).toBe('it');
    expect(languageOf({ 'universe.json': JSON.stringify({ language: 'en' }) })).toBe('en');
    expect(languageOf({ 'universe.json': JSON.stringify({ language: 'klingon' }) })).toBe('it');
    expect(languageOf({ 'universe.json': '{' })).toBe('it');
  });

  it('says the language of the world, that the ids stay English, and the world’s words for what is forbidden', () => {
    const it_ = languageBlock('it');
    expect(it_).toMatch(/^## Language of the world: Italian \(it\)/);
    expect(it_).toContain('Ids stay as the schema gives them, in English');
    expect(it_).toContain('«calcolatore»');
    expect(languageBlock('en')).toContain('"footballer"');
    // A language without its own words says the English ones.
    expect(languageBlock('fr')).toContain('French');
    expect(languageBlock('fr')).toContain('"footballer"');
    // The block is a prompt: it breaks no wall in any language.
    expect(metaBreak(it_.replace(/never «[^:]*:/, ''))).toBeUndefined();
  });

  it('tells a text in Italian from one in English, and says nothing of a short one', () => {
    expect(detectLanguage('Il fornaio della piazza impasta il pane per tutto il borgo, e la sera lo vende alla locanda.')).toBe('it');
    expect(detectLanguage('The baker of the square kneads the bread for the whole village, and in the evening he sells it at the inn.')).toBe('en');
    expect(detectLanguage('Lume')).toBeUndefined();
  });
});
