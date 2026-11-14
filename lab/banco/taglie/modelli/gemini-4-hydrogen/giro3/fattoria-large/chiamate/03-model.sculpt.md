# model.sculpt · gemini-4-hydrogen · 17 s

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

The program you wrote:
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
It does not pass: taglia Grande, seme 1: piani: 1 (serve ≥ 2); porta: 15 × 1 voxel (0,75 × 0,05 caselle), una porta è almeno 11 × 30 a ogni taglia — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, r strada, c aia, W muro casa, V muro fienile, O porta, R tetto casa, F solaio casa, K tetto fienile, L vetro finestra, o assi porta, k gradino scala
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
.............................................EEEEE
.............................................EEEEE
cccccccccccccccccccccccccccccccccccccccccc...EEEEE
ccccccccccccccccccccccccccccccccccccccccccc..EEEEE
ccccccccccccccccccccccccccccccccccccccccccc..EEEEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE
.........KKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKEEEEEEE
.........KKKKKKKKKKKKKKrrrrrrrKKKKKKKKKKKKKEEEEEEE
EEEEEEEEEEKKKKKKKKKKKKKrrrrrrrKKKKKKKKKKKKKEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
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
.............................................00000
.............................................00000
000000000000000000000000000000000000000000...00000
0000000000000000000000000000000000000000000..00000
000000000000zzzzzzzzzzzzzzzzzzzzzzzzzzzz000..00000
000000000000zzzzzzzzzzzzzzzzzzzzzzzzzzzzz00..00000
000000000000zzzzzzzzzzzzzzzzzzzzzzzzzzzzz00..00000
000000000000zzzzzzzzzzzzzzzzzzzzzzzzzzzzz00..00000
000000000000zzzztttttttttttttttttttttzzzz00..00000
ggggggggggggzzzztttttttttttttttttttttzzzz00..00000
ggggggggggggzzzzttuuuuuuuuuuuuuuuuuttzzzz00..00000
gghhhhhhhhhgzzzzttuuuuuuuuuuuuuuuuuttzzzz00..00000
gghhhhhhhhhgzzzzttuuvvvvvvvvvvvvvuuttzzzz00..00000
gghhiiiiihhgzzzzttuuvvvvvvvvvvvvvuuttzzzz00..00000
gghhiiiiihhgzzzzttuuvvwwwwwwwwwvvuuttzzzz00..00000
gghhiijiihhgzzzzttuuvvwwwwwwwwwvvuuttzzzz00..00000
gghhiijiihhgzzzzttuuvvwwwwwwwwwvvuuttzzzz00..00000
gghhiijiihhgzzzzttuuvvwwwwwwwwwvvuuttzzzz00..00000
gghhiijiihhgzzzzttuuvvwwwwwwwwwvvuuttzzzz00..00000
gghhiijiihhgzzzzttuuvvwwwwwwwwwvvuuttzzzz00..00000
gghhiijiihhgzzzzttuuvvwwwwwwwwwvvuuttzzzz00..00000
gghhiijiihhgzzzzttuuvvvvvvvvvvvvvuuttzzzz00..00000
gghhiiiiihhgzzzzttuuvvvvvvvvvvvvvuuttzzzz00..00000
gghhiiiiihhgzzzzttuuuuuuuuuuuuuuuuuttzzzz00..00000
gghhhhhhhhhgzzzzttuuuuuuuuuuuuuuuuuttzzzz00..00000
gghhhhhhhhhgzzzztttttttttttttttttttttzzzz00..00000
ggggggggggggzzzztttttttttttttttttttttzzzz00..00000
ggggggggggggzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00..00000
000000000000zzzzzzzzzzzzzzzzzzzzzzzzzzzzz00..00000
0000000000ffzzzzzzzzzzzzzzzzzzzzzzzzzzzzzff..00000
.........fggzzzzzzzzzzzzzzzzzzzzzzzzzzzzggf0000000
.........fggggggggggggf000000fggggggggggggf0000000
000000000ffffffffffffff000000ffffffffffffff0000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
............RWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............LWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............LWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............LWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............LWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWLLLWWWWWWWWWWWWWWWWWWWWW..........
............WWWWLLLWWWWWWWWWWWWWWWWWWWWW..........
............WWWWLLLWWWWWWWWWWWWWWWWWWWWW..........
............WWWWLLLWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWLLLWWWWWWWW..........
............WWWWWWWWWWWWWWWWWLLLWWWWWWWW..........
............WWWWWWWWWWWWWWWWWLLLWWWWWWWW..........
............WWWWWWWWWWWWWWWWWLLLWWWWWWWW..........
....KKKK....WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..KKKKKKKK..WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
KKKKKKKKKKKKWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
VVVVVVVVVVKKKKKKKKKKKKKWWWWWWWKKKKKKKKKKKKK.......
VVVVVVVVVVKKKKKKKKKKKKKWWWWWWWKKKKKKKKKKKKK.......
VVVVVVVVVVKKKWWWWWWWWWWWWWWWWWWWWWWWWWKK..........
VVVVVVVVVVKKKWWWWWWWWWWWWWWWWWWWWWWWWWKK..........
VVVVVVVVVVKKKWWWWWWWWWWWWWWWWWWWWWWWWWKK..........
VVVVVVVVVVKKKWWWWWWWWWWWWWWWWWWWWWWWWWKK..........
VVVVVVVVVVKKKWWWWWWWWWWWWWWWWWWWWWWWWWKK..........
VVVVVVVVVVKKKWWWWWWWWWWWWWWWWWWWWWWWWWKK..........
WWWWWWWWWWKKKWWWWWWWWWWWWWWWWWWWWWWWWWKK..........
WWWWWWWWWWKKKLLLWWWWWWWWWWWWWWWWWWWWWWKK..........
WWWWWWWWWWKKKLLLWWWWWWWWWWWWWWWWWWWWWWKK..........
WWWWWWWWWWKKKLLLWWWWWWWWWWWWWWWWWWWWWWKK..........
WWWWWWWWWWKKKLLLWWWWWWWWWWWWWWWWWWWWWWKK..........
WWWWWWWWWWKKKWWWWWWWWWWWWWWWWWWWWWWWWWKK..........
WWWWWWWWWWKKKWWWWWWWWWWWWWWWWWWWWWWWWWKK..........
VVVVVVVVVVKKKRRRRRRRRRRRRRRRRRRRRRRRRRKKR.........
VVVVVVVVVVKKKRRRRRRRRRRRRRRRRRRRRRRRRRKKR.........
EEEEEEEEEEEEEEEEEEEEEERrrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWLLLWWWWWWWWWWWWWWW..........
...............WWWWWWWLLLWWWWWWWWWWWWWWW..........
...............WWWWWWWLLLWWWWWWWWLLLWWWW..........
...............WWWWWWWLLLWWWWWWWWLLLWWWW..........
...............WWWWWWWWWLLLWWWWWWLLLWWWW..........
...............WWWWWWWWWLLLWWWWWWLLLWWWW..........
...............WWWWWWWWWLLLWWWWWWWWWWWWW..........
...............WWWWWWWWWLLLWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWLLLWWWWWWWWWWWWWW..........
...............WWWWWWWWLLLWWWWWWWWWWWWWW..........
...............WWWWWWWWLLLWWWWWWWWWWWWWW..........
...............WWWWWLLLLLLWWWWWWWWWWWWWW..........
...............WWWWWLLLWWWWWWWWWWWWWWWWW..........
...............WWWWWLLLWWWWWWWWWWWWWWWWW..........
...............WWWWWLLLWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWWKKK.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWKKK.......
...............WWWWWWWWWWWLLLWWWWWWWWWWWKKK.......
...............WWLLWWWWWWWLLLWWWWWWWWWWWKKK.......
...............WWLLLWWWWWWLLLWWWWWWWWWWWKKK.......
...............WWLLLWWWWWWLLLWWWWWWWWWWWKKK.......
...............WWLLLWWWWWWWWWWWWWWWWWWWWKKK.......
...............WWWWWWWWWWWWWWWWWWLLLWWWWKKK.......
...............WWWWWWWWWWWWWWWWWWLLLWWWWKKK.......
...............WWWWWWWWWWWWWWWWWWLLLWWWWKKK.......
...............WWWWWWWWWWWWWWWWWWLLLWWWWKKK.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWKKK.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWKKK.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWKKK.......
...............WWWWWWWWWWWWWWWWWWWWWWWWWKKK.......
..............RRRRRRRRRRRRRRRRRRRRRRRRRRRKK.......
..............RRRRRRRRRRRRRRRRRRRRRRRRRRRKK.......
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
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWW.......kkkkkk.........WWW..........
............WWW.......kkkkkk.........WWW..........
WWWWWWWWWWWWWWW.......kkkkkk.........WWW..........
WWWWWWWWWWWWWWW.......kkkkkk.........WWW..........
WWWWWWWWWWWWWWW........kkkkk.........WWW..........
WWW.........WWW......................WWW..........
WWW.........WWW......................WWW..........
WWW.........WWW......................WWW..........
WWW.........WWW......................WWW..........
WWW.........WWW......................WWW..........
WWW.........WWW......................WWW..........
WWW.........WWW......................WWW..........
WWW.........WWW......................WWW..........
WWW.........WWW......................WWW..........
WWW.........WWW......................WWW..........
WWW.........WWW......................WWW..........
WWW.........WWW......................WWW..........
WWWWWWWWWWWWWWW......................WWW..........
WWWWWWWWWWWWWWW......................WWW..........
WWWWWWWWWWWWWWWLWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWLWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWLWWWWWWWWWWWWWWWWWWWWWWWW..........
..........KK..........................KK..........
..........KKK........................KKK..........
...........K..........................K...........
..................................................
..................................................
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
............LLLLLLWWWWWWWWWWWWWWWWWWWWWW..........
............WWWLLLWWWWWWWWWWWWWWWWWWWWWW..........
............WWWLLLWWWWWWWWWWWWWWWWWWWWWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................LLL..........
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
............WWW......................WWW..........
............WWW......................WWW..........
............WWWWWWWWWWWWWWWWWLLLWWWWWWWW..........
............WWWWWWWWWWWWWWWWWLLLWWWWWWWW..........
............WWWWWWWWWWWWWWWWWLLLWWWWWWWW..........
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
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................LLL..........
............LLL......................LLL..........
............LLL......................LLL..........
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
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
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
EEEEEEEE..........................................   00000000..........................................
EEEEEEEE..........................................   00000000..........................................
EEEEEEEE..cccccccccccccccccccccccccccccccccccccccc   00000000..0000000000000000000000000000000000000000
EEEEEEEE..cccccccccccccccccccccccccccccccccccccccc   00000000..0000000000000000000000000000000000000000
EEEEEEEE..cccccccccccccccccccccccccccccccccccccccc   00000000..00zzzzzzzzzzzzzzzzzzzzzzzzzzzz0000000000
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00000000..00zzzzzzzzzzzzzzzzzzzzzzzzzzzzz000000000
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00000000..00zzzzzzzzzzzzzzzzzzzzzzzzzzzzz000000000
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzzzzzzzzzzzzzzzzzzzzzzzzzzggggggggg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzztttttttttttttttttttttzzzzggggggggg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzztttttttttttttttttttttzzzzghhhhhhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuuuuuuuuuuuuuuuuttzzzzghhhhhhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuuuuuuuuuuuuuuuuttzzzzghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuvvvvvvvvvvvvvuuttzzzzghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuvvvvvvvvvvvvvuuttzzzzghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuvvwwwwwwwwwvvuuttzzzzghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuvvwwwwwwwwwvvuuttzzzzghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuvvwwwwwwwwwvvuuttzzzzghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuvvwwwwwwwwwvvuuttzzzzghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuvvwwwwwwwwwvvuuttzzzzghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuvvwwwwwwwwwvvuuttzzzzghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuvvwwwwwwwwwvvuuttzzzzghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuvvvvvvvvvvvvvuuttzzzzghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuvvvvvvvvvvvvvuuttzzzzghhhhhhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuuuuuuuuuuuuuuuuttzzzzghhhhhhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzzttuuuuuuuuuuuuuuuuuttzzzzggggggggg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00zzzztttttttttttttttttttttzzzzggggggggg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00000000..00zzzztttttttttttttttttttttzzzz000000000
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00000000..00zzzzzzzzzzzzzzzzzzzzzzzzzzzzz000000000
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00000000..00zzzzzzzzzzzzzzzzzzzzzzzzzzzzz000000000
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00000000..ffzzzzzzzzzzzzzzzzzzzzzzzzzzzzzff0000000
EEEEEEEEEEKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRKKK.......   000000000fggzzzzzzzzzzzzzzzzzzzzzzzzzzzzggf.......
EEEEEEEEEEKKKKKKKKKKKKKrrrrrrrKKKKKKKKKKKKK.......   000000000fggggggggggggf000000fggggggggggggf.......
EEEEEEEEEEKKKKKKKKKKKKKrrrrrrrKKKKKKKKKKKKKEEEEEEE   000000000ffffffffffffff000000ffffffffffffff0000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
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
.............................................EEEEE   .............................................00000
.............................................EEEEE   .............................................00000
cccccccccccccccccccccccccccccccccccccccccc...EEEEE   000000000000000000000000000000000000000000...00000
ccccccccccccccccccccccccccccccccccccccccccc..EEEEE   0000000000000000000000000000000000000000000..00000
ccccccccccccccccccccccccccccccccccccccccccc..EEEEE   ggggggggggggzzzzzzzzzzzzzzzzzzzzzzzzzzzz000..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   ggggggggggggzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhhhhhhhhgzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhhhhhhhhgzzzzzzzzzzzzzzzzzzzzzzzzzzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiiiiihhgzzzztttttttttttttttttttttzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiiiiihhgzzzztttttttttttttttttttttzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiijiihhgzzzzttuuuuuuuuuuuuuuuuuttzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiijiihhgzzzzttuuuuuuuuuuuuuuuuuttzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiijiihhgzzzzttuuvvvvvvvvvvvvvuuttzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiijiihhgzzzzttuuvvvvvvvvvvvvvuuttzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiijiihhgzzzzttuuvvwwwwwwwwwvvuuttzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiijiihhgzzzzttuuvvwwwwwwwwwvvuuttzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiijiihhgzzzzttuuvvwwwwwwwwwvvuuttzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiiiiihhgzzzzttuuvvwwwwwwwwwvvuuttzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiiiiihhgzzzzttuuvvwwwwwwwwwvvuuttzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhhhhhhhhgzzzzttuuvvwwwwwwwwwvvuuttzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhhhhhhhhgzzzzttuuvvwwwwwwwwwvvuuttzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   ggggggggggggzzzzttuuvvvvvvvvvvvvvuuttzzzz00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   ggggggggggggzzzzttuuvvvvvvvvvvvvvuuttzzzz00..00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   000000000000zzzzttuuuuuuuuuuuuuuuuuttzzzz00..00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   000000000000zzzzttuuuuuuuuuuuuuuuuuttzzzz00..00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   000000000000zzzztttttttttttttttttttttzzzz00..00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   000000000000zzzztttttttttttttttttttttzzzz00..00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   000000000000zzzzzzzzzzzzzzzzzzzzzzzzzzzzz00..00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   000000000000zzzzzzzzzzzzzzzzzzzzzzzzzzzzz00..00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   0000000000ffzzzzzzzzzzzzzzzzzzzzzzzzzzzzzff..00000
.........KKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKEEEEEEE   .........fggzzzzzzzzzzzzzzzzzzzzzzzzzzzzggf0000000
.........KKKKKKKKKKKKKKrrrrrrrKKKKKKKKKKKKKEEEEEEE   .........fggggggggggggf000000fggggggggggggf0000000
EEEEEEEEEEKKKKKKKKKKKKKrrrrrrrKKKKKKKKKKKKKEEEEEEE   000000000ffffffffffffff000000ffffffffffffff0000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.27 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 126 nodi, 523 passi, finito in 490 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=Emerald (marcatore), h=pavimento casa, w=white, s=slate, d=dead, dark, r=strada, a=pavimento fienile, y=pavimento portico, p=pilastro portico, v=olive, c=aia, f=staccionata, W=muro casa, U=blUe, V=muro fienile, O=porta, R=tetto casa, F=solaio casa, K=tetto fienile, L=vetro finestra, o=assi porta, k=gradino scala, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), T=Teal (marcatore).
Alla fine: W 71120, R 18065, V 8250, K 5765, E 3950, L 3480, F 3240, k 2720, c 1050, r 300, o 71, O 4.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-38 all×26, one×2, prl×2: 284 celle x0-17 y4-19 z0, passi 2-51
   #42 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 52
#44-46 all×3: 11025 celle x25-79 y30-79 z0-6, passi 53-64
    #47 all . w → w U (+1): ×73, 138700 celle x25-79 y30-79 z6-79, passi 65-137, w→U 63875, .→w 63875, W→U 5475, .→W 5475
      r1 . w → w U ×63875; r2 . W → W U ×5475
#52-54 prl×1, all×2: 8975 celle x25-79 y30-79 z0-79, passi 138-140
    #55 all . h → h . passi=31: ×31, 195200 celle x30-74 y35-74 z0-32, passi 141-171, h→. 97600, .→h 97600
    #56 all . s → s . passi=30: ×30, 12000 celle x40-59 y35-44 z2-32, passi 172-201, s→. 6000, .→s 6000
    #57 all . h → h F (+1) passi=1: ×1, 6800 celle x30-74 y35-74 z30-33, passi 202, h→F 3200, .→h 3200, s→F 200, .→s 200
      r1 . h → h F ×3200; r2 . s → s F ×200
    #58 all . h → h . (+1) passi=31: ×31, 111600 celle x30-74 y35-74 z33-64, passi 203-233, h→. 49600, .→h 49600, s→. 6200, .→s 6200
      r1 . h → h . ×49600; r2 . s → s . ×6200
#59-60 prl×1, all×1: 8100 celle x0-74 y35-74 z0-64, passi 234-240
    #61 all . v → v U passi=14: ×14, 10500 celle x0-24 y40-74 z6-20, passi 241-254, v→U 5250, .→v 5250
#62-64 all×2, prl×1: 12875 celle x0-24 y40-74 z1-36, passi 255-272
    #65 all . a → a . passi=35: ×35, 69000 celle x5-24 y45-69 z0-36, passi 273-307, a→. 34500, .→a 34500
#66-69 prl×2, all×2: 2474 celle x5-84 y45-84 z0-36, passi 308-344
    #70 all . y → y . passi=33: ×33, 30160 celle x20-84 y80-84 z0-34, passi 345-377, y→. 15080, .→y 15080
#71-72 prl×1, all×1: 8714 celle x0-89 y20-84 z1-34, passi 378-388
    #73 prl f → .: ×1, 9075 celle x0-89 y20-84 z0-10, passi 389, f→. 9075
#89-121 all×11, prl×4, one×1: 16881 celle x25-79 y30-79 z0-78, passi 390-505
    #122 prl U → W: ×1, 71120 celle x0-79 y30-79 z6-78, passi 506, U→W 71120
#123-126 all×4: 11186 celle x0-85 y29-85 z0-79, passi 507-523
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#30 all y/r → p/* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#35 all cEEEEEE → *cccc** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#36 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#39 one ccccc/ccccc/ccccc/ccccc/ccccc → *****/*****/**Q**/*****/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#40 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******…: le celle cercate c'erano, ma mai disposte come nel pattern
#48 all . [wW] → * U passi=13: le celle cercate c'erano, ma mai disposte come nel pattern
#49 all . [wW] → * W passi=18: le celle cercate c'erano, ma mai disposte come nel pattern
#50 all . [wW] → * U passi=14: le celle cercate c'erano, ma mai disposte come nel pattern
#51 all . [wW] → * W passi=12: le celle cercate c'erano, ma mai disposte come nel pattern
#74 all . Q → Q Q passi=8: in quel momento nella griglia non c'erano celle "Q"
#75 prl Q → .: in quel momento nella griglia non c'erano celle "Q"
… e altri 28
Fix it and answer with the whole program.

## Risposta

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
        <all steps="14"><rule in="B w" out="w U"/><rule in="B W" out="W U"/></all>
        <all steps="18"><rule in="B w" out="w W"/><rule in="B W" out="W W"/></all>
        <all steps="14"><rule in="B w" out="w U"/><rule in="B W" out="W U"/></all>
        <all steps="12"><rule in="B w" out="w W"/><rule in="B W" out="W W"/></all>
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
