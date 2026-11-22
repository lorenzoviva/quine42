# model.sculpt · piano · gemini-4-argon · 29 s · 7598 token d'ingresso (0 in cache), 2109 d'uscita, 0 di ragionamento · $0.04

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
  Concept: Rocca di confine (border fortress / fortified keep with cellar)
  Parts & Letters:
  - Keep interior (h: front floor, u: back floor with cellar underneath, s: stair zone to upper storey)
  - Keep walls (w: thick stone walls of the main keep)
  - Corner / flank watchtower attached to the keep (t: tower interior, v: tower wall)
  - Side garrison wing / lean-to or annex (a: wing floor, b: wing wall)
  - Forecourt / bailey (c: courtyard paving, C: outer curtain wall, g: gatehouse, p: corner bastion/post, q: well/supply depot)
  - Entry & road (d: main keep door, r: paved road to front edge)
  Where each goes:
  - The main keep sits around H (11 cells wide = 55 voxels interior width, 6-7 cells deep = 30-35 voxels interior depth), with u in the back rows (at least 45x15 voxels for part-cellar, 10+ voxels away from front wall) and s along the front-left/front wall clear of the cellar stair.
  - A watchtower (v/t) projects from a back corner of the keep (seed decides which side/depth).
  - A side wing (b/a) projects from the side of the keep.
  - At Large (20x20 plan): Keep + watchtower + side wing + small front forecourt + road to edge.
  - At Huge (30x30 plan) and Gargantuan: An outer curtain wall (C) with corner bastions (p), a gatehouse (g), an expanded bailey courtyard (c), and a courtyard supply house / well (q) fit in the extra surrounding space.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhuswdtabvcCgpqr" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main Keep interior: 11 cells wide (55 voxels), 6 or 7 cells deep (30-35 voxels) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="5"/>
      <prl in="H" out="h"/>

      <!-- Keep walls -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Flank watchtower on one of the back corners (seed chooses left or right, and depth) -->
      <one in="EEw/EEw/EEw" out="t**/t**/t**" symmetry="(x)" steps="1"/>
      <all in="tE" out="*t" symmetry="(x)" steps="1"/>
      <prl in="E/t" out="t/*" p="0.5" steps="1" symmetry="()"/>
      <all in="t[Ew]" out="*v"/>
      <all in="v[Ew]/*v" out="*v/**"/>
      <!-- Connect tower interior to keep interior -->
      <all in="tvwh" out="ttth" symmetry="(x)"/>

      <!-- Side garrison wing on the opposite or lower side wall (seed chooses position) -->
      <one in="wEE/wEE/wEE/wEE" out="*aa/*aa/*aa/*aa" symmetry="(x)" steps="1"/>
      <prl in="a/E" out="*/a" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*b"/>
      <all in="bE/*b" out="*b/**"/>
      <!-- Connect wing interior to keep interior -->
      <all in="hwb" out="hha" symmetry="(x)"/>

      <!-- Mark back rows of keep interior as 'u' (cellar zone: 55 voxels wide x 15-20 deep, 15 voxels back from front wall) -->
      <all in="w/h/h/h/h" out="*/u/u/u/*" symmetry="()"/>

      <!-- Mark stair zone 's' (4 cells = 20 voxels along x, 2 cells = 10 voxels along y) in front half with 2 cells landing before it -->
      <one in="whhhhhhhhhhhw/whhhhhhhhhhhw" out="***ssss******/***ssss******" symmetry="()" steps="1"/>

      <!-- Front courtyard / bailey in front of keep -->
      <all in="[wbv]/E" out="*/c" symmetry="()" steps="2"/>
      <all in="cE" out="*c" symmetry="(x)" steps="2"/>

      <!-- At Huge (where at least 5 cells of E remain around the keep and yard), expand yard and build outer curtain wall C with bastions p -->
      <all in="cEEEEE" out="*ccc**" symmetry="(xy)" steps="1"/>
      <all in="E/E/E/E/[wvb]" out="*/C/c/c/*" symmetry="()" steps="1"/>
      <all in="[wvb]EEEE" out="*ccC*" symmetry="(x)" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="c/E/E" out="*/C/*" symmetry="()"/>
      <all in="cEE" out="*C*" symmetry="(x)"/>
      <all in="CE/*C" out="*C/**"/>

      <!-- Corner bastions 'p' on outer curtain wall corners (only appears at Huge+) -->
      <all in="EE/EC" out="pp/pp"/>
      <all in="p[EC]" out="*p" steps="1"/>
      <all in="p*/*[EC]" out="**/*p" steps="1"/>

      <!-- Courtyard well/supply Feature 'q' in a 3x3 clear courtyard space (appears where courtyard is big enough) -->
      <one in="ccc/ccc/ccc" out="***/ *q*/***" steps="1"/>

      <!-- Main door 'd' centered on front keep wall, gatehouse 'g' through outer curtain wall, and road 'r' to front edge -->
      <one in="hhhhh/wwwww/ccccc" out="*****/ *ddd*/*rrr*" symmetry="()" steps="1"/>
      <all in="r/c" out="*/r" symmetry="()"/>
      <all in="r/[CE]" out="*/r" symmetry="()"/>
      <all in="Cr" out="gr" symmetry="(x)" steps="1"/>
      <all in="Cg" out="gg" symmetry="(x)" steps="1"/>
    </sequence>
  </map>

  <color symbol="E" value="#7a8c56" name="erba" hidden="True"/>
  <color symbol="H" value="#8c7b65" name="centro"/>
  <color symbol="h" value="#b89f7d" name="sala della rocca" area="keep"/>
  <color symbol="u" value="#9e8566" name="sala sopra la cantina" area="keep"/>
  <color symbol="s" value="#d4b483" name="scala interna" area="keep"/>
  <color symbol="w" value="#6e7075" name="muro del mastio" area="keep"/>
  <color symbol="d" value="#5c3a21" name="portone" area="keep"/>
  <color symbol="t" value="#a38c6b" name="interno della torre" area="tower"/>
  <color symbol="v" value="#585a5e" name="muro della torre" area="tower"/>
  <color symbol="a" value="#bfa786" name="ala di guardia" area="keep"/>
  <color symbol="b" value="#7a7c80" name="muro dell'ala" area="keep"/>
  <color symbol="c" value="#9c9588" name="cortile d'armi" area="courtyard"/>
  <color symbol="C" value="#636569" name="cinta muraria" area="courtyard"/>
  <color symbol="g" value="#4f5154" name="corpo di guardia" area="courtyard"/>
  <color symbol="p" value="#4a4c4f" name="torretta d'angolo" area="tower"/>
  <color symbol="q" value="#596e73" name="cisterna del cortile" area="courtyard"/>
  <color symbol="r" value="#877f72" name="strada lastricata" area="yard"/>
</sequence>
