// The plots of the people (T327, ADR-0166): the beats that happen at their moment, seen or not (the individual goes there, says the
// line, remembers it), the Narrator weaving a new plot among the people met (`plot.weave`), the quests a wanderer accepts and
// completes. Writes `world/plots.json` through the port; the format is `plots.ts`. Part of `npc/`.

import type { Identity } from '../agents/content';
import { wordsOf } from '../agents/council';
import { weavePlot } from '../agents/minds';
import { stretch } from '../coefficients';
import { normName } from '../content';
import { slug as nodeSlug } from '../graph';
import { italianName } from '../internalNames';
import { removeItem } from '../inventory';
import { SOLO } from '../wandererIds';
import type { NpcHost } from './host';
import type { People } from './people';
import type { Places } from './places';
import { activeQuests, plotFromRaw, plotText, PLOTS_FILE, readPlots, reviewPlot, writePlots, type Plot } from './plots';
import { inferActivity, readPeople, societySummary } from './society';
import type { Speech } from './speech';

/** A plot the Narrator wrote twice and still does not hold (a shortfall `invalid`, not an error). */
class PlotRejected extends Error {}

export class Stories {
  constructor(
    private readonly host: NpcHost,
    private readonly people: People,
    private readonly places: Places,
    private readonly speech: Speech,
  ) {}

  private worldPhase = '';

  private plotsWoven = 0;

  /**
   * Plots unfold: at each change of the moment of the day, the beats due happen — the individual goes
   * there, does it, says the line (and remembers it). Seen or not, it happened.
   */
  plotTick(): void {
    const phase = `${this.host.day()}|${this.host.phase()}`;
    if (phase === this.worldPhase) return;
    const first = !this.worldPhase;
    this.worldPhase = phase;
    const plots = readPlots(this.host.files());
    const day = this.host.day();
    const q = this.host.phase();
    let changed = false;
    const pc = this.host.wandererCarpet();
    for (const plot of plots) {
      if (plot.state !== 'active') continue;
      for (const beat of plot.beats) {
        if (beat.done || plot.start + beat.day > day || (plot.start + beat.day === day && beat.moment !== q)) continue;
        beat.done = true;
        changed = true;
        this.people.rememberAbout(beat.who, `${beat.what}${beat.line ? ` («${beat.line}»)` : ''}`, undefined, 2);
        const id = this.people.entityOf(beat.who);
        if (id !== undefined) {
          const identity: Identity = this.host.ecs.get(id, 'identity');
          const place = ['home', 'work', 'square'].includes(beat.where) ? this.places.placeFor(id, identity, beat.where, inferActivity(beat.what, beat.where)) : undefined;
          if (place) this.host.ecs.set(id, 'goal', place);
          this.speech.later(id, beat.line ? beat.line : `(${beat.what})`, this.host.time + 1);
          const p = this.host.ecs.get(id, 'pos');
          if (p && Math.hypot(p.x - pc.x, p.y - pc.y) < 12) this.host.message(`${beat.who} ${beat.what}${beat.clue ? ` — ${beat.clue}` : ''}`);
        }
        this.host.council.say('narrator', 'info', `trama «${plot.title}»: ${beat.who} ${beat.what} (${italianName('dove', beat.where)}, ${italianName('momenti', beat.moment)})`, undefined, 'plot.beat');
      }
      if (plot.beats.every((b) => b.done) && (!plot.quest || plot.quest.state !== 'accepted') && day > plot.start + 3) {
        plot.state = 'closed';
        changed = true;
      }
    }
    if (changed) {
      this.host.write(PLOTS_FILE, writePlots(plots));
      this.host.keepFile(PLOTS_FILE);
    }
    // A new day without a story: the Narrator weaves one among the people already met (every few days with fewer plots).
    const every = stretch(1, this.host.coefficients().plots);
    if (!first && !plots.some((p) => p.state === 'active') && Number.isFinite(every) && day % every === 0) void this.weaveStory();
  }

  /** The Narrator weaves a horizontal plot among existing people and places (westworld-like). */
  async weaveStory(force = false): Promise<Plot | undefined> {
    const society = readPeople(this.host.files());
    if (!force && (this.plotsWoven >= 3 || society.people.length < 3 || this.host.offline || this.host.generationHeld)) return undefined;
    this.plotsWoven++;
    const pc = this.host.wandererCarpet();
    const places = this.host.directionsAt(pc.x, pc.y).join('\n');
    const recent = society.people.flatMap((p) => (p.memories ?? []).filter((m) => m.weight >= 2).slice(-2).map((m) => `${p.name}: ${m.text}`)).slice(-10).join('\n');
    // The plot is checked against the people and the canon; what does not hold goes back to the
    // Narrator once, with the reasons; the second answer is repaired, or dropped if it cannot be.
    const attempt = async (feedback?: string) => {
      const raw = plotFromRaw(await weavePlot(this.host.council, societySummary(society, 20), places, recent, feedback, this.host.focusOn(society.people.slice(-20).map((p) => p.name))), this.host.day(), `trama-${this.host.worldStamp()}`);
      const review = reviewPlot(raw, society, wordsOf(this.host.files()));
      // What the words did not catch, the four questions of `text.fourthwall` (T350): a plot that breaks goes back to the Narrator.
      const wall = review.plot ? await this.host.council.fourthWall(plotText(review.plot)) : undefined;
      if (wall) return { titolo: raw.title, problems: [...review.problems, `rompe la quarta parete (${wall}): dentro il mondo nessuno sa di essere in un gioco`] };
      return { titolo: raw.title, ...review };
    };
    let plot: Plot | undefined;
    try {
      let a = await attempt();
      if (a.problems.length) {
        const why = `la trama «${a.titolo}» non torna: ${a.problems.join('; ')}.`;
        this.host.council.say('kernel', 'scarta', why, 'narrator', 'plot.weave');
        a = await attempt(why);
        if (!a.plot) throw new PlotRejected(`ancora incoerente: ${a.problems.join('; ')}`);
        if (a.problems.length) this.host.council.say('arbiter', 'corregge', `trama «${a.titolo}»: ${a.problems.join('; ')}`, 'narrator', 'plot.weave');
      }
      plot = a.plot;
    } catch (e) {
      this.host.council.say('narrator', 'errore', `trama: ${(e as Error).message}`, undefined, 'plot.weave');
      this.host.noteShortfall({ request: 'una trama nuova', agent: 'narrator', task: 'plot.weave', outcome: e instanceof PlotRejected ? 'invalid' : 'error', reason: (e as Error).message });
      return undefined;
    }
    if (!plot || plot.beats.length < 2) return undefined;
    const plots = [...readPlots(this.host.files()), plot];
    this.host.write(PLOTS_FILE, writePlots(plots));
    this.host.applyWorking();
    this.host.commitContent(`trama: ${plot.title}`, 'plot.weave', 'narrator');
    this.host.useCards([...plot.involved.map((n) => `individual:${nodeSlug(n)}`), ...this.host.resolve(plot.beats.map((t) => t.where))], 'plots');
    this.host.council.say('narrator', 'propone', `nuova trama «${plot.title}» tra ${plot.involved.join(', ')}${plot.quest ? `; ${plot.quest.from} avrà una richiesta per il viandante` : ''}`, undefined, 'plot.weave');
    return plot;
  }

  updatePlots(fn: (plots: Plot[]) => boolean): void {
    const plots = readPlots(this.host.files());
    if (!fn(plots)) return;
    this.host.write(PLOTS_FILE, writePlots(plots));
    this.host.keepFile(PLOTS_FILE);
  }

  /** Quests the wanderer acting now is on (for the HUD). */
  quests(): Array<{ titolo: string; da: string; testo: string; obiettivo: string }> {
    return activeQuests(readPlots(this.host.files()), this.host.wanderer().id).map(({ plot, quest }) => ({
      titolo: plot.title,
      da: quest.from,
      testo: quest.text,
      obiettivo: quest.goal.type === 'bring' ? `porta ${quest.goal.item ?? 'ciò che serve'} a ${quest.goal.to ?? quest.from}` : quest.goal.type === 'go' ? `vai a ${quest.goal.place ?? '?'}` : `parla con ${quest.goal.to ?? '?'}`,
    }));
  }

  /** "Vai" quests are done by arriving: the place or the region you stand in. */
  questTick(): void {
    const here = [this.host.chunkHere()?.name ?? '', ...this.host.directionsAt(this.host.wandererCarpet().x, this.host.wandererCarpet().y).filter((d) => d.startsWith('qui siamo'))].join(' ').toLowerCase();
    for (const { plot, quest } of activeQuests(readPlots(this.host.files()), this.host.wanderer().id)) {
      if (quest.goal.type === 'go' && quest.goal.place && here.includes(normName(quest.goal.place).split(' ')[0] ?? '~')) void this.completeQuest(plot.id);
    }
  }

  private async completeQuest(plotId: string): Promise<void> {
    let done: Plot | undefined;
    this.updatePlots((plots) => {
      const p = plots.find((x) => x.id === plotId);
      if (!p?.quest || p.quest.state !== 'accepted') return false;
      p.quest.state = 'completed';
      done = p;
      return true;
    });
    if (!done?.quest) return;
    const q = done.quest;
    // Whoever accepted it is remembered and rewarded, wherever the others are.
    const by = q.wanderer ?? SOLO;
    const who = this.host.as(by, () => this.people.wandererWord(this.host.wanderer()));
    this.host.as(by, () => this.people.rememberWanderer(q.from, `${who} ha mantenuto la promessa: ${q.text}`, 3));
    this.host.recordRule({ key: `missione|${plotId}`, text: `missione di ${q.from}: ${q.text}`, possible: true, story: `compiuta da${who === 'il viandante' ? 'l viandante' : ` ${who}`}`, effects: ['missione'] }, false);
    this.host.message(`Missione compiuta: ${q.text}`, 'good');
    if (q.reward) {
      const d = this.host.content.byName(q.reward) ?? (await this.host.introduceItems([q.reward], `ricompensa di ${q.from}`))[0];
      if (d && this.host.as(by, () => this.host.give(d.id, 1))) this.host.message(`${q.from} ti ricompensa: ${d.name}`, 'good');
    }
  }

  /** Talking to someone may complete a quest: the one to talk to, or the one waiting for something. */
  questsOnTalk(name: string): void {
    for (const { plot, quest } of activeQuests(readPlots(this.host.files()), this.host.wanderer().id)) {
      const o = quest.goal;
      if (o.type === 'talk' && o.to === name) void this.completeQuest(plot.id);
      if (o.type === 'bring' && (o.to ?? quest.from) === name && o.item) {
        const id = this.host.carriedByName(o.item);
        if (id) {
          removeItem(this.host.inventory(), id, 1);
          this.host.message(`Consegni ${this.host.itemInfo(id).name} a ${name}.`);
          void this.completeQuest(plot.id);
        }
      }
    }
  }
}
