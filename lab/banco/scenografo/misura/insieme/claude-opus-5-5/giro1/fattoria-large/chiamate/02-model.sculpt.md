# model.sculpt · claude-opus-5-5 · 122 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front. Furnished inside, in the same program: every room of every storey has its furniture (beds, tables, benches, shelves, chests, a hearth, barrels; mangers and hay where animals stay), standing on the floor against the walls, each piece a small body of its own material. Keep free what a body needs, the checks are the same: the door and the straight way in from it, two cells of free floor before every stair and where it comes out, a passage at least 11 voxels wide between the pieces to every room and every stair. Give every furniture material a colour of its own whose name begins with «arredo» (arredo letto, arredo tavolo…).
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 5 × 5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 7.5 × 7.5 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Your program so far
<!--
FATTORIA (farmhouse). Parts and letters, on the plan grid (a cell = 5 voxels):
  H  the centre, h the floor of the house (two storeys, the dwelling), w its walls
  a  the floor of the barn wing (stalls, mangers, hay), v its walls; it leans on one side wall of the house (seed: left or right, which row)
  s  the stair zone inside the house, against the back-left wall, two cells of landing before it
  m  a temporary marker of the axis from H to the front; d the door (3 cells) in the front wall; r the road straight to the edge
  c  the farmyard around the buildings (beaten earth); Q a haystack in the yard where 5x5 of yard fit
  x  a fence around the yard, only where the ground goes on past it (huge); t trees in 7x7 of free meadow (huge)
What the seeds change: depth of the house (+1), the side and position of the barn, where the hay and the trees go.
Large (5x5 tiles): house + barn wing + narrow yard. Huge (7.5): wider yard, haystack, fence, trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavsmdrcQxt" symmetry="()">
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
      <!-- the way in: axis from H to the front wall, the door, the road to the edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <!-- the stair zone against the back-left wall -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- the farmyard around the buildings -->
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- haystack, fence, trees where they fit -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="cEEEE" out="*x***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" value="#a08458" name="pavimento casa" area="house"/>
  <color symbol="h" value="#a08458" name="pavimento casa" area="house"/>
  <color symbol="w" value="#e8dcc0" name="muro intonaco"/>
  <color symbol="a" value="#8a6a3e" name="pavimento stalla" area="barn"/>
  <color symbol="v" value="#9c4a32" name="muro stalla"/>
  <color symbol="s" value="#7a5a36" name="zona scala" area="house"/>
  <color symbol="m" value="#ff00ff" name="segno asse"/>
  <color symbol="d" value="#5a3a22" name="porta"/>
  <color symbol="r" value="#b8a07a" name="strada"/>
  <color symbol="c" value="#c4ac7c" name="aia" area="yard"/>
  <color symbol="Q" value="#e0c050" name="pagliaio" area="yard"/>
  <color symbol="x" value="#6e5030" name="staccionata"/>
  <color symbol="t" value="#5e8a3e" name="albero" area="orchard"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H pavimento casa, E marker, h pavimento casa, w muro intonaco, a pavimento stalla, v muro stalla, s zona scala, d porta, r strada, c aia, x staccionata
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
EEExcwhhhhHhhhhwcccc
EEExcwhhhhhhhhhwvvvv
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwwwwdddwwwwaaav
EEExcccccrrrccccvvvv
EEEEEEEEErrrcccccccc
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H pavimento casa, E marker, h pavimento casa, w muro intonaco, a pavimento stalla, v muro stalla, s zona scala, d porta, r strada, c aia, x staccionata
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
EEExcwhhhhHhhhhwcccc
EEExcwhhhhhhhhhwvvvv
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwwwwdddwwwwaaav
EEExcccccrrrccccvvvv
EEEEEEEEErrrcccccccc
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H pavimento casa, E marker, h pavimento casa, w muro intonaco, a pavimento stalla, v muro stalla, s zona scala, d porta, r strada, c aia, x staccionata
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
EEExcwhhhhHhhhhwvvvv
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
Letters: H pavimento casa, E marker, h pavimento casa, w muro intonaco, a pavimento stalla, v muro stalla, s zona scala, d porta, r strada, c aia, Q pagliaio, x staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEExxxxxxxxxxxxxxxxxxxxxxxEEE
EEEExcccccccccccccccccccccxEEE
EEEExcccccccccccccccccccccxEEE
EEEExcccccccccccccccccccccxEEE
EEEExcccccccccccccccccccccxEEE
EEEExcccccccccccccccccccccxEEE
EEEExcccccwwwwwwwwwwwcccccxEEE
EEEExcccccwhhsssshhhwcccccxEEE
EEEExcccccwhhsssshhhwcccccxEEE
EEEExcccccwhhhhhhhhhwcccccxEEE
EEEExcccccwhhhhHhhhhwcccccxEEE
EEEExcccccwhhhhhhhhhwvvvvcxEEE
EEEExcccccwhhhhhhhhhwaaavcxEEE
EEEExcccccwhhhhhhhhhwaaavcxEEE
EEEExcccccwhhhhhhhhhwaaavcxEEE
EEEExcccccwhhhhhhhhhwaaavcxEEE
EEEExcccccwwwwdddwwwwaaavcxEEE
EEEExcccccccccrrrccccvvvvcxEEE
EEEExcccccccccrrrcccccccccxEEE
EEEExcccccccccrrrcccccccccxEEE
EEEExcccccccccrrrcccccQcccxEEE
EEEExcccccccccrrrcccccccccxEEE
EEEEEEEEEEEEEErrrcccccccccxEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.06 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
FATTORIA. Plan letters (a cell = 5 voxels):
  H centre, h house floor (two storeys), w house walls; s stair zone against the back-left wall, with two cells of landing
  a barn floor (one storey, mangers), v barn walls; the barn leans on one side wall of the house, side and row by seed
  m temporary axis, d front door (3 cells), r road to the edge
  c farmyard; Q haystack where 5x5 of yard fit; x fence where ground goes on (huge); t trees in 7x7 of meadow
Large: house + barn + yard. Huge: wider yard, haystack, fence, trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavsmdrcQxt" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="cEEEE" out="*x***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEHhfFTkOoNwWULRDagvVQcrxtlXYPZJ" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="t" out="EEEEE/EtttE/EtttE/EtttE/EEEEE"/>
      <sequence symmetry="(xy)">
        <!-- B. heights: the front door seed, then the house walls -->
        <all in="B D" out="D O" steps="1"/>
        <prl in="D" out="w"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- house floors -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- barn -->
        <all in="B v" out="v V" steps="40"/>
        <prl in="v" out="R"/>
        <all in="B a" out="a g" steps="1"/>
        <all in="B a" out="a B" steps="39"/>
        <prl in="a" out="R"/>
        <!-- haystack, fence, trees -->
        <all in="B Q" out="Q Q" steps="12"/>
        <all in="B x" out="x x" steps="5"/>
        <all in="B t" out="t t" steps="20"/>
        <all in="B t" out="l *" steps="1"/>
        <all steps="5"><rule in="lB" out="*l"/><rule in="B l" out="l *"/></all>
        <!-- C. the door between house and barn -->
        <one in="fWWWWWg" out="*OOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/W" out="*/O" symmetry="()" steps="5"/>
        <all in="W/O" out="O/*" symmetry="()" steps="5"/>
        <union symbol="+" values="WVU"/>
        <union symbol="=" values="fFg"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- windows -->
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
        <!-- furniture -->
        <one in="BBBBBB/BBBBBB/WWWWWW ffffff/ffffff/WWWWWW" out="XXXXXX/XXXXXX/****** ******/******/******" steps="1"/>
        <all in="B X" out="X *" steps="4"/>
        <one in="BBBBBBBB/BBBBBBBB/WWWWWWWW ffffffff/ffffffff/WWWWWWWW" out="YYYYYYYY/YYYYYYYY/******** ********/********/********" steps="1"/>
        <all in="B Y" out="Y *" steps="7"/>
        <one in="BBBBBBBB/BBBBBBBB/BBBBBBBB/WWWWWWWW FFFFFFFF/FFFFFFFF/FFFFFFFF/WWWWWWWW" out="PPPPPPPP/PPPPPPPP/PPPPPPPP/******** ********/********/********/********" steps="1"/>
        <all in="B P" out="P *" steps="3"/>
        <one in="BBBBBB/BBBBBB/WWWWWW FFFFFF/FFFFFF/WWWWWW" out="JJJJJJ/JJJJJJ/****** ******/******/******" steps="1"/>
        <all in="B J" out="J *" steps="3"/>
        <one in="BBBBBBBB/BBBBBBBB/VVVVVVVV gggggggg/gggggggg/VVVVVVVV" out="ZZZZZZZZ/ZZZZZZZZ/******** ********/********/********" steps="1"/>
        <all in="B Z" out="Z *" steps="5"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" value="#a08458" name="pavimento casa" area="house"/>
  <color symbol="h" value="#a08458" name="pavimento casa" area="house"/>
  <color symbol="f" value="#a08458" name="pavimento casa" area="house"/>
  <color symbol="F" value="#8a6c44" name="solaio" area="house"/>
  <color symbol="s" value="#7a5a36" name="zona scala" area="house"/>
  <color symbol="w" value="#e8dcc0" name="muro intonaco"/>
  <color symbol="W" value="#e8dcc0" name="muro intonaco"/>
  <color symbol="U" value="#e8dcc0" name="muro intonaco"/>
  <color symbol="D" value="#e8dcc0" name="muro intonaco"/>
  <color symbol="L" value="#5a86a8" name="finestra"/>
  <color symbol="R" value="#a8442e" name="tetto coppi"/>
  <color symbol="K" value="#8a8078" name="camino pietra"/>
  <color symbol="a" value="#8a6a3e" name="pavimento stalla" area="barn"/>
  <color symbol="g" value="#8a6a3e" name="pavimento stalla" area="barn"/>
  <color symbol="v" value="#9c6a42" name="muro stalla"/>
  <color symbol="V" value="#9c6a42" name="muro stalla"/>
  <color symbol="T" value="#6a4a2a" name="scala"/>
  <color symbol="k" value="#6a4a2a" name="scala"/>
  <color symbol="O" value="#5a3a22" name="porta"/>
  <color symbol="o" value="#3e2814" name="assi porta"/>
  <color symbol="N" value="#4a4440" name="stipite"/>
  <color symbol="d" value="#5a3a22" name="porta"/>
  <color symbol="m" value="#a08458" name="pavimento casa"/>
  <color symbol="r" value="#b8a07a" name="strada" area="yard"/>
  <color symbol="c" value="#c4ac7c" name="aia" area="yard"/>
  <color symbol="Q" value="#e0c050" name="pagliaio" area="yard"/>
  <color symbol="x" value="#6e5030" name="staccionata" area="pasture"/>
  <color symbol="t" value="#5c3e24" name="tronco" area="orchard"/>
  <color symbol="l" value="#5e8a3e" name="chioma" area="orchard"/>
  <color symbol="X" value="#7a4e2a" name="arredo cassapanca"/>
  <color symbol="Y" value="#b05a3a" name="arredo focolare"/>
  <color symbol="P" value="#d8c8a0" name="arredo letto"/>
  <color symbol="J" value="#946a40" name="arredo panca"/>
  <color symbol="Z" value="#c8a050" name="arredo mangiatoia"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
