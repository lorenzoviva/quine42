# model.sculpt · claude-opus-5-5 · 44 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
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
Forte. Plan letters: h keep hall, w keep wall, s stair zone, d keep door, a/v wing hall and walls (Huge),
c courtyard, W curtain wall two cells thick, t corner towers, b the great tower on one random corner,
G gatehouse, n paving, r road, Q well (Huge).
Relations: keep on H; yard around it; ring around the yard; towers on its corners; gate, paving and door on the front axis.
Seeds change: keep depth (front and back ends), which corner holds the great tower, wing side, well place.
Large: keep, ring, towers, great tower. Huge: also the wing, a wide yard and the well.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavcWtbdnGrQm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="EEEEEEEEEw/EEEEEEEEEw/EEEEEEEEEw/EEEEEEEEEw/EEEEEEEEEw" out="**********/**********/********a*/**********/**********" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <all in="[wv]E" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*cccc***" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="tW" out="*t"/><rule in="t*/*W" out="**/*t"/></all>
      <one in="t" out="b" steps="1"/>
      <all in="bt" out="*b"/>
      <all in="bE" out="*b" steps="1"/><all in="bE/*b" out="*b/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhswdavcxtbGrqnfFTPRLUOoNMkWXZAYVQg" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="Q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="1"/>
        <prl in="w" out="W"/>
        <all in="B d" out="d O" steps="1"/><all in="B d" out="d W" steps="64"/><prl in="d" out="W"/>
        <all in="B x" out="x X" steps="23"/><prl in="x" out="X"/>
        <all in="B t" out="t Z" steps="39"/><prl in="t" out="Z"/>
        <all in="B b" out="b A" steps="51"/><prl in="b" out="A"/>
        <all in="B G" out="G O" steps="1"/><all in="B G" out="G Y" steps="34"/><prl in="G" out="Y"/>
        <all in="B q" out="q Q" steps="5"/><prl in="q" out="Q"/>
        <all in="B v" out="v V" steps="32"/><prl in="v" out="R"/>
        <all in="B a" out="a g" steps="1"/><all in="B a" out="a B" steps="31"/><prl in="a" out="R"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="P"/><rule in="s" out="P"/></prl>
        <union symbol="+" values="WXZAYV"/>
        <union symbol="%" values="XZAY"/>
        <union symbol="=" values="fFgP"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="c" hidden="True" area="courtyard"/>
  <color symbol="f" value="a87a48" name="assito del mastio" area="keep"/>
  <color symbol="g" value="b08a58" name="pavimento dell'ala" area="hall"/>
  <color symbol="F" value="8a6a44" name="solaio"/>
  <color symbol="P" value="9a9488" name="terrazza del mastio"/>
  <color symbol="n" value="b0a890" name="selciato" area="courtyard"/>
  <color symbol="r" value="c8b48a" name="strada"/>
  <color symbol="W" value="c8bca4" name="muro del mastio"/>
  <color symbol="X" value="8a8478" name="cinta muraria"/>
  <color symbol="Z" value="6e685e" name="torre"/>
  <color symbol="A" value="5e5850" name="torre maestra"/>
  <color symbol="Y" value="7a6a58" name="torre della porta"/>
  <color symbol="V" value="d4c8ae" name="muro dell'ala"/>
  <color symbol="R" value="a8442e" name="tetto di coppi"/>
  <color symbol="Q" value="5a7a9a" name="pozzo"/>
  <color symbol="L" value="2e3e58" name="finestra"/>
  <color symbol="U" value="1e1e24" name="feritoia"/>
  <color symbol="M" value="9e988c" name="merli"/>
  <color symbol="O" value="7a4a26" name="porta"/>
  <color symbol="o" value="4a2c18" name="assi della porta"/>
  <color symbol="N" value="3a3028" name="stipiti"/>
  <color symbol="k" value="8a7a68" name="gradini"/>
  <color symbol="T" value="8a7a68" name="scala"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
It does not pass: taglia Grande, seme 1: stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the largest square of covered floor where a body stands (the body counted), under a ceiling at least a storey up
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, c marker, W muro del mastio, n selciato, r strada, f assito del mastio, F solaio, P terrazza del mastio, L finestra, U feritoia, O porta, o assi della porta, N stipiti, M merli, k gradini, X cinta muraria, Z torre, A torre maestra, Y torre della porta
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEAAAAAAAAAMEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEAAAAAAAAAMEE
EEEEEEEEMZMZZMMXXXXXXXXXXXXXXXXXXXXXXXAAAAAAAAAAEE
EEEEEEEEZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXAAAAAAAAAEEE
EEEEEEEEZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXAAAAAAAAAMEE
EEEEEEEEZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXAAAAAAAAAEEE
EEEEEEEEZZZZZZMXXXXXXXXXXXXXXXXXXXXXXXAAAAAAAAAAEE
EEEEEEEEZZZZZcccccccccccccccccccccccccccAAAAAAAMEE
EEEEEEEEZZZZMcccccccccccccccccccccccccccMAAAAAAMEE
EEEEEEEEXZMMccccccccccccccccccccccccccccMXMXAMMEEE
EEEEEEEEXXXXXccMWWWWWWWWWWWWWWWWWWWWWMccXXXXXEEEEE
EEEEEEEEXXXXXccMWWWWWWWWWWWWWWWWWWWWWMccXXXXXEEEEE
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE
EEEEEEEEXXXXXccMWWWWWWWWWWWWWWWWWWWWWMccXXXXXEEEEE
EEEEEEEEXXXXXccMWWWWWWWWWWWWWWWWWWWWWMccXXXXXEEEEE
EEEEEEEEZZMMMccccccccccnnnnnnnccccccccccMMZZMEEEEE
EEEEEEEEZZZZcccccccccccnnnnnnnccccccccccZZZZZEEEEE
EEEEEEEEZZZZZccccccccccnnnnnnnccccccccccZZZZZEEEEE
EEEEEEEEZZZZZZZXXXXXXXNYYYYYYYNXXXXXXXZZZZZZZEEEEE
EEEEEEEEZZZZZZZXXXXXXXNYYYYYYYNXXXXXXXZZZZZZZEEEEE
EEEEEEEEZZZZZZZXXXXXXXNYYYYYYYNXXXXXXXZZZZZZZEEEEE
EEEEEEEEZZZZZZZXXXXXXXNYYYYYYYNXXXXXXXZZZZZZZEEEEE
EEEEEEEEMEMZEMMXXXXXXXNMMYrMrMEXXXXXXEMMZEMEMEEEEE
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
0000000000000000000000000000000000000pppnpppnppp00
0000000000000000000000000000000000000pnnnnnnnnnp00
0000000000000000000000000000000000000pnnnnnnnnnp00
0000000kkkkhkkkaaaaaaaaaaaaaaaaaaaaaapnnnnnnnnnn00
0000000khhhhhhhaaaaaaaaaaaaaaaaaaaaaannnnnnnnnnp00
0000000khhhhhhkaaaaaaaaaaaaaaaaaaaaaapnnnnnnnnnp00
0000000hhhhhhhkaaaaaaaaaaaaaaaaaaaaaapnnnnnnnnnp00
0000000khhhhhkkaaaaaaaaaaaaaaaaaaaaaappnnnnnnnnn00
0000000khhhhh000000000000000000000000000nnnnnnnp00
0000000khhhhk000000000000000000000000000pnnnnnnp00
0000000kkhkkk00wwwtwwwtwwwtwwwtwwwtwww00ppppnppp00
0000000aaaaaa00wtttttttttttttttttttttw00aaaaa00000
0000000aaaaaa00wtttttttttttttttttttttw00aaaaa00000
0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
0000000aaaaaa00wtttttttttttttttttttttw00aaaaa00000
0000000aaaaaa00wtttttttttttttttttttttw00aaaaa00000
0000000aaaaaa00wwwtwwwtwwwtwwwtwwwtwww00aaaaa00000
0000000kkhkkk000000000000000000000000000kkkhk00000
0000000khhhhk000000000000000000000000000khhhk00000
0000000khhhhhkkaaaaaaaiiiigiiiaaaaaaakkhhhhhk00000
0000000hhhhhhhkaaaaaaaiggggggiaaaaaaakhhhhhhh00000
0000000khhhhhhkaaaaaaaggggggggaaaaaaahhhhhhhk00000
0000000khhhhhhhaaaaaaaiggggggiaaaaaaakhhhhhhk00000
0000000khhhhhhkaaaaaaaiggggggiaaaaaaakhhhhhhk00000
0000000kkkkhkkkaaaaaaaiiigiiiiaaaaaaakkkhkkkk00000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
...............MMM.MMM.MMM.MMM.MMM.MMM............
...............MMM.MMM.MMM.MMM.MMM.MMM............
...............MMM.MMM.MMM.MMM.MMM.MMM............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWWMMMMMM.MMM..
...............WWWWWWWWWWWWWWWWWWWWWWWMMMMMM.MMM..
...............WWWWWWWWWWWWWWWWWWWWWWWMMMMMM.MMM..
...............WWWWWWWWWWWWWWWWWWWWWWWAAAAAAAAAA..
...............WWWWLLLWWWWWWWWLLLWWWWWAAAAAAAAUA..
...............WWLLLLLWWWWWWWWLLLWWWWWAAAAAAAAUA..
.......MMMMMMMMWWLLLLLWWWWWWWWLLLWWWWWMMMMMAMAUA..
.......MMMMMMMMWWLLLLLWWWWWWWWLLLWWWWWMMMMMAMAAA..
.......MMMMMMMMWWLLLWWWMMMWMMMLLLWWWWWMMMMMAMAAA..
.......ZZZZZZZZWWWWWWWWMMMWMMMLLLWWWWWZZZZZZZAAA..
.......ZZZZUZZZWWWWWWWWMMMWMMMWWWWWWWWZZZUZZZAAA..
.......ZZZZUZZZWWWWWWWWYYYYYYYWWWWWWWWZZZUZZZAAA..
.......ZZZZUZZZWWWWWWWWYYYYYYYWWWWWWWWZZZUZZZAAA..
.......ZZZZZZZZWWWWWWWWNNNNNNNWWWWWWWWZZZZZZZAAA..
.......ZZZZZZZZWWWWWWWNoooooooNWWWWWWWZZZZZZZAAA..
.......ZZZZZZZZWWWWWWWNoooooooNWWWWWWWZZZZZZZAAA..
.......ZZZZZZZZWWWWWWWNoooooooNWWWWWWWZZZZZZZAAA..
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZAAA..
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZAAA..
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZAAA..
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZAAA..
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZAAA..
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZAAA..
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZAAA..
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZAAA..
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZAAA..
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZAAA..
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZAAA..
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
.................MMM.MMM.MMM.MMM.MMM.MMM..........
.................MMM.MMM.MMM.MMM.MMM.MMM..........
.................MMM.MMM.MMM.MMM.MMM.MMM..........
.................WWWWWWWWWWWWWWWWWWWWWWW..........
.................WWWWWWWWWWWWWWWWWWWWWWW..........
.................WWWWWWWWWWWWWWWWWWWWWWW..........
.................WWWWWWWWWWWWWWWWWWWWWWW..........
.......MMMMMMMMMMMWWWWWWWWWWWWWWWWWWWWWW..........
.......MMMMMMMMMMMWWWWWWWWWWWWWWWWWWWWWW..........
.......MMMMMMMMMMMWWWWWWWWWWWWWWWWWWWWWW..........
.......AAAAAAAAAAAWWWWWWWWWWWWWWLLLWWWWW..........
.......AAAAAAAAAUAWWWWWWWWWLLWWWLLLWWWWW..........
.......AAAAAAAAAUAWWWWWWWWWLLLWWLLLWWWWW..........
.......AAAAAAAAAUAWWWWWWWWWLLLWWLLLWWWWWMMMMMMMM..
.......AAAAAAAAAAAWWWWWWWWWLLLWWWWWWWWWWMMMMMMMM..
.......AAAAAAAAAAAWWWWWWWWWWWWWWWWWWWWWWMMMMMMMM..
.......AAAAAAAAAAAWWWWWWWWWWWWWWWWWWWWWWZZZZZZZZ..
.......AAAAAAAAAAAWWWWWWWWWWWWWWWWWWWWWWZUZZZZUZ..
.......AAAAAAAAAAAWWWWWWWWWWWWWWWWWWWWWWZUZZZZUZ..
.......AAAAAAAAAAAWWWWWWWWWWWWWWWWWWWWWWZUZZZZUZ..
.......AAAAAAAAAAAWWWWWWWWWWWWWWWWWWWWWWZZZZZZZZ..
.......AAAAAAAAAAAWWWWWWWWWWWWWWWWWWWWWWZZZZZZZZ..
.......AAAAAAAAAAAWWWWWWWWWWWWWWWWWWWWWWZZZZZZZZ..
.......AAAAAAAAAAAWWWWWWWWWWWWWWWWWWWWWWZZZZZZZZ..
.......AAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ..
.......AAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ..
.......AAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ..
.......AAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ..
.......AAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ..
.......AAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ..
.......AAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ..
.......AAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ..
.......AAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ..
.......AAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ..
.......AAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXZZZZZZZZ..
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
......................................AAAAAAAAA...
.....................................AAAAAAAAAAA..
.....................................AAAAAAAAAAA..
.......ZZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXAAAAAAAAAA..
.......ZZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXAAAAAAAAAA..
.......ZZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXAAAAAAAAAA..
.......ZZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXAAAAAAAAAA..
.......ZZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXAAAAAAAAAA..
.......ZZZZZZ...........................AAAAAAAA..
.......ZZZZZZ...........................AAAAAAAA..
.......ZZZZZZ..WWWWWWWWWWWWWWWWWWWWWW...AAAAAAA...
.......XXXXXX..WWWWWWWWWWWWWWWWWWWWWWW..XXXXX.....
.......XXXXXX..WWWWWWWWWWWWWWWWWWWWWWW..XXXXX.....
.......XXXXXX..WWW.......kkkkkk....WWW..XXXXX.....
.......XXXXXX..WWW.......kkkkkk....LLL..XXXXX.....
.......XXXXXX..WWW.......kkkkkk....LLL..XXXXX.....
.......XXXXXX..WWW.......kkkkkk....LLL..XXXXX.....
.......XXXXXX..LLL.......kkkkkk....WWW..XXXXX.....
.......XXXXXX..LLL.................WWW..XXXXX.....
.......XXXXXX..LLL.................WWW..XXXXX.....
.......XXXXXX..WWW.................WWW..XXXXX.....
.......XXXXXX..WWW.................WWW..XXXXX.....
.......XXXXXX..WWW.................WWW..XXXXX.....
.......XXXXXX..WWW.................WWW..XXXXX.....
.......XXXXXX..WWW.................WWW..XXXXX.....
.......XXXXXX..WWW.................WWW..XXXXX.....
.......XXXXXX..LLL.................WWW..XXXXX.....
.......XXXXXX..LLL.................WWW..XXXXX.....
.......XXXXXX..LLL.................WWW..XXXXX.....
.......XXXXXX..WWW.................WWW..XXXXX.....
.......XXXXXX..WWWWWWWWoooooooWWWWWWWW..XXXXX.....
.......XXXXXX..WWWWWWWWoooooooWWWWWWWW..XXXXX.....
.......XXXXXX..WWWWWWWWoooooooWWWWWWWW..XXXXX.....
.......ZZZZZZ...........................ZZZZZ.....
.......ZZZZZZ...........................ZZZZZ.....
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZ.....
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZ.....
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZ.....
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZ.....
.......ZZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZ.....
........ZZZZZZZXXXXXXXNoooooooNXXXXXXXZZZZZZZ.....
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
......................................AAAAAAAAA...
.....................................AAAAAAAAAAA..
.....................................AAAAAAAAAAA..
.......MM.M..MM......................AAAAAAAAAAA..
.......M.............................AAAAAAAAAAA..
.....................................AAAAAAAAAAA..
..............M......................AAAAAAAAAAA..
.......M......M......................AAAAAAAAAAA..
........................................AAAAAAAA..
.......M....M...........................AAAAAAAA..
..........MM...WWWWWWWWWWWWWWWWWWWWWW...AAAAAAA...
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWW.................WWW............
...............WWW.................WWW............
...............WWW.................WWW............
...............LLL.................WWW............
...............LLL.................WWW............
...............LLL.................WWW............
...............WWW.................WWW............
...............WWW.................LLL............
...............WWW.................LLL............
...............WWW.................LLL............
...............WWW.................WWW............
...............WWW.................WWW............
...............WWW.................WWW............
...............WWW.................WWW............
...............LLL.................WWW............
...............LLL.................WWW............
...............LLL.................WWW............
...............WWWLLLLWWWWWWWWLLLWWWWW............
...............WWWLWLLWWWWWWWWWWWWWWWW............
...............WWLLLLLWWWWWWWWWWWWWWWW............
.......M..MMM...........................MM..M.....
.......M....................................M.....
..............M.......................M...........
..............M...................................
.......M......M.............................M.....
.....................................M............
.......M.............................M......M.....
........M.M..MM.......................MM..M.M.....
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
EEEEEEEEMMZZMZMXXXXXXXXXXXXXXXXXXXXXXXMMZZMZMEEEEE   0000000kkkhkkkkaaaaaaaaaaaaaaaaaaaaaakkkhkkkk00000
EEEEEEEEZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZEEEEE   0000000khhhhhhhaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00000
EEEEEEEEZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZEEEEE   0000000khhhhhhkaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00000
EEEEEEEEZZZZZZZXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZEEEEE   0000000khhhhhhkaaaaaaaaaaaaaaaaaaaaaahhhhhhhh00000
EEEEEEEEZZZZZZMXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZEEEEE   0000000hhhhhhkkaaaaaaaaaaaaaaaaaaaaaakkhhhhhk00000
EEEEEEEEZZZZZcccccccccccccccccccccccccccZZZZZEEEEE   0000000khhhhh000000000000000000000000000hhhhk00000
EEEEEEEEZZZZMcccccccccccccccccccccccccccMZZZZEEEEE   0000000khhhhk000000000000000000000000000khhhk00000
EEEEEEEEXZMMccccccccccccccccccccccccccccMMXZMEEEEE   0000000kkhkkk00wwwtwwwtwwwtwwwtwwwtwww00kkkhk00000
EEEEEEEEXXXXXccMWWWWWWWWWWWWWWWWWWWWWMccXXXXXEEEEE   0000000aaaaaa00wtttttttttttttttttttttw00aaaaa00000
EEEEEEEEXXXXXccMWWWWWWWWWWWWWWWWWWWWWMccXXXXXEEEEE   0000000aaaaaa00wtttttttttttttttttttttw00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE   0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE   0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE   0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE   0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE   0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE   0000000aaaaaa00wtttttttttttttttttttttw00aaaaa00000
EEEEEEEEXXXXXccMWWWWWWWWWWWWWWWWWWWWWMccXXXXXEEEEE   0000000aaaaaa00wtttttttttttttttttttttw00aaaaa00000
EEEEEEEEXXXXXccMWWWWWWWWWWWWWWWWWWWWWMccXXXXXEEEEE   0000000aaaaaa00wwwtwwwtwwwtwwwtwwwtwww00aaaaa00000
EEEEEEEEZZMMMccccccccccnnnnnnnccccccccccMAMAAMMMEE   0000000kkhkkk000000000000000000000000000ppppnppp00
EEEEEEEEZZZZcccccccccccnnnnnnnccccccccccAAAAAAAMEE   0000000khhhhk000000000000000000000000000pnnnnnnp00
EEEEEEEEZZZZZccccccccccnnnnnnnccccccccccAAAAAAAEEE   0000000khhhhhkkaaaaaaaiiigiiiiaaaaaaappnnnnnnnnp00
EEEEEEEEZZZZZZZXXXXXXXNYYYYYYYNXXXXXXXAAAAAAAAAAEE   0000000hhhhhhhkaaaaaaaiggggggiaaaaaaapnnnnnnnnnn00
EEEEEEEEZZZZZZZXXXXXXXNYYYYYYYNXXXXXXXAAAAAAAAAMEE   0000000khhhhhhkaaaaaaagggggggiaaaaaaapnnnnnnnnnp00
EEEEEEEEZZZZZZZXXXXXXXNYYYYYYYNXXXXXXXAAAAAAAAAMEE   0000000khhhhhhhaaaaaaaigggggggaaaaaaannnnnnnnnnp00
EEEEEEEEZZZZZZZXXXXXXXNYYYYYYYNXXXXXXXAAAAAAAAAEEE   0000000khhhhhhkaaaaaaaiggggggiaaaaaaapnnnnnnnnnp00
EEEEEEEEMMZEMEMXXXXXXXNMMYrMrMEXXXXXXMAAAAAAAAAAEE   0000000kkkhkkkkaaaaaaaiiigiiiiaaaaaaapnnnnnnnnnn00
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEAAAAAAAAAMEE   0000000000000000000000000000000000000nnnnnnnnnnp00
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEAAAAAAAAAEEE   0000000000000000000000000000000000000nnnnnnnnnnp00
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000pppnppnppp00000000000000000000000000000000000
EEEEEMAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000pnnnnnnnnp00000000000000000000000000000000000
EEEEEMAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000pnnnnnnnnp00000000000000000000000000000000000
EEEEEAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXXMMZZMZMEEEEE   00000nnnnnnnnnnaaaaaaaaaaaaaaaaaaaaaakkkhkkkk00000
EEEEEAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZEEEEE   00000pnnnnnnnnpaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00000
EEEEEMAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZEEEEE   00000pnnnnnnnnpaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00000
EEEEEAAAAAAAAAAXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZEEEEE   00000pnnnnnnnnpaaaaaaaaaaaaaaaaaaaaaahhhhhhhk00000
EEEEEAAAAAAAAAMXXXXXXXXXXXXXXXXXXXXXXXZZZZZZZEEEEE   00000nnnnnnnnppaaaaaaaaaaaaaaaaaaaaaakkhhhhhh00000
EEEEEMAAAAAAAcccccccccccccccccccccccccccZZZZZEEEEE   00000pnnnnnnn000000000000000000000000000hhhhk00000
EEEEEMAAAAAAMcccccccccccccccccccccccccccMZZZZEEEEE   00000pnnnnnnp000000000000000000000000000khhhk00000
EEEEEMMMAMXMccccccccccccccccccccccccccccMMXZMEEEEE   00000pppnpppp00wwwtwwwtwwwtwwwtwwwtwww00kkkhk00000
EEEEEEEEXXXXXccMWWWWWWWWWWWWWWWWWWWWWMccXXXXXEEEEE   0000000aaaaaa00wtttttttttttttttttttttw00aaaaa00000
EEEEEEEEXXXXXccMWWWWWWWWWWWWWWWWWWWWWMccXXXXXEEEEE   0000000aaaaaa00wtttttttttttttttttttttw00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE   0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE   0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE   0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE   0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccMWWPPPPPPPPPPPPPPPPPWWMccXXXXXEEEEE   0000000aaaaaa00wttsssssssssssssssssttw00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWWccXXXXXEEEEE   0000000aaaaaa00tttsssssssssssssssssttt00aaaaa00000
EEEEEEEEXXXXXccWWWPPPPPPPPPPPPPPPPPWWcccXXXXXEEEEE   0000000aaaaaa00wtttttttttttttttttttttw00aaaaa00000
EEEEEEEEXXXXXccMWWWWWWWWWWWWWWWWWWWWWMccXXXXXEEEEE   0000000aaaaaa00wtttttttttttttttttttttw00aaaaa00000
EEEEEEEEXXXXXccMWWWWWWWWWWWWWWWWWWWWWMccXXXXXEEEEE   0000000aaaaaa00wwwtwwwtwwwtwwwtwwwtwww00aaaaa00000
EEEEEEEEZZMMMccccccccccnnnnnnnccccccccccMMZZMEEEEE   0000000kkhkkk000000000000000000000000000kkkhk00000
EEEEEEEEZZZZcccccccccccnnnnnnnccccccccccZZZZZEEEEE   0000000khhhhk000000000000000000000000000khhhk00000
EEEEEEEEZZZZZccccccccccnnnnnnnccccccccccZZZZZEEEEE   0000000khhhhhkkaaaaaaaiiigiiiiaaaaaaakkhhhhhk00000
EEEEEEEEZZZZZZZXXXXXXXNYYYYYYYNXXXXXXXZZZZZZZEEEEE   0000000hhhhhhhkaaaaaaaiggggggiaaaaaaakhhhhhhk00000
EEEEEEEEZZZZZZZXXXXXXXNYYYYYYYNXXXXXXXZZZZZZZEEEEE   0000000khhhhhhhaaaaaaaggggggggaaaaaaakhhhhhhh00000
EEEEEEEEZZZZZZZXXXXXXXNYYYYYYYNXXXXXXXZZZZZZZEEEEE   0000000khhhhhhkaaaaaaaiggggggiaaaaaaahhhhhhhk00000
EEEEEEEEZZZZZZZXXXXXXXNYYYYYYYNXXXXXXXZZZZZZZEEEEE   0000000khhhhhhkaaaaaaaiggggggiaaaaaaakhhhhhhk00000
EEEEEEEEMMZEMEMXXXXXXXNMMYrMrMEXXXXXXEMMZEMEMEEEEE   0000000kkkhkkkkaaaaaaaiiigiiiiaaaaaaakkkhkkkk00000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.12 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 152 nodi, 603 passi, finito in 392 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald (marcatore), h=honey, w=white, s=slate, c=cyan (marcatore), W=muro del mastio, t=teal, b=black, d=dead, dark, n=selciato, G=Green, r=strada, m=magenta, x=x, f=assito del mastio, F=solaio, T=scala, P=terrazza del mastio, L=finestra, U=feritoia, O=porta, o=assi della porta, N=stipiti, M=merli, k=gradini, X=cinta muraria, Z=torre, A=torre maestra, Y=torre della porta, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 47547, X 39120, Z 23130, A 18990, o 6510, E 4125, L 2768, k 2720, M 1860, U 1380, f 1225, P 1225, F 1065, c 925, N 865, Y 750, O 240, n 75, r 75.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-43 all×26, prl×2, one×2: 303 celle x3-18 y3-19 z0, passi 2-43
   #46 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 44
    #48 all . w → w W passi=6: ×6, 8700 celle x30-74 y35-79 z0-6, passi 45-50, w→W 4350, .→w 4350
    #49 all . w → w U passi=14: ×14, 20300 celle x30-74 y35-79 z6-20, passi 51-64, w→U 10150, .→w 10150
#50-51 all×2: 26100 celle x30-74 y35-79 z20-38, passi 65-82
    #52 all . w → w U passi=14: ×14, 20300 celle x30-74 y35-79 z38-52, passi 83-96, w→U 10150, .→w 10150
    #53 all . w → w W passi=12: ×12, 17400 celle x30-74 y35-79 z52-64, passi 97-108, w→W 8700, .→w 8700
#54-58 all×3, prl×2: 12000 celle x30-74 y35-79 z0-65, passi 109-176
    #59 all . x → x X passi=23: ×23, 75900 celle x15-89 y20-94 z0-23, passi 177-199, x→X 37950, .→x 37950
    #60 prl x → X: ×1, 1650 celle x15-89 y20-94 z23, passi 200, x→X 1650
    #61 all . t → t Z passi=39: ×39, 46800 celle x15-89 y20-94 z0-39, passi 201-239, t→Z 23400, .→t 23400
    #62 prl t → Z: ×1, 600 celle x15-89 y20-94 z39, passi 240, t→Z 600
    #63 all . b → b A passi=51: ×51, 38250 celle x75-94 y15-34 z0-51, passi 241-291, b→A 19125, .→b 19125
#64-76 prl×2, all×4: 13875 celle x35-94 y15-94 z0-51, passi 292-330
    #77 all . h → h . passi=31: ×31, 63550 celle x35-69 y40-74 z1-32, passi 331-361, h→. 31775, .→h 31775
#78-79 all×2: 14450 celle x35-69 y40-74 z2-33, passi 362-392
    #80 all . h → h . (+1) passi=31: ×31, 75950 celle x35-69 y40-74 z33-64, passi 393-423, h→. 31775, .→h 31775, s→. 6200, .→s 6200
      r1 . h → h . ×31775; r2 . s → s . ×6200
#81-91 prl×1, all×4: 15125 celle x35-69 y40-94 z0-64, passi 424-456
#109-123 all×10, prl×4, one×1: 16098 celle x30-74 y35-79 z1-51, passi 457-569
#124-152 prl×3, all×7: 22936 celle x15-94 y15-94 z6-71, passi 570-603
Senza effetto (non hanno mai cambiato una cella):
#6 prl E/h → h/* passi=1
#12 one EEEEEEEEEw/EEEEEEEEEw/EEEEEEEEEw/EEEEEEEEEw/EEE… → **********/**********/********a*/**********/***… passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#13 all aE → *a passi=2: in quel momento nella griglia non c'erano celle "a"
#14 all E/a → a/* passi=2: in quel momento nella griglia non c'erano celle "a"
#15 all a/E → */a passi=2: in quel momento nella griglia non c'erano celle "a"
#16 all aE → *v: in quel momento nella griglia non c'erano celle "a"
#17 all vE/*v → *v/**: in quel momento nella griglia non c'erano celle "v"
#20 all cEEEEEEE → *cccc*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#21 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#44 one ccccc/ccccc/ccccc/ccccc/ccccc → *****/*****/**Q**/*****/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#68 all . q → q Q passi=5: in quel momento nella griglia non c'erano celle "q"
#69 prl q → Q: in quel momento nella griglia non c'erano celle "q"
… e altri 43
Fix it and answer with the whole program.

## Risposta

```xml
<!--
Forte. Plan letters: h keep hall, w keep wall, s stair zone, d keep door, a/v wing hall and walls (Huge),
c courtyard, W curtain wall two cells thick, t corner towers, b the great tower on one random corner,
G gatehouse, n paving, r road, Q well (Huge).
Relations: keep on H; yard around it; ring around the yard; towers on its corners; gate, paving and door on the front axis.
Seeds change: keep depth (front end), which corner holds the great tower, wing side, well place.
Large: keep (9 cells wide inside), ring, towers, great tower. Huge: also the wing, a wide yard and the well.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavcWtbdnGrQm" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="EEEEEEEEEw/EEEEEEEEEw/EEEEEEEEEw/EEEEEEEEEw/EEEEEEEEEw" out="**********/**********/********a*/**********/**********" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <all in="[wv]E" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*cccc***" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="tW" out="*t"/><rule in="t*/*W" out="**/*t"/></all>
      <one in="t" out="b" steps="1"/>
      <all in="bt" out="*b"/>
      <all in="bE" out="*b" steps="1"/><all in="bE/*b" out="*b/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhswdavcxtbGrqnfFTPRLUOoNMkWXZAYVQg" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="Q" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <sequence symmetry="(xy)">
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="1"/>
        <prl in="w" out="W"/>
        <all in="B d" out="d O" steps="1"/><all in="B d" out="d W" steps="64"/><prl in="d" out="W"/>
        <all in="B x" out="x X" steps="23"/><prl in="x" out="X"/>
        <all in="B t" out="t Z" steps="39"/><prl in="t" out="Z"/>
        <all in="B b" out="b A" steps="51"/><prl in="b" out="A"/>
        <all in="B G" out="G O" steps="1"/><all in="B G" out="G Y" steps="34"/><prl in="G" out="Y"/>
        <all in="B q" out="q Q" steps="5"/><prl in="q" out="Q"/>
        <all in="B v" out="v V" steps="32"/><prl in="v" out="R"/>
        <all in="B a" out="a g" steps="1"/><all in="B a" out="a B" steps="31"/><prl in="a" out="R"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="P"/><rule in="s" out="P"/></prl>
        <union symbol="+" values="WXZAYV"/>
        <union symbol="%" values="XZAY"/>
        <union symbol="=" values="fFgP"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="c" hidden="True" area="courtyard"/>
  <color symbol="f" value="a87a48" name="assito del mastio" area="keep"/>
  <color symbol="g" value="b08a58" name="pavimento dell'ala" area="hall"/>
  <color symbol="F" value="8a6a44" name="solaio"/>
  <color symbol="P" value="9a9488" name="terrazza del mastio"/>
  <color symbol="n" value="b0a890" name="selciato" area="courtyard"/>
  <color symbol="r" value="c8b48a" name="strada"/>
  <color symbol="W" value="c8bca4" name="muro del mastio"/>
  <color symbol="X" value="8a8478" name="cinta muraria"/>
  <color symbol="Z" value="6e685e" name="torre"/>
  <color symbol="A" value="5e5850" name="torre maestra"/>
  <color symbol="Y" value="7a6a58" name="torre della porta"/>
  <color symbol="V" value="d4c8ae" name="muro dell'ala"/>
  <color symbol="R" value="a8442e" name="tetto di coppi"/>
  <color symbol="Q" value="5a7a9a" name="pozzo"/>
  <color symbol="L" value="2e3e58" name="finestra"/>
  <color symbol="U" value="1e1e24" name="feritoia"/>
  <color symbol="M" value="9e988c" name="merli"/>
  <color symbol="O" value="7a4a26" name="porta"/>
  <color symbol="o" value="4a2c18" name="assi della porta"/>
  <color symbol="N" value="3a3028" name="stipiti"/>
  <color symbol="k" value="8a7a68" name="gradini"/>
  <color symbol="T" value="8a7a68" name="scala"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
