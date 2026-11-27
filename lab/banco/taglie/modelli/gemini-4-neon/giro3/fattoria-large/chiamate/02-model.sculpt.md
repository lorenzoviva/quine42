# model.sculpt · gemini-4-neon · 98 s

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
Fattoria (casa colonica con portico, stalla/fienile, aia recintata, pozzo, campi e alberi)
Parti e lettere del piano (1 cella = 5x5 voxel):
- h: sala principale (piano terra), k: seconda stanza, j: muro interno divisorio, w: muri esterni della casa, s: vano scala lungo il muro di fondo
- d: porta d'ingresso sul fronte, p: portico antistante, b: pilastri del portico, r: strada verso il bordo anteriore
- a: interno della stalla/fienile laterale, v: muri della stalla
- c: aia intorno agli edifici, f: recinzione dell'aia, q: pozzo nell'aia, l: campi coltivati oltre la recinzione, t: alberi sul terreno libero
- E: suolo, H: origine (pulita in h), m: marcatore temporaneo per l'asse della porta (pulito in h)
Variazione tra i semi: lato del muro interno (stanza a sinistra o a destra), lato e profondità della stalla/fienile, posizione del pozzo e degli alberi.
Adattamento alle dimensioni:
- Large (20x20): casa colonica a due piani con due stanze, scala, portico con pilastri e strada fino al bordo.
- Huge (30x30) e Gargantuan (100x100): si aggiungono la stalla laterale, l'aia recintata, il pozzo, i campi coltivati e gli alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhkwjsdmpbravcfqlt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa: 15x13 celle interne (75x65 voxel), spostato leggermente indietro per il portico -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="7"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Porta d'ingresso sul fronte, centrata sull'asse di H, larga 3 celle (15 voxel) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Portico anteriore profondo 2 celle e largo 5, con pilastri agli angoli anteriori, e strada dritta al bordo -->
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <all in="pE/EE" out="b*/**" symmetry="(x)" steps="1"/>
      <all in="p/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Muro interno divisorio: stanza k larga 6 celle (30 voxel) e sala h larga 8 celle (40 voxel) -->
      <one in="whhhhhhh" out="*******j" symmetry="(x)" steps="1"/>
      <all in="h/j" out="j/*" symmetry="()"/>
      <all in="j/h" out="*/j" symmetry="()"/>
      <one in="whhhhhhj" out="*k******" symmetry="(x)" steps="1"/>
      <all in="kh" out="*k"/>

      <!-- Vano scala nella sala lungo il muro di fondo: 2 celle di pianerottolo, 4 di scala, 2 di sbarco -->
      <one in="wwwwwwww/hhhhhhhh/hhhhhhhh" out="********/hhsssshh/hhsssshh" symmetry="()" steps="1"/>

      <!-- Stalla/fienile laterale su un lato casuale, solo dove c'è spazio (Huge e Gargantuan) -->
      <one in="EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw" out="*******/*******/**aaaa*/*******/*******" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <prl in="a/E" out="*/a" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia intorno agli edifici dove il terreno prosegue, poi recinzione -->
      <all in="[wvpb]EEE" out="*c**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEE" out="*cc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*f"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- Pozzo nell'aia dove entra un quadrato 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Campi coltivati oltre la recinzione e alberi sul terreno libero -->
      <all in="fEEEEE" out="*lll**" steps="1"/>
      <all in="lE/*l" out="*l/**"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>

  <color symbol="B" value="000000" hidden="True" name="aria"/>
  <color symbol="E" value="6E8B4E" hidden="True" name="suolo"/>
  <color symbol="H" value="D4A76A" name="origine"/>
  <color symbol="m" value="D4A76A" name="asse"/>
  <color symbol="h" value="C9A87C" area="house" name="sala"/>
  <color symbol="k" value="B8956A" area="house" name="stanza"/>
  <color symbol="w" value="D8CEBE" name="muro della casa"/>
  <color symbol="j" value="BFB39F" name="muro interno"/>
  <color symbol="s" value="8C6239" area="house" name="scala"/>
  <color symbol="d" value="6B4226" name="porta"/>
  <color symbol="p" value="A89882" area="porch" name="portico"/>
  <color symbol="b" value="5C3A21" name="pilastro"/>
  <color symbol="r" value="9E9484" name="strada"/>
  <color symbol="a" value="A68A5B" area="barn" name="stalla"/>
  <color symbol="v" value="8F5B3C" name="muro della stalla"/>
  <color symbol="c" value="C2B280" area="yard" name="aia"/>
  <color symbol="f" value="7A5438" name="recinzione"/>
  <color symbol="q" value="4F7D9E" name="pozzo"/>
  <color symbol="l" value="7B6B3E" area="field" name="campo"/>
  <color symbol="t" value="3E6B3A" name="albero"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E suolo, h sala, k stanza, w muro della casa, j muro interno, s scala, d porta, p portico, b pilastro, r strada, c aia, f recinzione, l campo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEwwwwwwwwwwwwwwwwwE
EEwhhsssshhjkkkkkkwE
EEwhhsssshhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
Elwhhhhhhhhjkkkkkkwl
Elwhhhhhhhhjkkkkkkwl
Elwwwwwwwdddwwwwwwwl
Efccccccpppppccccccf
Efccccccbpppbccccccf
EfffffffErrrEfffffff
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E suolo, h sala, k stanza, w muro della casa, j muro interno, s scala, d porta, p portico, b pilastro, r strada, c aia, f recinzione, l campo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEwwwwwwwwwwwwwwwwwE
EEwkkkkkkjhhsssshhwE
EEwkkkkkkjhhsssshhwE
EEwkkkkkkjhhhhhhhhwE
EEwkkkkkkjhhhhhhhhwE
EEwkkkkkkjhhhhhhhhwE
EEwkkkkkkjhhhhhhhhwE
EEwkkkkkkjhhhhhhhhwE
EEwkkkkkkjhhhhhhhhwE
EEwkkkkkkjhhhhhhhhwE
EEwkkkkkkjhhhhhhhhwE
EEwkkkkkkjhhhhhhhhwE
Elwkkkkkkjhhhhhhhhwl
Elwkkkkkkjhhhhhhhhwl
Elwwwwwwwdddwwwwwwwl
Efccccccpppppccccccf
Efccccccbpppbccccccf
EfffffffErrrEfffffff
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E suolo, h sala, k stanza, w muro della casa, j muro interno, s scala, d porta, p portico, b pilastro, r strada, c aia, f recinzione, l campo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEE
EEwwwwwwwwwwwwwwwwwE
EEwhhsssshhjkkkkkkwE
EEwhhsssshhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
EEwhhhhhhhhjkkkkkkwE
Elwhhhhhhhhjkkkkkkwl
Elwhhhhhhhhjkkkkkkwl
Elwwwwwwwdddwwwwwwwl
Efccccccpppppccccccf
Efccccccbpppbccccccf
EfffffffErrrEfffffff
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E suolo, h sala, k stanza, w muro della casa, j muro interno, s scala, d porta, p portico, b pilastro, r strada, a stalla, v muro della stalla, c aia, f recinzione, q pozzo, l campo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EfffffffffffffffffffffffffffEE
EfcccccccccccccccccccccccccfEE
EfcccccccccccccccccccccccccfEE
EfcccccccccccccccccccccccccfEE
EfcccccwwwwwwwwwwwwwwwwwcccfEE
ElvvvvvwkkkkkkjhhsssshhwcccfEE
ElvaaaawkkkkkkjhhsssshhwcccfEE
ElvaaaawkkkkkkjhhhhhhhhwcccfEE
EEvaaaawkkkkkkjhhhhhhhhwcccfEE
EEvaaaawkkkkkkjhhhhhhhhwcccfEE
EEvaaaawkkkkkkjhhhhhhhhwcccfEE
EEvaaaawkkkkkkjhhhhhhhhwcccfEE
ElvaaaawkkkkkkjhhhhhhhhwcccfEE
ElvaaavwkkkkkkjhhhhhhhhwcccfEE
ElvvvvvwkkkkkkjhhhhhhhhwcccfEE
EfcccccwkkkkkkjhhhhhhhhwcccfEE
EfcccccwkkkkkkjhhhhhhhhwcccfEE
EfcccccwkkkkkkjhhhhhhhhwcccfEE
EfcccccwwwwwwwdddwwwwwwwcccfEE
EfcccccccccccpppppcccccccccfEE
EfcccccccccccbpppbcccccccccfEE
EfccqcccccccccrrrccccccccccfEE
EfccccccccccccrrrccccccccccfEE
EfccccccccccccrrrccccccccccfEE
EfffffffffffffrrrfffffffffffEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.31 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
Fattoria (casa colonica a due piani con portico, stalla/fienile, aia recintata, pozzo, campi e alberi)
Parti e lettere del piano (1 cella = 5x5 voxel):
- h: sala principale (piano terra), k: seconda stanza sul retro, j: muro interno divisorio orizzontale, w: muri esterni della casa, s: vano scala nella sala
- d: porta d'ingresso sul fronte, p: portico antistante, b: pilastri del portico, r: strada verso il bordo anteriore
- a: interno della stalla/fienile laterale, v: muri della stalla
- c: aia intorno agli edifici, f: recinzione dell'aia, q: pozzo nell'aia, l: campi coltivati oltre la recinzione, t: alberi sul terreno libero
- E: suolo, H: origine (pulita in h), m: marcatore temporaneo per l'asse della porta (pulito in h)
Variazione tra i semi: lato del vano scala, posizione della porta interna, lato e profondità della stalla/fienile, posizione del pozzo e degli alberi.
Adattamento alle dimensioni:
- Large (20x20): casa colonica a due piani con due stanze, scala, portico con pilastri, aia anteriore e strada fino al bordo.
- Huge (30x30) e Gargantuan (100x100): si aggiungono la stalla laterale, l'aia recintata intorno agli edifici, il pozzo, i campi coltivati e gli alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhkwjsdmpbravcfqlt" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa: 15x13 celle interne (75x65 voxel) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="7"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Porta d'ingresso sul fronte, centrata sull'asse di H, larga 3 celle (15 voxel) -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- Portico anteriore profondo 2 celle e largo 5, con pilastri agli angoli anteriori, e strada dritta al bordo -->
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="1"/>
      <all in="pE/EE" out="b*/**" symmetry="(x)" steps="1"/>
      <all in="p/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>

      <!-- Muro interno divisorio orizzontale: sala anteriore h (75x30 voxel) e stanza posteriore k (75x30 voxel) -->
      <one in="w/h/h/h/h/h/h/h" out="*/*/*/*/*/*/*/j" symmetry="()" steps="1"/>
      <all in="jh" out="*j" symmetry="(x)"/>
      <one in="w/h/h/h/h/h/h/j" out="*/k/*/*/*/*/*/*" symmetry="()" steps="1"/>
      <all in="kh" out="*k"/>

      <!-- Vano scala nella sala lungo il muro interno: 2 celle di pianerottolo, 4 di scala, 2 di sbarco -->
      <one in="jjjjjjjj/hhhhhhhh/hhhhhhhh" out="********/hhsssshh/hhsssshh" symmetry="()" steps="1"/>

      <!-- Stalla/fienile laterale su un lato casuale, solo dove c'è spazio (Huge e Gargantuan) -->
      <one in="EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw/EEEEEEw" out="*******/*******/**aaaa*/*******/*******" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="3"/>
      <all in="a/E" out="*/a" symmetry="()" steps="3"/>
      <prl in="a/E" out="*/a" p="0.5" steps="1" symmetry="()"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia intorno agli edifici dove il terreno prosegue, poi recinzione -->
      <all in="[wvpb]EEE" out="*c**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEE" out="*cc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*f"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- Pozzo nell'aia dove entra un quadrato 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Campi coltivati oltre la recinzione (solo dove c'è spazio aperto) e alberi sul terreno libero -->
      <all in="fEEEEE" out="*lll**" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>

    <map scale="5 5 1" values="BEhwjdspbavrcQuZlXtWVfFPJRLKTkOoNUG#90#91#92#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="k" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="j" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>
      <rule in="b" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="f" out="ccccc/cZZZc/cZZZc/cZZZc/ccccc"/>
      <rule in="q" out="QQQQQ/QuuuQ/QuuuQ/QuuuQ/QQQQQ"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="t" out="EEEEE/EEtEE/EtXtE/EEtEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="WV"/>
        <union symbol="=" values="fF"/>

        <!-- B. Altezze: muri esterni della casa (2 piani da 32, con fasce finestre U) -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- Porta d'ingresso: seme O a z=0, muro W sopra, fascia finestre al secondo piano -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d W" steps="31"/>
        <all in="B d" out="d W" steps="6"/>
        <all in="B d" out="d U" steps="14"/>
        <all in="B d" out="d W" steps="12"/>
        <prl in="d" out="R"/>

        <!-- Muro interno divisorio: alto 1 piano, poi solaio F -->
        <all in="B j" out="j W" steps="32"/>
        <prl in="j" out="F"/>

        <!-- Pavimenti, striscia scala T, solaio F e soffitto/tetto R della casa -->
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

        <!-- Portico anteriore: pavimento P, pilastri X alti 33, tetto J a z=33 -->
        <all in="B p" out="p P" steps="1"/>
        <all in="B p" out="p B" steps="32"/>
        <prl in="p" out="J"/>
        <all in="B b" out="b X" steps="33"/>
        <prl in="b" out="J"/>

        <!-- Stalla/fienile laterale: alta 36 con fascia finestre e tetto J -->
        <all in="B v" out="v V" steps="10"/>
        <all in="B v" out="v U" steps="12"/>
        <all in="B v" out="v V" steps="14"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="35"/>
        <prl in="a" out="J"/>

        <!-- Recinzione, pozzo e alberi -->
        <all in="B Z" out="Z X" steps="9"/>
        <prl in="Z" out="X"/>
        <all in="B Q" out="Q P" steps="8"/>
        <prl in="Q" out="P"/>
        <all in="B u" out="u u" steps="4"/>
        <all in="B t" out="t X" steps="16"/>
        <prl in="t" out="L"/>
        <all in="LB" out="*L" steps="4"/>
        <all in="B L" out="L *" steps="4"/>

        <!-- C. Scala piena: porta interna tra le due stanze al piano terra -->
        <one in="f/W/W/W/W/W/f" out="*/O/O/O/O/O/*" symmetry="()" steps="1"/>
        <all in="OW" out="*O" symmetry="(x)" steps="5"/>

        <!-- Parti incluse: porte, scala, finestre -->
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-window"/>
        <prl in="U" out="W"/>

        <!-- Tetti a padiglione con grondaia e camino -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="10" symmetry="()"/>
        <all in="JB" out="*J" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="5" symmetry="()"/>
        <one in="B B R" out="* K *" steps="1" symmetry="()"/>
        <all in="B K" out="K *" steps="6"/>
      </sequence>
    </map>
  </map>

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

  <color symbol="B" value="000000" hidden="True" name="aria"/>
  <color symbol="E" value="6E8B4E" hidden="True" name="suolo"/>
  <color symbol="H" value="D4A76A" name="origine"/>
  <color symbol="m" value="D4A76A" name="asse"/>
  <color symbol="h" value="C9A87C" area="house" name="sala"/>
  <color symbol="w" value="E8DFD1" name="muro della casa"/>
  <color symbol="j" value="D8CEBE" name="muro interno"/>
  <color symbol="s" value="8C6239" area="house" name="scala"/>
  <color symbol="d" value="6B4226" name="porta"/>
  <color symbol="p" value="A89882" area="porch" name="portico"/>
  <color symbol="b" value="5C3A21" name="pilastro"/>
  <color symbol="r" value="A39B8B" area="road" name="strada"/>
  <color symbol="a" value="A68A5B" area="barn" name="stalla"/>
  <color symbol="v" value="9E5A40" name="muro della stalla"/>
  <color symbol="c" value="C7B889" area="yard" name="aia"/>
  <color symbol="q" value="4F86A8" name="pozzo"/>
  <color symbol="l" value="7D6D42" area="field" name="campo"/>
  <color symbol="t" value="4A7A42" name="albero"/>

  <color symbol="W" value="E8DFD1" name="intonaco"/>
  <color symbol="V" value="9E5A40" name="muro della stalla"/>
  <color symbol="f" value="C9A87C" area="house" name="pavimento in legno"/>
  <color symbol="F" value="B8956A" name="solaio in legno"/>
  <color symbol="P" value="9E988E" area="porch" name="pietra"/>
  <color symbol="X" value="5C3A21" name="legno scuro"/>
  <color symbol="R" value="B84A39" name="tegole della casa"/>
  <color symbol="J" value="8F563B" name="tetto in legno e tegole"/>
  <color symbol="L" value="4A7A42" name="chioma"/>
  <color symbol="K" value="7D776E" name="camino"/>
  <color symbol="Q" value="9E988E" name="bordo del pozzo"/>
  <color symbol="u" value="4F86A8" name="acqua"/>
  <color symbol="Z" value="5C3A21" name="recinzione"/>

  <color symbol="T" value="8C6239" name="striscia scala"/>
  <color symbol="k" value="A67C52" name="gradino"/>
  <color symbol="O" value="7A4B2A" name="porta di legno"/>
  <color symbol="o" value="4A2C16" name="assi della porta"/>
  <color symbol="N" value="63412C" name="infisso"/>
  <color symbol="U" value="E8DFD1" name="fascia finestre"/>
  <color symbol="G" value="7FA8C9" name="vetro"/>
  <color symbol="#20" value="7A4B2A" hidden="True" name="porta aperta"/>
  <color symbol="#21" value="4A2C16" hidden="True" name="assi aperte"/>
  <color symbol="#90" value="000000" hidden="True" name="segno"/>
  <color symbol="#91" value="000000" hidden="True" name="segno"/>
  <color symbol="#92" value="000000" hidden="True" name="segno"/>
</sequence>

