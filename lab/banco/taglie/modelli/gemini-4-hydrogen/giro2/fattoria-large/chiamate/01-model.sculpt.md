# model.sculpt · gemini-4-hydrogen · 15 s

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

<!-- Fattoria (Farmstead)
Parts & plan letters:
- h: main house interior (two storeys, around H, 7-9 wide x 8-9 deep)
- w: main house walls
- s: stair zone inside the house (along a wall, 2 cells landing + 4 cells stair)
- d: front door (3 cells wide, facing front)
- r: road/path from front door straight to the front edge
- p: lean-to porch/shed against one side wall of the house (4 cells deep x 6 cells long)
- c: fenced yard in front/around the house, expanding where ground allows
- f: fence around the yard
- b, v, q: barn/hay annex (interior, walls, door) built at larger sizes where space fits
- Q: well in the yard (where 5x5 of yard fits)
- t: trees on free ground (where 7x7 of E fits)
- g: cultivated field/garden beyond the yard at larger sizes
Seeds vary: house depth/width, which side the lean-to is on, stair side, yard expansion, barn/tree/well placement.
Sizes: Large (20x20) has house, lean-to, yard, road; Huge (30x30) adds barn, well, trees, and fields. -->
<sequence values="BHEhwsdrcfQptbvgq" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdrcfQptbvgq" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main house around H: 3 behind, 4-5 in front, 3-4 each side -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <prl in="Eh" out="h*" p="0.5" steps="1" symmetry="(x)"/>
      <!-- House walls -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Stair zone inside the house: 2 cells landing + 4 cells stair, 2 cells wide -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- Front door (3 cells wide) and road to the front edge -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="d" out="h" symmetry="()"/>
      <!-- Restore door in w -->
      <all in="h/w/r" out="*/d/*" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <!-- Lean-to porch against one side wall (4 deep, 6 long) -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="p*/p*/p*/p*/p*/p*" symmetry="(x)" steps="1"/>
      <all in="Ep" out="p*" symmetry="(x)" steps="3"/>
      <!-- Yard around the house and porch -->
      <all in="[wp]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand yard where ground goes on (larger sizes) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Barn annex at larger sizes where 6x6 of yard/ground fits -->
      <one in="cccccc/cccccc/cccccc/cccccc/cccccc/cccccc" out="vvvvvv/vbbbbv/vbbbbv/vbbbbv/vbbbbv/vvqqvv" steps="1"/>
      <!-- Well in 5x5 of yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- Fence around yard -->
      <all in="[cb]E" out="*f" steps="1"/>
      <all in="fE/*f" out="*f/**"/>
      <!-- Keep road clear -->
      <prl in="r" out="r"/>
      <all in="[cf]/r" out="*/r" symmetry="()"/>
      <!-- Fields beyond fence where ground goes on -->
      <all in="fEEEEEE" out="*gggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- Trees on free ground (7x7 of E) -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="E" value="8A9A5B" hidden="True"/>
  <color symbol="H" value="D2B48C" name="pavimento casa"/>
  <color symbol="h" value="D2B48C" name="pavimento casa" area="house"/>
  <color symbol="w" value="E8DCC4" name="muro casa"/>
  <color symbol="s" value="C19A6B" name="zona scala" area="house"/>
  <color symbol="d" value="6F4E37" name="porta"/>
  <color symbol="r" value="B8A99A" name="strada"/>
  <color symbol="p" value="A0785A" name="tettoia" area="porch"/>
  <color symbol="c" value="C2B280" name="aia" area="yard"/>
  <color symbol="f" value="8B5A2B" name="staccionata"/>
  <color symbol="Q" value="708090" name="pozzo"/>
  <color symbol="t" value="4F7942" name="albero"/>
  <color symbol="b" value="C8A165" name="fienile" area="barn"/>
  <color symbol="v" value="A52A2A" name="muro fienile"/>
  <color symbol="q" value="5C4033" name="porta fienile"/>
  <color symbol="g" value="9ACD32" name="campo" area="field"/>
</sequence>
