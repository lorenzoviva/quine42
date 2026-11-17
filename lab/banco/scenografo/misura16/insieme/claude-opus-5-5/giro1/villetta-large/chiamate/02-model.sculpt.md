# model.sculpt · claude-opus-5-5 · 204 s

## Richiesta

Sculpt: villetta
What it looks like: villetta: a building one enters, with the door at the front. Furnished inside, in the same program: every room of every storey has its furniture (beds, tables, benches, shelves, chests, a hearth, barrels; mangers and hay where animals stay), standing on the floor against the walls, each piece a small body of its own material. Keep free what a body needs, the checks are the same: the door and the straight way in from it, two cells of free floor before every stair and where it comes out, a passage at least 11 voxels wide between the pieces to every room and every stair. Give every furniture material a colour of its own whose name begins with «arredo» (arredo letto, arredo tavolo…).
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
  VILLETTA: a small two-storey villa with a lower side wing, a front porch and a garden.
  Parts and letters on the plan:
    h  the hall of the main house (two storeys), w its walls; it stands around H.
    a  the wing, v its walls. It is one storey and stands against the left or right side wall, as the seed decides.
    s  the zone of the stair, along the back wall with two cells of landing before it.
    d  the door in the front wall, 3 cells wide, on the axis of H.
    p  the porch in front of the door, 2 deep and 5 wide.
    r  the road from the porch straight to the front edge.
    g  the garden lawn ring around the house. It appears only where the ground goes on (Huge and larger).
    x  the hedge around the garden, broken by the road.
    t  trees in free lawn of 7 x 7 (Gargantuan, or at Huge where it fits).
  The seeds change the depth of the house (+1 at the front), which side the wing is on and where it sits along that side, and the trees.
  What fits at each size:
    Large: house, wing and porch.
    Huge: also the garden and the hedge.
    Gargantuan: also the trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavsdprgxtm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- main body -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- wing on one side -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- stair zone along the back wall -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- way out: door, porch, road -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="[pr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="2"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- garden, only where the ground goes on -->
      <all in="[wvp]EEEEEEE" out="*gg*****" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE/*[wvp]" out="*g/**"/>
      <all in="gE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- trees in free lawn outside -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" value="ff00ff" name="centro"/>
  <color symbol="h" value="d8c8a0" name="sala" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro casa"/>
  <color symbol="a" value="c8b890" name="ala" area="house"/>
  <color symbol="v" value="d0c4a8" name="muro ala"/>
  <color symbol="s" value="8a6a40" name="zona scala"/>
  <color symbol="d" value="6a4020" name="porta"/>
  <color symbol="p" value="b08050" name="portico" area="porch"/>
  <color symbol="r" value="a09070" name="vialetto"/>
  <color symbol="g" value="88b060" name="prato" area="garden"/>
  <color symbol="x" value="4a7a3a" name="siepe"/>
  <color symbol="t" value="3a6a2a" name="albero" area="garden"/>
  <color symbol="m" value="ff8080" name="segno"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h sala, w muro casa, a ala, v muro ala, s zona scala, d porta, p portico, r vialetto, g prato, x siepe
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEExxxx
EEEEEwwwwwwwwwwwgxxx
EEEEEwhhsssshhhwgxxx
EEEEEwhhsssshhhwgxxx
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwwwwdddwwwwaaav
EEEExgggpppppgggvvvv
EEEExxggpppppggxEEEE
EEEExxxxErrrExxxEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h sala, w muro casa, a ala, v muro ala, s zona scala, d porta, p portico, r vialetto, g prato, x siepe
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEExxxx
EEEEEwwwwwwwwwwwgxxx
EEEEEwhhsssshhhwgxxx
EEEEEwhhsssshhhwgxxx
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwwwwdddwwwwaaav
EEEExgggpppppgggvvvv
EEEExxggpppppggxEEEE
EEEExxxxErrrExxxEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h sala, w muro casa, a ala, v muro ala, s zona scala, d porta, p portico, r vialetto, g prato, x siepe
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEExxxx
EEEEEwwwwwwwwwwwgxxx
EEEEEwhhsssshhhwgxxx
EEEEEwhhsssshhhwgggg
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwwwwdddwwwwvvvv
EEEExgggpppppggggggg
EEEExxggpppppggxxxxx
EEEExxxxErrrExxxxxxx
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h sala, w muro casa, a ala, v muro ala, s zona scala, d porta, p portico, r vialetto, g prato, x siepe, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtEEEEtEEEEEEEEEEEEEEEEEtEEE
EEEEEEEEEEEEtEEEtEEEtEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtEEExxxxxxxxxxxxxxxxxxxEEEE
EEEEEEExgggggggggggggggggxEEEE
EEEEEEExgggggggggggggggggxEEEE
EEEEEEExggwwwwwwwwwwwggggxEEEE
EEEtEEExggwhhsssshhhwggggxEEEE
EEEEEEExggwhhsssshhhwggggxEEEE
EEEEEEExggwhhhhhhhhhwggggxEEEE
EEEEEEExggwhhhhhhhhhwggggxEEEE
EEEtEEExggwhhhhhhhhhwvvvvEEEEE
EEEEEEExggwhhhhhhhhhwaaavEEEEE
EEEEEEExggwhhhhhhhhhwaaavEEEEE
EEEEEEExggwhhhhhhhhhwaaavEEEEE
EEEtEEExggwhhhhhhhhhwaaavEEEEE
EEEEEEExggwwwwdddwwwwaaavEEEEE
EEEEEEExgggggpppppgggvvvvEEEEE
EEEEEEExgggggpppppgggggggxEEEE
EEEtEEExxxxxxErrrggggggggxEEEE
EEEEEEEEEEEEEErrrxxxxxxxxxEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.08 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  VILLETTA: a two-storey villa with a lower side wing, a front porch on posts and a garden.
  Parts and letters on the plan:
    h  the hall of the main house (two storeys), w its walls, around H.
    a  the wing (one storey), v its walls, against the left or right side wall.
    s  the stair zone along the back wall, at a random place; l its landing (2 cells before it), e its exit and the way in.
    d  the door in the front wall, 3 cells wide, on the axis of H.
    p  the porch in front of the door, c its corner posts.
    r  the road from the porch to the front edge.
    g  the lawn ring around the house, x the hedge, t trees (Huge and up).
  The seeds change the depth of the house, the side and place of the wing, the place of the stair, the trees.
  Large: house, wing and porch. Huge: also the garden, the hedge and the trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="W"/>
  <union symbol="=" values="fFiI"/>
  <map scale="1/5 1/5 1" values="BHEhwavsdprgxtmcle" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <one in="wwwwwww/hhhhhhh/hhhhhhh" out="*******/**ssss*/**ssss*" symmetry="()" steps="1"/>
      <all in="hs" out="ls" symmetry="()" steps="1"/>
      <all in="hl" out="ll" symmetry="()" steps="1"/>
      <all in="sh" out="*e" symmetry="()" steps="1"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="[pr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="2"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="e"/><rule in="H" out="e"/></prl>
      <all in="Ep/*E" out="*c/**" symmetry="(x)"/>
      <all in="[wvp]EEEEEEE" out="*gg*****" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE/*[wvp]" out="*g/**"/>
      <all in="gE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEhwjvslafFiIWULROoNkTPyYZJxXrgnVCqubzcDK" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="e" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="p" out="PPPPP/PPPPP/PPPPP/PPPPP/PPPPP"/>
      <rule in="c" out="PPPPP/PYYYP/PYYYP/PYYYP/PPPPP"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="t" out="ggggg/gnnng/gnnng/gnnng/ggggg"/>
      <sequence symmetry="(xy)">
        <!-- B. columns -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B j" out="j O" steps="1"/><all in="B j" out="j W" steps="63"/>
        <all in="B v" out="v W" steps="6"/><all in="B v" out="v U" steps="14"/><all in="B v" out="v W" steps="12"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s i"/><rule in="B l" out="l i"/><rule in="B a" out="a f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B l" out="l B"/><rule in="B a" out="a B"/></all>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s I"/><rule in="B l" out="l I"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/><rule in="B l" out="l B"/></all>
        <prl><rule in="w" out="R"/><rule in="j" out="R"/><rule in="v" out="R"/><rule in="h" out="R"/><rule in="s" out="R"/><rule in="l" out="R"/><rule in="a" out="R"/></prl>
        <all in="B P" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <all in="B Y" out="Y Z" steps="34"/>
        <prl><rule in="y" out="J"/><rule in="Y" out="J"/></prl>
        <all in="B x" out="x X" steps="8"/>
        <prl in="x" out="X"/>
        <all in="B n" out="n V" steps="14"/>
        <prl in="n" out="C"/>
        <all in="CB" out="*C" steps="3"/>
        <all in="B C" out="C *" steps="6"/>
        <!-- C. doors and stair -->
        <one in="fWWWWWf" out="*OOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/W" out="*/O" symmetry="()" steps="5"/>
        <all in="W/O" out="O/*" symmetry="()" steps="5"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- windows -->
        <one steps="20"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- furniture, ground floor -->
        <one in="Wffff/Wffff/Wffff/Wffff/Wffff" out="*KK**/*KK**/*KK**/*KK**/*KK**" steps="1"/>
        <one in="Wfffff/Wfffff/Wfffff/Wfffff/Wfffff/Wfffff" out="*uuu**/*uuu**/*uuu**/*uuu**/*uuu**/*uuu**" steps="1"/>
        <one in="Wff/Wff/Wff/Wff/Wff/Wff" out="*b*/*b*/*b*/*b*/*b*/*b*" steps="2"/>
        <one in="Wfff/Wfff/Wfff" out="*zz*/*zz*/*zz*" steps="3"/>
        <!-- furniture, upper floor -->
        <one in="WFFFF/WFFFF/WFFFF/WFFFF/WFFFF/WFFFF/WFFFF/WFFFF" out="*qqq*/*qqq*/*qqq*/*qqq*/*qqq*/*qqq*/*qqq*/*qqq*" steps="2"/>
        <one in="WFFF/WFFF/WFFF/WFFF" out="*cc*/*cc*/*cc*/*cc*" steps="2"/>
        <one in="WFF/WFF/WFF/WFF/WFF/WFF" out="*D*/*D*/*D*/*D*/*D*/*D*" steps="2"/>
        <all in="B K" out="K *" steps="13"/>
        <all in="B u" out="u *" steps="7"/>
        <all in="B b" out="b *" steps="4"/>
        <all in="B z" out="z *" steps="7"/>
        <all in="B q" out="q *" steps="5"/>
        <all in="B c" out="c *" steps="4"/>
        <all in="B D" out="D *" steps="18"/>
        <!-- roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" value="ff00ff" name="centro"/>
  <color symbol="h" value="d8c8a0" name="sala" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro casa"/>
  <color symbol="a" value="c8b890" name="ala" area="house"/>
  <color symbol="v" value="d0c4a8" name="muro ala"/>
  <color symbol="s" value="8a6a40" name="zona scala"/>
  <color symbol="l" value="9a7a50" name="pianerottolo"/>
  <color symbol="e" value="9a7a50" name="passaggio"/>
  <color symbol="d" value="6a4020" name="porta"/>
  <color symbol="p" value="b08050" name="portico" area="porch"/>
  <color symbol="c" value="5a3a1a" name="pilastro"/>
  <color symbol="m" value="ff8080" name="segno"/>
  <color symbol="t" value="3a6a2a" name="albero" area="garden"/>
  <color symbol="f" value="b08a5a" name="pavimento" area="house"/>
  <color symbol="F" value="9a7a4a" name="solaio" area="house"/>
  <color symbol="i" value="b08a5a" name="pavimento passaggio" area="house"/>
  <color symbol="I" value="9a7a4a" name="solaio passaggio" area="house"/>
  <color symbol="W" value="ece0c4" name="intonaco"/>
  <color symbol="L" value="7aa8c8" name="vetro"/>
  <color symbol="R" value="b04a30" name="tegole"/>
  <color symbol="O" value="7a4a24" name="porta"/>
  <color symbol="o" value="4a2a14" name="assi porta"/>
  <color symbol="N" value="5a5048" name="stipite"/>
  <color symbol="k" value="8a6a40" name="gradini"/>
  <color symbol="T" value="8a6a40" name="scala"/>
  <color symbol="P" value="a07848" name="pavimento portico" area="porch"/>
  <color symbol="Z" value="5a3a1a" name="pilastro"/>
  <color symbol="J" value="8a3a28" name="tetto portico"/>
  <color symbol="X" value="4a7a3a" name="siepe"/>
  <color symbol="r" value="a09070" name="vialetto"/>
  <color symbol="g" value="88b060" name="prato" area="garden"/>
  <color symbol="V" value="6a4a2a" name="tronco"/>
  <color symbol="C" value="5a9a40" name="chioma"/>
  <color symbol="q" value="c86a5a" name="arredo letto"/>
  <color symbol="u" value="8a5a2a" name="arredo tavolo"/>
  <color symbol="b" value="a0703a" name="arredo panca"/>
  <color symbol="z" value="7a5030" name="arredo botte"/>
  <color symbol="c" value="6a4a28" name="arredo cassa"/>
  <color symbol="D" value="9a6a3a" name="arredo scaffale"/>
  <color symbol="K" value="707070" name="arredo focolare"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
