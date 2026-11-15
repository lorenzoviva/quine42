# model.sculpt · claude-sonnet-5-5 · 345 s

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
FATTORIA (farm). Block 1: the composition on the plan.
PARTS: the house h with walls w and an axis i (two storeys later), around the centre H. The door d is 3 cells wide in the middle of the front wall, on the axis. The road r runs straight from the door to the edge across the yard c.
The barn a with walls v is a wing against a side wall of the house. Its side and its place along the wall are chosen by the seed. It is 3 cells wide.
The hay lean-to l with its two posts p is against the back wall, 5 wide and 4 deep, and its place along the wall varies. A haystack y stands beside it.
The stair zone s is inside the house along the back wall, with two cells of landing before it.
The yard c is a ring around everything built.
WHAT THE SEEDS CHANGE: the house is deeper by one cell in front and one behind, by chance. The wing goes left or right and at another height of the wall. The lean-to slides along the back. The hay goes on one side or the other. The stair slides along the back wall.
WHAT FITS: at 20 x 20 the house, the wing, the lean-to, the hay and the yard. At 30 x 30 there is more. The wing stretches to 5 wide. A fence f closes the yard wherever 6 cells of ground go on past it, and the road is its gate. Fields g stand against the fence and trees t with crown q stand in the free 7 x 7 windows of lawn.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhiwdrcavlpyfgtqs" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the body: an axis of i through H, 3 behind (one more by chance), 5 in front (one more by chance), then 4 cells to each side -->
      <all in="E/[Hi]" out="i/*" symmetry="()" steps="3"/>
      <prl in="E/i" out="i/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hi]/E" out="*/i" symmetry="()" steps="5"/>
      <prl in="i/E" out="*/i" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hih]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="[hi]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- the door: from the end of the axis through the front wall, 3 cells wide -->
      <all in="i/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>

      <!-- the wing: against a side wall, 3 wide and 5 deep; where 6 cells of ground go on past it, it stretches by 2 -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="aEEEEEE" out="*aa****" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- the hay lean-to: 5 wide, 4 deep, against the back wall, posts on the two outer corners; a haystack beside it -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/wwwww" out="plllp/lllll/lllll/lllll/*****" symmetry="()" steps="1"/>
      <one in="El/ww" out="y*/**" symmetry="(x)" steps="1"/>
      <all in="E/y" out="y/*" symmetry="()" steps="1"/>

      <!-- the yard: a ring around everything built -->
      <all in="[wvlpyd]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- the road: from the door straight to the edge -->
      <all in="[dr]/[cE]" out="*/r" symmetry="()"/>

      <!-- larger area: a fence where 6 cells of ground go on past the yard (the road is the gate) -->
      <all in="cEEEEEE" out="*f*****"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- a field against the fence, then trees in the free windows of lawn -->
      <one in="fEEEEEE/fEEEEEE/fEEEEEE/fEEEEEE/fEEEEEE/fEEEEEE/fEEEEEE" out="f******/fggggg*/fggggg*/fggggg*/fggggg*/fggggg*/f******" symmetry="(xy)" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/**qqq**/**qtq**/**qqq**/*******/*******" symmetry="()" steps="3"/>

      <!-- the axis becomes floor; the zone of the stair along the back wall, 2 cells of landing before it -->
      <prl in="i" out="h"/>
      <one in="wwwwwwww/hhhhhhhh/hhhhhhhh" out="********/**ssss**/**ssss**" symmetry="()" steps="1"/>
    </sequence>
  </map>
  <color symbol="B" value="000000" name="aria"/>
  <color symbol="H" value="D9A441" name="centro della casa"/>
  <color symbol="E" value="8DA85A" name="prato" hidden="True"/>
  <color symbol="h" value="C8A27A" name="pavimento della casa" area="house"/>
  <color symbol="i" value="D8B48A" name="asse della casa"/>
  <color symbol="w" value="E6DCC8" name="muro della casa"/>
  <color symbol="d" value="7A4B2A" name="porta"/>
  <color symbol="r" value="B79B6B" name="strada"/>
  <color symbol="c" value="CDBB8E" name="aia" area="yard"/>
  <color symbol="a" value="A67C52" name="pavimento della stalla" area="barn"/>
  <color symbol="v" value="B5543A" name="muro della stalla"/>
  <color symbol="l" value="8B6A43" name="tettoia del fieno" area="shed"/>
  <color symbol="p" value="5A3E22" name="palo"/>
  <color symbol="y" value="E3C04A" name="covone di fieno"/>
  <color symbol="f" value="7B5A3A" name="steccato"/>
  <color symbol="g" value="9C7B3E" name="campo" area="field"/>
  <color symbol="t" value="5E4126" name="tronco"/>
  <color symbol="q" value="4F8A3C" name="chioma" area="orchard"/>
  <color symbol="s" value="A08060" name="zona della scala"/>
</sequence>
