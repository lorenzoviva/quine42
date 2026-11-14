# model.sculpt · gemini-3.8-flash · 27 s

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
  Forte:
  Un castello fortificato con maschio centrale a due piani coperti raggiungibili a piedi,
  cinta muraria con camminamento di ronda e merli, torri d'angolo, portale d'accesso con strada,
  cortile d'armi con pozzo.
  La sala interna del maschio è di almeno 7x7 celle (35x35 voxel > 28) per ospitare la scala (T, part-stair: 16x10 voxel)
  e lasciare spazio abitabile.
-->
<sequence values="BHEKcfsWtQPGrdauv" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEKcfsWtQPGrdauv" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- A. Composizione della pianta -->
      <!-- Maschio ampio: raggio 4 celle attorno a H = 9x9 celle interne (45x45 voxel) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Muri perimetrali del maschio (K) -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala s (4 celle in x, 2 celle in y) addossata a parete nord, lasciando landing a ovest -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <prl><rule in="h" out="f"/><rule in="H" out="f"/><rule in="w" out="K"/></prl>

      <!-- Cortile c attorno al maschio: 2 celle di distacco -->
      <all in="KE" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Espansione cortile verso il fronte e dove c'è spazio (a taglia Huge si espande di più) -->
      <all in="cEEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Muro di cinta W: 1 cella attorno al cortile -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri angolari t (2x2 celle) agli spigoli esterni -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- Accesso e portale verso sud: dal maschio attraverso il cortile fino alla cinta e all'esterno -->
      <one in="fff/fff/KKK" out="***/*m*/***"/>
      <all in="m/f" out="*/m" symmetry="()"/>
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- Larghezza varchi: porta maschio d, cinta G e strada r (3 celle = 15 voxel) -->
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="f"/><rule in="n" out="c"/></prl>

      <!-- Pozzo Q nel cortile, sul retro o a lato lontano dalla porta -->
      <one in="c" out="Q" steps="1"><field for="Q" from="G" on="c"/></one>
    </sequence>

    <!-- Mappatura in scala piena 5x5 per cella -->
    <map scale="5 5 1" values="BEKkWcstQPGrdauvTMoNULIF" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="Q" out="ccccc/cKKKc/cKqKc/cKKKc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="K" out="KKKKK/KKKKK/KKKKK/KKKKK/KKKKK"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>

      <sequence symmetry="(xy)">
        <!-- B. Alzate: colonne voxel per voxel -->
        <!-- Cinta muraria W: altezza 24 con camminamento -->
        <all in="B W" out="W W" steps="23"/>

        <!-- Portone di cinta G: porta O alla base, muro W sopra fino a 32 (torre portaia) -->
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G W" steps="31"/>

        <!-- Torri angolari t: salgono a 40 -->
        <all in="B t" out="t W" steps="39"/>

        <!-- Pozzo: acqua a quota terra, parapetto alto 3 -->
        <all in="B q" out="q a" steps="1"/>
        <all in="B K" out="K W" steps="3"/>

        <!-- Muri maschio K: due piani completi = 64 di altezza -->
        <all in="B K" out="K W" steps="63"/>

        <!-- Porta del maschio d: varco O alla base, muro W sopra fino a 64 -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="63"/>

        <!-- Interno del maschio: pavimento I a z=1 -->
        <all steps="1"><rule in="B f" out="f I"/><rule in="B s" out="s I"/></all>

        <!-- Striscia T per part-stair a z=2 sopra il pavimento s -->
        <all in="B s" out="s T" steps="1"/>

        <!-- Aria piano terra: z=2..31 -->
        <all in="B f" out="f B" steps="30"/><all in="B s" out="s B" steps="29"/>

        <!-- Solaio intermedio F a z=32 -->
        <all steps="1"><rule in="B f" out="f F"/><rule in="B s" out="s F"/></all>

        <!-- Aria secondo piano: z=33..63 -->
        <all steps="31"><rule in="B f" out="f B"/><rule in="B s" out="s B"/></all>

        <!-- Solaio di copertura/terrazza del maschio a z=64 -->
        <all steps="1"><rule in="B f" out="f F"/><rule in="B s" out="s F"/></all>

        <!-- Chiusura teste delle colonne -->
        <prl><rule in="f" out="B"/><rule in="s" out="B"/><rule in="K" out="W"/><rule in="d" out="W"/><rule in="t" out="W"/><rule in="W" out="W"/><rule in="G" out="W"/><rule in="q" out="B"/></prl>

        <!-- C. Parti e dettagli -->
        <union symbol="+" values="W"/>
        <union symbol="=" values="I F"/>
        <union symbol="%" values="W"/>

        <!-- Scala interna che sale al secondo piano bucando il solaio F -->
        <import file="part-stair"/>

        <!-- Porte fortificate d'ingresso -->
        <import file="part-door"/>

        <!-- Merlatura sui parapetti -->
        <import file="part-battlements"/>

        <!-- Feritoie sulle pareti merlate -->
        <import file="part-slits"/>

        <!-- Pulizia marcatori -->
        <prl><rule in="T" out="B"/></prl>
      </sequence>
    </map>
  </map>

  <!-- Tavolozza finale -->
  <color symbol="E" value="#446328" name="erba" hidden="True"/>
  <color symbol="B" value="#000000" name="aria" hidden="True"/>
  <color symbol="H" value="#827768" name="centro" hidden="True"/>
  <color symbol="W" value="#78736a" name="pietra_forte"/>
  <color symbol="I" value="#5e4831" name="tavole_quercia"/>
  <color symbol="F" value="#69655d" name="solaio_pietra"/>
  <color symbol="c" value="#8a8375" name="selciato_cortile"/>
  <color symbol="r" value="#9e9788" name="strada_maestra"/>
  <color symbol="a" value="#396c8a" name="acqua_pozzo"/>
  <color symbol="O" value="#422915" name="portone_chiuso"/>
  <color symbol="o" value="#2b1a0d" name="ferramenta_porta"/>
  <color symbol="N" value="#5c5750" name="cornice_portale"/>
  <color symbol="M" value="#878177" name="merlatura"/>
  <color symbol="U" value="#1c1a17" name="feritoia"/>
  <color symbol="k" value="#615a4f" name="gradino_pietra"/>

  <action name="open" label="Apri il portone">
    <all><rule in="O" out="B"/><rule in="o" out="B"/></all>
  </action>
</sequence>
It does not pass: varietà: alla taglia Enorme 10 tipi di parti e 113 parti, alla Grande 10 e 96: in un'area più grande entra di più (annessi, recinti, campi, mura, torri: un tipo nuovo, o almeno 120 parti), non lo stesso edificio più grande — what the larger size contains against the smaller: the kinds of parts (letters with a piece of 8 voxels or more) and the pieces
What the game made of it, in text:
### Seed 1 at huge: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, c selciato_cortile, W pietra_forte, r strada_maestra, a acqua_pozzo, k gradino_pietra, M merlatura, o ferramenta_porta, N cornice_portale, U feritoia, F solaio_pietra, O portone_chiuso
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEMMWWMWMMEEEEEEEEEEEEEEEEEEEEEEEEEEEMMWWMWMMEE
EEEEEWWWWWWWMEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWMEE
EEEEEMWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWEEE
EEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEE
EEEEEWWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWWWWMEE
EEEEEMWWWWcccccccccccccccccccccccccccccccccWWWWEEE
EEEEEMWWWWccccccccccccccccMccccccccccccccccWWWWMEE
EEEEEMMWWMcccccccccccccccccccccccccccccccccWWMMEEE
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEE
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE
EEEEEEEEWWcccMMFFFFFFFFFFFFFFFFFFFFFFWMMcccWWEEEEE
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEE
EEEEEEEEWWcccMWWWWWWWWWWWWWWWWWWWWWWWWMMcccWWEEEEE
EEEEEMWWMMcccccccccccccccccccccccccccccccccWWMMMEE
EEEEEWWWWWcccccccccccccccccccccccccccccccccWWWWEEE
EEEEEMWWWWccccccccccccccccccccccccccccccccWWWWWMEE
EEEEEWWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWWWWEEE
EEEEEWWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWWWWWEE
EEEEEMWWWWWWWrrrrrrrrrrrrrrrrrrrrrrrrrrrWWWWWWWMEE
EEEEEMWWWWWWrrrrrrrrrrrrrrrrrrrrrrrrrrrrWWWWWWWMEE
EEEEEMMEWMEMrrrrrrrrrrrrrrrrrrrrrrrrrrrrMEMEWMMEEE
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
00000kkkhkkkk000000000000000000000000000kkkhkkkk00
00000khhhhhhk000000000000000000000000000khhhhhhk00
00000khhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00
00000khhhhhhhaaaaaaaaaaaaaaaaaaaaaaaaaaahhhhhhhh00
00000hhhhhhkkaaaaaaaaaaaaaaaaaaaaaaaaaaakkhhhhhk00
00000khhhh000000000000000ww000000000000000hhhhhk00
00000khhhk000000000000000ww000000000000000khhhhk00
00000kkkhk00wwwtwwwtwwwtwwwwtwwwtwwwtwww00kkhkkk00
0000000aaa00wttttttttttttttttttttttttttw00aaa00000
0000000aaa00wttttttttttttttttttttttttttw00aaa00000
0000000aaa00tttssssssssssssssssssssssttt00aaa00000
0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
0000000aaa00wttssssssssssssssssssssssttw00aaa00000
0000000aaa00ttwsssssssssssssssssssssswtt00aaa00000
0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
0000000aaa00wttssssssssssssssssssssssttw00aaa00000
0000000aaa00ttwsssssssssssssssssssssswtt00aaa00000
0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
0000000aaa00tttssssssssssssssssssssssttt00aaa00000
0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
0000000aaa00tttssssssssssssssssssssssttt00aaa00000
0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
0000000aaa00tttssssssssssssssssssssssttt00aaa00000
0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
0000000aaa00wwwsssssssssssssssssssssswww00aaa00000
0000000aaa00vssssssssssssssssssssssssssv00aaa00000
0000000aaa00vvvsvvvsvvvsvvvvsvvvsvvvsvvv00aaa00000
00000khkkk00000000000000000000000000000000kkhkkk00
00000khhhk00000000000000000000000000000000khhhhk00
00000khhhhhkkeeeeeeeeeeeeeeeeeeeeeeeeeeekkhhhhhk00
00000khhhhhhkeeeeeeeeeeeeeeeeeeeeeeeeeeekhhhhhhk00
00000hhhhhhhkeeeeeeeeeeeeeeeeeeeeeeeeeeekhhhhhhh00
00000khhhhhhh000000000000000000000000000hhhhhhhk00
00000khhhhhhk000000000000000000000000000khhhhhhk00
00000kkkhkkkk000000000000000000000000000kkkkhkkk00
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
.............MM..MM..MM..MMM..MM..MM..MM..........
............MMM.MMM.MMM.MMMM.MMM.MMM.MMM..........
............MMM.MMM.MMM.MMMM.MMM.MMM.MMM..........
............MMMWMMMWMMMWMMMMWMMMWMMMWMMM..........
............WMWWWWWWWWWWWWWWWWWWWWWWWWMW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.....MMMMMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMMMMM..
.....MMMMMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMMMMM..
.....MMMMMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMMMMM..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WUWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWUW..
.....WUWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWUW..
.....WUWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWUW..
.....WWWWWWWWNNNNNNNNNNNNNNNNNNNNNNNNNNNWWWWWWWW..
.....WWWWWWWWoooooooooooooooooooooooooooWWWWWWWW..
.....WWWWWWWWoooooooooooooooooooooooooooWWWWWWWW..
.....WWWWWWWWoooooooooooooooooooooooooooWWWWWWWW..
.....WWWWWWWWoooooooooooooooooooooooooooWWWWWWWW..
.....WWWWWWWWoooooooooooooooooooooooooooWWWWWWWW..
.....WWWWWWWWoooooooooooooooooooooooooooWWWWWWWW..
.....WWWWWWWWoooooooooooooooooooooooooooWWWWWWWW..
.....WWWWWWWWoooooooooooooooooooooooooooWWWWWWWW..
.....WWWWWWWWoooooooooooooooooooooooooooWWWWWWWW..
.....WWWWWWWWoooooooooooooooooooooooooooWWWWWWWW..
.....WWWWWWWWoooooooooooooooooooooooooooWWWWWWWW..
.....WWWWWWWWoooooooooooooooooooooooooooWWWWWWWW..
.....WWWWWWWWoooooooooooooooooooooooooooWWWWWWWW..
.....WWWWWWWWoooooooooooooooooooooooooooWWWWWWWW..
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE
```
Right side (looking from the right):
```
...........M.MM.MMMMMMMMM..MM..MM..MM.............
..........MMMMM.MMMMMMMMMM.MMM.MMM.MMM.M..........
..........MMMMM.MMMMMMMMMM.MMM.MMM.MMMMM..........
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWMM..........
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..........WWWWWWWWWWWWWWWWWWUWWWUWWWUWWW..........
..........WWWWWWWWWWUWWWUWWWUWWWUWWWUWWW..........
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.....MMMMMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMMMMM..
.....MMMMMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMMMMM..
.....MMMMMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMMMMM..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WUWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWUW..
.....WUWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWUW..
.....WUWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWUW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNooWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNooWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNooWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
.....WWWWWWWW...........................WWWWWWWW..
.....WWWWWWWW...........................WWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..
.....WWWWW................W...............WWWWWW..
.....WWWWW...............WW...............WWWWWW..
.....WWWWW...WWWWWWWWWWWWWWWWWWWWWWWWWWW..WWWWW...
.......WWW..WWWWWWWWWWWWWWWWWWWWWWWWWWWW..WWW.....
.......WWW..WWWWWWWWWWWWWWWWWWWWWWWWWWWW..WWW.....
.......WWW..WWW.......kkkkkk.........WWW..WWW.....
.......WWW..WWW.......kkkkkk.........WWW..WWW.....
.......WWW..WWW.......kkkkkk.........WWW..WWW.....
.......WWW..WWW.......kkkkkk.........WWW..WWW.....
.......WWW..WWW.......kkkkkk.........WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..WWW......................WWW..WWW.....
.......WWW..NNNoooooooooooooooooooooooNN..WWW.....
.......WWW..oooooooooooooooooooooooooooo..WWW.....
.......WWW..oooooooooooooooooooooooooooo..WWW.....
.....WWWWW................................WWWWWW..
.....WWWWW................................WWWWWW..
.....WWWWWWWNoooooooooooooooooooooooooooNWWWWWWW..
.....WWWWWWWNoooooooooooooooooooooooooooNWWWWWWW..
.....WWWWWWWNoooooooooooooooooooooooooooNWWWWWWW..
.....WWWWWWWW...........................WWWWWWWW..
.....WWWWWWWW...........................WWWWWWWW..
.....WWWWWWW............................WWWWWWW...
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
.....MM..M.MM...........................MM..M.MM..
............M...........................M......M..
.....M............................................
..................................................
...........MM...........................M......M..
.....M....................W.......................
.....M...M...............WW...............M....M..
.....MM..M...WWWWWWWWWWWWWWWWWWWWWWWWWWW.....MM...
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
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
.....M..MM................................M..MMM..
..................................................
.....M.....M............................M......M..
............M...........................M.........
............M...........................M.........
.....M.........................................M..
.....M.........................................M..
.....MM..M.M............................M.M..MM...
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
EEEEEMMWWMWMMEEEEEEEEEEEEEEEEEEEEEEEEEEEMWMWWMMMEE   00000kkkhkkkk000000000000000000000000000kkkkhkkk00
EEEEEMWWWWWWMEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWEEE   00000khhhhhhk000000000000000000000000000hhhhhhhk00
EEEEEWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWMEE   00000khhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00
EEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWWWWEEE   00000hhhhhhhhaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00
EEEEEMWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWWWWWEE   00000khhhhhkkaaaaaaaaaaaaaaaaaaaaaaaaaaakkhhhhhh00
EEEEEWWWWWcccccccccccccccccccccccccccccccccWWWWMEE   00000khhhh000000000000000ww000000000000000hhhhhk00
EEEEEMWWWWccccccccccccccccMccccccccccccccccWWWWMEE   00000khhhk000000000000000ww000000000000000khhhhk00
EEEEEMMWWMcccccccccccccccccccccccccccccccccMMWEEEE   00000kkkhk00wwwtwwwtwwwtwwwwtwwwtwwwtwww00kkkhkk00
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEE   0000000aaa00wttttttttttttttttttttttttttw00aaa00000
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEE   0000000aaa00wttttttttttttttttttttttttttw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00tttssssssssssssssssssssssttt00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00ttwsssssssssssssssssssssswtt00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00ttwsssssssssssssssssssssswtt00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00tttssssssssssssssssssssssttt00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00tttssssssssssssssssssssssttt00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00tttssssssssssssssssssssssttt00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccMMFFFFFFFFFFFFFFFFFFFFFFWMMcccWWEEEEE   0000000aaa00wwwsssssssssssssssssssssswww00aaa00000
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEE   0000000aaa00vssssssssssssssssssssssssssv00aaa00000
EEEEEEEEWWcccMWWWWWWWWWWWWWWWWWWWWWWWWMMcccWWEEEEE   0000000aaa00vvvsvvvsvvvsvvvvsvvvsvvvsvvv00aaa00000
EEEEEMWWMMcccccccccccccccccccccccccccccccccWWMMMEE   00000khkkk00000000000000000000000000000000kkhkkk00
EEEEEWWWWWcccccccccccccccccccccccccccccccccWWWWEEE   00000khhhk00000000000000000000000000000000khhhhk00
EEEEEMWWWWccccccccccccccccccccccccccccccccWWWWWMEE   00000khhhhhkkeeeeeeeeeeeeeeeeeeeeeeeeeeekkhhhhhk00
EEEEEWWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWWWWEEE   00000khhhhhhkeeeeeeeeeeeeeeeeeeeeeeeeeeekhhhhhhk00
EEEEEWWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWWWWWEE   00000hhhhhhhkeeeeeeeeeeeeeeeeeeeeeeeeeeekhhhhhhh00
EEEEEMWWWWWWWrrrrrrrrrrrrrrrrrrrrrrrrrrrWWWWWWWMEE   00000khhhhhhh000000000000000000000000000hhhhhhhk00
EEEEEMWWWWWWrrrrrrrrrrrrrrrrrrrrrrrrrrrrWWWWWWWMEE   00000khhhhhhk000000000000000000000000000khhhhhhk00
EEEEEMMEWMEMrrrrrrrrrrrrrrrrrrrrrrrrrrrrMEMEWMMEEE   00000kkkhkkkk000000000000000000000000000kkkkhkkk00
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
EEEEEMMWWMWMMEEEEEEEEEEEEEEEEEEEEEEEEEEEMWMWWMMMEE   00000kkkhkkkk000000000000000000000000000kkkkhkkk00
EEEEEMWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWMEE   00000khhhhhhh000000000000000000000000000khhhhhhk00
EEEEEWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWEEE   00000khhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00
EEEEEWWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEE   00000hhhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaahhhhhhhh00
EEEEEMWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWMWWWWWWMEE   00000khhhhhkkaaaaaaaaaaaaaaaaaaaaaaaaaaakkhhhhhk00
EEEEEWWWWWcccccccccccccccccccccccccccccccccWWWWEEE   00000khhhh000000000000000ww000000000000000hhhhhk00
EEEEEMWWWWccccccccccccccccMccccccccccccccccWWWWMEE   00000khhhk000000000000000ww000000000000000khhhhk00
EEEEEMWWMMcccccccccccccccccccccccccccccccccWWMMEEE   00000khkkk00wwwtwwwtwwwtwwwwtwwwtwwwtwww00kkhkkk00
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEE   0000000aaa00wttttttttttttttttttttttttttw00aaa00000
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEE   0000000aaa00wttttttttttttttttttttttttttw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00tttssssssssssssssssssssssttt00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00ttwsssssssssssssssssssssswtt00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wttssssssssssssssssssssssttw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00ttwsssssssssssssssssssssswtt00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00tttssssssssssssssssssssssttt00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00tttssssssssssssssssssssssttt00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00tttssssssssssssssssssssssttt00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccWWFFFFFFFFFFFFFFFFFFFFFFFWWcccWWEEEEE   0000000aaa00wtwsssssssssssssssssssssswtw00aaa00000
EEEEEEEEWWcccMMFFFFFFFFFFFFFFFFFFFFFFWMMcccWWEEEEE   0000000aaa00wwwsssssssssssssssssssssswww00aaa00000
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEE   0000000aaa00vssssssssssssssssssssssssssv00aaa00000
EEEEEEEEWWcccMWWWWWWWWWWWWWWWWWWWWWWWWMMcccWWEEEEE   0000000aaa00vvvsvvvsvvvsvvvvsvvvsvvvsvvv00aaa00000
EEEEEMWWMMcccccccccccccccccccccccccccccccccMMWWMEE   00000khkkk00000000000000000000000000000000kkkhkk00
EEEEEWWWWWcccccccccccccccccccccccccccccccccWWWWMEE   00000khhhk00000000000000000000000000000000khhhhk00
EEEEEMWWWWccccccccccccccccccccccccccccccccWWWWWEEE   00000khhhhhkkeeeeeeeeeeeeeeeeeeeeeeeeeeekkhhhhhk00
EEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEE   00000khhhhhhkeeeeeeeeeeeeeeeeeeeeeeeeeeekhhhhhhh00
EEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMEE   00000hhhhhhhheeeeeeeeeeeeeeeeeeeeeeeeeeehhhhhhhk00
EEEEEMWWWWWWMrrrrrrrrrrrrrrrrrrrrrrrrrrrMWWWWWWEEE   00000khhhhhhk000000000000000000000000000khhhhhhk00
EEEEEMWWWWWWMrrrrrrrrrrrrrrrrrrrrrrrrrrrMWWWWWWMEE   00000khhhhhhk000000000000000000000000000khhhhhhk00
EEEEEMEMEWMMrrrrrrrrrrrrrrrrrrrrrrrrrrrrMEMEWMMEEE   00000kkkkhkkk000000000000000000000000000kkkkhkkk00
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrrrrrrrrrrrEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.01 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 118 nodi, 612 passi, finito in 615 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro (marcatore), E=erba (marcatore), K=pinK, c=selciato_cortile, f=fawn, s=slate, W=pietra_forte, t=teal, Q=aQua, G=Green, r=strada_maestra, d=dead, dark, a=acqua_pozzo, h=honey, w=white, m=magenta, n=brown, k=gradino_pietra, T=Teal (marcatore), M=merlatura, o=ferramenta_porta, N=cornice_portale, U=feritoia, I=tavole_quercia, F=solaio_pietra, q=aqua, O=portone_chiuso, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 117005, o 16260, E 11600, c 4191, F 3890, k 2880, U 2866, M 2604, r 1375, N 1090, O 240, a 1.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-31 all×22, one×3, prl×2: 707 celle x5-25 y5-29 z0, passi 2-60
   #33 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 61
    #35 all . W → W W passi=23: ×23, 28175 celle x30-124 y30-124 z1-23, passi 62-84, .→W 28175
#36-37 all×2: 17600 celle x50-104 y120-124 z0-32, passi 85-116
    #38 all . t → t W passi=39: ×39, 62400 celle x25-129 y25-129 z0-39, passi 117-155, t→W 31200, .→t 31200
#39-40 all×2: 4400 celle x50-104 y36-99 z0-3, passi 156-159
    #41 all . K → K W passi=63: ×63, 92358 celle x50-104 y36-99 z3-66, passi 160-222, K→W 46179, .→K 46179
    #42 all . d → d O passi=1: ×1, 550 celle x50-104 y100-104 z0-1, passi 223, d→O 275, .→d 275
    #43 all . d → d W passi=63: ×63, 34650 celle x50-104 y100-104 z1-64, passi 224-286, d→W 17325, .→d 17325
#44-45 all×2: 4450 celle x55-99 y55-99 z0-2, passi 287-288
    #46 all . f → f . passi=30: ×30, 109500 celle x55-99 y55-99 z1-31, passi 289-318, f→. 54750, .→f 54750
#47-48 all×2: 15650 celle x55-99 y55-99 z2-32, passi 319-348
    #49 all . f → f . (+1) passi=31: ×31, 125550 celle x55-99 y55-99 z32-63, passi 349-379, f→. 56575, .→f 56575, s→. 6200, .→s 6200
      r1 . f → f . ×56575; r2 . s → s . ×6200
#50-51 all×1, prl×1: 8159 celle x25-129 y25-129 z1-66, passi 380-381
     #58 all . I → I * passi=30: ×30, 54750 celle x55-99 y55-99 z1-30, passi 382-411, .→I 54750
     #63 prl I → . passi=1: ×1, 56775 celle x55-99 y55-99 z0-30, passi 412, I→. 56775
#69-81 all×9, prl×4: 13170 celle x65-84 y55-64 z0-32, passi 413-509
#88-90 all×3: 17040 celle x49-105 y99-124 z0-30, passi 510-540
#91-117 all×8, prl×2: 24558 celle x25-129 y25-129 z0-72, passi 541-612
Senza effetto (non hanno mai cambiato una cella):
#53 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#54 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#55 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#56 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
#57 all . #96 → I * passi=1: in quel momento nella griglia non c'erano celle ""
#59 all . I → #95 * passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#60 all . #95 → I * passi=1: in quel momento nella griglia non c'erano celle ""
#61 all . I → I * passi=29: le celle cercate c'erano, ma mai disposte come nel pattern
#62 all . I → S * passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#64 one SSSSSSSSSSSSS/............. SSSSSSSSSSSSS/#93#9… → *************/************* *#94#94#94#94#94#94… passi=1: in quel momento nella griglia non c'erano celle "S", ""
#65 all S/#94 → #94/* passi=1: in quel momento nella griglia non c'erano celle "S", ""
#66 all S #94 → #94 * passi=29: in quel momento nella griglia non c'erano celle "", "S"
… e altri 23
Fix it and answer with the whole program.

## Risposta

<!--
  Forte:
  Struttura fortificata con maschio centrale (2 piani coperti accessibili via scala part-stair),
  mura di cinta, camminamento di ronda con merli (part-battlements) e feritoie (part-slits),
  torri d'angolo, portone d'accesso (part-door) e strada.
  Varietà di scala e tra semi:
  - Ala laterale/corpo di guardia addossato al maschio determinato casualmente da ogni seme
  - A taglia Enorme (Huge): tettoie stalle (p) con pali e copertura in legno, e orto/giardino recintato (Y, z)
-->
<sequence values="BHEKcfsWtQPGrdauvpJyz" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEKcfsWtQPGrdauvpJyz" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- A. Composizione della pianta -->
      <!-- Semi variano la forma del maschio centrale -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>

      <!-- Muri perimetrali del maschio (w) -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Ala residenziale/corpo annesso su un lato a caso se c'è spazio -->
      <one in="Ew/Ew/Ew/Ew" out="**/*u/**/**" symmetry="(x)" steps="1"/>
      <all in="uE" out="*u" symmetry="(x)" steps="2"/>
      <all in="u/E" out="*/u" symmetry="()" steps="1"/>
      <all in="E/u" out="u/*" symmetry="()" steps="1"/>
      <all in="uE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Posizionamento scala interna s (4 celle x, 2 celle y) -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <prl><rule in="h" out="f"/><rule in="H" out="f"/><rule in="u" out="f"/><rule in="w" out="K"/></prl>

      <!-- Cortile interno c -->
      <all in="KE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Espansione cortile: se c'è spazio sufficiente (Huge) si allarga di più -->
      <all in="cEEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*cc*****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Mura di cinta W attorno al cortile -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri angolari t (2x2 celle) sugli spigoli della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- Porta del maschio e portone della cinta con strada verso l'esterno -->
      <one in="fff/fff/KKK" out="***/*m*/***"/>
      <all in="m/f" out="*/m" symmetry="()"/>
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- Aperture a 3 celle di larghezza -->
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="f"/><rule in="n" out="c"/></prl>

      <!-- Pozzo d'acqua nel cortile lontano dal portone -->
      <one in="c" out="Q" steps="1"><field for="Q" from="G" on="c"/></one>

      <!-- A taglia Huge: stalla/tettoia p contro le mura se c'è spazio nel cortile -->
      <one in="Wcccc/Wcccc/Wcccc" out="*****/*ppp*/*ppp*" symmetry="(x)" steps="1"/>

      <!-- A taglia Huge: orto murato esterno (giardino z con recinzione Y) -->
      <one in="EEEEEEE/EWWWWWE/EWWWWWE" out="*******/**zzz**/**zzz**" symmetry="()" steps="1"/>
      <all in="zE" out="*z" steps="1"/>
      <all in="zE/*z" out="*z/**"/>
      <all in="zE" out="*Y"/>
      <all in="YE/*Y" out="*Y/**"/>
    </sequence>

    <!-- Mappa scala piena 5x5 -->
    <map scale="5 5 1" values="BEKkWcstQPGrdauvpJyzTMoNULIF" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="Q" out="ccccc/cKKKc/cKqKc/cKKKc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="K" out="KKKKK/KKKKK/KKKKK/KKKKK/KKKKK"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="p" out="ppppp/pcccp/pcccp/pcccp/ppppp"/>
      <rule in="z" out="zzzzz/zzzzz/zzzzz/zzzzz/zzzzz"/>
      <rule in="Y" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>

      <sequence symmetry="(xy)">
        <!-- B. Alzate verticali -->
        <!-- Mura basse giardino/orto Y -->
        <all in="B Y" out="Y W" steps="6"/>

        <!-- Tettoia/stalla p: pali d'angolo e travi che salgono a 31 -->
        <all in="B p" out="p J" steps="31"/>

        <!-- Mura di cinta W: altezza 24 -->
        <all in="B W" out="W W" steps="23"/>

        <!-- Portone d'ingresso cinta G: porta alla base, salita a 32 -->
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G W" steps="31"/>

        <!-- Torri angolari t: salgono a 40 -->
        <all in="B t" out="t W" steps="39"/>

        <!-- Pozzo d'acqua -->
        <all in="B q" out="q a" steps="1"/>
        <all in="B K" out="K W" steps="3"/>

        <!-- Maschio K: altezza 64 (due piani abitabili da 32) -->
        <all in="B K" out="K W" steps="63"/>

        <!-- Porta del maschio d: varco O alla base, muro W sopra fino a 64 -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="63"/>

        <!-- Interno del maschio: pavimento I a z=1 -->
        <all steps="1"><rule in="B f" out="f I"/><rule in="B s" out="s I"/></all>

        <!-- Striscia T per part-stair a z=2 -->
        <all in="B s" out="s T" steps="1"/>

        <!-- Aria primo piano -->
        <all in="B f" out="f B" steps="30"/><all in="B s" out="s B" steps="29"/>

        <!-- Solaio intermedio F a z=32 -->
        <all steps="1"><rule in="B f" out="f F"/><rule in="B s" out="s F"/></all>

        <!-- Aria secondo piano -->
        <all steps="31"><rule in="B f" out="f B"/><rule in="B s" out="s B"/></all>

        <!-- Copertura piana del maschio a z=64 -->
        <all steps="1"><rule in="B f" out="f F"/><rule in="B s" out="s F"/></all>

        <!-- Chiusura sommità colonne -->
        <prl><rule in="f" out="B"/><rule in="s" out="B"/><rule in="K" out="W"/><rule in="d" out="W"/><rule in="t" out="W"/><rule in="W" out="W"/><rule in="G" out="W"/><rule in="q" out="B"/><rule in="p" out="J"/><rule in="Y" out="W"/></prl>

        <!-- Copertura in tavole della tettoia p -->
        <all in="B J" out="* J" steps="1"/>

        <!-- C. Parti e dettagli -->
        <union symbol="+" values="W"/>
        <union symbol="=" values="I F"/>
        <union symbol="%" values="W"/>

        <!-- Scala al piano superiore -->
        <import file="part-stair"/>

        <!-- Porte -->
        <import file="part-door"/>

        <!-- Merlatura -->
        <import file="part-battlements"/>

        <!-- Feritoie -->
        <import file="part-slits"/>

        <!-- Pulizia marcatori -->
        <prl><rule in="T" out="B"/></prl>
      </sequence>
    </map>
  </map>

  <!-- Palette colori -->
  <color symbol="E" value="#446328" name="erba" hidden="True"/>
  <color symbol="B" value="#000000" name="aria" hidden="True"/>
  <color symbol="H" value="#827768" name="centro" hidden="True"/>
  <color symbol="W" value="#78736a" name="pietra_forte"/>
  <color symbol="I" value="#5e4831" name="tavole_quercia"/>
  <color symbol="F" value="#69655d" name="solaio_pietra"/>
  <color symbol="c" value="#8a8375" name="selciato_cortile"/>
  <color symbol="r" value="#9e9788" name="strada_maestra"/>
  <color symbol="a" value="#396c8a" name="acqua_pozzo"/>
  <color symbol="J" value="#785332" name="legno_tettoia"/>
  <color symbol="z" value="#4a6e2d" name="coltivo_orto"/>
  <color symbol="O" value="#422915" name="portone_chiuso"/>
  <color symbol="o" value="#2b1a0d" name="ferramenta_porta"/>
  <color symbol="N" value="#5c5750" name="cornice_portale"/>
  <color symbol="M" value="#878177" name="merlatura"/>
  <color symbol="U" value="#1c1a17" name="feritoia"/>
  <color symbol="k" value="#615a4f" name="gradino_pietra"/>

  <action name="open" label="Apri il portone">
    <all><rule in="O" out="B"/><rule in="o" out="B"/></all>
  </action>
</sequence>

