# model.sculpt · gemini-3.8-flash · 20 s

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
It does not pass: taglia Grande, seme 1: porta: 15 × 6 voxel (0,75 × 0,30 caselle), una porta è almeno 11 × 30 a ogni taglia; stanza: la più grande in cui si sta in piedi ha il lato di 22 voxel (1,10 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the leaf the action open takes away: its width and its height
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, c acciottolato aia, r strada selciata, f tavole legno, W pietra muro, F solaio pietra, R tegole tetto, k scalini legno, O porta aperta, o battente legno, K comignolo cotto, J tetto fienile
Plan (the letter on top of every column):
```
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
cccccccccccccccccccccccccccccccccccccccccccEEEEEEE
cccccccccccccccccccccccccccccccccccccccccccEEEEEEE
JJJJJJJJJJJJJccccccccccccccccccccccccccccccEEEEEEE
JJJJJJJJJJJJJccccccccccccccccccccccccccccccEEEEEEE
JJJJJJJJJJJJJccccccccccccccccccccccccccccccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccEEEEEEE
ccccccccccrrrrrrrrrrrrr.ff.f.ff.f.ff.f.fcccEEEEEEE
ccccccccccrrrrrrrrrrrrrfffffffffffffffffcccEEEEEEE
ccccccccccrrrrrrrrrrrrrccccccccccccccccccccEEEEEEE
ccccccccccrrrrrrrrrrrrrccccccccccccccccccccEEEEEEE
ccccccccccrrrrrrrrrrrrrcccccccccccccccccccEEEEEEEE
EEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEErrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
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
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
eggjklnoppplg0000000000000000000000000000000000000
eggjklnoppplg0000000000000000000000000000000000000
eggjklnoppplssvwxyyyyyyyyyyyyyyyyyyyyyyv0000000000
eggjklnoppnjsuvxyyyyyyyyyyyyyyyyyyyyyyyxs000000000
eggeeeeeeeeesuvxyyyyyyyyyyyyyyyyyyyyyyyxs000000000
eggeeeeeeeeesuvxyyyyyyyyyyyyyyyyyyyyyyyxs000000000
eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
eggjklnoppnjsuvvssssssssssssssssssssssuvs000000000
eggjklnoppnjsuvvssssssssssssssssssssssuvs000000000
eggjklnoppnjsuvvssssssssssssssssssssssuvs000000000
eggjklnopplgsuvvssssssssssssssssssssssuvs000000000
000000000000suvvssssssssssssssssssssssuvs000000000
000000000000suvvssssssssssssssssssssssuvs000000000
000000000000suvvssssssssssssssssssssssuvs000000000
000000000000suvvsssssuvxyyyyyyyyyyyyyyyxs000000000
000000000000sssssssssuvxyyyyyyyyyyyyyyyxs000000000
000000000000sssssssssuvxyyyyyyyyyyyyyyyxs000000000
000000000000sssssssssuvxyyyyyyyyyyyyyyyxs000000000
0000000000000000000000e.ee.e.ee.e.ee.e.e0000000000
0000000000000000000000eeeeeeeeeeeeeeeeee0000000000
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
................RRRRRRRRRRRRRRRRRRRRRRR...........
................RRRRRRRRRRRRRRRRRRRRRRR...........
...............RRRRRRRRRRRRRRRRRRRRRRRRR..........
...............RRRRRRRRRRRRRRRRRRRRRRRRR..........
..............RRRRRRRRRRRRRRRRRRRRRRRRRR..........
.............RRRRRRRRRRRRRRRRRRRRRRRRRRR..........
............RRRRRRRRRRRRRRRRRRRRRRRRRRRR..........
............RWWWWWWWRRRRRRRRRRRRRRRRRRRRR.........
............RWWWWWWWRRRRRRRRRRRRRRRRRRRRR.........
............RWWWWWWWRRRRRRRRRRRRRRRRRRRRR.........
........JJ..RWWWWWWWRRRRRRRRRRRRRRRRRRRRR.........
.......JJJJ.RWWWWWWWRRRRRRRRRRRRRRRRRRRRR.........
.......JJJJ.RWWWWWWWRRRRRRRRRRRRRRRRRRRRR.........
......JJJJJ.WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
......JJJJJ.WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.....JJJJJJJWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
....JJJJJJJJWWWWWWWWWWWRWWWWWWWWWWWWWWWW..........
....JJJJJJJJWWWWWWWWWWRWWWWWWWWWWWWWWWWW..........
...JJJJJJJJJWWWWWWWWWWRRRRRRRRRRRRRRRRRW..........
...JJJJJJJJJWWWWWWWWWWRWWWWWWWWWWWWWWWWW..........
..JJJJJJJJJJRWWWWWWWRRRRRRRRRRRRRRRRRRRRR.........
.JJJJJJJJJJJRWWWWWWWRRRRRRRRRRRRRRRRRRRRR.........
JJJJJJJJJJJJRWWWWWWWRRRRRRRRRRRRRRRRRRRRR.........
JJJJJJJJJJJJRWWWWWWWRRRfffffffffffffffffR.........
JJJJJJJJJJJJRWWWWWWWRRRRRRRRRRRRRRRRRRRRR.........
JJJJJJJJJJJJRWWWWWWWRRRRRRRRRRRRRRRRRRRRR.........
JJJJJJJJJJJJRWWWWWWWRRRRRRRRRRRRRRRRRRRRR.........
JJJJJJJJJJJJRWWWWWWWRRRRRRRRRRRRRRRRRRRRR.........
JJJJJJJJJJJJRWWWWWWWRRRRRRRRRRRRRRRRRRRRR.........
JJJJJJJJJJJJJWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
JJJJJJJJJJJJJWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
JJJJJJJJJJJJJWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
JJJJJJJJJJJJJWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
JJJJJJJJJJJJJWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
JJJJJJJJJJJJJWWWWWWWWWRRRRRRRRRRRRRRRRRW..........
JJJJJJJJJJJJJWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
JJJJJJJJJJJJRoooooooRRRRRRRRRRRRRRRRRRRRR.........
JJJJJJJJJJJJRoooooooRRRRRRRRRRRRRRRRRRRRR.........
EEEEEEEEEErrrrrrrrrrrrREEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
..............RRRR................RRRR............
..............RRRR................RRRR............
..............RRRR................RRRR............
..............RRRR................RRRR............
..............RRRRRRRRRRRRRRRRRRRRRRRR............
..............RRRRRRRRRRRRRRRRRRRRRRRR............
..............RRRRRRRRRRRRRRRRRRRRRRRR............
..............RRRRRRRRRRRRRRRRRRRRRRRR............
..............RRRRRRRRRRRRRRRRRRRRRRRR............
..............RRRRRRRRRRRRRRRRRRRRRRRR............
............JJRRRRRRRRRRRRRRRRRRRRRRRR............
............JJJRRRRRRRRRRRRRRRRRRRRRRR............
............JJJRRRRRRRRRRRRRRRRRRRRRRR............
............JJJWWWWWWWWWWWWWWWJ.WWWWWW............
............JJJWWW.WW.W.WW.WJJJ.W.WWWW............
............JJJWWWWW.WWW.WWWJJJ.WWWWWW............
............JJJWWWWW...W.WWJJWWW.WWWWW............
............JJJWWWWRWRWRRRRWWRWRWWWWWW............
............JJJWWWRRWRRRRWRRWRWRWRWWWW............
............JJJWWWRRRRRRRRWWWRWRWWWWWW............
............JJJRRRRRRRRRRRRRRRRRRRRRRR............
............JJJRRRRRRRRRRRRRRRRRRRRRRR............
............JJJRRRRRRRRRRRRRRRRRRRRRRR............
............JJJRRRRRRRRRRRRRRRRRRRRRRRff..........
............JJJRRRRRRRRRRRRRRRRRRRRRRR............
............JJJRRRRRRRRRRRRRRRRRRRRRRR............
............JJJRRRRRRRRRRRRRRRRRRRRRRR............
............JJJRRRRRRRRRRRRRRRRRRRRRRR............
............JJJRRRRRRRRRRRRRRRRRRRRRRR............
............JJJWWWWJWJWJJWWJkWWkWWWWWW............
............JJJWWWWWJJWWJWWkkkkkk..WWW............
............JJJWWWJWJJWJWJJWkkkkkWWWWW............
............JJJWWWWWWJWJWJJkkkkWkWWWWW............
............JJJWWWWJWJWJJJWJkWkkkW.WWW............
............JJJWWWWRWRWRRRWRWRRRWRWWWW............
............JJJWWWWWWWWWWWWWWkkkWWWWWW............
............JJJRRRRRRRRRRRRRRRRRRRRRRR............
............JJJRRRRRRRRRRRRRRRRRRRRRRR............
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
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
JJJJJJJJJJJJJ.....................................
JJJJJJJJJJJJJ.....................................
JJJJJJJJJJJJJ.....................................
JJJJJJJJJJJJWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
JJJ..........WWWWWWWWWWWWWWWWWWWWWWWWWWW..........
JJJ..........WWWWWWWWWWWWWWWWWWWWWWWWWWW..........
JJJ..........WW......................WWW..........
JJJ...............................................
JJJ..........WW...................................
JJJ...............................................
JJJ.........WWW.......................WW..........
JJJ...............................................
JJJ...............................................
JJJ...................................WW..........
JJJ...................................WW..........
JJJJJJJJJJJJJWW.............kkkkk.................
JJJJJJJJJJJJJWW............kkkkkk.................
JJJJJJJJJJJJJWW............kkkkkk.....WW..........
JJJJJJJJJJJJ...............kkkkkk.................
...........................kkkkkk.....WW..........
............................kkkkk.................
............WWW...................................
.............WW...................................
.............WWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.............WWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.............WWWWWWWWWWWWWWWWWWWWWWWWWWW..........
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
....JJJJJJJ.......................................
....JJJJJJJJ......................................
....JJJJJJJ.....RRRRRRRRRRRRRRRRRRRRRRR...........
.....JJJJJ...WWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.............WWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
......................................WW..........
.............WW...................................
.............WW.......................WW..........
..................................................
.............WW......................WWW..........
..................................................
.............WW...................................
..................................................
..................................................
....JJJJJJJ..WW.......................WW..........
....JJJJJJJ.WWW.......................WW..........
....JJJJJJJ.......................................
.....JJJJJ...WW.......................WW..........
.............WW...................................
..................................................
............WWW...................................
............WWW...................................
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.............WWWWWWWWWWWWWWWWWWWWWWWWWWW..........
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
.................RRRRRRRRRRRRRRRRRRRRR............
................RRRRRRRRRRRRRRRRRRRRRRR...........
................RRRRRRRRRRRRRRRRRRRRRRR...........
................RRRRRRRRRRRRRRRRRRRRRRR...........
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
.........................RRRRRRRRRRRRRR...........
........................RRRRRRRRRRRRRRR...........
........................RRRRRRRRRRRRRRR...........
........................RRRRRRRRRRRRRRR...........
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
cccccccccccccccccccccccccccccccccccccccccccEEEEEEE   00000000000000000000000000000000000000000000000000
cccccccccccccccccccccccccccccccccccccccccccEEEEEEE   00000000000000000000000000000000000000000000000000
JJJJJJJJJJJJJccccccccccccccccccccccccccccccEEEEEEE   eggjklnoppplg0000000000000000000000000000000000000
JJJJJJJJJJJJJccccccccccccccccccccccccccccccEEEEEEE   eggjklnoppplg0000000000000000000000000000000000000
JJJJJJJJJJJJJccccccccccccccccccccccccccccccEEEEEEE   eggjklnoppplssvwxyyyyyyyyyyyyyyyyyyyyyyv0000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggjklnoppnjsuvxyyyyyyyyyyyyyyyyyyyyyyyxs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggeeeeeeeeesuvxyyyyyyyyyyyyyyyyyyyyyyyxs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggeeeeeeeeesuvxyyyyyyyyyyyyyyyyyyyyyyyxs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggeeeeeeeeesuvvssssssssssswssssssssssuvs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggeeeeeeeeesuvvssssssssssssssssssssssuvs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggjklnoppnjsuvvssssssssssssssssssssssuvs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggjklnoppnjsuvvssssssssssssssssssssssuvs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggjklnoppnjsuvvssssssssssssssssssssssuvs000000000
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   eggjklnopplgsuvvssssssssssssssssssssssuvs000000000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   000000000000suvvssssssssssssssssssssssuvs000000000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   000000000000suvvssssssssssssssssssssssuvs000000000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   000000000000suvvssssssssssssssssssssssuvs000000000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   000000000000suvvsssvwxyyyyyyyyyyyyyyyyyxs000000000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   000000000000sssssssvwxyyyyyyyyyyyyyyyyyxs000000000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccEEEEEEE   000000000000sssssssvwxyyyyyyyyyyyyyyyyyxs000000000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccEEEEEEE   000000000000sssssssvwxyyyyyyyyyyyyyyyyyxs000000000
ccccccccccrrrrrrrrrrf.f.ff.f.ff.f.ff.f.fcccEEEEEEE   00000000000000000000e.e.ee.e.ee.e.ee.e.e0000000000
ccccccccccrrrrrrrrrrffffffffffffffffffffcccEEEEEEE   00000000000000000000eeeeeeeeeeeeeeeeeeee0000000000
ccccccccccrrrrrrrrrrcccccccccccccccccccccccEEEEEEE   00000000000000000000000000000000000000000000000000
ccccccccccrrrrrrrrrrcccccccccccccccccccccccEEEEEEE   00000000000000000000000000000000000000000000000000
ccccccccccrrrrrrrrrrccccccccccccccccccccccEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEErrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEErrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEErrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEErrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEErrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEErrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEErrrrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
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
EEEEEEEEEEcccccccccccccccccccccccccccccccccccccccc   00000000000000000000000000000000000000000000000000
EEEEEEEEEEcccccccccccccccccccccccccccccccccccccccc   000000000000ssvwxyyyyyyyyyyyyyyyyyyyyyyveggjklnnlg
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvxyyyyyyyyyyyyyyyyyyyyyyyxsggjklnnlg
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvxyyyyyyyyyyyyyyyyyyyyyyyxsggjklnnlg
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvxyyyyyyyyyyyyyyyyyyyyyyyxsggjklnnlg
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvseeeeeeeee
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvseeeeeeeee
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvseeeeeeeee
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvseeeeeeeee
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvseeeeeeeee
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvseeeeeeeee
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvseeeeeeeee
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvseeeeeeeee
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvseeeeeeeee
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvseeeeeeeee
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvseeeeeeeee
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvsegijlmnlg
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvsggjklnnlg
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvsggjklnnlg
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000000000000suvvssssssssssssssssssssssuvsggjklnnlg
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000suvvssssssssssssssssssssssuvs000000000
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000suvxyyyyyyyyyyyyyyyyyyxsssuvs000000000
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000suvxyyyyyyyyyyyyyyyyyyxssssss000000000
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000000000000suvxyyyyyyyyyyyyyyyyyyxssssss000000000
EEEEEEEEEEccRRRRRRRRRRRRRRRRRRRRRRRRRRRRrccccccccc   000000000000suvxyyyyyyyyyyyyyyyyyyxssssss000000000
EEEEEEEEEEccc.ff.f.ff.f.ff.f.ff.frrrrrrrrrrccccccc   000000000000e.ee.e.ee.e.ee.e.ee.e00000000000000000
EEEEEEEEEEcccffffffffffffffffffffrrrrrrrrrrccccccc   000000000000eeeeeeeeeeeeeeeeeeeee00000000000000000
EEEEEEEEEEcccccccccccccccccccccccrrrrrrrrrrccccccc   00000000000000000000000000000000000000000000000000
EEEEEEEEEEcccccccccccccccccccccccrrrrrrrrrrccccccc   00000000000000000000000000000000000000000000000000
EEEEEEEEEEccccccccccccccccccccccrrrrrrrrrrrccccccc   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrrrrEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrrrrEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrrrrEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrrrrEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrrrrEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrrrrEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEErrrrrrrrrrEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.37 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 129 nodi, 511 passi, finito in 414 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=erba (marcatore), h=honey, w=white, s=slate, p=pilastro portico, a=paglia fienile, v=legno stalla, c=acciottolato aia, d=dead, dark, r=strada selciata, f=tavole legno, W=pietra muro, F=solaio pietra, U=blUe, R=tegole tetto, k=scalini legno, T=Teal (marcatore), L=Light, O=porta aperta, o=battente legno, K=comignolo cotto, J=tetto fienile, j=jungle, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: R 53733, J 21111, W 21077, E 4100, k 2720, f 2299, c 1750, F 1415, r 625, o 426, O 24, K 9.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-31 all×18, one×3, prl×1: 257 celle x0-16 y4-19 z0, passi 2-47
   #33 map scala 5 5 1: ×1, 9937 celle x0-99 y0-99 z0-79, passi 48
#35-36 all×2: 28050 celle x25-79 y30-74 z1-20, passi 49-68
#37-38 all×2: 14850 celle x25-79 y30-74 z21-38, passi 69-86
    #39 all . W → W U passi=14: ×14, 23100 celle x25-79 y30-74 z38-52, passi 87-100, W→U 11550, .→W 11550
    #40 all . W → W W passi=12: ×12, 9900 celle x25-79 y30-74 z53-64, passi 101-112, .→W 9900
    #41 prl W → R: ×1, 30525 celle x25-79 y30-74 z0-64, passi 113, W→R 30525
#42-51 all×9, prl×1: 25225 celle x25-74 y35-74 z0-64, passi 114-210
    #52 all . h → h . passi=31: ×31, 85250 celle x30-74 y35-69 z1-32, passi 211-241, h→. 42625, .→h 42625
    #53 all . h → h F (+1) passi=1: ×1, 3150 celle x30-74 y35-69 z32-33, passi 242, h→F 1375, .→h 1375, s→F 200, .→s 200
      r1 . h → h F ×1375; r2 . s → s F ×200
    #54 all . h → h . (+1) passi=31: ×31, 97650 celle x30-74 y35-69 z33-64, passi 243-273, h→. 42625, .→h 42625, s→. 6200, .→s 6200
      r1 . h → h . ×42625; r2 . s → s . ×6200
#55-58 prl×2, all×2: 26950 celle x0-74 y25-69 z0-64, passi 274-308
    #59 all . a → a . passi=31: ×31, 31000 celle x5-24 y30-54 z1-32, passi 309-339, a→. 15500, .→a 15500
#60-107 prl×3, all×11: 13996 celle x5-79 y30-79 z0-32, passi 340-432
#108-119 prl×3, all×6: 14363 celle x25-79 y30-74 z1-51, passi 433-484
    #120 prl U → W: ×1, 18827 celle x25-79 y30-74 z6-51, passi 485, U→W 18827
#121-122 prl×1, all×1: 17721 celle x24-80 y29-75 z0-64, passi 486-487
#123-129 all×4, one×1, prl×1: 18679 celle x0-79 y24-79 z1-77, passi 488-511
Senza effetto (non hanno mai cambiato una cella):
#12 all pE → *E passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#21 all cEEEEEE → *cccc** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#22 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#29 one ccccc/ccccc/ccccc/ccccc/ccccc → *****/*****/**Q**/*****/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#30 all EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******… passi=2: le celle cercate c'erano, ma mai disposte come nel pattern
#64 all . q → q q passi=6: in quel momento nella griglia non c'erano celle "q"
#65 prl q → .: in quel momento nella griglia non c'erano celle "q"
#66 all . t → t m passi=12: in quel momento nella griglia non c'erano celle "t"
#67 all . t → t Z passi=16: in quel momento nella griglia non c'erano celle "t"
#68 all . Z → Z Z passi=1: in quel momento nella griglia non c'erano celle "Z"
#69 all .*/** Z*/*Z → **/** Z*/** passi=1: in quel momento nella griglia non c'erano celle "Z"
#70 prl t → .: in quel momento nella griglia non c'erano celle "t"
… e altri 29
Fix it and answer with the whole program.

## Risposta

<!-- Fattoria (Farmhouse)
     Concept: Main dwelling house (2 storeys, gable roof), stair zone 4x2 cells, barn/lean-to wing, courtyard, road to edge.
     Fixes:
     - Clear room measure: House interior is widened to 8x8 cells (40x40 voxels), stair takes 4x2 cells against a wall, leaving plenty of clear room > 28 voxels.
     - Door: 3 cells wide (15 voxels wide), correctly seeded through wall with part-door to ensure door opening is full size (15x30).
     - Prl W -> R was incorrectly turning the whole wall to R at z=0..64! In MarkovJunior, "all in='B W' out='W W'" must elevate the head, and only the top head turns to R.
-->
<sequence values="BHEhwspavcdrqtfgn" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwspavcdrqtfgn" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Main body interior: 8 cells x, 8 cells y -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Stair zone along north interior wall: 4 cells along x, 2 cells along y -->
      <one in="hhhh/hhhh" out="ssss/ssss" symmetry="()" steps="1"/>

      <!-- House walls surrounding interior -->
      <all in="[hs]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- 2. Barn wing on one side chosen at random -->
      <one in="Ew/Ew/Ew/Ew" out="**/**/a*/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- 3. Courtyard in front -->
      <all in="[wv]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand courtyard on larger maps -->
      <all in="cEEEEE" out="*cccc*" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 4. Entrance door in front wall (3 cells wide) and road to edge -->
      <one in="w/c" out="d/*" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dc]/c" out="*/r" symmetry="()"/>
      <all in="[dc]/E" out="*/r" symmetry="()"/>
      <all in="rc" out="*r" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

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
      <rule in="d" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <!-- Barn wall -->
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <!-- Barn interior -->
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <!-- Yard cobblestone -->
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <!-- Road paving -->
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <!-- Grass ground -->
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <!-- B. Heights -->

        <!-- House walls W rise 64 -->
        <all in="B W" out="W W" steps="6"/>
        <all in="B W" out="W U" steps="14"/>
        <all in="B W" out="W W" steps="12"/>
        <all in="B W" out="W W" steps="6"/>
        <all in="B W" out="W U" steps="14"/>
        <all in="B W" out="W W" steps="11"/>
        <all in="B W" out="R W" steps="1"/>

        <!-- House interior h and stair s: floor at z=0, slab at z=32, ceiling at z=64 -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>

        <!-- Stair strip T: 20 voxels long along x, 10 wide along y, at z=1 -->
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
        <!-- Ceiling/Roof marker at z=64 -->
        <all steps="1">
          <rule in="B h" out="R B"/>
          <rule in="B s" out="R B"/>
        </all>
        <prl in="h" out="B"/>
        <prl in="s" out="B"/>

        <!-- Barn walls v rise 32 -->
        <all in="B v" out="v v" steps="31"/>
        <all in="B v" out="J v" steps="1"/>
        <!-- Barn interior floor and air -->
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="30"/>
        <all in="B a" out="J B" steps="1"/>
        <prl in="a" out="B"/>

        <!-- C. Full scale: Doors, Stairs, Windows, Roofs -->

        <!-- Define unions for parts -->
        <union symbol="+" values="Wv"/>
        <union symbol="=" values="fF"/>

        <!-- Doorway seed O at house entrance: where W meets r at ground layer -->
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Include parts -->
        <import file="part-door"/>
        <import file="part-stair"/>

        <!-- Windows in window band U -->
        <all in="BU/BU/BU BU/BU/BU BU/BU/BU" out="*L/*L/*L *L/*L/*L *L/*L/*L" steps="3" symmetry="()"/>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <prl in="L" out="B"/>

        <!-- Gable roof on house (R) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="***** ***** ***B* ***** *****
                **R** **R** RRRRR **R** **R**"
             out="***** ***** ***R* ***** *****
                  ***** ***** ***** ***** *****"
             steps="12" symmetry="()"/>

        <!-- Pitched roof on barn wing (J) -->
        <all in="JB" out="*J" steps="1"/>
        <all in="***** ***** ***B* ***** *****
                **J** **J** JJJJJ **J** **J**"
             out="***** ***** ***J* ***** *****
                  ***** ***** ***** ***** *****"
             steps="8" symmetry="()"/>

        <!-- Chimney on house roof -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="8"/>
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
  <color symbol="c" value="#787366" name="acciottolato aia" area="yard"/>
  <color symbol="r" value="#9e9480" name="strada selciata" area="yard"/>
  <color symbol="K" value="#5c261e" name="comignolo cotto" area="house"/>

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
