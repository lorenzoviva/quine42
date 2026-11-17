# model.sculpt · claude-opus-5-5 · 133 s

## Richiesta

Sculpt: villetta
What it looks like: villetta: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Your program so far
<!--
villetta: a country house, two volumes of different height under pitched roofs, a porch on the door.
h  the main hall (two storeys), w its walls; s the zone of the stair along the back wall, at the corner.
a  the wing (one storey, lower), v its walls: against a side of the main body, the side and the place chosen by the seed.
d  the door, in the middle of the front wall, 3 cells wide; r the path from the door straight to the front edge.
p  the porch in front of the door, beside the path.
g  the lawn, a ring of two cells around the house; t the trees on free ground beyond, where a 7 x 7 window fits.
Seeds change: the depth of the house (one more cell in front), the side and position of the wing, where the trees go.
Large: house, wing, porch, path, lawn, one or two trees behind. Huge: the same house with more trees around it, a well Q in the lawn.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdrpgtsmQ" symmetry="()">
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
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <all in="rE" out="*p" symmetry="(x)" steps="1"/>
      <all in="w/p" out="*/p" symmetry="()"/>
      <all in="p/[pE]/[pE]" out="*/p/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="[wvp]E" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**Q**/*****/*****" steps="1"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="h" value="c9a77a" name="sala" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro della casa"/>
  <color symbol="a" value="b89470" name="ala" area="house"/>
  <color symbol="v" value="d8c8a8" name="muro dell'ala"/>
  <color symbol="d" value="6b3e1f" name="porta"/>
  <color symbol="r" value="a89a80" name="sentiero" area="garden"/>
  <color symbol="p" value="9c6b3a" name="portico" area="porch"/>
  <color symbol="g" value="8fb060" name="prato" area="garden"/>
  <color symbol="t" value="3f7a3a" name="albero" area="garden"/>
  <color symbol="s" value="7a5a3a" name="scala"/>
  <color symbol="Q" value="5a8ab0" name="pozzo" area="garden"/>
  <color symbol="m" value="ff00ff" name="segno"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h sala, w muro della casa, a ala, v muro dell'ala, d porta, r sentiero, p portico, g prato, s scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEggggggggggggggggg
EEEggggggggggggggggg
EEEggwwwwwwwwwwwgggg
EEEggwhhsssshhhwgggg
EEEggwhhsssshhhwgggg
EEEggwhhhhhhhhhwgggg
EEEggwhhhhhhhhhwgggg
EEEggwhhhhhhhhhwvvvv
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwwwwdddwwwwaaav
EEEggggpprrrppggvvvv
EEEggggpprrrppgggggg
EEEggggpprrrppgggggg
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h sala, w muro della casa, a ala, v muro dell'ala, d porta, r sentiero, p portico, g prato, s scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEggggggggggggggggg
EEEggggggggggggggggg
EEEggwwwwwwwwwwwgggg
EEEggwhhsssshhhwgggg
EEEggwhhsssshhhwgggg
EEEggwhhhhhhhhhwgggg
EEEggwhhhhhhhhhwgggg
EEEggwhhhhhhhhhwvvvv
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwwwwdddwwwwaaav
EEEggggpprrrppggvvvv
EEEggggpprrrppgggggg
EEEggggpprrrppgggggg
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h sala, w muro della casa, a ala, v muro dell'ala, d porta, r sentiero, p portico, g prato, s scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEggggggggggggggggg
EEEggggggggggggggggg
EEEggwwwwwwwwwwwgggg
EEEggwhhsssshhhwgggg
EEEggwhhsssshhhwgggg
EEEggwhhhhhhhhhwgggg
EEEggwhhhhhhhhhwvvvv
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwhhhhhhhhhwaaav
EEEggwwwwdddwwwwvvvv
EEEggggpprrrppgggggg
EEEggggpprrrppgggggg
EEEggggpprrrppgggggg
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h sala, w muro della casa, a ala, v muro dell'ala, d porta, r sentiero, p portico, g prato, t albero, s scala, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEtEEEEEEEEEEEtEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEtEEEEE
EEEEEEEEEEEEEtEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEtEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEgggggggggggggggggggEEE
EEEEEEEEgggggggggggggggggggEEE
EEEEEEEEggwwwwwwwwwwwggggggEEE
EEEEEEEEggwhhsssshhhwggggggEEE
EEEtEEEEggwhhsssshhhwggggggEEE
EEEEEEEEggwhhhhhhhhhwggggggEEE
EEEEEEEEggwhhhhhhhhhwggggggEEE
EEEEEEEEggwhhhhhhhhhwvvvvggEEE
EEEtEEEEggwhhhhhhhhhwaaavggEEE
EEEEEEEEggwhhhhhhhhhwaaavggEEE
EEEEEEEEggwhhhhhhhhhwaaavggEEE
EEEEEEEEggwhhhhhhhhhwaaavggEEE
EEEEtEEEggwwwwdddwwwwaaavggEEE
EEEEEEEEggggpprrrppggvvvvggEEE
EEEEEEEEggggpprrrppggggggggEEE
EEEEEEEEggggpprrrppggggggggEEE
EEEtEEEEggggpprrrppggggggggEEE
EEEEEEEEggggpprrrppggQgggggEEE
EEEEEEEEggggpprrrppggggggggEEE
EEEEEEEEggggpprrrppggggggggEEE
EEEEEEEEggggpprrrppggggggggEEE
```
How much the plans of the seeds differ: 0.03 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
villetta: a country house; two volumes of different height under pitched roofs, with a porch on the door.
h  the main hall (two storeys); w its walls; s the stair zone along the back wall, landing at small x.
a  the wing (one storey, lower); v its walls; it stands against a side wall, side and place chosen by the seed.
d  the door, in the middle of the front wall, 3 cells wide; r the path from the door straight to the front edge.
p  the porch on both sides of the path, under a lean-to on posts.
g  the lawn ring; t the trees beyond it; Q a well in the lawn.
The seeds change:
  - the depth of the house (one more cell behind and/or in front);
  - the side and place of the wing;
  - the trees.
Large holds the house, wing, porch, path and lawn. Huge adds the trees around it and the well.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavdrpgtsmQ" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <all in="rE" out="*p" symmetry="(x)" steps="1"/>
      <all in="w/p" out="*/p" symmetry="()"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="[wvp]E" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gE" out="*g" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
      <one in="ggggg/ggggg/ggggg/ggggg/ggggg" out="*****/*****/**Q**/*****/*****" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwWYRDOafvsTkFrpbXyJgtZCQPLKNoM#90#91#92#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ggggg/gtttg/gtttg/gtttg/ggggg"/>
      <rule in="Q" out="QQQQQ/QgggQ/QgggQ/QgggQ/QQQQQ"/>
      <sequence symmetry="(xy)">
        <!-- the walls of the hall: 64 tall, two bands of windows -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w Y" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w Y" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- the door wall -->
        <all in="B D" out="D O" steps="1"/>
        <all in="B D" out="D W" steps="63"/>
        <prl in="D" out="R"/>
        <!-- the hall: floor, stair strip, slab, roof -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- the wing: one storey, 32 -->
        <all in="B v" out="v W" steps="6"/><all in="B v" out="v Y" steps="14"/><all in="B v" out="v W" steps="12"/>
        <prl in="v" out="R"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>
        <!-- the porch: posts and the lean-to at 34 -->
        <all in="B b" out="b X" steps="34"/>
        <prl in="b" out="J"/>
        <all in="B p" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <!-- the trees -->
        <all in="B t" out="t Z" steps="16"/>
        <prl in="t" out="C"/>
        <all in="CB" out="*C" steps="4"/>
        <all in="B C" out="C *" steps="6"/>
        <!-- the well -->
        <all in="B Q" out="Q P" steps="6"/>
        <prl in="Q" out="P"/>
        <!-- the windows -->
        <one steps="14"><rule in="BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY BY/BY/BY/BY/BY/BY" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LYYYYB" out="*LLLL*"/>
        <prl in="Y" out="W"/>
        <!-- the roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
        <!-- the parts -->
        <union symbol="+" values="W"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="h" value="c9a77a" name="sala" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro della casa"/>
  <color symbol="a" value="b89470" name="ala" area="house"/>
  <color symbol="v" value="d8c8a8" name="muro dell'ala"/>
  <color symbol="d" value="6b3e1f" name="porta"/>
  <color symbol="r" value="a89a80" name="sentiero" area="garden"/>
  <color symbol="p" value="9c6b3a" name="portico" area="porch"/>
  <color symbol="g" value="8fb060" name="prato" area="garden"/>
  <color symbol="t" value="3f7a3a" name="albero" area="garden"/>
  <color symbol="s" value="7a5a3a" name="scala" area="house"/>
  <color symbol="Q" value="5a8ab0" name="pozzo" area="garden"/>
  <color symbol="m" value="ff00ff" name="segno"/>
  <color symbol="W" value="ece2c8" name="intonaco"/>
  <color symbol="Y" value="ece2c8" name="intonaco"/>
  <color symbol="D" value="ece2c8" name="intonaco"/>
  <color symbol="R" value="b0452e" name="tegole"/>
  <color symbol="O" value="7a4a24" name="porta di legno"/>
  <color symbol="o" value="4a2a14" name="assi della porta"/>
  <color symbol="N" value="5a4a3a" name="stipite"/>
  <color symbol="f" value="a0784a" name="pavimento di tavole" area="house"/>
  <color symbol="F" value="8a6a48" name="solaio"/>
  <color symbol="T" value="7a5a3a" name="scala"/>
  <color symbol="k" value="6a4a2a" name="gradini"/>
  <color symbol="b" value="5c3a1e" name="palo"/>
  <color symbol="X" value="5c3a1e" name="palo del portico"/>
  <color symbol="y" value="5c3a1e" name="tettoia"/>
  <color symbol="J" value="8a3a28" name="tettoia del portico"/>
  <color symbol="Z" value="6a4628" name="tronco"/>
  <color symbol="C" value="5a9a4a" name="chioma"/>
  <color symbol="P" value="8a8a88" name="pietra del pozzo"/>
  <color symbol="L" value="3a5a78" name="finestra"/>
  <color symbol="K" value="7a6a60" name="camino"/>
  <color symbol="M" value="ece2c8" name="merlo"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
