# model.sculpt · intero · gemini-4-argon · 59 s · 10995 token d'ingresso (0 in cache), 5278 d'uscita, 0 di ragionamento · $0.07

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
  Rocca di confine (border fortress with cellar):
  - Main keep (mastio): rear interior 'h' (over the cellar 'D', 45x20 voxels), front hall 'f' (10 voxels deep before cellar), stair zone 's' (20x10 voxels along rear wall), keep walls 'w', main door 'd'.
  - Attached watchtower (torre di guardia) 't' with wall 'u', placed on one of the rear corners of the keep.
  - Side bastion wing (bastione laterale) 'a' with wall 'v', attached to a side of the keep.
  - Seeds change: keep depth (3 or 4 rear cells), which side the bastion wing grows on, which corner the watchtower stands on, and whether a secondary corner buttress 'b' grows.
  - Size difference:
    * At Large (20x20 plan): Keep + watchtower + side bastion + paved forecourt 'c' and road 'r' to the front edge.
    * At Huge (30x30 plan): Outer bailey courtyard 'c' expands around the keep, enclosed by a fortified curtain wall 'W' with corner watch-turrets 'q', a front gatehouse 'G', and a timber lean-to armory 'p' inside the yard.
-->
<sequence values="BHEhfsdwutavbcWqpGr" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhfsdwutavbcWqpGr" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main keep core: 9 cells wide (45 voxels >= 44 for cellar), 3-4 cells behind H, 2 cells in front -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/f" symmetry="()" steps="2"/>
      <prl in="H" out="h"/>
      <all in="hE" out="*h" symmetry="(x)" steps="4"/>
      <all in="fE" out="*f" symmetry="(x)" steps="4"/>

      <!-- Keep walls 'w' -->
      <all in="[hf]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone 's' along the rear wall of the keep (4 cells along x, 2 cells along y) -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Corner watchtower 't' (interior) and 'u' (wall) on one rear corner of the keep -->
      <one in="EEE/Eww/Ewh" out="uuu/utw/utw" symmetry="(x)" steps="1"/>
      <all in="E[tu]" out="u*" symmetry="(xy)" steps="1"/>

      <!-- Side bastion wing 'a' (interior) and 'v' (wall) on one flank of the keep -->
      <one in="Ew/Ew/Ew/Ew" out="a*/a*/a*/a*" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Optional opposite flank buttress tower 'b' -->
      <one in="Ew/Ew/Ew" out="**/*b/**" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(xy)" steps="1"/>

      <!-- Huge size expansion: outer bailey courtyard 'c' where 5+ cells of ground remain -->
      <all in="[wuvb]EEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEE" out="*cc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Outer curtain wall 'W' around the bailey courtyard (only forms when 'c' exists and has ground beyond) -->
      <all in="cEE" out="*WE" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner turrets 'q' on the outer curtain wall -->
      <all in="EE/EW" out="**/*q"/>
      <all steps="1">
        <rule in="q[EW]" out="*q"/>
        <rule in="q*/*[EW]" out="**/*q"/>
      </all>

      <!-- Timber lean-to shed 'p' inside the bailey courtyard at Huge -->
      <one in="Wcccc/Wcccc/Wcccc/Wcccc" out="Wpppp/Wpppp/Wpppp/Wpppp" symmetry="(xy)" steps="1"/>

      <!-- Front doorway 'd' of the keep, gatehouse 'G' in the curtain wall, and road 'r' to the front edge -->
      <all in="f/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dr]/c" out="*/r" symmetry="()"/>
      <all in="[rc]/W" out="*/G" symmetry="()"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="[dGr]/E" out="*/r" symmetry="()"/>
      <all in="r[cE]" out="*r" symmetry="(x)" steps="1"/>
    </sequence>
  </map>

  <color symbol="E" value="#7a8f52" name="erba"/>
  <color symbol="H" value="#c8b08a" name="centro"/>
  <color symbol="h" value="#c8b08a" name="sala sopra la cantina" area="keep"/>
  <color symbol="f" value="#bfa57e" name="ingresso del mastio" area="keep"/>
  <color symbol="s" value="#9e7a52" name="vano scala" area="keep"/>
  <color symbol="d" value="#6b4428" name="soglia del mastio" area="keep"/>
  <color symbol="w" value="#8c8881" name="muro del mastio" area="keep"/>
  <color symbol="u" value="#75716b" name="muro della torre" area="tower"/>
  <color symbol="t" value="#b59d78" name="camera della torre" area="tower"/>
  <color symbol="a" value="#b09975" name=" camera del bastione" area="keep"/>
  <color symbol="v" value="#7e7a74" name="muro del bastione" area="keep"/>
  <color symbol="b" value="#696560" name="contrafforte" area="keep"/>
  <color symbol="c" value="#b8a88a" name="cortile della rocca" area="courtyard"/>
  <color symbol="W" value="#706c66" name="cinta muraria" area="courtyard"/>
  <color symbol="q" value="#5e5a55" name="torretta d'angolo" area="tower"/>
  <color symbol="p" value="#8c6239" name="tettoia d'arme" area="courtyard"/>
  <color symbol="G" value="#857f78" name="corpo di guardia" area="courtyard"/>
  <color symbol="r" value="#9e927d" name="strada lastricata" area="road"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h sala sopra la cantina, f ingresso del mastio, s vano scala, d soglia del mastio, w muro del mastio, u muro della torre, t camera della torre, a  camera del bastione, v muro del bastione, b contrafforte, c cortile della rocca, W cinta muraria, q torretta d'angolo, p tettoia d'arme, G corpo di guardia, r strada lastricata
Plan (the letter of every cell):
```
qqqEEqqqEEEEEEEEEEEE
qqqWWqqqqqEEEEEEqqqE
qqccccqqqqWWWWWWqqqE
EWccccEccccccccccqqE
EWccuuuccccccccccWEE
EWcuuuuucccccccccWEE
qqcuutwwwwwwwwwwcWEE
qqcuutwhsssshhhwcWEE
qqvvuwhhsssshhhwcWEE
EEvaawhhhhhhhhhwcqqE
EEvaawhhhhhhhhhwcqqE
EEvaawfffffffffbbqqE
EEvaadddddddddddcqqE
qqvvvrrrpppprrrrrqqE
qqccrrrrpppprrrrrWEE
qqccrrrrpppprrrrrWEE
qqccrrrrpppprrrrrqqE
qqqGGGGGGWWGGGGGqqqE
qqqrrrrrrrrrrrrrqqqE
EErrrrrrrrrrrrrrrEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h sala sopra la cantina, f ingresso del mastio, s vano scala, d soglia del mastio, w muro del mastio, u muro della torre, t camera della torre, a  camera del bastione, v muro del bastione, b contrafforte, c cortile della rocca, W cinta muraria, q torretta d'angolo, p tettoia d'arme, G corpo di guardia, r strada lastricata
Plan (the letter of every cell):
```
EqqqqqqqqEEEEEEEEqqq
EqqqqqqqqWWWWWWWWqqq
Eqqcqqqccccccppppccq
EqqcqqqccccccppppccE
EqqcuuuccccccppppccE
qqquuuuucccccppppccE
qqquutwwwwwwwwwwvvvE
qqcuutwhsssshhhwaavE
EWccuwhhsssshhhwaavE
qqcccwhhhhhhhhhwaavE
qqcccwhhhhhhhhhwaavE
qqqEbbfffffffffwvvvE
qqcccdddddddddddcccE
qqccrrrrrrrrrrrrrccE
EWccrrrrrrrrrrrrrccE
qqccrrrrrrrrrrrrrccq
qqqGGGGGGGGGGGGGGqqq
qqqrrrrrrrrrrrrrrqqq
EErrrrrrrrrrrrrrrrEE
EErrrrrrrrrrrrrrrrEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h sala sopra la cantina, f ingresso del mastio, s vano scala, d soglia del mastio, w muro del mastio, u muro della torre, t camera della torre, a  camera del bastione, v muro del bastione, b contrafforte, c cortile della rocca, W cinta muraria, q torretta d'angolo, p tettoia d'arme, G corpo di guardia, r strada lastricata
Plan (the letter of every cell):
```
qqqEEEEEEEEEqqqqqqqq
qqqWWWWWWWWWqqqqqqqq
qqccccccppppccqqqcqq
EWccccccppppccEEWcqq
qqccccccppppccuuucqq
qqccccccppppcuuuuuqq
qqvvvwwwwwwwwwwtuuEE
EEvaawhhsssshhwtuuqq
EEvaawhhsssshhhwucqq
EEvaawhhhhhhhhhwEcqq
EEvaawhhhhhhhhhwEcWE
qqvvvwfffffffffbbcWE
qqcccdddddddddddccWE
qqccrrrrrrrrrrrrrcWE
EWccrrrrrrrrrrrrrcWE
qqccrrrrrrrrrrrrrcqq
qqqGGGGGGGGGGGGGGqqq
qqqrrrrrrrrrrrrrrqqq
EErrrrrrrrrrrrrrrrEE
EErrrrrrrrrrrrrrrrEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h sala sopra la cantina, f ingresso del mastio, s vano scala, d soglia del mastio, w muro del mastio, u muro della torre, t camera della torre, a  camera del bastione, v muro del bastione, b contrafforte, c cortile della rocca, W cinta muraria, q torretta d'angolo, p tettoia d'arme, G corpo di guardia, r strada lastricata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEqqqEEEEEEEEEEEEEEEEEEEEEqqqE
EEqqqWWWWWWWWWWWWWWWWWWWWWqqqE
EEqqcccccccccccccccccccccccqqE
EEEWcccccccccccccccccccccccWEE
EEEWppppcccccccccccccccccccWEE
EEEWppppcccccccccccccccccccWEE
EEEWppppcccccccccccccccccccWEE
EEEWppppcuuucccccccccccccccWEE
EEEWccccuuuuuccccccccccccccWEE
EEEWccccuutwwwwwwwwwwccccccWEE
EEEWccccuutwhsssshhhwccccccWEE
EEEWcccvvuwhhsssshhhwccccccWEE
EEEWcccvaawhhhhhhhhhwccccccWEE
EEEWcccvaawhhhhhhhhhwccccccWEE
EEEWcccvaawfffffffffbbcccccWEE
EEEWcccvaadddddddddddccccccWEE
EEEWcccvvvrrrrrrrrrrrrcccccWEE
EEEWcccccrrrrrrrrrrrrrcccccWEE
EEEWcccccrrrrrrrrrrrrrcccccWEE
EEEWcccccrrrrrrrrrrrrrcccccWEE
EEEWcccccrrrrrrrrrrrrrcccccWEE
EEqqcccccrrrrrrrrrrrrrcccccqqE
EEqqqGGGGGGGGGGGGGGGGGGGGGqqqE
EEqqqrrrrrrrrrrrrrrrrrrrrrqqqE
EEEErrrrrrrrrrrrrrrrrrrrrrrEEE
EEEErrrrrrrrrrrrrrrrrrrrrrrEEE
EEEErrrrrrrrrrrrrrrrrrrrrrrEEE
EEEErrrrrrrrrrrrrrrrrrrrrrrEEE
```
How much the plans of the seeds differ: 0.48 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
  Rocca di confine (border fortress with cellar):
  - Main keep (mastio): rear interior 'h' (over the cellar 'D', 45x20 voxels), front hall 'f' (10 voxels deep before cellar), stair zone 's' (20x10 voxels along rear wall), keep walls 'w', main door 'd'.
  - Attached watchtower (torre di guardia) 't' with wall 'u', placed on one of the rear corners of the keep.
  - Side bastion wing (bastione laterale) 'a' with wall 'v', attached to a side of the keep.
  - Timber lean-to armory 'p' (4x4 cells = 20x20 voxels, >= 30 clear under roof).
  - Seeds change: keep depth (3 or 4 rear cells), which side the bastion wing grows on, which corner the watchtower stands on, and whether a secondary corner buttress 'b' grows.
  - Size difference:
    * At Large (20x20 plan): Keep + watchtower + side bastion + lean-to armory 'p' against the keep + road 'r' to the front edge.
    * At Huge (30x30 plan): Outer bailey courtyard 'c' expands around the keep (where 7+ cells of ground remain), enclosed by a fortified curtain wall 'W' with corner watch-turrets 'q' and a front gatehouse 'G'.
-->
<sequence values="BHEhfsdwutavbcWqpGr" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhfsdwutavbcWqpGrm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Center spine marker 'm' for a 3-cell wide front door and road -->
      <all in="H/E" out="*/m" symmetry="()" steps="2"/>

      <!-- Main keep core: 9 cells wide (45 voxels >= 44 for cellar), 3-4 cells behind H, 2 cells in front -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <prl in="H" out="h"/>
      <all in="hE" out="*h" symmetry="(x)" steps="4"/>
      <all in="mE" out="*f" symmetry="(x)" steps="4"/>

      <!-- Keep walls 'w' -->
      <all in="[hfm]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Front doorway 'd' of the keep (3 cells = 15 voxels wide) -->
      <all in="m/w" out="f/d" symmetry="()" steps="1"/>
      <prl in="m" out="f"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>

      <!-- Stair zone 's' along the rear wall of the keep (4 cells along x, 2 cells along y) -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Corner watchtower 't' (interior) and 'u' (wall) on one rear corner of the keep -->
      <one in="EEE/Eww/Ewh" out="uuu/utw/utw" symmetry="(x)" steps="1"/>
      <all in="E[tu]" out="u*" symmetry="(xy)" steps="1"/>

      <!-- Side bastion wing 'a' (interior) and 'v' (wall) on one flank of the keep -->
      <one in="Ew/Ew/Ew/Ew" out="a*/a*/a*/a*" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Optional opposite flank buttress tower 'b' -->
      <one in="Ew/Ew/Ew" out="**/*b/**" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(xy)" steps="1"/>

      <!-- Huge size expansion: outer bailey courtyard 'c' only where 7+ cells of ground remain around the keep -->
      <all in="wEEEEEEE" out="*ccccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="[uvb]E/*c" out="*c/**"/>
      <all in="cE/*[wuvb]" out="*c/**"/>

      <!-- Outer curtain wall 'W' around the bailey courtyard (only forms at Huge when 'c' exists) -->
      <all in="cEE" out="*WE" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner turrets 'q' on the outer curtain wall -->
      <all in="EE/EW" out="**/*q"/>
      <all steps="1">
        <rule in="q[EW]" out="*q"/>
        <rule in="q*/*[EW]" out="**/*q"/>
      </all>

      <!-- Timber lean-to armory 'p' (4x4 cells = 20x20 voxels): against curtain wall at Huge, or against keep wall at Large -->
      <one in="Wcccc/Wcccc/Wcccc/Wcccc" out="Wpppp/Wpppp/Wpppp/Wpppp" symmetry="(xy)" steps="1"/>
      <one in="wEEEE/wEEEE/wEEEE/wEEEE" out="wpppp/wpppp/wpppp/wpppp" symmetry="(xy)" steps="1"/>

      <!-- Gatehouse 'G' in the curtain wall and road 'r' from front door 'd' straight to the front edge -->
      <all in="d/[cE]" out="*/r" symmetry="()" steps="1"/>
      <all in="r/[cE]" out="*/r" symmetry="()"/>
      <all in="r/W" out="*/G" symmetry="()"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="G/[cE]" out="*/r" symmetry="()"/>
      <all in="r/[cE]" out="*/r" symmetry="()"/>
    </sequence>

    <map scale="5 5 1" values="BEhfsdwutavbcWqpGrfFPXLDVTkOoNMUzy#20#21#90#91#92#93#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="p" out="ppppp/pzzzp/pzzzp/pzzzp/ppppp"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>

      <sequence symmetry="(xy)">
        <!-- Unions for the included parts -->
        <union symbol="+" values="wuvbWqGX"/>
        <union symbol="%" values="wuvbWqG"/>
        <union symbol="=" values="fF"/>

        <!-- Mark 'D' on the first layer under the soil (z=19) under 'h' and 's' (45x20 voxels >= 44x14, 10 voxels back from front wall) -->
        <all in="h B" out="* D" steps="1"/>
        <all in="s B" out="* D" steps="1"/>

        <!-- B. Heights: grow columns from the soil layer (z=20) upward -->

        <!-- Main keep walls 'w' and doorway wall 'd': 2 storeys (64 steps) with window bands 'X' -->
        <all steps="8">
          <rule in="B w" out="w *"/>
          <rule in="B d" out="d *"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w X"/>
          <rule in="B d" out="d *"/>
        </all>
        <all steps="20">
          <rule in="B w" out="w *"/>
          <rule in="B d" out="d *"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w X"/>
          <rule in="B d" out="d *"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w *"/>
          <rule in="B d" out="d *"/>
        </all>

        <!-- Doorway 'd' at z=20 becomes floor 'f' with door seed 'O' along the outer edge, and wall 'w' above -->
        <all in="d/[rc]" out="O/*" symmetry="()" steps="1"/>
        <all in="d/O" out="O/*" symmetry="()" steps="4"/>
        <prl in="B d" out="w f"/>
        <prl in="d" out="w"/>

        <!-- Keep interior 'h', front hall 'f', and stair zone 's': 2 covered storeys (z=20 floor, z=52 slab, z=84 roof slab) -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B f" out="y f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- Stair strip 'T' at z=21 above 's' -->
        <all in="B s" out="s T" steps="1"/>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B y" out="y B"/>
        </all>
        <all in="B s" out="s B" steps="30"/>
        <!-- First floor slab 'F' at z=52 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B y" out="y F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- Second storey air (31 steps) -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B y" out="y B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- Roof terrace slab 'F' at z=84 -->
        <prl>
          <rule in="h" out="F"/>
          <rule in="y" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Corner watchtower walls 'u' (76 steps) and interior 't' -->
        <all in="B u" out="u *" steps="10"/>
        <all in="B u" out="u X" steps="10"/>
        <all in="B u" out="u *" steps="22"/>
        <all in="B u" out="u X" steps="10"/>
        <all in="B u" out="u *" steps="24"/>

        <all in="B t" out="t f" steps="1"/>
        <all in="B t" out="t B" steps="31"/>
        <all in="B t" out="t F" steps="1"/>
        <all in="B t" out="t B" steps="31"/>
        <all in="B t" out="t F" steps="1"/>
        <all in="B t" out="t B" steps="11"/>
        <prl in="t" out="F"/>

        <!-- Side bastion wing walls 'v' (46 steps) and interior 'a' -->
        <all in="B v" out="v *" steps="8"/>
        <all in="B v" out="v X" steps="12"/>
        <all in="B v" out="v *" steps="26"/>

        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="13"/>
        <prl in="a" out="F"/>

        <!-- Flank buttress 'b' (54 steps) -->
        <all in="B b" out="b *" steps="54"/>

        <!-- Outer curtain wall 'W' (24 steps) and corner turrets 'q' (38 steps) -->
        <all in="B W" out="W *" steps="24"/>
        <all in="B q" out="q *" steps="12"/>
        <all in="B q" out="q X" steps="8"/>
        <all in="B q" out="q *" steps="18"/>

        <!-- Gatehouse 'G': arch opening over road in the middle, side bastions 36 steps -->
        <all in="B G" out="G *" steps="36"/>

        <!-- Timber lean-to armory 'p' (floor) and 'z' (3x3 posts): 32 clear height under roof 'P' at z=53 -->
        <all in="B p" out="y p" steps="1"/>
        <all in="B y" out="y B" steps="32"/>
        <prl in="y" out="P"/>
        <all in="B z" out="z P" steps="33"/>
        <prl in="z" out="P"/>
        <!-- Hollow out the inner posts of the 4x4 lean-to so only corner/edge posts remain around a 20x20 space -->
        <all in="p/P/P/P/p" out="p/p/p/p/p" symmetry="(xy)"/>
        <all in="B p" out="* B"/>

        <!-- C. Full scale: doors, cellar, stairs, battlements, slits, windows -->

        <!-- Internal doors connecting keep to bastion wing 'a' and watchtower 't' on ground and upper floors -->
        <one in="fwwwwwf" out="*OOOOO*" symmetry="(xy)" steps="2"/>
        <all in="O/w" out="*/O" symmetry="(xy)" steps="4"/>
        <all in="w/O" out="O/*" symmetry="(xy)" steps="4"/>

        <one in="FwwwwwF" out="*OOOOO*" symmetry="(xy)" steps="2"/>
        <all in="O/w" out="*/O" symmetry="(xy)" steps="4"/>
        <all in="w/O" out="O/*" symmetry="(xy)" steps="4"/>

        <!-- Outer gatehouse 'G' door seed 'O' when present at Huge -->
        <one in="rGGGGGr" out="*OOOOO*" symmetry="(xy)" steps="1"/>
        <all in="O/G" out="*/O" symmetry="(xy)" steps="6"/>
        <all in="G/O" out="O/*" symmetry="(xy)" steps="6"/>

        <!-- Windows 'L' in the window bands 'X' on all sides -->
        <one steps="18">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LXXXXB" out="*LLLL*"/>
        <prl in="X" out="w"/>

        <!-- 1. Cellar under the keep (after floors rise, before part-stair) -->
        <import file="part-cellar"/>

        <!-- 2. Stairs inside the keep -->
        <import file="part-stair"/>

        <!-- 3. Doors -->
        <import file="part-door"/>

        <!-- 4. Battlements on flat wall tops -->
        <import file="part-battlements"/>

        <!-- 5. Arrow slits under merlons -->
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval stone, timber accents, earthy courtyard and grass -->
  <color symbol="E" value="#7a8f52" name="erba"/>
  <color symbol="h" value="#c8b08a" name="sala sopra la cantina" area="keep"/>
  <color symbol="f" value="#bfa57e" name="pavimento in pietra" area="keep"/>
  <color symbol="F" value="#a8926f" name="solaio del mastio" area="keep"/>
  <color symbol="s" value="#9e7a52" name="vano scala" area="keep"/>
  <color symbol="d" value="#6b4428" name="soglia del mastio" area="keep"/>
  <color symbol="w" value="#8c8881" name="muro del mastio" area="keep"/>
  <color symbol="u" value="#75716b" name="muro della torre" area="tower"/>
  <color symbol="t" value="#b59d78" name="camera della torre" area="tower"/>
  <color symbol="a" value="#b09975" name="camera del bastione" area="keep"/>
  <color symbol="v" value="#7e7a74" name="muro del bastione" area="keep"/>
  <color symbol="b" value="#696560" name="contrafforte" area="keep"/>
  <color symbol="c" value="#b8a88a" name="cortile della rocca" area="courtyard"/>
  <color symbol="W" value="#706c66" name="cinta muraria" area="courtyard"/>
  <color symbol="q" value="#5e5a55" name="torretta d'angolo" area="tower"/>
  <color symbol="p" value="#9e8565" name="lastricato della tettoia" area="courtyard"/>
  <color symbol="P" value="#8c5332" name="tettoia in legno" area="courtyard"/>
  <color symbol="G" value="#857f78" name="corpo di guardia" area="courtyard"/>
  <color symbol="r" value="#9e927d" name="strada lastricata" area="road"/>
  <color symbol="L" value="#3b4d5e" name="finestra"/>
  <color symbol="X" value="#8c8881" name="fascia muraria"/>
  <color symbol="D" value="#73634d" name="pavimento della cantina" area="cellar"/>
  <color symbol="V" value="#59544f" name="muro della cantina" area="cellar"/>
  <color symbol="T" value="#8c6239" name="scala"/>
  <color symbol="k" value="#8c6239" name="gradini in legno"/>
  <color symbol="O" value="#6b4428" name="porta in legno"/>
  <color symbol="o" value="#4a2e19" name="assi della porta"/>
  <color symbol="N" value="#59544f" name="stipite in pietra"/>
  <color symbol="M" value="#8c8881" name="merlatura"/>
  <color symbol="U" value="#2b2927" name="feritoia"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>

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
