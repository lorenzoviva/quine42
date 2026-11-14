# model.sculpt · gemini-4-hydrogen · 16 s

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
  Fattoria:
  - Casa principale (h pavimento, w muro, s zona scala, d porta frontale, r strada verso il bordo) attorno al centro H.
  - Portico / tettoia (y pavimento, p pilastri) sul davanti o di lato, dove c'è spazio.
  - Ala / fienile (a pavimento, v muro) addossata a un muro laterale scelto dal seme.
  - Aia / cortile (c) che si espande dove il terreno continua, recintato da staccionata (f), con alberi (t) e pozzo (Q) dove c'è spazio.
  - I semi variano la profondità della casa, il lato del fienile e la posizione di alberi e pozzo.
  - A 5x5 (Large): casa, portico, piccolo fienile o aia; a 7.5x7.5 (Huge): aia ampia con recinto, pozzo e alberi.
-->
<sequence values="BHEhwsdraypvcfQt" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdraypvcfQt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa attorno a H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala: 4 celle in x, 2 in y, con 2 celle libere prima -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Ala / fienile addossato a un muro laterale -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Porta frontale e strada verso il bordo -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="dh" out="*d" symmetry="(x)" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="d" out="h" symmetry="()"/>
      <!-- Ripristina d solo sul muro frontale -->
      <all in="h/r" out="d/*" symmetry="()" steps="1"/>

      <!-- Portico davanti alla casa ai lati della porta -->
      <all in="w/E" out="*/y" symmetry="()" steps="2"/>
      <all in="yE" out="*y" symmetry="(x)" steps="1"/>
      <all in="y/r" out="p/*" symmetry="()" steps="1"/>
      <prl in="y" out="p" p="0.2" steps="1"/>

      <!-- Cortile / aia che cresce dove c'è spazio (più grande a Huge) -->
      <all in="wE" out="*c" steps="1"/>
      <all in="vE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Recinto attorno al cortile dove c'è terreno libero -->
      <all in="cEE" out="*f*" steps="1"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- Pozzo nel cortile e alberi nel terreno libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>

  <color symbol="B" hidden="True"/>
  <color symbol="E" hidden="True"/>
  <color symbol="H" value="D4A373" name="pavimento casa" area="house"/>
  <color symbol="h" value="D4A373" name="pavimento casa" area="house"/>
  <color symbol="w" value="EDE0D4" name="muro casa" area="house"/>
  <color symbol="s" value="C68B59" name="zona scala" area="house"/>
  <color symbol="d" value="8B5A2B" name="porta" area="house"/>
  <color symbol="r" value="C2B280" name="strada" area="road"/>
  <color symbol="a" value="B08968" name="pavimento fienile" area="barn"/>
  <color symbol="v" value="9C6644" name="muro fienile" area="barn"/>
  <color symbol="y" value="DDB892" name="pavimento portico" area="porch"/>
  <color symbol="p" value="7F5539" name="pilastro portico" area="porch"/>
  <color symbol="c" value="A3B18A" name="aia" area="yard"/>
  <color symbol="f" value="6C584C" name="staccionata" area="yard"/>
  <color symbol="Q" value="457B9D" name="pozzo" area="yard"/>
  <color symbol="t" value="588157" name="albero" area="yard"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H pavimento casa, E marker, h pavimento casa, w muro casa, s zona scala, d porta, r strada, a pavimento fienile, y pavimento portico, p pilastro portico, v muro fienile, c aia, f staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
ffffffffffffffffffEE
cccccccccccccccccfEE
cccccwwwwwwwwwwwcfEE
cccccwhhsssshhhwcfEE
vvvvvwhhsssshhhwcfEE
vaaaawhhhhhhhhhwcfEE
vaaaawhhhhHhhhhwcfEE
vaaaawhhhhhhhhhwcfEE
vaaaawhhhhhhhhhwcfEE
vaaaawhhhhhhhhhwcfEE
vvvvvwhhhhhhhhhwcfEE
cccccwwwwdddwwwwcfEE
ffffpyyyyrrryyypyEEE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H pavimento casa, E marker, h pavimento casa, w muro casa, s zona scala, d porta, r strada, a pavimento fienile, y pavimento portico, p pilastro portico, v muro fienile, c aia, f staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEfffffffffffffffff
EEEfcccccccccccccccc
EEEfcwwwwwwwwwwwcccc
EEEfcwhhsssshhhwvvvv
EEEfcwhhsssshhhwaaaa
EEEfcwhhhhhhhhhwaaaa
EEEfcwhhhhHhhhhwaaaa
EEEfcwhhhhhhhhhwaaaa
EEEfcwhhhhhhhhhwaaaa
EEEfcwhhhhhhhhhwvvvv
EEEfcwhhhhhhhhhwcccc
EEEfcwwwwdddwwwwcccc
EEEEyyyyyrrrpypyyfff
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H pavimento casa, E marker, h pavimento casa, w muro casa, s zona scala, d porta, r strada, a pavimento fienile, y pavimento portico, v muro fienile, c aia, f staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
ffffffffffffffffffEE
cccccccccccccccccfEE
vvvvvwwwwwwwwwwwcfEE
vaaaawhhsssshhhwcfEE
vaaaawhhsssshhhwcfEE
vaaaawhhhhhhhhhwcfEE
vaaaawhhhhHhhhhwcfEE
vaaaawhhhhhhhhhwcfEE
vvvvvwhhhhhhhhhwcfEE
cccccwhhhhhhhhhwcfEE
cccccwhhhhhhhhhwcfEE
cccccwwwwdddwwwwcfEE
ffffyyyyyrrryyyyyEEE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H pavimento casa, E marker, h pavimento casa, w muro casa, s zona scala, d porta, r strada, a pavimento fienile, y pavimento portico, p pilastro portico, v muro fienile, c aia, f staccionata, Q pozzo, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEffffffffffffffffffffffffEEE
EEEfccccccccccccccccccccccfEEE
EEEfccccccccccccccccccccccfEEE
EEEfccccccccccccccccccccccfEEE
EEEfccccccccccccccccccccccfEEE
EEEfccQcccccccccccccccccccfEEE
EEEfccccccwwwwwwwwwwwcccccfEEE
EEEfccccccwhhsssshhhwcccccfEEE
EEEfcvvvvvwhhsssshhhwcccccfEEE
EEEfcvaaaawhhhhhhhhhwcccccfEEE
EEEfcvaaaawhhhhHhhhhwcccccfEEE
EEEfcvaaaawhhhhhhhhhwcccccfEEE
EEEfcvaaaawhhhhhhhhhwcccccfEEE
EEEfcvaaaawhhhhhhhhhwcccccfEEE
EEEfcvvvvvwhhhhhhhhhwcccccfEEE
EEEfccccccwwwwdddwwwwcccccfEEE
EEEfcccccyyypprrrypyyyfffffEEE
EEEfcccccfEEEErrrEEEEEEEEEEEEE
EEEfcccccfEEEErrrEEEEEEEEEEEEE
EEEfcccccfEEEErrrEEEEEEEEEEEEE
EEEfffffffEEEErrrEEEEEEEEEtEEE
EEEEEEEEEEEEEErrrEEEEtEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.30 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
  Fattoria:
  - Casa principale (h pavimento, w muro, s zona scala, d porta frontale, r strada verso il bordo) attorno al centro H.
  - Portico / tettoia (y pavimento, p pilastri) sul davanti.
  - Ala / fienile (a pavimento, v muro) addossata a un muro laterale scelto dal seme.
  - Aia / cortile (c) che si espande dove il terreno continua, recintato da staccionata (f), con alberi (t) e pozzo (Q) dove c'è spazio.
  - A 5x5 (Large): casa a due piani, portico, fienile, aia; a 7.5x7.5 (Huge): aia ampia con recinto, pozzo e alberi.
-->
<sequence values="BHEhwsdraypvcfQt" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdraypvcfQt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa attorno a H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala: 4 celle in x, 2 in y, con 2 celle libere prima -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Ala / fienile addossato a un muro laterale -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Porta frontale e strada verso il bordo -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="dh" out="*d" symmetry="(x)" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl in="d" out="h" symmetry="()"/>
      <all in="h/r" out="d/*" symmetry="()" steps="1"/>

      <!-- Portico davanti alla casa ai lati della porta -->
      <all in="w/E" out="*/y" symmetry="()" steps="2"/>
      <all in="yE" out="*y" symmetry="(x)" steps="1"/>
      <all in="y/r" out="p/*" symmetry="()" steps="1"/>
      <prl in="y" out="p" p="0.2" steps="1"/>

      <!-- Cortile / aia che cresce dove c'è spazio (più grande a Huge) -->
      <all in="wE" out="*c" steps="1"/>
      <all in="vE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Recinto attorno al cortile dove c'è terreno libero -->
      <all in="cEE" out="*f*" steps="1"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- Pozzo nel cortile e alberi nel terreno libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>

    <map scale="5 5 1" values="BEhwsdravycfQtHWUVORFKpLgOoNk#20#21#90#91#92" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="p" out="yyyyy/ypppy/ypppy/ypppy/yyyyy"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="Q" out="ccccc/cQQQc/cQQQc/cQQQc/ccccc"/>
      <rule in="t" out="EEEEE/EEEEE/EEtEE/EEEEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="WV"/>
        <union symbol="=" values="hFa"/>

        <!-- B. Altezze: muri della casa (2 piani = 64) e porta -->
        <all in="B d" out="W O" steps="1"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B W" out="W W" steps="5"/>
        <all><rule in="B w" out="w U"/><rule in="B W" out="W U"/></all>
        <all in="B [wW]" out="* U" steps="13"/>
        <all in="B [wW]" out="* W" steps="18"/>
        <all in="B [wW]" out="* U" steps="14"/>
        <all in="B [wW]" out="* W" steps="12"/>
        <prl><rule in="w" out="R"/><rule in="W" out="R"/></prl>

        <!-- Pavimenti, solaio e zona scala della casa -->
        <all steps="1"><rule in="B h" out="h h"/><rule in="B s" out="s h"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Fienile (1 piano alto = 36) -->
        <all in="B v" out="v V" steps="6"/>
        <all in="B v" out="v U" steps="14"/>
        <all in="B v" out="v V" steps="16"/>
        <prl in="v" out="K"/>
        <all in="B a" out="a a" steps="1"/>
        <all in="B a" out="a B" steps="35"/>
        <prl in="a" out="K"/>

        <!-- Portico (tetto a 34, pilastri alti 33) -->
        <all in="B p" out="p p" steps="34"/>
        <prl in="p" out="K"/>
        <all in="B y" out="y y" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="K"/>

        <!-- Staccionata, pozzo, alberi -->
        <all in="B f" out="f f" steps="10"/>
        <prl in="f" out="B"/>
        <all in="B Q" out="Q Q" steps="8"/>
        <prl in="Q" out="B"/>
        <all in="B t" out="t t" steps="16"/>
        <prl in="t" out="g"/>
        <all in="gB" out="*g" steps="4"/>
        <all in="B g" out="g g" steps="4"/>

        <!-- C. Parti incluse -->
        <import file="part-door"/>
        <import file="part-stair"/>

        <!-- Finestre nella fascia U -->
        <one steps="16">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>

        <!-- Tetti a falde con gronda -->
        <all in="RB" out="*R" steps="1"/>
        <all in="KB" out="*K" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <all in="*****/*****/**B**/*****/***** **K**/**K**/KKKKK/**K**/**K**"
             out="*****/*****/**K**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <color symbol="B" hidden="True"/>
  <color symbol="E" hidden="True"/>
  <color symbol="h" value="D4A373" name="pavimento casa" area="house"/>
  <color symbol="F" value="C68B59" name="solaio casa" area="house"/>
  <color symbol="W" value="EDE0D4" name="muro casa" area="house"/>
  <color symbol="R" value="A44A3F" name="tetto casa" area="house"/>
  <color symbol="L" value="A8DADC" name="vetro finestra" area="house"/>
  <color symbol="a" value="B08968" name="pavimento fienile" area="barn"/>
  <color symbol="V" value="9C6644" name="muro fienile" area="barn"/>
  <color symbol="K" value="7F4F24" name="tetto fienile" area="barn"/>
  <color symbol="y" value="DDB892" name="pavimento portico" area="porch"/>
  <color symbol="p" value="7F5539" name="pilastro portico" area="porch"/>
  <color symbol="r" value="C2B280" name="strada" area="road"/>
  <color symbol="c" value="A3B18A" name="aia" area="yard"/>
  <color symbol="f" value="6C584C" name="staccionata" area="yard"/>
  <color symbol="Q" value="457B9D" name="pozzo" area="yard"/>
  <color symbol="t" value="582F0E" name="tronco" area="yard"/>
  <color symbol="g" value="588157" name="chioma albero" area="yard"/>
  <color symbol="O" value="8B5A2B" name="porta" area="house"/>
  <color symbol="o" value="6F4E37" name="assi porta" area="house"/>
  <color symbol="N" value="5C4033" name="stipite porta" area="house"/>
  <color symbol="k" value="B08968" name="gradino scala" area="house"/>
  <color symbol="T" hidden="True"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="#90" hidden="True"/>
  <color symbol="#91" hidden="True"/>
  <color symbol="#92" hidden="True"/>

  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
