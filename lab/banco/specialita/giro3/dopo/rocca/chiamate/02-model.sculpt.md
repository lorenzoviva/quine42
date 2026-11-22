# model.sculpt · intero · gemini-4-argon · 43 s · 12232 token d'ingresso (0 in cache), 4975 d'uscita, 0 di ragionamento · $0.07

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

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h sala d'ingresso, g sala della rocca, w muro del mastio, a torre di guardia, v muro della torre, p tettoia, c cortile, l lastricato, W cinta muraria, t torretta d'angolo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
tttEEEEEEEEEEEEEEttt
tttWWWWWWWWWWWWWWttt
tcclllllllllllllllct
EcvvvcccccccccllllcE
EcvvawwwwwwwwwwwclcE
EcvvaagggggggggwclcE
EcvaaagggggggggwlccE
EcvaaagggggggggwlccE
EcvaawhhhhhhhhhwlccE
EcvvvwhhhhhhhhhwppcE
EccclwhhhhhhhhhwppcE
EccclwhhhhhhhhhwppcE
EccclwwwwwwwwwwwcccE
EccclcccccllcccccccE
EccclccccccclllllccE
tccclcclllllccccccct
tttWWWWWWWWWWWWWWttt
tttEEEEEEEEEEEEEEttt
EEEEEEEEEEEEEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h sala d'ingresso, g sala della rocca, w muro del mastio, a torre di guardia, v muro della torre, p tettoia, c cortile, l lastricato, W cinta muraria, t torretta d'angolo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
tttEEEEEEEEEEEEEEttt
tttWWWWWWWWWWWWWWttt
tllllccccllccccclllt
ElvvvccccllccccclllE
ElvvawwwwwwwwwwwlclE
ElvvaagggggggggwlclE
ElvaaagggggggggwlclE
ElvaaagggggggggwpplE
ElvaawhhhhhhhhhwpplE
ElvvvwhhhhhhhhhwpplE
EllccwhhhhhhhhhwcclE
EllccwhhhhhhhhhwcclE
EllccwwwwwwwwwwwcclE
ElcllllccccllllllllE
ElcccccllllccllllllE
tlcccccllllcccccccct
tttWWWWWWWWWWWWWWttt
tttEEEEEEEEEEEEEEttt
EEEEEEEEEEEEEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h sala d'ingresso, g sala della rocca, w muro del mastio, a torre di guardia, v muro della torre, p tettoia, c cortile, l lastricato, W cinta muraria, t torretta d'angolo
Plan (the letter of every cell):
```
tttEEEEEEEEEEEEEEEEE
tttWWWWWWWWWWWWWWWWW
ttcccccccllclllllllc
EWcccccllcclcccccccc
EWcclllllccccccccccc
EWcclwwwwwwwwwwwcccc
EWcclwgggggggggwclll
EWcclwgggggggggwclll
EWcclwgggggggggwvvvl
EWcclwhhhhhhhhhwaavl
EWcppwhhhhhhhhhaaavl
EWcppwhhhhhhhhhaaavl
EWcppwhhhhhhhhhaaavl
EWcccwwwwwwwwwwwavvl
EWcccclllllllcclvvvl
EWcccclcccccccclcccl
EWcccclccccccccclllc
ttccccllllllllllcccc
tttWWWWWWWWWWWWWWWWW
tttEEEEEEEEEEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h sala d'ingresso, g sala della rocca, w muro del mastio, a torre di guardia, v muro della torre, p tettoia, c cortile, l lastricato, W cinta muraria, t torretta d'angolo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEtttEEEEEEEEEEEEEEEEEEEEtttEE
EEtttWWWWWWWWWWWWWWWWWWWWtttEE
EEttlllcccccclllcccclllcccttEE
EEEWcclllllllcccllcclllcccWEEE
EEEWlllllllllccccclllllcccWEEE
EEEWcccvvvcccccccclllllcccWEEE
EEEWclcvvawwwwwwwwwwwcccccWEEE
EEEWclcvvaagggggggggwlllllWEEE
EEEWclcvaaagggggggggwlllllWEEE
EEEWclcvaaagggggggggwlllllWEEE
EEEWlccvaawhhhhhhhhhwcccclWEEE
EEEWlccvvvwhhhhhhhhhwppcclWEEE
EEEWlcccclwhhhhhhhhhwppcclWEEE
EEEWlllcclwhhhhhhhhhwppcclWEEE
EEEWccclclwwwwwwwwwwwcccclWEEE
EEEWccclclcllclllcccccccclWEEE
EEEWcccllclccclllcccclllllWEEE
EEttccclllccccccccccclllllttEE
EEtttWWWWWWWWWWWWWWWWWWWWtttEE
EEtttEEEEEEEEEEEEEEEEEEEEtttEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.48 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

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
    W: outer curtain wall enclosing the bailey at Huge (only where space around the courtyard allows).
    t: corner watch-turrets on the outer curtain wall at Huge.
    G: outer gatehouse on the front axis through the curtain wall.
    r: paved road from the front door (and gatehouse) straight to the front edge of the box.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhgswavpdclWtGrz" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- Mark center line for front door alignment before H turns into h -->
      <all in="E/[Hh]" out="h/*" steps="4"/>
      <all in="H/E" out="*/z" steps="1"/>
      <all in="z/E" out="*/z" steps="1"/>
      <prl in="z/E" out="*/z" p="0.5" steps="1"/>
      <all in="[Hhz]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Keep walls -->
      <all in="[Hhz]E" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- Front door 'd' on the front wall directly in front of the center line 'z' -->
      <all in="z/w" out="*/d"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="z" out="h"/>
      <prl in="H" out="h"/>

      <!-- Split keep floor into back zone 'g' (3 rows = 15 voxels deep, 45 voxels wide for cellar D) and front zone 'h' (at least 3 rows = 15 voxels deep) -->
      <all in="w/h" out="*/g" steps="1"/>
      <all in="g/h" out="*/g" steps="2"/>

      <!-- Stair zone 's' in the front hall 'h' along the right side of the front wall (4 cells along x, 2 along y, with landing to its left) -->
      <all in="hhhhhhhhh/hhhhhhhhh/wwwdddwww" out="*****ssss/*****ssss/*********" steps="1"/>

      <!-- Attached bastion tower ('a' interior, 'v' wall) on one side of the keep, varied by seed -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="**/*a/*a/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <prl in="aE" out="*a" p="0.5" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" steps="1"/>
      <all in="a/E" out="*/a" steps="1"/>
      <all in="aE" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>

      <!-- Lean-to shelter ('p') on the available side wall (4 cells along y = 20 voxels, 4 cells along x = 20 voxels) -->
      <one in="wEEE/wEEE/wEEE/wEEE/wEEE/wEEE" out="****/*ppp/*ppp/*ppp/*ppp/****" symmetry="(x)" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>

      <!-- Inner courtyard ring around the keep, tower, and lean-to -->
      <all in="[wvpd]E" out="*c" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- At Huge/Gargantuan, where at least 6 cells of free ground remain on all sides beyond 'c', expand courtyard and build outer curtain wall 'W' -->
      <all in="cEEEEEE" out="*ccc***" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="cEEE" out="*WEE" symmetry="(xy)" steps="1"/>
      <all in="WE/*W" out="*W/**" symmetry="(xy)"/>

      <!-- Outer corner turrets 't' where space allows outside 'W' -->
      <all in="EE/EW" out="**/*t" symmetry="(xy)"/>
      <all steps="1" symmetry="(xy)">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Front path from 'd', outer gatehouse 'G', and road 'r' to the front edge -->
      <all in="[dr]/c" out="*/r"/>
      <all in="r/W" out="*/G"/>
      <all in="G/W" out="*/G"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="[drG]/E" out="*/r"/>

      <!-- Courtyard paving texture -->
      <convchain on="c" black="c" white="l" n="2" steps="6">
        <sample>ccll/ccll/llcc/llcc</sample>
      </convchain>
    </sequence>

    <map scale="5 5 1" values="BEhgswavpdclWtGrfFWVJLYKPbqDRQTCUuOMNo#20#21Tk#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>

      <sequence symmetry="()">
        <!-- Unions for the included seed parts -->
        <union symbol="+" values="WVJ"/>
        <union symbol="=" values="fFR"/>
        <union symbol="%" values="WVJ"/>

        <!-- Mark cellar D on the layer just under the soil (z=19) beneath 'g' -->
        <all in="g B" out="* D"/>

        <!-- B. Heights: columns by steps -->
        <!-- Main keep walls 'w' and door wall 'd': 2 storeys (64 high) + roof slab level (65 high) with window bands Y -->
        <all steps="8"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w Y"/></all>
        <all steps="12"><rule in="B d" out="d W"/></all>
        <all steps="20"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="12"><rule in="B w" out="w Y"/><rule in="B d" out="d Y"/></all>
        <all steps="13"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <prl><rule in="w" out="W"/><rule in="d" out="W"/></prl>

        <!-- Keep interior 'h', 'g', and stair zone 's': floor at z=20, slab at z=52, roof terrace slab at z=84 -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B g" out="g f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- First flight of stairs strip T at z=21 -->
        <all in="B s" out="s T" steps="1"/>
        <all steps="30"><rule in="B s" out="s B"/></all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B g" out="g B"/>
        </all>
        <!-- Second storey slab at z=52 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B g" out="g F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- Second flight of stairs strip T at z=53 (on 'g' so it doesn't collide with first flight opening) -->
        <one in="FFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFF/FFFFFFFFFFFFFFFFFFFF Bgggggggggggggggggggg/Bgggggggggggggggggggg/Bgggggggggggggggggggg" out="********************/********************/******************** ****TTTTTTTTTTTTTTTT/****TTTTTTTTTTTTTTTT/********************" steps="1"/>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B g" out="g B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- Roof terrace slab at z=84 -->
        <all steps="1">
          <rule in="B h" out="h R"/>
          <rule in="B g" out="g R"/>
          <rule in="B s" out="s R"/>
        </all>
        <prl><rule in="h" out="B"/><rule in="g" out="B"/><rule in="s" out="B"/></prl>

        <!-- Bastion tower walls 'v': 77 high (taller than keep) with window bands -->
        <all in="B v" out="v V" steps="10"/>
        <all in="B v" out="v Y" steps="10"/>
        <all in="B v" out="v V" steps="22"/>
        <all in="B v" out="v Y" steps="10"/>
        <all in="B v" out="v V" steps="25"/>
        <prl in="v" out="V"/>

        <!-- Bastion tower interior 'a': floor at z=20, slab at z=52, upper roof at z=84 -->
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a R" steps="1"/>
        <prl in="a" out="B"/>

        <!-- Lean-to shelter 'p' and posts 'b': floor at z=20, posts rise 32, roof Q at z=53 (32 clear height >= 30 required) -->
        <all in="B p" out="q f" steps="1"/>
        <all in="B q" out="q B" steps="32"/>
        <all in="B q" out="q Q" steps="1"/>
        <prl in="q" out="B"/>
        <all in="B b" out="b f" steps="1"/>
        <all in="B b" out="b P" steps="32"/>
        <all in="B b" out="b Q" steps="1"/>
        <prl in="b" out="B"/>
        <!-- Hollow inner posts so only outer edge posts remain -->
        <all in="fPf" out="fBf" symmetry="(xy)"/>
        <all in="BPB" out="BBB" symmetry="(xy)"/>

        <!-- Outer curtain wall 'W' (24 high), corner turrets 't' (36 high), gatehouse 'G' (42 high) -->
        <all in="B W" out="W J" steps="24"/>
        <prl in="W" out="J"/>
        <all in="B t" out="t V" steps="36"/>
        <prl in="t" out="V"/>
        <all in="B G" out="G V" steps="42"/>
        <prl in="G" out="V"/>

        <!-- C. Full scale: doors, cellar, stairs, battlements, slits, windows, details -->
        <!-- Front keep door seed 'O' where road 'r' meets front wall 'W' at z=20 -->
        <all in="W/r" out="O/*" steps="1"/>
        <all in="W/O" out="O/*" steps="4"/>

        <!-- Outer gatehouse archway 'O' where road 'r' meets gatehouse 'V' at z=20 -->
        <all in="V/r" out="O/*" steps="1"/>
        <all in="V/O" out="O/*" steps="9"/>

        <!-- Internal doorway between keep ('f') and bastion tower ('f') through wall 'W'/'V' at z=20 and z=52 -->
        <one in="f/W/W/W/W/W/V/V/V/V/V/f" out="*/O/O/O/O/O/O/O/O/O/O/*" symmetry="(xy)" steps="1"/>
        <all in="O[WV]" out="OO" symmetry="(xy)" steps="5"/>
        <one in="F/W/W/W/W/W/V/V/V/V/V/F" out="*/O/O/O/O/O/O/O/O/O/O/*" symmetry="(xy)" steps="1"/>
        <all in="O[WV]" out="OO" symmetry="(xy)" steps="5"/>

        <!-- Doors -->
        <import file="part-door"/>

        <!-- Cellar under 'g' -->
        <import file="part-cellar"/>

        <!-- Stairs between floors -->
        <import file="part-stair"/>

        <!-- Battlements and arrow slits on keep, tower, curtain wall, turrets, and gatehouse -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in the window bands 'Y' on all sides -->
        <one steps="18" symmetry="(xy)">
          <rule in="BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY" out="*L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L"/>
        </one>
        <all in="LYYYYB" out="*LLLL*" symmetry="(xy)"/>
        <prl in="Y" out="W"/>

        <!-- Lean-to sloped wooden roof extension -->
        <all in="Q B" out="* Q" steps="1"/>
        <all in="WQ B*" out="** *Q" symmetry="(xy)" steps="2"/>

        <!-- Stone chimney on the keep roof -->
        <one in="R B" out="* K" steps="1"/>
        <all in="K/R" out="*/K" symmetry="(xy)" steps="2"/>
        <all in="K B" out="* K" steps="14"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval cartoon style with clear contrast and distinct materials -->
  <color symbol="E" value="#6b7a4f" name="terreno" hidden="True"/>
  <color symbol="c" value="#968e7e" name="cortile" area="courtyard"/>
  <color symbol="l" value="#827a6a" name="lastricato" area="courtyard"/>
  <color symbol="r" value="#787062" name="strada" area="yard"/>
  <color symbol="f" value="#b8986c" name="pavimento in legno" area="keep"/>
  <color symbol="F" value="#a6865a" name="solaio in legno" area="keep"/>
  <color symbol="R" value="#7e7870" name="terrazza" area="keep"/>
  <color symbol="W" value="#9a9488" name="muro del mastio" area="keep"/>
  <color symbol="V" value="#7c766c" name="muro di torre" area="tower"/>
  <color symbol="J" value="#888278" name="cinta muraria" area="courtyard"/>
  <color symbol="M" value="#8e887c" name="merlatura" area="keep"/>
  <color symbol="U" value="#2a2826" name="feritoia" area="keep"/>
  <color symbol="L" value="#384452" name="finestra" area="keep"/>
  <color symbol="P" value="#684a32" name="pilastro in legno" area="yard"/>
  <color symbol="Q" value="#9e4834" name="tetto della tettoia" area="yard"/>
  <color symbol="K" value="#645e58" name="camino in pietra" area="keep"/>
  <color symbol="O" value="#6e482c" name="portone" area="keep"/>
  <color symbol="o" value="#4e321c" name="assi del portone" area="keep"/>
  <color symbol="N" value="#5e5850" name="stipite in pietra" area="keep"/>
  <color symbol="k" value="#8c6e46" name="gradino" area="keep"/>
  <color symbol="T" value="#8c6e46" name="scala" area="keep"/>
  <color symbol="D" value="#625a50" name="pavimento della cantina" area="keep"/>
  <color symbol="#20" value="#6e482c" name="portone aperto" hidden="True"/>
  <color symbol="#21" value="#4e321c" name="assi aperte" hidden="True"/>

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
