# model.sculpt · gemini-4-carbon · 39 s

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

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

<!--
Concept: Fattoria (medieval farmstead)
Parts & plan letters:
- Main farmhouse: h (house floor, 9 or 10 × 7 cells inside), s (stair zone along back wall, 4 × 2 cells), w (house stone/plaster walls), d (front door, 3 cells wide). Two covered storeys with pitched tile roof and chimney.
- Porch / lean-to: p (wooden lean-to at least 20 deep × 35+ wide along the front or side wall of the house).
- Haystack: y (2 × 2 hay rick behind or beside the house).
- Farmyard & road: c (beaten earth yard around the house), r (front path straight to the front edge).
- At Huge / Gargantuan (where ground goes on):
  - Barn / annex: a (barn floor, 6 × 6 inside), v (barn walls), g (wide barn doorway facing the yard).
  - Stone silo tower: t (3 × 3 round/square tower at a corner of the barn or yard, crowned with battlements & slits).
  - Stone well: q (in 5 × 5 of yard).
  - Wooden fence: z (enclosing the farmyard, open at road).
  - Cultivated vegetable field & orchard trees: f (ploughed field strips outside the yard), l (fruit tree in lawn).
What seeds change: house width (9 or 10), porch placement/width, side of the barn (left or right of yard), position of haystack, silo corner, well, fields and orchard trees.
What fits by size:
- Large (20 × 20): Farmhouse (11–12 × 9), front road, deep lean-to porch (4 cells = 20 voxels deep), yard apron, haystack behind.
- Huge (30 × 30): Wide enclosed farmyard with wooden fence, stone barn annex on one side, battlemented grain tower, stone well, and ploughed field strips.
- Gargantuan (40 × 40): Larger yard, second field / orchard with fruit trees outside the fence.
-->
<sequence values="BHEhswdpcyravgtqzfle" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdpcyravgtqzfle" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse around H (shifted slightly back so porch + road fit in front at 20x20) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="5"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="1"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <one in="Eh/Eh/Eh/Eh/Eh" out="h*/h*/h*/h*/h*" symmetry="(x)" steps="1"/>
      <all in="Eh/*h" out="h*/**" symmetry="(x)"/>
      <all in="hE/*h" out="*h/**" symmetry="(x)"/>

      <!-- Farmhouse walls w -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone s along the back wall: 2 cells landing on small-x, 4 cells stair, 2 cells landing on large-x -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>

      <!-- Front door d (3 cells wide) and straight road r to front edge -->
      <all in="H/h" out="*/e" symmetry="()"/>
      <all in="[He]/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="e" out="h"/><rule in="H" out="h"/></prl>

      <!-- Lean-to porch p: 4 cells (20 voxels) deep and 7 cells (35 voxels) wide on front of house next to door, or wrapped -->
      <one in="wwwwwwwd/EEEEEEEr/EEEEEEEr/EEEEEEEr/EEEEEEEr" out="********/*pppppp*/*pppppp*/*pppppp*/*pppppp*" symmetry="(x)" steps="1"/>
      <!-- Fallback if door is centered with 4w on one side and 5w on other: use 4w + 3d = 7 cells wide lean-to over front -->
      <one in="wwwwddd/EEEErrr/EEEErrr/EEEErrr/EEEErrr" out="*******/pppp***/pppp***/pppp***/pppp***" symmetry="(x)" steps="1"/>
      <!-- Widen lean-to across the road as a covered front porch if fallback triggered, or extend p along front wall -->
      <all in="w/p" out="*/p" symmetry="()" steps="0"/>
      <one in="pE/pE/pE/pE" out="pp/pp/pp/pp" symmetry="(x)" steps="3"/>

      <!-- Base farmyard c around house and porch (2 cells wide at Large) -->
      <all in="[wp]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand farmyard c where space exists (Huge / Gargantuan) -->
      <all in="cEEEEEEE" out="*ccccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*ccccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Re-extend front road r cleanly through any expanded yard to the front edge -->
      <all in="d/[cp]" out="*/r" symmetry="()"/>
      <all in="r/[cpE]" out="*/r" symmetry="()"/>

      <!-- Ensure lean-to p is at least 7x4 intact on one side of road or side of house -->
      <one in="wcccc/wcccc/wcccc/wcccc/wcccc/wcccc/wcccc" out="*pppp/*pppp/*pppp/*pppp/*pppp/*pppp/*pppp" symmetry="(x)" steps="1"/>

      <!-- Barn annex (a inside, v walls, g wide door) in expanded yard on Huge+ -->
      <one in="cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc" out="vvvvvvvv/vaaaaaav/vaaaaaav/vaaaaaav/vaaaaaav/vaaaaaav/vaaaaaav/vvvggvvv" symmetry="(xy)" steps="1"/>

      <!-- Silo / dovecote stone tower t (3x3) attached to barn corner or yard corner on Huge+ -->
      <one in="vvcc/vvcc/cccc/cccc" out="*ttt/*ttt/*ttt/****" symmetry="(xy)" steps="1"/>

      <!-- Haystack y (2x2 or 3x2) in yard behind/beside the house (fits at Large too!) -->
      <one in="wcc/wcc/wcc" out="*yy/*yy/***" symmetry="(xy)" steps="1"/>
      <one in="EEw/EEw" out="yy*/yy*" symmetry="(xy)" steps="1"/>

      <!-- Stone well q in a 5x5 clear patch of yard (Huge+) -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Wooden fence z around yard where at least 2 cells of E remain outside -->
      <all in="cEE" out="*z*" steps="1"/>
      <all in="zE/*z" out="*z/**"/>
      <!-- Keep front road r open through fence -->
      <all in="r/z" out="*/r" symmetry="()"/>

      <!-- Ploughed vegetable field f outside fence/yard where 6x4 of E fits (Huge+) -->
      <one in="zEEEEEE/zEEEEEE/zEEEEEE/zEEEEEE/zEEEEEE" out="*ffffff/*ffffff/*ffffff/*ffffff/*ffffff" symmetry="(xy)" steps="2"/>

      <!-- Orchard fruit trees l in 5x5 patches of E (Gargantuan / Huge) -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**l**/*****/*****" steps="4"/>
    </sequence>
  </map>

  <color symbol="E" value="138,154,91" name="erba" area="field"/>
  <color symbol="H" value="210,180,140" name="centro" area="house"/>
  <color symbol="h" value="196,154,108" name="pavimento casa" area="house"/>
  <color symbol="s" value="175,130,85" name="vano scala" area="house"/>
  <color symbol="w" value="232,222,202" name="muro intonacato" area="house"/>
  <color symbol="d" value="120,78,46" name="soglia porta" area="house"/>
  <color symbol="p" value="168,125,78" name="tettoia in legno" area="porch"/>
  <color symbol="c" value="188,166,132" name="aia in terra battuta" area="yard"/>
  <color symbol="r" value="172,152,122" name="sentiero" area="yard"/>
  <color symbol="y" value="224,188,84" name="pagliaio" area="yard"/>
  <color symbol="a" value="162,134,96" name="fienile" area="barn"/>
  <color symbol="v" value="156,148,136" name="muro del fienile" area="barn"/>
  <color symbol="g" value="132,94,58" name="portone del fienile" area="barn"/>
  <color symbol="t" value="142,136,128" name="torre colombaia" area="tower"/>
  <color symbol="q" value="124,128,132" name="pozzo" area="yard"/>
  <color symbol="z" value="138,98,60" name="steccato" area="yard"/>
  <color symbol="f" value="126,96,64" name="orto arato" area="field"/>
  <color symbol="l" value="88,132,66" name="albero da frutto" area="orchard"/>
  <color symbol="e" value="196,154,108" name="corridoio" area="house"/>
</sequence>
