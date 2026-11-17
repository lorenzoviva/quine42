# model.sculpt · claude-opus-5-5 · 56 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a dwelling (see «What fits»): the house takes most of the area, not a cottage in a garden. At least 10 tiles² of covered floor where a body stands (its centre, half a body off every wall) on the ground floor and on another storey, the ground floor in 2 rooms or more of at least 1.5 tiles² each (the hall and a room) divided by an inner wall with a door: about 75 × 65 voxels inside the outer walls at every size, two storeys.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
<!--
Fattoria: concetto e parti (piano, una cella = 5 voxel)
 H centro; h pavimento della casa (due stanze, sala e camera, divise da un muro interno j lungo y nel mezzo);
 w muri esterni della casa; s zona della scala nella stanza a sinistra, lungo il muro di fondo;
 d porta sul davanti, al centro, larga 3 celle; r strada dalla porta al bordo;
 a tettoia (lean-to) contro il muro di fondo, il fieno sotto; il seme ne sceglie il punto lungo il fondo.
 c aia attorno alla casa; x staccionata che chiude l'aia dove c'e' terreno oltre;
 Y covone di fieno nell'aia; t alberi nel prato; g campi arati fuori dalla staccionata.
 Large: casa (15 x 11 celle) con tettoia dietro e la strada. Huge: anche aia, staccionata, covone, alberi, campi.
 I semi cambiano: la posizione della tettoia sul fondo, i covoni, gli alberi, la forma dei campi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjsdmratcxYg" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- il corpo della casa: 4 dietro, 6 davanti, 7 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- la porta sul davanti e la strada fino al bordo -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/></prl>
      <!-- il muro interno lungo y attraverso il centro: sala a destra, camera a sinistra -->
      <all in="j/h" out="*/j" symmetry="()"/>
      <all in="h/[Hj]" out="j/*" symmetry="()"/>
      <all in="[Hj]/h" out="*/j" symmetry="()"/>
      <prl in="H" out="j"/>
      <all in="j/h" out="*/j" symmetry="()"/>
      <!-- la zona della scala: lungo il muro di fondo, due celle di pianerottolo -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- la tettoia dietro la casa, da un punto scelto a caso del muro di fondo -->
      <one in="EEEEE/E***E/w***w" out="*****/**a**/*****" symmetry="()" steps="1"/>
      <one in="E/w" out="a/*" symmetry="()" steps="1"/>
      <all in="aE/*w" out="*a/**" symmetry="(x)" steps="4"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <!-- l'aia attorno a tutto -->
      <all in="[wa]E" out="*c" steps="1"/><all in="cE/*[wac]" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- la staccionata solo dove il terreno continua -->
      <all in="cEEE" out="*x**" steps="1"/><all in="xE/*x" out="*x/**"/>
      <all in="xE/cx" out="*x/**"/>
      <!-- covone nell'aia, alberi e campi fuori -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Y**/*****/*****" steps="2"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="6"/>
      <all in="EEE/EEE/EEE" out="ggg/ggg/ggg"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" value="ff00ff" name="centro"/>
  <color symbol="h" value="b08a5a" name="pavimento di casa" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro intonacato"/>
  <color symbol="j" value="c9b892" name="muro interno"/>
  <color symbol="s" value="8a6a40" name="zona della scala"/>
  <color symbol="d" value="5a3a20" name="porta"/>
  <color symbol="m" value="ff8800" name="tracciato"/>
  <color symbol="r" value="a89a80" name="strada battuta" area="road"/>
  <color symbol="a" value="9a7a48" name="tettoia del fieno" area="barn"/>
  <color symbol="t" value="5a8a3a" name="albero" area="garden"/>
  <color symbol="c" value="c8b888" name="aia" area="yard"/>
  <color symbol="x" value="7a5a38" name="staccionata"/>
  <color symbol="Y" value="e0c060" name="covone di fieno" area="yard"/>
  <color symbol="g" value="8a7040" name="campo arato" area="field"/>
</sequence>
```
