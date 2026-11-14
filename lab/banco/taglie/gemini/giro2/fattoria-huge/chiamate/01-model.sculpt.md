# model.sculpt · gemini-4-argon · 33 s

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
  Parts and letters:
  - Main farmhouse (h = interior floor, s = stair zone, w = farmhouse walls, d = front door): two-storey dwelling with pitched roof around the centre.
  - Front porch / lean-to (p = porch around the front door): covered wooden veranda along the front facade.
  - Attached barn / stable wing (a = barn interior, v = barn walls): one-storey timber/brick annex on one side of the farmhouse, connected internally.
  - Stone silo / dovecote tower (t = tower): attached to a rear corner of the farmhouse, crowned with battlements and slits.
  - Farmyard (c = courtyard, q = well, y = haystack): paved/dirt yard around the buildings, enclosed by a low fence (z).
  - Road (r): front path from the farmhouse door straight to the front edge.
  - Cultivated field (g = plowed field) and orchard trees (u = fruit tree): grown outside the farmyard fence where space allows.
  What seeds change: depth of the farmhouse, which side the barn wing attaches to, which rear corner holds the dovecote tower, positions of the well, haystack, and orchard trees.
  What fits at each size:
  - Large (20x20): Farmhouse, porch, side barn wing, rear dovecote tower, small yard.
  - Huge (30x30): Full farmyard enclosed by fence, well and haystack in the yard.
  - Gargantuan (40x40): Extended farmyard, cultivated fields (g) with furrows beyond the fence, and orchard trees (u).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavtpcqyzgru" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main farmhouse body around H: 9 wide, 7 or 8 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="H" out="h"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone along the back wall of the farmhouse: 2 cells landing, 4 cells stair, 2 cells wide -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Attached barn wing on one side (left or right): 6 wide, 6 deep -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/a*/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="5"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Stone dovecote / silo tower on one rear outer corner of the farmhouse -->
      <one in="EE/Ew/wh" out="t*/*t/**" symmetry="(x)" steps="1"/>
      <all steps="2">
        <rule in="t[Ewv]" out="*t"/>
        <rule in="t*/*[Ewv]" out="**/*t"/>
      </all>

      <!-- Front road from the middle of the front wall straight to the edge (3 cells wide) -->
      <one in="hhhhh/wwwww/EEEEE" out="*****/*ddd*/*rrr*" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Front porch / lean-to along the front wall around the door (2 cells deep) -->
      <all in="w/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pr" out="*p" symmetry="(x)" steps="1"/>

      <!-- Farmyard around the buildings -->
      <all in="[wvtpd]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand farmyard if room allows (Huge and Gargantuan) -->
      <all in="cEEEE" out="*ccc*" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Fence around the farmyard where ground continues -->
      <all in="cE" out="*z"/>
      <all in="zE/*z" out="*z/**"/>

      <!-- Keep road clear through yard and fence -->
      <all in="[rd]/c" out="*/r" symmetry="()"/>
      <all in="r/z" out="*/r" symmetry="()"/>
      <all in="r[cz]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Well and haystack inside the farmyard where space fits -->
      <one in="cccc/cccc/cccc/cccc" out="****/*qq*/*qq*/****" steps="1"/>
      <one in="cccc/cccc/cccc/cccc" out="****/*yy*/*yy*/****" steps="1"/>

      <!-- Cultivated fields outside the fence at Gargantuan size -->
      <all in="zEEEEE" out="*gggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>

      <!-- Orchard trees in remaining open ground at Gargantuan size -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/**u**/*uuu*/**u**/*****" steps="3"/>
    </sequence>
  </map>
  <color symbol="E" value="#7a9a55" name="erba" hidden="True"/>
  <color symbol="H" value="#ffffff" name="centro" hidden="True"/>
  <color symbol="h" value="#d9c29c" name=" pavimento casa" area="house"/>
  <color symbol="s" value="#c4a478" name="zona scala" area="house"/>
  <color symbol="w" value="#e8dcc5" name="muro casa" area="house"/>
  <color symbol="d" value="#8c5838" name="porta" area="house"/>
  <color symbol="a" value="#c8b08a" name="fienile" area="barn"/>
  <color symbol="v" value="#b55942" name="muro fienile" area="barn"/>
  <color symbol="t" value="#8f8b84" name="torre colombaia" area="tower"/>
  <color symbol="p" value="#b88b58" name="portico" area="porch"/>
  <color symbol="c" value="#c7b595" name="aia" area="yard"/>
  <color symbol="q" value="#5a7d9a" name="pozzo" area="yard"/>
  <color symbol="y" value="#e0b84c" name="pagliaio" area="yard"/>
  <color symbol="z" value="#78583a" name="staccionata" area="yard"/>
  <color symbol="g" value="#6e553b" name="campo arato" area="field"/>
  <color symbol="r" value="#b09e82" name="sentiero" area="yard"/>
  <color symbol="u" value="#4f7838" name="albero da frutto" area="orchard"/>
</sequence>
