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
<!--
  Fattoria (Block 2: Programma completo)
-->
<sequence values="BHEhwsdavpcrfgQtWXLFVRJYKTkONMU" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="WXV"/>
  <union symbol="=" values="F"/>
  <union symbol="%" values="WXV"/>
  <map scale="1/5 1/5 1" values="BHEhwsdavpcrfgQt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale attorno a H: 3 dietro, 4 davanti (+1 a caso), 4 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <!-- Muri della casa principale -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Zona scala interna: 4x2 celle lungo un muro, con 2 celle di spazio davanti -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- Ala laterale (fienile) su un fianco a scelta del seme -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="4"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- Portico davanti alla casa -->
      <all in="w/E" out="*/p" symmetry="()" steps="3"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <!-- Aia attorno a casa, portico e fienile -->
      <all in="[wvpa]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Aia extra dove c'è molto spazio (taglie grandi) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Staccionata attorno all'aia -->
      <all in="cE" out="*f" steps="1"/>
      <all in="fE/*f" out="*f/**"/>
      <!-- Pozzo nell'aia se c'è un 5x5 libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- Campi coltivati oltre la staccionata dove c'è spazio (taglie grandi) -->
      <all in="fEEEEEE" out="*gggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- Alberi su terreno libero 7x7 -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="3"/>
      <!-- Strada dalla casa (H) fino al bordo anteriore, larga 3 celle -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()" steps="1"/>
      <prl in="d" out="h" symmetry="()"/>
      <all in="h/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/[pcfE]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[cfE]" out="*r" symmetry="(x)" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BHEhwsdavpcrfgQtWXLFVRJYKTkONMU#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <sequence symmetry="(xy)">
        <!-- B. Altezze: muri della casa e porta (64 voxel = 2 piani da 32) -->
        <all in="B d" out="d O" steps="1"/>
        <all steps="5">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w X"/>
          <rule in="B d" out="d X"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="6">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w X"/>
          <rule in="B d" out="d X"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <prl in="[wd]" out="R"/>
        <!-- B. Altezze: pavimenti e scala della casa -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>
        <!-- B. Altezze: fienile (1 piano alto 34) -->
        <all in="B v" out="v V" steps="34"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="33"/>
        <prl in="a" out="J"/>
        <!-- B. Altezze: portico (tetto a 34) -->
        <all in="B p" out="p F" steps="1"/>
        <all in="B p" out="p B" steps="33"/>
        <prl in="p" out="J"/>
        <!-- B. Altezze: staccionata, pozzo, alberi -->
        <all in="B f" out="f Y" steps="8"/>
        <prl in="f" out="B"/>
        <all in="B Q" out="Q W" steps="8"/>
        <prl in="Q" out="B"/>
        <all in="B t" out="t Y" steps="14"/>
        <prl in="t" out="B"/>
        <!-- C. Parti incluse -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- C. Finestre nella fascia X -->
        <one steps="14">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LXXXXB" out="*LLLL*"/>
        <prl in="X" out="W"/>
        <!-- C. Tetti a padiglione e camino -->
        <all in="RB" out="*R" steps="1"/>
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" value="6E8B4A" hidden="True"/>
  <color symbol="H" value="D9C8A9" name="centro" area="house"/>
  <color symbol="h" value="D9C8A9" name="pavimento casa" area="house"/>
  <color symbol="w" value="C7B299" name="muro" area="house"/>
  <color symbol="s" value="A67C52" name="scala" area="house"/>
  <color symbol="d" value="6E472B" name="porta" area="house"/>
  <color symbol="a" value="C9B48C" name="pavimento fienile" area="barn"/>
  <color symbol="v" value="8C5A3C" name="muro fienile" area="barn"/>
  <color symbol="p" value="B88E65" name="portico" area="porch"/>
  <color symbol="c" value="B59E7A" name="aia" area="yard"/>
  <color symbol="f" value="7A5230" name="staccionata" area="yard"/>
  <color symbol="r" value="9E8B70" name="strada" area="yard"/>
  <color symbol="Q" value="5B84B1" name="pozzo" area="yard"/>
  <color symbol="g" value="8A794D" name="campo" area="field"/>
  <color symbol="t" value="4F772D" name="chioma" area="orchard"/>
  <color symbol="W" value="E6DEC8" name="intonaco"/>
  <color symbol="V" value="9E6B47" name="legno fienile"/>
  <color symbol="F" value="B89368" name="tavolato"/>
  <color symbol="R" value="A84A32" name="tetto casa"/>
  <color symbol="J" value="8F3D29" name="tetto fienile"/>
  <color symbol="Y" value="6B4423" name="legno scuro"/>
  <color symbol="K" value="7A7267" name="camino"/>
  <color symbol="L" value="A6D8E8" name="vetro"/>
  <color symbol="k" value="8C6239" name="gradini"/>
  <color symbol="T" value="8C6239" hidden="True"/>
  <color symbol="O" value="5C3A21" name="porta"/>
  <color symbol="o" value="3E2716" name="assi porta"/>
  <color symbol="N" value="7A5230" name="stipite"/>
  <color symbol="M" value="C7B299" name="merlo"/>
  <color symbol="U" value="4A453E" name="feritoia"/>
  <color symbol="#20" value="5C3A21" hidden="True"/>
  <color symbol="#21" value="3E2716" hidden="True"/>
  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>
It does not pass: varietà: alla taglia Enorme 14 tipi di parti e 42 parti, alla Grande 14 e 44: in un'area più grande entra di più (annessi, recinti, campi, mura, torri: un tipo nuovo, o almeno 55 parti), non lo stesso edificio più grande — what the larger size contains against the smaller: the kinds of parts (letters with a piece of 8 voxels or more) and the pieces
What the game made of it, in text:
### Seed 1 at huge: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, c aia, r strada, W intonaco, L vetro, F tavolato, V legno fienile, R tetto casa, J tetto fienile, Y legno scuro, K camino, k gradini, O porta, N stipite, o assi porta
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
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE
cccccccccccccccccccccccccccccccccccccccccccccYYYEE
cccccccccccccccccccccccccccccccccccccccccccccYYYEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE
ccccccccccJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJccYYYEE
ccccccccccJJJJJJrrrrrrrrrJJJrrrrrrrrrJJJJJJccYYYEE
ccccccccccJJJJJrrrrrrrrrrJJJrrrrrrrrrJJJJJJccYYYEE
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccYYYEE
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccYYYEE
YYYYYYYYYYYYYrrrrrrrrrrrrrrrrrrrrrrrrrrrYYYYYYYYEE
YYYYYYYYYYYYYrrrrrrrrrrrrrrrrrrrrrrrrrrrYYYYYYYYEE
YYYYYYYYYYYYrrrrrrrrrrrrrrrrrrrrrrrrrrrrYYYYYYYEEE
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE
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
33333333333333333333333333333333333333333333333300
33333333333333333333333333333333333333333333333300
33333333333333333333333333333333333333333333333300
00000000000000000000000000000000000000000000033300
000000000000ssssssssssssssssssssssssssss0000033300
000000000000sssssssssssssssssssssssssxsss000033300
000000000000ssttttttsssssssssstttttttttss000033300
000000000000sstttttttttttttttttttttttttss000033300
000000000000ssttuuuttttttttttttuuuuuuttss000033300
ffffffffffffssttuuuuuuuuuuuuuuuuuuuuuttss000033300
fgggggggggggssttuuvuuuuuuuuuuuuvvvvuuttss000033300
fgggggggggggssttuuvvvvvvvvvvvvvvvvvuuttss000033300
fgggggggggggssttuuvvvvvvvvvvvvvwwvvuuttss000033300
fggghhhhhgggssttuuvvwwwwwwwwwwwwwvvuuttss000033300
fggghhhhhgggssttuuvvwwwwwwwwwwwwwvvuuttss000033300
fggghhihhgggssttuuvvwwwwwwwwwwwwwvvuuttss000033300
fggghhihhgggssttuuvvwwwxxxxxxxwwwvvuuttss000033300
fggghhihhgggssttuuvvwwwxxxxxxxwwwvvuuttss000033300
fggghhihhgggssttuuvvwwwxxxxxxxwwwvvuuttss000033300
fggghhihhgggssttuuvvwwwxxxxxxxwwwvvuuttss000033300
fggghhihhgggssttuuvvwwwxxxxxxxwwwvvuuttss000033300
fggghhihhgggssttuuvvwwwwwwwwwwwwwvvuuttss000033300
fggghhhhhgggssttuuvvwwwwwwwwwwwwwvvuuttss000033300
fggghhhhhgggssttuuvvwwwwwwwwwwwwwvvuuttss000033300
fgggggggggggssttuuvvvvvvvvvvvvvvvvvuuttss000033300
fgggggggggggssttuuvvvvvvvvvvvvvvvvvuuttss000033300
fgggggggggggssttuuuuuuuuuuuuuuuuuuuuttsss000033300
ffffffffffffssttuuuuuuuuuuuuuuuuuuuuttsss000033300
000000000000sttttttttttttttttttttttttttts000033300
0000000000ffstttttttttttttttttttttttttttsff0033300
000000000fggssssssssssssssssssssssssssssggf0033300
000000000fgggggf00000000fggf000000000fggggf0033300
000000000fffffff00000000ffff000000000ffffff0033300
00000000000000000000000000000000000000000000033300
00000000000000000000000000000000000000000000033300
33333333333330000000000000000000000000003333333300
33333333333330000000000000000000000000003333333300
33333333333330000000000000000000000000003333333300
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
.......................RRRRRR.....................
.....................RRRRRRRRRR......K............
...................RRRRRRRRRRRRRR....K............
.................RRRRRRRRRRRRRRRRRR..K............
...............RRRRRRRRRRRRRRRRRRRRRRR............
............RRRRRRRRRRRRRRRRRRRRRRRRRRRR..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWLLWWWWWWWWWWWWWWWLLLW..........
............WWWWWWWLLLWWWWWWWWWLLLWWLLLW..........
............WWWWWWWLLLWWWWWWWWWLLLWWLLLW..........
............WWWWWWWLLLWWWWWWWWWLLLWWLLLW..........
............WWWWWWWWWWWWWWWWWWWLLLWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
....JJJJ....WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..JJJJJJJJ..WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
JJJJJJJJJJJJJJJWWWWWWWWWWJJJWWWWWWWWWJJJJJJ.......
VVVVVVVVVVVVVWWWWWWWWWWWWFFWWWWWWWWWWWWW..........
VVVVVVVVVVVVVNNNNNNNNNNNNWWWNNNNNNNNNNNN..........
VVVVVVVVVVVVVooooooooooooWWkoooooooooooo..........
VVVVVVVVVVVVVooooooooooooWkkoooooooooooo..........
VVVVVVVVVVVVVooooooooooooWkkoooooooooooo..........
VVVVVVVVVVVVVooooooooooookkkoooooooooooo..........
VVVVVVVVVVVVVooooooooooookkkoooooooooooo..........
VVVVVVVVVVVVVooooooooooookkkoooooooooooo..........
VVVVVVVVVVVVVooooooooooookkkoooooooooooo..........
VVVVVVVVVVVVVooooooooooookkkoooooooooooo..........
VVVVVVVVVVVVVooooooooooookkkoooooooooooo..........
VVVVVVVVVVVVVooooooooooookkkoooooooooooo..........
VVVVVVVVVVVVVooooooooooookkkoooooooooooo..........
YYYYYYYYYYYYYooooooooooookkkooooooooooooYYYYYYYY..
YYYYYYYYYYYYYooooooooooookkkooooooooooooYYYYYYYY..
YYYYYYYYYYYYYooooooooooookkkooooooooooooYYYYYYYY..
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE
```
Right side (looking from the right):
```
..........................RRRR....................
...............K........RRRRRRRR..................
...............K......RRRRRRRRRRRR................
...............K....RRRRRRRRRRRRRRRR..............
...............K..RRRRRRRRRRRRRRRRRRRR............
...............KRRRRRRRRRRRRRRRRRRRRRRRR..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWLLWWWWWWWWWWWWWWWWWW..........
...............WWWWWLLLWWWWWWWWWWWWWWWWW..........
...............WWWWWLLLWWWWWWWWWWWWWWWWW..........
...............WWWWWLLLWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWWWJJJ.......
...............WWWWWWWWWWWWWWWWWWWWWWWWW..........
...............WWWWWWWWWWWWWWWWWWWWWWWNN..........
...............WWWWWWWWWWWWWWWWWWWWWWNoo..........
...............WWWWWWWWWWWWWWWWWWWWWWNoo..........
...............WWWWWWWWWWWWWWWWWWWWWWNoo..........
...............WWWWWWWWWWWWWWWWWWWWWWNoo..........
...............WWWWWWWWWWWWWWWWWWWWWWNoo..........
...............WWWWWWWWWWWWWWWWWWWWWWNoo..........
...............WWWWWWWLLWWWWWWWWWWWWWNoo..........
...............WWWWWWWLLLWWLLLWLLWWWWNoo..........
...............WWWWWWWLLLLLLLLWLLLWWWNoo..........
...............WWWWWWWLLLLLLLLWLLLWWWNoo..........
...............WWWWWWWWWLLLLLLWLLLWWWNoo..........
..........YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY..
..........YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY..
..........YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY..
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
............WWWWWWLLLWWWWWWWWWWWWWWWWWWW..........
............WWWWWWLLLWWWWWWWWWWWWWWWWWWW..........
............WWWWWWLLLWWWWWWWWWWWWWWWWWWW..........
............WWW.......kkkkkk.........WWW..........
............WWW.......kkkkkk.........WWW..........
VVVVVVVVVVVVVWW.......kkkkkk.........WWW..........
VVVVVVVVVVVVVWW.......kkkkkk.........WWW..........
VVVVVVVVVVVVWWW........kkkkk.........LLL..........
............WWW......................LLL..........
............WWW......................LWL..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................WWW..........
............WWW......................LWW..........
............WWW......................LWW..........
............WWW......................LWW..........
............WWW......................WWW..........
VVVVVVVVVVVVVWW......................WWW..........
VVVVVVVVVVVVVWW......................WWW..........
VVVVVVVVVVVVVNNoooooooooo...ooooooooooNN..........
............ooooooooooooo..ooooooooooooo..........
............ooooooooooooo..ooooooooooooo..........
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
............WWWWWWWWWWLLLWWWWWWWLLLWWWWW..........
............WWWWWWWWWWLLLWWWWWWWLLLWWWWW..........
............WWWWWWWWWWLLLWWWWWWWLLLWWWWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................LLL..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............LLL......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWWWWWWLLLWWW...WWWLLLWWWWWW..........
............WWWWWWWLLLWWW..WWWWLLLWWWWWW..........
............WWWWWWWLLLWWW..WWWWLLLWWWWWW..........
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
........................RRRRR.....................
........................RRRRR.....................
........................RRRR......................
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
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY   00000333333333333333333333333333333333333333333333
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY   00000333333333333333333333333333333333333333333333
EEEEEYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY   00000333333333333333333333333333333333333333333333
EEEEEYYYcccccccccccccccccccccccccccccccccccccccccc   00000333000000000000000000000000000000000000000000
EEEEEYYYcccccccccccccccccccccccccccccccccccccccccc   000003330000ssssssssssssssssssssssssssss0000000000
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000003330000sssssssssssssssssssssssssssss000000000
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000003330000ssttttttsssssssssstttttttttss000000000
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000sstttttttttttttttttttttttttssfffffffff
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuuttttttttttttuuuuuuttssggggggggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuuuuuuuuuuuuuuuuuuuuttssggggggggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvuuuuuuuuuuuuvvvvuuttssggggggggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvvvvvvvvvvvvvvvvuuttssggghhgggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvvvvvvvvvvvvwwvvuuttssggghhgggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvwwwwwwwwwwwwwvvuuttssggghhgggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvwwwwwwwwwwwwwvvuuttssggghhgggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvwwwwwwwwwwwwwvvuuttssggghhgggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvwwwxxxxxxxwwwvvuuttssggghhgggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvwwwxxxxxxxwwwvvuuttssggghhgggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvwwwxxxxxxxwwwvvuuttssggghhgggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvwwwxxxxxxxwwwvvuuttssggghhgggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvwwwxxxxxxxwwwvvuuttssggghhgggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvwwwwwwwwwwwwwvvuuttssggghhgggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvwwwwwwwwwwwwwvvuuttssggggggggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvwwwwwwwwwwwwwvvuuttssggggggggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvvvvvvvvvvvvvvvvuuttssggggggggf
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJJJJJJJ   000003330000ssttuuvvvvvvvvvvvvvvvvvuuttssfffffffff
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000003330000ssttzuuuuuuuuuuuuuuuuuuuttsss000000000
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000003330000ssttuuuuuuuuuuuuuuuuuuuuttsss000000000
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   000003330000sttttttttttttttttttttttttttts000000000
EEEEEYYYccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccccccc   0000033300ffstttttttttttttttttttttttttttsff0000000
EEEEEYYYccJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJccccccc   000003330fggssssssssssssssssssssssssssssggf0000000
EEEEEYYYccJJJJJJrrrrrrrrrJJJrrrrrrrrrJJJJJJccccccc   000003330fgggggf00000000fggf000000000fggggf0000000
EEEEEYYYccJJJJJrrrrrrrrrrJJJrrrrrrrrrJJJJJJccccccc   000003330fffffff00000000ffff000000000ffffff0000000
EEEEEYYYcccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccccccc   00000333000000000000000000000000000000000000000000
EEEEEYYYcccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccccccc   00000333000000000000000000000000000000000000000000
EEEEEYYYYYYYYrrrrrrrrrrrrrrrrrrrrrrrrrrrYYYYYYYYYY   00000333333330000000000000000000000000003333333333
EEEEEYYYYYYYYrrrrrrrrrrrrrrrrrrrrrrrrrrrYYYYYYYYYY   00000333333330000000000000000000000000003333333333
EEEEEYYYYYYYrrrrrrrrrrrrrrrrrrrrrrrrrrrrYYYYYYYYYY   00000333333330000000000000000000000000003333333333
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE   00000000000000000000000000000000000000000000000000
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
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE   33333333333333333333333333333333333333333333333300
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE   33333333333333333333333333333333333333333333333300
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYEE   33333333333333333333333333333333333333333333333300
cccccccccccccccccccccccccccccccccccccccccccccYYYEE   00000000000000000000000000000000000000000000033300
cccccccccccccccccccccccccccccccccccccccccccccYYYEE   ffffffffffffssssssssssssssssssssssssssss0000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fgggggggggggsssssssssssssssssssssssssssss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fgggggggggggssttttttsssssssssstttttttttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fgggggggggggsstttttttttttttttttttttttttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fggghhhhhgggssttuuuttttttttttttuuuuuuttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fggghhhhhgggssttuuuuuuuuuuuuuuuuuuuuuttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fggghhihhgggssttuuvuuuuuuuuuuuuvvvvuuttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fggghhihhgggssttuuvvvvvvvvvvvvvvvvvuuttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fggghhihhgggssttuuvvvvvvvvvvvvvwwvvuuttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fggghhihhgggssttuuvvwwwwwwwwwwwwwzvuuttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fggghhihhgggssttuuvvwwwwwwwwwwwwwvvuuttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fggghhihhgggssttuuvvwwwwwwwwwwwwwvvuuttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fggghhihhgggssttuuvvwwwxxxxxxxwwwvvuuttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fggghhhhhgggssttuuvvwwwxxxxxxxwwwvvuuttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fggghhhhhgggssttuuvvwwwxxxxxxxwwwvvuuttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fgggggggggggssttuuvvwwwxxxxxxxwwwvvuuttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fgggggggggggssttuuvvwwwxxxxxxxwwwvvuuttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   fgggggggggggssttuuvvwwwwwwwwwwwwwvvuuttss000033300
JJJJJJJJJJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   ffffffffffffssttuuvvwwwwwwwwwwwwwvvuuttss000033300
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   000000000000ssttuuvvwwwwwwwwwwwwwvvuuttss000033300
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   000000000000ssttuuvvvvvvvvvvvvvvvvvuuttss000033300
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   000000000000ssttuuvvvvvvvvvvvvvvvvvuuttss000033300
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   000000000000ssttuuuuuuuuuuuuuuuuuuuuttsss000033300
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   000000000000ssttuuuuuuuuuuuuuuuuuuuuttsss000033300
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   000000000000sttttttttttttttttttttttttttts000033300
ccccccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRRccccYYYEE   0000000000ffstttttttttttttttttttttttttttsff0033300
ccccccccccJJJRRRRRRRRRRRRRRRRRRRRRRRRRRRJJJccYYYEE   000000000fggssssssssssssssssssssssssssssggf0033300
ccccccccccJJJJJJrrrrrrrrrJJJrrrrrrrrrJJJJJJccYYYEE   000000000fgggggf00000000fggf000000000fggggf0033300
ccccccccccJJJJJrrrrrrrrrrJJJrrrrrrrrrJJJJJJccYYYEE   000000000fffffff00000000ffff000000000ffffff0033300
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccYYYEE   00000000000000000000000000000000000000000000033300
cccccccccccccrrrrrrrrrrrrrrrrrrrrrrrrrrrcccccYYYEE   00000000000000000000000000000000000000000000033300
YYYYYYYYYYYYYrrrrrrrrrrrrrrrrrrrrrrrrrrrYYYYYYYYEE   33333333333330000000000000000000000000003333333300
YYYYYYYYYYYYYrrrrrrrrrrrrrrrrrrrrrrrrrrrYYYYYYYYEE   33333333333330000000000000000000000000003333333300
YYYYYYYYYYYYrrrrrrrrrrrrrrrrrrrrrrrrrrrrYYYYYYYEEE   33333333333330000000000000000000000000003333333300
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.24 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 118 nodi, 504 passi, finito in 564 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=Emerald (marcatore), h=pavimento casa, w=muro, s=scala, d=porta, a=pavimento fienile, v=muro fienile, p=portico, c=aia, r=strada, f=staccionata, Q=pozzo, W=intonaco, X=X, L=vetro, F=tavolato, V=legno fienile, R=tetto casa, J=tetto fienile, Y=legno scuro, K=camino, T=Teal (marcatore), k=gradini, O=porta, N=stipite, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), o=assi porta.
Alla fine: W 47747, Y 16600, V 14450, R 13203, o 7260, c 7075, E 7000, F 4240, J 4042, L 2928, k 2720, r 2400, N 550, O 240, K 11.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-38 all×26, one×3, prl×1: 722 celle x2-27 y5-29 z0, passi 2-69
   #40 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 70
#42-43 all×2: 9750 celle x50-104 y55-104 z0-6, passi 71-76
    #44 all . w → w X (+1) passi=14: ×14, 25900 celle x50-104 y55-104 z5-20, passi 77-90, w→X 9450, .→w 9450, d→X 3500, .→d 3500
      r1 . w → w X ×9450; r2 . d → d X ×3500
#45-46 all×2: 33300 celle x50-104 y55-104 z19-38, passi 91-108
    #47 all . w → w X (+1) passi=14: ×14, 25900 celle x50-104 y55-104 z37-52, passi 109-122, w→X 9450, .→w 9450, d→X 3500, .→d 3500
      r1 . w → w X ×9450; r2 . d → d X ×3500
#48-51 all×3, prl×1: 27175 celle x50-104 y55-104 z0-64, passi 123-137
    #52 all . h → h . (+1) passi=31: ×31, 113150 celle x55-99 y60-104 z1-33, passi 138-168, h→. 50375, .→h 50375, s→. 6200, .→s 6200
      r1 . h → h . ×50375; r2 . s → s . ×6200
    #53 all . h → h F (+1) passi=1: ×1, 3650 celle x55-99 y60-104 z32-34, passi 169, h→F 1625, .→h 1625, s→F 200, .→s 200
      r1 . h → h F ×1625; r2 . s → s F ×200
    #54 all . h → h . (+1) passi=31: ×31, 113150 celle x55-99 y60-104 z33-65, passi 170-200, h→. 50375, .→h 50375, s→. 6200, .→s 6200
      r1 . h → h . ×50375; r2 . s → s . ×6200
#55-58 prl×2, all×2: 32400 celle x20-99 y60-104 z0-65, passi 201-237
    #59 all . a → a . passi=33: ×33, 41250 celle x25-49 y70-94 z1-34, passi 238-270, a→. 20625, .→a 20625
#60-63 prl×2, all×2: 9250 celle x25-109 y70-109 z0-34, passi 271-306
    #64 all . f → f Y passi=8: ×8, 33200 celle x10-139 y25-139 z0-8, passi 307-314, f→Y 16600, .→f 16600
#65-111 prl×6, all×15, one×1: 34138 celle x10-139 y25-139 z0-51, passi 315-471
#112-118 prl×1, all×5, one×1: 32663 celle x19-110 y54-110 z5-85, passi 472-504
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#27 all fEEEEEE → *gggg** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#28 all gE/*g → *g/**: in quel momento nella griglia non c'erano celle "g"
#29 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***t***/*******/*******… passi=3: le celle cercate c'erano, ma mai disposte come nel pattern
#68 all . t → t Y passi=14: in quel momento nella griglia non c'erano celle "t"
#69 prl t → .: in quel momento nella griglia non c'erano celle "t"
#71 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#72 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#73 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#74 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
#75 prl #93 → . passi=1: in quel momento nella griglia non c'erano celle ""
#81 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
… e altri 15
Fix it and answer with the whole program.

## Risposta

<!--
  Fattoria (Block 2: Programma completo)
-->
<sequence values="BHEhwsdavpcrfgQtWXLFVRJYKTkONMU" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="WXV"/>
  <union symbol="=" values="F"/>
  <union symbol="%" values="WXV"/>
  <map scale="1/5 1/5 1" values="BHEhwsdavpcrfgQt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale attorno a H: 3 dietro, 4 davanti (+1 a caso), 4 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <!-- Muri della casa principale -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Zona scala interna: 4x2 celle lungo un muro, con 2 celle di spazio davanti -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- Ala laterale (fienile) su un fianco a scelta del seme -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="4"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- Portico davanti alla casa -->
      <all in="w/E" out="*/p" symmetry="()" steps="3"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <!-- Aia attorno a casa, portico e fienile -->
      <all in="[wvpa]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Aia extra dove c'è molto spazio (taglie grandi) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Staccionata attorno all'aia -->
      <all in="cE" out="*f" steps="1"/>
      <all in="fE/*f" out="*f/**"/>
      <!-- Pozzo nell'aia se c'è un 5x5 libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- Campi coltivati oltre la staccionata dove c'è spazio (taglie grandi) -->
      <all in="fEEEE" out="*ggg*" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <!-- Alberi su terreno libero 5x5 -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****" steps="3"/>
      <!-- Strada dalla casa (H) fino al bordo anteriore, larga 3 celle -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/h" out="*/d" symmetry="()"/>
      <all in="d/w" out="*/d" symmetry="()" steps="1"/>
      <prl in="d" out="h" symmetry="()"/>
      <all in="h/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/[pcfE]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="r[cfE]" out="*r" symmetry="(x)" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BHEhwsdavpcrfgQtWXLFVRJYKTkONMU#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <sequence symmetry="(xy)">
        <!-- B. Altezze: muri della casa e porta (64 voxel = 2 piani da 32) -->
        <all in="B d" out="d O" steps="1"/>
        <all steps="5">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w X"/>
          <rule in="B d" out="d X"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="6">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <all steps="14">
          <rule in="B w" out="w X"/>
          <rule in="B d" out="d X"/>
        </all>
        <all steps="12">
          <rule in="B w" out="w W"/>
          <rule in="B d" out="d W"/>
        </all>
        <prl in="[wd]" out="R"/>
        <!-- B. Altezze: pavimenti e scala della casa -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>
        <!-- B. Altezze: fienile (1 piano alto 34) -->
        <all in="B v" out="v V" steps="34"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a F" steps="1"/>
        <all in="B a" out="a B" steps="33"/>
        <prl in="a" out="J"/>
        <!-- B. Altezze: portico (tetto a 34) -->
        <all in="B p" out="p F" steps="1"/>
        <all in="B p" out="p B" steps="33"/>
        <prl in="p" out="J"/>
        <!-- B. Altezze: staccionata, pozzo, alberi -->
        <all in="B f" out="f Y" steps="8"/>
        <prl in="f" out="B"/>
        <all in="B Q" out="Q W" steps="8"/>
        <prl in="Q" out="B"/>
        <all in="B t" out="t Y" steps="14"/>
        <prl in="t" out="B"/>
        <!-- C. Parti incluse -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- C. Finestre nella fascia X -->
        <one steps="14">
          <rule in="BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX BX/BX/BX/BX/BX/BX" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LXXXXB" out="*LLLL*"/>
        <prl in="X" out="W"/>
        <!-- C. Tetti a padiglione e camino -->
        <all in="RB" out="*R" steps="1"/>
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" value="6E8B4A" hidden="True"/>
  <color symbol="H" value="D9C8A9" name="centro" area="house"/>
  <color symbol="h" value="D9C8A9" name="pavimento casa" area="house"/>
  <color symbol="w" value="C7B299" name="muro" area="house"/>
  <color symbol="s" value="A67C52" name="scala" area="house"/>
  <color symbol="d" value="6E472B" name="porta" area="house"/>
  <color symbol="a" value="C9B48C" name="pavimento fienile" area="barn"/>
  <color symbol="v" value="8C5A3C" name="muro fienile" area="barn"/>
  <color symbol="p" value="B88E65" name="portico" area="porch"/>
  <color symbol="c" value="B59E7A" name="aia" area="yard"/>
  <color symbol="f" value="7A5230" name="staccionata" area="yard"/>
  <color symbol="r" value="9E8B70" name="strada" area="yard"/>
  <color symbol="Q" value="5B84B1" name="pozzo" area="yard"/>
  <color symbol="g" value="8A794D" name="campo" area="field"/>
  <color symbol="t" value="4F772D" name="chioma" area="orchard"/>
  <color symbol="W" value="E6DEC8" name="intonaco"/>
  <color symbol="V" value="9E6B47" name="legno fienile"/>
  <color symbol="F" value="B89368" name="tavolato"/>
  <color symbol="R" value="A84A32" name="tetto casa"/>
  <color symbol="J" value="8F3D29" name="tetto fienile"/>
  <color symbol="Y" value="6B4423" name="legno scuro"/>
  <color symbol="K" value="7A7267" name="camino"/>
  <color symbol="L" value="A6D8E8" name="vetro"/>
  <color symbol="k" value="8C6239" name="gradini"/>
  <color symbol="T" value="8C6239" hidden="True"/>
  <color symbol="O" value="5C3A21" name="porta"/>
  <color symbol="o" value="3E2716" name="assi porta"/>
  <color symbol="N" value="7A5230" name="stipite"/>
  <color symbol="M" value="C7B299" name="merlo"/>
  <color symbol="U" value="4A453E" name="feritoia"/>
  <color symbol="#20" value="5C3A21" hidden="True"/>
  <color symbol="#21" value="3E2716" hidden="True"/>
  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>
