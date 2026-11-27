# model.sculpt · gemini-4-neon · 107 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a dwelling (see «What fits»): the house takes most of the area, not a cottage in a garden. At least 10 tiles² of covered floor where a body stands (its centre, half a body off every wall) on the ground floor and on another storey, the ground floor in 2 rooms or more of at least 1.5 tiles² each (the hall and a room) divided by an inner wall with a door: about 75 × 65 voxels inside the outer walls at every size, two storeys.
It is not a fortification: no merlons, no arrow slits, nothing of a fort; its flat tops end in a cornice, a solid parapet, a railing, a skylight or a dome, as its world builds them.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-cellar"/>: The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/> under a plan letter h on the soil, before it rises. D must hold 44 × 14 at least (44 along x) and room beside the stair, and stay 10 voxels back from your front wall: the floor opens over the upper treads (20 × 10 for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its walls, two thick along its edge; from a landing of 5, its stair climbs along its front wall (the side of large y) toward large x by treads of 5 and risers of 3 until your floor, with 5 of floor past its top (a deeper cellar needs a longer room: a tread more for every 3 voxels). Without room under the soil it does nothing. Its letters: D (yours, then the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.
- <import file="part-window"/>: Rows of windows (part-window), included after the walls have risen, outside <pieces> and before part-slits: mark with U a band of your walls through their whole thickness, as tall as a window with its sill and lintel (8 to 16), with your wall above and under it. On every straight stretch of a face with air in front and past its ends (a corner, a door) it centres a window 8 wide (9 on an odd stretch), then outward piers of 6 and windows of 8 while 3 of wall stay at the end (on a stretch that runs to the edge of the box, from its free end; none on the faces of an inner corner, a room): the frame N, the sill jutting out by one, the glass G, the wall open behind it. What is left of the band stays U: turn it back to your wall after (<prl in="U" out="W"/>). Give N and G your colours.

## Your program so far
<!--
  Concetto: Fattoria (casa colonica a due piani con fienile laterale, portico, aia recintata, pozzo, campi arati e alberi).
  Lettere del piano:
    h = pavimento della casa (sala anteriore e stanza posteriore)
    w = muro esterno della casa
    j = tramezzo interno tra sala e stanza
    s = zona scala interna (sale verso x crescente)
    d = porta principale sul fronte (3 celle = 15 voxel)
    r = strada sterrata dalla porta al bordo anteriore
    b = pavimento del fienile / tettoia laterale
    v = muro del fienile
    p = portico anteriore
    c = aia davanti alla fattoria
    f = staccionata attorno all'aia
    Q = pozzo nell'aia
    g, l = campi arati e solchi oltre la staccionata
    t = alberi nel terreno libero
    m = marcatore temporaneo (ripulito a fine piano)
  Disposizione: la casa colonica occupa il centro (75x65 voxel interni, due stanze divise da j); la porta d e la strada r escono sul fronte; la scala s corre lungo il tramezzo j nella sala; il fienile b/v si appoggia a un fianco della casa; il portico p affianca l'ingresso; l'aia c recintata da f con il pozzo Q si apre davanti, circondata da campi g/l e alberi t.
  Variazione tra i semi: profondità della casa (13 o 14 celle), posizione della scala lungo il tramezzo, fianco (destro o sinistro) e profondità del fienile, posizione del pozzo, trama dei solchi nei campi, posizione degli alberi.
  Scala per dimensione:
    - Large (20x20 celle): casa colonica a due piani con due stanze, scala, porta e strada fino al bordo.
    - Huge (30x30 celle): si aggiungono il fienile laterale, il portico anteriore, l'aia con pozzo e staccionata, i campi arati e gli alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjsdrbvpcfQgltm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa: 6-7 celle dietro H, 6 davanti, 7 per lato (75x65..70 voxel interni) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <!-- Muri esterni della casa e angoli -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Porta principale sul fronte (3 celle) e strada sterrata fino al bordo -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Tramezzo interno j sulla riga di H: divide sala anteriore e stanza posteriore (entrambe >= 30 voxel) -->
      <prl in="H" out="j"/>
      <all in="jh" out="*j" symmetry="(x)"/>

      <!-- Zona scala s nella sala anteriore lungo il tramezzo j (2 celle pianerottolo + 4 scala + 2 uscita) -->
      <one in="jjjjjjjj/hhhhhhhh/hhhhhhhh" out="********/hhsssshh/hhsssshh" symmetry="()" steps="1"/>

      <!-- Fienile laterale (solo se ci sono almeno 5 celle libere su un fianco: appare a Huge) -->
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="****b*/****b*/****b*/****b*/****b*" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="2"/>
      <prl in="bE" out="*b" p="0.5" steps="1" symmetry="(x)"/>
      <all in="E/b" out="b/*" symmetry="()" steps="2"/>
      <all in="b/E" out="*/b" symmetry="()" steps="1"/>
      <all in="bE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Portico anteriore ai lati dell'ingresso (solo se ci sono almeno 4 celle libere davanti) -->
      <all in="w/E/E/E/E" out="*/p/*/*/*" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>

      <!-- Aia davanti alla fattoria e al fienile (solo dove resta spazio) -->
      <all in="[rpv]EEEE" out="*cc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEE" out="*cc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Staccionata attorno all'aia -->
      <all in="cE" out="*f"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- Pozzo in uno spiazzo 5x5 dell'aia -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Campi arati oltre la staccionata con solchi via convchain -->
      <all in="fE" out="*g" steps="1"/>
      <all in="gE" out="*g" steps="3"/>
      <convchain on="g" black="g" white="l" n="3" steps="6">
        <sample>ggggg/lllll/ggggg/lllll/ggggg</sample>
      </convchain>

      <!-- Alberi nel terreno libero -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****" steps="3"/>
    </sequence>
  </map>

  <color symbol="E" value="6E8B4E" hidden="True" name="Terreno"/>
  <color symbol="H" value="C49A6C" name="Centro"/>
  <color symbol="h" value="C8A27A" area="house" name="Pavimento casa"/>
  <color symbol="w" value="E6DCC8" name="Muro casa"/>
  <color symbol="j" value="CFC2AA" name="Tramezzo"/>
  <color symbol="s" value="8C6239" area="house" name="Zona scala"/>
  <color symbol="d" value="6E4726" name="Porta principale"/>
  <color symbol="r" value="B89F7D" area="road" name="Strada sterrata"/>
  <color symbol="b" value="A67C52" area="barn" name="Pavimento fienile"/>
  <color symbol="v" value="7A5430" name="Muro fienile"/>
  <color symbol="p" value="B58D63" area="porch" name="Portico"/>
  <color symbol="c" value="D1BA92" area="yard" name="Aia"/>
  <color symbol="f" value="6B4C2A" name="Staccionata"/>
  <color symbol="Q" value="5B8FA8" area="yard" name="Pozzo"/>
  <color symbol="g" value="8B6D43" area="field" name="Campo arato"/>
  <color symbol="l" value="6E522E" area="field" name="Solco"/>
  <color symbol="t" value="4F7942" area="orchard" name="Albero"/>
  <color symbol="m" value="FF00FF" hidden="True" name="Marcatore"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento casa, w Muro casa, j Tramezzo, s Zona scala, d Porta principale, r Strada sterrata, c Aia, f Staccionata, g Campo arato, l Solco
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEwwwwwwwwwwwwwwwwwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwjjjjjjjjjjjjjjjwE
EEwhhhhhhhhsssshhhwE
EEwhhhhhhhhsssshhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
Egwwwwwwwdddwwwwwwwg
ggggfccccrrrccccfggg
llllfccccrrrccccflll
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento casa, w Muro casa, j Tramezzo, s Zona scala, d Porta principale, r Strada sterrata, c Aia, f Staccionata, g Campo arato, l Solco
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEwwwwwwwwwwwwwwwwwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwjjjjjjjjjjjjjjjwE
EEwhhhhhhsssshhhhhwE
EEwhhhhhhsssshhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
Egwwwwwwwdddwwwwwwwg
ggggfccccrrrccccfllg
llllfccccrrrccccflll
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento casa, w Muro casa, j Tramezzo, s Zona scala, d Porta principale, r Strada sterrata, c Aia, f Staccionata, g Campo arato, l Solco
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEwwwwwwwwwwwwwwwwwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwjjjjjjjjjjjjjjjwE
EEwhhhhhhhsssshhhhwE
EEwhhhhhhhsssshhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
Egwwwwwwwdddwwwwwwwg
ggggfccccrrrccccfglg
llllfccccrrrccccflll
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento casa, w Muro casa, j Tramezzo, s Zona scala, d Porta principale, r Strada sterrata, b Pavimento fienile, v Muro fienile, p Portico, c Aia, f Staccionata, Q Pozzo, g Campo arato, l Solco, t Albero
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEtEEEEEEEtEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEtEEEEEEEEEEEEEEEEEE
EllllllEEEEEEEEEEEEEEEEEEEEEEE
lgggggglEEEEEEEEEEEEEEEEEEEEEE
lggggglwwwwwwwwwwwwwwwwwEEEEEE
lglllllwhhhhhhhhhhhhhhhwEEEEEE
lffffffwhhhhhhhhhhhhhhhwEEEEEE
lfcccccwhhhhhhhhhhhhhhhwEEEEEE
lfcccccwhhhhhhhhhhhhhhhwEEEEEE
lfcccccwhhhhhhhhhhhhhhhwEEEEEE
lfcccccwhhhhhhhhhhhhhhhwEEEEEE
lgvvvvvwjjjjjjjjjjjjjjjwEEEEEE
glvvbbbwhhhhhhhsssshhhhwlllllE
glvbbbbwhhhhhhhsssshhhhwlggggg
Elvbbbbwhhhhhhhhhhhhhhhwlggggg
EEvbbbbwhhhhhhhhhhhhhhhwllllll
EEvbbbbwhhhhhhhhhhhhhhhwfffffl
Elvbbbbwhhhhhhhhhhhhhhhwccccfl
glvbbbbwwwwwwwdddwwwwwwwccccfl
glvbbbbvpppppprrrpppppppccccfl
glvvvvvvpppppprrrpppppppccccfl
gfccccccccccccrrrcccccccccccfl
gfccccccccccccrrrcccccccccccfl
gfccccccQcccccrrrcccccccccccfl
gfccccccccccccrrrcccccccccccfl
lfccccccccccccrrrcccccccccccfl
```
How much the plans of the seeds differ: 0.03 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  Concetto: Fattoria (casa colonica a due piani con due stanze al piano terra, scala interna, camino, fienile laterale, portico, aia recintata, pozzo, campi arati e alberi).
  Lettere del piano:
    h = pavimento della casa (sala anteriore e stanza posteriore)
    w = muro esterno della casa
    j = tramezzo interno tra sala e stanza
    i = porta interna nel tramezzo (3 celle = 15 voxel)
    s = zona scala interna (sale verso x crescente)
    d = porta principale sul fronte (3 celle = 15 voxel)
    r = strada sterrata dalla porta al bordo anteriore
    b = pavimento del fienile laterale
    v = muro del fienile
    p = portico anteriore
    P = pilastro d'angolo del portico
    c = aia davanti alla fattoria
    f = staccionata attorno all'aia
    Q = pozzo nell'aia
    g, l = campi arati e solchi oltre la staccionata
    t = alberi nel terreno libero
    m = marcatore temporaneo (ripulito a fine piano)
  Disposizione: la casa colonica occupa il centro (75x65..70 voxel interni, due stanze divise da j con porta i); la porta d e la strada r escono sul fronte; la scala s corre lungo il tramezzo j nella sala; il fienile b/v si appoggia a un fianco della casa; il portico p con pilastri P affianca l'ingresso; l'aia c recintata da f con il pozzo Q si apre davanti, circondata da campi g/l e alberi t.
  Variazione tra i semi: spostamento del centro H, profondità della casa (13 o 14 celle), posizione della scala e della porta interna lungo il tramezzo, fianco (destro o sinistro) e profondità del fienile, posizione del pozzo, trama dei solchi nei campi, posizione degli alberi.
  Scala per dimensione:
    - Large (20x20 celle): casa colonica a due piani con due stanze, scala, camino, porta e strada fino al bordo, piccola aia e campi.
    - Huge (30x30 celle): si aggiungono il fienile laterale, il portico anteriore con pilastri, l'aia ampia con pozzo e staccionata, i campi arati e gli alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjsidrbvpPcfQgltm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Spostamento casuale del centro per variare la composizione tra i semi -->
      <one in="EH" out="HE" symmetry="(xy)" steps="1"/>

      <!-- Corpo principale della casa: 6-7 celle dietro H, 6 davanti, 7 per lato (75x65..70 voxel interni) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>

      <!-- Muri esterni della casa e angoli -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Porta principale sul fronte (3 celle = 15 voxel) e strada sterrata fino al bordo -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <all in="d/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Tramezzo interno j sulla riga di H: divide sala anteriore e stanza posteriore -->
      <prl in="H" out="j"/>
      <all in="jh" out="*j" symmetry="(x)"/>

      <!-- Zona scala s nella sala anteriore lungo il tramezzo j (2 celle pianerottolo + 4 scala + 2 uscita) -->
      <one in="jjjjjjjj/hhhhhhhh/hhhhhhhh" out="********/hhsssshh/hhsssshh" symmetry="()" steps="1"/>

      <!-- Porta interna i nel tramezzo j (3 celle = 15 voxel), lontana dalla scala -->
      <one in="hhh/jjj/hhh" out="***/iii/***" symmetry="()" steps="1"/>

      <!-- Fienile laterale (solo se ci sono almeno 5 celle libere su un fianco: appare a Huge) -->
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="****b*/****b*/****b*/****b*/****b*" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="2"/>
      <prl in="bE" out="*b" p="0.5" steps="1" symmetry="(x)"/>
      <all in="E/b" out="b/*" symmetry="()" steps="2"/>
      <all in="b/E" out="*/b" symmetry="()" steps="1"/>
      <all in="bE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Portico anteriore ai lati dell'ingresso (solo se ci sono almeno 4 celle libere davanti) -->
      <all in="w/E/E/E/E" out="*/p/*/*/*" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <!-- Pilastri agli angoli anteriori del portico -->
      <all in="p[rE]/E[rE]" out="P*/**" symmetry="(x)" steps="1"/>

      <!-- Aia davanti alla fattoria e al fienile (solo dove resta spazio) -->
      <all in="[rpPv]EEEE" out="*cc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEE" out="*cc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Staccionata attorno all'aia -->
      <all in="cE" out="*f"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- Pozzo in uno spiazzo 5x5 dell'aia -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Campi arati oltre la staccionata con solchi via convchain -->
      <all in="fE" out="*g" steps="1"/>
      <all in="gE" out="*g" steps="3"/>
      <convchain on="g" black="g" white="l" n="3" steps="6">
        <sample>ggggg/lllll/ggggg/lllll/ggggg</sample>
      </convchain>

      <!-- Alberi nel terreno libero -->
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****" steps="3"/>
    </sequence>

    <map scale="5 5 1" values="BEhwjsidrbvpPcfQgltWXUNGOoaFTkRKVJPyYALZ#20#21#90#91#92" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="P" out="ppppp/pPPPp/pPPPp/pPPPp/ppppp"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="f" out="ccccc/cfffc/cfffc/cfffc/ccccc"/>
      <rule in="Q" out="YYYYY/YAAAY/YAAAY/YAAAY/YYYYY"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="t" out="EEEEE/EZZZE/EZZZE/EZZZE/EEEEE"/>

      <union symbol="+" values="WX"/>
      <union symbol="=" values="aF"/>

      <sequence symmetry="(xy)">
        <!-- B. ALTEZZE: ogni lettera del piano sale per colonne -->

        <!-- Muri esterni della casa (z=0..63, tetto a z=64) con zoccolo in pietra X e due fasce finestre U -->
        <all in="B w" out="w X" steps="6"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w W" steps="14"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w W" steps="14"/>
        <prl in="w" out="R"/>

        <!-- Porta principale d: seme O a z=0, muro W sopra, fascia finestre al secondo piano -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="37"/>
        <all in="B d" out="d U" steps="12"/>
        <all in="B d" out="d W" steps="14"/>
        <prl in="d" out="R"/>

        <!-- Tramezzo interno j (solo piano terra z=0..31, solaio F a z=32, tetto R a z=64) -->
        <all in="B j" out="j W" steps="32"/>
        <all in="B j" out="j F" steps="1"/>
        <all in="B j" out="j B" steps="31"/>
        <prl in="j" out="R"/>

        <!-- Porta interna i nel tramezzo: seme O a z=0, muro W sopra fino al solaio F -->
        <all in="B i" out="i O" steps="1"/>
        <all in="B i" out="i W" steps="31"/>
        <all in="B i" out="i F" steps="1"/>
        <all in="B i" out="i B" steps="31"/>
        <prl in="i" out="R"/>

        <!-- Pavimenti e solaio della casa (h e zona scala s) -->
        <all steps="1">
          <rule in="B h" out="h a"/>
          <rule in="B s" out="s a"/>
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

        <!-- Fienile laterale (z=0..39, tetto J a z=40) -->
        <all in="B v" out="v X" steps="4"/>
        <all in="B v" out="v V" steps="36"/>
        <prl in="v" out="J"/>
        <all in="B b" out="b a" steps="1"/>
        <all in="B b" out="b B" steps="39"/>
        <prl in="b" out="J"/>

        <!-- Portico anteriore (tettoia J a z=34, passaggio libero 33 voxel) e pilastri P -->
        <all in="B p" out="y c" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <all in="B P" out="P *" steps="33"/>
        <all in="B P" out="J *" steps="1"/>

        <!-- Staccionata f attorno all'aia -->
        <all in="B f" out="f P" steps="9"/>
        <prl in="f" out="P"/>

        <!-- Pozzo Q (bordo in pietra Y alto 8, acqua A alta 4) -->
        <all in="B Y" out="Y *" steps="7"/>
        <all in="B A" out="A *" steps="3"/>

        <!-- Alberi t (tronco Z alto 16 e chioma arrotondata L) -->
        <all in="B Z" out="Z *" steps="15"/>
        <all in="B Z" out="L *" steps="1"/>
        <all in="LB" out="*L" steps="4"/>
        <all in="B L" out="L *" steps="4"/>

        <!-- C. SCALA REALE: porte, scale, finestre, tetti, camino e pulizia -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-window"/>
        <prl in="U" out="W"/>

        <!-- Tetto a padiglione della casa con gronda (z=64..74) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>

        <!-- Camino sul tetto della casa -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="KB" out="*K" steps="1"/>
        <all in="B K" out="K *" steps="5"/>

        <!-- Tetto spiovente del fienile e del portico -->
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="7" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="6E8B4E" hidden="True" name="Terreno"/>
  <color symbol="H" value="C49A6C" hidden="True" name="Centro"/>
  <color symbol="m" value="FF00FF" hidden="True" name="Marcatore"/>
  <color symbol="y" value="FF00FF" hidden="True" name="Marcatore tettoia"/>
  <color symbol="T" value="FF00FF" hidden="True" name="Fascia scala"/>
  <color symbol="U" value="E8DEC8" hidden="True" name="Fascia finestre"/>
  <color symbol="#20" value="000000" hidden="True" name="Porta aperta"/>
  <color symbol="#21" value="000000" hidden="True" name="Assi porta aperta"/>
  <color symbol="#90" value="000000" hidden="True" name="Marcatore scala"/>
  <color symbol="#91" value="000000" hidden="True" name="Marcatore scala"/>
  <color symbol="#92" value="000000" hidden="True" name="Marcatore scala"/>

  <color symbol="W" value="E8DEC8" name="Intonaco"/>
  <color symbol="X" value="8E887E" name="Pietra di base"/>
  <color symbol="R" value="B84A32" name="Tegole"/>
  <color symbol="K" value="7C5A4C" name="Mattoni del camino"/>
  <color symbol="a" value="C49A6C" area="house" name="Pavimento in legno"/>
  <color symbol="F" value="B08456" area="house" name="Solaio in legno"/>
  <color symbol="k" value="966F47" area="house" name="Gradini in legno"/>
  <color symbol="N" value="5A3E28" name="Infissi in legno"/>
  <color symbol="O" value="7A4E2D" name="Porta in legno"/>
  <color symbol="o" value="4A2E1A" name="Assi della porta"/>
  <color symbol="G" value="88B8C8" name="Vetro"/>
  <color symbol="V" value="7A5430" area="barn" name="Legno del fienile"/>
  <color symbol="J" value="8C6A3E" name="Tetto in scandole"/>
  <color symbol="P" value="5C3D24" name="Palo di legno"/>
  <color symbol="r" value="B89F7D" area="road" name="Strada sterrata"/>
  <color symbol="c" value="D1BA92" area="yard" name="Aia"/>
  <color symbol="Y" value="6A737B" area="yard" name="Pietra del pozzo"/>
  <color symbol="A" value="4A8BA8" area="yard" name="Acqua del pozzo"/>
  <color symbol="g" value="8B6D43" area="field" name="Campo arato"/>
  <color symbol="l" value="6E522E" area="field" name="Solco"/>
  <color symbol="Z" value="63442A" area="orchard" name="Tronco"/>
  <color symbol="L" value="4E7A3E" area="orchard" name="Chioma"/>

  <color symbol="h" value="C8A27A" area="house" name="Pavimento casa"/>
  <color symbol="w" value="E6DCC8" name="Muro casa"/>
  <color symbol="j" value="CFC2AA" name="Tramezzo"/>
  <color symbol="s" value="8C6239" area="house" name="Zona scala"/>
  <color symbol="i" value="6E4726" name="Porta interna"/>
  <color symbol="d" value="6E4726" name="Porta principale"/>
  <color symbol="b" value="A67C52" area="barn" name="Pavimento fienile"/>
  <color symbol="v" value="7A5430" name="Muro fienile"/>
  <color symbol="p" value="B58D63" area="porch" name="Portico"/>
  <color symbol="f" value="6B4C2A" name="Staccionata"/>
  <color symbol="Q" value="5B8FA8" area="yard" name="Pozzo"/>
  <color symbol="t" value="4F7942" area="orchard" name="Albero"/>

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

