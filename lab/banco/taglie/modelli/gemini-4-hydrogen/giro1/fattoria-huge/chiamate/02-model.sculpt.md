# model.sculpt · gemini-4-hydrogen · 23 s

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
  Fattoria:
  - Corpo principale della casa: interno (h), muri (w), porta frontale (d), zona scala interna (s)
  - Ala della stalla/fienile su un lato scelto dal seme: interno (a), muri (v)
  - Portico antistante (p) e strada verso il bordo anteriore (r)
  - Aia (c) intorno alla casa e alla stalla, con pozzo (Q) dove entra un 5x5
  - Orto/frutteto (g) recintato (x) e alberi (t) dove c'e' terreno libero (piu' estesi a Gargantuan)
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdravpcQgxt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa intorno a H: 4 dietro, 5 davanti (+1 a caso), 5 ai lati -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="5"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala interna lungo il muro posteriore -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Ala della stalla su un lato scelto a caso (sinistra o destra) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Portico davanti alla casa -->
      <all in="w/E" out="*/p" symmetry="()" steps="2"/>

      <!-- Strada dritta dal centro verso il bordo anteriore, larga 3 celle -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl in="d" out="h" symmetry="()"/>
      <all in="h/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rp" out="*r" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Aia intorno a casa, stalla e portico -->
      <all in="[wvp]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Pozzo nell'aia se entra un 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Orto/frutteto sul retro o ai lati dove c'e' spazio, poi recinzione -->
      <all in="[wc]EEEEEEE" out="*gggg***" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*x"/>

      <!-- Alberi sparsi dove c'e' terreno libero 7x7 -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="B" value="000000" hidden="True"/>
  <color symbol="E" value="6A7F4A" name="prato" hidden="True"/>
  <color symbol="H" value="C8B89A" name="pavimento" area="house"/>
  <color symbol="h" value="C8B89A" name="pavimento" area="house"/>
  <color symbol="w" value="D8CFC0" name="intonaco" area="house"/>
  <color symbol="s" value="A88A64" name="scala" area="house"/>
  <color symbol="d" value="6E472B" name="porta" area="house"/>
  <color symbol="r" value="9C8E78" name="strada" area="yard"/>
  <color symbol="a" value="B59E7A" name="stalla" area="barn"/>
  <color symbol="v" value="7A5C43" name="muro della stalla" area="barn"/>
  <color symbol="p" value="8B6B4D" name="portico" area="porch"/>
  <color symbol="c" value="B0A184" name="aia" area="yard"/>
  <color symbol="Q" value="6E757A" name="pozzo" area="yard"/>
  <color symbol="g" value="5A6E3A" name="orto" area="garden"/>
  <color symbol="x" value="6E5239" name="staccionata" area="garden"/>
  <color symbol="t" value="3E5C2E" name="albero" area="garden"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H pavimento, E prato, h pavimento, w intonaco, s scala, d porta, r strada, a stalla, v muro della stalla, p portico, c aia, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEccccccccccccccccccccccccEEE
EEEccccccccccccccccccccccccEEE
EEEccccccccccccccccccccQcccEEE
EEEccccccccccccccccccccccccEEE
EEEccccccccccccccccccccccccEEE
EEEccccccwwwwwwwwwwwwwcccccEEE
EEEcvvvvvwhhsssshhhhhwcccccEEE
EEEcvaaaawhhsssshhhhhwcccccEEE
EEEcvaaaawhhhhhhhhhhhwcccccEEE
EEEcvaaaawhhhhhhhhhhhwcccccEEE
EEEcvaaaawhhhhhHhhhhhwcccccEEE
EEEcvaaaawhhhhhhhhhhhwcccccEEE
EEEcvaaaawhhhhhhhhhhhwcccccEEE
EEEcvvvvvwhhhhhhhhhhhwcccccEEE
EEEccccccwhhhhhhhhhhhwcccccEEE
EEEccccccwhhhhhhhhhhhwcccccEEE
EEEccccccddddddhddddddEEEEEEEE
EEEccccccppppprrrpppppcccccEEE
EEEcccccccccccrrrccccccccccEEE
EEEcccccccccccrrrccccccccccEEE
EEEcccccccccccrrrccccccccccEEE
EEEcccccccccccrrrccccccccccEEE
EEEcccccccccccrrrccccccccccEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H pavimento, E prato, h pavimento, w intonaco, s scala, d porta, r strada, a stalla, v muro della stalla, p portico, c aia, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEccccccccccccccccccccccccEEE
EEEccccccccccccccccccccccccEEE
EEEccccccccccccccccccccccccEEE
EEEccccccccccccccccccccccccEEE
EEEccccccccccccccccccccccccEEE
EEEccccccwwwwwwwwwwwwwcccccEEE
EEEccccccwhhsssshhhhhwcccccEEE
EEEccccccwhhsssshhhhhwcccccEEE
EEEccccccwhhhhhhhhhhhwcccccEEE
EEEcvvvvvwhhhhhhhhhhhwcccccEEE
EEEcvaaaawhhhhhHhhhhhwcccccEEE
EEEcvaaaawhhhhhhhhhhhwcccccEEE
EEEcvaaaawhhhhhhhhhhhwcccccEEE
EEEcvaaaawhhhhhhhhhhhwcccccEEE
EEEcvaaaawhhhhhhhhhhhwcccccEEE
EEEcvaaaawhhhhhhhhhhhwcccccEEE
EEEcvvvvvddddddhddddddEEEEEEEE
EEEccccccppppprrrpppppcccccEEE
EEEcccccccccccrrrccccccccccEEE
EEEcccQcccccccrrrccccccccccEEE
EEEcccccccccccrrrccccccccccEEE
EEEcccccccccccrrrccccccccccEEE
EEEcccccccccccrrrccccccccccEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H pavimento, E prato, h pavimento, w intonaco, s scala, d porta, r strada, a stalla, v muro della stalla, p portico, c aia, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEccccccccccccccccccccccccEEE
EEEccccccccccccccccccccccccEEE
EEEccccccccccccQcccccccccccEEE
EEEccccccccccccccccccccccccEEE
EEEccccccccccccccccccccccccEEE
EEEccccccwwwwwwwwwwwwwcccccEEE
EEEccccccwhhsssshhhhhwcccccEEE
EEEccccccwhhsssshhhhhwcccccEEE
EEEccccccwhhhhhhhhhhhwcccccEEE
EEEccccccwhhhhhhhhhhhwcccccEEE
EEEccccccwhhhhhHhhhhhwcccccEEE
EEEcvvvvvwhhhhhhhhhhhwcccccEEE
EEEcvaaaawhhhhhhhhhhhwcccccEEE
EEEcvaaaawhhhhhhhhhhhwcccccEEE
EEEcvaaaawhhhhhhhhhhhwcccccEEE
EEEcvaaaawhhhhhhhhhhhwcccccEEE
EEEcvaaaaddddddhddddddEEEEEEEE
EEEcvaaaavpppprrrpppppcccccEEE
EEEcvvvvvvccccrrrccccccccccEEE
EEEcccccccccccrrrccccccccccEEE
EEEEEEEEEEEEEErrrccccccccccEEE
EEEEEEEEEEEEEErrrccccccccccEEE
EEEEEEEEEEEEEErrrccccccccccEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H pavimento, E prato, h pavimento, w intonaco, s scala, d porta, r strada, a stalla, v muro della stalla, p portico, c aia, Q pozzo, g orto, x staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxEEEE
EEExggggggggggggggggggggggggggggggggxEEE
EEExggggggggggggggggggggggggggggggggxEEE
EEExggggggggggggggggggggggggggggggggxEEE
EEExggggggggggggggggggggggggggggggggxEEE
EEEEccccccccccccccccccccccccccccggggxEEE
EEEEccccccccccccccccccccccccccccggggxEEE
EEEEccccccccccccccccccccccccccccggggxEEE
EEEEccccccccccccccccccccccccccccggggxEEE
EEEEccccccccccccccccccccccccccccggggxEEE
EEEEccccccccccwwwwwwwwwwwwwcccccggggxEEE
EEEEcccccvvvvvwhhsssshhhhhwcccccggggxEEE
EEEEcccccvaaaawhhsssshhhhhwcccccggggxEEE
EEEEcccccvaaaawhhhhhhhhhhhwcccccggggxEEE
EEEEcccccvaaaawhhhhhhhhhhhwcccccggggxEEE
EEEEcccccvaaaawhhhhhHhhhhhwcccccggggxEEE
EEEEcccccvaaaawhhhhhhhhhhhwcccccggggxEEE
EEEEcccccvaaaawhhhhhhhhhhhwcccccggggxEEE
EEEEcccccvvvvvwhhhhhhhhhhhwcccccggggxEEE
EEEEccccccccccwhhhhhhhhhhhwcccccggggxEEE
EEEEccccccccccwhhhhhhhhhhhwcccccggggxEEE
EEEEccccccccccddddddhddddddEEEEExxxxEEEE
EEEEccccccccccppppprrrpppppcccccggggxEEE
EEEEcccccccccccccccrrrccccccccccggggxEEE
EEEEcccccccccccccccrrrccccccccccggggxEEE
EEEEcccccccQcccccccrrrccccccccccggggxEEE
EEEEcccccccccccccccrrrccccccccccggggxEEE
EEEEcccccccccccccccrrrccccccccccggggxEEE
EEExgggggggggggggggrrrggggggggggggggxEEE
EEExgggggggggggggggrrrggggggggggggggxEEE
EEExgggggggggggggggrrrggggggggggggggxEEE
EEExgggggggggggggggrrrggggggggggggggxEEE
EEEExxxxxxxxxxxxxxxrrrxxxxxxxxxxxxxxEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.12 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
  Fattoria:
  - Corpo principale della casa: interno (h), muri (w), porta frontale (d), zona scala interna (s)
  - Ala della stalla/fienile su un lato scelto dal seme: interno (a), muri (v)
  - Portico antistante (p) e strada verso il bordo anteriore (r)
  - Aia (c) intorno alla casa e alla stalla, con pozzo (Q) dove entra un 5x5
  - Orto/frutteto (g) recintato (x) e alberi (t) dove c'e' terreno libero (piu' estesi a Gargantuan)
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdravpcQgxtm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa intorno a H: 4 dietro (+1 a caso), 5 davanti (+1 a caso), 5 ai lati -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="5"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala interna lungo il muro posteriore -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Ala della stalla su un lato scelto a caso (sinistra o destra) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Portico davanti alla casa -->
      <all in="w/E" out="*/p" symmetry="()" steps="2"/>

      <!-- Strada dritta dal centro verso il bordo anteriore, larga 3 celle -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl in="m" out="h"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rp" out="*r" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Aia intorno a casa, stalla e portico -->
      <all in="[wvp]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Pozzo nell'aia se entra un 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Orto/frutteto sul retro o ai lati dove c'e' spazio, poi recinzione -->
      <all in="[wc]EEEEEEE" out="*gggg***" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*x"/>

      <!-- Alberi sparsi dove c'e' terreno libero 5x5 -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****"/>
    </sequence>
    <map scale="5 5 1" values="BEfFWULRKTk#90#91#92OoNAVYPyJCrqugXblhwsdavpQt" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="CCCCC/CCCCC/CCCCC/CCCCC/CCCCC"/>
      <rule in="Q" out="qqqqq/quuuq/quuuq/quuuq/qqqqq"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="x" out="XXXXX/XXXXX/XXXXX/XXXXX/XXXXX"/>
      <rule in="t" out="EEEEE/EEbEE/EbbbE/EEbEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <union symbol="+" values="W"/>
        <union symbol="=" values="fF"/>

        <!-- B. Altezze: casa a due piani -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- Porta frontale: O alla base, W sopra -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="63"/>
        <prl in="d" out="R"/>

        <!-- Pavimenti e solaio della casa + zona scala -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Stalla -->
        <all in="B a" out="a A" steps="1"/>
        <all in="B a" out="a B" steps="39"/>
        <prl in="a" out="Y"/>
        <all in="B v" out="v V" steps="40"/>
        <prl in="v" out="Y"/>

        <!-- Portico: pavimento C e tetto J a quota 34 -->
        <all in="B p" out="y C" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>

        <!-- Pozzo, staccionata, alberi -->
        <all in="B q" out="q q" steps="6"/>
        <all in="B u" out="u u" steps="4"/>
        <all in="B X" out="X X" steps="6"/>
        <all in="B b" out="b b" steps="15"/>
        <all in="B b" out="l *" steps="1"/>
        <all in="lB" out="*l" steps="3"/>
        <all in="B l" out="l *" steps="3"/>

        <!-- C. Scala e porta -->
        <import file="part-stair"/>
        <import file="part-door"/>

        <!-- Finestre nelle fasce U -->
        <one steps="14">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <!-- Tetti a padiglione -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>

        <all in="YB" out="*Y" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **Y**/**Y**/YYYYY/**Y**/**Y**" out="*****/*****/**Y**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

        <!-- Pulizia -->
        <prl in="T" out="B"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" hidden="True"/>
  <color symbol="E" value="6A7F4A" name="prato" hidden="True"/>
  <color symbol="f" value="C8B89A" name="pavimento" area="house"/>
  <color symbol="F" value="B8A686" name="solaio" area="house"/>
  <color symbol="W" value="D8CFC0" name="intonaco" area="house"/>
  <color symbol="L" value="8EB8C9" name="vetro" area="house"/>
  <color symbol="R" value="A64B38" name="tetto" area="house"/>
  <color symbol="K" value="7A7268" name="camino" area="house"/>
  <color symbol="k" value="9C7A54" name="gradini" area="house"/>
  <color symbol="O" value="6E472B" name="porta" area="house"/>
  <color symbol="o" value="52341E" name="assi della porta" area="house"/>
  <color symbol="N" value="4A3B32" name="stipite" area="house"/>
  <color symbol="A" value="B59E7A" name="pavimento della stalla" area="barn"/>
  <color symbol="V" value="7A5C43" name="muro della stalla" area="barn"/>
  <color symbol="Y" value="8C4A32" name="tetto della stalla" area="barn"/>
  <color symbol="J" value="8B6B4D" name="tettoia" area="porch"/>
  <color symbol="r" value="9C8E78" name="strada" area="yard"/>
  <color symbol="C" value="B0A184" name="aia" area="yard"/>
  <color symbol="q" value="6E757A" name="pietra del pozzo" area="yard"/>
  <color symbol="u" value="4A7B8C" name="acqua del pozzo" area="yard"/>
  <color symbol="g" value="5A6E3A" name="orto" area="garden"/>
  <color symbol="X" value="6E5239" name="staccionata" area="garden"/>
  <color symbol="b" value="5C4028" name="tronco" area="garden"/>
  <color symbol="l" value="3E5C2E" name="chioma" area="garden"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
