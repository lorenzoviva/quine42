# model.sculpt · claude-opus-5-5 · 53 s

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

The program you wrote:
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
It does not pass: taglia Grande, seme 1: porta: 11 × 6 voxel (0,55 × 0,30 caselle), una porta è almeno 11 × 30 a ogni taglia — the leaf the action open takes away: its width and its height
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, g prato, x siepe, W intonaco, L vetro, R tetto di coppi, f pavimento di legno, F solaio, k gradini, O porta, o assi della porta, N stipite, K camino di pietra, P lastricato del portico, J tettoia, X siepe
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEXXXEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEXXXEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEXXXXXXXggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEXXXXXXXggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEXXXXXXXXggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
XXXgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
XXXgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
XXXgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
XXXgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
XXRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE
EEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEJJJJJJJJJJJJJEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEJJJJJJJJJJJJJEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEJJJJJJJJJJJJJEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEJJJJJJJJJJJJJEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000003330000000000000000000000000000000000000
00000000003330000000000000000000000000000000000000
000000000033ssssssssssssssssssssssssssss0000000000
003333333300sttttttttttttttttttttttttttts000000000
003333333300sttttttttttttttttttttttttttts000000000
333333333300sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
333000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
333000000000stxuuvvvvvvvvvvvvvvvvvvvuutts000000000
333000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
333000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
33eeeeeeeeeesttuuvvwwwwwwwwwwwwwwwvvuutts000000000
00efffffffffsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
00efffffffffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
00effgggggffsttuuvvwwwxxyyyyyxxwwwvvuutts000000000
00effgggggffsttuuvvwwwxxyyyyyxxwwwvvuutts000000000
00effgggggffsttuuvvwwwxxyyyyyxxwwwvvuutts000000000
00effgggggffsttuuvvwwwxxyyyyyxxwwwvvuutts000000000
00effgggggffsttuuvvwwwxxyyyyyxxwwwvvuutts000000000
00effgggggffsttuuvvwwwxxyyyyyxxwwwvvuutts000000000
00effgggggffsttuuvvwwwxxyyyyyxxwwwvvuutts000000000
00effgggggffsttuuvvwwwxxyyyyyxxwwwvvuutts000000000
00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
00effgggggffsttuuvvwwwxxxxxxxxxwwwvvuutts000000000
00effgggggffsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
00effgggggffsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
00efffffffffsttuuvvwwwwwwwwwwwwwwwvvuutts000000000
00efffffffffsttuuvvvvvvvvvvvvvvvvvvvuutts000000000
00eeeeeeeeeesttuuvvvvvvvvvvvvvvvvvvvuutts000000000
000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
000000000000sttttttttttttttttttttttttttts000000000
000000000000sttttttttttttttttttttttttttts000000000
000000000000ssssssssssssssssssssssssssss0000000000
00000000000000000000fffffffffffff00000000000000000
00000000000000000000fffffffffffff00000000000000000
00000000000000000000fffffffffffff00000000000000000
00000000000000000000fffffffffffff00000000000000000
```
Front (looking from the front; the sky at the top):
```
........................RRRR......................
..............K.......RRRRRRRR....................
..............K.....RRRRRRRRRRRR..................
..............K...RRRRRRRRRRRRRRRR................
..............K.RRRRRRRRRRRRRRRRRRRR..............
..............RRRRRRRRRRRRRRRRRRRRRRRR............
............RRRRRRRRRRRRRRRRRRRRRRRRRRRR..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
......RR....WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
....RRRRRR..WWWWWWWWJJJJJJJJJJJJWWWWWWWW..........
..RRRRRRRRRRWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWNNNNNWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWNoooooNWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWNoooooNWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWNoooooNWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWNoooooNWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWNoooooNWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWoooooWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWLLLWWoooooWWWWWWWWWWW..........
..WWWWWWWWWWWWLLLWWLLLWWoooooWLLWWWWWWWW..........
..WWWWWWWWWWWWLLLWWLLLWWoooooWLLLWWWWWWW..........
..WWWWWWWWWWWWLLLWWLLLWWoooooWLLLWWWWWWW..........
..WWWWWWWWWWWWLLLWWWWWWWoooooWLLLWWWWWWW..........
XXWWWWWWWWWWWWWWWWWWWWWWoooooWWWWWWWWWWW..........
XXXWWWWWWWWWWWWWWWWWWWWNoooooNWWWWWWWWWW..........
XXXWWWWWWWWWWWWWWWWWWWWNoooooNWWWWWWWWWW..........
EEEEEEEEEEEEEEEEEEEEPPPPPPPPPPPPWEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
...........................RRRRRR.................
...................K.....RRRRRRRRRR...............
...................K...RRRRRRRRRRRRRR.............
...................K.RRRRRRRRRRRRRRRRRR...........
...................RRRRRRRRRRRRRRRRRRRRRR.........
.................RRRRRRRRRRRRRRRRRRRRRRRRRR.......
...............RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWJJJJJ
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWLLLWWWWWW.....
...............WWWWWWWWWWWWWWWWWWWWWLLLWWWWWW.....
...............WLLLWWWWWWWWWWWWWWWWWLLLWWWWWW.....
...............WLLLWWWWWWWWWWWWWWWWWLLLWWWWWW.....
...............WLLLWWWWWWWWWWWWWWWWWWWWWWWWWW.....
...............WLLLWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.............XXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
............XXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
............XXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWL..........
............WWW.......kkkkkk.........LLL..........
............WWW.......kkkkkk.........WWW..........
............WWW.......kkkkkk.........WWW..........
............WWW.......kkkkkk.........WWW..........
...WWWLLLWWWWWW........kkkkk.........WWW..........
..WWWWWWWWWWWWW......................WWW..........
..WWWWWWLWWWWWW......................WWW..........
..WWW.......LLL......................WWW..........
..WWW.......LLL......................WWW..........
..WWW.......LLL......................WWW..........
..WWW.......LLL......................WWW..........
..WWW.......LLL......................WWW..........
..WWW.......WWW......................WWW..........
..WWW.......WWW......................WWW..........
..WWW.......WWW......................WWW..........
..WWW.......WWW......................WWW..........
..WWW.......WWW......................WWW..........
..WWW.......WWW......................WWW..........
..WWW.......WWW......................WWW..........
..WWWWWWWWWWWWW......................WWW..........
..WWWWWWWWWWWWW......................WWW..........
..WWWWWWWWWWWWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWWLLWWLLLWWoooooWLLLWWWWWWW..........
............WWWLLWWLLLWWoooooWLLLWWWWWWW..........
............WWWLLWWLLLWWoooooWLLLWWWWWWW..........
..................................................
..................................................
..................................................
..................................................
..................................................
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
............WWWWWWWWWWWWWLLLLWWWWWWWWWWW..........
............WWWWWWWWWWWWWLWWLWWWWWWWWWWW..........
............WWWWWWWWWWWWWLLLLWWWWWWWWWWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............WWW......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..................................................
..................................................
..................................................
..................................................
..................................................
```
Cut at z=75 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.......................RRRRRR.....................
.......................RRRRRRR....................
.......................RRRRRRR....................
.......................RRRRRRR....................
.......................RRRRRRR....................
.......................RRRRRRR....................
.......................RRRRRRR....................
.......................RRRRRRR....................
.......................RRRRRRR....................
.......................RRRRRR.....................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
```
### Seed 2: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXEEEEEEEEEE   00000000000033333333333333333333333333330000000000
EEEEEEEEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXEEEEEEEEEE   00000000000033333333333333333333333333330000000000
EEEEEEEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXRRRRRRRRRR   000000000033333333333333333333333333333eeeeeeeeeee
EEEEEEEEEEXXXgggggggggggggggggggggggggggRRRRRRRRRR   000000000033300000000000000000000000000efffffffffe
EEEEEEEEEEXXXggggggggggggggggggggggggggRRRRRRRRRRR   000000000033ssssssssssssssswssssssssssssfffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000stttttttttttttttttttttttttttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000stttttttttttttttttttttttttttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxyyyyyxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxyyyyyxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxyyyyyxxwwwvvuuttsffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxyyyyyxxwwwvvuuttsffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxyyyyyxxwwwvvuuttseeeeeeeee
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvwwwxxyyyyyxxwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvwwwxxyyyyyxxwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvwwwxxyyyyyxxwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggXXXXXXX   000000000000sttuuvvwwwxxxxxxxxxwwwvvuutts033333333
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggXXXXXXX   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts033333333
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggXXXXXXX   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts033333333
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggXXEEEEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts033300000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggXXEEEEE   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts033300000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggXXEEEEE   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts033300000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggXXEEEEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts033300000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggXXEEEEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts033300000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggXXEEEEE   000000000000sttttttttttttttttttttttttttts033300000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggXXEEEEE   000000000000sttttttttttttttttttttttttttts033300000
EEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRXXXEEEEEEE   000000000000ssssssssssssssssssssssssssss3330000000
EEEEEEEEEEEEEEEEEEEEJJJJJJJJJJJJJEEEEEEEXXXEEEEEEE   00000000000000000000fffffffffffff00000003330000000
EEEEEEEEEEEEEEEEEEEEJJJJJJJJJJJJJEEEEEEEXXEEEEEEEE   00000000000000000000fffffffffffff00000003330000000
EEEEEEEEEEEEEEEEEEEEJJJJJJJJJJJJJEEEEEEEEEEEEEEEEE   00000000000000000000fffffffffffff00000000000000000
EEEEEEEEEEEEEEEEEEEEJJJJJJJJJJJJJEEEEEEEEEEEEEEEEE   00000000000000000000fffffffffffff00000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX   00000000000033333333333333333333333333333333333333
EEEEEEEEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX   00000000000033333333333333333333333333333333333333
EEEEEEEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX   00000000003333333333333333333333333333333333333333
EEEEEEEEEEXXXggggggggggggggggggggggggggggggggggggg   00000000003330000000000000000000000000000000000000
EEEEEEEEEEXXXggggggggggggggggggggggggggggggggggggg   000000000033ssssssssssssssssssssssssssss0000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttseeeeeeeee
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuuuuuuuuuuuuuuuuuuuuuuttsffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvvvvvvvvvvvvvvvvvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxyyyyyxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxyyyyyxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxyyyyyxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxyyyyyxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxyyyyyxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxyyyyyxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxyyyyyxxwwwvvuuttsffggggffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxyyyyyxxwwwvvuuttsffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttsffffffffe
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   000000000000sttuuvvwwwxxxxxxxxxwwwvvuuttseeeeeeeee
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuuttw000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEE   000000000000sttttttttttttttttttttttttttts000000000
EEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEEEE   000000000000ssssssssssssssssssssssssssss0000000000
EEEEEEEEEEEEEEEEEEEEJJJJJJJJJJJJJEEEEEEEEEEEEEEEEE   00000000000000000000fffffffffffff00000000000000000
EEEEEEEEEEEEEEEEEEEEJJJJJJJJJJJJJEEEEEEEEEEEEEEEEE   00000000000000000000fffffffffffff00000000000000000
EEEEEEEEEEEEEEEEEEEEJJJJJJJJJJJJJEEEEEEEEEEEEEEEEE   00000000000000000000fffffffffffff00000000000000000
EEEEEEEEEEEEEEEEEEEEJJJJJJJJJJJJJEEEEEEEEEEEEEEEEE   00000000000000000000fffffffffffff00000000000000000
```
How much the plans of the seeds differ: 0.32 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 123 nodi, 555 passi, finito in 562 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald (marcatore), h=pavimento, w=muro, a=pavimento dell'ala, v=muro dell'ala, d=porta, m=magenta, p=portico, s=scala, g=prato, x=siepe, W=intonaco, U=intonaco, L=vetro, R=tetto di coppi, f=pavimento di legno, F=solaio, T=scala, k=gradini, O=porta, o=assi della porta, N=stipite, Y=intonaco, K=camino di pietra, J=tettoia, y=tettoia, X=siepe, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 72615, R 21270, E 5375, k 2720, L 2712, f 2625, F 2090, o 1836, X 900, N 293, P 250, J 250, g 225, x 150, O 144, K 9.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-32 all×20, prl×2, one×2: 208 celle x0-15 y5-19 z0, passi 2-41
   #35 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 42
#37-39 all×2, prl×1: 12015 celle x25-79 y30-89 z0-6, passi 43-50
    #40 all . w → w U passi=14: ×14, 27860 celle x25-79 y30-89 z6-20, passi 51-64, w→U 13930, .→w 13930
    #41 all . w → w W passi=12: ×12, 23880 celle x25-79 y30-89 z20-32, passi 65-76, w→W 11940, .→w 11940
    #42 all . w → w W passi=6: ×6, 11940 celle x25-79 y30-89 z32-38, passi 77-82, w→W 5970, .→w 5970
    #43 all . w → w U passi=14: ×14, 27860 celle x25-79 y30-89 z38-52, passi 83-96, w→U 13930, .→w 13930
    #44 all . w → w W passi=12: ×12, 23880 celle x25-79 y30-89 z52-64, passi 97-108, w→W 11940, .→w 11940
#45-50 prl×2, all×4: 21035 celle x5-79 y30-89 z0-64, passi 109-194
#51-54 all×3, prl×1: 13775 celle x5-74 y35-84 z0-32, passi 195-209
    #55 all . h → h . passi=31: ×31, 127100 celle x30-74 y35-84 z1-32, passi 210-240, h→. 63550, .→h 63550
    #56 all . s → s . passi=30: ×30, 12000 celle x40-59 y35-44 z2-32, passi 241-270, s→. 6000, .→s 6000
    #57 all . a → a . passi=31: ×31, 23250 celle x10-24 y50-74 z1-32, passi 271-301, a→. 11625, .→a 11625
#58-59 prl×1, all×1: 4875 celle x10-74 y35-84 z32-33, passi 302-303
    #60 all . h → h . (+1) passi=31: ×31, 139500 celle x30-74 y35-84 z33-64, passi 304-334, h→. 63550, .→h 63550, s→. 6200, .→s 6200
      r1 . h → h . ×63550; r2 . s → s . ×6200
#61-106 prl×5, one×2, all×16: 22346 celle x5-79 y30-89 z0-64, passi 335-491
    #107 prl U → W: ×1, 29698 celle x5-79 y30-89 z6-51, passi 492, U→W 29698
#110-114 all×3, prl×1: 17305 celle x4-80 y29-99 z1-64, passi 493-528
#115-119 all×4, one×1: 17874 celle x0-78 y25-88 z1-76, passi 529-555
Senza effetto (non hanno mai cambiato una cella):
#6 prl E/h → h/* passi=1
#26 all gE/*g → *g/**: le celle cercate c'erano, ma mai disposte come nel pattern
#29 all [pr]/[Egx] → */r: le celle cercate c'erano, ma mai disposte come nel pattern
#30 all [Eg]p/[Eg]r → *q/**: in quel momento nella griglia non c'erano celle "r"
#33 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******…: le celle cercate c'erano, ma mai disposte come nel pattern
#66 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#67 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#68 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#69 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
#70 prl #93 → . passi=1: in quel momento nella griglia non c'erano celle ""
#76 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#77 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
… e altri 21
Fix it and answer with the whole program.

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
  <union symbol="+" values="WU"/>
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
