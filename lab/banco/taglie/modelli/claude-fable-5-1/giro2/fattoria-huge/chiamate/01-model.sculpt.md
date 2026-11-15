# model.sculpt · claude-fable-5-1 · 200 s

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

```xml
<!--
FATTORIA: casa colonica a due piani (pavimento h, muri w, scala s) al centro, porta d sul fronte e strada r fino al bordo;
stalla/fienile (b, muri v) addossata a un fianco della casa dall'angolo di dietro in avanti (il seme sceglie il lato);
tettoia (a, pilastri p) addossata all'altro fianco, 7 celle lunga e 4 fonda, posizione lungo il muro a caso;
aia c davanti a tutto, col lastricato n dalla porta, il pozzo Q dove sta, la staccionata x intorno con il varco sulla strada;
pagliaio y dietro il fienile, alberi t dove c'è terra libera 7x7.
Huge (30x30): casa, fienile, tettoia, aia col pozzo, staccionata, pagliaio, qualche albero.
Gargantuan (40x40): l'aia cresce dove la terra avanza, e oltre la staccionata nascono i campi g e più alberi.
-->
<sequence values="BHEhwsdmncrxQbvaqpygt" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdmncrxQbvaqpygt" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- la casa: linea per H, 3 dietro, 5 davanti e una in più a caso, poi 4 per lato; muri, angoli pieni -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- la zona della scala, lungo il muro di dietro, due celle di pianerottolo -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- il fienile: dall'angolo di dietro di un fianco (a caso), 6 celle fuori e 8 in avanti, muri propri -->
      <one in="EE/wE/wE" out="**/**/*b" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="5"/>
      <all in="b/E" out="*/b" symmetry="()" steps="7"/>
      <all in="bE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- la tettoia: sull'altro fianco, da una cella a caso del muro, 3 per verso lungo il muro e 4 fuori; la fila esterna porta i pilastri -->
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="******/******/****a*/******/******" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="aE" out="*q" symmetry="(x)" steps="1"/>
      <all in="E/q" out="*/p" symmetry="()" steps="1"/>
      <all in="q/E" out="p/*" symmetry="()" steps="1"/>
      <one in="p/q/q/q/q/q/p" out="*/*/*/p/*/*/*" symmetry="()" steps="1"/>
      <prl in="q" out="a"/>
      <!-- l'aia davanti a casa, fienile e tettoia: 5 celle, rettangolo -->
      <all in="[wvap]/E" out="*/c" symmetry="()" steps="1"/>
      <all in="c/E" out="*/c" symmetry="()" steps="4"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- dove la terra avanza (gargantuan) l'aia cresce di due -->
      <all in="cEEEEEEEE" out="*cc******" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- l'uscita: da H dritto al fronte, porta d, lastricato n, strada r fino al bordo, larga 3 -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- il pozzo nell'aia, dove ci sta un 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- la staccionata intorno all'aia, col varco sulla strada -->
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- i campi oltre la staccionata, solo dove la terra avanza di sei (gargantuan) -->
      <all in="xEEEEEE" out="*ggggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- il pagliaio dietro il fienile, 3x3 -->
      <one in="E/E/E/v" out="*/y/*/*" symmetry="()" steps="1"/>
      <all in="yE" out="*y" steps="1"/>
      <all in="yE/*y" out="*y/**"/>
      <!-- gli alberi dove resta un 7x7 di terra -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="h" value="C8A878" name="pavimento di casa" area="house"/>
  <color symbol="w" value="D8CFC0" name="muro di casa"/>
  <color symbol="s" value="A0784A" name="zona della scala"/>
  <color symbol="d" value="6A4A2A" name="porta"/>
  <color symbol="m" value="FF00FF" name="segno"/>
  <color symbol="n" value="9A9A90" name="lastricato"/>
  <color symbol="c" value="C4B06A" name="aia" area="courtyard"/>
  <color symbol="r" value="8A8070" name="strada" area="road"/>
  <color symbol="x" value="7A5A38" name="staccionata"/>
  <color symbol="Q" value="606878" name="pozzo"/>
  <color symbol="b" value="B89060" name="pavimento del fienile" area="barn"/>
  <color symbol="v" value="B06040" name="muro del fienile"/>
  <color symbol="a" value="D0B890" name="tettoia" area="porch"/>
  <color symbol="q" value="FF00FF" name="segno della tettoia"/>
  <color symbol="p" value="5A4028" name="pilastro"/>
  <color symbol="y" value="E0C050" name="pagliaio" area="hay"/>
  <color symbol="g" value="88A050" name="campo" area="field"/>
  <color symbol="t" value="4A8040" name="albero" area="orchard"/>
</sequence>
```
