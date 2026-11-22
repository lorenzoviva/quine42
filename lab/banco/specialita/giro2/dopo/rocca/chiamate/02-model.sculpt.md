# model.sculpt · intero · gemini-4-argon · 40 s · 11920 token d'ingresso (0 in cache), 4562 d'uscita, 0 di ragionamento · $0.07

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

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra di confine, b sala sopra la cantina, w muro del mastio, a interno del torrione, v muro del torrione, c cortile lastricato, l pietra del cortile, W cinta muraria, t torre d'angolo, G corpo di guardia, d soglia del mastio, n via del cortile, r strada di accesso
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEtttEEEEEEEEEEEEttt
EEtttWWWWWWWWWWWWttt
EEttclccccccccccccct
EEEWclcccccccllccccE
EEEWcccccccccccccccE
EEEWcccccccccccccccE
EEEWcwwwwwwwwwwwcccE
EEEWcwbbbbbbbbbwcccE
EEEWcdddddddddddvvcE
EEEWcddddddddddaavcE
EEEWcddddddddddaavcE
EEEWcddddddddddaavcE
EEEWcdddddddddddvvcE
EEttcnnnnnnnnnnnccct
EEtttGGGGGGGGGGGWttt
EEtttrrrrrrrrrrrEttt
EEEEErrrrrrrrrrrEEEE
EEEEErrrrrrrrrrrEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra di confine, b sala sopra la cantina, w muro del mastio, a interno del torrione, v muro del torrione, c cortile lastricato, l pietra del cortile, W cinta muraria, t torre d'angolo, G corpo di guardia, d soglia del mastio, n via del cortile, r strada di accesso
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEtttEEEEEEEEEEEEttt
EEtttWWWWWWWWWWWWttt
EEttlccccllccclcccct
EEEWccccclllcccccllE
EEEWccccccccccccclcE
EEEWcccccccccccccccE
EEEWcwwwwwwwwwwwcccE
EEEWcwbbbbbbbbbwcccE
EEEWcdddddddddddvvcE
EEEWlddddddddddaavcE
EEEWlddddddddddaavcE
EEEWcddddddddddaavcE
EEEWcdddddddddddvvcE
EEttcnnnnnnnnnnnccct
EEtttGGGGGGGGGGGWttt
EEtttrrrrrrrrrrrEttt
EEEEErrrrrrrrrrrEEEE
EEEEErrrrrrrrrrrEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra di confine, b sala sopra la cantina, w muro del mastio, a interno del torrione, v muro del torrione, c cortile lastricato, l pietra del cortile, W cinta muraria, t torre d'angolo, G corpo di guardia, d soglia del mastio, n via del cortile, r strada di accesso
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEtttEEEEEEEEEEEEttt
EEtttWWWWWWWWWWWWttt
EEttccccccccccccccct
EEEWcccclccclllccccE
EEEWcccccccccccccccE
EEEWcccccccccccccccE
EEEWcwwwwwwwwwwwvvcE
EEEWcwbbbbbbbbbaavcE
EEEWcddddddddddaavcE
EEEWcddddddddddaavcE
EEEWcdddddddddddvvcE
EEEWcdddddddddddcccE
EEEWcdddddddddddcccE
EEttcnnnnnnnnnnnclct
EEtttGGGGGGGGGGGWttt
EEtttrrrrrrrrrrrEttt
EEEEErrrrrrrrrrrEEEE
EEEEErrrrrrrrrrrEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra di confine, b sala sopra la cantina, w muro del mastio, a interno del torrione, v muro del torrione, c cortile lastricato, l pietra del cortile, W cinta muraria, t torre d'angolo, G corpo di guardia, d soglia del mastio, n via del cortile, r strada di accesso
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEtttEEEEEEEEEEEEEEEEEEEtttE
EEEEtttWWWWWWWWWWWWWWWWWWWtttE
EEEEttcccccccccccccccccccccttE
EEEEEWcccccccccccccccccccccWEE
EEEEEWclccccclcccccccccclccWEE
EEEEEWcllccccccclccccccccccWEE
EEEEEWclccwwwwwwwwwwwccccccWEE
EEEEEWclccwbbbbbbbbbwccccccWEE
EEEEEWccccdddddddddddvvccccWEE
EEEEEWccccddddddddddaavccccWEE
EEEEEWlcccddddddddddaavccccWEE
EEEEEWccccddddddddddaavccccWEE
EEEEEWccccdddddddddddvvccclWEE
EEEEEWcclcnnnnnnnnnnnccccclWEE
EEEEEWccccnnnnnnnnnnnccccccWEE
EEEEEWccccnnnnnnnnnnnccccclWEE
EEEEttccccnnnnnnnnnnnccccccttE
EEEEtttWWWGGGGGGGGGGGWWWWWtttE
EEEEtttEEErrrrrrrrrrrEEEEEtttE
EEEEEEEEEErrrrrrrrrrrEEEEEEEEE
EEEEEEEEEErrrrrrrrrrrEEEEEEEEE
EEEEEEEEEErrrrrrrrrrrEEEEEEEEE
EEEEEEEEEErrrrrrrrrrrEEEEEEEEE
```
How much the plans of the seeds differ: 0.08 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEmhbswavclWtGdnrp" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Main Keep core around H:
           Keep H as center axis marker! Grow 3 behind (b), 3 in front (h), and 4 to each side. -->
      <all in="E/H" out="m/*" symmetry="()" steps="3"/>
      <prl in="E/m" out="m/*" p="0.5" steps="1" symmetry="()"/>
      <all in="H/E" out="*/m" symmetry="()" steps="3"/>
      <prl in="m/E" out="*/m" p="0.5" steps="1" symmetry="()"/>

      <!-- Expand sideways 4 cells to each side (width 9 = 45 voxels); optional +1 on one side by seed -->
      <all in="mE" out="*b" symmetry="(x)" steps="4"/>
      <all in="HE" out="*h" symmetry="(x)" steps="4"/>
      <!-- Front rows become h, back rows stay b -->
      <all in="[Hh]/m" out="*/h" symmetry="()"/>
      <all in="h/[mb]" out="*/h" symmetry="()"/>
      <all in="h[mb]" out="*h" symmetry="(x)"/>
      <prl in="m" out="b"/>

      <!-- Keep walls -->
      <all in="[Hhb]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Entrance axis straight from H to the front wall before turning H into h -->
      <all in="[Hd]/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()"/>
      <all in="dh" out="*h" symmetry="(x)"/>
      <prl in="d/d" out="h/*" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="H" out="h"/>

      <!-- Stair zone in back room against the back wall, 4 along +x and 2 wide, with 2 cells landing before it -->
      <one in="wwwwwwwwwww/wbbbbbbbbbw/wbbbbbbbbbw" out="***********/****ssss***/****ssss***" symmetry="()" steps="1"/>

      <!-- 3. Attached Watchtower Bastion on left, right, or back of the keep (varies strongly by seed) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/*a/*a/*a/**" symmetry="(xy)" steps="1"/>
      <all in="aE" out="*a" symmetry="(xy)" steps="2"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- 4. Lean-to porch / armory shed (p) against a free side of the keep -->
      <one in="wE/wE/wE/wE" out="*p/*p/*p/*p" symmetry="(x)" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>

      <!-- 5. Courtyard around the keep, bastion and lean-to -->
      <all in="[wvp]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand courtyard only where 5+ cells of ground remain (Huge size) -->
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 6. Outer Curtain Wall and Corner Towers where space allows (Huge size) -->
      <all in="cEEE" out="*WEE" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="cE/WW" out="*W/**" symmetry="(xy)"/>

      <!-- Corner towers on outer corners of the curtain wall -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 7. Path across courtyard, gatehouse through curtain wall, road to front edge (3 cells wide) -->
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[ndGr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="r[Ec]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Texture the courtyard paving -->
      <convchain on="c" black="c" white="l" n="2" steps="6">
        <sample>cccll/cccll/clllc/llccc/llccc</sample>
      </convchain>
    </sequence>

    <map scale="5 5 1" values="BEhbswavclWtGdnrpqufFRJKLXYOToNMDVkU#20#21#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="p" out="ppppp/pqqqp/pqqqp/pqqqp/ppppp"/>

      <sequence symmetry="(xy)">
        <!-- Unions for the included parts -->
        <union symbol="+" values="wvWtGK"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="wvWt"/>

        <!-- Mark D under the back room 'b' and 's' on the layer below the soil (z=19) for part-cellar -->
        <all in="b B" out="* D" symmetry="()"/>
        <all in="s B" out="* D" symmetry="()"/>

        <!-- B. THE HEIGHTS -->
        <!-- Keep doorway 'd': floor at z=20, then rises as wall 'w' above floor so part-door can carve into it -->
        <all in="B d" out="w f" steps="1"/>

        <!-- Gatehouse 'G': path at z=20, open gateway 30 high, then masonry bridge from z=51 to 56 -->
        <all in="B G" out="G n" steps="1"/>
        <all in="B G" out="G B" steps="30"/>
        <all in="B G" out="G W" steps="6"/>
        <prl in="G" out="W"/>

        <!-- Keep walls 'w': 2 storeys = 64 high, with window bands X -->
        <all in="B w" out="w *" steps="8"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w *" steps="20"/>
        <all in="B w" out="w X" steps="12"/>
        <all in="B w" out="w *" steps="12"/>

        <!-- Keep interior 'h', 'b', 's': 2 storeys (ground floor f at z=20, slab F at z=52, roof R at z=84) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B b" out="b f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- Stair strip T at z=21 -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B b" out="b B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <!-- 2nd storey slab F at z=52 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B b" out="b F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B b" out="b B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- Ceiling / roof terrace R at z=84 -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="b" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Watchtower bastion walls 'v' and interior 'a': taller than keep (76 high) -->
        <all in="B v" out="v *" steps="42"/>
        <all in="B v" out="v X" steps="12"/>
        <all in="B v" out="v *" steps="22"/>

        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="11"/>
        <prl in="a" out="R"/>

        <!-- Lean-to shed 'p' (floor) and 'q' (posts): 32 clear height, roof J at z=53 -->
        <all in="B p" out="u f" steps="1"/>
        <all in="B u" out="u B" steps="32"/>
        <prl in="u" out="J"/>
        <all in="B q" out="q *" steps="33"/>
        <prl in="q" out="J"/>

        <!-- Outer curtain wall 'W': 24 high -->
        <all in="B W" out="W *" steps="24"/>

        <!-- Corner towers 't': 38 high -->
        <all in="B t" out="t *" steps="38"/>

        <!-- C. FULL SCALE: DOORS, CELLAR, STAIRS, BATTLEMENT, WINDOWS -->
        <!-- Front door seed O where path 'n' meets keep wall 'w' above doorway floor -->
        <all in="w/n" out="O/*" symmetry="()" steps="1"/>
        <all in="w/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Internal door seed O between keep room (f/F) and bastion room through wall 'v' -->
        <one in="fvvvvvf" out="*OOOOO*" symmetry="(xy)" steps="1"/>
        <one in="FvvvvvF" out="*OOOOO*" symmetry="(xy)" steps="1"/>
        <all in="O/v" out="*/O" symmetry="(xy)" steps="5"/>

        <!-- 1. Dig cellar under back room -->
        <import file="part-cellar"/>

        <!-- 2. Build stairs between ground and 2nd floor -->
        <import file="part-stair"/>

        <!-- 3. Build doors -->
        <import file="part-door"/>

        <!-- 4. Battlements and arrow slits on all fortification walls -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 5. Windows in the X bands on keep and bastion facades -->
        <one steps="18">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LXXXXB" out="*LLLL*"/>
        <prl in="X" out="w"/>

        <!-- Chimney / beacon turret on the keep roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: distinct medieval cartoon colours with area tags -->
  <color symbol="E" value="#7a8c56" name="terra di confine"/>
  <color symbol="h" value="#b8a484" name="sala di guardia" area="keep"/>
  <color symbol="b" value="#a69272" name="sala sopra la cantina" area="keep"/>
  <color symbol="s" value="#8c7355" name="vano scala" area="keep"/>
  <color symbol="w" value="#8c857b" name="muro del mastio" area="keep"/>
  <color symbol="a" value="#9c8a6e" name="interno del torrione" area="tower"/>
  <color symbol="v" value="#736c64" name="muro del torrione" area="tower"/>
  <color symbol="c" value="#aba396" name="cortile lastricato" area="courtyard"/>
  <color symbol="l" value="#968e82" name="pietra del cortile" area="courtyard"/>
  <color symbol="W" value="#7d776f" name="cinta muraria" area="courtyard"/>
  <color symbol="t" value="#69635c" name="torre d'angolo" area="tower"/>
  <color symbol="G" value="#7d776f" name="corpo di guardia" area="courtyard"/>
  <color symbol="d" value="#634832" name="soglia del mastio" area="keep"/>
  <color symbol="n" value="#bfb7a8" name="via del cortile" area="courtyard"/>
  <color symbol="r" value="#9e927f" name="strada di accesso" area="yard"/>
  <color symbol="p" value="#947856" name="tettoia delle armi" area="yard"/>
  <color symbol="q" value="#5c4328" name="pilastro di legno" area="yard"/>
  <color symbol="f" value="#8f6d48" name="pavimento di tavole" area="keep"/>
  <color symbol="F" value="#826240" name="solaio di legno" area="keep"/>
  <color symbol="R" value="#70583c" name="terrazza del mastio" area="keep"/>
  <color symbol="J" value="#9e4733" name="tetto della tettoia" area="yard"/>
  <color symbol="K" value="#59534d" name="camino di pietra" area="keep"/>
  <color symbol="L" value="#36454f" name="finestra" area="keep"/>
  <color symbol="O" value="#6b4423" name="porta di quercia" area="keep"/>
  <color symbol="o" value="#4a2e16" name="assi della porta" area="keep"/>
  <color symbol="N" value="#59534d" name="stipite di pietra" area="keep"/>
  <color symbol="M" value="#8c857b" name="merlo" area="keep"/>
  <color symbol="U" value="#2b2927" name="feritoia" area="keep"/>
  <color symbol="T" value="#826240" name="gradini" area="keep"/>
  <color symbol="k" value="#9c7a54" name="scalini di legno" area="keep"/>
  <color symbol="D" value="#635c54" name="lastricato della cantina" area="keep"/>
  <color symbol="V" value="#524c46" name="muro della cantina" area="keep"/>
  <color symbol="#20" hidden="True" name="porta aperta"/>
  <color symbol="#21" hidden="True" name="assi aperte"/>

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
</sequence>
```
