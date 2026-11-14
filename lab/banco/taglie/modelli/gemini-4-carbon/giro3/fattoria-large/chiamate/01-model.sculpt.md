# model.sculpt · gemini-4-carbon · 34 s

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

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

<!--
Concept: Fattoria (Italian medieval farmhouse).
Parts and plan letters:
- Main farmhouse body (h interior floor, s stair zone 4x2 along back wall, w stone/plaster walls, d front door 3 cells wide). Centered near H, 9 or 10 wide, 7 or 8 deep (golden ratio ~ 8:5).
- Front porch / lean-to (p): 4 cells (20 voxels) deep along the front wall, flanking and sheltering the front entrance.
- Side barn / stable wing (a floor, v brick/wood walls, e internal doorway): attached to either the left or right wall of the main house, chosen by seed.
- Farmyard (c) & front road (r): gravel/cobble yard connecting the front porch to the road leading straight to the front edge, expanding around the house where ground allows.
- Haystack (y): placed behind the house or wing, connected to the yard.
- At Huge / Gargantuan sizes (where 6+ cells of open ground remain beyond the house and yard):
  - Yard expands outward and wraps around, enclosed by a low wooden fence (z) with a gate opening on the road.
  - Stone silo / dovecote tower (t interior, u stone wall with battlements) rises at a rear corner of the expanded yard.
  - Well (q) in a 5x5 clearing of the expanded yard.
  - Cultivated vegetable fields / furrows (g) and orchard trees (j) outside the fence or in the outer farmstead.
Seeds vary: house width/depth (9-10 x 7-8), side of the barn wing (left or right) and its offset, position of the haystack, corner of the dovecote tower, well placement, field and tree placement.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdpavecryztuqgj" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse interior (h): 9 or 10 wide, 7 or 8 deep around H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="E/h/h/h/h/h" out="*/h/*/*/*/*" p="0.5" steps="1" symmetry="()"/>
      <all in="hE/*h" out="*h/**"/>
      <prl in="H" out="h"/>

      <!-- Main house walls (w) -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone (s): 4 long (x) and 2 wide (y) along back wall, with 2 cells landing on small-x and floor on large-x -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Front door (d) in the middle of the front wall (3 cells wide) and road (r) straight to the front edge -->
      <one in="whhhw/wwwww/EEEEE" out="*****/*ddd*/*rrr*" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Front porch / lean-to (p): 4 cells deep (20 voxels) across the front of the house beside the road -->
      <all in="w/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="3"/>
      <all in="pr" out="pp" symmetry="(x)" steps="1"/>
      <!-- Ensure road continues cleanly from front of porch to edge -->
      <all in="d/p" out="*/r" symmetry="()" steps="4"/>

      <!-- Side wing / barn (a interior, v walls, e doorway): on left or right side of the house (where space fits) -->
      <one in="EEEEw/EEEEw/EEEEw/EEEEw/EEEEw/EEEEw" out="*****/***ae/***ae/***ae/***a*/*****" symmetry="(x)" steps="1"/>
      <all in="Ea" out="aa" symmetry="(x)" steps="2"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="[ae]E" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Initial yard (c) around porch, road, and house sides (1-2 cells) -->
      <all in="[prwv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Haystack (y): 2x2 behind the house or barn -->
      <one in="EE/EE/cw/ww" out="**/*y/*c/**" symmetry="(x)" steps="1"/>
      <all in="yE" out="*y" steps="1"/>
      <all in="yE/*y" out="*y/**"/>
      <all in="yE" out="*c" steps="1"/>

      <!-- Larger size expansion: where at least 6 cells of ground remain, expand the farmyard (c) into a wide rectangle -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Wooden fence (z) around the expanded yard only when room remains outside it -->
      <all in="cEE" out="*z*" steps="1"/>
      <all in="zE/*z" out="*z/**"/>
      <!-- Re-open road through any fence -->
      <all in="r/z" out="*/r" symmetry="()"/>
      <all in="rz" out="rr" symmetry="(x)" steps="1"/>

      <!-- Stone dovecote / silo tower (t interior 2x2, u walls -> 4x4 = 20x20 voxels) in a corner of the expanded yard -->
      <one in="zzzz/zccc/zccc/zccc" out="uuuu/uttu/uttu/uuuu" steps="1"/>

      <!-- Well (q) in a 5x5 open area of the yard (only fits at Huge+) -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Cultivated field plots (g) outside the fence where 5x6 space exists (Huge+) -->
      <one in="zEEEEE/zEEEEE/zEEEEE/zEEEEE/zEEEEE" out="*gggg*/*gggg*/*gggg*/*gggg*/*gggg*" steps="3"/>

      <!-- Orchard trees (j) in 5x5 open patches -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/*cjc*/*****/*****" steps="3"/>
      <!-- Connect isolated trees to nearby yard/fence if adjacent -->
      <all in="[czg]E/jc" out="*c/**" steps="2"/>
    </sequence>
  </map>

  <color symbol="E" value="#7a9a5a" name="erba"/>
  <color symbol="H" value="#ffffff" name="centro"/>
  <color symbol="h" value="#d8c29d" name="pavimento casa" area="house"/>
  <color symbol="s" value="#c49a6c" name="vano scala" area="house"/>
  <color symbol="w" value="#e8dfc8" name="muro intonacato" area="house"/>
  <color symbol="d" value="#7a4b2a" name="ingresso" area="house"/>
  <color symbol="p" value="#b89f7d" name="portico" area="porch"/>
  <color symbol="a" value="#c8b08a" name="fienile" area="barn"/>
  <color symbol="v" value="#b55a3c" name="muro fienile" area="barn"/>
  <color symbol="e" value="#8c5835" name="passaggio fienile" area="barn"/>
  <color symbol="c" value="#c2b59b" name="aia" area="yard"/>
  <color symbol="r" value="#a89f91" name="strada" area="yard"/>
  <color symbol="y" value="#e3b94b" name="pagliaio" area="yard"/>
  <color symbol="z" value="#8a623e" name="staccionata" area="yard"/>
  <color symbol="t" value="#9e988e" name="interno colombaia" area="tower"/>
  <color symbol="u" value="#8c877e" name="muro colombaia" area="tower"/>
  <color symbol="q" value="#5a8ab0" name="pozzo" area="yard"/>
  <color symbol="g" value="#6e5539" name="orto" area="field"/>
  <color symbol="j" value="#4f7d3a" name="albero da frutto" area="orchard"/>
</sequence>
