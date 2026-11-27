# model.sculpt · gemini-4-neon · 99 s

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
  Fattoria (Block 1 — Composizione sulla pianta in scala 1/5):
  - Corpo principale (h: sala anteriore, a: cucina/stanza posteriore, w: muri esterni, j: muro interno, s: zona scala, d: ingresso anteriore):
    casa a due piani con 2 stanze al piano terra, centrata su H (15x13 celle interne = 75x65 voxel), con portico anteriore (p: pavimento, q: pilastri).
  - Varianti per seme: posizione della scala s lungo il muro interno j, lato e posizione della stalla/annesso b, posizione del pozzo Q, disposizione dei solchi l e degli alberi t.
  - Cosa entra per taglia:
    - Large (20x20): casa padronale (sala, cucina, scala), portico anteriore con pilastri e strada r fino al bordo.
    - Huge (30x30): in più la stalla/annesso laterale (b, v), l'aia (c) con lastricato (n) e pozzo (Q), la staccionata (x), i campi arati a solchi (g, l) e gli alberi (t).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhawjsdpqbvcnrxQgltm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa: 6 celle dietro H, 6 davanti, 7 per lato (15x13 interne) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Ingresso anteriore d (3 celle) tracciato dal centro H verso il fronte -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>

      <!-- Muro interno j che divide sala anteriore (h) e stanza posteriore (a) -->
      <prl in="H" out="j"/>
      <all in="jh" out="*j" symmetry="(x)"/>
      <all in="h/j" out="a/*" symmetry="()" steps="1"/>
      <all in="ah" out="*a"/>
      <prl in="m" out="h"/>

      <!-- Zona della scala s nella sala anteriore, addossata al muro interno j -->
      <one in="jjjjjjjjj/hhhhhhhhh/hhhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Portico anteriore p (2 celle di profondità) con pilastri q agli angoli -->
      <all in="[wd]/E" out="*/p" symmetry="()" steps="2"/>
      <all in="pE/EE" out="q*/**" symmetry="(x)" steps="1"/>

      <!-- Stalla/annesso laterale (b, v) solo dove c'è spazio (Huge) -->
      <one in="wEEEEE/wEEEEE/wEEEEE/wEEEEE/wEEEEE/wEEEEE/wEEEEE" out="*b****/*b****/*b****/*b****/*b****/*b****/*b****" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="3"/>
      <all in="bE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia c davanti al portico solo dove il terreno continua (Huge) -->
      <all in="[pq]/E/E/E/E" out="*/c/c/c/*" symmetry="()" steps="1"/>
      <all in="cEEEE" out="*cc**" symmetry="(x)" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Lastricato n attraverso portico e aia, poi strada r fino al bordo -->
      <all in="[dn]/[pc]" out="*/n" symmetry="()"/>
      <all in="[nr]/E" out="*/r" symmetry="()"/>

      <!-- Pozzo Q nell'aia dove entra 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Staccionata x attorno all'aia -->
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- Campi arati (g, l) e alberi (t) nel terreno libero esterno (Huge) -->
      <all in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**g**/*****/*****" steps="1"/>
      <all in="gE" out="*g" steps="2"/>
      <convchain on="g" black="g" white="l" n="3" steps="8">
        <sample>ggggggg/lllllll/ggggggg/lllllll/ggggggg/lllllll/ggggggg</sample>
      </convchain>
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****" steps="3"/>
    </sequence>
  </map>

  <color symbol="E" value="6A8E4E" hidden="True" name="Terreno"/>
  <color symbol="H" value="FF00FF" name="Centro"/>
  <color symbol="h" value="C8A878" area="hall" name="Pavimento della sala"/>
  <color symbol="a" value="B89668" area="kitchen" name="Pavimento della cucina"/>
  <color symbol="w" value="D8C8B0" name="Muro della fattoria"/>
  <color symbol="j" value="C0B098" name="Muro interno"/>
  <color symbol="s" value="8B6848" area="hall" name="Scala"/>
  <color symbol="d" value="6E452A" name="Ingresso"/>
  <color symbol="p" value="A89880" area="porch" name="Portico"/>
  <color symbol="q" value="5C3A21" name="Pilastro del portico"/>
  <color symbol="b" value="9C8460" area="barn" name="Pavimento della stalla"/>
  <color symbol="v" value="7A5438" name="Muro della stalla"/>
  <color symbol="c" value="C2B280" area="yard" name="Aia"/>
  <color symbol="n" value="9E9A90" area="yard" name="Lastricato"/>
  <color symbol="r" value="A68E68" area="road" name="Strada sterrata"/>
  <color symbol="x" value="6B4C30" name="Staccionata"/>
  <color symbol="Q" value="4E7A9E" name="Pozzo"/>
  <color symbol="g" value="7C5A3A" area="field" name="Campo arato"/>
  <color symbol="l" value="5E4228" area="field" name="Solco"/>
  <color symbol="t" value="3E6B38" name="Albero"/>
  <color symbol="m" value="FF8800" name="Segnaposto"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento della sala, a Pavimento della cucina, w Muro della fattoria, j Muro interno, s Scala, d Ingresso, p Portico, q Pilastro del portico, n Lastricato, r Strada sterrata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEwwwwwwwwwwwwwwwwwE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwjjjjjjjjjjjjjjjwE
EEwhhhhhhhsssshhhhwE
EEwhhhhhhhsssshhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwwwwwwwdddwwwwwwwE
EEqppppppnnnppppppqE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento della sala, a Pavimento della cucina, w Muro della fattoria, j Muro interno, s Scala, d Ingresso, p Portico, q Pilastro del portico, n Lastricato, r Strada sterrata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEwwwwwwwwwwwwwwwwwE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwjjjjjjjjjjjjjjjwE
EEwhhhhhhsssshhhhhwE
EEwhhhhhhsssshhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwwwwwwwdddwwwwwwwE
EEqppppppnnnppppppqE
EEEEEEEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento della sala, a Pavimento della cucina, w Muro della fattoria, j Muro interno, s Scala, d Ingresso, p Portico, q Pilastro del portico, n Lastricato, r Strada sterrata
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEwwwwwwwwwwwwwwwwwE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwaaaaaaaaaaaaaaawE
EEwjjjjjjjjjjjjjjjwE
EEwhhhhhhhsssshhhhwE
EEwhhhhhhhsssshhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwhhhhhhhhhhhhhhhwE
EEwwwwwwwdddwwwwwwwE
EEqppppppnnnppppppqE
EEEEEEEEErrrEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, h Pavimento della sala, a Pavimento della cucina, w Muro della fattoria, j Muro interno, s Scala, d Ingresso, p Portico, q Pilastro del portico, b Pavimento della stalla, v Muro della stalla, c Aia, n Lastricato, r Strada sterrata, x Staccionata, g Campo arato, l Solco
Plan (the letter of every cell):
```
EEggggggggggglllllllllllllllEE
EglllllllllllgggglgggggggggggE
llggggggggggggggglggllllllllll
ggggggggggggggggglgggggggggggg
llllllllllllllllllggggglllllll
gggggggggggggggggglllllggggggg
lllllllgggggggggggggggggllllll
ggggggglllllllllllllllllgggggg
gggglllwwwwwwwwwwwwwwwwwllllll
gggggggwaaaaaaaaaaaaaaawEllllE
lllllllwaaaaaaaaaaaaaaawEEggEE
gggggglwaaaaaaaaaaaaaaawvvvvvE
lllllglwaaaaaaaaaaaaaaawbbbbvE
gggggglwaaaaaaaaaaaaaaawbbbbvE
lllllglwaaaaaaaaaaaaaaawbbbbvE
lgglgglwjjjjjjjjjjjjjjjwbbbbvE
lgglgglwhhhhhhhsssshhhhwbbbbvE
lgglgglwhhhhhhhsssshhhhwbbbbvE
lgglgglwhhhhhhhhhhhhhhhwbbbbvE
lgglgglwhhhhhhhhhhhhhhhwvvvvvE
lgglgglwhhhhhhhhhhhhhhhwEEEEEE
EgglggEwhhhhhhhhhhhhhhhwEEEEEE
EEglgEEwwwwwwwdddwwwwwwwEEEEEE
EEEExxxqppppppnnnppppppqxxxEEE
EEEExcccccccccnnncccccccccxEEE
EEEExcccccccccnnncccccccccxEEE
EEEExcccccccccnnncccccccccxEEE
EEEExxxxxxxxxxrrrxxxxxxxxxxEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.01 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  Fattoria (Block 2 — Programma completo):
  - Corpo principale (h: sala, a: cucina, w: muri esterni, j: muro interno, i: porta interna, s: scala, d: ingresso anteriore):
    casa padronale a due piani (75x65 voxel interni), con portico anteriore (p, q) e tetto a padiglione (R) con camino (K).
  - Varianti per seme: posizione del muro interno j e della porta i, posizione della scala s, estensione del portico p,
    lato e posizione della stalla/annesso (b, v), pozzo (Q), alberi (t) e solchi dei campi (g, l).
  - Cosa entra per taglia:
    - Large (100x100x80): casa a due piani con 2 stanze al piano terra, portico anteriore, strada r fino al bordo e alberi t.
    - Huge (150x150x120): in più stalla/annesso laterale (b, v), aia (c) con lastricato (n) e pozzo (Q), staccionata (x) e campi arati (g, l).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhawjisdpqbvcnrxQgltm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa: 6 celle dietro H, 6 davanti, 7 per lato (15x13 interne) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Ingresso anteriore d (3 celle) tracciato dal centro H verso il fronte -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>

      <!-- Muro interno j (spostato casualmente di -1, 0 o +1) che divide sala (h) e cucina (a) -->
      <prl in="h/H" out="H/h" p="0.35" steps="1" symmetry="()"/>
      <prl in="H/h" out="h/H" p="0.35" steps="1" symmetry="()"/>
      <prl in="H" out="j"/>
      <all in="jh" out="*j" symmetry="(x)"/>
      <all in="h/j" out="a/*" symmetry="()" steps="1"/>
      <all in="ah" out="*a"/>

      <!-- Zona della scala s nella sala anteriore, addossata al muro interno j -->
      <one in="jjjjjjjjj/hhhhhhhhh/hhhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Porta interna i (3 celle) nel muro interno j, lontana dalla scala -->
      <one in="jjjjj/hhhhh" out="*iii*/*****" symmetry="()" steps="1"/>

      <!-- Portico anteriore p davanti all'ingresso, esteso casualmente sui lati, con pilastri q -->
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="w/E" out="*/p" symmetry="()" steps="1"/>
      <prl in="pp/EE" out="**/mm" p="0.5" steps="1" symmetry="()"/>
      <prl in="m" out="E"/>
      <all in="pE/EE" out="q*/**" symmetry="(x)" steps="1"/>
      <all in="Ep/EE" out="*q/**" symmetry="()" steps="1"/>

      <!-- Stalla/annesso laterale (b, v) solo dove c'è spazio (Huge) -->
      <one in="wEEEEE/wEEEEE/wEEEEE/wEEEEE/wEEEEE/wEEEEE/wEEEEE" out="*b****/*b****/*b****/*b****/*b****/*b****/*b****" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="3"/>
      <all in="bE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia c davanti al portico solo dove il terreno continua (Huge) -->
      <all in="[pq]/E/E/E/E" out="*/c/c/c/*" symmetry="()" steps="1"/>
      <all in="cEEEE" out="*cc**" symmetry="(x)" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Lastricato n attraverso portico e aia, poi strada r fino al bordo -->
      <all in="[dn]/[pc]" out="*/n" symmetry="()"/>
      <all in="[nr]/E" out="*/r" symmetry="()"/>

      <!-- Pozzo Q nell'aia dove entra 3x3 -->
      <one in="ccc/ccc/ccc" out="***/ *Q* /***" steps="1"/>

      <!-- Staccionata x attorno all'aia -->
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- Alberi t nel terreno libero esterno -->
      <one in="EEE/EEE/EEE" out="***/ *t* /***" steps="4"/>

      <!-- Campi arati (g, l) nel terreno libero esterno (Huge) -->
      <all in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**g**/*****/*****" steps="1"/>
      <all in="gE" out="*g" steps="2"/>
      <convchain on="g" black="g" white="l" n="3" steps="8">
        <sample>ggggggg/lllllll/ggggggg/lllllll/ggggggg/lllllll/ggggggg</sample>
      </convchain>
    </sequence>

    <map scale="5 5 1" values="BEhawjisdpqbvcnrxQgltfeWFVRUJPKLXyOoNTkG#20#21#90#91#92" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="q" out="ppppp/pPPPp/pPPPp/pPPPp/ppppp"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="x" out="EEEEE/ExxxE/ExxxE/ExxxE/EEEEE"/>
      <rule in="Q" out="ccccc/cVVVc/cVQVc/cVVVc/ccccc"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="t" out="EEEEE/EEEEE/EEtEE/EEEEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="WV"/>
        <union symbol="=" values="feF"/>

        <!-- B. Altezze: muri esterni della casa (2 piani = 64 voxel + tetto R) -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- Ingresso anteriore d: seme porta O a z=0, muro W sopra, tetto R a z=64 -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="63"/>
        <prl in="d" out="R"/>

        <!-- Muro interno j (solo piano terra = 32 voxel, solaio F, piano superiore aperto) -->
        <all in="B j" out="j W" steps="32"/>
        <all in="B j" out="j F" steps="1"/>
        <all in="B j" out="j B" steps="31"/>
        <prl in="j" out="R"/>

        <!-- Porta interna i: seme porta O a z=0, muro W sopra, solaio F, piano superiore aperto -->
        <all in="B i" out="i O" steps="1"/>
        <all in="B i" out="i W" steps="31"/>
        <all in="B i" out="i F" steps="1"/>
        <all in="B i" out="i B" steps="31"/>
        <prl in="i" out="R"/>

        <!-- Pavimenti, striscia scala T, solaio F e soffitto/tetto R della casa -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B a" out="a e"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B a" out="a B"/>
        </all>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B a" out="a F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B a" out="a B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="R"/>
          <rule in="a" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Portico: pilastri P (33 voxel) e tettoia J a z=34 -->
        <all in="B P" out="P *" steps="33"/>
        <all in="B P" out="J *" steps="1"/>
        <all in="B p" out="y *" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>

        <!-- Stalla/annesso (1 piano = 32 voxel + tetto R) -->
        <all in="B v" out="v V" steps="6"/>
        <all in="B v" out="v U" steps="10"/>
        <all in="B v" out="v V" steps="16"/>
        <prl in="v" out="R"/>
        <all in="B b" out="b *" steps="1"/>
        <all in="B b" out="b B" steps="31"/>
        <prl in="b" out="R"/>

        <!-- Pozzo Q (bordo in pietra V alto 8) -->
        <all in="B V" out="V *" steps="8"/>

        <!-- Staccionata x -->
        <all in="B x" out="x X" steps="8"/>
        <prl in="x" out="X"/>

        <!-- Alberi t: tronco K e chioma L -->
        <all in="B t" out="t K" steps="14"/>
        <prl in="t" out="L"/>
        <all in="LB" out="*L" steps="4"/>
        <all in="B L" out="L *" steps="4"/>

        <!-- C. Parti incluse: porte, scala, finestre -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-window"/>
        <all in="UV" out="VV"/>
        <prl in="U" out="W"/>

        <!-- Tetti a padiglione con gronda e camino -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="5"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="6A8E4E" hidden="True" name="Terreno"/>
  <color symbol="H" value="FF00FF" name="Centro"/>
  <color symbol="f" value="C8A878" area="hall" name="Pavimento in legno della sala"/>
  <color symbol="e" value="B88860" area="kitchen" name="Pavimento in cotto della cucina"/>
  <color symbol="F" value="A88A60" area="hall" name="Solaio in legno"/>
  <color symbol="W" value="E2D4BC" name="Intonaco della fattoria"/>
  <color symbol="V" value="8E8274" name="Muro in pietra"/>
  <color symbol="R" value="B85038" name="Tetto in tegole"/>
  <color symbol="J" value="9C4830" name="Tettoia del portico"/>
  <color symbol="P" value="5C3A21" name="Pilastro in legno"/>
  <color symbol="p" value="B0A28C" area="porch" name="Pavimento del portico"/>
  <color symbol="b" value="9C8460" area="barn" name="Pavimento della stalla"/>
  <color symbol="c" value="C2B280" area="yard" name="Aia"/>
  <color symbol="n" value="9E9A90" area="yard" name="Lastricato"/>
  <color symbol="r" value="A68E68" area="road" name="Strada sterrata"/>
  <color symbol="X" value="6B4C30" name="Staccionata in legno"/>
  <color symbol="Q" value="4E7A9E" name="Acqua del pozzo"/>
  <color symbol="g" value="7C5A3A" area="field" name="Campo arato"/>
  <color symbol="l" value="5E4228" area="field" name="Solco"/>
  <color symbol="K" value="6E4A32" name="Camino e tronco"/>
  <color symbol="L" value="447A3C" name="Chioma dell'albero"/>
  <color symbol="O" value="7A4B2A" name="Porta in legno"/>
  <color symbol="o" value="563218" name="Assi della porta"/>
  <color symbol="N" value="4A3220" name="Cornice in legno"/>
  <color symbol="G" value="9CC4D8" name="Vetro della finestra"/>
  <color symbol="k" value="8C6846" name="Gradini della scala"/>
  <color symbol="#20" value="7A4B2A" hidden="True" name="Porta aperta"/>
  <color symbol="#21" value="563218" hidden="True" name="Assi porta aperta"/>

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

