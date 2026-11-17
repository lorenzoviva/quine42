# model.sculpt · claude-opus-5-5 · 34 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front. Furnished inside, in the same program: every room of every storey has its furniture (beds, tables, benches, shelves, chests, a hearth, barrels; mangers and hay where animals stay), standing on the floor against the walls, each piece a small body of its own material. Keep free what a body needs, the checks are the same: the door and the straight way in from it, two cells of free floor before every stair and where it comes out, a passage at least 11 voxels wide between the pieces to every room and every stair. Give every furniture material a colour of its own whose name begins with «arredo» (arredo letto, arredo tavolo…).
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

```xml
<!--
  FATTORIA: the parts and where they go
  - Casa (h floor, w walls, H centre): the main body around the centre. It is 9 wide and 9-10 deep, the depth chosen by the seed. It holds 2 storeys, with the stair zone s along the back wall.
  - Stalla / fienile (a floor, v walls): a lower wing set against a side wall of the house. The seed picks the side and the position along it. It is 3 deep, which is the size of a lean-to.
  - Porta (d) and strada (r): the door is on the front axis and 3 cells wide. The road runs straight from it to the edge.
  - Aia (g): a ring of beaten earth one cell wide around house and stable.
  - Staccionata (x): a fence around the yard, only where the ground goes on past it (at Huge and larger).
  - Covone (Y): a haystack placed far from the road, behind the house, where 3 x 3 of free ground fits.
  - Campi (c): fields grown where 7 x 7 of free ground remains.
  - Alberi (t): trees grown where 7 x 7 of free ground remains.
  What the seeds change: the depth of the house, the side and position of the stable, and where the hay, trees and fields go.
  What fits at each size:
  - Large: the house with its lean-to stable, the yard and the hay behind.
  - Huge: adds the fence, the fields and the trees.
  - Gargantuan: adds many more fields and trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdrsgxYct" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- house body -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- stair zone along the back wall -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- stable wing against a side wall -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- yard ring, then a fence only where the ground goes on past it -->
      <all in="[wv]E" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEE" out="*x****" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- door on the front axis, then the road straight to the edge -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="d/d" symmetry="()"/>
      <all in="d/w" out="*/r" symmetry="()" steps="1"/>
      <prl in="d" out="h"/>
      <all in="h/r" out="*/d" symmetry="()"/>
      <all in="[dr]/[Egx]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[Egx]" out="*r" symmetry="(x)" steps="1"/>
      <!-- haystack far from the road -->
      <one in="EEE/EEE/EEE" out="***/*Y*/***" steps="1"><field for="Y" from="r" on="Egrx"/></one>
      <!-- fields, then trees, in free ground -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*ccccc*/*ccccc*/*ccccc*/*ccccc*/*ccccc*/*******" steps="6"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True" name="terreno"/>
  <color symbol="H" value="C8A060" name="centro casa" area="house"/>
  <color symbol="h" value="B08850" name="pavimento casa" area="house"/>
  <color symbol="w" value="E8DCC0" name="muro casa" area="house"/>
  <color symbol="s" value="8A6038" name="zona scala" area="house"/>
  <color symbol="a" value="A07A48" name="pavimento stalla" area="barn"/>
  <color symbol="v" value="9C5A3C" name="muro stalla" area="barn"/>
  <color symbol="d" value="5A3820" name="porta" area="house"/>
  <color symbol="r" value="BFA678" name="strada" area="road"/>
  <color symbol="g" value="CDB98A" name="aia" area="yard"/>
  <color symbol="x" value="7A5A38" name="staccionata" area="yard"/>
  <color symbol="Y" value="E0C050" name="covone" area="yard"/>
  <color symbol="c" value="9AB060" name="campo" area="field"/>
  <color symbol="t" value="5E8A40" name="albero" area="orchard"/>
</sequence>
```
