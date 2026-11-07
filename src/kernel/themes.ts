// The four themes offered by the Genesis screen (T152, ADR-0134): plain text, the same free text the player can rewrite.
// A theme is not a seed of its own: what a universe keeps of it is `prompts/theme.md`, like any theme written by hand.
// A theme is a prompt of the Council, so it is English (T310, ADR-0165); the world it makes speaks the language of its universe.

export interface WorldTheme {
  id: 'medievale' | 'steampunk' | 'moderno' | 'futuristico';
  /** The name the Genesis screen shows (the interface, Italian until T239). */
  name: string;
  text: string;
}

/** The first is the seed's own `prompts/theme.md`: a test keeps them equal. */
export const WORLD_THEMES: readonly WorldTheme[] = [
  {
    id: 'medievale',
    name: 'Medievale',
    text: `# Theme: The Kingdom of Valmora

A quiet medieval kingdom: meadows, woods, lakes, hills, villages of simple folk, distant castles,
roads that lead to ever more different lands. Farmers, craftsmen, merchants, guards, village
mages, brigands in the woods, animals of the house and of the wood.

Tone: concrete, warm, with a pinch of wonder. The world is alive and consistent, and for those who live in it, it is real.
Stories are born from the people: work, families, loves, debts, feasts, rivalries, journeys, beasts, magic.
Here and there, on the ground, lie the runes: slabs carved with a sign that gives off a faint light. People
pick them up, study them, sell them, fear them; what they really do is written in the canon of the runes.`,
  },
  {
    id: 'steampunk',
    name: 'Steampunk',
    text: `# Theme: The Cities of Steam

An age of steam and brass: brick cities under a sky of soot, railways on the viaducts, airships
moored to the towers, workshops that never sleep; outside, mines, countryside with boiler threshers, ports of
steamships. Engine drivers, stokers, watchmakers, loom girls, penniless inventors, newsboys, copper thieves,
draught horses and factory cats.

Tone: concrete, warm, with a pinch of wonder. The world is alive and consistent, and for those who live in it, it is real.
Stories are born from the people: work, families, loves, debts, strikes, patents, rivalries, journeys.
Here and there, on the ground, lie the runes: slabs carved with a sign that gives off a faint light. Inventors try to
understand them, collectors pay well for them, the old fear them; some call what they do magic, others a science
yet to be written. What they really do is written in the canon of the runes.`,
  },
  {
    id: 'moderno',
    name: 'Moderno',
    text: `# Theme: The Big City, the Nineties

A big city in the nineties: blocks of flats and palazzi, avenues of plane trees, trams and the underground, building sites, shopping
centres; at the edges the ring road, the fields, the harbour, the hills where people go on Sundays. Barmen, tram drivers,
plumbers, shop girls, nurses, students, traffic wardens, taxi drivers, small-time swindlers, neighbourhood dogs and cats. Phone
boxes, local radio stations, video cassettes, mopeds.

Tone: concrete, warm, with a pinch of wonder. The world is alive and consistent, and for those who live in it, it is real.
Stories are born from the people: work, families, loves, debts, evictions, neighbourhood feasts, rivalries, journeys.
Here and there, on the ground, lie the runes: slabs carved with a sign that gives off a faint light, on the lawn as
on the pavement. On the radio they laugh about them; kids pick them up, flea markets sell them, a professor or two
studies them, and whoever has spoken one tells it under their breath. What they really do is written in the canon of the runes.`,
  },
  {
    id: 'futuristico',
    name: 'Futuristico',
    text: `# Theme: Neon on the Rain

A metropolis of the future: glass towers, neon signs under a rain that never stops, suspended trains, markets
under the viaducts, vertical greenhouses; beyond the walls, flooded coasts and stretches of scrap. Repairers of automatons, shuttle
pilots, street cooks, unlicensed doctors, couriers, company guards, rooftop cats and crows.

Tone: concrete, warm under the rain, with a pinch of wonder. The world is alive and consistent, and for those who live in it, it is real.
Stories are born from the people: work, families, loves, debts, shifts, smuggling, rivalries, journeys.
Here and there, on the ground, lie the runes: slabs carved with a sign that gives off a faint light, in the mud as
on the asphalt. The companies buy them, couriers smuggle them, street sellers sell fake ones; on the street
some call what they do magic, unashamed. What they really do is written in the canon of the runes.`,
  },
];

/** The theme a text is, as it is or with only its blank ends and line endings changed; a text rewritten is no theme of the list. */
export function themeOfText(text: string): WorldTheme | undefined {
  const plain = (s: string) => s.replace(/\r\n/g, '\n').trim();
  return WORLD_THEMES.find((t) => plain(t.text) === plain(text));
}
