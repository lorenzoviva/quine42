# model.sculpt · claude-opus-5-5 · 31 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 5 × 5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 7.5 × 7.5 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
<!--
FATTORIA - composition
Parts and letters (plan, cell = 5 voxels):
  h  the farmhouse floor (two storeys), around H; w its walls
  a  the barn / lean-to wing against a side wall of the house (left or right by seed); v its walls
  d  the door of the house, at the front (+y), 3 cells wide, on the axis of H
  r  the road from the door straight to the front edge
  g  the farmyard around house and barn, only where the ground goes on past it
  x  the fence around the yard (only where ground remains beyond)
  q  the haystack behind the house or barn
  Q  the well, in a 5x5 of yard
  t  trees of the orchard, in 7x7 of free ground
Seeds change: the house depth (one more cell in front or not), which side the barn stands,
where along the wall the barn sits, where the hay and the well go, how many trees.
Large (20x20): house + barn + hay, a narrow yard. Huge (30x30): the yard, fence, well and orchard trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdrgxqQtm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the house body -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the barn wing on one side -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- the way out: door in the front wall, road to the edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/></prl>
      <!-- the yard, only where the ground goes on past it -->
      <all in="[wv]EEEE" out="*g***" steps="1"/>
      <all in="gEEEE" out="*g***" steps="2"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- the fence around the yard where the ground goes on -->
      <all in="gEE" out="*x*"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- the hay behind a building -->
      <one in="EEE/EEE/EEE/[wv][wv][wv]" out="***/*q*/***/***" symmetry="()" steps="1"/>
      <one in="ggg/ggg/ggg/[wv][wv][wv]" out="***/*q*/***/***" symmetry="()" steps="1"/>
      <!-- the well in the yard -->
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- orchard trees on free ground -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="H" value="#d8c690" name="centro" area="house"/>
  <color symbol="h" value="#c9a46a" name="pavimento di casa" area="house"/>
  <color symbol="w" value="#e8dcc0" name="muro di casa"/>
  <color symbol="a" value="#a8703f" name="pavimento del fienile" area="barn"/>
  <color symbol="v" value="#9b3b2a" name="muro del fienile"/>
  <color symbol="d" value="#5a3a22" name="porta"/>
  <color symbol="r" value="#b9a37a" name="strada"/>
  <color symbol="g" value="#a7b46a" name="aia" area="yard"/>
  <color symbol="x" value="#7a5634" name="staccionata"/>
  <color symbol="q" value="#e0c25a" name="pagliaio"/>
  <color symbol="Q" value="#6f8fa8" name="pozzo"/>
  <color symbol="t" value="#5f8a3c" name="albero da frutto" area="orchard"/>
  <color symbol="m" value="#ff00ff" name="segno"/>
</sequence>
```
