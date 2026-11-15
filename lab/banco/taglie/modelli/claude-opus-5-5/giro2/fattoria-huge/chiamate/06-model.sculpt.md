# model.sculpt · claude-opus-5-5 · 47 s · 1 immagini

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

Your program:
<!-- FATTORIA
 parts: h the floor of the house (two storeys, the stair zone s along the back wall), w its walls, d its door;
        a the floor of the barn wing, v its walls (against a side of the house: the seed picks the side, the cell, the depth);
        p the porch in front of the door with posts j at its front corners; q the hay against a wall of the house (the seed picks which);
        c the farmyard; x the hedge ring; r the road to the edge; t fruit trees, Q the well where free yard fits.
 Huge: house, barn, porch, hay, thin yard with hedge. Gargantuan: wider yard, orchard and well.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavsmdpqcxrtQj" symmetry="()">
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
      <prl in="aE" out="*a" p="0.5" steps="1" symmetry="(x)"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <prl in="a/E" out="*/a" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <all in="[dp]/E" out="*/p" symmetry="()" steps="4"/>
      <one in="EEEEE/EEEEE/EEEEE/wwwww" out="*****/*qqq*/*qqq*/*****" steps="1"/>
      <all in="[wvpq]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*cccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="[pr]/[Ecx]" out="*/r" symmetry="()"/>
      <all in="pc" out="*p" symmetry="(x)" steps="2"/>
      <all in="pc/cc" out="j*/**"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**t**/*****/*****"/>
    </sequence>
    <map scale="5 5 1" values="BEHhswDavPjqcxrtQfFWULRegVyJYZXAGKTkOoN" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="PPPPP/PPPPP/PPPPP/PPPPP/PPPPP"/>
      <rule in="j" out="PPPPP/PjjjP/PjjjP/PjjjP/PPPPP"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="t" out="ccccc/ccccc/cctcc/ccccc/ccccc"/>
      <rule in="Q" out="ccccc/cQQQc/cQcQc/cQQQc/ccccc"/>
      <sequence symmetry="(xy)">
        <!-- house walls -->
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- door column: the seed O on the floor layer, wall above -->
        <all in="B D" out="e O" steps="1"/>
        <all in="B e" out="e W" steps="62"/>
        <prl in="e" out="R"/>
        <!-- house floors -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- barn -->
        <all in="B v" out="v V" steps="40"/>
        <prl in="v" out="R"/>
        <all in="B a" out="a g" steps="1"/>
        <all in="B a" out="a B" steps="39"/>
        <prl in="a" out="R"/>
        <!-- porch -->
        <all in="B j" out="j Y" steps="34"/>
        <prl in="j" out="J"/>
        <all in="B P" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <!-- hay -->
        <all in="B q" out="q Z" steps="22"/>
        <prl in="q" out="Z"/>
        <!-- hedge -->
        <all in="B x" out="x X" steps="9"/>
        <prl in="x" out="X"/>
        <!-- well -->
        <all in="B Q" out="Q K" steps="6"/>
        <prl in="Q" out="K"/>
        <!-- trees -->
        <all in="B t" out="t A" steps="18"/>
        <prl in="t" out="G"/>
        <all in="BG" out="GG" steps="3"/>
        <all in="B G" out="G *" steps="5"/>
        <!-- windows -->
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- door and stair -->
        <union symbol="+" values="WVR"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" value="7a9a4a" name="terra" hidden="True"/>
  <color symbol="c" value="a8a070" name="aia" hidden="True" area="yard"/>
  <color symbol="r" value="c0aa80" name="sentiero"/>
  <color symbol="f" value="b08858" name="pavimento di casa" area="house"/>
  <color symbol="F" value="8a6440" name="solaio"/>
  <color symbol="W" value="e8dcc0" name="intonaco"/>
  <color symbol="L" value="6a8aa8" name="finestra"/>
  <color symbol="R" value="b04a32" name="tegole"/>
  <color symbol="g" value="a07848" name="pavimento del fienile" area="barn"/>
  <color symbol="V" value="8a3a2e" name="assi del fienile"/>
  <color symbol="P" value="b89868" name="portico" area="porch"/>
  <color symbol="J" value="7a5030" name="tetto del portico"/>
  <color symbol="Y" value="5a3a22" name="pali"/>
  <color symbol="Z" value="e0c050" name="fieno"/>
  <color symbol="X" value="4f7a34" name="siepe"/>
  <color symbol="A" value="6a4a2a" name="tronco"/>
  <color symbol="G" value="6a9a3a" name="chioma" area="orchard"/>
  <color symbol="K" value="8a8a88" name="pietra"/>
  <color symbol="k" value="9a7048" name="gradini"/>
  <color symbol="T" value="9a7048" name="scala"/>
  <color symbol="O" value="6a4020" name="porta"/>
  <color symbol="o" value="3a2414" name="assi della porta"/>
  <color symbol="N" value="4a3020" name="stipiti"/>
  <color symbol="H" value="c8a878" name="centro"/>
  <color symbol="h" value="b08858" name="pavimento di casa"/>
  <color symbol="w" value="e8dcc0" name="muro di casa"/>
  <color symbol="a" value="a07848" name="pavimento del fienile"/>
  <color symbol="v" value="a8443a" name="muro del fienile"/>
  <color symbol="s" value="8a6a48" name="zona della scala"/>
  <color symbol="m" value="c8a878" name="asse"/>
  <color symbol="d" value="5a3a22" name="porta"/>
  <color symbol="p" value="b89868" name="portico"/>
  <color symbol="j" value="5a3a22" name="palo"/>
  <color symbol="q" value="e0c050" name="fieno"/>
  <color symbol="x" value="4f7a34" name="siepe"/>
  <color symbol="t" value="4a7a30" name="albero da frutto"/>
  <color symbol="Q" value="7090a8" name="pozzo"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
The attached image shows it from four sides. The Artist gave it 6/10.
Problems: Il contrasto cromatico tra alcuni volumi e pareti risulta ridotto; Gli elementi vegetali lungo la recinzione sono troppo sottili
Advice: Aumentare lo stacco di luce e ombra tra corpo principale ed estensioni; Rendere la vegetazione e i dettagli strutturali più spessi e leggibili
What the game made of it, in text:
### Seed 1: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, c aia, r sentiero, P portico, f pavimento di casa, F solaio, W intonaco, L finestra, R tegole, g pavimento del fienile, V assi del fienile, J tetto del portico, Y pali, Z fieno, X siepe, A tronco, G chioma, K pietra, k gradini, O porta, o assi della porta, N stipiti
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEEEE
EEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEEEE
EEEEEEEXcccccccccccccccccccccccccccccccccccXXEEEEE
EEEEEEEXcccccccccccccccccccccccccccccccccccXXEEEEE
EEEEEEEXcccccccccccccccccccccccccccccccccccXXEEEEE
EEEEEEEXccccGccccccccccccccccGcccccccccccccXXEEEEE
EEEEEEEXcccccccccccccccccccccccccccccccccccXXEEEEE
EEEEEEEXccccccccccccccccccccccccccGccccccccXXEEEEE
EEEEEEEXcccccccccccccccccccccccccccccccccccXXEEEEE
EEEEEEEXcccccccccKcccccccccccccccccccccccccXXEEEEE
EEEEEEEXcccccccccccccccccZZZZZcccccccccccccXXEEEEE
EEEEEEEXcccccccccccccccccZZZZZcccccccccccccXXEEEEE
EEEEEEEXccccGccccccccccccZZZZZcccccccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccGcccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccccccJJJJJJJJJJJJcRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccccccJJJJJJJJJJJJcRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccccccJJJJJJJJJJJJcRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccccccJJJJJJJJJJJJcccccccccccXXEEEEE
EEEEEEEXccccccccccccJJJJJJJJJJJJcccccccccccXXEEEEE
EEEEEEEXccccccccccccJJJJJJJJJJJJcccccccccccXXEEEEE
EEEEEEEXcccccccccccccccrrrrrcccccccccccccccXXEEEEE
EEEEEEEXcccccccccccccccrrrrrcccccccccccccccXXEEEEE
EEEEEEEXXXXXXXXXXXXXXXXrrrrrXXXXXXXXXXXXXXXXXEEEEE
EEEEEEEXXXXXXXXXXXXXXXXrrrrrXXXXXXXXXXXXXXXXXEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000022222222222222222222222222222222222222200000
00000022222222222222222222222222222222222222200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200000
00000022200000000000000000000000000000000002200000
00000022200770000000007000007700000000000002200000
00000022200770000000007700007000000000000002200000
00000022200000000000000000000000007000000002200000
00000022200000000500000000000000077000070002200000
00000022200000000500000000000000000000070002200000
00000022200000000000000006666600000000000002200000
00000022200070000000000006666600000000000002200000
00000022200077000000000006666600000000000002200000
0000002220000000jjjjjjjjjjjjjjjjjjjj00070002200000
0000002220000000jjjjjjjjjjjjjjjjjjjj00770002200000
0000002220000000jjkkkkkkkkkkkkkkkkjj00000002200000
0000002220000000jjkkkkkkkkkkkkkkkkjj00000002200000
0000002220000000jjkkllllllllllllkkjj00000002200000
0000002220000000jjkkllllllllllllkkjj00000002200000
0000002220000000jjkkllmmmmmmmmllkkjj00000002200000
0000002220007700jjkkllmmmmmmmmllkkjj00000002200000
0000002220007000jjkkllmmmmmmmmllkkjjcccccc02200000
0000002220000000jjkkllmmmmmmmmllkkjjcccccc02200000
0000002220000000jjkkllmmmmmmmmllkkjjcdddcc02200000
0000002220000000jjkkllmmmmmmmmllkkjjcdddcc02200000
0000002220077000jjkkllmlmmmlmmllkkjjcdddcc02200000
0000002220007000jjkkllllllllllllkkjjcdddcc02200000
0000002220000000jjkklllolllkllllkkjjcdddcc02200000
0000002220000000jjkkkkkkkkkkkkkkkkjjcdddcc02200000
0000002220000000jjkkkkkjkkkjkkkkkkjjcdddcc02200000
0000002220000000jjjjjjjjjjjjjjjjjjjjcdddcc02200000
0000002220000000jjjjjjjjjjjjjjjjjjjjddddcc02200000
00000022200000000000aaaaaaaaaaaa0ccdddddcc02200000
00000022200770000000aaaaaaaaaaaa0ccdddddcc02200000
00000022200070000000aaaaaaaaaaaa0ccccccccc02200000
00000022200000000000aaaaaaaaaaaa0ccccccccc02200000
00000022200000000000aaaaaaaaaaaa000000000002200000
00000022200000000000aaaaaaaaaaaa000000000002200000
00000022200000000000aaaaaaaaaaaa000000000002200000
00000022200000000000000000000000000000000002200000
00000022222222222222222200002222222222222222200000
00000022222222222222222200002222222222222222200000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
......................RRRRRRR.....................
....................RRRRRRRRRRR...................
..................RRRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWLLWWW...............
.................WWWWWWWWWWWWWLLWWW...............
.................WWWWWWWWWWWWWLWWWWRRRRR..........
.................WWWWWWWWWWWWWWWWRRRRRRRRR........
.................WWWWWWWWWWWWWWWWVVVVVVVVV........
.................WWWWWWWWWWWWWWWWVVVVVVVVV........
.................WWWYWWWWWWWWWYWWVVVVVVVVV........
.................WWWYWWNooooOWYWWVVVVVVVVV........
.................WWWYWWNooooOWYWWVVVVVVVVV........
...........GG....WWWYWWNooooOWYWWVVVVVVVVV........
...........GG....WWWYWWNooooOWYWWVVVVVVVVV........
.................WWWYWWNooooLLYWWVVVVVVVVV........
.................WWWYYWNooooLLYWWVVVVVVVVV........
............X...XWWWYXWOooooLLYWWVVVVVVVVV........
.......XXXXXXXXXXXXXXXXXooooXXXXXXXXXXXXXXXXX.....
.......XXXXXXXXXXXXXXXXXooooXXXXXXXXXXXXXXXXX.....
......EXXXXXXXXXXXXXXXXrooooXXXXXXXXXXXXXXXXX.....
```
Right side (looking from the right):
```
........................RRRRRRR...................
......................RRRRRRRRRRR.................
....................RRRRRRRRRRRRRRR...............
..................RRRRRRRRRRRRRRRRRRR.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWLLWWWWWWWWWWWWW.............
..................WWWWLLWWWWWWWWWRWWW.............
..................WWWWLLWWWWRRRRRRRRRR............
..................WWWWWLWWWRRRRRRRRRRRRR..........
..................WWWWWWWWWVVVVVVVVVVVVV..........
..................WWWWWWWWWVVVVVVVVVVVVV..Y.......
..................WWWWWWWWWVVVVVVVVVVVVV..Y.......
..................WWWWWWWWWVVVVVVVVVVVVV..Y.......
..................WWWWWWWWWVVVVVVVVVVVVV..Y.......
..........G.GGGZZZGGWWWWWWWVVVVVVVVVVVVV..Y.......
..........G.GGGZZZGGWWWWWWWVVVVVVVVVVVVV..Y.......
..............AZZZWWWWWWWWWVVVVVVVVVVVVV..Y.......
..............AZZZWWWWWLLWWVVVVVVVVVVVVV..Y.......
..........X.XXXZZZWWWWWLLWWVVVVVVVVVVVVV..Y.......
.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...
.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...
.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...
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
.................K................................
.........................ZZZZZ....................
.........................ZZZZZ....................
.........................ZZZZZ....................
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................W.....kkkk......WW...............
.................W.....kkkk......WW...............
.................W.....kkkk......WW...............
.................W...............LL...............
.................W...............LL...............
.................W...............WW...............
.................W...............WW...............
.................W...............WWVVVVVVV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................W...............WW.....VV........
.................WWWLLWoooooLLWWWWW.....VV........
.................WWWLLWoooooLLWWWWW.....VV........
.................................VV...VVVV........
.................................VVVVVVVVV........
.................................VVVVVVVVV........
..................................................
..................................................
....................Y.........Y...................
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
..................................................
..................................................
..................................................
.................WWWWWLLWWWLLWLLWWW...............
.................WWWWWLLWWWLLWLLWWW...............
.................W...............WW...............
.................W...............WW...............
.................W...............LL...............
.................W...............LL...............
.................L...............WW...............
.................L...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW..RRR..........
.................W...............WW..RRR..........
.................W...............WW..RRR..........
.................W...............WW..RRR..........
.................W...............WW..RRR..........
.................W...............LL..RRR..........
.................W...............LL..RRR..........
.................WWWWWWWWWWWWWLLWWW..RRR..........
.................WWWWWWWWWWWWWLLWWW..RRR..........
....................................RRRR..........
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
EEEEEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEEEE   00000000002222222222222222222222222222222222200000
EEEEEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEEEE   00000000002222222222222222222222222222222222200000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000002200000000000000000000000000000002200000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000002200000000000000000000000000000002200000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000002200000000000000000000000000000002200000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000002200070000700007700000055000000002200000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000002200070000770007700000055000000002200000
EEEEEEEEEEXXcccccccccccccccccccccccccccGcccXXEEEEE   00000000002200000000000000000000000000070002200000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000002200000000000000000000000000070002200000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000002200000000000000000000000000000002200000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000220000jjjjjjjjjjjjjjjjjjjj00000002200000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000220000jjjjjjjjjjjjjjjjjjjj00000002200000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccGcccXXEEEEE   0000000000220000jjkkkkkkkkkkkkkkkkjj00770002200000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000220000jjkkkkkkkkkkkkkkkkjj00000002200000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000220000jjkkllllllllllllkkjj00000002200000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000220000jjkkllllllllllllkkjj00000002200000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000220000jjkkllmmmmmmmmllkkjj00000002200000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000220000jjkkllmmmmmmmmllkkjj00000002200000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000220000jjkkllmmmmmmmmllkkjjcccccc02200000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000220000jjkkllmmmmmmmmllkkjjcccccc02200000
EEEEEEEEEEXXccZZRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000220666jjkkllmmmmmmmmllkkjjcdddcc02200000
EEEEEEEEEEXXcZZZRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000220666jjkkllmmmmmmmmllkkjjcdddcc02200000
EEEEEEEEEEXXcZZZRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000220666jjkkllmlmmmlmmllkkjjcdddcc02200000
EEEEEEEEEEXXcZZZRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000220666jjkkllllllllllllkkjjcdddcc02200000
EEEEEEEEEEXXcZZZRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000220666jjkklllklllkllllkkjjcdddcc02200000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000220666jjkkkkkkkkkkkkkkkkjjcdddcc02200000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000220000jjkkkkkjkkkjkkkkkkjjcgddcc02200000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000220000jjjjjjjjjjjjjjjjjjjjcdddcc02200000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000220000jjjjjjjjjjjjjjjjjjjjddddcc02200000
EEEEEEEEEEXXccccccccJJJJJJJJJJJJcRRRRRRRRRcXXEEEEE   00000000002200000000aaaaaaaaaaaa0ccdddddcc02200000
EEEEEEEEEEXXccccccccJJJJJJJJJJJJcRRRRRRRRRcXXEEEEE   00000000002200000000aaaaaaaaaaaa0ccdddddcc02200000
EEEEEEEEEEXXccccccccJJJJJJJJJJJJcRRRRRRRRRcXXEEEEE   00000000002200000000aaaaaaaaaaaa0ccccccccc02200000
EEEEEEEEEEXXccccccccJJJJJJJJJJJJcccccccccccXXEEEEE   00000000002200077000aaaaaaaaaaaa0ccccccccc02200000
EEEEEEEEEEXXccccccccJJJJJJJJJJJJcccccccccccXXEEEEE   00000000002200077000aaaaaaaaaaaa000000000002200000
EEEEEEEEEEXXccccccccJJJJJJJJJJJJcccccccccccXXEEEEE   00000000002200000000aaaaaaaaaaaa000000000002200000
EEEEEEEEEEXXcccccccccccrrrrrcccccccccccccccXXEEEEE   00000000002200000000aaaaaaaaaaaa000000000002200000
EEEEEEEEEEXXcccccccccccrrrrrcccccccccccccccXXEEEEE   00000000002200000000000000000000000000000002200000
EEEEEEEEEEXXXXXXXXXXXXXrrrrrXXXXXXXXXXXXXXXXXEEEEE   00000000002222222222222200002222222222222222200000
EEEEEEEEEEXXXXXXXXXXXXXrrrrrXXXXXXXXXXXXXXXXXEEEEE   00000000002222222222222200002222222222222222200000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEE   00000022222222222222222222222222222222222222222000
EEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEE   00000022222222222222222222222222222222222222222000
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE   00000022200000000000000000000000000000000000022000
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE   00000022200000000000000000000000000000000000022000
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE   00000022200000000000000000000000000000000000022000
EEEEEEEXcccccccccGccccGccccGcccccccccccccccccXXEEE   00000022200000000700007000770000000000777000022000
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE   00000022200000000700007000070000000000070000022000
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE   00000022200000000000000000000000000000000000022000
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE   00000022200050000000000000000000077000000000022000
EEEEEEEXccccKcccccccccccccccccccccGccccccccccXXEEE   00000022200050000000000000000000077000000000022000
EEEEEEEXcccccccccccccccccZZZZZcccccccccGcccccXXEEE   00000022200000000000000006666600000000070000022000
EEEEEEEXcccccccccccccccccZZZZZcccccccccccccccXXEEE   00000022200000000000000006666600000000070000022000
EEEEEEEXcccccccccccccccccZZZZZcccccccccccccccXXEEE   00000022200000000000000006666600000000000000022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccccXXEEE   0000002220000000jjjjjjjjjjjjjjjjjjjj00000000022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccccXXEEE   0000002220000000jjjjjjjjjjjjjjjjjjjj00000000022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccGcccccXXEEE   0000002220000000jjkkkkkkkkkkkkkkkkjj00770000022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccccXXEEE   0000002220007000jjkkkkkkkkkkkkkkkkjj00070000022000
EEEEEEEXccccGcccRRRRRRRRRRRRRRRRRRRccccccccccXXEEE   0000002220007700jjkkllllllllllllkkjj00000000022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccccXXEEE   0000002220000000jjkkllllllllllllkkjj00000000022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRcccccccccXXEEE   0000002220000000jjkkllmmmmmmmmllkkjjcccccccc022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000002220000000jjkkllmmmmmmmmllkkjjcccccccc022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000002220000000jjkkllmmmmmmmmllkkjjcdddddcc022000
EEEEEEEXccccGcccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000002220007700jjkkllmmmmmmmmllkkjjcdddddcc022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000002220007000jjkkllmmmmmmmmllkkjjcdddddcc022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000002220000000jjkkllmmmmmpmmllkkjjcdddddcc022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000002220000000jjkkllmlmmmlmmllkkjjcdddddcc022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000002220000000jjkkllllllllllllkkjjcdddddcc022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000002220000000jjkklllklllkllllkkjjcdddddcc022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000002220000000jjkkkkkkkkkkkkkkkkjjcdddddcc022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000002220000000jjkkkkkjkkkjkkkkkkjjcdddddcc022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000002220077700jjjjjjjjjjjjjjjjjjjjcdddddcc022000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000002220007000jjjjjjjjjjjjjjjjjjjjcdddddcc022000
EEEEEEEXccccccccccccJJJJJJJJJJJJcccRRRRRRRRRcXXEEE   00000022200000000000aaaaaaaaaaaa00cccccccccc022000
EEEEEEEXccccccccccccJJJJJJJJJJJJcccRRRRRRRRccXXEEE   00000022200000000000aaaaaaaaaaaa00cccccccccc022000
EEEEEEEXccccccccccccJJJJJJJJJJJJcccccccccccccXXEEE   00000022200000000000aaaaaaaaaaaa000000000000022000
EEEEEEEXccccccccccccJJJJJJJJJJJJcccccccccccccXXEEE   00000022200077000000aaaaaaaaaaaa000000000000022000
EEEEEEEXccccccccccccJJJJJJJJJJJJcccccccccccccXXEEE   00000022200070000000aaaaaaaaaaaa000000000000022000
EEEEEEEXccccccccccccJJJJJJJJJJJJcccccccccccccXXEEE   00000022200000000000aaaaaaaaaaaa000000000000022000
EEEEEEEXcccccccccccccccrrrrrcccccccccccccccccXXEEE   00000022200000000000aaaaaaaaaaaa000000000000022000
EEEEEEEXcccccccccccccccrrrrrcccccccccccccccccXXEEE   00000022200000000000000000000000000000000000022000
EEEEEEEXXXXXXXXXXXXXXXXrrrrrXXXXXXXXXXXXXXXXXXXEEE   00000022222222222222222200002222222222222222222000
EEEEEEEXXXXXXXXXXXXXXXXrrrrrXXXXXXXXXXXXXXXXXXEEEE   00000022222222222222222200002222222222222222222000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.24 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 124 nodi, 693 passi, finito in 634 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=terra (marcatore), h=pavimento di casa, w=muro di casa, a=pavimento del fienile, v=muro del fienile, s=zona della scala, m=asse, d=porta, p=portico, q=fieno, c=aia (marcatore), x=siepe, r=sentiero, t=albero da frutto, Q=pozzo, j=palo, D=Dead, Dark, f=pavimento di casa, F=solaio, W=intonaco, U=blUe, L=finestra, R=tegole, e=emerald, g=pavimento del fienile, V=assi del fienile, y=yellow, J=tetto del portico, Y=pali, Z=fieno, X=siepe, A=tronco, G=chioma, K=pietra, T=scala, k=gradini, O=porta, o=assi della porta, N=stipiti, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 58548, X 22250, R 18904, V 17000, E 7975, c 7257, Z 3450, L 2792, k 2720, o 2130, f 2025, F 1865, J 700, P 682, Y 612, G 480, g 425, N 335, r 300, A 180, K 147, O 120.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-37 all×24, one×5, prl×2: 636 celle x4-26 y3-29 z0, passi 2-80
   #39 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 81
    #41 all . w → w W passi=6: ×6, 11100 celle x50-104 y55-109 z0-6, passi 82-87, w→W 5550, .→w 5550
    #42 all . w → w U passi=14: ×14, 25900 celle x50-104 y55-109 z6-20, passi 88-101, w→U 12950, .→w 12950
#43-44 all×2: 33300 celle x50-104 y55-109 z20-38, passi 102-119
    #45 all . w → w U passi=14: ×14, 25900 celle x50-104 y55-109 z38-52, passi 120-133, w→U 12950, .→w 12950
    #46 all . w → w W passi=12: ×12, 22200 celle x50-104 y55-109 z52-64, passi 134-145, w→W 11100, .→w 11100
#47-52 prl×2, all×4: 14900 celle x50-104 y55-109 z0-64, passi 146-212
    #53 all . h → h . passi=31: ×31, 113150 celle x55-99 y60-104 z1-32, passi 213-243, h→. 56575, .→h 56575
#54-55 all×2: 16050 celle x55-99 y60-104 z2-33, passi 244-274
    #56 all . h → h . (+1) passi=31: ×31, 125550 celle x55-99 y60-104 z33-64, passi 275-305, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
#57-58 prl×1, all×1: 36025 celle x55-124 y60-119 z0-64, passi 306-346
#59-65 prl×3, all×4: 36774 celle x60-124 y80-129 z0-40, passi 347-424
    #66 all . y → y . passi=33: ×33, 45012 celle x60-94 y110-129 z1-34, passi 425-457, y→. 22506, .→y 22506
#67-69 prl×2, all×1: 7432 celle x60-94 y45-129 z0-34, passi 458-481
    #70 all . x → x X passi=9: ×9, 40050 celle x20-134 y15-139 z0-9, passi 482-490, x→X 20025, .→x 20025
#71-80 prl×4, all×5, one×1: 29069 celle x20-134 y15-139 z0-51, passi 491-541
#87-124 all×16, prl×4, one×1: 33090 celle x49-125 y41-120 z0-80, passi 542-693
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#13 prl aE → *a passi=1
#82 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#83 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#84 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#85 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
#86 prl #93 → . passi=1: in quel momento nella griglia non c'erano celle ""
#92 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#93 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#94 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#95 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
#96 all . #96 → I * passi=1: in quel momento nella griglia non c'erano celle ""
… e altri 11
Improve it: answer with the whole program.

The program you wrote:
<!-- FATTORIA
 parts: h the floor of the house (two storeys, the stair zone s along the back wall), w its walls, d its door;
        a the floor of the barn wing, v its walls (against a side of the house: the seed picks the side, the cell, the depth);
        p the porch in front of the door with posts j at its front corners; q the hay against a wall of the house (the seed picks which);
        c the farmyard; x the hedge ring; r the road to the edge; t fruit trees, Q the well where free yard fits.
 Huge: house, barn, porch, hay, thin yard with hedge. Gargantuan: wider yard, orchard and well.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavsmdpqcxrtQj" symmetry="()">
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
      <prl in="aE" out="*a" p="0.5" steps="1" symmetry="(x)"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <prl in="a/E" out="*/a" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <all in="[dp]/E" out="*/p" symmetry="()" steps="4"/>
      <one in="EEEEE/EEEEE/EEEEE/wwwww" out="*****/*qqq*/*qqq*/*****" steps="1"/>
      <all in="[wvpq]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*cccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="[pr]/[Ecx]" out="*/r" symmetry="()"/>
      <all in="pc" out="*p" symmetry="(x)" steps="2"/>
      <all in="pc/cc" out="j*/**"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEHhswDavPjqcxrtQfFWULRegVyJYZXAGKTkOoNn" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="PPPPP/PPPPP/PPPPP/PPPPP/PPPPP"/>
      <rule in="j" out="PPPPP/PjjjP/PjjjP/PjjjP/PPPPP"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="t" out="ccccc/ctttc/ctttc/ctttc/ccccc"/>
      <rule in="Q" out="ccccc/cQQQc/cQcQc/cQQQc/ccccc"/>
      <sequence symmetry="(xy)">
        <!-- house walls: stone plinth, plaster, window bands -->
        <all in="B w" out="w n" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <!-- door column -->
        <all in="B D" out="e O" steps="1"/>
        <all in="B e" out="e W" steps="62"/>
        <prl in="e" out="R"/>
        <!-- house floors -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- barn -->
        <all in="B v" out="v n" steps="4"/>
        <all in="B v" out="v V" steps="36"/>
        <prl in="v" out="R"/>
        <all in="B a" out="a g" steps="1"/>
        <all in="B a" out="a B" steps="39"/>
        <prl in="a" out="R"/>
        <!-- porch -->
        <all in="B j" out="j Y" steps="34"/>
        <prl in="j" out="J"/>
        <all in="B P" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <!-- hay -->
        <all in="B q" out="q Z" steps="22"/>
        <prl in="q" out="Z"/>
        <!-- hedge, thicker and taller -->
        <all in="B x" out="x X" steps="13"/>
        <prl in="x" out="X"/>
        <!-- well -->
        <all in="B Q" out="Q K" steps="6"/>
        <prl in="Q" out="K"/>
        <!-- trees: trunk 3x3, round crown -->
        <all in="B t" out="t A" steps="16"/>
        <prl in="t" out="G"/>
        <all in="BG" out="GG" steps="5"/>
        <all in="B G" out="G *" steps="8"/>
        <!-- windows -->
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- door and stair -->
        <union symbol="+" values="WVRn"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- roofs -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" value="7a9a4a" name="terra" hidden="True"/>
  <color symbol="c" value="a8a070" name="aia" hidden="True" area="yard"/>
  <color symbol="r" value="c0aa80" name="sentiero"/>
  <color symbol="f" value="b08858" name="pavimento di casa" area="house"/>
  <color symbol="F" value="8a6440" name="solaio"/>
  <color symbol="W" value="f0e4c8" name="intonaco"/>
  <color symbol="n" value="7a7670" name="zoccolo di pietra"/>
  <color symbol="L" value="3e5a78" name="finestra"/>
  <color symbol="R" value="b04a32" name="tegole"/>
  <color symbol="g" value="a07848" name="pavimento del fienile" area="barn"/>
  <color symbol="V" value="5e2a20" name="assi del fienile"/>
  <color symbol="P" value="b89868" name="portico" area="porch"/>
  <color symbol="J" value="6a4428" name="tetto del portico"/>
  <color symbol="Y" value="3e2818" name="pali"/>
  <color symbol="Z" value="e8c850" name="fieno"/>
  <color symbol="X" value="3e6a2a" name="siepe"/>
  <color symbol="A" value="5a3a20" name="tronco"/>
  <color symbol="G" value="7aae44" name="chioma" area="orchard"/>
  <color symbol="K" value="8a8a88" name="pietra"/>
  <color symbol="k" value="9a7048" name="gradini"/>
  <color symbol="T" value="9a7048" name="scala"/>
  <color symbol="O" value="6a4020" name="porta"/>
  <color symbol="o" value="3a2414" name="assi della porta"/>
  <color symbol="N" value="4a3020" name="stipiti"/>
  <color symbol="H" value="c8a878" name="centro"/>
  <color symbol="h" value="b08858" name="pavimento di casa"/>
  <color symbol="w" value="e8dcc0" name="muro di casa"/>
  <color symbol="a" value="a07848" name="pavimento del fienile"/>
  <color symbol="v" value="a8443a" name="muro del fienile"/>
  <color symbol="s" value="8a6a48" name="zona della scala"/>
  <color symbol="m" value="c8a878" name="asse"/>
  <color symbol="d" value="5a3a22" name="porta"/>
  <color symbol="p" value="b89868" name="portico"/>
  <color symbol="j" value="5a3a22" name="palo"/>
  <color symbol="q" value="e0c050" name="fieno"/>
  <color symbol="x" value="4f7a34" name="siepe"/>
  <color symbol="t" value="4a7a30" name="albero da frutto"/>
  <color symbol="Q" value="7090a8" name="pozzo"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
It does not pass: varietà: alla taglia Gargantuesca 21 tipi di parti e 47 parti, alla Enorme 21 e 39: in un'area più grande entra di più (annessi, recinti, campi, mura, torri: un tipo nuovo, o almeno 49 parti), non lo stesso edificio più grande — what the larger size contains against the smaller: the kinds of parts (letters with a piece of 8 voxels or more) and the pieces
What the game made of it, in text:
### Seed 1 at gargantuan: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, c aia, r sentiero, P portico, f pavimento di casa, F solaio, W intonaco, L finestra, R tegole, g pavimento del fienile, V assi del fienile, J tetto del portico, Y pali, Z fieno, X siepe, A tronco, G chioma, K pietra, k gradini, O porta, o assi della porta, N stipiti, n zoccolo di pietra
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEEEE
EEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEEEE
EEEEEEEXcccccccccccccccccccccccccccccccccccXXEEEEE
EEEEEEEXcccccccccccccccccccccccccccccccccccXXEEEEE
EEEEEEEXcccccccccccccccccccccccccccccccccccXXEEEEE
EEEEEEEXcccccccccccccccccccccccccccccccccccXXEEEEE
EEEEEEEXcccccccccccccccccccccccccccGGccccccXXEEEEE
EEEEEEEXccccccccccccccccccccccccccGGGGcccccXXEEEEE
EEEEEEEXcccccccccccccccccccccccccccGGccccccXXEEEEE
EEEEEEEXcccccccccKcccccccccccccccccccccccccXXEEEEE
EEEEEEEXcccccccccccccccccZZZZZcccccccccccccXXEEEEE
EEEEEEEXcccccccccccccccccZZZZZcccccccccccccXXEEEEE
EEEEEEEXcccccccccccccccccZZZZZcccccccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccccccJJJJJJJJJJJJcRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccccccJJJJJJJJJJJJcRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccccccJJJJJJJJJJJJcRRRRRRRRRcXXEEEEE
EEEEEEEXccccccccccccJJJJJJJJJJJJcccccccccccXXEEEEE
EEEEEEEXccccccccccccJJJJJJJJJJJJcccccccccccXXEEEEE
EEEEEEEXccccccccccccJJJJJJJJJJJJcccccccccccXXEEEEE
EEEEEEEXcccccccccccccccrrrrrcccccccccccccccXXEEEEE
EEEEEEEXcccccccccccccccrrrrrcccccccccccccccXXEEEEE
EEEEEEEXXXXXXXXXXXXXXXXrrrrrXXXXXXXXXXXXXXXXXEEEEE
EEEEEEEXXXXXXXXXXXXXXXXrrrrrXXXXXXXXXXXXXXXXXEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000044444444444444444444444444444444444444400000
00000044444444444444444444444444444444444444400000
00000044400000000000000000000000000000000004400000
00000044400000000000000000000000000000000004400000
00000044400000000000000000000000000000000004400000
00000044400000000000000000000000000770000004400000
00000044400000000000000000000000007777000004400000
00000044400000000000000000000000007777000004400000
00000044400000000500000000000000007777000004400000
00000044400000000500000000000000000000000004400000
00000044400000000000000006666600000000000004400000
00000044400000000000000006666600000000000004400000
00000044400000000000000006666600000000000004400000
0000004440000000jjjjjjjjjjjjjjjjjjjj00000004400000
0000004440000000jjjjjjjjjjjjjjjjjjjj00000004400000
0000004440000000jjkkkkkkkkkkkkkkkkjj00000004400000
0000004440000000jjkkkkkkkkkkkkkkkkjj00000004400000
0000004440000000jjkkllllllllllllkkjj00000004400000
0000004440000000jjkkllllllllllllkkjj00000004400000
0000004440000000mjkkllmmmmmmmmllkkjj00000004400000
0000004440000000jjkkllmmmmmmmmllkkjj00000004400000
0000004440000000jjkkllmmmmmmmmllkkjjcccccc04400000
0000004440000000jjkkllmmmmmmmmllkkjjcccccc04400000
0000004440000000jjkkllmmmmmmmmllkkjjcdddcc04400000
0000004440000000jjkkllmmmmmmmmllkkjjcdddcc04400000
0000004440000000jjkkllmlmmmlmmllkkjjcdddcc04400000
0000004440000000jjkkllllllllllllkkjjcdddcc04400000
0000004440000000jjkklllklllkllllkkjjcdddcc04400000
0000004440000000jjkkkkkkkkkkkkkkkkjjcdddcc04400000
0000004440000000jjkkkkkjkkkjkkkkkkjjcdddcc04400000
0000004440000000jjjjjjjjjjjjjjjjjjjjcdddcc04400000
0000004440000000jjjjjjjjjjjjjjjjjjjjddddcc04400000
00000044400000000000aaaaaaaaaaaa0ccdddddcc04400000
00000044400000000000aaaaaaaaaaaa0ccdddddcc04400000
00000044400000000000aaaaaaaaaaaa0ccccccccc04400000
00000044400000000000aaaaaaaaaaaa0ccccccccc04400000
00000044400000000000aaaaaaaaaaaa000000000004400000
00000044400000000000aaaaaaaaaaaa000000000004400000
00000044400000000000aaaaaaaaaaaa000000000004400000
00000044400000000000000000000000000000000004400000
00000044444444444444444400004444444444444444400000
00000044444444444444444400004444444444444444400000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
......................RRRRRRR.....................
....................RRRRRRRRRRR...................
..................RRRRRRRRRRRRRRR.................
.................RRRRRRRRRRRRRRRRRR...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWLWWWWWWWWWWWWWWW...............
.................WWLLWWWWWWWWWWWWWW...............
.................WWLLWWWWWWWWWWWWWWRRRRR..........
.................WWWWWWWWWWWWWWWWRRRRRRRRR........
.................WWWWWWWWWWWWWWWWVVVVVVVVV........
.................WWWWWWWWWWWWWWWWVVVVVVVVV........
.................WWWYWWWWWWWWWYWWVVVVVVVVV........
.................WWWYWWNooooOWYWWVVVVVVVVV........
.................WWWYWWNooooOWYWWVVVVVVVVV........
.................WWWYWWNooooOWYWWVVVVVVVVV........
.................WWWYLWNooooOWYWWVVVVVVVVV........
.................WWWYLWNooooOWYWWVVVVVVVVV........
.......XXXXXXXXXXXXXXXXOooooXXXXXXXXXXXXXXXXX.....
.......XXXXXXXXXXXXXXXXXooooXXXXXXXXXXXXXXXXX.....
.......XXXXXXXXXXXXXXXXXooooXXXXXXXXXXXXXXXXX.....
.......XXXXXXXXXXXXXXXXXooooXXXXXXXXXXXXXXXXX.....
......EXXXXXXXXXXXXXXXXrooooXXXXXXXXXXXXXXXXX.....
```
Right side (looking from the right):
```
........................RRRRRRR...................
......................RRRRRRRRRRR.................
....................RRRRRRRRRRRRRRR...............
..................RRRRRRRRRRRRRRRRRRR.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWWWWWWWWWW.............
..................WWWWWWWWWWRRRRRRRRRR............
..................WWWWWWWWWRRRRRRRRRRRRR..........
..................WWWWWWWWWVVVVVVVVVVVVV..........
..................WWWWWWWWWVVVVVVVVVVVVV..Y.......
..................WWWWWWWWWVVVVVVVVVVVVV..Y.......
..................WWWWWWWWWVVVVVVVVVVVVV..Y.......
..................WWWWWWWWWVVVVVVVVVVVVV..Y.......
...........GGG.ZZZWWWWWWWWWVVVVVVVVVVVVV..Y.......
...........GGG.ZZZWWWWWWWWWVVVVVVVVVVVVV..Y.......
...........GGG.ZZZWWWLLWWWWVVVVVVVVVVVVV..Y.......
.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX....
.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...
.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...
.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...
.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
.......XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.....
.......XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.....
.......X...................................XX.....
.......X...................................XX.....
.......X...................................XX.....
.......X...................................XX.....
.......X...................................XX.....
.......X...........................A.......XX.....
.......X...................................XX.....
.......X.........K.........................XX.....
.......X.................ZZZZZ.............XX.....
.......X.................ZZZZZ.............XX.....
.......X.................ZZZZZ.............XX.....
.......X.........WLLWWWWWWWWWWLLLWW........XX.....
.......X.........WLLWWWWWWWWWWLLLWW........XX.....
.......X.........W.....kkkk......WW........XX.....
.......X.........L.....kkkk......LL........XX.....
.......X.........L.....kkkk......LL........XX.....
.......X.........W...............WW........XX.....
.......X.........W...............WW........XX.....
.......X.........W...............WW........XX.....
.......X.........L...............WW........XX.....
.......X.........L...............WWVVVVVVV.XX.....
.......X.........W...............WW.....VV.XX.....
.......X.........W...............WW.....VV.XX.....
.......X.........W...............WW.....VV.XX.....
.......X.........W...............LL.....VV.XX.....
.......X.........W...............LL.....VV.XX.....
.......X.........W...............WW.....VV.XX.....
.......X.........W...............WW.....VV.XX.....
.......X.........WWWWWWoooooNWLLWWW.....VV.XX.....
.......X.........WWWWWWoooooNWLLWWW.....VV.XX.....
.......X.........................VV...VVVV.XX.....
.......X.........................VVVVVVVVV.XX.....
.......X.........................VVVVVVVVV.XX.....
.......X...................................XX.....
.......X...................................XX.....
.......X............Y.........Y............XX.....
.......X...................................XX.....
.......X...................................XX.....
.......XXXXXXXXXXXXXXXX.....XXXXXXXXXXXXXXXXX.....
.......XXXXXXXXXXXXXXXX......XXXXXXXXXXXXXXXX.....
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
..................................................
..................................................
..................................................
.................WWWWLLWWWLLWWWWWWW...............
.................WWWWLLWWWLLWWWWWWW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................L...............WW...............
.................L...............WW...............
.................W...............WW...............
.................W...............WW...............
.................L...............WW..RRR..........
.................L...............WW..RRR..........
.................W...............WW..RRR..........
.................W...............WW..RRR..........
.................W...............WW..RRR..........
.................W...............WW..RRR..........
.................W...............WW..RRR..........
.................WWLLWWWWWWWWWWWWWW..RRR..........
.................WWLLWWWWWWWWWWWWWW..RRR..........
....................................RRRR..........
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
EEEEEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEEEE   00000000004444444444444444444444444444444444400000
EEEEEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEEEE   00000000004444444444444444444444444444444444400000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000004400000000000000000000000000000004400000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000004400000000000000000000000000000004400000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000004400000000000000000000000000000004400000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000004400000000000000000000055000000004400000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000004400000000000000000000055000000004400000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000004400000000000000000000000000000004400000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000004400000000000000000000000000000004400000
EEEEEEEEEEXXcccccccccccccccccccccccccccccccXXEEEEE   00000000004400000000000000000000000000000004400000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000440000jjjjjjjjjjjjjjjjjjjj00000004400000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000440000jjjjjjjjjjjjjjjjjjjj00000004400000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000440000jjkkkkkkkkkkkkkkkkjj00000004400000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000440000jjkkkkkkkkkkkkkkkkjj00000004400000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000440000jjkkllllllllllllkkjj00000004400000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000440000jjkkllllllllllllkkjj00000004400000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000440000jjkkllmmmmmmmmllkkjj00000004400000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRccccccccXXEEEEE   0000000000440000jjkkllmmmmmmmmllkkjj00000004400000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000440000jjkkllmmmmmmmmllkkjjcccccc04400000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000440000jjkkllmmmmmmmmllkkjjcccccc04400000
EEEEEEEEEEXXccZZRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000440666jjkkllmmmmmmmmllkkjjcdddcc04400000
EEEEEEEEEEXXcZZZRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000440666jjkkllmmmmmmmmllkkjjcdddcc04400000
EEEEEEEEEEXXcZZZRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000440666jjkkllmlmmmlmmllkkjjcdddcc04400000
EEEEEEEEEEXXcZZZRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000440666jjkkllllllllllllkkjjcdddcc04400000
EEEEEEEEEEXXcZZZRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000440666jjkolllklllkllllkkjjcdddcc04400000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000440666jjkkkkkkkkkkkkkkkkjjcdddcc04400000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000440000jjkkkkkjkkkjkkkkkkjjcdddcc04400000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000440000jjjjjjjjjjjjjjjjjjjjcdddcc04400000
EEEEEEEEEEXXccccRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEEEE   0000000000440000jjjjjjjjjjjjjjjjjjjjddddcc04400000
EEEEEEEEEEXXccccccccJJJJJJJJJJJJcRRRRRRRRRcXXEEEEE   00000000004400000000aaaaaaaaaaaa0ccdddddcc04400000
EEEEEEEEEEXXccccccccJJJJJJJJJJJJcRRRRRRRRRcXXEEEEE   00000000004400000000aaaaaaaaaaaa0ccdddddcc04400000
EEEEEEEEEEXXccccccccJJJJJJJJJJJJcRRRRRRRRRcXXEEEEE   00000000004400000000aaaaaaaaaaaa0ccccccccc04400000
EEEEEEEEEEXXccccccccJJJJJJJJJJJJcccccccccccXXEEEEE   00000000004400000000aaaaaaaaaaaa0ccccccccc04400000
EEEEEEEEEEXXccccccccJJJJJJJJJJJJcccccccccccXXEEEEE   00000000004400000000aaaaaaaaaaaa000000000004400000
EEEEEEEEEEXXccccccccJJJJJJJJJJJJcccccccccccXXEEEEE   00000000004400000000aaaaaaaaaaaa000000000004400000
EEEEEEEEEEXXcccccccccccrrrrrcccccccccccccccXXEEEEE   00000000004400000000aaaaaaaaaaaa000000000004400000
EEEEEEEEEEXXcccccccccccrrrrrcccccccccccccccXXEEEEE   00000000004400000000000000000000000000000004400000
EEEEEEEEEEXXXXXXXXXXXXXrrrrrXXXXXXXXXXXXXXXXXEEEEE   00000000004444444444444400004444444444444444400000
EEEEEEEEEEXXXXXXXXXXXXXrrrrrXXXXXXXXXXXXXXXXXEEEEE   00000000004444444444444400004444444444444444400000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEE   00000044444444444444444444444444444444444444444000
EEEEEEEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXEEE   00000044444444444444444444444444444444444444444000
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE   00000044400000000000000000000000000000000000044000
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE   00000044400000000000000000000000000000000000044000
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE   00000044400000000000000000000000000000000000044000
EEEEEEEXcccccccccccccccccccccccccccccccccccccXXEEE   00000044400000000077000000000000000700000000044000
EEEEEEEXccccccccccGGcccccccccccccccGGccccccccXXEEE   00000044400000000777700000000000007777000000044000
EEEEEEEXccccccccccGGGcccccccccccccGGGGcccccccXXEEE   00000044400000000777700000000000007777000000044000
EEEEEEEXccccccccccGGcccccccccccccccGGccccccccXXEEE   00000044400050000777700000000000007777000000044000
EEEEEEEXccccKccccccccccccccccccccccccccccccccXXEEE   00000044400050000077000000000000000770000000044000
EEEEEEEXcccccccccccccccccZZZZZcccccccccccccccXXEEE   00000044400000000000000006666600000000000000044000
EEEEEEEXcccccccccccccccccZZZZZcccccccccccccccXXEEE   00000044400000000000000006666600000000000000044000
EEEEEEEXcccccccccccccccccZZZZZcccccccccccccccXXEEE   00000044400000000000000006666600000000000000044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccccXXEEE   0000004440000000jjjjjjjjjjjjjjjjjjjj00000000044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccccXXEEE   0000004440000000jjjjjjjjjjjjjjjjjjjj00000000044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccccXXEEE   0000004440000000jjkkkkkkkkkkkkkkkkjj00000000044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccccXXEEE   0000004440000000jjkkkkkkkkkkkkkkkkjj00000000044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccccXXEEE   0000004440000000jjkkllllllllllllkkjj00000000044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRccccccccccXXEEE   0000004440000000jjkkllllllllllllkkjj00000000044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRcccccccccXXEEE   0000004440000000jjkkllmmmmmmmmllkkjjcccccccc044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000004440000000jjkkllmmmmmmmmllkkjjcccccccc044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000004440000000jjkkllmmmmmmmmllkkjjcdddddcc044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000004440000000jjkkllmmmmmmmmllkkjjcdddddcc044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000004440000000jjkkllmmmmmmmmllkkjjcdddddcc044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000004440000000jjkkllmmmmmmmmllkkjjcdddddcc044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000004440000000jjkkllmlmmmlmmllkkjjcdddddcc044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000004440000000jjkkllllllllllolkkjjcdddddcc044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000004440000000jjkklllklllkllllkkjjcdddddcc044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000004440000000jjkkkkkkkkkkkkkkkkjjcdddddcc044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000004440000000jjkkkkkjkkkjkkkkkkjjcdddddcc044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000004440000000jjjjjjjjjjjjjjjjjjjjcdddddcc044000
EEEEEEEXccccccccRRRRRRRRRRRRRRRRRRRRRRRRRRRRcXXEEE   0000004440000000jjjjjjjjjjjjjjjjjjjjcdddddcc044000
EEEEEEEXccccccccccccJJJJJJJJJJJJcccRRRRRRRRRcXXEEE   00000044400000000000aaaaaaaaaaaa00cccccccccc044000
EEEEEEEXccccccccccccJJJJJJJJJJJJcccRRRRRRRRccXXEEE   00000044400000000000aaaaaaaaaaaa00cccccccccc044000
EEEEEEEXccccccccccccJJJJJJJJJJJJcccccccccccccXXEEE   00000044400000000000aaaaaaaaaaaa000000000000044000
EEEEEEEXccccccccccccJJJJJJJJJJJJcccccccccccccXXEEE   00000044400000000000aaaaaaaaaaaa000000000000044000
EEEEEEEXccccccccccccJJJJJJJJJJJJcccccccccccccXXEEE   00000044400000000000aaaaaaaaaaaa000000000000044000
EEEEEEEXccccccccccccJJJJJJJJJJJJcccccccccccccXXEEE   00000044400000000000aaaaaaaaaaaa000000000000044000
EEEEEEEXcccccccccccccccrrrrrcccccccccccccccccXXEEE   00000044400000000000aaaaaaaaaaaa000000000000044000
EEEEEEEXcccccccccccccccrrrrrcccccccccccccccccXXEEE   00000044400000000000000000000000000000000000044000
EEEEEEEXXXXXXXXXXXXXXXXrrrrrXXXXXXXXXXXXXXXXXXXEEE   00000044444444444444444400004444444444444444444000
EEEEEEEXXXXXXXXXXXXXXXXrrrrrXXXXXXXXXXXXXXXXXXEEEE   00000044444444444444444400004444444444444444444000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.24 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 200×200×160, 125 nodi, 700 passi, finito in 978 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=terra (marcatore), h=pavimento di casa, w=muro di casa, a=pavimento del fienile, v=muro del fienile, s=zona della scala, m=asse, d=porta, p=portico, q=fieno, c=aia (marcatore), x=siepe, r=sentiero, t=albero da frutto, Q=pozzo, j=palo, D=Dead, Dark, f=pavimento di casa, F=solaio, W=intonaco, U=blUe, L=finestra, R=tegole, e=emerald, g=pavimento del fienile, V=assi del fienile, y=yellow, J=tetto del portico, Y=pali, Z=fieno, X=siepe, A=tronco, G=chioma, K=pietra, T=scala, k=gradini, O=porta, o=assi della porta, N=stipiti, n=zoccolo di pietra, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 52778, X 36750, E 20200, R 18904, V 15300, c 11722, n 7190, G 3681, Z 3450, L 3032, k 2720, o 2130, f 2025, F 1865, A 720, J 700, P 682, r 675, Y 612, g 425, N 375, K 147, O 120.
  #3 map scala 1/5 1/5 1: ×1, 1600 celle x0-39 y0-39 z0-159, passi 1
#5-37 all×24, one×5, prl×2: 854 celle x9-35 y8-39 z0, passi 2-80
   #39 map scala 5 5 1: ×1, 40000 celle x0-199 y0-199 z0-159, passi 81
#41-42 all×2: 37000 celle x75-129 y80-134 z0-20, passi 82-101
#43-44 all×2: 33300 celle x75-129 y80-134 z20-38, passi 102-119
    #45 all . w → w U passi=14: ×14, 25900 celle x75-129 y80-134 z38-52, passi 120-133, w→U 12950, .→w 12950
#46-52 all×5, prl×2: 37100 celle x75-129 y80-134 z0-64, passi 134-212
    #53 all . h → h . passi=31: ×31, 113150 celle x80-124 y85-129 z1-32, passi 213-243, h→. 56575, .→h 56575
#54-55 all×2: 16050 celle x80-124 y85-129 z2-33, passi 244-274
    #56 all . h → h . (+1) passi=31: ×31, 125550 celle x80-124 y85-129 z33-64, passi 275-305, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
#57-61 prl×2, all×3: 37300 celle x80-149 y85-144 z0-64, passi 306-348
#62-66 all×3, prl×2: 35499 celle x85-144 y110-154 z0-40, passi 349-424
    #67 all . y → y . passi=33: ×33, 45012 celle x85-119 y135-154 z1-34, passi 425-457, y→. 22506, .→y 22506
#68-70 prl×2, all×1: 7432 celle x85-119 y70-154 z0-34, passi 458-481
    #71 all . x → x X passi=13: ×13, 68250 celle x45-179 y40-184 z0-13, passi 482-494, x→X 34125, .→x 34125
#72-81 prl×4, all×5, one×1: 33750 celle x45-179 y40-184 z0-51, passi 495-548
#88-125 all×16, prl×4, one×1: 33130 celle x74-150 y79-168 z0-84, passi 549-700
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#13 prl aE → *a passi=1
#83 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#84 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#85 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#86 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
#87 prl #93 → . passi=1: in quel momento nella griglia non c'erano celle ""
#93 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#94 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#95 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#96 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
#97 all . #96 → I * passi=1: in quel momento nella griglia non c'erano celle ""
… e altri 11
Fix it and answer with the whole program.

## Risposta

```xml
<!-- FATTORIA
 parts: h the floor of the house (two storeys, the stair zone s along the back wall), w its walls, d its door;
        a the floor of the barn wing, v its walls (against a side of the house: the seed picks the side, the cell, the depth);
        p the porch in front of the door with posts j at its front corners; q the hay against a wall of the house (the seed picks which);
        c the farmyard; x the hedge ring; r the road to the edge; t fruit trees, Q the well where free yard fits;
        u the ploughed fields around the hedge, only where seven cells of ground go on past it (Gargantuan).
 Huge: house, barn, porch, hay, yard with hedge. Gargantuan: wider yard, orchard, well, and a ring of fields with rows of crops.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavsmdpqcxrtQju" symmetry="()">
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
      <prl in="aE" out="*a" p="0.5" steps="1" symmetry="(x)"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <prl in="a/E" out="*/a" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <all in="[dp]/E" out="*/p" symmetry="()" steps="4"/>
      <one in="EEEEE/EEEEE/EEEEE/wwwww" out="*****/*qqq*/*qqq*/*****" steps="1"/>
      <all in="[wvpq]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*cccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="xEEEEEEE" out="*uuu****" steps="1"/>
      <all in="uE/*u" out="*u/**"/>
      <all in="uE/*u" out="*u/**"/>
      <all in="uE/*u" out="*u/**"/>
      <all in="[pr]/[Ecxu]" out="*/r" symmetry="()"/>
      <all in="pc" out="*p" symmetry="(x)" steps="2"/>
      <all in="pc/cc" out="j*/**"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEHhswDavPjqcxrtQfFWULRegVyJYZXAGKTkOoNnil" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="PPPPP/PPPPP/PPPPP/PPPPP/PPPPP"/>
      <rule in="j" out="PPPPP/PjjjP/PjjjP/PjjjP/PPPPP"/>
      <rule in="q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="t" out="ccccc/ctttc/ctttc/ctttc/ccccc"/>
      <rule in="Q" out="ccccc/cQQQc/cQcQc/cQQQc/ccccc"/>
      <rule in="u" out="iiiii/lllll/iiiii/lllll/iiiii"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w n" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>
        <all in="B D" out="e O" steps="1"/>
        <all in="B e" out="e W" steps="62"/>
        <prl in="e" out="R"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <all in="B v" out="v n" steps="4"/>
        <all in="B v" out="v V" steps="36"/>
        <prl in="v" out="R"/>
        <all in="B a" out="a g" steps="1"/>
        <all in="B a" out="a B" steps="39"/>
        <prl in="a" out="R"/>
        <all in="B j" out="j Y" steps="34"/>
        <prl in="j" out="J"/>
        <all in="B P" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <all in="B q" out="q Z" steps="22"/>
        <prl in="q" out="Z"/>
        <all in="B x" out="x X" steps="13"/>
        <prl in="x" out="X"/>
        <all in="B l" out="l l" steps="5"/>
        <all in="B Q" out="Q K" steps="6"/>
        <prl in="Q" out="K"/>
        <all in="B t" out="t A" steps="16"/>
        <prl in="t" out="G"/>
        <all in="BG" out="GG" steps="5"/>
        <all in="B G" out="G *" steps="8"/>
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <union symbol="+" values="WVRn"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" value="7a9a4a" name="terra" hidden="True"/>
  <color symbol="c" value="a8a070" name="aia" hidden="True" area="yard"/>
  <color symbol="i" value="8a6a40" name="solchi" hidden="True" area="field"/>
  <color symbol="l" value="c8b040" name="grano"/>
  <color symbol="r" value="c0aa80" name="sentiero"/>
  <color symbol="f" value="b08858" name="pavimento di casa" area="house"/>
  <color symbol="F" value="8a6440" name="solaio"/>
  <color symbol="W" value="f0e4c8" name="intonaco"/>
  <color symbol="n" value="7a7670" name="zoccolo di pietra"/>
  <color symbol="L" value="3e5a78" name="finestra"/>
  <color symbol="R" value="b04a32" name="tegole"/>
  <color symbol="g" value="a07848" name="pavimento del fienile" area="barn"/>
  <color symbol="V" value="5e2a20" name="assi del fienile"/>
  <color symbol="P" value="b89868" name="portico" area="porch"/>
  <color symbol="J" value="6a4428" name="tetto del portico"/>
  <color symbol="Y" value="3e2818" name="pali"/>
  <color symbol="Z" value="e8c850" name="fieno"/>
  <color symbol="X" value="3e6a2a" name="siepe"/>
  <color symbol="A" value="5a3a20" name="tronco"/>
  <color symbol="G" value="7aae44" name="chioma" area="orchard"/>
  <color symbol="K" value="8a8a88" name="pietra"/>
  <color symbol="k" value="9a7048" name="gradini"/>
  <color symbol="T" value="9a7048" name="scala"/>
  <color symbol="O" value="6a4020" name="porta"/>
  <color symbol="o" value="3a2414" name="assi della porta"/>
  <color symbol="N" value="4a3020" name="stipiti"/>
  <color symbol="H" value="c8a878" name="centro"/>
  <color symbol="h" value="b08858" name="pavimento di casa"/>
  <color symbol="w" value="e8dcc0" name="muro di casa"/>
  <color symbol="a" value="a07848" name="pavimento del fienile"/>
  <color symbol="v" value="a8443a" name="muro del fienile"/>
  <color symbol="s" value="8a6a48" name="zona della scala"/>
  <color symbol="m" value="c8a878" name="asse"/>
  <color symbol="d" value="5a3a22" name="porta"/>
  <color symbol="p" value="b89868" name="portico"/>
  <color symbol="j" value="5a3a22" name="palo"/>
  <color symbol="q" value="e0c050" name="fieno"/>
  <color symbol="x" value="4f7a34" name="siepe"/>
  <color symbol="t" value="4a7a30" name="albero da frutto"/>
  <color symbol="Q" value="7090a8" name="pozzo"/>
  <color symbol="u" value="8a6a40" name="campo"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
