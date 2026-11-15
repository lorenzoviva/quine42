# model.sculpt · claude-sonnet-5-5 · 452 s

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
FORTE — composition (plan on the coarse grid: one cell = 5 voxels).
Parts, with their letters:
  keep: h (hall), w (walls), s (stair zone), u (two corner turrets of the keep, random corners)
  courtyard: c, around the keep; paving n on the axis of the door
  curtain wall: W, two cells thick, with a gatehouse G on the axis; road r to the edge of the box
  corner towers: t, on every outer corner of the ring
  annex (a, v): a hall against a side wall of the keep, from a random cell of that side, only where the ground goes on far enough
  barracks g (a lean-to against the back ring), a well Q and trees y: only where the yard is large
Placement: the keep is behind the centre, 4 cells behind H and 3 in front (+1 by chance); the gate and the road are in front, on the axis of the door.
  The stair runs along the back wall, from its left corner.
Seeds change: the front end of the keep (+1 by chance), which two corners get a turret, the side and the cell of the annex,
  the number of corner towers (the annex bulges the ring), where the barracks, the well and the trees stand.
At each size:
  Large 20x20: keep + thin ring + towers + gate + road (nothing else fits)
  Huge 30x30: the yard grows, and there are the annex and the well
  Gargantuan 40x40: more yard, barracks, trees
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwucWtGdnrmsavgQy" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the keep body: 4 behind, 3 in front and one more by chance, 4 to each side, then walls -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- the zone of the stair: along the back wall, two cells of landing, four of stair, two wide -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- two turrets of the keep on random outer corners -->
      <one in="EE/Ew" out="**/*u" steps="2"/>

      <!-- the annex: against a side wall, only where the ground goes on far enough -->
      <one in="wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE" out="*********/*********/*a*******/*********/*********" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- the yard around the buildings -->
      <all in="[wvu]E" out="*c"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- the curtain wall, two cells thick -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- the way out: door, paving, gatehouse, road, three cells wide -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- what the size allows: barracks against the back ring, a well, trees -->
      <one in="WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/*ggggg*/*ggggg*/*ggggg*/*ggggg*/*******/*******" symmetry="(x)" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/*******/*******/***y***/*******/*******/*******" steps="2"/>

      <!-- a tower on every outer corner of the ring -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>
    </sequence>
  </map>
  <color symbol="B" value="000000" name="aria" hidden="True"/>
  <color symbol="E" value="7FA650" name="terreno" hidden="True"/>
  <color symbol="H" value="E0C060" name="centro" hidden="True"/>
  <color symbol="h" value="D8C9A0" name="sala del mastio" hidden="True" area="keep"/>
  <color symbol="w" value="8F8A80" name="muro del mastio"/>
  <color symbol="u" value="6F6A63" name="torretta"/>
  <color symbol="c" value="B9A878" name="cortile" hidden="True" area="courtyard"/>
  <color symbol="W" value="76736C" name="muro di cinta"/>
  <color symbol="t" value="5E5B55" name="torre" area="tower"/>
  <color symbol="G" value="4A4742" name="portale"/>
  <color symbol="d" value="8B5A2B" name="porta"/>
  <color symbol="n" value="A39B8A" name="selciato"/>
  <color symbol="r" value="C2A878" name="strada"/>
  <color symbol="m" value="FFFFFF" name="segno" hidden="True"/>
  <color symbol="s" value="B04A3A" name="scala"/>
  <color symbol="a" value="D4B483" name="sala dell'ala" hidden="True" area="annex"/>
  <color symbol="v" value="9A8F7E" name="muro dell'ala"/>
  <color symbol="g" value="7A4A3A" name="caserma" area="garrison"/>
  <color symbol="Q" value="3F6F8F" name="pozzo"/>
  <color symbol="y" value="3F7A3A" name="albero" area="orchard"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h sala del mastio, w muro del mastio, u torretta, c cortile, W muro di cinta, t torre, G portale, d porta, n selciato, r strada, s scala, a sala dell'ala, v muro dell'ala, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
Ettttccccccccccccccccccccctttt
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcvvvvwwwwwwwwwwucccccWWEE
EEEWWcvaaawhhsssshhhwcccccWWEE
EEEWWcvaaawhhsssshhhwcccccWWEE
EEEWWcvaaawhhhhhhhhhwcccccWWEE
EEEWWcvaaawhhhhhhhhhwcccccWWEE
EEEWWcvaaawhhhhhhhhhwcccccWWEE
EEEWWcvvvvwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccuwwwdddwwwwcccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWccQccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
Ettttcccccccccnnnccccccccctttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttEEEEEEEErrrEEEEEEEEttttt
EtttttEEEEEEEErrrEEEEEEEEttttt
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h sala del mastio, w muro del mastio, u torretta, c cortile, W muro di cinta, t torre, G portale, d porta, n selciato, r strada, s scala, a sala dell'ala, v muro dell'ala, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
Ettttccccccccccccccccccccctttt
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccwwwwwwwwwwucccccWWEE
EEEWWcvvvvwhhsssshhhwcccccWWEE
EEEWWcvaaawhhsssshhhwcccccWWEE
EEEWWcvaaawhhhhhhhhhwcccccWWEE
EEEWWcvaaawhhhhhhhhhwcccccWWEE
EEEWWcvaaawhhhhhhhhhwcccccWWEE
EEEWWcvaaawhhhhhhhhhwcccccWWEE
EEEWWcvvvvwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwwwwdddwwwucccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccQcccWWEE
EEEWWcccccccccnnncccccccccWWEE
Ettttcccccccccnnnccccccccctttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttEEEEEEEErrrEEEEEEEEttttt
EtttttEEEEEEEErrrEEEEEEEEttttt
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h sala del mastio, w muro del mastio, u torretta, c cortile, W muro di cinta, t torre, G portale, d porta, n selciato, r strada, s scala, a sala dell'ala, v muro dell'ala, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
Ettttccccccccccccccccccccctttt
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccuwwwwwwwwwwcccccWWEE
EEEWWcccccwhhsssshhhwcccccWWEE
EEEWWcccccwhhsssshhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwvvvvcWWEE
EEEWWcccccwhhhhhhhhhwaaavcWWEE
EEEWWcccccwhhhhhhhhhwaaavcWWEE
EEEWWcccccwhhhhhhhhhwaaavcWWEE
EEEWWcccccwhhhhhhhhhwaaavcWWEE
EEEWWcccccuwwwdddwwwwaaavcWWEE
EEEWWcccccccccnnnccccvvvvcWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWccccQccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
Ettttcccccccccnnnccccccccctttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttEEEEEEEErrrEEEEEEEEttttt
EtttttEEEEEEEErrrEEEEEEEEttttt
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h sala del mastio, w muro del mastio, u torretta, c cortile, W muro di cinta, t torre, G portale, d porta, n selciato, r strada, s scala, a sala dell'ala, v muro dell'ala, g caserma, Q pozzo, y albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEtttttEEEEEEEEEEEEEEEEEEEEEEEEEEtttttEE
EEtttttEEEEEEEEEEEEEEEEEEEEEEEEEEtttttEE
EEtttttWWWWWWWWWWWWWWWWWWWWWWWWWWtttttEE
EEtttttWWWWWWWWWWWWWWWWWWWWWWWWWWtttttEE
EEttttcccccccccccccccccgggggccccccttttEE
EEEEWWcccccccccccccccccgggggccccccWWEEEE
EEEEWWcccccccccccccccccgggggccccccWWEEEE
EEEEWWcccccccccccccccccgggggccccccWWEEEE
EEEEWWcccccccccccccyccccccccccccccWWEEEE
EEEEWWccccccccccccccccccccccccccccWWEEEE
EEEEWWccccccccccccccccccccccccccccWWEEEE
EEEEWWccccccccccccccccccccccccccccWWEEEE
EEEEWWcccccvvvvwwwwwwwwwwuccccccccWWEEEE
EEEEWWcccccvaaawhhsssshhhwccccccccWWEEEE
EEEEWWcccccvaaawhhsssshhhwccccccccWWEEEE
EEEEWWcccccvaaawhhhhhhhhhwccccccccWWEEEE
EEEEWWcccccvaaawhhhhhhhhhwccccccccWWEEEE
EEEEWWcccccvaaawhhhhhhhhhwccccccccWWEEEE
EEEEWWcccccvvvvwhhhhhhhhhwccccccccWWEEEE
EEEEWWcccccccccwhhhhhhhhhwccccccccWWEEEE
EEEEWWcccccccccwhhhhhhhhhwccccccccWWEEEE
EEEEWWcccccccccuwwwdddwwwwccccccccWWEEEE
EEEEWWcccccccccccccnnnccccccccccccWWEEEE
EEEEWWcccccccccccccnnnccccccccccccWWEEEE
EEEEWWcccccccccccccnnncccccccQccccWWEEEE
EEEEWWcccycccccccccnnnccccccccccccWWEEEE
EEEEWWcccccccccccccnnnccccccccccccWWEEEE
EEEEWWcccccccccccccnnnccccccccccccWWEEEE
EEEEWWcccccccccccccnnnccccccccccccWWEEEE
EEttttcccccccccccccnnnccccccccccccttttEE
EEtttttWWWWWWWWWWWWGGGWWWWWWWWWWWtttttEE
EEtttttWWWWWWWWWWWWGGGWWWWWWWWWWWtttttEE
EEtttttEEEEEEEEEEEErrrEEEEEEEEEEEtttttEE
EEtttttEEEEEEEEEEEErrrEEEEEEEEEEEtttttEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.13 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
FORTE: composition on the plan (one cell = 5 voxels).
Parts and letters:
  keep: h hall, w walls, s stair zone against the back wall, u two corner turrets on random corners
  courtyard c around the keep, paving n on the axis of the door d
  curtain wall W, two cells thick, with gatehouse G on the axis and road r to the edge
  corner towers t, plus 0 to 2 towers jutting out of the straight walls, at random places
  annex a/v: a hall against a side wall of the keep, only where the ground goes on
  barracks g, well Q, trees y: only where the yard is large
Seeds change: depth of the keep (front and back by chance), turrets, side and cell of the annex, mid-wall towers.
Sizes: Huge = keep, ring, towers, annex, well. Gargantuan = more yard, barracks, trees, more towers.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwucWtGdnrmsavgQy" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <one in="EE/Ew" out="**/*u" steps="2"/>

      <one in="wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE" out="*********/*********/*a*******/*********/*********" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <all in="[wvu]E" out="*c"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <one in="WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/*ggggg*/*ggggg*/*ggggg*/*ggggg*/*******/*******" symmetry="(x)" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/*******/*******/***y***/*******/*******/*******" steps="2"/>

      <all in="EE/EW" out="**/*t"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <one in="EEEEE/EEEEE/WWWWW" out="ttttt/ttttt/WWWWW" steps="1"/>
      <one in="EEEEE/EEEEE/WWWWW" out="ttttt/ttttt/WWWWW" p="0.5" steps="1"/>
    </sequence>
  </map>
  <map scale="5 5 1" values="BEhwxZXLuOoNcWtGmdnrsTkavgQylRFMUjJqzpei" symmetry="()">
    <union symbol="+" values="wxZXuWtGv"/>
    <union symbol="=" values="hsaF"/>
    <union symbol="%" values="wxW"/>
    <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
    <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
    <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
    <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
    <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
    <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
    <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
    <rule in="G" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
    <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
    <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
    <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
    <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
    <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
    <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
    <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
    <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
    <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
    <sequence symmetry="(xy)">
      <!-- B. the keep walls: two storeys, band for the windows; the door columns have no band -->
      <all in="B w" out="j w" steps="1"/>
      <all in="B d" out="J d" steps="1"/>
      <all steps="5"><rule in="B j" out="j w"/><rule in="B J" out="J w"/></all>
      <all steps="14"><rule in="B j" out="j Z"/><rule in="B J" out="J w"/></all>
      <all steps="12"><rule in="B j" out="j w"/><rule in="B J" out="J w"/></all>
      <all steps="6"><rule in="B j" out="j x"/><rule in="B J" out="J x"/></all>
      <all steps="14"><rule in="B j" out="j X"/><rule in="B J" out="J x"/></all>
      <all steps="14"><rule in="B j" out="j x"/><rule in="B J" out="J x"/></all>
      <prl><rule in="j" out="B"/><rule in="J" out="B"/></prl>

      <!-- windows in the bands -->
      <one steps="22">
        <rule in="B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX] B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX] B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX] B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX] B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX] B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX] B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX] B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX]/B[ZX]"
              out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
      </one>
      <all in="L[ZX][ZX][ZX][ZX]B" out="*LLLL*"/>
      <prl><rule in="Z" out="w"/><rule in="X" out="x"/></prl>

      <!-- curtain wall 24 -->
      <all in="B W" out="j W" steps="1"/>
      <all in="B j" out="j W" steps="23"/>
      <prl in="j" out="B"/>
      <!-- towers 56 -->
      <all in="B t" out="j t" steps="1"/>
      <all in="B j" out="j t" steps="55"/>
      <prl in="j" out="B"/>
      <!-- gatehouse 48 -->
      <all in="B m" out="j m" steps="1"/>
      <all in="B j" out="j G" steps="47"/>
      <prl in="j" out="B"/>
      <!-- turrets 90 -->
      <all in="B u" out="j u" steps="1"/>
      <all in="B j" out="j u" steps="89"/>
      <prl in="j" out="B"/>
      <!-- annex walls, roof on top -->
      <all in="B v" out="j v" steps="1"/>
      <all in="B j" out="j v" steps="31"/>
      <prl in="j" out="R"/>
      <!-- barracks -->
      <all in="B g" out="j g" steps="1"/>
      <all in="B j" out="j g" steps="27"/>
      <prl in="j" out="R"/>
      <!-- well -->
      <all in="B Q" out="j Q" steps="1"/>
      <all in="B j" out="j Q" steps="9"/>
      <prl in="j" out="B"/>
      <!-- trees -->
      <all in="B y" out="j y" steps="1"/>
      <all in="B j" out="j y" steps="9"/>
      <all in="B j" out="j l" steps="12"/>
      <prl in="j" out="B"/>
      <!-- annex hall -->
      <all in="B a" out="p a" steps="1"/>
      <all in="B p" out="p B" steps="31"/>
      <prl in="p" out="R"/>

      <!-- the keep hall: floor, strip of the stair, slab, ceiling -->
      <all in="B h" out="q h" steps="1"/>
      <all in="B s" out="T s" symmetry="()" steps="1"/>
      <all in="B T" out="z T" symmetry="()" steps="1"/>
      <all in="B q" out="q B" steps="31"/>
      <all in="B z" out="z B" steps="30"/>
      <all steps="1"><rule in="B q" out="q F"/><rule in="B z" out="z F"/></all>
      <all steps="31"><rule in="B q" out="q B"/><rule in="B z" out="z B"/></all>
      <prl><rule in="q" out="R"/><rule in="z" out="R"/></prl>

      <!-- C. the doors -->
      <prl><rule in="d" out="O"/><rule in="m" out="O"/></prl>
      <one in="aaaaaaaaaaa/vvvvvvvvvvv/vvvvvvvvvvv/vvvvvvvvvvv/vvvvvvvvvvv/vvvvvvvvvvv/ccccccccccc" out="***********/OOOOOOOOOOO/OOOOOOOOOOO/OOOOOOOOOOO/OOOOOOOOOOO/OOOOOOOOOOO/***********" symmetry="()" steps="1"/>

      <import file="part-door"/>
      <import file="part-stair"/>
      <import file="part-battlements"/>
      <import file="part-slits"/>
    </sequence>
  </map>
  <color symbol="B" value="000000" name="aria" hidden="True"/>
  <color symbol="E" value="7FA650" name="terreno" hidden="True"/>
  <color symbol="H" value="E0C060" name="centro" hidden="True"/>
  <color symbol="h" value="C9A66B" name="pavimento del mastio" area="keep"/>
  <color symbol="w" value="8F8A80" name="muro del mastio"/>
  <color symbol="x" value="E3D9BE" name="intonaco"/>
  <color symbol="Z" value="8F8A80" name="fascia bassa" hidden="True"/>
  <color symbol="X" value="E3D9BE" name="fascia alta" hidden="True"/>
  <color symbol="L" value="2E3B55" name="finestra"/>
  <color symbol="u" value="6F6A63" name="torretta"/>
  <color symbol="O" value="8B5A2B" name="porta"/>
  <color symbol="o" value="4A2F1B" name="assi della porta"/>
  <color symbol="N" value="3C2F28" name="stipite"/>
  <color symbol="c" value="B9A878" name="cortile" area="courtyard"/>
  <color symbol="W" value="76736C" name="muro di cinta"/>
  <color symbol="t" value="5E5B55" name="torre" area="tower"/>
  <color symbol="G" value="4A4742" name="portale"/>
  <color symbol="m" value="FFFFFF" name="segno" hidden="True"/>
  <color symbol="d" value="A0642D" name="porta del mastio"/>
  <color symbol="n" value="A39B8A" name="selciato"/>
  <color symbol="r" value="C2A878" name="strada"/>
  <color symbol="s" value="9A7A4E" name="pavimento della scala"/>
  <color symbol="T" value="FF00FF" name="segno scala" hidden="True"/>
  <color symbol="k" value="C97B4A" name="gradini"/>
  <color symbol="a" value="D4B483" name="sala dell'ala" area="annex"/>
  <color symbol="v" value="9A8F7E" name="muro dell'ala"/>
  <color symbol="g" value="7A4A3A" name="caserma" area="garrison"/>
  <color symbol="Q" value="3F6F8F" name="pozzo"/>
  <color symbol="y" value="6B4A2B" name="tronco" area="orchard"/>
  <color symbol="l" value="4F8A3E" name="fogliame"/>
  <color symbol="R" value="B5492F" name="tetto"/>
  <color symbol="F" value="7A5C3A" name="solaio"/>
  <color symbol="M" value="9B968C" name="merlo"/>
  <color symbol="U" value="1E1E22" name="feritoia"/>
  <color symbol="j" value="FF00FF" name="testa" hidden="True"/>
  <color symbol="J" value="FF00FF" name="testa porta" hidden="True"/>
  <color symbol="q" value="FF00FF" name="testa sala" hidden="True"/>
  <color symbol="z" value="FF00FF" name="testa scala" hidden="True"/>
  <color symbol="p" value="FF00FF" name="testa ala" hidden="True"/>
  <color symbol="e" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="i" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="e"/><rule in="o" out="i"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="e" out="O"/><rule in="i" out="o"/></all></action>
</sequence>
