# model.sculpt · claude-opus-5-5 · 54 s

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
  Fattoria (farm).
  Parts and their letters on the plan:
    h  the farmhouse floor, a body around H, 9 cells wide
    w  the walls of the farmhouse
    s  the stair zone, along the back wall, inside h
    a  the barn floor, a wing set against one side wall of the house
    v  the walls of the barn
    c  the farmyard (aia) around the house and the barn
    x  the fence around the yard
    d  the door, in the middle of the front wall
    p  the porch, in front of the door
    r  the road, from the porch to the edge
    Y  the haystack, in the yard as far as possible from the road
    Q  the well, where 5 x 5 of yard is free
    t  the trees of the orchard, outside the fence, where 7 x 7 of ground is free
    m  a marker for the path from the centre to the door
  Where each part goes:
    The house stands at the centre. Its door faces the front (+y) and the porch and the road run on that axis.
    The barn leans on a side wall. The yard wraps both buildings and the fence wraps the yard.
    The haystack is kept away from the gate.
  What the seeds change:
    the depth of the house, the side and the position of the barn, the corner of the hay,
    and where the trees and the well go.
  What fits at each size:
    Large: the house, the barn, the porch, a thin yard, the fence and the hay behind.
    Huge: a wider yard with a well, and an orchard of trees outside the fence.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavcxdprYQtm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the farmhouse: 4 behind, 3 in front plus one by chance, 4 to each side -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the barn: a wing on one side wall -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- the stair zone along the back wall -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- the yard, which grows where there is ground -->
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- the fence -->
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- the door, the porch and the road to the front -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dp]/[cxE]" out="*/p" symmetry="()" steps="4"/>
      <all in="[pr]/[cxE]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[cxE]" out="*r" symmetry="(x)" steps="1"/>
      <all in="p[cx]" out="*p" symmetry="(x)" steps="3"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- the haystack, far from the road -->
      <one in="c" out="Y" steps="1"><field for="Y" from="r" on="cr"/></one>
      <all steps="2"><rule in="Yc" out="*Y"/><rule in="Y*/*c" out="**/*Y"/></all>
      <!-- the well in a free square of yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- the orchard trees on free ground -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="H" value="ffffff" name="centro"/>
  <color symbol="h" value="c9a36b" name="pavimento di casa" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro di casa" area="house"/>
  <color symbol="s" value="8a5a30" name="scala" area="house"/>
  <color symbol="a" value="b08850" name="pavimento del fienile" area="barn"/>
  <color symbol="v" value="a04030" name="muro del fienile" area="barn"/>
  <color symbol="c" value="d8c890" name="aia" area="yard"/>
  <color symbol="x" value="6b4a2a" name="staccionata" area="yard"/>
  <color symbol="d" value="4a2a18" name="porta" area="house"/>
  <color symbol="p" value="9a7040" name="portico" area="porch"/>
  <color symbol="r" value="a89878" name="strada"/>
  <color symbol="Y" value="e0c040" name="pagliaio" area="yard"/>
  <color symbol="Q" value="5080a0" name="pozzo" area="yard"/>
  <color symbol="t" value="5a8a3a" name="albero" area="orchard"/>
  <color symbol="m" value="ff00ff" name="segno"/>
</sequence>
```
