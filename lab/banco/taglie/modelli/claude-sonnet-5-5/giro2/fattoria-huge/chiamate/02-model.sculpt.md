# model.sculpt · claude-sonnet-5-5 · 548 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · size huge (7.5 × 7.5 × 6 tiles, 20 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 7.5 × 7.5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 200 × 200 × 160, 10 × 10 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Your program so far
<!-- FATTORIA, block 1: composition on the plan (cell = 5 voxels).
 Parts: house (body h, walls w) around H at the centre; a barn/wing (a, walls v) against a side wall, side chosen by seed;
 a yard (c) in front of the door, paved path (m,d,n) from the house door straight to the front, road r to the edge;
 a lean-to / porch (p) at the front on the axis of the door; hay (y) behind the house; fence ring (f) beyond the yard
 only where ground goes on; trees (t) in free 7x7 lawn; a well (Q) in the yard where 5x5 fits.
 Seeds change: house depth and width by chance, side of the wing, position of trees.
 Size: at 20 cells: house + wing + porch + road; at 30 and 40: yard, fence, trees, well, more. -->
<sequence values="BHEwhavcdnmirfptyQ" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEwhavcdnmirfptyQ" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- house body: 3 behind, 5 in front, maybe one more; 4 each side -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- wing (barn) against a side wall, lower, random side -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- the way out from the centre to the front: door d, yard-paving, road r -->
      <all in="H/i" out="*/m" symmetry="()" steps="1"/>
      <all in="m/i" out="*/m" symmetry="()"/>
      <!-- yard around the house, grown where ground goes on -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="[mc]/E" out="*/r" symmetry="()"/>
      <!-- well in the yard, where 5x5 fits -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- fence beyond the yard, only where ground continues -->
      <all in="cEEEEE" out="*fffff" steps="1" symmetry="(x)"/>
      <!-- trees in free lawn -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="2"/>
    </sequence>
  </map>
  <color symbol="B" value="000000" name="aria"/>
  <color symbol="E" value="7BA05B" name="erba" hidden="True"/>
  <color symbol="H" value="C9A66B" name="centro" area="house"/>
  <color symbol="h" value="C9A66B" name="casa" area="house"/>
  <color symbol="w" value="E8DCC0" name="muro" area="house"/>
  <color symbol="a" value="B5895A" name="fienile" area="barn"/>
  <color symbol="v" value="9C6B43" name="muro fienile" area="barn"/>
  <color symbol="c" value="A9C27A" name="aia" area="yard"/>
  <color symbol="d" value="8B5A2B" name="porta" area="house"/>
  <color symbol="n" value="B8B0A0" name="lastrico" area="yard"/>
  <color symbol="m" value="B8B0A0" name="sentiero" area="yard"/>
  <color symbol="i" value="7BA05B" name="marcatore"/>
  <color symbol="r" value="C8B58A" name="strada" area="yard"/>
  <color symbol="f" value="6B4A2B" name="recinto" area="field"/>
  <color symbol="p" value="6B4A2B" name="portico" area="porch"/>
  <color symbol="t" value="3F7A3A" name="albero" area="orchard"/>
  <color symbol="y" value="D8B94A" name="fieno" area="barn"/>
  <color symbol="Q" value="5A7FA8" name="pozzo" area="yard"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, w muro, h casa, a fienile, v muro fienile, c aia, r strada, f recinto, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
fffffcccccccccccccccccccccEEEE
fffffcccccccccccccccccccccEEEE
fffffcccccccccccccccccccccEEEE
fffffcccccccccccccccccccccEEEE
fffffcccccccccccccccccccccEEEE
fffffccQccwwwwwwwwwwwcccccEEEE
fffffcccccwhhhhhhhhhwcccccEEEE
fffffcccccwhhhhhhhhhwcccccEEEE
fffffcccccwhhhhhhhhhwcccccEEEE
fffffcccccwhhhhHhhhhwcccccEEEE
fffffcccccwhhhhhhhhhwvvvvrEEEE
fffffcccccwhhhhhhhhhwaaavEEEEE
fffffcccccwhhhhhhhhhwaaavEEEEE
fffffcccccwhhhhhhhhhwaaavEEEEE
fffffcccccwhhhhhhhhhwaaavEEEEE
fffffcccccwwwwwwwwwwwaaavEEEEE
fffffccccccccccccccccvvvvEEEEE
fffffccccccccccccccccfffffEEEE
fffffccccccccccccccccfffffEEEE
fffffccccccccccccccccfffffEEEE
fffffccccccccccccccccfffffEEEE
EEEEErrrrrrrrrrrrrrrrEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, w muro, h casa, a fienile, v muro fienile, c aia, r strada, f recinto, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
fffffcccccccccccccccccccccEEEE
fffffcccccccccccccccccccccEEEE
fffffcccccccccccccccccccccEEEE
fffffcccccccccccccccccccccEEEE
fffffcccccccccccccccccccccEEEE
fffffcccccwwwwwwwwwwwcccccEEEE
fffffcccccwhhhhhhhhhwcccccEEEE
fffffcccccwhhhhhhhhhwcccccEEEE
fffffcccccwhhhhhhhhhwcccccEEEE
fffffcccccwhhhhHhhhhwcccccEEEE
fffffcccccwhhhhhhhhhwvvvvrEEEE
fffffcccccwhhhhhhhhhwaaavEEEEE
fffffcccccwhhhhhhhhhwaaavEEEEE
fffffcccccwhhhhhhhhhwaaavEEEEE
fffffcccccwhhhhhhhhhwaaavEEEEE
fffffcccccwwwwwwwwwwwaaavEEEEE
fffffccQcccccccccccccvvvvEEEEE
fffffccccccccccccccccfffffEEEE
fffffccccccccccccccccfffffEEEE
fffffccccccccccccccccfffffEEEE
fffffccccccccccccccccfffffEEEE
EEEEErrrrrrrrrrrrrrrrEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, w muro, h casa, a fienile, v muro fienile, c aia, r strada, f recinto, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
fffffcccccccccccccccccccccEEEE
fffffcccccccccccccccccccccEEEE
fffffccccccccccccccccccQccEEEE
fffffcccccccccccccccccccccEEEE
fffffcccccccccccccccccccccEEEE
fffffcccccwwwwwwwwwwwcccccEEEE
fffffcccccwhhhhhhhhhwcccccEEEE
fffffcccccwhhhhhhhhhwcccccEEEE
fffffcccccwhhhhhhhhhwcccccEEEE
fffffcccccwhhhhHhhhhwvvvvrEEEE
fffffcccccwhhhhhhhhhwaaavEEEEE
fffffcccccwhhhhhhhhhwaaavEEEEE
fffffcccccwhhhhhhhhhwaaavEEEEE
fffffcccccwhhhhhhhhhwaaavEEEEE
fffffcccccwhhhhhhhhhwaaavEEEEE
fffffcccccwwwwwwwwwwwvvvvEEEEE
fffffccccccccccccccccccccfffff
fffffccccccccccccccccccccfffff
fffffccccccccccccccccccccfffff
fffffccccccccccccccccccccfffff
fffffccccccccccccccccccccfffff
EEEEErrrrrrrrrrrrrrrrrrrrEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E erba, w muro, h casa, a fienile, v muro fienile, c aia, r strada, f recinto, t albero, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEtEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEfffffcccccccccccccccccccccfffffEEEE
EEEEEfffffcccccccccccccccccccccfffffEEEE
EEEEEfffffcccccccccccccccccccccfffffEEEE
EEEEEfffffcccccccccccccccccccccfffffEEEE
EEEEEfffffcccccccccccccccccccccfffffEEEE
EEEEEfffffccQccwwwwwwwwwwwcccccfffffEEEE
EEEEEfffffcccccwhhhhhhhhhwcccccfffffEEEE
EEEEEfffffcccccwhhhhhhhhhwcccccfffffEEEE
EEEEEfffffcccccwhhhhhhhhhwcccccfffffEEEE
EEEEEfffffcccccwhhhhHhhhhwcccccfffffEEEE
EEEEEfffffcccccwhhhhhhhhhwvvvvrEEEEEEEEE
EEEEEfffffcccccwhhhhhhhhhwaaavEEEEEEEEEE
EEEEEfffffcccccwhhhhhhhhhwaaavEEEEEEEEEE
EEEEEfffffcccccwhhhhhhhhhwaaavEEEEEEEEEE
EEEEEfffffcccccwhhhhhhhhhwaaavEEEEEEEEEE
EEEEEfffffcccccwwwwwwwwwwwaaavEEEEEEtEEE
EEEEEfffffccccccccccccccccvvvvEEEEEEEEEE
EEEEEfffffccccccccccccccccfffffEEEEEEEEE
EEEEEfffffccccccccccccccccfffffEEEEEEEEE
EEEEEfffffccccccccccccccccfffffEEEEEEEEE
EEEEEfffffccccccccccccccccfffffEEEEEEEEE
EEEEEEEEEErrrrrrrrrrrrrrrrEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.07 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEwhavcdnmpqfgytQs" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <prl in="aE" out="*a" p="0.5" steps="1" symmetry="(x)"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <prl in="E/a" out="a/*" p="0.5" steps="1" symmetry="()"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/n" symmetry="()"/>
      <all in="n/E" out="*/n" symmetry="()"/>
      <all in="d/n" out="*/p" symmetry="()"/>
      <all in="p/n" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*q" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <all steps="1"><rule in="[wvpq]E" out="*c"/><rule in="[wvpq]*/*E" out="**/*c"/></all>
      <all steps="2"><rule in="cE" out="*c"/><rule in="c*/*E" out="**/*c"/></all>
      <one in="cc/cc/ww" out="yy/yy/**" symmetry="()" steps="2"/>
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"/>
      <all steps="1"><rule in="cE" out="*f"/><rule in="c*/*E" out="**/*f"/></all>
      <all in="fEEEEEEE" out="*ggggggg" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="4"/>
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****" steps="3"/>
    </sequence>
    <map scale="5 5 1" values="BEhwWUuLRZFTsxONoakAvVcnpPXYJfKlyQjGCk#90#91#92" symmetry="()">
      <union symbol="+" values="WUu"/>
      <union symbol="=" values="ZFA"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="OOOOO/OOOOO/OOOOO/OOOOO/OOOOO"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="q" out="ppppp/pPPPp/pPPPp/pPPPp/ppppp"/>
      <rule in="f" out="EEEEE/EfffE/EfffE/EfffE/EEEEE"/>
      <rule in="g" out="GGGGG/EEEEE/GGGGG/EEEEE/GGGGG"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="t" out="EEEEE/EKKKE/EKKKE/EKKKE/EEEEE"/>
      <rule in="Q" out="QQQQQ/QjjjQ/QjjjQ/QjjjQ/QQQQQ"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <sequence symmetry="(xy)">
        <all in="B O" out="x *" steps="1" symmetry="()"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B x" out="x W" steps="63"/>
        <all in="B v" out="v V" steps="40"/>
        <all in="B a" out="a A" steps="1"/>
        <all in="B a" out="a B" steps="39"/>
        <all steps="1"><rule in="B h" out="h Z"/><rule in="B s" out="s Z"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/><rule in="w" out="R"/><rule in="x" out="R"/><rule in="v" out="R"/><rule in="a" out="R"/></prl>
        <all in="B p" out="Y *" steps="1" symmetry="()"/>
        <all in="B P" out="P X" steps="34"/>
        <all in="B Y" out="Y B" steps="33"/>
        <prl><rule in="Y" out="J"/><rule in="P" out="J"/></prl>
        <all in="B f" out="f f" steps="11"/>
        <all in="B y" out="y y" steps="7"/>
        <all in="B Q" out="Q Q" steps="6"/>
        <all in="B G" out="G G" steps="1"/>
        <all in="B K" out="K K" steps="8"/>
        <all in="B K" out="l *" steps="1"/>
        <all in="lB" out="*l" steps="1"/>
        <all in="B l" out="l l" steps="5"/>
        <import file="part-stair"/>
        <one in="UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB UB/UB/UB/UB/UB/UB" out="L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L*" steps="7"/>
        <one in="uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB" out="L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L*" steps="7"/>
        <all in="LUUUUB" out="*LLLL*"/>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="U" out="W"/><prl in="u" out="W"/>
        <import file="part-door"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="BBB/BBB/BBB RRR/RRR/RRR" out="CCC/CCC/CCC ***/***/***" steps="1" symmetry="()"/>
        <all in="B C" out="C C" steps="11"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" name="aria" hidden="True"/>
  <color symbol="E" value="7BA05B" name="erba" hidden="True"/>
  <color symbol="H" value="C9A66B" name="centro"/>
  <color symbol="h" value="C9A66B" name="casa"/>
  <color symbol="w" value="E8DCC0" name="muro"/>
  <color symbol="a" value="B5895A" name="fienile"/>
  <color symbol="v" value="9C6B43" name="muro fienile"/>
  <color symbol="c" value="A9C27A" name="aia" area="yard"/>
  <color symbol="d" value="8B5A2B" name="porta"/>
  <color symbol="n" value="B8B0A0" name="lastrico" area="yard"/>
  <color symbol="m" value="B8B0A0" name="sentiero"/>
  <color symbol="p" value="C9B58A" name="portico" area="porch"/>
  <color symbol="q" value="6B4A2B" name="palo portico"/>
  <color symbol="f" value="6B4A2B" name="recinto" area="field"/>
  <color symbol="g" value="7A5A33" name="campo"/>
  <color symbol="y" value="D8B94A" name="fieno" area="barn"/>
  <color symbol="t" value="3F7A3A" name="albero"/>
  <color symbol="Q" value="8A8F94" name="pozzo" area="yard"/>
  <color symbol="s" value="C9A66B" name="scala"/>
  <color symbol="W" value="E8DCC0" name="intonaco" area="house"/>
  <color symbol="U" value="E8DCC0" name="fascia bassa"/>
  <color symbol="u" value="E8DCC0" name="fascia alta"/>
  <color symbol="L" value="7FB2D6" name="vetro"/>
  <color symbol="R" value="B5523B" name="tegole"/>
  <color symbol="Z" value="9C6B3C" name="assi" area="house"/>
  <color symbol="F" value="B8B0A0" name="solaio"/>
  <color symbol="T" value="000000" name="segno scala" hidden="True"/>
  <color symbol="k" value="C9B58A" name="gradini"/>
  <color symbol="x" value="E8DCC0" name="testa porta" hidden="True"/>
  <color symbol="O" value="8B5A2B" name="porta" area="house"/>
  <color symbol="o" value="5A3A1E" name="assi porta"/>
  <color symbol="N" value="4A3A2A" name="stipite"/>
  <color symbol="A" value="D9B85A" name="paglia" area="barn"/>
  <color symbol="V" value="9C6B43" name="legno fienile" area="barn"/>
  <color symbol="P" value="6B4A2B" name="testa palo" hidden="True"/>
  <color symbol="X" value="6B4A2B" name="palo" area="porch"/>
  <color symbol="Y" value="000000" name="segno tettoia" hidden="True"/>
  <color symbol="J" value="A8483A" name="tettoia"/>
  <color symbol="K" value="5A3A1E" name="tronco" area="orchard"/>
  <color symbol="l" value="3F7A3A" name="fogliame"/>
  <color symbol="j" value="5A7FA8" name="acqua" area="yard"/>
  <color symbol="G" value="7A5A33" name="solchi" area="field"/>
  <color symbol="C" value="8C4A3A" name="comignolo"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
