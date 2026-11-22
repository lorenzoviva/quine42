# model.sculpt · piano · gemini-4-argon · 23 s · 8775 token d'ingresso (0 in cache), 1798 d'uscita, 0 di ragionamento · $0.04

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
  Concept: Rocca di confine (border stronghold with cellar)
  Parts & Letters:
  - Keep interior: h (front ground hall), b (back ground room over cellar D), s (stair zone to 2nd floor)
  - Keep wall: w
  - Keep bastion / watchtower: a (interior), v (wall), attached to a side or back of the keep
  - Courtyard: c (paved yard), l (stone pattern via convchain)
  - Curtain wall & outer defenses (fit at Huge & Gargantuan): W (curtain wall), t (corner towers), G (gatehouse)
  - Entrance & Road: d (keep door), n (yard path), r (road to the front edge)
  - Cellar: dug under back room 'b' (at least 9x3 plan cells = 45x15 voxels, 10+ voxels back from front wall)
  What seeds change: depth of the keep, side and position of the watchtower bastion, number/placement of corner towers, yard paving texture.
  What fits by size:
  - Large (20x20 plan): Keep (11x9) with cellar under back room, side watchtower bastion, front paved yard and road.
  - Huge (30x30 plan): Surrounded by an expanded courtyard, outer curtain wall (W), gatehouse (G), and corner watchtowers (t).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhbswavclWtGdnr" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Main Keep core: 9 wide (4 each side of H), 3 behind, 3 in front (+1 by seed chance behind) -->
      <all in="E/[Hh]" out="b/*" symmetry="()" steps="3"/>
      <prl in="E/b" out="b/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hhb]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="b[Hh]" out="*b" symmetry="(x)"/>
      <prl in="H" out="h"/>

      <!-- Keep walls -->
      <all in="[hb]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone in back room against the back wall, climbing toward +x, with landing before it -->
      <one in="wwwwwwwww/wbbbbbbbw/wbbbbbbbw" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- 2. Attached Watchtower Bastion on left or right side of the keep -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/*a/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- 3. Courtyard around the keep and bastion -->
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand courtyard where space allows (Huge / Gargantuan) -->
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 4. Outer Curtain Wall and Corner Towers where space allows (Huge / Gargantuan) -->
      <all in="cEE" out="*WE" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="cE/WW" out="*W/**" symmetry="(xy)"/>

      <!-- Corner towers on outer corners of the curtain wall -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 5. Entrance axis from keep center straight to the front edge -->
      <all in="b/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/[hw]" out="*/d" symmetry="()"/>
      <all in="d/b" out="*/h" symmetry="()"/>
      <all in="d/h" out="*/h" symmetry="()" steps="2"/>
      <all in="[hd]/w" out="*/d" symmetry="()"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[ndGr]/E" out="*/r" symmetry="()"/>

      <!-- Widen door, path, gatehouse and road to 3 cells -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="r[Ec]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Texture the courtyard paving -->
      <convchain on="c" black="c" white="l" n="2" steps="6">
        <sample>cccll/cccll/clllc/llccc/llccc</sample>
      </convchain>
    </sequence>
  </map>

  <color symbol="E" value="#7a8c56" name="terra di confine"/>
  <color symbol="H" value="#9e8c70" name="centro"/>
  <color symbol="h" value="#b8a484" name="sala di guardia" area="keep"/>
  <color symbol="b" value="#a69272" name="sala sopra la cantina" area="keep"/>
  <color symbol="s" value="#8c7355" name="vano scala" area="keep"/>
  <color symbol="w" value="#75706b" name="muro del mastio" area="keep"/>
  <color symbol="a" value="#9c8a6e" name="interno del torrione" area="tower"/>
  <color symbol="v" value="#635e59" name="muro del torrione" area="tower"/>
  <color symbol="c" value="#948d81" name="cortile lastricato" area="courtyard"/>
  <color symbol="l" value="#827b70" name="pietra del cortile" area="courtyard"/>
  <color symbol="W" value="#6b6661" name="cinta muraria" area="courtyard"/>
  <color symbol="t" value="#59544f" name="torre d'angolo" area="tower"/>
  <color symbol="G" value="#7d7772" name="corpo di guardia" area="courtyard"/>
  <color symbol="d" value="#634832" name="soglia del mastio" area="keep"/>
  <color symbol="n" value="#a89f91" name="via del cortile" area="courtyard"/>
  <color symbol="r" value="#8f8371" name="strada di accesso" area="yard"/>
</sequence>
