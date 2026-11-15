# model.sculpt · claude-opus-5-5 · 32 s

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
<!--
  Fattoria (farm).
  Parts and letters on the plan:
    H  the centre of the house; h the floor of the house; w the walls of the house (two storeys).
    s  the stair zone inside the house, along the back wall.
    a  the floor of the barn wing; v its walls (lower, under a long pitched roof).
    The barn stands against one side of the house; the seed picks the side and the position along it.
    d  the front door, three cells wide, in the middle of the front wall.
    r  the road, from the door straight to the edge.
    g  the farmyard lawn, a ring around house and barn.
       Where the ground goes on, the lawn grows deeper (a real yard).
    x  the fence around the yard, only where there is room for it.
    Q  the haystacks in the yard, only where a 5 x 5 window of lawn fits.
    t  the trees outside the fence, only where a 7 x 7 window of free ground fits (orchard).
  What the seeds change:
    the depth of the house (one more row at the front, or not), the side of the barn, its place along the wall,
    where the hay and the trees stand.
  What fits at each size:
    Large: the house, the barn, a thin lawn.
    Huge: a yard grown on some sides, a fence, a haystack.
    Gargantuan: a deep yard, more hay, and the orchard of trees beyond the fence.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavdrmgxQt" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the house body -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the barn wing against a side wall -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- the way out: door and road, three cells wide -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- the stair zone along the back wall -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- the lawn of the yard around house and barn -->
      <all in="[wv]E" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEEE" out="*gggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEEEE" out="*ggg****" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- the fence, where the ground goes on -->
      <all in="gE" out="*x"/>
      <!-- haystacks in the yard -->
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**Q**/*****/*****" steps="3"/>
      <!-- the orchard beyond the fence -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="6"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" value="FF0000" name="centro"/>
  <color symbol="h" value="C8A878" name="pavimento di casa" area="house"/>
  <color symbol="w" value="E8DCC0" name="muro di casa"/>
  <color symbol="s" value="8A6A48" name="zona della scala" area="house"/>
  <color symbol="a" value="B89868" name="pavimento del fienile" area="barn"/>
  <color symbol="v" value="A04030" name="muro del fienile"/>
  <color symbol="d" value="5A3A20" name="porta"/>
  <color symbol="r" value="B0A080" name="strada"/>
  <color symbol="m" value="FF00FF" name="segno"/>
  <color symbol="g" value="8AA858" name="aia" area="yard"/>
  <color symbol="x" value="7A5A38" name="steccato"/>
  <color symbol="Q" value="D8C060" name="covone"/>
  <color symbol="t" value="4A7A38" name="albero" area="orchard"/>
</sequence>
```
