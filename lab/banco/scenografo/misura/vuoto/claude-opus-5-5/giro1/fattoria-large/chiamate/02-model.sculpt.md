# model.sculpt · claude-opus-5-5 · 112 s

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
FATTORIA - composition
Parts and letters (plan, cell = 5 voxels):
  h  the farmhouse floor (two storeys), around H; w its walls
  a  the barn / lean-to wing against a side wall of the house (left or right by seed); v its walls
  d  the door of the house, at the front (+y), 3 cells wide, on the axis of H
  r  the road from the door straight to the front edge
  g  the farmyard around house and barn, only where the ground goes on past it
  x  the fence around the yard (only where ground remains beyond)
  q  the haystack behind the house or barn
  Q  the well, in a 5x5 of yard
  t  trees of the orchard, in 7x7 of free ground
Seeds change: the house depth (one more cell in front or not), which side the barn stands,
where along the wall the barn sits, where the hay and the well go, how many trees.
Large (20x20): house + barn + hay, a narrow yard. Huge (30x30): the yard, fence, well and orchard trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdrgxqQtm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the house body -->
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
      <!-- the way out: door in the front wall, road to the edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/></prl>
      <!-- the yard, only where the ground goes on past it -->
      <all in="[wv]EEEE" out="*g***" steps="1"/>
      <all in="gEEEE" out="*g***" steps="2"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- the fence around the yard where the ground goes on -->
      <all in="gEE" out="*x*"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- the hay behind a building -->
      <one in="EEE/EEE/EEE/[wv][wv][wv]" out="***/*q*/***/***" symmetry="()" steps="1"/>
      <one in="ggg/ggg/ggg/[wv][wv][wv]" out="***/*q*/***/***" symmetry="()" steps="1"/>
      <!-- the well in the yard -->
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- orchard trees on free ground -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="H" value="#d8c690" name="centro" area="house"/>
  <color symbol="h" value="#c9a46a" name="pavimento di casa" area="house"/>
  <color symbol="w" value="#e8dcc0" name="muro di casa"/>
  <color symbol="a" value="#a8703f" name="pavimento del fienile" area="barn"/>
  <color symbol="v" value="#9b3b2a" name="muro del fienile"/>
  <color symbol="d" value="#5a3a22" name="porta"/>
  <color symbol="r" value="#b9a37a" name="strada"/>
  <color symbol="g" value="#a7b46a" name="aia" area="yard"/>
  <color symbol="x" value="#7a5634" name="staccionata"/>
  <color symbol="q" value="#e0c25a" name="pagliaio"/>
  <color symbol="Q" value="#6f8fa8" name="pozzo"/>
  <color symbol="t" value="#5f8a3c" name="albero da frutto" area="orchard"/>
  <color symbol="m" value="#ff00ff" name="segno"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E terra, h pavimento di casa, w muro di casa, a pavimento del fienile, v muro del fienile, d porta, r strada, g aia, x staccionata, q pagliaio
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EExxxxxxxxxxxxxxxxxx
EExggggggggggggggggg
EExggggggggqgggggggg
EExggggggggggggggggg
EExggwwwwwwwwwwwgggg
EExggwhhhhhhhhhwgggg
EExggwhhhhhhhhhwgggg
EExggwhhhhhhhhhwgggg
EExggwhhhhHhhhhwgggg
EExggwhhhhhhhhhwvvvv
EExggwhhhhhhhhhwaaav
EExggwhhhhhhhhhwaaav
EExggwhhhhhhhhhwaaav
EExggwhhhhhhhhhwaaav
EExggwwwwdddwwwwaaav
EExxxEEEErrrEExgvvvv
EEEEEEEEErrrEExxEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E terra, h pavimento di casa, w muro di casa, a pavimento del fienile, v muro del fienile, d porta, r strada, g aia, x staccionata, q pagliaio
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EExxxxxxxxxxxxxxxxxx
EExggggggggggggggggg
EExggggqgggggggggggg
EExggggggggggggggggg
EExggwwwwwwwwwwwgggg
EExggwhhhhhhhhhwgggg
EExggwhhhhhhhhhwgggg
EExggwhhhhhhhhhwgggg
EExggwhhhhHhhhhwgggg
EExggwhhhhhhhhhwvvvv
EExggwhhhhhhhhhwaaav
EExggwhhhhhhhhhwaaav
EExggwhhhhhhhhhwaaav
EExggwhhhhhhhhhwaaav
EExggwwwwdddwwwwaaav
EExxxEEEErrrEExgvvvv
EEEEEEEEErrrEExxEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E terra, h pavimento di casa, w muro di casa, a pavimento del fienile, v muro del fienile, d porta, r strada, g aia, x staccionata, q pagliaio
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EExxxxxxxxxxxxxxxxxx
EExggggggggggggggggg
EExgggggggggqggggggg
EExggggggggggggggggg
EExggwwwwwwwwwwwgggg
EExggwhhhhhhhhhwgggg
EExggwhhhhhhhhhwgggg
EExggwhhhhhhhhhwgggg
EExggwhhhhHhhhhwvvvv
EExggwhhhhhhhhhwaaav
EExggwhhhhhhhhhwaaav
EExggwhhhhhhhhhwaaav
EExggwhhhhhhhhhwaaav
EExggwhhhhhhhhhwaaav
EExggwwwwdddwwwwvvvv
EExxxEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E terra, h pavimento di casa, w muro di casa, a pavimento del fienile, v muro del fienile, d porta, r strada, g aia, x staccionata, q pagliaio, Q pozzo, t albero da frutto
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtEEEtEEEEEEtEEEEEtEEEtEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEExxxxxxxxxxxxxxxxxxxxxxEE
EEEEEExggggggggggggggggggggxEE
EEEEEExgggggqggggggggggggggxEE
EEEEEExggggggggggggggggggggxEE
EEEEEExgggwwwwwwwwwwwggggggxEE
EEEEEExgggwhhhhhhhhhwgggQggxEE
EEEEEExgggwhhhhhhhhhwggggggxEE
EEEEEExgggwhhhhhhhhhwggggggxEE
EEEEEExgggwhhhhHhhhhwggggggxEE
EEEEEExgggwhhhhhhhhhwvvvvggxEE
EEEEEExgggwhhhhhhhhhwaaavggxEE
EEEEEExgggwhhhhhhhhhwaaavggxEE
EEEEEExgggwhhhhhhhhhwaaavggxEE
EEEEEExgggwhhhhhhhhhwaaavggxEE
EEEEEExgggwwwwdddwwwwaaavggxEE
EEEEEExgggggggrrrggggvvvvggxEE
EEEEEExgggggggrrrggggggggggxEE
EEEEEExgggggggrrrggggggggggxEE
EEEEEExxxxxxxxrrrggggggggggxEE
EEEEEEEEEEEEEErrrxxxxxxxxxxxEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.05 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
FATTORIA
Parts and plan letters (one cell = 5 voxels):
  H/h  the farmhouse floor, two storeys, around the centre; w its walls
  s    the stair zone inside the house, along the back wall, two cells of landing before it
  a    the barn floor, a wing against a side wall of the house (left or right, front or back by seed); v its walls
  d    the door of the house to the front, 3 cells wide, on the axis of H
  r    the road from the door straight to the front edge
  g    the farmyard around house and barn, only where the ground goes on past it
  x    the hedge around the yard
  q    the haystack behind the house or barn
  Q    the well, in a 5x5 of yard
  t    the orchard trees, on free ground outside
Seeds change: the house depth, which side and where the barn stands, where the hay and well go, the trees.
Large: house, barn, hay, a narrow yard. Huge: yard, hedge, well and orchard.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdrgxqQtms" symmetry="()">
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
      <prl><rule in="m" out="h"/></prl>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="[wv]EEEE" out="*g***" steps="1"/>
      <all in="gEEEE" out="*g***" steps="2"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEE" out="*x*"/>
      <all in="xE/*x" out="*x/**"/>
      <one in="EEE/EEE/EEE/[wv][wv][wv]" out="***/*q*/***/***" symmetry="()" steps="1"/>
      <one in="ggg/ggg/ggg/[wv][wv][wv]" out="***/*q*/***/***" symmetry="()" steps="1"/>
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEhwavrgxqQtsWYRLfFTkOoNJyVZPlucGK" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="Q" out="QQQQQ/QlllQ/QlllQ/QlllQ/QQQQQ"/>
      <rule in="t" out="EEEEE/EEEEE/EEtEE/EEEEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <!-- B. heights -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w Y" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w Y" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <all in="B v" out="v V" steps="40"/>
        <prl in="v" out="J"/>
        <all in="B a" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="39"/>
        <prl in="y" out="J"/>
        <all in="B q" out="q Z" steps="15"/>
        <prl in="q" out="Z"/>
        <all in="B Q" out="Q P" steps="6"/>
        <prl in="Q" out="P"/>
        <all in="B x" out="x G" steps="10"/>
        <prl in="x" out="G"/>
        <all in="B t" out="t u" steps="14"/>
        <prl in="t" out="c"/>
        <all in="cB" out="*c" steps="2"/>
        <all in="B c" out="c *" steps="4"/>
        <!-- C. door, stair, windows, roofs -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <union symbol="+" values="WYRL"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <one steps="14"><rule in="BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LYYYYB" out="*LLLL*"/>
        <prl in="Y" out="W"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="8"/>
        <all in="JB" out="*J" steps="1"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="H" value="#c9a46a" name="pavimento di casa" area="house"/>
  <color symbol="h" value="#c9a46a" name="pavimento di casa" area="house"/>
  <color symbol="s" value="#c9a46a" name="pavimento di casa" area="house"/>
  <color symbol="w" value="#e8dcc0" name="muro di casa"/>
  <color symbol="d" value="#5a3a22" name="porta"/>
  <color symbol="m" hidden="True" name="segno"/>
  <color symbol="a" value="#a8703f" name="pavimento del fienile" area="barn"/>
  <color symbol="v" value="#9b3b2a" name="muro del fienile"/>
  <color symbol="r" value="#b9a37a" name="strada"/>
  <color symbol="g" value="#a7b46a" name="aia" area="yard"/>
  <color symbol="x" value="#4f7a35" name="siepe"/>
  <color symbol="q" value="#e0c25a" name="pagliaio"/>
  <color symbol="Q" value="#8f8a80" name="pozzo"/>
  <color symbol="t" value="#5f8a3c" name="albero da frutto" area="orchard"/>
  <color symbol="W" value="#e8dcc0" name="intonaco"/>
  <color symbol="Y" value="#e8dcc0" name="intonaco"/>
  <color symbol="L" value="#6f8fa8" name="finestra"/>
  <color symbol="R" value="#b5452f" name="tetto di coppi"/>
  <color symbol="f" value="#c9a46a" name="pavimento di assi" area="house"/>
  <color symbol="F" value="#8a6a45" name="solaio"/>
  <color symbol="T" hidden="True" name="segno della scala"/>
  <color symbol="k" value="#6b4a2e" name="gradini"/>
  <color symbol="O" value="#5a3a22" name="porta"/>
  <color symbol="o" value="#3e2716" name="assi della porta"/>
  <color symbol="N" value="#7a6a5a" name="stipiti"/>
  <color symbol="J" value="#6e5a48" name="tetto del fienile"/>
  <color symbol="y" hidden="True" name="segno"/>
  <color symbol="V" value="#9b3b2a" name="tavole del fienile"/>
  <color symbol="Z" value="#e0c25a" name="fieno"/>
  <color symbol="P" value="#8f8a80" name="pietra del pozzo"/>
  <color symbol="l" value="#4a7fa8" name="acqua"/>
  <color symbol="u" value="#6b4a2e" name="tronco"/>
  <color symbol="c" value="#5f8a3c" name="chioma"/>
  <color symbol="G" value="#4f7a35" name="siepe"/>
  <color symbol="K" value="#7d6e64" name="comignolo"/>
  <color symbol="#20" hidden="True" name="porta aperta"/>
  <color symbol="#21" hidden="True" name="porta aperta"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
