# model.sculpt · claude-opus-5-5 · 43 s

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

```xml
<!--
  FATTORIA: the parts of this concept and where they go
  - h  the house: a body of 9 cells around H (casa), its walls w; the door d at the front (large y), on the axis of H
  - a  the barn: a lean-to wing against one side wall, 3 cells out and 5 deep (fienile), its walls v
       (the seed picks the side, left or right, and where along that side)
  - p  the porch: in front of the door, 2 cells deep and 5 wide, under a roof on posts (portico)
  - r  the road from the porch straight to the front edge (strada)
  - y  the hay: a stack behind the house, against the back wall (fieno)
  - g  the yard: a band of farmyard around the buildings, only where 8 cells of ground go on past it (aia); x the fence around it, with the road as gate (staccionata)
  - q  the orchard: grown beyond the fence only where 12 cells of ground go on; t the trees in it (frutteto, albero)
  What the seeds change: the length of the house (5 or 6 in front of H), the side and place of the barn, so the hay and the yard follow
  What fits: Large (20) is the house, the barn, the porch and the hay; Huge (30) adds the yard and the fence; Gargantuan (40) adds the orchard with trees
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdrpygxqtm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the house -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the barn on one side -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <!-- the way out: from H to the front wall (door), then the road to the edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- the porch in front of the door -->
      <all in="d/r" out="*/p" symmetry="()"/>
      <all in="p/r" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <!-- the hay behind, against the back wall -->
      <one in="EEE/EEE/www" out="***/*y*/***" symmetry="()" steps="1"/>
      <!-- the yard and its fence, only where the ground goes on -->
      <all in="[wvy]EEEEEEEE" out="*gg*******" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*x" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- the orchard beyond the fence, only where much ground goes on -->
      <all in="xEEEEEEEEEEEE" out="*qqqqq*******" steps="1"/>
      <all in="qE/*q" out="*q/**"/>
      <all in="qE/*x" out="*q/**"/>
      <all in="qqq/qqq/qqq" out="***/*t*/***"/>
    </sequence>
  </map>
  <color symbol="h" name="pavimento della casa" value="C8A878" area="house"/>
  <color symbol="w" name="muro della casa" value="E8DCC0"/>
  <color symbol="a" name="pavimento del fienile" value="B89060" area="barn"/>
  <color symbol="v" name="muro del fienile" value="A0402C"/>
  <color symbol="d" name="porta" value="6A4020"/>
  <color symbol="r" name="strada" value="B8A888"/>
  <color symbol="p" name="portico" value="9A7048" area="porch"/>
  <color symbol="y" name="fieno" value="E0C060"/>
  <color symbol="g" name="aia" value="A8B070" area="yard"/>
  <color symbol="x" name="staccionata" value="806040"/>
  <color symbol="q" name="frutteto" value="88A860" area="orchard"/>
  <color symbol="t" name="albero" value="4A7838"/>
  <color symbol="m" name="segno" value="FF00FF"/>
</sequence>
```
