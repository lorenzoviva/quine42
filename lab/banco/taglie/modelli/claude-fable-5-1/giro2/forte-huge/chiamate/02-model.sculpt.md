# model.sculpt · claude-fable-5-1 · 352 s

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
<!-- FORTE: anello di mura (W) spesse due celle con torri (t) ai quattro angoli esterni, una porta-torre (G) sul fronte
     in asse con il centro, dentro una corte (c) con il mastio (h/w) al centro; dal mastio la porta (d), il lastricato (n),
     la porta-torre e la strada (r) fino al bordo. Scala (s) del mastio lungo il muro di fondo.
     I semi cambiano: la profondità del mastio (una cella in più sul fronte), il lato della corte allargato di una cella,
     la posizione della scala lungo il muro di fondo.
     Huge (30 celle): mastio, corte stretta, anello, torri, porta-torre, strada.
     Gargantuan (40 celle): corte più larga, un pozzo (Q), un magazzino (b/v) addossato alle mura, il fossato (a) attorno. -->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwcWtdnGrsmQbva" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- il mastio -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- la corte: tre celle attorno, una in più su un lato a caso, altre due dove il terreno prosegue per nove celle -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="2"/><all in="cE/*c" out="*c/**"/>
      <one in="cE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEE" out="*cc*******" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- l'anello delle mura, spesso due -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- le torri di 5 x 5 sugli angoli esterni -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- la via d'uscita: dal centro dritto sul fronte -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- la zona della scala lungo il muro di fondo del mastio -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- quello che entra solo nell'area grande: il pozzo, il magazzino contro le mura, il fossato -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="Wcccccc/Wcccccc/Wcccccc/Wcccccc/Wcccccc/Wcccccc" out="*******/*bbbb**/*bbbb**/*bbbb**/*bbbb**/*******" symmetry="(x)" steps="1"/>
      <all in="bc" out="*v"/><all in="vc/*v" out="*v/**"/>
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
    </sequence>
  </map>
  <color symbol="h" value="C8B88A" name="pavimento del mastio" area="keep"/>
  <color symbol="w" value="6E6A62" name="muro del mastio"/>
  <color symbol="c" value="8FA860" name="corte" area="courtyard"/>
  <color symbol="W" value="7D7A74" name="mura"/>
  <color symbol="t" value="5E5B57" name="torre" area="tower"/>
  <color symbol="d" value="6B4A2A" name="porta del mastio"/>
  <color symbol="n" value="B5AE9C" name="lastricato" area="courtyard"/>
  <color symbol="G" value="4E4A46" name="porta-torre" area="gate"/>
  <color symbol="r" value="A8956A" name="strada" area="road"/>
  <color symbol="s" value="D9C48E" name="zona della scala" area="keep"/>
  <color symbol="m" value="FF00FF" name="segno"/>
  <color symbol="Q" value="4A7FA8" name="pozzo" area="courtyard"/>
  <color symbol="b" value="C9A96E" name="pavimento del magazzino" area="storehouse"/>
  <color symbol="v" value="8A6A48" name="muro del magazzino"/>
  <color symbol="a" value="4C86B4" name="fossato" area="moat"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, w muro del mastio, c corte, W mura, t torre, d porta del mastio, n lastricato, G porta-torre, r strada, s zona della scala, a fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtttttaaaaaaaaaaaaaaatttttEE
EEEtttttaaaaaaaaaaaaaaatttttEE
EEEtttttWWWWWWWWWWWWWWWtttttEE
EEEtttttWWWWWWWWWWWWWWWtttttEE
EEEttttcccccccccccccccccttttEE
EEEaaWWcccccccccccccccccWWEEEE
EEEaaWWcccccccccccccccccWWEEEE
EEEaaWWcccwwwwwwwwwwwcccWWEEEE
EEEaaWWcccwhhsssshhhwcccWWEEEE
EEEaaWWcccwhhsssshhhwcccWWEEEE
EEEaaWWcccwhhhhhhhhhwcccWWEEEE
EEEaaWWcccwhhhhhhhhhwcccWWEEEE
EEEaaWWcccwhhhhhhhhhwcccWWEEEE
EEEaaWWcccwhhhhhhhhhwcccWWEEEE
EEEaaWWcccwhhhhhhhhhwcccWWEEEE
EEEaaWWcccwhhhhhhhhhwcccWWEEEE
EEEaaWWcccwhhhhhhhhhwcccWWEEEE
EEEaaWWcccwwwwdddwwwwcccWWEEEE
EEEaaWWcccccccnnncccccccWWEEEE
EEEaaWWcccccccnnncccccccWWEEEE
EEEaaWWcccccccnnncccccccWWEEEE
EEEttttcccccccnnncccccccttttEE
EEEtttttWWWWWWGGGWWWWWWtttttEE
EEEtttttWWWWWWGGGWWWWWWtttttEE
EEEtttttEEEEEErrrEEEEEEtttttEE
EEEtttttEEEEEErrrEEEEEEtttttEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, w muro del mastio, c corte, W mura, t torre, d porta del mastio, n lastricato, G porta-torre, r strada, s zona della scala, a fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtttttaaaaaaaaaaaaaaatttttEE
EEEtttttaaaaaaaaaaaaaaatttttEE
EEEtttttWWWWWWWWWWWWWWWtttttEE
EEEtttttWWWWWWWWWWWWWWWtttttEE
EEEttttcccccccccccccccccttttEE
EEEaaWWcccccccccccccccccWWEEEE
EEEaaWWcccccccccccccccccWWEEEE
EEEaaWWcccccccccccccccccWWEEEE
EEEaaWWcccwwwwwwwwwwwcccWWEEEE
EEEaaWWcccwhhsssshhhwcccWWEEEE
EEEaaWWcccwhhsssshhhwcccWWEEEE
EEEaaWWcccwhhhhhhhhhwcccWWEEEE
EEEaaWWcccwhhhhhhhhhwcccWWEEEE
EEEaaWWcccwhhhhhhhhhwcccWWEEEE
EEEaaWWcccwhhhhhhhhhwcccWWEEEE
EEEaaWWcccwhhhhhhhhhwcccWWEEEE
EEEaaWWcccwhhhhhhhhhwcccWWEEEE
EEEaaWWcccwhhhhhhhhhwcccWWEEEE
EEEaaWWcccwwwwdddwwwwcccWWEEEE
EEEaaWWcccccccnnncccccccWWEEEE
EEEaaWWcccccccnnncccccccWWEEEE
EEEttttcccccccnnncccccccttttEE
EEEtttttWWWWWWGGGWWWWWWtttttEE
EEEtttttWWWWWWGGGWWWWWWtttttEE
EEEtttttEEEEEErrrEEEEEEtttttEE
EEEtttttEEEEEErrrEEEEEEtttttEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, w muro del mastio, c corte, W mura, t torre, d porta del mastio, n lastricato, G porta-torre, r strada, s zona della scala, a fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtttttaaaaaaaaaaaaaaaatttttE
EEEtttttaaaaaaaaaaaaaaaatttttE
EEEtttttWWWWWWWWWWWWWWWWtttttE
EEEtttttWWWWWWWWWWWWWWWWtttttE
EEEttttccccccccccccccccccttttE
EEEaaWWccccccccccccccccccWWEEE
EEEaaWWccccccccccccccccccWWEEE
EEEaaWWcccwwwwwwwwwwwccccWWEEE
EEEaaWWcccwhhsssshhhwccccWWEEE
EEEaaWWcccwhhsssshhhwccccWWEEE
EEEaaWWcccwhhhhhhhhhwccccWWEEE
EEEaaWWcccwhhhhhhhhhwccccWWEEE
EEEaaWWcccwhhhhhhhhhwccccWWEEE
EEEaaWWcccwhhhhhhhhhwccccWWEEE
EEEaaWWcccwhhhhhhhhhwccccWWEEE
EEEaaWWcccwhhhhhhhhhwccccWWEEE
EEEaaWWcccwhhhhhhhhhwccccWWEEE
EEEaaWWcccwwwwdddwwwwccccWWEEE
EEEaaWWcccccccnnnccccccccWWEEE
EEEaaWWcccccccnnnccccccccWWEEE
EEEttttcccccccnnnccccccccttttE
EEEtttttWWWWWWGGGWWWWWWWtttttE
EEEtttttWWWWWWGGGWWWWWWWtttttE
EEEtttttEEEEEErrrEEEEEEEtttttE
EEEtttttEEEEEErrrEEEEEEEtttttE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, w muro del mastio, c corte, W mura, t torre, d porta del mastio, n lastricato, G porta-torre, r strada, s zona della scala, Q pozzo, a fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEtttttaaaaaaaaaaaaaaaaaaatttttEEEEE
EEEEEEtttttaaaaaaaaaaaaaaaaaaatttttEEEEE
EEEEEEtttttWWWWWWWWWWWWWWWWWWWtttttEEEEE
EEEEEEtttttWWWWWWWWWWWWWWWWWWWtttttEEEEE
EEEEEEttttcccccccccccccccccccccttttEEEEE
EEEEEEaaWWcccccccccccccccccccccWWaaEEEEE
EEEEEEaaWWcccccccccccccccccccccWWaaEEEEE
EEEEEEaaWWcccccccccccccccccccccWWaaEEEEE
EEEEEEaaWWcccccccccccccccccccccWWaaEEEEE
EEEEEEaaWWcccccwwwwwwwwwwwcccccWWaaEEEEE
EEEEEEaaWWcccccwhhsssshhhwcccccWWaaEEEEE
EEEEEEaaWWcccccwhhsssshhhwcccccWWaaEEEEE
EEEEEEaaWWcccccwhhhhhhhhhwcccccWWaaEEEEE
EEEEEEaaWWcccccwhhhhhhhhhwcccccWWaaEEEEE
EEEEEEaaWWcccccwhhhhhhhhhwcccccWWaaEEEEE
EEEEEEaaWWcccccwhhhhhhhhhwcccccWWaaEEEEE
EEEEEEaaWWcccccwhhhhhhhhhwcccccWWaaEEEEE
EEEEEEaaWWcccccwhhhhhhhhhwcccccWWaaEEEEE
EEEEEEaaWWcccccwhhhhhhhhhwcccccWWaaEEEEE
EEEEEEaaWWcccccwwwwdddwwwwcccccWWaaEEEEE
EEEEEEaaWWcccccccccnnncccccccccWWaaEEEEE
EEEEEEaaWWcccccccccnnncccccccccWWaaEEEEE
EEEEEEaaWWccccQccccnnncccccccccWWaaEEEEE
EEEEEEaaWWcccccccccnnncccccccccWWaaEEEEE
EEEEEEaaWWcccccccccnnncccccccccWWaaEEEEE
EEEEEEttttcccccccccnnncccccccccttttEEEEE
EEEEEEtttttWWWWWWWWGGGWWWWWWWWtttttEEEEE
EEEEEEtttttWWWWWWWWGGGWWWWWWWWtttttEEEEE
EEEEEEtttttaaaaaaaarrraaaaaaaatttttEEEEE
EEEEEEtttttaaaaaaaarrraaaaaaaatttttEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.17 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!-- FORTE: anello di mura (W) spesse due celle con torri (t) ai quattro angoli esterni, una porta-torre (G) sul fronte
     in asse con il centro, dentro una corte (c) con il mastio (h/w) al centro; dal mastio la porta (d), il lastricato (n),
     la porta-torre e la strada (r) fino al bordo. Scala (s) del mastio lungo il muro di fondo, in un punto a caso.
     I semi cambiano: la profondità del mastio (una cella in più sul fronte), il lato della corte allargato di una cella,
     la posizione della scala lungo il muro di fondo.
     Huge (30 celle): mastio, corte stretta, anello, torri, porta-torre, strada.
     Gargantuan (40 celle): corte larga sei, un pozzo (Q), un magazzino (b/v) addossato alle mura, il fossato (a) attorno.
     Altezze: mastio 65 (due piani, terrazza merlata), porta-torre 44, torri 40, magazzino 31, mura 24 con cammino. -->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="PXD"/>
  <union symbol="=" values="fF"/>
  <union symbol="%" values="XD"/>
  <map scale="1/5 1/5 1" values="BHEhwcWtdnGrsmQbva" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- il mastio -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- la corte: tre celle attorno, una in più su un lato a caso, altre tre dove il terreno prosegue per nove celle -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="2"/><all in="cE/*c" out="*c/**"/>
      <one in="cE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEE" out="*ccc******" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- l'anello delle mura, spesso due -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- le torri di 5 x 5 sugli angoli esterni -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- la via d'uscita: dal centro dritto sul fronte -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- la zona della scala lungo il muro di fondo del mastio, in un punto a caso, con il pianerottolo a sinistra e pavimento a destra -->
      <one in="wwwwwww/hhhhhhh/hhhhhhh" out="*******/**ssss*/**ssss*" symmetry="()" steps="1"/>
      <!-- quello che entra solo nell'area grande: il pozzo, il magazzino contro le mura, il fossato -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="Wcccccc/Wcccccc/Wcccccc/Wcccccc/Wcccccc/Wcccccc" out="*******/*bbbb**/*bbbb**/*bbbb**/*bbbb**/*******" symmetry="(x)" steps="1"/>
      <all in="bc" out="*v"/><all in="vc/*v" out="*v/**"/>
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
    </sequence>
    <map scale="5 5 1" values="BEhwcWtdnGrsQbvafFRTkPugLOoNDXAVyJMU#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="Q" out="QQQQQ/QAAAQ/QAAAQ/QAAAQ/QQQQQ"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <sequence symmetry="(xy)">
        <!-- B. le altezze -->
        <!-- la porta del mastio: il seme O in basso, una colonna di muro (g) che sale sopra -->
        <all in="B d" out="g O" steps="1"/>
        <all in="B g" out="g P" steps="64"/>
        <prl in="g" out="P"/>
        <!-- le mura del mastio: due piani con la fascia delle finestre, 65 -->
        <all in="B w" out="w P" steps="6"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="6"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w P" steps="12"/>
        <all in="B w" out="w P" steps="1"/>
        <prl in="w" out="P"/>
        <!-- i pavimenti, la striscia della scala, il solaio, la terrazza -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- le mura con il cammino, 24 -->
        <all in="B W" out="W X" steps="23"/>
        <prl in="W" out="X"/>
        <!-- le torri, 40; la porta-torre, 44 -->
        <all in="B t" out="t D" steps="39"/>
        <prl in="t" out="D"/>
        <all in="B G" out="G D" steps="43"/>
        <prl in="G" out="D"/>
        <!-- il magazzino: muri 31, tetto piano -->
        <all in="B b" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="30"/>
        <prl in="y" out="J"/>
        <all in="B v" out="v V" steps="30"/>
        <prl in="v" out="V"/>
        <!-- il pozzo: la vera alta 5 -->
        <all in="B Q" out="Q *" steps="4"/>
        <!-- C. la scala vera -->
        <!-- la porta della porta-torre: dalla strada attraverso tutto lo spessore -->
        <all in="D/r" out="O/*" symmetry="()" steps="1"/>
        <all in="D/O" out="O/*" symmetry="()" steps="9"/>
        <!-- la porta del magazzino verso la corte -->
        <one in="bVVVVVc" out="*OOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/V" out="*/O" symmetry="()" steps="5"/>
        <all in="V/O" out="O/*" symmetry="()" steps="5"/>
        <import file="part-door"/>
        <!-- le finestre nella fascia del mastio -->
        <one steps="14"><rule in="uB/uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB/uB" out="**/L*/L*/L*/L*/L*/L*/** **/L*/L*/L*/L*/L*/L*/** **/L*/L*/L*/L*/L*/L*/** **/L*/L*/L*/L*/L*/L*/** **/L*/L*/L*/L*/L*/L*/** **/L*/L*/L*/L*/L*/L*/** **/L*/L*/L*/L*/L*/L*/** **/L*/L*/L*/L*/L*/L*/**"/></one>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="P"/>
        <!-- merli, feritoie, scala -->
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="h" value="C8B88A" name="pavimento del mastio" area="keep"/>
  <color symbol="w" value="6E6A62" name="muro del mastio"/>
  <color symbol="c" value="8FA860" name="corte" area="courtyard"/>
  <color symbol="W" value="7D7A74" name="mura"/>
  <color symbol="t" value="5E5B57" name="torre" area="tower"/>
  <color symbol="d" value="6B4A2A" name="porta del mastio"/>
  <color symbol="n" value="B5AE9C" name="lastricato" area="courtyard"/>
  <color symbol="G" value="4E4A46" name="porta-torre" area="gate"/>
  <color symbol="r" value="A8956A" name="strada" area="road"/>
  <color symbol="s" value="D9C48E" name="zona della scala" area="keep"/>
  <color symbol="m" value="FF00FF" name="segno"/>
  <color symbol="Q" value="9A948A" name="vera del pozzo" area="courtyard"/>
  <color symbol="A" value="4A7FA8" name="acqua del pozzo" area="courtyard"/>
  <color symbol="b" value="C9A96E" name="pavimento del magazzino" area="storehouse"/>
  <color symbol="v" value="8A6A48" name="muro del magazzino"/>
  <color symbol="V" value="8A6A48" name="assi del magazzino"/>
  <color symbol="J" value="A0522D" name="tetto del magazzino"/>
  <color symbol="a" value="4C86B4" name="fossato" area="moat"/>
  <color symbol="f" value="C8B88A" name="assi del pavimento" area="keep"/>
  <color symbol="F" value="8B6E4A" name="solaio"/>
  <color symbol="R" value="7A7470" name="terrazza del mastio"/>
  <color symbol="P" value="6E6A62" name="pietra del mastio"/>
  <color symbol="X" value="7D7A74" name="pietra delle mura"/>
  <color symbol="D" value="5E5B57" name="pietra delle torri" area="tower"/>
  <color symbol="M" value="8A8680" name="merli"/>
  <color symbol="U" value="2A2622" name="feritoia"/>
  <color symbol="L" value="3A4A5A" name="finestra"/>
  <color symbol="k" value="B59B6A" name="gradini"/>
  <color symbol="O" value="6B4A2A" name="porta"/>
  <color symbol="o" value="4A3018" name="assi della porta"/>
  <color symbol="N" value="8B7355" name="stipite"/>
  <color symbol="T" value="FF00FF" name="striscia della scala" hidden="True"/>
  <color symbol="#20" value="000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="000000" name="assi aperte" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
