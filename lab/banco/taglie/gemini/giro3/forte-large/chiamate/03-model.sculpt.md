# model.sculpt · gemini-3.8-flash · 22 s

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
<!-- Forte medievale: cortina quadrangolare, torri d'angolo, mastio interno con scala a due livelli, porta e ponte levatoio -->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEKWhtsGrpvi" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Stabilire il corpo del mastio (K) attorno a H con semi-variabilità -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>

      <!-- Mura del mastio (K) ed interno abitabile (h) -->
      <all in="hE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>

      <!-- Zona scala (s: 4x2 lungo asse x, adagiata a una parete nord interna) -->
      <one in="KKKKKKK/Khhhhhh/Khhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- 2. Cortile (i) attorno al mastio -->
      <all in="KE" out="*i" steps="3"/>
      <all in="iE/*i" out="*i/**"/>

      <!-- Espansione del cortile su taglia Huge -->
      <all in="iEEEEEE" out="*iii***" steps="1"/><all in="iE/*i" out="*i/**"/>
      <all in="EEEEEE/i" out="***iii/*" steps="1" symmetry="()"/><all in="iE/*i" out="*i/**"/>
      <all in="i/EEEEEE" out="*/***iii" steps="1" symmetry="()"/><all in="iE/*i" out="*i/**"/>

      <!-- Mura di cinta (W) attorno al cortile -->
      <all in="iE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri angolari (t: 3x3 celle) -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- 3. Asse d'ingresso a sud: porta mastio, cortile, portaia (G), strada (r) -->
      <!-- Trova la parete sud del mastio -->
      <one in="h/K/i" out="*/d/*" symmetry="(x)" steps="1"/>
      <all in="d/i" out="*/r" symmetry="()"/>
      <all in="r/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <!-- Allarga a 3 celle (15 voxels) per il portone -->
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="r[iE]" out="*r" symmetry="(x)" steps="1"/>
      <all in="d" out="r"/>

      <!-- Pozzo nel cortile per taglie grandi -->
      <one in="iiiii/iiiii/iiiii" out="**p**/**p**/**p**" steps="1"/>
    </sequence>

    <!-- Ritorno alla scala 1:1 dei voxel -->
    <map scale="5 5 1" values="BEWKhstGrpviFfTokNMUL#90#91#92#94" symmetry="()">
      <!-- Terreno e pavimentazioni -->
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="K" out="KKKKK/KKKKK/KKKKK/KKKKK/KKKKK"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>

      <sequence symmetry="(xy)">
        <!-- Unioni per le parti importate -->
        <union symbol="+" values="W K G t"/>
        <union symbol="%" values="W K t"/>
        <union symbol="=" values="F f"/>

        <!-- ================= Livello B: Elevazione volumi ================= -->
        <!-- Cortina muraria esterna (W): alta 24 voxel -->
        <all in="B W" out="W W" steps="23"/>

        <!-- Portaia (G): alta 32 voxel con passaggio carrabile -->
        <all in="B G" out="G G" steps="31"/>

        <!-- Torri angolari (t): alte 40 voxel -->
        <all in="B t" out="t t" steps="39"/>

        <!-- Mastio (K, h, s): due piani di 32 voxel ciascuno (totale 64 voxel) -->
        <!-- Pareti mastio (K): salgono 64 voxel -->
        <all in="B K" out="K K" steps="63"/>

        <!-- Pavimento piano terra mastio (z=0 è f) -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>

        <!-- Striscia della scala T: al piano terra a z=1 nella zona s -->
        <all in="B s" out="s T" steps="1"/>

        <!-- Aria primo piano (fino a z=31) -->
        <all in="B h" out="h B" steps="30"/>
        <all in="B s" out="s B" steps="29"/>

        <!-- Solaio interpiano mastio a z=32 (spessore F) -->
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>

        <!-- Aria secondo piano (fino a z=63) -->
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>

        <!-- Tetto/piattaforma sommitale del mastio a z=64 -->
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>

        <!-- Pozzo nel cortile: muretto alto 8 voxel, acqua al centro -->
        <all in="B p" out="p W" steps="8"/>

        <!-- ================= Livello C: Dettaglio e parti ================= -->
        <!-- Inserimento scale -->
        <import file="part-stair"/>

        <!-- Apertura portaia esterna (G): portone O largo 15 voxel a z=1..30 -->
        <all in="G/r" out="O/*" symmetry="()" steps="1"/>
        <all in="G/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Apertura porta del mastio (K): porta O verso il cortile -->
        <all in="K/r" out="O/*" symmetry="()" steps="1"/>
        <all in="K/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Inserimento porte -->
        <import file="part-door"/>

        <!-- Merli sulle mura e sulle torri -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Finestre mastio al piano nobile (z=42..48) -->
        <one in="BBBBB/BKKKB" out="*****/*UUU*" steps="4" symmetry="()"/>

        <!-- Pulizia marcatori e convergenza materiali -->
        <prl><rule in="K" out="W"/><rule in="G" out="W"/><rule in="t" out="W"/><rule in="p" out="W"/></prl>
        <prl in="r" out="i"/>
      </sequence>
    </map>
  </map>

  <!-- Palette completa dei materiali del forte -->
  <color symbol="E" value="#4a6e38" name="terreno" hidden="True"/>
  <color symbol="H" value="#706d64" name="centro" hidden="True"/>
  <color symbol="W" value="#66635b" name="pietra" area="courtyard"/>
  <color symbol="f" value="#9e7c52" name="tavole" area="keep"/>
  <color symbol="F" value="#504d46" name="lastre" area="keep"/>
  <color symbol="i" value="#787367" name="ciottoli" area="courtyard"/>
  <color symbol="k" value="#8c6f43" name="gradini" area="keep"/>
  <color symbol="O" value="#3a2312" name="portone"/>
  <color symbol="o" value="#2a180b" name="chiodature"/>
  <color symbol="N" value="#4d4135" name="telaio"/>
  <color symbol="M" value="#5a5750" name="merli"/>
  <color symbol="U" value="#1a1c1e" name="feritoia"/>

  <!-- Azioni interattive -->
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="B"/><rule in="o" out="B"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="B" out="O"/></all>
  </action>
</sequence>
It does not pass: taglia Grande, seme 1: piani: 0 (serve ≥ 2); stanza: la più grande in cui si sta in piedi ha il lato di 20 voxel (1,00 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, W pietra, h honey, s slate, i ciottoli, F lastre, f tavole, k gradini, M merli, U feritoia
Plan (the letter on top of every column):
```
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
EEEWWWWWWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEWWWWWWWiiiiiiiiiiWWWiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEWWWWWWMiiiiiiiiiiWWWiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEEEEEEWWiiiiiiiiiiWWWiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEEEEEEWWiiiiiiiiiiWWWiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEEEEEEWWiiiiiiiiiiWWWiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEEEEEEWWiiiiiiiiiiWWWiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEEEEEEWWiiiiiiiiiiWWWiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEEEEEEWWiiiWWWWWWWWWWWWWWWWWWWWWWWWWWWiiiiiiiiWW
EEEEEEEEWWiiiWWWWWWWWWWWWWWWWWWWWWWWWWWWiiiiiiiiWW
EEEEEEEEWWiiiWWhhhhhsssssssssshhhhhWWWWWiiiiiiiiWW
EEEEEEEEWWiiiWWhhhhhsssssssssshhhhhWWWWWiiiiiiiiWW
EEEEEEEEWWiiiWWhhhhhsssssssssshhhhhWWWWWiiiiiiiiWW
EEEEEEEEWWiiiWWhhhhhsssssssssshhhhhhhhWWiiiiiiiiWW
EEEEEEEEWWiiiWWhhhhhsssssssssshhhhhhhhWWiiiiiiiiWW
EEEEEEEEWWiiiWWWWWhhhhhhh..hhhhhhhhWWWWWiiiiiiiiWW
EEEEEEEEWWiiiWWWWWhhhhhhh..hhhhhhhhWWWWWiiiiiiiiWW
EEEEEEEEWWiiiWWWWWhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiWW
EEEEEEEEWWiiiWWWWWhhhhhhhhhhhhhhhhhhhhWWiiiiiiiiWW
EEEEEEEEWWiiiWWWWWhhhhhhhhhhhhhhhhhhhhWWiiiiiiiiWW
EEEEEEEEWWiiiWWhhhhhhhhhhhhhhhhhhhhhhhWWiiiiiiiiWW
EEEEEEEEWWiiiWWhhhhhhhhhhhhhhhhhhhhhhhWWiiiiiiiiWW
EEEEEEEEWWiiiWWhhhhhhhhhhhhhhhhhhhhhhhWWiiiiiiiiWW
EEEEEEEEWWiiiWWhhhhhhhhhhhhhhhhhhhhhhhWWiiiiiiiiWW
EEEEEEEEWWiiiWWhhhhhhhhhhhhhhhhhhhhhhhWWiiiiiiiiWW
EEEEEEEEWWiiiWWWWWWWWWWWWWWWWWiiiiiiiiWWiiiiiiiiWW
EEEEEEEEWWiiiWWWWWWWWWWWWWWWWWiiiiiiiiWWiiiiiiiiWW
EEEEEEEWWWiiiMMWiMMWiMWiMMWiMMiiiiiiiiMMiiiiiiiiWW
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiWW
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiWWW
EEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
EEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00khhhhhhhhhhhk00000000000000000000000000000000000
00khhhhhhhhhhhh00000000000000000000000000000000000
00hhhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
00khhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
00khhhhhhhkhkkkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
00khhhhhhk0000000000000000000000000000000000000aaa
00hhhhhhhh0000000000000000000000000000000000000aaa
00khhhhhhk0000000000444000000000000000000000000aaa
00khhhhhhk0000000000444000000000000000000000000aaa
00kkkhkkkk0000000000444000000000000000000000000aaa
0000000aaa0000000000444000000000000000000000000aaa
0000000aaa0000000000444000000000000000000000000aaa
0000000aaa0000000000444000000000000000000000000aaa
0000000aaa0000000000444000000000000000000000000aaa
0000000aaa0000000000444000000000000000000000000aaa
0000000aaa0000000000000000000000000000000000000aaa
0000000aaa0000000000000000000000000000000000000aaa
0000000aaa00vvvsvvvsvvvsvvvvsvvvsvvvsvvv0000000aaa
0000000aaa00vssssssssssssssssssssssssssv0000000aaa
0000000aaa00vssssssssssssssssssssssssssv0000000aaa
0000000aaa00ssssssssssssssssssssssssssss0000000aaa
0000000aaa00vssssssssssssssssssssssssssv0000000aaa
0000000aaa00vssssssssssssssssssssssssssv0000000aaa
0000000aaa00vssssssssssssssssssssssssssv0000000aaa
0000000aaa00ssssssssssssssssssssssssssss0000000aaa
0000000aaa00vssssssssssss..ssssssssssssv0000000aaa
0000000aaa00vssssssssssss..ssssssssssssv0000000aaa
0000000aaa00ssssssssssssssssssssssssssss0000000aaa
0000000aaa00vssssssssssssssssssssssssssv0000000aaa
0000000aaa00vssssssssssssssssssssssssssv0000000aaa
0000000aaa00ssssssssssssssssssssssssssss0000000aaa
0000000aaa00vssssssssssssssssssssssssssv0000000aaa
0000000aaa00vssssssssssssssssssssssssssv0000000aaa
0000000aaa00vssssssssssssssssssssssssssv0000000aaa
0000000aaa00ssssssssssssssssssssssssssss0000000aaa
0000000aaa00vsssssssssssssssss0000000ssv0000000aaa
0000000aaa00vssssssssssssssssv0000000vsv0000000aaa
00kkkkhkkk00vvvsvvvsvvsvvvsvvv0000000vvv0000000aaa
00khhhhhhk0000000000000000000000000000000000000aaa
00khhhhhhk0000000000000000000000000000000000000aaa
00hhhhhhhh0000000000000000000000000000000000000aaa
00khhhhhhk0000000000000000000000000000000000000aaa
00khhhhhhkkhkkkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
00khhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
00hhhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
00khhhhhhhhhhhh00000000000000000000000000000000000
00khhhhhhhhhhhk00000000000000000000000000000000000
00khhhhhhhhhhhk00000000000000000000000000000000000
00hhhhhhhhhhhhh00000000000000000000000000000000000
00khhhhhhhhhhhh00000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
............MMM.MMM.MMMMMMMMMMMM.MMM.MMM..........
............MMM.MMM.MMMMMMMMMMMM.MMM.MMM..........
............MMMhMMMhMMhMMMhMMMhhhhhhhMMM..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..MMMMMMMMM.MMMWWWWWWWWWWWWWWWWWWWWWWWWW..........
..MMMMMMMMM.MMMWWWWWWWWWWWWWWWWWWWWWWWWW..........
..MMMMMMMMM.MMMWWWWWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..UUUUUUUUUUUUUWWWWWWWWWWWWWWWWWWWWWWWWW..........
..UUUUUUUUUUUUUWWWWWWWWWWWWWWWWWWWWWWWWW..........
..UUUUUUUUUUUUUWWWWWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
EEWWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
.................MMM.MMM.MM.MM.MMM.MMM............
.................MMM.MMM.MM.MM.MMM.MMM............
.................MMMhMMMhMMhMMhMMMhMMM............
.................WWWWWWWWWWWWWWWWWWWWW............
.................WWWWWWWWWWWWWWWUWWWUW............
.................WWWWWWWWWWWWWWWUWWWUW............
.................WWWWWWWWWWWWWWWUWWWUW............
.................WWWWWWWWWWWWWWWWWWWWW............
.................WWWWWWWWWWWWWWWWWWWWW............
.................WWWWWWWWWWWWWWWWWWWWW............
.................WWWWWWWWWWWWWWWWWWWWW............
.................WWWWWWWWWWWWWWWWWWWWW............
MMMMMM.MMM.......WWWWWWWWWWWWWWWWWWWWWMM.MMMMMMM.M
MMMMMM.MMM.......WWWWWWWWWWWWWWWWWWWWWMM.MMMMMMM.M
MMMMMM.MMM.......WWWWWWWWWWWWWWWWWWWWWMM.MMMMMMM.M
WWWWWWWWWW.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
UUUUUUUUUU.......WWWWWWWWWWWWWWWWWWWWWUUUUUUUUUUUU
UUUUUUUUUU.......WWWWWWWWWWWWWWWWWWWWWUUUUUUUUUUUU
UUUUUUUUUU.......WWWWWWWWWWWWWWWWWWWWWUUUUUUUUUUUU
WWWWWWWWWW.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWW.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWW.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWW.......WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
EEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..WWWWWWWWWWWWW...................................
..WWWWWWWWWWWWW...................................
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWW.....................................WWW
..WWWWWWWW.....................................WWW
..WWWWWWWW.....................................WWW
..WWWWWWWW.....................................WWW
..WWWWWWWW.....................................WWW
.......WWW.....................................WWW
.......WWW.....................................WWW
.......WWW.....................................WWW
.......WWW.....................................WWW
.......WWW.....................................WWW
.......WWW.....................................WWW
.......WWW.....................................WWW
.......WWW...WWWWWWWWWWWWWWWWWWWWWWWWWWW.......WWW
.......WWW..WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......WWW
.......WWW..WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......WWW
.......WWW..WWW.......kkkkkk.......WWWWW.......WWW
.......WWW..WWW.......kkkkkk.......WWWWW.......WWW
.......WWW..WWW.......kkkkkk.......WWWWW.......WWW
.......WWW..WWW.......kkkkkk.........WWW.......WWW
.......WWW..WWW.......kkkkkk.........WWW.......WWW
.......WWW..WWWWWW.................WWWWW.......WWW
.......WWW..WWWWWW.................WWWWW.......WWW
.......WWW..WWWWWW.................WWWWW.......WWW
.......WWW..WWWWWW...................WWW.......WWW
.......WWW..WWWWWW...................WWW.......WWW
.......WWW..WWW......................WWW.......WWW
.......WWW..WWW......................WWW.......WWW
.......WWW..WWW......................WWW.......WWW
.......WWW..WWW......................WWW.......WWW
.......WWW..WWW......................WWW.......WWW
.......WWW..WWWWWWWWWWWWWWWWWW.......WWW.......WWW
.......WWW..WWWWWWWWWWWWWWWWWW.......WWW.......WWW
...WWWWWWW...WWWWWWWWWWWWWWWWW........WW.......WWW
..WWWWWWWW.....................................WWW
..WWWWWWWW.....................................WWW
..WWWWWWWW.....................................WWW
..WWWWWWWW.....................................WWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
..WWWWWWWWWWWWW...................................
..WWWWWWWWWWWWW...................................
..WWWWWWWWWWWWW...................................
..WWWWWWWWWWWWW...................................
..WWWWWWWWWWWWW...................................
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..............M...................................
..M...............................................
..................................................
..............M...................................
..M.......M..MM...................................
..M......M........................................
..................................................
..................................................
..M......M........................................
..MMM..M.M........................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.............WWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWW....................WWWWW..........
............WWW....................WWWWW..........
............WWW....................WWWWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWWWWW.................WWWWW..........
............WWWWWW.................WWWWW..........
............WWWWWW.................WWWWW..........
............WWWWWW...................WWW..........
............WWWWWW...................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWWWWWWWWWWWWWWWWW.......WWW..........
............WWWWWWWWWWWWWWWWWW.......WWW..........
...M.M..MM...WWWWWWWWWWWWWWWWW........WW..........
..M......M........................................
..M......M........................................
..................................................
..................................................
..M.......M..MM...................................
..M...........M...................................
..............M...................................
..................................................
..M...............................................
..M...........M...................................
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
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00khhhhhhhhhhhk00000000000000000000000000000000000
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00khhhhhhhhhhhh00000000000000000000000000000000000
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00hhhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   00khhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEWWWWWWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   00khhhhhhhkhkkkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEWWWWWWWiiiiiiiiiiiiiiiWWWiiiiiiiiiiiiiiiiiiiiii   00khhhhhhk0000000000000004440000000000000000000000
EEEWWWWWWWiiiiiiiiiiiiiiiWWWiiiiiiiiiiiiiiiiiiiiii   00hhhhhhhh0000000000000004440000000000000000000000
EEEWWWWWWWiiiiiiiiiiiiiiiWWWiiiiiiiiiiiiiiiiiiiiii   00khhhhhhk0000000000000004440000000000000000000000
EEEWWWWWWWiiiiiiiiiiiiiiiWWWiiiiiiiiiiiiiiiiiiiiii   00khhhhhhk0000000000000004440000000000000000000000
EEEWWWWWWMiiiiiiiiiiiiiiiWWWiiiiiiiiiiiiiiiiiiiiii   00kkkkhkkk0000000000000004440000000000000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiWWWiiiiiiiiiiiiiiiiiiiiii   0000000aaa0000000000000004440000000000000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiWWWiiiiiiiiiiiiiiiiiiiiii   0000000aaa0000000000000004440000000000000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiWWiiiiiiiiiiiiiiiiiiiiiii   0000000aaa0000000000000004440000000000000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   0000000aaa0000000000000000000000000000000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   0000000aaa0000000000000000000000000000000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   0000000aaa0000000000000000000000000000000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   0000000aaa0000000000000000000000000000000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   0000000aaa00vvvsvvvsvvvsvvvvsvvvsvvvsvvv0000000000
EEEEEEEEWWiiiWWWWWWWWWWWWWWWWWWWWWWWWWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWWWWWWWWWWWWWWWWWWWWWWWWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWWWWhhhhhsssssssssshhhhhWWiiiiiiiiii   0000000aaa00ssssssssssssssssssssssssssss0000000000
EEEEEEEEWWiiiWWWWWhhhhhsssssssssshhhhhWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWWWWhhhhhsssssssssshhhhWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWWWWhhhhhsssssssssshhWWWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWWWWhhhhhsssssssssshhWWWWWiiiiiiiiii   0000000aaa00ssssssssssssssssssssssssssss0000000000
EEEEEEEEWWiiiWWhhhhhhhhhh..hhhhhhhhWWWWWiiiiiiiiii   0000000aaa00vssssssssssss..ssssssssssssv0000000000
EEEEEEEEWWiiiWWhhhhhhhhhh..hhhhhhhhWWWWWiiiiiiiiii   0000000aaa00vssssssssssss..ssssssssssssv0000000000
EEEEEEEEWWiiiWWhhhhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiii   0000000aaa00ssssssssssssssssssssssssssss0000000000
EEEEEEEEWWiiiWWWWWhhhhhhhhhhhhhhhhhhhhWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWWWWhhhhhhhhhhhhhhhhhhhhWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWhhhhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiii   0000000aaa00ssssssssssssssssssssssssssss0000000000
EEEEEEEEWWiiiWWhhhhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWhhhhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWWWWhhhhhhhhhhhhhhhhhhhhWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWWWWhhhhhhhhhhhhhhhhhhhhWWiiiiiiiiii   0000000aaa00ssssssssssssssssssssssssssss0000000000
EEEEEEEEWWiiiWWWWWWWiiiiiiiiWWWWWWWWWWWWiiiiiiiiii   0000000aaa00vsssssss0000000ssssssssssssv0000000000
EEEEEEEEWWiiiWWWWWWWiiiiiiiiWWWWWWWWWWWWiiiiiiiiii   0000000aaa00vssssssv0000000vsssssssssssv0000000000
EEEEEEEWWWiiiMMWiMiMiiiiiiiiMMWiMWiMWiMMiiiiiiiiii   00kkkkhkkk00vvvsvvvv0000000vvvsvvsvvsvvv0000000000
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   00khhhhhhk0000000000000000000000000000000000000000
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   00khhhhhhk0000000000000000000000000000000000000000
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   00hhhhhhhh0000000000000000000000000000000000000000
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   00khhhhhhk0000000000000000000000000000000000000000
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   00khhhhhhkkhkkkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   00khhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   00hhhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00khhhhhhhhhhhh00000000000000000000000000000000000
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00khhhhhhhhhhhk00000000000000000000000000000000000
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00khhhhhhhhhhhk00000000000000000000000000000000000
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00hhhhhhhhhhhhh00000000000000000000000000000000000
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00khhhhhhhhhhhh00000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00khhhhhhhhhhhk00000000000000000000000000000000000
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00khhhhhhhhhhhh00000000000000000000000000000000000
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00hhhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   00khhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEWWWWWWWWWWWMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   00khhhhhhhkhkkkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiWWWiiiiiiiiiiii   00khhhhhhk0000000000000000000000000444000000000000
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiWWWiiiiiiiiiiii   00hhhhhhhh0000000000000000000000000444000000000000
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiWWWiiiiiiiiiiii   00khhhhhhk0000000000000000000000000444000000000000
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiWWWiiiiiiiiiiii   00khhhhhhk0000000000000000000000000444000000000000
EEEWWWWWWMiiiiiiiiiiiiiiiiiiiiiiiiiWWWiiiiiiiiiiii   00kkkhkkkk0000000000000000000000000444000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiWWWiiiiiiiiiiii   0000000aaa0000000000000000000000000444000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiWWWiiiiiiiiiiii   0000000aaa0000000000000000000000000444000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiWWiiiiiiiiiiiii   0000000aaa0000000000000000000000000444000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   0000000aaa0000000000000000000000000000000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   0000000aaa0000000000000000000000000000000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   0000000aaa0000000000000000000000000000000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   0000000aaa0000000000000000000000000000000000000000
EEEEEEEEWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   0000000aaa00vvvsvvvsvvvsvvvvsvvvsvvvsvvv0000000000
EEEEEEEEWWiiiWWWWWWWWWWWWWWWWWWWWWWWWWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWWWWWWWWWWWWWWWWWWWWWWWWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWWWWhhhhhhhhhhhhhhhhhhhhWWiiiiiiiiii   0000000aaa00ssssssssssssssssssssssssssss0000000000
EEEEEEEEWWiiiWWWWWhhhhhhhhhhhhhhhhhhhhWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWWWhhhhhhhhhhhhhhhhhhhhWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWhhhhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWhhhhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiii   0000000aaa00ssssssssssssssssssssssssssss0000000000
EEEEEEEEWWiiiWWhhhhhhhhhh..hhhhhhhhWWWWWiiiiiiiiii   0000000aaa00vssssssssssss..ssssssssssssv0000000000
EEEEEEEEWWiiiWWhhhhhhhhhh..hhhhhhhhWWWWWiiiiiiiiii   0000000aaa00vssssssssssss..ssssssssssssv0000000000
EEEEEEEEWWiiiWWhhhhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiii   0000000aaa00ssssssssssssssssssssssssssss0000000000
EEEEEEEEWWiiiWWWWWhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWWWWhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWWWWhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiii   0000000aaa00ssssssssssssssssssssssssssss0000000000
EEEEEEEEWWiiiWWWWWhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWWWhhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWhhhhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiii   0000000aaa00vssssssssssssssssssssssssssv0000000000
EEEEEEEEWWiiiWWhhhhhhhhhhhhhhhhhhhhWWWWWiiiiiiiiii   0000000aaa00ssssssssssssssssssssssssssss0000000000
EEEEEEEEWWiiiWWiiiiiiiiWWWWWWWWWWWWWWWWWiiiiiiiiii   0000000aaa00vss0000000sssssssssssssssssv0000000000
EEEEEEEEWWiiiWWiiiiiiiiWWWWWWWWWWWWWWWWWiiiiiiiiii   0000000aaa00vsv0000000vssssssssssssssssv0000000000
EEEEEEEWWWiiiMMiiiiiiiiMMWiMMWiMWiMMWiMMiiiiiiiiii   00kkkkhkkk00vvv0000000vvvsvvvsvvsvvvsvvv0000000000
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   00khhhhhhk0000000000000000000000000000000000000000
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   00khhhhhhk0000000000000000000000000000000000000000
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   00hhhhhhhh0000000000000000000000000000000000000000
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   00khhhhhhk0000000000000000000000000000000000000000
EEEWWWWWWWiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   00khhhhhhkkhkkkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   00khhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW   00hhhhhhhhhhhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00khhhhhhhhhhhh00000000000000000000000000000000000
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00khhhhhhhhhhhk00000000000000000000000000000000000
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00khhhhhhhhhhhk00000000000000000000000000000000000
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00hhhhhhhhhhhhh00000000000000000000000000000000000
EEEWWWWWWWWWWWWEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00khhhhhhhhhhhh00000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.13 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 122 nodi, 432 passi, finito in 344 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: E=terreno (marcatore), K=pinK, W=pietra, h=honey, t=teal, s=slate, r=red, p=purple, i=ciottoli, d=dead, dark, F=lastre, f=tavole, T=Teal (marcatore), k=gradini, M=merli, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 119235, U 6840, i 3425, k 2720, F 2290, E 2100, f 1225, M 1224, h 1025, s 200.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-34 all×20, prl×2, one×3: 345 celle x1-19 y0-19 z0, passi 2-49
   #36 map scala 5 5 1: ×1, 9975 celle x0-99 y0-99 z0-79, passi 50
    #38 all . W → W W passi=23: ×23, 31050 celle x15-99 y5-89 z1-23, passi 51-73, .→W 31050
    #40 all . t → t t passi=39: ×39, 36075 celle x5-29 y0-99 z1-39, passi 74-112, .→t 36075
    #41 all . K → K K passi=63: ×63, 55125 celle x25-79 y35-74 z1-63, passi 113-175, .→K 55125
#42-43 all×2: 2850 celle x30-74 y40-69 z0-2, passi 176-177
    #44 all . h → h . passi=30: ×30, 61500 celle x30-74 y40-69 z1-31, passi 178-207, h→. 30750, .→h 30750
    #45 all . s → s . passi=29: ×29, 11600 celle x40-59 y40-49 z2-31, passi 208-236, s→. 5800, .→s 5800
    #46 all . h → h F (+1) passi=1: ×1, 2450 celle x30-74 y40-69 z31-32, passi 237, h→F 1025, .→h 1025, s→F 200, .→s 200
      r1 . h → h F ×1025; r2 . s → s F ×200
    #47 all . h → h . (+1) passi=31: ×31, 75950 celle x30-74 y40-69 z32-63, passi 238-268, h→. 31775, .→h 31775, s→. 6200, .→s 6200
      r1 . h → h . ×31775; r2 . s → s . ×6200
    #48 all . h → h F (+1) passi=1: ×1, 2450 celle x30-74 y40-69 z63-64, passi 269, h→F 1025, .→h 1025, s→F 200, .→s 200
      r1 . h → h F ×1025; r2 . s → s F ×200
#49-70 all×4, prl×1: 1740 celle x40-59 y15-49 z0-8, passi 270-295
     #71 all . #90 → #90 *: ×28, 4480 celle x40-55 y40-49 z3-30, passi 296-323, .→#90 4480
     #72 all = #90 → #90 *: ×1, 160 celle x40-55 y40-49 z31, passi 324, F→#90 160
     #73 prl #90 → . passi=1: ×1, 4800 celle x40-55 y40-49 z2-31, passi 325, #90→. 4800
#74-79 all×4, prl×2: 3030 celle x40-55 y40-49 z1-32, passi 326-374
#99-103 all×4, prl×1: 1536 celle x5-99 y0-99 z24-64, passi 375-382
#104-118 all×2, prl×1: 1776 celle x5-99 y0-99 z24-69, passi 383-389
     #119 all [.U]U% → **U: ×41, 6648 celle x5-78 y0-99 z32-61, passi 390-430, t→U 5472, K→U 1176
    #121 prl K → W (+3): ×1, 86235 celle x5-79 y0-99 z0-63, passi 431, K→W 54710, t→W 31450, p→W 75
      r1 K → W ×54710; r2 G → W ×0; r3 t → W ×31450; r4 p → W ×75
    #122 prl r → i: ×1, 150 celle x60-74 y70-79 z0, passi 432, r→i 150
Senza effetto (non hanno mai cambiato una cella):
#7 prl E/h → h/* passi=1
#17 all iE/*i → *i/**: le celle cercate c'erano, ma mai disposte come nel pattern
#28 all r/W → */G: le celle cercate c'erano, ma mai disposte come nel pattern
#29 all [Gr]/E → */r: le celle cercate c'erano, ma mai disposte come nel pattern
#31 all GW → *G passi=1: in quel momento nella griglia non c'erano celle "G"
#39 all . G → G G passi=31: in quel momento nella griglia non c'erano celle "G"
#51 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#52 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#53 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#54 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
#55 all . #96 → I * passi=1: in quel momento nella griglia non c'erano celle ""
#56 all . I → I * passi=30: in quel momento nella griglia non c'erano celle "I"
… e altri 39
Fix it and answer with the whole program.

## Risposta

<!-- Forte medievale: cortina quadrangolare con torri, mastio interno con scala a due livelli, porta e cortile -->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEKWhtsGrpvi" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Stabilire il cortile (i) attorno a H per contenere il forte -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      
      <!-- Allarga il cortile su taglia Huge -->
      <all in="hEEEEEE" out="*hhh***" steps="1"/><all in="hE/*h" out="*h/**"/>
      <all in="EEEEEE/h" out="***hhh/*" steps="1" symmetry="()"/><all in="hE/*h" out="*h/**"/>
      
      <prl in="h" out="i"/>
      <prl in="H" out="i"/>

      <!-- Mura di cinta esterne (W) attorno al cortile -->
      <all in="iE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri angolari (t: 2x2 celle di mappa = 10x10 voxel) -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- 2. Mastio (K) posizionato all'interno del cortile a nord (z=0, y piccolo) -->
      <!-- Trova una cella interna a nord e falla crescere grande abbastanza per la stanza (min 7x7) -->
      <one in="WWWWW/WiiiW" out="*****/**K**" symmetry="(x)" steps="1"/>
      <all in="Ki" out="*K" symmetry="(x)" steps="4"/>
      <all in="K/i" out="*/K" symmetry="()" steps="7"/>
      <!-- Svuota l'interno del mastio (h) lasciando le pareti (K) spesse 1 cella -->
      <all in="KKK/KKK/KKK" out="***/ h /***" steps="1"/>
      <all in="hi" out="Ki"/>
      <all in="hK/*i" out="*K/**"/>
      <all steps="6"><rule in="hK" out="*h"/><rule in="h*/*K" out="**/*h"/></all>
      <all in="hi" out="Ki"/>
      <!-- Pareti K ripristinate dove h tocca i -->
      <all in="h" out="K"/>
      <all in="KKK/KKK/KKK" out="***/ h /***" steps="1"/>
      <all steps="5"><rule in="hK" out="*h"/><rule in="h*/*K" out="**/*h"/></all>

      <!-- Zona scala interna (s: 4x2 lungo x, orientata verso +x) appoggiata alla parete nord interna -->
      <one in="KKKKKKK/Khhhhhh/Khhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- 3. Asse d'ingresso a sud verso l'esterno -->
      <!-- Porta del mastio verso il cortile a sud -->
      <one in="h/K/i" out="*/d/*" symmetry="(x)" steps="1"/>
      <!-- Stradello attraverso il cortile verso sud fino alla cinta esterna -->
      <all in="d/i" out="*/r" symmetry="()"/>
      <all in="r/i" out="*/r" symmetry="()"/>
      <!-- Portaia (G) nella cortina muraria sud -->
      <all in="r/W" out="*/G" symmetry="()"/>
      <!-- Strada r oltre la portaia fino all'estremità della mappa -->
      <all in="G/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Allargamento porte e strada a 3 celle (15 voxel) per passaggio comodo -->
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="r[iE]" out="*r" symmetry="(x)" steps="1"/>
      <!-- Converti marcatori d in r -->
      <prl in="d" out="r"/>

      <!-- Pozzo nel cortile per taglia grande dove c'è spazio libero -->
      <one in="iiiii/iiiii/iiiii" out="**p**/**p**/**p**" steps="1"/>
    </sequence>

    <!-- Ritorno alla scala 1:1 dei voxel -->
    <map scale="5 5 1" values="BEWKhstGrpviFfTokNMUL#90#91#92#94" symmetry="()">
      <!-- Terreno e pavimentazioni -->
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="K" out="KKKKK/KKKKK/KKKKK/KKKKK/KKKKK"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>

      <sequence symmetry="(xy)">
        <!-- Unioni per le parti importate -->
        <union symbol="+" values="W K G t"/>
        <union symbol="%" values="W K t"/>
        <union symbol="=" values="F f"/>

        <!-- ================= Livello B: Elevazione volumi ================= -->
        <!-- Mura cortina (W): alte 24 voxel -->
        <all in="B W" out="W W" steps="23"/>

        <!-- Portaia (G): alta 32 voxel con passaggio carrabile -->
        <all in="B G" out="G G" steps="31"/>

        <!-- Torri angolari (t): alte 40 voxel -->
        <all in="B t" out="t t" steps="39"/>

        <!-- Mastio (K, h, s): 64 voxel (2 piani coperti da 32) -->
        <all in="B K" out="K K" steps="63"/>

        <!-- Pavimento piano terra mastio (z=0 è f) -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>

        <!-- Striscia della scala T: a z=1 nella zona s -->
        <all in="B s" out="s T" steps="1"/>

        <!-- Aria primo piano (fino a z=31) -->
        <all in="B h" out="h B" steps="30"/>
        <all in="B s" out="s B" steps="29"/>

        <!-- Solaio interpiano mastio a z=32 (spessore F) -->
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>

        <!-- Aria secondo piano (fino a z=63) -->
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>

        <!-- Tetto/piattaforma sommitale del mastio a z=64 -->
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>

        <!-- Pozzo cortile: altezza 8 voxel -->
        <all in="B p" out="p W" steps="8"/>

        <!-- ================= Livello C: Dettaglio e parti ================= -->
        <!-- Inserimento scale -->
        <import file="part-stair"/>

        <!-- Apertura portaia esterna (G): portone O largo 15 voxel a z=1..30 -->
        <all in="G/r" out="O/*" symmetry="()" steps="1"/>
        <all in="G/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Apertura porta del mastio (K): porta O verso il cortile -->
        <all in="K/r" out="O/*" symmetry="()" steps="1"/>
        <all in="K/O" out="O/*" symmetry="()" steps="4"/>

        <!-- Inserimento porte -->
        <import file="part-door"/>

        <!-- Merli sulle mura e sulle torri -->
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Finestre mastio al piano nobile (z=42..48) -->
        <one in="BBBBB/BKKKB" out="*****/*UUU*" steps="6" symmetry="()"/>

        <!-- Pulizia marcatori e convergenza materiali -->
        <prl><rule in="K" out="W"/><rule in="G" out="W"/><rule in="t" out="W"/><rule in="p" out="W"/></prl>
        <prl in="r" out="i"/>
      </sequence>
    </map>
  </map>

  <!-- Palette completa dei materiali del forte -->
  <color symbol="E" value="#4a6e38" name="terreno" hidden="True"/>
  <color symbol="H" value="#706d64" name="centro" hidden="True"/>
  <color symbol="W" value="#66635b" name="pietra" area="courtyard"/>
  <color symbol="f" value="#9e7c52" name="tavole" area="keep"/>
  <color symbol="F" value="#504d46" name="lastre" area="keep"/>
  <color symbol="i" value="#787367" name="ciottoli" area="courtyard"/>
  <color symbol="k" value="#8c6f43" name="gradini" area="keep"/>
  <color symbol="O" value="#3a2312" name="portone"/>
  <color symbol="o" value="#2a180b" name="chiodature"/>
  <color symbol="N" value="#4d4135" name="telaio"/>
  <color symbol="M" value="#5a5750" name="merli"/>
  <color symbol="U" value="#1a1c1e" name="feritoia"/>

  <!-- Azioni interattive -->
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="B"/><rule in="o" out="B"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="B" out="O"/></all>
  </action>
</sequence>
