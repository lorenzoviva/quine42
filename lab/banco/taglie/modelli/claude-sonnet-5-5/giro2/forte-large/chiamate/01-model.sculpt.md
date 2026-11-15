# model.sculpt · claude-sonnet-5-5 · 166 s

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

<!-- FORTE: parts and where each goes.
 h/w : the keep, a body of 9 x 8-9 cells around the centre H (3 behind, 4 in front, 1 more by chance), with its walls w. It holds the stair (s) in the back-left corner.
 c : the yard, a ring one cell wide around the keep. W : the curtain wall around the yard, one cell thick. t : towers on the outer corners of the ring; two corners always, the others by chance.
 d, n, G, r : door in the keep wall, paving across the yard, gatehouse in the ring, road to the edge. All straight to the front on the axis of H, three cells wide.
 The seeds change: the depth of the keep, which corners have towers and how many, where the barracks stand.
 At 5x5 tiles: keep, thin yard, ring, towers, gate and road.
 At 7.5 tiles the yard grows four cells on every side where the ground goes on. Added there: a well Q in the corner of the yard, one or two barracks a (4 deep) against the ring, and trees y on the lawn behind. -->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwmdncWGrtsaQy" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the keep: a line through H, then wide, then its walls -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the yard, a ring around the keep -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- where the ground goes on, the yard grows -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- the curtain wall -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <!-- towers: two corners always, the others by chance -->
      <one in="EE/EW" out="**/*t" steps="2"/>
      <prl in="EE/EW" out="**/*t" p="0.5" steps="1"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- the way out: keep wall, yard, ring, road -->
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- the stair zone: back-left corner of the keep, two cells of landing -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- the well, in a corner of the yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- barracks against the ring, 4 deep, with a walk beside them -->
      <one in="ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/WWWWWWW" out="*******/*aaaaa*/*aaaaa*/*aaaaa*/*aaaaa*/*******" steps="2"/>
      <!-- trees on the lawn, where there is room -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**y**/*****/*****" steps="3"/>
    </sequence>
  </map>
  <color symbol="B" value="#000000" name="aria"/>
  <color symbol="H" value="#8A6A4A" name="centro del maschio" area="keep"/>
  <color symbol="E" value="#7FA05A" name="terra" hidden="True"/>
  <color symbol="h" value="#B89A6A" name="pavimento del maschio" area="keep"/>
  <color symbol="w" value="#8E8C86" name="muro del maschio"/>
  <color symbol="m" value="#C9A66B" name="traccia del percorso" hidden="True"/>
  <color symbol="d" value="#5A3A22" name="porta del maschio"/>
  <color symbol="n" value="#B7A98A" name="selciato"/>
  <color symbol="c" value="#A8B878" name="cortile" area="courtyard"/>
  <color symbol="W" value="#6F6D68" name="cinta muraria"/>
  <color symbol="G" value="#4F4D4A" name="torre del cancello"/>
  <color symbol="r" value="#C8B58A" name="strada"/>
  <color symbol="t" value="#9A3A2E" name="torre d'angolo" area="tower"/>
  <color symbol="s" value="#D0C090" name="zona della scala" area="keep"/>
  <color symbol="a" value="#B5654A" name="caserma" area="barracks"/>
  <color symbol="Q" value="#4A7FA8" name="pozzo" area="courtyard"/>
  <color symbol="y" value="#3F7A3A" name="albero"/>
</sequence>
