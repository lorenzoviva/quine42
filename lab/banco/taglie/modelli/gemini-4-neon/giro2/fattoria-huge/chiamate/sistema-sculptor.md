Write a MarkovJunior XML program that **grows** the building asked for, a voxel model that one enters, climbs and jumps in. You write it
**in blocks**: first the composition, then the whole program; after each block the game runs what you wrote and sends back, in text, what
came out (the plans of three seeds, then heights, front, side, cuts, the measures with their meaning, a trace node by node): that is how
you look at your model. Answer each time with the whole program so far, XML only, without explanations. There is no stock
building to start from: the composition is yours, from the concept.

## What matters most: the composition comes from the concept
The same program runs with at least 4 seeds and 2 sizes. A seed must give another building **of the same kind**: a temple is terraces that
shrink toward a shrine on top with a stair on the axis; a block of flats is a tall box of regular storeys with a stair core and balconies; a country house is two or three volumes of different height
under pitched roofs, with a porch. Decide the **parts of this concept** and **where each goes relative to the others**, and let the seeds
deform them (the sides, the wing and its side, how many towers, how high, where the trees go). Two concepts must not have the same masses.
Where the concept leaves a ratio free, lean on the golden one (about 8 to 5): the main volume against the wing, the yard against the keep,
the walls against the roof; a winding stair or the rings of a dome may step as 1, 2, 3, 5, 8; never shrink a door, a storey or a room for a ratio.

## The measure of «done well»: the reference fort
Every structure is held against a fort drawn by hand (500 × 500 voxels, as your Gargantuan), for its **richness, never its form**: a courtyard that is a **union of rectangles**, not one box, grown
from the centre with arms that stop at random; a curtain wall that follows it, thick, with a **corridor inside** and a **walk on top** reached
by stairs from the courtyard; **hollow towers on every convex corner** and along the long sides,
two storeys each with a door onto the walk; a **gatehouse** taller than the wall, a tower at each side; the **keep as far from the gate as
the courtyard allows**, a hall and two or three storeys joined by stairs, a terrace on top; barracks against the inside of
the wall; a paved road from the gate to the keep; every seed another fort. Aim at the same: several storeys and ways in
height reached on foot, outlines that bend, nothing that is only a box. A farm, a temple, a station have
other parts: take the standard, not the fort. **Merlons and arrow slits only on a fortification**; elsewhere a flat top
ends in a cornice, a parapet, a railing, a dome.

## The method: three levels, one program
```xml
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHE…every letter of the plan…" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- A. the composition, on the plan (z=0) of a grid five times smaller: a cell is 5 voxels, a third of a tile -->
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
first `map` brings them down (`in="E" out="E"`, `in="H" out="H"`). The plan is **a fifth of the
box: 20 × 20 cells at Large, 30 × 30 at Huge, 100 × 100 at Gargantuan**: write rules that do not depend on it, anchored to H, to
what is there, to the edge. The second `map` comes back to the box (5 × 5 × 1 for every cell: a plan letter without a rule leaves air), so the
same program serves every size. **One letter, one meaning**: a letter that is a wall must never also be a step or a marker. The plan letters
of the first grid and the letters of the full grid are two alphabets: list every letter you use in the `values` of its grid, the included
parts' letters too (T k #90 #91 #92; O o N; M; U; D V). **Never use S nor #90-#97 for your own letters**: they belong to the parts.

## A. The composition (the plan, a cell a third of a tile)
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
  is also a door, under a gatehouse of its own letter, taller than the wall.
- **The stair** (`part-stair`) climbs toward large x and a body walks onto its first step **in line**: its zone has two cells of free floor
  before it (the landing) and floor after it, where it comes out one storey up.
- **A room** is at least 28 voxels clear from wall to wall at every size, counting where a body stands.
- **An inner wall**: a row of its letter from wall to wall (`<all in="[Hj]h" out="*j" symmetry="(x)"/>`, then `[hj]E`), a storey high.

## Loops: grow until a mark stops it
`<markov>` repeats: at each step the first child that finds something does one step, and when the LAST one works they all start again
(their steps counted anew); it ends when no child finds anything. So `<markov><sequence>…</sequence></markov>` is a loop whose body starts
from its first child at every step: the exit first, the mark spreading next, the growth last. A keep that grows a ring a turn until a rare
mark stops it, its size the seed's and the room's, never a number of steps (`p` is per cell: the larger the keep, the sooner it stops):
```xml
<markov><sequence>
  <prl p="0.0015" in="i" out="z"/>      <!-- the exit: now and then a cell of the keep becomes the mark z -->
  <prl in="iz" out="zz"/>               <!-- the mark covers the keep; meanwhile nothing grows -->
  <all steps="1"><rule in="[Hi]u" out="*i"/><rule in="[Hi]*/*u" out="**/*i"/><rule in="Ei" out="Ez"/></all>   <!-- else a ring in its room u; at its edge, the mark -->
</sequence></markov>
<prl in="z" out="i"/><prl in="u" out="E"/>
```
The room first: `<prl in="***/*E*/***" out="***/*u*/***"/><prl in="Eu" out="*E" steps="6"/>` (the lot less what the yard and the walls
need). A `<sequence>` that is not the last child runs through across the steps: storeys at a coin are `<markov><sequence>…a storey, its
mark M turned into N…</sequence><prl p="0.5" in="N" out="M"/><all in="N" out="M" steps="1"/></markov>`; heads, N goes back and nothing
else works, the loop ends; tails, the last child does it and all start again, one storey more. The storeys the checks want go before it.

## Textures: `<convchain>` on the plan
`<convchain on="c" black="c" white="l" n="3" steps="8"><sample>cccllll/cccllll/ccclllc/llccccc/llcccll/lllccll/cllllcc</sample></convchain>`:
the `on` cells become `black` and `white` with the texture of the sample, written in the node in those letters (rows apart by "/", its
patches as large as yours): flagstones in the grass of a yard, furrows in a field, a rough edge. A layer at a time; in the world on at most
65 536 cells of the layers it works (the plan, a floor at Large and Huge, Gargantuan's full scale only in pieces), `steps` written (at most
50), `n` 2 or 3. A `<wfc>` makes a grid of its own tiles from a tileset of models/ and decides its box: not for a structure.

## What fits: the size decides what is built, not how big
A tile is always 16 voxels: a larger size is a larger area at the same scale, and holds **more**, never the same building bigger. Decide first what fits at each size: a fort is a keep inside a thin ring at Large, a yard with
a well at Huge, the full fort with a moat at Gargantuan; a country house is the house and its porch at Large, then the hedge and the trees, then an
orchard and a well. **A dwelling** (the request says it) takes most of the area: its body 6 cells behind H, 6 in front, 7 to each side (not
3 and 5), two rooms below; porch and garden take the rest. Then write it with rules that choose from the area, not from numbers:
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
letter of the palette carries `area="pasture"` (a plain lowercase name: `yard`, `barn`, `field`, `courtyard`, `keep`, `tower`, `garden`…), a hidden
letter too (`<color symbol="c" hidden="True" area="courtyard"/>`): keep those letters on the bottom
layer at the end, under the floors and on the ground, instead of rewriting them to the empty cell, and the world knows the area of every tile.
The soil `E` stays as it is, hidden.

## B. The heights: columns by steps
After the second `map` every plan letter is a block of 5 × 5 on the bottom layer. A letter rises by moving its head up and leaving a letter at
each step: `in="B h" out="h f"` makes the head h go up one layer and leave f below; `in="B w" out="w *"` grows a solid column of w. **The
heights are numbers of steps**: a storey is 32 (a floor, 31 of air, the slab); a person is 24 tall, a door 30: a quarter taller than a person. The floors of a room with two storeys
(f the planks, F the slab, R the roof letter), beside the walls that rise 64 and take the roof letter on top:
```xml
<all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>   <!-- plaster, a band for the windows, plaster: once per storey -->
<prl in="w" out="R"/>
<all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>   <!-- z=0: the floor -->
<all in="B s" out="s T" steps="1"/>                                             <!-- z=1: the strip of the stair in the air above its zone -->
<all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>          <!-- air -->
<all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>       <!-- z=32: the slab -->
<all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
<prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>                       <!-- z=64: the ceiling is the roof -->
```
A wall with a walk on top: 24 (`steps="23"`); a tower 40; a parapet one more than its platform.

## C. The full scale: the doors, the parts, the facades
- **The doors** come from the plan: where the road (or the paving) meets the foot of a wall, the seed `O` through the whole thickness of the
  wall, with wall above it; `part-door` raises it. For a wall of one cell: `<all in="W/q" out="O/*" symmetry="()" steps="1"/><all in="W/O"
  out="O/*" symmetry="()" steps="4"/>`; between two rooms, a seed in the shared wall widened to 11: `<one in="fWWWWWf" out="*OOOOO*"
  symmetry="(x)" steps="1"/><all in="O/W" out="*/O" symmetry="()" steps="5"/><all in="W/O" out="O/*" symmetry="()" steps="5"/>`; turned
  (`f/W/W/W/W/W/f`) in a wall along x. The
  actions are yours: `<action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>` and
  `close` back, with hidden letters.
- **The parts of the seed** the request lists are the parts one lives in and the windows, already right: include each with `<import
  file="…"/>` at the point where it goes (after the columns have risen), instead of writing it, and give its letters your colours
  (`<color>`), never using them for anything else. Each reads a union you redefine with your letters (`<union symbol="+" values="…"/>` in
  your program wins): `+` your walls, `=` your floors and slabs, `%` a fort's walls with slits. The request says what each part reads and writes.
- **Windows** in the band: `part-window` sets them in rows, centred on every face, framed and glazed, never here and there; then the
  rest of the band back to the wall, `<prl in="U" out="W"/>`.
- **Roofs**: the eaves `<all in="RB" out="*R" steps="1"/>`, then a hip roof with a slope of one in two: `<all in="*****/*****/**B**/*****/*****
  **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>`; a flat top
  ends in a parapet, a fort's in `part-battlements` and `part-slits`; cones on round towers, pitches on halls, a chimney
  `<one in="B B R" out="* K *" steps="1" symmetry="()"/><all in="B K" out="K *" steps="10"/>`, a pole, balconies, buttresses.
- **A porch, a lean-to**: posts from a plan letter whose block holds a 3 × 3 post in its floor (`ppppp/pbbbp/pbbbp/pbbbp/ppppp`), rising 33;
  a roof at 34 from a marker that rises from its floor (`<all in="B p" out="y *" steps="1"/><all in="B y" out="y B" steps="33"/><prl in="y"
  out="J"/>`): a body must pass under it (30 clear).
- **Cleaning**: every marker of yours becomes what it must be or air; the parts clean their own. A colour per material, 6 or more, the most
  used under half; `name` in the language of the world.

## Under the ground: a cellar
Only when the request asks for one (it says how deep the box goes under the soil). Before a room on the soil rises (one the door reaches,
away from the door and from the stair's foot), mark D on the layer under its floor, `<all in="h B" out="* D"/>`; include
`<import file="part-cellar"/>` after the floors have risen and before part-stair; give D, V and k your colours. It must hold: something
under the ground, every floor there reached, a body walking down from the door; else the building comes in without it.

## A Gargantuan's full scale in pieces
At Gargantuan (500 × 500) level C may run in pieces, in the world each in its own time (in the checks within the 8 seconds, like the rest):
`<pieces piece="125" margin="24">…nodes…</pieces>` in the second map, around level C. A piece is a column of 125 × 125 voxels; its nodes run
on it and on `margin` voxels around it, as the grid was when the node began, and only its own cells stay. So a rule that gives the same in
any order and reaches no farther than the margin gives the whole grid, voxel by voxel: part-stair reaches some 16 (with 24 the doors and the
stairs come out as on the whole grid, with 12 a stair breaks at a border); a larger margin is only more work. `piece` a multiple of 5, the
plan's cell, so that what is stamped in a cell is never cut. A `one` picks in each piece, so what is one for the whole building (a pole, a
chimney, the stair of part-cellar) goes outside, as does what looks along a whole wall (part-battlements counts from the corners). Inside:
rule nodes, `path`, `convolution`, `convchain`, `sequence`, `markov`, part-door, part-stair; never `map`, `wfc`, shapes, `observe`,
`search`, another `pieces`.

## What the game checks on every seed, at both sizes
The door the action `open` takes away and the parts at the request's measures; **at least 2 covered storeys one reaches on foot** from the
front, through the door, on stairs of `part-stair` (the body is 9 wide, never a stair from the side); a dwelling's floor; the larger size contains more; nothing floating, everything on the
bottom; under 85 % of the box full; finished in 8 seconds at every size. Then the Artist looks at the photographs: at least
6 windows on 3 sides, 6 materials, details on all sides, 4 heights of the top. The time: a pattern that starts with `*` or with air
costs a lot, a rare letter in the first cell little.

## How to answer, block by block
**Block 1 — the composition**: the root, the first `map` and level A only, no second `map`, a few comment lines first (the parts of this
concept, their letters, where each goes, what the seeds change, what fits at each size); every plan letter with a `<color>` and a `name`. The game runs the plan at the three sizes and
shows it back: read it (the concept? varies between the seeds? fits the box, with the road to the edge? the larger size holds more?).
**Block 2 — the whole program**: correct the composition if the plans said so, then the second `map` with a block for every plan letter,
level B and level C; answer with the whole program.
**If it does not pass**, the game says which seed and size fell and why, with the views and the trace: correct it, keep the concept and the
variety, answer with the whole program.

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
