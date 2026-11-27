# model.sculpt · gemini-4-neon · 88 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · size huge (9.375 × 9.375 × 7.5 tiles, 16 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 9.375 × 9.375 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 500 × 500 × 160, 31.25 × 31.25 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a dwelling (see «What fits»): the house takes most of the area, not a cottage in a garden. At least 10 tiles² of covered floor where a body stands (its centre, half a body off every wall) on the ground floor and on another storey, the ground floor in 2 rooms or more of at least 1.5 tiles² each (the hall and a room) divided by an inner wall with a door: about 75 × 65 voxels inside the outer walls at every size, two storeys.
It is not a fortification: no merlons, no arrow slits, nothing of a fort; its flat tops end in a cornice, a solid parapet, a railing, a skylight or a dome, as its world builds them.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-cellar"/>: The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/> under a plan letter h on the soil, before it rises. D must hold 44 × 14 at least (44 along x) and room beside the stair, and stay 10 voxels back from your front wall: the floor opens over the upper treads (20 × 10 for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its walls, two thick along its edge; from a landing of 5, its stair climbs along its front wall (the side of large y) toward large x by treads of 5 and risers of 3 until your floor, with 5 of floor past its top (a deeper cellar needs a longer room: a tread more for every 3 voxels). Without room under the soil it does nothing. Its letters: D (yours, then the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.
- <import file="part-window"/>: Rows of windows (part-window), included after the walls have risen, outside <pieces> and before part-slits: mark with U a band of your walls through their whole thickness, as tall as a window with its sill and lintel (8 to 16), with your wall above and under it. On every straight stretch of a face with air in front and past its ends (a corner, a door) it centres a window 8 wide (9 on an odd stretch), then outward piers of 6 and windows of 8 while 3 of wall stay at the end (on a stretch that runs to the edge of the box, from its free end; none on the faces of an inner corner, a room): the frame N, the sill jutting out by one, the glass G, the wall open behind it. What is left of the band stays U: turn it back to your wall after (<prl in="U" out="W"/>). Give N and G your colours.

## Your program so far
<!--
  Fattoria (farmhouse):
  Parti del concetto e lettere sulla pianta (1 cella = 5 voxel):
  - h: pavimento della casa colonica (due piani, due stanze al piano terra)
  - w: muri esterni della casa
  - j: muro divisorio interno (separa la sala d'ingresso dalla stanza laterale)
  - s: zona scala (4x2 celle lungo il muro di fondo della sala, con pianerottolo davanti e dietro)
  - d: porta d'ingresso sul davanti (3 celle = 15 voxel)
  - p, P: portico/tettoia davanti alla casa (4 celle di profondità) e suoi pilastri d'angolo
  - a, v: fienile/stalla addossato a un lato della casa (pavimento e muri)
  - c: aia attorno alla casa e al fienile
  - r: strada sterrata (3 celle) dalla porta d'ingresso fino al bordo anteriore
  - f: staccionata attorno all'aia
  - g, l: campi arati a solchi oltre la staccionata
  - Q: pozzo nell'aia
  - k: pagliaio nell'aia
  - t: alberi sul terreno libero
  - m: marcatore temporaneo di tracciamento (ripulito a fine pianta)

  Cosa cambia tra i semi:
  - profondità della casa (12 o 13 celle), lato del muro divisorio interno, lato del fienile (sinistra o destra),
    posizione della scala, del pozzo, del pagliaio, degli alberi e trama dei solchi nei campi.

  Cosa entra alle varie taglie:
  - Huge (30x30 celle): casa colonica a due stanze con portico, fienile laterale, piccola aia, strada e staccionata dove c'è spazio.
  - Gargantuan (100x100 celle): in più l'aia si allarga, compaiono il pozzo, il pagliaio, ampi campi arati a solchi e alberi attorno.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjsdmpPavcrfgQlkt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Casa colonica: corpo principale 17x12-13 celle interne (85x60-65 voxel) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="8"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Muro divisorio interno j a 2 celle di distanza dal centro H (lato scelto dal seme) -->
      <one in="hhH" out="j**" symmetry="(x)" steps="1"/>
      <all in="h/j" out="j/*" symmetry="()"/>
      <all in="j/h" out="*/j" symmetry="()"/>

      <!-- Zona scala s lungo il muro di fondo della sala più ampia (2 celle pianerottolo + 4 scala + 2 uscita) -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Porta d'ingresso d sul davanti, centrata su H, larga 3 celle -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Portico anteriore p (profondo 4 celle, largo 9 celle) con pilastri P agli angoli -->
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="3"/>
      <all in="pE" out="*p" symmetry="(x)" steps="3"/>
      <all in="pE/EE" out="P*/**" symmetry="(x)" steps="1"/>

      <!-- Fienile / stalla laterale a, v su un fianco della casa scelto dal seme -->
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="******/******/****a*/******/******" symmetry="(x)" steps="1"/>
      <all in="Ea" out="a*" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia c attorno alla casa e al fienile; si espande molto dove il terreno continua (Gargantuan) -->
      <all in="[pPvw]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEE" out="*cccccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Strada sterrata r dalla porta attraverso il portico e l'aia fino al bordo anteriore -->
      <all in="d/p" out="*/m" symmetry="()" steps="1"/>
      <all in="m/p" out="*/m" symmetry="()"/>
      <all in="[mr]/[cE]" out="*/r" symmetry="()"/>
      <prl in="m" out="p"/>

      <!-- Staccionata f attorno all'aia dove il terreno continua -->
      <all in="cEE" out="*f*" steps="1"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- Campi arati g, l oltre la staccionata dove resta molto terreno (Gargantuan) -->
      <all in="fEEEEEEEE" out="*gggggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEEEEE" out="*gggggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <convchain on="g" black="g" white="l" n="3" steps="6"><sample>ggggggg/lllllll/ggggggg/lllllll/ggggggg/lllllll/ggggggg</sample></convchain>

      <!-- Pozzo Q e pagliaio k nell'aia, alberi t sul terreno libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**k**/*****/*****" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="6"/>
    </sequence>
  </map>

  <color symbol="E" value="7b9a54" hidden="True" name="Terreno"/>
  <color symbol="H" value="d9c7a3" hidden="True" name="Centro"/>
  <color symbol="h" value="b88c5a" area="house" name="Pavimento della casa"/>
  <color symbol="w" value="d6ccb8" name="Muro esterno"/>
  <color symbol="j" value="b8ad99" name="Muro interno"/>
  <color symbol="s" value="8c6239" area="house" name="Zona scala"/>
  <color symbol="d" value="6e4726" name="Porta d'ingresso"/>
  <color symbol="m" value="a89f91" hidden="True" name="Segno di tracciamento"/>
  <color symbol="p" value="c2a77d" area="porch" name="Pavimento del portico"/>
  <color symbol="P" value="5c3d21" name="Pilastro del portico"/>
  <color symbol="a" value="9e7b4f" area="barn" name="Pavimento del fienile"/>
  <color symbol="v" value="8f593c" name="Muro del fienile"/>
  <color symbol="c" value="bfa77a" area="yard" name="Aia"/>
  <color symbol="r" value="a68d65" name="Strada sterrata"/>
  <color symbol="f" value="6b4c2e" name="Staccionata"/>
  <color symbol="g" value="7a5c38" area="field" name="Campo arato"/>
  <color symbol="l" value="967549" area="field" name="Solco del campo"/>
  <color symbol="Q" value="5f7d8c" area="yard" name="Pozzo"/>
  <color symbol="k" value="d9b343" area="yard" name="Pagliaio"/>
  <color symbol="t" value="4a7337" name="Albero"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento della casa, w Muro esterno, j Muro interno, s Zona scala, d Porta d'ingresso, p Pavimento del portico, P Pilastro del portico, a Pavimento del fienile, v Muro del fienile, c Aia, r Strada sterrata, f Staccionata, Q Pozzo, k Pagliaio
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
fffffffffffffffffffffffffffEEE
ccccccccccccccccccccccccccfEEE
cvvvvvvcccccccccccccccccccfEEE
cvaaaavcccccccccccccccccccfEEE
cvaaaawwwwwwwwwwwwwwwwwwwcfEEE
cvaaaawhhsssshhhhjhhhhhhwcfEEE
cvaaaawhhsssshhhhjhhhhhhwcfEEE
cvaaaawhhhhhhhhhhjhhhhhhwcfEEE
cvaaaawhhhhhhhhhhjhhhhhhwcfEEE
cvaaaawhhhhhhhhhhjhhhhhhwcfEEE
cvvvvvwhhhhhhhhhhjhhhhhhwcfEEE
ccccccwhhhhhhhhhhjhhhhhhwcfEEE
ccccccwhhhhhhhhhhjhhhhhhwcfEEE
ccccccwhhhhhhhhhhjhhhhhhwcfEEE
ccQcccwhhhhhhhhhhjhhhhhhwcfEEE
ccccccwhhhhhhhhhhjhhhhhhwcfEEE
ccccccwhhhhhhhhhhjhhhhhhwcfEEE
ccccccwwwwwwwwdddwwwwwwwwcfEEE
cccccccccccpppppppppccccccfEEE
ccckcccccccpppppppppccccccfEEE
cccccccccccpppppppppccccccfEEE
cccccccccccPpppppppPccccccfEEE
ccccccccccccccrrrcccccccccfEEE
ffffffffffffffrrrffffffffffEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento della casa, w Muro esterno, j Muro interno, d Porta d'ingresso, p Pavimento del portico, P Pilastro del portico, a Pavimento del fienile, v Muro del fienile, c Aia, r Strada sterrata, f Staccionata, Q Pozzo, k Pagliaio
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
fffffffffffffffffffffffffffEEE
ccccccccccccccccccccccccccfEEE
ccccccccccccccccccccccccccfEEE
ccccccccccccccccccccccccccfEEE
ccccccccccccccccccccccccccfEEE
ccccccccccccccccccccccccccfEEE
ccccccwwwwwwwwwwwwwwwwwwwcfEEE
ccQcccwhhhhhhjhhhhhhhhhhwcfEEE
ccccccwhhhhhhjhhhhhhhhhhwcfEEE
ccccccwhhhhhhjhhhhhhhhhhwcfEEE
cvvvvvwhhhhhhjhhhhhhhhhhwcfEEE
cvaaaawhhhhhhjhhhhhhhhhhwcfEEE
cvaaaawhhhhhhjhhhhhhhhhhwcfEEE
cvaaaawhhhhhhjhhhhhhhhhhwcfEEE
cvaaaawhhhhhhjhhhhhhhhhhwcfEEE
cvaaaawhhhhhhjhhhhhhhhhhwcfEEE
cvaaaawhhhhhhjhhhhhhhhhhwcfEEE
cvaaaawhhhhhhjhhhhhhhhhhwcfEEE
cvvvvvwhhhhhhjhhhhhhhhhhwcfEEE
ccccccwwwwwwwwdddwwwwwwwwcfEEE
cccccccccccpppppppppccccccfEEE
cccccccccccpppppppppccccccfEEE
cccccccccccpppppppppcckcccfEEE
cccccccccccPpppppppPccccccfEEE
ccccccccccccccrrrcccccccccfEEE
ffffffffffffffrrrffffffffffEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento della casa, w Muro esterno, j Muro interno, s Zona scala, d Porta d'ingresso, p Pavimento del portico, P Pilastro del portico, a Pavimento del fienile, v Muro del fienile, c Aia, r Strada sterrata, f Staccionata, Q Pozzo, k Pagliaio
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEffffffffffffffffffffffffff
EEEEfccccccccccccccccccccccccc
EEEEfccccccccccccccccccccccccc
EEEEfcccccQccccccccccccccccccc
EEEEfccccccccccccccccccccccccc
EEEEfccccccccccccccccccccccccc
EEEEfcwwwwwwwwwwwwwwwwwwwccccc
EEEEfcwhhsssshhhhjhhhhhhwccccc
EEEEfcwhhsssshhhhjhhhhhhwvvvvv
EEEEfcwhhhhhhhhhhjhhhhhhwaaaav
EEEEfcwhhhhhhhhhhjhhhhhhwaaaav
EEEEfcwhhhhhhhhhhjhhhhhhwaaaav
EEEEfcwhhhhhhhhhhjhhhhhhwaaaav
EEEEfcwhhhhhhhhhhjhhhhhhwaaaav
EEEEfcwhhhhhhhhhhjhhhhhhwaaaav
EEEEfcwhhhhhhhhhhjhhhhhhwaaaav
EEEEfcwhhhhhhhhhhjhhhhhhwvvvvv
EEEEfcwhhhhhhhhhhjhhhhhhwccccc
EEEEfcwhhhhhhhhhhjhhhhhhwccccc
EEEEfcwwwwwwwwdddwwwwwwwwccccc
EEEEfccccccpppppppppcccccccccc
EEEEfccccccpppppppppcccccccccc
EEEEfccccccpppppppppccccccckcc
EEEEfccccccPpppppppPcccccccccc
EEEEfcccccccccrrrccccccccccccc
EEEEffffffffffrrrfffffffffffff
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 100×100×160, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento della casa, w Muro esterno, j Muro interno, s Zona scala, d Porta d'ingresso, p Pavimento del portico, P Pilastro del portico, a Pavimento del fienile, v Muro del fienile, c Aia, r Strada sterrata, f Staccionata, g Campo arato, Q Pozzo, l Solco del campo, k Pagliaio, t Albero
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
EEEEEElllgggggggllggggggggggggglllggggggglEEEEEEEE
EEEEEElllggglglggglggggggglgggglglggllggggEEEEEEEE
EEEEEElllggglglgggllllllllllgggglgggggllggEEEEEEEE
EEEEEElllllggglggggllgggggggggggggglgglllgEEEEEEEE
EEEEEEllllllgglllllllllggggllllggggggglllgEEEEEEEE
EEEEEElllllglllllllllllfgggfllllllllggllllEEEEEEEE
EEEEEEllllllfcccccccccccccccccccccccggllllEEEEEEEE
EEEEEElgllllfccccccccccccccccccccccclglgggEEEEEEEE
EEEEEElglgggfccccccccccccccccccccccclglgggEEEEEEEE
EEEEEElgggggfccccccccccccccccccccccclglgggEEEEEEEE
EEEEEElgggggfccccccccccccccccccccccclgggggEEEEEEEE
EEEEEElgggggfccccccccccccccccccccccclgggggEEEEEEEE
EEEEEElgglggfcccccvaaccccccccccccccclgggggEEEEEEEE
EEEEEElgggggfcccccvaahsshhjhhhcccccclgggggEEEEEEEE
EEEEEElgggggfcccccvaahhhhhjhhhcccccclgggllEEEEEEEE
EEEEEEllggggfcccccvawhhhhhjhhhccccccllggllEEEEEEEE
EEEEEElllgggfcccccccchhhhhjhhhccccccggllggEEEEEEEE
EEEEEElllgggfcccccccchhhhhjhhhccccccllggggEEEEEEEE
EEEEEEglllggfcccccccchhhhhjhhhcccccclgglllEEEEEEEE
EEEEEEglggggfccccccccwwwpdwwwwccccccllgglgEEEEEEEE
EEEEEEggglggfccccccccccpppppccccccccllgllgEEEEEEEE
EEEEEEgglgggfcccccccccccpppcccccccccllgllgEEEEEEEE
EEEEEEggggggfccccccccccccrcccccccccclgggggEEEEEEEE
EEEEEElgggggfccccccccccccrccccccccccgglllgEEEEEEEE
EEEEEElggglgfccccccccccccrccccccccccgggllgEEEEEEEE
EEEEEElggglgfccccccccccccrccccccccccgggllgEEEEEEEE
EEEEEElglgggfccccccccccccrccccccccccgggllgEEEEEEEE
EEEEEEggglglffffffffffffrrffffffffffglgllgEEEEEEEE
EEEEEEgglggglgggllllllggrrlgggggggggglglllEEEEEEEE
EEEEEEgglggglggggglllllggrlgggllggggglggggEEEEEEEE
EEEEEEgglggglgggggglllllrrllgglllgggggggggEEEEEEEE
EEEEEElgggggllllllllllggrrllggllllggggggggEEEEEEEE
EEEEEEllggggggglllllllllrrllllllllggggggggEEEEEEEE
EEEEEEEllllllllllEllllllrrllllllllllllllllEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.35 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  Fattoria (farmhouse):
  Parti del concetto e lettere sulla pianta (1 cella = 5 voxel):
  - h: pavimento della casa colonica (due piani, due stanze al piano terra)
  - w: muri esterni della casa
  - j: muro divisorio interno (separa la sala d'ingresso dalla stanza laterale)
  - s: zona scala (4x2 celle lungo il muro di fondo della sala più ampia, con pianerottolo davanti e dietro)
  - d: porta d'ingresso sul davanti (3 celle = 15 voxel)
  - p, P: portico/tettoia davanti alla casa (4 celle di profondità) e suoi pilastri d'angolo
  - a, v: fienile/stalla addossato a un lato della casa (pavimento e muri)
  - c: aia attorno alla casa e al fienile
  - r: strada sterrata (3 celle) dalla porta d'ingresso fino al bordo anteriore
  - f: staccionata attorno all'aia
  - g, l: campi arati a solchi oltre la staccionata
  - Q: pozzo nell'aia
  - k: pagliaio nell'aia
  - t: alberi sul terreno libero
  - m: marcatore temporaneo di tracciamento (ripulito a fine pianta)

  Cosa cambia tra i semi:
  - profondità della casa (12 o 13 celle), lato del muro divisorio interno, lato del fienile (sinistra o destra),
    posizione della scala, del pozzo, del pagliaio, degli alberi e trama dei solchi nei campi.

  Cosa entra alle varie taglie:
  - Huge (30x30 celle): casa colonica a due stanze con portico, fienile laterale, piccola aia, strada, pozzo, pagliaio e staccionata.
  - Gargantuan (100x100 celle): in più l'aia si allarga, compaiono ampi campi arati a solchi oltre la staccionata e alberi attorno.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjsdmpPavcrfgQlkt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- A. Composizione sulla pianta -->
      <!-- Casa colonica: corpo principale 17x12-13 celle interne (85x60-65 voxel) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="8"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Muro divisorio interno j a 2 celle di distanza dal centro H (lato scelto dal seme) -->
      <one in="hhH" out="j**" symmetry="(x)" steps="1"/>
      <all in="h/j" out="j/*" symmetry="()"/>
      <all in="j/h" out="*/j" symmetry="()"/>

      <!-- Zona scala s lungo il muro di fondo della sala più ampia (funziona con j a sinistra o a destra) -->
      <one in="wwwwwwwww/[wj]hhhhhhhh/[wj]hhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Porta d'ingresso d sul davanti, centrata su H, larga 3 celle -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Portico anteriore p (profondo 4 celle, largo 9 celle) con pilastri P agli angoli -->
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="3"/>
      <all in="pE" out="*p" symmetry="(x)" steps="3"/>
      <all in="pE/EE" out="P*/**" symmetry="(x)" steps="1"/>

      <!-- Fienile / stalla laterale a, v su un fianco della casa scelto dal seme -->
      <one in="EEEEEw/EEEEEw/EEEEEw/EEEEEw/EEEEEw" out="******/******/****a*/******/******" symmetry="(x)" steps="1"/>
      <all in="Ea" out="a*" symmetry="(x)" steps="3"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia c attorno alla casa e al fienile; si espande molto dove il terreno continua (Gargantuan) -->
      <all in="[pPvw]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEE" out="*cccccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Strada sterrata r dalla porta attraverso il portico e l'aia fino al bordo anteriore -->
      <all in="d/p" out="*/m" symmetry="()" steps="1"/>
      <all in="m/p" out="*/m" symmetry="()"/>
      <all in="[mr]/[cE]" out="*/r" symmetry="()"/>
      <prl in="m" out="p"/>

      <!-- Staccionata f attorno all'aia dove il terreno continua -->
      <all in="cEE" out="*f*" steps="1"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- Campi arati g, l oltre la staccionata dove resta molto terreno (Gargantuan) -->
      <all in="fEEEEEEEE" out="*gggggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEEEEE" out="*gggggg**" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <convchain on="g" black="g" white="l" n="3" steps="6"><sample>ggggggg/lllllll/ggggggg/lllllll/ggggggg/lllllll/ggggggg</sample></convchain>

      <!-- Pozzo Q e pagliaio k nell'aia, alberi t sul terreno libero -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**k**/*****/*****" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="6"/>
    </sequence>

    <!-- Seconda mappa: ritorno alla scala 1:1 (ogni cella della pianta diventa 5x5 voxel) -->
    <map scale="5 5 1" values="BEhwjsdpPavcrfglQYtWJFRACXLMIOoNGTUke#20#21#90#91#92" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="P" out="ppppp/pPPPp/pPPPp/pPPPp/ppppp"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="f" out="ccccc/ccfcc/fffff/ccfcc/ccccc"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="Q" out="QQQQQ/QIIIQ/QIIIQ/QIIIQ/QQQQQ"/>
      <rule in="k" out="YYYYY/YYYYY/YYYYY/YYYYY/YYYYY"/>
      <rule in="t" out="EEEEE/EEEEE/EEtEE/EEEEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="WJA"/>
        <union symbol="=" values="F"/>

        <!-- B. Le altezze: ogni lettera della pianta sale a colonne -->
        <!-- Muri esterni della casa (2 piani da 32 = 64 voxel) con fasce finestre U -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- Muro della porta d'ingresso: seme O a z=0, muro W sopra, fascia finestre al 2° piano -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="31"/>
        <all in="B d" out="d W" steps="6"/>
        <all in="B d" out="d U" steps="14"/>
        <all in="B d" out="d W" steps="12"/>
        <prl in="d" out="R"/>

        <!-- Muro divisorio interno j al piano terra (32 voxel), poi solaio F e aperto al 2° piano -->
        <all in="B j" out="j J" steps="32"/>
        <all in="B j" out="j F" steps="1"/>
        <all in="B j" out="j B" steps="31"/>
        <prl in="j" out="R"/>

        <!-- Pavimenti, fascia scala T e solaio della casa -->
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Portico anteriore: pilastri C alti 33, tettoia R a quota 33 (32 voxel liberi sotto) -->
        <all in="B P" out="P C" steps="33"/>
        <prl in="P" out="R"/>
        <all in="B p" out="p X" steps="1"/>
        <all in="B p" out="p B" steps="32"/>
        <prl in="p" out="R"/>

        <!-- Fienile laterale: un piano alto 44 voxel con fascia finestre U e tetto R -->
        <all in="B v" out="v A" steps="6"/>
        <all in="B v" out="v U" steps="10"/>
        <all in="B v" out="v A" steps="28"/>
        <prl in="v" out="R"/>
        <all in="B a" out="a e" steps="1"/>
        <all in="B a" out="a B" steps="43"/>
        <prl in="a" out="R"/>

        <!-- Staccionata, pozzo, pagliaio e tronchi degli alberi -->
        <all in="B f" out="f C" steps="10"/>
        <prl in="f" out="C"/>
        <all in="B Q" out="Q M" steps="8"/>
        <prl in="Q" out="M"/>
        <all in="B Y" out="Y *" steps="17"/>
        <all in="B t" out="t C" steps="16"/>
        <prl in="t" out="L"/>

        <!-- C. Scala piena: porta interna, finestre, camino (fuori da pieces) -->
        <!-- Seme della porta interna nel muro divisorio J (larga 11 voxel) -->
        <one in="FJJJJJF" out="*OOOOO*" symmetry="(x)" steps="1"/>
        <all in="O/J" out="*/O" symmetry="()" steps="5"/>
        <all in="J/O" out="O/*" symmetry="()" steps="5"/>

        <!-- Finestre su tutte le facciate -->
        <import file="part-window"/>
        <all in="A U" out="* A"/>
        <prl in="U" out="W"/>

        <!-- Parte locale eseguita a pezzi per restare veloce anche a Gargantuan -->
        <pieces piece="125" margin="24">
          <import file="part-door"/>
          <import file="part-stair"/>

          <!-- Gronde e tetti a padiglione (pendenza 1 su 2) -->
          <all in="RB" out="*R" steps="1"/>
          <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="14" symmetry="()"/>

          <!-- Chioma tondeggiante degli alberi -->
          <all in="LB" out="*L" steps="4"/>
          <all in="B L" out="L *" steps="5"/>
          <all in="L B" out="* L" steps="2"/>
        </pieces>

        <!-- Camino sul tetto principale -->
        <one in="B B R" out="* M *" steps="1" symmetry="()"/>
        <all in="B M" out="M *" steps="12"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="7b9a54" hidden="True" name="Terreno"/>
  <color symbol="H" value="d9c7a3" hidden="True" name="Centro"/>
  <color symbol="W" value="e6dcc8" name="Muro intonacato"/>
  <color symbol="J" value="c7baa3" name="Muro interno"/>
  <color symbol="F" value="b88c5a" area="house" name="Pavimento in legno"/>
  <color symbol="R" value="b54a32" name="Tetto in tegole"/>
  <color symbol="A" value="8f593c" name="Parete in legno del fienile"/>
  <color symbol="e" value="9e7b4f" area="barn" name="Pavimento del fienile"/>
  <color symbol="X" value="c2a77d" area="porch" name="Pavimento del portico"/>
  <color symbol="C" value="5c3d21" name="Legno scuro"/>
  <color symbol="c" value="bfa77a" area="yard" name="Aia"/>
  <color symbol="r" value="a68d65" name="Strada sterrata"/>
  <color symbol="g" value="7a5c38" area="field" name="Campo arato"/>
  <color symbol="l" value="967549" area="field" name="Solco del campo"/>
  <color symbol="M" value="7d858c" name="Pietra"/>
  <color symbol="I" value="4d88b3" area="yard" name="Acqua del pozzo"/>
  <color symbol="Y" value="d9b343" area="yard" name="Pagliaio"/>
  <color symbol="L" value="4a7337" name="Chioma d'albero"/>
  <color symbol="O" value="6e4726" name="Porta in legno"/>
  <color symbol="o" value="4f3119" name="Assi della porta"/>
  <color symbol="N" value="523a24" name="Infisso"/>
  <color symbol="G" value="9ec9d9" name="Vetro"/>
  <color symbol="k" value="7d5531" name="Gradino in legno"/>
  <color symbol="T" value="8c6239" hidden="True" name="Traccia scala"/>
  <color symbol="U" value="d6ccb8" hidden="True" name="Fascia finestre"/>
  <color symbol="#20" value="6e4726" hidden="True" name="Porta aperta"/>
  <color symbol="#21" value="4f3119" hidden="True" name="Assi porta aperta"/>
  <color symbol="#90" value="8c6239" hidden="True" name="Segno scala"/>
  <color symbol="#91" value="8c6239" hidden="True" name="Segno scala"/>
  <color symbol="#92" value="8c6239" hidden="True" name="Segno scala"/>

  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
```

