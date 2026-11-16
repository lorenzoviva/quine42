# model.sculpt · claude-opus-5-5 · 124 s

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
Forte. Parts and letters on the plan:
  h the hall of the keep (interior), w the walls of the keep, s the stair zone inside the keep (along its back wall)
  a/v the hall and walls of a side wing on the keep (only where the ground has room: Huge and above)
  c the courtyard around the keep, W the curtain wall ring two cells thick around the yard
  t the corner towers (3 x 3), set in the corners of the ring
  d the keep door, n the paving across the yard, G the gatehouse through the ring, r the road to the edge
  Q the well in the yard (only where a 5 x 5 of yard is free)
Relations: the keep sits on H; the yard rings it; the curtain wall rings the yard; towers hold the corners.
The gate, paving and keep door lie on the front axis.
Seeds change: the keep's depth (+1 by chance), the wing's side and its place along that side, the yard's growth,
and whether a well fits.
Sizes: Large holds the keep in a thin yard, the ring and 4 towers.
Huge adds the wing, a wider yard and the well.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavcWtdnGrQm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- keep body -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- wing, only where nine cells of ground lie beside the keep -->
      <one in="EEEEEEEEEw/EEEEEEEEEw/EEEEEEEEEw/EEEEEEEEEw/EEEEEEEEEw" out="**********/**********/********a*/**********/**********" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <!-- courtyard, growing where the ground goes on -->
      <all in="[wv]E" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*cccc***" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- curtain wall, two cells thick -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- corner towers inside the ring -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="tW" out="*t"/><rule in="t*/*W" out="**/*t"/></all>
      <!-- the gate axis to the front -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- stair zone along the back wall of the keep -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- well, where the yard is wide enough -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="h" value="b89a6a" name="sala del mastio" area="keep"/>
  <color symbol="w" value="8a8478" name="muro del mastio"/>
  <color symbol="s" value="a0784a" name="scala"/>
  <color symbol="a" value="c2a878" name="sala dell'ala" area="hall"/>
  <color symbol="v" value="958e80" name="muro dell'ala"/>
  <color symbol="c" value="9aa86a" name="cortile" area="courtyard"/>
  <color symbol="W" value="7a7468" name="cinta muraria"/>
  <color symbol="t" value="6a645a" name="torre" area="tower"/>
  <color symbol="d" value="5a3a22" name="porta del mastio"/>
  <color symbol="n" value="b0a890" name="selciato"/>
  <color symbol="G" value="4a4038" name="porta della cinta"/>
  <color symbol="r" value="c8b48a" name="strada"/>
  <color symbol="Q" value="5a8ab0" name="pozzo"/>
  <color symbol="H" value="ff0000" name="centro"/>
  <color symbol="m" value="ff00ff" name="segno"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h sala del mastio, w muro del mastio, s scala, c cortile, W cinta muraria, t torre, d porta del mastio, n selciato, G porta della cinta, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEtttWWWWWWWWWtttEE
EEEtttWWWWWWWWWtttEE
EEEttcccccccccccttEE
EEEWWcwwwwwwwwwcWWEE
EEEWWcwhhsssshwcWWEE
EEEWWcwhhsssshwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwwwdddwwwcWWEE
EEEttccccnnnccccttEE
EEEtttWWWGGGWWWtttEE
EEEtttWWWGGGWWWtttEE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h sala del mastio, w muro del mastio, s scala, c cortile, W cinta muraria, t torre, d porta del mastio, n selciato, G porta della cinta, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEtttWWWWWWWWWtttEE
EEEtttWWWWWWWWWtttEE
EEEttcccccccccccttEE
EEEWWcwwwwwwwwwcWWEE
EEEWWcwhhsssshwcWWEE
EEEWWcwhhsssshwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwwwdddwwwcWWEE
EEEttccccnnnccccttEE
EEEtttWWWGGGWWWtttEE
EEEtttWWWGGGWWWtttEE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h sala del mastio, w muro del mastio, s scala, c cortile, W cinta muraria, t torre, d porta del mastio, n selciato, G porta della cinta, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEtttWWWWWWWWWtttEE
EEEtttWWWWWWWWWtttEE
EEEttcccccccccccttEE
EEEWWcwwwwwwwwwcWWEE
EEEWWcwhhsssshwcWWEE
EEEWWcwhhsssshwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwwwdddwwwcWWEE
EEEttccccnnnccccttEE
EEEtttWWWGGGWWWtttEE
EEEtttWWWGGGWWWtttEE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h sala del mastio, w muro del mastio, s scala, a sala dell'ala, v muro dell'ala, c cortile, W cinta muraria, t torre, d porta del mastio, n selciato, G porta della cinta, r strada, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEtttWWWWWWWWWWWWWWWWWtttEEE
EEEEtttWWWWWWWWWWWWWWWWWtttEEE
EEEEttcccccccccccccccccccttEEE
EEEEWWcccccccccccccccccccWWEEE
EEEEWWcccccccccccccccccccWWEEE
EEEEWWcccccccccccccccccccWWEEE
EEEEWWcccccccccccccccccccWWEEE
EEEEWWcvvvvccccccccccccccWWEEE
EEEEWWcvaaawwwwwwwwwcccccWWEEE
EEEEWWcvaaawhhsssshwcccccWWEEE
EEEEWWcvaaawhhsssshwcccccWWEEE
EEEEWWcvaaawhhhhhhhwcccccWWEEE
EEEEWWcvaaawhhhhhhhwcccccWWEEE
EEEEWWcvvvvwhhhhhhhwcccccWWEEE
EEEEWWcccccwhhhhhhhwcccccWWEEE
EEEEWWcccccwwwdddwwwcccccWWEEE
EEEEWWccccccccnnnccccccccWWEEE
EEEEWWccccccccnnnccccccccWWEEE
EEEEWWccccQcccnnnccccccccWWEEE
EEEEWWccccccccnnnccccccccWWEEE
EEEEttccccccccnnnccccccccttEEE
EEEEtttWWWWWWWGGGWWWWWWWtttEEE
EEEEtttWWWWWWWGGGWWWWWWWtttEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
Forte. Plan letters: h keep hall, w keep wall, s stair zone, d keep door, a/v wing hall and walls (Huge),
c courtyard, W curtain wall two cells thick, t corner towers, b the great tower on one random corner,
G gatehouse, n paving, r road, Q well (Huge).
Relations: keep on H; yard around it; ring around the yard; towers on its corners; gate, paving and door on the front axis.
Seeds change: keep depth (front and back ends), which corner holds the great tower, wing side, well place.
Large: keep, ring, towers, great tower. Huge: also the wing, a wide yard and the well.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavcWtbdnGrQm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="EEEEEEEEEw/EEEEEEEEEw/EEEEEEEEEw/EEEEEEEEEw/EEEEEEEEEw" out="**********/**********/********a*/**********/**********" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <all in="[wv]E" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*cccc***" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="tW" out="*t"/><rule in="t*/*W" out="**/*t"/></all>
      <one in="t" out="b" steps="1"/>
      <all in="bt" out="*b"/>
      <all in="bE" out="*b" steps="1"/><all in="bE/*b" out="*b/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhswdavcxtbGrqnfFTPRLUOoNMkWXZAYVQg" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="Q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="1"/>
        <prl in="w" out="W"/>
        <all in="B d" out="d O" steps="1"/><all in="B d" out="d W" steps="64"/><prl in="d" out="W"/>
        <all in="B x" out="x X" steps="23"/><prl in="x" out="X"/>
        <all in="B t" out="t Z" steps="39"/><prl in="t" out="Z"/>
        <all in="B b" out="b A" steps="51"/><prl in="b" out="A"/>
        <all in="B G" out="G O" steps="1"/><all in="B G" out="G Y" steps="34"/><prl in="G" out="Y"/>
        <all in="B q" out="q Q" steps="5"/><prl in="q" out="Q"/>
        <all in="B v" out="v V" steps="32"/><prl in="v" out="R"/>
        <all in="B a" out="a g" steps="1"/><all in="B a" out="a B" steps="31"/><prl in="a" out="R"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="P"/><rule in="s" out="P"/></prl>
        <union symbol="+" values="WXZAYV"/>
        <union symbol="%" values="XZAY"/>
        <union symbol="=" values="fFgP"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="c" hidden="True" area="courtyard"/>
  <color symbol="f" value="a87a48" name="assito del mastio" area="keep"/>
  <color symbol="g" value="b08a58" name="pavimento dell'ala" area="hall"/>
  <color symbol="F" value="8a6a44" name="solaio"/>
  <color symbol="P" value="9a9488" name="terrazza del mastio"/>
  <color symbol="n" value="b0a890" name="selciato" area="courtyard"/>
  <color symbol="r" value="c8b48a" name="strada"/>
  <color symbol="W" value="c8bca4" name="muro del mastio"/>
  <color symbol="X" value="8a8478" name="cinta muraria"/>
  <color symbol="Z" value="6e685e" name="torre"/>
  <color symbol="A" value="5e5850" name="torre maestra"/>
  <color symbol="Y" value="7a6a58" name="torre della porta"/>
  <color symbol="V" value="d4c8ae" name="muro dell'ala"/>
  <color symbol="R" value="a8442e" name="tetto di coppi"/>
  <color symbol="Q" value="5a7a9a" name="pozzo"/>
  <color symbol="L" value="2e3e58" name="finestra"/>
  <color symbol="U" value="1e1e24" name="feritoia"/>
  <color symbol="M" value="9e988c" name="merli"/>
  <color symbol="O" value="7a4a26" name="porta"/>
  <color symbol="o" value="4a2c18" name="assi della porta"/>
  <color symbol="N" value="3a3028" name="stipiti"/>
  <color symbol="k" value="8a7a68" name="gradini"/>
  <color symbol="T" value="8a7a68" name="scala"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
