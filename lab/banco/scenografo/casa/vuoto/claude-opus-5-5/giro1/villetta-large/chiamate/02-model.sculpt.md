# model.sculpt · claude-opus-5-5 · 179 s

## Richiesta

Sculpt: villetta
What it looks like: villetta: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a dwelling (see «What fits»): the house takes most of the area, not a cottage in a garden. At least 10 tiles² of covered floor where a body stands (its centre, half a body off every wall) on the ground floor and on another storey, the ground floor in 2 rooms or more of at least 1.5 tiles² each (the hall and a room) divided by an inner wall with a door: about 75 × 65 voxels inside the outer walls at every size, two storeys.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Your program so far
<!--
villetta: a two-storey house that fills most of the plot, with a porch in front and the garden around it.
Parts and letters on the plan:
  h  the inside of the house: 15 to 17 cells wide (each seed may add a cell on one or both sides), 13 deep, 8 cells behind H and 4 in front
  w  the outer walls, one cell thick, corners filled
  j  the inner wall, through the middle: a hall in front (6 cells) and a room behind (6 cells)
  d  the front door, 3 cells wide in the middle of the front wall
  p  the porch, 4 cells deep against the front: under the door and stretching to one corner (the seed chooses which)
  n  the path across the porch; r the road on to the edge
  g  the garden ring, 4 wide, only where six cells of ground go on past the wall
  x  the hedge around the garden
  v  a lean-to in the side garden, 4 × 5 against a wall (side chosen by the seed)
  Q  the well; t the trees, in the free garden
Seeds change: the width of the house, the side of the porch, the side of the lean-to, the well and the trees.
Large: the house and its porch. Huge: the garden, hedge, lean-to, well and trees as well.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjmdpqnrgxvQt" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the body: a line across through H, 7 to each side, sometimes one more at an end -->
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="()"/>
      <prl in="Eh" out="h*" p="0.5" steps="1" symmetry="()"/>
      <!-- then 8 behind and 4 in front -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="8"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <!-- the outer walls -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the inner wall: 6 rows behind the back wall, wall to wall -->
      <one in="w/h/h/h/h/h/h/h" out="*/*/*/*/*/*/*/j" symmetry="()" steps="1"/>
      <all in="jh" out="*j" symmetry="(x)"/>
      <!-- the way out: from H straight to the front wall, the door 3 cells wide -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <!-- the porch: under the door, then toward one corner, 4 cells deep -->
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <one in="pE" out="*q" symmetry="(x)" steps="1"/>
      <all in="ww/qE" out="**/*q" symmetry="(x)"/>
      <all in="[dw]/E" out="*/q" symmetry="()" steps="0"/>
      <prl in="q" out="p"/>
      <all in="p/E" out="*/p" symmetry="()" steps="3"/>
      <!-- the path across the porch and the road to the edge -->
      <all in="[dn]/p" out="*/n" symmetry="()"/>
      <all in="[nr]/E" out="*/r" symmetry="()"/>
      <!-- the garden: 4 wide where six cells of ground go on past the wall; corners filled -->
      <all in="wEEEEEE" out="*gggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE/gE/*g" out="*g/*g/**"/>
      <!-- the hedge around it -->
      <all in="gE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- the lean-to against a side wall, the well and the trees in the free garden -->
      <one in="wgggg/wgggg/wgggg/wgggg/wgggg" out="*vvvv/*vvvv/*vvvv/*vvvv/*vvvv" symmetry="(x)" steps="1"/>
      <one in="ggg/ggg/ggg" out="***/*Q*/***" steps="1"/>
      <one in="ggg/ggg/ggg" out="***/*t*/***" steps="4"/>
      <!-- cleaning the markers -->
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" hidden="True"/>
  <color symbol="h" value="c9a777" name="pavimento" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro intonacato"/>
  <color symbol="j" value="d8c8a4" name="parete interna"/>
  <color symbol="m" value="b08850" name="corridoio"/>
  <color symbol="d" value="6b4226" name="porta"/>
  <color symbol="p" value="a07850" name="portico" area="porch"/>
  <color symbol="q" value="a07850" name="portico"/>
  <color symbol="n" value="9a8f80" name="vialetto" area="path"/>
  <color symbol="r" value="b5a68c" name="strada" area="road"/>
  <color symbol="g" value="8fae5a" name="giardino" area="garden"/>
  <color symbol="x" value="4e7a32" name="siepe" area="hedge"/>
  <color symbol="v" value="8a6a46" name="tettoia" area="shed"/>
  <color symbol="Q" value="7f8a96" name="pozzo" area="well"/>
  <color symbol="t" value="3f6b2a" name="albero" area="garden"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento, w muro intonacato, j parete interna, d porta, p portico, n vialetto
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EwwwwwwwwwwwwwwwwwwE
EwhhhhhhhhhhhhhhhhwE
EwhhhhhhhhhhhhhhhhwE
EwhhhhhhhhhhhhhhhhwE
EwhhhhhhhhhhhhhhhhwE
EwhhhhhhhhhhhhhhhhwE
EwhhhhhhhhhhhhhhhhwE
EwjjjjjjjjjjjjjjjjwE
EwhhhhhhhhhhhhhhhhwE
EwhhhhhhhhhhhhhhhhwE
EwhhhhhhhhhhhhhhhhwE
EwhhhhhhhhhhhhhhhhwE
EwhhhhhhhhhhhhhhhhwE
EwhhhhhhhhhhhhhhhhwE
EwwwwwwwwdddwwwwwwwE
EppppppppnnnpppppppE
EppppppppnnnpppppppE
EppppppppnnnpppppppE
EppppppppnnnpppppppE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento, w muro intonacato, j parete interna, d porta, p portico, n vialetto
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEwwwwwwwwwwwwwwwwww
EEwhhhhhhhhhhhhhhhhw
EEwhhhhhhhhhhhhhhhhw
EEwhhhhhhhhhhhhhhhhw
EEwhhhhhhhhhhhhhhhhw
EEwhhhhhhhhhhhhhhhhw
EEwhhhhhhhhhhhhhhhhw
EEwjjjjjjjjjjjjjjjjw
EEwhhhhhhhhhhhhhhhhw
EEwhhhhhhhhhhhhhhhhw
EEwhhhhhhhhhhhhhhhhw
EEwhhhhhhhhhhhhhhhhw
EEwhhhhhhhhhhhhhhhhw
EEwhhhhhhhhhhhhhhhhw
EEwwwwwwwdddwwwwwwww
EEpppppppnnnpppppppp
EEpppppppnnnpppppppp
EEpppppppnnnpppppppp
EEpppppppnnnpppppppp
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento, w muro intonacato, j parete interna, d porta, p portico, n vialetto
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
Ewwwwwwwwwwwwwwwwwww
Ewhhhhhhhhhhhhhhhhhw
Ewhhhhhhhhhhhhhhhhhw
Ewhhhhhhhhhhhhhhhhhw
Ewhhhhhhhhhhhhhhhhhw
Ewhhhhhhhhhhhhhhhhhw
Ewhhhhhhhhhhhhhhhhhw
Ewjjjjjjjjjjjjjjjjjw
Ewhhhhhhhhhhhhhhhhhw
Ewhhhhhhhhhhhhhhhhhw
Ewhhhhhhhhhhhhhhhhhw
Ewhhhhhhhhhhhhhhhhhw
Ewhhhhhhhhhhhhhhhhhw
Ewhhhhhhhhhhhhhhhhhw
Ewwwwwwwwdddwwwwwwww
Eppppppppnnnpppppppp
Eppppppppnnnpppppppp
Eppppppppnnnpppppppp
Eppppppppnnnpppppppp
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento, w muro intonacato, j parete interna, d porta, p portico, n vialetto, r strada, g giardino, x siepe, v tettoia, Q pozzo, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
ExxxxxxxxxxxxxxxxxxxxxxxxxxxxE
ExggggggggggggggggggggggggggxE
ExggggggggggggggggggggggggggxE
ExggggtgggggggggggggggggggggxE
ExggggggggggggggggggggggggggxE
ExggggwwwwwwwwwwwwwwwwwwggggxE
ExggtgwhhhhhhhhhhhhhhhhwggggxE
ExggggwhhhhhhhhhhhhhhhhwgtggxE
ExggggwhhhhhhhhhhhhhhhhwggggxE
ExggggwhhhhhhhhhhhhhhhhwggggxE
ExgQggwhhhhhhhhhhhhhhhhwvvvvxE
ExggggwhhhhhhhhhhhhhhhhwvvvvxE
ExggggwjjjjjjjjjjjjjjjjwvvvvxE
ExggggwhhhhhhhhhhhhhhhhwvvvvxE
ExggggwhhhhhhhhhhhhhhhhwvvvvxE
ExggggwhhhhhhhhhhhhhhhhwggggxE
ExggtgwhhhhhhhhhhhhhhhhwggggxE
ExggggwhhhhhhhhhhhhhhhhwggggxE
ExggggwhhhhhhhhhhhhhhhhwggggxE
ExggggwwwwwwwwdddwwwwwwwggggxE
ExxxxxppppppppnnnpppppppxxxxxE
EEEEEEppppppppnnnpppppppEEEEEE
EEEEEEppppppppnnnpppppppEEEEEE
EEEEEEppppppppnnnpppppppEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.20 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
villetta: a two-storey house that fills most of the plot, a porch with posts in front, the garden walled round it at Huge.
Plan letters:
  h  inside of the house, 15 to 17 cells wide, 13 deep (8 behind H, 4 in front)
  w  outer walls; j inner wall (hall in front, room behind); e the inner door, 3 cells in j on the axis
  d  front door, 3 cells; s the stair zone in the hall, against the inner wall, landing on its left
  p  porch toward one corner (side by seed); P its posts on the front row; n path; r road to the edge
  g  garden, x garden wall with merlons, v lean-to, Q well, t trees (Huge only)
Seeds change: width, porch side, lean-to side, well and trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjmdpqnrgxvQtesP" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="()"/>
      <prl in="Eh" out="h*" p="0.5" steps="1" symmetry="()"/>
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="8"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="w/h/h/h/h/h/h/h" out="*/*/*/*/*/*/*/j" symmetry="()" steps="1"/>
      <all in="jh" out="*j" symmetry="(x)"/>
      <all in="j/h/H" out="e/*/*" symmetry="()" steps="1"/>
      <all in="ej" out="*e" symmetry="(x)" steps="1"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <one in="wjjjjjjj/whhhhhhh/whhhhhhh" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <one in="pE" out="*q" symmetry="(x)" steps="1"/>
      <all in="ww/qE" out="**/*q" symmetry="(x)"/>
      <prl in="q" out="p"/>
      <all in="p/E" out="*/p" symmetry="()" steps="3"/>
      <all in="[dn]/p" out="*/n" symmetry="()"/>
      <all in="[nr]/E" out="*/r" symmetry="()"/>
      <all in="w/p/p/p/p" out="*/*/*/*/P" symmetry="()"/>
      <all in="PP" out="Pp" symmetry="()"/>
      <all in="wEEEEEE" out="*gggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE/gE/*g" out="*g/*g/**"/>
      <all in="gE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <one in="wgggg/wgggg/wgggg/wgggg/wgggg" out="*vvvv/*vvvv/*vvvv/*vvvv/*vvvv" symmetry="(x)" steps="1"/>
      <one in="ggg/ggg/ggg" out="***/*Q*/***" steps="1"/>
      <one in="ggg/ggg/ggg" out="***/*t*/***" steps="4"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
    </sequence>
    <map scale="5 5 1" values="BEhwjdespPbnrgxvQGAtcfFTkWULRJOoNMZyYDCK" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="e" out="eeeee/eeeee/eeeee/eeeee/eeeee"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="P" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="Q" out="ggggg/gGGGg/gGAGg/gGGGg/ggggg"/>
      <rule in="t" out="ggggg/gcccg/gcccg/gcccg/ggggg"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <all in="B j" out="j J" steps="64"/>
        <prl in="j" out="R"/>
        <all in="B d" out="D *" steps="1"/><all in="B D" out="D W" steps="63"/>
        <all in="B e" out="Y *" steps="1"/><all in="B Y" out="Y J" steps="63"/>
        <prl><rule in="D" out="R"/><rule in="Y" out="R"/><rule in="d" out="O"/><rule in="e" out="O"/></prl>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/><all in="B K" out="K *" steps="4"/>
        <all steps="1"><rule in="B p" out="y *"/><rule in="B n" out="y *"/><rule in="B v" out="y *"/></all>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="Z"/>
        <all in="B b" out="b *" steps="34"/>
        <all in="B x" out="x *" steps="11"/>
        <all in="B G" out="G *" steps="4"/>
        <all in="B c" out="c *" steps="14"/>
        <all in="B c" out="C *" steps="1"/>
        <all in="B C" out="C *" steps="8"/>
        <all in="CB" out="*C" steps="3"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <union symbol="+" values="WJx"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="x"/>
  <color symbol="E" hidden="True"/>
  <color symbol="H" hidden="True"/>
  <color symbol="h" value="c9a777" name="pavimento" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro intonacato"/>
  <color symbol="j" value="d8c8a4" name="parete interna"/>
  <color symbol="m" value="b08850" name="corridoio"/>
  <color symbol="d" value="6b4226" name="porta"/>
  <color symbol="e" value="6b4226" name="porta interna"/>
  <color symbol="s" value="b08850" name="scala" area="house"/>
  <color symbol="p" value="a07850" name="portico" area="porch"/>
  <color symbol="P" value="a07850" name="portico" area="porch"/>
  <color symbol="q" value="a07850" name="portico"/>
  <color symbol="b" value="5a3a22" name="pilastro"/>
  <color symbol="n" value="9a8f80" name="vialetto" area="path"/>
  <color symbol="r" value="b5a68c" name="strada" area="road"/>
  <color symbol="g" value="8fae5a" name="giardino" area="garden"/>
  <color symbol="x" value="a8a296" name="muro di cinta" area="wall"/>
  <color symbol="v" value="8a6a46" name="tettoia" area="shed"/>
  <color symbol="Q" value="7f8a96" name="pozzo" area="well"/>
  <color symbol="G" value="7f8a96" name="pozzo" area="well"/>
  <color symbol="A" value="4a7fa8" name="acqua" area="well"/>
  <color symbol="t" value="3f6b2a" name="albero" area="garden"/>
  <color symbol="c" value="6a4a2c" name="tronco" area="garden"/>
  <color symbol="C" value="5f9a3e" name="chioma"/>
  <color symbol="f" value="c9a777" name="pavimento" area="house"/>
  <color symbol="F" value="a8865a" name="solaio"/>
  <color symbol="T" value="b08850" name="scala"/>
  <color symbol="k" value="8a6440" name="gradini"/>
  <color symbol="W" value="e8dcc0" name="muro intonacato"/>
  <color symbol="U" value="2e2a26" name="feritoia"/>
  <color symbol="L" value="8fc3d8" name="finestra"/>
  <color symbol="R" value="b04a32" name="tetto di coppi"/>
  <color symbol="J" value="d8c8a4" name="parete interna"/>
  <color symbol="O" value="7a4a28" name="porta"/>
  <color symbol="o" value="4a2c18" name="assi della porta"/>
  <color symbol="N" value="5a4a3a" name="stipite"/>
  <color symbol="M" value="9a958a" name="merlo"/>
  <color symbol="Z" value="8a5a34" name="tetto del portico"/>
  <color symbol="y" value="8a5a34" name="tetto del portico"/>
  <color symbol="Y" value="d8c8a4" name="parete interna"/>
  <color symbol="D" value="e8dcc0" name="muro intonacato"/>
  <color symbol="K" value="7a3a2a" name="comignolo"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
