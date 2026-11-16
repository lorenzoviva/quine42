# model.sculpt · claude-opus-5-5 · 114 s

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
  Fattoria (farm).
  Parts and their letters on the plan:
    h  the farmhouse floor, a body around H, 9 cells wide
    w  the walls of the farmhouse
    s  the stair zone, along the back wall, inside h
    a  the barn floor, a wing set against one side wall of the house
    v  the walls of the barn
    c  the farmyard (aia) around the house and the barn
    x  the fence around the yard
    d  the door, in the middle of the front wall
    p  the porch, in front of the door
    r  the road, from the porch to the edge
    Y  the haystack, in the yard as far as possible from the road
    Q  the well, where 5 x 5 of yard is free
    t  the trees of the orchard, outside the fence, where 7 x 7 of ground is free
    m  a marker for the path from the centre to the door
  Where each part goes:
    The house stands at the centre. Its door faces the front (+y) and the porch and the road run on that axis.
    The barn leans on a side wall. The yard wraps both buildings and the fence wraps the yard.
    The haystack is kept away from the gate.
  What the seeds change:
    the depth of the house, the side and the position of the barn, the corner of the hay,
    and where the trees and the well go.
  What fits at each size:
    Large: the house, the barn, the porch, a thin yard, the fence and the hay behind.
    Huge: a wider yard with a well, and an orchard of trees outside the fence.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavcxdprYQtm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the farmhouse: 4 behind, 3 in front plus one by chance, 4 to each side -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the barn: a wing on one side wall -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- the stair zone along the back wall -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- the yard, which grows where there is ground -->
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- the fence -->
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- the door, the porch and the road to the front -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dp]/[cxE]" out="*/p" symmetry="()" steps="4"/>
      <all in="[pr]/[cxE]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[cxE]" out="*r" symmetry="(x)" steps="1"/>
      <all in="p[cx]" out="*p" symmetry="(x)" steps="3"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- the haystack, far from the road -->
      <one in="c" out="Y" steps="1"><field for="Y" from="r" on="cr"/></one>
      <all steps="2"><rule in="Yc" out="*Y"/><rule in="Y*/*c" out="**/*Y"/></all>
      <!-- the well in a free square of yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- the orchard trees on free ground -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="H" value="ffffff" name="centro"/>
  <color symbol="h" value="c9a36b" name="pavimento di casa" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro di casa" area="house"/>
  <color symbol="s" value="8a5a30" name="scala" area="house"/>
  <color symbol="a" value="b08850" name="pavimento del fienile" area="barn"/>
  <color symbol="v" value="a04030" name="muro del fienile" area="barn"/>
  <color symbol="c" value="d8c890" name="aia" area="yard"/>
  <color symbol="x" value="6b4a2a" name="staccionata" area="yard"/>
  <color symbol="d" value="4a2a18" name="porta" area="house"/>
  <color symbol="p" value="9a7040" name="portico" area="porch"/>
  <color symbol="r" value="a89878" name="strada"/>
  <color symbol="Y" value="e0c040" name="pagliaio" area="yard"/>
  <color symbol="Q" value="5080a0" name="pozzo" area="yard"/>
  <color symbol="t" value="5a8a3a" name="albero" area="orchard"/>
  <color symbol="m" value="ff00ff" name="segno"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, h pavimento di casa, w muro di casa, s scala, a pavimento del fienile, v muro del fienile, c aia, x staccionata, d porta, p portico, r strada, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
xxxxxxxxxxxxxxxxxxEE
cccccccccccccccccxEE
cvvvvccccccccccccxEE
cvaaawwwwwwwwwwwcxEE
cvaaawhhsssshhhwcxEE
cvaaawhhsssshhhwcxEE
cvaaawhhhhhhhhhwcxEE
cvaaawhhhhhhhhhwcxEE
cvvvvwhhhhhhhhhwcxEE
cccccwhhhhhhhhhwcxEE
cccccwhhhhhhhhhwcxEE
ccQccwhhhhhhhhhwcxEE
cccccwwwwdddwwwwcxEE
cccccccpppppppcccxEE
xxxxxxxpppppppxxxxEE
EEEEEEEEEEpEEEEEEEEE
EEEEEEEEEEpEEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, h pavimento di casa, w muro di casa, s scala, a pavimento del fienile, v muro del fienile, c aia, x staccionata, d porta, p portico, r strada, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
xxxxxxxxxxxxxxxxxxEE
cccccccccccccccccxEE
cvvvvccccccccccccxEE
cvaaawwwwwwwwwwwcxEE
cvaaawhhsssshhhwcxEE
cvaaawhhsssshhhwcxEE
cvaaawhhhhhhhhhwcxEE
cvaaawhhhhhhhhhwcxEE
cvvvvwhhhhhhhhhwcxEE
cccccwhhhhhhhhhwcxEE
cccccwhhhhhhhhhwcxEE
ccQccwhhhhhhhhhwcxEE
cccccwwwwdddwwwwcxEE
cccccccpppppppcccxEE
xxxxxxxpppppppxxxxEE
EEEEEEEEEEpEEEEEEEEE
EEEEEEEEEEpEEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, h pavimento di casa, w muro di casa, s scala, a pavimento del fienile, v muro del fienile, c aia, x staccionata, d porta, p portico, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEExxxxxxxxxxxxxxxxx
EEExcccccccccccccccc
EEExcwwwwwwwwwwwvvvv
EEExcwhhsssshhhwaaav
EEExcwhhsssshhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwaaav
EEExcwhhhhhhhhhwvvvv
EEExcwhhhhhhhhhwcccc
EEExcwhhhhhhhhhwcccc
EEExcwwwwdddwwwwcccc
EEExcccpppppppcccccc
EEExxxxpppppppxxxxxx
EEEEEEEEEEpEEEEEEEEE
EEEEEEEEEEpEEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, h pavimento di casa, w muro di casa, s scala, a pavimento del fienile, v muro del fienile, c aia, x staccionata, d porta, p portico, r strada, Y pagliaio, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEExxxxxxxxxxxxxxxxxxxxxxxEEE
EEEExccccYYYYYccccccccccccxEEE
EEEExccccYYYYYccccccccccccxEEE
EEEExccccYYYYYcccccccccQccxEEE
EEEExcccccccccccccccccccccxEEE
EEEExcccccccccccccccccccccxEEE
EEEExcvvvvccccccccccccccccxEEE
EEEExcvaaawwwwwwwwwwwcccccxEEE
EEEExcvaaawhhsssshhhwcccccxEEE
EEEExcvaaawhhsssshhhwcccccxEEE
EEEExcvaaawhhhhhhhhhwcccccxEEE
EEEExcvaaawhhhhhhhhhwcccccxEEE
EEEExcvvvvwhhhhhhhhhwcccccxEEE
EEEExcccccwhhhhhhhhhwcccccxEEE
EEEExcccccwhhhhhhhhhwcccccxEEE
EEEExcccccwhhhhhhhhhwcccccxEEE
EEEExcccccwwwwdddwwwwcccccxEEE
EEEExcccccccpppppppcccccccxEEE
EEEExcccccccpppppppcccccccxEEE
EEEExcccccccpppppppcccccccxEEE
EEEExcccccccpppppppcccccccxEEE
EEEExcccccccccrrrcccccccccxEEE
EEEExxxxxxxxxxrrrxxxxxxxxxxEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.31 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  Fattoria (farm).
  Plan letters:
    h floor of the farmhouse, a body around H, 9 wide
    w walls of the farmhouse
    s stair zone along the back wall
    a floor of the barn, a wing against one side of the house
    v walls of the barn
    c farmyard around house and barn
    x fence around the yard
    d door, middle of the front wall
    p porch floor in front of the door
    q porch corner cells with a post
    r road to the edge
    Y haystack, far from the road
    Q well
    t orchard trees outside the fence
    m path marker
  Placement: the house is at the centre with its door to the front (+y). The porch and the road lie on that axis.
  The barn leans on a side wall. The yard wraps both buildings and the fence wraps the yard.
  What the seeds change: the depth of the house, the side and position of the barn, the well, the hay and the trees.
  Large: house, barn, porch, yard and fence.
  Huge: a wider yard with hay and a well, and an orchard of trees outside the fence.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavcxdpqrYQtm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
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
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/[cx]" out="*/p" symmetry="()" steps="1"/>
      <all in="p/[cx]" out="*/p" symmetry="()" steps="1"/>
      <all in="p[cx]" out="*p" symmetry="(x)" steps="2"/>
      <all in="p/[cxE]" out="*/r" symmetry="()" steps="1"/>
      <all in="r/[cxE]" out="*/r" symmetry="()"/>
      <all in="r[cxE]" out="*r" symmetry="(x)" steps="1"/>
      <all in="pc" out="qc" symmetry="(x)"/>
      <all in="px" out="qx" symmetry="(x)"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="c" out="Y" steps="1"><field for="Y" from="r" on="cr"/></one>
      <all steps="2"><rule in="Yc" out="*Y"/><rule in="Y*/*c" out="**/*Y"/></all>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsavcxdpqrYQtfFRWULTkOoNbyJXgVGinCKjl" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="q" out="qqqqq/qbbbq/qbbbq/qbbbq/qqqqq"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="Q" out="GGGGG/GiiiG/GiiiG/GiiiG/GGGGG"/>
      <rule in="t" out="EEEEE/EEEEE/EEnEE/EEEEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <!-- house walls: two storeys with window bands -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- door column -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="63"/>
        <prl in="d" out="R"/>
        <!-- floors and slab -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
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
        <!-- porch -->
        <all in="B [pq]" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <all in="B b" out="b *" steps="33"/>
        <all in="B b" out="J *" steps="1"/>
        <!-- fence, hay, well, trees -->
        <all in="B x" out="x X" steps="10"/>
        <prl in="x" out="X"/>
        <all in="B Y" out="Y *" steps="18"/>
        <all in="B G" out="G *" steps="6"/>
        <all in="B n" out="n *" steps="20"/>
        <all in="B n" out="C *" steps="1"/>
        <all steps="4"><rule in="BC" out="CC"/></all>
        <all in="B C" out="C *" steps="6"/>
        <!-- windows -->
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- roofs and chimney -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="8"/>
        <!-- parts -->
        <union symbol="+" values="WVw"/>
        <union symbol="=" values="fF"/>
        <import file="part-stair"/>
        <import file="part-door"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="h" value="c9a36b" name="pavimento di casa" area="house"/>
  <color symbol="f" value="b08a58" name="assito" area="house"/>
  <color symbol="F" value="8a6438" name="solaio"/>
  <color symbol="s" value="8a5a30" name="scala" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro di casa" area="house"/>
  <color symbol="W" value="e8dcc0" name="intonaco"/>
  <color symbol="U" value="e8dcc0" name="fascia"/>
  <color symbol="L" value="4a6a8a" name="finestra"/>
  <color symbol="R" value="b0482a" name="tetto di coppi"/>
  <color symbol="K" value="7a7068" name="camino"/>
  <color symbol="a" value="b08850" name="pavimento del fienile" area="barn"/>
  <color symbol="g" value="d8c070" name="paglia del fienile" area="barn"/>
  <color symbol="v" value="a04030" name="muro del fienile" area="barn"/>
  <color symbol="V" value="a04030" name="assi rosse del fienile"/>
  <color symbol="c" value="d8c890" name="aia" area="yard"/>
  <color symbol="x" value="6b4a2a" name="staccionata" area="yard"/>
  <color symbol="X" value="6b4a2a" name="staccionata"/>
  <color symbol="d" value="e8dcc0" name="muro della porta"/>
  <color symbol="O" value="7a4a28" name="porta"/>
  <color symbol="o" value="3a2414" name="assi della porta"/>
  <color symbol="N" value="5a4030" name="stipite"/>
  <color symbol="j" hidden="True" name="porta aperta"/>
  <color symbol="l" hidden="True" name="assi aperte"/>
  <color symbol="T" value="8a5a30" name="scala"/>
  <color symbol="k" value="6a4424" name="gradini"/>
  <color symbol="p" value="9a7040" name="portico" area="porch"/>
  <color symbol="q" value="9a7040" name="portico" area="porch"/>
  <color symbol="b" value="5a3a20" name="pilastro"/>
  <color symbol="y" value="5a3a20" name="segno"/>
  <color symbol="J" value="c06a3a" name="tettoia"/>
  <color symbol="r" value="a89878" name="strada"/>
  <color symbol="Y" value="e0c040" name="pagliaio" area="yard"/>
  <color symbol="G" value="9a9a90" name="pietra del pozzo" area="yard"/>
  <color symbol="i" value="4a7aa0" name="acqua" area="yard"/>
  <color symbol="n" value="5a3a1a" name="tronco" area="orchard"/>
  <color symbol="C" value="5a8a3a" name="chioma" area="orchard"/>
  <color symbol="t" value="5a8a3a" name="albero" area="orchard"/>
  <color symbol="Q" value="9a9a90" name="pozzo" area="yard"/>
  <color symbol="m" value="ff00ff" name="segno"/>
  <color symbol="H" value="ffffff" name="centro"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="j"/><rule in="o" out="l"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="j" out="O"/><rule in="l" out="o"/></all></action>
</sequence>
```
