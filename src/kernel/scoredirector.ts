// The music the world still lacks, written one piece at a time (T225): an environment the wanderers walk in that no program names falls back on the music of the moment, until
// the Musician writes its own. Within a budget per session and the coefficient of pieces; what a wanderer asks for through the Referente passes here too, and they pay for it.

import { BudgetError } from './ai/models';
import { compose, COMPOSE_TASK, type ComposeRequest } from './agents/composer';
import { pieceGap } from './coefficients';
import type { Kernel } from './kernel';
import { ownModelId } from './modeldirector';
import { namesEnvironment, soundPrograms, SOUND_CLASS, type SoundProgram, type SoundPurpose } from '../mj/sound';

/** How a piece of an environment plays by itself: at evening and at night the music of the moment goes on, as with the pieces of the seed. */
const BY_DAY = ['morning', 'day'];

/** The id of a program: the one it replaces if it takes over an effect, or a free one from its name. */
export function soundId(nome: string, suono: SoundPurpose, programs: readonly SoundProgram[], taken: (id: string) => boolean): string {
  const effect = suono.effetti?.[0];
  const replaced = effect ? programs.find((p) => p.suono?.uso === 'effect' && p.suono.effetti?.includes(effect)) : undefined;
  if (replaced) return replaced.id;
  const base = `sound-${suono.uso}-${ownModelId(nome)}`;
  let id = base;
  for (let n = 2; taken(id); n++) id = `${base}-${n}`;
  return id;
}

export class ScoreDirector {
  private busy = false;
  private used = 0;
  private skip = new Set<string>();
  private stopped = false;
  private nextAt = 0;

  constructor(private k: Kernel) {}

  /** The pieces written this session (out of `ai.maxBrani`). */
  get count(): number {
    return this.used;
  }

  get active(): boolean {
    return this.k.ai.name !== 'offline' && !this.stopped;
  }

  /** The environments of the places loaded that no program names, the first met first. */
  missing(): ComposeRequest[] {
    const programs = soundPrograms(this.k.files).filter((p) => p.suono?.uso === 'music' && !p.suono.oltre);
    const out: ComposeRequest[] = [];
    for (const ch of this.k.chunks.values()) {
      const env = ch.plan?.layout;
      const def = env ? this.k.content.layouts[env] : undefined;
      if (!env || !def || this.skip.has(env) || out.some((r) => r.ambienti?.[0] === env) || programs.some((p) => namesEnvironment(p, env))) continue;
      out.push({ richiesta: `il brano di ${def.name}, che suona di giorno a chi cammina in questo ambiente`, nome: def.name, uso: 'music', ambienti: [env], momenti: BY_DAY, contesto: def.description });
    }
    return out;
  }

  /** Called every few seconds: starts the next piece if idle. */
  pump(): void {
    if (!this.active || this.busy || this.k.generationHeld || this.used >= (this.k.config.ai.maxBrani ?? 8) || this.k.time < this.nextAt || this.k.coefficients().pieces <= 0) return;
    const req = this.missing()[0];
    if (req) void this.make(req);
  }

  /** Writes a program now and puts it in the library; `chi` when a wanderer asked, `qui` the environment they stand in. */
  async make(req: ComposeRequest, chi?: string, qui?: string): Promise<{ ok: boolean; summary: string }> {
    this.busy = true;
    this.used++;
    const k = this.k;
    const skip = () => req.ambienti?.forEach((e) => this.skip.add(e));
    const lacking = (esito: 'invalid' | 'error', motivo: string) => k.noteShortfall({ richiesta: req.richiesta, chi, agente: 'musician', compito: COMPOSE_TASK, esito, motivo });
    try {
      const effetti = [...new Set(soundPrograms(k.files).flatMap((p) => (p.suono?.uso === 'effect' ? (p.suono.effetti ?? []) : [])))];
      k.council.say('musician', 'propone', req.richiesta.slice(0, 80), undefined, COMPOSE_TASK);
      const r = await compose(k.council, req, { ambienti: Object.keys(k.content.layouts), effetti, ...(qui ? { qui } : {}) }, k.sculptors().musician, chi ? { chi } : {});
      this.nextAt = k.time + pieceGap(k.coefficients().pieces);
      if (!r) {
        skip();
        lacking('invalid', k.lastDiscard('musician', COMPOSE_TASK));
        return { ok: false, summary: 'Il Musicista non è riuscito a scrivere un programma valido.' };
      }
      const id = soundId(r.nome, r.suono, soundPrograms(k.files), (x) => k.files[`models/${x}.xml`] !== undefined);
      const xml = `<!-- ${r.nome.replace(/--/g, '-')}: scritto da ${r.model} -->\n${r.xml.replace(/^\s*<!--[\s\S]*?-->\s*/, '')}\n`;
      const card = { task: COMPOSE_TASK, autore: 'musician', ...(chi ? { chi } : {}) };
      if (!k.addModel(id, xml, { classe: SOUND_CLASS, nome: r.nome, autore: r.model, suono: r.suono }, `musicista: ${r.nome}`, card)) {
        skip();
        lacking('invalid', k.lastDiscard('musician', COMPOSE_TASK));
        return { ok: false, summary: `Il programma «${r.nome}» non è passato dal validatore.` };
      }
      return { ok: true, summary: `Il Musicista ha scritto «${r.nome}» (${r.suono.uso === 'effect' ? `effetto: ${r.suono.effetti?.join(', ')}` : `musica: ${r.suono.ambienti?.join(', ')}`}).` };
    } catch (e) {
      if (e instanceof BudgetError) this.stopped = true;
      k.council.say('musician', 'errore', (e as Error).message, undefined, COMPOSE_TASK);
      skip();
      lacking('error', (e as Error).message);
      return { ok: false, summary: `Il Musicista non ha potuto scrivere: ${(e as Error).message}` };
    } finally {
      this.busy = false;
    }
  }
}
