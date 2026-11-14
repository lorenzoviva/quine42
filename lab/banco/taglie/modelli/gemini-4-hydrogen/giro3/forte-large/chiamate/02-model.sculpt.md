# model.sculpt · gemini-4-hydrogen · 18 s

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

## Your program so far
<!--
  Forte (fort):
  - Keep (h: floor, s: stair zone, w: walls, d: front door): at the centre, 9 cells wide, 8-9 cells deep; stair along a wall.
  - Courtyard (c) and paved way (n): around the keep, expands further where space allows (Huge/Gargantuan).
  - Curtain wall (W), gatehouse (G) on the front axis, corner towers (t): ring around the courtyard.
  - Road (r): straight from the gatehouse to the front edge.
  - Well (Q): placed in a 5x5 free courtyard area (fits at Huge/Gargantuan).
  - Moat (a): outer ditch around the curtain wall where 5 cells of ground remain (fits at Huge/Gargantuan).
  - Seeds vary: keep depth, stair corner, tower/courtyard/well placement.
-->
<sequence values="BHEhswdcnWGrQat" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdcnWGrQat" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Keep interior around H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
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
      <prl in="d" out="h"/>
      <all in="h/w" out="*/d" symmetry="()" steps="1"/>
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
  </map>
  <color symbol="B" value="000000" hidden="True"/>
  <color symbol="E" value="6b7b4c" name="erba" area="ground" hidden="True"/>
  <color symbol="H" value="d9c398" name="centro"/>
  <color symbol="h" value="c2a878" name="pavimento mastio" area="keep"/>
  <color symbol="s" value="a88c5c" name="zona scala" area="keep"/>
  <color symbol="w" value="7a766e" name="muro mastio" area="keep"/>
  <color symbol="d" value="5c4028" name="porta mastio" area="keep"/>
  <color symbol="c" value="b5a689" name="cortile" area="courtyard"/>
  <color symbol="n" value="9e9585" name="lastricato" area="courtyard"/>
  <color symbol="W" value="636059" name="mura" area="wall"/>
  <color symbol="t" value="524f49" name="torre" area="tower"/>
  <color symbol="G" value="4a3522" name="corpo di guardia" area="gatehouse"/>
  <color symbol="r" value="8c8270" name="strada" area="road"/>
  <color symbol="Q" value="4c7a99" name="pozzo" area="courtyard"/>
  <color symbol="a" value="3d6480" name="fossato" area="moat"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento mastio, s zona scala, w muro mastio, d porta mastio, c cortile, n lastricato, W mura, G corpo di guardia, r strada, t torre
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEttttt
EtttttEEEEEEEEEttttt
EtttttWWWWWWWWWttttt
Etttcccccccccccccttt
Etttcwwwwwwwwwwwcttt
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
Etttcdddddddddddcttt
Etttcnnnnnnnnnnncttt
EtttttGGGGGGGGGttttt
Etttttrrrrrrrrrttttt
Etttttrrrrrrrrrttttt
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento mastio, s zona scala, w muro mastio, d porta mastio, c cortile, n lastricato, W mura, G corpo di guardia, r strada, t torre
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEttttt
EtttttEEEEEEEEEttttt
EtttttWWWWWWWWWttttt
Etttcccccccccccccttt
Etttcwwwwwwwwwwwcttt
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
Etttcdddddddddddcttt
Etttcnnnnnnnnnnncttt
EtttttGGGGGGGGGttttt
Etttttrrrrrrrrrttttt
Etttttrrrrrrrrrttttt
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento mastio, s zona scala, w muro mastio, d porta mastio, c cortile, n lastricato, W mura, G corpo di guardia, r strada, t torre
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEttttt
EtttttEEEEEEEEEttttt
EtttttWWWWWWWWWttttt
Etttcccccccccccccttt
Etttcwwwwwwwwwwwcttt
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
Etttcdddddddddddcttt
Etttcnnnnnnnnnnncttt
EtttttGGGGGGGGGttttt
Etttttrrrrrrrrrttttt
Etttttrrrrrrrrrttttt
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento mastio, s zona scala, w muro mastio, d porta mastio, c cortile, n lastricato, W mura, G corpo di guardia, r strada, Q pozzo, a fossato, t torre
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEtttttaaaaaaaaaaaaaaaaatttttE
EEtttttaaaaaaaaaaaaaaaaatttttE
EEtttttWWWWWWWWWWWWWWWWWtttttE
EEtttccccccccccccccccccccctttE
EEtttccccccccccccccccccccctttE
EEEEWccQccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccwwwwwwwwwwwcccccWEEE
EEEEWcccccwhhsssshhhwcccccWEEE
EEEEWcccccwhhsssshhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccdddddddddddcccccWEEE
EEEEWcccccnnnnnnnnnnncccccWEEE
EEEEWcccccnnnnnnnnnnncccccWEEE
EEEEWcccccnnnnnnnnnnncccccWEEE
EEtttcccccnnnnnnnnnnnccccctttE
EEtttcccccnnnnnnnnnnnccccctttE
EEtttttWWWGGGGGGGGGGGWWWtttttE
EEtttttEEErrrrrrrrrrrEEEtttttE
EEtttttEEErrrrrrrrrrrEEEtttttE
EEEEEEEEEErrrrrrrrrrrEEEEEEEEE
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

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
