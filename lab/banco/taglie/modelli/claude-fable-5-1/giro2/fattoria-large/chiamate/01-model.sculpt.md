# model.sculpt · claude-fable-5-1 · 117 s

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
FATTORIA — le parti del concetto e dove stanno:
 h/w/s  la casa: corpo attorno ad H (7 celle di luce, 8-9 di fondo), due piani, la scala s lungo il muro di fondo
 d/r    la porta sul fronte, in asse con H, tre celle; la strada r dritta fino al bordo
 a/p    la tettoia: contro un fianco della casa, il fianco e il punto scelti dal seme, pavimento a, pali p sul bordo
 f      il fieno: catasta dietro il muro di fondo, larga quanto la casa
 y/x    il cortile y attorno a tutto, lo steccato x dove la terra continua (passa la strada)
 Q      il pozzo in un angolo del cortile
 t/g    gli alberi dove c'è prato libero; i campi g oltre lo steccato dove la terra va avanti (solo alla taglia grande)
 Semi: il fondo della casa (8 o 9), il fianco della tettoia e dove sta, quanti alberi e dove, dove il pozzo.
 Taglie: a 5x5 casa, tettoia, fieno, cortile stretto e steccato; a 7.5 il cortile largo, i campi coi frutteti, piu' alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdrapfyxQtgm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- il corpo della casa -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- la zona della scala lungo il muro di fondo -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- la tettoia contro un fianco -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*p"/>
      <all in="pE/*p" out="*p/**"/>
      <!-- il fieno dietro -->
      <all in="E/w/h" out="f/*/*" symmetry="()" steps="1"/>
      <all in="E/f" out="f/*" symmetry="()" steps="2"/>
      <!-- il cortile: un anello sempre, un secondo dove la terra continua -->
      <all in="[wpf]E" out="*y"/>
      <all in="yE/*y" out="*y/**"/>
      <all in="yEEE" out="*y**" steps="1"/>
      <all in="yE/*y" out="*y/**"/>
      <!-- la via d'uscita: dal centro al fronte, porta e strada fino al bordo -->
      <all in="[Hm]/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/[yE]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[yE]" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- lo steccato dove la terra continua -->
      <all in="yE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- il pozzo in un angolo del cortile -->
      <one in="yyy/yyy" out="***/*Q*" steps="1"/>
      <!-- i campi oltre lo steccato, dove la terra va avanti -->
      <all in="xEEEEEEE" out="*gggggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- gli alberi: frutteto nei campi, alberi nel prato libero -->
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**t**/*****/*****"/>
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****"/>
    </sequence>
  </map>
  <color symbol="h" value="C8A878" name="pavimento di casa"/>
  <color symbol="w" value="E8DCC0" name="muro di casa"/>
  <color symbol="s" value="A08858" name="zona della scala"/>
  <color symbol="d" value="6A4A2A" name="porta"/>
  <color symbol="r" value="B8A890" name="strada"/>
  <color symbol="a" value="D8C8A0" name="pavimento della tettoia"/>
  <color symbol="p" value="7A5A3A" name="pali della tettoia"/>
  <color symbol="f" value="E0C050" name="fieno"/>
  <color symbol="y" value="9AB060" name="cortile"/>
  <color symbol="x" value="8A6A48" name="steccato"/>
  <color symbol="Q" value="808890" name="pozzo"/>
  <color symbol="t" value="4A8A3A" name="albero"/>
  <color symbol="g" value="A09040" name="campo"/>
  <color symbol="m" value="FF00FF" name="segno"/>
</sequence>
```
