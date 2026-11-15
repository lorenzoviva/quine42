# model.sculpt · claude-opus-5-5 · 104 s

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
FORTE. Parts and letters on the plan:
  h  floor of the keep (mastio): a body around H, 2 cells behind, 4 in front plus one by chance, 4 to each side
  w  the keep's walls, its corners filled
  s  the stair zone, inside the keep along a wall, with 2 cells of landing before it
  c  the courtyard, one cell around the keep, larger where the ground allows
  W  the curtain wall, a ring 2 cells thick around the courtyard
  t  the corner towers, on the outer corners of the ring
  d  the door of the keep, n the paving across the yard, G the gatehouse in the ring, r the road to the front edge
  Q  the well, in a free 5 x 5 of courtyard
  b  the barracks, against the ring where 7 x 5 of courtyard is free
  a  the moat, outside the ring, only where the ground goes on past it
Relations: keep in the centre, yard around it, ring around the yard, towers at its corners, gate on the axis of the keep's door,
the well and barracks in the yard as far as possible from the gate, the moat beyond the ring.
Seeds change: the keep's depth, the side and place of the stair, where the well and the barracks stand.
Sizes: 5x5 tiles the keep in a thin yard, ring and towers; 7.5 the yard grows, with the well and the barracks; 10 the moat as well.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwscWtdnGrmQba" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the keep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the stair zone against a wall, with the landing before it -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- the courtyard -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- the curtain wall, two thick -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- the moat, only where ground goes on past the ring -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wa]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
      <!-- the corner towers -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EWa]" out="*t"/><rule in="t*/*[EWa]" out="**/*t"/></all>
      <!-- the way out: door, paving, gatehouse, road -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/[Ea]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="ra" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- the well and the barracks, far from the gate -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"><field for="Q" from="n" on="cn"/></one>
      <one in="WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/*bbbbb*/*bbbbb*/*bbbbb*/*******/*******" steps="1"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="h" value="b8a88a" name="pavimento del mastio" area="keep"/>
  <color symbol="w" value="8a8478" name="muro del mastio"/>
  <color symbol="s" value="a07850" name="zona della scala"/>
  <color symbol="c" value="b9ad7e" name="cortile" area="courtyard"/>
  <color symbol="W" value="9a9488" name="mura di cinta"/>
  <color symbol="t" value="7c766c" name="torre" area="tower"/>
  <color symbol="d" value="6a4a2a" name="porta del mastio"/>
  <color symbol="n" value="a39a88" name="selciato"/>
  <color symbol="G" value="6e685e" name="torre di porta"/>
  <color symbol="r" value="9c8358" name="strada"/>
  <color symbol="Q" value="4f7fa6" name="pozzo"/>
  <color symbol="b" value="a0503a" name="caserma" area="barracks"/>
  <color symbol="a" value="5a86a8" name="fossato"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento del mastio, w muro del mastio, s zona della scala, c cortile, W mura di cinta, t torre, d porta del mastio, n selciato, G torre di porta, r strada, Q pozzo
Plan (the letter of every cell):
```
EEWWWWWWWWWWWWWWWWWE
EEWWWWWWWWWWWWWWWWWE
EEWWcccccccccccccWWE
EEWWcccccccccccccWWE
EEWWccccccQccccccWWE
EEWWcccccccccccccWWE
EEWWcccccccccccccWWE
EEWWcwwwwwwwwwwwcWWE
EEWWcwhhsssshhhwcWWE
EEWWcwhhsssshhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwwwwdddwwwwcWWE
ttttcccccnnncccccttt
tttttWWWWGGGWWWWtttt
tttttWWWWGGGWWWWtttt
tttttEEEEErEEEEEtttt
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento del mastio, w muro del mastio, s zona della scala, c cortile, W mura di cinta, t torre, d porta del mastio, n selciato, G torre di porta, r strada, Q pozzo
Plan (the letter of every cell):
```
EEWWWWWWWWWWWWWWWWWE
EEWWWWWWWWWWWWWWWWWE
EEWWcccccccccccccWWE
EEWWcccccccccccccWWE
EEWWccccccQccccccWWE
EEWWcccccccccccccWWE
EEWWcccccccccccccWWE
EEWWcwwwwwwwwwwwcWWE
EEWWcwhhsssshhhwcWWE
EEWWcwhhsssshhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwwwwdddwwwwcWWE
ttttcccccnnncccccttt
tttttWWWWGGGWWWWtttt
tttttWWWWGGGWWWWtttt
tttttEEEEErEEEEEtttt
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento del mastio, w muro del mastio, s zona della scala, c cortile, W mura di cinta, t torre, d porta del mastio, n selciato, G torre di porta, r strada, Q pozzo
Plan (the letter of every cell):
```
EEWWWWWWWWWWWWWWWWWE
EEWWWWWWWWWWWWWWWWWE
EEWWcccccccccccccWWE
EEWWcccccccccccccWWE
EEWWccccccQccccccWWE
EEWWcccccccccccccWWE
EEWWcccccccccccccWWE
EEWWcwwwwwwwwwwwcWWE
EEWWcwhhsssshhhwcWWE
EEWWcwhhsssshhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwwwwdddwwwwcWWE
ttttcccccnnncccccttt
tttttWWWWGGGWWWWtttt
tttttWWWWGGGWWWWtttt
tttttEEEEErEEEEEtttt
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento del mastio, w muro del mastio, s zona della scala, c cortile, W mura di cinta, t torre, d porta del mastio, n selciato, G torre di porta, r strada, Q pozzo, b caserma
Plan (the letter of every cell):
```
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
Ettttccccccccccccccccccccctttt
EEEWWcccccccccccccccccccccWWEE
EEEWWccccccccccQccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWccccccccccccccccccbbbWWEE
EEEWWccccccccccccccccccbbbWWEE
EEEWWcccccwwwwwwwwwwwccbbbWWEE
EEEWWcccccwhhsssshhhwccbbbWWEE
EEEWWcccccwhhsssshhhwccbbbWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwwwwdddwwwwcccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
Ettttcccccccccnnnccccccccctttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttEEEEEEEEErEEEEEEEEEttttt
EtttttEEEEEEEEErEEEEEEEEEttttt
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
FORTE. Parts and letters on the plan:
  h  floor of the keep (mastio): a body around H, 2 cells behind, 4 in front plus one by chance, 4 to each side
  w  the keep's walls, corners filled; d the keep's door in its front wall
  s  the stair zone, inside the keep along the back wall, with 2 cells of landing before it
  c  the courtyard around the keep, larger where the ground allows
  W  the curtain wall, a ring 2 cells thick; G the gatehouse on the axis of the keep's door
  t  the corner towers; u one tower, at a random corner, taller (the donjon of the watch)
  n  the paving, r the road to the front edge
  Q  the well, b the barracks against the ring (rotated by chance), a the moat beyond the ring
Seeds change: which corner holds the tall tower, where the well and the barracks stand, the keep's depth.
Sizes: 5x5 the keep in a thin yard with ring and towers; 7.5 the yard grows with well and barracks; 10 the moat too.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwscWtudnGrmQba" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wa]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EWa]" out="*t"/><rule in="t*/*[EWa]" out="**/*t"/></all>
      <one in="t" out="u" steps="1"/>
      <all in="ut" out="*u"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/[Ea]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="ra" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/*bbbbb*/*bbbbb*/*bbbbb*/*******/*******" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwscgtuDnGrqvbaPILfFRYZMOoNTkAJV#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="qqqqq/qvvvq/qvvvq/qvvvq/qqqqq"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <sequence symmetry="(xy)">
        <!-- B. keep walls and its door -->
        <all in="B D" out="D O" steps="1"/>
        <all in="B w" out="w P" steps="1"/>
        <prl in="D" out="w"/>
        <all in="B w" out="w P" steps="5"/><all in="B w" out="w I" steps="14"/><all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="6"/><all in="B w" out="w I" steps="14"/><all in="B w" out="w P" steps="13"/>
        <prl in="w" out="P"/>
        <!-- keep floors, stair strip, slab, roof platform -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- curtain, gatehouse, towers -->
        <all in="B g" out="g Y" steps="24"/><prl in="g" out="Y"/>
        <all in="B G" out="G O" steps="1"/><all in="B G" out="G Z" steps="40"/><prl in="G" out="Z"/>
        <all in="B t" out="t Z" steps="40"/><prl in="t" out="Z"/>
        <all in="B u" out="u Z" steps="56"/><prl in="u" out="Z"/>
        <!-- barracks with a hip roof, the well -->
        <all in="B b" out="b A" steps="21"/><prl in="b" out="J"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <all in="B q" out="q V" steps="6"/><prl in="q" out="V"/>
        <!-- C. windows of the keep -->
        <one steps="14"><rule in="BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI BI/BI/BI/BI/BI/BI" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LIIIIB" out="*LLLL*"/>
        <prl in="I" out="P"/>
        <union symbol="+" values="PYZ"/>
        <union symbol="%" values="YZ"/>
        <union symbol="=" values="fF"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="c" value="b9ad7e" name="cortile" area="courtyard"/>
  <color symbol="f" value="9a7448" name="assito del mastio" area="keep"/>
  <color symbol="F" value="7a5a38" name="solaio"/>
  <color symbol="R" value="8c8a84" name="terrazza del mastio"/>
  <color symbol="P" value="a8a090" name="pietra del mastio"/>
  <color symbol="L" value="2e3440" name="finestra"/>
  <color symbol="Y" value="c2b8a0" name="mura di cinta"/>
  <color symbol="Z" value="7c766c" name="pietra delle torri" area="tower"/>
  <color symbol="M" value="9a9488" name="merli"/>
  <color symbol="U" value="1e1e24" name="feritoia"/>
  <color symbol="O" value="7a4a24" name="porta"/>
  <color symbol="o" value="4a2c14" name="assi della porta"/>
  <color symbol="N" value="3a2e24" name="stipiti"/>
  <color symbol="k" value="b08a5a" name="gradini"/>
  <color symbol="T" value="b08a5a" name="scala"/>
  <color symbol="A" value="c9b48a" name="muro della caserma" area="barracks"/>
  <color symbol="J" value="a0503a" name="tetto della caserma"/>
  <color symbol="V" value="8a8478" name="vera del pozzo"/>
  <color symbol="v" value="4f7fa6" name="acqua del pozzo"/>
  <color symbol="n" value="a39a88" name="selciato" area="courtyard"/>
  <color symbol="r" value="9c8358" name="strada"/>
  <color symbol="a" value="5a86a8" name="fossato"/>
  <color symbol="h" value="b8a88a" name="pavimento del mastio"/>
  <color symbol="w" value="8a8478" name="muro del mastio"/>
  <color symbol="s" value="a07850" name="zona della scala"/>
  <color symbol="W" value="9a9488" name="mura"/>
  <color symbol="t" value="7c766c" name="torre"/>
  <color symbol="u" value="6c665c" name="torre alta"/>
  <color symbol="d" value="6a4a2a" name="porta del mastio"/>
  <color symbol="G" value="6e685e" name="torre di porta"/>
  <color symbol="Q" value="4f7fa6" name="pozzo"/>
  <color symbol="b" value="a0503a" name="caserma"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
