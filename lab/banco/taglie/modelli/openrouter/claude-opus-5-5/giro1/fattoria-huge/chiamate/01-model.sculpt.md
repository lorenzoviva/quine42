# model.sculpt · claude-opus-5-5 · 37 s

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

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
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
```
