# model.sculpt · claude-fable-5-1 · 312 s

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

## Your program so far
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

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento di casa, w muro di casa, s zona della scala, d porta, n lastricato, c aia, r strada, x staccionata, Q pozzo, b pavimento del fienile, v muro del fienile, a tettoia, p pilastro, y pagliaio, g campo, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEtEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEtEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEtEEEEEtEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEyyyEEEEEEEEEEEEEEEEEEEEEEE
EEEEyyyEEEEEEEEEEEEEEEEEEEEEEE
EEEEyyyEEEEEEEEEEpaaaaaaapEEEE
EEEvvvvvvvwwwwwwwwwwwaaaaaEEEE
EEEvbbbbbbwhhsssshhhwaaaaagEEE
EEEvbbbbbbwhhsssshhhwaaaapgEEE
EEEvbbbbbbwhhhhhhhhhwaaaaagEEE
EEEvbbbbbbwhhhhhhhhhwaaaaagEEE
EEgvbbbbbbwhhhhhhhhhwaaaapgEEE
EEgvbbbbbbwhhhhhhhhhwcccccxEEE
EEgvbbbbbbwhhhhhhhhhwcccccxEEE
EEgvbbbbbbwhhhhhhhhhwcccccxEEE
EEgvvvvvvvwhhhhhhhhhwcccccxEEE
EExcccccccwwwwdddwwwwcccccxEEE
EExcccccccccccnnncccccccccxEEE
EExcccccccccccnnncccccccccxEEE
EExcccQcccccccnnncccccccccxEEE
EExcccccccccccnnncccccccccxEEE
EExcccccccccccnnncccccccccxEEE
EExxxxxxxxxxxxrrrxxxxxxxxxxEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento di casa, w muro di casa, s zona della scala, d porta, n lastricato, c aia, r strada, x staccionata, Q pozzo, b pavimento del fienile, v muro del fienile, a tettoia, p pilastro, y pagliaio, g campo, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtEEEtEEEtEEEEEEEEtEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEtEEEEEEEtEEEEE
EEEEEEEEEEtEEEEEEEEEtEEEEEEEEE
EEEEyyyEEEEEEEEEEEEEEEEEEEEEEE
EEEEyyyEEEEEEEEEEEEEEEEEEEEEEE
EEEEyyyEEEEEEEEEEEEEEEEEEEEEEE
EEEvvvvvvvwwwwwwwwwwwaaaapEEEE
EEEvbbbbbbwhhsssshhhwaaaaaEEEE
EEEvbbbbbbwhhsssshhhwaaaaagEEE
EEEvbbbbbbwhhhhhhhhhwaaaapgEEE
EEEvbbbbbbwhhhhhhhhhwaaaaagEEE
EEgvbbbbbbwhhhhhhhhhwaaaaagEEE
EEgvbbbbbbwhhhhhhhhhwaaaapgEEE
EEgvbbbbbbwhhhhhhhhhwcccccxEEE
EEgvbbbbbbwhhhhhhhhhwcccccxEEE
EEgvvvvvvvwhhhhhhhhhwcccccxEEE
EExcccccccwwwwdddwwwwcccccxEEE
EExcccccccccccnnncccccccccxEEE
EExcccccccccccnnncccccccccxEEE
EExccQccccccccnnncccccccccxEEE
EExcccccccccccnnncccccccccxEEE
EExcccccccccccnnncccccccccxEEE
EExxxxxxxxxxxxrrrxxxxxxxxxxEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento di casa, w muro di casa, s zona della scala, d porta, n lastricato, c aia, r strada, x staccionata, Q pozzo, b pavimento del fienile, v muro del fienile, a tettoia, p pilastro, y pagliaio, g campo, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEtEEEEEEEEEEEEtEEEE
EEEEEEEEtEEEEEEEEEEEEEEEEEEEEE
EEEEtEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEtEEEEEEEEEE
EEEEEEEEEEEEtEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEyyyEEEE
EEEEtEEEEEEEEEEEEEEEEEEyyyEEEE
EEEEEEEEEEEEEEEEEEEEEEEyyyEEEE
EEEEEEEEEEwwwwwwwwwwwvvvvvvvEE
EEEEEEEEEEwhhsssshhhwbbbbbbvEE
EEEEEpaaaawhhsssshhhwbbbbbbvEE
EEEEEaaaaawhhhhhhhhhwbbbbbbvEE
EEEEgaaaaawhhhhhhhhhwbbbbbbvEE
EEEEgpaaaawhhhhhhhhhwbbbbbbvgE
EEEEgaaaaawhhhhhhhhhwbbbbbbvgE
EEEEgaaaaawhhhhhhhhhwbbbbbbvgE
EEEEgpaaaawhhhhhhhhhwbbbbbbvgE
EEEExcccccwhhhhhhhhhwvvvvvvvgE
EEEExcccccwwwwdddwwwwcccccccxE
EEEExcccccccccnnncccccccccccxE
EEEExcccccccccnnncccccccQcccxE
EEEExcccccccccnnncccccccccccxE
EEEExcccccccccnnncccccccccccxE
EEEExcccccccccnnncccccccccccxE
EEEExxxxxxxxxxrrrxxxxxxxxxxxxE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento di casa, w muro di casa, s zona della scala, d porta, n lastricato, c aia, r strada, x staccionata, Q pozzo, b pavimento del fienile, v muro del fienile, a tettoia, p pilastro, y pagliaio, g campo, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEtEEEtEEEEEEEEEEtEEEtEEEE
EEEEEEEEEEEtEEEEEEEEEEEEEEtEEEEEEEEEEEEE
EEEEEEEtEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEtEEEEEEEEtEEEEtEEE
EEEEEEEEEEEEEEtEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEtEEEEEEEtEEEEEEEEEEEEEEEEEEEEE
EEEtEEEEEEEEEEEEEEEEEEEEEEtEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEtEEEEEEEEtEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEtEEEE
EEEEEEEEEEEyyyEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEyyyEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtEEEEEEEyyyEEEEEEEEpaaaaaaapEEEEEEEEE
EEEEEEEEvvvvvvvwwwwwwwwwwwaaaaaggggggggE
EEEEEEEEvbbbbbbwhhsssshhhwaaaaaggggggggE
EEEEEEEEvbbbbbbwhhsssshhhwaaaapggggggggE
EEEEEEEEvbbbbbbwhhhhhhhhhwaaaaaggggggggE
EEEEEgggvbbbbbbwhhhhhhhhhwaaaaaggggggggE
EEEEEgggvbbbbbbwhhhhhhhhhwaaaapxxxgggggE
EEEEEgggvbbbbbbwhhhhhhhhhwcccccccxgggggE
EEEEEgggvbbbbbbwhhhhhhhhhwcccccccxgggggE
EEEEEgggvbbbbbbwhhhhhhhhhwcccccccxgggggE
EEEEExxxvvvvvvvwhhhhhhhhhwcccccccxgggggE
EEEEExcccccccccwwwwdddwwwwcccccccxgggggE
EEEEExcccccccccccccnnncccccccccccxgggggE
EEEEExcccccccccccccnnncccccccccccxgggggE
EEEEExcccccccccccccnnncccccccccccxgggggE
EEEEExcccccccccQcccnnncccccccccccxgggggE
EEEEExcccccccccccccnnncccccccccccxgggggE
EEEEExcccccccccccccnnncccccccccccxgggggE
EEEEExcccccccccccccnnncccccccccccxgggggE
EEEEExxxxxxxxxxxxxxrrrxxxxxxxxxxxxgggggE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.33 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
FATTORIA: casa colonica a due piani (pavimento h, muri w, scala s) al centro, porta d sul fronte e strada r fino al bordo;
stalla/fienile (b, muri v) addossata a un fianco della casa dall'angolo di dietro in avanti (il seme sceglie il lato);
tettoia (a, pilastri p) addossata all'altro fianco, 7 celle lunga e 4 fonda, posizione lungo il muro a caso;
aia c davanti a tutto, col lastricato n dalla porta, il pozzo Q dove sta, la staccionata x intorno con il varco sulla strada;
pagliaio y dietro il fienile, alberi t dove c'è terra libera 7x7.
Huge (30x30): casa, fienile, tettoia, aia col pozzo, staccionata, pagliaio, qualche albero.
Gargantuan (40x40): l'aia cresce dove la terra avanza, e oltre la staccionata nascono i campi g e più alberi.
Scala piena: casa 64 alta con due piani (f pavimento, F solaio) e tetto a padiglione R, fienile 39 con tetto R, tettoia su pilastri P con tetto J a 34,
pagliaio a cumulo, pozzo di pietra con acqua, staccionata di pali x e assi l, alberi con tronco K e chioma G, camino C.
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
    <map scale="5 5 1" values="BEfFWULhswdTkOoNVYvbjRaPzJcnrxlQuygtKGC#20#21#90#91#92" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="OOOOO/OOOOO/OOOOO/OOOOO/OOOOO"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="x" out="ccccc/ccccc/ccxcc/ccccc/ccccc"/>
      <rule in="Q" out="ccccc/cQQQc/cQuQc/cQQQc/ccccc"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="p" out="aaaaa/aPPPa/aPPPa/aPPPa/aaaaa"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="EEEEE/EEEEE/EEtEE/EEEEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <!-- B. muri di casa: intonaco, fascia delle finestre, intonaco, per due piani; in cima il tetto -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- il muro sopra la porta di casa -->
        <all in="B O" out="d *" steps="1"/>
        <all in="B d" out="d W" steps="62"/>
        <prl in="d" out="R"/>
        <!-- pavimento, striscia della scala, aria, solaio, aria, soffitto = tetto -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- muri del fienile: legno, fascia, legno, 39 alti; soffitto = tetto -->
        <all in="B v" out="v V" steps="12"/><all in="B v" out="v Y" steps="12"/><all in="B v" out="v V" steps="15"/>
        <prl in="v" out="R"/>
        <all in="B b" out="j *" steps="1"/>
        <all in="B j" out="j B" steps="38"/>
        <prl in="j" out="R"/>
        <!-- la porta del fienile: dall'aia, 11 larga, attraverso tutto lo spessore -->
        <one in="VVVVVVVVVVV/ccccccccccc" out="OOOOOOOOOOO/***********" symmetry="()" steps="1"/>
        <all in="V/O" out="O/*" symmetry="()" steps="4"/>
        <!-- la tettoia: pilastri 33 alti, tetto a 34 -->
        <all in="B a" out="z *" steps="1"/>
        <all in="B z" out="z B" steps="33"/>
        <prl in="z" out="J"/>
        <all in="B P" out="P *" steps="33"/>
        <all in="B P" out="J *" steps="1"/>
        <!-- C. le parti -->
        <union symbol="+" values="WUVYLR"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- finestre di casa, nella fascia, 6 larghe e 8 alte, passanti -->
        <one steps="20"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- finestre del fienile, 5 larghe e 6 alte -->
        <one steps="6"><rule in="BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY BY/BY/BY/BY/BY" out="*L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L *L/*L/*L/*L/*L"/></one>
        <all in="LYYYYB" out="*LLLL*"/>
        <prl in="Y" out="V"/>
        <!-- tetti a padiglione, gronda di uno, pendenza uno su due -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="13" symmetry="()"/>
        <!-- il camino -->
        <one in="B B R" out="* C *" steps="1" symmetry="()"/>
        <all in="B C" out="C *" steps="10"/>
        <all in="CB" out="*C" steps="1"/>
        <!-- il pagliaio: cumulo 8 alto che si stringe -->
        <all in="B y" out="y *" steps="7"/>
        <all in="*****/*****/**B**/*****/***** **y**/**y**/yyyyy/**y**/**y**" out="*****/*****/**y**/*****/***** *****/*****/*****/*****/*****" steps="3" symmetry="()"/>
        <!-- il pozzo: anello di pietra 5 alto -->
        <all in="B Q" out="Q *" steps="4"/>
        <!-- la staccionata: pali 8 alti e assi tra i pali -->
        <all in="B x" out="x *" steps="7"/>
        <all in="xBBBBx" out="*llll*"/>
        <!-- gli alberi: tronco 12, chioma tonda -->
        <all in="B t" out="t K" steps="12"/>
        <prl in="t" out="G"/>
        <all steps="3"><rule in="GB" out="*G"/><rule in="B G" out="G *"/><rule in="G B" out="* G"/></all>
        <all in="GB/BB" out="B*/**"/>
        <all in="GB BB" out="B* **"/>
        <!-- pulizia -->
        <prl><rule in="L" out="B"/></prl>
      </sequence>
    </map>
  </map>
  <color symbol="f" value="C8A878" name="pavimento di assi" area="house"/>
  <color symbol="F" value="A88858" name="solaio"/>
  <color symbol="W" value="E8DECC" name="intonaco"/>
  <color symbol="U" value="E8DECC" name="fascia delle finestre"/>
  <color symbol="L" value="FF00FF" name="segno della finestra"/>
  <color symbol="h" value="FF00FF" name="segno del pavimento"/>
  <color symbol="s" value="FF00FF" name="segno della scala"/>
  <color symbol="w" value="FF00FF" name="segno del muro"/>
  <color symbol="d" value="FF00FF" name="segno della porta"/>
  <color symbol="T" value="FF00FF" name="striscia della scala"/>
  <color symbol="k" value="8A6A40" name="gradini"/>
  <color symbol="O" value="6A4A2A" name="porta"/>
  <color symbol="o" value="4A3018" name="assi della porta"/>
  <color symbol="N" value="9A8C78" name="stipiti"/>
  <color symbol="V" value="A85838" name="tavole del fienile"/>
  <color symbol="Y" value="A85838" name="fascia del fienile"/>
  <color symbol="v" value="FF00FF" name="segno del fienile"/>
  <color symbol="b" value="B89060" name="terra battuta" area="barn"/>
  <color symbol="j" value="FF00FF" name="segno del soffitto"/>
  <color symbol="R" value="B04830" name="tegole"/>
  <color symbol="a" value="D0B890" name="selciato della tettoia" area="porch"/>
  <color symbol="P" value="5A4028" name="pilastro"/>
  <color symbol="z" value="FF00FF" name="segno della tettoia"/>
  <color symbol="J" value="7A6048" name="tetto di assi"/>
  <color symbol="c" value="C4B06A" name="aia" area="courtyard"/>
  <color symbol="n" value="9A9A90" name="lastricato"/>
  <color symbol="r" value="8A8070" name="strada" area="road"/>
  <color symbol="x" value="6A4A2A" name="palo della staccionata"/>
  <color symbol="l" value="8A6A40" name="assi della staccionata"/>
  <color symbol="Q" value="606878" name="pietra del pozzo"/>
  <color symbol="u" value="4A80B0" name="acqua"/>
  <color symbol="y" value="E0C050" name="paglia" area="hay"/>
  <color symbol="g" value="88A050" name="campo" area="field"/>
  <color symbol="t" value="FF00FF" name="segno dell'albero"/>
  <color symbol="K" value="5A3A20" name="tronco"/>
  <color symbol="G" value="4A8040" name="chioma"/>
  <color symbol="C" value="707070" name="camino"/>
  <color symbol="#20" value="000000" hidden="True" name="porta aperta"/>
  <color symbol="#21" value="000000" hidden="True" name="assi aperte"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
