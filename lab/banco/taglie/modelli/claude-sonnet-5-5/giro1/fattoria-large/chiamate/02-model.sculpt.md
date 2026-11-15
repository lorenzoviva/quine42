# model.sculpt · claude-sonnet-5-5 · 704 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
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
FATTORIA, block 1: the composition.
Parts: the HOUSE (h floor, w walls, centre H) at the middle: a body of 9 cells across and 9 to 11 deep.
  The seeds change the depth (the front and the back each take one more cell by chance).
The DOOR d is 3 cells wide in the middle of the front wall. The ROAD r runs from it straight to the edge, 3 wide.
The PORCH p is 5 wide and 2 deep on the road, against the door.
The HAY LEAN-TO l is behind the house, against the back wall on its axis: 7 wide and 5 deep (35 x 25 voxels).
At Large: house, porch, lean-to with the hay behind, road.
At Huge, where the ground goes on, there is more:
  the BARN a (interior), v (walls): a body of 6 x 7 cells against a side wall of the house.
  The seeds choose the side and the place along the wall.
  The CROP FIELD z lies beside the road, on the side that is free.
  The YARD c is a ring of two cells around the house, the barn and the lean-to, with the FENCE x beyond it.
  The ORCHARD t is single trees on free ground, each in a 5 x 5 window.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhgwdrplavcxzt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the house: a line through H, 3 behind and 5 in front, each end one more by chance -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <!-- 4 cells to each side of every cell of the line; the side cells are g, only the axis stays h -->
      <all in="[Hhg]E" out="*g" symmetry="(x)" steps="4"/>
      <all in="[hg]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- the hay lean-to: against the back wall on the axis, 7 wide and 5 deep -->
      <all in="E/w/h" out="l/*/*" symmetry="()" steps="1"/>
      <all in="lE" out="*l" symmetry="(x)" steps="3"/>
      <all in="E/l" out="l/*" symmetry="()" steps="4"/>

      <!-- the door in the middle of the front wall, the road to the edge, the road and the door widened to 3 -->
      <all in="h/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>

      <!-- the porch: 3 wide, 2 deep, then 5 wide -->
      <all in="d/r" out="*/p" symmetry="()" steps="1"/>
      <all in="p/r" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>

      <!-- the barn: only where 8 cells of ground go on from a side wall, on 7 rows; the side and the place are chosen by the seed -->
      <one in="EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw" out="*********/*********/*********/*******a*/*********/*********/*********" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="5"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- the crop field: beside the road, where 5 rows of 6 free cells lie along it -->
      <one in="rEEEEEE/rEEEEEE/rEEEEEE/rEEEEEE/rEEEEEE" out="*zzzzzz/*zzzzzz/*zzzzzz/*zzzzzz/*zzzzzz" symmetry="(x)" steps="1"/>

      <!-- the yard: two cells around the house, the barn and the lean-to; the fence beyond it only where the ground goes on -->
      <all in="[wvl]E" out="*c" steps="1"/>
      <all in="cE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEE" out="*x**" steps="1"/>

      <!-- the orchard: a tree in every free window of 5 x 5 -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****" steps="6"/>

      <!-- the floor of the house: g becomes h -->
      <prl in="g" out="h"/>
    </sequence>
  </map>
  <color symbol="E" value="7BA05B" name="terra" hidden="True"/>
  <color symbol="H" value="C94F3D" name="focolare" area="house"/>
  <color symbol="h" value="E3C58E" name="pavimento" area="house"/>
  <color symbol="g" value="E3C58E" name="pavimento" area="house"/>
  <color symbol="w" value="D9CBB0" name="muro"/>
  <color symbol="d" value="5B3A29" name="portone"/>
  <color symbol="r" value="C4A574" name="strada"/>
  <color symbol="p" value="A8643C" name="portico" area="porch"/>
  <color symbol="l" value="D8B84A" name="tettoia del fieno" area="shed"/>
  <color symbol="a" value="E8D8B8" name="stalla" area="barn"/>
  <color symbol="v" value="B55A3C" name="muro della stalla"/>
  <color symbol="c" value="A4C27A" name="aia" area="yard"/>
  <color symbol="x" value="7A5230" name="recinto"/>
  <color symbol="z" value="B9A04A" name="campo" area="field"/>
  <color symbol="t" value="3E7A3C" name="albero" area="orchard"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H focolare, E terra, h pavimento, w muro, d portone, r strada, p portico, l tettoia del fieno, c aia, x recinto
Plan (the letter of every cell):
```
EExcccclllllllccccEE
EExcccclllllllccccEE
EExcccclllllllccccEE
EExcccclllllllccccEE
EExcccclllllllccccEE
EExccwwwwwwwwwwwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhHhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwwwwdddwwwwccEE
EExcccccpppppcccccEE
EExcccccpppppcccccEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H focolare, E terra, h pavimento, w muro, d portone, r strada, p portico, l tettoia del fieno, c aia, x recinto
Plan (the letter of every cell):
```
EExcccclllllllccccEE
EExcccclllllllccccEE
EExcccclllllllccccEE
EExcccclllllllccccEE
EExcccclllllllccccEE
EExccwwwwwwwwwwwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhHhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwwwwdddwwwwccEE
EExcccccpppppcccccEE
EExcccccpppppcccccEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H focolare, E terra, h pavimento, w muro, d portone, r strada, p portico, l tettoia del fieno, c aia, x recinto
Plan (the letter of every cell):
```
EExcccclllllllccccEE
EExcccclllllllccccEE
EExcccclllllllccccEE
EExcccclllllllccccEE
EExcccclllllllccccEE
EExccwwwwwwwwwwwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhHhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwhhhhhhhhhwccEE
EExccwwwwdddwwwwccEE
EExcccccpppppcccccEE
EExcccccpppppcccccEE
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H focolare, E terra, h pavimento, w muro, d portone, r strada, p portico, l tettoia del fieno, a stalla, v muro della stalla, c aia, x recinto, z campo, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEExxxxxxxxxxxxxxxxxxxxxx
EEEEEEExcccccccccccccccccccccc
EEtEEEExcccccccccccccccccccccc
EEEEEEExcccclllllllccccccccccc
EEEEEEExcccclllllllccccccccccc
EEEEEEExcccclllllllccccccccccc
EEEEEEExcccclllllllccccccccccc
EEtEEEExcccclllllllccccccccccc
EEEEEEExccwwwwwwwwwwwvvvvvvvcc
EEEEEEExccwhhhhhhhhhwaaaaaavcc
EEEEEEExccwhhhhhhhhhwaaaaaavcc
EEEEEEExccwhhhhhhhhhwaaaaaavcc
EEEEEEExccwhhhhhhhhhwaaaaaavcc
EEEEEEExccwhhhhHhhhhwaaaaaavcc
EEEEEEExccwhhhhhhhhhwaaaaaavcc
EEEEtEExccwhhhhhhhhhwaaaaaavcc
EEEEEEExccwhhhhhhhhhwvvvvvvvcc
EEEEEEExccwhhhhhhhhhwccccccccc
EEEEEEExccwhhhhhhhhhwccccccccc
EEEtEEExccwwwwdddwwwwccccccccc
EEEEEEExcccccpppppcccccccccccc
EEEEEEExcccccpppppcccccccccccc
EEEEEEEEzzzzzzrrrExxxxxxxxxxxx
EEEEEEEEzzzzzzrrrEEEEEEEEEEEEE
EEtEEEEEzzzzzzrrrEEEEEEEEEEEEE
EEEEEEEEzzzzzzrrrEEEEEEEtEEEEE
EEEEEEEEzzzzzzrrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
FATTORIA, block 2: the whole program.
PARTS: the HOUSE (two storeys, hip roof, chimney) at the centre; the PORCH on the axis of the door; the HAY SHED behind
  the back wall; the SIDE LEAN-TO (b) against a side wall; the road to the edge; the YARD ring and the FENCE.
  At Huge there is more: the BARN with its own door, the FIELD beside the road, the ORCHARD.
WHAT THE SEEDS CHANGE: the depth of the house (front and back by chance), the depth of the porch, where the hay shed
  stands along the back wall, the side and place of the lean-to, the side and place of the barn and its door, the
  chimney, the windows, the field, the trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhgwdrplavcxztsnqbe" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the house -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hhg]E" out="*g" symmetry="(x)" steps="4"/>
      <all in="[hg]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- the barn: only where 8 cells of ground go on from a side wall, on 7 rows -->
      <one in="EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw" out="*********/*********/*********/*******a*/*********/*********/*********" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="5"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- the side lean-to: against a side wall, 4 out and 5 along it, side and place by chance -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/b*/**/**" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="3"/>
      <all in="E/b" out="b/*" symmetry="()" steps="2"/>
      <all in="b/E" out="*/b" symmetry="()" steps="2"/>

      <!-- the hay shed: behind the back wall, 7 wide and 5 deep, at a cell of the wall chosen by the seed -->
      <one in="E/w/[hg]" out="l/*/*" symmetry="()" steps="1"/>
      <all in="lE" out="*l" symmetry="(x)" steps="3"/>
      <all in="E/l" out="l/*" symmetry="()" steps="4"/>

      <!-- the door, the road to the edge, the porch (2 deep, a third by chance), widened -->
      <all in="h/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="d/r" out="*/p" symmetry="()" steps="1"/>
      <all in="p/r" out="*/p" symmetry="()" steps="1"/>
      <prl in="p/r" out="*/p" p="0.5" steps="1" symmetry="()"/>
      <all in="pE" out="*p" symmetry="(x)" steps="2"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>

      <!-- posts: the outer corners of the porch, the shed and the lean-to -->
      <all in="Ep/EE" out="*n/**" symmetry="(x)"/>
      <all in="EE/El" out="**/*q" symmetry="(xy)"/>
      <all in="EE/Eb" out="**/*q" symmetry="(xy)"/>

      <!-- the crop field beside the road, where the ground allows -->
      <one in="rEEEEEE/rEEEEEE/rEEEEEE/rEEEEEE/rEEEEEE" out="*zzzzzz/*zzzzzz/*zzzzzz/*zzzzzz/*zzzzzz" symmetry="(x)" steps="1"/>

      <!-- the yard: two cells around everything; the fence beyond it where the ground goes on -->
      <all in="[wvlqb]E" out="*c" steps="1"/>
      <all in="cE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEE" out="*x**" steps="1"/>

      <!-- the orchard: a tree in every free window of 5 x 5 -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****" steps="6"/>

      <!-- the floor of the house, the zone of the stair (back left, two cells of landing), the door of the barn -->
      <prl in="g" out="h"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="aaa/vvv/ccc" out="***/*e*/***" symmetry="()" steps="1"/>
      <all in="aa/ve" out="**/e*" symmetry="(x)" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BEhswdrcpPlaAvVGeQxzugtjmyfFWYRLJKTk#90#91#92ONo#20#21" symmetry="()">
      <union symbol="+" values="WYVG"/>
      <union symbol="=" values="fF"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="g" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="n" out="ppppp/pPPPp/pPPPp/pPPPp/ppppp"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="b" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="q" out="lllll/lPPPl/lPPPl/lPPPl/lllll"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="e" out="eeeee/eeeee/eeeee/eeeee/eeeee"/>
      <rule in="x" out="EEEEE/ExxxE/ExxxE/ExxxE/EEEEE"/>
      <rule in="z" out="zzzzz/uuuuu/zzzzz/uuuuu/zzzzz"/>
      <rule in="t" out="ggggg/gtttg/gtttg/gtttg/ggggg"/>
      <sequence symmetry="(xy)">
        <!-- B. z=0: floors, the seeds of the doors, the first layer of the walls, the markers of the roofs -->
        <all steps="1">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d O"/>
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
          <rule in="B v" out="v V"/>
          <rule in="B a" out="a A"/>
          <rule in="B e" out="e O"/>
          <rule in="B x" out="x x"/>
          <rule in="B t" out="t j"/>
          <rule in="B u" out="u z"/>
          <rule in="B p" out="y *"/>
          <rule in="B l" out="y *"/>
        </all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>

        <!-- the walls of the house: two storeys of plaster, a band for the windows, plaster -->
        <all steps="5"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w Y"/><rule in="B d" out="d Y"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="6"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>
        <all steps="14"><rule in="B w" out="w Y"/><rule in="B d" out="d Y"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B d" out="d W"/></all>

        <!-- the floors, the slab, the air of two storeys -->
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>

        <!-- the barn: brick, a dark band, brick; empty inside up to 40 -->
        <all steps="7"><rule in="B v" out="v V"/><rule in="B e" out="e V"/></all>
        <all steps="14"><rule in="B v" out="v G"/><rule in="B e" out="e G"/></all>
        <all steps="18"><rule in="B v" out="v V"/><rule in="B e" out="e V"/></all>
        <all in="B a" out="a B" steps="39"/>

        <!-- the heads become roofs -->
        <prl>
          <rule in="w" out="R"/>
          <rule in="d" out="R"/>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
          <rule in="v" out="Q"/>
          <rule in="e" out="Q"/>
          <rule in="a" out="Q"/>
        </prl>

        <!-- the posts and the roofs of the porch, the shed and the lean-to (34 up, two layers) -->
        <all in="B P" out="P P" steps="33"/>
        <all in="B P" out="J P" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <all in="B J" out="J J" steps="1"/>

        <!-- the fence, the crops, the trees -->
        <all in="B x" out="x x" steps="8"/>
        <all in="B u" out="u u" steps="3"/>
        <all in="B t" out="t j" steps="8"/>
        <prl in="t" out="m"/>
        <all in="B m" out="m m" steps="6"/>
        <all in="mB" out="*m" steps="2" symmetry="(xy)"/>

        <!-- C. the doors, the stair -->
        <import file="part-door"/>
        <import file="part-stair"/>

        <!-- the windows: a pane of 6 x 8 in the band, with a margin, through the whole wall -->
        <one steps="14">
          <rule in="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"
                out="*****/*****/*****/*****/*****/*****/*****/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/*****/*****/*****/*****/*****/*****/*****"/>
        </one>
        <one steps="4">
          <rule in="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"
                out="*****/*****/*****/*****/*****/*****/*****/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/LLLLL/***** *****/*****/*****/*****/*****/*****/*****/*****"/>
        </one>

        <!-- the roofs: the house is a hip roof of 10 layers, the barn of 8 -->
        <all in="***/*B*/*** *R*/RRR/*R*" out="***/*R*/*** ***/***/***" steps="10" symmetry="()"/>
        <all in="***/*B*/*** *Q*/QQQ/*Q*" out="***/*Q*/*** ***/***/***" steps="8" symmetry="()"/>

        <!-- a chimney on the flat top, where the seed puts it -->
        <one in="BBB/BBB/BBB RRR/RRR/RRR" out="KKK/KKK/KKK ***/***/***" steps="1" symmetry="()"/>
        <all in="B K" out="K K" steps="4"/>

        <!-- cleaning -->
        <prl in="T" out="B"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" value="7BA05B" name="terra" hidden="True"/>
  <color symbol="H" value="C94F3D" name="focolare"/>
  <color symbol="h" value="E3C58E" name="pavimento"/>
  <color symbol="g" value="86AE62" name="frutteto" area="orchard"/>
  <color symbol="w" value="D9CBB0" name="muro"/>
  <color symbol="d" value="5B3A29" name="portone"/>
  <color symbol="r" value="C4A574" name="strada"/>
  <color symbol="p" value="A8643C" name="portico" area="porch"/>
  <color symbol="l" value="D8B84A" name="tettoia del fieno" area="shed"/>
  <color symbol="a" value="E8D8B8" name="stalla"/>
  <color symbol="v" value="B55A3C" name="muro della stalla"/>
  <color symbol="c" value="A4C27A" name="aia" area="yard"/>
  <color symbol="x" value="7A5230" name="recinto"/>
  <color symbol="z" value="B9A04A" name="campo" area="field"/>
  <color symbol="t" value="3E7A3C" name="albero"/>
  <color symbol="s" value="D9A066" name="scala"/>
  <color symbol="n" value="6B4A2F" name="palo del portico"/>
  <color symbol="q" value="6B4A2F" name="palo della tettoia"/>
  <color symbol="b" value="D8B84A" name="tettoia laterale"/>
  <color symbol="e" value="5B3A29" name="portone della stalla"/>
  <color symbol="f" value="C9A06B" name="assi" area="house"/>
  <color symbol="F" value="A9805A" name="solaio"/>
  <color symbol="W" value="EDE3CC" name="intonaco"/>
  <color symbol="Y" value="E3D3B0" name="fascia"/>
  <color symbol="R" value="B5483A" name="tetto"/>
  <color symbol="L" value="9CC7D9" name="vetro"/>
  <color symbol="O" value="7A4A2B" name="porta"/>
  <color symbol="o" value="4A2F1E" name="assi della porta"/>
  <color symbol="N" value="3B2A20" name="stipite"/>
  <color symbol="k" value="8C6A44" name="gradini"/>
  <color symbol="P" value="6B4A2F" name="palo"/>
  <color symbol="J" value="8B5E3C" name="copertura in legno"/>
  <color symbol="A" value="B89A68" name="lettiera della stalla" area="barn"/>
  <color symbol="V" value="B8573A" name="mattone"/>
  <color symbol="G" value="5A3B28" name="travi"/>
  <color symbol="Q" value="5E4033" name="tetto della stalla"/>
  <color symbol="u" value="6FA33F" name="raccolto"/>
  <color symbol="j" value="6B4226" name="tronco"/>
  <color symbol="m" value="3E7A3C" name="chioma"/>
  <color symbol="K" value="9A8F85" name="camino"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
