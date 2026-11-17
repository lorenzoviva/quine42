# model.sculpt · claude-opus-5-5 · 193 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front. Furnished inside, in the same program: every room of every storey has its furniture (beds, tables, benches, shelves, chests, a hearth, barrels; mangers and hay where animals stay), standing on the floor against the walls, each piece a small body of its own material. Keep free what a body needs, the checks are the same: the door and the straight way in from it, two cells of free floor before every stair and where it comes out, a passage at least 11 voxels wide between the pieces to every room and every stair. Give every furniture material a colour of its own whose name begins with «arredo» (arredo letto, arredo tavolo…).
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
Fattoria. Parti: la casa (h dentro, w muri) attorno al centro H, due piani con la scala (s) contro il muro di fondo;
la stalla (a dentro, v muri) addossata a un fianco della casa, più bassa, dal lato scelto dal seme;
la porta d sul fronte in asse con H, la strada r fino al bordo.
Dove il terreno lo permette (Huge): l'aia c attorno agli edifici, la staccionata x che la chiude con il cancello G,
i covoni di fieno Q nell'aia, gli alberi t del frutteto sul prato fuori.
I semi cambiano: profondità della casa (+1), il lato e la posizione della stalla, dove cadono fieno e alberi.
Large: casa e stalla. Huge: in più aia, staccionata, fieno, alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavsmdnrcxGQt" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- la casa -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- la stalla su un fianco -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <!-- la scala contro il muro di fondo -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- l'aia e la staccionata, solo dove c'è spazio -->
      <all in="[wv]EEEEEEE" out="*cc*****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE/*[wv]" out="*c/**"/>
      <all in="cEEEEE" out="*x****" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="xE/*c" out="*x/**"/>
      <!-- la via d'uscita dal centro verso il fronte -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nd]/x" out="*/G" symmetry="()"/>
      <all in="[dnGr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="Gx" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- fieno nell'aia, lontano dalla strada -->
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="2"><field for="Q" from="n" on="cn"/></one>
      <!-- alberi sul prato -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" value="ffffff" name="centro"/>
  <color symbol="h" value="c8a070" name="pavimento casa" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro casa"/>
  <color symbol="a" value="a08050" name="pavimento stalla" area="barn"/>
  <color symbol="v" value="9a4a30" name="muro stalla"/>
  <color symbol="s" value="806040" name="zona scala" area="house"/>
  <color symbol="m" value="ff00ff" name="linea"/>
  <color symbol="d" value="5a3a20" name="porta"/>
  <color symbol="n" value="b0a090" name="selciato" area="yard"/>
  <color symbol="r" value="c0b090" name="strada"/>
  <color symbol="c" value="b8b070" name="aia" area="yard"/>
  <color symbol="x" value="7a5a30" name="staccionata"/>
  <color symbol="G" value="4a3018" name="cancello"/>
  <color symbol="Q" value="e0c050" name="fieno" area="yard"/>
  <color symbol="t" value="4a8a3a" name="albero" area="orchard"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento casa, w muro casa, a pavimento stalla, v muro stalla, s zona scala, d porta, n selciato, r strada, c aia, x staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEExEEE
EEEEEwwwwwwwwwwwcxEE
EEEEEwhhsssshhhwcxEE
EEEEEwhhsssshhhwcxxx
EEEEEwhhhhhhhhhwcccc
EEEEEwhhhhhhhhhwcccc
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaaa
EEEEEwhhhhhhhhhwaaaa
EEEEEwhhhhhhhhhwaaaa
EEEEEwhhhhhhhhhwaaaa
EEEEEwwwwdddwwwwaaaa
EEEExccccnnnccccvvvv
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento casa, w muro casa, a pavimento stalla, v muro stalla, s zona scala, d porta, n selciato, r strada, c aia, x staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEExEEE
EEEEEwwwwwwwwwwwcxEE
EEEEEwhhsssshhhwcxEE
EEEEEwhhsssshhhwcxxx
EEEEEwhhhhhhhhhwcccc
EEEEEwhhhhhhhhhwcccc
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaaa
EEEEEwhhhhhhhhhwaaaa
EEEEEwhhhhhhhhhwaaaa
EEEEEwhhhhhhhhhwaaaa
EEEEEwwwwdddwwwwaaaa
EEEExccccnnnccccvvvv
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento casa, w muro casa, a pavimento stalla, v muro stalla, s zona scala, d porta, r strada, c aia, x staccionata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEExEEE
EEEEEwwwwwwwwwwwcxEE
EEEEEwhhsssshhhwcxxx
EEEEEwhhsssshhhwcccc
EEEEEwhhhhhhhhhwcccc
EEEEEwhhhhhhhhhwvvvv
EEEEEwhhhhhhhhhwaaaa
EEEEEwhhhhhhhhhwaaaa
EEEEEwhhhhhhhhhwaaaa
EEEEEwhhhhhhhhhwaaaa
EEEEEwhhhhhhhhhwaaaa
EEEEEwwwwdddwwwwvvvv
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento casa, w muro casa, a pavimento stalla, v muro stalla, s zona scala, d porta, n selciato, r strada, c aia, x staccionata, G cancello, Q fieno, t albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEtEEEtEEEtEEEEEEEEEEEEtEEEE
EEEEEEEEEEEEEEEEEtEEEtEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEExxxxxxxxxxxxxxxxxxxEEEE
EEEtEEExccccccccccccccccccEEEE
EEEEEEExccccccccccccccccccEEEE
EEEEEEExccwwwwwwwwwwwcccccEEEE
EEEEEEExccwhhsssshhhwcccccEEEE
EEEtEEExccwhhsssshhhwcccccEEEE
EEEEEEExccwhhhhhhhhhwcQcQcEEEE
EEEEEEExccwhhhhhhhhhwcccccEEEE
EEEEEEExccwhhhhhhhhhwvvvvvEEEE
EEEtEEExccwhhhhhhhhhwaaaavEEEE
EEEEEEExccwhhhhhhhhhwaaaavEEEE
EEEEEEExccwhhhhhhhhhwaaaavEEEE
EEEEEEExccwhhhhhhhhhwaaaavEEEE
EEEEEEExccwwwwdddwwwwaaaavEEEE
EEEEEEExccccccnnnccccvvvvvEEEE
EEEtEEExccccccnnncccccccccEEEE
EEEEEEExccccccnnncccccccccEEEE
EEEEEEExxxxxxxGGGxxxxxxxxxEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.12 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
Fattoria. Parti: la casa (h dentro, w muri) attorno al centro H, due piani con la scala (s) contro il muro di fondo;
la stalla (a dentro, v muri) addossata a un fianco della casa, più bassa, con una porta interna g dalla casa;
la porta d sul fronte in asse con H, la strada r fino al bordo.
Arredi: tavoli/letti e, casse/scaffali i contro i muri laterali, il focolare u; nella stalla mangiatoie j e fieno y.
Dove il terreno lo permette (Huge): l'aia c attorno agli edifici, la staccionata x con il cancello G,
i covoni Q nell'aia, gli alberi t del frutteto sul prato.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavsmdnrcxGQtgeiujy" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/><all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/><all in="vE/*v" out="*v/**"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <all in="[wv]EEEEEEE" out="*cc*****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE/*[wv]" out="*c/**"/>
      <all in="cEEEEE" out="*x****" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <all in="xE/*c" out="*x/**"/>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nd]/x" out="*/G" symmetry="()"/>
      <all in="[dnGr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="Gx" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- porta interna tra casa e stalla -->
      <one in="hwa/hwa/hwa" out="***/*g*/***" steps="1"/>
      <all in="hwa/hga" out="*g*/***" steps="1"/>
      <all in="hga/hwa" out="***/*g*" steps="1"/>
      <!-- arredi contro i muri laterali, lontano dalla scala e dalle porte -->
      <one in="whhh/whhh/whhh" out="****/*u**/****" symmetry="(x)" steps="1"/>
      <one in="whhh/whhh/whhh" out="****/*e**/****" symmetry="(x)" steps="2"/>
      <one in="whhh/whhh/whhh" out="****/*i**/****" symmetry="(x)" steps="2"/>
      <one in="av/av/av" out="**/j*/**" steps="2"/>
      <one in="av/av/av" out="**/y*/**" steps="1"/>
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="2"><field for="Q" from="n" on="cn"/></one>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEWULRfFTkOoNVAblCPJYZqzpcnrXwdghseiuavjyxQt" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="e" out="eeeee/eeeee/eeeee/eeeee/eeeee"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="G" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="t" out="zzzzz/zzzzz/zztzz/zzzzz/zzzzz"/>
      <sequence symmetry="(xy)">
        <union symbol="+" values="WVU"/>
        <union symbol="=" values="fFA"/>
        <!-- muri della casa: 64 -->
        <all in="B w" out="w W" steps="1"/>
        <all steps="1"><rule in="B d" out="d O"/><rule in="B g" out="g O"/></all>
        <all steps="63"><rule in="B d" out="d W"/><rule in="B g" out="g W"/></all>
        <all in="B w" out="w W" steps="5"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w U" steps="14"/><all in="B w" out="w W" steps="12"/>
        <!-- pavimenti z=0 -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/><rule in="B e" out="e f"/><rule in="B i" out="i f"/><rule in="B u" out="u f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B s" out="s B" steps="30"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B e" out="e b" steps="8"/><all in="B e" out="e B" steps="23"/>
        <all in="B i" out="i C" steps="6"/><all in="B i" out="i B" steps="25"/>
        <all in="B u" out="u P" steps="63"/>
        <!-- solaio z=32 -->
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/><rule in="B e" out="e F"/><rule in="B i" out="i F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <all in="B e" out="e l" steps="6"/><all in="B e" out="e B" steps="25"/>
        <all in="B i" out="i C" steps="10"/><all in="B i" out="i B" steps="21"/>
        <!-- la stalla: 40 -->
        <all steps="1"><rule in="B a" out="a A"/><rule in="B j" out="j A"/><rule in="B y" out="y A"/></all>
        <all in="B v" out="v V" steps="40"/>
        <all in="B a" out="a B" steps="39"/>
        <all in="B j" out="j J" steps="6"/><all in="B j" out="j B" steps="33"/>
        <all in="B y" out="y Y" steps="10"/><all in="B y" out="y B" steps="29"/>
        <!-- staccionata, covoni, alberi -->
        <all in="B x" out="x X" steps="7"/>
        <all in="B Q" out="Q c" steps="1"/><all in="B Q" out="Q Y" steps="9"/>
        <all in="B t" out="t Z" steps="18"/>
        <all in="B z" out="z p" steps="1"/><all in="B z" out="z B" steps="10"/><all in="B z" out="z q" steps="8"/>
        <prl>
          <rule in="w" out="R"/><rule in="d" out="R"/><rule in="g" out="R"/><rule in="h" out="R"/><rule in="s" out="R"/>
          <rule in="e" out="R"/><rule in="i" out="R"/><rule in="u" out="R"/>
          <rule in="v" out="R"/><rule in="a" out="R"/><rule in="j" out="R"/><rule in="y" out="R"/>
          <rule in="x" out="X"/><rule in="Q" out="Y"/><rule in="t" out="q"/><rule in="z" out="B"/>
        </prl>
        <import file="part-door"/>
        <import file="part-stair"/>
        <!-- finestre -->
        <one steps="14"><rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="W"/>
        <!-- tetti -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* P *" steps="1" symmetry="()"/>
        <all in="B P" out="P *" steps="10"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="W" value="e8dcc0" name="intonaco"/>
  <color symbol="L" value="3a5a7a" name="finestra"/>
  <color symbol="R" value="b04a2a" name="tetto di coppi"/>
  <color symbol="f" value="c8a070" name="assito" area="house"/>
  <color symbol="F" value="a07a4a" name="solaio"/>
  <color symbol="k" value="8a6038" name="gradini"/>
  <color symbol="T" value="8a6038" name="gradini"/>
  <color symbol="O" value="5a3a20" name="porta"/>
  <color symbol="o" value="3a2410" name="assi della porta"/>
  <color symbol="N" value="6a6a6a" name="stipite di pietra"/>
  <color symbol="V" value="8a4a30" name="tavolato della stalla"/>
  <color symbol="A" value="b09a60" name="paglia della stalla" area="barn"/>
  <color symbol="b" value="9a6a3a" name="arredo tavolo"/>
  <color symbol="l" value="d0d8e0" name="arredo letto"/>
  <color symbol="C" value="6a4020" name="arredo cassa"/>
  <color symbol="P" value="7a7a78" name="arredo focolare"/>
  <color symbol="J" value="5a4a30" name="arredo mangiatoia"/>
  <color symbol="Y" value="e0c050" name="arredo fieno"/>
  <color symbol="X" value="7a5a30" name="staccionata"/>
  <color symbol="Z" value="5a3a1a" name="tronco"/>
  <color symbol="q" value="5a9a3a" name="chioma"/>
  <color symbol="p" hidden="True" area="orchard"/>
  <color symbol="c" value="b8b070" name="aia" area="yard"/>
  <color symbol="n" value="a09888" name="selciato" area="yard"/>
  <color symbol="r" value="c0b090" name="strada"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
