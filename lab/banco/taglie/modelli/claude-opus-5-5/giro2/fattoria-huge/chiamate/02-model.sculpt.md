# model.sculpt · claude-opus-5-5 · 118 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
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
<!-- FATTORIA
 parts: h the floor of the house (two storeys, the stair zone s along the back wall), w its walls;
        a the floor of the barn wing, v its walls (against a side of the house, the seed picks the side and the cell);
        d the door, front middle, 3 cells; p the porch, 4 deep in front of the door, then widened;
        q the hay stack behind the house, against the back wall; c the farmyard around everything;
        x the fence ring around the yard; r the road from the porch to the edge;
        t trees of the orchard and Q the well, inside the yard where free windows fit.
 seeds change: depth of the house, side and place of the wing, place of the hay, trees and well.
 Huge: house, wing, porch, hay, a thin yard and its fence. Gargantuan: the yard grows, so an orchard and a well fit inside.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavsmdpqcxrtQ" symmetry="()">
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
      <!-- the stair zone along the back wall -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- the door at the front, on the axis -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <!-- the porch before the door -->
      <all in="[dp]/E" out="*/p" symmetry="()" steps="4"/>
      <!-- the hay behind the house -->
      <one in="EEEEE/EEEEE/EEEEE/wwwww" out="*****/*qqq*/*qqq*/*****" symmetry="()" steps="1"/>
      <!-- the farmyard -->
      <all in="[wvpq]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*cccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- the fence -->
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- the road to the edge -->
      <all in="[pr]/[Ecx]" out="*/r" symmetry="()"/>
      <!-- widen the porch -->
      <all in="pc" out="*p" symmetry="(x)" steps="2"/>
      <!-- the well and the orchard in free yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**t**/*****/*****"/>
    </sequence>
  </map>
  <color symbol="E" value="7a9a4a" name="terra" hidden="True"/>
  <color symbol="H" value="c8a878" name="centro"/>
  <color symbol="h" value="b08858" name="pavimento di casa" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro di casa"/>
  <color symbol="a" value="a07848" name="pavimento del fienile" area="barn"/>
  <color symbol="v" value="a8443a" name="muro del fienile"/>
  <color symbol="s" value="8a6a48" name="zona della scala"/>
  <color symbol="m" value="c8a878" name="asse"/>
  <color symbol="d" value="5a3a22" name="porta"/>
  <color symbol="p" value="b89868" name="portico" area="porch"/>
  <color symbol="q" value="e0c050" name="fieno"/>
  <color symbol="c" value="a8a070" name="aia" area="yard"/>
  <color symbol="x" value="6a4a2a" name="steccato"/>
  <color symbol="r" value="c0aa80" name="sentiero"/>
  <color symbol="t" value="4a7a30" name="albero da frutto" area="orchard"/>
  <color symbol="Q" value="7090a8" name="pozzo"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E terra, h pavimento di casa, w muro di casa, a pavimento del fienile, v muro del fienile, s zona della scala, d porta, p portico, q fieno, c aia, x steccato, r sentiero, t albero da frutto, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEExxxxxxxxxxxxxxxxxxxxxxxEEE
EEEExcccccccccccccccccccccxEEE
EEEExcccccccccccccccccccccxEEE
EEEExccccctcctcctcccccctccxEEE
EEEExccQccccccccccctccccccxEEE
EEEExcccccccccccccccccccccxEEE
EEEExccccccccqqqccccccctccxEEE
EEEExcctcccccqqqccccccccccxEEE
EEEExcccccwwwwwwwwwwwcccccxEEE
EEEExcccccwhhsssshhhwcccccxEEE
EEEExcctccwhhsssshhhwcctccxEEE
EEEExcccccwhhhhhhhhhwcccccxEEE
EEEExcccccwhhhhHhhhhwcccccxEEE
EEEExcccccwhhhhhhhhhwvvvvcxEEE
EEEExcccccwhhhhhhhhhwaaavcxEEE
EEEExcctccwhhhhhhhhhwaaavcxEEE
EEEExcccccwhhhhhhhhhwaaavcxEEE
EEEExcccccwhhhhhhhhhwaaavcxEEE
EEEExcctccwwwwdddwwwwaaavcxEEE
EEEExcccccccpppppppccvvvvcxEEE
EEEExcccccccpppppppcccccccxEEE
EEEExcccctccpppppppcccccccxEEE
EEEExcccccccpppppppcccccccxEEE
EEEExcccccccccrrrcccccccccxEEE
EEEExxxxxxxxxxrrrxxxxxxxxxxEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E terra, h pavimento di casa, w muro di casa, a pavimento del fienile, v muro del fienile, s zona della scala, d porta, p portico, q fieno, c aia, x steccato, r sentiero, t albero da frutto, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEExxxxxxxxxxxxxxxxxxxxxxxEEE
EEEExcccccccccccccccccccccxEEE
EEEExcccccccccccccccccccccxEEE
EEEExcctcccctccctcctccccccxEEE
EEEExcccccccccccccccccccccxEEE
EEEExccccccccccccccccctcccxEEE
EEEExcccccccccccqqqcccccccxEEE
EEEExcctccccccccqqqcccccccxEEE
EEEExcccccwwwwwwwwwwwcctccxEEE
EEEExcccccwhhsssshhhwcccccxEEE
EEEExcccccwhhsssshhhwcccccxEEE
EEEExcctccwhhhhhhhhhwcccccxEEE
EEEExcccccwhhhhHhhhhwcccccxEEE
EEEExcccccwhhhhhhhhhwvvvvcxEEE
EEEExcctccwhhhhhhhhhwaaavcxEEE
EEEExcccccwhhhhhhhhhwaaavcxEEE
EEEExcccccwhhhhhhhhhwaaavcxEEE
EEEExcctccwhhhhhhhhhwaaavcxEEE
EEEExcccccwwwwdddwwwwaaavcxEEE
EEEExcccccccpppppppccvvvvcxEEE
EEEExcccccccpppppppcccccccxEEE
EEEExcccQcccpppppppcccccccxEEE
EEEExcccccccpppppppcccccccxEEE
EEEExcccccccccrrrcccccccccxEEE
EEEExxxxxxxxxxrrrxxxxxxxxxxEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E terra, h pavimento di casa, w muro di casa, a pavimento del fienile, v muro del fienile, s zona della scala, d porta, p portico, q fieno, c aia, x steccato, r sentiero, t albero da frutto, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEExxxxxxxxxxxxxxxxxxxxxxxEEE
EEEExcccccccccccccccccccccxEEE
EEEExcccccccccccccccccccccxEEE
EEEExcccccctcctccctcccccccxEEE
EEEExccctcccccccccccccccccxEEE
EEEExccccccccccccccccQccccxEEE
EEEExcccccccccccqqqcccccccxEEE
EEEExcccccccccccqqqcccccccxEEE
EEEExcctccwwwwwwwwwwwcctccxEEE
EEEExcccccwhhsssshhhwcccccxEEE
EEEExcccccwhhsssshhhwcccccxEEE
EEEExcctccwhhhhhhhhhwcccccxEEE
EEEExcccccwhhhhHhhhhwvvvvcxEEE
EEEExcccccwhhhhhhhhhwaaavcxEEE
EEEExcccccwhhhhhhhhhwaaavcxEEE
EEEExcccccwhhhhhhhhhwaaavcxEEE
EEEExcctccwhhhhhhhhhwaaavcxEEE
EEEExcccccwhhhhhhhhhwaaavcxEEE
EEEExcccccwwwwdddwwwwvvvvcxEEE
EEEExcctccccpppppppcccccccxEEE
EEEExcccccccpppppppcccccccxEEE
EEEExcccccccpppppppccctcccxEEE
EEEExcccccccpppppppcccccccxEEE
EEEExcccccccccrrrcccccccccxEEE
EEEExxxxxxxxxxrrrxxxxxxxxxxEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E terra, h pavimento di casa, w muro di casa, a pavimento del fienile, v muro del fienile, s zona della scala, d porta, p portico, q fieno, c aia, x steccato, r sentiero, t albero da frutto, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxxxxxEEEE
EEEEEEEEExcccccccccccccccccccccccccxEEEE
EEEEEEEEExcccccccccccccccccccccccccxEEEE
EEEEEEEEExcctccccctcctcctcccccctcccxEEEE
EEEEEEEEExcccccccccccccccccQcccccccxEEEE
EEEEEEEEExccccctcccccccccccccccccccxEEEE
EEEEEEEEExccccccccqqqccccccccccccccxEEEE
EEEEEEEEExccccccccqqqccccccctcctcccxEEEE
EEEEEEEEExcctccwwwwwwwwwwwcccccccccxEEEE
EEEEEEEEExcccccwhhsssshhhwcccccccccxEEEE
EEEEEEEEExcccccwhhsssshhhwccctcccccxEEEE
EEEEEEEEExcccccwhhhhhhhhhwcccccccccxEEEE
EEEEEEEEExcccccwhhhhHhhhhwcccccctccxEEEE
EEEEEEEEExcctccwhhhhhhhhhwvvvvcccccxEEEE
EEEEEEEEExcccccwhhhhhhhhhwaaavcccccxEEEE
EEEEEEEEExcccccwhhhhhhhhhwaaavcccccxEEEE
EEEEEEEEExcccccwhhhhhhhhhwaaavcctccxEEEE
EEEEEEEEExcctccwhhhhhhhhhwaaavcccccxEEEE
EEEEEEEEExcccccwwwwdddwwwwaaavcccccxEEEE
EEEEEEEEExcccccccpppppppccvvvvcctccxEEEE
EEEEEEEEExcctccccpppppppcccccccccccxEEEE
EEEEEEEEExcccccccpppppppcccccccccccxEEEE
EEEEEEEEExcccccccpppppppcctccccctccxEEEE
EEEEEEEEExcccccccccrrrccccccctcccccxEEEE
EEEEEEEEExcctccccccrrrcccccccccccccxEEEE
EEEEEEEEExccccctcccrrrcctccccccctccxEEEE
EEEEEEEEExcccccccccrrrcccccccccccccxEEEE
EEEEEEEEExcccccccccrrrcccccccccccccxEEEE
EEEEEEEEExxxxxxxxxxrrrxxxxxxxxxxxxxxEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.07 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!-- FATTORIA
 parts: h the floor of the house (two storeys, the stair zone s along the back wall), w its walls, d its door;
        a the floor of the barn wing, v its walls (against a side of the house: the seed picks the side, the cell, the depth);
        p the porch in front of the door with posts j at its front corners; q the hay behind the house;
        c the farmyard; x the hedge ring; r the road to the edge; t fruit trees, Q the well where free yard fits.
 Huge: house, barn, porch, hay, thin yard with hedge. Gargantuan: wider yard, orchard and well.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavsmdpqcxrtQj" symmetry="()">
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
      <prl in="aE" out="*a" p="0.5" steps="1" symmetry="(x)"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <prl in="a/E" out="*/a" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <all in="[dp]/E" out="*/p" symmetry="()" steps="4"/>
      <one in="EEEEE/EEEEE/EEEEE/wwwww" out="*****/*qqq*/*qqq*/*****" symmetry="()" steps="1"/>
      <all in="[wvpq]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*cccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="[pr]/[Ecx]" out="*/r" symmetry="()"/>
      <all in="pc" out="*p" symmetry="(x)" steps="2"/>
      <all in="pc/cc" out="j*/**"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**t**/*****/*****"/>
    </sequence>
    <map scale="5 5 1" values="BEHhswDavPjqcxrtQfFWULRegVyJYZXAGKTkOoN" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="PPPPP/PPPPP/PPPPP/PPPPP/PPPPP"/>
      <rule in="j" out="PPPPP/PjjjP/PjjjP/PjjjP/PPPPP"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="t" out="ccccc/ccccc/cctcc/ccccc/ccccc"/>
      <rule in="Q" out="ccccc/cQQQc/cQcQc/cQQQc/ccccc"/>
      <sequence symmetry="(xy)">
        <!-- house walls -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- door column -->
        <all in="B D" out="D e" steps="1"/>
        <all in="B e" out="e W" steps="63"/>
        <prl in="e" out="R"/>
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
        <!-- porch -->
        <all in="B j" out="j Y" steps="34"/>
        <prl in="j" out="J"/>
        <all in="B P" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <!-- hay -->
        <all in="B q" out="q Z" steps="22"/>
        <prl in="q" out="Z"/>
        <!-- hedge -->
        <all in="B x" out="x X" steps="9"/>
        <prl in="x" out="X"/>
        <!-- well -->
        <all in="B Q" out="Q K" steps="6"/>
        <prl in="Q" out="K"/>
        <!-- trees -->
        <all in="B t" out="t A" steps="18"/>
        <prl in="t" out="G"/>
        <all in="BG" out="GG" steps="3"/>
        <all in="B G" out="G *" steps="5"/>
        <!-- windows -->
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- door and stair -->
        <prl in="D" out="O"/>
        <union symbol="+" values="WVR"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" value="7a9a4a" name="terra" hidden="True"/>
  <color symbol="c" value="a8a070" name="aia" hidden="True" area="yard"/>
  <color symbol="r" value="c0aa80" name="sentiero"/>
  <color symbol="f" value="b08858" name="pavimento di casa" area="house"/>
  <color symbol="F" value="8a6440" name="solaio"/>
  <color symbol="W" value="e8dcc0" name="intonaco"/>
  <color symbol="L" value="6a8aa8" name="finestra"/>
  <color symbol="R" value="b04a32" name="tegole"/>
  <color symbol="g" value="a07848" name="pavimento del fienile" area="barn"/>
  <color symbol="V" value="8a3a2e" name="assi del fienile"/>
  <color symbol="P" value="b89868" name="portico" area="porch"/>
  <color symbol="J" value="7a5030" name="tetto del portico"/>
  <color symbol="Y" value="5a3a22" name="pali"/>
  <color symbol="Z" value="e0c050" name="fieno"/>
  <color symbol="X" value="4f7a34" name="siepe"/>
  <color symbol="A" value="6a4a2a" name="tronco"/>
  <color symbol="G" value="6a9a3a" name="chioma" area="orchard"/>
  <color symbol="K" value="8a8a88" name="pietra"/>
  <color symbol="k" value="9a7048" name="gradini"/>
  <color symbol="T" value="9a7048" name="scala"/>
  <color symbol="O" value="6a4020" name="porta"/>
  <color symbol="o" value="3a2414" name="assi della porta"/>
  <color symbol="N" value="4a3020" name="stipiti"/>
  <color symbol="H" value="c8a878" name="centro"/>
  <color symbol="h" value="b08858" name="pavimento di casa"/>
  <color symbol="w" value="e8dcc0" name="muro di casa"/>
  <color symbol="a" value="a07848" name="pavimento del fienile"/>
  <color symbol="v" value="a8443a" name="muro del fienile"/>
  <color symbol="s" value="8a6a48" name="zona della scala"/>
  <color symbol="m" value="c8a878" name="asse"/>
  <color symbol="d" value="5a3a22" name="porta"/>
  <color symbol="p" value="b89868" name="portico"/>
  <color symbol="j" value="5a3a22" name="palo"/>
  <color symbol="q" value="e0c050" name="fieno"/>
  <color symbol="x" value="4f7a34" name="siepe"/>
  <color symbol="t" value="4a7a30" name="albero da frutto"/>
  <color symbol="Q" value="7090a8" name="pozzo"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
