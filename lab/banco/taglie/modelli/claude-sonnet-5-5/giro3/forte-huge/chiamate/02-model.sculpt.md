# model.sculpt · claude-sonnet-5-5 · 232 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
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
<!--
FORTE: a ring wall with corner towers, a gate, and a keep in the courtyard.
Parts and letters:
 H h  the keep, a body of 9 cells wide around the centre: 2 or 3 cells behind H, 5 in front
 w    walls of the keep
 s    stair zone, in the back-left corner of the keep, with 2 cells of landing before it
 d m  door of the keep, on the axis, 3 wide, through the front wall
 c    yard around the keep
 n    paving across the yard, 3 wide, from the door to the gatehouse
 W    curtain wall, 1 cell thick
 G    gatehouse in the ring, taller than the wall
 r    road from the gate to the edge, 3 wide
 t    towers: 3 or 4 of the 4 outer corners (which ones changes per seed), plus one tower in the middle of a long free side
 a    lean-to (stable) against the ring, 7 × 5, only where the yard is 5 thick
 A v  barracks against the ring, 8 × 8 with walls and an interior of 6 × 6, only where the yard is 8 thick
 Q    well, in a free 5 × 5 of yard
 Y Z  trees (canopy, trunk) on the free ground outside the ring
What the seeds change: the length of the keep behind H, which corners get towers, the side of the middle tower, and where the lean-to, barracks, well and trees go.
What fits:
 Large (20 × 20): keep, a yard 1 thick, a thin ring, gate, road and towers.
 Huge (30 × 30): the yard grows 4 more on every side, so it gets a lean-to and a well.
 Gargantuan (40 × 40): the yard grows 3 more, so it also gets the barracks, and the sides leave room for middle towers.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsmcWtdnGrQaAvYZ" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the keep: a line through H, 2 behind, 5 in front, one more behind by chance; then 4 to each side -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- the zone of the stair: in the back-left corner, two cells of landing before it -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- the yard around the keep, and it grows where the ground goes on past it -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- the ring, one cell thick, corners filled -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- towers on three or four of the outer corners, then grown -->
      <one in="EE/EW" out="**/*t" steps="3"/>
      <one in="EE/EW" out="**/*t" p="0.5" steps="1"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- the way out: through the keep wall (d), across the yard (n), through the ring (G), then the road (r) to the edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>

      <!-- the barracks (8 × 8) against the ring, only where the yard is 8 thick -->
      <one in="WWWWWWWW/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc" out="********/vvvvvvvv/vAAAAAAv/vAAAAAAv/vAAAAAAv/vAAAAAAv/vAAAAAAv/vAAAAAAv/vvvvvvvv" steps="1"/>

      <!-- the lean-to (7 × 5) against the ring, only where the yard is 5 thick -->
      <one in="WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/aaaaaaa/aaaaaaa/aaaaaaa/aaaaaaa/aaaaaaa" steps="1"/>

      <!-- the well in a free 5 × 5 of yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- a tower in the middle of a long free side, where 6 cells of ground go on past the ring -->
      <one in="EEE/EEE/EEE/EEE/EEE/EEE/WWW" out="***/***/***/***/ttt/ttt/ttt" steps="1"/>

      <!-- trees on the free ground outside -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*YYY*/*YZY*/*YYY*/*****" steps="3"/>
    </sequence>
  </map>
  <color symbol="B" value="BFD9E6" name="aria"/>
  <color symbol="E" value="7A9A4B" name="terra"/>
  <color symbol="H" value="B0A090" name="centro del maschio" area="keep"/>
  <color symbol="h" value="C9B38A" name="pavimento del maschio" area="keep"/>
  <color symbol="w" value="9A9288" name="muro del maschio"/>
  <color symbol="s" value="8A6F4E" name="zona della scala"/>
  <color symbol="m" value="C9B38A" name="passaggio"/>
  <color symbol="c" value="A89968" name="cortile" area="courtyard"/>
  <color symbol="W" value="7D7A74" name="cinta"/>
  <color symbol="t" value="5F5C58" name="torre" area="tower"/>
  <color symbol="d" value="5A3A22" name="porta del maschio"/>
  <color symbol="n" value="B9AF9A" name="lastricato"/>
  <color symbol="G" value="6B6761" name="torre di porta"/>
  <color symbol="r" value="B08A5A" name="strada"/>
  <color symbol="Q" value="4F8FB5" name="pozzo"/>
  <color symbol="a" value="A5683A" name="tettoia" area="stable"/>
  <color symbol="A" value="D2B48C" name="pavimento della caserma" area="barracks"/>
  <color symbol="v" value="B4745A" name="muro della caserma"/>
  <color symbol="Y" value="4E8B3A" name="chioma"/>
  <color symbol="Z" value="6B4A2B" name="tronco"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del maschio, E terra, h pavimento del maschio, w muro del maschio, s zona della scala, c cortile, W cinta, t torre, d porta del maschio, n lastricato, G torre di porta, r strada, Q pozzo, a tettoia, A pavimento della caserma, v muro della caserma
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEtttttEEEEEEEEEEEEEEEEEtttttE
EEtttttEEEEEEEEEEEEEEEEEtttttE
EEtttttWWWWWWWWWWWWWWWWWtttttE
EEtttccccccccccvvvvvvvvccctttE
EEtttccccccccccvAAAAAAvccctttE
EEEEWccccccccccvAAAAAAvcccWEEE
EEEEWccccccccccvAAAAAAvcccWEEE
EEEEWaaaaacccccvAAAAAAvcccWEEE
EEEEWaaaaacccccvAAAAAAvcccWEEE
EEEEWaaaaacccccvAAAAAAvcccWEEE
EEEEWaaaaacccccvvvvvvvvcccWEEE
EEEEWaaaaawwwwwwwwwwwcccccWEEE
EEEEWaaaaawhhsssshhhwcccccWEEE
EEEEWaaaaawhhsssshhhwcccccWEEE
EEEEWcccccwhhhhHhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWccQccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwwwwdddwwwwcccccWEEE
EEEEWccccccccnnnnnccccccccWEEE
EEEEWccccccccnnnnnccccccccWEEE
EEEEWccccccccnnnnnccccccccWEEE
EEtttccccccccnnnnncccccccctttE
EEtttccccccccnnnnncccccccctttE
EEtttttWWWWWWGGGGGWWWWWWtttttE
EEtttttEEEEEErrrrrEEEEEEtttttE
EEtttttEEEEEErrrrrEEEEEEtttttE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del maschio, E terra, h pavimento del maschio, w muro del maschio, s zona della scala, c cortile, W cinta, t torre, d porta del maschio, n lastricato, G torre di porta, r strada, Q pozzo, a tettoia, A pavimento della caserma, v muro della caserma
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEtttttEEEEEEEEEEEEEEEEEtttttE
EEtttttEEEEEEEEEEEEEEEEEtttttE
EEtttttWWWWWWWWWWWWWWWWWtttttE
EEtttcccvvvvvvvvcccccccccctttE
EEtttcccvAAAAAAvcccccccccctttE
EEEEWcccvAAAAAAvccccccccccWEEE
EEEEWcccvAAAAAAvccccccccccWEEE
EEEEWcccvAAAAAAvccQcccccccWEEE
EEEEWcccvAAAAAAvccccccccccWEEE
EEEEWcccvAAAAAAvccccccccccWEEE
EEEEWcccvvvvvvvvccccccccccWEEE
EEEEWcccccwwwwwwwwwwwcccccWEEE
EEEEWcccccwhhsssshhhwaaaaaWEEE
EEEEWcccccwhhsssshhhwaaaaaWEEE
EEEEWcccccwhhhhHhhhhwaaaaaWEEE
EEEEWcccccwhhhhhhhhhwaaaaaWEEE
EEEEWcccccwhhhhhhhhhwaaaaaWEEE
EEEEWcccccwhhhhhhhhhwaaaaaWEEE
EEEEWcccccwhhhhhhhhhwaaaaaWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwwwwdddwwwwcccccWEEE
EEEEWccccccccnnnnnccccccccWEEE
EEEEWccccccccnnnnnccccccccWEEE
EEEEWccccccccnnnnnccccccccWEEE
EEtttccccccccnnnnncccccccctttE
EEtttccccccccnnnnncccccccctttE
EEtttttWWWWWWGGGGGWWWWWWtttttE
EEtttttEEEEEErrrrrEEEEEEtttttE
EEtttttEEEEEErrrrrEEEEEEtttttE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del maschio, E terra, h pavimento del maschio, w muro del maschio, s zona della scala, c cortile, W cinta, t torre, d porta del maschio, n lastricato, G torre di porta, r strada, Q pozzo, a tettoia, A pavimento della caserma, v muro della caserma
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEtttttEEEEEEEEEEEEEEEEEtttttE
EEtttttEEEEEEEEEEEEEEEEEtttttE
EEtttttWWWWWWWWWWWWWWWWWtttttE
EEtttccccccccvvvvvvvvccccctttE
EEtttccccccccvAAAAAAvccccctttE
EEEEWccccQcccvAAAAAAvcccccWEEE
EEEEWccccccccvAAAAAAvcccccWEEE
EEEEWccccccccvAAAAAAvcccccWEEE
EEEEWccccccccvAAAAAAvcccccWEEE
EEEEWccccccccvAAAAAAvcccccWEEE
EEEEWccccccccvvvvvvvvcccccWEEE
EEEEWcccccwwwwwwwwwwwcccccWEEE
EEEEWcccccwhhsssshhhwaaaaaWEEE
EEEEWcccccwhhsssshhhwaaaaaWEEE
EEEEWcccccwhhhhHhhhhwaaaaaWEEE
EEEEWcccccwhhhhhhhhhwaaaaaWEEE
EEEEWcccccwhhhhhhhhhwaaaaaWEEE
EEEEWcccccwhhhhhhhhhwaaaaaWEEE
EEEEWcccccwhhhhhhhhhwaaaaaWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwwwwdddwwwwcccccWEEE
EEEEWccccccccnnnnnccccccccWEEE
EEEEWccccccccnnnnnccccccccWEEE
EEEEWccccccccnnnnnccccccccWEEE
EEtttccccccccnnnnncccccccctttE
EEtttccccccccnnnnncccccccctttE
EEtttttWWWWWWGGGGGWWWWWWtttttE
EEtttttEEEEEErrrrrEEEEEEtttttE
EEtttttEEEEEErrrrrEEEEEEtttttE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del maschio, E terra, h pavimento del maschio, w muro del maschio, s zona della scala, c cortile, W cinta, t torre, d porta del maschio, n lastricato, G torre di porta, r strada, Q pozzo, a tettoia, A pavimento della caserma, v muro della caserma, Y chioma, Z tronco
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEYYYEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEYZYEEEEEEEEEEEEEEEEEEEEEEYYYEEEEE
EEEEEEEYYYEEEEEEEEEEEEEEEEEEEEEEYZYEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEYYYEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEtttttEEEEEEEEEEEEEEEEEEEEEEEtttttEEE
EEEEtttttEEEEEEEEEEEEEEEEEEEEEEEtttttEEE
EEEEtttttWWWWWWWWWWWWWWWWWWWWWWWtttttEEE
EEEEtttcccccccccccccvvvvvvvvcccccctttEEE
EEEEtttcccccccccccccvAAAAAAvcccccctttEEE
EEEEEEWcccccccccccccvAAAAAAvccccccWEEEEE
EEEEtttcccccccccccccvAAAAAAvccccccWEEEEE
EEEEtttcccccccccccccvAAAAAAvccccccWEEEEE
EEEEtttcccccccccccccvAAAAAAvccccccWEEEEE
EEEEEEWcccccccccccccvAAAAAAvccccccWEEEEE
EEEEEEWcccccccccccccvvvvvvvvccccccWEEEEE
EEEEEEWccccccccwwwwwwwwwwwccccccccWEEEEE
EEEEEEWccccccccwhhsssshhhwccccccccWEEEEE
EEEEEEWccccccccwhhsssshhhwccccccccWEEEEE
EEEEEEWccccccccwhhhhHhhhhwccccccccWEEEEE
EEEEEEWaaaaacccwhhhhhhhhhwccccccccWEEEEE
EEEEEEWaaaaacccwhhhhhhhhhwccccccccWEEEEE
EEEEEEWaaaaacccwhhhhhhhhhwccccccccWEEEEE
EEYYYEWaaaaacccwhhhhhhhhhwccccccccWEEEEE
EEYZYEWaaaaacccwhhhhhhhhhwccccccccWEEEEE
EEYYYEWaaaaacccwwwwdddwwwwccccccccWEEEEE
EEEEEEWaaaaaccccccnnnnncccccccccccWEEEEE
EEEEEEWcccccccccccnnnnncccccccccccWEEEEE
EEEEEEWcccccccccccnnnnncccccccccccWEEEEE
EEEEEEWcccccccccccnnnnncccccccccccWEEEEE
EEEEEEWcccccccccccnnnnncccccccccccWEEEEE
EEEEEEWcccccccccccnnnnncccccQcccccWEEEEE
EEEEtttcccccccccccnnnnnccccccccccctttEEE
EEEEtttcccccccccccnnnnnccccccccccctttEEE
EEEEtttttWWWWWWWWWGGGGGWWWWWWWWWtttttEEE
EEEEtttttEEEEEEEEErrrrrEEEEEEEEEtttttEEE
EEEEtttttEEEEEEEEErrrrrEEEEEEEEEtttttEEE
EEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.20 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsmcWtdnGrQaAvYZ" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <one in="EE/EW" out="**/*t" steps="3"/>
      <one in="EE/EW" out="**/*t" p="0.5" steps="1"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>

      <one in="WWWWWWWW/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc" out="********/vvvvvvvv/vAAAAAAv/vAAAAAAv/vAAAAAAv/vAAAAAAv/vAAAAAAv/vAAAAAAv/vvvvvvvv" steps="1"/>

      <one in="WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/aaaaaaa/aaaaaaa/aaaaaaa/aaaaaaa/aaaaaaa" steps="1"/>

      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <one in="EEE/EEE/EEE/EEE/EEE/EEE/WWW" out="***/***/***/***/ttt/ttt/ttt" steps="1"/>

      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*YYY*/*YZY*/*YYY*/*****" steps="3"/>
    </sequence>

    <map scale="5 5 1" values="BEHhwsdcWtGnrQaAvYZfgFRXLTkMUOoN" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="A" out="AAAAA/AAAAA/AAAAA/AAAAA/AAAAA"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="Y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="Z" out="ZZZZZ/ZZZZZ/ZZZZZ/ZZZZZ/ZZZZZ"/>
      <sequence symmetry="(xy)">
        <union symbol="+" values="wWtGv"/>
        <union symbol="=" values="fFg"/>
        <union symbol="%" values="WtG"/>

        <!-- B. heights: the keep, two storeys -->
        <all in="B w" out="w w" steps="6"/><all in="B w" out="w X" steps="14"/><all in="B w" out="w w" steps="12"/>
        <all in="B w" out="w w" steps="6"/><all in="B w" out="w X" steps="14"/><all in="B w" out="w w" steps="12"/>
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d w" steps="63"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/><rule in="d" out="R"/></prl>
        <all in="B w" out="* R"/>

        <!-- ring, towers, gate -->
        <all in="B W" out="W W" steps="24"/>
        <all in="B t" out="t t" steps="40"/>
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G G" steps="39"/>

        <!-- barracks, lean-to, well -->
        <all in="B v" out="v v" steps="32"/>
        <all in="B v" out="* R"/>
        <all in="B A" out="A g" steps="1"/>
        <all in="B A" out="A B" steps="31"/>
        <prl in="A" out="R"/>
        <all in="B a" out="a a" steps="14"/>
        <all in="B Q" out="Q Q" steps="8"/>

        <!-- trees -->
        <all in="B Z" out="Z Z" steps="26"/>
        <all in="B Y" out="Y E" steps="1"/>
        <all in="B Y" out="Y B" steps="11"/>
        <all in="B Y" out="Y Y" steps="16"/>

        <!-- C. roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>

        <!-- windows -->
        <one steps="18"><rule in="XXX/BBB XXX/BBB XXX/BBB XXX/BBB XXX/BBB XXX/BBB XXX/BBB XXX/BBB" out="LLL/*** LLL/*** LLL/*** LLL/*** LLL/*** LLL/*** LLL/*** LLL/***"/></one>
        <all in="LXXXXB" out="*LLLL*"/>
        <prl in="X" out="w"/>

        <!-- parts -->
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="BFD9E6" name="aria"/>
  <color symbol="E" value="7A9A4B" name="terra"/>
  <color symbol="H" value="B0A090" name="centro del maschio" area="keep"/>
  <color symbol="h" value="C9B38A" name="pavimento del maschio" area="keep"/>
  <color symbol="w" value="9A9288" name="muro del maschio"/>
  <color symbol="s" value="8A6F4E" name="zona della scala"/>
  <color symbol="m" value="C9B38A" name="passaggio"/>
  <color symbol="c" value="A89968" name="cortile" area="courtyard"/>
  <color symbol="W" value="7D7A74" name="cinta"/>
  <color symbol="t" value="5F5C58" name="torre" area="tower"/>
  <color symbol="d" value="5A3A22" name="porta del maschio"/>
  <color symbol="n" value="B9AF9A" name="lastricato"/>
  <color symbol="G" value="6B6761" name="torre di porta"/>
  <color symbol="r" value="B08A5A" name="strada"/>
  <color symbol="Q" value="4F8FB5" name="pozzo"/>
  <color symbol="a" value="A5683A" name="tettoia" area="stable"/>
  <color symbol="A" value="D2B48C" name="caserma"/>
  <color symbol="v" value="B4745A" name="muro della caserma"/>
  <color symbol="Y" value="4E8B3A" name="chioma"/>
  <color symbol="Z" value="6B4A2B" name="tronco"/>
  <color symbol="f" value="B58A5A" name="assi del pavimento" area="keep"/>
  <color symbol="g" value="D8BC8A" name="pavimento della caserma" area="barracks"/>
  <color symbol="F" value="8C857A" name="solaio"/>
  <color symbol="R" value="B5502E" name="tetto"/>
  <color symbol="X" value="A8A196" name="fascia"/>
  <color symbol="L" value="7FB6D6" name="vetro"/>
  <color symbol="T" value="6E5A3E" name="traccia della scala"/>
  <color symbol="k" value="A07848" name="gradini"/>
  <color symbol="M" value="8F8B84" name="merlo"/>
  <color symbol="U" value="2B2B2B" name="feritoia"/>
  <color symbol="O" value="6B4423" name="porta"/>
  <color symbol="o" value="3E2A1A" name="assi della porta"/>
  <color symbol="N" value="2E2118" name="stipite"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
