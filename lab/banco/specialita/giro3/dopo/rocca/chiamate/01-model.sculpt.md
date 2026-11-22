# model.sculpt · piano · gemini-4-argon · 23 s · 8775 token d'ingresso (0 in cache), 2161 d'uscita, 0 di ragionamento · $0.04

## Richiesta

Sculpt: rocca di confine
What it looks like: rocca di confine: a building one enters, with the door at the front, with a cellar under it
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a fortification: merlons (part-battlements) and arrow slits (part-slits) belong to it.
It has a cellar under it: the box goes 20 voxels (1.25 tiles) under the soil, which the kernel writes at z=20; z=0 to 19 are under the ground. Dig it with part-cellar: mark D under the floor of a room on the soil, away from the door and from the foot of the stair, then include part-cellar after the floors rise and before part-stair, and give D, V and k your colours. The cellar must hold: a body goes down to it on foot from the door, and every floor down there is reached; if it does not, the building comes in without it.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-cellar"/>: The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/> under a plan letter h on the soil, before it rises. D must hold 44 × 14 at least (44 along x) and room beside the stair, and stay 10 voxels back from your front wall: the floor opens over the upper treads (20 × 10 for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its walls, two thick along its edge; from a landing of 5, its stair climbs along its front wall (the side of large y) toward large x by treads of 5 and risers of 3 until your floor, with 5 of floor past its top (a deeper cellar needs a longer room: a tread more for every 3 voxels). Without room under the soil it does nothing. Its letters: D (yours, then the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

<!--
  Concept: rocca di confine (border stronghold / keep with cellar, bastion tower, lean-to, and outer bailey at Huge).
  Parts & plan letters:
    h, g: main keep interior (two storeys + battlemented roof terrace; 'g' is the back half where the cellar D is dug, 'h' is the front half near the door).
    s: stair zone inside the main keep (climbs along x, away from the cellar hatch).
    w: keep stone walls.
    a, v: tall corner/side bastion tower (a = interior, v = tower wall) attached to the keep, varying in position and depth by seed.
    p: wooden lean-to / armory shelter against the opposite side of the keep.
    d: main front door (3 cells = 15 voxels wide) facing the front road.
    c, l: paved/flagstone bailey courtyard around the keep (grows larger where ground permits at Huge).
    W: outer curtain wall enclosing the bailey at Huge (where space around the courtyard allows).
    t: corner watch-turrets on the outer curtain wall at Huge.
    G: outer gatehouse on the front axis through the curtain wall.
    r: paved road from the front door (and gatehouse) straight to the front edge of the box.
  What seeds change: keep depth/width, bastion tower side and size, lean-to position, courtyard flagstone pattern.
  What fits by size:
    Large (20x20 plan): main keep with cellar, attached bastion tower, side lean-to, small forecourt and road.
    Huge (30x30 + Gargantuan 100x100): expands with a full surrounding bailey courtyard, outer curtain wall, corner turrets, and front gatehouse.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhgswavpdclWtGrz" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- Main keep core: 9 cells wide (45 voxels >= 44 needed for cellar D along x) -->
      <all in="E/[Hh]" out="h/*" steps="4"/>
      <all in="[Hh]/E" out="*/h" steps="2"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="H" out="h"/>

      <!-- Keep walls -->
      <all in="hE" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- Split keep floor into back zone 'g' (for cellar, at least 3 cells = 15 voxels deep, 2 cells back from front wall) and front zone 'h' -->
      <all in="w/h" out="*/g" steps="1"/>
      <all in="g/h" out="*/g" steps="2"/>
      <!-- Ensure at least 2 rows of 'h' remain in front of 'g' -->
      <all in="g/h/w" out="h/*/*" steps="1"/>
      <all in="g/h/h/w" out="h/*/*/*" steps="1"/>

      <!-- Stair zone 's' in the back-right of 'g' (4 cells along x, 2 along y, with 2 cells of landing on the left) -->
      <one in="wwwwwwwww/wgggggggw/wgggggggw" out="*********/***ssssgw/***ssssgw" steps="1"/>

      <!-- Attached bastion tower ('a' interior, 'v' wall) on one side of the keep, varied by seed -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/*a/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <prl in="aE" out="*a" p="0.5" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" steps="1"/>
      <all in="a/E" out="*/a" steps="1"/>
      <all in="aE" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>

      <!-- Lean-to shelter ('p') on the available side wall (at least 4x2 cells = 20x10 voxels) -->
      <one in="wE/wE/wE/wE/wE" out="**/*p/*p/*p/**" symmetry="(x)" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>

      <!-- Inner courtyard ring around the keep and tower -->
      <all in="[wvp]E" out="*c" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- At Huge/Gargantuan, where at least 4 cells of free ground remain beyond 'c', expand courtyard and build outer curtain wall 'W' -->
      <all in="cEEEE" out="*cc**" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="cEE" out="*WE" symmetry="(xy)" steps="1"/>
      <all in="WE/*W" out="*W/**" symmetry="(xy)"/>

      <!-- Outer corner turrets 't' where space allows outside 'W' -->
      <all in="EE/EW" out="**/*t" symmetry="(xy)"/>
      <all steps="1" symmetry="(xy)">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Front doorway 'd', courtyard path, outer gatehouse 'G', and road 'r' to the front edge -->
      <all in="g/h/h/w" out="*/*/z/d" steps="1"/>
      <all in="z/w" out="*/d"/>
      <all in="[zd]/c" out="*/r"/>
      <all in="r/W" out="*/G"/>
      <all in="G/W" out="*/G"/>
      <all in="[drG]/E" out="*/r"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rc" out="*r" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="2"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="z" out="h"/>

      <!-- Courtyard paving texture -->
      <convchain on="c" black="c" white="l" n="2" steps="6">
        <sample>ccll/ccll/llcc/llcc</sample>
      </convchain>
    </sequence>
  </map>

  <color symbol="E" value="#6b7a4f" name="terreno" hidden="True"/>
  <color symbol="H" value="#c8b89a" name="centro" hidden="True"/>
  <color symbol="h" value="#b8a484" name="sala d'ingresso" area="keep"/>
  <color symbol="g" value="#a89474" name="sala della rocca" area="keep"/>
  <color symbol="s" value="#9a8262" name="vano scala" area="keep"/>
  <color symbol="w" value="#7a7670" name="muro del mastio" area="keep"/>
  <color symbol="a" value="#a29278" name="torre di guardia" area="tower"/>
  <color symbol="v" value="#68645e" name="muro della torre" area="tower"/>
  <color symbol="p" value="#8c6848" name="tettoia" area="yard"/>
  <color symbol="d" value="#5a3e28" name="portale" area="keep"/>
  <color symbol="c" value="#948c7c" name="cortile" area="courtyard"/>
  <color symbol="l" value="#827a6c" name="lastricato" area="courtyard"/>
  <color symbol="W" value="#6e6a64" name="cinta muraria" area="courtyard"/>
  <color symbol="t" value="#5e5a54" name="torretta d'angolo" area="tower"/>
  <color symbol="G" value="#64605a" name="corpo di guardia" area="courtyard"/>
  <color symbol="r" value="#8a7e6a" name="strada" area="yard"/>
  <color symbol="z" value="#b8a484" name="passo" hidden="True"/>
</sequence>
