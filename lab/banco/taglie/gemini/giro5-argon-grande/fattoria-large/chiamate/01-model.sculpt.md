# model.sculpt · gemini-4-argon · 28 s

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
  Concept: Fattoria (medieval farmstead).
  Parts and letters:
  - Main farmhouse: interior (h), stair zone (s), stone/plaster walls (w), front door (d). 2 storeys + hip roof.
  - Barn / stable wing: interior (a), timber-frame/brick walls (v), connected to one side of the farmhouse (1 storey + tall hayloft roof).
  - Lean-to porch (tettoia): (p), 4 cells (20 voxels) deep along the front or side, with wooden posts and a pitched lean-to roof at 34 voxels high.
  - Stone silo / dovecote tower: (t), attached to a rear corner of the farmhouse, crowned with battlements and slits.
  - Farmyard (aia): (c) paved/dirt yard around the buildings, enclosed by a low dry-stone wall / wooden fence (x), with a road (r) leading straight from the front door to the south edge.
  - Haystacks / hay area: (y) in the yard behind or beside the house.
  - At Huge / Gargantuan sizes (where more ground E is available around the yard): plowed crop fields (g), a stone well (Q), and orchard trees (z).
  Seeds vary: the depth of the farmhouse, which side the barn wing and silo tower attach to, placement of the haystack, well, fields, and trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavptcxyrgQz" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse body around centre H: 9x8 or 9x9 interior -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone inside the farmhouse along the back wall: 2 cells landing before small-x, 4 cells strip, floor after -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Silo / dovecote tower on one of the rear corners of the farmhouse -->
      <one in="EE/EE/Ew" out="tt/tt/*w" symmetry="(x)" steps="1"/>
      <all in="tE" out="*t" steps="1"/>
      <all in="tE/*t" out="*t/**"/>

      <!-- Barn wing on a side wall (if room, otherwise compact side annex) -->
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="******/**aaa*/**aaa*/**aaa*/******" symmetry="(x)" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Lean-to (tettoia) 4 cells deep (20 voxels) on the opposite side or front-side of the house -->
      <one in="wEEEE/wEEEE/wEEEE/wEEEE/wEEEE" out="*pppp/*pppp/*pppp/*pppp/*pppp" symmetry="(x)" steps="1"/>

      <!-- Farmyard around the farmhouse, barn, lean-to and silo -->
      <all in="[wvtpx]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand the yard at Huge and Gargantuan sizes where at least 5 cells of E remain -->
      <all in="cEEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Haystack in the rear or side yard -->
      <one in="ccc/ccc/ccc" out="***/**y/**y" steps="1"/>

      <!-- Well in the expanded yard (only matches when a 4x4 patch of yard is free, i.e., Huge+) -->
      <one in="cccc/cccc/cccc/cccc" out="****/*QQ*/*QQ*/****" steps="1"/>

      <!-- Fence / low courtyard wall around the yard -->
      <all in="cE" out="*x" steps="1"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- Cultivated fields outside the fence at Huge+ sizes where 5 cells of open soil remain -->
      <all in="xEEEEE" out="*gggg*" steps="1"/>
      <all in="gE/*g" out="*g/**" steps="4"/>

      <!-- Orchard trees in remaining open soil at Huge+ sizes -->
      <one in="EEEE/EEEE/EEEE/EEEE" out="****/*zz*/*zz*/****" steps="3"/>

      <!-- Way out from H straight to the front (south): door d (3 cells wide) and road r to the edge -->
      <all in="[Hh]/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/[cxE]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[cxE]" out="*r" symmetry="(x)" steps="1"/>
      <prl in="H" out="h"/>
    </sequence>
  </map>
  <color symbol="E" value="138,162,102" name="erba" area="field"/>
  <color symbol="H" value="210,180,140" name="centro" area="house"/>
  <color symbol="h" value="210,180,140" name=" pavimento casa" area="house"/>
  <color symbol="s" value="190,150,110" name="zona scala" area="house"/>
  <color symbol="w" value="230,220,200" name="muro casa" area="house"/>
  <color symbol="d" value="140,95,60" name="porta" area="house"/>
  <color symbol="a" value="195,165,120" name="fienile" area="barn"/>
  <color symbol="v" value="175,95,75" name="muro fienile" area="barn"/>
  <color symbol="p" value="165,135,95" name="tettoia" area="porch"/>
  <color symbol="t" value="160,155,145" name="colombaia" area="tower"/>
  <color symbol="c" value="185,170,135" name="aia" area="yard"/>
  <color symbol="x" value="130,115,95" name="muretto" area="yard"/>
  <color symbol="y" value="225,195,95" name="pagliaio" area="yard"/>
  <color symbol="r" value="170,155,125" name="sentiero" area="yard"/>
  <color symbol="g" value="125,105,75" name="campo arato" area="field"/>
  <color symbol="Q" value="120,135,145" name="pozzo" area="yard"/>
  <color symbol="z" value="95,135,75" name="frutteto" area="orchard"/>
</sequence>
