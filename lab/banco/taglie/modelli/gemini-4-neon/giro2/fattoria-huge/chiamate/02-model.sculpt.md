# model.sculpt · gemini-4-neon · 101 s

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
  Fattoria (Block 1: composizione in pianta, scala 1/5)
  Parti e lettere:
    h = pavimento casa (corpo principale a due piani, diviso in due stanze)
    w = muro casa (muri perimetrali della casa)
    j = tramezzo (muro interno che separa sala e cucina)
    s = scala (zona scala lungo la parete posteriore della sala)
    d = porta (ingresso anteriore al centro della casa, 3 celle)
    p = portico (portico anteriore davanti alla porta)
    o = pilastro portico (pilastri agli angoli del portico)
    a = stalla (ala laterale della stalla/fienile)
    v = muro stalla (muri della stalla)
    y = tettoia (tettoia per il fieno addossata alla stalla)
    c = aia (cortile agricolo attorno a casa e stalla)
    n = selciato (vialetto lastricato nell'aia verso la porta)
    r = strada (strada sterrata dal portico al bordo anteriore)
    Q = pozzo (pozzo nell'aia)
    f = recinto (staccionata attorno all'aia)
    g = pascolo (pascolo/frutteto oltre il recinto)
    l = campo (campo arato oltre il pascolo)
    u = solco (solchi del campo arato)
    k = albero (alberi nel pascolo e sul prato)
    m = marcatore temporaneo (rimosso prima della fine)
  Disposizione: la casa domina il centro con portico e strada verso il fronte; la stalla si aggancia
  a un fianco scelto dal seme; l'aia circonda gli edifici con pozzo e tettoia; recinto, pascolo,
  campi arati e alberi si estendono verso l'esterno dove c'è spazio.
  Variazioni per seme: profondità della casa (+0/+1), lato del tramezzo, lato della stalla, posizione
  di pozzo, tettoia, alberi e trama dei solchi nei campi.
  Cosa entra per taglia: a Large la casa principale con portico e strada; a Huge casa, stalla, aia,
  pozzo e primi alberi; a Gargantuan l'intera tenuta con aia ampia, tettoia, recinto, pascolo, campi arati e alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjsdpoavycnrQfglukm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa attorno ad H: 6 dietro, 6 (+1 a caso) davanti, 8 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="8"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Tramezzo interno j a due celle da H (lato scelto dal seme): stanza 6 celle + sala 10 celle -->
      <one in="hhHh" out="j***" symmetry="(x)" steps="1"/>
      <all in="h/j" out="j/*" symmetry="()"/>
      <all in="j/h" out="*/j" symmetry="()"/>

      <!-- Zona scala s nella sala (10 celle), lungo il muro posteriore con pianerottolo prima e dopo -->
      <one in="wwwwwwwwwwww/[wj]hhhhhhhhhh[wj]/[wj]hhhhhhhhhh[wj]" out="************/****ssss****/****ssss****" symmetry="()" steps="1"/>

      <!-- Porta anteriore d al centro (3 celle) dalla linea di H verso il fronte -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Portico p davanti alla porta (3 celle di profondità, 5 di larghezza) con pilastri o agli angoli -->
      <all in="[dp]/E" out="*/p" symmetry="()" steps="3"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <all in="pE/EE" out="o*/**" symmetry="(x)" steps="1"/>

      <!-- Ala stalla/fienile a addossata a un fianco della casa dove c'è spazio, con muri v -->
      <one in="wEEEEEE/wEEEEEE/wEEEEEE/wEEEEEE/wEEEEEE" out="*******/*******/**aaaa*/*******/*******" symmetry="(x)" steps="1"/>
      <all in="wEa" out="*a*" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia c attorno a casa, portico e stalla, espansa dove il terreno continua -->
      <all in="[wvpo]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*cccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Selciato n nell'aia e strada r dal portico dritto al bordo anteriore (3 celle) -->
      <all in="p/c" out="*/n" symmetry="()" steps="1"/>
      <all in="n/c" out="*/n" symmetry="()"/>
      <all in="[np]/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Pozzo Q nell'aia e tettoia y addossata alla stalla dove entrano -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="vcccc/vcccc/vcccc/vcccc" out="*yyy*/*yyy*/*yyy*/*****" symmetry="(xy)" steps="1"/>

      <!-- Recinto f attorno all'aia, pascolo g e campi arati l/u oltre (a Gargantuan) -->
      <all in="cEEE" out="*f**" steps="1"/>
      <all in="fE/*f" out="*f/**"/>
      <all in="fEEEEEEEEEE" out="*gggggg****" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEEEEEEE" out="*llllll****" steps="1"/>
      <all in="lE/*l" out="*l/**"/>
      <convchain on="l" black="l" white="u" n="3" steps="6">
        <sample>lllllll/uuuuuuu/lllllll/uuuuuuu/lllllll/uuuuuuu/lllllll</sample>
      </convchain>

      <!-- Alberi k nel pascolo e sul terreno libero -->
      <one in="ggggggg/ggggggg/ggggggg/ggggggg/ggggggg/ggggggg/ggggggg" out="*******/*******/*******/***k***/*******/*******/*******" steps="6"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***k***/*******/*******/*******" steps="6"/>
    </sequence>
  </map>

  <color symbol="E" value="7b945c" hidden="True"/>
  <color symbol="H" value="ff00ff" name="origine"/>
  <color symbol="h" value="c8a878" name="pavimento casa" area="house"/>
  <color symbol="w" value="d9ccb4" name="muro casa"/>
  <color symbol="j" value="b8a990" name="tramezzo"/>
  <color symbol="s" value="8c6239" name="scala"/>
  <color symbol="d" value="6e4726" name="porta"/>
  <color symbol="p" value="b59b78" name="portico" area="porch"/>
  <color symbol="o" value="5c3d22" name="pilastro portico"/>
  <color symbol="a" value="a8895c" name="stalla" area="barn"/>
  <color symbol="v" value="9e6b4f" name="muro stalla"/>
  <color symbol="y" value="c47a44" name="tettoia" area="shed"/>
  <color symbol="c" value="b8a982" name="aia" area="yard"/>
  <color symbol="n" value="8f8b82" name="selciato" area="yard"/>
  <color symbol="r" value="a6926c" name="strada" area="road"/>
  <color symbol="Q" value="5a7d8c" name="pozzo"/>
  <color symbol="f" value="735234" name="recinto"/>
  <color symbol="g" value="88a660" name="pascolo" area="pasture"/>
  <color symbol="l" value="8c6d46" name="campo" area="field"/>
  <color symbol="u" value="6e5232" name="solco" area="field"/>
  <color symbol="k" value="4a6e3a" name="albero"/>
  <color symbol="m" value="ffaa00" name="marcatore"/>
</sequence>

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento casa, w muro casa, j tramezzo, s scala, d porta, p portico, o pilastro portico, a stalla, v muro stalla, y tettoia, c aia, n selciato, r strada, Q pozzo, f recinto
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
fffffffffffffffffffffffffffEEE
ccccccccccccccccccccccccccfEEE
ccccccccccccccccccccccccccfEEE
ccccccccccccccccccccccccccfEEE
ccQcccccccccccccccccccccccfEEE
ccccccccccccccccccccccccccfEEE
ccccccwwwwwwwwwwwwwwwwwwwcfEEE
ccccccwhhhsssshhhjhhhhhhwcfEEE
ccccccwhhhsssshhhjhhhhhhwcfEEE
ccccccwhhhhhhhhhhjhhhhhhwcfEEE
ccccccwhhhhhhhhhhjhhhhhhwcfEEE
vvvvvvwhhhhhhhhhhjhhhhhhwcfEEE
vaaaaawhhhhhhhhhhjhhhhhhwcfEEE
vaaaaawhhhhhhhhhhjhhhhhhwcfEEE
vaaaaawhhhhhhhhhhjhhhhhhwcfEEE
vaaaaawhhhhhhhhhhjhhhhhhwcfEEE
vaaaaawhhhhhhhhhhjhhhhhhwcfEEE
vvvvvvwhhhhhhhhhhjhhhhhhwcfEEE
yyycccwhhhhhhhhhhjhhhhhhwcfEEE
yyycccwhhhhhhhhhhjhhhhhhwcfEEE
yyycccwwwwwwwwdddwwwwwwwwcfEEE
cccccccccccccpppppccccccccfEEE
cccccccccccccpppppccccccccfEEE
cccccccccccccopppoccccccccfEEE
ccccccccccccccnnncccccccccfEEE
ffffffffffffffrrrffffffffffEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento casa, w muro casa, j tramezzo, s scala, d porta, p portico, o pilastro portico, a stalla, v muro stalla, y tettoia, c aia, n selciato, r strada, Q pozzo, f recinto
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
fffffffffffffffffffffffffffEEE
ccccccccccccccccccccccccccfEEE
ccccccccccccccccccccccccccfEEE
cyyyccccccccccccccccccccccfEEE
cyyyccccccccccccccccccccccfEEE
cyyyccccccccccccccccccccccfEEE
vvvvvvwwwwwwwwwwwwwwwwwwwcfEEE
vaaaaawhhhhhhjhhhsssshhhwcfEEE
vaaaaawhhhhhhjhhhsssshhhwcfEEE
vaaaaawhhhhhhjhhhhhhhhhhwcfEEE
vaaaaawhhhhhhjhhhhhhhhhhwcfEEE
vaaaaawhhhhhhjhhhhhhhhhhwcfEEE
vvvvvvwhhhhhhjhhhhhhhhhhwcfEEE
ccccccwhhhhhhjhhhhhhhhhhwcfEEE
ccccccwhhhhhhjhhhhhhhhhhwcfEEE
ccccccwhhhhhhjhhhhhhhhhhwcfEEE
cccQccwhhhhhhjhhhhhhhhhhwcfEEE
ccccccwhhhhhhjhhhhhhhhhhwcfEEE
ccccccwhhhhhhjhhhhhhhhhhwcfEEE
ccccccwhhhhhhjhhhhhhhhhhwcfEEE
ccccccwwwwwwwwdddwwwwwwwwcfEEE
cccccccccccccpppppccccccccfEEE
cccccccccccccpppppccccccccfEEE
cccccccccccccopppoccccccccfEEE
ccccccccccccccnnncccccccccfEEE
ffffffffffffffrrrffffffffffEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento casa, w muro casa, j tramezzo, s scala, d porta, p portico, o pilastro portico, a stalla, v muro stalla, y tettoia, c aia, n selciato, r strada, Q pozzo, f recinto
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
fffffffffffffffffffffffffffEEE
ccccccccccccccccccccccccccfEEE
ccccccccccccccccccccccccccfEEE
ccccccccccccccccccccccccccfEEE
ccccccccccccccccccccccccccfEEE
cccQccccccccccccccccccccccfEEE
ccccccwwwwwwwwwwwwwwwwwwwcfEEE
ccccccwhhhsssshhhjhhhhhhwcfEEE
vvvvvvwhhhsssshhhjhhhhhhwcfEEE
vaaaaawhhhhhhhhhhjhhhhhhwcfEEE
vaaaaawhhhhhhhhhhjhhhhhhwcfEEE
vaaaaawhhhhhhhhhhjhhhhhhwcfEEE
vaaaaawhhhhhhhhhhjhhhhhhwcfEEE
vaaaaawhhhhhhhhhhjhhhhhhwcfEEE
vvvvvvwhhhhhhhhhhjhhhhhhwcfEEE
ccyyycwhhhhhhhhhhjhhhhhhwcfEEE
ccyyycwhhhhhhhhhhjhhhhhhwcfEEE
ccyyycwhhhhhhhhhhjhhhhhhwcfEEE
ccccccwhhhhhhhhhhjhhhhhhwcfEEE
ccccccwhhhhhhhhhhjhhhhhhwcfEEE
ccccccwwwwwwwwdddwwwwwwwwcfEEE
cccccccccccccpppppccccccccfEEE
cccccccccccccpppppccccccccfEEE
cccccccccccccopppoccccccccfEEE
ccccccccccccccnnncccccccccfEEE
ffffffffffffffrrrffffffffffEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 100×100×160, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E marker, h pavimento casa, w muro casa, j tramezzo, s scala, d porta, p portico, o pilastro portico, a stalla, v muro stalla, y tettoia, c aia, n selciato, r strada, Q pozzo, f recinto, g pascolo, l campo, u solco, k albero
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
EEEEEEEllllllllllullllluuuuulllllllluuuuuEEEEEEEEE
EEEEEEElullllllllulllllluuuuluulllullllllEEEEEEEEE
EEEEEEEluuuuuuullluuuuuuuuuuuuuuullllllllEEEEEEEEE
EEEEEEEuuuggggggggggggggggggggggggggggullEEEEEEEEE
EEEEEEEuuuggggggggggggggggggggggggggggullEEEEEEEEE
EEEEEEEuuuggggggggggggggggggggggggggggullEEEEEEEEE
EEEEEEEluugggccccccccccccccccccccccggguluEEEEEEEEE
EEEEEEEluugggccccccccccccccccccccccggguulEEEEEEEEE
EEEEEEEuuugggccccccccccccccccccccccggguulEEEEEEEEE
EEEEEEEuuugggccccccccccccccccccccccggguulEEEEEEEEE
EEEEEEEllugggccccccccccccccccccccccggguulEEEEEEEEE
EEEEEEEllugggcccccvvwhhsshjhhhcccccggguuuEEEEEEEEE
EEEEEEEluugggcccccaaahhhhhjhhhcccccggguuuEEEEEEEEE
EEEEEEEluugggcccccaaahhhhhjhhhcccccggguuuEEEEEEEEE
EEEEEEEluugggcccccvvwhhhhhjhhhcccccggguulEEEEEEEEE
EEEEEEEluugggccccccychhhhhjhhhcccccggglllEEEEEEEEE
EEEEEEEluugggcccccccchhhhhjhhhcccccggguuuEEEEEEEEE
EEEEEEEluugggcccccccchhhhhwhhwcccccggguuuEEEEEEEEE
EEEEEEEluggggcccccccccccpppccccccccggguuuEEEEEEEEE
EEEEEEEluugggcccccccccccopcccccccccggguulEEEEEEEEE
EEEEEEEluugggccccccccccccncccccccccggguulEEEEEEEEE
EEEEEEEluugggccccccccccccncccccccccgggullEEEEEEEEE
EEEEEEEllugggccccccccccccncccccccccgggullEEEEEEEEE
EEEEEEEllugggccccccccccccncccccccccggguluEEEEEEEEE
EEEEEEEllugggfffffffffffrrfffffffffggguluEEEEEEEEE
EEEEEEEllugggggggggggggggrggggggggggggullEEEEEEEEE
EEEEEEEllggggggggggggggggrgggggggggggglllEEEEEEEEE
EEEEEEElluggggggggggggggrrgggggggggggglllEEEEEEEEE
EEEEEEEllllllllllllluuuuurullllllllllllllEEEEEEEEE
EEEEEEEllllllllluuuuuuuuurulluuuuuuuuuullEEEEEEEEE
EEEEEEEuuuuuuElluuuuulllrruuuuuuuuuuuuuuEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEErEEEEEEEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.14 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
  Fattoria (Block 2: programma completo)
  Parti e lettere in pianta (scala 1/5):
    h = pavimento casa (corpo principale a due piani, diviso in due stanze)
    w = muro casa (muri perimetrali della casa)
    j = tramezzo (muro interno che separa sala e cucina)
    s = scala (zona scala lungo la parete posteriore della sala)
    d = porta (ingresso anteriore al centro della casa, 3 celle)
    p = portico (portico anteriore davanti alla porta)
    P = pilastro portico (pilastri agli angoli del portico)
    a = stalla (ala laterale della stalla/fienile)
    v = muro stalla (muri della stalla)
    y = tettoia (tettoia per il fieno addossata alla stalla)
    c = aia (cortile agricolo attorno a casa e stalla)
    n = selciato (vialetto lastricato nell'aia verso la porta)
    r = strada (strada sterrata dal portico al bordo anteriore)
    Q = pozzo (pozzo nell'aia)
    q = recinto (staccionata attorno all'aia)
    g = pascolo (pascolo/frutteto oltre il recinto)
    l = campo (campo arato oltre il pascolo)
    u = solco (solchi del campo arato)
    t = albero (alberi nel pascolo e sul prato)
    m = marcatore temporaneo
  Variazioni per seme: profondità della casa, lato del tramezzo, lato della stalla (sinistra o destra),
  posizione di pozzo, tettoia, alberi e trama dei solchi nei campi.
  Taglie: a Huge casa, portico, stalla, tettoia, aia, pozzo e recinto; a Gargantuan anche pascolo, campi arati e alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjsdpPavycnrQqlugtm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- A. Composizione in pianta -->
      <!-- Corpo principale della casa attorno ad H: 6 dietro, 6 (+1 a caso) davanti, 8 per lato -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="8"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Tramezzo interno j a due celle da H (lato scelto dal seme): stanza 6 celle + sala 10 celle -->
      <one in="hhHh" out="j***" symmetry="(x)" steps="1"/>
      <all in="h/j" out="j/*" symmetry="()"/>
      <all in="j/h" out="*/j" symmetry="()"/>

      <!-- Zona scala s nella sala (10 celle), lungo il muro posteriore con pianerottolo prima e dopo -->
      <one in="wwwwwwwwwwww/[wj]hhhhhhhhhh[wj]/[wj]hhhhhhhhhh[wj]" out="************/****ssss****/****ssss****" symmetry="()" steps="1"/>

      <!-- Porta anteriore d al centro (3 celle) dalla linea di H verso il fronte -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Portico p davanti alla porta (3 celle di profondità, 5 di larghezza) con pilastri P agli angoli -->
      <all in="[dp]/E" out="*/p" symmetry="()" steps="3"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <all in="pE/EE" out="P*/**" symmetry="(x)" steps="1"/>

      <!-- Ala stalla/fienile a addossata a un fianco della casa (sinistra o destra), con muri v -->
      <one in="wEEEEE/wEEEEE/wEEEEE/wEEEEE/wEEEEE" out="******/******/w*aaa*/******/******" symmetry="(x)" steps="1"/>
      <all in="wEa" out="*a*" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia c attorno a casa, portico e stalla, espansa dove il terreno continua -->
      <all in="[wvpP]E" out="*c" steps="2"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*cccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Selciato n nell'aia e strada r dal portico dritto al bordo anteriore (3 celle) -->
      <all in="p/c" out="*/n" symmetry="()" steps="1"/>
      <all in="n/c" out="*/n" symmetry="()"/>
      <all in="[np]/E" out="*/r" symmetry="()"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Pozzo Q nell'aia e tettoia y (4x4 celle = 20x20 voxel) addossata alla stalla -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <one in="vcccc/vcccc/vcccc/vcccc/vcccc" out="*yyyy/*yyyy/*yyyy/*yyyy/*****" symmetry="(xy)" steps="1"/>

      <!-- Recinto q attorno all'aia, pascolo g e campi arati l/u oltre (a Gargantuan) -->
      <all in="cEEE" out="*q**" steps="1"/>
      <all in="qE/*q" out="*q/**"/>
      <all in="qEEEEEEEEEE" out="*gggggg****" steps="1"/>
      <all in="gE/*g" out="*g/**"/>
      <all in="gEEEEEEEEEE" out="*llllll****" steps="1"/>
      <all in="lE/*l" out="*l/**"/>
      <convchain on="l" black="l" white="u" n="3" steps="6">
        <sample>lllllll/uuuuuuu/lllllll/uuuuuuu/lllllll/uuuuuuu/lllllll</sample>
      </convchain>

      <!-- Alberi t nel pascolo e sul terreno libero -->
      <one in="ggggggg/ggggggg/ggggggg/ggggggg/ggggggg/ggggggg/ggggggg" out="*******/*******/*******/***t***/*******/*******/*******" steps="6"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="6"/>
    </sequence>

    <!-- Mappa in scala reale (5x5x1 per ogni cella della pianta) -->
    <map scale="5 5 1" values="BEhwjsdpPavycnrQqlugtWVfFACYRJILKMOoNGTkU#20#21#90#91#92" symmetry="()">
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
      <rule in="y" out="yyyyy/yyyyy/yyyyy/yyyyy/yyyyy"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="QQQQQ/QMMMQ/QMMMQ/QMMMQ/QQQQQ"/>
      <rule in="q" out="ccqcc/ccqcc/qqqqq/ccqcc/ccqcc"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="t" out="ggggg/gtttg/gtttg/gtttg/ggggg"/>

      <union symbol="+" values="WV"/>
      <union symbol="=" values="fF"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: colonne per passi -->
        <!-- Muri perimetrali della casa (2 piani = 64, con fascia finestre U su entrambi i piani) -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="18"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- Porta anteriore d: seme O sul piano terra, muro W sopra, finestra U al secondo piano -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="37"/>
        <all in="B d" out="d U" steps="14"/>
        <all in="B d" out="d W" steps="12"/>
        <prl in="d" out="R"/>

        <!-- Tramezzo interno j al piano terra (32), poi solaio e aria al secondo piano -->
        <all in="B j" out="j W" steps="32"/>
        <all in="B j" out="j F" steps="1"/>
        <all in="B j" out="j B" steps="31"/>
        <prl in="j" out="R"/>

        <!-- Pavimenti casa h e zona scala s (2 piani: z=0 pavimento f, z=32 solaio F, z=64 tetto R) -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>

        <!-- Portico p e pilastri P (32 di luce libera, tetto J a z=33) -->
        <all in="B p" out="p C" steps="1"/>
        <all in="B p" out="p B" steps="32"/>
        <prl in="p" out="J"/>
        <all in="B P" out="P I" steps="33"/>
        <prl in="P" out="J"/>

        <!-- Stalla a e muri v (altezza 44, tetto J) -->
        <all in="B a" out="a A" steps="1"/>
        <all in="B a" out="a B" steps="43"/>
        <prl in="a" out="J"/>
        <all in="B v" out="v V" steps="44"/>
        <prl in="v" out="J"/>

        <!-- Tettoia y (31 di luce libera, tetto J a z=32) -->
        <all in="B y" out="y Y" steps="1"/>
        <all in="B y" out="y B" steps="31"/>
        <prl in="y" out="J"/>

        <!-- Pozzo Q (bordo in pietra K e acqua M), recinto q (legno I) e tronchi alberi t -->
        <all in="B Q" out="Q K" steps="6"/>
        <prl in="Q" out="K"/>
        <all in="B M" out="M M" steps="3"/>
        <all in="B q" out="q I" steps="8"/>
        <prl in="q" out="I"/>
        <all in="B t" out="t I" steps="16"/>
        <prl in="t" out="L"/>

        <!-- C. Scala reale: porta interna nel tramezzo, parti incluse, tetti, finestre, camino -->
        <!-- Seme O della porta interna nel tramezzo tra sala e stanza (larga 11, alta 30) -->
        <one in="fWWWWWf/fWWWWWf/fWWWWWf/fWWWWWf/fWWWWWf" out="*******/*******/fOOOOOf/*******/*******" symmetry="()" steps="1"/>
        <all in="O/W" out="*/O" symmetry="()" steps="5"/>
        <all in="W/O" out="O/*" symmetry="()" steps="5"/>

        <pieces piece="125" margin="24">
          <import file="part-door"/>
          <import file="part-stair"/>

          <!-- Grondaie e tetti a padiglione (casa R e stalla/portico/tettoia J) -->
          <all in="RB" out="*R" steps="1"/>
          <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="18" symmetry="()"/>
          <all in="JB" out="*J" steps="1"/>
          <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>

          <!-- Chioma degli alberi -->
          <all in="LB" out="*L" steps="6"/>
          <all in="B L" out="L *" steps="8"/>
        </pieces>

        <!-- Finestre su tutte le facciate della casa -->
        <import file="part-window"/>
        <prl in="U" out="W"/>

        <!-- Camino sul tetto della casa -->
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="12"/>
      </sequence>
    </map>
  </map>

  <!-- Palette e aree -->
  <color symbol="E" value="7b945c" hidden="True"/>
  <color symbol="H" value="ff00ff" hidden="True"/>
  <color symbol="W" value="e6dcc8" name="intonaco"/>
  <color symbol="V" value="b86b4b" name="mattoni stalla"/>
  <color symbol="f" value="c8a878" name="pavimento casa" area="house"/>
  <color symbol="F" value="bfa070" name="solaio" area="house"/>
  <color symbol="A" value="9e8c72" name="pavimento stalla" area="barn"/>
  <color symbol="C" value="b59b78" name="portico" area="porch"/>
  <color symbol="Y" value="a69274" name="tettoia" area="shed"/>
  <color symbol="R" value="b54834" name="tetto casa"/>
  <color symbol="J" value="8c4a32" name="tetto stalla"/>
  <color symbol="I" value="6e4726" name="legno"/>
  <color symbol="L" value="4f7a3e" name="chioma"/>
  <color symbol="K" value="8c8c84" name="pietra"/>
  <color symbol="M" value="4a86a8" name="acqua"/>
  <color symbol="O" value="7a4b2a" name="porta"/>
  <color symbol="o" value="523018" name="assi porta"/>
  <color symbol="N" value="4a321f" name="infisso"/>
  <color symbol="G" value="99c4d6" name="vetro"/>
  <color symbol="k" value="9e7348" name="scala"/>
  <color symbol="c" value="c2b591" name="aia" area="yard"/>
  <color symbol="n" value="969186" name="selciato" area="yard"/>
  <color symbol="r" value="a89572" name="strada" area="road"/>
  <color symbol="g" value="88a660" name="pascolo" area="pasture"/>
  <color symbol="l" value="8c6d46" name="campo" area="field"/>
  <color symbol="u" value="6e5232" name="solco" area="field"/>
  <color symbol="h" value="c8a878" hidden="True"/>
  <color symbol="w" value="e6dcc8" hidden="True"/>
  <color symbol="j" value="d9ccb4" hidden="True"/>
  <color symbol="s" value="8c6239" hidden="True"/>
  <color symbol="d" value="6e4726" hidden="True"/>
  <color symbol="p" value="b59b78" hidden="True"/>
  <color symbol="P" value="5c3d22" hidden="True"/>
  <color symbol="a" value="a8895c" hidden="True"/>
  <color symbol="v" value="9e6b4f" hidden="True"/>
  <color symbol="y" value="c47a44" hidden="True"/>
  <color symbol="Q" value="5a7d8c" hidden="True"/>
  <color symbol="q" value="735234" hidden="True"/>
  <color symbol="t" value="4a6e3a" hidden="True"/>
  <color symbol="m" value="ffaa00" hidden="True"/>
  <color symbol="T" value="ff00aa" hidden="True"/>
  <color symbol="U" value="00aaff" hidden="True"/>
  <color symbol="#20" value="7a4b2a" hidden="True"/>
  <color symbol="#21" value="523018" hidden="True"/>
  <color symbol="#90" value="ff00ff" hidden="True"/>
  <color symbol="#91" value="ff00ff" hidden="True"/>
  <color symbol="#92" value="ff00ff" hidden="True"/>

  <action name="open" label="Apri la porta">
    <all><rule in="O" out="#20"/><rule in="o" out="#21"/></all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all><rule in="#20" out="O"/><rule in="#21" out="o"/></all>
  </action>
</sequence>
```

