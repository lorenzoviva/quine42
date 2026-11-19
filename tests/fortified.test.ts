// Merlons and arrow slits only on the fortifications (T434, found by T153): the Sculptor's request of a structure lists the parts of a fort
// (`part-battlements`, `part-slits`) only when its concept is a military fortification, and tells any other structure it has none; the
// prompt of the structures holds the author's fort as the measure of richness, never of form.

import { describe, expect, it } from 'vitest';
import { describe as describeRequest, FORT_PARTS, fortifiedOf, partResources, sculptorRole, type SculptRequest } from '../src/kernel/agents/sculptor';
import { bundledFiles } from '../src/kernel/bundle';
import { requestOf } from '../src/kernel/regenerate';
import { classOf, isFortified } from '../src/mj/classes';

const structure = classOf('structure')!;
const request = (nome: string, more: Partial<SculptRequest> = {}): SculptRequest => ({ id: `struttura-${nome}`, nome, aspetto: nome, classe: 'structure', ...more });
const listed = (fortified: boolean) => partResources(bundledFiles, fortified).map((p) => /file="([^"]+)"/.exec(p)![1]);

const CIVIL = ['la cattedrale degli ingranaggi', 'bistrot', 'laboratorio di ricerca', 'stazione di transito', 'palazzina', 'chiesa moderna', 'torre panoramica', 'un faro', 'santuario della luce', 'caserma dei vigili', 'a railway station', 'a lighthouse', 'bell tower'];
const FORTS = ['forte', 'un castello', 'la rocca sul passo', 'una fortezza di frontiera', 'torre di guardia', 'il mastio', 'bastione', 'caserma fortificata', 'cittadella', 'mura della città', 'a castle', 'a watchtower', 'stronghold', 'fortified barracks'];

describe('which structures are fortifications (T434)', () => {
  it('a word of a fort, a castle, a keep, a watchtower, walls; a tower or a barracks alone is not one', () => {
    for (const c of FORTS) expect(isFortified(c), c).toBe(true);
    for (const c of CIVIL) expect(isFortified(c), c).toBe(false);
  });

  it('the request says it, or its concept does', () => {
    expect(fortifiedOf({ nome: 'castello' })).toBe(true);
    expect(fortifiedOf({ nome: 'bistrot' })).toBe(false);
    expect(fortifiedOf({ nome: 'il Nido dei Corvi', fortified: true })).toBe(true);
    expect(fortifiedOf({ nome: 'castello', fortified: false })).toBe(false);
  });

  it('the regeneration says it when the concept the world wears is one, even if the entry has another name', () => {
    expect(requestOf('struttura-x', { class: 'structure', name: 'il Nido dei Corvi' }, [{ kind: 'structure', name: 'castello' }]).fortified).toBe(true);
    expect(requestOf('struttura-y', { class: 'structure', name: 'Cattedrale' }, [{ kind: 'structure', name: 'cattedrale degli ingranaggi' }]).fortified).toBeUndefined();
  });
});

describe('the parts and the words of the request (T434)', () => {
  it('lists the parts of a fort only to a fortification', () => {
    expect(listed(true)).toEqual(['part-battlements', 'part-cellar', 'part-door', 'part-slits', 'part-stair']);
    expect(listed(false)).toEqual(['part-cellar', 'part-door', 'part-stair']);
    expect([...FORT_PARTS]).toEqual(['part-battlements', 'part-slits']);
  });

  it('tells a civil, religious, modern or futuristic structure it has no merlons nor slits, and a fort they belong to it', () => {
    for (const nome of ['la cattedrale degli ingranaggi', 'bistrot', 'laboratorio', 'stazione di transito']) {
      const text = describeRequest(request(nome), structure);
      expect(text, nome).toContain('It is not a fortification: no merlons, no arrow slits');
      expect(text, nome).toMatch(/cornice, a solid parapet, a railing/);
      expect(text, nome).not.toContain('part-battlements');
    }
    for (const nome of ['forte', 'castello']) {
      const text = describeRequest(request(nome), structure);
      expect(text, nome).toContain('It is a fortification: merlons (part-battlements) and arrow slits (part-slits) belong to it.');
      expect(text, nome).not.toContain('It is not a fortification');
    }
    // Only the structures that grow by rules: a building of the library is not told.
    expect(describeRequest(request('bistrot', { classe: 'building' }), classOf('building')!)).not.toContain('fortification');
  });

  it('the prompt holds the fort as the measure of richness, never of form, and crowns no flat top with merlons', () => {
    const prompt = sculptorRole(bundledFiles, true);
    expect(prompt).toContain('for its **richness, never its form**');
    expect(prompt).toContain('**Merlons and arrow slits only on a fortification**');
    expect(prompt).not.toContain('crowned by `part-battlements`');
    expect(prompt).not.toContain('merlons and arrow slits on the outer faces');
    expect(prompt).not.toContain('so the parapet gets merlons');
  });
});
