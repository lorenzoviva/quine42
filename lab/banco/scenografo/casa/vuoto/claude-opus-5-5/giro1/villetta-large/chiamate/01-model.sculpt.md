# model.sculpt · claude-opus-5-5 · 42 s

## Richiesta

Sculpt: villetta
What it looks like: villetta: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a dwelling (see «What fits»): the house takes most of the area, not a cottage in a garden. At least 10 tiles² of covered floor where a body stands (its centre, half a body off every wall) on the ground floor and on another storey, the ground floor in 2 rooms or more of at least 1.5 tiles² each (the hall and a room) divided by an inner wall with a door: about 75 × 65 voxels inside the outer walls at every size, two storeys.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
<!--
villetta: a two-storey house that fills most of the plot.
Parts (plan letters):
  h  rooms: a body 6 cells behind H, 6 or 7 in front, 7 to each side.
  w  outer walls.
  j  inner wall through H: hall at the front, a room behind.
  s  stair zone in the back room, against the back wall, with a landing before it.
  d  front door, 3 cells, in the middle of the front wall.
  p  porch on either side of the door.
  r  road from the door to the front edge.
Huge only:
  a / v  an annex (lean-to and its walls) on a side wall.
  g      the garden around the house.
  x      a hedge around the garden.
  t      trees.
What the seeds change: the depth of the front (6 or 7), the stair corner (left or right),
the side of the annex, and where the trees go.
What fits: at Large, the house, porch and road. At Huge, also the annex, the garden, the hedge and the trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjsmdrpavgxt" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- body -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- door path: from H straight to the front wall -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <!-- inner wall through H, across x -->
      <all in="[Hj]h" out="*j" symmetry="(x)"/>
      <!-- stair zone against the back wall, left or right -->
      <one steps="1" symmetry="()">
        <rule in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss"/>
        <rule in="wwwwwwww/hhhhhhhw/hhhhhhhw" out="********/**ssss**/**ssss**"/>
      </one>
      <!-- annex on a side wall, only where three cells of ground lie beyond it (Huge) -->
      <one in="EEEw/EEEw/EEEw/EEEw/EEEw" out="****/****/**a*/****/****" symmetry="(x)" steps="1"/>
      <all in="aw" out="aa" symmetry="(x)" steps="0"/>
      <all in="Ea" out="a*" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- porch in front of the door -->
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pE/w*" out="*p/**" symmetry="(x)" steps="2"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <!-- garden ring, only where there is ground to spare (Huge) -->
      <all in="[wvp]EEEEE" out="*ggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*x" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- road from the door to the front edge -->
      <all in="[dr]/[pgxE]" out="*/r" symmetry="()"/>
      <!-- trees in the garden -->
      <one in="ggg/ggg/ggg" out="***/*t*/***" steps="4"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="B" hidden="True"/>
  <color symbol="H" value="C9A97A" name="centro" area="hall"/>
  <color symbol="h" value="C9A97A" name="pavimento" area="hall"/>
  <color symbol="w" value="E8DCC0" name="muro" area="house"/>
  <color symbol="j" value="D8C8A8" name="muro interno" area="house"/>
  <color symbol="s" value="8A5A3A" name="scala" area="stair"/>
  <color symbol="m" value="C9A97A" name="passaggio"/>
  <color symbol="d" value="5A3A22" name="porta" area="house"/>
  <color symbol="r" value="B8A890" name="vialetto" area="path"/>
  <color symbol="p" value="A0784E" name="portico" area="porch"/>
  <color symbol="a" value="B89A70" name="tettoia" area="shed"/>
  <color symbol="v" value="C8B898" name="muro della tettoia" area="shed"/>
  <color symbol="g" value="8AAA5A" name="prato" area="garden"/>
  <color symbol="x" value="4E7A3A" name="siepe" area="garden"/>
  <color symbol="t" value="3E6A2E" name="albero" area="garden"/>
</sequence>
```
