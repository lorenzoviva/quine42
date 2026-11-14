# model.sculpt · gemini-3.8-flash · 31 s

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
<!--
  Forte:
  Un forte medievale in pietra composto da:
  - Maschio centrale (K: muri del maschio, f: cortiletto/pavimentazione interna, s: zona scala T)
  - Cortile d'armi (c: cortile selciato, Q: pozzo nel cortile, P: tettoia/magazzino)
  - Mura di cinta (W: cortina muraria merlata)
  - Torri angolari (t: torri quadrate aggettanti ai vertici della cinta)
  - Portale fortificato (G: barbacane/porta sul fronte con d per il varco)
  - Strada d'accesso (r: selciato esterno verso il confine)
  - A misura grande (7.5x7.5 / 150): spazio aggiuntivo per un secondo cortile, fossato parziale o orto/recinto del forte (a/v)
-->
<sequence values="BHEKcfsWtQPGrd" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEKcfsWtQPGrd" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- A. Composizione della pianta: il maschio centrale attorno a H -->
      <!-- Linea dorsale del maschio: 2 celle dietro, 2 celle davanti -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <!-- Allargamento laterale del maschio: 2 a sinistra e 2 a destra (totale interno 5x5 celle) -->
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="2"/>

      <!-- Muri perimetrali del maschio (K) attorno alla sala centrale (f) -->
      <all in="hE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>
      <prl in="h" out="f"/><prl in="H" out="f"/>

      <!-- Zona scala per part-stair: 4 celle x 2 celle lungo la parete nord del maschio -->
      <!-- Due celle libere di pianerottolo a monte (x minore) -->
      <one in="KKKKKKK/Kffffff/Kffffff" out="*******/**ssss*/**ssss*" symmetry="()" steps="1"/>

      <!-- Cortile d'armi attorno al maschio: 3 celle di espansione -->
      <all in="KE" out="*c" steps="3"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Se c'è spazio aggiuntivo (taglia Huge 30x30), il cortile si espande ulteriormente -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Mura di cinta (W): 1 cella di spessore attorno al cortile -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri quadrate (t: 2x2 celle di griglia = 10x10 voxels) agli spigoli esterni -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- Il varco e la strada verso la facciata (sud) -->
      <!-- Trova il centro del fronte sud e apre porta maschio, cortile, porta di cinta, strada -->
      <!-- Dal centro del maschio scendiamo dritti a sud -->
      <one in="fff/fff/KKK" out="***/*m*/***"/>
      <all in="m/f" out="*/m" symmetry="()"/>
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>

      <!-- Allargamento dell'accesso a 3 celle di ampiezza (15 voxels) -->
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="f"/><rule in="n" out="c"/></prl>

      <!-- Pozzo nel cortile: 1 cella Q posizionata lontano dalla porta -->
      <one in="c" out="Q" steps="1"><field for="Q" from="G" on="c"/></one>

      <!-- Tettoia/magazzino d'armi (P) addossata a una parete del cortile -->
      <one in="cW/cc" out="PW/**" steps="1"/>
      <all in="Pc" out="*P" steps="2"/>
    </sequence>
  </map>

  <!-- Tavolozza per la visualizzazione del piano compositivo -->
  <color symbol="E" value="#4a6b32" name="erba" hidden="True"/>
  <color symbol="H" value="#9e9484" name="centro" hidden="True"/>
  <color symbol="K" value="#5a5751" name="muro_maschio" area="keep"/>
  <color symbol="f" value="#827768" name="pavimento_maschio" area="keep"/>
  <color symbol="s" value="#b08a5b" name="vano_scala" area="keep"/>
  <color symbol="W" value="#6e6b63" name="cortina_muraria" area="courtyard"/>
  <color symbol="c" value="#8a8375" name="cortile_pietra" area="courtyard"/>
  <color symbol="t" value="#4d4a45" name="torre_angolare" area="tower"/>
  <color symbol="Q" value="#397d9c" name="pozzo" area="courtyard"/>
  <color symbol="P" value="#8c6239" name="tettoia_armi" area="courtyard"/>
  <color symbol="G" value="#4a4237" name="portone_cinta" area="courtyard"/>
  <color symbol="r" value="#9c9587" name="strada_accesso" area="yard"/>
  <color symbol="d" value="#705335" name="porta_maschio" area="keep"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, K muro_maschio, c cortile_pietra, f pavimento_maschio, W cortina_muraria, t torre_angolare, Q pozzo, G portone_cinta, r strada_accesso, d porta_maschio
Plan (the letter of every cell):
```
tttEEEEEEEEEEEtttEEE
tttWWWWWWWWWWWtttEEE
ttQccccccccccccttEEE
EWcccccccccccccWEEEE
EWcccccccccccccWEEEE
EWcccccccccccccWEEEE
EWcccccccccccccWEEEE
EWcccccKKKKKKKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccdddddddcWEEEE
ttcccccccccccccttEEE
tttWWWWGGGGGGGtttEEE
tttEEEErrrrrrrtttEEE
EEEEEEErrrrrrrEEEEEE
EEEEEEErrrrrrrEEEEEE
EEEEEEErrrrrrrEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, K muro_maschio, c cortile_pietra, f pavimento_maschio, W cortina_muraria, t torre_angolare, Q pozzo, G portone_cinta, r strada_accesso, d porta_maschio
Plan (the letter of every cell):
```
tttEEEEEEEEEEEtttEEE
tttWWWWWWWWWWWtttEEE
ttQccccccccccccttEEE
EWcccccccccccccWEEEE
EWcccccccccccccWEEEE
EWcccccccccccccWEEEE
EWcccccccccccccWEEEE
EWcccccKKKKKKKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccdddddddcWEEEE
ttcccccccccccccttEEE
tttWWWWGGGGGGGtttEEE
tttEEEErrrrrrrtttEEE
EEEEEEErrrrrrrEEEEEE
EEEEEEErrrrrrrEEEEEE
EEEEEEErrrrrrrEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, K muro_maschio, c cortile_pietra, f pavimento_maschio, W cortina_muraria, t torre_angolare, Q pozzo, G portone_cinta, r strada_accesso, d porta_maschio
Plan (the letter of every cell):
```
tttEEEEEEEEEEEtttEEE
tttWWWWWWWWWWWtttEEE
ttQccccccccccccttEEE
EWcccccccccccccWEEEE
EWcccccccccccccWEEEE
EWcccccccccccccWEEEE
EWcccccccccccccWEEEE
EWcccccKKKKKKKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccKfffffKcWEEEE
EWcccccdddddddcWEEEE
ttcccccccccccccttEEE
tttWWWWGGGGGGGtttEEE
tttEEEErrrrrrrtttEEE
EEEEEEErrrrrrrEEEEEE
EEEEEEErrrrrrrEEEEEE
EEEEEEErrrrrrrEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, K muro_maschio, c cortile_pietra, f pavimento_maschio, W cortina_muraria, t torre_angolare, Q pozzo, G portone_cinta, r strada_accesso, d porta_maschio
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEtttEEEEEEEEEEEEEEEtttEEEE
EEEEEtttWWWWWWWWWWWWWWWtttEEEE
EEEEEttccccccccccccccccQttEEEE
EEEEEEWcccccccccccccccccWEEEEE
EEEEEEWcccccccccccccccccWEEEEE
EEEEEEWcccccccccccccccccWEEEEE
EEEEEEWcccccccccccccccccWEEEEE
EEEEEEWcccccKKKKKKKcccccWEEEEE
EEEEEEWcccccKfffffKcccccWEEEEE
EEEEEEWcccccKfffffKcccccWEEEEE
EEEEEEWcccccKfffffKcccccWEEEEE
EEEEEEWcccccKfffffKcccccWEEEEE
EEEEEEWcccccKfffffKcccccWEEEEE
EEEEEEWcccccdddddddcccccWEEEEE
EEEEEEWcccccccccccccccccWEEEEE
EEEEEEWcccccccccccccccccWEEEEE
EEEEEEWcccccccccccccccccWEEEEE
EEEEEEWcccccccccccccccccWEEEEE
EEEEEttcccccccccccccccccttEEEE
EEEEEtttWWWWGGGGGGGWWWWtttEEEE
EEEEEtttEEEErrrrrrrEEEEtttEEEE
EEEEEEEEEEEErrrrrrrEEEEEEEEEEE
EEEEEEEEEEEErrrrrrrEEEEEEEEEEE
EEEEEEEEEEEErrrrrrrEEEEEEEEEEE
EEEEEEEEEEEErrrrrrrEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

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

