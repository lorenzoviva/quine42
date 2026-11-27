# model.sculpt · gemini-4-neon · 82 s

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
  Fattoria (composizione sul piano 1/5):
  - Parti e lettere:
    h: pavimento della casa principale (due piani, divisa in due stanze dal muro interno j)
    w: muri esterni della casa principale
    j: muro interno divisorio tra sala anteriore e stanza posteriore
    s: zona della scala (lungo il muro interno, nella sala anteriore, verso +x)
    d: porta principale sul fronte (3 celle = 15 voxel)
    p: pavimento del portico sul fronte; b: pilastri agli angoli anteriori del portico
    a: pavimento della stalla / ala laterale; v: muri della stalla
    r: strada selciata dalla porta al bordo anteriore
    c: aia attorno alla fattoria; x: recinto dell'aia; Q: pozzo nell'aia
    l, g: campi arati con solchi oltre il recinto; t: alberi sul terreno libero
  - Variazione tra i semi: profondità della casa (+1 cella a caso), lato e posizione della stalla laterale,
    posizione della scala lungo il muro interno, posizione del pozzo e degli alberi, trama dei solchi.
  - Scala e dimensioni:
    * Huge (30x30): casa principale (circa 15x13 celle interne), portico, stalla laterale, breve aia e strada.
    * Gargantuan (100x100): in più grande aia recintata, pozzo, ampi campi arati con solchi e alberi attorno.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjsdpbravcxQltg" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa attorno al centro H: 15x13 celle interne (+1 in profondità a caso) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Porta principale sul fronte (3 celle) tracciata dal centro H verso +y -->
      <all in="H/h" out="*/r" symmetry="()" steps="1"/>
      <all in="r/h" out="*/r" symmetry="()"/>
      <all in="r/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="r" out="h"/>

      <!-- Muro interno j che divide la casa in sala anteriore e stanza posteriore -->
      <all in="[Hj]h" out="*j" symmetry="(x)"/>
      <prl in="H" out="j"/>

      <!-- Zona scala s nella sala anteriore lungo il muro interno (4x2 celle, 2 celle libere prima e dopo) -->
      <one in="jjjjjjjj/hhhhhhhh/hhhhhhhh" out="********/**ssss**/**ssss**" symmetry="()" steps="1"/>

      <!-- Portico anteriore p (3 celle di profondità, 7 di larghezza) e pilastri b agli angoli -->
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="2"/>
      <all in="pE" out="*p" symmetry="(x)" steps="2"/>
      <all in="pE/EE" out="b*/**" symmetry="(x)"/>

      <!-- Stalla / ala laterale a contro un lato casuale della casa, con i propri muri v -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia c attorno alla casa e alla stalla: si espande dove c'è molto terreno (Gargantuan) -->
      <all in="[wvpbd]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*cccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Recinto x attorno all'aia dove il terreno prosegue -->
      <all in="cEE" out="*x*"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- Strada r dalla porta al bordo anteriore (3 celle di larghezza) -->
      <all in="d/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/[pcxE]" out="*/r" symmetry="()"/>

      <!-- Pozzo Q in uno spazio libero dell'aia -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Campi arati l oltre il recinto (Gargantuan) con solchi g -->
      <all in="xEEEEEE" out="*lllll*" steps="1"/>
      <all in="lE/*l" out="*l/**"/>
      <all in="lEEEEEE" out="*llll**" steps="1"/>
      <all in="lE/*l" out="*l/**"/>
      <convchain on="l" black="l" white="g" n="3" steps="6">
        <sample>lllllll/ggggggg/lllllll/ggggggg/lllllll/ggggggg/lllllll</sample>
      </convchain>

      <!-- Alberi t sul terreno libero attorno -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="B" value="000000" hidden="True" name="aria"/>
  <color symbol="E" value="7A9A5B" hidden="True" name="terreno"/>
  <color symbol="H" value="FF00FF" hidden="True" name="centro"/>
  <color symbol="h" value="C9A87C" area="house" name="pavimento della casa"/>
  <color symbol="w" value="D8CFC2" name="muro della casa"/>
  <color symbol="j" value="BFA98E" name="muro interno"/>
  <color symbol="s" value="9C6B3B" area="house" name="zona scala"/>
  <color symbol="d" value="6E4526" name="porta"/>
  <color symbol="p" value="B89B72" area="porch" name="portico"/>
  <color symbol="b" value="6B4423" name="pilastro del portico"/>
  <color symbol="r" value="A89F91" area="road" name="strada"/>
  <color symbol="a" value="B38F5D" area="barn" name="stalla"/>
  <color symbol="v" value="8C6A4A" name="muro della stalla"/>
  <color symbol="c" value="C7B793" area="yard" name="aia"/>
  <color symbol="x" value="7A5433" name="recinto"/>
  <color symbol="Q" value="5B84A6" name="pozzo"/>
  <color symbol="l" value="9E7B4F" area="field" name="campo arato"/>
  <color symbol="g" value="7D5E3A" area="field" name="solco"/>
  <color symbol="t" value="4F7A3E" name="albero"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h pavimento della casa, w muro della casa, j muro interno, s zona scala, d porta, p portico, b pilastro del portico, r strada, a stalla, v muro della stalla, c aia, x recinto, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
ExxxxxxxxxxxxxxxxxxxxxxxxxEEEE
ExcccccccccccccccccccccccxEEEE
ExcccccccccccccccccccccccxEEEE
ExcccccccccccccccccccccccxEEEE
ExcccccccccccccccccccccccxEEEE
ExcccccccccccccccccccccccxEEEE
ExccQccwwwwwwwwwwwwwwwwwcxEEEE
ExcccccwhhhhhhhhhhhhhhhwcxEEEE
ExcccccwhhhhhhhhhhhhhhhwcxEEEE
ExcvvvvwhhhhhhhhhhhhhhhwcxEEEE
ExcvaaawhhhhhhhhhhhhhhhwcxEEEE
ExcvaaawhhhhhhhhhhhhhhhwcxEEEE
ExcvaaawhhhhhhhhhhhhhhhwcxEEEE
ExcvaaawjjjjjjjjjjjjjjjwcxEEEE
ExcvaaawhhhhhsssshhhhhhwcxEEEE
ExcvvvvwhhhhhsssshhhhhhwcxEEEE
ExcccccwhhhhhhhhhhhhhhhwcxEEEE
ExcccccwhhhhhhhhhhhhhhhwcxEEEE
ExcccccwhhhhhhhhhhhhhhhwcxEEEE
ExcccccwhhhhhhhhhhhhhhhwcxEEEE
ExcccccwwwwwwwdddwwwwwwwcxEEEE
ExccccccccccpprrrppccccccxEEEE
ExccccccccccpprrrppccccccxEEEE
ExccccccccccbprrrpbccccccxEEEE
ExccccccccccccrrrccccccccxEEEE
ExxxxxxxxxxxxxrrrxxxxxxxxxEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h pavimento della casa, w muro della casa, j muro interno, s zona scala, d porta, p portico, b pilastro del portico, r strada, a stalla, v muro della stalla, c aia, x recinto, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
ExxxxxxxxxxxxxxxxxxxxxxxxxEEEE
ExcccccccccccccccccccccccxEEEE
ExcccccccccccccccccccccccxEEEE
ExcccccccccccccccccccccccxEEEE
ExcccccccccccccccccccccccxEEEE
ExccQccccccccccccccccccccxEEEE
ExcccccwwwwwwwwwwwwwwwwwcxEEEE
ExcccccwhhhhhhhhhhhhhhhwcxEEEE
ExcccccwhhhhhhhhhhhhhhhwcxEEEE
ExcccccwhhhhhhhhhhhhhhhwcxEEEE
ExcccccwhhhhhhhhhhhhhhhwcxEEEE
ExcccccwhhhhhhhhhhhhhhhwcxEEEE
ExcccccwhhhhhhhhhhhhhhhwcxEEEE
ExcccccwjjjjjjjjjjjjjjjwcxEEEE
ExcvvvvwhhhhhsssshhhhhhwcxEEEE
ExcvaaawhhhhhsssshhhhhhwcxEEEE
ExcvaaawhhhhhhhhhhhhhhhwcxEEEE
ExcvaaawhhhhhhhhhhhhhhhwcxEEEE
ExcvaaawhhhhhhhhhhhhhhhwcxEEEE
ExcvaaawhhhhhhhhhhhhhhhwcxEEEE
ExcvvvvwwwwwwwdddwwwwwwwcxEEEE
ExccccccccccpprrrppccccccxEEEE
ExccccccccccpprrrppccccccxEEEE
ExccccccccccbprrrpbccccccxEEEE
ExccccccccccccrrrccccccccxEEEE
ExxxxxxxxxxxxxrrrxxxxxxxxxEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h pavimento della casa, w muro della casa, j muro interno, s zona scala, d porta, p portico, b pilastro del portico, r strada, a stalla, v muro della stalla, c aia, x recinto, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
ExxxxxxxxxxxxxxxxxxxxxxxxxxxxE
ExcccccccccccccccccccccccccccE
ExcccccccccccccccccccccccccccE
ExcccccccccccccccccccccccccccE
ExcccccccccccccccccccccccccccE
ExcccccccccccccccccccccccccccE
ExcccccwwwwwwwwwwwwwwwwwcccccE
ExcccccwhhhhhhhhhhhhhhhwcccccE
ExcccccwhhhhhhhhhhhhhhhwcccccE
ExcccccwhhhhhhhhhhhhhhhwccQccE
ExcccccwhhhhhhhhhhhhhhhwcccccE
ExcccccwhhhhhhhhhhhhhhhwcccccE
ExcccccwhhhhhhhhhhhhhhhwcccccE
ExcccccwjjjjjjjjjjjjjjjwcccccE
ExcccccwhhhsssshhhhhhhhwcccccE
ExcccccwhhhsssshhhhhhhhwvvvvcE
ExcccccwhhhhhhhhhhhhhhhwaaavcE
ExcccccwhhhhhhhhhhhhhhhwaaavcE
ExcccccwhhhhhhhhhhhhhhhwaaavcE
ExcccccwhhhhhhhhhhhhhhhwaaavcE
ExcccccwwwwwwwdddwwwwwwwaaavcE
ExccccccccccpprrrppcccccvvvvcE
ExccccccccccpprrrppccccccccccE
ExccccccccccbprrrpbccccccccccE
ExccccccccccccrrrccccccccccccE
ExxxxxxxxxxxxxrrrxxxxxxxxxxxxE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 100×100×160, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E terreno, h pavimento della casa, w muro della casa, j muro interno, s zona scala, d porta, p portico, b pilastro del portico, r strada, a stalla, v muro della stalla, c aia, x recinto, Q pozzo, l campo arato, t albero, g solco
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
EEEEEEEEgggglllllggglllgllllllllllllglllgEEEEEEEEE
EEEEEEEEggggllllgggggggggglllgggggllggllgEEEEEEEEE
EEEEEEEEgglgllllllllllggggllllggggllllllgEEEEEEEEE
EEEEEEEEgglglllllllllllllllllllllllggggggEEEEEEEEE
EEEEEEEEggglgxxxxxxxxxxxxxxxxxxxxxxxglgggEEEEEEEEE
EEEEEEEEglllgcccccccccccccccccccccccglgggEEEEEEEEE
EEEEEEEEllllgcccccccccccccccccccccccgggllEEEEEEEEE
EEEEEEEEllllgccccccccccccccccccccccclllllEEEEEEEEE
EEEEEEEEggglgccccccccccccccccccccccclllgEEEEEEEEEE
EEEEEEEEggglgcccccccccccccccccccccccgglggEEEEEEEEE
EEEEEEEEggllgcccccccccccccccccccccccgglggEEEEEEEEE
EEEEEEEEggllgccccccccwhhhhhhhwccccccggllgEEEEEEEEE
EEEEEEEEgglllccccccvvwhhhhhhhwccccccgglggEEEEEEEEE
EEEEEEEEgglllccccccvawhhhhhhhwccccccgglggEEEEEEEEE
EEEEEEEEgglglccccccvawjjjjjjjwcccccclllggEEEEEEEEE
EEEEEEEEgllgxccccccvvwhhsshhhwcccccclllggEEEEEEEEE
EEEEEEEEglgggccccccccwhhhhhhhwccccccllgggEEEEEEEEE
EEEEEEEEglgggccccccccwhhhhhhhwccccccllgggEEEEEEEEE
EEEEEEEEglgggcccccccccccprpcccccccccllgggEEEEEEEEE
EEEEEEEEgllggcccccccccccrrccccccccccllglgEEEEEEEEE
EEEEEEEEgllggccccccccccccrccccccccccllgggEEEEEEEEE
EEEEEEEEgllggccccccccccccrccccccccccglllgEEEEEEEEE
EEEEEEEEggglgccccccccccccrccccccccccggglgEEEEEEEEE
EEEEEEEEggglgccccccccccccrccccccccccggglgEEEEEEEEE
EEEEEEEEgglggccccccccccccrccccccccccggglgEEEEEEEEE
EEEEEEEEgglggcccccccccccrrcccccccccxllllgEEEEEEEEE
EEEEEEEEglggglgggggggggggrllllggggglllllgEEEEEEEEE
EEEEEEEEglggglggggggllllgrllllgllgllllgllEEEEEEEEE
EEEEEEEEglgggllggggglllggrgggggllglllllgEEEEEEEEEE
EEEEEEEEgllllglllllglllggrglllllllgggllllEEEEEEEEE
EEEEEEEElllllEgggggggggErrEgggggggggggggEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.16 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  Fattoria (programma completo):
  - Parti e lettere sul piano (1/5):
    h: pavimento della casa principale (due piani, divisa in due stanze dal muro interno j)
    w: muri esterni della casa principale
    j: muro interno divisorio tra sala anteriore e stanza posteriore; i: porta interna
    s: zona della scala (lungo il muro interno, nella sala anteriore, verso +x)
    d: porta principale sul fronte (3 celle = 15 voxel)
    p: pavimento del portico sul fronte (4 celle di profondità = 20 voxel); b: pilastri agli angoli
    a: pavimento della stalla / ala laterale; v: muri della stalla
    r: strada selciata dal portico al bordo anteriore
    c: aia attorno alla fattoria; x: recinto dell'aia; Q: pozzo nell'aia
    l, g: campi arati con solchi oltre il recinto; t: alberi sul terreno libero
  - Scala e dimensioni:
    * Huge (30x30): casa principale (75x65 voxel interni, due piani), portico (35x20), stalla laterale, aia recintata, pozzo e strada.
    * Gargantuan (100x100): in più ampia aia recintata, grandi campi arati con solchi e alberi attorno.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjisdpbravcxQltg" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa attorno al centro H: 15x13 celle interne (+1 in profondità a caso) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Porta principale sul fronte (3 celle) tracciata dal centro H verso +y -->
      <all in="H/h" out="*/r" symmetry="()" steps="1"/>
      <all in="r/h" out="*/r" symmetry="()"/>
      <all in="r/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="r" out="h"/>

      <!-- Muro interno j che divide la casa in sala anteriore e stanza posteriore -->
      <all in="[Hj]h" out="*j" symmetry="(x)"/>
      <prl in="H" out="j"/>

      <!-- Zona scala s nella sala anteriore lungo il muro interno (4x2 celle, 2 celle libere prima e dopo) -->
      <one in="jjjjjjjj/hhhhhhhh/hhhhhhhh" out="********/**ssss**/**ssss**" symmetry="()" steps="1"/>

      <!-- Porta interna i nel muro divisorio j, lontana dalla scala -->
      <one in="hhh/jjj/hhh" out="***/iii/***" symmetry="()" steps="1"/>

      <!-- Portico anteriore p (4 celle di profondità = 20 voxel, 7 di larghezza = 35 voxel) e pilastri b -->
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="3"/>
      <all in="pE" out="*p" symmetry="(x)" steps="2"/>
      <all in="pE/EE" out="b*/**" symmetry="(x)"/>

      <!-- Stalla / ala laterale a contro un lato casuale della casa, con i propri muri v -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia c attorno alla casa e alla stalla: si espande dove c'è molto terreno (Gargantuan) -->
      <all in="[wvpbd]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*cccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Recinto x attorno all'aia dove il terreno prosegue -->
      <all in="cEE" out="*x*"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- Strada r dal portico al bordo anteriore (3 celle di larghezza, allineata alla porta d) -->
      <all in="d/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/p" out="*/r" symmetry="()"/>
      <all in="r/[cxE]" out="*/r" symmetry="()"/>
      <all in="d/r" out="*/p" symmetry="()" steps="1"/>
      <all in="p/r" out="*/p" symmetry="()" steps="3"/>

      <!-- Pozzo Q in uno spazio libero dell'aia -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Campi arati l oltre il recinto (Gargantuan) con solchi g -->
      <all in="xEEEEEE" out="*lllll*" steps="1"/>
      <all in="lE/*l" out="*l/**"/>
      <all in="lEEEEEE" out="*llll**" steps="1"/>
      <all in="lE/*l" out="*l/**"/>
      <convchain on="l" black="l" white="g" n="3" steps="6">
        <sample>lllllll/ggggggg/lllllll/ggggggg/lllllll/ggggggg/lllllll</sample>
      </convchain>

      <!-- Alberi t sul terreno libero attorno -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>

    <map scale="5 5 1" values="BEhswjdipbavrcxQlgtfFWYURJKPyXLuMOoNGTk#90#91#92#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="i" out="iiiii/iiiii/iiiii/iiiii/iiiii"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="b" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="ccccc/cQQQc/cQuQc/cQQQc/ccccc"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="t" out="EEEEE/EEEEE/EEtEE/EEEEE/EEEEE"/>

      <union symbol="+" values="WY"/>
      <union symbol="=" values="fF"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: crescita delle colonne -->

        <!-- Muri esterni della casa (2 piani da 32 = 64, con fasce finestre U) -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w W" steps="14"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w W" steps="14"/>
        <prl in="w" out="R"/>

        <!-- Porta principale d: seme O a z=0, muro W sopra fino a 64, tetto R -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="63"/>
        <prl in="d" out="R"/>

        <!-- Muro interno j (piano terra 32, soletta F sopra) -->
        <all in="B j" out="j W" steps="32"/>
        <prl in="j" out="F"/>

        <!-- Porta interna i: seme O a z=0, muro W fino a 32, soletta F -->
        <all in="B i" out="i O" steps="1"/>
        <all in="B i" out="i W" steps="31"/>
        <prl in="i" out="F"/>

        <!-- Pavimenti della casa h e zona scala s (2 piani da 32, tetto R a 64) -->
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

        <!-- Stalla laterale: muri v (32 con fascia U) e pavimento a, tetto J a 32 -->
        <all in="B v" out="v Y" steps="6"/>
        <all in="B v" out="v U" steps="10"/>
        <all in="B v" out="v Y" steps="16"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="J"/>

        <!-- Portico: pavimento P, 33 d'aria libera, tetto J a 34; pilastri b di legno X -->
        <all in="B p" out="y P" steps="1"/>
        <all in="B y" out="y B" steps="33"/>
        <prl in="y" out="J"/>
        <all in="B b" out="b X" steps="34"/>
        <prl in="b" out="J"/>

        <!-- Recinto x (muretto basso in legno/pietra alto 7) -->
        <all in="B x" out="x X" steps="7"/>
        <prl in="x" out="X"/>

        <!-- Pozzo Q (bordo in pietra Y alto 6) e acqua u (M alta 3) -->
        <all in="B Q" out="Q Y" steps="6"/>
        <prl in="Q" out="Y"/>
        <all in="B u" out="u M" steps="3"/>
        <prl in="u" out="M"/>

        <!-- Alberi t: tronco X alto 18 e chioma tondeggiante L -->
        <all in="B t" out="t X" steps="18"/>
        <prl in="t" out="L"/>
        <all in="LB" out="*L" steps="4"/>
        <all in="B L" out="L *" steps="5"/>
        <all in="L B" out="* L" steps="2"/>

        <!-- C. Scala piena: porte, scale, finestre, tetti e camino -->
        <pieces piece="125" margin="24">
          <import file="part-door"/>
          <import file="part-stair"/>
        </pieces>

        <import file="part-window"/>
        <prl in="U" out="W"/>

        <!-- Tetto a padiglione della casa (gronda + 12 passi 1:2) -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="12" symmetry="()"/>

        <!-- Tetto della stalla e del portico (gronda + 6 passi 1:2) -->
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="6" symmetry="()"/>

        <!-- Camino K in pietra sul tetto principale -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="12"/>
        <all in="KB" out="*K" steps="1"/>
      </sequence>
    </map>
  </map>

  <color symbol="B" value="000000" hidden="True" name="aria"/>
  <color symbol="E" value="7A9A5B" hidden="True" name="terreno"/>
  <color symbol="H" value="FF00FF" hidden="True" name="centro"/>
  <color symbol="h" value="C9A87C" area="house" name="pavimento della casa"/>
  <color symbol="w" value="D8CFC2" name="muro della casa"/>
  <color symbol="j" value="BFA98E" name="muro interno"/>
  <color symbol="s" value="9C6B3B" area="house" name="zona scala"/>
  <color symbol="d" value="6E4526" name="porta"/>
  <color symbol="i" value="6E4526" name="porta interna"/>
  <color symbol="p" value="B89B72" area="porch" name="portico"/>
  <color symbol="b" value="6B4423" name="pilastro del portico"/>
  <color symbol="r" value="A89F91" area="road" name="strada"/>
  <color symbol="a" value="B38F5D" area="barn" name="stalla"/>
  <color symbol="v" value="8C6A4A" name="muro della stalla"/>
  <color symbol="c" value="C7B793" area="yard" name="aia"/>
  <color symbol="x" value="7A5433" name="recinto"/>
  <color symbol="Q" value="8E8B82" name="pozzo"/>
  <color symbol="l" value="9E7B4F" area="field" name="campo arato"/>
  <color symbol="g" value="7D5E3A" area="field" name="solco"/>
  <color symbol="t" value="4F7A3E" name="albero"/>

  <color symbol="f" value="C49A6C" area="house" name="tavole del pavimento"/>
  <color symbol="F" value="A67C52" area="house" name="solaio di legno"/>
  <color symbol="W" value="E5DCCB" name="intonaco chiaro"/>
  <color symbol="Y" value="9B9488" name="pietra rustica"/>
  <color symbol="U" value="E5DCCB" name="fascia finestre"/>
  <color symbol="R" value="B84A39" name="tegole rosse"/>
  <color symbol="J" value="9E5B40" name="tetto della stalla"/>
  <color symbol="K" value="736E67" name="camino di pietra"/>
  <color symbol="P" value="B89B72" area="porch" name="pavimento del portico"/>
  <color symbol="y" value="B89B72" hidden="True" name="segna portico"/>
  <color symbol="X" value="6B4423" name="legno scuro"/>
  <color symbol="L" value="4F7A3E" name="chioma d'albero"/>
  <color symbol="u" value="5B84A6" hidden="True" name="segna acqua"/>
  <color symbol="M" value="4A7C9B" name="acqua del pozzo"/>
  <color symbol="O" value="7A4B2A" name="porta di legno"/>
  <color symbol="o" value="52311A" name="assi della porta"/>
  <color symbol="N" value="5E3D24" name="cornice di legno"/>
  <color symbol="G" value="9EC5D6" name="vetro della finestra"/>
  <color symbol="T" value="9C6B3B" hidden="True" name="traccia scala"/>
  <color symbol="k" value="8A5E36" name="gradini di legno"/>
  <color symbol="#20" value="000000" hidden="True" name="porta aperta"/>
  <color symbol="#21" value="000000" hidden="True" name="assi aperte"/>

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

