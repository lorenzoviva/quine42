# model.sculpt · piano · gemini-4-argon · 30 s · 8775 token d'ingresso (0 in cache), 2484 d'uscita, 0 di ragionamento · $0.04

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
  Concept: Rocca di confine (border stronghold / fortified keep with cellar)
  Parts & Letters:
  - h, q, s: interior floor of the main keep (h = back/rear floor over cellar D; q = front/side floor clear of cellar; s = stair zone, 4x2 along back wall)
  - w: thick stone walls of the main keep
  - b, v: fortified corner bastion tower (b = interior floor, v = bastion walls), placed on one or two rear/side corners by seed
  - a, u: side armory / guard annex wing (a = interior floor, u = wing walls), grown on a side at random
  - p: covered wooden lean-to / porch along the front or side wall
  - c, l: inner bailey courtyard around the keep (textured with convchain flagstones l and dirt c)
  - W: outer curtain wall enclosing the bailey (fits at Huge and Gargantuan where ground extends past the keep)
  - t: outer watchtowers on the corners of the curtain wall (at Huge / Gargantuan)
  - G: fortified gatehouse through the outer curtain wall
  - d: main keep doorway (3 cells wide at front center)
  - n, r: paved approach road from the keep door through the bailey and gatehouse to the map edge
  What seeds change: depth of the keep (4 or 5 cells behind H), which side or corner gets the tall bastion tower (b/v) and the low annex wing (a/u), courtyard flagstone patterns.
  What fits by size:
  - Large (20x20 plan): the main keep (11x9 cells interior, 55x45 voxels, giving >45x20 room for the cellar D in the back), corner bastion tower, side annex or front lean-to, road to front edge.
  - Huge (30x30 plan) & Gargantuan (100x100 plan): surrounded by a stone-paved bailey courtyard (c/l), an outer curtain wall (W) with corner watchtowers (t), a gatehouse (G), and a wooden lean-to shed (p) inside the bailey.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhqswbvaucpWtlGdnrm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main keep interior: 5 cells wide each side of H (11 cells = 55 voxels wide along x) -->
      <!-- 4 to 5 cells behind H (h: cellar zone, 20-25 voxels deep), 3 cells in front of H (q: front zone, 15 voxels deep) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/q" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="5"/>
      <all in="qE" out="*q" symmetry="(x)" steps="5"/>

      <!-- Keep walls w -->
      <all in="[hq]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Corner bastion tower (v/b) on a rear corner of the keep -->
      <one in="EEw/EEw/www" out="bbv/bbv/vvv" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="1"/>
      <all in="E/b" out="b/*" symmetry="()" steps="1"/>
      <all in="bE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Guard annex wing (u/a) on a side wall of the keep, where space allows -->
      <one in="EEw/EEw/EEw/EEw" out="aau/aau/aau/aau" symmetry="(x)" steps="1"/>
      <all in="aE" out="*u"/>
      <all in="uE/*u" out="*u/**"/>

      <!-- Stair zone s (4 cells along x, 2 cells along y) against the back wall, with 2 cells landing on small-x -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/w**ssss*/w**ssss*" symmetry="()" steps="1"/>

      <!-- Keep front door d (3 cells wide) and road axis m -->
      <all in="H/q" out="*/m" symmetry="()" steps="3"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="q"/><rule in="H" out="q"/></prl>

      <!-- Ensure front 2 rows of interior are q (so cellar D under h stays >=10 voxels back from front wall and clear of stair s) -->
      <all in="h/w" out="q/*" symmetry="()" steps="1"/>
      <all in="h/q" out="q/*" symmetry="()" steps="1"/>

      <!-- Outer bailey courtyard c and curtain wall W where ground E extends at least 4 cells around the keep (fits at Huge & Gargantuan) -->
      <all in="[wvu]EEEE" out="*ccc*" steps="1"/>
      <all in="cE/*c" out="*c/**" steps="12"/>
      <all in="c[wvu]/*E" out="**/*c" steps="6"/>
      <all in="cE/*c" out="*c/**" steps="12"/>

      <!-- Expand courtyard further if even more ground exists -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**" steps="20"/>

      <!-- Wooden lean-to / porch p against keep wall inside the courtyard (or front if no courtyard) -->
      <one in="wwww/cccc/cccc" out="****/pppp/pppp" symmetry="(xy)" steps="1"/>
      <one in="www/EEE/EEE" out="***/ppp/ppp" symmetry="(x)" steps="1"/>

      <!-- Outer curtain wall W around courtyard c -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner watchtowers t on outer corners of curtain wall W -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Road and Gatehouse G from front door d straight to the front edge -->
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/[Wt]" out="*/G" symmetry="()"/>
      <all in="[ndGr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="G[Wt]" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Courtyard texture with flagstones l -->
      <convchain on="c" black="c" white="l" n="2" steps="6">
        <sample>cccll/cccll/clllc/lllcc/cllcc</sample>
      </convchain>
    </sequence>
  </map>

  <color symbol="E" value="122,138,88" name="erba di confine"/>
  <color symbol="H" value="140,115,85" name="centro rocca"/>
  <color symbol="h" value="148,120,88" name="sala superiore" area="keep"/>
  <color symbol="q" value="156,128,94" name="ingresso rocca" area="keep"/>
  <color symbol="s" value="132,102,72" name="vano scala" area="keep"/>
  <color symbol="w" value="130,126,120" name="muro del mastio" area="keep"/>
  <color symbol="b" value="142,114,84" name="interno torrione" area="tower"/>
  <color symbol="v" value="116,112,108" name="muro del torrione" area="tower"/>
  <color symbol="a" value="150,122,90" name="armeria laterale" area="keep"/>
  <color symbol="u" value="124,120,114" name="muro armeria" area="keep"/>
  <color symbol="p" value="164,132,88" name="tettoia in legno" area="yard"/>
  <color symbol="c" value="136,128,104" name="cortile d'armi" area="courtyard"/>
  <color symbol="l" value="152,148,138" name="lastricato del cortile" area="courtyard"/>
  <color symbol="W" value="118,114,108" name="cinta muraria" area="courtyard"/>
  <color symbol="t" value="106,102,96" name="torretta di guardia" area="tower"/>
  <color symbol="G" value="128,122,114" name="corpo di guardia" area="courtyard"/>
  <color symbol="d" value="110,82,54" name="portale del mastio" area="keep"/>
  <color symbol="n" value="160,154,142" name="via lastricata" area="courtyard"/>
  <color symbol="r" value="146,140,126" name="strada di confine" area="yard"/>
  <color symbol="m" value="156,128,94" name="asse ingresso"/>
</sequence>
