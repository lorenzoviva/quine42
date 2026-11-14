// Who the people are (T327, ADR-0166): the individual behind every character (`npc.individuate`), the Actor's sheet (`npc.sheet`),
// their species, their memories and bonds with the wanderers, the society and the plots kept coherent at boot, a child born. Writes
// `world/people.json` through the port (`host.ts`); the format is `society.ts`. Part of `npc/`.

import type { Id } from '../ecs';
import { individuate, type Identity } from '../agents/content';
import { wordsOf } from '../agents/council';
import { metaBreak } from '../fourthwall';
import { npcSheet } from '../agents/minds';
import { slug as nodeSlug } from '../graph';
import { italianName } from '../internalNames';
import { addItem, newInventory, type Inventory } from '../inventory';
import { guessClass } from '../../mj/classes';
import { hashStr } from '../rng';
import type { ItemDef } from '../types';
import { SOLO, WANDERER_NAME, wandererOf } from '../wandererIds';
import { dressInventory } from '../wearing';
import type { NpcHost, NpcWanderer } from './host';
import { outfitOf, type Garment, type Outfit } from './outfits';
import { PLOTS_FILE, readPlots, reviewPlot, writePlots, type Plot } from './plots';
import { addIndividual, applyRenames, type DeclaredPlace, bondWith, defaultRoutine, freshName, guessGender, readPeople, remember, repairSociety, sheetFingerprint, similarNames, societySummary, type DayPhase, type Individual, type Species } from './society';

export class People {
  constructor(private readonly host: NpcHost) {}

  /** How many individuals are being written now (the society starts at most two at a time). */
  get pending(): number {
    return this.individuating.size;
  }

  private individuating = new Map<Id, Promise<Identity | undefined>>();

  private sheeting = new Map<string, Promise<string | undefined>>();

  /**
   * Behind every character there is an individual: name, story, own pockets, a job, a family among the
   * people already known, a daily routine (written once, cheap text, kept in world/people.json: met
   * again, they are the same individual).
   */
  async ensureIdentity(id: Id): Promise<Identity | undefined> {
    const existing: Identity | undefined = this.host.ecs.get(id, 'identity');
    if (existing) return existing;
    const pending = this.individuating.get(id);
    if (pending) return pending;
    const job = this.individuate(id);
    this.individuating.set(id, job);
    try {
      return await job;
    } finally {
      this.individuating.delete(id);
    }
  }

  private async individuate(id: Id): Promise<Identity | undefined> {
    const modId: string | undefined = this.host.ecs.get(id, 'module')?.id;
    const m = (modId ? this.host.modules.get(modId)?.manifest : undefined);
    if (!m?.persona) return undefined;
    const origin: string | undefined = this.host.ecs.get(id, 'origin')?.key;
    const people = readPeople(this.host.files());
    const known = origin ? people.people.find((p) => p.origin === origin && p.kind === modId) : undefined;
    let identity: Identity;
    if (known) {
      identity = { name: known.name, persona: known.persona ?? m.persona, look: known.look ?? '', carrying: known.carries ?? [], wearing: known.wears ?? [], job: known.job, gender: known.gender, age: known.age, family: known.family, routine: known.routine, story: known.story };
    } else {
      const specie = this.speciesOf(modId!) ?? 'person';
      // Names already taken (people met, people around): a newcomer's name is unlike all of them,
      // unless they are someone named and awaited.
      const taken = () => [...readPeople(this.host.files()).people.map((p) => p.name), ...this.host.ecs.query('identity').map((e) => this.host.ecs.get(e, 'identity').name as string)];
      const awaited = (n: string) => readPeople(this.host.files()).expected.some((a) => a.name.toLowerCase() === n.toLowerCase());
      const alike = (n: string) => (awaited(n) && !taken().includes(n) ? [] : taken().filter((t) => similarNames(t, n)));
      try {
        const ask = (avoid?: string[]) => individuate(this.host.council, { name: m.name, description: m.description ?? '', persona: m.persona!, specie }, { place: this.host.chunkHere()?.name ?? '', common: [...this.host.content.items.values()].map((d) => d.name), society: societySummary(readPeople(this.host.files())), avoid, focus: this.host.focusOn([`kind:${nodeSlug(modId!)}`], this.host.ecs.get(id, 'pos')) });
        identity = await ask();
        // An individual of the world, not of the Council's table: once more if the fourth wall breaks,
        // or if the name is like someone else's.
        if (await this.host.council.fourthWall(`${identity.persona} ${identity.story ?? ''} ${identity.job ?? ''}`)) identity = await ask();
        else if (alike(identity.name).length) {
          this.host.council.say('kernel', 'scarta', `il nome «${identity.name}» è troppo simile a ${alike(identity.name).join(', ')}`, 'narrator', 'npc.individuate');
          identity = await ask([...alike(identity.name), identity.name]);
        }
      } catch {
        identity = { name: m.name, persona: m.persona, look: '', carrying: [], wearing: [], routine: defaultRoutine('') };
      }
      identity.gender ??= guessGender({ name: identity.name, job: identity.job ?? '', family: identity.family ?? [] });
      // Still alike: a name the kernel picks (and the persona says it).
      if (identity.name !== m.name && alike(identity.name).length) {
        const old = identity.name;
        identity.name = freshName(specie, identity.gender, taken(), origin ?? old);
        identity.persona = applyRenames(identity.persona, [[old, identity.name]]);
      }
    }
    if (!this.host.ecs.alive.has(id)) return identity;
    this.host.ecs.set(id, 'identity', identity);
    // What they carry and what they wear (T353): the things of the world by name; those the world does not have yet, the Narrator
    // defines in one call for both lists (the same call that defined what they carried before).
    const byName = (n: string) => this.host.content.byName(n);
    const unknown = [...new Set([...identity.carrying, ...identity.wearing].filter((n) => !byName(n)))];
    const introduced = unknown.length ? await this.host.introduceItems(unknown, `portati da ${identity.name}`) : [];
    const defs = [...identity.carrying.map(byName).filter((d): d is ItemDef => !!d), ...introduced.filter((d) => !identity.wearing.some((n) => byName(n)?.id === d.id))];
    let inv: Inventory | undefined = this.host.ecs.get(id, 'inventory');
    if (!inv) inv = this.host.ecs.set(id, 'inventory', newInventory(10));
    if (!inv.slots.some(Boolean)) for (const d of defs) addItem(inv, d.id, 1, this.host.itemSpec(d.id));
    const worn = this.dress(id, identity, inv, [...identity.wearing.map(byName).filter((d): d is ItemDef => !!d), ...introduced]);
    if (!known && identity.name !== m.name) {
      const individual: Individual = {
        name: identity.name, kind: modId!, species: this.speciesOf(modId!) ?? 'person', gender: identity.gender, job: identity.job || m.name, age: identity.age, family: identity.family ?? [], routine: identity.routine ?? defaultRoutine(identity.job ?? ''),
        story: identity.story, place: this.host.chunkAt(this.host.ecs.get(id, 'pos')?.x ?? 0, this.host.ecs.get(id, 'pos')?.y ?? 0)?.place?.name, origin: origin, persona: identity.persona, look: identity.look, carries: identity.carrying,
        ...(identity.wearing.length ? { wears: identity.wearing } : {}),
      };
      // The kernel makes the society coherent: the other side of each relation, what this species can be.
      const next = addIndividual(readPeople(this.host.files()), individual, (t) => this.speciesOf(t));
      this.host.write('world/people.json', JSON.stringify(next, null, 2) + '\n');
      this.host.applyWorking();
      this.host.commitContent(`persone: ${identity.name}, ${individual.job}`, 'npc.individuate', 'narrator');
      // Relatives already met learn about the newcomer too (and the newcomer's relations may be corrected).
      for (const other of this.host.ecs.query('identity')) {
        const oi: Identity = this.host.ecs.get(other, 'identity');
        const back = next.people.find((p) => p.name === oi.name);
        if (back) oi.family = back.family;
      }
      const fam = (identity.family ?? []).map((f) => `${f.bond} di ${f.name}`).join(', ');
      const dressed = Object.values(worn).map((item) => this.host.itemInfo(item).name);
      this.host.council.say('narrator', 'propone', `${m.name} → ${identity.name}, ${individual.job}${fam ? `; ${fam}` : ''}: ${identity.look} (porta ${defs.map((d) => d.name).join(', ') || 'niente'}${dressed.length ? `; indossa ${dressed.join(', ')}` : ''})`, undefined, 'npc.individuate');
    }
    return identity;
  }

  /**
   * Dresses an individual (T353, ADR-0181): the garments the card names (`named`, in its order), each on its zone, and for every zone
   * left bare one of their trade among the garments of the world (`outfitOf`: by name, description or tags, chosen by their name, so
   * the same every time they are met), with no call to the models. The marks are the inventory's, as the wanderer's (`dressInventory`):
   * the renderer and the wire read them the same way; the inventory a garment is added to is theirs. An animal wears nothing.
   */
  private dress(id: Id, identity: Identity, inv: Inventory, named: ItemDef[]): Outfit {
    const kind: string | undefined = this.host.ecs.get(id, 'module')?.id;
    if (kind && this.speciesOf(kind) === 'animal') return {};
    const garments: Garment[] = [];
    for (const d of this.host.content.items.values()) {
      const zone = this.host.wornZone(d.id);
      if (zone) garments.push({ id: d.id, name: d.name, description: d.description, tags: d.tags, zone });
    }
    const outfit = outfitOf(named.map((d) => d.id), identity.job, garments, identity.name);
    const on = dressInventory(inv, outfit, (item) => this.host.itemSpec(item));
    return Object.fromEntries(on.map((zone) => [zone, outfit[zone]!])) as Outfit;
  }

  /**
   * The sheet of an individual for the Actor (T157): the Narrator writes it once, at their first line, and again only when what
   * it was written from changed (their bonds, their story: `sheetFingerprint`), never at every line. Saved with the individual in
   * world/people.json. Paid by whoever pays the line (`chi`). Nothing is written when the Actor is off.
   */
  async ensureSheet(name: string, chi?: string): Promise<string | undefined> {
    if (!this.host.actorOn()) return undefined;
    const p = this.individualOf(name);
    if (!p) return undefined;
    const stamp = sheetFingerprint(p);
    if (p.sheet?.text && p.sheet.fingerprint === stamp) return p.sheet.text;
    const pending = this.sheeting.get(name);
    if (pending) return pending;
    const job = (async () => {
      try {
        const text = await npcSheet(
          this.host.council,
          {
            name: p.name,
            persona: p.persona ?? '',
            job: p.job,
            gender: p.gender,
            age: p.age,
            look: p.look,
            story: p.story,
            bonds: (p.family ?? []).map((f) => `${f.bond} ${f.name}`),
            routine: (p.routine ?? []).map((r) => `${italianName('momenti', r.when)}: ${r.does} (${italianName('dove', r.where)})`).join('; '),
            carries: p.carries ?? [],
          },
          this.host.focusOn([name]),
          chi,
        );
        if (!text || (await this.host.council.fourthWall(text, chi))) {
          this.host.council.say('kernel', 'scarta', `la scheda di ${name} ${text ? 'rompe la quarta parete' : 'è vuota'}: l'Attore recita dalla persona`, 'narrator', 'npc.sheet');
          return undefined;
        }
        this.updateIndividual(name, (x) => (x.sheet = { text: text, fingerprint: stamp }));
        this.host.commitContent(`scheda: ${name}`, 'npc.sheet', 'narrator', chi);
        this.host.council.say('narrator', 'info', `la scheda di ${name} è scritta, per l'Attore`, 'actor', 'npc.sheet');
        return text;
      } catch (e) {
        this.host.council.say('narrator', 'errore', `scheda di ${name}: ${(e as Error).message}`, undefined, 'npc.sheet');
        return undefined;
      }
    })();
    this.sheeting.set(name, job);
    try {
      return await job;
    } finally {
      this.sheeting.delete(name);
    }
  }

  /** What the routine says this individual does now. */
  routineNow(identity: Identity | undefined): { when: DayPhase; does: string; where: string } | undefined {
    if (!identity?.routine?.length) return undefined;
    const q = this.host.phase();
    return identity.routine.find((r) => r.when === q);
  }

  private when(): string {
    return `giorno ${this.host.day() + 1}, ${italianName('momenti', this.host.phase())}`;
  }

  /** A person or an animal, from the archetype's class (a cat, a dog, a horse are animals). */
  speciesOf(tipo: string): Species | undefined {
    const man = this.host.modules.get(tipo)?.manifest;
    if (!man) return undefined;
    const app = man.appearance;
    const classe = app?.class ?? (app?.model === 'animal' || app?.model === 'beast' ? app.model : guessClass(`${man.name} ${man.description ?? ''} ${app?.look ?? ''}`, man.persona ? 'figure' : undefined).id);
    return classe === 'animal' || classe === 'beast' ? 'animal' : 'person';
  }

  /**
   * The society is kept coherent (npc/society.ts): at boot the registry is checked and, if
   * something is wrong (relations impossible for the species or the gender, one side only, names
   * alike), repaired and committed; renamed people are renamed in the plots too. No model calls.
   */
  reviewSociety(): string[] {
    const people = readPeople(this.host.working());
    if (!people.people.length) return [];
    const { people: fixed, fixes, renames } = repairSociety(people, (t) => this.speciesOf(t));
    if (!fixes.length) return [];
    this.host.write('world/people.json', JSON.stringify(fixed, null, 2) + '\n');
    if (renames.length && this.host.working()[PLOTS_FILE]) this.host.write(PLOTS_FILE, writePlots(applyRenames(readPlots(this.host.working()), renames)));
    this.host.applyWorking();
    this.host.commit(`società: ${fixes.length} correzioni${renames.length ? ` (${renames.length} nomi nuovi)` : ''}`);
    this.host.council.say('arbiter', 'approva', `società: ${fixes.length} correzioni — ${fixes.slice(0, 6).join('; ')}${fixes.length > 6 ? '…' : ''}`, undefined, 'review.society');
    return fixes;
  }

  /**
   * The open plots are kept coherent with the society and the rune canon (reviewPlot): at boot what
   * can be repaired is (beats of people who do not exist, animals that talk, impossible quests), what
   * contradicts the registry or the canon is dropped (the history keeps it). No model calls.
   */
  reviewPlots(): string[] {
    const plots = readPlots(this.host.working());
    if (!plots.length) return [];
    const people = readPeople(this.host.working());
    const fixes: string[] = [];
    const kept: Plot[] = [];
    for (const p of plots) {
      if (p.state !== 'active') {
        kept.push(p);
        continue;
      }
      const r = reviewPlot(p, people, wordsOf(this.host.files()));
      if (!r.problems.length) kept.push(p);
      else if (r.plot) kept.push(r.plot), fixes.push(`«${p.title}»: ${r.problems.join('; ')}`);
      else fixes.push(`«${p.title}» ritirata: ${r.problems.join('; ')}`);
    }
    if (!fixes.length) return [];
    this.host.write(PLOTS_FILE, writePlots(kept));
    this.host.applyWorking();
    this.host.commit(`trame: ${fixes.length} corrette o ritirate`);
    this.host.council.say('arbiter', 'corregge', `trame: ${fixes.join(' — ')}`.slice(0, 600), 'narrator', 'review.plots');
    return fixes;
  }

  /** The registry entry of an individual, by name. */
  individualOf(name: string): Individual | undefined {
    return readPeople(this.host.files()).people.find((p) => p.name === name);
  }

  /**
   * An individual the master declares (T376, ADR-0188 §5.2): the Narrator writes them from the archetype `kind`, like `npc.individuate`,
   * with the master's facts as statements to keep (`facts`, a text already clean); the name the master gave is theirs whatever the answer
   * says. What breaks the fourth wall does not go in (the local filter only: the master's words never go to Jev, D54.5). They go in
   * `world/people.json` with where they are (`declared`) and no origin: awaited, until the kernel puts them in the plan of that place
   * (`placeDeclared`). One call of the Narrator, paid by `chi`.
   */
  async declare(d: { facts: string; name?: string; kind: string; place: DeclaredPlace; chi?: string }): Promise<{ ok: true; individual: Individual } | { ok: false; reason: string }> {
    const m = this.host.modules.get(d.kind)?.manifest;
    if (!m?.persona) return { ok: false, reason: `«${d.kind}» non è un tipo di abitante` };
    const taken = (n: string) => readPeople(this.host.files()).people.some((p) => p.name.toLowerCase() === n.toLowerCase());
    if (d.name && taken(d.name)) return { ok: false, reason: `nel mondo c'è già qualcuno che si chiama ${d.name}` };
    const specie = this.speciesOf(d.kind) ?? 'person';
    let identity: Identity;
    try {
      identity = await individuate(
        this.host.council,
        { name: m.name, description: m.description ?? '', persona: m.persona, specie },
        { place: d.place.place, common: [...this.host.content.items.values()].map((x) => x.name), society: societySummary(readPeople(this.host.files())), facts: d.facts, name: d.name, focus: this.host.focusOn([`kind:${nodeSlug(d.kind)}`]) },
        d.chi,
      );
    } catch (e) {
      return { ok: false, reason: `il Narratore non ha scritto l'individuo: ${(e as Error).message}` };
    }
    if (d.name && identity.name !== d.name) {
      identity.persona = applyRenames(identity.persona, [[identity.name, d.name]]);
      identity.name = d.name;
    }
    if (!d.name && taken(identity.name)) return { ok: false, reason: `nel mondo c'è già qualcuno che si chiama ${identity.name}` };
    const wall = metaBreak(`${identity.persona}\n${identity.story ?? ''}\n${identity.job ?? ''}\n${identity.look}`, wordsOf(this.host.files()));
    if (wall) return { ok: false, reason: `l'individuo scritto rompe la quarta parete («${wall}»)` };
    identity.gender ??= guessGender({ name: identity.name, job: identity.job ?? '', family: identity.family ?? [] });
    const individual: Individual = {
      name: identity.name, kind: d.kind, species: specie, gender: identity.gender, job: identity.job || m.name, age: identity.age, family: identity.family ?? [], routine: identity.routine ?? defaultRoutine(identity.job ?? ''),
      story: identity.story, place: d.place.place, persona: identity.persona, look: identity.look, carries: identity.carrying,
      ...(identity.wearing.length ? { wears: identity.wearing } : {}),
      declared: d.place,
    };
    const next = addIndividual(readPeople(this.host.files()), individual, (t) => this.speciesOf(t));
    this.host.write('world/people.json', JSON.stringify(next, null, 2) + '\n');
    this.host.applyWorking();
    this.host.commitContent(`persone: ${individual.name}, ${individual.job} (dichiarato dal master)`, 'npc.individuate', 'narrator', d.chi);
    const fam = individual.family.map((f) => `${f.bond} di ${f.name}`).join(', ');
    this.host.council.say('narrator', 'propone', `${individual.name}, ${individual.job}${fam ? `; ${fam}` : ''}: dichiarato dal master, a «${d.place.place}»`, undefined, 'npc.individuate');
    return { ok: true, individual: next.people.find((p) => p.name === individual.name) ?? individual };
  }

  /** A declared individual taken in by a place (T376): the origin of the character of that plan that is them, and the place's name. */
  placeDeclared(name: string, origin: string, place: string): void {
    this.updateIndividual(name, (p) => {
      p.origin = origin;
      p.place = place;
    });
  }

  private updateIndividual(name: string, fn: (p: Individual) => void): void {
    const people = readPeople(this.host.files());
    const p = people.people.find((x) => x.name === name);
    if (!p) return;
    fn(p);
    this.host.write('world/people.json', JSON.stringify(people, null, 2) + '\n');
    this.host.keepFile('world/people.json');
  }

  /**
   * People remember: promises, favours, betrayals, what they saw. Memories are written in the society
   * registry (committed with the next save) and read back whenever they speak.
   */
  rememberAbout(name: string, testo: string, con?: string, peso = 1, viandante?: string): void {
    if (!testo.trim()) return;
    this.updateIndividual(name, (p) => (p.memories = remember(p.memories, { when: this.when(), text: testo.slice(0, 200), ...(con ? { with: con } : {}), ...(viandante ? { wanderer: viandante } : {}), weight: Math.max(1, Math.min(3, peso)) })));
  }

  /** A memory of the wanderer acting now: only they hear of it again (T34). */
  rememberWanderer(name: string, testo: string, peso: number): void {
    const w = this.host.wanderer();
    this.rememberAbout(name, testo, w.name, peso, w.id);
  }

  /** How the world speaks of a wanderer: «il viandante» when alone, their name otherwise. */
  wandererWord(w: NpcWanderer): string {
    return w.id === SOLO && w.name === WANDERER_NAME ? 'il viandante' : w.name;
  }

  /** What someone becomes to the wanderer acting now (friend, sweetheart, spouse, child…): a fact of the world; its kind as an id when who said it knows it (T310b). */
  setBond(name: string, legame: string, kind?: string): void {
    const w = this.host.wanderer();
    this.updateIndividual(name, (p) => {
      // As everywhere in the registry: what this individual is to the other one.
      p.family = [...p.family.filter((f) => wandererOf(f) !== w.id), { name: w.name, bond: legame, ...(kind ? { kind } : {}), wanderer: w.id }];
    });
    const who = this.wandererWord(w);
    this.host.recordRule({ key: `legame|${name}${w.id === SOLO ? '' : `|${w.id}`}`, text: `${name} e ${who}`, possible: true, story: `${name} ora è ${legame} ${who === 'il viandante' ? 'del viandante' : `di ${who}`}.`, effects: ['bond'] }, false);
    this.host.message(`${name} ora è: ${legame}.`, 'good');
  }

  /** What an individual is to the wanderer acting now, if anything. */
  bondOf(name: string): string | undefined {
    const p = this.individualOf(name);
    return p ? bondWith(p, this.host.wanderer().id) : undefined;
  }

  /** The entity of an individual, if they walk the loaded world. */
  entityOf(name: string): Id | undefined {
    return this.host.ecs.query('identity').find((id) => this.host.ecs.get(id, 'identity').name === name);
  }

  /** The entity of a living individual of the loaded world, by name. */
  bodyOfName(): Map<string, Id> {
    const out = new Map<string, Id>();
    for (const id of this.host.ecs.query('identity', 'pos')) {
      const n = this.host.ecs.get(id, 'identity')?.name;
      if (typeof n === 'string' && !out.has(n)) out.set(n, id);
    }
    return out;
  }

  /**
   * A child is born to someone and the wanderer (the Council allowed it): a new individual of the same
   * kind, with the family already written, who will grow up in the same place.
   */
  async birth(parentId: Id, name?: string): Promise<Id | undefined> {
    const parent: Identity | undefined = this.host.ecs.get(parentId, 'identity');
    const entry = this.host.modules.get(this.host.ecs.get(parentId, 'module')?.id);
    const p = this.host.ecs.get(parentId, 'pos');
    if (!parent || !entry || !p) return undefined;
    const origin = `${this.host.ecs.get(parentId, 'origin')?.key ?? parent.name}#figlio${this.host.worldStamp()}`;
    const child = this.host.spawnModuleEntity(entry, p.x + 0.7, p.y + 0.4, this.host.ecs.get(parentId, 'chunk')?.key, origin);
    const gender = name ? guessGender({ name: name, job: '', family: [] }) : hashStr(origin) % 2 ? 'female' : 'male';
    // A name of their own, unlike anyone else's (not "Piccola Berta" beside Berta).
    const taken = readPeople(this.host.files()).people.map((x) => x.name);
    const nome = name && !taken.some((t) => similarNames(t, name)) ? name : freshName(this.speciesOf(entry.manifest.id) ?? 'person', gender, taken, origin);
    const child_ = gender === 'female' ? 'figlia' : 'figlio';
    const w = this.host.wanderer();
    const other = this.wandererWord(w);
    const ofOther = other === 'il viandante' ? 'del viandante' : `di ${other}`;
    const identity: Identity = {
      name: nome,
      persona: `Sei ${nome}, ${gender === 'female' ? 'una bambina appena nata' : 'un bambino appena nato'}, ${child_} di ${parent.name} e ${ofOther}. Parli a monosillabi, guardi tutto con meraviglia.`,
      look: 'piccolissimo, in fasce',
      carrying: [],
      wearing: [],
      job: 'bambino',
      age: 'neonato',
      gender,
      family: [{ name: parent.name, bond: child_ }, { name: w.name, bond: child_, wanderer: w.id }],
      routine: [
        { when: 'morning', does: 'gioca vicino a casa', where: 'home', activity: 'stroll' },
        { when: 'day', does: 'segue il genitore al lavoro', where: 'work', activity: 'stroll' },
        { when: 'evening', does: 'ascolta storie in piazza', where: 'square', activity: 'chat' },
        { when: 'night', does: 'dorme', where: 'home', activity: 'sleep' },
      ],
    };
    this.host.ecs.set(child, 'identity', identity);
    const glyph = this.host.ecs.get(child, 'glyph');
    if (glyph) glyph.scale = (glyph.scale ?? 1.1) * 0.6;
    const next = addIndividual(readPeople(this.host.files()), { name: nome, kind: entry.manifest.id, species: this.speciesOf(entry.manifest.id) ?? 'person', gender: gender, job: 'bambino', age: 'neonato', family: identity.family!, routine: identity.routine!, origin: origin, persona: identity.persona, look: identity.look }, (t) => this.speciesOf(t));
    this.host.write('world/people.json', JSON.stringify(next, null, 2) + '\n');
    this.host.applyWorking();
    this.host.commitContent(`nascita: ${nome}, ${child_} di ${parent.name} e ${ofOther}`, 'npc.birth', 'narrator');
    this.rememberWanderer(parent.name, `è ${gender === 'female' ? 'nata nostra figlia' : 'nato nostro figlio'}, ${nome}`, 3);
    this.host.message(`È ${gender === 'female' ? 'nata' : 'nato'} ${nome}!`, 'good');
    this.host.council.say('narrator', 'approva', `nasce ${nome}, ${child_} di ${parent.name} e ${ofOther}`, undefined, 'npc.birth');
    return child;
  }
}
