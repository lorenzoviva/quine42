# model.sculpt · gemini-4-argon · 36 s

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
