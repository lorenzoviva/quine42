// The typed questions of every kind of case (T313). The same questions go to Jev and to Gemini (banco.ts → typedPrompt):
// short, one judgement each, the option sets closed. The state is the world's (Italian); the questions are in English, the
// project's internal language (ADR-0153).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Answer, Case, Question } from './banco';

/** The root of the repository (lab/banco/jev → ../../..). */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const readJson = (p: string) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

/** The seed's library of models a new thing could wear: no sounds, nothing of the studio. */
export function seedLibrary(): Array<{ id: string; nome: string; classe: string }> {
  const index = readJson('universe/models/index.json') as Record<string, { classe: string; nome?: string }>;
  return Object.entries(index)
    .filter(([id, m]) => m.classe !== 'suono' && !/^(corona-|schermo-|circuito-)/.test(id))
    .map(([id, m]) => ({ id, nome: m.nome ?? id, classe: m.classe }));
}

const ITEM_PACKS: Record<string, string[]> = {
  seme: ['universe/modules/items.base/manifest.json'],
  neapolis: ['lab/banco/universi-cloud/neapolis/modules/items.neapolis/manifest.json'],
};

/** The names of the items a universe knows, in the order of their packs. */
export function knownItems(universe: string): string[] {
  const packs = ITEM_PACKS[universe];
  if (!packs) throw new Error(`nessun pacchetto di oggetti per ${universe}`);
  return packs.flatMap((p) => (readJson(p).items as Array<{ name: string }>).map((i) => i.name));
}

/** A state as written in a case file, with its references (`library: "seme"`, `known_items: "neapolis"`) read from the repository. */
export function resolveState(state: any): any {
  if (!state || typeof state !== 'object') return state;
  const out = { ...state };
  if (out.library === 'seme') out.library = seedLibrary();
  if (typeof out.known_items === 'string') out.known_items = knownItems(out.known_items);
  return out;
}

/** The closed set of the effects of a free action (types.ts → Effect, internal names of the contract 0.2). */
export const EFFECTS: Record<string, string> = {
  message: 'Only a story: nothing in the world changes.',
  needs: 'The hunger, thirst, energy or health of the wanderer change (eating, drinking, resting, getting hurt).',
  create_item: 'An item appears on the ground: something taken, picked, made or found.',
  consume: 'The wanderer uses up another item they carry (an ingredient, some food, a fuel).',
  destroy: 'The target breaks or ends for good.',
  open: 'The target opens (it is already a container).',
  container: 'The target becomes something that can be opened, with a space inside.',
  terrain: 'The ground around turns into another terrain (a path dug, water poured, a field sown).',
  relief: 'The ground is raised or dug by whole levels.',
  fire: 'Flames that burn what is flammable around.',
  light: 'A light around, for a while.',
  shield: 'The wanderer is protected for a while.',
  push: 'The target is pushed away.',
  summon: 'Something or someone that already exists in the world appears.',
  state: 'A lasting condition of the wanderer that makes a new mechanic possible (riding a horse, wearing a backpack, carrying a torch).',
  remove_state: 'A condition of the wanderer ends (getting off the horse, putting down the backpack).',
  bond: 'Only on a person: what that person becomes for the wanderer (friend, lover, enemy).',
  memory: 'Only on a person: something that person will remember about the wanderer.',
  birth: 'Only between spouses who want it: a child is born.',
};

/** The Referente's teams (minds.ts → REFERENTE_SCHEMA, the values of the contract 0.1). */
export const TEAMS: Record<string, string> = {
  nessuno: 'Nobody: the wanderer only asks for information or chats, or asks for credits or money (the Council never gives those).',
  oggetto: 'The Forge makes a new tool or item that one carries in the bag (a sword, a key, a lamp).',
  cosa: 'The Forge makes a new thing that stands in a place of the world (furniture, a machine, a statue, a well).',
  personaggio: 'The Forge makes a new kind of person or animal that lives in the world.',
  ambiente: 'The Cartographer makes a new kind of place or region and puts it on the map.',
  regola: 'A new rule of the world: a law of how things work from now on.',
  riscolpisci: 'The Sculptor remakes the look (the 3D model) of a person, thing or item that already exists.',
  oggetti: 'A pack of several common items of one kind (tools of a trade, food of a region).',
  meccanica: 'The Engineer adds a mechanic with its own panel (equipment slots, a quiver, a character sheet).',
  runa: 'The wanderer is given runes: the words of the code they ask for, one rune per word.',
  musica: 'The Musician writes a piece of music for a place, or remakes the sound of a moment of the game.',
};

/** What the principles of the Council forbid inside the world (fourthwall.ts → COUNCIL_PRINCIPLES), as the yes of a Noul. */
export const FOURTH_WALL = {
  true: {
    meta: 'It speaks of code, simulations, programs, computers, games, players, agents or a council that makes the world; of cracks of reality, measured edges of the world, worlds that repeat or restart.',
    legend: 'It hints at the game disguised as a legend: whoever walks too far always comes back to the square or never gets lost; someone or something watches every wanderer; a border nobody can cross or that makes you turn back; the world ends, repeats, restarts or exists only for whoever looks at it.',
    doubles: 'It doubles the runes: other glowing signs, glyphs, letters of light or shining writings in the ground, or runes that do what the canon does not say.',
    roles: 'It gives abstract roles: keepers of reality, censors of identities, archivists of the world, measurers of anomalies.',
  },
  false: 'It is a person, a thing, a place or a story of the world, concrete: trades, loves, debts, feasts, thefts, journeys, beasts, the magic of the runes as the canon says it; machines and trades of the world’s own era.',
};

/** The options of a crossroads of an individual (docs/design/comportamento-npc.md, 2.1): all of them run without a model. */
export const CROSSROADS: Record<string, string> = {
  compra: 'Buy what is missing from someone who sells it.',
  'chiedi:vicino': 'Ask a neighbour or a colleague for help or for what is missing.',
  'chiedi:viandante': 'Ask the wanderer who is nearby for help.',
  aspetta: 'Wait where they are until things change.',
  ripara: 'Repair what is broken, by themself.',
  continua: 'Go on with the task as if nothing happened.',
  rinuncia: 'Give up this task and go to the next one.',
  va_a_casa: 'Leave everything and go home.',
  aiuta: 'Help whoever asks or is in trouble.',
  ignora: 'Ignore what happens and mind their own business.',
};

const noul = (id: string, instructions: unknown, criteria?: { true?: unknown; false?: unknown }): Question => ({ id, type: 'noul', instructions, ...(criteria ? { criteria } : {}) });
const choice = (id: string, instructions: unknown, criteria: Record<string, unknown>): Question => ({ id, type: 'choice', instructions, criteria });

type Builder = (state: any) => Question[];

export const BUILDERS: Record<string, Builder> = {
  azione: (s) => [
    noul(
      'possible',
      'Can what `player_writes` describes really happen to `target` in this world, with what the wanderer has in `carrying` and `holding`? Judge like a fair game master: things obey physics, no miracles without tools or runes, the right tool is needed to pick a lock, cut, dig or light a fire.',
      { true: 'It can happen: the wanderer has what it takes, or it needs nothing special.', false: 'It cannot happen: it needs a tool or an item the wanderer does not carry, or it is physically impossible, or it would be a miracle.' },
    ),
    choice('effect', 'If what `player_writes` describes happens, which effect is its main consequence?', EFFECTS),
    ...(Array.isArray(s.carrying) && s.carrying.length
      ? [choice('requires', 'Which item of `carrying` does the wanderer need in order to do what `player_writes` describes? Choose `none` if they need none of them.', { ...Object.fromEntries(s.carrying.map((c: string) => [c, null])), none: 'No carried item is needed.' })]
      : []),
    noul('repeatable', 'Is what `player_writes` describes a sensible action that could be done again in the same way on things like `target`, so that it can become an entry of their menu?'),
  ],
  referente: () => [
    choice('team', 'The wanderer who reached the studio of the Council asks for what `request` says (after `history`, if any). Which team of the Council should take this request?', TEAMS),
    noul('refuse', 'Would granting `request` destroy the universe, kill or erase the wanderer themself, or break the laws of the game (its physics, its rules, the credits)?'),
  ],
  modello: (s) => [
    choice(
      'model',
      'Which model of `library` can show `thing` in the world well enough: the same kind of thing with a similar shape, so that nobody would find it odd? Choose `nuovo` if none of them can.',
      { ...Object.fromEntries((s.library as Array<{ id: string; nome: string; classe: string }>).map((m) => [m.id, `${m.nome} [${m.classe}]`])), nuovo: 'None of the models looks like it: a new model is needed.' },
    ),
    noul('fits', 'Is there a model in `library` that shows `thing` well enough (the same kind of thing, a similar shape)?'),
  ],
  combinazione: (s) => [
    noul('makes', 'Does combining `a` with `b` by hand credibly make one of `known_items`? Be strict, like a real craftsman: most combinations make nothing.'),
    choice('result', 'Which of `known_items` does combining `a` with `b` make? Choose `nessuno` if they make nothing.', { ...Object.fromEntries((s.known_items as string[]).map((n) => [n, null])), nessuno: 'They make nothing.' }),
  ],
  fabbricazione: (s) => [
    noul('possible', 'Can the wanderer make what `wants_to_make` says by hand, credibly, using only what is in `carrying`? Be strict, like a real craftsman.'),
    choice('result', 'Which of `known_items` is what `wants_to_make` asks for? Choose `nuovo` if it is none of them.', { ...Object.fromEntries((s.known_items as string[]).map((n) => [n, null])), nuovo: 'It is a new item, none of the known ones.' }),
  ],
  'quarta-parete': () => [noul('breaks', 'Does `text`, written for the people and things inside the world, break the fourth wall of the world?', FOURTH_WALL)],
  mestiere: (s) => [
    choice(
      'program',
      'Which work program of `programs` fits the trade in `trade`, so that the person does that work during the day? Choose `nessuno` if none fits.',
      { ...Object.fromEntries((s.programs as Array<{ id: string; nomi: string[] }>).map((p) => [p.id, p.nomi.slice(0, 6).join(', ')])), nessuno: 'None of the programs is this trade.' },
    ),
  ],
  bivio: (s) => [
    choice('decision', 'In the situation `situation`, what does `person` do now, true to their character, their bonds and their work?', Object.fromEntries((s.options as string[]).map((o) => [o, CROSSROADS[o.replace(/:.*$/, '')] ?? CROSSROADS[o] ?? null]))),
  ],
  meta: (s) => [
    choice('where', 'Where does `person` go now, in the part of the day `moment`, given their routine and the facts in `today`?', Object.fromEntries((s.options as Array<{ id: string; what: string }>).map((o) => [o.id, o.what]))),
  ],
  squadra: (s) => [
    choice('member', 'Who of `candidates` should take the role `role` in the work `venture`?', Object.fromEntries((s.candidates as Array<{ nome: string; mestiere: string }>).map((c) => [c.nome, c.mestiere]))),
  ],
  passo: (s) => [
    choice('step', 'What should `member` do next for the work `venture`, given what it still needs and what is in `carrying` and `deposit`?', Object.fromEntries((s.options as Array<{ id: string; what: string }>).map((o) => [o.id, o.what]))),
  ],
};

/**
 * Other questions for the same cases (the variant `domande-2`, written after the first round): one judgement each, as TypeSafe's docs
 * ask (model-jaggedness: «hiding several judgments inside one question»), and the decision the code composes from them. The examples in
 * the questions are not the cases' answers.
 */
export const SECOND: Record<string, { questions: (state: any) => Question[]; derive: (c: Case, a: Record<string, Answer>) => Record<string, Answer> }> = {
  'quarta-parete': {
    questions: () => [
      noul('meta', 'Does `text` speak of code, simulations, programs, computers, games, players, agents or a council that makes the world; of cracks of reality, of the edges of the world measured, of worlds that repeat or restart?'),
      noul('legend', 'Does `text` tell, even as a legend or a rumour, that whoever walks too far always comes back to the square or never gets lost; that someone or something watches every wanderer; that a border cannot be crossed or makes you turn back; that the world ends, repeats, restarts or exists only for whoever looks at it?'),
      noul('doubles', 'Does `text` speak of glowing signs, glyphs, letters of light or shining writings in the ground or on things, other than the runes; or of runes that do something more than being stones with a sign that glows?'),
      noul('roles', 'Does `text` give someone an abstract role over the world itself: keeper of reality, censor of identities, archivist of the world, measurer of anomalies, someone who keeps the world from falling apart?'),
    ],
    derive: (_c, a) => {
      const p = Math.max(...['meta', 'legend', 'doubles', 'roles'].map((k) => a[k]?.p ?? 0));
      return { breaks: { type: 'noul', value: p >= 0.5, p } };
    },
  },
  combinazione: {
    questions: (s) => [
      noul('fits', 'Is one of `known_items` what one gets by putting `a` and `b` together by hand? (For example, flour with water gives dough; a hide with a needle gives a pouch.)'),
      choice('result', 'What does one get by putting `a` and `b` together by hand, among `known_items`? Choose `nessuno` if none of them.', { ...Object.fromEntries((s.known_items as string[]).map((n) => [n, null])), nessuno: 'None of the known items.' }),
    ],
    derive: (_c, a) => {
      const fits = (a.fits?.p ?? 0) >= 0.5;
      const probs = a.result?.probabilities;
      // The companion Noul decides whether something comes out; the Choice says what, its best option that is not `nessuno`.
      const best = probs ? Object.entries(probs).filter(([k]) => k !== 'nessuno').sort((x, y) => y[1] - x[1])[0]?.[0] : a.result?.value !== 'nessuno' ? String(a.result?.value) : undefined;
      return { makes: { type: 'noul', value: fits, p: a.fits?.p }, result: { type: 'choice', value: fits && best ? best : 'nessuno' } };
    },
  },
};

/** The same case with the questions of `domande-2`. */
export function second(c: Case): Case {
  const alt = SECOND[c.kind];
  return alt ? { ...c, questions: alt.questions(c.state) } : c;
}

/** A case as written in its file, with its state resolved and the questions of its kind (unless it brings its own). */
export function withQuestions(c: Omit<Case, 'questions'> & { questions?: Case['questions'] }): Case {
  const state = resolveState(c.state);
  if (c.questions?.length) return { ...c, state, questions: c.questions };
  const b = BUILDERS[c.kind];
  if (!b) throw new Error(`nessuna domanda per il compito ${c.kind}`);
  return { ...c, state, questions: b(state) };
}
