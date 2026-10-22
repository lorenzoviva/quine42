import { describe, expect, it } from 'vitest';
import { bibleBreaks, cleanBible, COUNCIL_PRINCIPLES, metaBreak } from '../src/kernel/fourthwall';
import { Council, readBible, type Bible } from '../src/kernel/agents/council';
import { bundledFiles } from '../src/kernel/bundle';
import { readPlots, PLOTS_FILE, writePlots, type Plot } from '../src/kernel/plots';
import type { Models, TextCall } from '../src/kernel/ai/models';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';

const boot = () => Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });

// The author's analysis (docs/userchats/to-do-2026-10-22.md, «Incoerenze personaggi e trame»).
const ANALYSIS = [
  'Alcuni anziani sussurrano che tornare sempre in piazza sia un dono di benevolenza per non far perdere nessuno nella vastità del mondo.',
  'Circola voce che il Re Muto, che riposa sotto le acque del lago, osservi ogni viandante attraverso il riflesso della luna.',
  'Nessun viandante è mai riuscito a superare il confine del bosco senza tornare sui suoi passi.',
  'Scava freneticamente vicino a un simbolo luminoso che sembra cambiare forma.',
];

const plot = (titolo: string, cosa: string): Plot => ({
  id: `trama-${titolo}`,
  titolo,
  mistero: 'un segreto di famiglia',
  coinvolti: ['Fiocco'],
  tappe: [{ giorno: 0, momento: 'mattina', chi: 'Fiocco', dove: 'piazza', cosa }],
  inizio: 0,
  stato: 'attiva',
});

describe('the fourth wall', () => {
  it('catches the hints of the analysis: back to the square, someone watching, borders, other glowing signs', () => {
    for (const t of ANALYSIS) expect(metaBreak(t), t).toBeTruthy();
    for (const t of ['Chi cammina troppo a lungo si ritrova in piazza.', 'Le lettere luminose affiorano dopo la pioggia.', 'Un confine invalicabile chiude la valle.', 'Il mondo si ripete ogni notte.'])
      expect(metaBreak(t), t).toBeTruthy();
  });

  it('leaves the life of the world alone', () => {
    for (const t of [
      'La sera torna in piazza a chiacchierare con le comari.',
      'Conserverà il pane per l’inverno; la guardia osserva il viandante con sospetto.',
      'Raccoglie le rune e le vende al mercato; dice che la luce del segno è più forte d’inverno.',
      'Supera il confine del regno con un carro di lana.',
    ])
      expect(metaBreak(t), t).toBeUndefined();
  });

  it('the principles name the hints and forbid doubles of the runes; they go with every request', async () => {
    for (const s of ['torna sempre in piazza', 'osserva ogni viandante', 'non si può superare', 'simbolo luminoso', 'Niente doppioni']) expect(COUNCIL_PRINCIPLES).toContain(s);
    const systems: string[] = [];
    const models = { text: async (r: TextCall) => (systems.push(r.system ?? ''), '{}') } as unknown as Models;
    const c = new Council(models, () => ({ files: bundledFiles, palette: {}, catalog: [] }));
    for (const agent of ['narratore', 'arbitro', 'cartografo', 'referente'] as const) await c.ask(agent, 'prova', 'una prova', { type: 'OBJECT' });
    for (const system of systems) expect(system).toContain('Niente doppioni degli elementi del gioco');
    expect(systems).toHaveLength(4);
  });

  it('the seed tells no legend of the game: theme, bible, people, the Genesis', () => {
    expect(metaBreak(bundledFiles['prompts/theme.md'])).toBeUndefined();
    expect(bundledFiles['prompts/theme.md']).not.toMatch(/mistero|in piazza/);
    expect(bibleBreaks(readBible(bundledFiles)!)).toEqual([]);
    expect(bundledFiles['prompts/agents/narratore.md']).not.toMatch(/la strada che riporta in piazza/);
    for (const [path, text] of Object.entries(bundledFiles)) {
      if (!path.endsWith('manifest.json')) continue;
      const m = JSON.parse(text);
      // What the people of the world meet (systems are the kernel's, outside the world).
      if (m.kind !== 'entity' && m.kind !== 'item') continue;
      expect(metaBreak(`${m.name} ${m.description ?? ''} ${m.persona ?? ''} ${m.lore ?? ''}`), path).toBeUndefined();
    }
  });

  it('a bible is cleaned of what breaks the wall, line by line', () => {
    const b: Bible = { titolo: 'Valmora', tono: 'quieto', sintesi: 'un regno', luoghi: ['Piazza'], personaggi: ['Bastiano — fornaio'], fatti: [ANALYSIS[2], 'Il mercato è il martedì.'], misteri: [ANALYSIS[0], ANALYSIS[1], 'Il lago canta.'], crepe: ['il mondo si riavvia'] };
    expect(bibleBreaks(b)).toHaveLength(3);
    const clean = cleanBible(b);
    expect(clean.fatti).toEqual(['Il mercato è il martedì.']);
    expect(clean.misteri).toEqual(['Il lago canta.']);
    expect(clean.crepe).toBeUndefined();
    expect(bibleBreaks(clean)).toEqual([]);
  });

  it('the review cleans the bible and drops the plots that break it, also in universes reviewed before', async () => {
    const k = await boot();
    const bible = readBible(k.repo.working)!;
    k.repo.write('world/bible.json', JSON.stringify({ ...bible, fatti: [...bible.fatti, ANALYSIS[2]], misteri: [...(bible.misteri ?? []), ANALYSIS[0], ANALYSIS[1]] }, null, 2) + '\n');
    k.repo.write(PLOTS_FILE, writePlots([plot('Il Ciclo delle Lettere Dimenticate', ANALYSIS[3]), plot('Il pane rubato', 'Cerca chi ha rubato il pane del forno.')]));
    // Reviewed under the old principles: reviewed again.
    k.repo.write('world/rules.json', JSON.stringify({ regole: [{ chiave: 'revisione|quarta-parete', testo: 'revisione della quarta parete', possibile: true }] }) + '\n');
    k.applyFiles({ ...k.repo.working });
    const gone = await k.reviewFourthWall();
    expect(gone).toEqual(['trama «Il Ciclo delle Lettere Dimenticate»']);
    expect(readPlots(k.files).map((p) => p.titolo)).toEqual(['Il pane rubato']);
    expect(bibleBreaks(readBible(k.files)!)).toEqual([]);
    expect(readBible(k.files)!.misteri).toEqual(bible.misteri);
    expect(await k.reviewFourthWall()).toEqual([]);
  });
});
