# model.sculpt · claude-sonnet-5-5 · 214 s

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

## Your program so far
<!--
FORTE: the parts and where each goes (plan letters, 1 cell = 5 voxels)
- keep h/H (floor), w (walls), d (door): around the centre H, 9 cells wide inside, 9 or 10 deep (the back end grows one more by chance).
  The door d is 3 cells wide in the middle of the front wall.
- stair zone s: inside the keep, along the back wall, 2 cells of landing, 4 long and 2 wide, climbing toward large x.
- yard c: a ring around the keep. It grows 4 cells wider on every side where 6 cells of ground go on past it (Huge and up).
- curtain wall W: one cell thick around the yard, corners filled.
- towers t: 3 x 3 on the outer corners of the wall. 2 are certain, a third and a fourth come by chance, and the seed picks which corners.
- gate G: through the wall on the axis of the keep door. Paving n crosses the yard, road r runs on to the edge, all 3 wide.
- annex a: a barracks 2 x 5 against the inside of the wall, on a side chosen by the seed (2 of them, only where the yard is wide enough).
- well Q: in 5 x 5 of free yard.
- moat x: 2 cells outside the wall only where 5 cells of ground go on past it (Gargantuan). The road crosses it as a causeway.
- trees q: 7 x 7 of lawn beyond the moat (Gargantuan).
What fits: Large = keep inside a thin ring with towers and the gate (nothing else fits).
Huge = a wide yard with 2 annexes and a well.
Gargantuan = the same plus moat and trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwdcWtGnraxQqs" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the keep: a line through H, 3 behind (one more by chance), 5 in front -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <!-- the door seed on the front end of the line -->
      <all in="h/E" out="*/d" symmetry="()" steps="1"/>
      <!-- 4 cells to each side of the line -->
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <!-- the zone of the stair: on the back wall, 2 cells from the left wall -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- the yard around the keep -->
      <all steps="1"><rule in="wE" out="*c"/><rule in="dE" out="*c"/></all>
      <all in="cE/*c" out="*c/**"/>
      <!-- wider yard where the ground goes on -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- the curtain wall, one cell thick -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <!-- towers on the outer corners: 2 sure, then by chance -->
      <one in="EE/EW" out="**/*t" steps="2"/>
      <one steps="1"><rule in="EE/EW" out="**/*t" p="0.7"/></one>
      <one steps="1"><rule in="EE/EW" out="**/*t" p="0.5"/></one>
      <all steps="1"><rule in="t[EWc]" out="*t"/><rule in="t*/*[EWc]" out="**/*t"/></all>
      <!-- the way out: door, paving, gate, road to the edge -->
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <!-- two annexes against the inside of the wall, where the yard is wide -->
      <one in="Wcc/Wcc/Wcc/Wcc/Wcc" out="*aa/*aa/*aa/*aa/*aa" steps="1"/>
      <one in="Wcc/Wcc/Wcc/Wcc/Wcc" out="*aa/*aa/*aa/*aa/*aa" steps="1"/>
      <!-- a well in 5 x 5 of yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- the moat, only where the ground goes on past the wall -->
      <all in="cWEEEEE" out="**xx***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- trees in 7 x 7 of free lawn -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***q***/*******/*******/*******" steps="3"/>
    </sequence>
  </map>
  <color symbol="B" value="000000" name="aria"/>
  <color symbol="E" value="7FA35A" name="terra" hidden="True"/>
  <color symbol="H" value="D8C08A" name="centro del mastio" area="keep"/>
  <color symbol="h" value="C9B28A" name="pavimento del mastio" area="keep"/>
  <color symbol="w" value="8E8A82" name="muro del mastio"/>
  <color symbol="d" value="5B3A29" name="porta del mastio"/>
  <color symbol="c" value="9FB36B" name="cortile" area="courtyard"/>
  <color symbol="W" value="6F6B66" name="muro di cinta"/>
  <color symbol="t" value="4F4C4A" name="torre" area="tower"/>
  <color symbol="G" value="3F3C3A" name="porta fortificata"/>
  <color symbol="n" value="C2A878" name="lastricato"/>
  <color symbol="r" value="B08D57" name="strada"/>
  <color symbol="a" value="B5483A" name="alloggio" area="barracks"/>
  <color symbol="x" value="4A90B8" name="fossato"/>
  <color symbol="Q" value="3B6E8F" name="pozzo" area="well"/>
  <color symbol="q" value="3E7D3A" name="albero" area="orchard"/>
  <color symbol="s" value="D96B2B" name="zona della scala"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del mastio, E terra, h pavimento del mastio, w muro del mastio, d porta del mastio, c cortile, W muro di cinta, t torre, G porta fortificata, n lastricato, r strada, a alloggio, x fossato, Q pozzo, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEExxxxxEEEEExxxxxxxxxEEEEE
EEEtttxxxxxEEEEExxxxxxxxxtttEE
EEEtttWWWWWWWWWWWWWWWWWWWtttEE
EEEtttcccccaaaaaccccccccctttEE
EEEEWccccccaaaaaccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWaacccccccccccccccccccWEEE
EEEEWaacccwwwwwwwwwwwcccccWEEE
EEEEWaacccwhhsssshhhwcccccWEEE
EEEEWaacccwhhsssshhhwcccccWEEE
EEEEWaacccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhHhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwwwwdddwwwwccQccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEtttccccccccnnncccccccctttEE
EEEtttWWWWWWWWGGGWWWWWWWWtttEE
EEEtttEEEEEEEErrrEEEEEEEEtttEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del mastio, E terra, h pavimento del mastio, w muro del mastio, d porta del mastio, c cortile, W muro di cinta, t torre, G porta fortificata, n lastricato, r strada, a alloggio, x fossato, Q pozzo, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEExxxxxxxxxxxxxxxxxxxEEEEE
EEEtttxxxxxxxxxxxxxxxxxxxtttEE
EEEtttWWWWWWWWWWWWWWWWWWWtttEE
EEEtttccccccccccccccccccctttEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccwwwwwwwwwwwccQccWEEE
EEEEWcccccwhhsssshhhwcccccWEEE
EEEEWcccccwhhsssshhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhHhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccaaWEEE
EEEEWcccccwhhhhhhhhhwcccaaWEEE
EEEEWcccccwhhhhhhhhhwcccaaWEEE
EEEEWcccccwhhhhhhhhhwcccaaWEEE
EEEEWcccccwhhhhhhhhhwcccaaWEEE
EEEEWaacccwwwwdddwwwwcccccWEEE
EEEEWaacccccccnnncccccccccWEEE
EEEEWaacccccccnnncccccccccWEEE
EEEEWaacccccccnnncccccccccWEEE
EEEEWaacccccccnnncccccccccWEEE
EEEtttccccccccnnncccccccctttEE
EEEtttWWWWWWWWGGGWWWWWWWWtttEE
EEEtttEEEEEEEErrrEEEEEEEEtttEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del mastio, E terra, h pavimento del mastio, w muro del mastio, d porta del mastio, c cortile, W muro di cinta, t torre, G porta fortificata, n lastricato, r strada, a alloggio, x fossato, Q pozzo, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEExxxxxEEEEExxxxxxxxxEEEEE
EEEtttxxxxxEEEEExxxxxxxxxtttEE
EEEtttWWWWWWWWWWWWWWWWWWWtttEE
EEEtttcccccaaaaaccccccccctttEE
EEEEWccccccaaaaaccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccwwwwwwwwwwwcccaaWEEE
EEEEWcccccwhhsssshhhwcccaaWEEE
EEEEWccQccwhhsssshhhwcccaaWEEE
EEEEWcccccwhhhhhhhhhwcccaaWEEE
EEEEWcccccwhhhhHhhhhwcccaaWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwwwwdddwwwwcccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEtttccccccccnnncccccccctttEE
EEEtttWWWWWWWWGGGWWWWWWWWtttEE
EEEtttEEEEEEEErrrEEEEEEEEtttEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del mastio, E terra, h pavimento del mastio, w muro del mastio, d porta del mastio, c cortile, W muro di cinta, t torre, G porta fortificata, n lastricato, r strada, a alloggio, x fossato, Q pozzo, q albero, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEqEEEEEEEEEEEEEEEEEE
EEEEEqEEEEEEEEEEqEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEExxxxxxxxxxxxxxEEEEEEEEEEEEEEE
EEEEEEEEtttxxxxxxxxxxxxxxEEEEEtttEEEEEEE
EEEEEEEEtttWWWWWWWWWWWWWWWWWWWtttEEEEEEE
EEEEEEEEtttccccccccccccccaaaaatttEEEEEEE
EEEEEEExxWcccccccccccccccaaaaacWxxEEEEEE
EEEEEEExxWcccccccccccccccccccccWxxEEEEEE
EEEEEEExxWcccccccccccccccccccccWxxEEEEEE
EEEEEEExxWcccccccccccccccccccccWxxEEEEEE
EEEEEEExxWcccccwwwwwwwwwwwcccccWxxEEEEEE
EEEEEEExxWcccccwhhsssshhhwcccccWxxEEEEEE
EEEEEEExxWcccccwhhsssshhhwccQccWxxEEEEEE
EEEEEEExxWcccccwhhhhhhhhhwcccccWxxEEEEEE
EEEEEEExxWcccccwhhhhHhhhhwcccccWxxEEEEEE
EEEEEEExxWcccccwhhhhhhhhhwcccccWxxEEEEEE
EEEEEEExxWcccccwhhhhhhhhhwcccaaWEEEEEEEE
EEEEEEExxWcccccwhhhhhhhhhwcccaaWEEEEEEEE
EEEEEEExxWcccccwhhhhhhhhhwcccaaWEEEEEEEE
EEEEEEExxWcccccwhhhhhhhhhwcccaaWEEEEEEEE
EEEEEEExxWcccccwwwwdddwwwwcccaaWEEEEEEEE
EEEEEEExxWcccccccccnnncccccccccWxxEEEEEE
EEEEEEExxWcccccccccnnncccccccccWxxEEEEEE
EEEEEEExxWcccccccccnnncccccccccWxxEEEEEE
EEEEEEExxWcccccccccnnncccccccccWxxEEEEEE
EEEEEEEEtttccccccccnnncccccccctttEEEEEEE
EEEEEEEEtttWWWWWWWWGGGWWWWWWWWtttEEEEEEE
EEEEEEEEtttxxxxxxxxrrrxxxxxxxxtttEEEEEEE
EEEEEEEEEEExxxxxxxxrrrxxxxxxxxEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.07 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
FORTE: the parts and where each goes (plan letters, 1 cell = 5 voxels)
- keep h/H (floor), w (walls), d (door): around the centre H, 9 cells wide inside, 9 or 10 deep.
  The door d is 3 cells wide in the middle of the front wall. Two storeys, band windows, a flat roof inside a parapet with merlons.
- stair zone s: inside the keep, along the back wall, 2 cells of landing, 4 long and 2 wide, climbing toward large x.
- yard c: a ring around the keep, 4 cells wider on every side where 6 cells of ground go on past it.
- curtain wall W: one cell thick around the yard, with a walk and merlons, slits under the merlons.
- towers t: 3 x 3 on the outer corners of the wall, 40 high. The seed picks which corners.
- gate G: through the wall on the axis of the keep door. Paving n crosses the yard, road r runs on to the edge, all 3 wide.
- annex a: a barracks against the inside of the wall, on a side chosen by the seed (only where the yard is wide enough).
- well Q: in 5 x 5 of free yard.
- moat x: 2 cells outside the wall where 5 cells of ground go on past it. The road crosses it as a causeway.
- trees q: 7 x 7 of lawn beyond the moat.
What fits: Large = keep inside a thin ring with towers and the gate. Huge = a wide yard, annexes and a well. Gargantuan = the same plus moat and trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwdcWtGnraxQqs" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="h/E" out="*/d" symmetry="()" steps="1"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all steps="1"><rule in="wE" out="*c"/><rule in="dE" out="*c"/></all>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <one in="EE/EW" out="**/*t" steps="2"/>
      <one steps="1"><rule in="EE/EW" out="**/*t" p="0.7"/></one>
      <one steps="1"><rule in="EE/EW" out="**/*t" p="0.5"/></one>
      <all steps="1"><rule in="t[EWc]" out="*t"/><rule in="t*/*[EWc]" out="**/*t"/></all>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <one in="Wcc/Wcc/Wcc/Wcc/Wcc" out="*aa/*aa/*aa/*aa/*aa" steps="1"/>
      <one steps="1"><rule in="Wcc/Wcc/Wcc/Wcc/Wcc" out="*aa/*aa/*aa/*aa/*aa" p="0.6"/></one>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="cWEEEEE" out="**xx***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***q***/*******/*******/*******" steps="3"/>
    </sequence>
    <map scale="5 5 1" values="BEfFhsTkmYLwWdOoNGtMURcnraxQqge" symmetry="()">
      <union symbol="+" values="wWmYtG"/>
      <union symbol="=" values="fF"/>
      <union symbol="%" values="W"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="q" out="eeeee/eggge/eggge/eggge/eeeee"/>
      <sequence symmetry="(xy)">
        <!-- B. the heights -->
        <!-- keep walls: 70, two bands of windows -->
        <all in="B w" out="w m" steps="6"/>
        <all in="B w" out="w Y" steps="14"/>
        <all in="B w" out="w m" steps="18"/>
        <all in="B w" out="w Y" steps="14"/>
        <all in="B w" out="w m" steps="18"/>
        <!-- keep door cells: the seed O at the foot, wall above -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d m" steps="69"/>
        <prl in="d" out="w"/>
        <!-- curtain wall with a walk, towers, gatehouse, annexes, well -->
        <all in="B W" out="W W" steps="23"/>
        <all in="B t" out="t t" steps="39"/>
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G G" steps="39"/>
        <all in="B a" out="a a" steps="19"/>
        <prl in="a" out="R"/>
        <all in="B Q" out="Q Q" steps="8"/>
        <!-- trees: trunk and crown -->
        <all in="B e" out="e E" steps="1"/>
        <all in="B e" out="e B" steps="9"/>
        <all in="B e" out="e q" steps="6"/>
        <all in="B g" out="g g" steps="10"/>
        <all in="B g" out="g q" steps="6"/>
        <prl><rule in="e" out="q"/><rule in="g" out="q"/></prl>
        <!-- the floors of the keep -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- C. windows in the bands -->
        <one steps="36"><rule in="BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LYYYYB" out="*LLLL*"/>
        <prl in="Y" out="m"/>
        <!-- the parts -->
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <prl in="T" out="B"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" name="aria"/>
  <color symbol="E" value="7FA35A" name="terra" hidden="True"/>
  <color symbol="H" value="D8C08A" name="centro del mastio" area="keep"/>
  <color symbol="h" value="C9B28A" name="pavimento del mastio" area="keep"/>
  <color symbol="f" value="9C7B52" name="assi del pavimento" area="keep"/>
  <color symbol="F" value="7D7468" name="solaio"/>
  <color symbol="m" value="D9CCAE" name="intonaco"/>
  <color symbol="Y" value="B9AC8C" name="fascia"/>
  <color symbol="L" value="6FA8C8" name="vetro"/>
  <color symbol="w" value="8E8A82" name="muro del mastio"/>
  <color symbol="d" value="5B3A29" name="porta del mastio"/>
  <color symbol="c" value="9FB36B" name="cortile" area="courtyard"/>
  <color symbol="W" value="6F6B66" name="muro di cinta"/>
  <color symbol="t" value="5A5650" name="torre" area="tower"/>
  <color symbol="G" value="3F3C3A" name="porta fortificata"/>
  <color symbol="n" value="C2A878" name="lastricato"/>
  <color symbol="r" value="B08D57" name="strada"/>
  <color symbol="a" value="C79A55" name="alloggio" area="barracks"/>
  <color symbol="R" value="B5483A" name="tetto"/>
  <color symbol="x" value="4A90B8" name="fossato"/>
  <color symbol="Q" value="3B6E8F" name="pozzo" area="well"/>
  <color symbol="q" value="3E7D3A" name="chioma" area="orchard"/>
  <color symbol="g" value="6B4A2B" name="tronco"/>
  <color symbol="e" value="3E7D3A" name="chioma" hidden="True"/>
  <color symbol="s" value="D96B2B" name="zona della scala" hidden="True"/>
  <color symbol="T" value="D96B2B" name="traccia della scala" hidden="True"/>
  <color symbol="k" value="8A5A32" name="gradini"/>
  <color symbol="M" value="A39E94" name="merlo"/>
  <color symbol="U" value="1E1E1E" name="feritoia"/>
  <color symbol="O" value="5B3A29" name="porta"/>
  <color symbol="o" value="3A2418" name="assi della porta"/>
  <color symbol="N" value="2E2A28" name="stipite"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
