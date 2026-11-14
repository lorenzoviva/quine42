# model.sculpt · gemini-4-hydrogen · 21 s

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
Forte: un mastio centrale (k, s scala, w mura, d porta) circondato da un cortile (c) con pozzo (Q),
chiuso da una cinta muraria (W) con torri angolari (t) e corpo di guardia frontale (G),
collegato da un lastricato (n) e una strada (r) fino al bordo.
I semi variano la profondità del mastio, la posizione della scala, del pozzo e degli alberi (T).
A Huge (30x30) entra il mastio, il cortile, la cinta e le torri; a Gargantuan (40x40) il cortile si amplia ed entra il fossato (a).
-->
<sequence values="BHEkwsdcnWtrGQaT" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEkwsdcnWtrGQaT" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio attorno a H: 3 dietro, 4 davanti (+1 casuale), 4 ai lati -->
      <all in="E/[Hk]" out="k/*" symmetry="()" steps="3"/>
      <all in="[Hk]/E" out="*/k" symmetry="()" steps="4"/>
      <prl in="k/E" out="*/k" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hk]E" out="*k" symmetry="(x)" steps="4"/>
      <prl in="H" out="k"/>

      <!-- Mura del mastio -->
      <all in="kE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala nel mastio: 4x2 lungo un muro con 2 celle di sbarco -->
      <one in="wwwwwww/wkkkkkk/wkkkkkk" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Cortile attorno al mastio (almeno 3 celle) -->
      <all in="[wk]E" out="*c" steps="3"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Ampliamento cortile se c'e' spazio (Gargantuan) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Cinta muraria attorno al cortile -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- Via d'uscita dritta verso il fronte (y crescente): porta d, lastricato n, corpo di guardia G, strada r -->
      <one in="k/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Pozzo nel cortile se entra in 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Fossato esterno dove c'e' abbastanza terreno -->
      <all in="cWEEEEE" out="**aaa**" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>

      <!-- Alberi nel terreno libero 7x7 -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***T***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="B" hidden="True"/>
  <color symbol="E" value="6A8E4E" hidden="True" area="prato"/>
  <color symbol="H" value="FF00FF" name="origine"/>
  <color symbol="k" value="C2B280" name="pavimento mastio" area="mastio"/>
  <color symbol="s" value="A67B5B" name="zona scala" area="mastio"/>
  <color symbol="w" value="8B8989" name="mura mastio" area="mastio"/>
  <color symbol="d" value="6E472B" name="porta mastio" area="mastio"/>
  <color symbol="c" value="D8C89E" name="cortile" area="cortile"/>
  <color symbol="W" value="706E6E" name="cinta muraria" area="mura"/>
  <color symbol="t" value="5A5858" name="torre" area="torre"/>
  <color symbol="n" value="9E9B95" name="lastricato" area="cortile"/>
  <color symbol="G" value="5E3A22" name="corpo di guardia" area="ingresso"/>
  <color symbol="r" value="B5A478" name="strada" area="strada"/>
  <color symbol="Q" value="4682B4" name="pozzo" area="cortile"/>
  <color symbol="a" value="3B6E8C" name="fossato" area="fossato"/>
  <color symbol="T" value="2E5A27" name="albero" area="bosco"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, k pavimento mastio, w mura mastio, s zona scala, d porta mastio, c cortile, n lastricato, W cinta muraria, t torre, r strada, G corpo di guardia, Q pozzo, a fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEaaaaaaaaaaaaaaaaaEEEEEE
EEtttttaaaaaaaaaaaaaaaaatttttE
EEtttttaaaaaaaaaaaaaaaaatttttE
EEtttttWWWWWWWWWWWWWWWWWtttttE
EEtttccccccccccccccccccccctttE
EEtttccccccccccccccccccccctttE
EEEEWcccccccccccccccccccccWEEE
EEEEWccccccccccccccccccQccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccwwwwwwwwwwwcccccWEEE
EEEEWcccccwkksssskkkwcccccWEEE
EEEEWcccccwkksssskkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwwdddwwwwwwcccccWEEE
EEEEWcccccccnnncccccccccccWEEE
EEEEWcccccccnnncccccccccccWEEE
EEEEWcccccccnnncccccccccccWEEE
EEtttcccccccnnnccccccccccctttE
EEtttcccccccnnnccccccccccctttE
EEtttttWWWWWGGGWWWWWWWWWtttttE
EEtttttEEEEErrrEEEEEEEEEtttttE
EEtttttEEEEErrrEEEEEEEEEtttttE
EEEEEEEEEEEErrrEEEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, k pavimento mastio, w mura mastio, s zona scala, d porta mastio, c cortile, n lastricato, W cinta muraria, t torre, r strada, G corpo di guardia, Q pozzo, a fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEaaaaaaaaaaaaaaaaaEEEEEE
EEtttttaaaaaaaaaaaaaaaaatttttE
EEtttttaaaaaaaaaaaaaaaaatttttE
EEtttttWWWWWWWWWWWWWWWWWtttttE
EEtttccccccccccccccccccccctttE
EEtttccccccccccccccccccccctttE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccwwwwwwwwwwwcccccWEEE
EEEEWcccccwkksssskkkwcccccWEEE
EEEEWcccccwkksssskkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwccQccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwwwdddwwwwwcccccWEEE
EEEEWccccccccnnnccccccccccWEEE
EEEEWccccccccnnnccccccccccWEEE
EEEEWccccccccnnnccccccccccWEEE
EEtttccccccccnnncccccccccctttE
EEtttccccccccnnncccccccccctttE
EEtttttWWWWWWGGGWWWWWWWWtttttE
EEtttttEEEEEErrrEEEEEEEEtttttE
EEtttttEEEEEErrrEEEEEEEEtttttE
EEEEEEEEEEEEErrrEEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, k pavimento mastio, w mura mastio, s zona scala, d porta mastio, c cortile, n lastricato, W cinta muraria, t torre, r strada, G corpo di guardia, Q pozzo, a fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEaaaaaaaaaaaaaaaaaEEEEEE
EEtttttaaaaaaaaaaaaaaaaatttttE
EEtttttaaaaaaaaaaaaaaaaatttttE
EEtttttWWWWWWWWWWWWWWWWWtttttE
EEtttccccccccccccccccccccctttE
EEtttccccccccccccccccccccctttE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccwwwwwwwwwwwcccccWEEE
EEEEWcccccwkksssskkkwcccccWEEE
EEEEWcccccwkksssskkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwkkkkkkkkkwcccccWEEE
EEEEWcccccwdddwwwwwwwcccccWEEE
EEEEWccccccnnnccccccccccccWEEE
EEEEWccccccnnnccccccccccccWEEE
EEEEWccccccnnnccQcccccccccWEEE
EEtttccccccnnncccccccccccctttE
EEtttccccccnnncccccccccccctttE
EEtttttWWWWGGGWWWWWWWWWWtttttE
EEtttttEEEErrrEEEEEEEEEEtttttE
EEtttttEEEErrrEEEEEEEEEEtttttE
EEEEEEEEEEErrrEEEEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, k pavimento mastio, w mura mastio, s zona scala, d porta mastio, c cortile, n lastricato, W cinta muraria, t torre, r strada, G corpo di guardia, Q pozzo, a fossato, T albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEETEEETEEEEETEEEETEEETEEEEEETEEETEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEETEEEEEEEEaaaaaaaaaaaaaaaaaEEEEEEEEEEE
EEEEEEEtttttaaaaaaaaaaaaaaaaatttttEEEEEE
EEEEEEEtttttaaaaaaaaaaaaaaaaatttttEEEEEE
EEEEEEEtttttWWWWWWWWWWWWWWWWWtttttEEEEEE
EEEEEEEtttccccccccccccccccccccctttEEEEEE
EEEEEEEtttccccccccccccccccccccctttEEEEEE
EEEEEEaaaWcccccccccccccccccccccWaaaEEEEE
EEEEEEaaaWcccccccccccccccccccccWaaaEEEEE
EEEEEEaaaWcccccccccccccccccccccWaaaEEEEE
EEEEEEaaaWccQccwwwwwwwwwwwcccccWaaaEEEEE
EEEEEEaaaWcccccwkksssskkkwcccccWaaaEEEEE
EEEEEEaaaWcccccwkksssskkkwcccccWaaaEEEEE
EEEEEEaaaWcccccwkkkkkkkkkwcccccWaaaEEEEE
EEEEEEaaaWcccccwkkkkkkkkkwcccccWaaaEEEEE
EEEEEEaaaWcccccwkkkkkkkkkwcccccWaaaEEEEE
EEEEEEaaaWcccccwkkkkkkkkkwcccccWaaaEEEEE
EEEEEEaaaWcccccwkkkkkkkkkwcccccWaaaEEEEE
EEEEEEaaaWcccccwkkkkkkkkkwcccccWaaaEEEEE
EEEEEEaaaWcccccwwdddwwwwwwcccccWaaaEEEEE
EEEEEEaaaWcccccccnnncccccccccccWaaaEEEEE
EEEEEEaaaWcccccccnnncccccccccccWaaaEEEEE
EEEEEEaaaWcccccccnnncccccccccccWaaaEEEEE
EEEEEEEtttcccccccnnnccccccccccctttEEEEEE
EEEEEEEtttcccccccnnnccccccccccctttEEEEEE
EEEEEEEtttttWWWWWGGGWWWWWWWWWtttttEEEEEE
EEEEEEEtttttaaaaarrraaaaaaaaatttttEEEEEE
EEEEEEEtttttaaaaarrraaaaaaaaatttttEEEEEE
EEETEEEEEEEEaaaaarrraaaaaaaaaEEEEEEEEEEE
EEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.05 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
Forte: un mastio centrale (h pavimento, s scala, w mura, d porta) circondato da un cortile (c) con pozzo (Q),
chiuso da una cinta muraria (W) con torri angolari (t) e corpo di guardia frontale (G),
collegato da un lastricato (n) e una strada (r) fino al bordo.
I semi variano le dimensioni del mastio, la posizione della scala, del pozzo e degli alberi (Y).
A Huge (30x30) entra il mastio, il cortile, la cinta e le torri; a Gargantuan (40x40) il cortile si amplia ed entra il fossato (a) e il bosco (Y).
-->
<sequence values="BHEhswdcWtnGrQaY" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdcWtnGrQaY" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Mastio attorno a H: 3 dietro, 4 davanti (+1 casuale), 4 ai lati (+1 casuale) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="hE" out="*h" p="0.5" steps="1" symmetry="(x)"/>
      <prl in="H" out="h"/>

      <!-- Mura del mastio -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala nel mastio: 4x2 lungo un muro con 2 celle di sbarco -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Cortile attorno al mastio (almeno 3 celle) -->
      <all in="[wh]E" out="*c" steps="3"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Ampliamento cortile se c'e' spazio (Gargantuan) -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Cinta muraria attorno al cortile -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri 5x5 sugli angoli esterni della cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- Via d'uscita dritta verso il fronte (y crescente): porta d, lastricato n, corpo di guardia G, strada r -->
      <one in="h/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Pozzo nel cortile se entra in 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Fossato esterno dove c'e' abbastanza terreno -->
      <all in="cWEEEEE" out="**aaa**" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>

      <!-- Alberi nel terreno libero 7x7 -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***Y***/*******/*******/*******"/>
    </sequence>
    <map scale="5 5 1" values="BEhswdcWtnGrQaYfFTkLMNoOUV" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="ccccc/cWWWc/cWaWc/cWWWc/ccccc"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="Y" out="EEEEE/EEEEE/EELEE/EEEEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <union symbol="+" values="wWt"/>
        <union symbol="%" values="wWt"/>
        <union symbol="=" values="fF"/>

        <!-- B. Le altezze -->
        <!-- Mura del mastio: 2 piani (32 + 32 = 64) + 1 di parapetto -->
        <all in="B w" out="w w" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w w" steps="12"/>
        <all in="B w" out="w w" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w w" steps="13"/>

        <!-- Porta del mastio: O a z=0, poi muro w sopra -->
        <all in="B d" out="w O" steps="1"/>
        <all in="B w" out="w w" steps="64"/>

        <!-- Pavimenti, scala e solai del mastio -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="F"/><rule in="s" out="F"/></prl>

        <!-- Cinta muraria (24), corpo di guardia (O a z=0, W fino a 36), torri (40) -->
        <all in="B W" out="W W" steps="24"/>
        <all in="B G" out="W O" steps="1"/>
        <all in="B W" out="W W" steps="35"/>
        <all in="B t" out="t t" steps="40"/>

        <!-- Alberi: tronco L alto 10, chioma V -->
        <all in="B L" out="L L" steps="10"/>
        <all in="B L" out="V V" steps="1"/>
        <all in="EV" out="*V" steps="2"/>
        <all in="B V" out="V V" steps="6"/>

        <!-- C. Scala reale: porte, merli, feritoie, scale, finestre -->
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-stair"/>

        <!-- Finestre nelle fasce U del mastio -->
        <one steps="14">
          <rule in="BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU BU/BU/BU/BU/BU/BU"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LUUUUB" out="*LLLL*"/>
        <prl in="U" out="w"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" hidden="True"/>
  <color symbol="E" value="6A8E4E" hidden="True" area="prato"/>
  <color symbol="H" value="FF00FF" name="origine"/>
  <color symbol="f" value="C2B280" name="pavimento mastio" area="mastio"/>
  <color symbol="F" value="A8996E" name="solaio mastio" area="mastio"/>
  <color symbol="w" value="8B8989" name="mura mastio" area="mastio"/>
  <color symbol="W" value="706E6E" name="cinta muraria" area="mura"/>
  <color symbol="t" value="5A5858" name="torre" area="torre"/>
  <color symbol="M" value="6E6C6C" name="merli"/>
  <color symbol="U" value="444444" name="feritoia"/>
  <color symbol="L" value="4A3525" name="legno"/>
  <color symbol="V" value="2E5A27" name="chioma" area="bosco"/>
  <color symbol="k" value="9C7A54" name="gradini"/>
  <color symbol="O" value="5E3A22" name="porta"/>
  <color symbol="o" value="3E2414" name="assi porta"/>
  <color symbol="N" value="4A4848" name="stipite"/>
  <color symbol="c" value="D8C89E" name="cortile" area="cortile"/>
  <color symbol="n" value="9E9B95" name="lastricato" area="cortile"/>
  <color symbol="r" value="B5A478" name="strada" area="strada"/>
  <color symbol="a" value="3B6E8C" name="fossato" area="fossato"/>
  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
