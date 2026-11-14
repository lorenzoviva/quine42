# model.sculpt · gemini-3.8-flash · 23 s

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
  Un castello fortificato con maschio centrale a più piani, cinta muraria con camminamento di ronda e merli,
  torri d'angolo, portale d'accesso con ponte/strada, cortile d'armi con pozzo e tettoia/magazzino.
  A taglia Huge (30x30): borgo/avamposto esterno con ali o fossato e torri addizionali.
  Variabilità tra i semi: asimmetria della cinta, posizione del maschio, orientamento o presenza di ala secondaria,
  e posizione della tettoia.
-->
<sequence values="BHEKcfsWtQPGrdauv" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEKcfsWtQPGrdauv" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- A. Composizione della pianta -->
      <!-- Spostamento casuale iniziale del centro per rompere la simmetria identica -->
      <prl in="E/H" out="H/E" p="0.5" steps="1" symmetry="()"/>
      <prl in="H/E" out="E/H" p="0.5" steps="1" symmetry="()"/>
      <prl in="EH" out="HE" p="0.5" steps="1" symmetry="(x)"/>

      <!-- Corpo del maschio: 2 dietro, 2 o 3 davanti a seconda del seme -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <!-- Allargamento laterale del maschio: 2 per lato -->
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="2"/>
      <prl in="hE" out="*h" p="0.3" steps="1" symmetry="(x)"/>

      <!-- Muri del maschio (K) e interno sala (f) -->
      <all in="hE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>
      <prl in="h" out="f"/><prl in="H" out="f"/>

      <!-- Zona scala interna (s: 4 celle lunghe in x, 2 larghe in y) lungo parete nord -->
      <!-- Lascia almeno 2 celle a ovest (x minore) come pianerottolo -->
      <one in="KKKKKKK/Kffffff/Kffffff" out="*******/**ssss*/**ssss*" symmetry="()" steps="1"/>

      <!-- Cortile (c): si espande a partire dal maschio (3 celle) -->
      <all in="KE" out="*c" steps="3"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Variazione su un lato del cortile -->
      <one in="cEEEE" out="*cc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- A taglia Huge: ulteriore espansione del cortile e mura esterne -->
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Muro di cinta (W): 1 cella attorno al cortile -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri quadrate agli angoli (t: 2x2 celle) -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- Portale d'accesso sul lato sud (frontale) -->
      <one in="fff/fff/KKK" out="***/*m*/***"/>
      <all in="m/f" out="*/m" symmetry="()"/>
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- Larghezza del varco: 3 celle (15 voxels) per porta maschio, cinta e strada -->
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="f"/><rule in="n" out="c"/></prl>

      <!-- Pozzo (Q) nel cortile, lontano dalla porta -->
      <one in="c" out="Q" steps="1"><field for="Q" from="G" on="c"/></one>

      <!-- Tettoia/scuderia nel cortile addossata al muro di cinta -->
      <one in="cW/cc" out="PW/**" steps="1"/>
      <all in="Pc" out="*P" steps="2"/>

      <!-- A taglia Huge: steccato o orto del forte (u) -->
      <all in="cEEEEEEE" out="*uuuu***" steps="1"/>
      <all in="uE/*u" out="*u/**"/>
    </sequence>

    <!-- Mappatura in scala piena 5x5 per cella -->
    <map scale="5 5 1" values="BEKkWcstQPGrdauvTMoNULIF" symmetry="()">
      <!-- Terreno ed erba -->
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <!-- Selciato strada esterna -->
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <!-- Cortile in pietra -->
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <!-- Pavimento interno maschio -->
      <rule in="f" out="fffff/fffff/fffff/fffff/fffff"/>
      <!-- Zona scala interna al maschio -->
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <!-- Pozzo nel cortile: muretto perimetrale e acqua -->
      <rule in="Q" out="ccccc/cKKKc/cKqKc/cKKKc/ccccc"/>
      <!-- Tettoia: pali d'angolo e ghiaia -->
      <rule in="P" out="PPPPP/PcccP/PcccP/PcccP/PPPPP"/>
      <!-- Mura di cinta -->
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <!-- Torri angolari -->
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <!-- Muri maschio -->
      <rule in="K" out="KKKKK/KKKKK/KKKKK/KKKKK/KKKKK"/>
      <!-- Porta maschio -->
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <!-- Portone cinta -->
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <!-- Giardino/recinto Huge -->
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>

      <sequence symmetry="(xy)">
        <!-- B. Alzate: colonne voxel per voxel -->
        <!-- Cortina muraria (W): sale a 24 di altezza (camminamento di ronda) -->
        <all in="B W" out="W W" steps="23"/>

        <!-- Barbacane/Portone di cinta (G): sale a 32 con porta O alla base -->
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G W" steps="31"/>

        <!-- Torri angolari (t): salgono a 40 di altezza -->
        <all in="B t" out="t W" steps="39"/>

        <!-- Pozzo d'acqua: acqua a terra, parapetto sale a 4 -->
        <all in="B q" out="q a" steps="1"/>
        <all in="B K" out="K W" steps="3"/>

        <!-- Tettoia (P): pali salgono a 32 -->
        <all in="B P" out="P p" steps="31"/>
        <all in="B P" out="P R" steps="1"/>

        <!-- Muri del maschio (K): due piani completi = 64 di altezza -->
        <!-- Piano terra: pietra W fino a 32, poi solaio, poi pietra fino a 64 -->
        <all in="B K" out="K W" steps="63"/>

        <!-- Porta del maschio (d): alla base varco porta O, sopra muro K -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="63"/>

        <!-- Interno maschio (f) e scala (s): piano terra, aria, solaio F a z=32, aria, tetto/terrazza R a z=64 -->
        <!-- Pavimento piano terra a z=1 -->
        <all steps="1"><rule in="B f" out="f I"/><rule in="B s" out="s I"/></all>

        <!-- Striscia T per part-stair a z=2 sopra il pavimento -->
        <all in="B s" out="s T" steps="1"/>
        <!-- Aria primo piano -->
        <all in="B f" out="f B" steps="30"/><all in="B s" out="s B" steps="29"/>

        <!-- Solaio a z=32 -->
        <all steps="1"><rule in="B f" out="f F"/><rule in="B s" out="s F"/></all>

        <!-- Aria secondo piano -->
        <all steps="31"><rule in="B f" out="f B"/><rule in="B s" out="s B"/></all>

        <!-- Tetto/terrazza maschio a z=64 -->
        <prl><rule in="f" out="W"/><rule in="s" out="W"/><rule in="K" out="W"/><rule in="d" out="W"/><rule in="t" out="W"/><rule in="W" out="W"/><rule in="G" out="W"/><rule in="P" out="B"/><rule in="q" out="B"/></prl>

        <!-- C. Dettagli e parti incluse -->
        <!-- Unioni richieste per i moduli -->
        <union symbol="+" values="W"/>
        <union symbol="=" values="I F"/>
        <union symbol="%" values="W"/>

        <!-- Scala a chiocciola / rampa interna tramite part-stair -->
        <import file="part-stair"/>

        <!-- Porte fortificate tramite part-door -->
        <import file="part-door"/>

        <!-- Merli sui camminamenti di cinta, torri e maschio -->
        <import file="part-battlements"/>

        <!-- Feritoie sotto i merli -->
        <import file="part-slits"/>

        <!-- Finestre sul maschio al secondo piano -->
        <one in="BBW/BBW/BBW" out="**L/**L/**L" steps="4" symmetry="()"/>
        <all in="LWWWB" out="*LLLB"/>

        <!-- Pulizia marcatori residui -->
        <prl><rule in="B" out="B"/><rule in="T" out="B"/></prl>
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
  <color symbol="p" value="#52391e" name="trave_legno"/>
  <color symbol="R" value="#823c2a" name="tegole_tettoia"/>
  <color symbol="u" value="#3b5924" name="orto_recintato"/>
  <color symbol="O" value="#422915" name="portone_chiuso"/>
  <color symbol="o" value="#2b1a0d" name="ferramenta_porta"/>
  <color symbol="N" value="#5c5750" name="cornice_portale"/>
  <color symbol="M" value="#878177" name="merlatura"/>
  <color symbol="U" value="#1c1a17" name="feritoia"/>
  <color symbol="k" value="#615a4f" name="gradino_pietra"/>
  <color symbol="L" value="#8ed1db" name="apertura_finestra"/>

  <!-- Azioni interattive -->
  <action name="open" label="Apri il portone">
    <all><rule in="O" out="B"/><rule in="o" out="B"/></all>
  </action>
</sequence>
It does not pass: taglia Grande, seme 1: piani: 1 (serve ≥ 2); stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, c selciato_cortile, W pietra_forte, r strada_maestra, a acqua_pozzo, M merlatura, o ferramenta_porta, N cornice_portale, U feritoia, L apertura_finestra, F solaio_pietra, O portone_chiuso
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
EEEEEEEEWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWEEEEE
EEEEEEEEWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEWWWWWWWEEEEE
EEEEEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEE
EEEEEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEE
EEEEEEEEWWWWWcMWWWWWWWWWWWWWWWWWWWWWWcMWWWWWWEEEEE
EEEEEEEEWWWWccccccccccccccMcccccccccccccWWWWWEEEEE
EEEEEEEEWWWWMcccccccccccccMcccccccccccccMWWWMEEEEE
EEEEEEEEEEWWWcccccccccccccccccccccccccccWWWEEEEEEE
EEEEEEEEEEWWWcccccccccccccccccccccccccccWWWEEEEEEE
EEEEEEEEEEWWWcccccccccccccccccccccccccccWWWEEEEEEE
EEEEEEEEEEWWWcccccccccccccccccccccccccccWWWEEEEEEE
EEEEEEEEEEWWWcccccccccccccccccccccccccccWWWEEEEEEE
EEEEEEEEEEWWWccMMWWMMWWMMWWMMWWMMWWMMMccWWWEEEEEEE
EEEEEEEEEEWWWccMWWWWWWWWWWWWWWWWWWWWWMccWWWEEEEEEE
EEEEEEEEEEWWWccWWWWWWWWWWWWWWWWWWWWWWcccWWWEEEEEEE
EEEEEEEEEEWWWccWWWWWUWWWUWWWUWWWUWWWWWccWWWEEEEEEE
EEEEEEEEEEWWWccMWWWWUWWWUWWWUWWWUWWWWMccWWWEEEEEEE
EEEEEEEEEEWWWccMWWWWUUUUUUUUUUUUUWWWWMccWWWEEEEEEE
EEEEEEEEEEWWWccWWWWWUWWWUWWWUWWWUWWWWcccWWWEEEEEEE
EEEEEEEEEEWWWccWWWWWUWWWUWWWUWWWUWWWWWccWWWEEEEEEE
EEEEEEEEEEWWWccMWWWWUWWWUWWWUWWWUWWWWMccWWWEEEEEEE
EEEEEEEEEEWWWccWWWWMUWWWUWWWUWWWUWWWWcccWWWEEEEEEE
EEEEEEEEEEWWWccWWWWWUWWWUWWWUWWWUWWWWWccWWWEEEEEEE
EEEEEEEEEEWWWccMWWWWUWWWUWWWUWWWUWWWWMccWWWEEEEEEE
EEEEEEEEEEWWWccMWWUUUUUUUUUUUUUUUUUMWMccWWWEEEEEEE
EEEEEEEEEEWWWccWWWWWUWWWUWWWUWWWUWWWWcccWWWEEEEEEE
EEEEEEEEEEWWWccWWWWMUWWWUWWWUWWWUWWWWWccWWWEEEEEEE
EEEEEEEEEEWWWccMWWWWWWWWWWWWWWWWWWWMWMccWWWEEEEEEE
EEEEEEEEEEWWWccMWMUUUUUUUUUUUUUUUUUMWMccWWWEEEEEEE
EEEEEEEEEEWWcccMMcWWWWWWWWWWWWWWWWWMMcccWWWEEEEEEE
EEEEEEEEWWWWMcccccccccccccccccccccccccccMWWWWEEEEE
EEEEEEEEWWWWWcccccccccccccccccccccccccccWWWWWEEEEE
EEEEEEEEWWWWWWMWWNMMWWMMWWMWWMMWWMMNWWMWWWWWWEEEEE
EEEEEEEEWWWWWWWWWNWWWWWWWWWWWWWWWWWNWWWWWWWWWEEEEE
EEEEEEEEWWWWWWWWWNMMWrMMWrMWrMMWrMMEWWWWWWWWWEEEEE
EEEEEEEEWWWWWWWEEErrrrrrrrrrrrrrrrrEEEWWWWWWWEEEEE
EEEEEEEEWWWWWWMEEErrrrrrrrrrrrrrrrrEEEWWWWWWMEEEEE
EEEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE
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
0000000kkkhkkkk0000000000000000000000kkkhkkkk00000
0000000khhhhhhk0000000000000000000000khhhhhhk00000
0000000khhhhhhh0000000000000000000000hhhhhhhk00000
0000000khhhhhhkaaaaaaaaaaaaaaaaaaaaaakhhhhhhk00000
0000000hhhhhhhkaaaaaaaaaaaaaaaaaaaaaakhhhhhhh00000
0000000khhhhhkkaaaaaaaaaaaaaaaaaaaaaakkhhhhhk00000
0000000khhhhk000000000000ww0000000000000khhhk00000
0000000kkkhkk000000000000ww0000000000000kkkhk00000
0000000000aaa000000000000000000000000000aaa0000000
0000000000aaa000000000000000000000000000aaa0000000
0000000000aaa000000000000000000000000000aaa0000000
0000000000aaa000000000000000000000000000aaa0000000
0000000000aaa000000000000000000000000000aaa0000000
0000000000aaa00wwwtwwwtwwwtwwwtwwwtwww00aaa0000000
0000000000aaa00wtttttttttttttttttttttw00aaa0000000
0000000000aaa00wtttttttttttttttttttttw00aaa0000000
0000000000aaa00tttttsssssssssssstttttt00aaa0000000
0000000000aaa00wtttwsssssssssssswttttw00aaa0000000
0000000000aaa00wtttwsssssssssssswttttw00aaa0000000
0000000000aaa00wttttsssssssssssstttttw00aaa0000000
0000000000aaa00ttttwsssssssssssswttttt00aaa0000000
0000000000aaa00wtttwsssssssssssswttttw00aaa0000000
0000000000aaa00wttwwsssssssssssswwtttw00aaa0000000
0000000000aaa00tttsssssssssssssssssttt00aaa0000000
0000000000aaa00wttsssssssssssssssssttw00aaa0000000
0000000000aaa00wttwwssssssssssssssswtw00aaa0000000
0000000000aaa00wtttwssssssssssssssswtw00aaa0000000
0000000000aaa00tttwwsssssssssssssssttt00aaa0000000
0000000000aaa00wttssssssssssssssssswtw00aaa0000000
0000000000aaa00wtwssssssssssssssssswtw00aaa0000000
0000000kkhkkk00wwwssssssssssssssssswww00khkkk00000
0000000khhhhk000000000000000000000000000khhhk00000
0000000khhhhh000000000000000000000000000hhhhk00000
0000000hhhhhhkkaahhhehhhehhehhhehhhaakkhhhhhk00000
0000000khhhhhhhaaheeeeeeeeeeeeeeeehaakhhhhhhh00000
0000000khhhhhhkaahhhehhhehhehhhehhhaakhhhhhhk00000
0000000khhhhhhk0000000000000000000000hhhhhhhk00000
0000000kkkkhkkk0000000000000000000000kkkkhkkk00000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
...............MM..MM..MMMMMM..MMM.MM.............
...............MMMMMMM.MMMMMMM.MMM.MMM............
...............MMMMMMM.MMMMMMM.MMM.MMM............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WUWWWWWWWWWWWWWWWWWWWUW............
...............WUWWWWWWWWWWWWWWWWWWWUW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
.......MMMMMMMMWWWWWWWWWWWWWWWWWWWWWWWMMMMMMM.....
.......MMMMMMMMWWWWWWWWWWWWWWWWWWWWWWWMMMMMMM.....
.......MMMMMMMMWWWWWWWWWWWWWWWWWWWWWWWMMMMMMM.....
.......WWWWWWWWWWWMMWWMMWWMWWMMWWMMWWWWWWWWWW.....
.......WWWWUWWWWWWMMWWMMWWMWWMMWWMMWWWWWWWWWW.....
.......WWWWUWWWWWWMMWWMMWWMWWMMWWMMWWWWWWWWWW.....
.......WWWWUWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWNNNNNNNNNNNNNNNNNWWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
EEEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrrrEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
.............M......MM..MM..MM.MMMMMM.............
.............MM.....MMM.MMMMMM.MMMMMMM............
.............MM.....MMM.MMMMMM.MMMMMMM............
.............WW.....WWWWWWWWWWWWWWWWWW............
.............WW.....WWWWWWWWWWWWWWWWWW............
.............WW.....WUWWWUWWWWWWUWWWUW............
.............WW.....WUWWWUWWWWWWUWWWUW............
.............WW.....WWWWWWWWWWWWWWWWWW............
.............WW.....WWWWWWWWWWWWWWWWWW............
.............WW.....WWWWWWWWWWWWWWWWWW............
.............WW.....WWWWWWWWWWWWWWWWWW............
.............WW.....WWWWWWWWWWWWWWWWWW............
.............WW.....WWWWWWWWWWWWWWWWWW............
.............WW.....WWWWWWWWWWWWWWWWWW............
.......MMMMMMMM.....WWWWWWWWWWWWWWWWWWMMMMMMM.....
.......MMMMMMMM.....WWWWWWWWWWWWWWWWWWMMMMMMM.....
.......MMMMMMMM.....WWWWWWWWWWWWWWWWWWMMMMMMM.....
.......WWWWWWWW.....WWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWUWWW.....WWWWWWWWWWWWWWWWWWWWWUWWW.....
.......WWWWUWWW.....WWWWWWWWWWWWWWWWWWWWWUWWW.....
.......WWWWUWWW.....WWWWWWWWWWWWWWWWWWWWWUWWW.....
.......WWWWWWWW.....WWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWW.....WWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWW.....WWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWW.....WWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
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
........WWWWWWW.......................WWWWWWW.....
.......WWWWWWWW......................WWWWWWWW.....
.......WWWWWWWW......................WWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....
.......WWWWWW............WW.............WWWWW.....
.......WWWWWW.............W.............WWWWW.....
..........WWW...........................WWW.......
..........WWW...........................WWW.......
..........WWW...........................WWW.......
..........WWW...........................WWW.......
..........WWW...........................WWW.......
..........WWW..WWWWWWWWWWWWWWWWWWWWWWW..WWW.......
..........WWW..WWWWWWWWWWWWWWWWWWWWWWW..WWW.......
..........WWW..WWWWWWWWWWWWWWWWWWWWWWW..WWW.......
..........WWW..WWWWW............WWWWWW..WWW.......
..........WWW..WWWWW............WWWWWW..WWW.......
..........WWW..WWWWW............WWWWWW..WWW.......
..........WWW..WWWWW............WWWWWW..WWW.......
..........WWW..WWWWW............WWWWWW..WWW.......
..........WWW..WWWWW............WWWWWW..WWW.......
..........WWW..WWWWW............WWWWWW..WWW.......
..........WWW..WWW.................WWW..WWW.......
..........WWW..WWW.................WWW..WWW.......
..........WWW..WWWWW...............WWW..WWW.......
..........WWW..WWWWW...............WWW..WWW.......
..........WWW..WWWWW...............WWW..WWW.......
..........WWW..WWNoooooooooooooooooNWW..WWW.......
..........WWW..WWNoooooooooooooooooNWW..WWW.......
........WWWWW..WWNoooooooooooooooooNW...WWWWW.....
.......WWWWWW...........................WWWWW.....
.......WWWWWW...........................WWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWWWWNoooooooooooooooooNWWWWWWWWW.....
.......WWWWWWWW......................WWWWWWWW.....
.......WWWWWWWW......................WWWWWWWW.....
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
........MM..M.M.......................MM..M.M.....
.......M....................................M.....
..................................................
.......M......M......................M......M.....
..............M......................M............
..............M.......................M...........
.......M.................WW.................M.....
.......MMM..M.............W.............MM..M.....
..................................................
..................................................
..................................................
..................................................
..................................................
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWW............WWWWWW............
...............WWWWW............WWWWWW............
...............WWWWW............WWWWWW............
...............WWWWW............WWWWWW............
...............WWWWW............WWWWWW............
...............WWWWW............WWWWWW............
...............WWWWW............WWWWWW............
...............WWW.................WWW............
...............WWW.................WWW............
...............WWWWW...............WWW............
...............WWWWW...............WWW............
...............WWWWW...............WWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
..........MM...WWWWWWWWWWWWWWWWWWWWWW...M..MM.....
.......M....M...........................M...M.....
.......M..........................................
..............M......................MM.....M.....
.....................................M............
.......M..........................................
..............M.............................M.....
.......MM.M..MM......................MM.M..MM.....
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000kkkkhkkk0000000000000000000000kkkhkkkk0000000
EEEEEMWWWWWWEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWMEEEEEEE   00000khhhhhhk0000000000000000000000khhhhhhk0000000
EEEEEWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEMWWWWWWEEEEEEEE   00000khhhhhhh0000000000000000000000khhhhhhk0000000
EEEEEMWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMEEEEEEE   00000khhhhhhkaaaaaaaaaaaaaaaaaaaaaahhhhhhhk0000000
EEEEEWWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEEEE   00000hhhhhhhkaaaaaaaaaaaaaaaaaaaaaakhhhhhhh0000000
EEEEEWWWWWWMcWWWWWWWWWWWWWWWWWWWWWWMcWWWWWEEEEEEEE   00000khhhhhkkaaaaaaaaaaaaaaaaaaaaaakkhhhhhk0000000
EEEEEMWWWWcccccccccccMccccccccccccccccWWWWMEEEEEEE   00000khhhk0000000000ww000000000000000khhhhk0000000
EEEEEMWWWMcccccccccccMccccccccccccccccWWWWMEEEEEEE   00000khkkk0000000000ww000000000000000kkkhkk0000000
EEEEEEEEWWccccccccccccccccccccccccccccWWEEEEEEEEEE   0000000aaa000000000000000000000000000aaa0000000000
EEEEEEEEWWccccccccccccccccccccccccccccWWEEEEEEEEEE   0000000aaa000000000000000000000000000aaa0000000000
EEEEEEEEWWccccccccccccccccccccccccccccWWEEEEEEEEEE   0000000aaa000000000000000000000000000aaa0000000000
EEEEEEEEWWccccccccccccccccccccccccccccWWEEEEEEEEEE   0000000aaa000000000000000000000000000aaa0000000000
EEEEEEEEWWccccccccccccccccccccccccccccWWEEEEEEEEEE   0000000aaa000000000000000000000000000aaa0000000000
EEEEEEEEWWcccMMWWMMWWMMWWMMWWMMWWMMcccWWEEEEEEEEEE   0000000aaa00wwwtwwwtwwwtwwwtwwwtwww00aaa0000000000
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEEEEEEE   0000000aaa00wtttttttttttttttttttttw00aaa0000000000
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEEEEEEE   0000000aaa00wtttttttttttttttttttttw00aaa0000000000
EEEEEEEEWWcccWWWWUWWWWWWWWWWWWWWWWWcccWWEEEEEEEEEE   0000000aaa00tttttwssssssssssssssttt00aaa0000000000
EEEEEEEEWWcccWWWWMWWWWWWWWWWWWWWWWWcccWWEEEEEEEEEE   0000000aaa00wtttwwssssssssssssssttw00aaa0000000000
EEEEEEEEWWcccWWUUUUUUUUUUUUUUUUUWWWcccWWEEEEEEEEEE   0000000aaa00wttsssssssssssssssssttw00aaa0000000000
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEEEEEEE   0000000aaa00wttsssssssssssssssssttw00aaa0000000000
EEEEEEEEWWcccWWWWUWWWWWWWWWWWWWWWWWcccWWEEEEEEEEEE   0000000aaa00ttttwwsssssssssssswwttt00aaa0000000000
EEEEEEEEWWcccWWWWMWWWUWWWUWWWUMWWWWcccWWEEEEEEEEEE   0000000aaa00wttttwsssssssssssswtttw00aaa0000000000
EEEEEEEEWWcccWWWWMWWWWWWWWWWWWMWWWWcccWWEEEEEEEEEE   0000000aaa00wttttwsssssssssssswtttw00aaa0000000000
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEEEEEEE   0000000aaa00ttttttssssssssssssttttt00aaa0000000000
EEEEEEEEWWcccWWWWUWWWWWWWWWWWWWWWWWcccWWEEEEEEEEEE   0000000aaa00wttttwsssssssssssswtttw00aaa0000000000
EEEEEEEEWWcccWWWMUUUUUUUUUUUUUMWWWWcccWWEEEEEEEEEE   0000000aaa00wtttwwsssssssssssswtttw00aaa0000000000
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEEEEEEE   0000000aaa00wttssssssssssssssswtttw00aaa0000000000
EEEEEEEEWWcccWWWWWWWWWWWWWWWWWMWWWWcccWWEEEEEEEEEE   0000000aaa00tttssssssssssssssswwttt00aaa0000000000
EEEEEEEEWWcccWWWMMUUUUUUUUUUUUUUUWWcccWWEEEEEEEEEE   0000000aaa00wtttwwssssssssssssssttw00aaa0000000000
EEEEEEEEWWcccWWWWMUUUUUUUUUUUUUUUWWcccWWEEEEEEEEEE   0000000aaa00wttttwsssssssssssssswtw00aaa0000000000
EEEEEEEWWWcccMMWccUUUUUUUUUUUUUUcMMcccWWEEEEEEEEEE   00000kkkhk00wwwtwwsssssssssssssswww00kkkhkk0000000
EEEEEMWWWWccccccccccccccccccccccccccccWWWWMEEEEEEE   00000khhhk000000000000000000000000000khhhhk0000000
EEEEEWWWWWccccccccccccccccccccccccccccWWWWMEEEEEEE   00000khhhh000000000000000000000000000hhhhhk0000000
EEEEEMWWWWWMMWWWWNMMWWMMWWMMWWMMMWWMWWWWWWWEEEEEEE   00000khhhhhkkaaaahhhehhhehhhhehhhaakkhhhhhh0000000
EEEEEWWWWWWWMWWWWNWWWWWWWWWWWWWWMWWWWWWWWWEEEEEEEE   00000hhhhhhhkaaaaheeeeeeeeeeeeeehaahhhhhhhk0000000
EEEEEWWWWWWWWWWWWNMMWrMMrWMMrWMMMWWWWWWWWWMEEEEEEE   00000khhhhhhkaaaahhhehhhhehhhehhhaakhhhhhhk0000000
EEEEEMWWWWWWWEEEEErrrrrrrrrrrrrrrEEMWWWWWWEEEEEEEE   00000khhhhhhh0000000000000000000000khhhhhhk0000000
EEEEEMWWWWWWMEEEEErrrrrrrrrrrrrrrEEMWWWWWWMEEEEEEE   00000kkkhkkkk0000000000000000000000kkkkhkkk0000000
EEEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEErrrrrrrrrrrrrrrEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   0000000kkkkhkkk0000000000000000000000000kkkhkkkk00
EEEEEEEEWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWMEE   0000000khhhhhhk0000000000000000000000000khhhhhhk00
EEEEEEEEWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEMWWWWWWEEE   0000000khhhhhhk0000000000000000000000000khhhhhhk00
EEEEEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMEE   0000000hhhhhhhhaaaaaaaaaaaaaaaaaaaaaaaaahhhhhhhk00
EEEEEEEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEE   0000000khhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaakhhhhhhh00
EEEEEEEEWWWWWcMWWWWWWWWWWWWWWWWWWWWWWWWWMcWWWWWEEE   0000000khhhhhkkaaaaaaaaaaaaaaaaaaaaaaaaakkhhhhhk00
EEEEEEEEWWWWcccccccccccccccccccMcccccccccccWWWWMEE   0000000khhhhk00000000000000000ww0000000000khhhhk00
EEEEEEEEWWWWMccccccccccccccccccMcccccccccccWWWWMEE   0000000kkhkkk00000000000000000ww0000000000kkhkkk00
EEEEEEEEEEWWWccccccccccccccccccccccccccccccWWEEEEE   0000000000aaa00000000000000000000000000000aaa00000
EEEEEEEEEEWWWccccccccccccccccccccccccccccccWWEEEEE   0000000000aaa00000000000000000000000000000aaa00000
EEEEEEEEEEWWWccccccccccccccccccccccccccccccWWEEEEE   0000000000aaa00000000000000000000000000000aaa00000
EEEEEEEEEEWWWccccccccccccccccccccccccccccccWWEEEEE   0000000000aaa00000000000000000000000000000aaa00000
EEEEEEEEEEWWWccccccccccccccccccccccccccccccWWEEEEE   0000000000aaa00000000000000000000000000000aaa00000
EEEEEEEEEEWWWccMMWWMMWWMMWWMWWMMWWMMWWMMcccWWEEEEE   0000000000aaa00wwwtwwwtwwwtwtwwwtwwwtwww00aaa00000
EEEEEEEEEEWWWccMWWWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEE   0000000000aaa00wtttttttttttttttttttttttw00aaa00000
EEEEEEEEEEWWWccWWWWWWWWWWWWWWWWWWWWWWWWWcccWWEEEEE   0000000000aaa00wtttttttttttttttttttttttw00aaa00000
EEEEEEEEEEWWWccWWWUUUUUUUUUUUUUUUUUUUUWWcccWWEEEEE   0000000000aaa00tttsssssssssssssssssssttt00aaa00000
EEEEEEEEEEWWWccMWMUUUUUUUUUUUUUUUUUUUUWWcccWWEEEEE   0000000000aaa00wtwsssssssssssssssssssttw00aaa00000
EEEEEEEEEEWWWccMWUUUUUUUUUUUUUUUUUUMWWWWcccWWEEEEE   0000000000aaa00wtwssssssssssssssssswwttw00aaa00000
EEEEEEEEEEWWWccWWWUUUUUUUUUUUUUUUUUMWWWWcccWWEEEEE   0000000000aaa00wttssssssssssssssssswtttw00aaa00000
EEEEEEEEEEWWWccWWMUUUUUUUUUUUUUUUUUWWWWWcccWWEEEEE   0000000000aaa00ttwssssssssssssssssswtttt00aaa00000
EEEEEEEEEEWWWccMWMUUUUUUUUUUUUUUUUUWWWWWcccWWEEEEE   0000000000aaa00wtwsssssssssssssssssttttw00aaa00000
EEEEEEEEEEWWWccWWUUUUUUUUUUUUUUUUUUMWWWWcccWWEEEEE   0000000000aaa00wtwssssssssssssssssswtttw00aaa00000
EEEEEEEEEEWWWccWWWUUUUUUUUUUUUUUUUUMWWWWcccWWEEEEE   0000000000aaa00tttssssssssssssssssswtttw00aaa00000
EEEEEEEEEEWWWccMWMUUUUUUUUUUUUUUUUUWWWWWcccWWEEEEE   0000000000aaa00wtwsssssssssssssssssttttw00aaa00000
EEEEEEEEEEWWWccMWMUUUUUUUUUUUUUUUUUWWWWWcccWWEEEEE   0000000000aaa00wtwssssssssssssssssswtttt00aaa00000
EEEEEEEEEEWWWccWWUUUUUUUUUUUUUUUUUUMWWWWcccWWEEEEE   0000000000aaa00wtwssssssssssssssssswtttw00aaa00000
EEEEEEEEEEWWWccWWWUUUUUUUUUUUUUUUUUMWWWWcccWWEEEEE   0000000000aaa00tttssssssssssssssssswwttw00aaa00000
EEEEEEEEEEWWWccMWMUUUUUUUUUUUUMMUUMUUUWWcccWWEEEEE   0000000000aaa00wtwssssssssssssvvvsvssttw00aaa00000
EEEEEEEEEEWWWccMWMUUUUUUUUUUUUUUUUUUUUWWcccWWEEEEE   0000000000aaa00wtwssssssssssssvssssssttt00aaa00000
EEEEEEEEEEWWWccMMUUUUUUUUUUUUUUUUUUUUWWWcccWWEEEEE   0000000000aaa00wwwsssssssssssswwwtwwtttw00aaa00000
EEEEEEEEEEWWWccUUUUUUUUUUUUUUUMWWWWWWWWWcccWWEEEEE   0000000000aaa00vsssssssssssssswttttttttw00aaa00000
EEEEEEEEEEWWWccMUUUUUUUUUUUUUUMWWWWWWWWMcccWWEEEEE   0000000000aaa00vvvsvvvsvvvsvvswwwtwwtwww00aaa00000
EEEEEEEEWWMMMccccccccccccccccccccccccccccccWWMMMEE   0000000kkhkkk00000000000000000000000000000kkhkkk00
EEEEEEEEWWWWcccccccccccccccccccccccccccccccWWWWEEE   0000000khhhhk00000000000000000000000000000khhhhk00
EEEEEEEEWWWWWcccccccccccccccccccccccccccccWWWWWMEE   0000000khhhhhkkehhehhhehhhehhhaaaaaaaaaakkhhhhhk00
EEEEEEEEWWWWWWWWWWWWWWWWWWWWWWNWWWWWWWWWWWWWWWWEEE   0000000hhhhhhhkeeeeeeeeeeeeeehaaaaaaaaaakhhhhhhk00
EEEEEEEEWWWWWWWWWWWWWWWWWWWWWMNWWWWWWWWWWWWWWWWWEE   0000000khhhhhhhehhehhhehhhehhhaaaaaaaaaahhhhhhhh00
EEEEEEEEWWWWWWWrrrrrrrrrrrrrrrEEEEEEEEEEMWWWWWWMEE   0000000khhhhhhk0000000000000000000000000khhhhhhk00
EEEEEEEEWWWWWWWrrrrrrrrrrrrrrrEEEEEEEEEEMWWWWWWMEE   0000000khhhhhhk0000000000000000000000000khhhhhhk00
EEEEEEEEMEMWEMMrrrrrrrrrrrrrrrEEEEEEEEEEMMEWMEMEEE   0000000kkkkhkkk0000000000000000000000000kkkhkkkk00
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEErrrrrrrrrrrrrrrEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.53 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 133 nodi, 480 passi, finito in 302 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro (marcatore), E=erba (marcatore), K=pinK, c=selciato_cortile, f=fawn, W=pietra_forte, t=teal, Q=aQua, G=Green, r=strada_maestra, d=dead, dark, a=acqua_pozzo, h=honey, m=magenta, n=brown, M=merlatura, o=ferramenta_porta, N=cornice_portale, U=feritoia, L=apertura_finestra, I=tavole_quercia, F=solaio_pietra, q=aqua, O=portone_chiuso, #90=? (marcatore), #91=? (marcatore).
Alla fine: W 100512, o 10260, E 4750, U 2619, M 1968, c 1441, N 1040, F 700, r 525, O 240, L 15, a 1.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#6-39 prl×5, all×21, one×3: 308 celle x3-17 y3-19 z0, passi 2-51
   #45 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 52
    #47 all . W → W W passi=23: ×23, 16675 celle x20-84 y20-84 z1-23, passi 53-75, .→W 16675
#48-49 all×2: 11200 celle x35-69 y80-84 z0-32, passi 76-107
    #50 all . t → t W passi=39: ×39, 62400 celle x15-89 y15-89 z0-39, passi 108-146, t→W 31200, .→t 31200
#51-52 all×2: 4250 celle x30-74 y26-74 z0-3, passi 147-150
    #55 all . K → K W passi=63: ×63, 89208 celle x30-74 y26-74 z3-66, passi 151-213, K→W 44604, .→K 44604
    #56 all . d → d O passi=1: ×1, 350 celle x35-69 y70-74 z0-1, passi 214, d→O 175, .→d 175
    #57 all . d → d W passi=63: ×63, 22050 celle x35-69 y70-74 z1-64, passi 215-277, d→W 11025, .→d 11025
    #58 all . f → f I (+1) passi=1: ×1, 1400 celle x35-69 y45-69 z0-1, passi 278, f→I 700, .→f 700
      r1 . f → f I ×700; r2 . s → s I ×0
    #60 all . f → f . passi=30: ×30, 42000 celle x35-69 y45-69 z1-31, passi 279-308, f→. 21000, .→f 21000
    #62 all . f → f F (+1) passi=1: ×1, 1400 celle x35-69 y45-69 z31-32, passi 309, f→F 700, .→f 700
      r1 . f → f F ×700; r2 . s → s F ×0
    #63 all . f → f . (+1) passi=31: ×31, 43400 celle x35-69 y45-69 z32-63, passi 310-340, f→. 21700, .→f 21700
      r1 . f → f . ×21700; r2 . s → s . ×0
    #64 prl f → W (+8): ×1, 2559 celle x15-89 y15-89 z1-66, passi 341, t→W 800, K→W 708, f→W 700, d→W 175, +2
      r1 f → W ×700; r2 s → W ×0; r3 K → W ×708; r4 d → W ×175; r5 t → W ×800; r6 W → W ×0; r7 G → W ×175; r8 P → . ×0; r9 q → . ×1
     #71 all . I → I * passi=30: ×30, 21000 celle x35-69 y45-69 z1-30, passi 342-371, .→I 21000
     #76 prl I → . passi=1: ×1, 21700 celle x35-69 y45-69 z0-30, passi 372, I→. 21700
#101-103 all×3: 11190 celle x34-70 y69-84 z0-30, passi 373-403
#104-132 all×9, prl×2, one×1: 16831 celle x15-89 y15-89 z0-72, passi 404-480
Senza effetto (non hanno mai cambiato una cella):
#5 prl E/H → H/E passi=1
#7 prl EH → HE passi=1
#10 prl h/E → */h passi=1
#17 one KKKKKKK/Kffffff/Kffffff → *******/**ssss*/**ssss* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#22 all cEEEEEE → *ccc*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#23 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#40 one cW/cc → PW/** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#41 all Pc → *P passi=2: in quel momento nella griglia non c'erano celle "P"
#42 all cEEEEEEE → *uuuu*** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#43 all uE/*u → *u/**: in quel momento nella griglia non c'erano celle "u"
#53 all . P → P p passi=31: in quel momento nella griglia non c'erano celle "P"
#54 all . P → P R passi=1: in quel momento nella griglia non c'erano celle "P"
… e altri 50
Fix it and answer with the whole program.

## Risposta

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
