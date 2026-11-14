# model.sculpt · gemini-4-argon · 63 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · size huge (7.5 × 7.5 × 6 tiles, 20 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 7.5 × 7.5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 200 × 200 × 160, 10 × 10 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Your program so far
<!--
Concept: Fattoria (Country Farmhouse Estate)
Parts & Plan Letters:
- h, w, s: Main two-storey farmhouse interior (h), walls (w), and stair zone (s). Placed around the centre (H) with golden ratio proportions (~8x11 cells).
- d, r: Front doorway (d, 3 cells wide) on the southern facade of the farmhouse, leading straight to the edge via a dirt road (r).
- p: Front timber porch (p, 2 cells deep) along the front wall flanking the entrance.
- a, v: One-storey barn / stable wing (interior a, walls v) attached to either the east or west side of the farmhouse (chosen by seed).
- c, z: Farmyard (c) enclosed by a low dry-stone wall / fence (z) wrapping the house and barn.
- t, g: Stone silo / dovecote tower (interior g, walls t, 5x5 cells) placed on a back corner of the farmyard (chosen by seed), crowned with battlements and slits.
- q: Stone well (q) placed in the open farmyard where a 5x5 space fits.
- y: Haystack (y) placed in the yard or pasture.
- f, u: Ploughed crop fields (f) and orchard trees (u) outside the yard fence.

What the seeds change:
- North-south depth of the main farmhouse.
- Which side (east or west) the barn wing attaches to, and its north-south alignment.
- Which back corner of the yard holds the stone dovecote tower, and whether a second tower rises on the opposite corner.
- Exact placement of the stair along the north or south inner wall, and locations of the well, haystacks, fields, and orchard trees.

What fits at each size:
- Large (20x20 cells / 100x100 voxels): Main farmhouse with front porch, side barn wing, compact yard, and road to the front.
- Huge (30x30 cells / 150x150 voxels): Yard expands around the buildings, bounded by the stone fence (z), with the corner dovecote tower (t/g), well (q), and haystack (y).
- Gargantuan (40x40 cells / 200x200 voxels): Yard expands further; outside the yard fence grow ploughed fields (f), extra haystacks (y), and orchard trees (u).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwspavcztqgyfudrm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse body (h) around H: 3 behind, 4 in front (+1 by seed), 4 to each side (9 wide, 8-9 deep) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="H" out="h"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone (s): 4 long (x) and 2 wide (y), with 2 cells of landing before small-x and floor after -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Way out to the front (south): 3 cells wide door (d) and road (r) to the southern edge -->
      <all in="h/w" out="*/m" symmetry="()" steps="1"/>
      <one in="wmw" out="*d*" symmetry="()" steps="1"/>
      <all in="dm" out="*d" symmetry="(x)" steps="1"/>
      <prl in="m" out="w"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>

      <!-- Front porch (p): 2 cells deep along the front wall beside the door -->
      <all in="w/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>

      <!-- Side barn wing (a, walls v): attaches to east or west wall of the house, 4 out and 5 deep -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Farmyard (c): wraps the house, porch, and barn -->
      <all in="[wvp]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand yard where enough ground remains (at Huge and Gargantuan) -->
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Yard enclosure fence (z) where ground continues beyond the yard -->
      <all in="cEE" out="*z*" steps="1"/>
      <all in="zE/*z" out="*z/**"/>

      <!-- Stone dovecote / silo tower (t walls, g floor, 5x5) on a back corner of the fence (at Huge and Gargantuan) -->
      <one in="EE/Ez" out="**/*g" symmetry="(x)" steps="1"/>
      <prl in="EE/Ez" out="**/*g" p="0.4" steps="1" symmetry="(x)"/>
      <all steps="2">
        <rule in="g[Ezc]" out="*g"/>
        <rule in="g*/*[Ezc]" out="**/*g"/>
      </all>
      <all in="g[Ezc]" out="*t"/>
      <all in="t[Ezc]/*t" out="*t/**"/>

      <!-- Well (q) in a 5x5 clear patch of the yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Haystack (y) in a 4x4 patch of the yard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*yy*/*yy*/****" steps="1"/>

      <!-- Outer estate features at Gargantuan (where 6+ cells of E remain outside the fence) -->
      <!-- Ploughed crop fields (f) -->
      <one in="zEEEEEE/zEEEEEE/zEEEEEE/zEEEEEE/zEEEEEE" out="*fffff*/*fffff*/*fffff*/*fffff*/*fffff*" steps="2"/>
      <!-- Second haystack in pasture -->
      <one in="EEEE/EEEE/EEEE/EEEE" out="****/*yy*/*yy*/****" steps="1"/>
      <!-- Orchard trees (u) in open pasture -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**u**/*****/*****" steps="4"/>
    </sequence>
  </map>
  <color symbol="E" value="#7a9a55" name="erba" hidden="True"/>
  <color symbol="H" value="#ffffff" name="centro"/>
  <color symbol="h" value="#c8a878" name="casa" area="house"/>
  <color symbol="w" value="#e0d4b8" name="muro di casa" area="house"/>
  <color symbol="s" value="#a88458" name="scala" area="house"/>
  <color symbol="d" value="#6b4428" name="porta" area="house"/>
  <color symbol="r" value="#b89868" name="sentiero" area="yard"/>
  <color symbol="p" value="#b08858" name="portico" area="porch"/>
  <color symbol="a" value="#b89060" name="fienile" area="barn"/>
  <color symbol="v" value="#9a4838" name="muro del fienile" area="barn"/>
  <color symbol="c" value="#c8b890" name="aia" area="courtyard"/>
  <color symbol="z" value="#88847c" name="muretto" area="courtyard"/>
  <color symbol="t" value="#78746c" name="torre colombaia" area="tower"/>
  <color symbol="g" value="#98948c" name="interno torre" area="tower"/>
  <color symbol="q" value="#587898" name="pozzo" area="courtyard"/>
  <color symbol="y" value="#e0b848" name="pagliaio" area="yard"/>
  <color symbol="f" value="#6b5038" name="campo arato" area="field"/>
  <color symbol="u" value="#487838" name="albero da frutto" area="orchard"/>
  <color symbol="m" value="#ff00ff" name="segno"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h casa, w muro di casa, s scala, p portico, a fienile, v muro del fienile, c aia, z muretto, t torre colombaia, q pozzo, g interno torre, y pagliaio
Plan (the letter of every cell):
```
tttttttEEEEEEEEEEEEEEEEEEEEEEE
tgggggtEEEEEEEEEEEEEEEEEEEEEEE
tgggggtEEEEEEEEEEEEEEEEEEEEyyE
tgggggtzzzzzzzzzzzzzzzzzzzEyyE
tgggggtcccccccccccccccccczEEEE
tgggggtcccccccccccccccccczEEEE
tttttttcccccccccccqcccccczEEEE
EEEzccccccccccccccccccccczEEEE
EEEzccccccccccccccccccccczEEEE
EEEzccyyccccccccccccccccczEEEE
EEEzccyyccccccccccccccccczEEEE
EEEzccccccwwwwwwwwwwwcccczEEEE
EEEzccccccwhhsssshhhwcccczEEEE
EEEzcvvvvvwhhsssshhhwcccczEEEE
EEEzcvaaaawhhhhhhhhhwcccczEEEE
EEEzcvaaaawhhhhhhhhhwcccczEEEE
EEEzcvaaaawhhhhhhhhhwcccczEEEE
EEEzcvaaaawhhhhhhhhhwcccczEEEE
EEEzcvaaaawhhhhhhhhhwcccczEEEE
EEEzcvvvvvwhhhhhhhhhwcccczEEEE
EEEzccccccwwwwwwwwwwwcccczEEEE
EEEzccccccpppppppppppcccczEEEE
EEEzccccccpppppppppppcccczEEEE
EEEzccccccccccccccccccccczEEEE
EEEzccccccccccccccccccccczEEEE
EEEzccccccccccccccccccccczEEEE
EEEzccccccccccccccccccccczEEEE
EEEzzzzzzzzzzzzzzzzzzzzzzzEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h casa, w muro di casa, s scala, p portico, a fienile, v muro del fienile, c aia, z muretto, t torre colombaia, q pozzo, g interno torre, y pagliaio
Plan (the letter of every cell):
```
tttttttEEEEEEEEEEEEEEEtttttttE
tgggggtEEEEEEEEEEEEEEEtgggggtE
tgggggtEEEEEEEEEEEEEEEtgggggtE
tgggggtzzzzzzzzzzzzzzztgggggtE
tgggggtccccccccccccccctgggggtE
tgggggtccccccccccccccctgggggtE
tttttttcccyycccccccccctttttttE
EEEzccccccyyccccccccccccczEEEE
EEEzcccccccccccqccccccccczEEEE
EEEzccccccccccccccccccccczEEEE
EEEzccccccccccccccccccccczEEEE
EEEzccccccwwwwwwwwwwwcccczEEEE
EEEzcvvvvvwhhsssshhhwcccczEEEE
EEEzcvaaaawhhsssshhhwcccczEEEE
EEEzcvaaaawhhhhhhhhhwcccczEEEE
EEEzcvaaaawhhhhhhhhhwcccczEEEE
EEEzcvaaaawhhhhhhhhhwcccczEEEE
EEEzcvaaaawhhhhhhhhhwcccczEEEE
EEEzcvvvvvwhhhhhhhhhwcccczEEEE
EEEzccccccwhhhhhhhhhwcccczEEEE
EEEzccccccwwwwwwwwwwwcccczEEEE
EEEzccccccpppppppppppcccczEEEE
EEEzccccccpppppppppppcccczEEEE
EEEzccccccccccccccccccccczEEEE
EEEzccccccccccccccccccccczEyyE
EEEzccccccccccccccccccccczEyyE
EEEzccccccccccccccccccccczEEEE
EEEzzzzzzzzzzzzzzzzzzzzzzzEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h casa, w muro di casa, s scala, p portico, a fienile, v muro del fienile, c aia, z muretto, t torre colombaia, q pozzo, g interno torre, y pagliaio
Plan (the letter of every cell):
```
tttttttEEEEEEEEEEEEEEEEEEEEEEE
tgggggtEEEEEEEEEEEEEEEEEEEEEEE
tgggggtEEEEEEEEEEEEEEEEEEEEyyE
tgggggtzzzzzzzzzzzzzzzzzzzEyyE
tgggggtcccccccccccccccccczEEEE
tgggggtcccccccccccccccccczEEEE
tttttttcccccccccccccccccczEEEE
EEEzcccccccccccccqccccccczEEEE
EEEzcccccccccccccccccyycczEEEE
EEEzcccccccccccccccccyycczEEEE
EEEzccccccccccccccccccccczEEEE
EEEzccccccwwwwwwwwwwwcccczEEEE
EEEzccccccwhhsssshhhwcccczEEEE
EEEzccccccwhhsssshhhwcccczEEEE
EEEzccccccwhhhhhhhhhwcccczEEEE
EEEzcvvvvvwhhhhhhhhhwcccczEEEE
EEEzcvaaaawhhhhhhhhhwcccczEEEE
EEEzcvaaaawhhhhhhhhhwcccczEEEE
EEEzcvaaaawhhhhhhhhhwcccczEEEE
EEEzcvaaaawhhhhhhhhhwcccczEEEE
EEEzcvaaaawwwwwwwwwwwcccczEEEE
EEEzcvvvvvpppppppppppcccczEEEE
EEEzccccccpppppppppppcccczEEEE
EEEzccccccccccccccccccccczEEEE
EEEzccccccccccccccccccccczEEEE
EEEzccccccccccccccccccccczEEEE
EEEzccccccccccccccccccccczEEEE
EEEzzzzzzzzzzzzzzzzzzzzzzzEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h casa, w muro di casa, s scala, p portico, a fienile, v muro del fienile, c aia, z muretto, t torre colombaia, q pozzo, g interno torre, y pagliaio, f campo arato, u albero da frutto
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEuEEEEEEEEEEEEEEEEEEEEEEEyyEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEfffffEEyyEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEfffffEEEEEEEEEEEEE
EEtttttttEEEEEEEEEEEEEfffffEEEtttttttEEE
EEtgggggtEEEEEEEEEEEEEfffffEEEtgggggtEEE
EEtgggggtEEEEEEEEEEEEEfffffEEEtgggggtEEE
EEtgggggtzzzzzzzzzzzzzzzzzzzzztgggggtEEE
EEtgggggtccccccccccccccccccccctgggggtEEE
EEtgggggtccccccccccccccccccccctgggggtEEE
EEtttttttccccccccccccccccccccctttttttEEE
EEEEEzccccyyccccccccccccccccccccczEEEEEE
EEEEEzccccyyccccccccccccccccccccczEEEEEE
EEuEEzccccccccccccccccccccccccccczEEEuEE
EEEEEzccccccccccccccccccccccccccczEEEEEE
EEEEEzcccccccccwwwwwwwwwwwccccccczEEEEEE
EEEEEzcccccccccwhhsssshhhwccccccczEEEEEE
EEEEEzccccvvvvvwhhsssshhhwccccccczEEEEEE
EEEEEzccccvaaaawhhhhhhhhhwccqcccczEEEEEE
EEEEEzccccvaaaawhhhhhhhhhwccccccczEEEEEE
EEEEEzccccvaaaawhhhhhhhhhwccccccczEEEEEE
EEEEEzccccvaaaawhhhhhhhhhwccccccczEEEEEE
EEEEEzccccvaaaawhhhhhhhhhwccccccczEEEEEE
EEEEEzccccvvvvvwhhhhhhhhhwccccccczEEEEEE
EEEEEzcccccccccwwwwwwwwwwwccccccczEEEEEE
EEEEEzcccccccccpppppppppppccccccczEEEEEE
EEEEEzcccccccccpppppppppppccccccczfffffE
EEEEEzccccccccccccccccccccccccccczfffffE
EEEEEzccccccccccccccccccccccccccczfffffE
EEEEEzccccccccccccccccccccccccccczfffffE
EEEEEzccccccccccccccccccccccccccczfffffE
EEEEEzccccccccccccccccccccccccccczEEEEEE
EEEEEzccccccccccccccccccccccccccczEEEEEE
EEEEEzccccccccccccccccccccccccccczEEEEEE
EEuEEzzzzzzzzzzzzzzzzzzzzzzzzzzzzzEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.12 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
Concept: Fattoria (Country Farmhouse Estate)
Parts & Plan Letters:
- h, w, s: Main two-storey farmhouse interior (h), walls (w), and stair zone (s). Placed around the centre (H) with golden ratio proportions.
- d, r: Front doorway (d, 3 cells wide) on the southern facade of the farmhouse, leading straight to the southern edge via a paved road (r).
- p: Front timber porch (p, 2 cells deep) along the front wall flanking the entrance.
- a, v: One-storey barn / stable wing (interior a, walls v) attached to either the east or west side of the farmhouse (chosen by seed).
- i, u: Second storage shed / lean-to wing (interior i, walls u) attached to the opposite or rear wall by seed.
- c, z: Farmyard (c) enclosed by a low dry-stone wall / fence (z) wrapping the house and barn.
- t, g: Stone silo / dovecote tower (interior g, walls t, 5x5 cells) placed on a corner of the farmyard (chosen by seed), crowned with battlements and slits.
- q: Stone well (q) placed in the open farmyard where a 5x5 space fits.
- y: Haystack (y) placed in the yard.
- f, e: Ploughed crop fields (f) and orchard trees (e) attached to the yard fence at Gargantuan size.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwspaviuccztqgyfedrm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse body (h) around H: 3 behind, 4 in front (+1 by seed), 4 to each side -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Way out to the front (south): from H straight down to the front wall (d, 3 wide) -->
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Stair zone (s): 4 long (x) and 2 wide (y), with 2 cells of landing before small-x and floor after -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Front porch (p): 2 cells deep along the front wall beside the door -->
      <all in="w/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>

      <!-- Side barn wing (a, walls v): attaches to east or west wall of the house, 4-5 out and 5 deep -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <prl in="aE" out="*a" p="0.5" steps="1" symmetry="(x)"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Second shed wing (i, walls u) on the opposite side or back, for seed variety -->
      <one in="Ew/Ew/Ew/Ew" out="**/*i/*i/**" symmetry="(xy)" steps="1"/>
      <all in="iE" out="*i" symmetry="(xy)" steps="2"/>
      <all in="iE/*i" out="*i/**"/>
      <all in="iE" out="*u"/>
      <all in="uE/*u" out="*u/**"/>

      <!-- Farmyard (c): wraps the house, porch, barn, and shed -->
      <all in="[wvpdu]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand yard where enough ground remains (at Huge and Gargantuan) -->
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Yard enclosure fence (z) where ground continues beyond the yard -->
      <all in="cEE" out="*z*" steps="1"/>
      <all in="zE/*z" out="*z/**"/>

      <!-- Stone dovecote / silo tower (t walls, g floor, 5x5) on a corner of the fence -->
      <one in="EE/Ez" out="**/*g" symmetry="(xy)" steps="1"/>
      <one in="EE/Ez" out="**/*g" symmetry="(x)" steps="1"/>
      <all steps="2">
        <rule in="g[Ezc]" out="*g"/>
        <rule in="g*/*[Ezc]" out="**/*g"/>
      </all>
      <all in="g[Ezc]" out="*t"/>
      <all in="t[Ezc]/*t" out="*t/**"/>

      <!-- Carve the front road (r, 3 wide) straight from the door (d) to the southern edge -->
      <all in="[dr]/[cpzE]" out="*/r" symmetry="()"/>
      <all in="r[cpzE]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Well (q) in a 5x5 clear patch of the yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Haystacks (y) in 4x4 patches of the yard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*yy*/*yy*/****" steps="2"/>

      <!-- Outer estate features at Gargantuan (attached to the fence z where 6+ cells of E remain) -->
      <one in="zEEEEEE/zEEEEEE/zEEEEEE/zEEEEEE/zEEEEEE" out="*fffff*/*fffff*/*fffff*/*fffff*/*fffff*" steps="3"/>
      <one in="zEEEE/zEEEE/zEEEE/zEEEE" out="*eee*/*eee*/*eee*/*eee*" steps="2"/>
    </sequence>

    <map scale="5 5 1" values="BEhwsdpaviuccztqgyferWFfPRTklLJnKQbDAXoONMU#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="q" out="qqqqq/qQQQq/qQAQq/qQQQq/qqqqq"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="f" out="fffff/DDDDD/fffff/DDDDD/fffff"/>
      <rule in="e" out="ccccc/ccccc/ccXcc/ccccc/ccccc"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>

      <sequence symmetry="(xy)">
        <!-- Unions for the imported parts -->
        <union symbol="+" values="WVut"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="t"/>

        <!-- B. THE HEIGHTS: columns by steps -->
        <!-- Main farmhouse walls (w, d): 2 storeys = 64 high, with window bands (l) on both storeys -->
        <all steps="8"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w l"/><rule in="B d" out="d W"/></all>
        <all steps="10"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="8"><rule in="B w" out="w W"/><rule in="B d" out="d l"/></all>
        <all steps="14"><rule in="B w" out="w l"/><rule in="B d" out="d l"/></all>
        <all steps="10"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <prl><rule in="w" out="R"/><rule in="d" out="R"/></prl>

        <!-- Main farmhouse interior (h) and stair zone (s): floor at z=0, slab at z=32, ceiling/roof at z=64 -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Side barn wing (a interior, v walls): 1 storey = 32 high + roof J -->
        <all in="B v" out="v V" steps="8"/>
        <all in="B v" out="v l" steps="12"/>
        <all in="B v" out="v V" steps="12"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="J"/>

        <!-- Second shed wing (i interior, u walls): 1 storey = 32 high + roof J -->
        <all in="B u" out="u V" steps="8"/>
        <all in="B u" out="u l" steps="12"/>
        <all in="B u" out="u V" steps="12"/>
        <prl in="u" out="J"/>
        <all in="B i" out="i f" steps="1"/>
        <all in="B i" out="i B" steps="31"/>
        <prl in="i" out="J"/>

        <!-- Front porch (p floor, b posts): clear height 32, roof J at z=33 -->
        <all in="B b" out="b P" steps="32"/>
        <prl in="b" out="J"/>
        <all in="B p" out="n p" steps="1"/>
        <all in="B n" out="n B" steps="31"/>
        <prl in="n" out="J"/>

        <!-- Stone dovecote tower (t walls 46 high, g interior platform at 45 so part-battlements crowns t) -->
        <all in="B t" out="t *" steps="45"/>
        <all in="B g" out="g f" steps="1"/>
        <all in="B g" out="g B" steps="43"/>
        <prl in="g" out="F"/>

        <!-- Yard low stone fence (z): 8 high -->
        <all in="B z" out="z *" steps="7"/>

        <!-- Well (Q stone rim 8 high, A water) -->
        <all in="B Q" out="Q *" steps="7"/>

        <!-- Haystacks (y): 12 high with rounded top -->
        <all in="B y" out="y *" steps="10"/>
        <all in="By" out="B*" steps="1"/>
        <all in="B y" out="y *" steps="4"/>

        <!-- Orchard trees (X trunk 12 high, e foliage canopy) -->
        <all in="B X" out="X P" steps="12"/>
        <all in="B X" out="X e" steps="6"/>
        <all in="eB" out="*e" steps="3"/>

        <!-- C. THE FULL SCALE: doors, parts, windows, roofs, cleaning -->
        <!-- Front main door seed (O): where road (r) meets the foot of the front wall (W) -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Internal doors (O) from main house floor (f) into barn (v/V) and shed (u/V) -->
        <one in="fVVVVVf" out="*OOOOO*" symmetry="(xy)" steps="2"/>
        <all in="O/V" out="*/O" symmetry="(xy)" steps="1"/>
        <all in="V/O" out="O/*" symmetry="(xy)" steps="5"/>

        <!-- Door into the dovecote tower from the yard -->
        <one in="ctttttc" out="*OOOOO*" symmetry="(xy)" steps="1"/>
        <all in="O/t" out="*/O" symmetry="(xy)" steps="4"/>

        <!-- Included parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows (L) in the window bands (l) on all sides -->
        <one steps="20">
          <rule in="Bl/Bl/Bl/Bl/Bl/Bl Bl/Bl/Bl/Bl/Bl/Bl Bl/Bl/Bl/Bl/Bl/Bl Bl/Bl/Bl/Bl/Bl/Bl Bl/Bl/Bl/Bl/Bl/Bl Bl/Bl/Bl/Bl/Bl/Bl Bl/Bl/Bl/Bl/Bl/Bl Bl/Bl/Bl/Bl/Bl/Bl" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="Ll" out="*L"/>
        <prl><rule in="l" out="W"/></prl>

        <!-- Pitched hip roof on main farmhouse (R) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>

        <!-- Pitched hip roof on barn, shed, and porch (J) -->
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="6" symmetry="()"/>

        <!-- Brick chimney (K) rising from the farmhouse roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="K B/B R" out="K K/* *" steps="1"/>
        <all in="B K" out="K *" steps="12"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval countryside cartoon style -->
  <color symbol="E" value="#7a9a55" name="erba" hidden="True"/>
  <color symbol="W" value="#e6dac0" name="intonaco chiaro" area="house"/>
  <color symbol="V" value="#b8523e" name="tavole del fienile" area="barn"/>
  <color symbol="f" value="#b88c5a" name="pavimento in legno" area="house"/>
  <color symbol="F" value="#9e7346" name="solaio in legno" area="house"/>
  <color symbol="P" value="#6e4b2c" name="trave di quercia" area="porch"/>
  <color symbol="R" value="#b84a32" name="coppi rossi" area="house"/>
  <color symbol="J" value="#9c422e" name="tetto del portico" area="porch"/>
  <color symbol="K" value="#8c3b2b" name="comignolo in mattoni" area="house"/>
  <color symbol="k" value="#8a623a" name="gradini in legno" area="house"/>
  <color symbol="T" value="#8a623a" name="scala" area="house"/>
  <color symbol="L" value="#5a829e" name="finestra" area="house"/>
  <color symbol="O" value="#6b4428" name="porta in legno" area="house"/>
  <color symbol="o" value="#472b16" name="assi della porta" area="house"/>
  <color symbol="N" value="#8c8478" name="stipite in pietra" area="house"/>
  <color symbol="t" value="#8c867a" name="pietra della torre" area="tower"/>
  <color symbol="M" value="#8c867a" name="merlo in pietra" area="tower"/>
  <color symbol="U" value="#2b2824" name="feritoia" area="tower"/>
  <color symbol="z" value="#787268" name="muretto a secco" area="courtyard"/>
  <color symbol="c" value="#cbb994" name="terra battuta" area="courtyard"/>
  <color symbol="q" value="#cbb994" name="base del pozzo" area="courtyard"/>
  <color symbol="Q" value="#787268" name="vera del pozzo" area="courtyard"/>
  <color symbol="A" value="#427898" name="acqua del pozzo" area="courtyard"/>
  <color symbol="p" value="#b89868" name="pavimento del portico" area="porch"/>
  <color symbol="r" value="#a88c64" name="sentiero" area="yard"/>
  <color symbol="y" value="#dfb848" name="pagliaio" area="yard"/>
  <color symbol="D" value="#6b4e35" name="terra arata" area="field"/>
  <color symbol="e" value="#4a7c3a" name="chioma dell'albero" area="orchard"/>
  <color symbol="X" value="#6e4b2c" name="tronco" area="orchard"/>
  <color symbol="#20" value="#000000" hidden="True"/>
  <color symbol="#21" value="#000000" hidden="True"/>

  <!-- Actions -->
  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>
```
