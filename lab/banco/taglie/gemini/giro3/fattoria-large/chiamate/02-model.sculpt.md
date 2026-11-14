# model.sculpt · gemini-3.8-flash · 30 s

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
<sequence values="BHEhiwvdnmGrkstKaQxy" symmetry="(xy)" soil="E" origin="bottom">
  <!--
    Fattoria (farmstead):
    Concept and parts:
    - Main farmhouse (h: interior, w: stone/timber walls): 2 storeys, gable roof, holds the stair (s) along the north wall.
    - Front door (d) on south wall, 3 cells wide (15 voxels).
    - Barn/lean-to wing (a: barn floor, v: barn walls): attached to one side (east or west), 1 storey, storage/hayloft.
    - Farmyard (n: courtyard paving/gravel) in front of the house and barn, road (r) leading out to the south edge.
    - Enclosing stone fence / low wall (G: gate, K: fence).
    - Extra elements on larger grounds:
      * vegetable garden / orchard (x) behind or beside the yard.
      * water well (Q) in the courtyard.
      * haystacks / shed (y) in the yard.
    Seeds change:
    - Barn placement (flips or shifts side).
    - Main house depth and width variations.
    - Position of well, garden, and haystacks based on remaining space.
  -->
  <map scale="1/5 1/5 1" values="BHEhiwvdnmGrkstKaQxy" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Central spine of the farmhouse around H: 3 cells north, 3 cells south -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <!-- Expand house east and west: 3 cells each side (total width 7 cells = 35 voxels inside) -->
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <!-- Outer perimeter walls of the house (w) -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Stair zone (s): placed along north wall inside house, 4 cells long (x) and 2 cells wide (y), leaving landing space -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- 3. Barn / stable wing (a, v) attached to side wall of house (3 cells wide, 5 cells long) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- 4. Front door (d) through south wall of the farmhouse (3 cells wide) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- 5. Courtyard paving (n) extending in front of the house and barn -->
      <all in="[dv]/E" out="*/n" symmetry="()" steps="3"/>
      <all in="nE" out="*n" symmetry="(x)" steps="2"/>
      <all in="nE/*n" out="*n/**"/>

      <!-- 6. Enclosing fence / low stone wall (K) around courtyard, with gate (G) and road (r) to the south -->
      <all in="nE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>
      <!-- Opening the gate and road to the south edge -->
      <all in="d/n" out="*/n" symmetry="()"/>
      <all in="n/K" out="*/G" symmetry="()" steps="1"/>
      <all in="GK" out="*G" symmetry="(x)" steps="1"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="rE/*r" out="*r/**" steps="1"/>

      <!-- 7. Fit extra parts for larger grounds: Well (Q) in courtyard, Garden (x), Haystack (y) -->
      <!-- Water well in courtyard if enough space -->
      <one in="nnnnn/nnnnn/nnnnn" out="*****/*****/**Q**" steps="1"/>

      <!-- Garden / orchard patch (x) where ample free ground exists -->
      <one in="EEEEEE/EEEEEE/EEEEEE/EEEEEE" out="******/*xxxx*/*xxxx*/*xxxx*" steps="1"/>
      <all in="xE" out="*x" steps="1"/>

      <!-- Haystacks / animal pens (y) adjacent to barn or fence -->
      <one in="EE/EE" out="yy/yy" steps="1"/>
    </sequence>
  </map>
  <!-- Palette and area markers for plan level -->
  <color symbol="E" value="#4a7c59" name="erba" hidden="True"/>
  <color symbol="H" value="#d2b48c" name="centro" hidden="True"/>
  <color symbol="h" value="#c8ad7f" name="pavimento casa" area="house"/>
  <color symbol="w" value="#5a534c" name="muro casa"/>
  <color symbol="s" value="#8b5a2b" name="vano scala"/>
  <color symbol="a" value="#a08260" name="pavimento stalla" area="barn"/>
  <color symbol="v" value="#443e39" name="muro stalla"/>
  <color symbol="d" value="#704214" name="porta"/>
  <color symbol="n" value="#b0a48a" name="aia" area="courtyard"/>
  <color symbol="K" value="#736b63" name="recinto"/>
  <color symbol="G" value="#4a3b32" name="cancello"/>
  <color symbol="r" value="#9e8c6c" name="strada"/>
  <color symbol="Q" value="#4682b4" name="pozzo"/>
  <color symbol="x" value="#3b6e47" name="orto" area="garden"/>
  <color symbol="y" value="#c29b38" name="fienile"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, w muro casa, v muro stalla, d porta, n aia, G cancello, r strada, s vano scala, K recinto, a pavimento stalla, x orto, y fienile
Plan (the letter of every cell):
```
EEEEEEEEEEEEExxxxxxE
EEEEEEEEEEEEExxxxxxE
EEEEEEEEEEEEExxxxxxE
EEEEEEEEEEEEEExxxxEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEvvvvwwwwwwwwwEEEEE
EEvaaawhhsssshwyyEEE
EEvaaawhhsssshwyyEEE
EEvaaawhhhhhhhwEEEEE
EEvaaawhhhhhhhwEEEEE
EEvaaawhhhhhhhwEEEEE
KKvvvvwhhhhhhhwEEEEE
nnnnnnwhhhhhhhwEEEEE
GGGGGGwwwdddwwwEEEEE
KKKKKKKnnnnnnnKEEEEE
KKKKKKGGGGGGGGGEEEEE
EEEEEErrrrrrrrrEEEEE
EEEEEErrrrrrrrrEEEEE
EEEEEErrrrrrrrrEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, w muro casa, v muro stalla, d porta, n aia, G cancello, r strada, s vano scala, K recinto, a pavimento stalla, x orto, y fienile
Plan (the letter of every cell):
```
ExxxxEEEEEEEEEEEEEEE
xxxxxxEEEEEEEEEEEEEE
xxxxxxEEEEEEEEEEEEEE
xxxxxxEEEEEEEEEEEEEE
ExxxxEEyyEEEEEEEEEEE
EEEEEEEyyEEEEEEEEEEE
EEEEEEwwwwwwwwwEEEEE
EEEEEEwhhsssshwvvvvE
EEEEEEwhhsssshwaaavE
EEEEEEwhhhhhhhwaaavE
EEEEEEwhhhhhhhwaaavE
EEEEEEwhhhhhhhwaaavE
EEEEEEwhhhhhhhwaaavE
EEEEEEwhhhhhhhwvvvvK
EEEEEEwwwdddwwwnnnnn
EEEEEEKnnnnnnnGGGGGG
EEEEEEGGGGGGGGGKKKKK
EEEEEErrrrrrrrrEEEEE
EEEEEErrrrrrrrrEEEEE
EEEEEErrrrrrrrrEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, w muro casa, v muro stalla, d porta, n aia, G cancello, r strada, s vano scala, K recinto, a pavimento stalla, x orto, y fienile
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEyyEEEEEEEEEEEEEE
EEEEyyEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEwwwwwwwwwEEEEE
EEEEEEwhhsssshwEEEEE
EEEEEEwhhsssshwEEEEE
EEvvvvwhhhhhhhwEEEEE
EEvaaawhhhhhhhwExxxE
EEvaaawhhhhhhhwxxxxx
EEvaaawhhhhhhhwxxxxx
EEvaaawhhhhhhhwxxxxx
EEvaaawwwdddwwwxxxxx
KKvvvvnnnnnnnnKExxxE
nnnnnnnnnnnnnnKEEEEE
GGGGGGGGGGGGGGGEEEEE
rrrrrrrrrrrrrrrEEEEE
rrrrrrrrrrrrrrrEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, w muro casa, v muro stalla, d porta, n aia, G cancello, r strada, s vano scala, K recinto, a pavimento stalla, x orto, y fienile
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEExxxEEEE
EEEEEEEEEEEEEEEEEEEEEExxxxxEEE
EEEEEEEEEEEEEEEEEEEEEExxxxxEEE
EEEEEEEEEEEEEEEEEEEEEExxxxxEEE
EEEEEEEvvvvwwwwwwwwwEExxxxxEEE
EEEEEEEvaaawhhsssshwEEExxxEEEE
EEEEEEEvaaawhhsssshwEEEEEEEEEE
EEEEEEEvaaawhhhhhhhwEEEEEEEEEE
EEEEEEEvaaawhhhhhhhwEEEEEEEEEE
EEEEEEEvaaawhhhhhhhwEEEEEEEEEE
EEEEKKKvvvvwhhhhhhhwyyEEEEEEEE
EEEEKnnnnnnwhhhhhhhwyyEEEEEEEE
EEEEGGGGGGGwwwdddwwwEEEEEEEEEE
EEEEKKKKKKKKnnnnnnnKEEEEEEEEEE
EEEEKKKKKKKGGGGGGGGGEEEEEEEEEE
EEEEEEEEEEErrrrrrrrrEEEEEEEEEE
EEEEEEEEEEErrrrrrrrrEEEEEEEEEE
EEEEEEEEEEErrrrrrrrrEEEEEEEEEE
EEEEEEEEEEErrrrrrrrrEEEEEEEEEE
EEEEEEEEEEErrrrrrrrrEEEEEEEEEE
EEEEEEEEEEErrrrrrrrrEEEEEEEEEE
EEEEEEEEEEErrrrrrrrrEEEEEEEEEE
EEEEEEEEEEErrrrrrrrrEEEEEEEEEE
```
How much the plans of the seeds differ: 0.55 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<sequence values="BHEhiwvdnmGrkstKaQxyOPWNofFRTklCY" symmetry="(xy)" soil="E" origin="bottom">
  <!--
    Fattoria (farmstead):
    Composition:
    - Main farmhouse (h: interior, w: walls, s: stair zone, d: door opening seed)
    - Side wing / barn (a: interior, v: walls)
    - Courtyard / aia (n: paving, G: gate, K: fence, r: road to edge)
    - Extra farm features: garden (x), hay (y), well (Q)
    Full scale (5x5):
    - Ground floor z=0, slab z=32, roof z=64
    - Stair climbs toward large x, door opens South
    - Wing is single-storey (z=32 pitched roof)
    - Main house is 2 storeys (z=64 pitched roof)
  -->
  <map scale="1/5 1/5 1" values="BHEhiwvdnmGrkstKaQxy" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Farmhouse body: 3 north, 3 south of H, 3 east, 3 west -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Stair zone along the north wall inside farmhouse (4 cells long x, 2 cells wide y) -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- 3. Attached barn wing (a, v) on side wall -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- 4. Front door through south wall of farmhouse (3 cells wide) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- 5. Courtyard paving (n) in front -->
      <all in="[dv]/E" out="*/n" symmetry="()" steps="3"/>
      <all in="nE" out="*n" symmetry="(x)" steps="2"/>
      <all in="nE/*n" out="*n/**"/>

      <!-- 6. Enclosure wall/fence (K), Gate (G), Road (r) -->
      <all in="nE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>
      <all in="d/n" out="*/n" symmetry="()"/>
      <all in="n/K" out="*/G" symmetry="()" steps="1"/>
      <all in="GK" out="*G" symmetry="(x)" steps="1"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="rE/*r" out="*r/**" steps="1"/>

      <!-- 7. Well (Q), Garden (x), Haystack (y) -->
      <one in="nnnnn/nnnnn/nnnnn" out="*****/*****/**Q**" steps="1"/>
      <one in="EEEEEE/EEEEEE/EEEEEE/EEEEEE" out="******/*xxxx*/*xxxx*/*xxxx*" steps="1"/>
      <all in="xE" out="*x" steps="1"/>
      <one in="EE/EE" out="yy/yy" steps="1"/>
    </sequence>

    <!-- Map up to full voxel grid: 1 cell becomes 5x5 voxels -->
    <map scale="5 5 1" values="BEOPWNofFRTklCY" symmetry="()">
      <!-- House wall -->
      <rule in="w" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <!-- Barn wall -->
      <rule in="v" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <!-- House floor -->
      <rule in="h" out="fffff/fffff/fffff/fffff/fffff"/>
      <!-- Barn floor -->
      <rule in="a" out="fffff/fffff/fffff/fffff/fffff"/>
      <!-- Stair zone: floor with T marker strip for part-stair -->
      <rule in="s" out="fffff/fffff/fffff/fffff/fffff"/>
      <!-- Main door opening seed (O) across wall thickness -->
      <rule in="d" out="OOOOO/OOOOO/OOOOO/OOOOO/OOOOO"/>
      <!-- Courtyard paving -->
      <rule in="n" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <!-- Road -->
      <rule in="r" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <!-- Fence / low stone wall -->
      <rule in="K" out="CCCCC/CCCCC/CCCCC/CCCCC/CCCCC"/>
      <!-- Gate opening in fence -->
      <rule in="G" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <!-- Well -->
      <rule in="Q" out="CCCCC/Clllc/Clllc/Clllc/CCCCC"/>
      <!-- Garden -->
      <rule in="x" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <!-- Haystack -->
      <rule in="y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <!-- Soil / grass -->
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <!-- B. Heights: Columns rise by steps -->

        <!-- Courtyard, road and garden stay at bottom layer, low fence rises 10 voxels -->
        <all in="B C" out="C C" steps="10"/>

        <!-- Haystack rises 14 voxels -->
        <all in="B y" out="y y" steps="14"/>

        <!-- Well stone ring rises 12 voxels, water stays low -->
        <all in="B C" out="C C" steps="12"/>

        <!-- Floors and door seed on ground layer (z=0 is already set) -->

        <!-- Stair marker: strip T placed at z=1 above stair zone -->
        <!-- In the 4-cell stair zone (20x10 voxels), lay T in the air just above floor -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="1"/>
        <all in="B a" out="a B" steps="1"/>
        <all in="B f" out="f B" steps="1"/>

        <!-- Ground storey: columns of walls (W) rise up to slab (z=32) with window bands (U) -->
        <all in="B W" out="W W" steps="6"/>
        <all in="B W" out="W U" steps="14"/>
        <all in="B W" out="W W" steps="11"/>

        <!-- Air inside house and barn for ground floor -->
        <all in="B h" out="h B" steps="30"/>
        <all in="B s" out="s B" steps="30"/>
        <all in="B a" out="a B" steps="30"/>

        <!-- z=32: First floor slab (F) above house, roof (R) over barn -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
          <rule in="B a" out="a R"/>
        </all>

        <!-- Second storey: Farmhouse walls rise another 32 voxels (to z=64) -->
        <!-- Barn roof caps at z=32, so barn walls stop and take R -->
        <!-- House walls continue: 6 solid, 14 window band, 11 solid, 1 roof header -->
        <all in="B W" out="W W" steps="6"/>
        <all in="B W" out="W U" steps="14"/>
        <all in="B W" out="W W" steps="11"/>

        <!-- Air inside house for second storey -->
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="31"/>

        <!-- Ceiling/Roof cap of house at z=64 -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
          <rule in="W" out="R"/>
        </prl>

        <!-- C. Full scale: Doors, Stairs, Windows, Roofs, Cleaning -->

        <!-- Include part-door to carve and frame the front door -->
        <union symbol="+" values="W"/>
        <import file="part-door"/>

        <!-- Include part-stair to construct the wooden stair to 2nd storey -->
        <union symbol="=" values="fF"/>
        <import file="part-stair"/>

        <!-- Windows in window band (U): punch through to interior air (B) -->
        <one steps="16">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <all in="LUUUB" out="*LLL*"/>
        <all in="LUUB" out="*LL*"/>
        <!-- Remaining window band letters revert to wall -->
        <prl in="U" out="W"/>

        <!-- Roofs: Pitched gable roofs on house and barn -->
        <!-- Eaves overhang 1 voxel -->
        <all in="RB" out="*R" steps="1"/>
        <!-- Hip / pitch steps inward and upward -->
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Chimney on farmhouse roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="8"/>

        <!-- Clean up any remaining internal markers -->
        <prl>
          <rule in="a" out="f"/>
          <rule in="h" out="f"/>
          <rule in="s" out="B"/>
          <rule in="m" out="B"/>
          <rule in="d" out="B"/>
        </prl>
      </sequence>
    </map>
  </map>

  <!-- Interactive actions for doors -->
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>

  <!-- Palette: 6+ distinct materials, warm medieval farmhouse aesthetic -->
  <color symbol="E" value="#4a7c59" name="erba" hidden="True"/>
  <color symbol="H" value="#d2b48c" name="centro" hidden="True"/>
  <color symbol="W" value="#7a7065" name="pietra muro"/>
  <color symbol="f" value="#a47843" name="tavole pavimento" area="house"/>
  <color symbol="F" value="#8b6536" name="solaio legno"/>
  <color symbol="R" value="#9e4732" name="tegole tetto"/>
  <color symbol="Y" value="#c2b397" name="ghiaia aia" area="courtyard"/>
  <color symbol="C" value="#615a52" name="muretto pietra"/>
  <color symbol="O" value="#4a3319" name="vano porta"/>
  <color symbol="o" value="#5c4028" name="battente legno"/>
  <color symbol="N" value="#362517" name="telaio porta"/>
  <color symbol="k" value="#b88a4c" name="scalini legno"/>
  <color symbol="L" value="#a8c8d8" name="vetro finestra"/>
  <color symbol="l" value="#3b728c" name="acqua pozzo"/>
  <color symbol="y" value="#cfa43a" name="paglia fieno"/>
  <color symbol="K" value="#524a42" name="comignolo"/>
  <color symbol="#20" value="#4a3319" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="#5c4028" name="asse aperta" hidden="True"/>
</sequence>
```
