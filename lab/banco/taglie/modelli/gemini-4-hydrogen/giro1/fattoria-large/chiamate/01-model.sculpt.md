# model.sculpt · gemini-4-hydrogen · 13 s

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
  Fattoria (Block 1: Composizione)
  Parti e lettere:
  - h: pavimento della casa principale (attorno ad H, 8-9 x 9 celle)
  - w: muri della casa principale
  - s: zona della scala interna (4x2 celle lungo un muro interno)
  - d: porta d'ingresso sul davanti (3 celle)
  - a: pavimento del fienile/ala laterale (sul fianco sinistro o destro scelto dal seme)
  - v: muri del fienile
  - p: portico davanti alla casa
  - c: aia/cortile davanti e attorno alla casa
  - f: staccionata attorno all'aia
  - r: strada dalla porta fino al bordo anteriore
  - Q: pozzo nell'aia (se c'è spazio 5x5)
  - g: campo coltivato oltre la staccionata (alle taglie maggiori)
  - t: alberi da frutto su terreno libero (alle taglie maggiori)
  Variazioni dei semi: profondità della casa (8 o 9), lato del fienile (destra o sinistra), posizione della scala, posizione del pozzo e degli alberi.
  Taglie: a 5x5 (20x20 celle) entrano casa, portico, fienile, aia e staccionata; a 7.5x7.5 (30x30) e 10x10 (40x40) si aggiungono campi coltivati, pozzo e alberi.
-->
<sequence values="BHEhwsdavpcrfgQt" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdavpcrfgQt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale attorno a H: 3 dietro, 4 davanti (+1 a caso), 4 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <!-- Muri della casa principale -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Zona scala interna: 4x2 celle lungo un muro, con 2 celle di spazio davanti -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- Ala laterale (fienile) su un fianco a scelta del seme -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="4"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- Portico davanti alla casa -->
      <all in="w/E" out="*/p" symmetry="()" steps="3"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <!-- Aia attorno a casa, portico e fienile -->
      <all in="[wvpa]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Aia extra dove c'è molto spazio (taglie grandi) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Staccionata attorno all'aia -->
      <all in="cE" out="*f" steps="1"/>
      <all in="fE/*f" out="*f/**"/>
      <!-- Pozzo nell'aia se c'è un 5x5 libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- Campi coltivati oltre la staccionata dove c'è spazio (taglie grandi) -->
      <all in="fEEEEEE" out="*gggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- Alberi su terreno libero 7x7 -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="3"/>
      <!-- Strada dalla casa (H) fino al bordo anteriore, larga 3 celle -->
      <all in="H/h" out="*/r" symmetry="()" steps="1"/>
      <all in="r/h" out="*/r" symmetry="()"/>
      <all in="r/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dp]/p" out="*/p" symmetry="()"/>
      <all in="[dpc]/c" out="*/r" symmetry="()"/>
      <all in="r/f" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rc" out="*r" symmetry="(x)" steps="1"/>
      <all in="rf" out="*r" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="r" out="h" symmetry="()"/>
    </sequence>
  </map>
  <color symbol="E" value="6E8B4A" hidden="True"/>
  <color symbol="H" value="D9C8A9" name="centro" area="house"/>
  <color symbol="h" value="D9C8A9" name="pavimento" area="house"/>
  <color symbol="w" value="C7B299" name="muro" area="house"/>
  <color symbol="s" value="A67C52" name="scala" area="house"/>
  <color symbol="d" value="6E472B" name="porta" area="house"/>
  <color symbol="a" value="C9B48C" name="fienile" area="barn"/>
  <color symbol="v" value="8C5A3C" name="muro fienile" area="barn"/>
  <color symbol="p" value="B88E65" name="portico" area="porch"/>
  <color symbol="c" value="B59E7A" name="aia" area="yard"/>
  <color symbol="f" value="7A5230" name="staccionata" area="yard"/>
  <color symbol="r" value="9E8B70" name="strada" area="yard"/>
  <color symbol="Q" value="5B84B1" name="pozzo" area="yard"/>
  <color symbol="g" value="8A794D" name="campo" area="field"/>
  <color symbol="t" value="4F772D" name="albero" area="orchard"/>
</sequence>
```
