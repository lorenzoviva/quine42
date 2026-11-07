// The sculptor, live, through the Gemini proxy of `npm run dev` (ADR-0099): only for the developers. The sandbox imports this module only
// outside a build (`import.meta.env.MODE`, not `DEV`: a build with NODE_ENV=development has `DEV` on), so the build the players get has
// neither it nor Gemini (T294, ADR-0168).

import { GeminiAiModels } from '../../src/kernel/ai/gemini';
import { tallyLine, UsageLog } from '../../src/kernel/ai/usage';
import { CLASSES } from '../../src/mj/classes';
import { classFor, type Target } from '../mjx/target';
import { sculptMjx } from '../mjx/sculptor';
import type { Entry } from './catalog';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

/** Wires the panel's «Scolpisci con Gemini»: what the sculptor writes goes to `found`. */
export function wireSculptor(found: (e: Entry) => Promise<void>): void {
  const roleOfClass: Record<string, Entry['role']> = { persona: 'npc', animale: 'animal', bestia: 'animal', albero: 'tree', cespuglio: 'plant', roccia: 'rock', sasso: 'rock', edificio: 'structure', monumento: 'structure' };
  for (const c of CLASSES) $('g-class').append(new Option(`${c.name} (${c.tiles.join('×')})`, c.id));
  $<HTMLSelectElement>('g-class').value = 'building';
  const gMeter = new UsageLog();
  $('g-go').onclick = async () => {
    const out = $('g-out');
    if (!(await GeminiAiModels.available())) {
      out.textContent = 'Gemini non raggiungibile: serve il server di Vite con GEMINI_API_KEY in .env';
      return;
    }
    const kind = $<HTMLSelectElement>('g-class').value;
    const name = $<HTMLInputElement>('g-name').value.trim() || 'Oggetto';
    const t: Target = {
      id: `sandbox:${name}`,
      name,
      description: $<HTMLInputElement>('g-desc').value.trim(),
      kind,
      category: ['person', 'animal', 'beast'].includes(kind) ? 'figura' : ['building', 'monument'].includes(kind) ? 'struttura' : 'semplice',
    };
    const models = new GeminiAiModels({ textModel: $<HTMLSelectElement>('g-model').value, limits: { text: 50 }, thinking: 'low', timeout: 240_000 });
    models.onCall = (r) => gMeter.record(r);
    $<HTMLButtonElement>('g-go').disabled = true;
    out.textContent = 'lo Scultore scrive…';
    try {
      const s = await sculptMjx(models, t, { retries: 2 });
      const err = s.attempts.at(-1)?.error;
      if (err || !s.xml) {
        out.textContent = `non ci è riuscito: ${err}`;
        return;
      }
      const e: Entry = { id: t.id, name, role: roleOfClass[kind] ?? 'prop', xml: s.xml, vpt: 20, source: `scolpito ora da ${$<HTMLSelectElement>('g-model').value} (${s.attempts.length} tentativi)`, size: classFor(t).box };
      await found(e);
      out.textContent = `fatto in ${s.attempts.length} tentativi · ${tallyLine(gMeter.session)}`;
    } catch (x) {
      out.textContent = `errore: ${(x as Error).message}`;
    } finally {
      $<HTMLButtonElement>('g-go').disabled = false;
    }
  };
}
