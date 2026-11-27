# model.sculpt · gemini-4-neon · 87 s

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

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
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
```

