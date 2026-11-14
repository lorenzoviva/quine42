# model.sculpt · gemini-3.8-flash · 33 s

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
<!-- Fattoria (Farmhouse)
     Parts of the concept:
       - Main farmhouse body (h=interior, w=walls): 2 storeys, gable roof, stair inside along a wall
       - Stair zone (s): 4 cells long along x, 2 cells wide, 2 cells landing from door
       - Porch / Portico (p): in front of main entrance, open posts
       - Lean-to / Barn wing (a=interior, v=walls): attached to side or back
       - Courtyard / Yard (c): cobblestone/dirt yard in front
       - Road / Path (r): from entrance through yard to map edge
       - Doorway (d): 3 cells wide at house wall
       - Well (Q): in the yard where 5x5 fits
       - Orchard / Trees (t): in free ground where 7x7 fits (Huge size gets more trees and paddock)
       - Paddock / Enclosure (f=fence, g=pasture): on larger maps, attached to the yard/barn
-->
<sequence values="BHEhwspavcdrqtfgn" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwspavcdrqtfgn" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Main body around H: 3 cells behind, 3 in front, 4 to each side -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Stair zone inside main body: along rear wall, 4 cells long, 2 wide -->
      <one in="hhhh/hhhh" out="ssss/ssss" symmetry="()" steps="1"/>

      <!-- Main body walls -->
      <all in="[hs]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Front porch: 2 cells deep, 4 cells wide in front of house -->
      <all in="w/E" out="*/p" symmetry="()" steps="2"/>
      <!-- Restrict porch to central front area -->
      <all in="pE" out="*E" symmetry="(x)" steps="1"/>

      <!-- 3. Lean-to / Barn wing on one side chosen at random -->
      <one in="Ew/Ew/Ew/Ew" out="**/**/a*/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- 4. Yard in front of house and porch -->
      <all in="[pwv]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand yard where space allows (Huge map) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 5. Entrance road: door through house wall, path across yard to edge -->
      <!-- Door marker d at house front facing porch -->
      <one in="w/p" out="d/*" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <!-- Road across porch and yard -->
      <all in="[dp]/p" out="*/r" symmetry="()"/>
      <all in="[dr]/c" out="*/r" symmetry="()"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="r[pcE]" out="*r" symmetry="(x)" steps="1"/>

      <!-- 6. Enclosure / Paddock on free ground next to barn/yard (Huge map) -->
      <all in="vEEEEEE" out="*ggggg*" steps="1"/>
      <all in="gE/*g" out="*g/**" steps="3"/>
      <all in="gE" out="*f"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- 7. Well in courtyard where 5x5 fits -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- 8. Orchard trees in open ground where 7x7 fits -->
      <all in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="2"/>

      <!-- Clean seed marker H -->
      <prl in="H" out="h"/>
    </sequence>
  </map>
  <color symbol="E" value="#4a6e34" name="erba" hidden="True"/>
  <color symbol="H" value="#8b5a2b" name="centro" hidden="True"/>
  <color symbol="h" value="#d2b48c" name="pavimento casa" area="house"/>
  <color symbol="w" value="#8f8b7b" name="muro casa" area="house"/>
  <color symbol="s" value="#a07855" name="vano scala" area="house"/>
  <color symbol="p" value="#b89758" name="portico" area="porch"/>
  <color symbol="a" value="#c8b18a" name="fienile" area="barn"/>
  <color symbol="v" value="#6e5d4f" name="muro fienile" area="barn"/>
  <color symbol="c" value="#9e9480" name="aia cortile" area="yard"/>
  <color symbol="d" value="#5a3d28" name="soglia" area="house"/>
  <color symbol="r" value="#b0a287" name="strada" area="yard"/>
  <color symbol="q" value="#708090" name="pozzo" area="yard"/>
  <color symbol="Q" value="#4682b4" name="acqua pozzo" area="yard"/>
  <color symbol="t" value="#2d5a27" name="albero" area="orchard"/>
  <color symbol="f" value="#8b5a2b" name="steccato" area="pasture"/>
  <color symbol="g" value="#557a3e" name="recinto pascolo" area="pasture"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, w muro casa, s vano scala, p portico, a fienile, v muro fienile, c aia cortile, d soglia, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
cccccccccccccccccEEE
vvvvvccccccccccccEEE
vaaaawwwwwwwwwwwcEEE
vaaaawhhhhhhhhhwcEEE
vaaaawhhhhhhhhhwcEEE
vaaaawhhhhhhhhhwcEEE
vaaaawhhhhhhhhhwcEEE
vvvvvwhhhhsssshwcEEE
cccccwhhhhsssshwcEEE
cccccwhhhhhhhhhwcEEE
cccccdddwwwwwwwwcEEE
ccccrrrrrpppppppcEEE
ccccrrrrrccccccccEEE
EEEErrrrrEEEEEEEEEEE
EEEErrrrrEEEEEEEEEEE
EEEErrrrrEEEEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, w muro casa, s vano scala, p portico, a fienile, v muro fienile, c aia cortile, d soglia, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
cccccccccccccccccEEE
vvvvvccccccccccccEEE
vaaaawwwwwwwwwwwcEEE
vaaaawhhhhhhhhhwcEEE
vaaaawhhhhhhhhhwcEEE
vaaaawhhhhhhhhhwcEEE
vaaaawhhhhhhhhhwcEEE
vvvvvwhhhsssshhwcEEE
cccccwhhhsssshhwcEEE
cccccwhhhhhhhhhwcEEE
cccccddwwwwwwwwwcEEE
ccccrrrrppppppppcEEE
ccccrrrrcccccccccEEE
EEEErrrrEEEEEEEEEEEE
EEEErrrrEEEEEEEEEEEE
EEEErrrrEEEEEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, w muro casa, s vano scala, p portico, a fienile, v muro fienile, c aia cortile, d soglia, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEcccccccccccccccc
EEEEcwwwwwwwwwwwvvvv
EEEEcwhhhhhhhhhwaaaa
EEEEcwhhhhhhhhhwaaaa
EEEEcwhhhhhhhhhwaaaa
EEEEcwhhhhhhhhhwaaaa
EEEEcwhhsssshhhwaaaa
EEEEcwhhsssshhhwvvvv
EEEEcwhhhhhhhhhwcccc
EEEEcwwwwwwwwwddcccc
EEEEcpppppppprrrrccc
EEEEcccccccccrrrrccc
EEEEEEEEEEEEErrrrEEE
EEEEEEEEEEEEErrrrEEE
EEEEEEEEEEEEErrrrEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, w muro casa, s vano scala, p portico, a fienile, v muro fienile, c aia cortile, d soglia, r strada, Q acqua pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEccccccccccccccccccccccEEEE
EEEEccccccccccccccccccccccEEEE
EEEEccQcccccccccccccccccccEEEE
EEEEccccccccccccccccccccccEEEE
EEEEccccccccccccccccccccccEEEE
EEEEcvvvvvccccccccccccccccEEEE
EEEEcvaaaawwwwwwwwwwwcccccEEEE
EEEEcvaaaawhhhhhhhhhwcccccEEEE
EEEEcvaaaawhhhhhhhhhwcccccEEEE
EEEEcvaaaawhhhhhhhhhwcccccEEEE
EEEEcvaaaawhhhhhhhhhwcccccEEEE
EEEEcvvvvvwhhhhsssshwcccccEEEE
EEEEccccccwhhhhsssshwcccccEEEE
EEEEccccccwhhhhhhhhhwcccccEEEE
EEEEccccccdddwwwwwwwwcccccEEEE
EEEEcccccrrrrrpppppppcccccEEEE
EEEEcccccrrrrrccccccccccccEEEE
EEEEcccccrrrrrccccccccccccEEEE
EEEEcccccrrrrrccccccccccccEEEE
EEEEcccccrrrrrccccccccccccEEEE
EEEEcccccrrrrrccccccccccccEEEE
EEEEEEEEErrrrrEEEEEEEEEEEEEEEE
EEEEEEEEErrrrrEEEEEEEEEEEEEEEE
EEEEEEEEErrrrrEEEEEEEEEEEEEEEE
EEEEEEEEErrrrrEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.41 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!-- Fattoria (Farmhouse)
     - Level A: Main body 2 storeys, stair zone (4x2 cells along x), lean-to / barn wing, porch in front, courtyard, well, orchard trees, road to edge.
     - Level B: Heights. House walls rise 64 with window band. House interior floor at z=0, slab at z=32, roof at z=64. Stair strip T at z=1. Barn rises 32 with pitched roof. Porch posts rise 32 with lean-to roof.
     - Level C: Door through house wall (part-door), stair (part-stair), windows, pitched roof, well, trees.
-->
<sequence values="BHEhwspavcdrqtfgn" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwspavcdrqtfgn" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Main body around H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Stair zone inside main body: 4 cells long along x, 2 wide along y, along back wall -->
      <one in="hhhh/hhhh" out="ssss/ssss" symmetry="()" steps="1"/>

      <!-- Main body walls -->
      <all in="[hs]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Front porch: 2 cells deep in front of house -->
      <all in="w/E" out="*/p" symmetry="()" steps="2"/>
      <all in="pE" out="*E" symmetry="(x)" steps="1"/>

      <!-- 3. Lean-to / Barn wing on one side chosen at random -->
      <one in="Ew/Ew/Ew/Ew" out="**/**/a*/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- 4. Yard in front and around -->
      <all in="[pwv]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Yard expands on larger maps -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 5. Entrance road & Doorway -->
      <one in="w/p" out="d/*" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dp]/p" out="*/r" symmetry="()"/>
      <all in="[dr]/c" out="*/r" symmetry="()"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="r[pcE]" out="*r" symmetry="(x)" steps="1"/>

      <!-- 6. Well in courtyard where 5x5 fits -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- 7. Orchard trees in free ground where 7x7 fits -->
      <all in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="2"/>

      <prl in="H" out="h"/>
    </sequence>

    <!-- Full scale map 5x5 -->
    <map scale="5 5 1" values="BEhwspavcdrqtfgnWFUfFRkTLONoKqmJjZ" symmetry="()">
      <!-- House wall -->
      <rule in="w" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <!-- House floor -->
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <!-- Stair zone floor -->
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <!-- Door marker in wall -->
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <!-- Barn wall -->
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <!-- Barn interior -->
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <!-- Porch: posts at corners and edges -->
      <rule in="p" out="ppppp/pBBBp/pBBBp/pBBBp/ppppp"/>
      <!-- Yard cobblestone -->
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <!-- Road paving -->
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <!-- Well -->
      <rule in="Q" out="qqqqq/qBBBq/qBBBq/qBBBq/qqqqq"/>
      <!-- Tree -->
      <rule in="t" out="EEEEE/EEEEE/EEtEE/EEEEE/EEEEE"/>
      <!-- Grass ground -->
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <!-- B. Heights -->

        <!-- House walls W and doorway d rise 64 with window band U -->
        <all in="B W" out="W W" steps="6"/>
        <all in="B W" out="W U" steps="14"/>
        <all in="B W" out="W W" steps="12"/>
        <all in="B W" out="W W" steps="6"/>
        <all in="B W" out="W U" steps="14"/>
        <all in="B W" out="W W" steps="12"/>
        <prl in="W" out="R"/>

        <all in="B d" out="d W" steps="6"/>
        <all in="B d" out="d U" steps="14"/>
        <all in="B d" out="d W" steps="12"/>
        <all in="B d" out="d W" steps="6"/>
        <all in="B d" out="d U" steps="14"/>
        <all in="B d" out="d W" steps="12"/>
        <prl in="d" out="R"/>

        <!-- House interior h and stair s: floor at z=0, slab at z=32, roof at z=64 -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>

        <!-- Stair strip T: 20 voxels long along x (4 cells), 10 voxels wide along y (2 cells), at z=1 -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B s" out="s B" steps="30"/>
        <all in="B h" out="h B" steps="31"/>

        <!-- Slab at z=32 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- Storey 2 air -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- Ceiling/Roof at z=64 -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Barn walls v rise 32, interior a floor at z=0, air up to 32, then roof J -->
        <all in="B v" out="v v" steps="32"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="J"/>

        <!-- Porch posts p rise 30, lintel/roof j at 32 -->
        <all in="B p" out="p p" steps="30"/>
        <all in="B p" out="p j" steps="2"/>
        <prl in="p" out="B"/>

        <!-- Well walls q rise 6, water inside -->
        <all in="B q" out="q q" steps="6"/>
        <prl in="q" out="B"/>

        <!-- Tree trunk and foliage -->
        <all in="B t" out="t m" steps="12"/>
        <all in="B t" out="t Z" steps="16"/>
        <all in="B Z" out="Z Z" steps="1" symmetry="(x)"/>
        <all in="B Z/*Z" out="Z*/**" steps="1" symmetry="(y)"/>
        <prl in="t" out="B"/>

        <!-- C. Full scale: Doors, Stairs, Windows, Roofs -->

        <!-- Define unions for parts -->
        <union symbol="+" values="WWddvv"/>
        <union symbol="=" values="fF"/>

        <!-- Doorway seed O at house entrance: where d meets r/p -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <all in="W/p" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Include parts -->
        <import file="part-door"/>
        <import file="part-stair"/>

        <!-- Barn door: opening in barn wall facing yard -->
        <one in="vvvvv/vvvvv vvvvv/vvvvv" out="*****/***B* *****/***B*" steps="1" symmetry="()"/>
        <all in="B/v" out="*/B" steps="1" symmetry="()"/>
        <all in="B v" out="v B" steps="20"/>

        <!-- Windows in window band U: punched through walls -->
        <all in="BU/BU/BU BU/BU/BU BU/BU/BU" out="*L/*L/*L *L/*L/*L *L/*L/*L" steps="4" symmetry="()"/>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <prl in="L" out="B"/>

        <!-- Pitched roofs: Gable roof on main house (R) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="***** ***** ***B* ***** *****
                **R** **R** RRRRR **R** **R**"
             out="***** ***** ***R* ***** *****
                  ***** ***** ***** ***** *****"
             steps="12" symmetry="()"/>

        <!-- Pitch roof on barn wing (J) -->
        <all in="JB" out="*J" steps="1"/>
        <all in="***** ***** ***B* ***** *****
                **J** **J** JJJJJ **J** **J**"
             out="***** ***** ***J* ***** *****
                  ***** ***** ***** ***** *****"
             steps="8" symmetry="()"/>

        <!-- Chimney on main house roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="8"/>

        <!-- Clean temporary markers -->
        <prl in="d" out="W"/>
        <prl in="j" out="f"/>
      </sequence>
    </map>
  </map>

  <!-- Colours -->
  <color symbol="E" value="#4a6e34" name="erba" hidden="True"/>
  <color symbol="W" value="#b0a287" name="pietra muro" area="house"/>
  <color symbol="f" value="#c8b18a" name="tavole legno" area="house"/>
  <color symbol="F" value="#8f8b7b" name="solaio pietra" area="house"/>
  <color symbol="R" value="#a0422d" name="tegole tetto" area="house"/>
  <color symbol="J" value="#8b5a2b" name="tetto fienile" area="barn"/>
  <color symbol="v" value="#705335" name="legno stalla" area="barn"/>
  <color symbol="a" value="#d2b48c" name="paglia fienile" area="barn"/>
  <color symbol="p" value="#5a3d28" name="pilastro portico" area="porch"/>
  <color symbol="c" value="#787366" name="acciottolato aia" area="yard"/>
  <color symbol="r" value="#9e9480" name="strada selciata" area="yard"/>
  <color symbol="q" value="#59636a" name="bordo pozzo" area="yard"/>
  <color symbol="K" value="#5c261e" name="comignolo cotto" area="house"/>
  <color symbol="m" value="#4a2e18" name="tronco albero" area="orchard"/>
  <color symbol="Z" value="#2d5a27" name="chioma albero" area="orchard"/>

  <!-- Part-door colors -->
  <color symbol="O" value="#2a1a0e" name="porta aperta" area="house"/>
  <color symbol="o" value="#3d2314" name="battente legno" area="house"/>
  <color symbol="N" value="#5a3d28" name="cornice porta" area="house"/>

  <!-- Part-stair colors -->
  <color symbol="k" value="#8b5a2b" name="scalini legno" area="house"/>

  <!-- Actions -->
  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="B"/>
      <rule in="o" out="B"/>
    </all>
  </action>
</sequence>
```
