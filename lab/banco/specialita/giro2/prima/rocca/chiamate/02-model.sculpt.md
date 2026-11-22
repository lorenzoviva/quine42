# model.sculpt · intero · gemini-4-argon · 50 s · 9994 token d'ingresso (0 in cache), 5342 d'uscita, 0 di ragionamento · $0.07

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

## Your program so far
<!--
  Rocca di confine (border stronghold with cellar):
  - Main keep (mastio): front hall `h`, back room over cellar `z`, stair zone `s` along the back wall, thick stone walls `w`.
    Interior width is 9 cells (45 voxels >= 44 for part-cellar), depth 7-8 cells (35-40 voxels).
    `z` is 4-5 cells deep (20-25 voxels >= 14) and stays 3 cells (15 voxels >= 10) back from the front wall.
  - Corner towers `t` on the rear corners of the keep, plus a bastion wing `a` (walls `v`) on one side chosen by the seed.
  - A timber lean-to / armory porch `p` (20 voxels deep) against the keep or court.
  - At Large (20x20): the keep, rear corner towers, side bastion wing, front courtyard `c` with low wall `u`, gate `g` and road `r`.
  - At Huge (30x30): the courtyard `c` expands around the keep, enclosed by an outer curtain wall `W` with corner watchtowers `q`,
    a fortified gatehouse `G`, a well `Q` and a side barracks/lean-to shelter `p` in the outer ward.
-->
<sequence values="BHEhzwstvacuWqgGdrpQ" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhzwstvacuWqgGdrpQ" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main keep interior around H: 4 behind, 2 in front (+1 by chance), 4 to each side (width 9 = 45 voxels) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Keep walls w -->
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Rear corner towers t (3x3 cells = 15x15 voxels) on back corners of keep -->
      <all in="Ew/w[Hh]" out="t*/**" symmetry="(x)" steps="1"/>
      <all in="t[Ew]" out="*t" steps="1"/>
      <all in="t*/*[Ew]" out="**/*t" steps="1"/>
      <all in="t[Ew]" out="*t" steps="1"/>
      <all in="t*/*[Ew]" out="**/*t" steps="1"/>

      <!-- Side bastion wing a with walls v on one side of the keep (seed decides left or right and depth) -->
      <one in="Ew/Ew/Ew/Ew" out="**/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <prl in="aE" out="*a" p="0.5" steps="1" symmetry="(x)"/>
      <all in="E/a" out="a/*" symmetry="()" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Front forecourt c and lean-to porch p on the opposite side of the keep or front -->
      <all in="[wv]/E" out="*/c" symmetry="()" steps="2"/>
      <all in="cE" out="*c" symmetry="(x)" steps="1"/>

      <!-- At Huge, where at least 5 cells of E remain around, expand the outer ward c around the keep -->
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="[wvt]EEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Outer curtain wall W around the expanded ward at Huge, or low parapet wall u at Large -->
      <all in="cEE" out="*W*" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="cE" out="*u"/>
      <all in="uE/*u" out="*u/**"/>

      <!-- Outer corner watchtowers q on convex corners of the curtain wall W (occurs at Huge) -->
      <all in="EE/EW" out="**/*q"/>
      <all steps="2">
        <rule in="q[EWu]" out="*q"/>
        <rule in="q*/*[EWu]" out="**/*q"/>
      </all>

      <!-- Covered lean-to shelter p (4 cells = 20 voxels deep, 5 cells = 25 voxels wide) in the yard or against wall -->
      <one in="ccccc/ccccc/ccccc/ccccc" out="ppppp/ppppp/ppppp/ppppp" symmetry="(x)" steps="1"/>
      <one in="Ew/Ew/Ew/Ew" out="p*/p*/p*/p*" symmetry="(x)" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="3"/>

      <!-- Well Q in the courtyard if a 3x3 clear space of c exists -->
      <one in="ccc/ccc/ccc" out="***/ *Q* /***" steps="1"/>

      <!-- Mark cellar room z in the back rows of the keep (away from front door, 9 cells = 45 wide, 4 cells = 20 deep) -->
      <all in="w/[Hh]" out="*/z" symmetry="()" steps="1"/>
      <all in="z/[Hh]" out="*/z" symmetry="()" steps="3"/>

      <!-- Stair zone s along the back wall inside z (2 cells from left wall, 4 cells long, 2 wide) -->
      <one in="wzzzzzzzzw/wzzzzzzzzw" out="***ssss***/***ssss***" symmetry="()" steps="1"/>

      <!-- Way out from centre straight to the front edge: door d in keep wall, gatehouse G in curtain wall, road r -->
      <all in="[Hz]/h" out="*/h" symmetry="()" steps="1"/>
      <all in="H" out="h" symmetry="()"/>
      <all in="w/c" out="d/*" symmetry="()" steps="1"/>
      <one in="wdw" out="ddd" symmetry="()" steps="1"/>
      <all in="d/c" out="*/r" symmetry="()"/>
      <all in="r/c" out="*/r" symmetry="()"/>
      <all in="r/W" out="*/G" symmetry="()"/>
      <all in="r/u" out="*/g" symmetry="()"/>
      <all in="[Ggr]/E" out="*/r" symmetry="()"/>
      <all in="rc" out="*r" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="2"/>
      <all in="gu" out="*g" symmetry="(x)" steps="1"/>
    </sequence>
  </map>

  <color symbol="E" value="122,148,96" name="erba"/>
  <color symbol="H" value="196,178,142" name="centro"/>
  <color symbol="h" value="196,178,142" name="sala di guardia"/>
  <color symbol="z" value="176,158,124" name="sala sopra la cantina"/>
  <color symbol="s" value="214,180,112" name="scala interna"/>
  <color symbol="w" value="118,116,112" name="muro del mastio"/>
  <color symbol="t" value="96,94,92" name="torre angolare"/>
  <color symbol="a" value="182,164,132" name="bastione laterale"/>
  <color symbol="v" value="108,106,102" name="muro del bastione"/>
  <color symbol="c" value="168,156,134" name="cortile"/>
  <color symbol="u" value="128,124,118" name="muretto di cinta"/>
  <color symbol="W" value="104,102,98" name="cinta muraria"/>
  <color symbol="q" value="88,86,84" name="torretta di guardia"/>
  <color symbol="g" value="154,138,114" name="varco del cortile"/>
  <color symbol="G" value="92,88,84" name="corpo di guardia"/>
  <color symbol="d" value="138,92,58" name="portone del mastio"/>
  <color symbol="r" value="148,138,120" name="strada lastricata"/>
  <color symbol="p" value="162,118,74" name="tettoia dell'armeria"/>
  <color symbol="Q" value="92,138,168" name="pozzo"/>
</sequence>

## What the game made of it
It does not run: large, seed 1: riga 96, <color>: "value" è un colore esadecimale (rrggbb), non "122,148,96"

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
  Rocca di confine (border stronghold with cellar):
  - Main keep (mastio): front hall `h`, back hall over cellar `z`, stair zone `s` along the front side of `h`, stone walls `w`.
    Interior width is 9 cells (45 voxels >= 44 for part-cellar), depth 7-8 cells (35-40 voxels).
    `z` is 4 cells deep (20 voxels >= 14) and stays 3-4 cells (15-20 voxels >= 10) back from the front wall.
  - Corner towers `t` on the rear corners of the keep, plus a bastion wing `a` (walls `v`) on one side chosen by the seed.
  - A timber lean-to / armory porch `p` (4 cells = 20 voxels deep, 33 clear height) against the side of the keep or courtyard.
  - At Large (20x20): keep, rear corner towers, side bastion wing, lean-to, front courtyard `c` with parapet wall `u`, gate `g` and road `r`.
  - At Huge (30x30): outer courtyard `c` around the keep enclosed by curtain wall `W`, corner watchtowers `q`, gatehouse `G`, and well `Q`.
-->
<sequence values="BHEhzwstvacuWqgGdrpQ" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhzwstvacuWqgGdrpQm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main keep interior around H: 4 behind, 2 in front (+1 by chance), 4 to each side (width 9 = 45 voxels) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Keep walls w -->
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Rear corner towers t (3x3 cells = 15x15 voxels) on back corners of keep -->
      <all in="Ew/w[Hh]" out="t*/**" symmetry="(x)" steps="1"/>
      <all in="t[Ew]" out="*t" steps="1"/>
      <all in="t*/*[Ew]" out="**/*t" steps="1"/>
      <all in="t[Ew]" out="*t" steps="1"/>
      <all in="t*/*[Ew]" out="**/*t" steps="1"/>

      <!-- Side bastion wing a with walls v on one side of the keep (seed decides left or right and depth) -->
      <one in="Ew/Ew/Ew/Ew" out="**/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <prl in="aE" out="*a" p="0.5" steps="1" symmetry="(x)"/>
      <all in="E/a" out="a/*" symmetry="()" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Covered lean-to shelter p (4 cells = 20 voxels deep, 4 cells = 20 voxels wide) on the free side wall -->
      <one in="Ew/Ew/Ew/Ew" out="p*/p*/p*/p*" symmetry="(x)" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="3"/>

      <!-- Front forecourt c -->
      <all in="[wvp]/E" out="*/c" symmetry="()" steps="2"/>
      <all in="cE" out="*c" symmetry="(x)" steps="1"/>

      <!-- At Huge, where at least 5 cells of E remain around, expand the outer ward c around the keep -->
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="[wvtp]EEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Outer curtain wall W around the expanded ward at Huge, or low parapet wall u at Large -->
      <all in="cEE" out="*W*" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="cE" out="*u"/>
      <all in="uE/*u" out="*u/**"/>

      <!-- Outer corner watchtowers q on convex corners of the curtain wall W (occurs at Huge) -->
      <all in="EE/EW" out="**/*q"/>
      <all steps="2">
        <rule in="q[EWu]" out="*q"/>
        <rule in="q*/*[EWu]" out="**/*q"/>
      </all>

      <!-- Well Q in the courtyard if a 3x3 clear space of c exists -->
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"/>

      <!-- Mark cellar room z in the back 4 rows of the keep (9 cells = 45 wide, 4 cells = 20 deep, 15-20 voxels back from front wall) -->
      <all in="w/[Hh]" out="*/z" symmetry="()" steps="1"/>
      <all in="z/[Hh]" out="*/z" symmetry="()" steps="3"/>

      <!-- Stair zone s in the front hall h (right side, 2 cells of landing before it, 4 cells long, 2 wide, clear of cellar opening) -->
      <one in="hhhhhhhhh/hhhhhhhhh/wwwwwwwww" out="****ssss*/****ssss*/*********" symmetry="()" steps="1"/>

      <!-- Way out from centre straight to the front edge: door d in keep wall, gatehouse G in curtain wall, road r -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/c" out="*/r" symmetry="()"/>
      <all in="r/W" out="*/G" symmetry="()"/>
      <all in="r/u" out="*/g" symmetry="()"/>
      <all in="[Ggr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rc" out="*r" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="gu" out="*g" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
    </sequence>

    <map scale="5 5 1" values="BEhzwstvacuWqgGdrpQbfFRYyIJKLCPDTkVOoNMU#20#21#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="Q" out="ccccc/cWWWc/cWQWc/cWWWc/ccccc"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="wvtWquGKP"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="wvtWqG"/>

        <!-- Mark D under the cellar room z at z=19 (first layer under the soil) -->
        <all in="z B" out="* D" symmetry="()"/>

        <!-- Keep walls w: 2 storeys (64 steps) with window bands Y -->
        <all in="B w" out="w *" steps="8"/>
        <all in="B w" out="w Y" steps="12"/>
        <all in="B w" out="w *" steps="20"/>
        <all in="B w" out="w Y" steps="12"/>
        <all in="B w" out="w *" steps="11"/>
        <prl in="w" out="w"/>

        <!-- Door column d: floor at z=20, then wall w above -->
        <all in="B d" out="d f" steps="1"/>
        <all in="B d" out="d w" steps="62"/>
        <prl in="d" out="w"/>

        <!-- Rear corner towers t: 78 steps high with window band Y -->
        <all in="B t" out="t *" steps="46"/>
        <all in="B t" out="t Y" steps="12"/>
        <all in="B t" out="t *" steps="19"/>
        <prl in="t" out="t"/>

        <!-- Side bastion walls v (40 high) and interior platform a (floor f, air, terrace slab F at 32) -->
        <all in="B v" out="v *" steps="10"/>
        <all in="B v" out="v Y" steps="10"/>
        <all in="B v" out="v *" steps="19"/>
        <prl in="v" out="v"/>

        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <prl in="a" out="B"/>

        <!-- Lean-to shelter p and timber posts b: clear height 33 (person 24, >= 30 clear), roof J at 34 -->
        <all in="B b" out="b I" steps="33"/>
        <prl in="b" out="J"/>
        <all in="B p" out="y f" steps="1"/>
        <all in="B y" out="y B" steps="32"/>
        <prl in="y" out="J"/>

        <!-- Outer curtain wall W (26 high), corner watchtowers q (42 high), low parapet u (10 high), well water Q -->
        <all in="B W" out="W *" steps="25"/>
        <prl in="W" out="W"/>
        <all in="B q" out="q *" steps="41"/>
        <prl in="q" out="q"/>
        <all in="B u" out="u *" steps="9"/>
        <prl in="u" out="u"/>
        <all in="B Q" out="Q *" steps="4"/>
        <prl in="Q" out="Q"/>

        <!-- Outer gatehouse G: open gateway below (30 high), stone arch and chamber above up to 46 -->
        <all in="B G" out="G r" steps="1"/>
        <all in="B G" out="G B" steps="30"/>
        <all in="B G" out="G W" steps="14"/>
        <prl in="G" out="W"/>

        <!-- Keep interior floors (h, z, s): ground floor f at z=20, second storey slab F at z=52, roof slab R at z=84 -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B z" out="z f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- Stair strip T at z=21 above s -->
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B z" out="z B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>

        <!-- Second floor slab F at z=52 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B z" out="z F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- Second stair strip T at z=53 above s to reach the roof terrace -->
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B z" out="z B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>

        <!-- Roof terrace R at z=84 -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="z" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Dig cellar under z before part-stair -->
        <import file="part-cellar"/>

        <!-- Build interior stairs -->
        <import file="part-stair"/>

        <!-- Front door seed O where road r meets the keep door wall (at z=21, just above floor/road) -->
        <all in="B r" out="r *" steps="1"/>
        <all in="w/r" out="O/*" symmetry="()" steps="1"/>
        <all in="w/O" out="O/*" symmetry="()" steps="4"/>
        <prl in="r" out="B"/>

        <!-- Interior doorway between keep hall and side bastion wing a -->
        <one in="fwwwwwf" out="*OOOOO*" symmetry="(xy)" steps="1"/>
        <all in="O/w" out="*/O" symmetry="(xy)" steps="4"/>
        <all in="w/O" out="O/*" symmetry="(xy)" steps="4"/>

        <import file="part-door"/>

        <!-- Windows L in the window bands Y on all sides -->
        <one steps="18">
          <rule in="BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY" out="*L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L"/>
        </one>
        <all in="LYYYYB" out="*LLLL*"/>
        <prl in="Y" out="w"/>

        <!-- Battlements and arrow slits on all flat wall tops -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Pitched hip roof J on the lean-to shelter and small watch roof C on rear towers -->
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="6" symmetry="()"/>

        <!-- Stone chimney K on the keep roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>

        <!-- Wooden banner pole I with red banner C on a rear tower -->
        <one in="B B t" out="* I *" steps="1" symmetry="()"/>
        <all in="B I" out="I *" steps="12"/>
        <all in="IB" out="*C" steps="3" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>

  <color symbol="E" hidden="True"/>
  <color symbol="c" value="a89c86" name="cortile" area="courtyard"/>
  <color symbol="r" value="948a78" name="strada lastricata" area="road"/>
  <color symbol="g" value="948a78" name="varco del cortile" area="road"/>
  <color symbol="h" value="b89c72" name="sala di guardia" area="keep"/>
  <color symbol="z" value="b89c72" name="sala del mastio" area="keep"/>
  <color symbol="s" value="b89c72" name="vano scala" area="keep"/>
  <color symbol="a" value="b89c72" name="bastione laterale" area="keep"/>
  <color symbol="p" value="9e8c70" name="tettoia dell'armeria" area="yard"/>
  <color symbol="d" value="b89c72" name="soglia del portone" area="keep"/>
  <color symbol="G" value="948a78" name="passo del corpo di guardia" area="road"/>

  <color symbol="w" value="84827c" name="muro del mastio"/>
  <color symbol="t" value="6e6c66" name="torre angolare"/>
  <color symbol="v" value="787670" name="muro del bastione"/>
  <color symbol="W" value="74726c" name="cinta muraria"/>
  <color symbol="q" value="64625c" name="torretta di guardia"/>
  <color symbol="u" value="8c8880" name="muretto di cinta"/>
  <color symbol="M" value="7c7a74" name="merratura"/>
  <color symbol="U" value="2a2826" name="feritoia"/>
  <color symbol="P" value="7c7a74" name="parapetto"/>
  <color symbol="K" value="645e58" name="camino in pietra"/>

  <color symbol="f" value="9c744c" name="pavimento in tavole"/>
  <color symbol="F" value="8c643e" name="solaio in legno"/>
  <color symbol="R" value="78746e" name="lastrico del terrazzo"/>
  <color symbol="k" value="a67c52" name="gradini"/>
  <color symbol="I" value="6e4c2e" name="trave di quercia"/>
  <color symbol="b" value="6e4c2e" name="pilastro in legno"/>
  <color symbol="J" value="a84a32" name="tetto in coppi"/>
  <color symbol="C" value="b83228" name="stendardo di confine"/>
  <color symbol="L" value="3b4d5e" name="finestra"/>
  <color symbol="Q" value="4a7c9b" name="acqua del pozzo"/>

  <color symbol="D" value="6e6254" name="pavimento della cantina" area="cellar"/>
  <color symbol="V" value="58524a" name="muro della cantina"/>

  <color symbol="O" value="7a4e2d" name="portone in legno"/>
  <color symbol="o" value="54341c" name="assi del portone"/>
  <color symbol="N" value="5e5c56" name="stipite in pietra"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
</sequence>
