# model.sculpt · claude-opus-5-5 · 119 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · size huge (7.5 × 7.5 × 6 tiles, 20 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 7.5 × 7.5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 500 × 500 × 160, 25 × 25 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Your program so far
<!--
  FORTE: le parti e dove stanno
  - h il mastio (keep): il corpo intorno al centro H, 9 celle di larghezza, da 9 a 10 di profondità; w i suoi muri; s la zona della scala, contro il muro posteriore.
  - c il cortile (courtyard): un anello intorno al mastio. Cresce di 4 dove dietro restano 6 celle di terra, e di altre 3 dove ne restano 7.
  - W la cinta: un anello di 2 celle intorno al cortile. t le torri di 5 × 5 su ogni angolo esterno della cinta.
  - La via d'uscita è sull'asse frontale (+y): d è la porta del mastio, n il selciato del cortile, G il corpo di guardia nella cinta, r la strada fino al bordo. È larga tre celle.
  - Q il pozzo, in 5 × 5 di cortile libero, dove c'è posto.
  - a il fossato, oltre la cinta, solo dove la terra prosegue (gargantuan). La strada lo attraversa come un ponte.
  Cosa cambia con i semi: la profondità del mastio (una cella in più), il lato della zona della scala, la posizione del pozzo.
  Cosa entra a ogni taglia:
  - large: mastio, cortile stretto, cinta, torri.
  - huge: il cortile più largo e il pozzo.
  - gargantuan: un cortile ampio, il pozzo e il fossato tutto intorno.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwscWtGrdnQam" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- il mastio -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- il cortile -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- la cinta -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- le torri agli angoli -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- la via d'uscita: porta, selciato, corpo di guardia, strada -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/><all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- la zona della scala -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- il pozzo nel cortile -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- il fossato -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="H" rgb="#ff00ff" name="centro"/>
  <color symbol="h" rgb="#c9b48a" name="sala del mastio" area="keep"/>
  <color symbol="w" rgb="#8a8a80" name="muro del mastio"/>
  <color symbol="s" rgb="#a0764a" name="scala"/>
  <color symbol="c" rgb="#9fb06a" name="cortile" area="courtyard"/>
  <color symbol="W" rgb="#a7a396" name="cinta"/>
  <color symbol="t" rgb="#6f6c66" name="torre" area="tower"/>
  <color symbol="G" rgb="#7a5c44" name="corpo di guardia"/>
  <color symbol="r" rgb="#b89b6a" name="strada"/>
  <color symbol="d" rgb="#5a3b26" name="porta"/>
  <color symbol="n" rgb="#9c8f7a" name="selciato"/>
  <color symbol="Q" rgb="#4a7fa8" name="pozzo"/>
  <color symbol="a" rgb="#5b8fb0" name="fossato"/>
  <color symbol="m" rgb="#ff8800" name="segno della via"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, h sala del mastio, w muro del mastio, s scala, c cortile, W cinta, t torre, G corpo di guardia, r strada, d porta, n selciato, Q pozzo
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
EEEWWccccccccccQccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccwwwwwwwwwwwcccccWWEE
EEEWWcccccwhhsssshhhwcccccWWEE
EEEWWcccccwhhsssshhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwwwwdddwwwwcccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
Ettttcccccccccnnnccccccccctttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttEEEEEEEEErEEEEEEEEEttttt
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, h sala del mastio, w muro del mastio, s scala, c cortile, W cinta, t torre, G corpo di guardia, r strada, d porta, n selciato, Q pozzo
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
EEEWWccccccQccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccwwwwwwwwwwwcccccWWEE
EEEWWcccccwhhsssshhhwcccccWWEE
EEEWWcccccwhhsssshhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwwwwdddwwwwcccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
Ettttcccccccccnnnccccccccctttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttEEEEEEEEErEEEEEEEEEttttt
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, h sala del mastio, w muro del mastio, s scala, c cortile, W cinta, t torre, G corpo di guardia, r strada, d porta, n selciato, Q pozzo
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
EEEWWcccccwwwwwwwwwwwcccccWWEE
EEEWWcccccwhhsssshhhwcccccWWEE
EEEWWcccccwhhsssshhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwccQccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwwwwdddwwwwcccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
Ettttcccccccccnnnccccccccctttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttEEEEEEEEErEEEEEEEEEttttt
```
### gargantuan, seed 1: grid 100×100×160, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, h sala del mastio, w muro del mastio, s scala, c cortile, W cinta, t torre, G corpo di guardia, r strada, d porta, n selciato, Q pozzo, a fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEttaaaaaaaaaaaaattEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEttWWWWWWWWWWWWWttEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEtccccccccccccccttEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEaWcccccccccccccWaEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEaWcccccccccccccWaEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEaWcccccccccccccWaEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEaWccccwwwwwccccWaEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEaWcccchsshhccccWaEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEaWcccchhhhhccccWaEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEaWcccchhhhhccccWaEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEaWcccchhhhhccccWaEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEaWccccwwdwwccccWaEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEaWccccccnccccccWaEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEaWccccccnccccccWaEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEaWccccccnccccccWaEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEttccccccnccccccttEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEttWWWWWWGWWWWWtttEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEttaaaaaEraaaaaEttEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  FORTE: le parti e dove stanno
  - h il mastio (keep) intorno al centro H; w i suoi muri; s la zona della scala contro il muro di fondo; d la porta del mastio sul fronte.
  - c il cortile intorno al mastio; cresce dove la terra prosegue.
  - W la cinta di 2 celle intorno al cortile; t le torri agli angoli e una o due torri mezzane su lati a caso.
  - n il selciato dalla porta del mastio a G, il corpo di guardia nella cinta; r la strada fino al bordo.
  - Q il pozzo in 5 × 5 di cortile libero; a il fossato oltre la cinta dove c'e' terra (gargantuan).
  I semi cambiano: la profondita' del mastio (davanti e dietro), le torri mezzane, il pozzo.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwscWtGrdnQame" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <one steps="1" symmetry="()"><rule in="E/h" out="h/*"/><rule in="E/h" out="e/*"/></one>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <one steps="1" symmetry="()"><rule in="h/E" out="*/h"/><rule in="h/E" out="*/e"/></one>
      <one steps="1" symmetry="()"><rule in="h/E" out="*/h"/><rule in="h/E" out="*/e"/></one>
      <prl in="e" out="E"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/><all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="WWWWW/WWWWW/EEEEE" out="ttttt/ttttt/ttttt" steps="2"/>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>
    <map scale="5 5 1" values="BEhwscCZGDOgnrqafFWVLRTkMNoUxy" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="CCCCC/CCCCC/CCCCC/CCCCC/CCCCC"/>
      <rule in="t" out="ZZZZZ/ZZZZZ/ZZZZZ/ZZZZZ/ZZZZZ"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="d" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="qqqqq/qaaaq/qaaaq/qaaaq/qqqqq"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <sequence symmetry="(xy)">
        <prl in="B G" out="g O"/>
        <prl in="B D" out="w O"/>
        <all in="B g" out="g g" steps="34"/>
        <all in="B C" out="C C" steps="23"/>
        <all in="B Z" out="Z Z" steps="40"/>
        <all in="B q" out="q q" steps="5"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w V" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w V" steps="14"/><all in="B w" out="w W" steps="13"/>
        <prl in="w" out="W"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="F"/><rule in="s" out="F"/></prl>
        <one steps="24"><rule in="BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LVVVVB" out="*LLLL*"/>
        <prl in="V" out="W"/>
        <union symbol="+" values="WCZg"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="CZg"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="H" rgb="#ff00ff" name="centro"/>
  <color symbol="m" rgb="#ff8800" name="segno della via"/>
  <color symbol="e" rgb="#ff8800" name="segno"/>
  <color symbol="t" rgb="#6f6c66" name="torre" area="tower"/>
  <color symbol="W" rgb="#d8cfb8" name="muro del mastio"/>
  <color symbol="w" rgb="#d8cfb8" name="muro del mastio"/>
  <color symbol="h" rgb="#c9b48a" name="sala del mastio" area="keep"/>
  <color symbol="s" rgb="#a0764a" name="scala"/>
  <color symbol="G" rgb="#7a5c44" name="corpo di guardia"/>
  <color symbol="d" rgb="#5a3b26" name="porta"/>
  <color symbol="Q" rgb="#4a7fa8" name="pozzo"/>
  <color symbol="c" hidden="True" name="cortile" area="courtyard"/>
  <color symbol="C" rgb="#a7a396" name="cinta di pietra"/>
  <color symbol="Z" rgb="#77736b" name="pietra delle torri" area="tower"/>
  <color symbol="g" rgb="#8f8676" name="corpo di guardia"/>
  <color symbol="D" rgb="#5a3b26" name="porta"/>
  <color symbol="n" rgb="#9c8f7a" name="selciato"/>
  <color symbol="r" rgb="#b89b6a" name="strada"/>
  <color symbol="q" rgb="#8c8c84" name="pozzo di pietra"/>
  <color symbol="a" rgb="#5b8fb0" name="acqua"/>
  <color symbol="f" rgb="#a0764a" name="pavimento di assi" area="keep"/>
  <color symbol="F" rgb="#b5a58a" name="solaio di lastre"/>
  <color symbol="V" rgb="#d8cfb8" name="muro del mastio"/>
  <color symbol="L" rgb="#3d5a73" name="finestra"/>
  <color symbol="R" rgb="#a5402e" name="tetto"/>
  <color symbol="T" rgb="#a0764a" name="scala"/>
  <color symbol="k" rgb="#8a6440" name="gradini"/>
  <color symbol="M" rgb="#bdb5a2" name="merli"/>
  <color symbol="U" rgb="#2a2a2a" name="feritoia"/>
  <color symbol="N" rgb="#4a3020" name="cornice della porta"/>
  <color symbol="O" rgb="#7a4a2a" name="porta"/>
  <color symbol="o" rgb="#3e2716" name="assi della porta"/>
  <color symbol="x" hidden="True" name="porta aperta"/>
  <color symbol="y" hidden="True" name="porta aperta"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="x"/><rule in="o" out="y"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="x" out="O"/><rule in="y" out="o"/></all></action>
</sequence>
```
