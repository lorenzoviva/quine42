// The documentation in levels (T524, ADR-0266): level 1 fits two pages, says no state of the day, reaches every link, has a line
// for every inviolable rule of the core and a link for every section of the details; every document at the top of docs/ has a level.
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  anchorsOf,
  coreRuleIds,
  linksOf,
  overviewProblems,
  overviewRuleIds,
  sectionOf,
  slugOf,
  unlevelled,
  VOLATILE,
} from '../tools/documenti/livelli';

const ROOT = path.resolve(__dirname, '..');

describe('i livelli della documentazione', () => {
  it('la panoramica tiene: tetto, link, regole, sezioni, il rimando dal nucleo', () => {
    expect(overviewProblems(ROOT)).toEqual([]);
  });

  it('ogni documento in cima a docs/ ha un livello', () => {
    expect(unlevelled(ROOT)).toEqual([]);
  });
});

describe('ciò che i controlli leggono', () => {
  it("l'ancora di un titolo è quella di GitHub", () => {
    expect(slugOf('Regole inviolabili')).toBe('regole-inviolabili');
    expect(slugOf("Gemini, l'Attore, i coefficienti")).toBe('gemini-lattore-i-coefficienti');
    const anchors = anchorsOf('<a id="stack"></a>\n## Stack e persistenza\n### Più giù\n');
    expect([...anchors]).toEqual(['stack', 'stack-e-persistenza', 'più-giù']);
  });

  it('i link verso un sito non contano, quelli del repository sì, con la loro riga', () => {
    const links = linksOf('[a](https://x.org) [b](../AGENTS.md#regole)\n[c](design/)');
    expect(links).toEqual([
      { href: '../AGENTS.md#regole', line: 1 },
      { href: 'design/', line: 2 },
    ]);
  });

  it('le regole si leggono dal nucleo e dalla panoramica', () => {
    const core = '## Regole inviolabili\n\n0. **Uno**\n8b. **Due**\n8b-bis. **Tre**\n   10. **non è a inizio riga**\n## Stack\n11. **fuori**\n';
    expect(coreRuleIds(core)).toEqual(['0', '8b', '8b-bis']);
    const overview = '## Le regole inviolabili, una riga ciascuna\n\n- **0** Uno.\n- **8b-bis** Tre.\n## Altro\n- **9** fuori\n';
    expect(overviewRuleIds(overview)).toEqual(['0', '8b-bis']);
    expect(sectionOf(overview, 'Altro').trim()).toBe('- **9** fuori');
  });

  it('un task o una versione sono stati del giorno, il resto no', () => {
    const says = (text: string) => VOLATILE.filter(({ re }) => re.test(text)).map(({ what }) => what);
    expect(says('fatto da T524')).toEqual(['un task']);
    expect(says('il kernel 0.10.41')).toEqual(['una versione']);
    expect(says('vista in 3/4, ADR-0266, X.Y.Z, 120 righe')).toEqual([]);
  });
});
