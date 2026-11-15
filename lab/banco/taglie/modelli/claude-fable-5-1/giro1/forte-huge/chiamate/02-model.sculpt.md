# model.sculpt · claude-fable-5-1 · 221 s

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
FORTE. Parti: il mastio (h interno, w mura, s scala, d porta) al centro, la corte c attorno,
la cinta W di due celle con torri t ai quattro angoli esterni, il corpo di guardia G sulla
porta della cinta, la strada r davanti fino al bordo, il lastricato n che unisce la porta del
mastio alla cinta. Il mastio ha 3 celle dietro e 5-6 davanti al centro (il seme decide),
la scala in un angolo; la corte è una cella a Huge. A Gargantuan la corte si allarga di 3
dove restano 11 celle di terreno, nascono il pozzo Q (5x5 di corte), una tettoia a contro
la cinta (dove la corte è profonda 4) e il fossato x attorno alla cinta dove il terreno va oltre.
I semi cambiano: la profondità del mastio, la posizione di pozzo e tettoia, il fossato.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsmdcnWGtrQax" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- il mastio -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- la scala in un angolo del mastio -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- la corte: una cella, tre di piu' dove il terreno va oltre di undici -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEEE" out="*ccc********" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- la cinta di due celle -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- le torri agli angoli -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- il fossato, solo dove il terreno va oltre -->
      <all in="[Wt]EEEEEEEE" out="**x******" steps="1"/>
      <all in="[WtG]EE/[WtG]Ex" out="**x/***"/>
      <all in="tE/Ex" out="**/x*"/>
      <all in="xE/Ex" out="**/x*"/>
      <!-- la via d'uscita: porta del mastio, lastricato, corpo di guardia, strada -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/[Ex]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/><all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- il pozzo e la tettoia, dove la corte e' larga -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/*aaaaa*/*aaaaa*/*aaaaa*/*******" steps="1"/>
    </sequence>
  </map>
  <color symbol="h" value="d9c7a0" name="pavimento del mastio" area="keep"/>
  <color symbol="w" value="8a8a8a" name="muro del mastio"/>
  <color symbol="s" value="b08050" name="zona della scala"/>
  <color symbol="d" value="5a3a1a" name="porta del mastio"/>
  <color symbol="c" value="7fa05a" name="corte" area="courtyard"/>
  <color symbol="n" value="c0b89a" name="lastricato"/>
  <color symbol="W" value="6f6f6f" name="cinta"/>
  <color symbol="G" value="5f5f5f" name="corpo di guardia"/>
  <color symbol="t" value="7a7a7a" name="torre" area="tower"/>
  <color symbol="r" value="b8a070" name="strada"/>
  <color symbol="Q" value="4a6a8a" name="pozzo"/>
  <color symbol="a" value="a06a3a" name="tettoia" area="porch"/>
  <color symbol="x" value="4f7fa0" name="fossato"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, w muro del mastio, s zona della scala, d porta del mastio, c corte, n lastricato, W cinta, G corpo di guardia, t torre, r strada, x fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEtttttxxxxxxxxxxxtttttEEEE
EEEEEtttttExEEEEEEExEtttttEEEE
EEEEEtttttWWWWWWWWWWWtttttEEEE
EEEEEtttttWWWWWWWWWWWtttttEEEE
EEEEEttttcccccccccccccttttEEEE
EEEEEEEWWcwwwwwwwwwwwcWWEEEEEE
EEEEExxWWcwhhsssshhhwcWWxxEEEE
EEEEEEEWWcwhhsssshhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEExxWWcwhhhhhhhhhwcWWxxEEEE
EEEEEEEWWcwwwwdddwwwwcWWEEEEEE
EEEEEttttcccccnnncccccttttEEEE
EEEEEtttttWWWWGGGWWWWtttttEEEE
EEEEEtttttWWWWGGGWWWWtttttEEEE
EEEEEtttttExEEErEEExEtttttEEEE
EEEEEtttttExEEErEEExEtttttEEEE
EEEEEEEEEEEEEEErEEEEEEEEEEEEEE
EEEEEEEEEEEEEEErEEEEEEEEEEEEEE
EEEEEEEEEEEEEEErEEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, w muro del mastio, s zona della scala, d porta del mastio, c corte, n lastricato, W cinta, G corpo di guardia, t torre, r strada, x fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEtttttxxxxxxxxxxxtttttEEEE
EEEEEtttttExEEEEEEExEtttttEEEE
EEEEEtttttWWWWWWWWWWWtttttEEEE
EEEEEtttttWWWWWWWWWWWtttttEEEE
EEEEEttttcccccccccccccttttEEEE
EEEEEEEWWcwwwwwwwwwwwcWWEEEEEE
EEEEExxWWcwhhsssshhhwcWWxxEEEE
EEEEEEEWWcwhhsssshhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEExxWWcwhhhhhhhhhwcWWxxEEEE
EEEEEEEWWcwwwwdddwwwwcWWEEEEEE
EEEEEttttcccccnnncccccttttEEEE
EEEEEtttttWWWWGGGWWWWtttttEEEE
EEEEEtttttWWWWGGGWWWWtttttEEEE
EEEEEtttttExEEErEEExEtttttEEEE
EEEEEtttttExEEErEEExEtttttEEEE
EEEEEEEEEEEEEEErEEEEEEEEEEEEEE
EEEEEEEEEEEEEEErEEEEEEEEEEEEEE
EEEEEEEEEEEEEEErEEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, w muro del mastio, s zona della scala, d porta del mastio, c corte, n lastricato, W cinta, G corpo di guardia, t torre, r strada, x fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEtttttxxxxxxxxxxxtttttEEEE
EEEEEtttttExEEEEEEExEtttttEEEE
EEEEEtttttWWWWWWWWWWWtttttEEEE
EEEEEtttttWWWWWWWWWWWtttttEEEE
EEEEEttttcccccccccccccttttEEEE
EEEEEEEWWcwwwwwwwwwwwcWWEEEEEE
EEEEExxWWcwhhsssshhhwcWWxxEEEE
EEEEEEEWWcwhhsssshhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEEEEWWcwhhhhhhhhhwcWWEEEEEE
EEEEExxWWcwhhhhhhhhhwcWWxxEEEE
EEEEEEEWWcwwwwdddwwwwcWWEEEEEE
EEEEEttttcccccnnncccccttttEEEE
EEEEEtttttWWWWGGGWWWWtttttEEEE
EEEEEtttttWWWWGGGWWWWtttttEEEE
EEEEEtttttExEEErEEExEtttttEEEE
EEEEEtttttExEEErEEExEtttttEEEE
EEEEEEEEEEEEEEErEEEEEEEEEEEEEE
EEEEEEEEEEEEEEErEEEEEEEEEEEEEE
EEEEEEEEEEEEEEErEEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, w muro del mastio, s zona della scala, d porta del mastio, c corte, n lastricato, W cinta, G corpo di guardia, t torre, r strada, a tettoia, x fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEExxxxxEEEEEEEEEEEEEEEEExxxxxEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEtttttxxxxxxxxxxxxxxxxxtttttEEEEEE
EEEEEEEtttttExEEEEEEEEEEEEExEtttttEEEEEE
EEEEEEEtttttWWWWWWWWWWWWWWWWWtttttEEEEEE
EEEEEEEtttttWWWWWWWWWWWWWWWWWtttttEEEEEE
EEEEEEEttttccccccaaaaaccccccccttttEEEEEE
EEEEEEExEWWccccccaaaaaccccccccWWExEEEEEE
EEEEEEExxWWccccccaaaaaccccccccWWxxEEEEEE
EEEEEEExEWWcccccccccccccccccccWWExEEEEEE
EEEEEEExEWWccccwwwwwwwwwwwccccWWExEEEEEE
EEEEEEExEWWccccwhhsssshhhwccccWWExEEEEEE
EEEEEEExEWWccccwhhsssshhhwccccWWExEEEEEE
EEEEEEExEWWccccwhhhhhhhhhwccccWWExEEEEEE
EEEEEEExEWWccccwhhhhhhhhhwccccWWExEEEEEE
EEEEEEExEWWccccwhhhhhhhhhwccccWWExEEEEEE
EEEEEEExEWWccccwhhhhhhhhhwccccWWExEEEEEE
EEEEEEExEWWccccwhhhhhhhhhwccccWWExEEEEEE
EEEEEEExEWWccccwhhhhhhhhhwccccWWExEEEEEE
EEEEEEExEWWccccwhhhhhhhhhwccccWWExEEEEEE
EEEEEEExEWWccccwwwwdddwwwwccccWWExEEEEEE
EEEEEEExEWWccccccccnnnccccccccWWExEEEEEE
EEEEEEExxWWccccccccnnnccccccccWWxxEEEEEE
EEEEEEExEWWccccccccnnnccccccccWWExEEEEEE
EEEEEEEttttccccccccnnnccccccccttttEEEEEE
EEEEEEEtttttWWWWWWWGGGWWWWWWWtttttEEEEEE
EEEEEEEtttttWWWWWWWGGGWWWWWWWtttttEEEEEE
EEEEEEEtttttExEEEEEErEEEEEExEtttttEEEEEE
EEEEEEEtttttExEEEEEErEEEEEExEtttttEEEEEE
EEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
FORTE. Parti: il mastio (h interno, w mura, s scala, d porta) al centro, la corte c attorno,
la cinta W di due celle con torri t ai quattro angoli esterni, il corpo di guardia G sulla
porta della cinta, la strada r davanti fino al bordo, il lastricato n che unisce la porta del
mastio alla cinta. Il mastio ha 3-4 celle dietro e 5-6 davanti al centro (il seme decide),
la scala in un angolo dietro o davanti (il seme decide); la corte è una cella a Huge.
A Gargantuan la corte si allarga di 3 dove restano 11 celle di terreno, nascono il pozzo Q,
una tettoia a/e contro la cinta (dove la corte è profonda 4) e il fossato x attorno alla cinta
dove il terreno va oltre. Altezze: cinta 24, corpo di guardia 40, mastio 65 (due piani), torri 80.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="PVCZY"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="PCYZ"/>
  <map scale="1/5 1/5 1" values="BHEhwsmdcnWGtrQaex" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- il mastio -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- la scala in un angolo del mastio, dietro o davanti -->
      <one steps="1" symmetry="()">
        <rule in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss"/>
        <rule in="whhhhhh/whhhhhh/wwwwwww" out="***ssss/***ssss/*******"/>
      </one>
      <!-- la corte: una cella, tre di piu' dove il terreno va oltre di undici -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEEE" out="*ccc********" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- la cinta di due celle -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- le torri agli angoli -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- il fossato, solo dove il terreno va oltre di sette -->
      <all in="[Wt]EEEEEEE" out="*x******" steps="1"/>
      <all in="[Wt]E/*x" out="*x/**"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- la via d'uscita: porta del mastio, lastricato, corpo di guardia, strada -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/[Ex]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/><all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- il pozzo e la tettoia, dove la corte e' larga -->
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"/>
      <one in="WWWWWWW/ccccccc/ccccccc/ccccccc/ccccccc" out="*******/*aaaaa*/*aaaaa*/*aaaaa*/*aaaaa*" steps="1"/>
      <all in="ac" out="e*" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwsdcnWGtrQxpbyJPVCZYfFRTkMLUNOo#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="ccccc/cQQQc/cQcQc/cQQQc/ccccc"/>
      <rule in="a" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="e" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <sequence symmetry="(xy)">
        <!-- B. le mura del mastio: intonaco, fascia delle finestre, intonaco, due piani, parapetto -->
        <all in="B w" out="w P" steps="1"/>
        <all in="B d" out="w O" steps="1"/>
        <all in="B w" out="w P" steps="5"/><all in="B w" out="w V" steps="14"/><all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="6"/><all in="B w" out="w V" steps="14"/><all in="B w" out="w P" steps="13"/>
        <prl in="w" out="P"/>
        <!-- la cinta, il corpo di guardia con la sua porta, le torri -->
        <all in="B W" out="W C" steps="23"/><prl in="W" out="C"/>
        <all in="B G" out="G O" steps="1"/><all in="B G" out="G Z" steps="38"/><prl in="G" out="Z"/>
        <all in="B t" out="t Y" steps="79"/><prl in="t" out="Y"/>
        <!-- i piani del mastio -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- il pozzo -->
        <all in="B Q" out="Q q" steps="3"/><prl in="Q" out="q"/>
        <!-- la tettoia: pali e tetto -->
        <all in="B b" out="b b" steps="33"/>
        <all in="B p" out="y *" steps="1"/><all in="B y" out="y B" steps="33"/><prl in="y" out="J"/>
        <!-- C. le finestre nella fascia -->
        <one in="VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB VB/VB/VB" out="L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L* L*/L*/L*" steps="16"/>
        <all in="LVVVVB" out="*LLLL*"/>
        <prl in="V" out="P"/>
        <!-- le parti -->
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" value="6a8a4a" name="terreno" hidden="True"/>
  <color symbol="c" value="7fa05a" name="corte" area="courtyard"/>
  <color symbol="n" value="c0b89a" name="lastricato"/>
  <color symbol="r" value="b8a070" name="strada"/>
  <color symbol="x" value="4f7fa0" name="fossato"/>
  <color symbol="P" value="9a9a92" name="pietra del mastio" area="keep"/>
  <color symbol="C" value="6f6f6a" name="pietra della cinta"/>
  <color symbol="Z" value="5f5f5a" name="corpo di guardia"/>
  <color symbol="Y" value="7a7a74" name="pietra delle torri" area="tower"/>
  <color symbol="f" value="b08050" name="assi del pavimento"/>
  <color symbol="F" value="8a6a40" name="solaio"/>
  <color symbol="R" value="a09a80" name="terrazza del mastio"/>
  <color symbol="k" value="c0a070" name="gradini"/>
  <color symbol="M" value="8a8a82" name="merli"/>
  <color symbol="U" value="2a2a2a" name="feritoia"/>
  <color symbol="L" value="3a5070" name="vetro"/>
  <color symbol="N" value="5a5a52" name="stipiti"/>
  <color symbol="O" value="5a3a1a" name="porta"/>
  <color symbol="o" value="3a2410" name="assi della porta"/>
  <color symbol="q" value="4a6a8a" name="pozzo"/>
  <color symbol="p" value="c8b088" name="pavimento della tettoia" area="porch"/>
  <color symbol="b" value="6a4a2a" name="pali"/>
  <color symbol="J" value="a04030" name="tegole della tettoia"/>
  <color symbol="#20" value="000000" hidden="True"/>
  <color symbol="#21" value="000000" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
