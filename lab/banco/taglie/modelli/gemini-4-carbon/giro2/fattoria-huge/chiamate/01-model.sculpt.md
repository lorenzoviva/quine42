# model.sculpt · gemini-4-carbon · 35 s

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

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
<!--
Concept: Fattoria (Italian medieval farmhouse estate)
Parts & Plan Letters:
- h, w, s, d: Two-storey farmhouse (h: room floor, w: stone/plaster walls, s: stair zone 4x2 along back wall, d: front door 3 cells wide). Centered near H, golden ratio ~9x7 interior.
- a, v, i: Attached barn / stalla wing on one side of the farmhouse (a: barn floor, v: barn wall, i: internal doorway).
- p: Front porch / lean-to (tettoia) 4 cells deep along the front door, open on sides.
- l: Side/back lean-to shed with hay on the opposite side or behind the barn.
- c, z, g: Farmyard (aia) in front and around the buildings (c: dirt/cobble yard), enclosed by a low dry-stone wall/fence (z) with an open farm gate (g) aligned with the road (r) to the front edge.
- q: Stone well (pozzo) placed in a 3x3 clear spot of the yard.
- j, u: Round brick silo / dovecote tower (colombaia, j: floor, u: wall) attached to a back corner of the barn or yard.
- f, y: Cultivated vegetable garden / ploughed field rows (orto, f) and fruit trees (frutteto, y) outside the yard wall where ground permits.
What seeds change: Depth/width of farmhouse by 1 cell, which side (left/right) the barn wing stands on, which side the hay lean-to stands on, position of the dovecote tower, position of the well in the yard, placement of orchard trees and fields.
What fits by size:
- Large (20x20): Farmhouse (h,w,s,d) + front porch (p) + small barn/hay lean-to + road (r).
- Huge (30x30): Farmhouse + full barn wing (a,v) + hay lean-to (l) + dovecote tower (j,u) + enclosed farmyard (c,z,g) + well (q).
- Gargantuan (40x40): All of Huge + expanded farmyard + ploughed field plots (f) + orchard trees (y) around the estate.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdapvilczgqrjufym" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- 1. Main Farmhouse body around H: 9 or 10 wide, 7 or 8 deep inside -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="Eh" out="h*" p="0.5" steps="1" symmetry="()"/>
      <all in="hE" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- 2. Stair zone along the back interior wall: 2 cells landing on small-x, 4 cells stair, 2 wide -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- 3. Front door (3 cells wide) on the south (+y) wall, centered on H, and road straight to front edge -->
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- 4. Front porch (tettoia, 4 cells deep = 20 voxels, 5 cells wide = 25 voxels) in front of door if space allows -->
      <all in="wdddw/EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/ppppp/ppppp/ppppp/ppppp/*****" symmetry="()" steps="1"/>

      <!-- 5. Road from front door / porch straight to the front edge (+y) -->
      <all in="[dp]/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <all in="pE" out="*r" symmetry="()" steps="0"/>

      <!-- 6. Barn wing (stalla) attached to left or right wall where 8 cells of space exist (Huge & Gargantuan) -->
      <one in="wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE/wEEEEEEEE" out="iaaaaaaav/vaaaaaaav/vaaaaaaav/vaaaaaaav/vaaaaaaav/vaaaaaaav/vvvvvvvvv" symmetry="(x)" steps="1"/>
      <!-- Close top wall of barn if open -->
      <all in="E/a" out="v/*" symmetry="()"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>
      <!-- Widen internal passage i between house and barn to 3 cells -->
      <all in="iw" out="*i" symmetry="(xy)" steps="2"/>

      <!-- 7. Hay lean-to (fienile/tettoia, 4 cells deep = 20 voxels, 6 long = 30 voxels) on free house/barn wall -->
      <one in="wEEEEE/wEEEEE/wEEEEE/wEEEEE/wEEEEE/wEEEEE" out="wllll*/wllll*/wllll*/wllll*/wllll*/wllll*" symmetry="(xy)" steps="1"/>

      <!-- 8. Dovecote / Silo tower (colombaia, 3x3 interior, 5x5 outer) on an outer back corner of barn or house -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEvvv" out="uuuuu/ujjju/ujjju/ujjju/uujuu" symmetry="(x)" steps="1"/>
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEwww" out="uuuuu/ujjju/ujjju/ujjju/uujuu" symmetry="(x)" steps="1"/>

      <!-- 9. Farmyard (aia, c) expanding in front and around buildings where room exists (Huge & Gargantuan) -->
      <all in="[wvpul]EEE" out="*c**" symmetry="(xy)" steps="1"/>
      <all in="cEEE" out="*c**" symmetry="(xy)" steps="4"/>
      <!-- Expand yard further if plenty of space remains (Gargantuan) -->
      <all in="cEEEEEEEE" out="*ccc*****" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- 10. Low stone/wood yard wall (z) around the yard, with gate (g) where road (r) crosses -->
      <all in="cEE" out="*z*" symmetry="(xy)"/>
      <all in="zE/*z" out="*z/**" symmetry="(xy)"/>
      <all in="zr" out="g*" symmetry="(xy)"/>
      <!-- Ensure road inside the yard becomes paved path / road up to porch/door -->
      <all in="r/c" out="*/r" symmetry="()"/>
      <all in="c/r" out="r/*" symmetry="()" steps="0"/>

      <!-- 11. Stone well (pozzo, q) in a 4x4 patch of open farmyard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" symmetry="(xy)" steps="1"/>

      <!-- 12. Cultivated fields (orto, f) and fruit orchard trees (frutteto, y) outside the yard (Gargantuan) -->
      <one in="zEEEEEEE/zEEEEEEE/zEEEEEEE/zEEEEEEE/zEEEEEEE/zEEEEEEE" out="z*fffff*/z*fffff*/z*fffff*/z*fffff*/z*fffff*/z*fffff*" symmetry="(xy)" steps="3"/>
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/*y***/*****/*****" symmetry="(xy)" steps="5"/>
    </sequence>
  </map>

  <color symbol="E" value="138,154,91" name="erba"/>
  <color symbol="H" value="200,80,80" name="centro"/>
  <color symbol="h" value="198,156,109" name="pavimento casa" area="house"/>
  <color symbol="w" value="226,214,192" name="muro intonacato" area="house"/>
  <color symbol="s" value="175,130,85" name="vano scala" area="house"/>
  <color symbol="d" value="120,75,45" name="porta ingresso" area="house"/>
  <color symbol="p" value="185,165,135" name="portico" area="porch"/>
  <color symbol="a" value="168,142,105" name="pavimento stalla" area="barn"/>
  <color symbol="v" value="182,102,78" name="muro stalla in mattoni" area="barn"/>
  <color symbol="i" value="150,115,80" name="passaggio stalla" area="barn"/>
  <color symbol="l" value="218,188,98" name="tettoia fienile" area="barn"/>
  <color symbol="j" value="160,150,140" name="interno colombaia" area="tower"/>
  <color symbol="u" value="168,92,70" name="muro colombaia" area="tower"/>
  <color symbol="c" value="196,182,152" name="aia" area="yard"/>
  <color symbol="z" value="142,138,130" name="muretto a secco" area="yard"/>
  <color symbol="g" value="175,162,135" name="varco aia" area="yard"/>
  <color symbol="r" value="178,164,134" name="sentiero" area="yard"/>
  <color symbol="q" value="110,125,140" name="pozzo" area="yard"/>
  <color symbol="f" value="124,98,68" name="orto arato" area="field"/>
  <color symbol="y" value="88,128,68" name="albero da frutto" area="orchard"/>
  <color symbol="m" value="200,100,100" name="traccia"/>
</sequence>
```
