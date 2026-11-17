# model.sculpt · claude-opus-5-5 · 162 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
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
  FATTORIA: a farmhouse that takes most of the area, with a lean-to on its short side and hay behind.
  Plan letters, one cell = 5 voxels:
    h  the house floor: 13 x 13 cells inside the walls. The house sits on H, 6 cells behind and 6 in front.
       It has 5 cells to one side and 7 to the other; the seed picks which side is wide.
    w  the house walls, one cell thick, corners filled.
    d  the front door, 3 cells wide, on the axis of H.
    r  the road from the door straight to the edge of the box.
    l  the lean-to (tettoia), 4 cells deep (20 voxels), against the whole narrow side of the house.
       It only grows from the wall where 4 cells of ground are free.
    y  the haystack behind the house, against the back wall, where 3 rows of ground are free.
    g  the farmyard ring, only where the ground goes on beyond it.
    x  the fence around the yard.
    c  the fields outside the fence.
    t  trees, where a 7 x 7 window of free ground remains.
  What the seeds change:
    which side is wide, so the lean-to switches side;
    one extra cell at the front, by chance;
    where the hay goes;
    where the fields and the trees fall.
  At Large: the house, the lean-to, the hay behind and the road.
  At Huge: also the yard, the fence, the fields and the trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjmdrlygxct" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the body: a line through H, 6 cells behind and 6 in front -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <!-- 5 cells to each side -->
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="5"/>
      <!-- the wide side, chosen once from the row of H -->
      <one in="HhhhhhE" out="******j" symmetry="(x)" steps="1"/>
      <all><rule in="hE/hj" out="*j/**"/><rule in="hj/hE" out="**/*j"/></all>
      <all in="jE" out="*h" symmetry="(x)" steps="1"/>
      <prl in="j" out="h"/>
      <!-- the walls, corners filled -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the door and the road, on the axis of H toward the front -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- the lean-to on the narrow side: one seed from the row of the door axis, then along the wall, then 4 cells deep -->
      <one in="hhhhhwE" out="******l" symmetry="(x)" steps="1"/>
      <all><rule in="wE/wl" out="*l/**"/><rule in="wl/wE" out="**/*l"/></all>
      <all in="lE" out="*l" symmetry="(x)" steps="3"/>
      <!-- the hay against the back wall -->
      <one in="EEEEE/EEEEE/EEEEE/wwwww" out="*****/*yyy*/*yyy*/*****" symmetry="()" steps="1"/>
      <!-- the yard, only where the ground goes on; then the fence -->
      <all in="[wlyr]EEEEE" out="*g****" steps="1"/>
      <all in="gEEEE" out="*g***" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEE" out="*x**" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- the fields beyond the fence -->
      <all in="xEEEE" out="*cc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- the trees -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="h" value="#b08a5a" name="pavimento di casa"/>
  <color symbol="w" value="#e6dcc4" name="muro intonacato"/>
  <color symbol="j" value="#c9a26b" name="segno del lato largo"/>
  <color symbol="m" value="#a07a4a" name="segno dell'asse"/>
  <color symbol="d" value="#5a3a22" name="porta"/>
  <color symbol="r" value="#bfae8a" name="strada sterrata"/>
  <color symbol="l" value="#8a6a44" name="tettoia" area="barn"/>
  <color symbol="y" value="#e3c75a" name="fieno" area="barn"/>
  <color symbol="g" value="#9fb86a" name="aia" area="yard"/>
  <color symbol="x" value="#7a5a3a" name="staccionata"/>
  <color symbol="c" value="#c8b45a" name="campo" area="field"/>
  <color symbol="t" value="#4f7a3a" name="albero"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento di casa, w muro intonacato, d porta, r strada sterrata, l tettoia, y fieno, g aia, x staccionata, c campo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEccxggyyyggxEEE
EEEEEEccxggyyyggxEEE
llllwwwwwwwwwwwwwwwE
llllwhhhhhhhhhhhhhwE
llllwhhhhhhhhhhhhhwE
llllwhhhhhhhhhhhhhwE
llllwhhhhhhhhhhhhhwE
llllwhhhhhhhhhhhhhwE
llllwhhhhhhhhhhhhhwE
llllwhhhhhhhhhhhhhwE
llllwhhhhhhhhhhhhhwE
llllwhhhhhhhhhhhhhwE
llllwhhhhhhhhhhhhhwE
llllwhhhhhhhhhhhhhwE
llllwhhhhhhhhhhhhhwE
llllwhhhhhhhhhhhhhwE
llllwwwwwdddwwwwwwwE
EEEEccxggrrrggxccEEE
EEEEccxggrrrggxccEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento di casa, w muro intonacato, d porta, r strada sterrata, l tettoia, y fieno, g aia, x staccionata, c campo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EExggyyyggxccEEEEEEE
EExggyyyggxccEEEEEEE
llwwwwwwwwwwwwwwwEEE
llwhhhhhhhhhhhhhwEEE
llwhhhhhhhhhhhhhwEEE
llwhhhhhhhhhhhhhwEEE
llwhhhhhhhhhhhhhwEEE
llwhhhhhhhhhhhhhwEEE
llwhhhhhhhhhhhhhwEEE
llwhhhhhhhhhhhhhwEEE
llwhhhhhhhhhhhhhwEEE
llwhhhhhhhhhhhhhwEEE
llwhhhhhhhhhhhhhwEEE
llwhhhhhhhhhhhhhwEEE
llwhhhhhhhhhhhhhwEEE
llwhhhhhhhhhhhhhwEEE
llwwwwwwwdddwwwwwEEE
EEEEccxggrrrggxccEEE
EEEEccxggrrrggxccEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento di casa, w muro intonacato, d porta, r strada sterrata, l tettoia, y fieno, g aia, x staccionata, c campo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEExggyyyggxccEEEEEE
EEExggyyyggxccEEEEEE
EEwwwwwwwwwwwwwwwlll
EEwhhhhhhhhhhhhhwlll
EEwhhhhhhhhhhhhhwlll
EEwhhhhhhhhhhhhhwlll
EEwhhhhhhhhhhhhhwlll
EEwhhhhhhhhhhhhhwlll
EEwhhhhhhhhhhhhhwlll
EEwhhhhhhhhhhhhhwlll
EEwhhhhhhhhhhhhhwlll
EEwhhhhhhhhhhhhhwlll
EEwhhhhhhhhhhhhhwlll
EEwhhhhhhhhhhhhhwlll
EEwhhhhhhhhhhhhhwlll
EEwhhhhhhhhhhhhhwlll
EEwwwwwwwdddwwwwwlll
EEEEccxggrrrggxccEEE
EEEEccxggrrrggxccEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento di casa, w muro intonacato, d porta, r strada sterrata, l tettoia, y fieno, g aia, x staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EExxxxxxxxxxxxxxxxxxxxxxxxxEEE
EExgggggggggggggggggggggggxEEE
EExgggggggggggggggggggggggxEEE
EExgggggggggggggggggyyygggxEEE
EExgggggggggggggggggyyygggxEEE
EExggllllwwwwwwwwwwwwwwwggxEEE
EExggllllwhhhhhhhhhhhhhwggxEEE
EExggllllwhhhhhhhhhhhhhwggxEEE
EExggllllwhhhhhhhhhhhhhwggxEEE
EExggllllwhhhhhhhhhhhhhwggxEEE
EExggllllwhhhhhhhhhhhhhwggxEEE
EExggllllwhhhhhhhhhhhhhwggxEEE
EExggllllwhhhhhhhhhhhhhwggxEEE
EExggllllwhhhhhhhhhhhhhwggxEEE
EExggllllwhhhhhhhhhhhhhwggxEEE
EExggllllwhhhhhhhhhhhhhwggxEEE
EExggllllwhhhhhhhhhhhhhwggxEEE
EExggllllwhhhhhhhhhhhhhwggxEEE
EExggllllwhhhhhhhhhhhhhwggxEEE
EExggllllwwwwwdddwwwwwwwggxEEE
EExgggggggggggrrrgggggggggxEEE
EExgggggggggggrrrgggggggggxEEE
EExgggggggggggrrrgggggggggxEEE
EExgggggggggggrrrgggggggggxEEE
EExgggggggggggrrrgggggggggxEEE
EExgggggggggggrrrgggggggggxEEE
EExgggggggggggrrrgggggggggxEEE
```
How much the plans of the seeds differ: 0.48 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  FATTORIA: a farmhouse that fills most of the area. It has a lean-to on one short side, the hay behind, and at Huge a yard with a dry-stone wall, fields and trees.
  The plan, one cell = 5 voxels:
    h  floor of the house, 13 x 13 cells inside the walls, two storeys.
       The ground floor is cut by an inner wall i into a hall at the front (6 rows) and a room at the back (6 rows).
    s  the stair zone, in the back room against the back wall, with 2 cells of landing before it.
    w  outer walls; d the front door, 3 cells wide; r the road to the edge.
    l  the lean-to (4 cells deep) on the narrow side; p its posts at its front and back ends.
    y  the hay behind the house; g the yard; x the dry-stone wall; c the fields; t the trees.
  Seeds change the wide side (so the lean-to switches side), an extra front row, where the hay, the fields and the trees fall.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjmdrlygxctisap" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="5"/>
      <one in="HhhhhhE" out="******j" symmetry="(x)" steps="1"/>
      <all><rule in="hE/hj" out="*j/**"/><rule in="hj/hE" out="**/*j"/></all>
      <all in="jE" out="*h" symmetry="(x)" steps="1"/>
      <prl in="j" out="h"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="hhhhhwE" out="******l" symmetry="(x)" steps="1"/>
      <all><rule in="wE/wl" out="*l/**"/><rule in="wl/wE" out="**/*l"/></all>
      <all in="lE" out="*l" symmetry="(x)" steps="3"/>
      <one in="EEEEE/EEEEE/EEEEE/wwwww" out="*****/*yyy*/*yyy*/*****" symmetry="()" steps="1"/>
      <!-- the rooms: 6 rows behind, the inner wall, the hall in front -->
      <all in="w/h" out="*/a" symmetry="()" steps="1"/>
      <all in="a/h" out="*/a" symmetry="()" steps="5"/>
      <all in="a/h" out="*/i" symmetry="()" steps="1"/>
      <one in="wwwwwww/waaaaaa/waaaaaa" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <prl in="a" out="h"/>
      <!-- the yard, the wall, the fields, the trees -->
      <all in="[wlyr]EEEEE" out="*g****" steps="1"/>
      <all in="gEEEE" out="*g***" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEE" out="*x**" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="xEEEE" out="*cc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
      <!-- the posts of the lean-to at its two ends -->
      <all in="l/[Eg]" out="p/*" symmetry="()"/>
      <all in="[Eg]/l" out="*/p" symmetry="()"/>
    </sequence>
    <map scale="5 5 1" values="BEhfFRwWuzViDOoNsTkLPmJYGXAZbnvrKMU#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="l" out="LLLLL/LLLLL/LLLLL/LLLLL/LLLLL"/>
      <rule in="p" out="LLLLL/LPPPL/LPPPL/LPPPL/LLLLL"/>
      <rule in="y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="g" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="x" out="XXXXX/XXXXX/XXXXX/XXXXX/XXXXX"/>
      <rule in="c" out="AAAAA/ZZZZZ/AAAAA/ZZZZZ/AAAAA"/>
      <rule in="t" out="GGGGG/GnnnG/GnnnG/GnnnG/GGGGG"/>
      <sequence symmetry="(xy)">
        <!-- B. the walls: two storeys, plaster / window band / plaster -->
        <all steps="1"><rule in="B w" out="w W"/><rule in="B D" out="D O"/></all>
        <all steps="5"><rule in="B w" out="w W"/><rule in="B D" out="D W"/></all>
        <all steps="14"><rule in="B w" out="w u"/><rule in="B D" out="D u"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B D" out="D W"/></all>
        <all steps="6"><rule in="B w" out="w W"/><rule in="B D" out="D W"/></all>
        <all steps="14"><rule in="B w" out="w u"/><rule in="B D" out="D u"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B D" out="D W"/></all>
        <!-- floors, inner wall, stair strip, slab -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/><rule in="B i" out="i V"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B i" out="i V"/></all>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/><rule in="B i" out="i F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/><rule in="B i" out="i B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/><rule in="i" out="R"/><rule in="w" out="R"/><rule in="D" out="R"/></prl>
        <!-- the lean-to: posts, roof at 34 -->
        <all in="B P" out="P P" steps="33"/>
        <all in="B L" out="m *" steps="1"/>
        <all in="B m" out="m B" steps="33"/>
        <prl in="m" out="J"/>
        <all in="JB" out="*J" steps="1"/>
        <!-- hay, dry-stone wall, crops, trees -->
        <all in="B Y" out="Y Y" steps="14"/>
        <all in="B X" out="X X" steps="5"/>
        <all in="B A" out="A A" steps="3"/>
        <all in="B n" out="n b" steps="14"/>
        <prl in="n" out="v"/>
        <all in="vB" out="*v" steps="3"/>
        <all in="B v" out="v v" steps="5"/>
        <!-- C. the door in the inner wall -->
        <one in="fffffffffff/VVVVVVVVVVV/VVVVVVVVVVV/VVVVVVVVVVV/VVVVVVVVVVV/VVVVVVVVVVV/fffffffffff" out="***********/OOOOOOOOOOO/OOOOOOOOOOO/OOOOOOOOOOO/OOOOOOOOOOO/OOOOOOOOOOO/***********" symmetry="()" steps="1"/>
        <!-- windows -->
        <one steps="14"><rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu" out="*z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z *z/*z/*z/*z/*z/*z"/></one>
        <all in="zuuuuB" out="*zzzz*"/>
        <prl in="u" out="W"/>
        <union symbol="+" values="WV"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="X"/>
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>
        <!-- roof: eaves, hip, chimney -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="4"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="f" value="#a8814f" name="assito"/>
  <color symbol="F" value="#8a6a44" name="solaio"/>
  <color symbol="R" value="#b5452e" name="tetto di coppi"/>
  <color symbol="W" value="#e6dcc4" name="muro intonacato"/>
  <color symbol="V" value="#d8c9a8" name="tramezzo"/>
  <color symbol="z" value="#4a6a8a" name="finestra"/>
  <color symbol="O" value="#6b4426" name="porta"/>
  <color symbol="o" value="#3e2716" name="assi della porta"/>
  <color symbol="N" value="#5a5048" name="stipite"/>
  <color symbol="T" hidden="True"/>
  <color symbol="k" value="#7a5634" name="gradino"/>
  <color symbol="L" value="#9a8466" name="suolo della tettoia" area="barn"/>
  <color symbol="P" value="#5e4128" name="palo"/>
  <color symbol="J" value="#6f5a3a" name="tetto della tettoia"/>
  <color symbol="Y" value="#e3c75a" name="fieno" area="barn"/>
  <color symbol="G" value="#9fb86a" name="aia" area="yard"/>
  <color symbol="X" value="#9a9488" name="muretto a secco"/>
  <color symbol="A" value="#d6b84e" name="grano" area="field"/>
  <color symbol="Z" value="#8a6a4a" name="terra arata" area="field"/>
  <color symbol="b" value="#5a3e26" name="tronco"/>
  <color symbol="v" value="#5f8a3e" name="chioma"/>
  <color symbol="r" value="#bfae8a" name="strada sterrata"/>
  <color symbol="K" value="#7c4a3a" name="comignolo"/>
  <color symbol="M" value="#a8a296" name="merlo"/>
  <color symbol="U" value="#2e2a26" name="feritoia"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
