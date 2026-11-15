# model.sculpt · claude-fable-5-1 · 201 s

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

## Your program so far
<!-- FATTORIA: casa colonica a due piani (h interno, w muri, s zona scala contro il muro di fondo), tettoia a pali (a pavimento, p pali) addossata a un fianco scelto dal seme, pagliaio (y) dietro la casa a un passo dal muro, porta d al centro del fronte e strada r fino al bordo, aia c attorno con staccionata x e fattoria g (campi) oltre.
     Seme: profondità della casa (5 o 6 avanti), fianco e posizione della tettoia, posizione del pagliaio, pozzo Q nell'aia e alberi t nei campi dove c'è spazio.
     Large: casa + tettoia + pagliaio, aia e staccionata solo dove restano celle. Huge: aia più larga, staccionata completa, campi, pozzo, alberi. -->
<sequence values="BHEhwsapydrcxgtQm" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsapydrcxgtQm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- corpo della casa -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- porta e via d'uscita -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- zona scala contro il muro di fondo -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- tettoia a pali su un fianco -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/><all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*p"/>
      <!-- pagliaio dietro la casa -->
      <one in="E/E/E/w" out="*/y/*/*" symmetry="()" steps="1"/>
      <all in="yE" out="*y" symmetry="(x)" steps="2"/>
      <all in="E/y" out="y/*" symmetry="()" steps="2"/>
      <!-- aia attorno a tutto, due celle, poi più larga dove la terra continua -->
      <all in="[wpyd]E" out="*c"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*ccc***" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- staccionata e campi -->
      <all in="cE" out="*x"/><all in="xE/*x" out="*x/**"/>
      <all in="xE" out="*g"/><all in="gE" out="*g"/>
      <!-- strada dalla porta al bordo, tre celle -->
      <all in="[dr]/[cxg]" out="*/r" symmetry="()"/>
      <all in="r[cxg]" out="*r" symmetry="(x)" steps="1"/>
      <!-- pozzo nell'aia, alberi nei campi dove c'è posto -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**t**/*****/*****" steps="4"/>
    </sequence>
  </map>
  <color symbol="H" value="FF00FF" name="centro"/>
  <color symbol="m" value="FF88FF" name="linea"/>
  <color symbol="h" value="E8D8B0" name="pavimento di casa" area="house"/>
  <color symbol="w" value="B0A090" name="muro"/>
  <color symbol="s" value="C8A860" name="zona scala"/>
  <color symbol="a" value="D8C8A0" name="tettoia" area="porch"/>
  <color symbol="p" value="806040" name="palo"/>
  <color symbol="y" value="E0C040" name="pagliaio" area="barn"/>
  <color symbol="d" value="A05020" name="porta"/>
  <color symbol="r" value="C0B090" name="strada"/>
  <color symbol="c" value="A8B870" name="aia" area="yard"/>
  <color symbol="x" value="705030" name="staccionata"/>
  <color symbol="g" value="78A050" name="campo" area="field"/>
  <color symbol="t" value="407030" name="albero"/>
  <color symbol="Q" value="607080" name="pozzo"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: h pavimento di casa, w muro, s zona scala, a tettoia, p palo, y pagliaio, d porta, r strada, c aia, x staccionata, g campo, Q pozzo
Plan (the letter of every cell):
```
cccccccccccccccccxgg
cccccccccccccccccxgg
ccccccyyyyyccQcccxgg
ccccccyyyyyccccccxgg
ccccccyyyyyccccccxgg
cccccccccccccccccxgg
ccccccwwwwwwwwwccxgg
ccccccwhhsssshwccxgg
ccppppwhhsssshwccxgg
cpaaaawhhhhhhhwccxgg
cpaaaawhhhhhhhwccxgg
cpaaaawhhhhhhhwccxgg
cpaaaawhhhhhhhwccxgg
cpaaaawhhhhhhhwccxgg
cpaaaawhhhhhhhwccxgg
cpaaaawhhhhhhhwccxgg
ccppppwwwdddwwwccxgg
ccccccccrrrrrccccxgg
ccccccccrrrrrccccxgg
xxxxxxxxrrrrrxxxxxgg
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: h pavimento di casa, w muro, s zona scala, a tettoia, p palo, y pagliaio, d porta, r strada, c aia, x staccionata, g campo, Q pozzo
Plan (the letter of every cell):
```
cccccccccccccccccxgg
cccccccccccccccccxgg
ccccccyyyyyccccccxgg
ccccccyyyyyccccccxgg
cccQccyyyyyccccccxgg
cccccccccccccccccxgg
ccccccwwwwwwwwwccxgg
ccppppwhhsssshwccxgg
cpaaaawhhsssshwccxgg
cpaaaawhhhhhhhwccxgg
cpaaaawhhhhhhhwccxgg
cpaaaawhhhhhhhwccxgg
cpaaaawhhhhhhhwccxgg
cpaaaawhhhhhhhwccxgg
cpaaaawhhhhhhhwccxgg
ccppppwhhhhhhhwccxgg
ccccccwwwdddwwwccxgg
ccccccccrrrrrccccxgg
ccccccccrrrrrccccxgg
xxxxxxxxrrrrrxxxxxgg
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: h pavimento di casa, w muro, s zona scala, a tettoia, p palo, y pagliaio, d porta, r strada, c aia, x staccionata, g campo, Q pozzo
Plan (the letter of every cell):
```
gggxcccccccccccccccc
gggxcccccccccccccccc
gggxcccccyyyyycccccc
gggxcccccyyyyycccccc
gggxcccccyyyyycccccc
gggxcccccccccccppppc
gggxccwwwwwwwwwaaaap
gggxccwhhsssshwaaaap
gggxccwhhsssshwaaaap
gggxccwhhhhhhhwaaaap
gggxccwhhhhhhhwaaaap
gggxccwhhhhhhhwaaaap
gggxccwhhhhhhhwaaaap
gggxccwhhhhhhhwppppc
gggxccwhhhhhhhwccccc
gggxccwhhhhhhhwccccc
gggxccwwwdddwwwccQcc
gggxccccrrrrrccccccc
gggxccccrrrrrccccccc
gggxxxxxrrrrrxxxxxxx
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: h pavimento di casa, w muro, s zona scala, a tettoia, p palo, y pagliaio, d porta, r strada, c aia, x staccionata, g campo, Q pozzo
Plan (the letter of every cell):
```
gggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggg
gggxxxxxxxxxxxxxxxxxxxxxxxgggg
gggxcccccccccccccccccccccxgggg
gggxcccccccccccccccccccccxgggg
gggxcccccccyyyyycccccccccxgggg
gggxcccccccyyyyycccccccccxgggg
gggxcccccccyyyyycccccccccxgggg
gggxcccccccccccccccccccccxgggg
gggxcccccccwwwwwwwwwcccccxgggg
gggxcccccccwhhsssshwcccccxgggg
gggxcccppppwhhsssshwcccccxgggg
gggxccpaaaawhhhhhhhwcccccxgggg
gggxccpaaaawhhhhhhhwcccccxgggg
gggxccpaaaawhhhhhhhwcccccxgggg
gggxccpaaaawhhhhhhhwcccccxgggg
gggxccpaaaawhhhhhhhwccQccxgggg
gggxccpaaaawhhhhhhhwcccccxgggg
gggxccpaaaawhhhhhhhwcccccxgggg
gggxcccppppwwwdddwwwcccccxgggg
gggxcccccccccrrrrrcccccccxgggg
gggxcccccccccrrrrrcccccccxgggg
gggxcccccccccrrrrrcccccccxgggg
gggxcccccccccrrrrrcccccccxgggg
gggxcccccccccrrrrrcccccccxgggg
gggxxxxxxxxxxrrrrrxxxxxxxxgggg
gggggggggggggrrrrrgggggggggggg
gggggggggggggrrrrrgggggggggggg
```
How much the plans of the seeds differ: 0.42 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!-- FATTORIA: casa colonica a due piani (h interno, w muri, s zona scala contro il muro di fondo), tettoia a pali (a pavimento, p pali) addossata a un fianco scelto dal seme, pagliaio (y) dietro la casa a un passo dal muro, porta d al centro del fronte e strada r fino al bordo, aia c attorno con staccionata x e campi g oltre.
     Seme: profondità della casa (5 o 6 avanti), fianco e posizione della tettoia, posizione del pagliaio, pozzo Q nell'aia e alberi t nei campi dove c'è spazio.
     Large: casa + tettoia + pagliaio, aia e staccionata solo dove restano celle. Huge: aia più larga, staccionata completa, campi, pozzo, alberi. -->
<sequence values="BHEhwsapydrcxgtQmDfFTkWULROoNnPqJYGCA" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="WU"/>
  <union symbol="=" values="fF"/>
  <map scale="1/5 1/5 1" values="BHEhwsapydrcxgtQm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- corpo della casa -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- porta e via d'uscita -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- zona scala contro il muro di fondo -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- tettoia a pali su un fianco -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/><all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*p"/>
      <!-- pagliaio dietro la casa -->
      <one in="E/E/E/w" out="*/y/*/*" symmetry="()" steps="1"/>
      <all in="yE" out="*y" symmetry="(x)" steps="2"/>
      <all in="E/y" out="y/*" symmetry="()" steps="2"/>
      <!-- aia attorno a tutto, due celle, poi più larga dove la terra continua -->
      <all in="[wpyd]E" out="*c"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*ccc***" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- staccionata e campi -->
      <all in="cE" out="*x"/><all in="xE/*x" out="*x/**"/>
      <all in="xE" out="*g"/><all in="gE" out="*g"/>
      <!-- strada dalla porta al bordo, tre celle -->
      <all in="[dr]/[cxg]" out="*/r" symmetry="()"/>
      <all in="r[cxg]" out="*r" symmetry="(x)" steps="1"/>
      <!-- pozzo nell'aia, alberi nei campi dove c'è posto -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**t**/*****/*****" steps="4"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsDfFTkWULROoNnPqJYxcgGrtCQA" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="a" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="p" out="nnnnn/nPPPn/nPPPn/nPPPn/nnnnn"/>
      <rule in="y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="ccccc/cxxxc/cxxxc/cxxxc/ccccc"/>
      <rule in="g" out="ggggg/GGGGG/ggggg/GGGGG/ggggg"/>
      <rule in="t" out="ggggg/ggggg/ggtgg/ggggg/ggggg"/>
      <rule in="Q" out="ccccc/cQQQc/cQAQc/cQQQc/ccccc"/>
      <sequence symmetry="(xy)">
        <!-- B. muri: due piani, fascia per le finestre; il seme della porta alla base -->
        <all steps="1"><rule in="B w" out="w W"/><rule in="B D" out="w O"/></all>
        <all in="B w" out="w W" steps="5"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="11"/>
        <prl in="w" out="R"/>
        <!-- pavimenti, striscia della scala, solaio, soffitto -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="30"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- C. porta e scala -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- finestre nella fascia -->
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- tetto a padiglione -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <!-- tettoia: pali e copertura a 34 -->
        <all in="B P" out="P *" steps="33"/>
        <all in="B n" out="q *" steps="1"/>
        <all in="B q" out="q B" steps="33"/>
        <prl in="q" out="J"/>
        <all in="B P" out="J *" steps="1"/>
        <!-- pagliaio a cumulo -->
        <all in="B Y" out="Y *" steps="11"/>
        <all in="*****/*****/**B**/*****/***** **Y**/**Y**/YYYYY/**Y**/**Y**" out="*****/*****/**Y**/*****/***** *****/*****/*****/*****/*****" steps="4" symmetry="()"/>
        <!-- staccionata, pozzo, alberi -->
        <all in="B x" out="x *" steps="8"/>
        <all in="B Q" out="Q *" steps="5"/>
        <all in="B t" out="t *" steps="9"/>
        <all in="B t" out="C *" steps="1"/>
        <all steps="3"><rule in="CB" out="*C"/><rule in="B C" out="C *"/><rule in="C B" out="* C"/></all>
      </sequence>
    </map>
  </map>
  <color symbol="H" value="FF00FF" name="centro"/>
  <color symbol="m" value="FF88FF" name="linea"/>
  <color symbol="E" value="6E5A40" name="terra" hidden="True"/>
  <color symbol="h" value="E8D8B0" name="pavimento di casa" area="house"/>
  <color symbol="w" value="B0A090" name="muro"/>
  <color symbol="s" value="C8A860" name="zona scala"/>
  <color symbol="a" value="D8C8A0" name="tettoia" area="porch"/>
  <color symbol="p" value="806040" name="palo"/>
  <color symbol="y" value="E0C040" name="pagliaio" area="barn"/>
  <color symbol="d" value="A05020" name="porta"/>
  <color symbol="r" value="C0B090" name="strada"/>
  <color symbol="c" value="A8B870" name="aia" area="yard"/>
  <color symbol="x" value="705030" name="staccionata"/>
  <color symbol="g" value="78A050" name="campo" area="field"/>
  <color symbol="G" value="5E8240" name="solco" area="field"/>
  <color symbol="t" value="6A4A2A" name="tronco"/>
  <color symbol="C" value="4A8A3A" name="chioma"/>
  <color symbol="Q" value="707880" name="pozzo"/>
  <color symbol="A" value="5090B0" name="acqua"/>
  <color symbol="W" value="D8CDB8" name="intonaco"/>
  <color symbol="U" value="D8CDB8" name="fascia delle finestre"/>
  <color symbol="L" value="9ACBE0" name="vetro"/>
  <color symbol="f" value="C8A060" name="assi del pavimento" area="house"/>
  <color symbol="F" value="A08050" name="solaio"/>
  <color symbol="T" value="C8A860" name="striscia della scala"/>
  <color symbol="k" value="8A6030" name="gradino"/>
  <color symbol="R" value="B04030" name="tetto di coppi"/>
  <color symbol="O" value="6A4020" name="porta"/>
  <color symbol="o" value="4A2C14" name="assi della porta"/>
  <color symbol="N" value="E0D8C8" name="stipite"/>
  <color symbol="n" value="C8C0A8" name="lastre della tettoia" area="porch"/>
  <color symbol="P" value="7A5A34" name="palo"/>
  <color symbol="q" value="FF00FF" name="segno"/>
  <color symbol="J" value="806850" name="tetto della tettoia"/>
  <color symbol="Y" value="E0C040" name="paglia" area="barn"/>
  <color symbol="D" value="A05020" name="soglia"/>
  <color symbol="#20" value="000000" hidden="True"/>
  <color symbol="#21" value="000000" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
