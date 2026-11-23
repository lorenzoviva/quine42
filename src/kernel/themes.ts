// The themes offered by the Genesis screen (T152, ADR-0134; the frontier, the islands and the far world, T184): plain text, the same free text the player can rewrite.
// A theme is not a seed of its own: what a universe keeps of it is `prompts/theme.md`, like any theme written by hand.
// A theme is a prompt of the Council, so it is English (T310, ADR-0165); the world it makes speaks the language of its universe.

export interface WorldTheme {
  id: 'medievale' | 'steampunk' | 'moderno' | 'futuristico' | 'western' | 'pirates' | 'space';
  /** The name the Genesis screen shows (the interface, Italian until T239). */
  name: string;
  text: string;
  /**
   * The nature of the world it brings to the Genesis (T437, ADR-0224), as `repairNature` reads it: only what the kernel can make true. The
   * pirates bring the archipelago (T441, ADR-0229); the frontier, the pirates and space bring true relief (T475, ADR-0256; medieval stays
   * hilly); the void and the stars of space come with T450; every other theme is a world of today's nature, and a theme written by hand
   * always is.
   */
  nature?: Partial<import('./nature').WorldNature>;
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
  {
    id: 'western',
    name: 'Far West',
    text: `# Theme: Dust and Rails

The far west of the frontier: prairies of yellow grass, red canyons and mesas, rivers with fords, a railway that
is still being laid; towns of planks along a single street, with the saloon, the general store, the sheriff's office,
the stable and the church with a bell; around, ranches with corrals, mining camps in the hills, wagon trails, the
desert. Cowhands, ranchers, sheriffs and deputies, saloon keepers, farriers, prospectors, telegraph clerks, preachers,
schoolteachers, cardsharps, outlaws, horses, cattle, mules and coyotes. Revolvers and rifles are tools of the world, with their weight.

Tone: concrete, warm, dusty, with a pinch of wonder. The world is alive and consistent, and for those who live in it, it is real.
Stories are born from the people: work, families, loves, debts, cattle drives, land claims, feuds, robberies, journeys.
Here and there, on the ground, lie the runes: slabs carved with a sign that gives off a faint light, in the dust as
in the riverbed. Prospectors pick them up with the nuggets, the store buys them by weight, the preacher warns against them;
whoever has spoken one does not boast of it at the bar. What they really do is written in the canon of the runes.`,
    nature: { relief: 'true' },
  },
  {
    id: 'pirates',
    name: 'Pirati',
    text: `# Theme: The Islands of the Brethren

An archipelago of warm seas in the age of sail: islands scattered over open water, a long swim from one another,
with cays and sandbanks between the farthest; harbour towns of timber and coral stone, quays with ships at anchor in the bay,
shipyards, taverns of the port, a fort on the headland, plantations, palm beaches, jungle in the heart of the islands,
wrecks on the shoals. Sailors, boatswains, ship's cooks, carpenters, fishermen, smugglers, harbour masters, tavern
keepers, governors' soldiers, freebooters, parrots, goats, crabs and ship's cats. Pistols and cutlasses are tools of the world, with their weight.

Tone: concrete, warm, salty, with a pinch of wonder. The world is alive and consistent, and for those who live in it, it is real.
Stories are born from the people: work, crews, families, loves, debts, shares of a prize, mutinies, rivalries, voyages told on the quay.
Here and there, on the ground, lie the runes: slabs carved with a sign that gives off a faint light, in the sand as
in the jungle. Sailors keep them for luck, smugglers trade them, harbour masters tax them; whoever has spoken
one tells it only to their own crew. What they really do is written in the canon of the runes.`,
    nature: { geography: 'archipelago', relief: 'true' },
  },
  {
    id: 'space',
    name: 'Spazio',
    text: `# Theme: The Far Colony

A world far from the one where people were born, settled generations ago: ochre plains and deep canyons under a pale sky,
fields of lichen and orchards under glass, frozen lakes, craters, the old landing field where the shuttles come down
from the ship that stays in orbit; settlements of prefabricated modules, workshops of salvage, water towers, greenhouses,
the first stone houses of those born here. The air can be breathed, thin and cold. Technicians, shuttle pilots,
growers, ice miners, medics, cooks, teachers, traders of spare parts, the colony's wardens, prospectors, hardy goats,
woolly beasts of this world and the cats that came on the ship.

Tone: concrete, warm against the cold, with a pinch of wonder. The world is alive and consistent, and for those who live in it, it is real.
Stories are born from the people: work, families, loves, debts, shifts, harvests, water rights, rivalries, journeys between settlements.
Here and there, on the ground, lie the runes: slabs carved with a sign that gives off a faint light, in the dust as
in the ice. They were here before the colony: the technicians measure them and understand nothing, the growers keep
them in the greenhouse, the children collect them. What they really do is written in the canon of the runes.`,
    nature: { relief: 'true' },
  },
];

/**
 * The seed's environments that belong to no age (ADR-0134): a Genesis that wrote too few keeps these, not a castle in a city of neon; and a
 * universe of another theme receives from the seed only these (T433, `upgradeFromSeed`), never the castles and the dragons of Valmora.
 */
export const TIMELESS_LAYOUTS: ReadonlySet<string> = new Set(['woods', 'fields', 'ruins', 'dungeon', 'desert', 'jungle', 'mountains', 'lake', 'harbour']);

/**
 * Whether a universe is of the seed's age (T433): its `prompts/theme.md` is the medieval theme as the seed has it, or it has none of its own.
 * A theme written by hand, even a medieval one, is a world of its own.
 */
export function seedAged(theme: string | undefined): boolean {
  return theme === undefined || themeOfText(theme)?.id === 'medievale';
}

/** The theme a text is, as it is or with only its blank ends and line endings changed; a text rewritten is no theme of the list. */
export function themeOfText(text: string): WorldTheme | undefined {
  const plain = (s: string) => s.replace(/\r\n/g, '\n').trim();
  return WORLD_THEMES.find((t) => plain(t.text) === plain(text));
}
