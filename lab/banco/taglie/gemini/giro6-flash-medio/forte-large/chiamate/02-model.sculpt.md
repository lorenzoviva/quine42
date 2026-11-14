# model.sculpt · gemini-3.8-flash · 279 s

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
Concetto: forte medievale con mastio centrale/posteriore a due piani, cortile interno cinto da mura con camminamento, torri d'angolo quadrate, porta fortificata con strada d'accesso.
Lettere della composizione (griglia planimetrica 1/5, cella 5x5 voxel):
- E: terreno esterno naturale (prato/terra)
- W: mura di cinta esterne
- c: pavimentazione del cortile d'armi
- t: torri d'angolo sporgenti della cinta
- g: porta d'ingresso e androne fortificato
- r: strada lastricata di accesso verso l'esterno
- w: mura perimetrali del mastio
- h: aula/pavimento interno del mastio
- s: zona della scala interna (4 celle in x, 2 in y, sale verso +x)
- Q: pozzo nel cortile (compare quando lo spazio del cortile è sufficiente)
- b: magazzino/corpo di guardia nel cortile lungo le mura (nella taglia maggiore)

Disposizione relativa:
- Il mastio (corpo principale h racchiuso da w) sorge intorno a H, arretrato rispetto all'ingresso.
- La scala s è disposta all'interno del mastio lungo la parete nord, orientata verso +x con pianerottolo libero.
- Il cortile c cinge il mastio su tutti i lati; nella taglia Huge si espande ulteriormente offrendo spazio per pozzo e magazzino.
- La cinta W racchiude il cortile; sui quattro angoli esterni sorgono le torri t (3x3 celle).
- La porta g attraversa la cinta sul fronte meridionale (3 celle di larghezza), da cui la strada r prosegue dritta fino al bordo.
- Nei semi diversi cambiano la profondità del mastio, la posizione della scala, l'estensione del cortile e la presenza degli annessi.
-->
<sequence values="BHEwhscWtrgQb" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BEHwhscWtrgQb" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- A1. Il mastio: corpo attorno a H, largo 7 celle e profondo 6-7 celle (interno >= 28 voxel liberi) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>

      <!-- Mura del mastio w attorno al vano h -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona della scala s all'interno del mastio: 4 celle lungo x, 2 lungo y, con pianerottolo -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- A2. Il cortile c attorno al mastio -->
      <all in="wE" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Espansione del cortile quando c'è spazio abbondante (taglia Huge 30x30) -->
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- A3. Mura di cinta W attorno al cortile, spessore 1 cella -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri d'angolo t di 3x3 celle agli angoli esterni delle mura -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- A4. Accesso frontale: porta g nelle mura, strada r verso l'esterno, larga 3 celle -->
      <!-- Trova il punto di uscita verso sud attraverso il cortile e le mura -->
      <all in="w/c" out="*/m" symmetry="()" steps="1"/>
      <all in="m/c" out="*/m" symmetry="()"/>
      <all in="m/W" out="*/g" symmetry="()" steps="1"/>
      <all in="[gr]/E" out="*/r" symmetry="()"/>
      <!-- Allarga porta e strada a 3 celle (15 voxel) -->
      <all in="gW" out="*g" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <!-- Ripristina i marcatori guida nel cortile a pavimento c -->
      <all in="m" out="c"/>

      <!-- A5. Elementi aggiuntivi nel cortile se c'è spazio sufficiente -->
      <!-- Pozzo Q in 5x5 di cortile libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Magazzino/alloggi b addossati alle mura laterali dove resta spazio nel cortile -->
      <one in="Wc/Wc/Wc/Wc/Wc" out="**/*b/*b/*b/**" symmetry="(x)" steps="1"/>
      <all in="bc" out="*b" symmetry="(x)" steps="1"/>
    </sequence>
  </map>
  <color symbol="E" value="#4a6e38" name="prato"/>
  <color symbol="H" value="#706d64" name="centro"/>
  <color symbol="w" value="#63625f" name="muro del mastio"/>
  <color symbol="h" value="#82775f" name="pavimento mastio"/>
  <color symbol="s" value="#998363" name="vano scala"/>
  <color symbol="c" value="#878378" name="lastricato cortile"/>
  <color symbol="W" value="#575654" name="mura di cinta"/>
  <color symbol="t" value="#4a4947" name="torre d'angolo"/>
  <color symbol="g" value="#3b332b" name="porta di cinta"/>
  <color symbol="r" value="#9e9b8f" name="strada"/>
  <color symbol="Q" value="#3b5973" name="pozzo"/>
  <color symbol="b" value="#594632" name="magazzino"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E prato, w muro del mastio, h pavimento mastio, s vano scala, c lastricato cortile, W mura di cinta, t torre d'angolo, r strada, g porta di cinta, b magazzino
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEtttttEEEEEEEtttttE
EEtttttEEEEEEEtttttE
EEtttttWWWWWWWtttttE
EEtttccccccccccctttE
EEtttcwwwwwwwwwctttE
EEEEWcwhhsssshwcWEEE
EEEEWbwhhsssshwcWEEE
EEEEWbwhhhhhhhwcWEEE
EEEEWbwhhhHhhhwcWEEE
EEEEWcwhhhhhhhwcWEEE
EEEEWcwhhhhhhhwcWEEE
EEtttcwwwwwwwwwctttE
EEtttccccccccccctttE
EEtttttgggggggtttttE
EEtttttrrrrrrrtttttE
EEtttttrrrrrrrtttttE
EEEEEErrrrrrrrrEEEEE
EEEEEErrrrrrrrrEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E prato, w muro del mastio, h pavimento mastio, s vano scala, c lastricato cortile, W mura di cinta, t torre d'angolo, r strada, g porta di cinta, b magazzino
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEtttttEEEEEEEtttttE
EEtttttEEEEEEEtttttE
EEtttttWWWWWWWtttttE
EEtttccccccccccctttE
EEtttcwwwwwwwwwctttE
EEEEWcwhhsssshwcWEEE
EEEEWcwhhsssshwcWEEE
EEEEWbwhhhhhhhwcWEEE
EEEEWbwhhhHhhhwcWEEE
EEEEWbwhhhhhhhwcWEEE
EEEEWcwhhhhhhhwcWEEE
EEtttcwwwwwwwwwctttE
EEtttccccccccccctttE
EEtttttgggggggtttttE
EEtttttrrrrrrrtttttE
EEtttttrrrrrrrtttttE
EEEEEErrrrrrrrrEEEEE
EEEEEErrrrrrrrrEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E prato, w muro del mastio, h pavimento mastio, s vano scala, c lastricato cortile, W mura di cinta, t torre d'angolo, r strada, g porta di cinta, b magazzino
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEtttttEEEEEEEtttttE
EEtttttEEEEEEEtttttE
EEtttttWWWWWWWtttttE
EEtttccccccccccctttE
EEtttcwwwwwwwwwctttE
EEEEWcwhhsssshwcWEEE
EEEEWcwhhsssshwcWEEE
EEEEWbwhhhhhhhwcWEEE
EEEEWbwhhhHhhhwcWEEE
EEEEWbwhhhhhhhwcWEEE
EEEEWcwhhhhhhhwcWEEE
EEtttcwwwwwwwwwctttE
EEtttccccccccccctttE
EEtttttgggggggtttttE
EEtttttrrrrrrrtttttE
EEtttttrrrrrrrtttttE
EEEEEErrrrrrrrrEEEEE
EEEEEErrrrrrrrrEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro, E prato, w muro del mastio, h pavimento mastio, s vano scala, c lastricato cortile, W mura di cinta, t torre d'angolo, r strada, g porta di cinta, Q pozzo, b magazzino
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEtttttEEEEEEEEEEEEEEEEEtttttE
EEtttttEEEEEEEEEEEEEEEEEtttttE
EEtttttWWWWWWWWWWWWWWWWWtttttE
EEtttccccccccccccccccccccctttE
EEtttccccccccccccccccccccctttE
EEEEWccccccccccccccccccQccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWccccccwwwwwwwwwccccccWEEE
EEEEWccccccwhhsssshwccccccWEEE
EEEEWccccccwhhsssshwccccccWEEE
EEEEWbbccccwhhhhhhhwccccccWEEE
EEEEWbbccccwhhhHhhhwccccccWEEE
EEEEWbbccccwhhhhhhhwccccccWEEE
EEEEWccccccwhhhhhhhwccccccWEEE
EEEEWccccccwwwwwwwwwccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEtttccccccccccccccccccccctttE
EEtttccccccccccccccccccccctttE
EEtttttWWWgggggggggggWWWtttttE
EEtttttEEErrrrrrrrrrrEEEtttttE
EEtttttEEErrrrrrrrrrrEEEtttttE
EEEEEEEEEErrrrrrrrrrrEEEEEEEEE
EEEEEEEEEErrrrrrrrrrrEEEEEEEEE
```
How much the plans of the seeds differ: 0.01 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
Concetto: forte medievale con mastio centrale a due piani sotto tetto a padiglione,
cortile d'armi cinto da mura merlate con camminamento, torri d'angolo con feritoie,
portaia fortificata con strada d'accesso.

Parti e disposizione relativa:
- Mastio (aula h, muri w, scala s): volume principale attorno a H, profondo 8-9 celle
  e largo 9 celle (interno >= 28 voxel liberi per lato dopo aver inserito la scala).
- Scala interna (s): fascia di 4 celle in x (20 voxel) e 2 in y (10 voxel), con sbarco
  libero di 2 celle prima del primo gradino e pavimento libero all'uscita al piano superiore.
- Ala/alloggi (b): corpo di guardia addossato a uno dei lati del mastio, scelto casualmente.
- Cortile (c): cinge mastio e alloggi; nella taglia Huge si allarga sensibilmente.
- Cinta muraria (W): racchiude il cortile, coronata da camminamento e merli regolari (M).
- Torri d'angolo (t): sporgenti su tutti gli angoli esterni, alte 40 voxel con merli e feritoie (U).
- Portaia (g) e porta del mastio (d): semi per part-door (O), assi (o) e stipiti (N).
- Strada (r): dritta dall'ingresso fino al bordo della mappa.
- Nella taglia Huge: pozzo (Q) nel cortile e fossato d'acqua (a) all'esterno delle mura.

Variazione tra semi:
- Profondità e larghezza del mastio (8-9 celle).
- Posizione dell'ala alloggi (ovest o est a sorte).
- Disposizione asimmetrica del cortile e posizione del pozzo.
-->
<sequence values="BHEwhscWtrgQba" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BEHwhscWtrgQba123md" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- A1. Il mastio attorno a H: profondità 8 o 9 celle, larghezza 9 celle -->
      <one in="H" out="h" steps="1"/>
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <one in="E/h" out="h/*" symmetry="()" steps="1"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Mura perimetrali del mastio -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona della scala interna: 4 celle in x, 2 in y, con 2 celle libere di pianerottolo -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss****/***ssss****" symmetry="()" steps="1"/>

      <!-- A2. Ala/alloggi annessi su uno dei lati a sorte (variazione forte tra semi) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/1*/**/**" symmetry="(x)" steps="1"/>
      <all in="1E" out="*1" symmetry="(x)" steps="2"/>
      <all in="E/1" out="1/*" symmetry="()" steps="2"/><all in="1/E" out="*/1" symmetry="()" steps="2"/>
      <all in="1E" out="*b"/><all in="bE/*b" out="*b/**"/>
      <all in="1" out="b"/>

      <!-- A3. Cortile c attorno a mastio e annessi -->
      <all in="[wb]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Espansione del cortile quando c'è spazio abbondante (taglia Huge 30x30) -->
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- A4. Mura di cinta esterne W attorno al cortile -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri d'angolo sporgenti t (3x3 celle) -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- A5. Accesso assiale: porta del mastio d, portaia di cinta g, strada esterna r -->
      <all in="h/w" out="*/m" symmetry="()" steps="1"/>
      <all in="m/c" out="*/m" symmetry="()"/>
      <all in="m/W" out="*/g" symmetry="()" steps="1"/>
      <all in="[gr]/E" out="*/r" symmetry="()"/>

      <!-- Allargamento della via d'accesso a 3 celle (15 voxel) -->
      <all in="gw" out="*g" symmetry="(x)" steps="1"/>
      <all in="gW" out="*g" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- La porta del mastio sul fronte del cortile -->
      <all in="h/m" out="*/d" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="m" out="c"/>

      <!-- A6. Dettagli che compaiono con lo spazio (Huge): pozzo e fossato -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
    </sequence>

    <!-- Mappatura in scala piena 5x5x1 -->
    <map scale="5 5 1" values="BEWw1W1t1g1c1r1f1F1ROokNMLUb1q1w02021" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="c" out="c1c1c1c1c1/c1c1c1c1c1/c1c1c1c1c1/c1c1c1c1c1/c1c1c1c1c1"/>
      <rule in="r" out="r1r1r1r1r1/r1r1r1r1r1/r1r1r1r1r1/r1r1r1r1r1/r1r1r1r1r1"/>
      <rule in="W" out="W1W1W1W1W1/W1W1W1W1W1/W1W1W1W1W1/W1W1W1W1W1/W1W1W1W1W1"/>
      <rule in="t" out="t1t1t1t1t1/t1t1t1t1t1/t1t1t1t1t1/t1t1t1t1t1/t1t1t1t1t1"/>
      <rule in="w" out="w1w1w1w1w1/w1w1w1w1w1/w1w1w1w1w1/w1w1w1w1w1/w1w1w1w1w1"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="Q" out="c1c1c1c1c1/c1q1q1q1c1/c1q1w0q1c1/c1q1q1q1c1/c1c1c1c1c1"/>
      <rule in="a" out="w0w0w0w0w0/w0w0w0w0w0/w0w0w0w0w0/w0w0w0w0w0/w0w0w0w0w0"/>

      <sequence symmetry="(xy)">
        <!-- B1. Sviluppo in altezza: cortile, fossato, annessi -->
        <all in="B q1" out="q1 W1" steps="2"/>

        <!-- Mura di cinta W1: altezza 24 voxel con camminamento -->
        <all in="B W1" out="W1 W1" steps="23"/>

        <!-- Portaia g: altezza 32 voxel, con androne d'ingresso -->
        <all in="B g" out="g r1" steps="1"/>
        <all in="B g" out="g O" steps="1"/>
        <all in="B g" out="g g1" steps="30"/>
        <prl in="g" out="g1"/>

        <!-- Torri d'angolo t1: altezza 40 voxel -->
        <all in="B t1" out="t1 t1" steps="39"/>

        <!-- Corpo di guardia b: altezza 26 voxel sotto tetto -->
        <all in="B b" out="b f1" steps="1"/>
        <all in="B b" out="b B" steps="25"/>
        <prl in="b" out="R"/>

        <!-- B2. Sviluppo del mastio (64 voxel su due piani) -->
        <!-- Porta del mastio d: pavimento al piano terra, seme O, poi muro w1 -->
        <all in="B d" out="d f1" steps="1"/>
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d w1" steps="62"/>
        <prl in="d" out="R"/>

        <!-- Muri del mastio w1: si elevano per 64 voxel -->
        <all in="B w1" out="w1 w1" steps="63"/>
        <prl in="w1" out="R"/>

        <!-- Piani interni del mastio: piano terra a z=0, primo piano a z=32, soffitto a z=64 -->
        <all steps="1"><rule in="B h" out="h f1"/><rule in="B s" out="s f1"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F1"/><rule in="B s" out="s F1"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- C1. Parti incluse: porte, scala, merlature e feritoie -->
        <union symbol="+" values="W1t1g1w1b1"/>
        <union symbol="=" values="f1F1"/>
        <union symbol="%" values="W1t1g1"/>

        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- C2. Finestre del mastio al secondo piano (su 3 lati: nord, est, ovest) -->
        <one steps="2" symmetry="(x)">
          <rule in="Bw1w1w1w1w1B/Bw1w1w1w1w1B Bw1w1w1w1w1B/Bw1w1w1w1w1B Bw1w1w1w1w1B/Bw1w1w1w1w1B Bw1w1w1w1w1B/Bw1w1w1w1w1B"
                out="BLLLLLB/BLLLLLB BLLLLLB/BLLLLLB BLLLLLB/BLLLLLB BLLLLLB/BLLLLLB"/>
        </one>
        <one steps="2" symmetry="()">
          <rule in="B/w1/w1/w1/w1/w1/B B/w1/w1/w1/w1/w1/B B/w1/w1/w1/w1/w1/B B/w1/w1/w1/w1/w1/B"
                out="B/L/L/L/L/L/B B/L/L/L/L/L/B B/L/L/L/L/L/B B/L/L/L/L/L/B"/>
        </one>

        <!-- C3. Tetto a padiglione del mastio (da z=64 a salire) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>

        <!-- C4. Pulizia marcatori rimasti -->
        <prl in="s" out="B"/>
      </sequence>
    </map>
  </map>

  <!-- Palette dei materiali del mondo medievale -->
  <color symbol="E" value="#4a6e38" name="prato"/>
  <color symbol="W1" value="#6e6b64" name="pietra di cinta"/>
  <color symbol="t1" value="#5c5953" name="pietra delle torri"/>
  <color symbol="g1" value="#5c5953" name="pietra della portaia"/>
  <color symbol="w1" value="#8a857b" name="pietra del mastio"/>
  <color symbol="b1" value="#786c5c" name="mura degli alloggi"/>
  <color symbol="c1" value="#9c978b" name="lastricato del cortile"/>
  <color symbol="r1" value="#aba79d" name="strada maestra"/>
  <color symbol="q1" value="#635f58" name="parapetto del pozzo"/>
  <color symbol="w0" value="#3a6888" name="acqua"/>
  <color symbol="f1" value="#6e4f37" name="assi di quercia"/>
  <color symbol="F1" value="#5c402b" name="travi del solaio"/>
  <color symbol="k" value="#7a583d" name="gradini in legno"/>
  <color symbol="R" value="#9e4434" name="tegole in cotto"/>
  <color symbol="M" value="#54524c" name="merli in pietra"/>
  <color symbol="U" value="#1e1c1b" name="feritoia"/>
  <color symbol="L" value="#2a3842" name="finestra ferrata"/>
  <color symbol="O" value="#211f1e" name="androne"/>
  <color symbol="o" value="#3d2b1f" name="tavole ferrate"/>
  <color symbol="N" value="#4f4d47" name="stipite in pietra"/>
  <color symbol="#20" value="#00000000" hidden="True"/>
  <color symbol="#21" value="#00000000" hidden="True"/>

  <!-- Azioni sulle porte -->
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
```
