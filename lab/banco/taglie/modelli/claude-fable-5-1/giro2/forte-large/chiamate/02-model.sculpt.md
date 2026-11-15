# model.sculpt · claude-fable-5-1 · 285 s

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
FORTE. Parti del concetto e lettere:
  mastio al centro: pavimento h, muri w, zona della scala s (contro il muro di fondo, pianerottolo di 2 celle prima)
  cortile c attorno al mastio; cinta W attorno al cortile (sottile a 5x5, doppia a 7.5); torri t sugli angoli esterni, una e' il torrione g
  l'uscita in asse dal centro verso il fronte: porta d nel muro del mastio, lastricato n, porta carraia G nella cinta, strada r fino al bordo
  Huge: il cortile cresce dove la terra continua, con pozzo Q e caserma a (tettoia) contro la cinta
I semi cambiano: la profondita' del mastio, quale torre e' il torrione, dove sta la caserma e il pozzo.
-->
<sequence values="BHEhwscWtgGdnrmQa" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwscWtgGdnrmQa" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- mastio: linea per H, 4 dietro, 4 davanti, una in piu' a caso, poi 4 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- scala contro il muro di fondo -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- cortile, piu' largo dove la terra continua -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*cccc***" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- cinta, doppia dove c'e' spazio -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WEEEEE" out="*W****" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- torri agli angoli, una e' il torrione -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <one in="t" out="g" steps="1"/><all in="gt" out="*g"/>
      <!-- l'uscita in asse -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- cortile grande: caserma contro la cinta e pozzo -->
      <one in="Wccccc/Wccccc/Wccccc/Wccccc/Wccccc/Wccccc/Wccccc/Wccccc" out="******/*aaaa*/*aaaa*/*aaaa*/*aaaa*/*aaaa*/*aaaa*/******" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" hidden="True"/>
  <color symbol="m" hidden="True"/>
  <color symbol="h" value="C8A878" name="pavimento del mastio" area="keep"/>
  <color symbol="w" value="8A8A80" name="muro del mastio"/>
  <color symbol="s" value="B08050" name="zona della scala"/>
  <color symbol="c" value="7FA050" name="cortile" area="courtyard"/>
  <color symbol="W" value="6E6E68" name="cinta"/>
  <color symbol="t" value="5A5A58" name="torre" area="tower"/>
  <color symbol="g" value="484846" name="torrione" area="tower"/>
  <color symbol="G" value="7A6050" name="porta carraia"/>
  <color symbol="d" value="A06030" name="porta"/>
  <color symbol="n" value="B0A890" name="lastricato"/>
  <color symbol="r" value="C0A070" name="strada"/>
  <color symbol="Q" value="4070A0" name="pozzo"/>
  <color symbol="a" value="A8905A" name="caserma" area="barracks"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento del mastio, w muro del mastio, s zona della scala, c cortile, W cinta, t torre, g torrione, G porta carraia, d porta, n lastricato, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EgggggEEEEEEEEEttttt
EgggggEEEEEEEEEttttt
EgggggWWWWWWWWWttttt
Egggcccccccccccccttt
Egggcwwwwwwwwwwwcttt
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
Etttcwwwwdddwwwwcttt
Etttcccccnnncccccttt
EtttttWWWGGGWWWttttt
EtttttEEErrrEEEttttt
EtttttEEErrrEEEttttt
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento del mastio, w muro del mastio, s zona della scala, c cortile, W cinta, t torre, g torrione, G porta carraia, d porta, n lastricato, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEggggg
EtttttEEEEEEEEEggggg
EtttttWWWWWWWWWggggg
Etttcccccccccccccggg
Etttcwwwwwwwwwwwcggg
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
Etttcwwwwdddwwwwcttt
Etttcccccnnncccccttt
EtttttWWWGGGWWWttttt
EtttttEEErrrEEEttttt
EtttttEEErrrEEEttttt
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento del mastio, w muro del mastio, s zona della scala, c cortile, W cinta, t torre, g torrione, G porta carraia, d porta, n lastricato, r strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEggggg
EtttttEEEEEEEEEggggg
EtttttWWWWWWWWWggggg
Etttcccccccccccccggg
Etttcwwwwwwwwwwwcggg
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
Etttcwwwwdddwwwwcttt
Etttcccccnnncccccttt
EtttttWWWGGGWWWttttt
EtttttEEErrrEEEttttt
EtttttEEErrrEEEttttt
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento del mastio, w muro del mastio, s zona della scala, c cortile, W cinta, t torre, g torrione, G porta carraia, d porta, n lastricato, r strada, Q pozzo, a caserma
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEgggggEEEEEEEEEEEEEEEEEtttttE
EEgggggEEEEEEEEEEEEEEEEEtttttE
EEgggggWWWWWWWWWWWWWWWWWtttttE
EEgggcccccccccaaaaaacccccctttE
EEgggcccccccccaaaaaacccccctttE
EEEEWcccccccccaaaaaaccccccWEEE
EEEEWcccccccccaaaaaaccccccWEEE
EEEEWccQccccccccccccccccccWEEE
EEEEWcccccwwwwwwwwwwwcccccWEEE
EEEEWcccccwhhsssshhhwcccccWEEE
EEEEWcccccwhhsssshhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwwwwdddwwwwcccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEtttcccccccccnnnccccccccctttE
EEtttcccccccccnnnccccccccctttE
EEtttttWWWWWWWGGGWWWWWWWtttttE
EEtttttEEEEEEErrrEEEEEEEtttttE
EEtttttEEEEEEErrrEEEEEEEtttttE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.09 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
FORTE. Parti del concetto e lettere:
  mastio al centro: pavimento h, muri w, zona della scala s (contro il muro di fondo, pianerottolo di 2 celle prima, a destra o a sinistra)
  cortile c attorno al mastio; cinta W attorno al cortile (sottile a 5x5, doppia a 7.5); torri t sugli angoli esterni, una e' il torrione g
  l'uscita in asse dal centro verso il fronte: porta d nel muro del mastio, lastricato n, porta carraia G nella cinta, strada r fino al bordo
  Huge: il cortile cresce dove la terra continua, con pozzo Q e caserma a (tettoia su pali) contro la cinta
I semi cambiano: profondita' e larghezza del mastio (un lato cresce di una cella), lato della scala, quale torre e' il torrione, dove stanno caserma e pozzo.
Altezze: cinta 24, torri e porta carraia 40, torrione 56, mastio 66 con lastrico a 64; merli su tutto.
-->
<sequence values="BHEhwscWtgGdnrmQaX" symmetry="(xy)" soil="E" origin="bottom">
  <union symbol="+" values="qbVvYD"/>
  <union symbol="=" values="fFP"/>
  <union symbol="%" values="vY"/>
  <map scale="1/5 1/5 1" values="BHEhwscWtgGdnrmQaX" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- mastio: linea per H, 4 dietro e una a caso, 4 davanti e una a caso; un lato cresce di una cella a caso -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <prl in="HE" out="*X" p="0.5" steps="1" symmetry="(x)"/>
      <all in="[HhX]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="X" out="h"/>
      <all in="hE/*h" out="*h/**"/><all in="*h/hE" out="**/*h"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- scala contro il muro di fondo, a sinistra o a destra -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="(x)" steps="1"/>
      <!-- cortile, piu' largo dove la terra continua -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*cccc***" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- cinta, doppia dove c'e' spazio -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WEEEEE" out="*W****" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- torri agli angoli, una e' il torrione -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <one in="t" out="g" steps="1"/><all in="gt" out="*g"/>
      <!-- l'uscita in asse -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <!-- cortile grande: caserma contro la cinta e pozzo -->
      <one in="Wccccc/Wccccc/Wccccc/Wccccc/Wccccc/Wccccc/Wccccc/Wccccc" out="******/*aaaa*/*aaaa*/*aaaa*/*aaaa*/*aaaa*/*aaaa*/******" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhwscWtgGnrQefFPqbLVvYDZApyJTkOoNMU#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="Q" out="ccccc/cQQQc/cQQQc/cQQQc/ccccc"/>
      <rule in="a" out="eeeee/eeeee/eeeee/eeeee/eeeee"/>
      <sequence symmetry="(xy)">
        <!-- pali della caserma agli angoli della tettoia -->
        <all in="cc/ce" out="**/*p"/>
        <all in="WW/ce" out="**/*p"/>
        <!-- B. muri del mastio: pietra, fascia delle finestre, pietra; due piani; cima a 65 -->
        <all in="B w" out="w q" steps="6"/><all in="B w" out="w b" steps="14"/><all in="B w" out="w q" steps="12"/>
        <all in="B w" out="w q" steps="6"/><all in="B w" out="w b" steps="14"/><all in="B w" out="w q" steps="12"/>
        <all in="B w" out="w q" steps="1"/>
        <prl in="w" out="q"/>
        <!-- pavimenti del mastio e striscia della scala -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="P"/><rule in="s" out="P"/></prl>
        <!-- cinta, porta carraia, torri, torrione -->
        <all in="B W" out="W V" steps="23"/><prl in="W" out="V"/>
        <all in="B G" out="G D" steps="39"/><prl in="G" out="D"/>
        <all in="B t" out="t v" steps="39"/><prl in="t" out="v"/>
        <all in="B g" out="g Y" steps="55"/><prl in="g" out="Y"/>
        <!-- pozzo: vera di pietra e acqua -->
        <all in="B Q" out="Q Z" steps="3"/><prl in="Q" out="A"/>
        <!-- caserma: pali e tettoia a 34 -->
        <all in="B p" out="p p" steps="34"/>
        <all in="B e" out="y *" steps="1"/><all in="B y" out="y B" steps="33"/><prl in="y" out="J"/>
        <!-- C. le porte: dal lastricato nel muro del mastio, dalla strada nella porta carraia -->
        <all in="q/n" out="O/*" symmetry="()" steps="1"/><all in="q/O" out="O/*" symmetry="()" steps="4"/>
        <all in="D/r" out="O/*" symmetry="()" steps="1"/><all in="D/O" out="O/*" symmetry="()" steps="9"/>
        <import file="part-door"/>
        <!-- finestre nella fascia, poi la fascia torna pietra -->
        <one steps="16"><rule in="bB/bB/bB/bB/bB/bB bB/bB/bB/bB/bB/bB bB/bB/bB/bB/bB/bB bB/bB/bB/bB/bB/bB bB/bB/bB/bB/bB/bB bB/bB/bB/bB/bB/bB bB/bB/bB/bB/bB/bB bB/bB/bB/bB/bB/bB" out="L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L* L*/L*/L*/L*/L*/L*"/></one>
        <all in="LbbbbB" out="*LLLL*"/>
        <prl in="b" out="q"/>
        <!-- le parti -->
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" hidden="True"/>
  <color symbol="m" hidden="True"/>
  <color symbol="X" hidden="True"/>
  <color symbol="B" hidden="True"/>
  <color symbol="T" hidden="True"/>
  <color symbol="b" hidden="True"/>
  <color symbol="y" hidden="True"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <color symbol="h" value="C8A878" name="pavimento del mastio" area="keep"/>
  <color symbol="w" value="8A8A80" name="muro del mastio"/>
  <color symbol="s" value="B08050" name="zona della scala" area="keep"/>
  <color symbol="c" value="7FA050" name="cortile" area="courtyard"/>
  <color symbol="W" value="6E6E68" name="cinta"/>
  <color symbol="t" value="5A5A58" name="torre" area="tower"/>
  <color symbol="g" value="484846" name="torrione" area="tower"/>
  <color symbol="G" value="7A6050" name="porta carraia"/>
  <color symbol="d" value="A06030" name="porta"/>
  <color symbol="n" value="B0A890" name="lastricato" area="courtyard"/>
  <color symbol="r" value="C0A070" name="strada"/>
  <color symbol="Q" value="4070A0" name="pozzo"/>
  <color symbol="a" value="A8905A" name="caserma" area="barracks"/>
  <color symbol="e" value="A8905A" name="pavimento della caserma" area="barracks"/>
  <color symbol="f" value="C8A878" name="assi del pavimento"/>
  <color symbol="F" value="9A7850" name="solaio"/>
  <color symbol="P" value="A0A098" name="lastrico del mastio"/>
  <color symbol="q" value="8A8A80" name="pietra del mastio"/>
  <color symbol="L" value="88B8D0" name="vetro delle finestre"/>
  <color symbol="V" value="6E6E68" name="pietra della cinta"/>
  <color symbol="v" value="5A5A58" name="pietra delle torri"/>
  <color symbol="Y" value="484846" name="pietra del torrione"/>
  <color symbol="D" value="7A6050" name="pietra della porta carraia"/>
  <color symbol="Z" value="606870" name="vera del pozzo"/>
  <color symbol="A" value="4070A0" name="acqua"/>
  <color symbol="p" value="6E4A2A" name="palo"/>
  <color symbol="J" value="B04030" name="tettoia"/>
  <color symbol="k" value="A08060" name="gradini"/>
  <color symbol="O" value="5A3A1E" name="porta"/>
  <color symbol="o" value="3E2814" name="assi della porta"/>
  <color symbol="N" value="B0A890" name="stipite"/>
  <color symbol="M" value="7E7E78" name="merlo"/>
  <color symbol="U" value="202428" name="feritoia"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
