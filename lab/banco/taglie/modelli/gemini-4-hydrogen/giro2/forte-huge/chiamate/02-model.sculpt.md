# model.sculpt · gemini-4-hydrogen · 30 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · size huge (7.5 × 7.5 × 6 tiles, 20 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 7.5 × 7.5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 200 × 200 × 160, 10 × 10 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Your program so far
<!--
  Forte:
  - Mastio (h pavimento, s zona scala, w mura, d porta del mastio): al centro-retro del cortile, lontano dall'ingresso, a due piani.
  - Cortile (c) attorno al mastio, con lastricato (n) dall'ingresso al mastio; a taglia maggiore si allarga dove c'è spazio e ospita un pozzo (Q).
  - Cinta muraria (W) spessa due celle attorno al cortile, con torri angolari (t) di 5x5.
  - Corpo di guardia / portone (G) sul lato frontale della cinta, con strada (r) dritta fino al bordo.
  - Fossato (a) attorno alle mura e alberi (T) all'esterno dove lo spazio lo consente (taglia gargantuan).
  - I semi variano la profondità/larghezza del mastio, la posizione della scala, del pozzo e degli alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdcnWtGQaT" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio: nucleo attorno a H, 4 dietro, 4 davanti, più eventuale estensione casuale -->
      <all in="E/H" out="h/*" symmetry="()" steps="4"/>
      <all in="H/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="h" out="h"/>
      <all in="H" out="h" steps="1"/>
      <!-- Zona scala nel mastio: lungo un muro, 2 celle di pianerottolo, 4x2 per la scala -->
      <one in="hhhhhhh/hhhhhhh" out="*******/*ssss**" symmetry="()" steps="1"/>
      <!-- Mura del mastio -->
      <all in="[hs]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Cortile attorno al mastio -->
      <all in="wE" out="*c" steps="4"/><all in="cE/*c" out="*c/**"/>
      <!-- Espansione del cortile dove c'è spazio (taglia grande) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- Cinta muraria spessa 2 celle attorno al cortile -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- Torri angolari 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- Via d'uscita: dal mastio al fronte attraverso porta (d), lastricato (n), portone (G), strada (r) -->
      <one in="h/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/w" out="*/d" symmetry="()"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <!-- Pozzo nel cortile dove entra 5x5 di cortile libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- Fossato attorno alla cinta dove c'è spazio libero -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <!-- Alberi all'esterno dove c'è 7x7 di terreno libero -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***T***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="B" hidden="True"/>
  <color symbol="E" value="#6b7a4a" name="erba"/>
  <color symbol="H" value="#c8a878" name="centro"/>
  <color symbol="h" value="#b89868" name="pavimento del mastio"/>
  <color symbol="s" value="#a08050" name="zona scala"/>
  <color symbol="w" value="#7a7672" name="mura del mastio"/>
  <color symbol="d" value="#5a3d28" name="porta del mastio"/>
  <color symbol="c" value="#9a8e7a" name="cortile"/>
  <color symbol="n" value="#888074" name="lastricato"/>
  <color symbol="W" value="#686460" name="cinta muraria"/>
  <color symbol="t" value="#585450" name="torre"/>
  <color symbol="G" value="#4a3020" name="portone"/>
  <color symbol="r" value="#9e8c6c" name="strada"/>
  <color symbol="Q" value="#3d6a7a" name="pozzo"/>
  <color symbol="a" value="#355d78" name="fossato"/>
  <color symbol="T" value="#4a6a35" name="albero"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento del mastio, s zona scala, w mura del mastio, d porta del mastio, c cortile, n lastricato, W cinta muraria, t torre, G portone, Q pozzo, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
Ettttccccccccccccccccccccctttt
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccwwwwwwwwwwwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhsssshhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwwwwwwwwdddcccccWWEE
EEEWWcccccccccccccnnnccQccWWEE
EEEWWcccccccccccccnnncccccWWEE
EEEWWcccccccccccccnnncccccWWEE
EEEWWcccccccccccccnnncccccWWEE
EEEWWcccccccccccccnnncccccWWEE
EEEWWcccccccccccccnnncccccWWEE
EEEWWcccccccccccccnnncccccWWEE
Ettttcccccccccccccnnnccccctttt
EtttttWWWWWWWWWWWWGGGWWWWttttt
EtttttWWWWWWWWWWWWGGGWWWWttttt
EtttttEEEEEEEEEEEEErEEEEEttttt
EtttttEEEEEEEEEEEEErEEEEEttttt
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento del mastio, s zona scala, w mura del mastio, d porta del mastio, c cortile, n lastricato, W cinta muraria, t torre, G portone, Q pozzo, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
Ettttccccccccccccccccccccctttt
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccwwwwwwwwwwwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhsssshhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwwwwwwdddwwcccccWWEE
EEEWWcccccccccccnnncccccccWWEE
EEEWWcccccccccccnnncccccccWWEE
EEEWWcccccccccccnnncccccccWWEE
EEEWWccQccccccccnnncccccccWWEE
EEEWWcccccccccccnnncccccccWWEE
EEEWWcccccccccccnnncccccccWWEE
EEEWWcccccccccccnnncccccccWWEE
Ettttcccccccccccnnnccccccctttt
EtttttWWWWWWWWWWGGGWWWWWWttttt
EtttttWWWWWWWWWWGGGWWWWWWttttt
EtttttEEEEEEEEEEErEEEEEEEttttt
EtttttEEEEEEEEEEErEEEEEEEttttt
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento del mastio, s zona scala, w mura del mastio, d porta del mastio, c cortile, n lastricato, W cinta muraria, t torre, G portone, Q pozzo, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
Ettttccccccccccccccccccccctttt
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccwwwwwwwwwwwcccccWWEE
EEEWWccQccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhsssshhhwcccccWWEE
EEEWWcccccwwwwwwwwdddcccccWWEE
EEEWWcccccccccccccnnncccccWWEE
EEEWWcccccccccccccnnncccccWWEE
EEEWWcccccccccccccnnncccccWWEE
EEEWWcccccccccccccnnncccccWWEE
EEEWWcccccccccccccnnncccccWWEE
EEEWWcccccccccccccnnncccccWWEE
EEEWWcccccccccccccnnncccccWWEE
Ettttcccccccccccccnnnccccctttt
EtttttWWWWWWWWWWWWGGGWWWWttttt
EtttttWWWWWWWWWWWWGGGWWWWttttt
EtttttEEEEEEEEEEEEErEEEEEttttt
EtttttEEEEEEEEEEEEErEEEEEttttt
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento del mastio, s zona scala, w mura del mastio, d porta del mastio, c cortile, n lastricato, W cinta muraria, t torre, G portone, Q pozzo, a fossato, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtttttaaaaaaaaaaaaaaaaaaaaaaaaatttttEE
EEEtttttaaaaaaaaaaaaaaaaaaaaaaaaatttttEE
EEEtttttWWWWWWWWWWWWWWWWWWWWWWWWWtttttEE
EEEtttttWWWWWWWWWWWWWWWWWWWWWWWWWtttttEE
EEEttttcccccccccccccccccccccccccccttttEE
EEEaaWWcccccccccccccccccccccccccccWWEEEE
EEEaaWWcccccQcccccccccccccccccccccWWEEEE
EEEaaWWcccccccccccccccccccccccccccWWEEEE
EEEaaWWcccccccccccccccccccccccccccWWEEEE
EEEaaWWcccccccccccccccccccccccccccWWEEEE
EEEaaWWcccccccccccccccccccccccccccWWEEEE
EEEaaWWcccccccccccccccccccccccccccWWEEEE
EEEaaWWccccccccwwwwwwwwwwwccccccccWWEEEE
EEEaaWWccccccccwhhhhhhhhhwccccccccWWEEEE
EEEaaWWccccccccwhhsssshhhwccccccccWWEEEE
EEEaaWWccccccccwhhhhhhhhhwccccccccWWEEEE
EEEaaWWccccccccwwwwdddwwwwccccccccWWEEEE
EEEaaWWccccccccccccnnnccccccccccccWWEEEE
EEEaaWWccccccccccccnnnccccccccccccWWEEEE
EEEaaWWccccccccccccnnnccccccccccccWWEEEE
EEEaaWWccccccccccccnnnccccccccccccWWEEEE
EEEaaWWccccccccccccnnnccccccccccccWWEEEE
EEEaaWWccccccccccccnnnccccccccccccWWEEEE
EEEaaWWccccccccccccnnnccccccccccccWWEEEE
EEEttttccccccccccccnnnccccccccccccttttEE
EEEtttttWWWWWWWWWWWGGGWWWWWWWWWWWtttttEE
EEEtttttWWWWWWWWWWWGGGWWWWWWWWWWWtttttEE
EEEtttttaaaaaaaaaaaErEaaaaaaaaaaatttttEE
EEEtttttaaaaaaaaaaaErEaaaaaaaaaaatttttEE
EEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.07 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
  Forte:
  - Mastio (h pavimento, s zona scala, w mura, d porta del mastio): al centro-retro del cortile, a due piani con tetto a padiglione e finestre.
  - Cortile (c) attorno al mastio, con lastricato (n) dall'ingresso al mastio; ospita un pozzo (Q).
  - Cinta muraria (W) spessa due celle attorno al cortile, con torri angolari (t) di 5x5, merli (M) e feritoie (U).
  - Corpo di guardia / portone (G) sul lato frontale della cinta, con strada (r) dritta fino al bordo.
  - Fossato (a) attorno alle mura e alberi (Y) all'esterno dove lo spazio lo consente (taglia gargantuan).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdcnWtGQaYr" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio: nucleo attorno a H, almeno 7x7 celle (35x35 voxel) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="2" symmetry="()"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>
      <all in="H" out="h" steps="1"/>
      <!-- Zona scala nel mastio: 2 celle di pianerottolo prima, 4x2 per la scala -->
      <one in="hhhhhhh/hhhhhhh" out="*******/**ssss*" symmetry="()" steps="1"/>
      <!-- Mura del mastio -->
      <all in="[hs]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- Cortile attorno al mastio -->
      <all in="wE" out="*c" steps="4"/><all in="cE/*c" out="*c/**"/>
      <!-- Espansione del cortile dove c'è spazio -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- Cinta muraria spessa 2 celle attorno al cortile -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- Torri angolari 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- Via d'uscita: dal mastio al fronte attraverso porta (d), lastricato (n), portone (G), strada (r) -->
      <one in="h/w" out="*/d" symmetry="()" steps="1"/>
      <all in="d/w" out="*/d" symmetry="()"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <!-- Pozzo nel cortile dove entra 5x5 di cortile libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- Fossato attorno alla cinta dove c'è spazio libero -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <!-- Alberi all'esterno dove c'è 5x5 di terreno libero -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**Y**/*****/*****" steps="4"/>
    </sequence>
    <map scale="5 5 1" values="BEhswdcnWtGQaYrPuRfFTKLqAyOoNMUk#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="Q" out="ccccc/cqqqc/cqAqc/cqqqc/ccccc"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="Y" out="EEEEE/EEEEE/EEyEE/EEEEE/EEEEE"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <sequence symmetry="(xy)">
        <!-- B. Le altezze -->
        <!-- Porte a quota 0 (O) e passaggio a mura a quota 1 -->
        <all steps="1">
          <rule in="B d" out="d O"/>
          <rule in="B G" out="G O"/>
          <rule in="B w" out="w P"/>
          <rule in="B W" out="W P"/>
        </all>
        <prl>
          <rule in="d" out="w"/>
          <rule in="G" out="W"/>
        </prl>
        <!-- Mura del mastio: 2 piani (64 voxel) -->
        <all in="B w" out="w P" steps="5"/>
        <all in="B w" out="w u" steps="14"/>
        <all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="6"/>
        <all in="B w" out="w u" steps="14"/>
        <all in="B w" out="w P" steps="12"/>
        <prl in="w" out="R"/>
        <!-- Pavimenti e solaio del mastio e striscia della scala -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- Cinta muraria (24 voxel) e torri (40 voxel) -->
        <all in="B W" out="W P" steps="22"/>
        <prl in="W" out="P"/>
        <all in="B t" out="t P" steps="39"/>
        <prl in="t" out="P"/>
        <!-- Pozzo e alberi -->
        <all in="B q" out="q P" steps="4"/><prl in="q" out="P"/>
        <all in="B y" out="y K" steps="10"/><prl in="y" out="L"/>
        <all in="LB" out="*L" steps="2"/>

        <!-- C. Scala reale: porte, parti incluse, finestre, tetti -->
        <union symbol="+" values="Puw"/>
        <union symbol="%" values="P"/>
        <union symbol="=" values="fF"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <!-- Finestre nel mastio -->
        <one steps="14">
          <rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="P"/>
        <!-- Tetto a padiglione del mastio -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" hidden="True"/>
  <color symbol="E" value="#6b7a4a" hidden="True"/>
  <color symbol="c" value="#9a8e7a" name="cortile" area="courtyard"/>
  <color symbol="n" value="#888074" name="lastricato" area="courtyard"/>
  <color symbol="r" value="#9e8c6c" name="strada" area="road"/>
  <color symbol="a" value="#355d78" name="fossato" area="moat"/>
  <color symbol="A" value="#3d6a7a" name="acqua del pozzo"/>
  <color symbol="P" value="#7a7672" name="pietra delle mura"/>
  <color symbol="M" value="#686460" name="merli"/>
  <color symbol="U" value="#383430" name="feritoia"/>
  <color symbol="R" value="#8b4232" name="tegole del tetto"/>
  <color symbol="f" value="#b89868" name="pavimento" area="keep"/>
  <color symbol="F" value="#a08050" name="solaio"/>
  <color symbol="k" value="#947448" name="gradini"/>
  <color symbol="O" value="#5a3d28" name="porta"/>
  <color symbol="o" value="#3e2818" name="assi della porta"/>
  <color symbol="N" value="#504c48" name="stipite"/>
  <color symbol="L" value="#4a6a35" name="chioma"/>
  <color symbol="K" value="#5c422c" name="tronco"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="#90" hidden="True"/>
  <color symbol="#91" hidden="True"/>
  <color symbol="#92" hidden="True"/>
  <color symbol="#94" hidden="True"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
