# model.sculpt · gemini-4-hydrogen · 21 s

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
000000000000ssssssssssssssssssssssssssss000..00000
000000000000sttttttttttttttttttttttttttts00..00000
000000000000sttttttttttttttttttttttttttts00..00000
000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts00..00000
000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts00..00000
ggggggggggggsttuuvvvvvvvvvvvvvvvvvvvuutts00..00000
ggggggggggggsttuuvvvvvvvvvvvvvvvvvvvuutts00..00000
gghhhhhhhhhgsttuuvvwwwwwwwwwwwwwwwvvuutts00..00000
gghhhhhhhhhgsttuuvvwwwwwwwwwwwwwwwvvuutts00..00000
gghhiiiiihhgsttuuvvwwwwwwwwwwwwwwwvvuutts00..00000
gghhiiiiihhgsttuuvvwwwxxxxxxxxxwwwvvuutts00..00000
gghhiijiihhgsttuuvvwwwxxxxxxxxxwwwvvuutts00..00000
gghhiijiihhgsttuuvvwwwxxxxxxxxxwwwvvuutts00..00000
gghhiijiihhgsttuuvvwwwxxxxxxxxxwwwvvuutts00..00000
gghhiijiihhgsttuuvvwwwxxxxxxxxxwwwvvuutts00..00000
gghhiijiihhgsttuuvvwwwxxxxxxxxxwwwvvuutts00..00000
gghhiijiihhgsttuuvvwwwxxxxxxxxxwwwvvuutts00..00000
gghhiijiihhgsttuuvvwwwwwwwwwwwwwwwvvuutts00..00000
gghhiiiiihhgsttuuvvwwwwwwwwwwwwwwwvvuutts00..00000
gghhiiiiihhgsttuuvvwwwwwwwwwwwwwwwvvuutts00..00000
gghhhhhhhhhgsttuuvvvvvvvvvvvvvvvvvvvuutts00..00000
gghhhhhhhhhgsttuuvvvvvvvvvvvvvvvvvvvuutts00..00000
ggggggggggggsttuuuuuuuuuuuuuuuuuuuuuuutts00..00000
ggggggggggggsttuuuuuuuuuuuuuuuuuuuuuuutts00..00000
000000000000sttttttttttttttttttttttttttts00..00000
0000000000ffstttttttttttttttttttttttttttsff..00000
.........fggssssssssssssssssssssssssssssggf0000000
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
......................RRRRRRRR....................
....................RRRRRRRRRRRR..................
..................RRRRRRRRRRRRRRRR................
................RRRRRRRRRRRRRRRRRRRR..............
..............RRRRRRRRRRRRRRRRRRRRRRRR............
............RRRRRRRRRRRRRRRRRRRRRRRRRRRR..........
............RRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
............RRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
............RRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
............RRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
............RRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
............RRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
............WWWWWWWWWWLLLWWWWWWWWWWWWWWW..........
............WWWWWWWWWWLLLWWWWWWWWWWWWWWW..........
............WWWWWWWWWWLLLLLWWWWWWWWWWLLL..........
............WWWWWWWWWWLLLLLLWWWWWWWWWLLL..........
............WWWWWWWWWWWWLLLLWWWWWWWWWLLL..........
....KKKK....WWWWWWWWWWWWWLLLWWWWWWWWWLLL..........
..KKKKKKKK..WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
VVVVVVVVVVKKKKKKKKKKKKKRRRRRRRKKKKKKKKKKKKK.......
VVVVVVVVVVKKKKKKKKKKKKKRRRRRRRKKKKKKKKKKKKK.......
VVVVVVVVVVKKKRRRRRRRRRRRRRRRRRRRRRRRRRKKR.........
VVVVVVVVVVKKKRRRRRRRRRRRRRRRRRRRRRRRRRKKR.........
VVVVVVVVVVKKKRRRRRRRRRRRRRRRRRRRRRRRRRKKR.........
VVVVVVVVVVKKKRRRRRRRRRRRRRRRRRRRRRRRRRKKR.........
VVVVVVVVVVKKKRRRRRRRRRRRRRRRRRRRRRRRRRKKR.........
VVVVVVVVVVKKKRRRRRRRRRRRRRRRRRRRRRRRRRKKR.........
WWWWWWWLLLKKKWWWWWWWWWWWWWWWWWWWWWWWWWKK..........
WWWWWWLLLLKKKWWWWWWWWWWWWWWWWWWWWWWWWWKK..........
WWWWWWLLLLKKKWWWWWWWLLWWWWWWWWWWWWWWWWKK..........
WWWWWWLLLLKKKLLLWWWWLLLWWWWWWWWWWWWWWWKK..........
WWWWWWLLLWKKKLLLWWWWLLLWWWWWWWWWWWWWWWKK..........
WWWWWWWWWWKKKLLLWWWWLLLWWWWWWWWWWWWWWWKK..........
WWWWWWWWWWKKKLLLWWWWWWWWWWWWWWWWWWWWWWKK..........
VVVVVVVVVVKKKRRRRRRRRRRRRRRRRRRRRRRRRRKKR.........
VVVVVVVVVVKKKRRRRRRRRRRRRRRRRRRRRRRRRRKKR.........
EEEEEEEEEEEEEEEEEEEEEERrrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
.........................RRRRR....................
.......................RRRRRRRRR..................
.....................RRRRRRRRRRRRR................
...................RRRRRRRRRRRRRRRRR..............
.................RRRRRRRRRRRRRRRRRRRRR............
...............RRRRRRRRRRRRRRRRRRRRRRRRR..........
..............RRRRRRRRRRRRRRRRRRRRRRRRRRR.........
..............RRRRRRRRRRRRRRRRRRRRRRRRRRR.........
..............RRRRRRRRRRRRRRRRRRRRRRRRRRR.........
..............RRRRRRRRRRRRRRRRRRRRRRRRRRR.........
..............RRRRRRRRRRRRRRRRRRRRRRRRRRR.........
..............RRRRRRRRRRRRRRRRRRRRRRRRRRR.........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWLLLWWWW..........
...............WWWWWWWWWWWWWWWWWWLLLWWWW..........
...............WWWWWWWWWWWWWWWWWWLLLWWWW..........
...............WWWWWWWWWWWWWWWWWWLLLWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
..............RRRRRRRRRRRRRRRRRRRRRRRRRRR.........
..............RRRRRRRRRRRRRRRRRRRRRRRRRRKKK.......
..............RRRRRRRRRRRRRRRRRRRRRRRRRRKKK.......
..............RRRRRRRRRRRRRRRRRRRRRRRRRRRKK.......
..............RRRRRRRRRRRRRRRRRRRRRRRRRRRKK.......
..............RRRRRRRRRRRRRRRRRRRRRRRRRRRKK.......
..............RRRRRRRRRRRRRRRRRRRRRRRRRRRKK.......
..............RRRRRRRRRRRRRRRRRRRRRRRRRRRKK.......
..............RRRRRRRRRRRRRRRRRRRRRRRRRRRKK.......
...............WWWWWWWWWWWWWWWLLLWWWWWWWKKK.......
...............WWWWWWWWWWWWWWWLLLWWWWWWWKKK.......
...............WWWWWWWWWWWWWWWLLLWWWWWWWKKK.......
...............WWWWWWWWWWWWWWWLLLWLLLWWWKKK.......
...............WWWWWWWWWWWWWWWWWWWLLLWWWKKK.......
...............WWWWWWWWWWWWWWWWWWWLLLWWWKKK.......
...............WWWWWWWWWWWWWWWWWWWLLLWWWKKK.......
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
............WWWWLLLWWWWWWWWWWWLLLWWWWWWW..........
............WWWWLLLWWWWWWWWWWWLLLWWWWWWW..........
............WWWWLLLWWWWWWWWWWWLLLWWWWWWW..........
............WWW.......kkkkkk.........WWW..........
............WWW.......kkkkkk.........WWW..........
WWWWWWWWWWWWWWW.......kkkkkk.........WWW..........
WWWWWWWWWWWWWWW.......kkkkkk.........WWW..........
WWWWWWWWWWWWWWL........kkkkk.........WWW..........
WWW.........LLL......................WWW..........
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
WWW.........WWW......................LLL..........
WWWWWWLLLLWWWWW......................LLL..........
WWWWWWLWWLWWWWW......................LLL..........
WWWWWWLLLLWWWWWLWWWWLLLWWWWWWWWWWWWWWWWW..........
............WWWLWWWWLLLWWWWWWWWWWWWWWWWW..........
............WWWLWWWWLLLWWWWWWWWWWWWWWWWW..........
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
............WWWWWWWWWWWWWLLLWWWWWWWWWWWW..........
............WWWWWWWWWWWWWLLLWWWWWWWWWWWW..........
............WWWWWWWWWWWWWLLLWWWWWWWWWWWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
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
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................WWW..........
............WWWWWWWWWWLLLLLLWWWWWWWWWWWW..........
............WWWWWWWWWWLLLLLLWWWWWWWWWLWW..........
............WWWWWWWWWWLLLLLLWWWWWWWWWLWW..........
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
EEEEEEEE..cccccccccccccccccccccccccccccccccccccccc   00000000..00ssssssssssssssssssssssssssss0000000000
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00000000..00sttttttttttttttttttttttttttts000000000
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00000000..00sttttttttttttttttttttttttttts000000000
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuuuuuuuuuuuuuuuuuuuuuuttsggggggggg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuuuuuuuuuuuuuuuuuuuuuuttsggggggggg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvvvvvvvvvvvvvvvvvvuuttsghhhhhhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvvvvvvvvvvvvvvvvvvuuttsghhhhhhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvwwwwwwwwwwwwwwwvvuuttsghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvwwwwwwwwwwwwwwwvvuuttsghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvwwwwwwwwwwwwwwwvvuuttsghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvwwwxxxxxxxxxwwwvvuuttsghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvwwwxxxxxxxxxwwwvvuuttsghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvwwwxxxxxxxxxwwwvvuuttsghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvwwwxxxxxxxxxwwwvvuuttsghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvwwwxxxxxxxxxwwwvvuuttsghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvwwwxxxxxxxxxwwwvvuuttsghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvwwwxxxxxxxxxwwwvvuuttsghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvwwwwwwwwwwwwwwwvvuuttsghhiihhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvwwwwwwwwwwwwwwwvvuuttsghhhhhhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvwwwwwwwwwwwwwwwvvuuttsghhhhhhgg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvvvvvvvvvvvvvvvvvvuuttsggggggggg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKKKKKKK   00000000..00sttuuvvvvvvvvvvvvvvvvvvvuuttsggggggggg
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00000000..00sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00000000..00sttuuuuuuuuuuuuuuuuuuuuuuutts000000000
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00000000..00sttttttttttttttttttttttttttts000000000
EEEEEEEE..ccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   00000000..ffstttttttttttttttttttttttttttsff0000000
EEEEEEEEEEKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRKKK.......   000000000fggssssssssssssssssssssssssssssggf.......
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
ccccccccccccccccccccccccccccccccccccccccccc..EEEEE   ggggggggggggssssssssssssssssssssssssssss000..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   ggggggggggggsttttttttttttttttttttttttttts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhhhhhhhhgsttttttttttttttttttttttttttts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhhhhhhhhgsttuuuuuuuuuuuuuuuuuuuuuuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiiiiihhgsttuuuuuuuuuuuuuuuuuuuuuuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiiiiihhgsttuuvvvvvvvvvvvvvvvvvvvuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiijiihhgsttuuvvvvvvvvvvvvvvvvvvvuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiijiihhgsttuuvvwwwwwwwwwwwwwwwvvuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiijiihhgsttuuvvwwwwwwwwwwwwwwwvvuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiijiihhgsttuuvvwwwwwwwwwwwwwwwvvuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiijiihhgsttuuvvwwwxxxxxxxxxwwwvvuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiijiihhgsttuuvvwwwxxxxxxxxxwwwvvuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiijiihhgsttuuvvwwwxxxxxxxxxwwwvvuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiiiiihhgsttuuvvwwwxxxxxxxxxwwwvvuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhiiiiihhgsttuuvvwwwxxxxxxxxxwwwvvuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhhhhhhhhgsttuuvvwwwxxxxxxxxxwwwvvuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   gghhhhhhhhhgsttuuvvwwwxxxxxxxxxwwwvvuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   ggggggggggggsttuuvvwwwwwwwwwwwwwwwvvuutts00..00000
KKKKKKKKKKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   ggggggggggggsttuuvvwwwwwwwwwwwwwwwvvuutts00..00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   000000000000sttuuvvwwwwwwwwwwwwwwwvvuutts00..00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts00..00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   000000000000sttuuvvvvvvvvvvvvvvvvvvvuutts00..00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts00..00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   000000000000sttuuuuuuuuuuuuuuuuuuuuuuutts00..00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   000000000000sttttttttttttttttttttttttttts00..00000
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRcc..EEEEE   0000000000ffstttttttttttttttttttttttttttsff..00000
.........KKKKRRRRRRRRRRRRRRRRRRRRRRRRRRRKKKEEEEEEE   .........fggssssssssssssssssssssssssssssggf0000000
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
Traccia, seme 1: griglia 100×100×80, 125 nodi, 509 passi, finito in 488 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=Emerald (marcatore), h=pavimento casa, w=white, s=slate, d=dead, dark, r=strada, a=pavimento fienile, y=pavimento portico, p=pilastro portico, v=olive, c=aia, f=staccionata, W=muro casa, U=blUe, V=muro fienile, O=porta, R=tetto casa, F=solaio casa, K=tetto fienile, L=vetro finestra, o=assi porta, k=gradino scala, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), T=Teal (marcatore).
Alla fine: R 63250, W 28650, V 8250, K 5713, E 3950, F 3240, L 3200, k 2720, c 1050, r 300, o 71, O 4.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-38 all×26, one×2, prl×2: 284 celle x0-17 y4-19 z0, passi 2-51
   #42 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 52
#44-46 all×3: 11025 celle x25-79 y30-79 z0-6, passi 53-64
    #47 all . w → w U (+1) passi=14: ×14, 26600 celle x25-79 y30-79 z6-20, passi 65-78, w→U 12250, .→w 12250, W→U 1050, .→W 1050
      r1 . w → w U ×12250; r2 . W → W U ×1050
    #48 all . w → w W (+1) passi=18: ×18, 32850 celle x25-79 y30-79 z20-38, passi 79-96, w→W 15750, .→w 15750, .→W 1350
      r1 . w → w W ×15750; r2 . W → W W ×1350
    #49 all . w → w U (+1) passi=14: ×14, 26600 celle x25-79 y30-79 z38-52, passi 97-110, w→U 12250, .→w 12250, W→U 1050, .→W 1050
      r1 . w → w U ×12250; r2 . W → W U ×1050
    #50 all . w → w W (+1) passi=12: ×12, 21900 celle x25-79 y30-79 z52-64, passi 111-122, w→W 10500, .→w 10500, .→W 900
      r1 . w → w W ×10500; r2 . W → W W ×900
    #51 prl w → R (+1): ×1, 35075 celle x25-79 y30-79 z0-64, passi 123, W→R 34200, w→R 875
      r1 w → R ×875; r2 W → R ×34200
#52-53 all×2: 2400 celle x30-74 y35-74 z0-2, passi 124-125
    #54 all . h → h . passi=31: ×31, 195200 celle x30-74 y35-74 z0-32, passi 126-156, h→. 97600, .→h 97600
#55-56 all×2: 18800 celle x30-74 y35-74 z2-33, passi 157-187
    #57 all . h → h . (+1) passi=31: ×31, 111600 celle x30-74 y35-74 z33-64, passi 188-218, h→. 49600, .→h 49600, s→. 6200, .→s 6200
      r1 . h → h . ×49600; r2 . s → s . ×6200
#58-63 prl×2, all×4: 31475 celle x0-74 y35-74 z0-64, passi 219-257
    #64 all . a → a . passi=35: ×35, 69000 celle x5-24 y45-69 z0-36, passi 258-292, a→. 34500, .→a 34500
#65-69 prl×2, all×3: 32634 celle x5-84 y45-84 z0-36, passi 293-362
#70-120 prl×6, all×12, one×1: 34390 celle x0-89 y20-84 z0-50, passi 363-490
    #121 prl U → W: ×1, 28650 celle x0-79 y30-79 z6-51, passi 491, U→W 28650
#122-125 all×4: 27819 celle x0-85 y29-85 z0-74, passi 492-509
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#30 all y/r → p/* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#35 all cEEEEEE → *cccc** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#36 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#39 one ccccc/ccccc/ccccc/ccccc/ccccc → *****/*****/**Q**/*****/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#40 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******…: le celle cercate c'erano, ma mai disposte come nel pattern
#73 all . Q → Q Q passi=8: in quel momento nella griglia non c'erano celle "Q"
#74 prl Q → .: in quel momento nella griglia non c'erano celle "Q"
#75 all . t → t t passi=16: in quel momento nella griglia non c'erano celle "t"
#76 prl t → g: in quel momento nella griglia non c'erano celle "t"
#77 all g. → *g passi=4: in quel momento nella griglia non c'erano celle "g"
#78 all . g → g g passi=4: in quel momento nella griglia non c'erano celle "g"
… e altri 24
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
        <union symbol="+" values="WVU"/>
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
