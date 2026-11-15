# model.sculpt · claude-fable-5-1 · 259 s

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
FORTE — composizione
Parti: il mastio (interno h, muri w) al centro; la sua porta d sul fronte; attorno il cortile c, lastricato n sull'asse;
la cinta W spessa due celle; torri t sugli angoli esterni; il corpo di guardia G sul fronte, la strada r fino al bordo;
la scala s nel mastio lungo un muro; al Huge il cortile si allarga avanti e ai lati: pozzo Q nel cortile e stalla b contro la cinta.
I semi cambiano: un lato del cortile cresce di una cella (quale lato), il muro su cui sta la scala, dove cadono pozzo e stalla.
Large: mastio in cinta stretta con torri. Huge: cortile largo, pozzo, stalla.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwmdscnWGrtQb" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- mastio: interno 7x7 attorno ad H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- cortile: una cella attorno, poi una cella in più su un lato a caso -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <one in="cE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- al Huge il cortile cresce avanti e ai lati dove la terra continua -->
      <all in="c/E/E/E/E/E/E" out="*/c/c/c/c/*/*" symmetry="()" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" symmetry="(x)" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- cinta spessa due -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- torri d'angolo 3x3 -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <!-- l'uscita: porta del mastio, lastricato, corpo di guardia, strada -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/><all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- la zona della scala lungo un muro del mastio -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- pozzo e stalla dove il cortile è largo -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="Wcc/Wcc/Wcc/Wcc/Wcc" out="*b*/*b*/*b*/*b*/*b*" symmetry="(x)" steps="1"/>
      <all in="Wbc" out="**b" symmetry="(x)" steps="1"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="H" value="FF00FF" name="centro"/>
  <color symbol="h" value="D9C8A0" name="pavimento del mastio" area="keep"/>
  <color symbol="w" value="8A8A80" name="muro del mastio"/>
  <color symbol="m" value="FFAA00" name="asse"/>
  <color symbol="d" value="6B3F1E" name="porta del mastio"/>
  <color symbol="s" value="C08040" name="zona della scala"/>
  <color symbol="c" value="7FA85A" name="cortile" area="courtyard"/>
  <color symbol="n" value="B8B0A0" name="lastricato"/>
  <color symbol="W" value="6E6E68" name="cinta"/>
  <color symbol="G" value="5A5A55" name="corpo di guardia"/>
  <color symbol="r" value="C2A878" name="strada"/>
  <color symbol="t" value="5F5F5A" name="torre" area="tower"/>
  <color symbol="Q" value="4A7FB0" name="pozzo"/>
  <color symbol="b" value="A06A3A" name="stalla" area="barn"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, h pavimento del mastio, w muro del mastio, d porta del mastio, s zona della scala, c cortile, n lastricato, W cinta, G corpo di guardia, r strada, t torre
Plan (the letter of every cell):
```
EtttttEEEEEEEEEttttt
EtttttEEEEEEEEEttttt
EtttttWWWWWWWWWttttt
EtttttWWWWWWWWWttttt
Ettttccccccccccctttt
EEEWWcccccccccccWWEE
EEEWWcwwwwwwwwwcWWEE
EEEWWcwhhsssshwcWWEE
EEEWWcwhhsssshwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwwwdddwwwcWWEE
Ettttccccnnncccctttt
EtttttWWWGGGWWWttttt
EtttttWWWGGGWWWttttt
EtttttEEEErEEEEttttt
EtttttEEEErEEEEttttt
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, h pavimento del mastio, w muro del mastio, d porta del mastio, s zona della scala, c cortile, n lastricato, W cinta, G corpo di guardia, r strada, t torre
Plan (the letter of every cell):
```
EtttttEEEEEEEEEttttt
EtttttEEEEEEEEEttttt
EtttttWWWWWWWWWttttt
EtttttWWWWWWWWWttttt
Ettttccccccccccctttt
EEEWWcccccccccccWWEE
EEEWWcwwwwwwwwwcWWEE
EEEWWcwhhsssshwcWWEE
EEEWWcwhhsssshwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwwwdddwwwcWWEE
Ettttccccnnncccctttt
EtttttWWWGGGWWWttttt
EtttttWWWGGGWWWttttt
EtttttEEEErEEEEttttt
EtttttEEEErEEEEttttt
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, h pavimento del mastio, w muro del mastio, d porta del mastio, s zona della scala, c cortile, n lastricato, W cinta, G corpo di guardia, r strada, t torre
Plan (the letter of every cell):
```
EtttttEEEEEEEEEttttt
EtttttEEEEEEEEEttttt
EtttttWWWWWWWWWttttt
EtttttWWWWWWWWWttttt
Ettttccccccccccctttt
EEEWWcccccccccccWWEE
EEEWWcwwwwwwwwwcWWEE
EEEWWcwhhsssshwcWWEE
EEEWWcwhhsssshwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwhhhhhhhwcWWEE
EEEWWcwwwdddwwwcWWEE
Ettttccccnnncccctttt
EtttttWWWGGGWWWttttt
EtttttWWWGGGWWWttttt
EtttttEEEErEEEEttttt
EtttttEEEErEEEEttttt
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terra, h pavimento del mastio, w muro del mastio, d porta del mastio, s zona della scala, c cortile, n lastricato, W cinta, G corpo di guardia, r strada, t torre, Q pozzo, b stalla
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEtttttEEEEEEEEEEEEEEEEEtttttE
EEtttttEEEEEEEEEEEEEEEEEtttttE
EEtttttWWWWWWWWWWWWWWWWWtttttE
EEtttttWWWWWWWWWWWWWWWWWtttttE
EEttttcccccccccccccccccccttttE
EEEEWWcccccccccccccccccccWWEEE
EEEEWWbbcccwwwwwwwwwcccccWWEEE
EEEEWWbbcccwhhsssshwcccccWWEEE
EEEEWWbbcccwhhsssshwcccccWWEEE
EEEEWWbbcccwhhhhhhhwcccccWWEEE
EEEEWWbbcccwhhhhhhhwcccccWWEEE
EEEEWWcccccwhhhhhhhwcccccWWEEE
EEEEWWcccccwhhhhhhhwcccccWWEEE
EEEEWWcccccwhhhhhhhwccQccWWEEE
EEEEWWcccccwwwdddwwwcccccWWEEE
EEEEWWccccccccnnnccccccccWWEEE
EEEEWWccccccccnnnccccccccWWEEE
EEEEWWccccccccnnnccccccccWWEEE
EEEEWWccccccccnnnccccccccWWEEE
EEttttccccccccnnnccccccccttttE
EEtttttWWWWWWWGGGWWWWWWWtttttE
EEtttttWWWWWWWGGGWWWWWWWtttttE
EEtttttEEEEEEEErEEEEEEEEtttttE
EEtttttEEEEEEEErEEEEEEEEtttttE
EEEEEEEEEEEEEEErEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
FORTE — composizione
Parti: il mastio (interno h, muri w) al centro, profondo 7 o 8 celle (a caso); la sua porta d sul fronte; attorno il cortile c,
una cella più largo su uno o due lati scelti a caso; lastricato n sull'asse; la cinta W spessa due; torri t 3x3 sugli angoli;
il corpo di guardia G sul fronte, la strada r fino al bordo; la scala s lungo il muro di fondo del mastio (posizione a caso).
Al Huge il cortile cresce avanti e ai lati: stalla b con pali P contro la cinta, pozzo Q nel cortile.
Altezze: mastio 65 (due piani, piattaforma merlata), cinta 44, corpo di guardia 50, torri 56, tettoia 34.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwmdscnWGrtQbP" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- mastio: 3 dietro, 3 davanti e una in più a caso, 3 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="[Hh]/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- cortile: una cella attorno, poi una in più su uno o due lati a caso -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <one in="wcE" out="**c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <one in="wcE" out="**c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- al Huge il cortile cresce avanti e ai lati dove la terra continua -->
      <all in="c/E/E/E/E/E/E" out="*/c/c/c/c/*/*" symmetry="()" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" symmetry="(x)" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- cinta spessa due -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- torri d'angolo 3x3 -->
      <all in="EE/EW" out="**/*t"/>
      <all in="t[EW]" out="*t" steps="1"/>
      <all in="t[EW]/*[EW]" out="**/*t"/>
      <!-- l'uscita: porta del mastio, lastricato, corpo di guardia, strada -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/><all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- la zona della scala lungo il muro di fondo del mastio -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- stalla contro la cinta e pozzo, dove il cortile è largo -->
      <one in="Wccccc/Wccccc/Wccccc/Wccccc/Wccccc" out="*bbbb*/*bbbb*/*bbbb*/*bbbb*/*bbbb*" symmetry="(x)" steps="1"/>
      <all in="bc" out="P*" symmetry="(x)" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwdscnWGrtQbPafFKuLVjJpqkTMOoNUxz#90#91#92#94" symmetry="()">
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="Q" out="ccccc/cQQQc/cQaQc/cQQQc/ccccc"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="P" out="bbbbb/bpppb/bpppb/bpppb/bbbbb"/>
      <sequence symmetry="(xy)">
        <union symbol="+" values="KV"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="VK"/>
        <!-- B. i muri del mastio: 65, con due fasce per le finestre; la porta d lascia O al piede -->
        <all steps="1"><rule in="B w" out="w K"/><rule in="B d" out="w O"/></all>
        <all in="B w" out="w K" steps="5"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w K" steps="12"/>
        <all in="B w" out="w K" steps="6"/><all in="B w" out="w u" steps="14"/><all in="B w" out="w K" steps="12"/>
        <all in="B w" out="w K" steps="1"/>
        <prl in="w" out="K"/>
        <!-- la cinta 44, il corpo di guardia 50 con la porta al piede, le torri 56 -->
        <all in="B W" out="W V" steps="44"/><prl in="W" out="V"/>
        <all in="B G" out="G O" steps="1"/><all in="B G" out="G V" steps="49"/><prl in="G" out="V"/>
        <all in="B t" out="t V" steps="56"/><prl in="t" out="V"/>
        <!-- i piani del mastio -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="F"/><rule in="s" out="F"/></prl>
        <!-- il pozzo e la stalla: pali 33, tettoia a 34 -->
        <all in="B Q" out="Q q" steps="3"/><prl in="Q" out="q"/>
        <all in="B p" out="p p" steps="33"/>
        <all in="B b" out="j b" steps="1"/><all in="B j" out="j B" steps="33"/>
        <all in="B p" out="J *" steps="1"/><prl in="j" out="J"/>
        <!-- C. le parti -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <!-- le finestre nelle fasce: 3 larghe, 8 alte, due di muro tra l'una e l'altra -->
        <one steps="60" in="uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB uB/uB/uB/uB/uB/uB/uB" out="**/**/**/**/**/**/** **/**/**/**/**/**/** **/**/**/**/**/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/L*/L*/L*/**/** **/**/**/**/**/**/** **/**/**/**/**/**/** **/**/**/**/**/**/**"/>
        <all in="LuuuuB" out="*LLLL*"/>
        <prl in="u" out="K"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True" name="terra"/>
  <color symbol="c" value="7FA85A" name="cortile" area="courtyard"/>
  <color symbol="n" value="B8B0A0" name="lastricato"/>
  <color symbol="r" value="C2A878" name="strada"/>
  <color symbol="b" value="C9A25A" name="paglia della stalla" area="barn"/>
  <color symbol="a" value="4A7FB0" name="acqua del pozzo"/>
  <color symbol="q" value="8C8C84" name="pietra del pozzo"/>
  <color symbol="p" value="6B4A2A" name="palo"/>
  <color symbol="J" value="9A4A32" name="tettoia"/>
  <color symbol="f" value="B07A45" name="assi del pavimento" area="keep"/>
  <color symbol="F" value="7D6A50" name="solaio"/>
  <color symbol="K" value="A09A88" name="pietra del mastio"/>
  <color symbol="V" value="6E6E68" name="pietra della cinta" area="tower"/>
  <color symbol="M" value="5A5A55" name="merlo"/>
  <color symbol="L" value="2E4A6B" name="finestra"/>
  <color symbol="U" value="1E2A38" name="feritoia"/>
  <color symbol="k" value="8A7050" name="gradino"/>
  <color symbol="O" value="6B3F1E" name="porta"/>
  <color symbol="o" value="4A2A12" name="assi della porta"/>
  <color symbol="N" value="5C5C58" name="stipite"/>
  <color symbol="x" hidden="True" name="porta aperta"/>
  <color symbol="z" hidden="True" name="assi aperte"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="x"/><rule in="o" out="z"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="x" out="O"/><rule in="z" out="o"/></all></action>
</sequence>
