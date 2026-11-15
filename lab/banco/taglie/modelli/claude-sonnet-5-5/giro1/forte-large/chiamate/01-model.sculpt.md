# model.sculpt · claude-sonnet-5-5 · 214 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
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
  FORTE. A keep in a courtyard, inside a curtain wall with corner towers and a gate.
  Parts and letters on the plan (a cell is 5 voxels):
    H/h  the keep, a hall of 9 wide by 9 or 10 deep around the centre; w its walls
    s    the zone of the stair, in the back-left corner of the keep, with two cells of landing
    d    the keep door, 3 cells wide, on the axis in the front wall
    c    the courtyard, a ring around the keep; n the paving from the keep door to the gate
    W    the curtain wall, one cell thick; G the gate, 3 cells wide, on the axis
    t    corner towers, 5 x 5 cells, placed on 2 to 4 of the 4 outer corners
    r    the road from the gate to the edge, 3 wide
    b    barracks (lean-to), 6 x 4 cells against the inside of the wall; Q a well; a the moat
  The seeds change: the depth of the keep (9 or 10), how many towers (2 to 4) and which corners, where the barracks and the well stand.
  What fits: Large (20) is the keep in a thin yard and ring with towers and a gate.
  Huge (30) widens the yard by 4 and adds barracks and a well.
  Gargantuan (40) widens the yard by another 3 and adds a moat with a causeway at the gate.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwcWtGnrdmsbQa" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the keep: a line through H, 4 behind (one more by chance), 4 in front, then 4 to each side -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- the zone of the stair: back-left corner of the keep, 2 cells of landing, 4 long, 2 wide -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- the courtyard around the keep -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- where the ground goes on, the yard grows: 4 more at Huge, 3 more again at Gargantuan -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- the curtain wall, one cell thick, corners filled -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- towers on the outer corners: two for sure, the others by chance -->
      <one in="EE/EW" out="**/*t" steps="2"/>
      <prl in="EE/EW" out="**/*t" p="0.5" steps="1"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- the way out from the centre straight to the front: keep door d, paving n, gate G, road r -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- barracks against the wall, 6 wide and 4 deep, only where the yard is deep enough -->
      <one in="WWWWWW/cccccc/cccccc/cccccc/cccccc" out="******/bbbbbb/bbbbbb/bbbbbb/bbbbbb" steps="2"/>
      <!-- a well in 5 x 5 of free yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- the moat, two cells wide, only where five cells of ground go on past the wall -->
      <all in="cWEEEEE" out="**aa***" steps="1"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>
  </map>
  <color symbol="B" value="000000" name="aria"/>
  <color symbol="E" value="8DAA5B" name="erba"/>
  <color symbol="H" value="D9C27A" name="centro del maschio" area="keep"/>
  <color symbol="h" value="C9B37E" name="pavimento del maschio" area="keep"/>
  <color symbol="w" value="8A8D91" name="muro del maschio"/>
  <color symbol="d" value="7A4A2B" name="porta del maschio"/>
  <color symbol="s" value="B58B4A" name="zona della scala"/>
  <color symbol="m" value="FF00FF" name="segno"/>
  <color symbol="c" value="D8C99B" name="cortile" area="courtyard"/>
  <color symbol="n" value="B9A98A" name="lastricato"/>
  <color symbol="W" value="6E7378" name="muro di cinta"/>
  <color symbol="t" value="4F545C" name="torre" area="tower"/>
  <color symbol="G" value="8C5A3C" name="portale"/>
  <color symbol="r" value="C2A878" name="strada"/>
  <color symbol="b" value="A9473A" name="caserma" area="barracks"/>
  <color symbol="Q" value="3E5F7F" name="pozzo"/>
  <color symbol="a" value="4F8FB5" name="fossato"/>
</sequence>
