# model.sculpt · claude-opus-5-5 · 155 s

## Richiesta

Sculpt: villetta
What it looks like: villetta: a building one enters, with the door at the front
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
villetta: una casa bassa (h, muri w) attorno al centro, con un'ala piu' bassa (a, muri v) contro un fianco scelto dal seme;
la porta d in facciata (fronte = y grande) sull'asse, davanti il portico p (5 x 2 celle) e il vialetto r fino al bordo;
la scala s lungo il muro di fondo, dal lato di x piccolo, con il pianerottolo davanti.
I semi cambiano: profondita' del corpo (+1), lato dell'ala, posizione degli alberi.
Large 5x5: casa + ala + portico. Huge 7.5: in piu' il giardino g, la siepe x e gli alberi t dove c'e' terra (7x7).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdmprsgxt" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/><all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <all in="[wv]EEEEEEE" out="*gg*****" steps="1"/>
      <all in="gE/*g" out="*g/**"/><all in="gE/*[wv]" out="*g/**"/>
      <all in="gE" out="*x"/>
      <all in="[pr]/[Egx]" out="*/r" symmetry="()"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="h" value="c8b48a" name="pavimento" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro" area="house"/>
  <color symbol="a" value="b89a70" name="pavimento dell'ala" area="house"/>
  <color symbol="v" value="d8c8a8" name="muro dell'ala" area="house"/>
  <color symbol="d" value="6b4428" name="porta" area="house"/>
  <color symbol="p" value="a07850" name="portico" area="porch"/>
  <color symbol="r" value="b0a890" name="vialetto" area="garden"/>
  <color symbol="s" value="8a6440" name="scala" area="house"/>
  <color symbol="g" value="88a858" name="prato" area="garden"/>
  <color symbol="x" value="4f7a35" name="siepe" area="garden"/>
  <color symbol="t" value="5a3a20" name="albero" area="garden"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento, w muro, a pavimento dell'ala, v muro dell'ala, d porta, p portico, r vialetto, s scala, g prato, x siepe
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEExEEE
EEEEEwwwwwwwwwwwgxEE
EEEEEwhhsssshhhwgxEE
EEEEEwhhsssshhhwgxxx
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwwwwdddwwwwaaav
EEEEEEEEpppppEEEvvvv
EEEEEEEEpppppEEEEEEE
EEEEEEEErrrrrEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento, w muro, a pavimento dell'ala, v muro dell'ala, d porta, p portico, r vialetto, s scala, g prato, x siepe
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEExEEE
EEEEEwwwwwwwwwwwgxEE
EEEEEwhhsssshhhwgxEE
EEEEEwhhsssshhhwgxxx
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwwwwdddwwwwaaav
EEEEEEEEpppppEEEvvvv
EEEEEEEEpppppEEEEEEE
EEEEEEEErrrrrEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento, w muro, a pavimento dell'ala, v muro dell'ala, d porta, p portico, r vialetto, s scala, g prato, x siepe
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEExEEE
EEEEEwwwwwwwwwwwgxEE
EEEEEwhhsssshhhwgxxx
EEEEEwhhsssshhhwgggg
EEEEEwhhhhhhhhhwgggg
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwhhhhhhhhhwaaav
EEEEEwwwwdddwwwwvvvv
EEEEEEEEpppppEEEEEEE
EEEEEEEEpppppEEEEEEE
EEEEEEEErrrrrEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento, w muro, a pavimento dell'ala, v muro dell'ala, d porta, p portico, r vialetto, s scala, g prato, x siepe, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtEEEEEEEEEEEEEEEtEEEEEEEEEE
EEEEEEEEtEEEEEtEEEEEEEEEEtEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEExxxxxxxxxxxxxxxxxEEEEE
EEEEEEExgggggggggggggggggxEEEE
EEEEEEExgggggggggggggggggxEEEE
EEEtEEExggwwwwwwwwwwwggggxEEEE
EEEEEEExggwhhsssshhhwggggxEEEE
EEEEEEExggwhhsssshhhwggggxEEEE
EEEEEEExggwhhhhhhhhhwggggxEEEE
EEEEEEExggwhhhhhhhhhwggggxEEEE
EEEtEEExggwhhhhhhhhhwvvvvEEEEE
EEEEEEExggwhhhhhhhhhwaaavEEEEE
EEEEEEExggwhhhhhhhhhwaaavEEEEE
EEEEEEExggwhhhhhhhhhwaaavEEEEE
EEEEEEExggwhhhhhhhhhwaaavEEEEE
EEEtEEExggwwwwdddwwwwaaavEEEEE
EEEEEEExgggggpppppgggvvvvEEEEE
EEEEEEExgggggpppppgggggggxEEEE
EEEEEEEExxxxxrrrrrgggggggxEEEE
EEEEEEEEEEEEErrrrrxxxxxxxEEEEE
EEEtEEEEEEEEErrrrrEEEEEEEEEEEE
EEEEEEEEEEEEErrrrrEEEEEEEEEEEE
EEEEEEEEEEEEErrrrrEEEEEEEEEEEE
EEEEEEEEEEEEErrrrrEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.07 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
villetta: una casa di due piani (h, muri w) attorno al centro, con un'ala bassa di un piano (a, muri v) contro un fianco scelto dal seme;
la porta d in facciata (fronte = y grande) sull'asse, davanti il portico p con due pali q e il vialetto r fino al bordo;
la scala s lungo il muro di fondo, dal lato di x piccolo, con il pianerottolo davanti.
I semi cambiano: profondita' del corpo davanti e dietro, lato e posizione dell'ala, il camino, gli alberi.
Large 5x5: casa + ala + portico. Huge 7.5: in piu' il giardino g, la siepe x e gli alberi t dove c'e' terra (7x7).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdmprsgxtq" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/><all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <all in="[wv]EEEEEEE" out="*gg*****" steps="1"/>
      <all in="gE/*g" out="*g/**"/><all in="gE/*[wv]" out="*g/**"/>
      <all in="gE" out="*x"/>
      <all in="[pr]/[Egx]" out="*/r" symmetry="()"/>
      <all in="[Eg]p/[Eg]r" out="*q/**" symmetry="(x)"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEhwavdprsgxtqWULRfFTkOoNMYKPQJyXCjZ" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="p" out="PPPPP/PPPPP/PPPPP/PPPPP/PPPPP"/>
      <rule in="q" out="PPPPP/PqqqP/PqqqP/PqqqP/PPPPP"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="t" out="EEEEE/ECCCE/ECCCE/ECCCE/EEEEE"/>
      <sequence symmetry="(xy)">
        <all in="ddddddddddddddd" out="**OOOOOOOOOOO**" symmetry="()"/>
        <prl in="d" out="w"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <all in="B O" out="Y *" steps="1"/><all in="B Y" out="Y W" steps="63"/><prl in="Y" out="R"/>
        <all in="B v" out="v W" steps="6"/><all in="B v" out="v U" steps="14"/><all in="B v" out="v W" steps="12"/>
        <prl in="v" out="R"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/><rule in="B a" out="a f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/><all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <one in="fWWWWWf" out="*OOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/W" out="*/O" symmetry="()" steps="5"/><all in="W/O" out="O/*" symmetry="()" steps="5"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <all in="B q" out="Q *" steps="1"/><all in="B Q" out="Q *" steps="32"/>
        <all in="B P" out="y *" steps="1"/><all in="B y" out="y B" steps="33"/><prl in="y" out="J"/>
        <all in="B Q" out="J *" steps="1"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/><all in="B K" out="K *" steps="8"/>
        <all in="B x" out="X *" steps="1"/><all in="B X" out="X *" steps="5"/>
        <all in="B C" out="j *" steps="1"/><all in="B j" out="j C" steps="14"/><prl in="j" out="Z"/>
        <all steps="3"><rule in="ZB" out="*Z"/><rule in="B Z" out="Z *"/></all>
      </sequence>
    </map>
  </map>
  <union symbol="+" values="W"/>
  <union symbol="=" values="fF"/>
  <color symbol="E" hidden="True"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="h" value="c8b48a" name="pavimento" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro" area="house"/>
  <color symbol="a" value="b89a70" name="pavimento dell'ala" area="house"/>
  <color symbol="v" value="d8c8a8" name="muro dell'ala" area="house"/>
  <color symbol="d" value="6b4428" name="porta" area="house"/>
  <color symbol="p" value="a07850" name="portico" area="porch"/>
  <color symbol="q" value="5a3a20" name="palo del portico" area="porch"/>
  <color symbol="r" value="c0b498" name="vialetto" area="garden"/>
  <color symbol="s" value="8a6440" name="scala" area="house"/>
  <color symbol="g" value="88a858" name="prato" area="garden"/>
  <color symbol="x" value="4f7a35" name="siepe" area="garden"/>
  <color symbol="t" value="6a4428" name="albero" area="garden"/>
  <color symbol="W" value="e8dcc0" name="intonaco"/>
  <color symbol="U" value="e8dcc0" name="intonaco"/>
  <color symbol="L" value="8fb8c8" name="vetro"/>
  <color symbol="R" value="b5523a" name="tetto di coppi"/>
  <color symbol="f" value="c8a070" name="pavimento di legno" area="house"/>
  <color symbol="F" value="a08060" name="solaio"/>
  <color symbol="T" value="a08060" name="scala"/>
  <color symbol="k" value="9a7a58" name="gradini"/>
  <color symbol="O" value="6b4428" name="porta"/>
  <color symbol="o" value="3e2614" name="assi della porta"/>
  <color symbol="N" value="4a3a2a" name="stipite"/>
  <color symbol="M" value="a0a0a0" name="merlo"/>
  <color symbol="Y" value="e8dcc0" name="intonaco"/>
  <color symbol="K" value="707070" name="camino di pietra"/>
  <color symbol="P" value="b0a890" name="lastricato del portico" area="porch"/>
  <color symbol="Q" value="5a3a20" name="palo del portico"/>
  <color symbol="J" value="8a4a30" name="tettoia"/>
  <color symbol="y" value="8a4a30" name="tettoia"/>
  <color symbol="X" value="4f7a35" name="siepe"/>
  <color symbol="C" value="6a4428" name="tronco"/>
  <color symbol="j" value="6a4428" name="tronco"/>
  <color symbol="Z" value="5f9040" name="chioma"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
