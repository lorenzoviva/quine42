# model.sculpt · gemini-4-neon · 84 s

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

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

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

