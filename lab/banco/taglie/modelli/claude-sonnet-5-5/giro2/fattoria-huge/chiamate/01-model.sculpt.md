# model.sculpt · claude-sonnet-5-5 · 14 s

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

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
<!-- FATTORIA, block 1: composition on the plan (cell = 5 voxels).
 Parts: house (body h, walls w) around H at the centre; a barn/wing (a, walls v) against a side wall, side chosen by seed;
 a yard (c) in front of the door, paved path (m,d,n) from the house door straight to the front, road r to the edge;
 a lean-to / porch (p) at the front on the axis of the door; hay (y) behind the house; fence ring (f) beyond the yard
 only where ground goes on; trees (t) in free 7x7 lawn; a well (Q) in the yard where 5x5 fits.
 Seeds change: house depth and width by chance, side of the wing, position of trees.
 Size: at 20 cells: house + wing + porch + road; at 30 and 40: yard, fence, trees, well, more. -->
<sequence values="BHEwhavcdnmirfptyQ" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEwhavcdnmirfptyQ" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- house body: 3 behind, 5 in front, maybe one more; 4 each side -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- wing (barn) against a side wall, lower, random side -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- the way out from the centre to the front: door d, yard-paving, road r -->
      <all in="H/i" out="*/m" symmetry="()" steps="1"/>
      <all in="m/i" out="*/m" symmetry="()"/>
      <!-- yard around the house, grown where ground goes on -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="[mc]/E" out="*/r" symmetry="()"/>
      <!-- well in the yard, where 5x5 fits -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- fence beyond the yard, only where ground continues -->
      <all in="cEEEEE" out="*fffff" steps="1" symmetry="(x)"/>
      <!-- trees in free lawn -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="2"/>
    </sequence>
  </map>
  <color symbol="B" value="000000" name="aria"/>
  <color symbol="E" value="7BA05B" name="erba" hidden="True"/>
  <color symbol="H" value="C9A66B" name="centro" area="house"/>
  <color symbol="h" value="C9A66B" name="casa" area="house"/>
  <color symbol="w" value="E8DCC0" name="muro" area="house"/>
  <color symbol="a" value="B5895A" name="fienile" area="barn"/>
  <color symbol="v" value="9C6B43" name="muro fienile" area="barn"/>
  <color symbol="c" value="A9C27A" name="aia" area="yard"/>
  <color symbol="d" value="8B5A2B" name="porta" area="house"/>
  <color symbol="n" value="B8B0A0" name="lastrico" area="yard"/>
  <color symbol="m" value="B8B0A0" name="sentiero" area="yard"/>
  <color symbol="i" value="7BA05B" name="marcatore"/>
  <color symbol="r" value="C8B58A" name="strada" area="yard"/>
  <color symbol="f" value="6B4A2B" name="recinto" area="field"/>
  <color symbol="p" value="6B4A2B" name="portico" area="porch"/>
  <color symbol="t" value="3F7A3A" name="albero" area="orchard"/>
  <color symbol="y" value="D8B94A" name="fieno" area="barn"/>
  <color symbol="Q" value="5A7FA8" name="pozzo" area="yard"/>
</sequence>
```
