import { describe, expect, it } from 'vitest';
import { countFile, isItalian, isItalianWord, literalsOf, readsItalian } from '../lab/scripts/censimento-lingue';

describe('il censimento delle lingue (T239)', () => {
  it('tells Italian prose from English and from code', () => {
    expect(isItalian('Non puoi farlo.')).toBe(true);
    expect(isItalian('La bibbia è vuota.')).toBe(true);
    expect(isItalian('lotti e strutture')).toBe(true);
    expect(isItalian('the file of the module')).toBe(false);
    expect(isItalian('text/html; charset=utf-8')).toBe(false);
  });

  it('reads single words as ids only when they look Italian', () => {
    expect(isItalianWord('pattuglia')).toBe(true);
    expect(isItalianWord('taglia_legna')).toBe(true);
    expect(isItalianWord('data')).toBe(false);
    expect(isItalianWord('none')).toBe(false);
  });

  it('skips comments and template holes, keeps regexes apart', () => {
    const { literals, regexes } = literalsOf("// un commento con 'virgolette'\nconst a = `Ciao ${x} mondo`; const r = /dorm|riposa|letto/; if (k === 'notte') f('Non puoi farlo.');");
    expect(literals.map((l) => l.text)).toEqual(['Ciao   mondo', 'notte', 'Non puoi farlo.']);
    expect(regexes).toEqual(['dorm|riposa|letto']);
    expect(readsItalian(regexes[0])).toBe(true);
  });

  it('counts a TypeScript file: texts, compared ids, regexes', () => {
    const c = countFile('src/kernel/x.ts', "if (s === 'notte') say('Non puoi farlo, è tardi.'); const re = /dorm|riposa|letto/;")!;
    expect(c).toMatchObject({ texts: 1, ids: 1, regex: 1, category: 'kernel: messaggi e logica' });
  });

  it('counts JSON values and Italian field names apart', () => {
    const c = countFile('universe/world/people.json', JSON.stringify({ persone: [{ nome: 'Ada', mestiere: 'la fornaia del porto', routine: [{ quando: 'mattina' }] }] }))!;
    expect(c.texts).toBe(2); // the job and the name (a label shown, even if a proper name stays as it is)
    expect(c.ids).toBe(1);
    expect(c.keys).toBeGreaterThanOrEqual(3);
  });
});
