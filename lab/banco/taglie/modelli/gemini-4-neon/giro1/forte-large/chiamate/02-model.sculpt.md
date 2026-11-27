# model.sculpt · gemini-4-neon · 105 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a fortification: merlons (part-battlements) and arrow slits (part-slits) belong to it.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-cellar"/>: The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/> under a plan letter h on the soil, before it rises. D must hold 44 × 14 at least (44 along x) and room beside the stair, and stay 10 voxels back from your front wall: the floor opens over the upper treads (20 × 10 for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its walls, two thick along its edge; from a landing of 5, its stair climbs along its front wall (the side of large y) toward large x by treads of 5 and risers of 3 until your floor, with 5 of floor past its top (a deeper cellar needs a longer room: a tread more for every 3 voxels). Without room under the soil it does nothing. Its letters: D (yours, then the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.
- <import file="part-window"/>: Rows of windows (part-window), included after the walls have risen, outside <pieces> and before part-slits: mark with U a band of your walls through their whole thickness, as tall as a window with its sill and lintel (8 to 16), with your wall above and under it. On every straight stretch of a face with air in front and past its ends (a corner, a door) it centres a window 8 wide (9 on an odd stretch), then outward piers of 6 and windows of 8 while 3 of wall stay at the end (on a stretch that runs to the edge of the box, from its free end; none on the faces of an inner corner, a room): the frame N, the sill jutting out by one, the glass G, the wall open behind it. What is left of the band stays U: turn it back to your wall after (<prl in="U" out="W"/>). Give N and G your colours.

## Your program so far
<!--
Forte medievale: composizione in pianta (cella = 5 voxel)
Parti e lettere:
- h: pavimento del maschio (area="keep"), corpo centrale rettangolare attorno ad H
- w: mura del maschio, spesse 1 cella attorno ad h
- s: zona scala interna del maschio (area="keep"), lungo la parete di fondo con pianerottolo a sinistra
- d: porta del maschio, larga 3 celle sul fronte
- c: cortile interno attorno al maschio (area="courtyard")
- n: lastricato nel cortile dall'ingresso al maschio (area="courtyard")
- W: muro di cinta attorno al cortile
- G: corpo di guardia sul fronte del muro di cinta (area="gatehouse")
- t: torri angolari 3x3 sugli spigoli esterni del muro di cinta (area="tower")
- a, v: caserma/annesso nel cortile con le sue mura (area="barracks")
- q: pozzo nel cortile (area="courtyard")
- r: strada lastricata dal corpo di guardia fino al bordo anteriore (area="road")
- m: fossato esterno oltre il muro di cinta, scavalcato dalla strada (area="moat")
- p: marcatore temporaneo per tracciare l'asse d'ingresso (ripulito a fine pianta)

Variazioni tra i semi:
- profondità del maschio (7-9 celle) per estensione casuale davanti e dietro H
- posizione della scala s lungo la parete di fondo
- posizione della caserma (a/v) e del pozzo (q) negli spazi liberi del cortile

Cosa entra in ogni taglia:
- Large (20x20): maschio con scala, stretto cortile perimetrale, muro di cinta, corpo di guardia, 4 torri angolari e strada
- Huge (30x30): cortile più ampio, caserma (a/v) e pozzo (q) nel cortile
- Gargantuan (100x100): cortile ancora più esteso e fossato esterno (m) attorno alle mura
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdcnWGtavqrmp" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Maschio attorno ad H: 9 celle in larghezza, 7-9 in profondità -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala interna lungo il muro di fondo, con 2 celle di pianerottolo a sinistra -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Cortile attorno al maschio: 1 cella a Large, si espande a Huge e Gargantuan -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEE" out="*ccccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Muro di cinta attorno al cortile -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri angolari 3x3 sugli spigoli esterni del muro di cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Asse d'ingresso dal centro verso il fronte: porta d, lastricato n, corpo di guardia G, strada r -->
      <all in="H/[hs]" out="*/p" symmetry="()" steps="1"/>
      <all in="p/[hs]" out="*/p" symmetry="()"/>
      <all in="p/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="p" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- Caserma e pozzo nel cortile dove c'è spazio (Huge e Gargantuan) -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="vvvvv/vaaav/vaaav/vaaav/vvcvv" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Fossato esterno dove resta terreno oltre il muro (Gargantuan) -->
      <all in="cWEEEEEE" out="**mm****" steps="1"/>
      <all in="[Wt]E/*m" out="**/*m"/>
      <all in="mE/*m" out="*m/**"/>
    </sequence>
  </map>

  <color symbol="E" value="7E9458" hidden="True" name="Terreno"/>
  <color symbol="h" value="B89F7A" area="keep" name="Pavimento del maschio"/>
  <color symbol="w" value="8A8780" area="keep" name="Mura del maschio"/>
  <color symbol="s" value="A67C52" area="keep" name="Scala del maschio"/>
  <color symbol="d" value="6E472B" area="keep" name="Porta del maschio"/>
  <color symbol="c" value="C7B793" area="courtyard" name="Cortile"/>
  <color symbol="n" value="A8A296" area="courtyard" name="Lastricato del cortile"/>
  <color symbol="W" value="78756E" area="courtyard" name="Muro di cinta"/>
  <color symbol="G" value="636059" area="gatehouse" name="Corpo di guardia"/>
  <color symbol="t" value="6D6A63" area="tower" name="Torre angolare"/>
  <color symbol="a" value="C2A57E" area="barracks" name="Pavimento della caserma"/>
  <color symbol="v" value="948D82" area="barracks" name="Mura della caserma"/>
  <color symbol="q" value="4F7D96" area="courtyard" name="Pozzo"/>
  <color symbol="r" value="9E9789" area="road" name="Strada"/>
  <color symbol="m" value="46738C" area="moat" name="Fossato"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento del maschio, w Mura del maschio, s Scala del maschio, d Porta del maschio, c Cortile, n Lastricato del cortile, W Muro di cinta, G Corpo di guardia, t Torre angolare, r Strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEtttEEEEEEEEEEEtttE
EEtttWWWWWWWWWWWtttE
EEttcccccccccccccttE
EEEWcwwwwwwwwwwwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwwwwdddwwwwcWEE
EEttcccccnnncccccttE
EEtttWWWWGGGWWWWtttE
EEtttEEEErrrEEEEtttE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento del maschio, w Mura del maschio, s Scala del maschio, d Porta del maschio, c Cortile, n Lastricato del cortile, W Muro di cinta, G Corpo di guardia, t Torre angolare, r Strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEtttEEEEEEEEEEEtttE
EEtttWWWWWWWWWWWtttE
EEttcccccccccccccttE
EEEWcwwwwwwwwwwwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwwwwdddwwwwcWEE
EEttcccccnnncccccttE
EEtttWWWWGGGWWWWtttE
EEtttEEEErrrEEEEtttE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento del maschio, w Mura del maschio, s Scala del maschio, d Porta del maschio, c Cortile, n Lastricato del cortile, W Muro di cinta, G Corpo di guardia, t Torre angolare, r Strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEtttEEEEEEEEEEEtttE
EEtttWWWWWWWWWWWtttE
EEttcccccccccccccttE
EEEWcwwwwwwwwwwwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwwwwdddwwwwcWEE
EEttcccccnnncccccttE
EEtttWWWWGGGWWWWtttE
EEtttEEEErrrEEEEtttE
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento del maschio, w Mura del maschio, s Scala del maschio, d Porta del maschio, c Cortile, n Lastricato del cortile, W Muro di cinta, G Corpo di guardia, t Torre angolare, a Pavimento della caserma, v Mura della caserma, q Pozzo, r Strada
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEtttEEEEEEEEEEEEEEEEEEEtttEE
EEEtttWWWWWWWWWWWWWWWWWWWtttEE
EEEttcccccccccccccccccccccttEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccwwwwwwwwwwwcccccWEEE
EEEEWcccccwhhsssshhhwcccccWEEE
EEEEWcccccwhhsssshhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWvvvvvwhhhhhhhhhwcccccWEEE
EEEEWvaaavwhhhhhhhhhwccqccWEEE
EEEEWvaaavwhhhhhhhhhwcccccWEEE
EEEEWvaaavwwwwdddwwwwcccccWEEE
EEEEWvvcvvccccnnncccccccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEEWcccccccccnnncccccccccWEEE
EEEttcccccccccnnncccccccccttEE
EEEtttWWWWWWWWGGGWWWWWWWWtttEE
EEEtttEEEEEEEErrrEEEEEEEEtttEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
Forte medievale: programma completo (pianta, altezze, scala reale)
Parti e lettere in pianta (cella = 5 voxel):
- h: pavimento del maschio (area="keep"), corpo centrale rettangolare attorno ad H
- w: mura del maschio, spesse 1 cella attorno ad h
- s: zona scala interna del maschio (area="keep"), lungo la parete di fondo con pianerottolo a sinistra
- d: porta del maschio, larga 3 celle sul fronte
- c: cortile interno attorno al maschio (area="courtyard")
- n: lastricato nel cortile dall'ingresso al maschio (area="courtyard")
- W: muro di cinta attorno al cortile
- g: corpo di guardia sul fronte del muro di cinta (area="gatehouse")
- t: torri angolari 3x3 sugli spigoli esterni del muro di cinta (area="tower")
- a, v: caserma/annesso nel cortile con le sue mura (area="barracks")
- q: pozzo nel cortile (area="courtyard")
- r: strada lastricata dal corpo di guardia fino al bordo anteriore (area="road")
- m: fossato esterno oltre il muro di cinta (area="moat")
- p: marcatore temporaneo per l'asse d'ingresso

Variazioni tra i semi:
- profondità e larghezza asimmetrica del maschio (7-9 celle per lato) scelte con regole competitive
- eventuale ala laterale del maschio sul lato sinistro o destro
- posizione della scala lungo il muro di fondo
- posizione della caserma e del pozzo nel cortile

Cosa entra in ogni taglia:
- Large (100x100x80): maschio a due piani con scala e merli, cortile, muro di cinta, corpo di guardia, 4 torri angolari e strada
- Huge (150x150x120): cortile più ampio, caserma con tetto a falde e pozzo nel cortile
- Gargantuan (500x500): cortile esteso e fossato esterno attorno alle mura
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdcnWgtavqrmp" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Maschio attorno ad H: profondità 6-8 celle, larghezza 7-9 celle con variazioni per seme -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="2"/>
      <one symmetry="()" steps="1">
        <rule in="E/h" out="h/*"/>
        <rule in="E/h" out="E/h"/>
      </one>
      <one symmetry="()" steps="1">
        <rule in="E/h" out="h/*"/>
        <rule in="E/h" out="E/h"/>
      </one>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <one symmetry="()" steps="1">
        <rule in="h/E" out="*/h"/>
        <rule in="h/E" out="h/E"/>
      </one>
      <all in="E[Hh]" out="h*" symmetry="()" steps="3"/>
      <one symmetry="()" steps="1">
        <rule in="Eh" out="h*"/>
        <rule in="Eh" out="Eh"/>
      </one>
      <all in="[Hh]E" out="*h" symmetry="()" steps="3"/>
      <one symmetry="()" steps="1">
        <rule in="hE" out="*h"/>
        <rule in="hE" out="hE"/>
      </one>

      <!-- Eventuale piccola ala laterale del maschio su un lato -->
      <one symmetry="(x)" steps="1">
        <rule in="Eh/Eh/Eh" out="hh/hh/hh"/>
        <rule in="Eh/Eh/Eh" out="Eh/Eh/Eh"/>
      </one>

      <!-- Mura del maschio -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona scala interna lungo il muro di fondo, con 2 celle di pianerottolo a sinistra -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Cortile attorno al maschio: 1 cella a Large, si espande a Huge e Gargantuan -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEE" out="*ccccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Muro di cinta attorno al cortile -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri angolari 3x3 sugli spigoli esterni del muro di cinta -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Asse d'ingresso dal centro verso il fronte: porta d, lastricato n, corpo di guardia g, strada r -->
      <all in="H/[hs]" out="*/p" symmetry="()" steps="1"/>
      <all in="p/[hs]" out="*/p" symmetry="()"/>
      <all in="p/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[ng]/W" out="*/g" symmetry="()"/>
      <all in="[gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="gW" out="*g" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="p" out="h"/>
        <rule in="H" out="h"/>
      </prl>

      <!-- Caserma e pozzo nel cortile dove c'è spazio (Huge e Gargantuan) -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="vvvvv/vaaav/vaaav/vaaav/vcccv" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Fossato esterno dove resta terreno oltre il muro (Gargantuan) -->
      <all in="cWEEEEEE" out="**mm****" steps="1"/>
      <all in="[Wt]E/*m" out="**/*m"/>
      <all in="mE/*m" out="*m/**"/>
    </sequence>

    <!-- Scala reale: ogni cella di pianta diventa un blocco 5x5 -->
    <map scale="5 5 1" values="BEhwsdcnWgtavqrmKCAPVfFRkOoNGUMTQL#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="q" out="QQQQQ/QLLLQ/QLLLQ/QLLLQ/QQQQQ"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>

      <union symbol="+" values="KCAP"/>
      <union symbol="%" values="KCAP"/>
      <union symbol="=" values="fF"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: colonne per passi -->
        <!-- Mura del maschio (65 voxel: 2 piani con fasce finestre U) -->
        <all in="B w" out="w K" steps="6"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w K" steps="14"/>
        <all in="B w" out="w K" steps="6"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w K" steps="14"/>
        <prl in="w" out="K"/>

        <!-- Porta del maschio (seme O a z=0, muro K sopra fino a z=64) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d K" steps="63"/>
        <prl in="d" out="K"/>

        <!-- Pavimenti, striscia scala T, solaio F e copertura R del maschio -->
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

        <!-- Muro di cinta (24 voxel) -->
        <all in="B W" out="W C" steps="23"/>
        <prl in="W" out="C"/>

        <!-- Corpo di guardia (38 voxel, seme porta O a z=0) -->
        <all in="B g" out="g O" steps="1"/>
        <all in="B g" out="g A" steps="36"/>
        <prl in="g" out="A"/>

        <!-- Torri angolari (42 voxel) -->
        <all in="B t" out="t P" steps="41"/>
        <prl in="t" out="P"/>

        <!-- Caserma nel cortile (1 piano, 32 voxel + tetto R) -->
        <all in="B v" out="v V" steps="32"/>
        <prl in="v" out="R"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>

        <!-- Bordo del pozzo (6 voxel) -->
        <all in="B Q" out="Q Q" steps="5"/>

        <!-- C. Scala reale: porte, finestre, scale, merli, feritoie -->
        <import file="part-door"/>
        <import file="part-window"/>
        <prl in="U" out="K"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Tetto a padiglione sulla caserma (solo sopra V/R della caserma, dove non ci sono merli) -->
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="5" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <!-- Palette e aree -->
  <color symbol="E" value="7E9458" hidden="True" name="Terreno"/>
  <color symbol="K" value="8C8880" area="keep" name="Pietra del maschio"/>
  <color symbol="C" value="78746D" area="courtyard" name="Pietra del muro di cinta"/>
  <color symbol="A" value="69655E" area="gatehouse" name="Pietra del corpo di guardia"/>
  <color symbol="P" value="6E6A62" area="tower" name="Pietra della torre"/>
  <color symbol="V" value="968E82" area="barracks" name="Pietra della caserma"/>
  <color symbol="M" value="827E76" name="Merli"/>
  <color symbol="f" value="B89B72" area="keep" name="Assi di legno"/>
  <color symbol="F" value="A68960" area="keep" name="Solaio di legno"/>
  <color symbol="R" value="8F5943" name="Copertura"/>
  <color symbol="k" value="A19A8E" area="keep" name="Gradini di pietra"/>
  <color symbol="O" value="7A4F2F" name="Porta di legno"/>
  <color symbol="o" value="59371E" name="Assi della porta"/>
  <color symbol="N" value="5C5852" name="Cornice di pietra"/>
  <color symbol="G" value="7BA3B5" name="Vetro"/>
  <color symbol="U" value="363330" name="Feritoia"/>
  <color symbol="c" value="C7B793" area="courtyard" name="Cortile"/>
  <color symbol="n" value="A8A296" area="courtyard" name="Lastricato del cortile"/>
  <color symbol="r" value="9E9789" area="road" name="Strada"/>
  <color symbol="m" value="46738C" area="moat" name="Acqua del fossato"/>
  <color symbol="Q" value="7A7670" area="courtyard" name="Pietra del pozzo"/>
  <color symbol="L" value="4F7D96" area="courtyard" name="Acqua del pozzo"/>
  <color symbol="#20" value="7A4F2F" hidden="True" name="Porta aperta"/>
  <color symbol="#21" value="59371E" hidden="True" name="Assi aperte"/>

  <!-- Azioni sulle porte -->
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
```

