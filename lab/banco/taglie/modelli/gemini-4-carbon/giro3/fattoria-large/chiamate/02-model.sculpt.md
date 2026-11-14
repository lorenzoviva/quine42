# model.sculpt · gemini-4-carbon · 56 s

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

## Your program so far
<!--
Concept: Fattoria (Italian medieval farmhouse).
Parts and plan letters:
- Main farmhouse body (h interior floor, s stair zone 4x2 along back wall, w stone/plaster walls, d front door 3 cells wide). Centered near H, 9 or 10 wide, 7 or 8 deep (golden ratio ~ 8:5).
- Front porch / lean-to (p): 4 cells (20 voxels) deep along the front wall, flanking and sheltering the front entrance.
- Side barn / stable wing (a floor, v brick/wood walls, e internal doorway): attached to either the left or right wall of the main house, chosen by seed.
- Farmyard (c) & front road (r): gravel/cobble yard connecting the front porch to the road leading straight to the front edge, expanding around the house where ground allows.
- Haystack (y): placed behind the house or wing, connected to the yard.
- At Huge / Gargantuan sizes (where 6+ cells of open ground remain beyond the house and yard):
  - Yard expands outward and wraps around, enclosed by a low wooden fence (z) with a gate opening on the road.
  - Stone silo / dovecote tower (t interior, u stone wall with battlements) rises at a rear corner of the expanded yard.
  - Well (q) in a 5x5 clearing of the expanded yard.
  - Cultivated vegetable fields / furrows (g) and orchard trees (j) outside the fence or in the outer farmstead.
Seeds vary: house width/depth (9-10 x 7-8), side of the barn wing (left or right) and its offset, position of the haystack, corner of the dovecote tower, well placement, field and tree placement.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdpavecryztuqgj" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse interior (h): 9 or 10 wide, 7 or 8 deep around H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="E/h/h/h/h/h" out="*/h/*/*/*/*" p="0.5" steps="1" symmetry="()"/>
      <all in="hE/*h" out="*h/**"/>
      <prl in="H" out="h"/>

      <!-- Main house walls (w) -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone (s): 4 long (x) and 2 wide (y) along back wall, with 2 cells landing on small-x and floor on large-x -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Front door (d) in the middle of the front wall (3 cells wide) and road (r) straight to the front edge -->
      <one in="whhhw/wwwww/EEEEE" out="*****/*ddd*/*rrr*" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Front porch / lean-to (p): 4 cells deep (20 voxels) across the front of the house beside the road -->
      <all in="w/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="3"/>
      <all in="pr" out="pp" symmetry="(x)" steps="1"/>
      <!-- Ensure road continues cleanly from front of porch to edge -->
      <all in="d/p" out="*/r" symmetry="()" steps="4"/>

      <!-- Side wing / barn (a interior, v walls, e doorway): on left or right side of the house (where space fits) -->
      <one in="EEEEw/EEEEw/EEEEw/EEEEw/EEEEw/EEEEw" out="*****/***ae/***ae/***ae/***a*/*****" symmetry="(x)" steps="1"/>
      <all in="Ea" out="aa" symmetry="(x)" steps="2"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="[ae]E" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Initial yard (c) around porch, road, and house sides (1-2 cells) -->
      <all in="[prwv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Haystack (y): 2x2 behind the house or barn -->
      <one in="EE/EE/cw/ww" out="**/*y/*c/**" symmetry="(x)" steps="1"/>
      <all in="yE" out="*y" steps="1"/>
      <all in="yE/*y" out="*y/**"/>
      <all in="yE" out="*c" steps="1"/>

      <!-- Larger size expansion: where at least 6 cells of ground remain, expand the farmyard (c) into a wide rectangle -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Wooden fence (z) around the expanded yard only when room remains outside it -->
      <all in="cEE" out="*z*" steps="1"/>
      <all in="zE/*z" out="*z/**"/>
      <!-- Re-open road through any fence -->
      <all in="r/z" out="*/r" symmetry="()"/>
      <all in="rz" out="rr" symmetry="(x)" steps="1"/>

      <!-- Stone dovecote / silo tower (t interior 2x2, u walls -> 4x4 = 20x20 voxels) in a corner of the expanded yard -->
      <one in="zzzz/zccc/zccc/zccc" out="uuuu/uttu/uttu/uuuu" steps="1"/>

      <!-- Well (q) in a 5x5 open area of the yard (only fits at Huge+) -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Cultivated field plots (g) outside the fence where 5x6 space exists (Huge+) -->
      <one in="zEEEEE/zEEEEE/zEEEEE/zEEEEE/zEEEEE" out="*gggg*/*gggg*/*gggg*/*gggg*/*gggg*" steps="3"/>

      <!-- Orchard trees (j) in 5x5 open patches -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/*cjc*/*****/*****" steps="3"/>
      <!-- Connect isolated trees to nearby yard/fence if adjacent -->
      <all in="[czg]E/jc" out="*c/**" steps="2"/>
    </sequence>
  </map>

  <color symbol="E" value="#7a9a5a" name="erba"/>
  <color symbol="H" value="#ffffff" name="centro"/>
  <color symbol="h" value="#d8c29d" name="pavimento casa" area="house"/>
  <color symbol="s" value="#c49a6c" name="vano scala" area="house"/>
  <color symbol="w" value="#e8dfc8" name="muro intonacato" area="house"/>
  <color symbol="d" value="#7a4b2a" name="ingresso" area="house"/>
  <color symbol="p" value="#b89f7d" name="portico" area="porch"/>
  <color symbol="a" value="#c8b08a" name="fienile" area="barn"/>
  <color symbol="v" value="#b55a3c" name="muro fienile" area="barn"/>
  <color symbol="e" value="#8c5835" name="passaggio fienile" area="barn"/>
  <color symbol="c" value="#c2b59b" name="aia" area="yard"/>
  <color symbol="r" value="#a89f91" name="strada" area="yard"/>
  <color symbol="y" value="#e3b94b" name="pagliaio" area="yard"/>
  <color symbol="z" value="#8a623e" name="staccionata" area="yard"/>
  <color symbol="t" value="#9e988e" name="interno colombaia" area="tower"/>
  <color symbol="u" value="#8c877e" name="muro colombaia" area="tower"/>
  <color symbol="q" value="#5a8ab0" name="pozzo" area="yard"/>
  <color symbol="g" value="#6e5539" name="orto" area="field"/>
  <color symbol="j" value="#4f7d3a" name="albero da frutto" area="orchard"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, s vano scala, w muro intonacato, p portico, a fienile, v muro fienile, e passaggio fienile, c aia, z staccionata, q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
zzzzzzzzzzzzzzzzzzEE
ccccccccccccccccczEE
cccccwwwwwwwwwwwczEE
cccccwhhsssshhhwczEE
cvvvvwhhsssshhhwczEE
cvaaaehhhhhhhhhwczEE
cvaaaehhhhhhhhhwczEE
cvaaaehhhhhhhhhwczEE
cvaaawhhhhhhhhhwczEE
cvvvvwhhhhhhhhhwczEE
cccccwwwwwwwwwwwczEE
cccccpppppppppppczEE
cccccpppppppppppczEE
ccqccpppppppppppczEE
cccccpppppppppppczEE
ccccccccccccccccczEE
EEEEEEEEEEEEEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, s vano scala, w muro intonacato, p portico, a fienile, v muro fienile, e passaggio fienile, c aia, z staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEzzzzzzzzzzzzzzzzz
EEEzcccccccccccccccc
EEEzcwwwwwwwwwwwcccc
EEEzcwhhsssshhhwcccc
EEEzcwhhsssshhhwcccc
EEEzcwhhhhhhhhhwvvvv
EEEzcwhhhhhhhhheaaav
EEEzcwhhhhhhhhheaaav
EEEzcwhhhhhhhhheaaav
EEEzcwhhhhhhhhhwaaav
EEEzcwwwwwwwwwwwvvvv
EEEzcpppppppppppcccc
EEEzcpppppppppppcccc
EEEzcpppppppppppcccc
EEEzcpppppppppppcccc
EEEzcccccccccccccccc
EEEEEEEEEEEEEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, s vano scala, w muro intonacato, p portico, a fienile, v muro fienile, e passaggio fienile, c aia, z staccionata, q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
zzzzzzzzzzzzzzzzzzEE
ccccccccccccccccczEE
cccccwwwwwwwwwwwczEE
cccccwhhsssshhhwczEE
cvvvvwhhsssshhhwczEE
cvaaaehhhhhhhhhwczEE
cvaaaehhhhhhhhhwczEE
cvaaaehhhhhhhhhwczEE
cvaaawhhhhhhhhhwczEE
cvvvvwhhhhhhhhhwczEE
cccccwwwwwwwwwwwczEE
cccccpppppppppppczEE
cccccpppppppppppczEE
ccqccpppppppppppczEE
cccccpppppppppppczEE
ccccccccccccccccczEE
EEEEEEEEEEEEEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, s vano scala, w muro intonacato, p portico, a fienile, v muro fienile, e passaggio fienile, c aia, z staccionata, t interno colombaia, u muro colombaia, q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEuuuuzzzzzzzzzzzzzzzzzzzEEE
EEEEuttucccccccccccccccccczEEE
EEEEuttucccccccccccccccccczEEE
EEEEuuuucccccccccccccccccczEEE
EEEEzccccccccccccccccccccczEEE
EEEEzccccccccccccccccccccczEEE
EEEEzcccccwwwwwwwwwwwccccczEEE
EEEEzcccccwhhsssshhhwccccczEEE
EEEEzcvvvvwhhsssshhhwccqcczEEE
EEEEzcvaaaehhhhhhhhhwccccczEEE
EEEEzcvaaaehhhhhhhhhwccccczEEE
EEEEzcvaaaehhhhhhhhhwccccczEEE
EEEEzcvaaawhhhhhhhhhwccccczEEE
EEEEzcvvvvwhhhhhhhhhwccccczEEE
EEEEzcccccwwwwwwwwwwwccccczEEE
EEEEzcccccpppppppppppccccczEEE
EEEEzcccccpppppppppppccccczEEE
EEEEzcccccpppppppppppccccczEEE
EEEEzcccccpppppppppppccccczEEE
EEEEzccccccccccccccccccccczEEE
EEEEzccccccccccccccccccccczEEE
EEEEzccccccccccccccccccccczEEE
EEEEzccccccccccccccccccccczEEE
EEEEzccccccccccccccccccccczEEE
EEEEzzzzzzzzzzzzzzzzzzzzzzzEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.27 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
Concept: Fattoria (Italian medieval farmhouse).
Corrections from Block 1 plans:
- Front door (d) and road (r) now start reliably from the front middle of the house (from h through w to E) and reach the front edge.
- Porch (p) flanks the road along the front wall (at least 30 wide and 20 deep), with corner/edge wooden posts and roof at 34.
- At Large (20x20): main two-storey farmhouse (h, s, w), front porch (p), side brick barn wing (a, v, e) on left or right, haystack (y) behind, compact farmyard (c) and road (r) to front edge.
- At Huge+ (30x30+): yard expands only where 7+ cells remain on all sides, enclosed by a wooden fence (z) with gate on the road, plus a stone dovecote tower (t, u) with battlements and arrow slits, a stone well (q), cultivated vegetable plots (g) and orchard trees (j).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdpilavecryztuqgj" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse interior (h): 9 or 10 wide, 7 or 8 deep around H, shifted slightly back so front porch & road fit cleanly at Large -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="hE/hE/hE/hE/hE" out="hh/*/*/*/*" p="0.5" steps="1" symmetry="(x)"/>
      <all in="hE/*h" out="*h/**"/>

      <!-- Front door (d, 3 cells = 15 voxels wide) straight south from H, and road (r) to the front edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1" values="BHEhm"/>
      <one in="hhhhh/EEEEE" out="*ddd*/*rrr*" symmetry="()" steps="1"/>
      <prl in="H" out="h"/>

      <!-- Main house walls (w), preserving d -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Ensure d sits cleanly in the front wall (3 wide) with road r straight to the front edge -->
      <one in="hhhhhhh/wwwwwww/EEEEEEE" out="*******/*ddw***/*rrE***" symmetry="()" steps="0"/>
      <one in="hhhhhhh/wwwwwww/EEEEEEE" out="*******/*ddddd*/*rrrrr*" symmetry="()" steps="0"/>
      <one in="hhhhh/wwwww/EEEEE" out="*****/*ddd*/*rrr*" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Stair zone (s): 4 long (x) and 2 wide (y) along back wall, with >=2 cells landing on small-x and floor on large-x -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Front porch / lean-to (p interior, l outer edge for posts): 4 cells deep (20 voxels) across the front wall next to road -->
      <all in="w/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="2"/>
      <all in="p/E" out="*/l" symmetry="()" steps="1"/>

      <!-- Side wing / barn (a interior, v walls, e doorway): on left or right side of the house (chosen by seed) -->
      <one in="EEEEw/EEEEw/EEEEw/EEEEw/EEEEw/EEEEw" out="*****/***ae/***ae/***ae/***a*/*****" symmetry="(x)" steps="1"/>
      <all in="Ea" out="aa" symmetry="(x)" steps="2"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="[ae]E" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Initial yard (c) around house, porch, barn and road (1 cell) -->
      <all in="[prlwv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Keep road clear to the front edge -->
      <all in="r/c" out="*/r" symmetry="()"/>

      <!-- Haystack (y): 2x2 behind the house or barn -->
      <one in="EE/cc/ww" out="yy/cc/**" symmetry="(x)" steps="1"/>
      <all in="yE" out="*c" steps="1"/>

      <!-- Huge+ expansion: only when 7 cells of free ground continue past the yard, expand yard outward -->
      <all in="cEEEEEEE" out="*cccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Wooden fence (z) around expanded yard only where at least 3 cells of ground remain outside -->
      <all in="cEEE" out="*z**" steps="1"/>
      <all in="zE/*z" out="*z/**"/>
      <!-- Road passes cleanly through fence -->
      <all in="r/[cz]" out="*/r" symmetry="()"/>

      <!-- Stone dovecote / silo tower (t interior 2x2, u walls -> 4x4 = 20x20 voxels) in a rear corner of the fenced yard (Huge+) -->
      <one in="zzzz/zccc/zccc/zccc" out="uuuu/uttu/uttu/uuuu" symmetry="(x)" steps="1"/>
      <!-- Doorway into tower from yard -->
      <one in="uttu/uuuu/cccc" out="****/*dd*/****" symmetry="()" steps="1"/>
      <one in="uttu/uuuu/cccc" out="****/*dd*/****" symmetry="(xy)" steps="1"/>

      <!-- Well (q) in a 5x5 open area of the yard (Huge+) -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Cultivated vegetable plots (g) outside fence or yard where 4x5 ground remains (Huge+) -->
      <one in="[cz]EEEE/[cz]EEEE/[cz]EEEE/[cz]EEEE/[cz]EEEE" out="*ggg*/*ggg*/*ggg*/*ggg*/*ggg*" steps="3"/>

      <!-- Orchard trees (j) in 4x4 open ground adjacent to yard/fence/field (Huge+) -->
      <one in="[czg]EEE/[czg]EEE/[czg]EEE/[czg]EEE" out="****/*cj*/*cc*/****" steps="3"/>
    </sequence>

    <map scale="5 5 1" values="BEhswdpilavecryztuqgjfFWVXRJPKLQoONMUkT#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="l" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp" values="plb"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="e" out="eeeee/eeeee/eeeee/eeeee/eeeee"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="z" out="ccccc/czzzc/czzzc/czzzc/ccccc"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="q" out="qqqqq/qQQQq/qQQQq/qQQQq/qqqqq"/>
      <rule in="g" out="ggggg/ggggg/ccccc/ggggg/ggggg"/>
      <rule in="j" out="ccccc/ccjcc/cjjjc/ccjcc/ccccc"/>

      <sequence symmetry="(xy)" values="BEhswdpblavecryztuqgjfFWVXRJPKLQoONMUkT#90#91#92#94#20#21">
        <!-- Unions for imported parts -->
        <union symbol="+" values="WVXu"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="X"/>

        <!-- ================= B. HEIGHTS (COLUMNS BY STEPS) ================= -->

        <!-- Main house walls (w) & front door column (d): 2 storeys = 64 high, plus roof base R at z=64 -->
        <!-- Ground floor wall: 6 stone plinth (X), 14 window band (i), 12 plaster (W) -->
        <all in="B w" out="w X" steps="6"/>
        <all in="B w" out="w i" steps="14" values="Bwi"/>
        <all in="B w" out="w W" steps="12"/>
        <!-- Upper floor wall: 6 plaster (W), 14 window band (i), 12 plaster (W) -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w i" steps="14" values="Bwi"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- Doorway column (d): z=0 floor f with door seed O above it at z=1, then wall W up to 64, R at top -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="62"/>
        <prl in="d" out="R"/>
        <!-- Wait: part-door expects O on the layer of the floor (z=1 where interior floor is, or z=0? Floor f is at z=1 if h leaves h at z=0 and f at z=1!) -->

        <!-- Main house interior (h) and stair zone (s): keep area letter on z=0, put wood floor f at z=1?
             Wait: in="B h" out="h f" replaces z=0 h with f and puts h at z=1!
             Give f area="house" so z=0 keeps area="house"! That puts floor f at z=0, door O at z=0! -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <!-- z=1: stair strip T on s, air B on h -->
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <!-- z=32: upper floor slab F -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <!-- z=33..63: upper room air (31 clear) -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- z=64: roof ceiling R -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Barn / side wing: 1 tall storey (38 high) with brick walls V and timber gable/hip roof J -->
        <!-- Interior a: z=0 floor f, 37 air, z=38 roof J -->
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="37"/>
        <prl in="a" out="J"/>
        <!-- Barn walls v: 6 stone base X, 16 window band m, 16 brick V, z=38 roof J -->
        <all in="B v" out="v X" steps="6"/>
        <all in="B v" out="v m" steps="16" values="Bvm"/>
        <all in="B v" out="v V" steps="16"/>
        <prl in="v" out="J"/>
        <!-- Internal doorway e between house and barn: z=0 door seed O, then brick wall V up to 63, R at 64 so house wall stays closed above barn -->
        <all in="B e" out="e O" steps="1"/>
        <all in="B e" out="e W" steps="62"/>
        <prl in="e" out="R"/>

        <!-- Front porch / lean-to (p floor, b posts): posts rise 33, porch roof J at z=34 (33 clear > 30!) -->
        <!-- Thin porch posts: shrink 3x3 b to 2x2 or keep 3x3 only at outer corners/spaced -->
        <all in="B b" out="b P" steps="34"/>
        <prl in="b" out="J"/>
        <all in="B p" out="n p" steps="1" values="Bpn"/>
        <all in="B n" out="n B" steps="33" values="Bn"/>
        <prl in="n" out="J" values="nJ"/>

        <!-- Haystack (y): golden stepped dome/mound of hay up to 22 high -->
        <all in="B y" out="y *" steps="14"/>
        <all in="yB" out="*B" steps="1"/>

        <!-- Wooden fence (z): posts & rails 8 high -->
        <all in="B z" out="z P" steps="8"/>
        <prl in="z" out="P"/>

        <!-- Stone dovecote / silo tower (t interior, u stone walls): rises 48 high with flat platform at 47 and walls at 48 for battlements + slits! -->
        <all in="B u" out="u X" steps="48"/>
        <prl in="u" out="X"/>
        <all in="B t" out="t f" steps="1"/>
        <all in="B t" out="t B" steps="46"/>
        <prl in="t" out="F"/>
        <!-- If tower had doorway d next to u, lower any excess R/W above 48 adjacent to X (or clean later) -->

        <!-- Well (q rim, Q water): stone rim 8 high around water -->
        <all in="B q" out="q X" steps="7"/>
        <prl in="q" out="X"/>

        <!-- Vegetable furrows (g): low 2-voxel soil ridges -->
        <all in="B g" out="g *" steps="1"/>

        <!-- Orchard trees (j): trunk 14 high, then rounded foliage canopy -->
        <all in="B j" out="j P" steps="12"/>
        <all in="B j" out="j L" steps="8"/>
        <prl in="j" out="L"/>

        <!-- ================= C. FULL SCALE: PARTS, FACADES, ROOFS ================= -->

        <!-- Narrow O seed in e (barn passage) if >15 wide, keep centered 11-15 wide -->
        <all in="OW" out="*W" steps="0"/>

        <!-- Include the 4 required seed parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in main house walls (band i) -->
        <one steps="18" values="BiQ">
          <rule in="Bi/Bi/Bi/Bi/Bi/Bi Bi/Bi/Bi/Bi/Bi/Bi Bi/Bi/Bi/Bi/Bi/Bi Bi/Bi/Bi/Bi/Bi/Bi Bi/Bi/Bi/Bi/Bi/Bi Bi/Bi/Bi/Bi/Bi/Bi Bi/Bi/Bi/Bi/Bi/Bi Bi/Bi/Bi/Bi/Bi/Bi"
                out="*Q/*Q/*Q/*Q/*Q/*Q *Q/*Q/*Q/*Q/*Q/*Q *Q/*Q/*Q/*Q/*Q/*Q *Q/*Q/*Q/*Q/*Q/*Q *Q/*Q/*Q/*Q/*Q/*Q *Q/*Q/*Q/*Q/*Q/*Q *Q/*Q/*Q/*Q/*Q/*Q *Q/*Q/*Q/*Q/*Q/*Q"/>
        </one>
        <all in="QiiiiB" out="PQQQQB" values="QiBP"/>
        <prl in="i" out="W" values="iW"/>

        <!-- Windows in barn walls (band m) -->
        <one steps="6" values="BmQ">
          <rule in="Bm/Bm/Bm/Bm/Bm Bm/Bm/Bm/Bm/Bm Bm/Bm/Bm/Bm/Bm Bm/Bm/Bm/Bm/Bm Bm/Bm/Bm/Bm/Bm Bm/Bm/Bm/Bm/Bm"
                out="*Q/*Q/*Q/*Q/*Q *Q/*Q/*Q/*Q/*Q *Q/*Q/*Q/*Q/*Q *Q/*Q/*Q/*Q/*Q *Q/*Q/*Q/*Q/*Q *Q/*Q/*Q/*Q/*Q"/>
        </one>
        <all in="QmmmmB" out="PQQQQB" values="QmBP"/>
        <prl in="m" out="V" values="mV"/>

        <!-- Timber horizontal belt course between storeys on plaster wall -->
        <all in="WB/WB" out="PB/**" steps="0"/>

        <!-- Main house hip roof (R): 1-cell eaves overhang, then slope 1 in 2 up to ridge (adds ~12-14 height -> total ~77 tall) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="RB/*R" out="*R/**"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="(xy)"/>

        <!-- Brick chimney (K) on the main roof -->
        <one in="RRR/RRR/RRR BBB/BBB/BBB" out="***/***/*** ***/***/*K*" steps="1" symmetry="(xy)"/>
        <all in="KR/KB" out="KK/**" symmetry="(xy)" steps="1"/>
        <all in="KB/*K" out="KK/**"/>
        <all in="B K" out="K *" steps="8"/>
        <prl in="K" out="X"/>

        <!-- Barn & porch roofs (J): slight overhang and gentle slope where thick -->
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**"
             out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="7" symmetry="(xy)"/>

        <!-- Shape haystack (y) top and tree canopy (L) -->
        <all in="***/*B*/*** *y*/yyy/*y* yyy/yyy/yyy" out="***/*y*/*** ***/***/*** ***/***/***" steps="5" symmetry="(xy)"/>
        <all in="LB" out="*L" steps="3"/>
        <all in="LB/*L" out="*L/**" steps="1"/>

        <!-- Ensure road/porch/yard paving has clean surface -->
        <prl in="U" out="B" steps="0"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm cartoon medieval Italian farmhouse, >= 10 distinct materials, dominant < 50% -->
  <color symbol="E" hidden="True"/>
  <color symbol="f" value="#c8a878" name="impiantito in legno" area="house"/>
  <color symbol="F" value="#b89664" name="solaio in legno"/>
  <color symbol="W" value="#e8dec6" name="muro intonacato"/>
  <color symbol="X" value="#8f8a80" name="pietra grigia" area="tower"/>
  <color symbol="V" value="#b85d40" name="mattone cotto" area="barn"/>
  <color symbol="R" value="#a8462c" name="coppi rossi"/>
  <color symbol="J" value="#964c32" name="tettoia in tegole"/>
  <color symbol="P" value="#6e4b2c" name="trave di quercia"/>
  <color symbol="K" value="#9e4730" name="comignolo in mattoni"/>
  <color symbol="Q" value="#5b89a6" name="vetro e acqua" area="yard"/>
  <color symbol="L" value="#58853e" name="chioma d'albero" area="orchard"/>
  <color symbol="p" value="#bfa988" name="lastricato del portico" area="porch"/>
  <color symbol="c" value="#cfc2a8" name="terra battuta dell'aia" area="yard"/>
  <color symbol="r" value="#b5aa96" name="sentiero" area="yard"/>
  <color symbol="y" value="#dfb449" name="covone di paglia" area="yard"/>
  <color symbol="g" value="#6b5136" name="terra coltivata" area="field"/>

  <!-- Imported parts' symbols -->
  <color symbol="O" value="#7a4c2a" name="porta di legno"/>
  <color symbol="o" value="#54331b" name="assi della porta"/>
  <color symbol="N" value="#787268" name="stipite in pietra"/>
  <color symbol="k" value="#9e7649" name="gradini in legno"/>
  <color symbol="T" hidden="True"/>
  <color symbol="M" value="#8f8a80" name="merlo in pietra"/>
  <color symbol="U" value="#2b2927" name="feritoia"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>

  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>
```
