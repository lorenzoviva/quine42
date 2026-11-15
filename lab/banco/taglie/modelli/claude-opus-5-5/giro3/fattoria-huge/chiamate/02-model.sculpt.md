# model.sculpt · claude-opus-5-5 · 83 s

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
<!-- FATTORIA: the parts and their letters, on the plan (a cell is 5 voxels)
     h  the house: a body around H, 3 cells behind and 5-6 in front, 4 to each side; w its walls
     s  the stair zone, inside the house along the back wall, starting from the small-x corner
     a  the barn, a wing against one side wall of the house, chosen at random; v its walls
     p  the lean-to with the hay, along the back of the house and barn, 4 cells deep (20 voxels)
     d  the door in the front wall, 3 cells wide, on the axis; r the road straight to the front edge
     c  the farmyard, 3 cells around the house, barn and lean-to; x the fence around the yard, only where ground continues
     Q  the well, in the yard where a 3 x 3 window of yard fits
     t  trees and orchard, wherever a 7 x 7 window of free ground fits outside the fence
     The seeds change: the house depth (5 or 6 in front), which side the barn stands on and how far back it sits,
     where the well goes, where the trees fall.
     What fits at each size: Large has the house, barn and lean-to, with a thin yard.
     Huge has the yard with its fence and the well.
     Gargantuan also has the trees of the orchard, in the ground left past the fence. -->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavpdrcxQtm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the house -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the barn, a wing on a side chosen at random -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- the lean-to with the hay, behind -->
      <all in="E/[wv]" out="p/*" symmetry="()" steps="1"/>
      <all in="E/p" out="p/*" symmetry="()" steps="3"/>
      <!-- the door and the road, from the centre to the front edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- the stair zone, along the back wall -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- the farmyard, then the fence where the ground goes on past it -->
      <all in="[wvpc]E" out="*c" steps="3"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEE" out="*x***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="xE/*c" out="*x/**"/>
      <!-- the well in the yard -->
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"/>
      <!-- the trees of the orchard -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="h" rgb="#C9A877" name="pavimento di casa" area="house"/>
  <color symbol="w" rgb="#E6DCC2" name="muro di casa"/>
  <color symbol="s" rgb="#8B6B45" name="zona della scala" area="house"/>
  <color symbol="a" rgb="#B79A6A" name="pavimento del fienile" area="barn"/>
  <color symbol="v" rgb="#A0442E" name="muro del fienile"/>
  <color symbol="p" rgb="#D8C068" name="tettoia del fieno" area="barn"/>
  <color symbol="d" rgb="#5A3A22" name="porta"/>
  <color symbol="r" rgb="#B8A27E" name="strada"/>
  <color symbol="c" rgb="#9DB06A" name="aia" area="yard"/>
  <color symbol="x" rgb="#7A5A38" name="steccato"/>
  <color symbol="Q" rgb="#5C86A8" name="pozzo"/>
  <color symbol="t" rgb="#5E8A3E" name="albero da frutto" area="orchard"/>
  <color symbol="m" rgb="#FF00FF" name="segno"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento di casa, w muro di casa, s zona della scala, a pavimento del fienile, v muro del fienile, p tettoia del fieno, d porta, r strada, c aia, x steccato, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEExxxxxxxxxxxxxxxxxxxxxxEE
EEEEEExcccccccccccccccccccccEE
EEEEEExcccccQcccccccccccccccEE
EEEEEExcccccccccccccccccccccEE
EEEEEExcccpppppppppppcccccccEE
EEEEEExcccpppppppppppcccccccEE
EEEEEExcccpppppppppppcccccccEE
EEEEEExcccpppppppppppcccccccEE
EEEEEExcccwwwwwwwwwwwcccccccEE
EEEEEExcccwhhsssshhhwppppcccEE
EEEEEExcccwhhsssshhhwppppcccEE
EEEEEExcccwhhhhhhhhhwppppcccEE
EEEEEExcccwhhhhhhhhhwppppcccEE
EEEEEExcccwhhhhhhhhhwvvvvcccEE
EEEEEExcccwhhhhhhhhhwaaavcccEE
EEEEEExcccwhhhhhhhhhwaaavcccEE
EEEEEExcccwhhhhhhhhhwaaavcccEE
EEEEEExcccwhhhhhhhhhwaaavcccEE
EEEEEExcccwwwwdddwwwwaaavcccEE
EEEEEExcccccccrrrccccvvvvcccEE
EEEEEExcccccccrrrcccccccccccEE
EEEEEExcccccccrrrcccccccccccEE
EEEEEExxxxxxxxrrrcccccccccccEE
EEEEEEEEEEEEEErrrxxxxxxxxxxxEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento di casa, w muro di casa, s zona della scala, a pavimento del fienile, v muro del fienile, p tettoia del fieno, d porta, r strada, c aia, x steccato, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEExxxxxxxxxxxxxxxxxxxxxxEE
EEEEEExcccccccccccccccccccccEE
EEEEEExccccccccccccccccQccccEE
EEEEEExcccccccccccccccccccccEE
EEEEEExcccpppppppppppcccccccEE
EEEEEExcccpppppppppppcccccccEE
EEEEEExcccpppppppppppcccccccEE
EEEEEExcccpppppppppppcccccccEE
EEEEEExcccwwwwwwwwwwwcccccccEE
EEEEEExcccwhhsssshhhwppppcccEE
EEEEEExcccwhhsssshhhwppppcccEE
EEEEEExcccwhhhhhhhhhwppppcccEE
EEEEEExcccwhhhhhhhhhwppppcccEE
EEEEEExcccwhhhhhhhhhwvvvvcccEE
EEEEEExcccwhhhhhhhhhwaaavcccEE
EEEEEExcccwhhhhhhhhhwaaavcccEE
EEEEEExcccwhhhhhhhhhwaaavcccEE
EEEEEExcccwhhhhhhhhhwaaavcccEE
EEEEEExcccwwwwdddwwwwaaavcccEE
EEEEEExcccccccrrrccccvvvvcccEE
EEEEEExcccccccrrrcccccccccccEE
EEEEEExcccccccrrrcccccccccccEE
EEEEEExxxxxxxxrrrcccccccccccEE
EEEEEEEEEEEEEErrrxxxxxxxxxxxEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento di casa, w muro di casa, s zona della scala, a pavimento del fienile, v muro del fienile, p tettoia del fieno, d porta, r strada, c aia, x steccato, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEExxxxxxxxxxxxxxxxxxxxxxEE
EEEEEExcccccccccccccccccccccEE
EEEEEExcccccccccQcccccccccccEE
EEEEEExcccccccccccccccccccccEE
EEEEEExcccpppppppppppcccccccEE
EEEEEExcccpppppppppppcccccccEE
EEEEEExcccpppppppppppcccccccEE
EEEEEExcccpppppppppppcccccccEE
EEEEEExcccwwwwwwwwwwwppppcccEE
EEEEEExcccwhhsssshhhwppppcccEE
EEEEEExcccwhhsssshhhwppppcccEE
EEEEEExcccwhhhhhhhhhwppppcccEE
EEEEEExcccwhhhhhhhhhwvvvvcccEE
EEEEEExcccwhhhhhhhhhwaaavcccEE
EEEEEExcccwhhhhhhhhhwaaavcccEE
EEEEEExcccwhhhhhhhhhwaaavcccEE
EEEEEExcccwhhhhhhhhhwaaavcccEE
EEEEEExcccwhhhhhhhhhwaaavcccEE
EEEEEExcccwwwwdddwwwwvvvvcccEE
EEEEEExcccccccrrrcccccccccccEE
EEEEEExcccccccrrrcccccccccccEE
EEEEEExcccccccrrrcccccccccccEE
EEEEEExxxxxxxxrrrxxxxxxxxxxxEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento di casa, w muro di casa, s zona della scala, a pavimento del fienile, v muro del fienile, p tettoia del fieno, d porta, r strada, c aia, x steccato, Q pozzo, t albero da frutto
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEtEEEEEtEEEtEEEtEEEtEEEEEEEEEEEE
EEEtEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEtEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEExxxxxxxxxxxxxxxxxxxxxxxEEEEEE
EEEEEEEEEEExcccccccccccccccccccccxEEEEEE
EEEtEEEEEEExcccccccccccccccccccccxEEEEEE
EEEEEEEtEEExcccccccccccccccccccccxEEEEEE
EEEEEEEEEEExcccpppppppppppcccccccxEEEEEE
EEEEEEEEEEExcccpppppppppppcccccccxEEEEEE
EEEEEEEEEEExcccpppppppppppcccccccxEEEEEE
EEEEtEEEEEExcccpppppppppppcccccccxEEEEEE
EEEEEEEEEEExcccwwwwwwwwwwwcccccccxEEEEEE
EEEEEEEEEEExcccwhhsssshhhwppppcccxEEEEEE
EEEEEEEEEEExcccwhhsssshhhwppppcccxEEEEEE
EEEEEEEEEEExcccwhhhhhhhhhwppppcccxEEEEEE
EEEEEEtEEEExcccwhhhhhhhhhwppppcccxEEEEEE
EEEEEEEEEEExcccwhhhhhhhhhwvvvvcccxEEEEEE
EEEEEEEEEEExcccwhhhhhhhhhwaaavcccxEEEEEE
EEEEEEEEEEExcccwhhhhhhhhhwaaavcccxEEEEEE
EEEEEtEEEEExcccwhhhhhhhhhwaaavcccxEEEEEE
EEEEEEEEEEExcccwhhhhhhhhhwaaavcccxEEEEEE
EEEEEEEEEEExcccwwwwdddwwwwaaavcccxEEEEEE
EEEEEEEEEEExcccccccrrrccccvvvvcccxEEEEEE
EEEEEEEEEEExcccccccrrrcQcccccccccxEEEEEE
EEEEEEEtEEExcccccccrrrcccccccccccxEEEEEE
EEEEEEEEEEExxxxxxxxrrrcccccccccccxEEEEEE
EEEtEEEEEEEEEEEEEEErrrxxxxxxxxxxxxEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEtEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEtEEEEEEEEEEEEE
EEEEEtEEEEEEEEEtEEErrrEEEEEEEEEEEtEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.05 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!-- FATTORIA: the parts and their letters, on the plan (a cell is 5 voxels)
     h  the house: a body around H, 3 cells behind and 5-6 in front, 4 to each side; w its walls
     s  the stair zone, inside the house along the back wall
     a  the barn, a wing against one side wall of the house; v its walls
     p  the lean-to with the hay, along the back of the house and beside the barn
     d  the door in the front wall, 3 cells wide, on the axis; r the road straight to the front edge
     c  the farmyard around everything; x the fence around the yard, only where the ground goes on
     Q  the well, in the yard; t fruit trees of the orchard outside the fence where 7 x 7 of ground is free
     Seeds: house depth, barn side and length, lean-to depth, the well, the trees.
     Large: house, barn, lean-to, thin yard. Huge: yard, fence, well. Gargantuan: orchard too. -->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavpdrcxQtm" symmetry="()">
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
      <one in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="E/[wv]" out="p/*" symmetry="()" steps="1"/>
      <all in="E/p" out="p/*" symmetry="()" steps="3"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="[wvpc]E" out="*c" steps="3"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEE" out="*x***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="xE/*c" out="*x/**"/>
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEWURLfFTkONohswavpPJxQtYugGcrK" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="ccccc/cQQQc/cQcQc/cQQQc/ccccc"/>
      <rule in="t" out="GGGGG/GGGGG/GGuGG/GGGGG/GGGGG"/>
      <sequence symmetry="(xy)">
        <!-- house walls: 64 with two window bands -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- house floors, stair strip, slab -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- barn: brick walls 44, earth floor, open inside -->
        <all in="B v" out="v V" steps="44"/>
        <prl in="v" out="K"/>
        <all in="B a" out="a P" steps="1"/>
        <all in="B a" out="a B" steps="43"/>
        <prl in="a" out="K"/>
        <!-- lean-to: hay floor, roof at 34 -->
        <all in="B p" out="p P" steps="1"/>
        <all in="B p" out="p B" steps="33"/>
        <prl in="p" out="J"/>
        <!-- fence, well, trees -->
        <all in="B x" out="x x" steps="7"/>
        <all in="B Q" out="Q Q" steps="8"/>
        <all in="B u" out="u Y" steps="16"/>
        <prl in="u" out="g"/>
        <all in="gB" out="*g" steps="3"/>
        <all in="B g" out="g *" steps="5"/>
        <!-- the door -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <union symbol="+" values="WUV"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- windows -->
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="KB" out="*K" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <all in="*****/*****/**B**/*****/***** **K**/**K**/KKKKK/**K**/**K**" out="*****/*****/**K**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <one in="B B R" out="* Z *" steps="1" symmetry="()"/>
        <all in="B Z" out="Z *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="W" rgb="#E6DCC2" name="intonaco"/>
  <color symbol="U" rgb="#E6DCC2" name="intonaco"/>
  <color symbol="V" rgb="#A0442E" name="mattoni del fienile"/>
  <color symbol="R" rgb="#B5502F" name="tegole di casa"/>
  <color symbol="K" rgb="#6E4A2C" name="tetto del fienile"/>
  <color symbol="J" rgb="#8C6A3E" name="tettoia di assi"/>
  <color symbol="L" rgb="#3E5F7A" name="finestra"/>
  <color symbol="f" rgb="#C9A877" name="pavimento di casa" area="house"/>
  <color symbol="F" rgb="#9C7A50" name="solaio"/>
  <color symbol="P" rgb="#D8C068" name="fieno" area="barn"/>
  <color symbol="k" rgb="#7A5634" name="gradini"/>
  <color symbol="O" rgb="#5A3A22" name="porta"/>
  <color symbol="o" rgb="#3A2414" name="assi della porta"/>
  <color symbol="N" rgb="#4A4038" name="stipiti"/>
  <color symbol="T" hidden="True"/>
  <color symbol="r" rgb="#B8A27E" name="strada"/>
  <color symbol="c" hidden="True" area="yard"/>
  <color symbol="G" hidden="True" area="orchard"/>
  <color symbol="x" rgb="#7A5A38" name="steccato"/>
  <color symbol="Q" rgb="#8A8A86" name="pozzo di pietra"/>
  <color symbol="Y" rgb="#5C3E24" name="tronco"/>
  <color symbol="g" rgb="#6E9A48" name="chioma"/>
  <color symbol="Z" rgb="#6A6460" name="comignolo"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
