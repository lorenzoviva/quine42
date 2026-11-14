// The people talk (T327, ADR-0166): two who meet greet each other by their bond, or truly talk when the wanderer can hear
// (`npc.dialogue`); a wanderer talks to one of them (`npc.reply`, the Actor from the sheet when it is on), and what is said becomes
// mood, memories, bonds, things given, quests accepted. Part of `npc/`.

import type { Id } from '../ecs';
import type { Identity } from '../agents/content';
import { npcDialogue, npcReply, type NpcReply } from '../agents/minds';
import { COMUNE } from '../cards';
import { stretch } from '../coefficients';
import { normName } from '../content';
import { removeItem, type Inventory } from '../inventory';
import { SOLO } from '../wandererIds';
import type { NpcHost } from './host';
import type { Mind, Relation } from './model';
import type { People } from './people';
import { readPlots, secretsOf } from './plots';
import { bondWith, greeting, memoriesFor, memorySummary } from './society';
import type { Speech } from './speech';
import type { Stories } from './stories';

export class Talk {
  constructor(
    private readonly host: NpcHost,
    private readonly people: People,
    private readonly stories: Stories,
    private readonly speech: Speech,
  ) {}

  private greeted = new Map<string, number>();

  private talking = false;

  private lastTalk = -1e9;

  /** People who meet talk: by their relation, what they remember, the plots they are in. */
  meetings(people: Id[], pc: { x: number; y: number }): void {
    const ids = people.filter((id) => this.host.ecs.has(id, 'identity'));
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        const pa = this.host.ecs.get(a, 'pos');
        const pb = this.host.ecs.get(b, 'pos');
        if (Math.hypot(pa.x - pb.x, pa.y - pb.y) > 2.4) continue;
        const ia: Identity = this.host.ecs.get(a, 'identity');
        const ib: Identity = this.host.ecs.get(b, 'identity');
        if (this.host.ecs.get(a, 'activity')?.kind === 'sleep' || this.host.ecs.get(b, 'activity')?.kind === 'sleep') continue;
        const rel = ia.family?.find((f) => f.name === ib.name);
        const key = [ia.name, ib.name].sort().join('|');
        if ((this.greeted.get(key) ?? -1e9) > this.host.time - (rel ? 90 : 240)) continue;
        const near = Math.hypot(pa.x - pc.x, pa.y - pc.y) < 10;
        // A real conversation (the Narrator) when the wanderer can hear it, at most one at a time.
        if (near && !this.talking && this.host.time - this.lastTalk > stretch(40, this.host.coefficients().dialogues) && !this.host.generationHeld) {
          this.greeted.set(key, this.host.time);
          void this.converse(a, b, ia, ib, rel);
          return;
        }
        if (!rel) continue;
        this.greeted.set(key, this.host.time);
        const [la, lb] = greeting({ name: ia.name, job: ia.job ?? '' }, { name: ib.name }, rel, this.people.routineNow(ia)?.does ?? '');
        this.host.speak(a, la);
        this.speech.later(b, lb, this.host.time + 2.2);
      }
  }

  private async converse(a: Id, b: Id, ia: Identity, ib: Identity, rel?: Relation): Promise<void> {
    this.talking = true;
    this.lastTalk = this.host.time;
    const plots = readPlots(this.host.files());
    const day = this.host.day();
    const as = (who: Identity, other: Identity, sheet: string | undefined, l?: Relation) => ({
      name: who.name,
      job: who.job ?? '',
      sheet,
      bond: l?.bond ?? who.family?.find((f) => f.name === other.name)?.bond,
      does: this.people.routineNow(who)?.does ?? '',
      memories: memorySummary(this.people.individualOf(who.name)?.memories?.filter((m) => !m.with || m.with === other.name || m.weight >= 3), 6),
      secrets: secretsOf(plots, who.name, day),
    });
    try {
      // The Actor plays both from their sheets (T157); a dialogue is common, and so are the sheets it needs.
      const by = this.host.interpreter();
      const [sa, sb] = by.agent === 'actor' ? await Promise.all([this.people.ensureSheet(ia.name, COMUNE), this.people.ensureSheet(ib.name, COMUNE)]) : [undefined, undefined];
      const r = await npcDialogue(this.host.council, as(ia, ib, sa, rel), as(ib, ia, sb), this.host.chunkAt(this.host.ecs.get(a, 'pos')?.x ?? 0, this.host.ecs.get(a, 'pos')?.y ?? 0)?.place?.name ?? 'qui', this.host.focusOn([ia.name, ib.name], this.host.ecs.get(a, 'pos')), by);
      r.lines.forEach((l, i) => this.speech.later(l.who === 'a' ? a : b, l.say, this.host.time + i * 2.6));
      if (r.memoryA) this.people.rememberAbout(ia.name, r.memoryA, ib.name, 1);
      if (r.memoryB) this.people.rememberAbout(ib.name, r.memoryB, ia.name, 1);
      this.host.council.say(by.agent, 'info', `${ia.name} e ${ib.name}: ${r.lines.map((l) => `«${l.say}»`).join(' ')}`, undefined, 'npc.dialogue');
    } catch {
      if (rel) {
        const [la, lb] = greeting({ name: ia.name, job: ia.job ?? '' }, { name: ib.name }, rel, this.people.routineNow(ia)?.does ?? '');
        this.host.speak(a, la);
        this.speech.later(b, lb, this.host.time + 2.2);
      }
    } finally {
      this.talking = false;
    }
  }

  /**
   * Talks to an NPC: the Narrator plays the individual; the chosen action is validated and applied. `wanderer`
   * is who talks (T34; the one acting now by default): the individual knows their name, their bond, what they did together.
   */
  async talk(id: Id, text: string, wanderer?: string): Promise<NpcReply> {
    const me = (wanderer ? this.host.wandererById(wanderer) : undefined) ?? this.host.wanderer();
    const m = this.host.modules.get(this.host.ecs.get(id, 'module')?.id)?.manifest;
    if (!m?.persona || !this.host.ecs.alive.has(id)) return { say: '…', action: 'none', mood: '' };
    const identity = await this.people.ensureIdentity(id);
    let mind: Mind = this.host.ecs.get(id, 'mind');
    if (!mind) mind = this.host.ecs.set(id, 'mind', { mode: 'wander', mood: 'tranquillo', history: [] });
    mind.history ??= [];
    const inv: Inventory | undefined = this.host.ecs.get(id, 'inventory');
    const carrying = inv ? inv.slots.filter(Boolean).map((s) => this.host.itemInfo(s!.item).name) : [];
    const name = identity?.name ?? m.name;
    let reply: NpcReply;
    try {
      const now = this.people.routineNow(identity);
      const social = identity
        ? `\nIl tuo mestiere: ${identity.job ?? '—'}. La tua famiglia: ${(identity.family ?? []).map((f) => `${f.bond} ${f.name}`).join(', ') || 'nessuno'}.${identity.story ? ` La tua storia: ${identity.story}` : ''}${now ? ` Adesso (${now.when}) stai: ${now.does}.` : ''}`
        : '';
      // The Actor plays from the Narrator's sheet (T157): written at the first line, paid by who talks.
      const by = this.host.interpreter();
      const scheda = by.agent === 'actor' ? await this.people.ensureSheet(name, me.id) : undefined;
      const individual = this.people.individualOf(name);
      reply = await npcReply(this.host.council, {
        chi: me.id,
        name,
        wanderer: me.name,
        introduction: this.host.profileOf(me.id)?.introduction,
        memories: memorySummary(memoriesFor(individual?.memories, me.id), 12),
        bond: individual ? bondWith(individual, me.id) : undefined,
        secrets: secretsOf(readPlots(this.host.files()), name, this.host.day()),
        sheet: scheda,
        persona: (identity?.persona ?? m.persona) + social, mood: mind.mood, mode: mind.mode, carrying, place: this.host.chunkHere()?.name ?? '', history: mind.history.filter((t) => (t.con ?? SOLO) === me.id), facts: this.host.worldFacts() }, text, this.host.focusOn([name], this.host.ecs.get(id, 'pos')), by);
      this.host.council.say(by.agent, 'info', `${name} a ${me.name}: «${reply.say}»`, undefined, 'npc.reply');
    } catch (e) {
      return { say: `(${name} ti guarda in silenzio — ${(e as Error).message})`, action: 'none', mood: mind.mood };
    }
    mind.history.push({ who: 'player', text, con: me.id }, { who: 'npc', text: reply.say, con: me.id });
    if (mind.history.length > 16) mind.history.splice(0, mind.history.length - 16);
    mind.mood = reply.mood;
    if (reply.action === 'follow' || reply.action === 'stay' || reply.action === 'wander') mind.mode = reply.action;
    // What follows happens to the wanderer who talked (synchronous: `as` never spans an await).
    const carry = this.host.as(me.id, () => {
      if (reply.action === 'give') {
        const wantedName = normName(reply.item ?? '');
        const slot = inv?.slots.find((s) => s && normName(this.host.itemInfo(s.item).name) === wantedName) ?? inv?.slots.find((s) => s && wantedName && normName(this.host.itemInfo(s.item).name).includes(wantedName));
        if (slot && inv && this.host.give(slot.item, 1)) {
          removeItem(inv, slot.item, 1);
          this.host.message(`${name} ti dà: ${this.host.itemInfo(slot.item).name}`, 'good');
        } else reply.action = 'none';
      }
      if (reply.mentioned?.length) void this.host.noteMentions(reply.mentioned, `di cui si parla con ${name}`);
      if (reply.memory) this.people.rememberWanderer(name, reply.memory, reply.weight ?? 1);
      if (reply.bond && reply.bond !== this.people.bondOf(name)) this.people.setBond(name, reply.bond, reply.bondKind);
      let given = '';
      let carry: string | undefined;
      if (reply.action === 'quest') {
        this.stories.updatePlots((plots) => {
          const p = plots.find((x) => x.state === 'active' && x.quest?.from === name && x.quest.state === 'offered');
          if (!p?.quest) return false;
          p.quest.state = 'accepted';
          p.quest.wanderer = me.id;
          given = p.quest.text;
          if (p.quest.goal.type === 'bring') carry = p.quest.goal.item;
          return true;
        });
        if (given) this.host.message(`Nuova missione da ${name}: ${given}`, 'good');
      }
      return carry && !this.host.carriedByName(carry) ? carry : undefined;
    });
    // "Take this to…": whoever asks hands over what is to be carried.
    if (carry) {
      const d = this.host.content.byName(carry) ?? (await this.host.introduceItems([carry], `affidato da ${name} a ${this.people.wandererWord(me)}`))[0];
      if (d && this.host.as(me.id, () => this.host.give(d.id, 1))) this.host.message(`${name} ti affida: ${d.name}`, 'good');
    }
    this.host.as(me.id, () => this.stories.questsOnTalk(name));
    this.host.speak(id, reply.say);
    return reply;
  }
}
