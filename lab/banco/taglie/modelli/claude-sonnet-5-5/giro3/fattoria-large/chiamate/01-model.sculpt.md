# model.sculpt · claude-sonnet-5-5 · 371 s

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
FATTORIA, block 1: the composition on the plan (a cell is 5 voxels).
PARTS AND LETTERS
  house (h floor, w wall, H centre): 9 x 8-9 cells inside, around H, 4 behind, 3 in front plus one by chance.
  door d at the middle of the front wall, 3 cells wide; the road r runs straight from it to the edge.
  stair zone s: inside, at the back corner (left or right by chance), two cells of landing before it.
  lean-to (a floor, p posts): 4 cells deep, 7 along one SIDE wall of the house, left or right by chance.
  haystack y: 4 x 2 against the BACK wall, anywhere along it.
  yard c: a one-cell ring around the house, so every part is joined to the road by it.
  garden g: 4 x 3 in front of the house, beside the road, on the yard.
  well Q: 2 x 2 on the edge of the yard, wherever two cells of free ground go on past it.
  barn (v wall, b floor, u door): ONLY where the ground allows it (huge): 8 x 9 cells, flush with the yard
      on the side of the house OPPOSITE the lean-to (the lean-to breaks the yard on its side), door toward the yard.
  orchard t: trees spaced 7 apart wherever 7 x 7 of free lawn exist (huge only).
WHAT THE SEEDS CHANGE
  the depth of the house, the side of the lean-to and where along the wall, the side of the stair,
  the place of the hay, of the garden, of the well, of the barn along the yard, and the orchard.
WHAT FITS
  large (20 x 20): house, lean-to, hay behind, yard, garden, well. Less, not smaller.
  huge (30 x 30): the same, plus the barn on the free side and the orchard.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwapmdrycgQtvbus" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">

      <!-- the house: a line through H, then 4 cells to each side, then its walls -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- the zone of the stair, in a back corner of the house, landing at the small-x end -->
      <one steps="1">
        <rule in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()"/>
        <rule in="wwwwwww/hhhhhhw/hhhhhhw" out="*******/**ssss*/**ssss*" symmetry="()"/>
      </one>

      <!-- the lean-to: 7 along a side wall, 4 deep, posts at both ends and in the middle of the outer edge -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/**/a*/**/**/**" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="aE" out="*p" symmetry="(x)" steps="1"/>
      <all in="p/p/p/p/p/p/p" out="*/a/a/*/a/a/*" symmetry="()"/>

      <!-- the hay behind, against the back wall -->
      <one in="EEEE/EEEE/wwww" out="yyyy/yyyy/****" symmetry="()" steps="1"/>

      <!-- the way out: from H through the house to the front, the door, the road to the edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>

      <!-- the yard: a ring around the house, corners filled -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- the barn: only where nine cells of yard side and eight of free ground go on past it; flush with the yard -->
      <one in="cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE/cEEEEEEEE"
           out="*vvvvvvvv/*vbbbbbbv/*vbbbbbbv/*ubbbbbbv/*ubbbbbbv/*ubbbbbbv/*vbbbbbbv/*vbbbbbbv/*vvvvvvvv"
           symmetry="(x)" steps="1"/>

      <!-- the garden in front of the house, on the yard, beside the road -->
      <one in="cccc/EEEE/EEEE/EEEE" out="****/gggg/gggg/gggg" symmetry="()" steps="1"/>

      <!-- the well on the edge of the yard -->
      <one in="cc/EE/EE" out="**/QQ/QQ" symmetry="(xy)" steps="1"/>

      <!-- the orchard: a tree in every 7 x 7 of free lawn -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE"
           out="*******/*******/*******/***t***/*******/*******/*******" steps="6"/>

      <!-- the markers go back to the floor -->
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

    </sequence>
  </map>

  <color symbol="B" value="000000" name="aria" hidden="True"/>
  <color symbol="E" value="7FA05A" name="terreno" hidden="True"/>
  <color symbol="H" value="C9A96E" name="centro della casa" hidden="True" area="house"/>
  <color symbol="h" value="C9A96E" name="pavimento della casa" area="house"/>
  <color symbol="w" value="E7D9B4" name="muro della casa"/>
  <color symbol="a" value="B58B5A" name="pavimento della tettoia" area="porch"/>
  <color symbol="p" value="6B4A2F" name="palo della tettoia" area="porch"/>
  <color symbol="m" value="D9C08A" name="passaggio interno" hidden="True" area="house"/>
  <color symbol="d" value="8B3A2A" name="porta della casa"/>
  <color symbol="r" value="D2BC8C" name="strada"/>
  <color symbol="s" value="9A7B5C" name="zona della scala"/>
  <color symbol="y" value="E3C14B" name="fieno" area="hay"/>
  <color symbol="c" value="B9A27A" name="aia" area="yard"/>
  <color symbol="g" value="5E8C3A" name="orto" area="garden"/>
  <color symbol="Q" value="7C7C84" name="pozzo" area="yard"/>
  <color symbol="t" value="3E7A3A" name="albero" area="orchard"/>
  <color symbol="v" value="A3472E" name="muro del fienile"/>
  <color symbol="b" value="B08A5A" name="pavimento del fienile" area="barn"/>
  <color symbol="u" value="5A2B1D" name="porta del fienile"/>
</sequence>
