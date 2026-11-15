# model.sculpt · claude-fable-5-1 · 184 s

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

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento di casa, w muro di casa, s zona della scala, d porta, r strada, a pavimento della tettoia, p pali della tettoia, f fieno, y cortile, x steccato, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
xxxxxxxxxxxxxxxxxxEE
xyyyyyyyyyyyyyyyyxEE
xyyyyyyffyyyyfyyyxEE
xyyyyyyffyyyyfyyyxEE
xyyyyyyffyyyyfyyyxEE
xyQyyywwwwwwwwwyyxEE
xyyyyywhhsssshwyyxEE
xyppppwhhsssshwyyxEE
xypaaawhhhhhhhwyyxEE
xypaaawhhhhhhhwyyxEE
xypaaawhhhhhhhwyyxEE
xypaaawhhhhhhhwyyxEE
xypaaawhhhhhhhwyyxEE
xyppppwhhhhhhhwyyxEE
xyyyyywwwdddwwwyyxEE
xyyyyyyyyrrryyyyyxEE
xyyyyyyyyrrryyyyyxEE
xxxxxxxxxrrrxxxxxxEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento di casa, w muro di casa, s zona della scala, d porta, r strada, a pavimento della tettoia, p pali della tettoia, f fieno, y cortile, x steccato, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
xxxxxxxxxxxxxxxxxxEE
xyyyyyyyyyyyyyyyyxEE
xyyyyyQffyyyyfyyyxEE
xyyyyyyffyyyyfyyyxEE
xyyyyyyffyyyyfyyyxEE
xyyyyywwwwwwwwwyyxEE
xyppppwhhsssshwyyxEE
xypaaawhhsssshwyyxEE
xypaaawhhhhhhhwyyxEE
xypaaawhhhhhhhwyyxEE
xypaaawhhhhhhhwyyxEE
xypaaawhhhhhhhwyyxEE
xyppppwhhhhhhhwyyxEE
xyyyyywhhhhhhhwyyxEE
xyyyyywwwdddwwwyyxEE
xyyyyyyyyrrryyyyyxEE
xyyyyyyyyrrryyyyyxEE
xxxxxxxxxrrrxxxxxxEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento di casa, w muro di casa, s zona della scala, d porta, r strada, a pavimento della tettoia, p pali della tettoia, f fieno, y cortile, x steccato, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEExxxxxxxxxxxxxxxxx
EEExyyyyyyyyyyyyyyyy
EEExyyyffyyyyfyyyyyy
EEExyyyffyyyyfyyyyyQ
EEExyyyffyyyyfyyyyyy
EEExyywwwwwwwwwyyyyy
EEExyywhhsssshwyyyyy
EEExyywhhsssshwppppy
EEExyywhhhhhhhwaaapy
EEExyywhhhhhhhwaaapy
EEExyywhhhhhhhwaaapy
EEExyywhhhhhhhwaaapy
EEExyywhhhhhhhwaaapy
EEExyywhhhhhhhwppppy
EEExyywwwdddwwwyyyyy
EEExyyyyyrrryyyyyyyy
EEExyyyyyrrryyyyyyyy
EEExxxxxxrrrxxxxxxxx
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento di casa, w muro di casa, s zona della scala, d porta, r strada, a pavimento della tettoia, p pali della tettoia, f fieno, y cortile, x steccato, Q pozzo, t albero, g campo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEtEEtEEtEEEEtEEtEEEtEEEEtEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEExxxxxxxxxxxxxxxxxxxggggggE
EEEExyyyyyyyyyyyyyyyyyxggggggE
EEEExyyyyyyyyyyyyQyyyyxgggtggE
EEEExyyyyyyyffyyyyfyyyxggggggE
EEEExyyyyyyyffyyyyfyyyxggggggE
EEEExyyyyyyyffyyyyfyyyxggtgggE
EEEExyyyyyywwwwwwwwwyyxggggggE
EEEExyyyyyywhhsssshwyyxggggggE
EEEExyyppppwhhsssshwyyxgggtggE
EEEExyypaaawhhhhhhhwyyxggggggE
EEEExyypaaawhhhhhhhwyyxggggggE
EEEExyypaaawhhhhhhhwyyxggtgggE
EEEExyypaaawhhhhhhhwyyxggggggE
EEEExyypaaawhhhhhhhwyyxggggggE
EEEExyyppppwhhhhhhhwyyxggggggE
EEEExyyyyyywwwdddwwwyyxggggggE
EEEExyyyyyyyyyrrryyyyyxggtgggE
EEEExyyyyyyyyyrrryyyyyxggggggE
EEEExxxxxxxxxxrrrxxxxxxggggggE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEtEEEEtEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEtEErrrEEEtEEEtEEtEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.33 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
FATTORIA — le parti del concetto e dove stanno:
 h/w/s  la casa: corpo attorno ad H (7 celle di luce, 8-9 di fondo), due piani, la scala s lungo il muro di fondo
 d/r    la porta sul fronte, in asse con H, tre celle; la strada r dritta fino al bordo
 a/p    la tettoia: contro un fianco della casa, il fianco e il punto scelti dal seme, pavimento a, pali p sul bordo
 f      il fieno: catasta dietro il muro di fondo, larga quanto la casa
 y/x    il cortile y attorno a tutto, lo steccato x dove la terra continua (passa la strada)
 Q      il pozzo nel cortile
 t/g    i campi g oltre lo steccato dove la terra va avanti, col frutteto t (solo alla taglia grande)
 Semi: il fondo della casa (8 o 9), il fianco della tettoia e dove sta, dove il pozzo, dove gli alberi.
 Taglie: a 5x5 casa, tettoia, fieno, cortile e steccato; a 7.5 il cortile largo, i campi arati coi frutteti.
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
      <!-- il fieno dietro, largo quanto la casa -->
      <all in="E/w/[hs]" out="f/*/*" symmetry="()" steps="1"/>
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
      <!-- il pozzo nel cortile -->
      <one in="yyy/yyy" out="***/*Q*" steps="1"/>
      <!-- i campi oltre lo steccato, dove la terra va avanti -->
      <all in="xEEEEEEE" out="*gggggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- il frutteto nei campi -->
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**t**/*****/*****"/>
    </sequence>
    <map scale="5 5 1" values="BEwWULRKhlCsTk#90#91#92OoNdrafPzJyxXQAtuGgD" symmetry="()">
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="p" out="aaaaa/aPPPa/aPPPa/aPPPa/aaaaa"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="x" out="yyyyy/yxxxy/yxxxy/yxxxy/yyyyy"/>
      <rule in="Q" out="QQQQQ/QAAAQ/QAAAQ/QAAAQ/QQQQQ"/>
      <rule in="t" out="ggggg/ggggg/ggugg/ggggg/ggggg"/>
      <rule in="g" out="gDgDg/gDgDg/gDgDg/gDgDg/gDgDg"/>
      <sequence symmetry="(xy)">
        <!-- B. i muri della casa: intonaco, fascia delle finestre, intonaco, due piani -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- la colonna della porta: il seme O a terra, muro sopra -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="63"/>
        <prl in="d" out="R"/>
        <!-- i pavimenti, la striscia della scala, il solaio, il soffitto -->
        <all steps="1"><rule in="B h" out="h l"/><rule in="B s" out="s l"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h C"/><rule in="B s" out="s C"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- la tettoia: pali e tetto a 34 -->
        <all in="B P" out="P P" steps="33"/>
        <all in="B a" out="z a" steps="1"/>
        <all in="B z" out="z B" steps="33"/>
        <prl in="z" out="J"/>
        <all in="B P" out="J *" steps="1"/>
        <all in="JB" out="*J" steps="1"/>
        <!-- il fieno: una catasta dal colmo irregolare -->
        <all in="B f" out="f f" steps="9"/>
        <one in="B f" out="f f" steps="80"/>
        <!-- lo steccato: pali con la traversa -->
        <all in="B x" out="x x" steps="4"/>
        <all in="B x" out="x X" steps="1"/>
        <all in="XBBX" out="*XX*"/>
        <all in="B x" out="x x" steps="2"/>
        <!-- il pozzo: la vera di pietra -->
        <all in="B Q" out="Q Q" steps="3"/>
        <!-- i solchi dei campi -->
        <all in="B D" out="D D" steps="1"/>
        <!-- gli alberi: tronco e chioma tonda -->
        <all in="B u" out="u u" steps="5"/>
        <all in="B u" out="G *" steps="1"/>
        <all in="GB" out="*G" steps="2"/>
        <all in="G B" out="* G" steps="1"/>
        <all in="B G" out="G *" steps="1"/>
        <all in="GB" out="*G" steps="1"/>
        <all in="B G" out="G *" steps="1"/>
        <!-- C. la porta e la scala -->
        <union symbol="+" values="WUL"/>
        <union symbol="=" values="lC"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- le finestre nella fascia -->
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- il tetto a falde, la gronda, il camino -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="5"/>
      </sequence>
    </map>
  </map>
  <color symbol="W" value="E8DCC0" name="intonaco"/>
  <color symbol="U" value="E8DCC0" name="fascia delle finestre"/>
  <color symbol="L" value="6A8AB0" name="vetro"/>
  <color symbol="R" value="B04830" name="tegole"/>
  <color symbol="K" value="707070" name="camino"/>
  <color symbol="l" value="C8A878" name="assi del pavimento" area="house"/>
  <color symbol="C" value="A08858" name="solaio"/>
  <color symbol="k" value="8A6A48" name="gradini"/>
  <color symbol="O" value="6A4A2A" name="porta"/>
  <color symbol="o" value="4A3018" name="assi della porta"/>
  <color symbol="N" value="9A8A70" name="stipiti"/>
  <color symbol="r" value="B8A890" name="strada" area="road"/>
  <color symbol="a" value="D0C0A0" name="pavimento della tettoia" area="porch"/>
  <color symbol="P" value="7A5A3A" name="pali"/>
  <color symbol="J" value="8A5A38" name="tetto della tettoia"/>
  <color symbol="f" value="E0C050" name="fieno"/>
  <color symbol="y" value="9AB060" name="cortile" area="yard"/>
  <color symbol="x" value="8A6A48" name="pali dello steccato"/>
  <color symbol="X" value="A08060" name="traversa dello steccato"/>
  <color symbol="Q" value="808890" name="pietra del pozzo"/>
  <color symbol="A" value="4A7AB0" name="acqua"/>
  <color symbol="u" value="6A4A2A" name="tronco"/>
  <color symbol="G" value="4A8A3A" name="chioma"/>
  <color symbol="g" value="A09040" name="campo" area="field"/>
  <color symbol="D" value="7A6A30" name="solchi"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
