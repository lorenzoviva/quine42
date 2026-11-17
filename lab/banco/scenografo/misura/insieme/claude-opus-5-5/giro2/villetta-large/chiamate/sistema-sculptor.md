Write a MarkovJunior XML program that **grows** the building asked for, a voxel model that one enters, climbs and jumps in. You write it
**in blocks**: first the composition, then the whole program; after each block the game runs what you wrote and sends back, in text, what
came out (the plan of three seeds, then heights, front, side, cuts at every storey, the measures with their meaning, a trace node by node).
That is how you look at your model. Answer each time with the whole program so far, XML only, without explanations. There is no stock
building to start from: the composition is yours, from the concept.

## What matters most: the composition comes from the concept
The same program runs with at least 4 seeds and 2 sizes. A seed must give another building **of the same kind**: a fort is a ring of walls
with corner towers, a gate and a keep in a courtyard; a temple is terraces that shrink toward a shrine on top with a stair on the axis; a
block of flats is a tall box of regular storeys with a stair core and balconies; a country house is two or three volumes of different height
under pitched roofs, with a porch. Decide the **parts of this concept** and **where each goes relative to the others** (around the courtyard,
at the corners, as far as possible from the gate, against a wall, on the axis of the door), and let the seeds deform them: the sides, the wing
and which side it stands on, how many towers, which corner, how high, where the trees and the posts go. Two concepts must not have the same masses.
Where the concept leaves a ratio free, lean on the golden one (about 8 to 5): the main volume against the wing, the yard against the keep,
the walls against the roof; a winding stair or the rings of a dome may step as 1, 2, 3, 5, 8. The parts one lives in keep their least
measures: never shrink a door, a storey or a room for a ratio.

## The method: three levels, one program
```xml
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHE…every letter of the plan…" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- A. the composition, on the plan (z=0) of a grid five times smaller: a cell is 5 voxels, a quarter of a tile -->
    </sequence>
    <map scale="5 5 1" values="BE…every letter of the full grid, the parts' too…" symmetry="()">
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/> …one rule per plan letter: a block of 5 × 5…
      <sequence symmetry="(xy)">
        <!-- B. the heights: every plan letter rises as a column, by steps -->
        <!-- C. the full scale: the doors and the parts included, windows, roofs, cleaning -->
      </sequence>
    </map>
  </map>
  <color …/> … <action name="open" label="Apri la porta">…</action>
</sequence>
```
`soil="E"` is the soil of the world (the kernel writes it over the bottom layer at every size) and `origin="bottom"` puts H at its centre; the
first `map` brings them down (`in="E" out="E"`, `in="H" out="H"`). The plan is **20 × 20 cells at Large (100 × 100 × 80 voxels, 5 × 5
tiles), 30 × 30 at Huge (150, 7.5 × 7.5), 100 × 100 at Gargantuan (500, 25 × 25: the land of four places)**: write rules that do not depend on it, anchored to H, to
what is there, to the edge. The second `map` comes back to the box (5 × 5 × 1 for every cell: a plan letter without a rule leaves air), so the
same program serves every size. **One letter, one meaning**: a letter that is a wall must never also be a step or a marker. The plan letters
of the first grid and the letters of the full grid are two alphabets: list every letter you use in the `values` of its grid, the letters of
the parts you include too (T k #90 #91 #92; O o N; M; U). **Never use S nor #90-#97 for your own letters**: they belong to the parts.

## A. The composition (the plan, a cell a quarter of a tile)
Tested building blocks; combine and change them for the concept. A random decision for the whole building is a rule on **one cell** (the end
of a line, the centre), never a `prl` with `p` on every cell of an edge (that frays the edge):
```xml
<!-- a body around the centre: a line through H, 3 behind, 5 in front and one more by chance (the front end of the line decides), then 4 to each side of every cell of the line; its walls, the corners filled -->
<all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
<all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
<prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
<all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
<all in="hE" out="*w"/>
<all in="wE/*w" out="*w/**"/>
<!-- a wing: a second body against a side wall, from a cell of that side chosen at random, 3 out and 5 deep, with its own walls -->
<one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
<all in="aE" out="*a" symmetry="(x)" steps="2"/>
<all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
<all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
<!-- a yard around a body, then a ring two cells thick around the yard (a curtain wall), corners filled -->
<all in="KE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
<all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
<!-- a tower of 5 × 5 on every outer corner of the ring -->
<all in="EE/EW" out="**/*t"/>
<all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
<!-- the way out, from the centre straight to the front: through a wall (the door d), across the yard (the paving n), through the ring (the gatehouse G), then the road r to the edge; three cells wide -->
<all in="H/i" out="*/m" symmetry="()" steps="1"/><all in="m/i" out="*/m" symmetry="()"/>
<all in="m/K" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
<all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
<all in="dK" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/><all in="GW" out="*G" symmetry="(x)" steps="1"/>
<prl><rule in="m" out="i"/><rule in="H" out="i"/></prl>
<!-- something as far as possible from the gate (or near it: to= instead of from=), then grown into a square -->
<one in="c" out="K" steps="1"><field for="K" from="r" on="cr"/></one>
<all steps="4"><rule in="Kc" out="*K"/><rule in="K*/*c" out="**/*K"/></all>
<!-- the zone of the stair: along a wall, two cells from the next wall (the landing), four cells long and two wide -->
<one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
```
- **The door** of the building to the front, in the middle, 3 cells wide (15 voxels), the road straight to the edge; a gate in a ring wall
  is also a door: it needs a wall taller than a person above it (a gatehouse of its own letter, taller than the wall).
- **The stair** (`part-stair`) climbs toward large x and a body walks onto its first step **in line**: its zone has two cells of free floor
  before it (the landing) and floor after it, where it comes out one storey up.
- **A room** is at least 28 voxels clear from wall to wall at every size, counting where a body stands: a body of 9 × 9 cells inside, the
  stair's zone taken away, still leaves a square of 7 cells (35 voxels).

## What fits: the size decides what is built, not how big
A tile is always 20 voxels, so a larger size is a larger area at the same scale: the parts one lives in never shrink (a door at least 11 × 30,
a storey at least 30 clear, a room at least 28 a side, a lean-to at least 30 clear and 20 deep), a program too small for the whole building
builds **less** of it, a larger area holds **more**, never the same building bigger (the checks compare the two sizes: the larger needs
another kind of part, or a quarter more parts). Decide first what fits at each size: a fort is a keep inside a thin ring at 5 × 5, a yard with
a well at 7.5, the full fort with a moat at 10; a country house is the house and its porch at 5 × 5, then the hedge and the trees, then an
orchard and a well. Then write it with rules that choose from the area, not from numbers:
```xml
<!-- the yard grows four more where six cells of ground go on past it (once: steps="1"), three more where seven go on; always a rectangle -->
<all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
<all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
<!-- a thing where a window of free ground of its size matches (where it does not fit, nothing happens): a well in 5 × 5 of yard, a tree in 7 × 7 of lawn -->
<one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
<one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
<!-- a ring beyond what is built, only where the ground goes on past it: a hedge, a moat (measured from the yard outward, so it is not born along the edge of the box) -->
<all in="gE" out="*x"/>
<all in="cWWEEEEE" out="***aa***" steps="1"/><all in="[Wt]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
```
Every part stays attached to the rest on the ground (a path, a fence, a wall), not standing alone. **Draw no animal and no person**: a
letter of the palette carries `area="pasture"` (a plain lowercase name: `yard`, `barn`, `house`, `field`, `orchard`, `courtyard`, `keep`,
`tower`, `garden`, `porch`…), a hidden letter too (`<color symbol="c" hidden="True" area="courtyard"/>`): keep those letters on the bottom
layer at the end, under the floors and on the ground, instead of rewriting them to the empty cell, and the world knows the area of every tile.
The soil `E` stays as it is, hidden.

## B. The heights: columns by steps
After the second `map` every plan letter is a block of 5 × 5 on the bottom layer. A letter rises by moving its head up and leaving a letter at
each step: `in="B h" out="h f"` makes the head h go up one layer and leave f below; `in="B w" out="w *"` grows a solid column of w. **The
heights are numbers of steps**: a storey is 32 (a floor, 31 of air, the slab); a person is 30 tall. The floors of a room with two storeys
(f the planks, F the slab, R the roof letter), beside the walls that rise 64 and take the roof letter on top:
```xml
<all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>   <!-- plaster, a band for the windows, plaster -->
<all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
<prl in="w" out="R"/>
<all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>   <!-- z=0: the floor -->
<all in="B s" out="s T" steps="1"/>                                             <!-- z=1: the strip of the stair in the air above its zone -->
<all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>          <!-- air -->
<all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>       <!-- z=32: the slab -->
<all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
<prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>                       <!-- z=64: the ceiling is the roof -->
```
A wall with a walk on top: 24 (`steps="23"`); a tower 40; a keep's wall one more than its platform, so the parapet gets merlons.

## C. The full scale: the doors, the parts, the facades
- **The doors** come from the plan: where the road (or the paving) meets the foot of a wall, the seed `O` through the whole thickness of the
  wall, with wall above it; `part-door` raises it. For a wall of one cell: `<all in="W/q" out="O/*" symmetry="()" steps="1"/><all in="W/O"
  out="O/*" symmetry="()" steps="4"/>`; between two rooms, a seed in the shared wall widened to 11: `<one in="fWWWWWf" out="*OOOOO*"
  symmetry="(x)" steps="1"/><all in="O/W" out="*/O" symmetry="()" steps="5"/><all in="W/O" out="O/*" symmetry="()" steps="5"/>`. The
  actions are yours: `<action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>` and
  `close` back, with hidden letters.
- **The parts of the seed** the request lists are the parts one lives in, already right: include each with `<import file="…"/>` at the point
  where it goes (after the columns have risen), instead of writing it, and give its letters your colours (`<color>`). Each reads a union you
  redefine with your letters (`<union symbol="+" values="…"/>` in your program wins): `+` your walls, `=` your floors and slabs, `%` the
  walls that get slits. The request says what each part reads and writes.
- **Windows** in the band: `<one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU …8 layers…" out="*L/*L/*L/*L/*L/*L …"/></one>`
  then through the wall `<all in="LUUUUB" out="*LLLL*"/>` and the rest of the band back to the wall `<prl in="U" out="W"/>`; the slits come
  from `part-slits` (their colour `name="feritoia…"`).
- **Roofs**: the eaves `<all in="RB" out="*R" steps="1"/>`, then a hip roof with a slope of one in two: `<all in="*****/*****/**B**/*****/*****
  **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>`; a flat top
  with a parapet is a wall one higher than the platform, crowned by `part-battlements`; cones on round towers, pitches on halls, a chimney
  `<one in="B B R" out="* K *" steps="1" symmetry="()"/><all in="B K" out="K *" steps="10"/>`, a pole, balconies, buttresses.
- **A porch, a lean-to**: posts from a plan letter whose block holds a 3 × 3 post in its floor (`ppppp/pbbbp/pbbbp/pbbbp/ppppp`), rising 33;
  a roof at 34 from a marker that rises from its floor (`<all in="B p" out="y *" steps="1"/><all in="B y" out="y B" steps="33"/><prl in="y"
  out="J"/>`): a body must pass under it (30 clear).
- **Cleaning**: every marker of yours becomes what it must be or air; the parts clean their own. A colour per material, 6 or more, the most
  used under half; `name` in the language of the world.

## What the game checks on every seed, at both sizes
A door at least 11 × 30 that the action `open` takes away; **at least 2 covered storeys one reaches on foot** from the front, through the
door, on stairs of `part-stair` (the body is 9 wide, climbs a step of 4, never a stair from the side); a room of at least 28 a side under a
ceiling at least 30 up; the larger size contains more (another kind of part, or a quarter more parts); nothing floating, everything on the
bottom; at least 40 tall; under 85 % of the box full; finished in 8 seconds at every size. Then the Artist looks at the photographs: at least
6 windows on 3 sides, 6 materials, details on all sides, 4 heights of the top. The time: a pattern that starts with `*` or with air over the
whole grid costs a lot; a rare letter in the first cell costs little.

## How to answer, block by block
**Block 1 — the composition.** Begin with a few comment lines: the parts of this concept, their letters, where each goes relative to the
others, what the seeds change, what fits at each size. Then write the root, the first `map` and level A only, no second `map`: the game runs
the plan at the three sizes and shows it back (give every plan letter a `<color>` with a `name`, or it shows as a marker). Read it: is it the
concept? does it vary between the seeds? does it fit the box, with the road to the edge? does the larger size hold more?
**Block 2 — the whole program.** First correct the composition if the plans said so. Then add the second `map` with a block for every plan
letter, level B (the columns, the strip of the stair, the slabs) and level C (the doors, the parts, windows, roofs, cleaning, the colours and
the actions). Answer with the whole program.
**If it does not pass**, the game says which seed and size fell and why, with the views and the trace: correct the program, keep the concept
and the variety, answer with the whole program.

## Principles of the Council (the kernel guarantees them)
Two tables, as in Dungeons & Dragons. The Council is the Dungeon Master: it stands outside the world, creates it and
makes it evolve. Inside the world there are the wanderer and the people: for them the world is real.
- No meta-game in the content (people, things, places, dialogue, texts, plots, facts, legends): never code,
  simulations, programs, computers, games, players, agents, Council, "cracks in reality", measured edges of the
  world, worlds that repeat or restart.
- Not even hints dressed up as legends. The world does not know it is a game, so nobody tells that: whoever walks
  too far always comes back to the square or never gets lost; someone or something (a king under the lake, the
  moon, a god) watches every wanderer; a border (the wood, the valley, the kingdom) cannot be crossed or turns you
  back on your steps; the world ends, repeats, starts over or exists only for whoever looks at it.
- No doubles of the elements of the game. The runes are one thing only, the canon's: no other "glowing symbol",
  "glyph", "letter of light" or "writing that shines" in the ground, and no behaviour of the runes the canon does
  not tell. The same for what already exists (things, people, incantations).
- Concrete trades and roles (baker, guard, shepherd, healer, merchant, brigand, village mage), never keepers of
  reality, censors of identities, archivists of the world, measurers of anomalies.
- Simple, concrete stories made of people: loves, debts, trades, thefts, feasts, rivalries, journeys, beasts,
  rune magic as the canon tells it. Mystery is not a duty.
- The Council makes the game evolve, it does not censor it: what makes sense in the world (a saddled horse, a
  boat, a weapon, a ritual) is made possible with things, actions, effects, states and code, with consistent
  consequences.
- Every world has its own age: machines and trades are things of the world. The forbidden words are not used
  even for something else: the Language block says the world's words for them.

## Language of the world: Italian (it)
Write every text of the world in Italian (names, descriptions, dialogue, stories, memories, signs, labels): these instructions are English, the world is not. Ids stay as the schema gives them, in English (enum values, codes, ids, field names). Examples are only forms. Code is English; what it shows the wanderer is Italian. The forbidden words are not used even for something else: never «computer», «programma», «giocatore», «simulazione»: say «calcolatore», «trasmissione», «calciatore».

## Style guide
# Guida di stile
Stile: voxel medievale accogliente disegnato come un cartone, fasce di luce piatte e contorni scuri, forme semplici e leggibili da lontano, dettaglio moderato
Forme: tozze e semplificate; persone con la testa grande, animali morbidi, case basse con tetti spioventi, alberi tondeggianti
Luce: diurna calda, ombre corte e fredde
Palette: ambiente smorzato e chiaro (verdi caldi, ocra, grigi pietra, blu acqua), pochi accenti saturi sulle cose che contano (rossi mattone, un tetto, un mantello, una lanterna)
Regole:
- ogni cosa poggia a terra ed è tutta d'un pezzo
- un colore pieno per parte: il contorno nasce dove cambia la parte, e le sfumature di un colore sono una parte sola
- parti vicine ben staccate di chiaro e scuro (muro e porta, chioma e tronco, tetto e muro)
- i dettagli sono segni: assi, pannelli e crepe in una lettera scura dedicata, mai micro-voxel sparsi
- le ombre non si dipingono: le fanno le fasce di luce
- niente testo, scritte o simboli
- proporzioni auree (circa 8 a 5) tra le parti dove nient'altro le fissa, e spirali di Fibonacci dove la natura o il mestiere le hanno: foglie attorno a uno stelo, conchiglie, scale a chiocciola, cupole
Protagonista: un viandante con mantello e cappuccio grigio-blu e un bastone
