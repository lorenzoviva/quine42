# model.sculpt · gemini-4-argon · 45 s

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
<!--
  Concept: Fattoria (Farmstead)
  Parts & Letters:
  - Main farmhouse (h: interior floor, w: masonry wall, s: stair zone, d: front door) around centre H, two storeys with pitched roof.
  - Front porch / lean-to (p: covered porch) along the front wall and entry door.
  - Attached barn / hayloft wing (a: barn floor, v: barn wooden/brick wall, i: internal doorway) on one side of the farmhouse (chosen by seed).
  - Stone silo / dovecote tower (t: tower wall, u: tower interior) attached to a corner of the farmhouse/barn, crowned with battlements & slits.
  - Farmyard (c: dirt/cobble yard, x: wooden fence around yard, r: road to the front edge, q: well in the yard).
  - At larger sizes (Huge / Gargantuan): expanded farmyard, plowed crop fields (g: field) and orchard trees (y: orchard/trees) where ground allows.
  Seeds vary: farmhouse depth (8 or 9 cells), side and position of the barn wing, corner of the dovecote tower, position of the well, placement of fields and orchard trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdapviutcxrqgy" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Farmhouse main body around H: 9 wide (x), 8 or 9 deep (y) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="H" out="h"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone inside farmhouse: along back wall, 2 cells landing before small-x, 4 cells long, 2 wide -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Attached Barn wing on one side (x) of the farmhouse -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/a*/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="4"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- Internal passage between farmhouse and barn -->
      <one in="hwh/awa" out="*i*/*i*" symmetry="(xy)" steps="1"/>

      <!-- Silo / Dovecote tower at an outer corner of the farmhouse or barn -->
      <one in="EE/Ew" out="**/*t" symmetry="(xy)" steps="1"/>
      <all steps="2">
        <rule in="t[Ewv]" out="*t"/>
        <rule in="t*/*[Ewv]" out="**/*t"/>
      </all>
      <all in="ttt/ttt/ttt" out="***/t*t/***"/>

      <!-- Front door (3 cells wide) and road straight to the front edge (+y) -->
      <all in="h/w/E" out="*/d/r" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Front porch (lean-to) along the front wall of the farmhouse -->
      <all in="w/E" out="*/p" symmetry="()" steps="1"/>
      <all in="[dp]r" out="*p" symmetry="(x)" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pr" out="*p" symmetry="(x)" steps="1"/>

      <!-- Farmyard around the buildings -->
      <all in="[wvtpd]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand yard where more ground is available (Huge and Gargantuan) -->
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Well in a 4x4 patch of the yard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" steps="1"/>

      <!-- Wooden fence around the farmyard -->
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- At Gargantuan / where space permits beyond fence: plowed fields (g) and orchard (y) -->
      <all in="xEEEEE" out="*gggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <one in="gggg/gggg/gggg/gggg" out="****/*yy*/*yy*/****" steps="3"/>
    </sequence>
  </map>
  <color symbol="E" value="#7a9a55" name="erba" area="field"/>
  <color symbol="H" value="#d8c29d" name="casa" area="house"/>
  <color symbol="h" value="#d8c29d" name="pavimento casa" area="house"/>
  <color symbol="w" value="#e0d4be" name="muro casa" area="house"/>
  <color symbol="s" value="#bfa37a" name="scala" area="house"/>
  <color symbol="d" value="#7a5230" name="porta" area="house"/>
  <color symbol="a" value="#c9ad7c" name="fienile" area="barn"/>
  <color symbol="v" value="#a64b35" name="muro fienile" area="barn"/>
  <color symbol="i" value="#d8c29d" name="passaggio" area="house"/>
  <color symbol="t" value="#8c877e" name="torre colombaia" area="tower"/>
  <color symbol="u" value="#aba59b" name="interno torre" area="tower"/>
  <color symbol="p" value="#b59267" name="portico" area="porch"/>
  <color symbol="c" value="#c2b088" name="aia" area="yard"/>
  <color symbol="x" value="#6e4f32" name="staccionata" area="yard"/>
  <color symbol="r" value="#b09e78" name="sentiero" area="yard"/>
  <color symbol="q" value="#6b7075" name="pozzo" area="yard"/>
  <color symbol="g" value="#8c6d46" name="campo arato" area="field"/>
  <color symbol="y" value="#4f783b" name="frutteto" area="orchard"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, w muro casa, s scala, d porta, a fienile, v muro fienile, t torre colombaia, c aia, x staccionata, r sentiero, q pozzo, g campo arato, y frutteto
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEExxxxxxxxxxxxxxxxxxxxxxxxxxE
EEExccccccccccccccccccccccccxE
EEExccccccqqccccccccccccccccxE
EEExccccccqqccccccccccccccccxE
EEExccccccccccccccccccccccccxE
EEExcccctttttcccccccccccccccxE
EEExcccctttttcccccccccccccccxE
EEExcccctttttwwwwwwwwvvvvvvcxE
EEExccccttthhsssshhhwaaaaavcxE
EEExccccttthhsssshhhwaaaaavcxE
EEExccccccwhhhhhhhhhwaaaaavcxE
EEExccccccwhhhhhhhhhwaaaaavcxE
EEExccccccwhhhhhhhhhwaaaaavcxE
EEExccccccwhhhhhhhhhwaaaaavcxE
EEExccccccwhhhhhhhhhwvvvvvvcxE
EEExccccccwhhhhhhhhhwcccccccxE
EEExccccccdddddddddddcccccccxE
EEExccccccrrrrrrrrrrrcccccccxE
EEExccccccrrrrrrrrrrrcccccccxE
EEExccccccrrrrrrrrrrrcccccccxE
EEExxxxxxxrrrrrrrrrrrxxxxxxxxE
EEEgggggggrrrrrrrrrrrggggggggE
EEEgyygyygrrrrrrrrrrrggyyggggE
EEEgyygyygrrrrrrrrrrrggyyggggE
EEEgggggggrrrrrrrrrrrggggggggE
EEEEEEEEEErrrrrrrrrrrEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, w muro casa, s scala, d porta, a fienile, v muro fienile, t torre colombaia, c aia, x staccionata, r sentiero, q pozzo, g campo arato, y frutteto
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEExxxxxxxxxxxxxxxxxxxxxxxxxxE
EEExccccccccccccccccccccccccxE
EEExccccccccccccccccccccccccxE
EEExccccccccccccccccccccccccxE
EEExcqqcccccccccccccccccccccxE
EEExcqqctttttcccccccccccccccxE
EEExcccctttttcccccccccccccccxE
EEExcccctttttwwwwwwwwcccccccxE
EEExccccttthhsssshhhwvvvvvvcxE
EEExccccttthhsssshhhwaaaaavcxE
EEExccccccwhhhhhhhhhwaaaaavcxE
EEExccccccwhhhhhhhhhwaaaaavcxE
EEExccccccwhhhhhhhhhwaaaaavcxE
EEExccccccwhhhhhhhhhwaaaaavcxE
EEExccccccwhhhhhhhhhwaaaaavcxE
EEExccccccwhhhhhhhhhwvvvvvvcxE
EEExccccccdddddddddddcccccccxE
EEExccccccrrrrrrrrrrrcccccccxE
EEExccccccrrrrrrrrrrrcccccccxE
EEExccccccrrrrrrrrrrrcccccccxE
EEExxxxxxxrrrrrrrrrrrxxxxxxxxE
EEEgggggggrrrrrrrrrrrggggggggE
EEEgyyggggrrrrrrrrrrrggyygyygE
EEEgyyggggrrrrrrrrrrrggyygyygE
EEEgggggggrrrrrrrrrrrggggggggE
EEEEEEEEEErrrrrrrrrrrEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, w muro casa, s scala, d porta, a fienile, v muro fienile, t torre colombaia, c aia, x staccionata, r sentiero, q pozzo, g campo arato, y frutteto
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEggggggggggggggggggggggggggE
EEEggyygggggggggyygggggggggggE
EEEggyygggggggggyygggggggggggE
EEEggggggggggggggggggggggggggE
EEExxxxxxxxxxxxxxxxxxxxxxxxxxE
EEExccccccccccccccccccccccccxE
EEExccccccccccccccccccccccccxE
EEExccccccccccccccccccccccccxE
EEExccccccccccccccccccccccccxE
EEExccccccwwwwwwwwwwwvvvvvvcxE
EEExccccccwhhsssshhhwaaaaavcxE
EEExccccccwhhsssshhhwaaaaavcxE
EEExccccccwhhhhhhhhhwaaaaavcxE
EEExccccccwhhhhhhhhhwaaaaavcxE
EEExccccccwhhhhhhhhhwaaaaavcxE
EEExccccccwhhhhhhhhhwaaaaavcxE
EEExccccttthhhhhhhhhwvvvvvvcxE
EEExccccttthhhhhhhhhwcccccccxE
EEExcccctttttddddddddcccccccxE
EEExcccctttttrrrrrrrrcccccccxE
EEExcccctttttrrrrrrrrcccccccxE
EEExccccccccrrrrrrrrrcccccccxE
EEExccqqccccrrrrrrrrrxxxxxxxxE
EEExccqqccccrrrrrrrrrggggggggE
EEExccccccccrrrrrrrrrggyyggggE
EEExxxxxxxxxrrrrrrrrrggyyggggE
EEEEEEEEEEEErrrrrrrrrggggggggE
EEEEEEEEEEEErrrrrrrrrEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento casa, w muro casa, s scala, d porta, a fienile, v muro fienile, t torre colombaia, c aia, x staccionata, r sentiero, q pozzo, g campo arato, y frutteto
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEgggggggggggggggggggggggggggggggggEEE
EEEEgggyyggggggggggggggggggggggggggggEEE
EEEEgggyyggggggggggggggggggggggggggggEEE
EEEEgggggggggggggggggggggggggggggggggEEE
EEEEggggxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEE
EEEEggggxcccccccccccccccccccccccccccxEEE
EEEEggggxcccccccccccccccccccccccccccxEEE
EEEEggggxcccccccccccccccccccccccccccxEEE
EEEEggggxcccccccccccccqqccccccccccccxEEE
EEEEggggxcccctttttccccqqccccccccccccxEEE
EEEEgyygxcccctttttccccccccccccccccccxEEE
EEEEgyygxcccctttttwwwwwwwwvvvvvvccccxEEE
EEEEggggxccccttthhsssshhhwaaaaavccccxEEE
EEEEggggxccccttthhsssshhhwaaaaavccccxEEE
EEEEggggxccccccwhhhhhhhhhwaaaaavccccxEEE
EEEEggggxccccccwhhhhhhhhhwaaaaavccccxEEE
EEEEggggxccccccwhhhhhhhhhwaaaaavccccxEEE
EEEEggggxccccccwhhhhhhhhhwaaaaavccccxEEE
EEEEggggxccccccwhhhhhhhhhwvvvvvvccccxEEE
EEEEggggxccccccwhhhhhhhhhwccccccccccxEEE
EEEEggggxccccccdddddddddddccccccccccxEEE
EEEEggggxccccccrrrrrrrrrrrccccccccccxEEE
EEEEggggxccccccrrrrrrrrrrrccccccccccxEEE
EEEEggggxccccccrrrrrrrrrrrccccccccccxEEE
EEEEggggxxxxxxxrrrrrrrrrrrxxxxxxxxxxxEEE
EEEEgggggggggggrrrrrrrrrrrgggggggggggEEE
EEEEggggyygggggrrrrrrrrrrrgggggggggggEEE
EEEEggggyygggggrrrrrrrrrrrgggggggggggEEE
EEEEgggggggggggrrrrrrrrrrrgggggggggggEEE
EEEEEEEEEEEEEEErrrrrrrrrrrEEEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrEEEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrEEEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrEEEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrEEEEEEEEEEEEEE
EEEEEEEEEEEEEEErrrrrrrrrrrEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.24 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
  Concept: Fattoria (Farmstead)
  Parts & Letters:
  - Main farmhouse (h: interior floor, w: masonry wall, s: stair zone, d: front door) around centre H, two storeys (64 high) with hipped tile roof.
  - Front porch / lean-to (p: covered porch with wooden posts and roof at 34) along the front wall and entry door.
  - Attached barn / hayloft wing (a: barn floor, v: barn brick wall, i: internal doorway) on one side of the farmhouse (chosen by seed).
  - Stone silo / dovecote tower (t: tower wall, u: tower interior) attached to a corner of the farmhouse, crowned with battlements & slits.
  - Farmyard (c: dirt/cobble yard, x: wooden fence around yard, r: road to the front edge, q: stone well in the yard).
  - At Gargantuan (where 7 cells of ground extend beyond the fence): plowed crop fields (g: field) and orchard trees (y: orchard/trees).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdapviutcxrqgy" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Farmhouse main body around H: 9 wide (x), 8 or 9 deep (y) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Front door (3 cells wide, centered on H) and road straight to the front edge (+y) -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/[hw]" out="*/d" symmetry="()"/>
      <prl in="d/h" out="h/*" symmetry="()"/>
      <prl in="H" out="h"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Front porch (lean-to, 2 cells deep) along the front wall of the farmhouse -->
      <all in="[wd]/[Er]" out="*/p" symmetry="()" steps="1"/>
      <all in="p/[Er]" out="*/p" symmetry="()" steps="1"/>

      <!-- Road continues from porch to the front edge (+y) -->
      <all in="p/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Stair zone inside farmhouse: along back wall, 2 cells landing before small-x, 4 cells long, 2 wide -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Attached Barn wing on one side (x) of the farmhouse -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/a*/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="4"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- Internal passage between farmhouse and barn -->
      <one in="hwh/awa" out="*i*/*i*" symmetry="(xy)" steps="1"/>

      <!-- Silo / Dovecote tower at a back corner of the farmhouse -->
      <one in="EE/Ew" out="**/*t" symmetry="(x)" steps="1"/>
      <all steps="2">
        <rule in="t[Ewv]" out="*t"/>
        <rule in="t*/*[Ewv]" out="**/*t"/>
      </all>
      <all in="ttt/ttt/ttt" out="***/t*t/***"/>
      <all in="tBt" out="*u*" symmetry="(xy)"/>
      <all in="uBt" out="*u*" symmetry="(xy)"/>

      <!-- Farmyard around the buildings -->
      <all in="[wvtp]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Well in a 4x4 patch of the yard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" steps="1"/>

      <!-- Wooden fence around the farmyard -->
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- At Gargantuan (where 7 cells of ground go on past the fence): plowed fields (g) and orchard (y) -->
      <all in="xEEEEEEE" out="*ggggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <one in="gggg/gggg/gggg/gggg" out="****/*yy*/*yy*/****" steps="6"/>
    </sequence>

    <map scale="5 5 1" values="BEhwsdapviutcxrqgyfFWVPRJKLZQYGCDoONMTkU#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="q" out="qqqqq/qQQQq/qQQQq/qQQQq/qqqqq"/>
      <rule in="g" out="ggggg/DDDDD/ggggg/DDDDD/ggggg"/>
      <rule in="y" out="ggggg/gYYYg/gYYYg/gYYYg/ggggg"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="WVZ"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="Z"/>

        <!-- B. THE HEIGHTS -->

        <!-- 1. Farmhouse walls (w, d, i): 2 storeys = 64 high, topped with R -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="5"/>
        <all in="B i" out="i O" steps="1"/>
        <all in="B i" out="i W" steps="5"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B [wdi]" out="* K" steps="14"/>
        <all in="B [wdi]" out="* W" steps="12"/>
        <all in="B [wdi]" out="* W" steps="6"/>
        <all in="B [wdi]" out="* K" steps="14"/>
        <all in="B [wdi]" out="* W" steps="12"/>
        <prl in="[wdi]" out="R"/>

        <!-- 2. Farmhouse interior (h) and stair zone (s): floor at z=1, slab at z=33, ceiling R at z=65 -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- 3. Barn wing: walls (v) and floor (a), 1 tall storey = 38 high, topped with P -->
        <all in="B v" out="v V" steps="8"/>
        <all in="B v" out="v K" steps="14"/>
        <all in="B v" out="v V" steps="16"/>
        <prl in="v" out="P"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="37"/>
        <prl in="a" out="P"/>

        <!-- 4. Silo / Dovecote tower: walls (t) 72 high, interior (u) with floors and top platform at 71 -->
        <all in="B t" out="t Z" steps="72"/>
        <prl in="t" out="B"/>
        <all in="B u" out="u f" steps="1"/>
        <all in="B u" out="u B" steps="31"/>
        <all in="B u" out="u F" steps="1"/>
        <all in="B u" out="u B" steps="37"/>
        <all in="B u" out="u F" steps="1"/>
        <prl in="u" out="B"/>

        <!-- 5. Front porch (lean-to): floor p, posts b rising 33, roof J at z=34 -->
        <!-- Keep only outer corner posts so the porch and doorway are clear -->
        <all in="b[pb]" out="p*" symmetry="(xy)"/>
        <all in="B p" out="y p" steps="1"/>
        <all in="B b" out="b J" steps="33"/>
        <prl in="b" out="J"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>

        <!-- 6. Well (q wall, Q water), Fence (x), Orchard trees (Y) -->
        <all in="B q" out="q Z" steps="10"/>
        <prl in="q" out="B"/>
        <all in="B x" out="x J" steps="8"/>
        <prl in="x" out="B"/>

        <all in="B Y" out="Y J" steps="12"/>
        <all in="B Y" out="Y G" steps="10"/>
        <prl in="Y" out="G"/>
        <all in="GB" out="*G" steps="2"/>

        <!-- C. THE FULL SCALE: DOORS, PARTS, WINDOWS, ROOFS -->

        <!-- Included parts -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Windows in the window bands K -->
        <one steps="20">
          <rule in="BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK BK/BK/BK/BK/BK/BK" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LKKKKB" out="*LLLL*"/>
        <all in="K W" out="W *"/>
        <all in="K V" out="V *"/>
        <prl in="K" out="W"/>

        <!-- Roofs: eaves and hipped roofs on farmhouse (R) and barn (P) -->
        <all in="RB" out="*R" symmetry="(xy)" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="14" symmetry="()"/>

        <all in="PB" out="*P" symmetry="(xy)" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **P**/**P**/PPPPP/**P**/**P**" out="*****/*****/**P**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>

        <!-- Brick chimney on the farmhouse roof -->
        <one in="B B R" out="* C *" steps="1" symmetry="()"/>
        <all in="B C" out="C *" steps="10"/>
        <all in="CB" out="*C" symmetry="(xy)" steps="1"/>
      </sequence>
    </map>
  </map>

  <!-- Palette & Areas -->
  <color symbol="E" value="#7a9a55" name="erba" area="field"/>
  <color symbol="c" value="#c2b088" name="aia" area="yard"/>
  <color symbol="r" value="#b09e78" name="sentiero" area="yard"/>
  <color symbol="p" value="#b59267" name="pavimento portico" area="porch"/>
  <color symbol="g" value="#735838" name="campo arato" area="field"/>
  <color symbol="D" value="#5e462b" name="solco" area="field"/>
  <color symbol="G" value="#4f783b" name="chioma albero" area="orchard"/>

  <color symbol="f" value="#bfa074" name="tavolato" area="house"/>
  <color symbol="F" value="#a6885e" name="solaio" area="house"/>
  <color symbol="W" value="#e3d6be" name="intonaco chiaro" area="house"/>
  <color symbol="V" value="#b3543b" name="mattone fienile" area="barn"/>
  <color symbol="Z" value="#8c877e" name="pietra grigia" area="tower"/>
  <color symbol="M" value="#8c877e" name="merlo in pietra" area="tower"/>
  <color symbol="U" value="#2b2927" name="feritoia" area="tower"/>

  <color symbol="R" value="#b84a32" name="coppi rossi" area="house"/>
  <color symbol="P" value="#9e432e" name="tetto fienile" area="barn"/>
  <color symbol="C" value="#7d3525" name="comignolo" area="house"/>
  <color symbol="J" value="#6e4f32" name="trave di legno" area="porch"/>
  <color symbol="L" value="#8ab4c9" name="vetro finestra" area="house"/>
  <color symbol="Q" value="#4b7fa8" name="acqua del pozzo" area="yard"/>

  <color symbol="O" value="#7a5230" name="porta di legno" area="house"/>
  <color symbol="o" value="#4d321c" name="assi della porta" area="house"/>
  <color symbol="N" value="#8c877e" name="stipite in pietra" area="house"/>
  <color symbol="k" value="#9c7a52" name="gradino di legno" area="house"/>
  <color symbol="T" value="#9c7a52" name="scala" area="house"/>

  <color symbol="#20" hidden="True" name="porta aperta" area="house"/>
  <color symbol="#21" hidden="True" name="assi aperte" area="house"/>

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
