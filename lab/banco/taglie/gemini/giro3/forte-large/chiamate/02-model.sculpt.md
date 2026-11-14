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

## Your program so far
<!-- Forte medievale:
     Parti del concetto e lettere:
       K = mastio centrale (keep, 6x6 o 7x7 celle)
       i = cortile interno attorno al mastio (courtyard)
       W = cortina muraria perimetrale (curtain wall, spessore 1 cella)
       t = torri d'angolo quadrate sporgenti (towers, 3x3 celle)
       G = corpo di guardia / porta monumentale (gatehouse a sud, 3 celle)
       r = strada d'accesso (road dal portone al bordo sud)
       s = zona della scala interna nel mastio (stair zone, 4x2 celle)
       h = interno abitabile del mastio (hall/keep rooms)
       p = pozzo nel cortile (well, compare quando c'è spazio sufficiente)
       x = camminamento / cortile esterno aggiuntivo nella taglia Huge
     Posizione relativa:
       - Il mastio (K) sta nel quadrante posteriore rispetto al centro (offset z/y verso nord)
       - Il cortile (i) circonda il mastio
       - La cortina (W) racchiude il cortile
       - Le torri (t) sorgono ai quattro angoli della cortina muraria
       - La porta (G) è sull'asse a sud, con strada (r) verso il margine
       - La scala (s) è adagiata a una parete interna del mastio con orientamento x
     Variazione dei semi:
       - Dimensioni e allungamento del mastio (6x6 o 7x6 o 6x7)
       - Posizione e orientamento del mastio e della scala
       - Torri angolari simmetriche o con torre mastio angolare rinforzata
     Taglia Large (20x20 celle = 100x100 voxels):
       - Mastio compatto, cortina muraria con 4 torri angolari, portone e cortile.
     Taglia Huge (30x30 celle = 150x150 voxels):
       - Cortile più ampio, pozzo centrale nel cortile, barbacane/doppia cinta o ali di magazzini lungo le mura.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEKWhitsGrpx" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Stabilire il perimetro del forte dal centro H -->
      <!-- Centro del forte: spostato leggermente verso nord per dare respiro al cortile sud -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="1"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="1"/>

      <!-- Area del cortile/recinto interno: si espande a rettangolo attorno a h -->
      <all in="hE" out="*i" steps="5"/>
      <all in="iE/*i" out="*i/**"/>
      <all in="E/i" out="i/*" steps="4" symmetry="()"/>
      <all in="i/E" out="*/i" steps="4" symmetry="()"/>
      <all in="iE/*i" out="*i/**"/>

      <!-- Se c'è tanto spazio (Huge: 30x30), espandi ulteriormente il cortile per accogliere più parti -->
      <all in="iEEEEEE" out="*iiii**" steps="1"/><all in="iE/*i" out="*i/**"/>
      <all in="EEEEEE/i" out="**iiii/*" steps="1" symmetry="()"/><all in="iE/*i" out="*i/**"/>
      <all in="i/EEEEEE" out="*/**iiii" steps="1" symmetry="()"/><all in="iE/*i" out="*i/**"/>

      <!-- Mura di cinta (W) attorno al cortile i -->
      <all in="iE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri quadrate (t: 3x3 celle) sui 4 angoli della cinta muraria -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- Il Mastio (K): sorge nella porzione nord del cortile (lontano dalla porta) -->
      <all in="[Hh]" out="K"/>
      <all in="KE" out="*K" steps="1"/>
      <!-- Mastio interno: delimitiamo 6x6 o 7x6 di mastio -->
      <all in="E/K" out="K/*" steps="2" symmetry="()"/>
      <all in="K/E" out="*/K" steps="1" symmetry="()"/>
      <all in="Ki" out="*K" steps="2"/>
      <all in="KE/*K" out="*K/**"/>
      <all in="Ki/*K" out="*K/**"/>

      <!-- Pareti esterne del mastio (W_mastio = W) e interno abitabile (h) -->
      <all in="Ki" out="Wi"/>
      <all in="K/i" out="W/i" symmetry="()"/>
      <all in="i/K" out="i/W" symmetry="()"/>
      <all in="KW/*K" out="*W/**"/>
      <all in="K" out="h"/>

      <!-- Zona per la scala (s: 4 celle lungo x, 2 lungo y) lungo la parete nord del mastio -->
      <!-- Lasciamo 2 celle di sbarco a sinistra (piccolo x) -->
      <one in="WWWWWWW/Whhhhhh/Whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Porta del mastio verso il cortile (a sud del mastio) -->
      <!-- Uscita dalla cinta: portone (G), strada (r) verso sud -->
      <all in="h/i" out="*/r" symmetry="()" steps="1"/>
      <all in="r/i" out="*/r" symmetry="()"/>
      <all in="r/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <!-- Allarga porta e strada a 3 celle (15 voxels) -->
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="r[iE]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Elemento addizionale per taglie grandi: pozzo d'acqua nel cortile (p) se c'è spazio 5x5 di cortile libero -->
      <one in="iiiii/iiiii/iiiii/iiiii/iiiii" out="*****/*****/**p**/*****/*****" steps="1"/>
    </sequence>
  </map>

  <!-- Palette dei colori e aree per la pianta -->
  <color symbol="E" value="#4a6e38" name="terreno" hidden="True"/>
  <color symbol="H" value="#706d64" name="centro" hidden="True"/>
  <color symbol="W" value="#5a5750" name="mura" area="courtyard"/>
  <color symbol="K" value="#6a665e" name="mastio" area="keep"/>
  <color symbol="h" value="#b08b59" name="sala" area="keep"/>
  <color symbol="s" value="#8c6f43" name="scala" area="keep"/>
  <color symbol="i" value="#827f75" name="cortile" area="courtyard"/>
  <color symbol="t" value="#4a4740" name="torre" area="tower"/>
  <color symbol="G" value="#363430" name="portaia" area="courtyard"/>
  <color symbol="r" value="#9e947d" name="strada"/>
  <color symbol="p" value="#3a6078" name="pozzo" area="courtyard"/>
  <color symbol="x" value="#504d46" name="camminamento" area="courtyard"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, W mura, h sala, i cortile, t torre, p pozzo
Plan (the letter of every cell):
```
EtttttEEEEEEEEEEEEEE
EtttttWWWWWWWWWWWWWW
EtttiiiiiiiiiiiiiiiW
EtttiiiiiiiiiiiiiiiW
EEEWiiiiiiiiiiiiiiiW
EEEWiiiiiiiiiiiiiiiW
EEEWiiiWWWWWWWiiiiiW
EEEWiiiWhhhhhWiiiiiW
EEEWiiiWhhhhhWiiiiiW
EEEWiiiWhhhhhWiiiiiW
EEEWiiiWhhhhhWiiiiiW
EEEWiiiWhhhhhWiiiiiW
EEEWiiiWhhhhhWiiiiiW
EEEWiiiWWWWWWWiiiiiW
EEEWiiiiiiiiiiiipiiW
EEEWiiiiiiiiiiiiiiiW
EtttiiiiiiiiiiiiiiiW
EtttiiiiiiiiiiiiiiiW
EtttttWWWWWWWWWWWWWW
EtttttEEEEEEEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, W mura, h sala, i cortile, t torre, p pozzo
Plan (the letter of every cell):
```
EtttttEEEEEEEEEEEEEE
EtttttWWWWWWWWWWWWWW
Etttiiiiiiiiiiiiiiii
Etttiiiiiiiiiiiiiiii
EEEWiiiiiiiiiiiiipii
EEEWiiiiiiiiiiiiiiii
EEEWiiiWWWWWWWiiiiii
EEEWiiiWhhhhhWiiiiii
EEEWiiiWhhhhhWiiiiii
EEEWiiiWhhhhhWiiiiii
EEEWiiiWhhhhhWiiiiii
EEEWiiiWhhhhhWiiiiii
EEEWiiiWhhhhhWiiiiii
EEEWiiiWWWWWWWiiiiii
EEEWiiiiiiiiiiiiiiii
EEEWiiiiiiiiiiiiiiii
Etttiiiiiiiiiiiiiiii
Etttiiiiiiiiiiiiiiii
EtttttWWWWWWWWWWWWWW
EtttttEEEEEEEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, W mura, h sala, i cortile, t torre, p pozzo
Plan (the letter of every cell):
```
EtttttEEEEEEEEEEEEEE
EtttttWWWWWWWWWWWWWW
Etttiiiiiiiiiiiiiiii
Etttiiiiiiiiiiiiiiii
EEEWiiiiiiiiiiiiiiii
EEEWiiiiiiiiiiiiiiii
EEEWiiiWWWWWWWiipiii
EEEWiiiWhhhhhWiiiiii
EEEWiiiWhhhhhWiiiiii
EEEWiiiWhhhhhWiiiiii
EEEWiiiWhhhhhWiiiiii
EEEWiiiWhhhhhWiiiiii
EEEWiiiWhhhhhWiiiiii
EEEWiiiWWWWWWWiiiiii
EEEWiiiiiiiiiiiiiiii
EEEWiiiiiiiiiiiiiiii
Etttiiiiiiiiiiiiiiii
Etttiiiiiiiiiiiiiiii
EtttttWWWWWWWWWWWWWW
EtttttEEEEEEEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, W mura, h sala, i cortile, t torre, p pozzo
Plan (the letter of every cell):
```
EEEEEEtttttEEEEEEEEEEEEEEttttt
EEEEEEtttttEEEEEEEEEEEEEEttttt
EEEEEEtttttWWWWWWWWWWWWWWttttt
EEEEEEtttiiiiiiiiiiiiiiiiiittt
EEEEEEtttiiiiiiiiiiiiiiiiiittt
EEEEEEEEWiiiiiiiiiiiiiiiiiiWEE
EEEEEEEEWiiiiiiiiiiiiiiiiiiWEE
EEEEEEEEWiiiiiiiiiiiiiiiiiiWEE
EEEEEEEEWiiiiiiiiiiiiiiiiiiWEE
EEEEEEEEWiiiiiiiiiiiiiiiiiiWEE
EEEEEEEEWiiiiiiiiiiiiiiiiiiWEE
EEEEEEEEWiiiWWWWWWWiiiiiiiiWEE
EEEEEEEEWiiiWhhhhhWiiiiiiiiWEE
EEEEEEEEWiiiWhhhhhWiiiiiiiiWEE
EEEEEEEEWiiiWhhhhhWiiiiiiiiWEE
EEEEEEEEWiiiWhhhhhWiiiiiiiiWEE
EEEEEEEEWiiiWhhhhhWiiiiiiiiWEE
EEEEEEEEWiiiWhhhhhWiiiiiiiiWEE
EEEEEEEEWiiiWWWWWWWiiiiiiiiWEE
EEEEEEEEWiiiiiiiiiiiiiiiiiiWEE
EEEEEEEEWiiiiiiiiiiiiiiiiiiWEE
EEEEEEEEWiiiiiiiiiiiiiiiiiiWEE
EEEEEEEEWiiiiiiiiiiiiiiiiiiWEE
EEEEEEEEWiiiiiiiiiiiiiiipiiWEE
EEEEEEEEWiiiiiiiiiiiiiiiiiiWEE
EEEEEEtttiiiiiiiiiiiiiiiiiittt
EEEEEEtttiiiiiiiiiiiiiiiiiittt
EEEEEEtttttWWWWWWWWWWWWWWttttt
EEEEEEtttttEEEEEEEEEEEEEEttttt
EEEEEEtttttEEEEEEEEEEEEEEttttt
```
How much the plans of the seeds differ: 0.06 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

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
