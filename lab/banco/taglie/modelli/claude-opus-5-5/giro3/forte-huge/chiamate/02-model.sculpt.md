# model.sculpt · claude-opus-5-5 · 98 s

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
FORTE: a fort, a ring of walls with corner towers, a gate and a keep in the courtyard.
Parts and plan letters:
  h  floor inside the keep, around H at the centre; w the keep walls; x a turret on one corner of the keep (the seed picks the corner)
  s  stair zone inside the keep, along the back wall
  c  courtyard around the keep; W curtain wall, a ring two cells thick around the yard; t corner towers outside the ring
  d  keep door, n paving across the yard, G gatehouse in the ring (taller than the wall), r road to the front edge; all on the axis, three cells wide
  Q  well in the courtyard (only where a 5x5 of yard is free); a moat outside the ring (only where 8 cells of ground go on)
Seeds change the keep depth (the front cell), the turret corner, and the well place.
Huge (30): keep, thin yard, ring, four towers, gate, road.
Gargantuan (40): the yard grows on back and sides, a well is placed in it, and a moat runs around the back and sides.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwxscWtGrdnQam" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the keep body -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- a turret on one corner of the keep -->
      <one in="EE/Ew" out="**/*x" steps="1"/>
      <!-- the courtyard, two cells around the keep -->
      <all in="[wx]E" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- the yard grows where much ground goes on (only the larger size) -->
      <all in="cEEEEEEEEEEE" out="*cccc*******" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- the curtain wall, two cells thick -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- corner towers -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- the way out: door, paving, gatehouse, road -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- the stair zone along a wall of the keep -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- a well where a 5x5 of yard is free -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- a moat where eight cells of ground go on past the ring -->
      <all in="WWEEEEEEEE" out="**aa******" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
    </sequence>
  </map>
  <color symbol="H" value="c8a060" name="centro"/>
  <color symbol="h" value="b08a5a" name="pavimento del mastio"/>
  <color symbol="w" value="9a9488" name="muro del mastio"/>
  <color symbol="x" value="7c776e" name="torretta"/>
  <color symbol="s" value="6a4a30" name="scala"/>
  <color symbol="c" value="c9b98a" name="cortile"/>
  <color symbol="W" value="a8a296" name="mura"/>
  <color symbol="t" value="8a857a" name="torre"/>
  <color symbol="G" value="7a6f60" name="portale"/>
  <color symbol="r" value="b89c6a" name="strada"/>
  <color symbol="d" value="5a3a22" name="porta"/>
  <color symbol="n" value="a09070" name="selciato"/>
  <color symbol="Q" value="4a78a0" name="pozzo"/>
  <color symbol="a" value="5a8ab0" name="fossato"/>
  <color symbol="m" value="ff00ff" name="segno"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, w muro del mastio, x torretta, s scala, c cortile, W mura, t torre, G portale, r strada, d porta, n selciato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEtttttEEEEEEEEEEEEEtttttEEE
EEEEtttttEEEEEEEEEEEEEtttttEEE
EEEEtttttWWWWWWWWWWWWWtttttEEE
EEEEtttttWWWWWWWWWWWWWtttttEEE
EEEEttttcccccccccccccccttttEEE
EEEEEEWWcccccccccccccccWWEEEEE
EEEEEEWWccwwwwwwwwwwwccWWEEEEE
EEEEEEWWccwhhsssshhhwccWWEEEEE
EEEEEEWWccwhhsssshhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwwwwdddwwwxccWWEEEEE
EEEEEEWWccccccnnnccccccWWEEEEE
EEEEttttccccccnnnccccccttttEEE
EEEEtttttWWWWWGGGWWWWWtttttEEE
EEEEtttttWWWWWGGGWWWWWtttttEEE
EEEEtttttEEEEErrrEEEEEtttttEEE
EEEEtttttEEEEErrrEEEEEtttttEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, w muro del mastio, x torretta, s scala, c cortile, W mura, t torre, G portale, r strada, d porta, n selciato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEtttttEEEEEEEEEEEEEtttttEEE
EEEEtttttEEEEEEEEEEEEEtttttEEE
EEEEtttttWWWWWWWWWWWWWtttttEEE
EEEEtttttWWWWWWWWWWWWWtttttEEE
EEEEttttcccccccccccccccttttEEE
EEEEEEWWcccccccccccccccWWEEEEE
EEEEEEWWccwwwwwwwwwwwccWWEEEEE
EEEEEEWWccwhhsssshhhwccWWEEEEE
EEEEEEWWccwhhsssshhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwwwwdddwwwxccWWEEEEE
EEEEEEWWccccccnnnccccccWWEEEEE
EEEEttttccccccnnnccccccttttEEE
EEEEtttttWWWWWGGGWWWWWtttttEEE
EEEEtttttWWWWWGGGWWWWWtttttEEE
EEEEtttttEEEEErrrEEEEEtttttEEE
EEEEtttttEEEEErrrEEEEEtttttEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, w muro del mastio, x torretta, s scala, c cortile, W mura, t torre, G portale, r strada, d porta, n selciato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEtttttEEEEEEEEEEEEEtttttEEE
EEEEtttttEEEEEEEEEEEEEtttttEEE
EEEEtttttWWWWWWWWWWWWWtttttEEE
EEEEtttttWWWWWWWWWWWWWtttttEEE
EEEEttttcccccccccccccccttttEEE
EEEEEEWWcccccccccccccccWWEEEEE
EEEEEEWWccwwwwwwwwwwwccWWEEEEE
EEEEEEWWccwhhsssshhhwccWWEEEEE
EEEEEEWWccwhhsssshhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwhhhhhhhhhwccWWEEEEE
EEEEEEWWccwwwwdddwwwxccWWEEEEE
EEEEEEWWccccccnnnccccccWWEEEEE
EEEEttttccccccnnnccccccttttEEE
EEEEtttttWWWWWGGGWWWWWtttttEEE
EEEEtttttWWWWWGGGWWWWWtttttEEE
EEEEtttttEEEEErrrEEEEEtttttEEE
EEEEtttttEEEEErrrEEEEEtttttEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, w muro del mastio, x torretta, s scala, c cortile, W mura, t torre, G portale, r strada, d porta, n selciato, Q pozzo, a fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEtttttaaaaaaaaaaaaaaaaaaaaatttttEEEE
EEEEEtttttaaaaaaaaaaaaaaaaaaaaatttttEEEE
EEEEEtttttWWWWWWWWWWWWWWWWWWWWWtttttEEEE
EEEEEtttttWWWWWWWWWWWWWWWWWWWWWtttttEEEE
EEEEEttttcccccccccccccccccccccccttttEEEE
EEEEEEEWWcccccccccccccccccccccccWWEEEEEE
EEEEEEEWWccccccccQccccccccccccccWWEEEEEE
EEEEEEEWWcccccccccccccccccccccccWWEEEEEE
EEEEEEEWWcccccccccccccccccccccccWWEEEEEE
EEEEEEEWWcccccccccccccccccccccccWWEEEEEE
EEEEEEEWWccccccwwwwwwwwwwwccccccWWEEEEEE
EEEEEEEWWccccccwhhsssshhhwccccccWWEEEEEE
EEEEEEEWWccccccwhhsssshhhwccccccWWEEEEEE
EEEEEEEWWccccccwhhhhhhhhhwccccccWWEEEEEE
EEEEEEEWWccccccwhhhhhhhhhwccccccWWEEEEEE
EEEEEEEWWccccccwhhhhhhhhhwccccccWWEEEEEE
EEEEEEEWWccccccwhhhhhhhhhwccccccWWEEEEEE
EEEEEEEWWccccccwhhhhhhhhhwccccccWWEEEEEE
EEEEEEEWWccccccwhhhhhhhhhwccccccWWEEEEEE
EEEEEEEWWccccccwhhhhhhhhhwccccccWWEEEEEE
EEEEEEEWWccccccwwwwdddwwwxccccccWWEEEEEE
EEEEEEEWWccccccccccnnnccccccccccWWEEEEEE
EEEEEEEWWccccccccccnnnccccccccccWWEEEEEE
EEEEEEEWWccccccccccnnnccccccccccWWEEEEEE
EEEEEEEWWccccccccccnnnccccccccccWWEEEEEE
EEEEEEEWWccccccccccnnnccccccccccWWEEEEEE
EEEEEttttccccccccccnnnccccccccccttttEEEE
EEEEEtttttWWWWWWWWWGGGWWWWWWWWWtttttEEEE
EEEEEtttttWWWWWWWWWGGGWWWWWWWWWtttttEEEE
EEEEEtttttEEEEEEEEErrrEEEEEEEEEtttttEEEE
EEEEEtttttEEEEEEEEErrrEEEEEEEEEtttttEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
FORTE: a ring of curtain walls with corner towers, a gatehouse on the front axis, a keep in the courtyard.
Plan letters:
  h  keep floor around H; w keep walls; x turret on one corner of the keep; s stair zone along the keep's back wall
  c  courtyard around the keep; W curtain wall, two cells thick; t corner towers
  d  keep door; n paving; G gatehouse in the ring; r road to the front edge (all on the axis, three cells wide)
  Q  well, only where 5x5 of yard is free; a  moat, only where 8 cells of ground go on past the ring
  e  marker: the front of the keep ends here
Seeds change the keep depth, the turret corner, a second turret, and where the well stands.
Huge: keep, thin yard, ring, four towers, gate, road.
Gargantuan: a wider yard with a well, and a moat at the back and sides.
Heights: wall 25, towers 40, gatehouse 48, keep 70 (two storeys), turret 88.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwxscWtGrdnQame" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <one steps="1" symmetry="()"><rule in="h/E" out="*/h"/><rule in="h/E" out="*/e"/></one>
      <prl in="e" out="E"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="EE/Ew" out="**/*x" steps="1"/>
      <one in="EE/Ew" out="**/*x" steps="1"/>
      <all in="[wx]E" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEEE" out="*cccc*******" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="WWEEEEEEEE" out="**aa******" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
    </sequence>
    <map scale="5 5 1" values="BEhswdxvugcnrqaFfTkWbLRCKYMOoNU" symmetry="()">
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="W" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="t" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="G" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="qqqqq/qaaaq/qaaaq/qaaaq/qqqqq"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <!-- keep walls, with the door seed at the foot -->
        <all steps="1"><rule in="B w" out="w W"/><rule in="B d" out="w O"/></all>
        <all in="B w" out="w W" steps="5"/><all in="B w" out="w b" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w b" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <prl in="w" out="W"/>
        <!-- keep floors: planks, stair strip, slab, roof -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- turret, curtain, towers, gatehouse, well -->
        <all in="B x" out="x K" steps="87"/><prl in="x" out="K"/>
        <all in="B v" out="v C" steps="24"/><prl in="v" out="C"/>
        <all in="B u" out="u K" steps="39"/><prl in="u" out="K"/>
        <all in="B g" out="g O" steps="1"/><all in="B g" out="g K" steps="46"/><prl in="g" out="K"/>
        <all in="B q" out="q Y" steps="7"/><prl in="q" out="Y"/>
        <!-- windows of the keep -->
        <one steps="14"><rule in="Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LbbbbB" out="*LLLL*"/>
        <prl in="b" out="W"/>
        <union symbol="+" values="WCK"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="CK"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>
  <color symbol="c" value="c9b98a" hidden="True" area="courtyard"/>
  <color symbol="n" value="a09070" name="selciato" area="courtyard"/>
  <color symbol="r" value="b89c6a" name="strada"/>
  <color symbol="a" value="5a8ab0" name="acqua"/>
  <color symbol="f" value="b08a5a" name="assito" area="keep"/>
  <color symbol="F" value="8a6a44" name="solaio" area="keep"/>
  <color symbol="W" value="d8cfbc" name="muro del mastio"/>
  <color symbol="L" value="3a5070" name="finestra"/>
  <color symbol="R" value="a83a2a" name="tetto in cotto" area="keep"/>
  <color symbol="C" value="a8a296" name="mura"/>
  <color symbol="K" value="857f74" name="pietra delle torri" area="tower"/>
  <color symbol="Y" value="6e6a62" name="pozzo"/>
  <color symbol="M" value="9a9488" name="merli"/>
  <color symbol="U" value="2a2a2a" name="feritoia"/>
  <color symbol="O" value="7a4a28" name="porta"/>
  <color symbol="o" value="4a2c16" name="assi della porta"/>
  <color symbol="N" value="5a4a3a" name="stipite"/>
  <color symbol="T" value="6a4a30" name="scala"/>
  <color symbol="k" value="6a4a30" name="gradini"/>
  <color symbol="#20" value="000000" hidden="True"/>
  <color symbol="#21" value="000000" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
