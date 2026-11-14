# model.sculpt · gemini-4-hydrogen · 24 s

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
  Forte medievale:
  - Mastio (K mura, h interno, s zona scala, d porta del mastio) nella parte più lontana dall'ingresso, con almeno 2 piani coperti.
  - Corte (c) intorno al mastio, con pavimentazione (n) dalla porta del mastio al corpo di guardia, e un pozzo (Q) dove c'è spazio (5x5).
  - Cinta muraria (W) spessa 2 celle attorno alla corte, con torri angolari (t) di 5x5 e corpo di guardia (G) sul fronte.
  - Strada (r) dritta dal corpo di guardia fino al bordo anteriore.
  - Fossato (a) attorno alla cinta muraria dove il terreno prosegue oltre le mura (solo a taglia grande/gargantuan).
  - I semi variano l'ampiezza del mastio, l'estensione della corte e la posizione del pozzo.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEKhsdcWtGnrQam" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Il mastio attorno a H: 3 dietro, 4 avanti (+1 casuale), 4 ai lati -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <!-- Mura del mastio -->
      <all in="hE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>

      <!-- 2. Zona della scala nel mastio: lungo il muro posteriore, 2 celle di pianerottolo, 4x2 di scala -->
      <one in="KKKKKKK/Khhhhhh/Khhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- 3. Corte attorno al mastio, poi espansione dove c'è terreno libero -->
      <all in="KE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 4. Cinta muraria spessa 2 celle attorno alla corte -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 5. Torri angolari 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 6. Via d'uscita dritta da H al bordo anteriore: porta d, lastricato n, corpo di guardia G, strada r -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- 7. Pozzo nella corte dove c'è un 5x5 libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- 8. Fossato oltre la cinta dove il terreno prosegue -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>
  </map>

  <color symbol="E" value="6A7F4E" hidden="True"/>
  <color symbol="H" value="E6C229" name="centro"/>
  <color symbol="K" value="7A7672" name="mura del mastio" area="keep"/>
  <color symbol="h" value="C9B38C" name="interno del mastio" area="keep"/>
  <color symbol="s" value="A68A64" name="zona scala" area="keep"/>
  <color symbol="d" value="5C3A21" name="porta del mastio" area="keep"/>
  <color symbol="c" value="B8A990" name="corte" area="courtyard"/>
  <color symbol="W" value="8C8881" name="cinta muraria" area="wall"/>
  <color symbol="t" value="6E6A66" name="torre" area="tower"/>
  <color symbol="G" value="524E4A" name="corpo di guardia" area="gatehouse"/>
  <color symbol="n" value="9E9589" name="lastricato" area="courtyard"/>
  <color symbol="r" value="8F816B" name="strada" area="road"/>
  <color symbol="Q" value="4A7C9B" name="pozzo" area="courtyard"/>
  <color symbol="a" value="3B6E8C" name="fossato" area="moat"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, K mura del mastio, h interno del mastio, s zona scala, d porta del mastio, c corte, W cinta muraria, t torre, G corpo di guardia, n lastricato, r strada, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
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
EEEWWcccccKKKKKKKKKKKcccccWWEE
EEEWWcccccKhhsssshhhKcccccWWEE
EEEWWccQccKhhsssshhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKKKKdddKKKKcccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
Ettttcccccccccnnnccccccccctttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttEEEEEEEEErEEEEEEEEEttttt
EtttttEEEEEEEEErEEEEEEEEEttttt
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, K mura del mastio, h interno del mastio, s zona scala, d porta del mastio, c corte, W cinta muraria, t torre, G corpo di guardia, n lastricato, r strada, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
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
EEEWWcccccKKKKKKKKKKKcccccWWEE
EEEWWcccccKhhsssshhhKcccccWWEE
EEEWWcccccKhhsssshhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKKKKdddKKKKcccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWccccccQccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
Ettttcccccccccnnnccccccccctttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttEEEEEEEEErEEEEEEEEEttttt
EtttttEEEEEEEEErEEEEEEEEEttttt
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, K mura del mastio, h interno del mastio, s zona scala, d porta del mastio, c corte, W cinta muraria, t torre, G corpo di guardia, n lastricato, r strada, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttEEEEEEEEEEEEEEEEEEEttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
Ettttccccccccccccccccccccctttt
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccQcccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccKKKKKKKKKKKcccccWWEE
EEEWWcccccKhhsssshhhKcccccWWEE
EEEWWcccccKhhsssshhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKhhhhhhhhhKcccccWWEE
EEEWWcccccKKKKdddKKKKcccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
Ettttcccccccccnnnccccccccctttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttEEEEEEEEErEEEEEEEEEttttt
EtttttEEEEEEEEErEEEEEEEEEttttt
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, K mura del mastio, h interno del mastio, s zona scala, d porta del mastio, c corte, W cinta muraria, t torre, G corpo di guardia, n lastricato, r strada, Q pozzo, a fossato
Plan (the letter of every cell):
```
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
EEEaaWWcccccccccccccccccccccccccccWWEEEE
EEEaaWWcccccccccccccccccccccccccccWWEEEE
EEEaaWWcccccccccccccccccccccccccccWWEEEE
EEEaaWWcccccccccccccccccccccccccccWWEEEE
EEEaaWWcccccccccccccccccccccccccccWWEEEE
EEEaaWWcccccccccccccccccccccccccccWWEEEE
EEEaaWWccccccccKKKKKKKKKKKccccccccWWEEEE
EEEaaWWccccccccKhhsssshhhKccccccccWWEEEE
EEEaaWWccccccccKhhsssshhhKccccccccWWEEEE
EEEaaWWccccccccKhhhhhhhhhKccccccccWWEEEE
EEEaaWWccccccccKhhhhhhhhhKccccccccWWEEEE
EEEaaWWccccccccKhhhhhhhhhKccccccccWWEEEE
EEEaaWWccccccccKhhhhhhhhhKccccccccWWEEEE
EEEaaWWccccccccKhhhhhhhhhKccccccccWWEEEE
EEEaaWWccccccccKhhhhhhhhhKccccccccWWEEEE
EEEaaWWccccccccKKKKdddKKKKccccccccWWEEEE
EEEaaWWccccccccccccnnnccccccccccccWWEEEE
EEEaaWWccccccccccccnnnccccccQcccccWWEEEE
EEEaaWWccccccccccccnnnccccccccccccWWEEEE
EEEaaWWccccccccccccnnnccccccccccccWWEEEE
EEEaaWWccccccccccccnnnccccccccccccWWEEEE
EEEaaWWccccccccccccnnnccccccccccccWWEEEE
EEEaaWWccccccccccccnnnccccccccccccWWEEEE
EEEttttccccccccccccnnnccccccccccccttttEE
EEEtttttWWWWWWWWWWWGGGWWWWWWWWWWWtttttEE
EEEtttttWWWWWWWWWWWGGGWWWWWWWWWWWtttttEE
EEEtttttEEEEEEEEEEEErEEEEEEEEEEEEtttttEE
EEEtttttEEEEEEEEEEEErEEEEEEEEEEEEtttttEE
EEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
  Forte medievale:
  - Mastio (K mura, h interno, s zona scala, d porta del mastio) nella parte più lontana dall'ingresso, con 2 piani coperti (64 voxel) e tetto a padiglione (R).
  - Corte (c) intorno al mastio, con pavimentazione (n) dalla porta del mastio al corpo di guardia, e un pozzo (Q) dove c'è spazio (5x5).
  - Cinta muraria (W -> V) spessa 2 celle alta 24 attorno alla corte, con merli (M) e feritoie (U), torri angolari (t -> Z) di 5x5 alte 40, e corpo di guardia (G -> V) alto 36 sul fronte.
  - Strada (r) larga 3 celle dritta dal corpo di guardia fino al bordo anteriore.
  - Fossato (a) attorno alla cinta muraria dove il terreno prosegue oltre le mura.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEKhsdcWtGnrQa" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Il mastio attorno a H: dimensioni variabili per seme -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>
      <!-- Mura del mastio -->
      <all in="hE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>

      <!-- 2. Zona della scala nel mastio: lungo il muro posteriore, 2 celle di pianerottolo, 4x2 di scala -->
      <one in="KKKKKKK/Khhhhhh/Khhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- 3. Corte attorno al mastio, poi espansione dove c'è terreno libero -->
      <all in="KE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 4. Cinta muraria spessa 2 celle attorno alla corte -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 5. Torri angolari 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 6. Via d'uscita dritta da H al bordo anteriore: porta d, lastricato n, corpo di guardia G, strada r (larga 3) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/K" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- 7. Pozzo nella corte dove c'è un 5x5 libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- 8. Fossato oltre la cinta dove il terreno prosegue -->
      <all in="cWWEEEE" out="***aa**" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>

    <map scale="5 5 1" values="BEKhsdcWtGnrQawuLfFRVZTMOoNUk#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="K" out="KKKKK/KKKKK/KKKKK/KKKKK/KKKKK"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QaaaQ/QaaaQ/QaaaQ/QQQQQ"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="wVuZ"/>
        <union symbol="%" values="VZ"/>
        <union symbol="=" values="fF"/>

        <!-- B. Altezze -->
        <!-- Mura del mastio (K -> w, u, R) alte 64 -->
        <all in="B K" out="K w" steps="6"/>
        <all in="B K" out="K u" steps="14"/>
        <all in="B K" out="K w" steps="12"/>
        <all in="B K" out="K w" steps="6"/>
        <all in="B K" out="K u" steps="14"/>
        <all in="B K" out="K w" steps="12"/>
        <prl in="K" out="R"/>

        <!-- Porta del mastio (d -> O alla base, w sopra fino a 64) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d w" steps="63"/>
        <prl in="d" out="R"/>

        <!-- Interno del mastio (h) e zona scala (s): 2 piani coperti -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Cinta muraria (W -> V) alta 24 -->
        <all in="B W" out="W V" steps="23"/>
        <prl in="W" out="V"/>

        <!-- Corpo di guardia (G -> O alla base, V sopra fino a 36) -->
        <all in="B G" out="G O" steps="1"/>
        <all in="B G" out="G V" steps="35"/>
        <prl in="G" out="V"/>

        <!-- Torri angolari (t -> Z) alte 40 -->
        <all in="B t" out="t Z" steps="39"/>
        <prl in="t" out="Z"/>

        <!-- Pozzo (Q) alto 4 -->
        <all in="B Q" out="Q V" steps="4"/>
        <prl in="Q" out="V"/>

        <!-- C. Scala reale: parti incluse, finestre, tetto, pulizia -->
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>

        <!-- Finestre del mastio -->
        <one steps="14">
          <rule in="Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu Bu/Bu/Bu/Bu/Bu/Bu"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="w"/>

        <!-- Tetto a padiglione del mastio (R) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**"
             out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="6A7F4E" hidden="True"/>
  <color symbol="H" value="E6C229" hidden="True"/>
  <color symbol="w" value="7A7672" name="pietra del mastio" area="keep"/>
  <color symbol="V" value="8C8881" name="pietra della cinta" area="wall"/>
  <color symbol="Z" value="6E6A66" name="pietra della torre" area="tower"/>
  <color symbol="M" value="96918A" name="merlo"/>
  <color symbol="U" value="3A3632" name="feritoia"/>
  <color symbol="L" value="8AB4C9" name="vetro"/>
  <color symbol="f" value="A67C52" name="pavimento in legno" area="keep"/>
  <color symbol="F" value="8F6843" name="solaio in legno" area="keep"/>
  <color symbol="k" value="B88E62" name="gradino"/>
  <color symbol="R" value="9E4738" name="tetto in tegole"/>
  <color symbol="O" value="5C3A21" name="porta" area="gatehouse"/>
  <color symbol="o" value="472C18" name="assi della porta" area="gatehouse"/>
  <color symbol="N" value="4A4642" name="stipite"/>
  <color symbol="c" value="B8A990" name="corte" area="courtyard"/>
  <color symbol="n" value="9E9589" name="lastricato" area="courtyard"/>
  <color symbol="r" value="8F816B" name="strada" area="road"/>
  <color symbol="a" value="3B6E8C" name="fossato" area="moat"/>
  <color symbol="#20" value="5C3A21" hidden="True"/>
  <color symbol="#21" value="472C18" hidden="True"/>

  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>
