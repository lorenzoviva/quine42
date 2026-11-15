# model.sculpt · claude-sonnet-5-5 · 229 s

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

<!--
FATTORIA, block 1: the composition.
Parts: the HOUSE (h floor, w walls, centre H) at the middle: a body of 9 cells across and 9 to 11 deep.
  The seeds change the depth (the front and the back each take one more cell by chance).
The DOOR d is 3 cells wide in the middle of the front wall. The ROAD r runs from it straight to the edge, 3 wide.
The PORCH p is 5 wide and 2 deep on the road, against the door.
The HAY LEAN-TO l is behind the house, against the back wall on its axis: 7 wide and 5 deep (35 x 25 voxels).
At Large: house, porch, lean-to with the hay behind, road.
At Huge, where the ground goes on, there is more:
  the BARN a (interior), v (walls): a body of 6 x 7 cells against a side wall of the house.
  The seeds choose the side and the place along the wall.
  The CROP FIELD z lies beside the road, on the side that is free.
  The YARD c is a ring of two cells around the house, the barn and the lean-to, with the FENCE x beyond it.
  The ORCHARD t is single trees on free ground, each in a 5 x 5 window.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhgwdrplavcxzt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the house: a line through H, 3 behind and 5 in front, each end one more by chance -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <!-- 4 cells to each side of every cell of the line; the side cells are g, only the axis stays h -->
      <all in="[Hhg]E" out="*g" symmetry="(x)" steps="4"/>
      <all in="[hg]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- the hay lean-to: against the back wall on the axis, 7 wide and 5 deep -->
      <all in="E/w/h" out="l/*/*" symmetry="()" steps="1"/>
      <all in="lE" out="*l" symmetry="(x)" steps="3"/>
      <all in="E/l" out="l/*" symmetry="()" steps="4"/>

      <!-- the door in the middle of the front wall, the road to the edge, the road and the door widened to 3 -->
      <all in="h/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>

      <!-- the porch: 3 wide, 2 deep, then 5 wide -->
      <all in="d/r" out="*/p" symmetry="()" steps="1"/>
      <all in="p/r" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>

      <!-- the barn: only where 8 cells of ground go on from a side wall, on 7 rows; the side and the place are chosen by the seed -->
      <one in="EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw" out="*********/*********/*********/*******a*/*********/*********/*********" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="5"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- the crop field: beside the road, where 5 rows of 6 free cells lie along it -->
      <one in="rEEEEEE/rEEEEEE/rEEEEEE/rEEEEEE/rEEEEEE" out="*zzzzzz/*zzzzzz/*zzzzzz/*zzzzzz/*zzzzzz" symmetry="(x)" steps="1"/>

      <!-- the yard: two cells around the house, the barn and the lean-to; the fence beyond it only where the ground goes on -->
      <all in="[wvl]E" out="*c" steps="1"/>
      <all in="cE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEE" out="*x**" steps="1"/>

      <!-- the orchard: a tree in every free window of 5 x 5 -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****" steps="6"/>

      <!-- the floor of the house: g becomes h -->
      <prl in="g" out="h"/>
    </sequence>
  </map>
  <color symbol="E" value="7BA05B" name="terra" hidden="True"/>
  <color symbol="H" value="C94F3D" name="focolare" area="house"/>
  <color symbol="h" value="E3C58E" name="pavimento" area="house"/>
  <color symbol="g" value="E3C58E" name="pavimento" area="house"/>
  <color symbol="w" value="D9CBB0" name="muro"/>
  <color symbol="d" value="5B3A29" name="portone"/>
  <color symbol="r" value="C4A574" name="strada"/>
  <color symbol="p" value="A8643C" name="portico" area="porch"/>
  <color symbol="l" value="D8B84A" name="tettoia del fieno" area="shed"/>
  <color symbol="a" value="E8D8B8" name="stalla" area="barn"/>
  <color symbol="v" value="B55A3C" name="muro della stalla"/>
  <color symbol="c" value="A4C27A" name="aia" area="yard"/>
  <color symbol="x" value="7A5230" name="recinto"/>
  <color symbol="z" value="B9A04A" name="campo" area="field"/>
  <color symbol="t" value="3E7A3C" name="albero" area="orchard"/>
</sequence>
