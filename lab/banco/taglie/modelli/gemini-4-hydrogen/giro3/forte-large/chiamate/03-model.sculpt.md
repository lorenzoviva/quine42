# model.sculpt · gemini-4-hydrogen · 17 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
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
<!--
  Forte (fort):
  - Keep (h: floor, s: stair zone, w: walls, d: front door): at the centre, 9 cells wide, 8-9 cells deep; stair along a wall.
  - Courtyard (c) and paved way (n): around the keep, expands further where space allows (Huge/Gargantuan).
  - Curtain wall (W), gatehouse (G) on the front axis, corner towers (t): ring around the courtyard.
  - Road (r): straight from the gatehouse to the front edge.
  - Well (Q): placed in a 5x5 free courtyard area (fits at Huge/Gargantuan).
  - Moat (a): outer ditch around the curtain wall where 5 cells of ground remain (fits at Huge/Gargantuan).
  - Seeds vary: keep depth, side annex/bastion, stair placement, well placement.
-->
<sequence values="BHEhswdcnWGrQatfFRWUTkMLNOo#90#91#92#94#20#21" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="W"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="W"/>
  <map scale="1/5 1/5 1" values="BHEhswdcnWGrQat" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Keep interior around H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <!-- Optional side bastion/annex on a random side wall -->
      <one in="Eh/Eh/Eh/Eh/Eh" out="**/**/h*/**/**" symmetry="(x)" steps="1"/>
      <all in="hE" out="*h" symmetry="(x)" steps="1"/>
      <!-- Keep walls -->
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Stair zone along a wall with 2 cells landing -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- Courtyard around keep, expanding if space allows -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Curtain wall around courtyard -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <!-- Corner towers on outer corners of curtain wall -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- Axis from H to front edge: keep door (d), paving (n), gatehouse (G), road (r) -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()" steps="1"/>
      <prl in="d/h" out="h/*" symmetry="()"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <!-- Widen door, paving, gatehouse, road to 3 cells -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <!-- Turn H into h -->
      <prl in="H" out="h"/>
      <!-- Well in courtyard if 5x5 free c exists -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- Moat outside curtain wall where 5 cells of ground remain -->
      <all in="cWEEEEE" out="**aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>
    <map scale="5 5 1" values="BHEhswdcnWGrQatfFRWUTkMLNOo#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <sequence symmetry="(xy)">
        <!-- B. Heights -->
        <!-- Keep walls (w): 2 storeys of 32 (64) with window bands -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- Keep door wall (d): floor at z=0, then wall up to 64 -->
        <all in="B d" out="d f" steps="1"/>
        <all in="B d" out="d W" steps="63"/>
        <prl in="d" out="R"/>
        <!-- Keep floor (h) and stair zone (s): 2 storeys -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- Curtain wall (W): 24 high -->
        <all in="B W" out="W W" steps="24"/>
        <!-- Corner towers (t): 40 high -->
        <all in="B t" out="t W" steps="40"/>
        <!-- Gatehouse (G): floor at z=0, wall up to 36 -->
        <all in="B G" out="G n" steps="1"/>
        <all in="B G" out="G W" steps="35"/>
        <!-- Well (Q): 6 high stone rim -->
        <all in="B Q" out="Q W" steps="6"/>

        <!-- C. Full scale: doors, parts, windows, roofs, cleaning -->
        <!-- Door seeds (O) where paving (n) meets keep door wall, and road (r) meets gatehouse -->
        <all in="W/n" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>
        <all in="W/r" out="O/*" symmetry="()" steps="1"/>
        <all in="W/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in the U band of the keep -->
        <one steps="12"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <!-- Keep hip roof -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>

        <!-- Cleaning -->
        <prl in="T" out="B"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" hidden="True"/>
  <color symbol="E" value="6b7b4c" name="erba" area="ground" hidden="True"/>
  <color symbol="c" value="b5a689" name="cortile" area="courtyard"/>
  <color symbol="n" value="9e9585" name="lastricato" area="courtyard"/>
  <color symbol="r" value="8c8270" name="strada" area="road"/>
  <color symbol="a" value="3d6480" name="fossato" area="moat"/>
  <color symbol="f" value="c2a878" name="pavimento legno" area="keep"/>
  <color symbol="F" value="a88c5c" name="solaio legno" area="keep"/>
  <color symbol="W" value="7a766e" name="muro pietra" area="wall"/>
  <color symbol="R" value="8c4632" name="tetto" area="keep"/>
  <color symbol="L" value="9ec4d6" name="vetro finestra"/>
  <color symbol="M" value="636059" name="merli"/>
  <color symbol="U" value="2b2926" name="feritoia"/>
  <color symbol="O" value="5c4028" name="porta" area="keep"/>
  <color symbol="o" value="3d2918" name="assi porta" area="keep"/>
  <color symbol="N" value="4a4742" name="stipite"/>
  <color symbol="k" value="8f6f47" name="gradini"/>
  <color symbol="#20" value="000000" hidden="True"/>
  <color symbol="#21" value="000000" hidden="True"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
It does not pass: taglia Grande, seme 1: piani: 0 (serve ≥ 2); stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, c cortile, n lastricato, W muro pietra, G Green, r strada, t teal, f pavimento legno, F solaio legno, R tetto, k gradini, L vetro finestra
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
tttttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
tttttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
tttttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
tttttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
tttttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
tttttttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
tttttttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
ttttttttttttcWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
ttttttttccccccccccccccccccccccccccccccccccccccccWW
ttttttttccccccccccccccccccccccccccccccccccccccccWW
ttttttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
ttttttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
tttttttcccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
EEEEEWWcccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
ttttttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
ttttttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW
ttttttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccWW
ttttttttcccccccccccccccnnnnnnnccccccccccccccccccWW
ttttttttcccccccccccccccnnnnnnncccccccccccccccccWWW
tttttttttttttWWWWWWWWWWGGGGGGGWWWWWWWWWWWWWWWWWWWW
tttttttttttttWWWWWWWWWWGGGGGGGWWWWWWWWWWWWWWWWWWWW
tttttttttttttEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
tttttttttttttEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
tttttttttttttEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
tttttttttttttEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
tttttttttttttEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
iiiiiiiiiiiii0000000000000000000000000000000000000
iiiiiiiiiiiii0000000000000000000000000000000000000
iiiiiiiiiiiii0000000000000000000000000000000000000
iiiiiiiiiiiii0000000000000000000000000000000000000
iiiiiiiiiiiii0000000000000000000000000000000000000
iiiiiiiiiiiiibbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
iiiiiiiiiiiiibbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
iiiiiiiiiiiiibbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
iiiiiiii000000000000000000000000000000000000000bbb
iiiiiiii00sssssssssssssssssssssssssssssssssss00bbb
iiiiiiii0sttttttttttttttttttttttttttttttttttts0bbb
iiiiiiii0sttttttttttttttttttttttttttttttttttts0bbb
iiiiiiii0sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts0bbb
00000bbb0sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts0bbb
00000bbb0sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts0bbb
00000bbb0sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts0bbb
00000bbb0sttuuvvwwwwwwwwwwwwwwwwwwwwwwwvvuutts0bbb
00000bbb0sttuuvvwwwwwwwwwwwwwwwwwwwwwwwvvuutts0bbb
00000bbb0sttuuvvwwwwwwwwwwwwwwwwwwwwwwwvvuutts0bbb
00000bbb0sttuuvvwwwxxxxxxxxxxxxxxxxxwwwvvuutts0bbb
00000bbb0sttuuvvwwwxxxxxxxxxxxxxxxxxwwwvvuutts0bbb
00000bbb0sttuuvvwwwxxxxxxxxxxxxxxxxxwwwvvuutts0bbb
00000bbb0sttuuvvwwwxxxxxxxxxxxxxxxxxwwwvvuutts0bbb
00000bbb0sttuuvvwwwxxxxxxxxxxxxxxxxxwwwvvuutts0bbb
00000bbb0sttuuvvwwwxxxxxxxxxxxxxxxxxwwwvvuutts0bbb
00000bbb0sttuuvvwwwxxxxxxxxxxxxxxxxxwwwvvuutts0bbb
00000bbb0sttuuvvwwwwwwwwwwwwwwwwwwwwwwwvvuutts0bbb
00000bbb0sttuuvvwwwwwwwwwwwwwwwwwwwwwwwvvuutts0bbb
00000bbb0sttuuvvwwwwwwwwwwwwwwwwwwwwwwwvvuutts0bbb
00000bbb0sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts0bbb
00000bbb0sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts0bbb
00000bbb0sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts0bbb
iiiiiiii0sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts0bbb
iiiiiiii0sttttttttttttttttttttttttttttttttttts0bbb
iiiiiiii0sttttttttttttttttttttttttttttttttttts0bbb
iiiiiiii00sssssssssssssssssssssssssssssssssss00bbb
iiiiiiii000000000000000000000000000000000000000bbb
iiiiiiiiiiiiibbbbbbbbbggggggggbbbbbbbbbbbbbbbbbbbb
iiiiiiiiiiiiibbbbbbbbbggggggggbbbbbbbbbbbbbbbbbbbb
iiiiiiiiiiiiibbbbbbbbbggggggggbbbbbbbbbbbbbbbbbbbb
iiiiiiiiiiiii0000000000000000000000000000000000000
iiiiiiiiiiiii0000000000000000000000000000000000000
iiiiiiiiiiiii0000000000000000000000000000000000000
iiiiiiiiiiiii0000000000000000000000000000000000000
iiiiiiiiiiiii0000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
....................RRRRRRRRRRRRRRR...............
..................RRRRRRRRRRRRRRRRRRR.............
................RRRRRRRRRRRRRRRRRRRRRRR...........
..............RRRRRRRRRRRRRRRRRRRRRRRRRRR.........
............RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.......
..........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
ttttttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
WWWWWWWWWWWWWWWWWWWWWWWGGGGGGGWWWWWWWWWWWWWWW.....
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWEEEEEEEEEWrrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
.........................RRRRR....................
.......................RRRRRRRRR..................
.....................RRRRRRRRRRRRR................
...................RRRRRRRRRRRRRRRRR..............
.................RRRRRRRRRRRRRRRRRRRRR............
...............RRRRRRRRRRRRRRRRRRRRRRRRR..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWLLWWWWWWWW..........
...............WWWWWWWWWWWWWWWLLLWWWWWWW..........
...............WWWWWWWWWWWWWWWLLLWWWWWWW..........
...............WWWWWWWWWWWWWWWLLLWWWWWWW..........
.....ttttttttttWWWWWWWWWWWWWWWWWWWWWWWWWtttttttttt
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWGGWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
EEEEEEEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
WWWWWWWWWWWWW.....................................
WWWWWWWWWWWWW.....................................
WWWWWWWWWWWWW.....................................
WWWWWWWWWWWWW.....................................
WWWWWWWWWWWWW.....................................
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWW.......................................WWW
WWWWWWWW.......................................WWW
WWWWWWWW..WWWWLLLWWWWWWWLLLWWWWWWWWWWWWWLLLLL..WWW
WWWWWWWW..WWWWLLLWWWWWWWWWLWWWWWWWWWWWWWWWWWW..WWW
WWWWWWWW..WWWWLLLWWWWWWWWWLWWWWWWWWWWWWWWWWWW..WWW
.....WWW..WWW.......kkkkkk..............WWWWW..WWW
.....WWW..WWW.......kkkkkk..............WWWWW..WWW
.....WWW..WWW.......kkkkkk..............WWWWW..WWW
.....WWW..WWW.......kkkkkk..............WWWWW..WWW
.....WWW..WWW.......kkkkk...............WWWWW..WWW
.....WWW..WWW...........................WWWWW..WWW
.....WWW..WWW...........................WWWWW..WWW
.....WWW..WWW...........................WWWWW..WWW
.....WWW..WWW...........................WWWWW..WWW
.....WWW..WWW............WW.............WWWWW..WWW
.....WWW..LLL............WWW............WWWWW..WWW
.....WWW..LLL............WWW............WWWWW..WWW
.....WWW..LLL............WWW..............WWW..WWW
.....WWW..WWW............WWW..............WWW..WWW
.....WWW..WWW............WWW............WWWWW..WWW
.....WWW..LLL............WWW............WWWWW..WWW
.....WWW..LLL............WWW............WWWWW..WWW
.....WWW..LLL............WWW............WWWWW..WWW
.....WWW..WWW............WWW............WWWWW..WWW
WWWWWWWW..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..WWW
WWWWWWWW..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..WWW
WWWWWWWW..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..WWW
WWWWWWWW.......................................WWW
WWWWWWWW.......................................WWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWW.....................................
WWWWWWWWWWWWW.....................................
WWWWWWWWWWWWW.....................................
WWWWWWWWWWWWW.....................................
WWWWWWWWWWWWW.....................................
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
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWW...........................WWWWW.....
..........WWW...........................WWWWW.....
..........WWW...........................WWWWW.....
..........WWW...........................WWWWW.....
..........WWW...........................WWWWW.....
..........WWW...........................WWWWW.....
..........WWW...........................WWWWW.....
..........WWW...........................LWWWW.....
..........WWW...........................LWWWW.....
..........WWW............WW.............WWWWW.....
..........WWW............WWW............WWWWW.....
..........WWW............WWW............WWWWW.....
..........WWW............WWW..............LLL.....
..........LLL............WWW..............LLL.....
..........LLL............WWW............WWWLL.....
..........LLL............WWW............WWWWW.....
..........WWW............WWW............WWWWW.....
..........WWW............WWW............WWWWW.....
..........WWW............WWW............WWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
ttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttttt   iiiiiiiiii000000000000000000000000000000iiiiiiiiii
ttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttttt   iiiiiiiiii000000000000000000000000000000iiiiiiiiii
ttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttttt   iiiiiiiiii000000000000000000000000000000iiiiiiiiii
ttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttttt   iiiiiiiiii000000000000000000000000000000iiiiiiiiii
ttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtttttttttt   iiiiiiiiii000000000000000000000000000000iiiiiiiiii
ttttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttttt   iiiiiiiiiibbbbbbbbbbbbbbbbbbbbbbbbbbbbbbiiiiiiiiii
ttttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttttt   iiiiiiiiiibbbbbbbbbbbbbbbbbbbbbbbbbbbbbbiiiiiiiiii
ttttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWtttttttttt   iiiiiiiiiibbbbbbbbbbbbbbbbbbbbbbbbbbbbbbiiiiiiiiii
tttttccccccccccccccccccccccccccccccccccccccccttttt   iiiii0000000000000000000000000000000000000000iiiii
tttttccccccccccccccccccccccccccccccccccccccccttttt   iiiii00ssssssssssssssssssssssssssssssssssss00iiiii
tttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccttttt   iiiii00stttttttttttttttttttttttttttttttttts00iiiii
tttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccttttt   iiiii00stttttttttttttttttttttttttttttttttts00iiiii
tttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccttttt   iiiii00sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00iiiii
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvwwwwwwwwwwwwwwwwwwwwwwvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvwwwwwwwwwwwwwwwwwwwwwwvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvwwwwwwwwwwwwwwwwwwwwwwvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvwwwxxxxxxxxxxxxxxxxwwwvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvwwwxxxxxxxxxxxxxxxxwwwvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvwwwxxxxxxxxxxxxxxxxwwwvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvwwwxxxxxxxxxxxxxxxxwwwvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvwwwxxxxxxxxxxxxxxxxwwwvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvwwwxxxxxxxxxxxxxxxxwwwvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvwwwxxxxxxxxxxxxxxxxwwwvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvwwwwwwwwwwwwwwwwwwwwwwvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvwwwwwwwwwwwwwwwwwwwwwwvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvwwwwwwwwwwwwwwwwwwwwwwvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvuutts00bbb00
EEEWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWWEE   00bbb00sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00bbb00
EEtWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWWtEE   iiiii00sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts00iiiii
tttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccttttt   iiiii00stttttttttttttttttttttttttttttttttts00iiiii
tttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccttttt   iiiii00stttttttttttttttttttttttttttttttttts00iiiii
tttttcccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccttttt   iiiii00ssssssssssssssssssssssssssssssssssss00iiiii
tttttccccccccccccccccccnnnnnnncccccccccccccccttttt   iiiii0000000000000000000000000000000000000000iiiii
tttttccccccccccccccccccnnnnnnncccccccccccccccttttt   iiiiiiiiiibbbbbbbbbbbbggggggggbbbbbbbbbbiiiiiiiiii
ttttttttttWWWWWWWWWWWWWGGGGGGGWWWWWWWWWWtttttttttt   iiiiiiiiiibbbbbbbbbbbbggggggggbbbbbbbbbbiiiiiiiiii
ttttttttttWWWWWWWWWWWWWGGGGGGGWWWWWWWWWWtttttttttt   iiiiiiiiiibbbbbbbbbbbbggggggggbbbbbbbbbbiiiiiiiiii
ttttttttttEEEEEEEEEEEEErrrrrrrEEEEEEEEEEtttttttttt   iiiiiiiiii000000000000000000000000000000iiiiiiiiii
ttttttttttEEEEEEEEEEEEErrrrrrrEEEEEEEEEEtttttttttt   iiiiiiiiii000000000000000000000000000000iiiiiiiiii
ttttttttttEEEEEEEEEEEEErrrrrrrEEEEEEEEEEtttttttttt   iiiiiiiiii000000000000000000000000000000iiiiiiiiii
ttttttttttEEEEEEEEEEEEErrrrrrrEEEEEEEEEEtttttttttt   iiiiiiiiii000000000000000000000000000000iiiiiiiiii
ttttttttttEEEEEEEEEEEEErrrrrrrEEEEEEEEEEtttttttttt   iiiiiiiiii000000000000000000000000000000iiiiiiiiii
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
tttttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   iiiiiiiiiiiii0000000000000000000000000000000000000
tttttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   iiiiiiiiiiiii0000000000000000000000000000000000000
tttttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   iiiiiiiiiiiii0000000000000000000000000000000000000
tttttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   iiiiiiiiiiiii0000000000000000000000000000000000000
tttttttttttttEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   iiiiiiiiiiiii0000000000000000000000000000000000000
tttttttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   iiiiiiiiiiiiibbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
tttttttttttttWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   iiiiiiiiiiiiibbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
ttttttttttttcWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   iiiiiiiiiiiiibbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
ttttttttccccccccccccccccccccccccccccccccccccccccWW   iiiiiiii000000000000000000000000000000000000000bbb
ttttttttccccccccccccccccccccccccccccccccccccccccWW   iiiiiiii00sssssssssssssssssssssssssssssssssss00bbb
ttttttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   iiiiiiii0sttttttttttttttttttttttttttttttttttts0bbb
ttttttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   iiiiiiii0sttttttttttttttttttttttttttttttttttts0bbb
tttttttcccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   iiiiiiii0sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvwwwwwwwwwwwwwwwwwwwwwwwvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvwwwwwwwwwwwwwwwwwwwwwwwvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvwwwwwwwwwwwwwwwwwwwwwwwvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvwwwxxxxxxxxxxxxxxxxxwwwvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvwwwxxxxxxxxxxxxxxxxxwwwvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvwwwxxxxxxxxxxxxxxxxxwwwvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvwwwxxxxxxxxxxxxxxxxxwwwvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvwwwxxxxxxxxxxxxxxxxxwwwvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvwwwxxxxxxxxxxxxxxxxxwwwvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvwwwxxxxxxxxxxxxxxxxxwwwvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvwwwwwwwwwwwwwwwwwwwwwwwvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvwwwwwwwwwwwwwwwwwwwwwwwvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvwwwwwwwwwwwwwwwwwwwwwwwvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuvvvvvvvvvvvvvvvvvvvvvvvvvvvuutts0bbb
EEEEEWWWccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   00000bbb0sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts0bbb
EEEEEWWcccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   iiiiiiii0sttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutts0bbb
ttttttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   iiiiiiii0sttttttttttttttttttttttttttttttttttts0bbb
ttttttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccWW   iiiiiiii0sttttttttttttttttttttttttttttttttttts0bbb
ttttttttccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcccWW   iiiiiiii00sssssssssssssssssssssssssssssssssss00bbb
ttttttttcccccccccccccccnnnnnnnccccccccccccccccccWW   iiiiiiii000000000000000000000000000000000000000bbb
ttttttttcccccccccccccccnnnnnnncccccccccccccccccWWW   iiiiiiiiiiiiibbbbbbbbbggggggggbbbbbbbbbbbbbbbbbbbb
tttttttttttttWWWWWWWWWWGGGGGGGWWWWWWWWWWWWWWWWWWWW   iiiiiiiiiiiiibbbbbbbbbggggggggbbbbbbbbbbbbbbbbbbbb
tttttttttttttWWWWWWWWWWGGGGGGGWWWWWWWWWWWWWWWWWWWW   iiiiiiiiiiiiibbbbbbbbbggggggggbbbbbbbbbbbbbbbbbbbb
tttttttttttttEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   iiiiiiiiiiiii0000000000000000000000000000000000000
tttttttttttttEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   iiiiiiiiiiiii0000000000000000000000000000000000000
tttttttttttttEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   iiiiiiiiiiiii0000000000000000000000000000000000000
tttttttttttttEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   iiiiiiiiiiiii0000000000000000000000000000000000000
tttttttttttttEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   iiiiiiiiiiiii0000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.23 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 138 nodi, 524 passi, finito in 458 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=erba (marcatore), h=honey, s=slate, w=white, d=dead, dark, c=cortile, n=lastricato, W=muro pietra, G=Green, r=strada, t=teal, f=pavimento legno, F=solaio legno, R=tetto, U=feritoia, T=Teal (marcatore), k=gradini, L=vetro finestra, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 160049, R 20060, E 2750, k 2720, f 2300, F 1965, L 1776, c 1225, t 1050, n 150, r 150, G 75.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-33 all×22, one×2, prl×1: 321 celle x0-19 y2-19 z0, passi 2-43
   #39 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 44
    #41 all . w → w W passi=6: ×6, 14400 celle x20-89 y30-79 z0-6, passi 45-50, w→W 7200, .→w 7200
    #42 all . w → w U passi=14: ×14, 33600 celle x20-89 y30-79 z6-20, passi 51-64, w→U 16800, .→w 16800
    #43 all . w → w W passi=12: ×12, 28800 celle x20-89 y30-79 z20-32, passi 65-76, w→W 14400, .→w 14400
    #44 all . w → w W passi=6: ×6, 14400 celle x20-89 y30-79 z32-38, passi 77-82, w→W 7200, .→w 7200
    #45 all . w → w U passi=14: ×14, 33600 celle x20-89 y30-79 z38-52, passi 83-96, w→U 16800, .→w 16800
    #46 all . w → w W passi=12: ×12, 28800 celle x20-89 y30-79 z52-64, passi 97-108, w→W 14400, .→w 14400
#47-48 prl×1, all×1: 1550 celle x20-89 y30-79 z0-64, passi 109-110
    #49 all . d → d W passi=63: ×63, 22050 celle x45-59 y55-79 z1-64, passi 111-173, d→W 11025, .→d 11025
#50-52 prl×1, all×2: 4825 celle x25-84 y35-79 z0-64, passi 174-176
    #53 all . h → h . passi=31: ×31, 119350 celle x25-84 y35-74 z1-32, passi 177-207, h→. 59675, .→h 59675
#54-55 all×2: 16250 celle x25-84 y35-74 z2-33, passi 208-238
    #56 all . h → h . (+1) passi=31: ×31, 131750 celle x25-84 y35-74 z33-64, passi 239-269, h→. 59675, .→h 59675, s→. 6200, .→s 6200
      r1 . h → h . ×59675; r2 . s → s . ×6200
    #57 prl h → R (+1): ×1, 2125 celle x25-84 y35-74 z64, passi 270, h→R 1925, s→R 200
      r1 h → R ×1925; r2 s → R ×200
    #58 all . W → W W passi=24: ×24, 28200 celle x10-99 y20-89 z1-24, passi 271-294, .→W 28200
    #59 all . t → t W passi=40: ×40, 84000 celle x0-24 y10-99 z0-40, passi 295-334, t→W 42000, .→t 42000
#60-99 all×7, prl×1: 10740 celle x35-59 y35-89 z0-36, passi 335-418
#100-134 prl×5, all×7, one×1: 15866 celle x10-99 y20-89 z1-51, passi 419-512
    #135 prl U → W: ×1, 36724 celle x20-89 y30-79 z6-51, passi 513, U→W 36724
#136-137 all×2: 16560 celle x19-90 y29-80 z64-74, passi 514-524
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#16 all cEEEEEE → *cccc** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#17 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#25 prl d/h → h/*: le celle cercate c'erano, ma mai disposte come nel pattern
#34 one ccccc/ccccc/ccccc/ccccc/ccccc → *****/*****/**Q**/*****/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#35 all cWEEEEE → **aa*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#36 all [Wt]E/*a → **/*a: in quel momento nella griglia non c'erano celle "a"
#37 all aE/*a → *a/**: in quel momento nella griglia non c'erano celle "a"
#62 all . Q → Q W passi=6: in quel momento nella griglia non c'erano celle "Q"
#63 all W/n → O/* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#64 all W/O → O/* passi=4: in quel momento nella griglia non c'erano celle "O"
#65 all W/r → O/* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
… e altri 47
Fix it and answer with the whole program.

## Risposta

<!--
  Forte (fort):
  - Keep (h: floor, s: stair zone, w: walls, d: front door): at the centre, 9 cells wide, 8-9 cells deep; stair along a wall.
  - Courtyard (c) and paved way (n): around the keep, expands further where space allows (Huge/Gargantuan).
  - Curtain wall (W), gatehouse (G) on the front axis, corner towers (t): ring around the courtyard.
  - Road (r): straight from the gatehouse to the front edge.
  - Well (Q): placed in a 5x5 free courtyard area (fits at Huge/Gargantuan).
  - Moat (a): outer ditch around the curtain wall where 5 cells of ground remain (fits at Huge/Gargantuan).
  - Seeds vary: keep depth, side annex/bastion, stair placement, well placement.
-->
<sequence values="BHEhswdcnWGrQatmM fFRWUTkLNOo#90#91#92#94#20#21" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="W"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="W"/>
  <map scale="1/5 1/5 1" values="BHEhswdcnWGrQatm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Keep interior around H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <!-- Optional side bastion/annex on a random side wall -->
      <one in="Eh/Eh/Eh/Eh/Eh" out="**/**/h*/**/**" symmetry="(x)" steps="1"/>
      <all in="hE" out="*h" symmetry="(x)" steps="1"/>
      <!-- Keep walls -->
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Stair zone along a wall with 2 cells landing -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- Courtyard around keep, expanding if space allows -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Curtain wall around courtyard -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <!-- Corner towers on outer corners of curtain wall -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- Axis from H to front edge: marker (m), keep door (d), paving (n), gatehouse (G), road (r) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <!-- Widen door, paving, gatehouse, road to 3 cells -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <!-- Turn H and m into h -->
      <prl><rule in="H" out="h"/><rule in="m" out="h"/></prl>
      <!-- Well in courtyard if 5x5 free c exists -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- Moat outside curtain wall where 5 cells of ground remain -->
      <all in="cWEEEEE" out="**aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>
    <map scale="5 5 1" values="BHEhswdcnWGrQatfFRWUTkMLNOo#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <sequence symmetry="(xy)">
        <!-- B. Heights -->
        <!-- Keep walls (w): 2 storeys of 32 (64) with window bands -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- Keep door wall (d): door seed O at z=0, then wall up to 64 -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="63"/>
        <prl in="d" out="R"/>
        <!-- Keep floor (h) and stair zone (s): 2 storeys -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- Curtain wall (W): 24 high -->
        <all in="B W" out="W W" steps="24"/>
        <!-- Corner towers (t): 40 high -->
        <all in="B t" out="t W" steps="40"/>
        <!-- Gatehouse (G): door seed O at z=0, wall up to 36 -->
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G W" steps="35"/>
        <!-- Well (Q): 6 high stone rim -->
        <all in="B Q" out="Q W" steps="6"/>

        <!-- C. Full scale: parts, windows, roofs, cleaning -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in the U band of the keep -->
        <one steps="12"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <!-- Keep hip roof -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>

        <!-- Cleaning -->
        <prl in="T" out="B"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" hidden="True"/>
  <color symbol="E" value="6b7b4c" name="erba" area="ground" hidden="True"/>
  <color symbol="c" value="b5a689" name="cortile" area="courtyard"/>
  <color symbol="n" value="9e9585" name="lastricato" area="courtyard"/>
  <color symbol="r" value="8c8270" name="strada" area="road"/>
  <color symbol="a" value="3d6480" name="fossato" area="moat"/>
  <color symbol="f" value="c2a878" name="pavimento legno" area="keep"/>
  <color symbol="F" value="a88c5c" name="solaio legno" area="keep"/>
  <color symbol="W" value="7a766e" name="muro pietra" area="wall"/>
  <color symbol="R" value="8c4632" name="tetto" area="keep"/>
  <color symbol="L" value="9ec4d6" name="vetro finestra"/>
  <color symbol="M" value="636059" name="merli"/>
  <color symbol="U" value="2b2926" name="feritoia"/>
  <color symbol="O" value="5c4028" name="porta" area="keep"/>
  <color symbol="o" value="3d2918" name="assi porta" area="keep"/>
  <color symbol="N" value="4a4742" name="stipite"/>
  <color symbol="k" value="8f6f47" name="gradini"/>
  <color symbol="#20" value="000000" hidden="True"/>
  <color symbol="#21" value="000000" hidden="True"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
