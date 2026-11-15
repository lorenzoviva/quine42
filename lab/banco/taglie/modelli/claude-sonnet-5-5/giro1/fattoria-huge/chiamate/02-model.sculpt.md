# model.sculpt · claude-sonnet-5-5 · 369 s

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
<!-- FATTORIA: the parts and where each goes (plan on 5-voxel cells, front = large y).
 1. House (h, walls w): a body of 9 x 9-10 cells around the centre H. A stair zone (s) sits against the back wall, 2 cells of landing from the west wall.
 2. Door (d) in the middle of the front wall, 3 cells wide. A porch (p) of 3 x 2 in front of it, then the road (r) straight to the edge of the box.
 3. Hay lean-to (y, 5 x 4) against the back wall, behind the house. Its position along the wall is chosen by the seed.
 4. Wing (a, walls v), 6 x 7 inside, against a side wall of the house. Only where 8 cells of free ground reach the wall (Huge and up). The seed chooses side and row.
 5. Barn (b, walls u), 9 x 7 inside, against the other side wall. Only where 12 cells are free (Gargantuan). It takes the side the wing did not take.
 6. Field (f) on the side of the road, a well (Q) beside the road, trees (t), and an orchard in rows (g) where an 11 x 7 lawn is free.
 What the seeds change: the front line (+1 by chance), the side and row of wing and barn, the place of the hay, the side of the field and the well, the trees.
 What fits: Large = house + porch + hay + a few trees. Huge = + wing, field, well. Gargantuan = + barn, second field, orchard. -->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwabuvdpryfgtsmQ" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the body of the house -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- the door in the middle of the front wall, the porch, the road to the edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl in="m" out="h"/>

      <!-- the barn: 12 free cells to a side wall, 9 wide and 7 deep inside (Gargantuan only) -->
      <one in="EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw"
           out="*************/*************/*************/*************/***********b*/*************/*************/*************/*************"
           symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="8"/>
      <all in="E/b" out="b/*" symmetry="()" steps="3"/>
      <all in="b/E" out="*/b" symmetry="()" steps="3"/>
      <all in="bE" out="*u"/>
      <all in="uE/*u" out="*u/**"/>

      <!-- the wing: 8 free cells to a side wall, 6 wide and 7 deep inside (Huge and up) -->
      <one in="EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw"
           out="*********/*********/*********/*********/*******a*/*********/*********/*********/*********"
           symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="5"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- the hay lean-to behind the back wall: 5 wide, 4 deep -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/wwwwwww"
           out="*******/*yyyyy*/*yyyyy*/*yyyyy*/*yyyyy*"
           symmetry="()" steps="1"/>
      <!-- note: the last row above keeps the wall; the first row stays free as a margin -->

      <!-- fields and well on the side of the road -->
      <one in="EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr"
           out="*********/**ffffff*/**ffffff*/**ffffff*/**ffffff*/*********"
           symmetry="(x)" steps="1"/>
      <one in="EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr"
           out="*********/**ffffff*/**ffffff*/**ffffff*/**ffffff*/*********"
           symmetry="(x)" steps="1"/>
      <one in="EEEEr/EEEEr/EEEEr/EEEEr" out="*****/**QQ*/**QQ*/*****" symmetry="(x)" steps="1"/>

      <!-- the orchard in rows where an 11 x 7 lawn is free -->
      <one in="EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE"
           out="***********/*g***g***g*/***********/*g***g***g*/***********/*g***g***g*/***********"
           symmetry="()" steps="1"/>

      <!-- trees, 3 x 3 crowns in a 5 x 5 window of free lawn -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*ttt*/*ttt*/*ttt*/*****" steps="3"/>

      <!-- the zone of the stair: against the back wall, two cells of landing, four long and two wide -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
    </sequence>
  </map>
  <color symbol="B" value="000000" name="aria" hidden="True"/>
  <color symbol="E" value="8DAA5B" name="prato" hidden="True"/>
  <color symbol="H" value="D8C9A3" name="centro" area="house"/>
  <color symbol="h" value="D8C9A3" name="pavimento della casa" area="house"/>
  <color symbol="w" value="C9B38A" name="muro della casa"/>
  <color symbol="a" value="E0B97A" name="interno dell'ala" area="wing"/>
  <color symbol="v" value="B98B5A" name="muro dell'ala"/>
  <color symbol="b" value="C79A4E" name="interno del fienile" area="barn"/>
  <color symbol="u" value="8E5B3A" name="muro del fienile"/>
  <color symbol="d" value="5A3A24" name="porta"/>
  <color symbol="p" value="A98B5E" name="portico" area="porch"/>
  <color symbol="r" value="B7AE98" name="strada"/>
  <color symbol="y" value="E3C54B" name="fieno" area="hay"/>
  <color symbol="f" value="9C7A3C" name="campo" area="field"/>
  <color symbol="g" value="5E8F3E" name="frutteto" area="orchard"/>
  <color symbol="t" value="3F7A3A" name="albero"/>
  <color symbol="s" value="C06A3E" name="zona della scala"/>
  <color symbol="m" value="FF00FF" name="segno" hidden="True"/>
  <color symbol="Q" value="5E8FB8" name="pozzo"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E prato, h pavimento della casa, w muro della casa, a interno dell'ala, v muro dell'ala, d porta, p portico, r strada, y fieno, f campo, g frutteto, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEgEEEgEEEgEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEgEEEgEEEgEEEEE
EEEEEEEEEEEtttEEEEEEEEEEEEEEEE
EEEEEEEEEEEtttEEgEEEgEEEgEEEEE
EEEEEEEEEEEtttEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEyyyyyEEEEEEEEEE
EEEEEEEEEEEEEEEyyyyyEEEEEEEEEE
EEEEEEEEEEEEEEEyyyyyEEEEEEEEEE
EEEEEEEEEEwwwwwyyyyywEEEEEEEEE
EEEvvvvvvvwhhhhhhhhhwEEEEEEEEE
EEEvaaaaaawhhhhhhhhhwEEEEEEEEE
EEEvaaaaaawhhhhhhhhhwEEtttEEEE
EEEvaaaaaawhhhhHhhhhwEEtttEEEE
EEEvaaaaaawhhhhhhhhhwEEtttEEEE
EEEvaaaaaawhhhhhhhhhwEEEEEEEEE
EEEvaaaaaawhhhhhhhhhwEEEEEEEEE
EEEvaaaaaawhhhhhhhhhwEEEEEEEEE
EEEvvvvvvvwhhhhhhhhhwEEEEEEEEE
EEEEEEEEEEwwwwdddwwwwEEEEEEEEE
EEEtttEEEEEEEEpppEEEEEEEEEEEEE
EEEtttEEEEEEEEpppEEEEEEEEEEEEE
EEEtttEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEffffffrrrffffffEEEEEEE
EEEEEEEEffffffrrrffffffEEEEEEE
EEEEEEEEffffffrrrffffffEEEEEEE
EEEEEEEEffffffrrrffffffEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E prato, h pavimento della casa, w muro della casa, a interno dell'ala, v muro dell'ala, d porta, p portico, r strada, y fieno, f campo, g frutteto, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEtttEEEEEEEEEEEEEEEEEEEEEEE
EEEEtttEEEEEEgEEEgEEEgEEEEEEEE
EEEEtttEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEgEEEgEEEgEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEgEEEgEEEgEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEyyyyyEEEEEEEEtttEE
EEEEEEEEEEEEyyyyyEEEEEEEEtttEE
EEEEEEEEEEEEyyyyyEEEEEEEEtttEE
EEEEEEEEEEwwyyyyywwwwEEEEEEEEE
EEEEEEEEEEwhhhhhhhhhwEEEEEEEEE
EEEEEEEEEEwhhhhhhhhhwvvvvvvvEE
EEEEEEEEEEwhhhhhhhhhwaaaaaavEE
EEEEEEEEEEwhhhhHhhhhwaaaaaavEE
EEEEEEEEEEwhhhhhhhhhwaaaaaavEE
EEEEEEEEEEwhhhhhhhhhwaaaaaavEE
EEEtttEEEEwhhhhhhhhhwaaaaaavEE
EEEtttEEEEwhhhhhhhhhwaaaaaavEE
EEEtttEEEEwhhhhhhhhhwaaaaaavEE
EEEEEEEEEEwwwwdddwwwwvvvvvvvEE
EEEEEEEEEEEEEEpppEEEEEEEEEEEEE
EEEEEEEEEEEEEEpppEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEffffffrrrffffffEEEEEEE
EEEEEEEEffffffrrrffffffEEEEEEE
EEEEEEEEffffffrrrffffffEEEEEEE
EEEEEEEEffffffrrrffffffEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E prato, h pavimento della casa, w muro della casa, a interno dell'ala, v muro dell'ala, d porta, p portico, r strada, y fieno, f campo, g frutteto, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEtttEEEEEEEEEEEEEEEEEEEEEE
EEEEEtttEEEEEEEEEEEEEEEEEEEEEE
EEEEEtttEEEEEtttEEEEgEEEgEEEgE
EEEEEEEEEEEEEtttEEEEEEEEEEEEEE
EEEEEEEEEEEEEtttEEEEgEEEgEEEgE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEgEEEgEEEgE
EEEEEEEEEEEEEyyyyyEEEEEEEEEEEE
EEEEEEEEEEEEEyyyyyEEEEEEEEEEEE
EEEEEEEEEEEEEyyyyyEEEEEEEEEEEE
EEEEEEEEEEwwwyyyyywwwEEEEEEEEE
EEEvvvvvvvwhhhhhhhhhwEEEEEEEEE
EEEvaaaaaawhhhhhhhhhwEEEEEEEEE
EEEvaaaaaawhhhhhhhhhwEEEEEEEEE
EEEvaaaaaawhhhhHhhhhwEEEEEEEEE
EEEvaaaaaawhhhhhhhhhwEEEEEEEEE
EEEvaaaaaawhhhhhhhhhwEEEEEEEEE
EEEvaaaaaawhhhhhhhhhwEEEEEEEEE
EEEvaaaaaawhhhhhhhhhwEEEEEEEEE
EEEvvvvvvvwhhhhhhhhhwEEEEEEEEE
EEEEEEEEEEwwwwdddwwwwEEEEEEEEE
EEEEEEEEEEEEEEpppEEEEEEEtttEEE
EEEEEEEEEEEEEEpppEEEEEEEtttEEE
EEEEEEEEEEEEEErrrEEEEEEEtttEEE
EEEEEEEEffffffrrrffffffEEEEEEE
EEEEEEEEffffffrrrffffffEEEEEEE
EEEEEEEEffffffrrrffffffEEEEEEE
EEEEEEEEffffffrrrffffffEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E prato, h pavimento della casa, w muro della casa, a interno dell'ala, b interno del fienile, u muro del fienile, v muro dell'ala, d porta, p portico, r strada, y fieno, f campo, g frutteto, t albero, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEgEEEgEEEgEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEtttEEEEEEEEE
EEEEEgEEEgEEEgEEEEEEEEEEEEEEtttEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEtttEEEEEEEEE
EEEEEgEEEgEEEgEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEyyyyyEEEEEEtttEEEEEEE
EEEEEEEEEEEEEEEEEEEyyyyyEEEEEEtttEEEEEEE
EEEEEEEEEEEEEEEEEEEyyyyyEEEEEEtttEEEEEEE
EEEEEEEEvvvvvvvwwwwyyyyywwEEEEEEEEEEEEEE
EEEEEEEEvaaaaaawhhhhhhhhhwEEEEEEEEEEEEEE
EEEEEEEEvaaaaaawhhhhhhhhhwuuuuuuuuuuEEEE
EEEEEEEEvaaaaaawhhhhhhhhhwbbbbbbbbbuEEEE
EEEEEEEEvaaaaaawhhhhHhhhhwbbbbbbbbbuEEEE
EEEEEEEEvaaaaaawhhhhhhhhhwbbbbbbbbbuEEEE
EEEEEEEEvaaaaaawhhhhhhhhhwbbbbbbbbbuEEEE
EEEEEEEEvaaaaaawhhhhhhhhhwbbbbbbbbbuEEEE
EEEEEEEEvvvvvvvwhhhhhhhhhwbbbbbbbbbuEEEE
EEEEEEEEEEEEEEEwhhhhhhhhhwbbbbbbbbbuEEEE
EEEEEEEEEEEEEEEwwwwdddwwwwuuuuuuuuuuEEEE
EEEEEEEEEEEEEEEEEEEpppEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEpppEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEQQrrrEEEEEEEEEEEEEEEEEE
EEEEtttEEEEEEEEEEQQrrrEEEEEEEEEEEEEEEEEE
EEEEtttEEEEEEEEEEEErrrffffffEEEEEEEEEEEE
EEEEtttEEEEEEEEEEEErrrffffffEEEEEEEEEEEE
EEEEEEEEEEEEEffffffrrrffffffEEEEEEEEEEEE
EEEEEEEEEEEEEffffffrrrffffffEEEEEEEEEEEE
EEEEEEEEEEEEEffffffrrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEffffffrrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.40 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!-- FATTORIA: the parts and where each goes (plan on 5-voxel cells, front = large y).
 1. House (h, walls w): a body of 9 x 9-10 cells around the centre H. A stair zone (s) sits against the back wall, 2 cells of landing from the west wall.
 2. Door (d) in the middle of the front wall, 3 cells wide. A porch (p) of 3 x 2 in front of it, then the road (r) straight to the edge of the box.
 3. Hay lean-to (y, 5 x 4) against the back wall, behind the house. Its position along the wall is chosen by the seed.
 4. Wing (a, walls v), 6 x 7 inside, against a side wall of the house. Only where 8 cells of free ground reach the wall (Huge and up). The seed chooses side and row.
 5. Barn (b, walls u), 9 x 7 inside, against the other side wall. Only where 12 cells are free (Gargantuan). It takes the side the wing did not take.
 6. Field (f) on the side of the road, a well (Q) beside the road, trees (t crown, x trunk), and an orchard in rows (g) where an 11 x 7 lawn is free.
 What the seeds change: the front line (+1 by chance), the side and row of wing and barn, the place of the hay, the side of the field and the well, the trees.
 What fits: Large = house + porch + hay + a few trees. Huge = + wing, field, well. Gargantuan = + barn, second field, orchard. -->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwabuvdpryfgtxsmQ" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the body of the house -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- the door in the middle of the front wall, the porch, the road to the edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl in="m" out="h"/>

      <!-- the barn -->
      <one in="EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw/EEEEEEEEEEEEw"
           out="*************/*************/*************/*************/***********b*/*************/*************/*************/*************"
           symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="8"/>
      <all in="E/b" out="b/*" symmetry="()" steps="3"/>
      <all in="b/E" out="*/b" symmetry="()" steps="3"/>
      <all in="bE" out="*u"/>
      <all in="uE/*u" out="*u/**"/>

      <!-- the wing -->
      <one in="EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw/EEEEEEEEw"
           out="*********/*********/*********/*********/*******a*/*********/*********/*********/*********"
           symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="5"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- the hay lean-to behind the back wall: 5 wide, 4 deep, touching the wall -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/wwwwwww"
           out="*******/*yyyyy*/*yyyyy*/*yyyyy*/*yyyyy*/*******"
           symmetry="()" steps="1"/>

      <!-- fields and well on the side of the road -->
      <one in="EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr"
           out="*********/**ffffff*/**ffffff*/**ffffff*/**ffffff*/*********"
           symmetry="(x)" steps="1"/>
      <one in="EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr/EEEEEEEEr"
           out="*********/**ffffff*/**ffffff*/**ffffff*/**ffffff*/*********"
           symmetry="(x)" steps="1"/>
      <one in="EEEEr/EEEEr/EEEEr/EEEEr" out="*****/**QQ*/**QQ*/*****" symmetry="(x)" steps="1"/>

      <!-- the orchard in rows -->
      <one in="EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE/EEEEEEEEEEE"
           out="***********/*g***g***g*/***********/*g***g***g*/***********/*g***g***g*/***********"
           symmetry="()" steps="1"/>

      <!-- trees: crown t around a trunk x -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*ttt*/*txt*/*ttt*/*****" steps="3"/>

      <!-- the zone of the stair -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BEhwabuvdprYyfgtxsQWVZULPADFRJTkOoNKCXqj" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="m" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>

      <union symbol="+" values="WVZU"/>
      <union symbol="=" values="PADF"/>
      <union symbol="%" values="WVZ"/>

      <sequence symmetry="(xy)">
        <!-- B. the heights: house walls, two storeys -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- the wall of the door: plain plaster -->
        <all in="B d" out="d W" steps="64"/>
        <prl in="d" out="R"/>
        <!-- wing walls: one storey -->
        <all in="B v" out="v V" steps="6"/>
        <all in="B v" out="v U" steps="14"/>
        <all in="B v" out="v V" steps="12"/>
        <prl in="v" out="R"/>
        <!-- barn walls: one storey -->
        <all in="B u" out="u Z" steps="6"/>
        <all in="B u" out="u U" steps="14"/>
        <all in="B u" out="u Z" steps="12"/>
        <prl in="u" out="R"/>

        <!-- house floor, strip of the stair, air, slab, air, ceiling -->
        <all steps="1"><rule in="B h" out="h P"/><rule in="B s" out="s P"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- wing and barn: floor, air, ceiling under the roof -->
        <all in="B a" out="a A" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>
        <all in="B b" out="b D" steps="1"/>
        <all in="B b" out="b B" steps="31"/>
        <prl in="b" out="R"/>

        <!-- porch and hay lean-to: a roof at 34 -->
        <all in="B p" out="y *" steps="1"/>
        <all in="B Y" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>

        <!-- trees -->
        <all in="B x" out="x K" steps="12"/>
        <all in="B x" out="x C" steps="10"/>
        <prl in="x" out="C"/>
        <all in="B t" out="t E" steps="1"/>
        <all in="B t" out="t B" steps="7"/>
        <all in="B t" out="t C" steps="10"/>
        <prl in="t" out="C"/>
        <!-- orchard bushes, the ground letter stays below -->
        <all in="B g" out="j *" steps="1"/>
        <all in="B j" out="j C" steps="8"/>
        <prl in="j" out="C"/>
        <!-- the well: stone block with water on top -->
        <all in="B Q" out="Q X" steps="8"/>
        <all in="B Q" out="Q q" steps="1"/>
        <prl in="Q" out="B"/>

        <!-- C. the doors -->
        <all in="W/p" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <one in="VVVVVVVVVVV/EEEEEEEEEEE" out="OOOOOOOOOOO/***********" symmetry="()" steps="1"/>
        <all in="V/O" out="O/*" symmetry="()" steps="4"/>
        <one in="ZZZZZZZZZZZ/EEEEEEEEEEE" out="OOOOOOOOOOO/***********" symmetry="()" steps="1"/>
        <all in="Z/O" out="O/*" symmetry="()" steps="4"/>
        <import file="part-door"/>
        <import file="part-stair"/>

        <!-- windows in the band, through the wall -->
        <one steps="30">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU"
                 out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <!-- roofs: eaves, then a hip with a slope of one in two -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" name="aria" hidden="True"/>
  <color symbol="E" value="8DAA5B" name="prato" hidden="True"/>
  <color symbol="H" value="D8C9A3" name="centro" area="house"/>
  <color symbol="h" value="D8C9A3" name="pavimento della casa" area="house"/>
  <color symbol="w" value="C9B38A" name="muro della casa"/>
  <color symbol="a" value="E0B97A" name="interno dell'ala" area="wing"/>
  <color symbol="v" value="B98B5A" name="muro dell'ala"/>
  <color symbol="b" value="C79A4E" name="interno del fienile" area="barn"/>
  <color symbol="u" value="8E5B3A" name="muro del fienile"/>
  <color symbol="d" value="5A3A24" name="muro della porta"/>
  <color symbol="p" value="A98B5E" name="portico" area="porch"/>
  <color symbol="r" value="B7AE98" name="strada"/>
  <color symbol="y" value="E3C54B" name="fieno" area="hay"/>
  <color symbol="Y" value="E3C54B" name="paglia" area="hay"/>
  <color symbol="f" value="9C7A3C" name="campo" area="field"/>
  <color symbol="g" value="5E8F3E" name="frutteto" area="orchard"/>
  <color symbol="t" value="3F7A3A" name="chioma"/>
  <color symbol="x" value="6B4A2E" name="tronco del segno"/>
  <color symbol="s" value="C06A3E" name="zona della scala"/>
  <color symbol="m" value="FF00FF" name="segno" hidden="True"/>
  <color symbol="Q" value="5E8FB8" name="pozzo"/>
  <color symbol="j" value="FF00FF" name="segno del cespuglio" hidden="True"/>
  <color symbol="W" value="E4D6B0" name="intonaco"/>
  <color symbol="V" value="B98B5A" name="legno dell'ala"/>
  <color symbol="Z" value="7A4A2E" name="assi del fienile"/>
  <color symbol="U" value="8A6A44" name="fascia delle finestre"/>
  <color symbol="L" value="8EC5D6" name="vetro"/>
  <color symbol="P" value="BF9A66" name="assi del pavimento" area="house"/>
  <color symbol="A" value="D9B77C" name="pavimento dell'ala" area="wing"/>
  <color symbol="D" value="B7873E" name="pavimento del fienile" area="barn"/>
  <color symbol="F" value="8F8576" name="solaio"/>
  <color symbol="R" value="B5473A" name="tetto di coppi"/>
  <color symbol="J" value="7A4F34" name="tettoia"/>
  <color symbol="T" value="7F7F7F" name="traccia della scala" hidden="True"/>
  <color symbol="k" value="A0907A" name="gradini"/>
  <color symbol="O" value="6B4226" name="porta"/>
  <color symbol="o" value="3E2615" name="assi della porta"/>
  <color symbol="N" value="4A3A2E" name="stipite"/>
  <color symbol="K" value="5A3C28" name="tronco"/>
  <color symbol="C" value="3F7A3A" name="fogliame"/>
  <color symbol="X" value="8A8A8A" name="pietra del pozzo"/>
  <color symbol="q" value="5E8FB8" name="acqua del pozzo" area="well"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
