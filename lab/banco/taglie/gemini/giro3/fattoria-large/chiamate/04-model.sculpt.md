# model.sculpt · gemini-3.8-flash · 24 s

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

The program you wrote:
<sequence values="BHEhiwvdnmGrkstKaQxyOPWNofFRTklCY" symmetry="(xy)" soil="E" origin="bottom">
  <!--
    Fattoria (farmstead):
    - Farmhouse (h: floor, w: walls, s: stair zone, d: door opening)
    - Attached barn wing (a: floor, v: walls)
    - Courtyard / aia (n: paving, G: gate, K: low stone wall, r: road)
    - Ground floor z=0, slab z=32, roof z=64
    - Stair climbs toward large x, door opens South
    - Wing is single-storey (z=32 pitched roof)
    - Main house has 2 accessible storeys
  -->
  <map scale="1/5 1/5 1" values="BHEhiwvdnmGrkstKaQxy" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Farmhouse body around H: 3 north, 3 south, 4 east, 4 west -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Stair zone along the north wall inside farmhouse (4 cells x, 2 cells y) -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- 3. Attached barn wing (a, v) on side wall -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
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

      <!-- 6. Enclosure low wall (K), Gate (G), Road (r) -->
      <all in="nE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>
      <all in="n/K" out="*/G" symmetry="()" steps="1"/>
      <all in="GK" out="*G" symmetry="(x)" steps="1"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- 7. Well (Q), Haystack (y), Garden (x) -->
      <one in="nnn/nnn/nnn" out="***/*Q*/***" steps="1"/>
      <one in="EEEE/EEEE/EEEE" out="****/*xx*/*xx*" steps="1"/>
      <one in="EE/EE" out="yy/yy" steps="1"/>
    </sequence>

    <!-- Map up to full voxel grid: 1 cell becomes 5x5 voxels -->
    <map scale="5 5 1" values="BEOPWNofFRTklCY" symmetry="()">
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="n" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="r" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="G" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="K" out="CCCCC/CCCCC/CCCCC/CCCCC/CCCCC"/>
      <rule in="Q" out="CCCCC/Clllc/Clllc/Clllc/CCCCC"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="x" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <!-- B. Heights: Rising columns -->

        <!-- Low stone fence rises 10 voxels -->
        <all in="B C" out="C C" steps="10"/>

        <!-- Haystack rises 14 voxels -->
        <all in="B y" out="y y" steps="14"/>

        <!-- z=0: Floors on the bottom layer -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B a" out="a f"/>
          <rule in="B s" out="s f"/>
          <rule in="B d" out="d O"/>
        </all>

        <!-- z=1: Strip T for part-stair in the air above stair zone -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="1"/>
        <all in="B a" out="a B" steps="1"/>
        <all in="B d" out="d O" steps="1"/>

        <!-- Ground storey: Walls rise 32 voxels (with window band) -->
        <all steps="5">
          <rule in="B w" out="w W"/>
          <rule in="B v" out="v W"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w U"/>
          <rule in="B v" out="v U"/>
        </all>
        <all steps="11">
          <rule in="B w" out="w W"/>
          <rule in="B v" out="v W"/>
          <rule in="B d" out="d W"/>
        </all>

        <!-- Air inside for ground storey (up to z=31) -->
        <all steps="30">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
          <rule in="B a" out="a B"/>
        </all>

        <!-- z=32: First floor slab (F) for house, ceiling/roof for barn -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
          <rule in="B a" out="a R"/>
          <rule in="B v" out="v R"/>
          <rule in="B d" out="d W"/>
        </all>

        <!-- Second storey: Farmhouse walls rise another 32 voxels -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="11"/>
        <all in="B d" out="d W" steps="31"/>

        <!-- Air inside farmhouse for second storey -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>

        <!-- Roof ceiling cap at z=64 -->
        <prl>
          <rule in="w" out="R"/>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
          <rule in="d" out="R"/>
          <rule in="a" out="B"/>
          <rule in="v" out="B"/>
        </prl>

        <!-- C. Full scale: Doors, Stairs, Windows, Roofs -->

        <!-- Part-door creates the entrance door (O -> 30 tall, lintel, planks) -->
        <union symbol="+" values="W"/>
        <import file="part-door"/>

        <!-- Part-stair creates the stairs up to 2nd floor -->
        <union symbol="=" values="fF"/>
        <import file="part-stair"/>

        <!-- Windows in window band (U): punch through to air (B) -->
        <one steps="16">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <all in="LUUUB" out="*LLL*"/>
        <all in="LUUB" out="*LL*"/>
        <!-- Window band to wall -->
        <prl in="U" out="W"/>

        <!-- Roofs: pitched eaves -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Chimney on roof -->
        <one in="B B R" out="* m *" steps="1" symmetry="()"/>
        <all in="B m" out="m *" steps="8"/>
        <prl in="m" out="W"/>
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

  <!-- Palette: 6+ distinct materials, warm medieval farm aesthetic -->
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
  <color symbol="#20" value="#4a3319" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="#5c4028" name="asse aperta" hidden="True"/>
</sequence>
It does not pass: taglia Grande, seme 1: stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the largest square of covered floor where a body stands (the body counted), under a ceiling at least a storey up
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, k scalini legno, y paglia fieno, O vano porta, W pietra muro, N telaio porta, o battente legno, f tavole pavimento, F solaio legno, R tegole tetto, C muretto pietra, Y ghiaia aia, L vetro finestra
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEyyyyyEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEyyyyyEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEyyyyyEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEyyyyyEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEyyyyyEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
YYYYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
YYYYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
YYYYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
YYYYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
YYYYYYYYYYYYRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEE
YYYYYYYYYYYYYEECCCYYYYYYYYYYYYYYYYYCCCEEEEEEEEEEEE
YYYYYYYYYYYYYEECCCYYYYYYYYYYYYYYYYYCCCEEEEEEEEEEEE
YYYYYYYYYYYYYEEYYYYYYYYYYYYYYYYYYYYYYYEEEEEEEEEEEE
YYYYYYYYYYYYYEEYYYYYYYYYYYYYYYYYYYYYYYEEEEEEEEEEEE
YYYYYYYYYYYYYEEYYYYYYYYYYYYYYYYYYYYYYYEEEEEEEEEEEE
YYYYYYYYYYYYYEEYYYYYYYYYYYYYYYYYYYYYYYEEEEEEEEEEEE
YYYYYYYYYYYYYEEYYYYYYYYYYYYYYYYYYYYYYYEEEEEEEEEEEE
YYYYYYYYYYYYYEEYYYYYYYYYYYYYYYYYYYYYYYEEEEEEEEEEEE
YYYYYYYYYYYYYEEYYYYYYYYYYYYYYYYYYYYYYYEEEEEEEEEEEE
YYYYYYYYYYYYYEEYYYYYYYYYYYYYYYYYYYYYYYEEEEEEEEEEEE
YYYYYYYYYYYYYEEYYYYYYYYYYYYYYYYYYYYYYYEEEEEEEEEEEE
YYYYYYYYYYYYYEEYYYYYYYYYYYYYYYYYYYYYYYEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000006666660000000
00000000000000000000000000000000000006666660000000
00000000000000000000000000000000000006666660000000
00000000000000000000000000000000000006666660000000
00000000000000000000000000000000000006666660000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
ddddddddddddrrrrrrrrrrrrrrrrrrrrrrrrrrrr0000000000
deeeeeeeeeeersssssssssssssssssssssssssssr000000000
deeeeeeeeeeersssssssssssssssssssssssssssr000000000
deeeeeeeeeeersssssssssssssssssssssssssssr000000000
deefffffffffrssttttttttttttttttttttttsssr000000000
deefffffffffrssttttttttttttttttttttttsssr000000000
deeffgggggffrssttuuuuuuuuuuuuuuuuuuttsssr000000000
deeffgggggffrssttuuuuuuuuuuuuuuuuuuttsssr000000000
deeffgggggffrssttuuvzvvvvvvvvvvvvuuttsssr000000000
deeffgggggffrssttuuvvvvvvvvvvvvvvuuttsssr000000000
deeffgggggffrssttuuvvwwwwwwwwwwvvuuttsssr000000000
deeffgggggffrssttuuvvwwwwwwwwwwvvuuttsssr000000000
deeffgggggffrssttuuvvwwwwwwwwwwvvuuttsssr000000000
deeffgggggffrssttuuvvwwwwwwwwwwvvuuttsssr000000000
deefffffffffrssttuuvvwwwwwwwwwwvvuuttsssr000000000
deefffffffffrssttuuvvvvvvvvvvvvvvuuttsssr000000000
deeeeeeeeeeerssttuuvvvvvvvvvvvvvvuuttsssr000000000
deeeeeeeeeeerssttuuuuuuuuuuuuuuuuuuttsssr000000000
ddddddddddddrssttuuuuuuuuuuuuuuuuuuttsssr000000000
000000000000rssttttttttttttttttttttttsssr000000000
000000000000rssttttttttttttttttttttttsssr000000000
000000000000rsssssssssssssssssssssssssssr000000000
000000000000rsssssssssrkkkkkkrssssssssssr000000000
000000000000rrrrrrrrrrrkkkkkkrrrrrrrrrrrr000000000
00000000000000044400000000000000000444000000000000
00000000000000044400000000000000000444000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
....................W.............................
....................W.............................
....................W..RRRRRRR....................
....................WRRRRRRRRRRR..................
...................RRRRRRRRRRRRRRR................
.................RRRRRRRRRRRRRRRRRRR..............
...............RRRRRRRRRRRRRRRRRRRRRRR............
.............RRRRRRRRRRRRRRRRRRRRRRRRRR...........
............RWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWLLWWWWWWRRRRRWWWWWWWWWWW..........
............WWWWLLLWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
......RR....WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
....RRRRRR..WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..RRRRRRRRRRWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
RRRRRRRRRRRRWWWWWWWWWWNooooooNWWWWWWWWWW..........
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWW..........
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWW..........
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWW..........
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWW..........
WWWWWWWWWWWWWWWWWWWWWWNoooooooNWWWWWWWWW..........
WWWWWWWWWWWWWWWWWWWWWWOoooooooWWWWWWWWWW..........
WWWWWWWWWWWWWWWWWWWWWWWoooooooWWWWWWWWWW..........
WWWWWWWWWWWWWWWWWWWWWWWoooooooWWWWWWWWWWyy........
WWWWWWLLLWWWWWWWWWWWWWWoooooooWWWWWWWWWWyyy.......
WWWWWWLLLWWWWWWCCWWWWWWoooooooWWWWWCCWWWyyy.......
WWWWWWWWWWWWWWWCCCWWWWWoooooooWWWWWCCCWWyyy.......
WWWWWWWWWWWWWWWCCCWWWWWoooooooWWWWWCCCWWyyy.......
WWWWWWWWWWWWWWWCCCWWWWOoooooooWWWWWCCCWWyyy.......
WWWWWWWWWWWWWWWCCCWWWWNoooooooNWWWWCCCWWyyy.......
YYYYYYYYYYYYWEEYYYYYYYYYYYYYYYYYYYYYYYEEEEEEEEEEEE
```
Right side (looking from the right):
```
......................W...........................
......................W...........................
......................W..RR.......................
......................WRRRRRR.....................
.....................RRRRRRRRRR...................
...................RRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
................RRRRRRRRRRRRRRRRRRRRR.............
...............WWWWWWWWWWWWWWWWWWWWWWR............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WLLWWWWWWWWWWWWWWWWWWWW............
...............WLLLWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWLLLWWWWWWW............
yyyyy..........WWWWWWWWWWWWWLLLWWWWWWW............
yyyyy..........WWWWWWWWWWWWWWWWWWWWWWW............
yyyyy..........WWWWWWWWWWWWWWWWWWWWWWWCC..........
yyyyy..........WWWWWWWWWWWWWWWWWWWWWWWCC..........
yyyyy..........WWWWWWWWWWWWWWWWWWWWWWWCC..........
yyyyy..........WWWWWWWWWWWWWWWWWWWWWWWCC..........
yyyyy..........WWWWWWWWWWWWWWWWWWWWWWWCC..........
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
.....................................yyyyyy.......
.....................................yyyyyy.......
.....................................yyyyyy.......
.....................................yyyyyy.......
.....................................yyyyyy.......
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
LLLWWWWWWWWWWWWWWWWWWWWWWWWLLLWWWWWWWWWW..........
WWWWWWWWWWWWWWWWWWWWWWWWWWWWLLWWWWWWWWWW..........
WWWWWWWWWWWWWWWWWWWWWWWWWWWWLLWWWWWWWWWW..........
WWW.........WWW.......kkkkkk.........WWW..........
WWW.........WWW.......kkkkkk.........WWW..........
WWW.........WWW.......kkkkkk.........WWW..........
WWW.........WWW.......kkkkkk.........WWW..........
WWW.........WWW........kkkkk.........WWW..........
WWW.........LWW......................WWW..........
WWW.........LWW......................WWW..........
WWW.........LWW......................WWW..........
WWW.........WWW......................WWW..........
WWW.........WWW......................WWW..........
WWW.........WWW......................WWW..........
WWW.........WWW......................WWW..........
WWWWWWLLLWWWWWW......................WWW..........
WWWWWWLLLWWWWWW......................WWW..........
WWWWWWLLLWWWWWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWWWWWWWWWWoooooooWWWWWWWWWW..........
............WWWWWWWWWWWoooooooWWWWWWWWWW..........
.............WWWWWWWWWWoooooooWWWWWWWWWW..........
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
............WWWWWWWWWWWLLLWWWWWWWWWWWWWW..........
............WWWWWWWWWWWLLLWWWWWWWWWWWWWW..........
............WWWWWWWWWWWLLLWWWWWWWWWWWWWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWWWLLLWWWWWWWWWWWWWWWWWWWWW..........
............WWWWLLLWWWWWWWWWWWWWWWWWWWWW..........
.............WWWLLLWWWWWWWWWWWWWWWWWWWWW..........
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
```
Cut at z=75 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
```
### Seed 2: plan and heights side by side
```
EEEEEyyyyyEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000666660000000000000000000000000000000000000000
EEEEEyyyyyEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000666660000000000000000000000000000000000000000
EEEEEyyyyyEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000666660000000000000000000000000000000000000000
EEEEEyyyyyEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000666660000000000000000000000000000000000000000
EEEEEyyyyyEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000666660000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000000000000rrrrrrrrrrrrrrrrrrrrrrrrrrrr0000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000rsssssssssssssssssssssssssssr000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000rsssssssssssssssssssssssssssr000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rsssssssssssssssssssssssssssrddddddddd
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttttttttttttttttttttttsssreeeeeeeed
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttttttttttttttttttttttsssreeeeeeeee
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuuuuuuuuuuuuuuuuuttsssrffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuuuuuuuuuuuuuuuuuttsssrffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvvvvvvvvvvvvvuuttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvvvvvvvvvvvvvuuttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvwwwwwwwwwwvvuuttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvwwwwwwwwwwvvuuttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvwwwwwwwwwwvvuuttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvwwwwwwwwwwvvuuttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvwwwwwwwwwwvvuuttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvvvvvvvvvvvvvuuttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvvvvvvvvvvvvvuuttsssrffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuuuuuuuuuuuuuuuuuttsssrffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuuuuuuuuuuuuuuuuuttsssreeeeeeeee
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttttttttttttttttttttttsssreeeeeeeed
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttttttttttttttttttttttsssreeeeeeeed
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rsssssssssssssssswssssssssssrddddddddd
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYY   000000000000rsssssssssrkkkkkkrssssssssssr000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRYYYYYYYYYY   000000000000rrrrrrrrrrrkkkkkkrrrrrrrrrrrr000000000
EEEEEEEEEEEEEEECCCYYYYYYYYYYYYYYYYYCCCEEYYYYYYYYYY   00000000000000044400000000000000000444000000000000
EEEEEEEEEEEEEEECCCYYYYYYYYYYYYYYYYYCCCEEYYYYYYYYYY   00000000000000044400000000000000000444000000000000
EEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYEEYYYYYYYYYY   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYEEYYYYYYYYYY   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYEEYYYYYYYYYY   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYEEYYYYYYYYYY   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYEEYYYYYYYYYY   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYEEYYYYYYYYYY   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYEEYYYYYYYYYY   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYEEYYYYYYYYYY   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYEEYYYYYYYYYY   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYEEYYYYYYYYYY   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   000000000000rrrrrrrrrrrrrrrrrrrrrrrrrrrr0000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000rsssssssssssssssssssssssssssr000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000rsssssssssssssssssssssssssssr000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000rsssssssssssssssssssssssssssr000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000rssttttttttttttttttttttttsssr000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000rssttttttttttttttttttttttsssr000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000rssttuuuuuuuuuuuuuuuuuuttsssr000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000rssttuuuuuuuuuuuuuuuuuuttsssr000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvvvvvvvvvvvvvuuttsssrddddddddd
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvvvvvvvvvvvvvuuttsssreeeeeeeed
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvzwwwwwwwwwwvvuuttsssreeeeeeeee
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvwwwwwwwwwwvvuuttsssrffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvwwwwwwwwwwvvuuttsssrffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvwwwwwwwwwwvvuuttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvwwwwwwwwwwvvuuttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvvvvvvvvvvvvvuuttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuvvvvvvvvvvvvvvuuttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuuuuuuuuuuuuuuuuuttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttuuuuuuuuuuuuuuuuuuttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttttttttttttttttttttttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rssttttttttttttttttttttttsssrffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rsssssssssssssssssssssssssssrffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rsssssssssrkkkkkkrssssssssssrffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000rrrrrrrrrrrkkkkkkrrrrrrrrrrrreeeeeeeee
EEEEEEEEEEEEEEECCCYYYYYYYYYYYYYYYYYCCCCCRRRRRRRRRR   000000000000000444000000000000000004444deeeeeeeeed
EEEEEEEEEEEEEEECCCYYYYYYYYYYYYYYYYYCCCCCRRRRRRRRRR   000000000000000444000000000000000004444deeeeeeeeed
EEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYYYRRRRRRRRRR   0000000000000000000000000000000000000000dddddddddd
EEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY   00000000000000044444444444444444400000000000000000
EEEEEEEEEEEEEEECCCCCCCCCCCCCCCCCCYYYYYYYYYYYYYYYYY   00000000000000044444444444444444400000000000000000
EEEEEEEEEEEEEEECCCCCCCCCCCCCCCCCCYYYYYYYYYYYYYYYYY   00000000000000044444444444444444400000000000000000
EEEEEEEEEEEEEyyyyyEEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYY   00000000000066666600000000000000000000000000000000
EEEEEEEEEEEEEyyyyyEEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYY   00000000000066666600000000000000000000000000000000
EEEEEEEEEEEEEyyyyyEEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYY   00000000000066666600000000000000000000000000000000
EEEEEEEEEEEEEyyyyyEEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYY   00000000000066666600000000000000000000000000000000
EEEEEEEEEEEEEyyyyyEEEEEEEEEEEEEEEYYYYYYYYYYYYYYYYY   00000000000066666600000000000000000000000000000000
```
How much the plans of the seeds differ: 0.40 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 102 nodi, 396 passi, finito in 336 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro (marcatore), E=erba (marcatore), h=honey, w=white, v=olive, d=dead, dark, n=brown, m=magenta, G=Green, r=red, k=scalini legno, s=slate, K=pinK, a=alive, gray, x=x, y=paglia fieno, O=vano porta, W=pietra muro, N=telaio porta, o=battente legno, f=tavole pavimento, F=solaio legno, R=tegole tetto, T=Teal (marcatore), C=muretto pietra, U=blUe, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), L=vetro finestra.
Alla fine: W 60965, R 10719, E 4550, k 2720, o 2201, f 2075, Y 1950, y 1500, L 1424, F 1415, C 550, N 245, O 124.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-31 all×21, one×4, prl×1: 253 celle x0-16 y0-19 z0, passi 2-44
   #33 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 45
#35-42 all×8: 22500 celle x0-84 y0-79 z0-14, passi 46-79
    #43 all . w → w U (+1) passi=14: ×14, 33600 celle x0-79 y30-74 z5-19, passi 80-93, w→U 11550, .→w 11550, v→U 5250, .→v 5250
      r1 . w → w U ×11550; r2 . v → v U ×5250
    #44 all . w → w W (+2) passi=11: ×11, 28050 celle x0-79 y30-74 z2-30, passi 94-104, w→W 9075, .→w 9075, v→W 4125, .→v 4125, +2
      r1 . w → w W ×9075; r2 . v → v W ×4125; r3 . d → d W ×825
    #45 all . h → h . (+2) passi=30: ×30, 124500 celle x5-74 y35-69 z2-32, passi 105-134, h→. 41250, .→h 41250, a→. 15000, .→a 15000, +2
      r1 . h → h . ×41250; r2 . s → s . ×6000; r3 . a → a . ×15000
#46-47 all×2: 14950 celle x0-79 y30-74 z13-36, passi 135-141
    #48 all . w → w U passi=14: ×14, 23100 celle x25-79 y30-74 z36-50, passi 142-155, w→U 11550, .→w 11550
    #49 all . w → w W passi=11: ×11, 18150 celle x25-79 y30-74 z50-61, passi 156-166, w→W 9075, .→w 9075
    #50 all . d → d W passi=31: ×31, 4650 celle x45-59 y70-74 z14-45, passi 167-197, d→W 2325, .→d 2325
    #51 all . h → h . (+1) passi=31: ×31, 97650 celle x30-74 y35-69 z33-64, passi 198-228, h→. 42625, .→h 42625, s→. 6200, .→s 6200
      r1 . h → h . ×42625; r2 . s → s . ×6200
#52-85 prl×2, all×9: 13311 celle x0-79 y30-74 z0-64, passi 229-309
#86-94 prl×3, all×5, one×1: 9414 celle x0-79 y30-74 z1-48, passi 310-376
    #97 prl U → W: ×1, 26926 celle x0-79 y30-74 z5-49, passi 377, U→W 26926
#98-102 all×3, one×1, prl×1: 7387 celle x0-80 y29-75 z30-78, passi 378-396
Senza effetto (non hanno mai cambiato una cella):
#29 one nnn/nnn/nnn → ***/*Q*/*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#54 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#55 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#56 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#57 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
#58 prl #93 → . passi=1: in quel momento nella griglia non c'erano celle ""
#64 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#65 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#66 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#67 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
#68 all . #96 → I * passi=1: in quel momento nella griglia non c'erano celle ""
#69 all . I → I * passi=30: in quel momento nella griglia non c'erano celle "I"
… e altri 12
Fix it and answer with the whole program.

## Risposta

```xml
<sequence values="BHEhiwvdnmGrkstKaQxyOPWNofFRTklCY" symmetry="(xy)" soil="E" origin="bottom">
  <!--
    Fattoria:
    House body around H (depth 7 cells = 35 voxels, width 11 cells = 55 voxels).
    Clear interior square of house easily exceeds 28 voxels (leaving at least 7x7 cells = 35x35 voxels clear).
    Stair zone along back wall (4 cells x, 2 cells y = 20x10 voxels).
    Barn wing attached to side wall.
    Courtyard (aia) with gravel paving (Y), low wall (C), gate, road (Y).
  -->
  <map scale="1/5 1/5 1" values="BHEhiwvdnmGrkstKaQxy" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Farmhouse body: 3 behind, 3 front (7 cells deep), 5 left, 5 right (11 cells wide) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="5"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Stair zone: along the north (back) wall, leaving free landing before and after -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- 3. Barn wing attached to side wall -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- 4. Front door: through south wall of farmhouse (3 cells wide) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- 5. Courtyard paving (n) in front of house and barn -->
      <all in="[dv]/E" out="*/n" symmetry="()" steps="3"/>
      <all in="nE" out="*n" symmetry="(x)" steps="2"/>

      <!-- 6. Enclosure wall (K), Gate (G), Road (r) -->
      <all in="nE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>
      <all in="n/K" out="*/G" symmetry="()" steps="1"/>
      <all in="GK" out="*G" symmetry="(x)" steps="1"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- 7. Rural details: haystacks, garden patch -->
      <one in="EE/EE" out="yy/yy" steps="1"/>
      <one in="EEE/EEE" out="***/*x*" steps="1"/>
    </sequence>

    <!-- Map up to full voxel grid: 1 cell becomes 5x5 voxels -->
    <map scale="5 5 1" values="BEOPWNofFRTklCY" symmetry="()">
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="n" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="r" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="G" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="K" out="CCCCC/CCCCC/CCCCC/CCCCC/CCCCC"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="x" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <!-- B. Heights -->
        <all in="B C" out="C C" steps="10"/>
        <all in="B y" out="y y" steps="14"/>

        <!-- z=0: Floors -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B a" out="a f"/>
          <rule in="B s" out="s f"/>
          <rule in="B d" out="d O"/>
        </all>

        <!-- z=1: Strip T for stair in the air above stair zone -->
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="1"/>
        <all in="B a" out="a B" steps="1"/>
        <all in="B d" out="d O" steps="1"/>

        <!-- Ground storey: Walls rise 32 voxels (with window band) -->
        <all steps="5">
          <rule in="B w" out="w W"/>
          <rule in="B v" out="v W"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w U"/>
          <rule in="B v" out="v U"/>
        </all>
        <all steps="11">
          <rule in="B w" out="w W"/>
          <rule in="B v" out="v W"/>
          <rule in="B d" out="d W"/>
        </all>

        <!-- Ground floor clear air inside -->
        <all steps="30">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
          <rule in="B a" out="a B"/>
        </all>

        <!-- z=32: First floor slab for house, roof slab for barn -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
          <rule in="B a" out="a R"/>
          <rule in="B v" out="v R"/>
          <rule in="B d" out="d W"/>
        </all>

        <!-- Second storey: House walls rise 32 voxels -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="11"/>
        <all in="B d" out="d W" steps="31"/>

        <!-- Upper floor clear air inside -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>

        <!-- Roof ceiling cap at z=64 -->
        <prl>
          <rule in="w" out="R"/>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
          <rule in="d" out="R"/>
          <rule in="a" out="B"/>
          <rule in="v" out="B"/>
        </prl>

        <!-- C. Doors, stairs, windows, roofs -->
        <union symbol="+" values="W"/>
        <import file="part-door"/>

        <union symbol="=" values="fF"/>
        <import file="part-stair"/>

        <!-- Windows -->
        <one steps="16">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <all in="LUUUB" out="*LLL*"/>
        <all in="LUUB" out="*LL*"/>
        <prl in="U" out="W"/>

        <!-- Pitched roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Chimney -->
        <one in="B B R" out="* m *" steps="1" symmetry="()"/>
        <all in="B m" out="m *" steps="8"/>
        <prl in="m" out="W"/>
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

  <!-- Materials palette -->
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
  <color symbol="#20" value="#4a3319" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="#5c4028" name="asse aperta" hidden="True"/>
</sequence>
```
