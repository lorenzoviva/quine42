# model.sculpt · claude-sonnet-5-5 · 182 s

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

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

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
