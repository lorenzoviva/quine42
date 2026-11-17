# model.sculpt · claude-opus-5-5 · 154 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front. Furnished inside, in the same program: every room of every storey has its furniture (beds, tables, benches, shelves, chests, a hearth, barrels; mangers and hay where animals stay), standing on the floor against the walls, each piece a small body of its own material. Keep free what a body needs, the checks are the same: the door and the straight way in from it, two cells of free floor before every stair and where it comes out, a passage at least 11 voxels wide between the pieces to every room and every stair. Give every furniture material a colour of its own whose name begins with «arredo» (arredo letto, arredo tavolo…).
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Your program so far
<!--
FATTORIA - the composition
Parts and letters (plan grid):
  h  the farmhouse floor (two storeys), around H; w its walls
  s  the stair zone inside the house, along the back wall, with a landing before it
  a  the barn / stable wing against a side wall (which side and where along it: the seed); v its walls
  d  the door of the house, front centre, 3 cells wide; r the road straight to the front edge
  c  the farmyard: a ring of beaten earth around house and barn
  x  a fence around the yard, only where the ground goes on past it (Huge and more)
  q  haystacks in free ground; t trees (orchard) in free ground (Huge and more)
Relations: the house is on the centre line, the door faces the front, the road runs to the edge;
  the barn hangs on a side wall; the yard wraps both; the fence wraps the yard; hay and trees outside.
Seeds change: the depth of the house (one cell more or not), the side of the barn and its place along
  the wall, where hay and trees fall.
Sizes: Large = house + barn + yard; Huge = also fence, haystacks, trees; Gargantuan = more of them.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavdrcxqtm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the house -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the barn wing on one side -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- the stair zone along a wall of the house -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- the farmyard ring -->
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- the fence, only where ground goes on -->
      <all in="cEEEE" out="*x**" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- the way out: door, road through yard and fence to the edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/[Ecx]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[Ecx]" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- haystacks and trees outside -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**q**/*****/*****" steps="2"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="h" value="b08a5a" name="pavimento casa" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro casa"/>
  <color symbol="s" value="8a6a40" name="zona scala" area="house"/>
  <color symbol="a" value="a0784a" name="pavimento stalla" area="barn"/>
  <color symbol="v" value="a84a32" name="muro stalla"/>
  <color symbol="d" value="5a3a20" name="porta"/>
  <color symbol="r" value="c8b48a" name="strada"/>
  <color symbol="c" value="b8a070" name="aia" area="yard"/>
  <color symbol="x" value="7a5a36" name="staccionata"/>
  <color symbol="q" value="e0c050" name="pagliaio" area="field"/>
  <color symbol="t" value="5a8a3a" name="albero" area="orchard"/>
  <color symbol="m" value="ff00ff" name="segno"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento casa, w muro casa, s zona scala, a pavimento stalla, v muro stalla, d porta, r strada, c aia, x staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEExxxxxxxxxxxxxxxxx
EEExcccccccccccccccc
EEExcwwwwwwwwwwwcccc
EEExcwhhsssshhhwcccc
EEExcwhhsssshhhwcccc
EEExcwhhhhhhhhhwcccc
EEExcwhhhhhhhhhwcccc
EEExcwhhhhhhhhhwvvvv
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwwwwdddwwwwaaav
EEExcccccrrrccccvvvv
EEExcccccrrrcccccccc
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento casa, w muro casa, s zona scala, a pavimento stalla, v muro stalla, d porta, r strada, c aia, x staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEExxxxxxxxxxxxxxxxx
EEExcccccccccccccccc
EEExcwwwwwwwwwwwcccc
EEExcwhhsssshhhwcccc
EEExcwhhsssshhhwcccc
EEExcwhhhhhhhhhwcccc
EEExcwhhhhhhhhhwcccc
EEExcwhhhhhhhhhwvvvv
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwwwwdddwwwwaaav
EEExcccccrrrccccvvvv
EEExcccccrrrcccccccc
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento casa, w muro casa, s zona scala, a pavimento stalla, v muro stalla, d porta, r strada, c aia, x staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEExxxxxxxxxxxxxxxxx
EEExcccccccccccccccc
EEExcwwwwwwwwwwwcccc
EEExcwhhsssshhhwcccc
EEExcwhhsssshhhwcccc
EEExcwhhhhhhhhhwcccc
EEExcwhhhhhhhhhwvvvv
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwwwwdddwwwwvvvv
EEExcccccrrrcccccccc
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento casa, w muro casa, s zona scala, a pavimento stalla, v muro stalla, d porta, r strada, c aia, x staccionata, q pagliaio, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtEEEEEEEEEEEEEtEEEEEEEEEEEE
EEEEEEEEtEEEEtEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEqEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEqEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEExxxxxxxxxxxxxxxxxxxEEE
EEEEEEEExcccccccccccccccccxEEE
EEEEEEEExcwwwwwwwwwwwcccccxEEE
EEEEEEEExcwhhsssshhhwcccccxEEE
EEEtEEEExcwhhsssshhhwcccccxEEE
EEEEEEEExcwhhhhhhhhhwcccccxEEE
EEEEEEEExcwhhhhhhhhhwcccccxEEE
EEEEEEEExcwhhhhhhhhhwvvvvcxEEE
EEEEEEEExcwhhhhhhhhhwaaavcxEEE
EEEEEEEExcwhhhhhhhhhwaaavcxEEE
EEEtEEEExcwhhhhhhhhhwaaavcxEEE
EEEEEEEExcwhhhhhhhhhwaaavcxEEE
EEEEEEEExcwwwwdddwwwwaaavcxEEE
EEEEEEEExcccccrrrccccvvvvcxEEE
EEEEtEEExcccccrrrcccccccccxEEE
EEEEEEEExxxxxxrrrxxxxxxxxxxEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.07 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
FATTORIA
Parts and letters (plan grid):
  h  farmhouse floor (two storeys) around H; w its walls
  s  stair zone along the back wall; u its landing and its exit (free floor)
  a  barn / stable wing against a side wall (side and place: the seed); v its walls
  d  front door, 3 cells; r road to the front edge
  c  farmyard ring; x fence ring where ground goes on (Huge+)
  q  haystacks; t orchard trees in free ground (Huge+)
Sizes: Large = house + barn + yard; Huge = fence, hay, trees; Gargantuan = more.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="WV"/>
  <union symbol="=" values="fFKg"/>
  <map scale="1/5 1/5 1" values="BHEhwsavdrcxqtmu" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(xy)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <prl in="a/E" out="*/a" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <one in="wwwwwwwwwww/whhhhhhhhhw/whhhhhhhhhw" out="***********/*uussssuuu*/*uussssuuu*" symmetry="()" steps="1"/>
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEE" out="*x**" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/[Ecxv]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[Ecxv]" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**q**/*****/*****" steps="3"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEHhwsuavdrcxqtnPQljYzeWULRVfFKgTkOoNZXCADGI" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="nnnnn/nnnnn/nnPnn/nnnnn/nnnnn"/>
      <rule in="q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="t" out="lllll/lllll/lljll/lllll/lllll"/>
      <sequence symmetry="(xy)">
        <!-- B. columns -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <all in="B d" out="e O" steps="1"/>
        <all in="B e" out="e W" steps="63"/>
        <prl in="e" out="R"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/><rule in="B u" out="u K"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B u" out="u B"/></all>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/><rule in="B u" out="u K"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/><rule in="B u" out="u B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/><rule in="u" out="R"/></prl>
        <all in="B v" out="v V" steps="32"/>
        <prl in="v" out="R"/>
        <all in="B a" out="a g" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>
        <all in="B P" out="P *" steps="9"/>
        <all in="B Q" out="Q *" steps="7"/>
        <all in="B j" out="j Y" steps="16"/>
        <prl in="j" out="z"/>
        <all in="zB" out="*z" steps="2"/>
        <all in="B z" out="z *" steps="4"/>
        <!-- C. doors and stair -->
        <one in="fWWWWWg" out="*OOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/W" out="*/O" symmetry="()" steps="5"/>
        <all in="W/O" out="O/*" symmetry="()" steps="5"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- windows -->
        <one steps="16"><rule in="BU/BU/BU BU/BU/BU BU/BU/BU BU/BU/BU BU/BU/BU BU/BU/BU BU/BU/BU BU/BU/BU" out="*L/*L/*L *L/*L/*L *L/*L/*L *L/*L/*L *L/*L/*L *L/*L/*L *L/*L/*L *L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- furniture -->
        <one steps="2" in="WWWWWWW/BBBBBBB/BBBBBBB/BBBBBBB WWWWWWW/[fF][fF][fF][fF][fF][fF][fF]/[fF][fF][fF][fF][fF][fF][fF]/[fF][fF][fF][fF][fF][fF][fF]" out="*******/*ZZZZZ*/*ZZZZZ*/*ZZZZZ* *******/*******/*******/*******"/>
        <one steps="2" in="WWWWWWW/BBBBBBB/BBBBBBB/BBBBBBB WWWWWWW/[fF][fF][fF][fF][fF][fF][fF]/[fF][fF][fF][fF][fF][fF][fF]/[fF][fF][fF][fF][fF][fF][fF]" out="*******/*XXXXX*/*XXXXX*/******* *******/*******/*******/*******"/>
        <one steps="2" in="WWWWW/BBBBB/BBBBB WWWWW/[fF][fF][fF][fF][fF]/[fF][fF][fF][fF][fF]" out="*****/*CCC*/***** *****/*****/*****"/>
        <one steps="1" in="WWWWWWW/BBBBBBB/BBBBBBB/BBBBBBB WWWWWWW/fffffff/fffffff/fffffff" out="*******/*AAAAA*/*AAAAA*/******* *******/*******/*******/*******"/>
        <one steps="2" in="WWWWW/BBBBB/BBBBB/BBBBB WWWWW/fffff/fffff/fffff" out="*****/*DDD*/*DDD*/***** *****/*****/*****/*****"/>
        <one steps="2" in="[VW][VW][VW][VW][VW][VW][VW]/BBBBBBB/BBBBBBB/BBBBBBB [VW][VW][VW][VW][VW][VW][VW]/ggggggg/ggggggg/ggggggg" out="*******/*GGGGG*/*GGGGG*/******* *******/*******/*******/*******"/>
        <one steps="2" in="[VW][VW][VW][VW][VW]/BBBBB/BBBBB/BBBBB [VW][VW][VW][VW][VW]/ggggg/ggggg/ggggg" out="*****/*III*/*III*/***** *****/*****/*****/*****"/>
        <all in="B Z" out="Z *" steps="3"/>
        <all in="B X" out="X *" steps="5"/>
        <all in="B C" out="C *" steps="2"/>
        <all in="B A" out="A *" steps="9"/>
        <all in="B D" out="D *" steps="4"/>
        <all in="B G" out="G *" steps="3"/>
        <all in="B I" out="I *" steps="5"/>
        <!-- roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="h" value="b08a5a" name="pavimento casa" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro casa"/>
  <color symbol="s" value="8a6a40" name="zona scala" area="house"/>
  <color symbol="u" value="b08a5a" name="pianerottolo" area="house"/>
  <color symbol="a" value="a0784a" name="pavimento stalla" area="barn"/>
  <color symbol="v" value="a84a32" name="muro stalla"/>
  <color symbol="d" value="5a3a20" name="soglia"/>
  <color symbol="r" value="c8b48a" name="strada"/>
  <color symbol="c" value="b8a070" name="aia" area="yard"/>
  <color symbol="x" value="7a5a36" name="staccionata"/>
  <color symbol="q" value="e0c050" name="pagliaio" area="field"/>
  <color symbol="t" value="5a8a3a" name="albero" area="orchard"/>
  <color symbol="m" value="ff00ff" name="segno"/>
  <color symbol="n" value="a89060" name="terra del recinto" area="yard"/>
  <color symbol="P" value="6a4a2a" name="palo della staccionata"/>
  <color symbol="Q" value="e0c050" name="covone di fieno" area="field"/>
  <color symbol="l" value="7a9a4a" name="prato del frutteto" area="orchard"/>
  <color symbol="Y" value="5a3a22" name="tronco"/>
  <color symbol="z" value="5a8a3a" name="chioma"/>
  <color symbol="e" value="e8dcc0" name="muro casa"/>
  <color symbol="W" value="e8dcc0" name="intonaco"/>
  <color symbol="U" value="e8dcc0" name="intonaco"/>
  <color symbol="L" value="7aa0b8" name="vetro finestra"/>
  <color symbol="R" value="b04a30" name="tegole"/>
  <color symbol="V" value="a84a32" name="mattoni stalla"/>
  <color symbol="f" value="b08a5a" name="assi del pavimento" area="house"/>
  <color symbol="F" value="9a7a50" name="solaio" area="house"/>
  <color symbol="K" value="b08a5a" name="assi del pianerottolo" area="house"/>
  <color symbol="g" value="8a7048" name="pavimento stalla" area="barn"/>
  <color symbol="T" value="8a6a40" name="striscia scala"/>
  <color symbol="k" value="7a5530" name="gradini"/>
  <color symbol="O" value="6a4020" name="porta"/>
  <color symbol="o" value="3a2410" name="assi della porta"/>
  <color symbol="N" value="4a4a4a" name="stipite"/>
  <color symbol="M" value="9a9a9a" name="merlo"/>
  <color symbol="Z" value="c05040" name="arredo letto"/>
  <color symbol="X" value="8a5a30" name="arredo tavolo"/>
  <color symbol="C" value="6a3a1a" name="arredo cassapanca"/>
  <color symbol="A" value="7a7a7a" name="arredo focolare"/>
  <color symbol="D" value="9a6a3a" name="arredo botte"/>
  <color symbol="G" value="5a4a30" name="arredo mangiatoia"/>
  <color symbol="I" value="e8d070" name="arredo fieno"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
