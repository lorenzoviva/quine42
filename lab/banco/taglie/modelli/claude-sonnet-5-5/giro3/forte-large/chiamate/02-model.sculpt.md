# model.sculpt · claude-sonnet-5-5 · 469 s

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
 FORTE. Parts: keep K (square, golden ratio to yard), courtyard c around keep,
 curtain wall W (ring two cells thick around the yard), corner towers t (5x5 on outer corners),
 gate G on the front through the ring, paving n across the yard, road r to the edge,
 well Q in the yard where 5x5 of yard is free.
 Plan: H centre; body h/w is the keep, front = +y? the road goes toward the front edge.
 Seeds change: keep sides (3 behind, 5 in front plus chance), the ring follows.
 Size: 20x20 gives keep + thin ring; larger grids grow the yard by 4 or more cells,
 add a well, an outer moat/hedge ring only where ground goes on.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwiKcWtmdnGrQaxgjy" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- keep body -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="2"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the keep's interior is h; mark the keep zone -->
      <!-- yard around the keep -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- the yard grows where ground goes on -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- ring two cells thick -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <!-- corner towers -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- way out, from the centre to the front -->
      <all in="H/i" out="*/m" symmetry="()" steps="1"/>
      <all in="m/i" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dm]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <!-- well in the yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- outer hedge ring only where ground goes on (larger sizes) -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>
  </map>
  <color symbol="B" value="#000000" name="aria"/>
  <color symbol="E" value="#6E8B4E" name="erba" hidden="True"/>
  <color symbol="H" value="#8A7F70" name="centro"/>
  <color symbol="h" value="#9A8F7C" name="pavimento del mastio" area="keep"/>
  <color symbol="w" value="#7D7A74" name="muro del mastio"/>
  <color symbol="i" value="#8A7F70" name="traccia"/>
  <color symbol="m" value="#B0A58C" name="ingresso"/>
  <color symbol="d" value="#5A3A22" name="porta"/>
  <color symbol="K" value="#9A8F7C" name="mastio" area="keep"/>
  <color symbol="c" value="#C2B280" name="cortile" area="courtyard"/>
  <color symbol="W" value="#6F6C66" name="cinta muraria"/>
  <color symbol="t" value="#8C5A4A" name="torre" area="tower"/>
  <color symbol="n" value="#B8AA8A" name="selciato"/>
  <color symbol="G" value="#A0463A" name="torre del portale"/>
  <color symbol="r" value="#A89468" name="strada"/>
  <color symbol="Q" value="#4A7FA0" name="pozzo" area="courtyard"/>
  <color symbol="a" value="#4F7A3A" name="siepe" area="hedge"/>
  <color symbol="x" value="#4F7A3A" name="siepe bassa"/>
  <color symbol="g" value="#5E8A44" name="prato"/>
  <color symbol="j" value="#7A5A3A" name="marcatore"/>
  <color symbol="y" value="#7A5A3A" name="marcatore alto"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, h pavimento del mastio, w muro del mastio, c cortile, W cinta muraria, t torre, Q pozzo
Plan (the letter of every cell):
```
WWWWWWWWWWWWWWWWWEEE
WWWWWWWWWWWWWWWWWEEE
WWcccccccccccccWWEEE
WWcccccccccccccWWEEE
WWcccccccccccccWWEEE
WWcccccccccccccWWEEE
WWcccccccccccccWWEEE
WWccQccwwwwwwwcWWEEE
WWcccccwhhhhhwcWWEEE
WWcccccwhhhhhwcWWEEE
WWcccccwhhHhhwcWWEEE
WWcccccwhhhhhwcWWEEE
WWcccccwhhhhhwcWWEEE
WWcccccwhhhhhwcWWEEE
WWcccccwwwwwwwcWWEEE
WWcccccccccccccttttE
WWWWWWWWWWWWWWtttttE
WWWWWWWWWWWWWWtttttE
EEEEEEEEEEEEEEtttttE
EEEEEEEEEEEEEEtttttE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, h pavimento del mastio, w muro del mastio, c cortile, W cinta muraria, t torre, Q pozzo
Plan (the letter of every cell):
```
WWWWWWWWWWWWWWWWWEEE
WWWWWWWWWWWWWWWWWEEE
WWcccccccccccccWWEEE
WWcccccccccccccWWEEE
WWccccccccQccccWWEEE
WWcccccccccccccWWEEE
WWcccccccccccccWWEEE
WWcccccwwwwwwwcWWEEE
WWcccccwhhhhhwcWWEEE
WWcccccwhhhhhwcWWEEE
WWcccccwhhHhhwcWWEEE
WWcccccwhhhhhwcWWEEE
WWcccccwhhhhhwcWWEEE
WWcccccwhhhhhwcWWEEE
WWcccccwwwwwwwcWWEEE
WWcccccccccccccttttE
WWWWWWWWWWWWWWtttttE
WWWWWWWWWWWWWWtttttE
EEEEEEEEEEEEEEtttttE
EEEEEEEEEEEEEEtttttE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, h pavimento del mastio, w muro del mastio, c cortile, W cinta muraria, t torre, Q pozzo
Plan (the letter of every cell):
```
WWWWWWWWWWWWWWWWWEEE
WWWWWWWWWWWWWWWWWEEE
WWcccccccccccccWWEEE
WWcccccccccccccWWEEE
WWcccccccccccccWWEEE
WWcccccccccccccWWEEE
WWcccccccccccccWWEEE
WWcccccwwwwwwwcWWEEE
WWccQccwhhhhhwcWWEEE
WWcccccwhhhhhwcWWEEE
WWcccccwhhHhhwcWWEEE
WWcccccwhhhhhwcWWEEE
WWcccccwhhhhhwcWWEEE
WWcccccwhhhhhwcWWEEE
WWcccccwwwwwwwcWWEEE
WWcccccccccccccttttE
WWWWWWWWWWWWWWtttttE
WWWWWWWWWWWWWWtttttE
EEEEEEEEEEEEEEtttttE
EEEEEEEEEEEEEEtttttE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, h pavimento del mastio, w muro del mastio, c cortile, W cinta muraria, t torre, Q pozzo
Plan (the letter of every cell):
```
tttttEEEEEEEEEEEEEEEEEEtttttEE
tttttEEEEEEEEEEEEEEEEEEtttttEE
tttttWWWWWWWWWWWWWWWWWWtttttEE
tttttWWWWWWWWWWWWWWWWWWtttttEE
ttttccccccccccccccccccccttttEE
EEWWccccccccccccccccccccWWEEEE
EEWWccccccccccccccccccccWWEEEE
EEWWccccccccccccccccccccWWEEEE
EEWWccccccccccccccccccccWWEEEE
EEWWccccccccccccccccccccWWEEEE
EEWWccccccccccccccccccccWWEEEE
EEWWccccccccccccccccccccWWEEEE
EEWWccccccccwwwwwwwcccccWWEEEE
EEWWccccccccwhhhhhwcccccWWEEEE
EEWWccccccccwhhhhhwcccccWWEEEE
EEWWccccccccwhhHhhwcccccWWEEEE
EEWWccccccccwhhhhhwcccccWWEEEE
EEWWccccccccwhhhhhwcccccWWEEEE
EEWWccccccccwhhhhhwcccccWWEEEE
EEWWccccccccwwwwwwwcccccWWEEEE
EEWWccccccccccccccccccccWWEEEE
EEWWcccccQccccccccccccccWWEEEE
EEWWccccccccccccccccccccWWEEEE
EEWWccccccccccccccccccccWWEEEE
ttttccccccccccccccccccccttttEE
tttttWWWWWWWWWWWWWWWWWWtttttEE
tttttWWWWWWWWWWWWWWWWWWtttttEE
tttttEEEEEEEEEEEEEEEEEEtttttEE
tttttEEEEEEEEEEEEEEEEEEtttttEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.01 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
 FORTE. Parts: the keep (w walls, h floor, s zone of the stair), the yard c around it,
 a ring wall W two cells thick, corner towers t (each corner by chance), the gate G on the front
 axis, the paving n, the road r to the edge, a long hall a and a barracks v against the inside of
 the ring (only where the yard is wide), a well Q in the yard.
 Placement: the keep sits on the centre H, its door d on the front axis; the stair zone is along the
 back wall; the gate is on the same axis as the keep door, across the yard.
 Seeds change: the keep is 7 to 9 cells deep (chance at the back and at the front), which corners
 have towers, where the hall, the barracks and the well stand and on which side.
 Size: at 20 there is the keep, a thin yard, the ring, towers, the gate; at 30 and more the yard
 grows wide and holds the hall, the barracks and the well.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwscWtmdnGrQva" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <prl><rule in="EE/EW" out="**/*t" p="0.6"/></prl>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/c" out="*/n" symmetry="()" steps="1"/>
      <all in="n/c" out="*/n" symmetry="()"/>
      <all in="n/W" out="*/G" symmetry="()" steps="1"/>
      <all in="G/W" out="*/G" symmetry="()"/>
      <all in="G/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <one in="WWWWWWW/ccccccc/ccccccc/ccccccc" out="*******/aaaaaaa/aaaaaaa/aaaaaaa" steps="1"/>
      <one in="WWWWW/ccccc/ccccc/ccccc" out="*****/vvvvv/vvvvv/vvvvv" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsWtGqvacnrQfFPVLRMXYZKJkTOoNU#20#21#90#91#92#94" symmetry="()">
      <union symbol="+" values="PVRXYZ"/>
      <union symbol="=" values="fF"/>
      <union symbol="%" values="X"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="m" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="Q" out="qqqqq/qQQQq/qQQQq/qQQQq/qqqqq"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <sequence symmetry="(xy)">
        <!-- B. the heights -->
        <all in="B w" out="w P" steps="6"/>
        <all in="B w" out="w V" steps="14"/>
        <all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="6"/>
        <all in="B w" out="w V" steps="14"/>
        <all in="B w" out="w P" steps="13"/>
        <prl in="w" out="R"/>
        <all in="B W" out="W X" steps="23"/>
        <prl in="W" out="X"/>
        <all in="B t" out="t Y" steps="39"/>
        <prl in="t" out="Y"/>
        <all in="B G" out="G Z" steps="39"/>
        <prl in="G" out="Z"/>
        <all in="B q" out="q K" steps="6"/>
        <prl in="q" out="K"/>
        <all in="B v" out="v K" steps="15"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a K" steps="19"/>
        <prl in="a" out="J"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- C. the full scale -->
        <import file="part-stair"/>
        <all in="P/n" out="O/*" symmetry="()" steps="1"/>
        <all in="P/O" out="O/*" symmetry="()" steps="4"/>
        <all in="Z/r" out="O/*" symmetry="()" steps="1"/>
        <all in="Z/O" out="O/*" symmetry="()" steps="9"/>
        <import file="part-door"/>
        <one steps="24"><rule in="BBB/VVV/VVV/VVV/VVV/VVV/BBB BBB/VVV/VVV/VVV/VVV/VVV/BBB BBB/VVV/VVV/VVV/VVV/VVV/BBB BBB/VVV/VVV/VVV/VVV/VVV/BBB BBB/VVV/VVV/VVV/VVV/VVV/BBB BBB/VVV/VVV/VVV/VVV/VVV/BBB" out="***/LLL/LLL/LLL/LLL/LLL/*** ***/LLL/LLL/LLL/LLL/LLL/*** ***/LLL/LLL/LLL/LLL/LLL/*** ***/LLL/LLL/LLL/LLL/LLL/*** ***/LLL/LLL/LLL/LLL/LLL/*** ***/LLL/LLL/LLL/LLL/LLL/***"/></one>
        <prl in="V" out="P"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="#000000" name="aria"/>
  <color symbol="E" value="#6E8B4E" name="erba" hidden="True"/>
  <color symbol="H" value="#8A7F70" name="centro"/>
  <color symbol="h" value="#9A8F7C" name="pavimento del mastio" area="keep"/>
  <color symbol="s" value="#A89878" name="zona della scala"/>
  <color symbol="w" value="#B4AA96" name="muro del mastio"/>
  <color symbol="m" value="#B0A58C" name="ingresso"/>
  <color symbol="d" value="#5A3A22" name="porta del mastio"/>
  <color symbol="c" value="#C2B280" name="cortile" area="courtyard"/>
  <color symbol="W" value="#6F6C66" name="cinta muraria"/>
  <color symbol="t" value="#8C5A4A" name="torre"/>
  <color symbol="G" value="#A0463A" name="portale"/>
  <color symbol="n" value="#B8AA8A" name="selciato"/>
  <color symbol="r" value="#A89468" name="strada"/>
  <color symbol="Q" value="#4A7FA0" name="acqua del pozzo" area="courtyard"/>
  <color symbol="q" value="#7A5A3A" name="bordo del pozzo"/>
  <color symbol="v" value="#7A5A3A" name="caserma"/>
  <color symbol="a" value="#8A6A44" name="sala lunga"/>
  <color symbol="f" value="#A67C52" name="assi del mastio" area="keep"/>
  <color symbol="F" value="#8B6A44" name="solaio"/>
  <color symbol="P" value="#CFC4A8" name="intonaco"/>
  <color symbol="V" value="#BDB093" name="fascia delle finestre"/>
  <color symbol="L" value="#3E5C7A" name="finestra"/>
  <color symbol="R" value="#5E6A78" name="terrazza del mastio"/>
  <color symbol="M" value="#8E8A82" name="merlo"/>
  <color symbol="X" value="#7A776F" name="muro della cinta"/>
  <color symbol="Y" value="#9C5B47" name="torre di mattoni" area="tower"/>
  <color symbol="Z" value="#B04A3A" name="torre del portale" area="gate"/>
  <color symbol="K" value="#7A5A3A" name="legno"/>
  <color symbol="J" value="#B5523B" name="tegole"/>
  <color symbol="k" value="#8E7B63" name="gradini"/>
  <color symbol="T" value="#8E7B63" name="traccia della scala" hidden="True"/>
  <color symbol="O" value="#6B4A2B" name="porta"/>
  <color symbol="o" value="#4A3220" name="assi della porta"/>
  <color symbol="N" value="#5E5A54" name="stipite"/>
  <color symbol="U" value="#1E1E22" name="feritoia"/>
  <color symbol="#20" value="#000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="#000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
