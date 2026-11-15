# model.sculpt · claude-sonnet-5-5 · 292 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
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

<!--
FORTE: a ring wall with corner towers, a gate, and a keep in the courtyard.
Parts and letters:
 H h  the keep, a body of 9 cells wide around the centre: 2 or 3 cells behind H, 5 in front
 w    walls of the keep
 s    stair zone, in the back-left corner of the keep, with 2 cells of landing before it
 d m  door of the keep, on the axis, 3 wide, through the front wall
 c    yard around the keep
 n    paving across the yard, 3 wide, from the door to the gatehouse
 W    curtain wall, 1 cell thick
 G    gatehouse in the ring, taller than the wall
 r    road from the gate to the edge, 3 wide
 t    towers: 3 or 4 of the 4 outer corners (which ones changes per seed), plus one tower in the middle of a long free side
 a    lean-to (stable) against the ring, 7 × 5, only where the yard is 5 thick
 A v  barracks against the ring, 8 × 8 with walls and an interior of 6 × 6, only where the yard is 8 thick
 Q    well, in a free 5 × 5 of yard
 Y Z  trees (canopy, trunk) on the free ground outside the ring
What the seeds change: the length of the keep behind H, which corners get towers, the side of the middle tower, and where the lean-to, barracks, well and trees go.
What fits:
 Large (20 × 20): keep, a yard 1 thick, a thin ring, gate, road and towers.
 Huge (30 × 30): the yard grows 4 more on every side, so it gets a lean-to and a well.
 Gargantuan (40 × 40): the yard grows 3 more, so it also gets the barracks, and the sides leave room for middle towers.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsmcWtdnGrQaAvYZ" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the keep: a line through H, 2 behind, 5 in front, one more behind by chance; then 4 to each side -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- the zone of the stair: in the back-left corner, two cells of landing before it -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- the yard around the keep, and it grows where the ground goes on past it -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- the ring, one cell thick, corners filled -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- towers on three or four of the outer corners, then grown -->
      <one in="EE/EW" out="**/*t" steps="3"/>
      <one in="EE/EW" out="**/*t" p="0.5" steps="1"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- the way out: through the keep wall (d), across the yard (n), through the ring (G), then the road (r) to the edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>

      <!-- the barracks (8 × 8) against the ring, only where the yard is 8 thick -->
      <one in="WWWWWWWW/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc" out="********/vvvvvvvv/vAAAAAAv/vAAAAAAv/vAAAAAAv/vAAAAAAv/vAAAAAAv/vAAAAAAv/vvvvvvvv" steps="1"/>

      <!-- the lean-to (7 × 5) against the ring, only where the yard is 5 thick -->
      <one in="WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/aaaaaaa/aaaaaaa/aaaaaaa/aaaaaaa/aaaaaaa" steps="1"/>

      <!-- the well in a free 5 × 5 of yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- a tower in the middle of a long free side, where 6 cells of ground go on past the ring -->
      <one in="EEE/EEE/EEE/EEE/EEE/EEE/WWW" out="***/***/***/***/ttt/ttt/ttt" steps="1"/>

      <!-- trees on the free ground outside -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*YYY*/*YZY*/*YYY*/*****" steps="3"/>
    </sequence>
  </map>
  <color symbol="B" value="BFD9E6" name="aria"/>
  <color symbol="E" value="7A9A4B" name="terra"/>
  <color symbol="H" value="B0A090" name="centro del maschio" area="keep"/>
  <color symbol="h" value="C9B38A" name="pavimento del maschio" area="keep"/>
  <color symbol="w" value="9A9288" name="muro del maschio"/>
  <color symbol="s" value="8A6F4E" name="zona della scala"/>
  <color symbol="m" value="C9B38A" name="passaggio"/>
  <color symbol="c" value="A89968" name="cortile" area="courtyard"/>
  <color symbol="W" value="7D7A74" name="cinta"/>
  <color symbol="t" value="5F5C58" name="torre" area="tower"/>
  <color symbol="d" value="5A3A22" name="porta del maschio"/>
  <color symbol="n" value="B9AF9A" name="lastricato"/>
  <color symbol="G" value="6B6761" name="torre di porta"/>
  <color symbol="r" value="B08A5A" name="strada"/>
  <color symbol="Q" value="4F8FB5" name="pozzo"/>
  <color symbol="a" value="A5683A" name="tettoia" area="stable"/>
  <color symbol="A" value="D2B48C" name="pavimento della caserma" area="barracks"/>
  <color symbol="v" value="B4745A" name="muro della caserma"/>
  <color symbol="Y" value="4E8B3A" name="chioma"/>
  <color symbol="Z" value="6B4A2B" name="tronco"/>
</sequence>
