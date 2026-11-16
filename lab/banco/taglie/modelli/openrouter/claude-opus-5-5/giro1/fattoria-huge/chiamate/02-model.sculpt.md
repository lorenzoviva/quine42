# model.sculpt · claude-opus-5-5 · 82 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · size huge (7.5 × 7.5 × 6 tiles, 20 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 7.5 × 7.5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 500 × 500 × 160, 25 × 25 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Your program so far
<!--
  FATTORIA (casa colonica con fienile)
  Parts and letters (plan): h the rooms of the house, w its walls; a the barn (the lean-to wing), v its walls;
  s the zone of the stair inside the house, against the back wall; d the door in the front wall;
  P the porch in front of the door; c the farmyard around the buildings; n the paved way across the yard;
  x the fence around the yard, G the gate in the fence, r the cart road to the edge;
  Q the well in the yard; t the trees on the free ground; u the fields beyond the fence.
  Relations: the house stands on H and its door faces the front (+y); the barn is against a side wall of the house;
  the stair zone is along the back wall; the porch is between the door and the yard; the yard rings both buildings;
  the fence rings the yard; the road goes straight from the door to the edge through the gate; the well is in a free
  square of yard; trees and fields only where the ground goes on beyond the fence.
  Seeds change: the length of the house, the side and position of the barn, where the well falls, trees and fields.
  Sizes: Large holds house, barn, porch and a thin yard; Huge adds the fence, the well and a few trees;
  Gargantuan adds a wider yard, fields and many trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavsdPcnxGrQtum" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the house -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the barn against a side wall -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <!-- the stair zone along the back wall -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- the farmyard, grown where the ground allows -->
      <all in="[wv]E" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- the fence, only where ground goes on past the yard -->
      <all in="cEE" out="*x*" steps="1"/><all in="xE/*x" out="*x/**"/>
      <!-- the way out: through the house, the door, the porch, the yard, the gate, the road -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/c" out="*/P" symmetry="()" steps="1"/><all in="P/c" out="*/P" symmetry="()" steps="1"/>
      <all in="[Pn]/c" out="*/n" symmetry="()"/>
      <all in="[nP]/x" out="*/G" symmetry="()"/><all in="[nGPr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="Pc" out="*P" symmetry="(x)" steps="2"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="Gx" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- the well in a free square of yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- fields beyond the fence (only on wide ground) -->
      <one in="EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE" out="*********/*********/*********/*********/****u****/*********/*********/*********/*********" steps="6"/>
      <all steps="3"><rule in="uE" out="*u"/><rule in="u*/*E" out="**/*u"/></all>
      <!-- trees on free ground -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="h" value="c8a878" name="stanze della casa"/>
  <color symbol="w" value="e8dcc0" name="muri della casa"/>
  <color symbol="a" value="a08050" name="fienile"/>
  <color symbol="v" value="8a4a30" name="muri del fienile"/>
  <color symbol="s" value="6a5040" name="scala"/>
  <color symbol="d" value="5a3420" name="porta"/>
  <color symbol="P" value="b08858" name="portico"/>
  <color symbol="c" value="b8b070" name="aia"/>
  <color symbol="n" value="9a9488" name="selciato"/>
  <color symbol="x" value="7a5a38" name="staccionata"/>
  <color symbol="G" value="5a4028" name="cancello"/>
  <color symbol="r" value="a89070" name="strada"/>
  <color symbol="Q" value="5a7a9a" name="pozzo"/>
  <color symbol="t" value="5a8a40" name="albero"/>
  <color symbol="u" value="c8b050" name="campo"/>
  <color symbol="m" value="ff00ff" name="segno"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h stanze della casa, w muri della casa, a fienile, v muri del fienile, s scala, d porta, P portico, c aia, n selciato, x staccionata, G cancello, r strada, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEExxxxxxxxxxxxxxxxxxxxxxxxxEE
EEExcccccccccccccccccccccccxEE
EEExcccccccccccccccccccccccxEE
EEExcccccccccccccccQcccccccxEE
EEExcccccccccccccccccccccccxEE
EEExcccccccccccccccccccccccxEE
EEExcccccccccccccccccccccccxEE
EEExccccccwwwwwwwwwwwccccccxEE
EEExccccccwhhsssshhhwccccccxEE
EEExccccccwhhsssshhhwccccccxEE
EEExccccccwhhhhhhhhhwccccccxEE
EEExccccccwhhhhhhhhhwccccccxEE
EEExccccccwhhhhhhhhhwvvvvccxEE
EEExccccccwhhhhhhhhhwaaavccxEE
EEExccccccwhhhhhhhhhwaaavccxEE
EEExccccccwhhhhhhhhhwaaavccxEE
EEExccccccwhhhhhhhhhwaaavccxEE
EEExccccccwwwwdddwwwwaaavccxEE
EEExcccccccccPPPPPcccvvvvccxEE
EEExcccccccccPPPPPcccccccccxEE
EEExccccccccccnnnccccccccccxEE
EEExxxxxxxxxxxGGGxxxxxxxxxxxEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h stanze della casa, w muri della casa, a fienile, v muri del fienile, s scala, d porta, P portico, c aia, n selciato, x staccionata, G cancello, r strada, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEExxxxxxxxxxxxxxxxxxxxxxxxxEE
EEExcccccccccccccccccccccccxEE
EEExcccccccccccccccccccccccxEE
EEExcccccccccccccccccccccccxEE
EEExcccccccccccccccccccccccxEE
EEExcccQcccccccccccccccccccxEE
EEExcccccccccccccccccccccccxEE
EEExccccccwwwwwwwwwwwccccccxEE
EEExccccccwhhsssshhhwccccccxEE
EEExccccccwhhsssshhhwccccccxEE
EEExccccccwhhhhhhhhhwccccccxEE
EEExccccccwhhhhhhhhhwccccccxEE
EEExccccccwhhhhhhhhhwvvvvccxEE
EEExccccccwhhhhhhhhhwaaavccxEE
EEExccccccwhhhhhhhhhwaaavccxEE
EEExccccccwhhhhhhhhhwaaavccxEE
EEExccccccwhhhhhhhhhwaaavccxEE
EEExccccccwwwwdddwwwwaaavccxEE
EEExcccccccccPPPPPcccvvvvccxEE
EEExcccccccccPPPPPcccccccccxEE
EEExccccccccccnnnccccccccccxEE
EEExxxxxxxxxxxGGGxxxxxxxxxxxEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h stanze della casa, w muri della casa, a fienile, v muri del fienile, s scala, d porta, P portico, c aia, n selciato, x staccionata, G cancello, r strada, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEExxxxxxxxxxxxxxxxxxxxxxxxxEE
EEExcccccccccccccccccccccccxEE
EEExcccccccccccccccccccccccxEE
EEExcccccccccccccccccccccccxEE
EEExcccccccccccccccccccccccxEE
EEExcccccccccccccccccccccccxEE
EEExcccccccccccccccccccccccxEE
EEExccccccwwwwwwwwwwwccccccxEE
EEExccccccwhhsssshhhwcccQccxEE
EEExccccccwhhsssshhhwccccccxEE
EEExccccccwhhhhhhhhhwccccccxEE
EEExccccccwhhhhhhhhhwvvvvccxEE
EEExccccccwhhhhhhhhhwaaavccxEE
EEExccccccwhhhhhhhhhwaaavccxEE
EEExccccccwhhhhhhhhhwaaavccxEE
EEExccccccwhhhhhhhhhwaaavccxEE
EEExccccccwhhhhhhhhhwaaavccxEE
EEExccccccwwwwdddwwwwvvvvccxEE
EEExcccccccccPPPPPcccccccccxEE
EEExcccccccccPPPPPcccccccccxEE
EEExccccccccccnnnccccccccccxEE
EEExccccccccccnnnccccccccccxEE
EEExccccccccccnnnccccccccccxEE
EEExccccccccccnnnccccccccccxEE
EEExxxxxxxxxxxGGGxxxxxxxxxxxEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 100×100×160, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h stanze della casa, w muri della casa, a fienile, v muri del fienile, s scala, d porta, P portico, c aia, n selciato, x staccionata, G cancello, r strada, Q pozzo, t albero, u campo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEuuuEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEuuuEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEuuuEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEuuuEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEuuuEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEuuuEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEuuuEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEuuuuEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEuuuuEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEuuuuEE
EEEEEEEEEEEEEEEEEExxxxxxxxxxxxxxxxxEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEcccccccccccccccccEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEcccccccccccccccccEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEcccccccccccccccccEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEcccccccccccccccccEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEcccccwwwwwcccccccEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEccccchsshhcccccccEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEccccchhhhhcccccccEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEccccchhhhhaacccccEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEccccchhhhhaacccccEEEEEEEEEEEEEEE
EEEEEEuuuEEEEEEEEEcccccwPdwwavcccccEEEEEEEEEEEEEEE
EEEEEEuuuEEEEEEEEEccccccPPcccccccccEEEEEEEEEEEEEEE
EEEEEEuuuEEEEEEEEEcccccccncccccccccEEEEEEEEEEEEEEE
EEEEEEuuuEEEEEEEEEcccccccncccccccccEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEcccccccncccccccccEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEcccccccnccccccccxEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEuuuEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEuuuEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEuuuEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEuuuEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEuuuEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEuuuEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEuuuEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.12 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  FATTORIA (casa colonica con fienile)
  Plan letters: h rooms of the house, w its walls, s stair zone along the back wall, d door in the front wall;
  a the barn (lean-to wing) against a side wall, v its walls; P the porch before the door; c the farmyard
  around the buildings; n the paved way; x the fence around the yard, G the gate; r the cart road to the edge;
  Q the well in the yard; t the trees on free ground; u the fields beyond the fence.
  Relations: the house stands on H with the door to the front; the barn leans on a side wall; the stair zone runs
  along the back wall; the porch is between the door and the yard; the yard rings the buildings; the fence rings the
  yard; the road runs from the door to the edge through the gate.
  Seeds change: the depth of the house, the side and place of the barn, the well, the trees and the fields.
  Sizes: Large holds the house, barn, porch and a thin yard; Huge adds the fence and the well;
  Gargantuan adds a wider yard, fields and trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavsdPcnxGrQtum" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="[wv]E" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEE" out="*x*" steps="1"/><all in="xE/*x" out="*x/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/c" out="*/P" symmetry="()" steps="1"/><all in="P/c" out="*/P" symmetry="()" steps="1"/>
      <all in="[Pn]/c" out="*/n" symmetry="()"/>
      <all in="[nP]/x" out="*/G" symmetry="()"/><all in="[nGPr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="Pc" out="*P" symmetry="(x)" steps="2"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="Gx" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE/EEEEEEEEE" out="*********/*********/*********/*********/****u****/*********/*********/*********/*********" steps="6"/>
      <all steps="3"><rule in="uE" out="*u"/><rule in="u*/*E" out="**/*u"/></all>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEwWURhfFsTkOoNLavYbpyJcnrxqQilugK" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="OOOOO/OOOOO/OOOOO/OOOOO/OOOOO"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="P" out="bbbbb/bpppb/bpppb/bpppb/bbbbb"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="G" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="QQQQQ/QqqqQ/QqqqQ/QqqqQ/QQQQQ"/>
      <rule in="t" out="ccccc/ciiic/ciiic/ciiic/ccccc"/>
      <rule in="u" out="uuuuu/ggggg/uuuuu/ggggg/uuuuu"/>
      <sequence symmetry="(xy)">
        <!-- house walls: two storeys of 32 -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- the front wall over the door seed -->
        <all in="B O" out="d *" steps="1"/>
        <all in="B d" out="d W" steps="63"/>
        <prl in="d" out="R"/>
        <!-- the rooms: floor, stair strip, slab, roof -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- the barn: one tall storey -->
        <all in="B v" out="v Y" steps="40"/>
        <prl in="v" out="R"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="39"/>
        <prl in="a" out="R"/>
        <!-- porch -->
        <all in="B p" out="p *" steps="33"/>
        <all in="B b" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <!-- fence, well, trees, crops -->
        <all in="B x" out="x *" steps="6"/>
        <all in="B Q" out="Q *" steps="8"/>
        <all in="B i" out="i *" steps="18"/>
        <all in="B i" out="l *" steps="1"/>
        <all in="lB" out="*l" steps="5"/>
        <all in="B l" out="l *" steps="7"/>
        <all in="B g" out="g *" steps="3"/>
        <!-- parts -->
        <union symbol="+" values="WUwdY"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- windows -->
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- roofs and chimney -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="h" value="c8a878" name="stanze della casa"/>
  <color symbol="w" value="e8dcc0" name="muri della casa"/>
  <color symbol="a" value="a08050" name="fienile"/>
  <color symbol="v" value="8a4a30" name="muri del fienile"/>
  <color symbol="s" value="6a5040" name="scala"/>
  <color symbol="d" value="e8dcc0" name="muro della porta"/>
  <color symbol="P" value="b08858" name="portico"/>
  <color symbol="G" value="5a4028" name="cancello"/>
  <color symbol="m" value="ff00ff" name="segno"/>
  <color symbol="W" value="e8dcc0" name="intonaco"/>
  <color symbol="U" value="e8dcc0" name="intonaco"/>
  <color symbol="R" value="b04a30" name="tetto di coppi"/>
  <color symbol="K" value="7a6a60" name="camino"/>
  <color symbol="f" value="9a7048" name="pavimento di assi"/>
  <color symbol="F" value="8a6040" name="solaio"/>
  <color symbol="T" value="9a7048" name="scala"/>
  <color symbol="k" value="6a4a30" name="gradini"/>
  <color symbol="O" value="7a4a28" name="porta"/>
  <color symbol="o" value="4a2a18" name="assi della porta"/>
  <color symbol="N" value="3a2a20" name="stipiti"/>
  <color symbol="L" value="3a5a7a" name="finestra"/>
  <color symbol="Y" value="8a4a30" name="assi del fienile"/>
  <color symbol="b" value="b08858" name="tavolato del portico"/>
  <color symbol="p" value="5a3a20" name="pali del portico"/>
  <color symbol="J" value="a04030" name="tettoia"/>
  <color symbol="c" value="b8b070" hidden="True" area="yard"/>
  <color symbol="n" value="9a9488" name="selciato"/>
  <color symbol="r" value="a89070" name="strada"/>
  <color symbol="x" value="7a5a38" name="staccionata"/>
  <color symbol="Q" value="8a8a88" name="pozzo"/>
  <color symbol="q" value="4a7aa0" name="acqua del pozzo"/>
  <color symbol="i" value="5a3a20" name="tronco"/>
  <color symbol="l" value="5a8a40" name="chioma"/>
  <color symbol="u" value="a08050" area="field" name="campo"/>
  <color symbol="g" value="d0b040" name="grano"/>
  <color symbol="t" value="5a8a40" name="albero"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
